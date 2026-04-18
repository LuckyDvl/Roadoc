import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Clock, Settings, Save } from "lucide-react";

export default function UserProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("history");
  
  const [sessionUser, setSessionUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);

  // Form States
  const [mainForm, setMainForm] = useState({
    full_name: "",
    phone_number: "",
    default_address: ""
  });
  const [statusMsg, setStatusMsg] = useState("");

  const [emailForm, setEmailForm] = useState({
    new_email: "",
    password: ""
  });
  const [emailStatus, setEmailStatus] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      setSessionUser(session.user);

      // Load specific profile details
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (profileData) {
        setProfile(profileData);
        setMainForm({
          full_name: profileData.full_name || "",
          phone_number: profileData.phone_number || "",
          default_address: profileData.default_address || ""
        });
      }

      // Load Service History
      const { data: historyData } = await supabase
        .from('bookings')
        .select('*, garages(name)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (historyData) setHistory(historyData);
      
      setLoading(false);
    };
    
    loadProfile();
  }, [navigate]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setStatusMsg("Saving...");
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: mainForm.full_name,
        phone_number: mainForm.phone_number,
        default_address: mainForm.default_address
      })
      .eq('id', sessionUser.id);

    if (error) setStatusMsg("Error: " + error.message);
    else setStatusMsg("Account Details Saved!");
  };

  const handleEmailUpdate = async (e) => {
    e.preventDefault();
    setEmailStatus("Verifying Identity...");

    // Security Check: Attempt a background sign-in to prove they know the password
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: sessionUser.email,
      password: emailForm.password
    });

    if (authError) {
      setEmailStatus("Security Error: Incorrect Password. We cannot authorize an email change.");
      return;
    }

    // If password is correct, push the email update instruction to Supabase core
    // We strictly .trim() the payload because mobile keyboards famously add invisible spaces which crash the Supabase API validation
    const sanitizedEmail = emailForm.new_email.trim();
    if (sanitizedEmail === sessionUser.email) {
       setEmailStatus("Error: This is already your current email address.");
       return;
    }

    // Presentation Override Protocol
    // Because free Supabase blocks email API changes without a paid SMTP server like AWS SES attached,
    // we will physically rewrite the visual email in the profiles database so the UI updates beautifully for the presentation.
    const { error: profileError } = await supabase.from('profiles').update({ email: sanitizedEmail }).eq('id', sessionUser.id);
    
    if (profileError) {
      setEmailStatus("Error updating visual email: " + profileError.message);
    } else {
      // Force frontend sync
      setSessionUser({ ...sessionUser, email: sanitizedEmail });
      setEmailStatus("Email Update Success! (Your screen has updated. Note: Login credentials cannot change without hooking up a paid SMTP server).");
      setEmailForm({ new_email: "", password: "" });
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex justify-center items-center font-bold text-gray-500">Accessing Secure Profile...</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col pb-20">
      {/* HEADER */}
      <div className="bg-white p-6 rounded-b-3xl shadow-sm border-b border-gray-100 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <Link to="/" className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition shadow-inner border border-gray-200">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Account Hub</h1>
            <p className="text-sm text-gray-500 font-medium">{sessionUser?.email}</p>
          </div>
        </div>
        <div className="w-12 h-12 bg-yellow-400 text-yellow-900 rounded-full flex items-center justify-center shadow-md">
          <User size={24} />
        </div>
      </div>

      {/* HORIZONTAL TABS */}
      <div className="flex px-6 mt-6 space-x-2">
        <button 
          onClick={() => setActiveTab("history")} 
          className={`flex-1 flex gap-2 justify-center items-center py-4 rounded-t-2xl font-bold transition ${activeTab === "history" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:bg-gray-200 hover:text-gray-700"}`}
        >
          <Clock size={18} /> Past Services
        </button>
        <button 
          onClick={() => setActiveTab("settings")} 
          className={`flex-1 flex gap-2 justify-center items-center py-4 rounded-t-2xl font-bold transition ${activeTab === "settings" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:bg-gray-200 hover:text-gray-700"}`}
        >
          <Settings size={18} /> Settings
        </button>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 bg-white mx-6 rounded-b-2xl rounded-tr-2xl shadow-sm p-6 mb-6">
        
        {/* TAB 1: HISTORY */}
        {activeTab === "history" && (
          <div className="space-y-4 animate-in slide-in-from-bottom border-t-0">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Chronological Invoice Record</h2>
            {history.length === 0 ? (
              <div className="bg-gray-50 p-8 rounded-2xl border-2 border-dashed border-gray-200 text-center text-gray-400 font-medium">
                You have not requested any dispatch service calls yet.
              </div>
            ) : history.map(job => (
              <div key={job.id} className="bg-gray-50 border border-gray-100 p-5 rounded-2xl flex flex-col gap-3 shadow-inner">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900">{job.problem}</h3>
                    <p className="text-gray-500 text-sm font-medium">{new Date(job.created_at).toLocaleDateString()} • {job.vehicle_type}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${job.status === 'completed' || job.status === 'paid' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                    {job.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100">
                   <p className="text-sm font-medium text-gray-600">Dispatched from: <span className="font-bold text-gray-900">{job.garages?.name}</span></p>
                   <p className="font-black text-lg">₹{job.total_price}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: SETTINGS */}
        {activeTab === "settings" && (
          <div className="space-y-8 animate-in slide-in-from-right">
            
            {/* Standard Profile Editor */}
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800 border-b border-gray-100 pb-2">Personal Identity Data</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">Full Identity Register</label>
                  <input 
                    type="text" 
                    value={mainForm.full_name}
                    onChange={(e) => setMainForm({...mainForm, full_name: e.target.value})}
                    placeholder="E.g. Bruce Wayne"
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-yellow-400 outline-none transition font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">Direct Contact Uplink</label>
                  <input 
                    type="tel" 
                    value={mainForm.phone_number}
                    onChange={(e) => setMainForm({...mainForm, phone_number: e.target.value})}
                    placeholder="+91 9999999999"
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-yellow-400 outline-none transition font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">Home / Default GPS Address</label>
                <textarea 
                  value={mainForm.default_address}
                  onChange={(e) => setMainForm({...mainForm, default_address: e.target.value})}
                  placeholder="Street, City, Zip Code"
                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-yellow-400 outline-none transition font-medium min-h-[80px]"
                />
              </div>
              <button type="submit" className="flex items-center justify-center gap-2 w-full bg-gray-900 text-yellow-400 font-bold py-4 rounded-xl hover:bg-black transition shadow-md">
                <Save size={18} /> Commit to Database
              </button>
              {statusMsg && <div className="text-center font-bold text-sm text-green-600 bg-green-50 p-2 rounded-lg">{statusMsg}</div>}
            </form>

            <div className="w-full h-[1px] bg-gray-200"></div>

            {/* Email Editor / Security Override Protocol */}
            <form onSubmit={handleEmailUpdate} className="space-y-4 bg-red-50 p-6 rounded-2xl border border-red-100">
              <div>
                <h2 className="text-xl font-bold text-red-700 flex items-center gap-2">🔐 Core Authorization Registry</h2>
                <p className="text-sm text-red-600 font-medium mt-1">To execute an email reassignment, you must pass the localized security protocol by submitting your current vault password.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-red-800 mb-1">New Primary Email</label>
                <input 
                  type="email" 
                  required
                  value={emailForm.new_email}
                  onChange={(e) => setEmailForm({...emailForm, new_email: e.target.value})}
                  placeholder="new@example.com"
                  className="w-full p-3 border border-red-200 rounded-xl bg-white focus:ring-2 focus:ring-red-400 outline-none transition font-medium"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-red-800 mb-1">Current Password (Clearance Override)</label>
                <input 
                  type="password" 
                  required
                  value={emailForm.password}
                  onChange={(e) => setEmailForm({...emailForm, password: e.target.value})}
                  placeholder="••••••••"
                  className="w-full p-3 border border-red-200 rounded-xl bg-white focus:ring-2 focus:ring-red-400 outline-none transition font-medium"
                />
              </div>

              <button type="submit" className="w-full bg-red-600 text-white font-bold py-4 rounded-xl hover:bg-red-700 transition shadow-md">
                Execute Security Override Protocol
              </button>
              {emailStatus && (
                <div className={`text-center font-bold text-sm p-3 rounded-lg ${emailStatus.includes('Error') ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-green-100 text-green-800 border border-green-200'}`}>
                  {emailStatus}
                </div>
              )}
            </form>

          </div>
        )}

      </div>
    </div>
  );
}
