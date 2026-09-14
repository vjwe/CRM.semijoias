import React, { useState } from "react";
import { 
  AlertTriangle, TrendingDown, Clock, CheckCircle2, MessageSquare, 
  ExternalLink, Calendar, ChevronRight, ChevronLeft, ArrowRightLeft, 
  DollarSign, GripVertical, Plus, Search, Filter, Phone, Sparkles, 
  X, Check, ShieldAlert, Award
} from "lucide-react";
import { Lead, MessageTemplate } from "../types";
import { getWhatsAppUrl, WhatsAppMode } from "../utils/whatsapp";

interface DelinquentsViewProps {
  leads: Lead[];
  templates: MessageTemplate[];
  onSelectLead: (lead: Lead) => void;
  onUpdateLead: (updated: Lead) => void;
  onRefreshData?: () => Promise<void>;
}

export const COBRANCA_STAGES = [
  { 
    id: "friendly", 
    label: "1. Lembrete Amigável 🌸", 
    color: "border-sky-300 bg-sky-50 text-sky-800", 
    barColor: "bg-sky-500",
    text: "Atrasos recentes (1 a 10 dias). Mensagem leve e orientativa sobre acerto do mostruário." 
  },
  { 
    id: "active", 
    label: "2. Cobrança Ativa ⚠️", 
    color: "border-amber-300 bg-amber-50 text-amber-800", 
    barColor: "bg-amber-500",
    text: "Atrasos de 11 a 30 dias. Contato firme cobrando acerto financeiro ou devolução das peças." 
  },
  { 
    id: "negotiation", 
    label: "3. Negociação & Acordo 🤝", 
    color: "border-indigo-300 bg-indigo-50 text-indigo-800", 
    barColor: "bg-indigo-500",
    text: "Propostas de parcelamento via Pix/Cartão e promessas formais de pagamento." 
  },
  { 
    id: "legal", 
    label: "4. Notificação Extrajudicial 🚨", 
    color: "border-rose-400 bg-rose-50 text-rose-800", 
    barColor: "bg-rose-500",
    text: "Inadimplência grave (>30 dias). Envio de notificação formal ou negativação." 
  },
  {
    id: "recovered",
    label: "5. Recuperado / Quitado 🎉",
    color: "border-emerald-300 bg-emerald-50 text-emerald-800",
    barColor: "bg-emerald-500",
    text: "Débito quitado com sucesso! Revendedora recuperada para a carteira de vendas."
  }
];

export default function DelinquentsView({ leads, templates, onSelectLead, onUpdateLead, onRefreshData }: DelinquentsViewProps) {
  const [movingLeadId, setMovingLeadId] = useState<string | null>(null);
  const [selectedTemplateForLead, setSelectedTemplateForLead] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [delayFilter, setDelayFilter] = useState<"all" | "recent" | "medium" | "critical">("all");
  const [activeDragColumn, setActiveDragColumn] = useState<string | null>(null);
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);

  // Quick Promise Modal
  const [promiseModalLead, setPromiseModalLead] = useState<Lead | null>(null);
  const [promiseDate, setPromiseDate] = useState("");
  const [promiseValue, setPromiseValue] = useState("");

  // Add Delinquent Modal
  const [showAddDelinquentModal, setShowAddDelinquentModal] = useState(false);
  const [selectedLeadToAdd, setSelectedLeadToAdd] = useState("");
  const [debtValueInput, setDebtValueInput] = useState("");
  const [delayDaysInput, setDelayDaysInput] = useState("5");
  const [initialStageInput, setInitialStageInput] = useState("friendly");

  // Filter leads strictly marked as delinquent
  const delinquentLeads = leads.filter(l => l.isInadimplente === true || l.targetModule === "delinquents");

  // Search and delay filtering
  const filteredDelinquents = delinquentLeads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.nickname && lead.nickname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.phone && lead.phone.includes(searchTerm));

    const delay = lead.diasAtraso || 0;
    let matchesDelay = true;
    if (delayFilter === "recent") matchesDelay = delay <= 10;
    if (delayFilter === "medium") matchesDelay = delay > 10 && delay <= 30;
    if (delayFilter === "critical") matchesDelay = delay > 30;

    return matchesSearch && matchesDelay;
  });

  // Financial statistics
  const totalDebt = delinquentLeads
    .filter(l => (l.statusCobranca || "friendly") !== "recovered")
    .reduce((sum, curr) => sum + (curr.valorInadimplente || curr.value || 0), 0);

  const totalCount = delinquentLeads.filter(l => (l.statusCobranca || "friendly") !== "recovered").length;
  
  const avgDelay = totalCount > 0 
    ? Math.round(delinquentLeads.filter(l => (l.statusCobranca || "friendly") !== "recovered").reduce((sum, curr) => sum + (curr.diasAtraso || 0), 0) / totalCount)
    : 0;

  const inNegotiationCount = delinquentLeads.filter(l => l.statusCobranca === "negotiation").length;
  const recoveredCount = delinquentLeads.filter(l => l.statusCobranca === "recovered").length;
  const recoveredValue = delinquentLeads
    .filter(l => l.statusCobranca === "recovered")
    .reduce((sum, curr) => sum + (curr.valorInadimplente || curr.value || 0), 0);

  // Filter templates related to collection/billing
  const collectionTemplates = templates.filter(t => 
    t.category === "other" || 
    t.name.toLowerCase().includes("cobrança") ||
    t.name.toLowerCase().includes("lembrete") ||
    t.name.toLowerCase().includes("acordo")
  );

  const handleStageChange = async (lead: Lead, newStage: string) => {
    setMovingLeadId(lead.id);
    try {
      const isRecovered = newStage === "recovered";
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statusCobranca: newStage,
          isInadimplente: !isRecovered
        })
      });
      if (response.ok) {
        const updated = await response.json();
        onUpdateLead(updated);
        if (onRefreshData) await onRefreshData();
      }
    } catch (err) {
      console.error("Erro ao mover cliente no funil de cobrança:", err);
    } finally {
      setMovingLeadId(null);
    }
  };

  const handleQuickMove = async (e: React.MouseEvent, lead: Lead, direction: "left" | "right") => {
    e.stopPropagation();
    const current = lead.statusCobranca || "friendly";
    const currentIndex = COBRANCA_STAGES.findIndex(s => s.id === current);
    let nextIndex = currentIndex;

    if (direction === "left" && currentIndex > 0) nextIndex = currentIndex - 1;
    if (direction === "right" && currentIndex < COBRANCA_STAGES.length - 1) nextIndex = currentIndex + 1;

    if (nextIndex !== currentIndex) {
      await handleStageChange(lead, COBRANCA_STAGES[nextIndex].id);
    }
  };

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("text/plain", leadId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingLeadId(leadId);
  };

  const handleDragEnd = () => {
    setDraggingLeadId(null);
    setActiveDragColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("text/plain") || draggingLeadId;
    if (leadId) {
      const lead = leads.find(l => l.id === leadId);
      if (lead && (lead.statusCobranca || "friendly") !== stageId) {
        await handleStageChange(lead, stageId);
      }
    }
    setActiveDragColumn(null);
    setDraggingLeadId(null);
  };

  const handleSavePromise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promiseModalLead) return;

    try {
      const response = await fetch(`/api/leads/${promiseModalLead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statusCobranca: "negotiation",
          promessaPagamentoData: promiseDate,
          promessaPagamentoValor: Number(promiseValue) || promiseModalLead.valorInadimplente,
          notes: `${promiseModalLead.notes || ""}\n[Acordo Registrado]: Promessa de pagamento de R$ ${promiseValue} em ${promiseDate}`
        })
      });
      if (response.ok) {
        const updated = await response.json();
        onUpdateLead(updated);
        setPromiseModalLead(null);
        setPromiseDate("");
        setPromiseValue("");
        if (onRefreshData) await onRefreshData();
      }
    } catch (err) {
      console.error("Erro ao salvar promessa de pagamento:", err);
    }
  };

  const handleAddDelinquentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadToAdd) return;

    const lead = leads.find(l => l.id === selectedLeadToAdd);
    if (!lead) return;

    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isInadimplente: true,
          statusCobranca: initialStageInput,
          valorInadimplente: Number(debtValueInput) || lead.value || 500,
          diasAtraso: Number(delayDaysInput) || 5
        })
      });
      if (response.ok) {
        const updated = await response.json();
        onUpdateLead(updated);
        setShowAddDelinquentModal(false);
        setSelectedLeadToAdd("");
        setDebtValueInput("");
        if (onRefreshData) await onRefreshData();
      }
    } catch (err) {
      console.error("Erro ao registrar inadimplência:", err);
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
      const debtVal = (lead.valorInadimplente || lead.value || 0).toLocaleString('pt-BR');
      const stage = lead.statusCobranca || "friendly";

      if (stage === "friendly") {
        finalMsg = `Olá, ${lead.nickname || lead.name}! Tudo bem? Passando para lembrá-la do acerto referente ao seu mostruário de semijoias no valor de R$ ${debtVal}. Como podemos te ajudar hoje? ✨`;
      } else if (stage === "active") {
        finalMsg = `Oi, ${lead.nickname || lead.name}! Constatamos que o acerto de R$ ${debtVal} está em aberto há ${lead.diasAtraso || 15} dias. Precisamos regularizar seu saldo ou agendar a devolução do mostruário com urgência.`;
      } else if (stage === "negotiation") {
        finalMsg = `Olá, ${lead.nickname || lead.name}! Conforme combinamos sobre o acordo de R$ ${debtVal}, podemos parcelar a sua pendência. Segue a chave Pix para regularização.`;
      } else {
        finalMsg = `NOTIFICAÇÃO: Olá, ${lead.name}. Consta débito pendente de R$ ${debtVal}. Favor entrar em contato urgente hoje para evitar encaminhamento administrativo.`;
      }
    }

    // Save sent message to timeline history
    fetch(`/api/leads/${lead.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        markWhatsAppContact: `[Funil de Cobrança] Mensagem enviada pelo WhatsApp: "${finalMsg.substring(0, 80)}${finalMsg.length > 80 ? '...' : ''}"`
      })
    }).then(res => {
      if (res.ok) return res.json();
    }).then(updated => {
      if (updated) onUpdateLead(updated);
    }).catch(err => console.error(err));

    const savedMode = localStorage.getItem("whatsapp_mode") || "app";
    const whatsappUrl = getWhatsAppUrl(lead.phone, finalMsg, savedMode as WhatsAppMode);
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      
      {/* Funnel Header and KPI Dashboard */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 text-white shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-white">Funil de Cobranças & Recuperação</h2>
                <span className="bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-rose-500/30">
                  {totalCount} Casos Ativos
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Pipeline de recuperação de crédito com régua de cobrança automática, acordos e disparos via WhatsApp.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddDelinquentModal(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 shadow-md shadow-rose-600/20 cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Inserir em Cobrança</span>
            </button>
          </div>
        </div>

        {/* Funnel KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
          
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total em Aberto</span>
            <span className="text-lg font-extrabold text-rose-400 font-mono mt-0.5">
              R$ {totalDebt.toLocaleString('pt-BR')}
            </span>
            <span className="text-[9px] text-slate-400 font-medium mt-1">{totalCount} revendedoras</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Média de Atraso</span>
            <span className="text-lg font-extrabold text-amber-400 font-mono mt-0.5">
              {avgDelay} dias
            </span>
            <span className="text-[9px] text-slate-400 font-medium mt-1">Tempo médio de débito</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Acordos / Promessas</span>
            <span className="text-lg font-extrabold text-indigo-400 font-mono mt-0.5">
              {inNegotiationCount}
            </span>
            <span className="text-[9px] text-indigo-300 font-medium mt-1">Parcelas em andamento</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Valores Recuperados</span>
            <span className="text-lg font-extrabold text-emerald-400 font-mono mt-0.5">
              R$ {recoveredValue.toLocaleString('pt-BR')}
            </span>
            <span className="text-[9px] text-emerald-300 font-medium mt-1">{recoveredCount} débitos quitados</span>
          </div>

        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente em cobrança, telefone ou apelido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-rose-500 focus:bg-white transition-all font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Delay Filter Tabs */}
        <div className="flex items-center space-x-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-bold text-slate-400 mr-1 hidden lg:inline">Atraso:</span>

          <button
            onClick={() => setDelayFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              delayFilter === "all"
                ? "bg-slate-800 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Todos ({delinquentLeads.length})
          </button>

          <button
            onClick={() => setDelayFilter("recent")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              delayFilter === "recent"
                ? "bg-sky-600 text-white shadow-xs"
                : "bg-sky-50 text-sky-700 hover:bg-sky-100"
            }`}
          >
            Até 10 dias
          </button>

          <button
            onClick={() => setDelayFilter("medium")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              delayFilter === "medium"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
          >
            11 a 30 dias
          </button>

          <button
            onClick={() => setDelayFilter("critical")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              delayFilter === "critical"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
          >
            +30 dias (Grave)
          </button>
        </div>

      </div>

      {/* Collection Kanban Pipeline */}
      <div className="flex space-x-4 overflow-x-auto pb-6 snap-x scroll-smooth min-h-[60vh]">
        {COBRANCA_STAGES.map((col) => {
          const colLeads = filteredDelinquents.filter(l => (l.statusCobranca || "friendly") === col.id);
          const colTotal = colLeads.reduce((sum, curr) => sum + (curr.valorInadimplente || curr.value || 0), 0);

          return (
            <div
              key={col.id}
              id={`cobranca-col-${col.id}`}
              onDragOver={(e) => {
                e.preventDefault();
                setActiveDragColumn(col.id);
              }}
              onDragLeave={() => setActiveDragColumn(null)}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`w-80 shrink-0 flex flex-col rounded-2xl border p-3.5 snap-start transition-all duration-300 ${
                activeDragColumn === col.id
                  ? "bg-rose-50/70 border-dashed border-rose-400 shadow-inner scale-[1.01]"
                  : "bg-slate-50 border-slate-200/80"
              }`}
            >
              {/* Stage Header */}
              <div className="flex items-center justify-between mb-1.5 px-1">
                <div className="flex items-center space-x-2 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${col.barColor}`} />
                  <h3 className="font-bold text-slate-800 text-xs truncate">{col.label}</h3>
                </div>
                <span className="text-xs bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full shrink-0 font-mono">
                  {colLeads.length}
                </span>
              </div>

              {/* Stage Description */}
              <p className="text-[10px] text-slate-400 px-1 mb-3 line-clamp-2 leading-relaxed">
                {col.text}
              </p>

              {/* Debt Value Subtotal Pill */}
              <div className="mb-3 bg-white border border-slate-100 rounded-xl p-2.5 flex items-center justify-between shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {col.id === "recovered" ? "Quitado" : "Subtotal Pendente"}
                </span>
                <span className={`text-xs font-extrabold font-mono ${col.id === "recovered" ? "text-emerald-600" : "text-rose-600"}`}>
                  R$ {colTotal.toLocaleString('pt-BR')}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[55vh] pr-1">
                {colLeads.length > 0 ? (
                  colLeads.map((lead) => {
                    const selectedTempId = selectedTemplateForLead[lead.id] || "";
                    const debt = lead.valorInadimplente || lead.value || 0;

                    return (
                      <div
                        key={lead.id}
                        onClick={() => onSelectLead(lead)}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onDragEnd={handleDragEnd}
                        className={`group bg-white p-3.5 rounded-xl border hover:border-rose-300 hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing relative select-none ${
                          draggingLeadId === lead.id
                            ? "opacity-40 border-dashed border-slate-300 shadow-none scale-95"
                            : "border-slate-200/80 shadow-xs"
                        }`}
                      >
                        <div className="flex flex-col space-y-2.5">
                          
                          {/* Top Row: Delay Tag & Quick WhatsApp Button */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1.5">
                              <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400 transition-colors shrink-0" />
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                                (lead.diasAtraso || 0) > 30 
                                  ? "bg-rose-50 text-rose-700 border-rose-200" 
                                  : (lead.diasAtraso || 0) > 10 
                                  ? "bg-amber-50 text-amber-700 border-amber-200" 
                                  : "bg-sky-50 text-sky-700 border-sky-200"
                              }`}>
                                ⏳ {lead.diasAtraso || 0} dias atraso
                              </span>
                            </div>

                            {lead.phone && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickWhatsApp(lead);
                                }}
                                className="text-[9px] bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white px-2 py-0.5 rounded-md font-bold flex items-center space-x-1 transition-all border border-emerald-200/60 active:scale-95 cursor-pointer shrink-0"
                                title="Enviar mensagem de cobrança instantânea"
                              >
                                <MessageSquare className="w-2.5 h-2.5 shrink-0" />
                                <span>Cobrar Zap</span>
                              </button>
                            )}
                          </div>

                          {/* Client Name & Apelido */}
                          <div>
                            <h4 className="font-bold text-slate-800 text-xs leading-snug group-hover:text-rose-700 transition-colors">
                              {lead.name}
                            </h4>
                            {lead.nickname && (
                              <p className="text-[10px] text-slate-400 font-medium flex items-center mt-0.5">
                                <Sparkles className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                                <span>{lead.nickname}</span>
                              </p>
                            )}
                          </div>

                          {/* Debt Summary Pill */}
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-between">
                            <div>
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Débito Mostruário</span>
                              <span className="text-xs font-bold text-rose-600 font-mono">
                                R$ {debt.toLocaleString('pt-BR')}
                              </span>
                            </div>

                            {lead.promessaPagamentoData ? (
                              <div className="text-right">
                                <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-wider block">Acordo Marcado</span>
                                <span className="text-[10px] font-bold text-indigo-700">
                                  📅 {lead.promessaPagamentoData}
                                </span>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPromiseModalLead(lead);
                                  setPromiseValue((lead.valorInadimplente || lead.value || 0).toString());
                                }}
                                className="text-[9px] bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded font-bold cursor-pointer transition-colors"
                              >
                                + Registrar Acordo
                              </button>
                            )}
                          </div>

                          {/* Template selection dropdown */}
                          <div>
                            <select
                              onClick={(e) => e.stopPropagation()}
                              value={selectedTempId}
                              onChange={(e) => setSelectedTemplateForLead(prev => ({ ...prev, [lead.id]: e.target.value }))}
                              className="w-full text-[10px] px-2 py-1 border border-slate-200 rounded-lg focus:outline-none bg-slate-50 font-medium"
                            >
                              <option value="">-- Modelo Cobrança Padrão --</option>
                              {collectionTemplates.map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                            </select>
                          </div>

                          {/* Controls Footer */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1">
                            <div className="flex items-center space-x-1">
                              {col.id !== "recovered" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStageChange(lead, "recovered");
                                  }}
                                  className="text-[9px] bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white px-2 py-0.5 rounded font-bold transition-all border border-emerald-200 cursor-pointer"
                                  title="Marcar dívida como quitada"
                                >
                                  ✓ Quitar Débito
                                </button>
                              )}
                            </div>

                            <div className="flex items-center space-x-1">
                              <button
                                onClick={(e) => handleQuickMove(e, lead, "left")}
                                disabled={col.id === COBRANCA_STAGES[0].id}
                                className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 rounded-md transition-all cursor-pointer"
                                title="Voltar fase"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleQuickMove(e, lead, "right")}
                                disabled={col.id === COBRANCA_STAGES[COBRANCA_STAGES.length - 1].id}
                                className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 rounded-md transition-all cursor-pointer"
                                title="Avançar fase de cobrança"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-32 border-2 border-dashed border-slate-200/70 rounded-xl flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                    <span className="text-xs font-medium">Nenhum caso nesta fase</span>
                    <span className="text-[10px] text-slate-300 mt-0.5">Arraste cards para cá</span>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Register Payment Promise Modal */}
      {promiseModalLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Registrar Acordo / Promessa de Pagamento</h3>
                  <p className="text-[10px] text-slate-400">{promiseModalLead.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setPromiseModalLead(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePromise} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Data Prometida para Pagamento *</label>
                <input
                  type="date"
                  required
                  value={promiseDate}
                  onChange={(e) => setPromiseDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Valor Acordado (R$) *</label>
                <input
                  type="number"
                  required
                  value={promiseValue}
                  onChange={(e) => setPromiseValue(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono font-bold"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setPromiseModalLead(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center space-x-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvar Acordo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Insert Lead into Delinquent Modal */}
      {showAddDelinquentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Inserir Revendedora em Cobrança</h3>
                  <p className="text-[10px] text-slate-400">Selecione uma revendedora para incluir no Funil</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddDelinquentModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDelinquentSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Selecione a Revendedora / Lead *</label>
                <select
                  required
                  value={selectedLeadToAdd}
                  onChange={(e) => {
                    setSelectedLeadToAdd(e.target.value);
                    const sel = leads.find(l => l.id === e.target.value);
                    if (sel) setDebtValueInput(sel.value.toString());
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-rose-500 bg-white font-medium"
                >
                  <option value="">-- Escolha um cliente --</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.name} {l.nickname ? `(${l.nickname})` : ''} - R$ {l.value.toLocaleString('pt-BR')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Valor do Débito em Atraso (R$) *</label>
                <input
                  type="number"
                  required
                  placeholder="Ex: 850"
                  value={debtValueInput}
                  onChange={(e) => setDebtValueInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-rose-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Dias em Atraso</label>
                <input
                  type="number"
                  value={delayDaysInput}
                  onChange={(e) => setDelayDaysInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Etapa Inicial de Cobrança</label>
                <select
                  value={initialStageInput}
                  onChange={(e) => setInitialStageInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-rose-500 bg-white"
                >
                  {COBRANCA_STAGES.filter(s => s.id !== "recovered").map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddDelinquentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!selectedLeadToAdd}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl flex items-center space-x-1.5 shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Inserir no Funil</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
