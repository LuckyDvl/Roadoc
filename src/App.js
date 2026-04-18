import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

import Home from "./pages/Home";
import DetailPage from "./pages/DetailPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import MechanicDashboard from "./pages/MechanicDashboard";
import UserProfile from "./pages/UserProfile";

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [userRole, setUserRole] = useState(null);
  const [selectedMechanic, setSelectedMechanic] = useState(null);
  const [userCoords, setUserCoords] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    // Absolute Failsafe: No matter what happens, unblock the screen in 3 seconds
    const failsafeLimit = setTimeout(() => {
      if (isMounted) {
        if (session === undefined) setSession(null);
        setUserRole(prev => prev ? prev : 'user');
      }
    }, 3000);

    const safeFetchRole = async (userId) => {
      try {
        const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
        if (isMounted) setUserRole(data?.role || 'user');
      } catch (e) {
        if (isMounted) setUserRole('user'); // Fallback on network crash
      }
    };

    // 1. Fetch initial cache
    supabase.auth.getSession()
      .then(({ data: { session: initSess } }) => {
        if (!isMounted) return;
        if (initSess?.user) {
          setSession(initSess);
          safeFetchRole(initSess.user.id);
        } else {
          setSession(null);
          setUserRole('none');
        }
      })
      .catch(() => {
        if (isMounted) { setSession(null); setUserRole('none'); }
      });

    // 2. Listen for real-time auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      if (!isMounted) return;
      if (sess?.user) {
        setSession(sess);
        safeFetchRole(sess.user.id);
      } else {
        setSession(null);
        setUserRole('none');
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(failsafeLimit);
      subscription.unsubscribe();
    };
  }, []);

  // Block the entire app from loading until we know EXACTLY who the user is
  if (session === undefined || (session && !userRole)) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col gap-4 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-yellow-500"></div>
        <p className="text-gray-500 font-bold tracking-widest text-sm">AUTHENTICATING...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={!session ? <Login /> : <Navigate to="/" />} 
        />
        <Route 
          path="/register" 
          element={!session ? <Register /> : <Navigate to="/" />} 
        />
        
        <Route 
          path="/admin" 
          element={session && userRole === 'admin' ? <AdminDashboard userCoords={userCoords} /> : <Navigate to="/" />} 
        />
        <Route 
          path="/mechanic" 
          element={session && userRole === 'mechanic' ? <MechanicDashboard session={session} /> : <Navigate to="/" />} 
        />
        <Route path="/profile" element={session ? <UserProfile /> : <Navigate to="/login" />} />
        
        {/* Soft Segregation: Let them see the map, but provide easy routes back to their Dashboards */}
        <Route 
          path="/" 
          element={
             !session ? <Navigate to="/login" /> :
             selectedMechanic ? (
               <DetailPage 
                 mechanic={selectedMechanic} 
                 userCoords={userCoords}
                 onBack={() => setSelectedMechanic(null)} 
               />
             ) : (
               <Home 
                 userRole={userRole}
                 onSelectMechanic={(m) => setSelectedMechanic(m)} 
                 userCoords={userCoords}
                 setUserCoords={setUserCoords}
               />
             )
          } 
        />
      </Routes>
    </Router>
  );
}
