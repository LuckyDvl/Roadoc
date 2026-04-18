import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import MapPicker from "../components/MapPicker";

export default function AdminDashboard({ userCoords }) {
  const [users, setUsers] = useState([]);
  const [pendingUpdates, setPendingUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all_users");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const [form, setForm] = useState({
    name: "",
    owner_id: "",
    description: "",
    phone: "",
    lat: userCoords?.lat || "",
    lng: userCoords?.lng || "",
  });

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*');
    if (data) setUsers(data);
    
    // Also fetch pending store updates
    const { data: updatesData } = await supabase
      .from('garage_updates')
      .select('*, garages(name, image_url, owner_id)')
      .eq('status', 'pending');
    if (updatesData) setPendingUpdates(updatesData);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();

    const adminChannel = supabase.channel('admin_live_feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'garage_updates' }, () => {
         fetchUsers();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
         fetchUsers();
      })
      .subscribe();

    return () => {
       supabase.removeChannel(adminChannel);
    };
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    fetchUsers();
  };

  const handleMapSelect = (latlng) => {
    setForm(prev => ({ ...prev, lat: latlng.lat, lng: latlng.lng }));
  };

  const handleAddGarage = async (e) => {
    e.preventDefault();
    if (!form.owner_id || !form.lat || !form.lng) {
      alert("Please select an owner and a location on the map.");
      return;
    }
    
    const { error } = await supabase.from('garages').insert([{
      name: form.name,
      owner_id: form.owner_id,
      description: form.description,
      phone: form.phone,
      latitude: form.lat,
      longitude: form.lng
    }]);

    if (error) alert("Error adding garage: " + error.message);
    else alert("Garage added successfully!");
  };

  const handleUpdateDecision = async (updateRow, decision) => {
    if (decision === 'approved') {
      // Push changes visually to live Garages table
      const { error: garageUpdateError } = await supabase.from('garages').update({
        name: updateRow.new_name,
        description: updateRow.new_description,
        phone: updateRow.new_phone,
        image_url: updateRow.new_image_url,
        owner_name: updateRow.new_owner_name,
        owner_dp_url: updateRow.new_owner_dp_url
      }).eq('id', updateRow.garage_id);

      if (garageUpdateError) {
         alert("FATAL ERROR: The database blocked updating the Live Garage table! Check your RLS permissions: " + garageUpdateError.message);
         return;
      }
    }
    
    // Mark as handled
    await supabase.from('garage_updates').update({ status: decision }).eq('id', updateRow.id);
    alert(`Update ${decision}!`);
    fetchUsers(); // refresh the queue
  };

  const mechanics = users.filter((u) => u.role === 'mechanic');
  
  // Tab Filtering Logic
  const tabFilteredUsers = users.filter(u => {
    if (activeTab === "all_users") return true;
    if (activeTab === "mechanics") return u.role === "mechanic";
    if (activeTab === "admins") return u.role === "admin";
    return true;
  });

  const filteredUsers = tabFilteredUsers.filter((u) => u.email?.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const displayedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-100 p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center bg-white p-6 rounded-t-2xl shadow border-b">
          <h1 className="text-3xl font-bold text-gray-800">Admin Control Center</h1>
          <button 
            onClick={handleLogout}
            className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-bold border border-red-100 hover:bg-red-100 transition"
          >
            Sign Out
          </button>
        </div>

        <div className="bg-white flex overflow-x-auto px-6 shadow border-b gap-4 no-scrollbar">
          <button onClick={() => { setActiveTab("all_users"); setCurrentPage(1); }} className={`py-4 font-semibold whitespace-nowrap border-b-2 ${activeTab === "all_users" ? "border-yellow-500 text-yellow-600" : "border-transparent text-gray-500"}`}>All Users</button>
          <button onClick={() => { setActiveTab("mechanics"); setCurrentPage(1); }} className={`py-4 font-semibold whitespace-nowrap border-b-2 ${activeTab === "mechanics" ? "border-yellow-500 text-yellow-600" : "border-transparent text-gray-500"}`}>Mechanics</button>
          <button onClick={() => { setActiveTab("admins"); setCurrentPage(1); }} className={`py-4 font-semibold whitespace-nowrap border-b-2 ${activeTab === "admins" ? "border-yellow-500 text-yellow-600" : "border-transparent text-gray-500"}`}>Admins</button>
          <button onClick={() => { setActiveTab("garages"); setCurrentPage(1); }} className={`py-4 font-semibold whitespace-nowrap border-b-2 ${activeTab === "garages" ? "border-yellow-500 text-yellow-600" : "border-transparent text-gray-500"}`}>Manage Garages</button>
          <button onClick={() => { setActiveTab("verifications"); setCurrentPage(1); }} className={`py-4 font-semibold flex items-center gap-2 whitespace-nowrap border-b-2 ${activeTab === "verifications" ? "border-yellow-500 text-yellow-600" : "border-transparent text-gray-500"}`}>
            Pending Storefronts <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingUpdates.length}</span>
          </button>
        </div>

        <div className="bg-white p-6 rounded-b-2xl shadow">
          {activeTab === "verifications" && (
            <div>
              <h2 className="text-2xl font-bold mb-4 border-b pb-4 text-red-600">Pending Safety Verifications</h2>
              <div className="space-y-4">
                {pendingUpdates.length === 0 ? (
                   <p className="text-gray-500 font-medium">No pending garage profile updates.</p>
                ) : pendingUpdates.map(update => (
                  <div key={update.id} className="bg-gray-50 border border-red-200 rounded-xl p-6 shadow-sm">
                     <p className="font-bold text-gray-800 mb-4">{update.garages?.name} wants to change their storefront data!</p>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-4 rounded-lg shadow-inner mb-4">
                        <div>
                          <p className="text-xs text-red-400 font-bold uppercase tracking-wider mb-2">Requested Changes</p>
                          <p><strong>Name:</strong> {update.new_name}</p>
                          <p><strong>Desc:</strong> {update.new_description}</p>
                          <p><strong>Phone:</strong> {update.new_phone}</p>
                          <p><strong>Owner Identity:</strong> {update.new_owner_name || 'N/A'}</p>
                          <div className="mt-2 text-sm text-blue-600 truncate flex flex-col gap-1">
                            <strong><a href={update.new_image_url} target="_blank" rel="noreferrer">View Display Banner ↗</a></strong>
                            <strong><a href={update.new_owner_dp_url} target="_blank" rel="noreferrer">View Avatar Upload ↗</a></strong>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Live Public Data (Before)</p>
                          <p className="text-sm text-gray-500 line-through">{update.garages?.name}</p>
                          <div className="mt-2 text-sm text-gray-500">
                             <strong>Live Photo:</strong> {update.garages?.image_url ? <a href={update.garages.image_url} target="_blank" rel="noreferrer" className="underline">View Live</a> : 'None'}
                          </div>
                        </div>
                     </div>
                     
                     <div className="flex gap-4">
                        <button onClick={() => handleUpdateDecision(update, 'rejected')} className="bg-white border text-red-600 font-bold px-6 py-2 rounded-lg hover:bg-red-50">Refuse & Delete</button>
                        <button onClick={() => handleUpdateDecision(update, 'approved')} className="bg-green-500 text-white font-bold px-6 py-2 rounded-lg hover:bg-green-600 shadow-sm">Approve & Push to Public Map</button>
                     </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab !== "garages" && activeTab !== "verifications" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">
                  {activeTab === "all_users" ? "All Platform Users" : activeTab === "mechanics" ? "Platform Mechanics" : "Platform Admins"}
                </h2>
                <input 
                  type="text" 
                  placeholder="Search by email..." 
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border p-2 rounded-lg text-sm w-64"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left bg-gray-50 rounded-lg">
                  <thead>
                    <tr className="border-b">
                      <th className="p-3">Email</th>
                      <th className="p-3">Current Role</th>
                      <th className="p-3">Change Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? <tr><td className="p-3">Loading...</td></tr> : 
                      displayedUsers.length > 0 ? displayedUsers.map(u => (
                        <tr key={u.id} className="border-b">
                          <td className="p-3">{u.email}</td>
                          <td className="p-3 font-semibold text-gray-700">{u.role}</td>
                          <td className="p-3">
                            <select 
                              className={`border rounded p-1 font-semibold ${u.role === 'admin' ? 'bg-red-50 text-red-600 border-red-200' : u.role === 'mechanic' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-600'}`}
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            >
                              <option value="user">User</option>
                              <option value="mechanic">Mechanic</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                        </tr>
                      )) : (
                        <tr><td className="p-3 text-gray-500" colSpan="3">No matches found.</td></tr>
                      )
                    }
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm font-medium text-gray-600">Page {currentPage} of {totalPages}</span>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "garages" && (
            <div>
              <h2 className="text-2xl font-bold mb-4 border-b pb-4">Register New Garage Location</h2>
              <form className="space-y-4" onSubmit={handleAddGarage}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Select Mechanic (Owner)</label>
                    <select 
                      className="w-full border p-2 rounded bg-gray-50 focus:bg-white" 
                      value={form.owner_id}
                      onChange={(e) => setForm({...form, owner_id: e.target.value})}
                      required
                    >
                      <option value="">-- Choose a Mechanic --</option>
                      {mechanics.map(m => (
                        <option key={m.id} value={m.id}>{m.email}</option>
                      ))}
                    </select>
                    {mechanics.length === 0 && <p className="text-xs text-red-500 mt-1">No mechanics available. Assign someone from the Users tab first.</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Garage Name</label>
                    <input 
                      type="text" 
                      className="w-full border p-2 rounded bg-gray-50 focus:bg-white"
                      value={form.name}
                      onChange={(e) => setForm({...form, name: e.target.value})}
                      required
                      placeholder="e.g. Mike's Auto Repair"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Dispatch Phone Number</label>
                  <input 
                    type="tel" 
                    className="w-full border p-2 rounded bg-gray-50 focus:bg-white"
                    value={form.phone}
                    onChange={(e) => setForm({...form, phone: e.target.value})}
                    placeholder="+91 9999999999"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea 
                    className="w-full border p-2 rounded bg-gray-50 focus:bg-white"
                    value={form.description}
                    onChange={(e) => setForm({...form, description: e.target.value})}
                    placeholder="Brief description of services..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Location Data (Click map to snap marker)</label>
                  <MapPicker userCoords={userCoords} onLocationSelect={handleMapSelect} />
                </div>

                <button type="submit" className="bg-yellow-400 font-bold py-3 px-6 rounded-xl hover:bg-yellow-500 transition shadow-sm w-full mt-4 text-black text-lg">
                  Submit Garage Registration
                </button>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
