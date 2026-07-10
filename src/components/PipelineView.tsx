import React, { useState } from "react";
import { 
  Plus, Search, Building2, DollarSign, Filter, ChevronRight, ChevronLeft, 
  Phone, GripVertical, Settings, Trash2, ArrowUp, ArrowDown, Check, 
  RefreshCw, X, Sliders, Layers, Eye, EyeOff, Sparkles 
} from "lucide-react";
import { Lead, LeadStage, PipelineStage } from "../types";
import VisualFunnel from "./VisualFunnel";

interface PipelineViewProps {
  leads: Lead[];
  stages: PipelineStage[];
  onLeadClick: (lead: Lead) => void;
  onAddLeadClick: () => void;
  onMoveLead: (leadId: string, newStage: LeadStage) => void;
  onWhatsAppDirectClick: (lead: Lead) => void;
  onRefreshData: () => Promise<void>;
}

const COLOR_PRESETS = [
  { id: "slate", label: "Cinza", bg: "bg-slate-50", text: "text-slate-800", color: "border-slate-300" },
  { id: "sky", label: "Azul (Info)", bg: "bg-sky-50", text: "text-sky-800", color: "border-sky-300" },
  { id: "indigo", label: "Indigo (Qualificação)", bg: "bg-indigo-50", text: "text-indigo-800", color: "border-indigo-300" },
  { id: "amber", label: "Laranja (Negociação)", bg: "bg-amber-50", text: "text-amber-800", color: "border-amber-300" },
  { id: "purple", label: "Púrpura (Proposta)", bg: "bg-purple-50", text: "text-purple-800", color: "border-purple-300" },
  { id: "emerald", label: "Verde (Sucesso)", bg: "bg-emerald-50", text: "text-emerald-800", color: "border-emerald-300" },
  { id: "rose", label: "Vermelho (Perda)", bg: "bg-rose-50", text: "text-rose-800", color: "border-rose-300" },
];

export default function PipelineView({ 
  leads, 
  stages, 
  onLeadClick, 
  onAddLeadClick, 
  onMoveLead, 
  onWhatsAppDirectClick, 
  onRefreshData 
}: PipelineViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSource, setSelectedSource] = useState("all");
  const [activeDragColumn, setActiveDragColumn] = useState<string | null>(null);
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);

  // Funnel tabs and graphic visibility
  const [activeFunnelTab, setActiveFunnelTab] = useState<"conventional" | "inverted">("conventional");
  const [showVisualFunnel, setShowVisualFunnel] = useState(true);

  // Funnel settings state
  const [showSettings, setShowSettings] = useState(false);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [editingColor, setEditingColor] = useState("slate");
  const [editingFunnelType, setEditingFunnelType] = useState<"conventional" | "inverted">("conventional");
  const [newStageLabel, setNewStageLabel] = useState("");
  const [newStageColor, setNewStageColor] = useState("slate");
  const [newStageFunnelType, setNewStageFunnelType] = useState<"conventional" | "inverted">("conventional");
  const [isOperating, setIsOperating] = useState(false);

  // Get unique lead sources for filter
  const sources = ["all", ...Array.from(new Set(leads.map((l) => l.source)))];

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.nickname && lead.nickname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSource = selectedSource === "all" || lead.source === selectedSource;
    return matchesSearch && matchesSource;
  });

  // Get active stages for the selected funnel tab
  const activeStages = stages.filter(s => (s.funnelType || "conventional") === activeFunnelTab);

  // Calculate statistics per stage
  const getStageStats = (stageId: string) => {
    const stageLeads = filteredLeads.filter((l) => l.stage === stageId);
    const count = stageLeads.length;
    const value = stageLeads.reduce((acc, curr) => acc + curr.value, 0);
    return { count, value };
  };

  const handleMove = (e: React.MouseEvent, leadId: string, currentStage: LeadStage, direction: "left" | "right") => {
    e.stopPropagation(); // Prevent opening modal
    const currentIndex = activeStages.findIndex((s) => s.id === currentStage);
    let nextIndex = currentIndex;
    
    if (direction === "left" && currentIndex > 0) {
      nextIndex = currentIndex - 1;
    } else if (direction === "right" && currentIndex < activeStages.length - 1) {
      nextIndex = currentIndex + 1;
    }
    
    if (nextIndex !== currentIndex) {
      onMoveLead(leadId, activeStages[nextIndex].id);
    }
  };

  // HTML5 Drag and Drop Handlers
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

  const handleDragLeave = () => {
    setActiveDragColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("text/plain") || draggingLeadId;
    if (leadId) {
      const lead = leads.find(l => l.id === leadId);
      if (lead && lead.stage !== targetStage) {
        onMoveLead(leadId, targetStage);
      }
    }
    setActiveDragColumn(null);
    setDraggingLeadId(null);
  };

  // Stage Management Handlers
  const handleAddStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageLabel.trim()) return;
    setIsOperating(true);
    try {
      const selectedPreset = COLOR_PRESETS.find(p => p.id === newStageColor) || COLOR_PRESETS[0];
      const res = await fetch("/api/stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: newStageLabel,
          bg: selectedPreset.bg,
          text: selectedPreset.text,
          color: selectedPreset.color,
          funnelType: newStageFunnelType
        })
      });
      if (res.ok) {
        setNewStageLabel("");
        await onRefreshData();
      }
    } catch (err) {
      console.error("Erro ao adicionar etapa:", err);
    } finally {
      setIsOperating(false);
    }
  };

  const handleUpdateStage = async (id: string, label: string, colorPresetId: string, fType: "conventional" | "inverted") => {
    setIsOperating(true);
    try {
      const selectedPreset = COLOR_PRESETS.find(p => p.id === colorPresetId) || COLOR_PRESETS[0];
      const res = await fetch(`/api/stages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          bg: selectedPreset.bg,
          text: selectedPreset.text,
          color: selectedPreset.color,
          funnelType: fType
        })
      });
      if (res.ok) {
        setEditingStageId(null);
        await onRefreshData();
      }
    } catch (err) {
      console.error("Erro ao atualizar etapa:", err);
    } finally {
      setIsOperating(false);
    }
  };

  const handleDeleteStage = async (id: string) => {
    const stageLeadsCount = leads.filter(l => l.stage === id).length;
    let confirmMsg = "Tem certeza que deseja excluir esta etapa?";
    if (stageLeadsCount > 0) {
      confirmMsg = `Esta etapa possui ${stageLeadsCount} lead(s). Ao excluí-la, todos eles serão migrados automaticamente para a primeira etapa disponível do funil. Deseja prosseguir?`;
    }
    if (!window.confirm(confirmMsg)) return;

    setIsOperating(true);
    try {
      const res = await fetch(`/api/stages/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        await onRefreshData();
      }
    } catch (err) {
      console.error("Erro ao excluir etapa:", err);
    } finally {
      setIsOperating(false);
    }
  };

  const handleMoveStageOrder = async (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === stages.length - 1) return;

    const newStages = [...stages];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    
    // Swap
    const temp = newStages[index];
    newStages[index] = newStages[targetIndex];
    newStages[targetIndex] = temp;

    setIsOperating(true);
    try {
      const res = await fetch("/api/stages/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageIds: newStages.map(s => s.id)
        })
      });
      if (res.ok) {
        await onRefreshData();
      }
    } catch (err) {
      console.error("Erro ao reordenar etapas:", err);
    } finally {
      setIsOperating(false);
    }
  };

  const handleResetPreset = async (preset: "conventional" | "inverted") => {
    const confirmMsg = `Deseja alternar para o ${preset === "conventional" ? "Funil Comercial Convencional" : "Funil Invertido (Pós-Venda)"}? Isso irá reorganizar as etapas do seu CRM e re-locar os leads existentes. Deseja prosseguir?`;
    if (!window.confirm(confirmMsg)) return;

    setIsOperating(true);
    try {
      const res = await fetch("/api/stages/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preset })
      });
      if (res.ok) {
        await onRefreshData();
      }
    } catch (err) {
      console.error("Erro ao redefinir etapas:", err);
    } finally {
      setIsOperating(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Funnel Tabs Selection */}
      <div className="bg-slate-900 p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg border border-slate-800">
        <div className="flex bg-slate-950/80 p-1.5 rounded-xl border border-slate-800/80 self-start sm:self-auto space-x-1">
          <button
            onClick={() => setActiveFunnelTab("conventional")}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeFunnelTab === "conventional"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Funil de Vendas (Comercial)</span>
            <span className="bg-slate-900/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/5">
              {leads.filter(l => stages.filter(s => (s.funnelType || "conventional") === "conventional").some(s => s.id === l.stage)).length}
            </span>
          </button>
          
          <button
            onClick={() => setActiveFunnelTab("inverted")}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeFunnelTab === "inverted"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/15"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Funil Invertido (Pós-Venda)</span>
            <span className="bg-slate-900/50 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/5">
              {leads.filter(l => stages.filter(s => s.funnelType === "inverted").some(s => s.id === l.stage)).length}
            </span>
          </button>
        </div>

        {/* Toggle Funnel graphic visualization button */}
        <button
          onClick={() => setShowVisualFunnel(!showVisualFunnel)}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-xs font-bold active:scale-95 cursor-pointer self-end sm:self-auto"
        >
          {showVisualFunnel ? (
            <>
              <EyeOff className="w-3.5 h-3.5 text-rose-400" />
              <span>Ocultar Gráfico do Funil</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>Visualizar Gráfico do Funil</span>
            </>
          )}
        </button>
      </div>

      {/* Symmetrical Hourglass / Symmetrical Trapezoid Graphic Funnel Section */}
      {showVisualFunnel && (
        <div className="transition-all duration-300">
          <VisualFunnel 
            leads={leads} 
            stages={stages} 
            funnelType={activeFunnelTab} 
            onStageClick={(stageId) => {
              const columnEl = document.getElementById(`kanban-col-${stageId}`);
              if (columnEl) {
                columnEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
                columnEl.classList.add("ring-4", "ring-amber-500/50");
                setTimeout(() => {
                  columnEl.classList.remove("ring-4", "ring-amber-500/50");
                }, 1500);
              }
            }} 
          />
        </div>
      )}
      
      {/* Header Filters & Add Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome, apelido ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50"
            />
          </div>

          {/* Source Filter */}
          <div className="relative">
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full sm:w-48 pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white appearance-none cursor-pointer"
            >
              <option value="all">Todas as Origens</option>
              {sources.filter(s => s !== "all").map((src) => (
                <option key={src} value={src}>{src}</option>
              ))}
            </select>
            <span className="absolute right-3 top-3 pointer-events-none text-slate-400">
              <Filter className="w-3.5 h-3.5" />
            </span>
          </div>

        </div>

        <div className="flex items-center gap-2">
          {/* Customize Funnel Stage Button */}
          <button
            onClick={() => setShowSettings(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center space-x-1.5 active:scale-95 cursor-pointer"
            title="Configurar etapas do funil"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>Personalizar Funil</span>
          </button>

          <button
            onClick={onAddLeadClick}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/10 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Lead</span>
          </button>
        </div>
      </div>

      {/* Kanban Pipeline Stage columns */}
      <div className="flex space-x-4 overflow-x-auto pb-6 snap-x scroll-smooth min-h-[68vh]">
        {activeStages.map((col) => {
          const { count, value } = getStageStats(col.id);
          const colLeads = filteredLeads.filter((l) => l.stage === col.id);

          return (
            <div
              key={col.id}
              id={`kanban-col-${col.id}`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`w-80 shrink-0 flex flex-col rounded-2xl border p-3 snap-start transition-all duration-300 ${
                activeDragColumn === col.id
                  ? "bg-emerald-50/60 border-dashed border-emerald-400 shadow-inner scale-[1.01]"
                  : "bg-slate-50 border-slate-100"
              }`}
            >
              
              {/* Column Header */}
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center space-x-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    col.id === 'won' || col.id.includes('retention') || col.id.includes('referral') 
                      ? 'bg-emerald-500' 
                      : col.id === 'lost' 
                      ? 'bg-rose-500' 
                      : 'bg-indigo-400'
                  }`} />
                  <h3 className="font-bold text-slate-800 text-sm tracking-wide">{col.label}</h3>
                </div>
                <span className="text-xs bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
                  {count}
                </span>
              </div>

              {/* Column Financial Value */}
              <div className="mb-4 bg-white border border-slate-100 rounded-xl p-2.5 flex items-center justify-between shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subtotal</span>
                <span className="text-xs font-extrabold text-slate-700 font-mono">
                  R$ {value.toLocaleString('pt-BR')}
                </span>
              </div>

              {/* Column Cards List */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[55vh] pr-1">
                {colLeads.length > 0 ? (
                  colLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => onLeadClick(lead)}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onDragEnd={handleDragEnd}
                      className={`group bg-white p-3.5 rounded-xl border hover:border-emerald-400 hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing relative select-none ${
                        draggingLeadId === lead.id
                          ? "opacity-40 border-dashed border-slate-300 shadow-none scale-95"
                          : "border-slate-200/80 shadow-xs"
                      }`}
                    >
                      <div className="flex flex-col space-y-2">
                        {/* Source Tag & Quick Phone indicator */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400 transition-colors shrink-0 cursor-grab" />
                            <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md uppercase">
                              {lead.source}
                            </span>
                          </div>
                          {lead.phone && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onWhatsAppDirectClick(lead);
                              }}
                              className="text-[9px] bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white px-2 py-0.5 rounded-md font-bold flex items-center space-x-1 transition-all border border-emerald-200/50 active:scale-95 cursor-pointer shrink-0"
                              title="Enviar WhatsApp Instantâneo (1 Clique)"
                            >
                              <Phone className="w-2.5 h-2.5 shrink-0" />
                              <span>⚡ WhatsApp</span>
                            </button>
                          )}
                        </div>

                        {/* Name and Company */}
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs leading-snug group-hover:text-emerald-700 transition-colors">
                            {lead.name}
                          </h4>
                          {lead.nickname && (
                            <p className="text-[10px] text-slate-400 font-medium flex items-center mt-0.5">
                              <Sparkles className="w-3 h-3 mr-1 text-slate-300" />
                              <span>{lead.nickname}</span>
                            </p>
                          )}
                        </div>

                        {/* Value & Movement Controls (Touch/Mobile Friendly Quick Shifting) */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100/50 mt-1">
                          <span className="text-xs font-bold text-emerald-600 font-mono">
                            R$ {lead.value.toLocaleString('pt-BR')}
                          </span>

                          {/* Easy Chevrons to move deals */}
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={(e) => handleMove(e, lead.id, lead.stage, "left")}
                              disabled={col.id === stages[0]?.id}
                              className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 rounded-md transition-all"
                              title="Mover para esquerda"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleMove(e, lead.id, lead.stage, "right")}
                              disabled={col.id === stages[stages.length - 1]?.id}
                              className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 rounded-md transition-all"
                              title="Mover para direita"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-slate-100/30">
                    Nenhum lead nesta etapa
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Stage Settings Overlay Drawer Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in duration-200 flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm">Personalizar Etapas do Funil</h3>
                  <p className="text-[10px] text-slate-400">Configure etapas dinâmicas, ordens e alterne entre presets convencionais e pós-venda</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSettings(false)} 
                className="text-slate-400 hover:text-white transition-colors"
                disabled={isOperating}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Presets Toggle Area */}
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-4">
                <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center space-x-1">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Configurações Rápidas de Modelo (Preset)</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  
                  {/* Conventional Preset Button */}
                  <button
                    type="button"
                    onClick={() => handleResetPreset("conventional")}
                    disabled={isOperating}
                    className="bg-white hover:bg-indigo-50/40 p-3.5 border border-slate-200 rounded-xl text-left transition-all hover:border-indigo-300 focus:outline-none flex flex-col justify-between active:scale-[0.99]"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-800 block mb-1">Funil de Vendas Convencional</span>
                      <p className="text-[10px] text-slate-400 leading-snug">Modelo de captação clássico (Prospect, Em Contato, Qualificado, Proposta, Negociação, Ganho, Perdido).</p>
                    </div>
                    <span className="text-[10px] text-indigo-600 font-extrabold flex items-center mt-3">
                      <span>Aplicar este preset</span>
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </span>
                  </button>

                  {/* Inverted Funnel Preset Button */}
                  <button
                    type="button"
                    onClick={() => handleResetPreset("inverted")}
                    disabled={isOperating}
                    className="bg-white hover:bg-emerald-50/40 p-3.5 border border-slate-200 rounded-xl text-left transition-all hover:border-emerald-300 focus:outline-none flex flex-col justify-between active:scale-[0.99]"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-800 block mb-1">Funil Invertido (Pós-Venda)</span>
                      <p className="text-[10px] text-slate-400 leading-snug">Otimizado para retenção e satisfação pós-fechamento (Onboarding, Ativação, Retenção, Expansão, Indicação).</p>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-extrabold flex items-center mt-3">
                      <span>Aplicar este preset</span>
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </span>
                  </button>

                </div>
              </div>

               {/* Create New Stage Form */}
              <form onSubmit={handleAddStage} className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Adicionar Nova Etapa ao Funil</span>
                </h4>
                
                <div className="flex flex-col sm:flex-row gap-2.5 items-end">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nome da Etapa</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Em Negociação, Reunião Agendada..."
                      value={newStageLabel}
                      onChange={(e) => setNewStageLabel(e.target.value)}
                      disabled={isOperating}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white"
                    />
                  </div>

                  <div className="w-full sm:w-36">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tipo de Funil</label>
                    <select
                      value={newStageFunnelType}
                      onChange={(e) => setNewStageFunnelType(e.target.value as "conventional" | "inverted")}
                      disabled={isOperating}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white"
                    >
                      <option value="conventional">Comercial</option>
                      <option value="inverted">Pós-Venda</option>
                    </select>
                  </div>

                  <div className="w-full sm:w-36">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Preset de Cor</label>
                    <select
                      value={newStageColor}
                      onChange={(e) => setNewStageColor(e.target.value)}
                      disabled={isOperating}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white"
                    >
                      {COLOR_PRESETS.map((p) => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isOperating || !newStageLabel.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center justify-center space-x-1 shadow-sm shrink-0 disabled:opacity-50 h-8 active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </button>
                </div>
              </form>

              {/* Current Stages List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Etapas Atuais ({stages.length})</h4>
                
                <div className="divide-y divide-slate-100 border border-slate-150 rounded-xl overflow-hidden bg-white">
                  {stages.map((stg, index) => {
                    const isEditing = editingStageId === stg.id;
                    const stageLeadsCount = leads.filter(l => l.stage === stg.id).length;

                    return (
                      <div key={stg.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 gap-3 hover:bg-slate-50/50 transition-colors">
                        
                        {/* Stage Info/Editor Form */}
                        <div className="flex-1 flex items-center space-x-3 min-w-0">
                          {/* Drag index placeholder & Color capsule indicator */}
                          <div className="flex items-center space-x-1 shrink-0">
                            <span className="text-[10px] font-bold text-slate-400 w-3.5 font-mono">#{index + 1}</span>
                            <span className={`w-3.5 h-3.5 rounded-full ${stg.bg} border ${stg.color} shadow-xs inline-block shrink-0`} />
                          </div>

                          {isEditing ? (
                            <div className="flex-1 flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                required
                                value={editingLabel}
                                onChange={(e) => setEditingLabel(e.target.value)}
                                disabled={isOperating}
                                className="flex-1 px-2.5 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-emerald-500 font-semibold"
                                autoFocus
                              />
                              <select
                                value={editingFunnelType}
                                onChange={(e) => setEditingFunnelType(e.target.value as "conventional" | "inverted")}
                                disabled={isOperating}
                                className="px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-emerald-500 bg-white"
                              >
                                <option value="conventional">Comercial</option>
                                <option value="inverted">Pós-Venda</option>
                              </select>
                              <select
                                value={editingColor}
                                onChange={(e) => setEditingColor(e.target.value)}
                                disabled={isOperating}
                                className="px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-emerald-500 bg-white"
                              >
                                {COLOR_PRESETS.map((p) => (
                                  <option key={p.id} value={p.id}>{p.label}</option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div className="min-w-0 flex items-center space-x-2 flex-wrap gap-y-1">
                              <span className="font-extrabold text-slate-800 text-xs truncate">{stg.label}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase shrink-0 ${
                                (stg.funnelType || "conventional") === "conventional" 
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100/50" 
                                  : "bg-amber-50 text-amber-600 border border-amber-100/50"
                              }`}>
                                {(stg.funnelType || "conventional") === "conventional" ? "Comercial" : "Pós-Venda"}
                              </span>
                              <span className="text-[9px] bg-slate-100 text-slate-500 font-mono px-2 py-0.5 rounded-md uppercase shrink-0">
                                ID: {stg.id}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Stage Action Controls */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          {/* Leads counter tag */}
                          <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2.5 py-1 rounded-full shrink-0">
                            {stageLeadsCount} lead{stageLeadsCount !== 1 ? 's' : ''}
                          </span>

                          <div className="flex items-center space-x-1">
                            {/* Reordering Chevrons */}
                            <button
                              type="button"
                              onClick={() => handleMoveStageOrder(index, "up")}
                              disabled={index === 0 || isOperating}
                              className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 rounded transition-colors"
                              title="Subir Ordem"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveStageOrder(index, "down")}
                              disabled={index === stages.length - 1 || isOperating}
                              className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 rounded transition-colors"
                              title="Descer Ordem"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            {/* Inline edit toggler */}
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStage(stg.id, editingLabel, editingColor, editingFunnelType)}
                                  disabled={isOperating || !editingLabel.trim()}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                  title="Salvar alterações"
                                >
                                  <Check className="w-3.5 h-3.5 font-bold" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingStageId(null)}
                                  disabled={isOperating}
                                  className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                  title="Cancelar"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingStageId(stg.id);
                                  setEditingLabel(stg.label);
                                  setEditingFunnelType(stg.funnelType || "conventional");
                                  // Locate color preset match
                                  const match = COLOR_PRESETS.find(p => p.bg === stg.bg) || COLOR_PRESETS[0];
                                  setEditingColor(match.id);
                                }}
                                disabled={isOperating}
                                className="text-[10px] text-indigo-600 hover:underline font-bold px-1.5 py-1 hover:bg-indigo-50 rounded transition-colors"
                              >
                                Editar
                              </button>
                            )}

                            {/* Delete Stage Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteStage(stg.id)}
                              disabled={isOperating || stages.length <= 1}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors disabled:opacity-20"
                              title="Excluir etapa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 flex items-center justify-between shrink-0">
              <div className="text-[11px] text-slate-400 font-medium font-mono">
                {isOperating ? (
                  <span className="flex items-center text-emerald-600 font-bold animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Salvando no servidor...
                  </span>
                ) : (
                  <span>Status: Pronto</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                disabled={isOperating}
                className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Concluir
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
