import { Home, Shield, Wrench, Menu } from "lucide-react";

export default function BottomNav({ activeTab, setActiveTab }) {
  return (
    <div className="fixed bottom-0 left-0 w-full bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex justify-around p-3 z-50">
      <button onClick={() => setActiveTab("home")} className={activeTab === "home" ? "text-yellow-500" : "text-gray-500"}>
        <Home />
      </button>
      <button onClick={() => setActiveTab("insurance")} className={activeTab === "insurance" ? "text-yellow-500" : "text-gray-500"}>
        <Shield />
      </button>
      <button onClick={() => setActiveTab("spare")} className={activeTab === "spare" ? "text-yellow-500" : "text-gray-500"}>
        <Wrench />
      </button>
      <button onClick={() => setActiveTab("menu")} className={activeTab === "menu" ? "text-yellow-500" : "text-gray-500"}>
        <Menu />
      </button>
    </div>
  );
}
