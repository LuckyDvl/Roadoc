import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function MechanicDashboard({ session }) {
  const [garage, setGarage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [completedJobs, setCompletedJobs] = useState([]);
  const [activeTab, setActiveTab] = useState("dispatch");

  // Edit Storefront State
  const [editForm, setEditForm] = useState({ name: "", description: "", phone: "", owner_name: "" });
  const [imageFile, setImageFile] = useState(null);
  const [dpFile, setDpFile] = useState(null);
  const [updateStatus, setUpdateStatus] = useState("");

  const handleLogout = async () => {
    supabase.auth.signOut().catch(e => console.error(e));
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace('/login');
  };

  const fetchBookings = async (garageId) => {
    const { data } = await supabase
      .from('bookings')
      .select('*, profiles(email)')
      .eq('garage_id', garageId)
      .order('created_at', { ascending: false });

    if (data) {
      setPendingRequests(data.filter(b => b.status === 'pending'));
      setActiveJobs(data.filter(b => b.status === 'accepted'));
      setCompletedJobs(data.filter(b => b.status === 'completed' || b.status === 'paid'));
    }
  };

  useEffect(() => {
    let channel;
    const fetchMyGarage = async () => {
      if (!session?.user?.id) return;
      const { data, error } = await supabase
        .from('garages')
        .select('*')
        .eq('owner_id', session.user.id)
        .single();
        
      if (!error && data) {
        setGarage(data);
        setEditForm({ name: data.name, description: data.description || "", phone: data.phone || "", owner_name: data.owner_name || "" });
        fetchBookings(data.id);

        channel = supabase.channel('bookings_channel')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `garage_id=eq.${data.id}` }, () => {
            fetchBookings(data.id);
          }).subscribe();
      }
      setLoading(false);
    };

    fetchMyGarage();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [session]);

  const handleAccept = async (bookingId) => {
    await supabase.from('bookings').update({ status: 'accepted' }).eq('id', bookingId);
    fetchBookings(garage.id); 
  };

  const handleComplete = async (bookingId) => {
    await supabase.from('bookings').update({ status: 'completed' }).eq('id', bookingId);
    fetchBookings(garage.id);
  };

  const markAsPaid = async (bookingId) => {
    await supabase.from('bookings').update({ status: 'paid', payment_status: 'paid' }).eq('id', bookingId);
    fetchBookings(garage.id);
  };

  const handleStorefrontSubmit = async (e) => {
    e.preventDefault();
    setUpdateStatus("Uploading and sending to Admin for Review...");

    let uploadedUrl = garage.image_url;

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${garage.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('garage_media')
        .upload(filePath, imageFile);

      if (uploadError) {
        setUpdateStatus("Error uploading image: " + uploadError.message);
        return;
      }
      
      const { data } = supabase.storage.from('garage_media').getPublicUrl(filePath);
      uploadedUrl = data.publicUrl;
    }

    let uploadedDpUrl = garage.owner_dp_url;
    if (dpFile) {
      const fileExt = dpFile.name.split('.').pop();
      const fileName = `dp_${Math.random()}.${fileExt}`;
      const filePath = `${garage.id}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('garage_media').upload(filePath, dpFile);
      if (!uploadError) {
        const { data } = supabase.storage.from('garage_media').getPublicUrl(filePath);
        uploadedDpUrl = data.publicUrl;
      }
    }

    const { error } = await supabase.from('garage_updates').insert([{
      garage_id: garage.id,
      new_name: editForm.name,
      new_description: editForm.description,
      new_phone: editForm.phone,
      new_image_url: uploadedUrl,
      new_owner_name: editForm.owner_name,
      new_owner_dp_url: uploadedDpUrl,
      status: 'pending'
    }]);

    if (error) {
      setUpdateStatus("Error sending request: " + error.message);
    } else {
      setUpdateStatus("Success! The Admin will review your changes shortly.");
      setImageFile(null); // Clear file input
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-500 font-bold">Initializing Platform...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-6">
      
      {/* HEADER */}
      <div className="bg-white p-6 rounded-t-2xl shadow border-b border-gray-100 w-full max-w-5xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-yellow-400 w-12 h-12 flex items-center justify-center rounded-xl font-black text-2xl text-yellow-900 shadow-sm">
            R
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Roadoc Business</h1>
            <p className="text-gray-500 text-sm font-medium">{garage ? garage.name : "Unassigned License"}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg font-bold border border-green-200 shadow-sm flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online
          </div>
          <button onClick={handleLogout} className="bg-white border text-gray-600 px-4 py-2 rounded-lg font-bold hover:bg-gray-50 focus:ring-2 focus:ring-yellow-400 transition shadow-sm">
            Sign Out
          </button>
        </div>
      </div>

      {/* TABS MENU */}
      <div className="bg-white flex px-6 shadow border-b border-gray-100 max-w-5xl mx-auto w-full gap-2">
        <button onClick={() => setActiveTab("dispatch")} className={`py-4 px-4 font-bold border-b-[3px] transition ${activeTab === "dispatch" ? "border-yellow-400 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-t-lg"}`}>🚨 Live Dispatch Hub</button>
        <button onClick={() => setActiveTab("storefront")} className={`py-4 px-4 font-bold border-b-[3px] transition ${activeTab === "storefront" ? "border-yellow-400 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-t-lg"}`}>⚙️ Garage Profile Editor</button>
        <button onClick={() => setActiveTab("finances")} className={`py-4 px-4 font-bold border-b-[3px] transition ${activeTab === "finances" ? "border-yellow-400 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-t-lg"}`}>💰 Finances & Reports</button>
      </div>

      {/* DASHBOARD CONTENT BODY */}
      <div className="max-w-5xl w-full mx-auto mt-6 transition-all">

        {!garage && (
          <div className="bg-yellow-50 text-yellow-800 p-8 rounded-2xl shadow-sm border border-yellow-200 flex flex-col items-center">
            <h2 className="text-2xl font-black mb-2">No Garage Linked!</h2>
            <p className="text-center font-medium opacity-80">You have been granted a Mechanic License, but haven't been assigned a GPS location.<br/>Please contact Roadoc Support so they can pin your shop on the map.</p>
          </div>
        )}

        {/* TAB 1: LIVE DISPATCH */}
        {garage && activeTab === "dispatch" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-2 fade-in">
            {/* PENDING */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
              <div className="bg-red-50 text-red-700 p-5 font-bold flex justify-between items-center border-b border-red-100">
                <span className="flex items-center gap-2">🚨 Incoming SOS Dispatch</span>
                <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm shadow-sm">{pendingRequests.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto bg-gray-50 p-5 space-y-4">
                {pendingRequests.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 font-medium tracking-wide">
                    <div className="w-16 h-16 border-4 border-gray-200 border-t-red-400 rounded-full animate-spin mb-4"></div>
                    Radar Clear. Waiting for Emergencies.
                  </div>
                ) : (
                  pendingRequests.map(req => (
                    <div key={req.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 border-l-[6px] border-l-red-500 hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-bold text-gray-800">SOS Signal Received</p>
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-md font-bold">₹{req.total_price} DUTY</span>
                      </div>
                      <p className="text-sm text-gray-500 mb-2 font-medium px-2 py-1 bg-gray-50 rounded-lg inline-block break-all">Client DB: {req.profiles?.email}</p>
                      
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mb-4 space-y-2 text-sm">
                         <div className="flex justify-between items-center"><span className="font-bold text-gray-600">Vehicle Class:</span> <span className="font-bold text-gray-800">{req.vehicle_type || 'Unknown'}</span></div>
                         <div className="flex justify-between items-center"><span className="font-bold text-gray-600">Model Data:</span> <span>{req.vehicle_model || 'Not Provided'}</span></div>
                         <div className="flex justify-between items-center"><span className="font-bold text-gray-600">Incident Code:</span> <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-md font-bold text-xs">{req.problem || 'Unknown Distress Signal'}</span></div>
                      </div>

                      <button 
                        onClick={() => handleAccept(req.id)}
                        className="w-full bg-red-600 text-white font-bold p-3 rounded-xl hover:bg-red-700 active:scale-95 transition shadow-sm"
                      >
                        Accept & Dispatch Unit
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ACTIVE */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
              <div className="bg-blue-50 text-blue-800 p-5 font-bold flex justify-between items-center border-b border-blue-100">
                <span className="flex items-center gap-2">🔧 Active Service Calls</span>
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm shadow-sm">{activeJobs.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto bg-gray-50 p-5 space-y-4">
                {activeJobs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400 font-medium tracking-wide">
                    No mechanics actively dispatched.
                  </div>
                ) : (
                  activeJobs.map(job => (
                    <div key={job.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 border-l-[6px] border-l-blue-500">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-bold text-gray-800">Assisting User...</p>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md font-bold">{new Date().toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm text-gray-500 mb-4 font-medium break-all">{job.profiles?.email}</p>
                      
                      <div className="flex flex-col gap-2">
                        <div className="bg-yellow-50 text-yellow-800 p-3 rounded-xl border border-yellow-200 text-sm mb-2 font-medium">
                          Instructions: Please collect exactly <strong>₹{job.total_price}</strong> from the client for this dispatch call.
                        </div>
                        <button 
                          onClick={() => handleComplete(job.id)}
                          className="w-full bg-blue-600 text-white font-bold text-sm p-3 rounded-xl hover:bg-blue-700 transition shadow-sm"
                        >
                          Mark Job as Completed
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STOREFRONT EDITOR */}
        {garage && activeTab === "storefront" && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-2xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black text-gray-800 mb-2">Edit Public Storefront</h2>
            <p className="text-gray-500 text-sm mb-6 font-medium">Any changes made here must be reviewed and verified by a Roadoc Administration team member before they go live on the public map.</p>
            
            <form onSubmit={handleStorefrontSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Garage Name</label>
                  <input 
                    type="text" 
                    value={editForm.name}
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-yellow-400 focus:outline-none transition shadow-inner font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Owner Identity Name</label>
                  <input 
                    type="text" 
                    value={editForm.owner_name}
                    onChange={e => setEditForm({...editForm, owner_name: e.target.value})}
                    placeholder="E.g. Rahul Sharma"
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-yellow-400 focus:outline-none transition shadow-inner font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Dispatch Phone Number</label>
                <input 
                  type="tel" 
                  value={editForm.phone}
                  onChange={e => setEditForm({...editForm, phone: e.target.value})}
                  placeholder="+91 9999999999"
                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-yellow-400 focus:outline-none transition shadow-inner font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Public Description / Services</label>
                <textarea 
                  value={editForm.description}
                  onChange={e => setEditForm({...editForm, description: e.target.value})}
                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-yellow-400 focus:outline-none transition shadow-inner min-h-[100px] font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Upload Display Image (from Computer/Phone)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:bg-gray-50 transition cursor-pointer relative overflow-hidden">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={e => setImageFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {imageFile ? (
                    <p className="font-bold text-green-600">Selected: {imageFile.name}</p>
                  ) : (
                    <div>
                      <p className="text-gray-600 font-bold mb-1">Click to browse or drag and drop</p>
                      <p className="text-xs text-gray-400 font-medium">JPG, PNG, GIF up to 5MB</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Owner Display Picture (Profile Avatar)</label>
                <div className="border border-gray-200 rounded-2xl p-4 flex items-center gap-4 hover:bg-gray-50 transition cursor-pointer relative overflow-hidden bg-white shadow-sm">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={e => setDpFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl shadow-inner border border-gray-200">👤</div>
                  {dpFile ? (
                    <p className="font-bold text-green-600 text-sm">{dpFile.name}</p>
                  ) : (
                    <p className="text-gray-500 font-bold text-sm">Upload Avatar (Square JPG/PNG)</p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button type="submit" className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg hover:bg-black transition shadow-md active:scale-[0.98]">
                  Submit for Admin Review
                </button>
              </div>
              
              {updateStatus && (
                <div className={`p-4 rounded-xl text-center font-bold text-sm ${updateStatus.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                  {updateStatus}
                </div>
              )}
            </form>
          </div>
        )}

        {/* TAB 3: FINANCES */}
        {garage && activeTab === "finances" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
                <p className="text-gray-500 font-bold text-sm uppercase tracking-wider mb-2">Gross Service Revenue</p>
                <p className="text-4xl font-black text-green-600">₹{completedJobs.reduce((acc, obj) => acc + Number(obj.total_price || 0), 0)}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
                <p className="text-gray-500 font-bold text-sm uppercase tracking-wider mb-2">Total Historic Dispatches</p>
                <p className="text-4xl font-black text-gray-800">{completedJobs.length}</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 p-6 rounded-2xl shadow-md text-yellow-900 flex flex-col flex-1">
                <p className="font-bold text-sm uppercase tracking-wider mb-2 opacity-90">Rating Standing</p>
                <p className="text-4xl font-black">⭐ {garage.rating}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-black text-gray-800">Chronological Payout Ledger</h3>
                <p className="text-gray-500 text-sm font-medium">Any jobs marked as 'Completed' appear here. Mark them as 'Sent to Bank' to cash out.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-600 text-sm">
                    <tr>
                      <th className="p-4 font-bold uppercase tracking-wide border-b">Date</th>
                      <th className="p-4 font-bold uppercase tracking-wide border-b">Client Account</th>
                      <th className="p-4 font-bold uppercase tracking-wide border-b">Fare</th>
                      <th className="p-4 font-bold uppercase tracking-wide border-b">Settlement</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-800 text-sm font-medium">
                    {completedJobs.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-gray-400 font-medium">No completed jobs yet. Complete a service call to generate revenue records.</td>
                      </tr>
                    ) : completedJobs.map(job => (
                      <tr key={job.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                        <td className="p-4">{new Date(job.created_at).toLocaleDateString()}</td>
                        <td className="p-4">{job.profiles?.email}</td>
                        <td className="p-4 font-bold text-gray-900">₹{job.total_price}</td>
                        <td className="p-4">
                          {job.status === 'paid' ? (
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">✅ Bank Settled</span>
                          ) : (
                            <button 
                              onClick={() => markAsPaid(job.id)}
                              className="bg-yellow-400 hover:bg-yellow-500 px-4 py-2 rounded-lg text-xs font-bold text-yellow-900 transition shadow-sm"
                            >
                              Payout to Bank
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
