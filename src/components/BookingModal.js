import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

// Razorpay SDK Script Loader
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function BookingModal({ onClose, mechanic, userCoords }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeBooking, setActiveBooking] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);

  // Form Data
  const [form, setForm] = useState({
    vehicleType: "",
    vehicleModel: "",
    problem: ""
  });

  const PRICING_MODEL = {
    "Engine Failure / Overheating": 350,
    "Flat Tire / Puncture": 150,
    "Dead Battery / Electrical": 200,
    "Out of Fuel": 300,
    "Accident / Need Towing": 800
  };

  const baseFare = PRICING_MODEL[form.problem] || 0;
  const platformTax = 20;
  const finalTotal = baseFare + platformTax;

  useEffect(() => {
    const fetchActiveBooking = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      setSessionUser(session.user);

      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', session.user.id)
        .in('status', ['pending', 'accepted'])
        .maybeSingle();

      if (data) setActiveBooking(data);
      setLoading(false);
    };
    
    fetchActiveBooking();
  }, []);

  const executeDatabaseBooking = async (paymentStatus) => {
    setProcessing(true);

    if (!sessionUser) {
      alert("You must be logged in to request help!");
      setProcessing(false);
      return;
    }
    if (!userCoords) {
      alert("We cannot locate you. Please enable location permissions.");
      setProcessing(false);
      return;
    }

    const { error } = await supabase.from('bookings').insert([{
      user_id: sessionUser.id,
      garage_id: mechanic.id,
      status: 'pending',
      total_price: finalTotal,
      payment_status: paymentStatus, // 'paid' via Razorpay, or 'unpaid' via COD
      vehicle_type: form.vehicleType,
      vehicle_model: form.vehicleModel,
      problem: form.problem,
      user_lat: userCoords.lat,
      user_lng: userCoords.lng
    }]);

    if (error) {
      alert("Booking failed: " + error.message);
    } else {
      onClose(); // Instantly trigger Home's live tracker
    }
    setProcessing(false);
  };

  const handleRazorpayDigital = async () => {
    setProcessing(true);
    const res = await loadRazorpayScript();

    if (!res) {
      alert("Payment gateway failed to load. Are you offline?");
      setProcessing(false);
      return;
    }

    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY || "rzp_test_YOURKEYHERE", // Mock key
      amount: finalTotal * 100, // Razorpay requires paise format (e.g. 500 = 50000)
      currency: "INR",
      name: "Roadoc Emergency Dispatch",
      description: `Emergency Service: ${form.problem}`,
      image: "https://your-logo-url.com/logo.png", // Optional
      handler: function (response) {
        // Razorpay guarantees they've collected the payment if we reach here!
        executeDatabaseBooking('paid');
      },
      prefill: {
        email: sessionUser?.email || ""
      },
      theme: {
        color: "#EAB308" // Match Roadoc Yellow Dashboard color
      }
    };

    try {
      const paymentObject = new window.Razorpay(options);
      
      // If user explicitly closes the Razorpay window without paying
      paymentObject.on('payment.failed', function (response) {
         alert("Payment Failed: " + response.error.description);
         setProcessing(false);
      });

      paymentObject.open();
    } catch (error) {
      alert("Razorpay SDK Error: " + error.message + "\n\n(This usually happens because you are using a placeholder API key. You must generate a free Test Key from Razorpay to view the UI!)");
      setProcessing(false);
    }

    // The modal overlay logic will wait indefinitely for the success callback or close event
    // So we safely leave them on "Processing" state until then.
  };

  if (loading) return <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50"><div className="bg-white p-4 rounded-xl font-bold">Loading secure channels...</div></div>;
  if (activeBooking) return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4 text-center">
      <div className="bg-white w-[90%] max-w-sm p-6 rounded-2xl space-y-4 shadow-2xl">
        <h3 className="font-bold text-2xl text-red-600">🚨 Restricted Dispatch</h3>
        <p className="text-sm border-l-4 border-red-500 pl-3">You already have an active service call in progress. Please wait for the current mechanic to arrive and resolve your emergency before requesting another dispatch.</p>
        <button onClick={onClose} className="w-full bg-gray-200 hover:bg-gray-300 transition p-3 rounded-xl font-bold">Return to Map</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex flex-col justify-end md:items-center md:justify-center z-[60] animate-in fade-in transition-all">
      <div className="bg-white w-full md:w-[90%] md:max-w-md p-6 rounded-t-3xl md:rounded-2xl space-y-4 shadow-2xl pb-10">
        
        {/* WIZARD HEADER */}
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h3 className="font-black text-xl text-gray-800">Dispatch {mechanic.name}</h3>
            <p className="text-xs text-gray-500 font-medium tracking-widest uppercase">
              {step === 1 ? 'Step 1: Diagnostics' : step === 2 ? 'Step 2: Location Lock' : 'Step 3: Secure Checkout'}
            </p>
          </div>
          <button disabled={processing} onClick={onClose} className="bg-gray-100 text-gray-500 w-8 h-8 rounded-full flex items-center justify-center font-bold hover:bg-gray-200">✕</button>
        </div>

        {/* STEP 1: DIAGNOSTICS */}
        {step === 1 && (
          <div className="space-y-4 mt-2 animate-in slide-in-from-right-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Vehicle Blueprint</label>
              <div className="flex gap-2">
                 <button onClick={() => setForm({...form, vehicleType: 'Car'})} className={`flex-1 py-3 border-2 rounded-xl font-bold transition ${form.vehicleType === 'Car' ? 'border-yellow-400 bg-yellow-50 text-yellow-900' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}>🚗 Car</button>
                 <button onClick={() => setForm({...form, vehicleType: 'Bike'})} className={`flex-1 py-3 border-2 rounded-xl font-bold transition ${form.vehicleType === 'Bike' ? 'border-yellow-400 bg-yellow-50 text-yellow-900' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}>🏍️ Bike</button>
                 <button onClick={() => setForm({...form, vehicleType: 'Commercial'})} className={`flex-1 py-3 border-2 rounded-xl font-bold transition ${form.vehicleType === 'Commercial' ? 'border-yellow-400 bg-yellow-50 text-yellow-900' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}>🚚 Truck</button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Vehicle Model/Brand</label>
              <input 
                type="text" 
                placeholder="e.g. Honda Civic 2018"
                value={form.vehicleModel}
                onChange={(e) => setForm({...form, vehicleModel: e.target.value})}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-yellow-400 outline-none transition font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Primary Malfunction</label>
              <select
                value={form.problem}
                onChange={(e) => setForm({...form, problem: e.target.value})}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-yellow-400 outline-none transition font-bold text-gray-700"
              >
                <option value="">Select Incident Cause...</option>
                <option>Engine Failure / Overheating</option>
                <option>Flat Tire / Puncture</option>
                <option>Dead Battery / Electrical</option>
                <option>Out of Fuel</option>
                <option>Accident / Need Towing</option>
              </select>
            </div>

            <button 
              disabled={!form.vehicleType || !form.problem}
              onClick={() => setStep(2)}
              className="w-full mt-4 bg-gray-900 text-white font-bold py-4 rounded-xl disabled:opacity-50 transition"
            >
              Continue to Location ➡️
            </button>
          </div>
        )}

        {/* STEP 2: LOCATION CONFIRMATION */}
        {step === 2 && (
          <div className="space-y-4 mt-2 animate-in slide-in-from-right-4">
             <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-start gap-3 text-yellow-800">
               <span className="text-xl">📍</span>
               <div>
                  <p className="font-bold text-sm">GPS Intercept Locked</p>
                  <p className="text-xs mt-1">We have established a direct uplink to your mobile GPS structure. The mechanic will be dispatched exactly to these coordinates.</p>
                  <div className="bg-white mt-3 p-2 rounded border border-yellow-100 text-center font-mono text-xs shadow-inner">
                     LAT: {userCoords?.lat.toFixed(6) || 0} <br/> LNG: {userCoords?.lng.toFixed(6) || 0}
                  </div>
               </div>
             </div>
             <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="flex-1 bg-gray-100 hover:bg-gray-200 transition py-4 rounded-xl font-bold text-gray-600">Back</button>
                <button onClick={() => setStep(3)} className="flex-[2] bg-gray-900 text-yellow-400 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition">Confirm Data</button>
             </div>
          </div>
        )}

        {/* STEP 3: DYNAMIC PAYMENTS & RAZORPAY */}
        {step === 3 && (
          <div className="space-y-4 mt-2 animate-in slide-in-from-right-4">
             
             <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400"></div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Invoice Summary</p>
                <div className="flex justify-between text-sm mb-2 text-gray-600 font-medium"><p>{form.problem} Base Rate</p> <p>₹{baseFare.toFixed(2)}</p></div>
                <div className="flex justify-between text-sm mb-2 text-gray-600 font-medium"><p>Platform Fee & GPS Tracking</p> <p>₹{platformTax.toFixed(2)}</p></div>
                <div className="w-full h-[1px] bg-gray-300 my-4"></div>
                <div className="flex justify-between font-black text-2xl text-gray-900"><p>Total</p> <p>₹{finalTotal.toFixed(2)}</p></div>
             </div>

             <div className="grid grid-cols-1 gap-3 mt-6">
                <button 
                  onClick={handleRazorpayDigital}
                  disabled={processing}
                  className={`w-full text-white font-bold py-4 rounded-xl text-lg flex items-center justify-center transition shadow-lg ${processing ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {processing ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                      Connecting to Bank API...
                    </span>
                  ) : (
                    "Fast Digital Pay (Razorpay)"
                  )}
                </button>
                
                <button 
                  onClick={() => executeDatabaseBooking('unpaid')}
                  disabled={processing}
                  className="w-full bg-white border-2 border-gray-200 text-gray-700 font-bold py-4 rounded-xl text-md hover:bg-gray-50 hover:border-gray-300 transition"
                >
                  Pay Cash / UPI on Arrival (COD)
                </button>
             </div>

             <button disabled={processing} onClick={() => setStep(2)} className="w-full text-sm font-bold text-gray-400 hover:text-gray-600 mt-2">← Wait, go back</button>
          </div>
        )}

      </div>
    </div>
  );
}
