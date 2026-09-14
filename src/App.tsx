import React, { useState, useEffect } from "react";
import Sidebar, { ViewType } from "./components/Sidebar";
import DashboardView from "./components/DashboardView";
import PipelineView from "./components/PipelineView";
import LeadsListView from "./components/LeadsListView";
import TemplatesView from "./components/TemplatesView";
import IntegrationView from "./components/IntegrationView";
import DelinquentsView from "./components/DelinquentsView";
import PostSalesView from "./components/PostSalesView";
import AdsView from "./components/AdsView";
import LeadDetailsModal from "./components/LeadDetailsModal";
import SettingsModal from "./components/SettingsModal";
import { Lead, MessageTemplate, AppNotification, LeadStage, PipelineStage, CompanyProfile, CustomFieldDefinition, TargetModule } from "./types";
import { X, Bell, Check, Users, Plus, ShieldAlert, Sparkles, Loader2, MessageSquare, Laptop, Smartphone, HelpCircle, Building2, Megaphone, Kanban, HeartHandshake, AlertTriangle } from "lucide-react";
import { getWhatsAppUrl, WhatsAppMode, getWhatsAppModeLabel } from "./utils/whatsapp";

export default function App() {
  const [currentView, setView] = useState<ViewType>("dashboard");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [whatsappPresetMessage, setWhatsappPresetMessage] = useState<string>("");
  const [company, setCompany] = useState<CompanyProfile>(() => {
    try {
      const cached = localStorage.getItem("crm_company_profile");
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      // ignore
    }
    return {
      name: "CRM Multinegócios",
      subtitle: "Gestão Comercial & Funil de Vendas",
      segment: "Varejo & Serviços",
      currency: "R$",
      defaultLeadValue: 1000
    };
  });
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Sync document title with company name
  useEffect(() => {
    if (company?.name) {
      document.title = `${company.name} | CRM & Funil de Vendas`;
    }
  }, [company?.name]);
  
  // Free WhatsApp platform sending mode (web, app, auto)
  const [whatsAppMode, setWhatsAppMode] = useState<WhatsAppMode>(() => {
    const saved = localStorage.getItem("whatsapp_mode");
    if (saved === "web" || saved === "app" || saved === "auto") return saved as WhatsAppMode;
    return "app"; // Default to WhatsApp App on desktops
  });

  const changeWhatsAppMode = (mode: WhatsAppMode) => {
    setWhatsAppMode(mode);
    localStorage.setItem("whatsapp_mode", mode);
  };
  
  // Modals state
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);

  // Form states for manual Lead addition with Funnel Destination Integration
  const [newLeadTargetModule, setNewLeadTargetModule] = useState<TargetModule>("sales");
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadNickname, setNewLeadNickname] = useState("");
  const [newLeadEmail, setNewLeadEmail] = useState("");
  const [newLeadPhone, setNewLeadPhone] = useState("");
  const [newLeadValue, setNewLeadValue] = useState("");
  const [newLeadStage, setNewLeadStage] = useState<LeadStage>("");
  const [newLeadSource, setNewLeadSource] = useState("Manual");
  const [newLeadDebtValue, setNewLeadDebtValue] = useState("1200");
  const [newLeadDelayDays, setNewLeadDelayDays] = useState("15");
  const [isSavingLead, setIsSavingLead] = useState(false);

  // Synthetic sound trigger (satisfying micro-feedback)
  const playAlertSound = (type: "success" | "info") => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (type === "success") {
        // Satisfying chime (double ding)
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc1.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.12); // A5
        
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(293.66, audioCtx.currentTime); // D4
        osc2.frequency.setValueAtTime(440.00, audioCtx.currentTime + 0.12); // A4

        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        
        osc1.start();
        osc2.start();
        osc1.stop(audioCtx.currentTime + 0.5);
        osc2.stop(audioCtx.currentTime + 0.5);
      } else {
        // Soft bubble pop
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(440.00, audioCtx.currentTime); // A4
        osc.frequency.exponentialRampToValueAtTime(880.00, audioCtx.currentTime + 0.08); // A5
        
        gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      }
    } catch (err) {
      console.warn("Web Audio blocked.", err);
    }
  };

  const loadData = async (silent = false) => {
    if (!silent) setIsLoadingLeads(true);
    try {
      const [leadsRes, tempsRes, notifsRes, stagesRes, companyRes, customFieldsRes] = await Promise.all([
        fetch("/api/leads"),
        fetch("/api/templates"),
        fetch("/api/notifications"),
        fetch("/api/stages"),
        fetch("/api/company"),
        fetch("/api/custom-fields")
      ]);

      // Load company profile independently
      if (companyRes.ok) {
        try {
          const freshCompany = await companyRes.json();
          if (freshCompany && freshCompany.name) {
            setCompany(freshCompany);
            localStorage.setItem("crm_company_profile", JSON.stringify(freshCompany));
          }
        } catch (err) {
          console.error("Error parsing company data:", err);
        }
      }

      // Load custom fields independently
      if (customFieldsRes.ok) {
        try {
          const freshFields = await customFieldsRes.json();
          setCustomFields(freshFields);
        } catch (err) {
          console.error("Error parsing custom fields:", err);
        }
      }

      if (leadsRes.ok && tempsRes.ok && notifsRes.ok && stagesRes.ok) {
        const freshLeads = await leadsRes.json();
        const freshTemps = await tempsRes.json();
        const freshNotifs = await notifsRes.json();
        const freshStages = await stagesRes.json();

        // Check if there are new unread notifications that we don't have yet, and play sound!
        const previousUnreadCount = notifications.filter(n => !n.read).length;
        const freshUnreadCount = freshNotifs.filter((n: any) => !n.read).length;

        setLeads(freshLeads);
        setTemplates(freshTemps);
        setNotifications(freshNotifs);
        setStages(freshStages);

        if (freshStages.length > 0) {
          setNewLeadStage((prev) => {
            if (!prev || !freshStages.some((s: any) => s.id === prev)) {
              return freshStages[0].id;
            }
            return prev;
          });
        }

        if (!silent && selectedLead) {
          // Sync open lead details if it was updated
          const updatedSelected = freshLeads.find((l: any) => l.id === selectedLead.id);
          if (updatedSelected) setSelectedLead(updatedSelected);
        }

        // Sound trigger if new notification comes in
        if (freshUnreadCount > previousUnreadCount && notifications.length > 0) {
          // Detect latest unread
          const latest = freshNotifs.find((n: any) => !n.read);
          if (latest) {
            playAlertSound(latest.type === "success" ? "success" : "info");
          }
        }
      }
    } catch (err) {
      console.error("Error loading data from CRM API:", err);
    } finally {
      if (!silent) setIsLoadingLeads(false);
    }
  };

  // Setup initial fetch and periodic syncing (keeps funnel & notifications updated in real-time)
  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData(true); // silent background sync every 15 seconds
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName || !newLeadPhone) return;

    setIsSavingLead(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newLeadName,
          nickname: newLeadNickname,
          email: newLeadEmail,
          phone: newLeadPhone,
          value: Number(newLeadValue) || (newLeadTargetModule === 'delinquents' ? Number(newLeadDebtValue) : 0),
          stage: newLeadTargetModule === 'post_sales' ? 'won' : newLeadStage,
          source: newLeadSource,
          targetModule: newLeadTargetModule,
          isInadimplente: newLeadTargetModule === 'delinquents',
          valorInadimplente: newLeadTargetModule === 'delinquents' ? (Number(newLeadDebtValue) || 1200) : 0,
          diasAtraso: newLeadTargetModule === 'delinquents' ? (Number(newLeadDelayDays) || 15) : 0,
          statusCobranca: newLeadTargetModule === 'delinquents' ? "friendly" : undefined,
          postSalesStage: newLeadTargetModule === 'post_sales' ? "onboarding" : undefined
        })
      });

      if (response.ok) {
        // Clear inputs
        setNewLeadName("");
        setNewLeadNickname("");
        setNewLeadEmail("");
        setNewLeadPhone("");
        setNewLeadValue("");
        setNewLeadStage("prospect");
        setNewLeadSource("Manual");
        setNewLeadTargetModule("sales");
        setShowAddLeadModal(false);
        playAlertSound("success");
        await loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingLead(false);
    }
  };

  const handleMoveLeadDirectly = async (leadId: string, newStage: LeadStage) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage })
      });
      if (response.ok) {
        await loadData(true); // Sync silently
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDirectWhatsAppClick = async (lead: Lead) => {
    if (!lead.phone) {
      alert("Por favor, configure o telefone do lead para enviar mensagem.");
      return;
    }

    // Determine target category based on lead's stage
    let targetCategory: 'introduction' | 'followup' | 'proposal' | 'other' = 'other';
    if (lead.stage === 'prospect') {
      targetCategory = 'introduction';
    } else if (lead.stage === 'contacted' || lead.stage === 'qualified') {
      targetCategory = 'followup';
    } else if (lead.stage === 'proposal' || lead.stage === 'negotiation') {
      targetCategory = 'proposal';
    }

    // Find first template in category, fallback to first overall template, or a highly polished default message
    const template = templates.find(t => t.category === targetCategory) || templates[0];
    
    let messageText = "";
    if (template) {
      messageText = template.message
        .replace(/{nome}/g, lead.name)
        .replace(/{apelido}/g, lead.nickname || lead.name)
        .replace(/{chamado}/g, lead.nickname || lead.name)
        .replace(/{empresa}/g, lead.nickname || "seu mostruário")
        .replace(/{valor}/g, lead.value ? lead.value.toLocaleString('pt-BR') : "0,00")
        .replace(/{email}/g, lead.email || "seu email");
    } else {
      messageText = `Olá, ${lead.nickname || lead.name}! Tudo bem? Gostaria de dar andamento ao nosso contato.`;
    }

    // Register contact in timeline database in the background to ensure activity logs are 100% updated automatically
    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markWhatsAppContact: `Enviou WhatsApp Rápido (1-Clique): "${messageText.substring(0, 80)}${messageText.length > 80 ? '...' : ''}"`
        })
      });
      if (response.ok) {
        const updated = await response.json();
        // Update local leads array and selected lead state
        setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
        if (selectedLead && selectedLead.id === lead.id) {
          setSelectedLead(updated);
        }
      }
    } catch (err) {
      console.error("Erro ao registrar atividade de WhatsApp:", err);
    }

    // Open WhatsApp instantly via chosen platform mode (Web/App)
    const whatsappUrl = getWhatsAppUrl(lead.phone, messageText, whatsAppMode);
    window.open(whatsappUrl, "_blank");
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      const response = await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true })
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderActiveView = () => {
    switch (currentView) {
      case "dashboard":
        return <DashboardView leads={leads} stages={stages} />;
      case "pipeline":
        return (
          <PipelineView
            leads={leads}
            stages={stages}
            onLeadClick={(lead) => setSelectedLead(lead)}
            onAddLeadClick={() => setShowAddLeadModal(true)}
            onMoveLead={handleMoveLeadDirectly}
            onWhatsAppDirectClick={handleDirectWhatsAppClick}
            onRefreshData={loadData}
          />
        );
      case "leads":
        return (
          <LeadsListView
            leads={leads}
            stages={stages}
            customFields={customFields}
            onLeadClick={(lead) => setSelectedLead(lead)}
            onAddLeadClick={() => setShowAddLeadModal(true)}
            onImportComplete={() => loadData()}
            onWhatsAppDirectClick={handleDirectWhatsAppClick}
            onUpdateLead={(updated) => {
              setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
              if (selectedLead && selectedLead.id === updated.id) {
                setSelectedLead(updated);
              }
            }}
            onDeleteLead={(id) => {
              setLeads(prev => prev.filter(l => l.id !== id));
              if (selectedLead && selectedLead.id === id) {
                setSelectedLead(null);
              }
            }}
          />
        );
      case "templates":
        return (
          <TemplatesView
            templates={templates}
            stages={stages}
            onTemplatesChange={() => loadData()}
            onOpenWhatsAppWithTemplate={(msgText) => {
              navigator.clipboard.writeText(msgText);
              alert("Texto do modelo copiado para a área de transferência!");
            }}
          />
        );
      case "integration":
        return <IntegrationView customFields={customFields} onIntegrationTriggered={() => loadData()} />;
      case "post_sales":
        return (
          <PostSalesView
            leads={leads}
            templates={templates}
            onLeadClick={(lead) => setSelectedLead(lead)}
            onUpdateLead={async (leadId, data) => {
              try {
                const res = await fetch(`/api/leads/${leadId}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(data)
                });
                if (res.ok) {
                  const updated = await res.json();
                  setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
                  if (selectedLead && selectedLead.id === updated.id) {
                    setSelectedLead(updated);
                  }
                }
              } catch (e) {
                console.error(e);
              }
            }}
            onWhatsAppDirectClick={handleDirectWhatsAppClick}
            onRefreshData={loadData}
          />
        );
      case "delinquents":
        return (
          <DelinquentsView
            leads={leads}
            templates={templates}
            onSelectLead={(lead) => setSelectedLead(lead)}
            onUpdateLead={(updated) => {
              setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
              if (selectedLead && selectedLead.id === updated.id) {
                setSelectedLead(updated);
              }
            }}
            onRefreshData={loadData}
          />
        );
      case "ads":
        return (
          <AdsView 
            leads={leads} 
            onRefreshLeads={loadData} 
          />
        );
      default:
        return <DashboardView leads={leads} stages={stages} />;
    }
  };

  return (
    <div id="crm-app-root" className="min-h-screen bg-slate-50 font-sans text-slate-800 flex">
      
      {/* Sidebar (Desktop) and Bottom Bar (Mobile) */}
      <Sidebar
        currentView={currentView}
        setView={(v) => {
          setView(v);
          setShowNotifications(false);
        }}
        unreadNotifications={unreadCount}
        setShowNotifications={setShowNotifications}
        company={company}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      {/* Main Panel Content Area */}
      <main className="flex-1 md:pl-64 min-h-screen flex flex-col pb-20 md:pb-0">
        
        {/* Top Header Navbar */}
        <header className="bg-white border-b border-slate-100 py-4 px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-slate-800">
              {currentView === "dashboard" && "Painel de Performance Comercial"}
              {currentView === "pipeline" && "Funil de Vendas (CRM)"}
              {currentView === "post_sales" && "Pós-Vendas & Sucesso da Revendedora"}
              {currentView === "delinquents" && "Gestão de Inadimplência & Cobrança"}
              {currentView === "leads" && "Lista de Contatos"}
              {currentView === "ads" && "Gestão de Anúncios Pagos (ADS)"}
              {currentView === "templates" && "Modelos Rápidos do WhatsApp"}
              {currentView === "integration" && "Integrações & Gerador de Formulários"}
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            {/* WhatsApp Platform Selector (No API Cost Option) */}
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-100 p-1 rounded-xl text-xs font-semibold">
              <span className="text-slate-400 pl-1.5 flex items-center space-x-1" title="Envio Grátis de Mensagens">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="hidden lg:inline text-[10px] text-slate-500 font-bold uppercase tracking-wider">Enviar via:</span>
              </span>
              <div className="flex space-x-0.5">
                <button
                  onClick={() => changeWhatsAppMode("web")}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition-all ${
                    whatsAppMode === "web"
                      ? "bg-white text-emerald-600 shadow-xs border border-slate-200"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="WhatsApp Web (Sem tela intermediária no computador)"
                >
                  <Laptop className="w-3 h-3" />
                  <span className="hidden sm:inline">Web</span>
                </button>
                <button
                  onClick={() => changeWhatsAppMode("app")}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition-all ${
                    whatsAppMode === "app"
                      ? "bg-white text-emerald-600 shadow-xs border border-slate-200"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="WhatsApp App (Abre o aplicativo nativo diretamente)"
                >
                  <Smartphone className="w-3 h-3" />
                  <span className="hidden sm:inline">App</span>
                </button>
                <button
                  onClick={() => changeWhatsAppMode("auto")}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition-all ${
                    whatsAppMode === "auto"
                      ? "bg-white text-emerald-600 shadow-xs border border-slate-200"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Link de redirecionamento tradicional"
                >
                  <HelpCircle className="w-3 h-3 text-slate-400" />
                  <span className="hidden sm:inline">Auto</span>
                </button>
              </div>
            </div>

            {/* Quick stats banner */}
            <div className="hidden sm:flex items-center space-x-1.5 text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
              <Users className="w-3.5 h-3.5 text-emerald-500" />
              <span>{leads.length} leads</span>
            </div>

            {/* Company Settings Header Button */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className="text-xs font-bold text-slate-700 hover:text-emerald-600 p-2 hover:bg-slate-50 rounded-xl transition-all border border-slate-200 flex items-center space-x-1.5 cursor-pointer"
              title="Configurações da Empresa"
            >
              <Building2 className="w-4 h-4 text-emerald-500" />
              <span className="hidden md:inline">Empresa</span>
            </button>

            {/* Sync trigger button */}
            <button
              onClick={() => loadData()}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 p-1.5 hover:bg-slate-50 rounded-xl transition-colors border border-slate-100 cursor-pointer"
              title="Sincronizar Dados"
            >
              Recarregar
            </button>
          </div>
        </header>

        {/* View Component Wrapper */}
        <div className="p-6 max-w-7xl w-full mx-auto flex-1">
          {isLoadingLeads && leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
              <p className="text-slate-500 text-xs font-mono tracking-wide">Carregando WhatsCRM...</p>
            </div>
          ) : (
            renderActiveView()
          )}
        </div>
      </main>

      {/* 1. Company & System Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        company={company}
        customFields={customFields}
        onCompanyUpdated={(updated) => {
          setCompany(updated);
          try {
            localStorage.setItem("crm_company_profile", JSON.stringify(updated));
          } catch (e) {
            console.error("Failed to cache company profile:", e);
          }
        }}
        onCustomFieldsUpdated={(fields) => setCustomFields(fields)}
      />

      {/* 2. Lead Details / Timeline Drawer Modal */}
      {selectedLead && (
        <LeadDetailsModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdateLead={(updated) => {
            // Update item locally
            setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
            setSelectedLead(updated);
          }}
          onDeleteLead={(id) => {
            setLeads(prev => prev.filter(l => l.id !== id));
            setSelectedLead(null);
          }}
          templates={templates}
          stages={stages}
        />
      )}

      {/* 3. Add New Lead Popup Modal */}
      {showAddLeadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in duration-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="font-bold text-sm">Criar Novo Contato / Lead</h3>
                <p className="text-[11px] text-slate-400">Cadastre e envie diretamente para o módulo correto do CRM</p>
              </div>
              <button onClick={() => setShowAddLeadModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Funnel Target Integration Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Destino do Cadastro no CRM *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewLeadTargetModule("sales")}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center space-y-1 ${
                      newLeadTargetModule === "sales"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20 font-bold shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Kanban className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs">Funil Vendas</span>
                    <span className="text-[10px] text-slate-400 font-normal">Negociação</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewLeadTargetModule("post_sales")}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center space-y-1 ${
                      newLeadTargetModule === "post_sales"
                        ? "bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-500/20 font-bold shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <HeartHandshake className="w-4 h-4 text-blue-600" />
                    <span className="text-xs">Pós-Vendas</span>
                    <span className="text-[10px] text-slate-400 font-normal">Acompanhamento</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewLeadTargetModule("delinquents")}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center space-y-1 ${
                      newLeadTargetModule === "delinquents"
                        ? "bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20 font-bold shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span className="text-xs">Inadimplência</span>
                    <span className="text-[10px] text-slate-400 font-normal">Cobrança</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo"
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Como deve ser chamado (Apelido / Revendedora)</label>
                <input
                  type="text"
                  placeholder="Ex: Mari, Clarinha, Sofi"
                  value={newLeadNickname}
                  onChange={(e) => setNewLeadNickname(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Telefone WhatsApp *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 11988887777"
                    value={newLeadPhone}
                    onChange={(e) => setNewLeadPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="carlos@alfa.com"
                    value={newLeadEmail}
                    onChange={(e) => setNewLeadEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Dynamic Module Specific Fields */}
              {newLeadTargetModule === "sales" && (
                <div className="grid grid-cols-2 gap-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Valor Previsto (R$)</label>
                    <input
                      type="number"
                      placeholder="Ex: 1500"
                      value={newLeadValue}
                      onChange={(e) => setNewLeadValue(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Etapa de Entrada</label>
                    <select
                      value={newLeadStage}
                      onChange={(e) => setNewLeadStage(e.target.value as LeadStage)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white font-semibold"
                    >
                      {stages.map((stg) => (
                        <option key={stg.id} value={stg.id}>
                          {stg.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {newLeadTargetModule === "post_sales" && (
                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 space-y-2">
                  <div className="flex items-center space-x-2 text-blue-800 text-xs font-bold">
                    <HeartHandshake className="w-4 h-4 text-blue-600" />
                    <span>Cadastro para Pós-Venda & Retenção</span>
                  </div>
                  <p className="text-[11px] text-blue-700">
                    O contato será adicionado como cliente ativo na fase inicial de <strong>Onboarding / Boas-Vindas</strong>.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Valor do Pedido / Mostruário (R$)</label>
                    <input
                      type="number"
                      placeholder="Ex: 2000"
                      value={newLeadValue}
                      onChange={(e) => setNewLeadValue(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500 font-bold"
                    />
                  </div>
                </div>
              )}

              {newLeadTargetModule === "delinquents" && (
                <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-200 space-y-3">
                  <div className="flex items-center space-x-2 text-rose-800 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Cadastro de Inadimplência / Cobrança</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Valor do Débito (R$) *</label>
                      <input
                        type="number"
                        placeholder="Ex: 1200"
                        value={newLeadDebtValue}
                        onChange={(e) => setNewLeadDebtValue(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-rose-300 rounded-lg bg-white focus:outline-none focus:border-rose-500 font-bold text-rose-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Dias em Atraso *</label>
                      <input
                        type="number"
                        placeholder="Ex: 15"
                        value={newLeadDelayDays}
                        onChange={(e) => setNewLeadDelayDays(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-rose-300 rounded-lg bg-white focus:outline-none focus:border-rose-500 font-bold text-rose-700"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Canal de Origem</label>
                <input
                  type="text"
                  placeholder="Ex: Indicação, Meta Ads, Google Ads, Balcão"
                  value={newLeadSource}
                  onChange={(e) => setNewLeadSource(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(false)}
                  className="text-xs font-semibold px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingLead}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs px-5 py-2 rounded-xl transition-colors shadow-md shadow-emerald-600/10 flex items-center space-x-1 cursor-pointer"
                >
                  {isSavingLead ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Salvar no CRM</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Notifications Drawer / Overlay */}
      {showNotifications && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-50">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-250">
            <div>
              {/* Header */}
              <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-sm">Histórico de Alertas</h3>
                </div>
                <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Actions */}
              {unreadCount > 0 && (
                <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Você possui {unreadCount} novos alertas</span>
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-emerald-600 font-bold hover:underline"
                  >
                    Marcar todos como lidos
                  </button>
                </div>
              )}

              {/* List */}
              <div className="divide-y divide-slate-100 overflow-y-auto max-h-[80vh] px-2.5">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationAsRead(notif.id)}
                      className={`p-4 rounded-xl my-1.5 transition-all cursor-pointer ${
                        notif.read ? "bg-white opacity-60 hover:opacity-80" : "bg-emerald-50/20 border border-emerald-100/50 hover:bg-emerald-50/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs leading-tight flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${notif.type === 'success' ? 'bg-emerald-500' : notif.type === 'warning' ? 'bg-rose-500' : 'bg-blue-500'}`} />
                            <span>{notif.title}</span>
                          </h4>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">{notif.message}</p>
                          <span className="text-[10px] text-slate-400 block mt-1.5 font-medium">
                            {new Date(notif.createdAt).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        
                        {!notif.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 text-slate-400 text-xs">
                    Nenhuma notificação registrada.
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 text-center text-[10px] text-slate-400 font-mono">
              WhatsCRM Real-time Alerts Panel
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

