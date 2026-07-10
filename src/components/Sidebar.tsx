import React from "react";
import { LayoutDashboard, Kanban, Users, MessageSquare, KeyRound, Bell, AlertTriangle } from "lucide-react";

export type ViewType = "dashboard" | "pipeline" | "leads" | "templates" | "integration" | "delinquents";

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  unreadNotifications: number;
  setShowNotifications: (show: boolean) => void;
}

export default function Sidebar({ currentView, setView, unreadNotifications, setShowNotifications }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "pipeline", label: "Funil de Vendas", icon: Kanban },
    { id: "leads", label: "Contatos / Leads", icon: Users },
    { id: "delinquents", label: "Inadimplentes (Cobrança)", icon: AlertTriangle },
    { id: "templates", label: "Modelos WhatsApp", icon: MessageSquare },
    { id: "integration", label: "Integração & API", icon: KeyRound },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 border-r border-slate-800 z-10">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-amber-500/20">
              G
            </div>
            <div>
              <h1 className="font-bold text-md leading-none text-slate-100">Glow CRM</h1>
              <span className="text-[11px] text-amber-400 font-medium">Semijoias & Consignação</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id as ViewType)}
                className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 group ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-100"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-400 font-mono">CRM API Ativa</span>
          </div>
          <button
            onClick={() => setShowNotifications(true)}
            className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
            title="Notificações"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center animate-bounce">
                {unreadNotifications}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (Responsive Commercial Access) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 text-slate-400 flex items-center justify-around py-2.5 px-4 z-50 shadow-2xl">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewType)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 ${
                isActive ? "text-emerald-400 scale-105" : "text-slate-400"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium tracking-wide">{item.label.split(" ")[0]}</span>
            </button>
          );
        })}
        <button
          onClick={() => setShowNotifications(true)}
          className="relative flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 text-slate-400"
        >
          <div className="relative">
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 font-medium tracking-wide">Notifics</span>
        </button>
      </div>
    </>
  );
}
