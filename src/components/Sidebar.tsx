import React from "react";
import { LayoutDashboard, Kanban, Users, MessageSquare, KeyRound, Bell, AlertTriangle, Building2, Sparkles, Send, HeartHandshake, Megaphone } from "lucide-react";
import { CompanyProfile } from "../types";

export type ViewType = "dashboard" | "pipeline" | "post_sales" | "delinquents" | "leads" | "ads" | "templates" | "integration";

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  unreadNotifications: number;
  setShowNotifications: (show: boolean) => void;
  company?: CompanyProfile;
  onOpenSettings?: () => void;
}

export default function Sidebar({
  currentView,
  setView,
  unreadNotifications,
  setShowNotifications,
  company,
  onOpenSettings
}: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "pipeline", label: "Funil de Vendas", icon: Kanban },
    { id: "post_sales", label: "Pós-Vendas", icon: HeartHandshake },
    { id: "delinquents", label: "Inadimplência", icon: AlertTriangle },
    { id: "leads", label: "Contatos / Leads", icon: Users },
    { id: "ads", label: "Gestão de ADS", icon: Megaphone },
    { id: "templates", label: "Modelos WhatsApp", icon: Sparkles },
    { id: "integration", label: "Integração & API", icon: KeyRound },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 border-r border-slate-800 z-10">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-amber-500/20 shrink-0 text-base">
              {company?.name ? company.name.charAt(0).toUpperCase() : "G"}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-extrabold text-sm leading-snug text-slate-100 truncate">
                {company?.name || "Glow CRM"}
              </h1>
              <span className="text-[11px] text-amber-400 font-medium block truncate">
                {company?.subtitle || "Semijoias & Consignação"}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id as ViewType)}
                className={`flex items-center space-x-3 w-full px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 group cursor-pointer ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-100"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-3 mt-3 border-t border-slate-800/80 px-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block px-2 mb-1.5">Administração</span>
            <button
              onClick={onOpenSettings}
              className="flex items-center space-x-3 w-full px-3.5 py-2.5 rounded-xl font-semibold text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-all group cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-emerald-400 transition-transform group-hover:scale-110" />
              <span>Configurações Empresa</span>
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-slate-400 font-mono">CRM Webhook Ativo</span>
          </div>
          <button
            onClick={() => setShowNotifications(true)}
            className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
            title="Notificações"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center animate-bounce">
                {unreadNotifications}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 text-slate-400 flex items-center justify-around py-2 px-2 z-50 shadow-2xl">
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
              <Icon className="w-4 h-4" />
              <span className="text-[9px] mt-0.5 font-medium tracking-tight">{item.label.split(" ")[0]}</span>
            </button>
          );
        })}

        <button
          onClick={onOpenSettings}
          className="flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 text-slate-400"
        >
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span className="text-[9px] mt-0.5 font-medium tracking-tight">Empresa</span>
        </button>

        <button
          onClick={() => setShowNotifications(true)}
          className="relative flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 text-slate-400"
        >
          <div className="relative">
            <Bell className="w-4 h-4" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 text-[8px] font-bold text-white flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </div>
          <span className="text-[9px] mt-0.5 font-medium tracking-tight">Alertas</span>
        </button>
      </div>
    </>
  );
}

