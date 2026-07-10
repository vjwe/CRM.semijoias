import React, { useState } from "react";
import { AlertTriangle, TrendingDown, Clock, CheckCircle2, MessageSquare, ExternalLink, Calendar, ChevronRight, ChevronLeft, ArrowRightLeft, DollarSign } from "lucide-react";
import { Lead, MessageTemplate } from "../types";
import { getWhatsAppUrl, WhatsAppMode } from "../utils/whatsapp";

interface DelinquentsViewProps {
  leads: Lead[];
  templates: MessageTemplate[];
  onSelectLead: (lead: Lead) => void;
  onUpdateLead: (updated: Lead) => void;
}

const COBRANCA_STAGES = [
  { id: "friendly", label: "Lembrete Amigável", color: "border-sky-400 bg-sky-50 text-sky-800", text: "Lembrete inicial leve para atrasos recentes.", ringColor: "focus:border-sky-400" },
  { id: "active", label: "Cobrança Ativa", color: "border-amber-400 bg-amber-50 text-amber-800", text: "Contato frequente cobrando o mostruário/acerto.", ringColor: "focus:border-amber-400" },
  { id: "negotiation", label: "Acordo / Parcelamento", color: "border-indigo-400 bg-indigo-50 text-indigo-800", text: "Facilitação de saldo e propostas de parcelas.", ringColor: "focus:border-indigo-400" },
  { id: "legal", label: "Cartório / SPC", color: "border-rose-500 bg-rose-50 text-rose-800", text: "Último recurso ou restrição de cadastro.", ringColor: "focus:border-rose-500" }
];

export default function DelinquentsView({ leads, templates, onSelectLead, onUpdateLead }: DelinquentsViewProps) {
  const [movingLeadId, setMovingLeadId] = useState<string | null>(null);
  const [selectedTemplateForLead, setSelectedTemplateForLead] = useState<Record<string, string>>({});

  // Filter leads marked as delinquent
  const delinquentLeads = leads.filter(l => l.isInadimplente);

  // Financial statistics
  const totalDebt = delinquentLeads.reduce((sum, curr) => sum + (curr.valorInadimplente || 0), 0);
  const totalCount = delinquentLeads.length;
  const avgDelay = totalCount > 0 
    ? Math.round(delinquentLeads.reduce((sum, curr) => sum + (curr.diasAtraso || 0), 0) / totalCount)
    : 0;
  const inNegotiationCount = delinquentLeads.filter(l => l.statusCobranca === "negotiation").length;

  // Filter templates related to collection/billing (category: 'other' or names starting with "Cobrança")
  const collectionTemplates = templates.filter(t => 
    t.category === "other" || 
    t.name.toLowerCase().includes("cobrança") ||
    t.name.toLowerCase().includes("lembrete")
  );

  const handleStageChange = async (lead: Lead, newStage: string) => {
    setMovingLeadId(lead.id);
    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statusCobranca: newStage
        })
      });
      if (response.ok) {
        const updated = await response.json();
        onUpdateLead(updated);
      }
    } catch (err) {
      console.error("Erro ao mover cliente inadimplente:", err);
    } finally {
      setMovingLeadId(null);
    }
  };

  const handleQuickWhatsApp = (lead: Lead) => {
    const templateId = selectedTemplateForLead[lead.id];
    let finalMsg = "";

    if (templateId) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        const debtVal = lead.valorInadimplente || lead.value || 0;
        finalMsg = template.message
          .replace(/{nome}/g, lead.name)
          .replace(/{apelido}/g, lead.nickname || lead.name)
          .replace(/{chamado}/g, lead.nickname || lead.name)
          .replace(/{empresa}/g, lead.nickname || "seu mostruário")
          .replace(/{valor}/g, debtVal.toLocaleString('pt-BR'))
          .replace(/{email}/g, lead.email || "")
          .replace(/{dias_atraso}/g, (lead.diasAtraso || 0).toString());
      }
    } else {
      // Default message if no template selected
      finalMsg = `Olá, ${lead.name}! Tudo bem? Passando para conversarmos sobre o acerto pendente das suas semijoias no valor de R$ ${(lead.valorInadimplente || 0).toLocaleString('pt-BR')}. Como podemos facilitar o acerto hoje? ✨`;
    }

    // Save sent message to timeline history
    fetch(`/api/leads/${lead.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        markWhatsAppContact: `[Cobrança] Mensagem enviada pelo WhatsApp: "${finalMsg.substring(0, 80)}${finalMsg.length > 80 ? '...' : ''}"`
      })
    }).then(res => {
      if (res.ok) {
        return res.json();
      }
    }).then(updated => {
      if (updated) onUpdateLead(updated);
    }).catch(err => console.error(err));

    const savedMode = localStorage.getItem("whatsapp_mode") || "app";
    const whatsappUrl = getWhatsAppUrl(lead.phone, finalMsg, savedMode as WhatsAppMode);
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span className="p-1.5 bg-rose-500 rounded-lg text-white">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <span>Gestão de Inadimplentes e Cobrança 💎</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Controle de revendedoras com acertos de semijoias pendentes. Envie mensagens rápidas de cobrança e acompanhe acordos.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-rose-100 rounded-2xl flex items-center space-x-4 shadow-sm">
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Total em Atraso</span>
            <span className="text-lg font-bold text-rose-600">R$ {totalDebt.toLocaleString('pt-BR')}</span>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center space-x-4 shadow-sm">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Revendedoras em Débito</span>
            <span className="text-lg font-bold text-slate-800">{totalCount} ativas</span>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center space-x-4 shadow-sm">
          <div className="p-3 bg-slate-50 rounded-xl text-slate-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Média de Atraso</span>
            <span className="text-lg font-bold text-slate-800">{avgDelay} dias</span>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center space-x-4 shadow-sm">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Acordos / Parcelas</span>
            <span className="text-lg font-bold text-indigo-600">{inNegotiationCount} fechados</span>
          </div>
        </div>
      </div>

      {/* Collection Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
        {COBRANCA_STAGES.map((stage) => {
          const stageLeads = delinquentLeads.filter(l => (l.statusCobranca || "friendly") === stage.id);
          const stageTotal = stageLeads.reduce((sum, curr) => sum + (curr.valorInadimplente || 0), 0);

          return (
            <div 
              key={stage.id} 
              className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3 flex flex-col min-w-[280px] h-[70vh] shrink-0"
            >
              {/* Stage Header */}
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${stage.color}`}>
                    {stage.label}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400 bg-white border border-slate-200/50 px-2 py-0.5 rounded-lg">
                    {stageLeads.length}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Soma devedora</span>
                  <span className="text-sm font-bold text-rose-600">R$ {stageTotal.toLocaleString('pt-BR')}</span>
                </div>
              </div>

              {/* Stage description tooltip/indicator */}
              <p className="text-[10px] text-slate-400 bg-white/70 border border-slate-100 p-1.5 rounded-lg mb-4 leading-tight">
                {stage.text}
              </p>

              {/* Cards Container */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                {stageLeads.length === 0 ? (
                  <div className="h-28 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-center p-4">
                    <span className="text-xs text-slate-400 font-medium">Nenhum cliente nesta fase de cobrança.</span>
                  </div>
                ) : (
                  stageLeads.map((lead) => {
                    const selectedTempId = selectedTemplateForLead[lead.id] || "";
                    
                    return (
                      <div 
                        key={lead.id} 
                        className={`bg-white border-l-4 rounded-xl p-3.5 shadow-sm space-y-3 hover:shadow-md transition-all ${
                          stage.id === "friendly" ? "border-l-sky-400" :
                          stage.id === "active" ? "border-l-amber-500" :
                          stage.id === "negotiation" ? "border-l-indigo-400" :
                          "border-l-rose-600"
                        }`}
                      >
                        {/* Lead Card Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <button 
                              onClick={() => onSelectLead(lead)}
                              className="font-bold text-slate-800 text-xs text-left hover:text-amber-500 hover:underline transition-colors flex items-center space-x-1"
                            >
                              <span>{lead.name}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                            </button>
                            <span className="block text-[10px] text-slate-400 mt-0.5 font-medium">{lead.nickname || "Sem apelido"}</span>
                          </div>
                        </div>

                        {/* Debts Summary Details */}
                        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-lg">
                          <div>
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Dívida</span>
                            <span className="text-xs font-bold text-rose-600">R$ {(lead.valorInadimplente || 0).toLocaleString('pt-BR')}</span>
                          </div>
                          <div>
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Atraso</span>
                            <span className="text-xs font-semibold text-slate-700">{lead.diasAtraso} dias</span>
                          </div>
                        </div>

                        {/* Stage quick shifter dropdown */}
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Mudar Fase Cobrança</label>
                          <select
                            disabled={movingLeadId === lead.id}
                            value={lead.statusCobranca || "friendly"}
                            onChange={(e) => handleStageChange(lead, e.target.value)}
                            className="w-full text-[10px] px-2 py-1 border border-slate-200 rounded-lg focus:outline-none bg-white font-medium"
                          >
                            <option value="friendly">🌸 Lembrete Amigável</option>
                            <option value="active">⚠️ Cobrança Ativa</option>
                            <option value="negotiation">🤝 Acordo / Parcelamento</option>
                            <option value="legal">🚨 Cartório / SPC</option>
                          </select>
                        </div>

                        {/* Cobrança Template Action Selector */}
                        <div className="pt-2 border-t border-slate-100 space-y-2">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Ação Rápida WhatsApp</label>
                            <select
                              value={selectedTempId}
                              onChange={(e) => setSelectedTemplateForLead(prev => ({ ...prev, [lead.id]: e.target.value }))}
                              className="w-full text-[10px] px-2 py-1 border border-slate-200 rounded-lg focus:outline-none bg-slate-50 font-medium"
                            >
                              <option value="">-- Cobrança Padrão --</option>
                              {collectionTemplates.map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                            </select>
                          </div>

                          <button
                            onClick={() => handleQuickWhatsApp(lead)}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition-colors shadow-sm shadow-emerald-500/15"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Enviar Cobrança WhatsApp</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
