import React, { useState, useEffect } from "react";
import { 
  MessageSquare, Send, Phone, User, Search, Filter, Sparkles, CheckCheck, 
  ExternalLink, Layers, ArrowRight, RefreshCw, QrCode, CheckCircle2, Sliders,
  HelpCircle, ChevronRight, Zap, Paperclip, Smile, Clock, ShieldCheck, AlertCircle
} from "lucide-react";
import { Lead, MessageTemplate, PipelineStage, CompanyProfile } from "../types";
import { getWhatsAppUrl, WhatsAppMode, getWhatsAppModeLabel, formatWhatsAppPhone } from "../utils/whatsapp";

interface WhatsAppChatViewProps {
  leads: Lead[];
  stages: PipelineStage[];
  templates: MessageTemplate[];
  company?: CompanyProfile;
  whatsAppMode: WhatsAppMode;
  onChangeWhatsAppMode: (mode: WhatsAppMode) => void;
  initialLeadId?: string | null;
  initialMessage?: string | null;
  onLeadUpdate?: (lead: Lead) => void;
  onRefreshData?: () => Promise<void>;
  onNavigateToTemplates?: () => void;
}

export default function WhatsAppChatView({
  leads,
  stages,
  templates,
  company,
  whatsAppMode,
  onChangeWhatsAppMode,
  initialLeadId,
  initialMessage,
  onLeadUpdate,
  onRefreshData,
  onNavigateToTemplates
}: WhatsAppChatViewProps) {
  const [selectedLeadId, setSelectedLeadId] = useState<string>(() => {
    if (initialLeadId && leads.some(l => l.id === initialLeadId)) {
      return initialLeadId;
    }
    return leads.length > 0 ? leads[0].id : "";
  });

  const [composerText, setComposerText] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [layerFilter, setLayerFilter] = useState<'all' | 'topo' | 'meio' | 'fundo'>('all');
  const [showQrModal, setShowQrModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<string>("all");

  // If initial message passed, load into composer
  useEffect(() => {
    if (initialMessage) {
      setComposerText(initialMessage);
    }
  }, [initialMessage]);

  // Sync initial lead ID when changed externally
  useEffect(() => {
    if (initialLeadId && leads.some(l => l.id === initialLeadId)) {
      setSelectedLeadId(initialLeadId);
    }
  }, [initialLeadId, leads]);

  const activeLead = leads.find(l => l.id === selectedLeadId) || leads[0];

  // Helper to replace template variables for active lead
  const replaceTemplateVariables = (msg: string, lead?: Lead) => {
    if (!lead) return msg;
    const stageObj = stages.find(s => s.id === lead.stage);
    return msg
      .replace(/{nome}/g, lead.name)
      .replace(/{apelido}/g, lead.nickname || lead.name.split(" ")[0])
      .replace(/{chamado}/g, lead.nickname || lead.name.split(" ")[0])
      .replace(/{empresa}/g, lead.nickname || "Glow CRM")
      .replace(/{valor}/g, (lead.value || 0).toLocaleString('pt-BR'))
      .replace(/{email}/g, lead.email || "Não informado")
      .replace(/{telefone}/g, lead.phone || "")
      .replace(/{etapa}/g, stageObj?.label || lead.stage)
      .replace(/{valor_inadimplente}/g, (lead.valorInadimplente || 0).toLocaleString('pt-BR'))
      .replace(/{dias_atraso}/g, String(lead.diasAtraso || 0));
  };

  // Filter templates relevant to active lead's layer/stage
  const activeLeadStage = stages.find(s => s.id === activeLead?.stage);
  const activeLeadLayer = activeLeadStage?.layer || 'topo';

  const relevantTemplates = templates.filter(t => {
    // If template has specific layer, check match
    if (t.layer && t.layer !== 'all' && t.layer !== activeLeadLayer) {
      return false;
    }
    // If template has specific stage, check match
    if (t.stageId && t.stageId !== activeLead?.stage) {
      return false;
    }
    return true;
  });

  // Filtered leads list for left sidebar
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.nickname && lead.nickname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.phone && lead.phone.includes(searchTerm));
    
    if (!matchesSearch) return false;

    if (layerFilter !== 'all') {
      const stg = stages.find(s => s.id === lead.stage);
      const leadLayer = stg?.layer || 'topo';
      if (leadLayer !== layerFilter) return false;
    }
    return true;
  });

  // Sound chime feedback
  const playSendChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch (e) {
      // Audio context blocked
    }
  };

  // Send message action
  const handleSendMessage = async (customMsg?: string) => {
    const textToSend = customMsg || composerText;
    if (!textToSend.trim() || !activeLead) return;

    setIsSending(true);
    const formattedText = replaceTemplateVariables(textToSend, activeLead);

    try {
      // Save contact event to lead's timeline in backend
      const res = await fetch(`/api/leads/${activeLead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markWhatsAppContact: `[Envio WhatsApp Central]: ${formattedText}`
        })
      });

      if (res.ok) {
        const updatedLead = await res.json();
        if (onLeadUpdate) onLeadUpdate(updatedLead);
        if (onRefreshData) await onRefreshData();
      }

      playSendChime();
      setComposerText("");

      // Open WhatsApp Web or App link directly
      const url = getWhatsAppUrl(activeLead.phone, formattedText, whatsAppMode);
      window.open(url, "_blank");

    } catch (err) {
      console.error("Erro ao registrar envio do WhatsApp:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleStageChange = async (newStageId: string) => {
    if (!activeLead) return;
    try {
      const res = await fetch(`/api/leads/${activeLead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStageId })
      });
      if (res.ok) {
        const updated = await res.json();
        if (onLeadUpdate) onLeadUpdate(updated);
        if (onRefreshData) await onRefreshData();
      }
    } catch (err) {
      console.error("Erro ao atualizar etapa:", err);
    }
  };

  const getLayerBadge = (layer?: 'topo' | 'meio' | 'fundo') => {
    switch (layer) {
      case 'topo':
        return { label: '🏔️ Topo', bg: 'bg-sky-50 text-sky-700 border-sky-200' };
      case 'meio':
        return { label: '⚙️ Meio', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'fundo':
        return { label: '🎯 Fundo', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { label: '🏔️ Topo', bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Top Bar Banner: Webhook & Disparador Status */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-emerald-950 p-4 rounded-2xl border border-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-extrabold text-slate-100">Central WhatsApp Commercial</h2>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1" />
                <span>Integração Ativa</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Envio em 1 clique com modelos inteligentes por camada do funil (Topo, Meio e Fundo).
            </p>
          </div>
        </div>

        {/* WhatsApp Mode Controls & QR Status */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => onChangeWhatsAppMode('app')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                whatsAppMode === 'app'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              App Desktop
            </button>
            <button
              onClick={() => onChangeWhatsAppMode('web')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                whatsAppMode === 'web'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              WhatsApp Web
            </button>
          </div>

          <button
            onClick={() => setShowQrModal(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-amber-400" />
            <span>QR Code Status</span>
          </button>
        </div>
      </div>

      {/* Main WhatsApp Chat Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[75vh] min-h-[550px]">
        
        {/* Left Column: Leads Contacts List (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden">
          
          {/* Search & Layer Filter Header */}
          <div className="p-3 border-b border-slate-100 bg-slate-50/50 space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nome, apelido ou fone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-sans"
              />
            </div>

            {/* Layer Filter Buttons (Topo, Meio, Fundo) */}
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[10px] font-bold">
              <button
                onClick={() => setLayerFilter('all')}
                className={`px-2.5 py-1 rounded-lg border transition-all shrink-0 cursor-pointer ${
                  layerFilter === 'all'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Todos ({leads.length})
              </button>
              <button
                onClick={() => setLayerFilter('topo')}
                className={`px-2.5 py-1 rounded-lg border transition-all shrink-0 cursor-pointer ${
                  layerFilter === 'topo'
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-white text-sky-800 border-sky-200 hover:bg-sky-50'
                }`}
              >
                🏔️ Topo
              </button>
              <button
                onClick={() => setLayerFilter('meio')}
                className={`px-2.5 py-1 rounded-lg border transition-all shrink-0 cursor-pointer ${
                  layerFilter === 'meio'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-indigo-800 border-indigo-200 hover:bg-indigo-50'
                }`}
              >
                ⚙️ Meio
              </button>
              <button
                onClick={() => setLayerFilter('fundo')}
                className={`px-2.5 py-1 rounded-lg border transition-all shrink-0 cursor-pointer ${
                  layerFilter === 'fundo'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                🎯 Fundo
              </button>
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredLeads.length > 0 ? (
              filteredLeads.map((lead) => {
                const isSelected = lead.id === activeLead?.id;
                const stageObj = stages.find(s => s.id === lead.stage);
                const layerInfo = getLayerBadge(stageObj?.layer);
                const lastNote = lead.notes && lead.notes.length > 0 ? lead.notes[lead.notes.length - 1] : null;

                return (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLeadId(lead.id)}
                    className={`p-3 transition-all cursor-pointer flex items-start space-x-3 group relative ${
                      isSelected
                        ? "bg-emerald-50/70 border-l-4 border-l-emerald-600"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    {/* Lead Avatar */}
                    <div className="relative shrink-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isSelected ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" : "bg-slate-100 text-slate-700 group-hover:bg-slate-200"
                      }`}>
                        {lead.name.charAt(0).toUpperCase()}
                      </div>
                      {lead.isInadimplente && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[8px] font-extrabold" title="Inadimplente">
                          !
                        </span>
                      )}
                    </div>

                    {/* Lead Text Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-xs font-extrabold truncate ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                          {lead.name}
                        </h4>
                        <span className="text-[9px] text-slate-400 shrink-0 ml-1 font-mono">
                          {lead.lastContactAt ? new Date(lead.lastContactAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1 mt-0.5 flex-wrap gap-y-0.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${layerInfo.bg}`}>
                          {layerInfo.label}
                        </span>
                        <span className="text-[9px] text-slate-500 font-semibold truncate">
                          {stageObj?.label || lead.stage}
                        </span>
                      </div>

                      {lastNote && (
                        <p className="text-[10px] text-slate-400 truncate mt-1 italic">
                          {lastNote.content.replace("[Envio WhatsApp Central]: ", "")}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                Nenhum lead encontrado com esse filtro.
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Active Chat Panel (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden">
          
          {activeLead ? (
            <>
              {/* Active Chat Header */}
              <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-emerald-600/20">
                    {activeLead.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-extrabold text-sm text-slate-100">{activeLead.name}</h3>
                      {activeLead.nickname && (
                        <span className="text-[10px] bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded-md">
                          "{activeLead.nickname}"
                        </span>
                      )}
                      {activeLead.isInadimplente && (
                        <span className="text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-md font-bold">
                          Inadimplente R$ {activeLead.valorInadimplente?.toLocaleString('pt-BR')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="font-mono text-emerald-400 font-bold">{activeLead.phone}</span>
                      <span>•</span>
                      <span>Valor: R$ {activeLead.value.toLocaleString('pt-BR')}</span>
                      <span>•</span>
                      <span className="text-slate-400">Origem: {activeLead.source}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Stage Dropdown */}
                <div className="flex items-center space-x-2">
                  <div className="text-right hidden sm:block">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Etapa no Funil</span>
                    <select
                      value={activeLead.stage}
                      onChange={(e) => handleStageChange(e.target.value)}
                      className="bg-slate-800 text-slate-100 border border-slate-700 text-xs font-bold px-2.5 py-1 rounded-lg focus:outline-none focus:border-emerald-500"
                    >
                      {stages.map(stg => (
                        <option key={stg.id} value={stg.id}>
                          {stg.label} ({stg.layer ? stg.layer.toUpperCase() : 'TOPO'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Chat Timeline History Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#e5ddd5]/30 dark:bg-slate-950/40">
                {/* Information Banner */}
                <div className="text-center my-2">
                  <span className="bg-amber-100/90 text-amber-900 border border-amber-200/60 text-[10px] font-semibold px-3 py-1 rounded-full shadow-xs inline-flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3 text-amber-600" />
                    <span>Todas as mensagens enviadas ficam registradas no histórico do CRM automaticamente.</span>
                  </span>
                </div>

                {activeLead.notes && activeLead.notes.length > 0 ? (
                  activeLead.notes.map((note) => {
                    const isWhatsApp = note.type === "whatsapp_sent";
                    const isStageChange = note.type === "stage_changed";

                    if (isStageChange) {
                      return (
                        <div key={note.id} className="text-center my-1.5">
                          <span className="bg-slate-200/80 text-slate-600 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                            🔄 {note.content}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={note.id}
                        className={`flex flex-col max-w-[85%] ${
                          isWhatsApp ? "ml-auto items-end" : "mr-auto items-start"
                        }`}
                      >
                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed shadow-xs font-sans whitespace-pre-wrap ${
                            isWhatsApp
                              ? "bg-emerald-700 text-white rounded-tr-none"
                              : "bg-white text-slate-800 border border-slate-200/70 rounded-tl-none"
                          }`}
                        >
                          {note.content.replace("[Envio WhatsApp Central]: ", "")}

                          <div className="flex items-center justify-end space-x-1 mt-1 text-[9px] opacity-75 font-mono">
                            <span>
                              {new Date(note.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {isWhatsApp && <CheckCheck className="w-3 h-3 text-emerald-200" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    Nenhuma mensagem anterior no histórico. Escolha um modelo abaixo para iniciar o contato!
                  </div>
                )}
              </div>

              {/* Templates Selector Carousel / Dropdown Bar */}
              <div className="p-3 bg-slate-100 border-t border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Modelos WhatsApp (Camada: {activeLeadLayer.toUpperCase()})</span>
                  </div>

                  {onNavigateToTemplates && (
                    <button
                      onClick={onNavigateToTemplates}
                      className="text-[10px] text-emerald-700 font-bold hover:underline flex items-center space-x-1"
                    >
                      <span>Gerenciar Modelos</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Template Pills Carousel */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-thin">
                  {relevantTemplates.length > 0 ? (
                    relevantTemplates.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setComposerText(t.message)}
                        className="bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer"
                        title="Clique para carregar este modelo no texto"
                      >
                        <Zap className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span className="truncate max-w-[200px]">{t.name}</span>
                      </button>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">
                      Nenhum modelo cadastrado especificamente para a etapa {activeLeadStage?.label}.
                    </span>
                  )}
                </div>
              </div>

              {/* Chat Composer Input Bar */}
              <div className="p-3 bg-white border-t border-slate-200 flex items-end space-x-2">
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:border-emerald-500 focus-within:bg-white transition-all">
                  <textarea
                    rows={2}
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    placeholder={`Escreva uma mensagem ou escolha um modelo para ${activeLead.name}...`}
                    className="w-full bg-transparent text-xs text-slate-800 focus:outline-none resize-none font-sans"
                  />
                  
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100/60 text-[10px] text-slate-400">
                    <span>
                      Variáveis como <code className="text-emerald-600 font-bold">{"{nome}"}</code> serão substituídas automaticamente.
                    </span>
                    <span>{composerText.length} caracteres</span>
                  </div>
                </div>

                <button
                  onClick={() => handleSendMessage()}
                  disabled={isSending || !composerText.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold p-3.5 rounded-2xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center shrink-0 active:scale-95 cursor-pointer h-12 w-12"
                  title="Enviar mensagem pelo WhatsApp"
                >
                  {isSending ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>

            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageSquare className="w-12 h-12 text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-600">Nenhum lead selecionado</p>
              <p className="text-xs text-slate-400">Selecione um contato à esquerda para conversar.</p>
            </div>
          )}

        </div>

      </div>

      {/* QR Code Status Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <QrCode className="w-6 h-6 text-emerald-600" />
                <h3 className="font-extrabold text-slate-800 text-sm">Status da Conexão WhatsApp</h3>
              </div>
              <button onClick={() => setShowQrModal(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">
                ✕
              </button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center space-x-3 text-emerald-900 text-xs">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <strong className="block font-bold">Instância WhatsApp Ativa & Pronta!</strong>
                <span>Disparos automáticos com suporte a deep-link e WhatsApp Web nativo do navegador.</span>
              </div>
            </div>

            <div className="text-center space-y-2">
              <div className="w-48 h-48 mx-auto bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center p-3">
                <QrCode className="w-28 h-28 text-slate-800" />
                <span className="text-[10px] font-mono text-slate-500 mt-2">Dispositivo Vinculado</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Seu navegador e WhatsApp App estão prontos para enviar mensagens sem precisar de APIs pagas de terceiros.
              </p>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
