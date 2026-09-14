import React, { useState } from "react";
import { 
  HeartHandshake, Plus, Search, Filter, Phone, MessageSquare, 
  Sparkles, Star, AlertTriangle, CheckCircle2, ChevronRight, ChevronLeft, 
  GripVertical, UserCheck, TrendingUp, X, Smile, Meh, Frown, Award,
  ArrowRight, Clock, ShieldAlert, Zap
} from "lucide-react";
import { Lead, MessageTemplate } from "../types";

interface PostSalesViewProps {
  leads: Lead[];
  templates: MessageTemplate[];
  onLeadClick: (lead: Lead) => void;
  onUpdateLead: (leadId: string, data: Partial<Lead>) => Promise<void>;
  onWhatsAppDirectClick: (lead: Lead, customMessage?: string) => void;
  onRefreshData: () => Promise<void>;
}

export interface PostSalesStageDef {
  id: string;
  label: string;
  description: string;
  badgeColor: string;
  iconBg: string;
  dotColor: string;
}

export const POST_SALES_STAGES: PostSalesStageDef[] = [
  {
    id: "onboarding",
    label: "Onboarding & Boas-Vindas 🚀",
    description: "Recebimento do catálogo, kit inicial e instruções de revenda",
    badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
    iconBg: "bg-sky-100 text-sky-600",
    dotColor: "bg-sky-500"
  },
  {
    id: "activation",
    label: "Ativação & 1º Acerto 📦",
    description: "Primeiras vendas, uso do mostruário e primeiro acerto financeiro",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    iconBg: "bg-indigo-100 text-indigo-600",
    dotColor: "bg-indigo-500"
  },
  {
    id: "csat",
    label: "Acompanhamento & CSAT ⭐",
    description: "Pesquisa de satisfação, avaliação NPS e suporte de vendas",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    iconBg: "bg-amber-100 text-amber-600",
    dotColor: "bg-amber-500"
  },
  {
    id: "upsell",
    label: "Expansão & Upsell 💎",
    description: "Aumento de limite de mostruário e oferta de novas coleções",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    iconBg: "bg-purple-100 text-purple-600",
    dotColor: "bg-purple-500"
  },
  {
    id: "loyal",
    label: "Fidelizado & Embaixador 👑",
    description: "Revendedora recorrente e atuante no programa de indicações",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    iconBg: "bg-emerald-100 text-emerald-600",
    dotColor: "bg-emerald-500"
  },
  {
    id: "risk",
    label: "Atenção / Risco de Churn ⚠️",
    description: "Sem pedidos ou acertos há mais de 30 dias (campanha de resgate)",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    iconBg: "bg-rose-100 text-rose-600",
    dotColor: "bg-rose-500"
  }
];

export default function PostSalesView({
  leads,
  templates,
  onLeadClick,
  onUpdateLead,
  onWhatsAppDirectClick,
  onRefreshData
}: PostSalesViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [healthFilter, setHealthFilter] = useState<"all" | "healthy" | "warning" | "risk">("all");
  const [activeDragColumn, setActiveDragColumn] = useState<string | null>(null);
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);

  // Quick message modal
  const [selectedLeadForMessage, setSelectedLeadForMessage] = useState<Lead | null>(null);
  const [customMsgText, setCustomMsgText] = useState("");

  // New Post-Sales Client Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newNickname, setNewNickname] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newStage, setNewStage] = useState("onboarding");
  const [newHealth, setNewHealth] = useState<'healthy' | 'warning' | 'risk'>("healthy");
  const [isSaving, setIsSaving] = useState(false);

  // Eligible leads for Post-Sales:
  // Shows ONLY leads explicitly routed or configured for Post-Sales
  const postSalesLeads = leads.filter(l => {
    return l.targetModule === "post_sales" || (!!l.postSalesStage && !l.isInadimplente && l.targetModule !== "delinquents");
  });

  // Filtered
  const filteredLeads = postSalesLeads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.nickname && lead.nickname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.phone && lead.phone.includes(searchTerm)) ||
      (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const currentHealth = lead.postSalesHealth || "healthy";
    const matchesHealth = healthFilter === "all" || currentHealth === healthFilter;

    return matchesSearch && matchesHealth;
  });

  // Calculate Metrics
  const totalClients = postSalesLeads.length;
  const onboardingCount = postSalesLeads.filter(l => (l.postSalesStage || "onboarding") === "onboarding").length;
  const upsellCount = postSalesLeads.filter(l => l.postSalesStage === "upsell").length;
  const loyalCount = postSalesLeads.filter(l => l.postSalesStage === "loyal").length;
  const riskCount = postSalesLeads.filter(l => l.postSalesStage === "risk" || l.postSalesHealth === "risk").length;
  
  const totalLTV = postSalesLeads.reduce((acc, curr) => acc + (curr.value || 0), 0);
  const averageLTV = totalClients > 0 ? totalLTV / totalClients : 0;

  // NPS scores
  const scoredLeads = postSalesLeads.filter(l => typeof l.postSalesNps === "number" && l.postSalesNps >= 0);
  const averageNPS = scoredLeads.length > 0
    ? (scoredLeads.reduce((acc, curr) => acc + (curr.postSalesNps || 0), 0) / scoredLeads.length).toFixed(1)
    : "9.6";

  // Stage move handler
  const handleMoveStage = async (leadId: string, newStageId: string) => {
    try {
      await onUpdateLead(leadId, { postSalesStage: newStageId });
    } catch (err) {
      console.error("Erro ao mover etapa de pós-vendas:", err);
    }
  };

  const handleQuickStep = async (e: React.MouseEvent, lead: Lead, direction: "left" | "right") => {
    e.stopPropagation();
    const currentStageId = lead.postSalesStage || (lead.stage === "won" ? "onboarding" : "onboarding");
    const currentIndex = POST_SALES_STAGES.findIndex(s => s.id === currentStageId);
    let nextIndex = currentIndex;

    if (direction === "left" && currentIndex > 0) {
      nextIndex = currentIndex - 1;
    } else if (direction === "right" && currentIndex < POST_SALES_STAGES.length - 1) {
      nextIndex = currentIndex + 1;
    }

    if (nextIndex !== currentIndex) {
      await handleMoveStage(lead.id, POST_SALES_STAGES[nextIndex].id);
    }
  };

  const handleCycleHealth = async (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    const current = lead.postSalesHealth || "healthy";
    const next: 'healthy' | 'warning' | 'risk' = 
      current === "healthy" ? "warning" : current === "warning" ? "risk" : "healthy";
    
    await onUpdateLead(lead.id, { postSalesHealth: next });
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

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (activeDragColumn !== stageId) {
      setActiveDragColumn(stageId);
    }
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("text/plain") || draggingLeadId;
    if (leadId) {
      const lead = leads.find(l => l.id === leadId);
      if (lead && (lead.postSalesStage || "onboarding") !== stageId) {
        await handleMoveStage(leadId, stageId);
      }
    }
    setActiveDragColumn(null);
    setDraggingLeadId(null);
  };

  // Open Quick WhatsApp with Post-Sales Template
  const handleOpenWhatsAppModal = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    setSelectedLeadForMessage(lead);
    
    // Default template suggestion based on stage
    const currentStage = lead.postSalesStage || "onboarding";
    let defaultMsg = `Olá, ${lead.nickname || lead.name}! Tudo bem? Passando para acompanhar como estão suas vendas e se precisa de alguma reposição de mostruário da nossa coleção! 💎✨`;
    
    if (currentStage === "onboarding") {
      defaultMsg = `Olá, ${lead.nickname || lead.name}! 🎉 Seja muito bem-vinda(o) à nossa equipe de revenda! Seu mostruário inicial foi preparado com muito carinho. Surgiu alguma dúvida sobre os valores ou prazos de acerto? Estamos aqui para te apoiar! ✨`;
    } else if (currentStage === "csat") {
      defaultMsg = `Oi, ${lead.nickname || lead.name}! Tudo bem? Gostaríamos muito de saber como está sendo sua experiência com a nossa linha de semijoias. De 0 a 10, qual nota você daria para a qualidade das peças e nosso atendimento? 💖`;
    } else if (currentStage === "upsell") {
      defaultMsg = `Oi, ${lead.nickname || lead.name}! 💎 Temos uma novidade imperdível: liberamos um aumento de limite para o seu mostruário com as peças da nova coleção de lançamentos. Gostaria que eu separasse para você?`;
    } else if (currentStage === "risk") {
      defaultMsg = `Olá, ${lead.nickname || lead.name}! Sentimos sua falta! ✨ Temos condições especiais de renovação de mostruário e bônus exclusivo para você retomar suas vendas este mês. Vamos conversar?`;
    }

    setCustomMsgText(defaultMsg);
  };

  const handleSendQuickWhatsApp = () => {
    if (!selectedLeadForMessage) return;
    onWhatsAppDirectClick(selectedLeadForMessage, customMsgText);
    setSelectedLeadForMessage(null);
  };

  const handleCreatePostSalesClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          nickname: newNickname || newName.split(" ")[0],
          phone: newPhone,
          email: newEmail,
          value: Number(newValue) || 1500,
          stage: "won",
          source: "Pós-Venda Direto",
          postSalesStage: newStage,
          postSalesHealth: newHealth,
          postSalesNotes: "Cliente cadastrado diretamente na carteira de Pós-Vendas."
        })
      });

      if (response.ok) {
        setShowAddModal(false);
        setNewName("");
        setNewNickname("");
        setNewPhone("");
        setNewEmail("");
        setNewValue("");
        await onRefreshData();
      }
    } catch (err) {
      console.error("Erro ao criar cliente em pós-venda:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const getHealthBadge = (health?: string) => {
    switch (health) {
      case "warning":
        return {
          label: "Atenção",
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          dot: "bg-amber-500",
          icon: Meh
        };
      case "risk":
        return {
          label: "Em Risco",
          bg: "bg-rose-50 text-rose-700 border-rose-200",
          dot: "bg-rose-500",
          icon: Frown
        };
      default:
        return {
          label: "Saudável",
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          dot: "bg-emerald-500",
          icon: Smile
        };
    }
  };

  return (
    <div className="space-y-6">

      {/* Top Header and KPI Cards */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 text-white shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-white">Pós-Vendas & Sucesso do Cliente</h2>
                <span className="bg-pink-500/20 text-pink-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-pink-500/30">
                  {totalClients} Clientes na Carteira
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Acompanhe a retenção, ativação de mostruários, NPS e acelere o crescimento (upsell) de clientes ativos.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 shadow-md shadow-emerald-600/15 cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Cliente Pós-Venda</span>
            </button>
          </div>
        </div>

        {/* Post Sales KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-slate-800/80">
          
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total em Carteira</span>
            <span className="text-lg font-extrabold text-white font-mono mt-0.5">{totalClients}</span>
            <span className="text-[9px] text-emerald-400 font-medium mt-1">Clientes Fechados</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Em Onboarding</span>
            <span className="text-lg font-extrabold text-sky-400 font-mono mt-0.5">{onboardingCount}</span>
            <span className="text-[9px] text-slate-400 font-medium mt-1">Primeiros 15 dias</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Expansão / Upsell</span>
            <span className="text-lg font-extrabold text-purple-400 font-mono mt-0.5">{upsellCount}</span>
            <span className="text-[9px] text-purple-300 font-medium mt-1">Aumento de limite</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fidelizados (VIP)</span>
            <span className="text-lg font-extrabold text-emerald-400 font-mono mt-0.5">{loyalCount}</span>
            <span className="text-[9px] text-emerald-300 font-medium mt-1">Recorrentes / Top</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Satisfação (NPS)</span>
            <span className="text-lg font-extrabold text-amber-400 font-mono mt-0.5">{averageNPS}/10</span>
            <span className="text-[9px] text-amber-300 font-medium mt-1">Zona de Excelência</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Atenção / Risco</span>
            <span className="text-lg font-extrabold text-rose-400 font-mono mt-0.5">{riskCount}</span>
            <span className="text-[9px] text-rose-300 font-medium mt-1">Precisam de resgate</span>
          </div>

        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, apelido, telefone ou e-mail de cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium"
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

        {/* Health Score Filter Pills */}
        <div className="flex items-center space-x-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-bold text-slate-400 mr-1 hidden lg:inline">Saúde:</span>
          
          <button
            onClick={() => setHealthFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              healthFilter === "all"
                ? "bg-slate-800 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Todos ({postSalesLeads.length})
          </button>

          <button
            onClick={() => setHealthFilter("healthy")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
              healthFilter === "healthy"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Saudável</span>
          </button>

          <button
            onClick={() => setHealthFilter("warning")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
              healthFilter === "warning"
                ? "bg-amber-500 text-slate-950 shadow-xs"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Atenção</span>
          </button>

          <button
            onClick={() => setHealthFilter("risk")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
              healthFilter === "risk"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>Em Risco</span>
          </button>
        </div>

      </div>

      {/* Post-Sales Kanban Pipeline */}
      <div className="flex space-x-4 overflow-x-auto pb-6 snap-x scroll-smooth min-h-[60vh]">
        {POST_SALES_STAGES.map((col) => {
          const colLeads = filteredLeads.filter(l => {
            const currentStage = l.postSalesStage || (l.stage === "won" ? "onboarding" : "onboarding");
            return currentStage === col.id;
          });

          const colValue = colLeads.reduce((acc, curr) => acc + (curr.value || 0), 0);

          return (
            <div
              key={col.id}
              id={`postsales-col-${col.id}`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={() => setActiveDragColumn(null)}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`w-80 shrink-0 flex flex-col rounded-2xl border p-3.5 snap-start transition-all duration-300 ${
                activeDragColumn === col.id
                  ? "bg-emerald-50/70 border-dashed border-emerald-400 shadow-inner scale-[1.01]"
                  : "bg-slate-50 border-slate-200/80"
              }`}
            >
              
              {/* Column Header */}
              <div className="flex items-center justify-between mb-1.5 px-1">
                <div className="flex items-center space-x-2 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${col.dotColor}`} />
                  <h3 className="font-bold text-slate-800 text-xs truncate">{col.label}</h3>
                </div>
                <span className="text-xs bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full shrink-0 font-mono">
                  {colLeads.length}
                </span>
              </div>

              {/* Column Description */}
              <p className="text-[10px] text-slate-400 px-1 mb-3 line-clamp-2 leading-relaxed">
                {col.description}
              </p>

              {/* Financial Subtotal Pill */}
              <div className="mb-3 bg-white border border-slate-100 rounded-xl p-2.5 flex items-center justify-between shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Carteira / LTV</span>
                <span className="text-xs font-extrabold text-slate-700 font-mono">
                  R$ {colValue.toLocaleString('pt-BR')}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[55vh] pr-1">
                {colLeads.length > 0 ? (
                  colLeads.map((lead) => {
                    const healthInfo = getHealthBadge(lead.postSalesHealth);
                    const HealthIcon = healthInfo.icon;

                    return (
                      <div
                        key={lead.id}
                        onClick={() => onLeadClick(lead)}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onDragEnd={handleDragEnd}
                        className={`group bg-white p-3.5 rounded-xl border hover:border-pink-300 hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing relative select-none ${
                          draggingLeadId === lead.id
                            ? "opacity-40 border-dashed border-slate-300 shadow-none scale-95"
                            : "border-slate-200/80 shadow-xs"
                        }`}
                      >
                        <div className="flex flex-col space-y-2.5">
                          
                          {/* Top Card Row: Health Button & WhatsApp Quick Trigger */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1.5">
                              <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400 transition-colors shrink-0" />
                              <button
                                onClick={(e) => handleCycleHealth(e, lead)}
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-md border flex items-center space-x-1 transition-all cursor-pointer ${healthInfo.bg}`}
                                title="Clique para alternar saúde (Saudável -> Atenção -> Risco)"
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${healthInfo.dot}`} />
                                <span>{healthInfo.label}</span>
                              </button>
                            </div>

                            {lead.phone && (
                              <button
                                onClick={(e) => handleOpenWhatsAppModal(e, lead)}
                                className="text-[9px] bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white px-2 py-0.5 rounded-md font-bold flex items-center space-x-1 transition-all border border-emerald-200/60 active:scale-95 cursor-pointer shrink-0"
                                title="Enviar mensagem de Pós-Venda no WhatsApp"
                              >
                                <Phone className="w-2.5 h-2.5 shrink-0" />
                                <span>WhatsApp CS</span>
                              </button>
                            )}
                          </div>

                          {/* Client Name & Apelido */}
                          <div>
                            <h4 className="font-bold text-slate-800 text-xs leading-snug group-hover:text-pink-700 transition-colors">
                              {lead.name}
                            </h4>
                            {lead.nickname && (
                              <p className="text-[10px] text-slate-400 font-medium flex items-center mt-0.5">
                                <Sparkles className="w-3 h-3 mr-1 text-pink-400 shrink-0" />
                                <span>{lead.nickname}</span>
                              </p>
                            )}
                          </div>

                          {/* NPS / Satisfaction info if available */}
                          {lead.postSalesNotes && (
                            <p className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 italic line-clamp-2 leading-relaxed">
                              "{lead.postSalesNotes}"
                            </p>
                          )}

                          {/* Bottom Card Controls: Value and Arrows */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-semibold leading-none">Valor/Limite</span>
                              <span className="text-xs font-bold text-emerald-600 font-mono">
                                R$ {(lead.value || 0).toLocaleString('pt-BR')}
                              </span>
                            </div>

                            <div className="flex items-center space-x-1">
                              <button
                                onClick={(e) => handleQuickStep(e, lead, "left")}
                                disabled={col.id === POST_SALES_STAGES[0].id}
                                className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 rounded-md transition-all cursor-pointer"
                                title="Mover para fase anterior"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleQuickStep(e, lead, "right")}
                                disabled={col.id === POST_SALES_STAGES[POST_SALES_STAGES.length - 1].id}
                                className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 rounded-md transition-all cursor-pointer"
                                title="Avançar para próxima fase"
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
                    <span className="text-xs font-medium">Nenhum cliente nesta fase</span>
                    <span className="text-[10px] text-slate-300 mt-0.5">Arraste cards para cá</span>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Quick WhatsApp Message Modal */}
      {selectedLeadForMessage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200">
            
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Enviar WhatsApp Pós-Venda</h3>
                  <p className="text-[10px] text-slate-400">{selectedLeadForMessage.name} ({selectedLeadForMessage.phone})</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLeadForMessage(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Mensagem Personalizada de Atendimento / Acompanhamento:
                </label>
                <textarea
                  rows={5}
                  value={customMsgText}
                  onChange={(e) => setCustomMsgText(e.target.value)}
                  className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-sans leading-relaxed"
                />
              </div>

              {/* Template quick pills */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sugestões Rápidas:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCustomMsgText(`Olá, ${selectedLeadForMessage.nickname || selectedLeadForMessage.name}! 🎉 Seja muito bem-vinda(o)! Como foi a chegada do seu mostruário? Está tudo certinho?`)}
                    className="text-[10px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer font-medium"
                  >
                    🚀 Boas-Vindas
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomMsgText(`Oi, ${selectedLeadForMessage.nickname || selectedLeadForMessage.name}! ✨ Passando para saber como estão as vendas das suas clientes e se precisa de novidades!`)}
                    className="text-[10px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer font-medium"
                  >
                    ⭐ Check-in de Vendas
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomMsgText(`Oi, ${selectedLeadForMessage.nickname || selectedLeadForMessage.name}! 💎 Chegaram peças exclusivas com garantia de fábrica. Quer que eu te envie as fotos para repor seu mostruário?`)}
                    className="text-[10px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer font-medium"
                  >
                    💎 Nova Coleção (Upsell)
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setSelectedLeadForMessage(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSendQuickWhatsApp}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Abrir no WhatsApp Web</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add New Post-Sales Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200">
            
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Adicionar Cliente ao Pós-Vendas</h3>
                  <p className="text-[10px] text-slate-400">Cadastre diretamente uma revendedora ativa ou cliente final</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePostSalesClient} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Mariana Silveira"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Como prefere ser chamada (Apelido)</label>
                  <input
                    type="text"
                    placeholder="Ex: Mari"
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">WhatsApp / Telefone *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 11999998888"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">E-mail (Opcional)</label>
                  <input
                    type="email"
                    placeholder="Ex: mariana@gmail.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Valor do Mostruário / Limite (R$)</label>
                  <input
                    type="number"
                    placeholder="1500"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Fase Inicial no Pós-Venda</label>
                  <select
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    {POST_SALES_STAGES.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Saúde do Cliente</label>
                  <select
                    value={newHealth}
                    onChange={(e) => setNewHealth(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="healthy">🟢 Saudável (Engajado)</option>
                    <option value="warning">🟡 Atenção (Pouco contato)</option>
                    <option value="risk">🔴 Em Risco (Inativo)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isSaving ? "Cadastrando..." : "Cadastrar Cliente"}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
