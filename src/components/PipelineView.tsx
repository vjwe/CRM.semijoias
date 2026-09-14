import React, { useState } from "react";
import { 
  Plus, Search, Building2, DollarSign, Filter, ChevronRight, ChevronLeft, 
  Phone, GripVertical, Settings, Trash2, ArrowUp, ArrowDown, Check, 
  RefreshCw, X, Sliders, Layers, Eye, EyeOff, Sparkles, TrendingUp
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
  { id: "sky", label: "Azul (Primeiro Contato)", bg: "bg-sky-50", text: "text-sky-800", color: "border-sky-300" },
  { id: "indigo", label: "Indigo (Qualificação)", bg: "bg-indigo-50", text: "text-indigo-800", color: "border-indigo-300" },
  { id: "amber", label: "Laranja (Orçamento / Proposta)", bg: "bg-amber-50", text: "text-amber-800", color: "border-amber-300" },
  { id: "purple", label: "Púrpura (Negociação)", bg: "bg-purple-50", text: "text-purple-800", color: "border-purple-300" },
  { id: "emerald", label: "Verde (Fechamento / Ganho)", bg: "bg-emerald-50", text: "text-emerald-800", color: "border-emerald-300" },
  { id: "rose", label: "Vermelho (Perda / Sem Interesse)", bg: "bg-rose-50", text: "text-rose-800", color: "border-rose-300" },
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

  // Graphic visibility
  const [showVisualFunnel, setShowVisualFunnel] = useState(true);

  // Funnel settings state
  const [showSettings, setShowSettings] = useState(false);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [editingColor, setEditingColor] = useState("slate");

  const [newStageLabel, setNewStageLabel] = useState("");
  const [newStageColor, setNewStageColor] = useState("slate");

  const [isOperating, setIsOperating] = useState(false);

  // Get unique lead sources for filter
  const sources = ["all", ...Array.from(new Set(leads.map((l) => l.source)))];

  // Filter commercial sales stages
  const activeStages = stages.filter(s => (s.funnelType || "conventional") === "conventional");

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.nickname && lead.nickname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSource = selectedSource === "all" || lead.source === selectedSource;
    return matchesSearch && matchesSource;
  });

  // Calculate statistics per stage
  const getStageStats = (stageId: string) => {
    const stageLeads = filteredLeads.filter((l) => l.stage === stageId);
    const count = stageLeads.length;
    const value = stageLeads.reduce((acc, curr) => acc + curr.value, 0);
    return { count, value };
  };

  const totalCommercialPipelineValue = filteredLeads
    .filter(l => activeStages.some(s => s.id === l.stage && s.id !== 'lost'))
    .reduce((acc, curr) => acc + curr.value, 0);

  const totalCommercialLeads = filteredLeads.filter(l => activeStages.some(s => s.id === l.stage)).length;

  const handleMove = (e: React.MouseEvent, leadId: string, currentStage: LeadStage, direction: "left" | "right") => {
    e.stopPropagation();
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
          funnelType: "conventional"
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

  const handleUpdateStage = async (id: string, label: string, colorPresetId: string) => {
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
          funnelType: "conventional"
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

  const handleResetPreset = async () => {
    const confirmMsg = "Deseja restaurar as etapas padrão do Funil de Vendas Comercial? Isso irá padronizar as etapas do seu CRM. Deseja prosseguir?";
    if (!window.confirm(confirmMsg)) return;

    setIsOperating(true);
    try {
      const res = await fetch("/api/stages/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preset: "conventional" })
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

      {/* Top Header & Metrics Bar */}
      <div className="bg-slate-900 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-extrabold text-white">Funil de Vendas Comercial</h2>
              <span className="bg-emerald-500/15 text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                {totalCommercialLeads} Oportunidades
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Pipeline ativo: <strong className="text-emerald-400 font-mono">R$ {totalCommercialPipelineValue.toLocaleString('pt-BR')}</strong>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all text-xs font-semibold cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Editar Etapas</span>
          </button>

          <button
            onClick={() => setShowVisualFunnel(!showVisualFunnel)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-xs font-semibold cursor-pointer"
          >
            {showVisualFunnel ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                <span>Ocultar Gráfico</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>Visualizar Gráfico</span>
              </>
            )}
          </button>

          <button
            onClick={onAddLeadClick}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 shadow-md shadow-emerald-600/10 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Lead</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar por nome, apelido, e-mail do lead..."
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

        {/* Source Filter */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="w-full md:w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-medium text-slate-700"
          >
            <option value="all">Todas as Origens</option>
            {sources.filter(s => s !== "all").map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Pipeline Stage columns */}
      <div className="flex space-x-4 overflow-x-auto pb-6 snap-x scroll-smooth min-h-[60vh]">
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
                <div className="flex items-center space-x-2 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    col.id === 'won'
                      ? 'bg-emerald-500' 
                      : col.id === 'lost' 
                      ? 'bg-rose-500' 
                      : 'bg-indigo-400'
                  }`} />
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-800 text-xs tracking-wide truncate mt-0.5">{col.label}</h3>
                  </div>
                </div>
                <span className="text-xs bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full shrink-0">
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

                        {/* Value & Movement Controls */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100/50 mt-1">
                          <span className="text-xs font-bold text-emerald-600 font-mono">
                            R$ {lead.value.toLocaleString('pt-BR')}
                          </span>

                          <div className="flex items-center space-x-1">
                            <button
                              onClick={(e) => handleMove(e, lead.id, lead.stage, "left")}
                              disabled={col.id === activeStages[0]?.id}
                              className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 rounded-md transition-all"
                              title="Mover para esquerda"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleMove(e, lead.id, lead.stage, "right")}
                              disabled={col.id === activeStages[activeStages.length - 1]?.id}
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
                  <div className="h-32 border-2 border-dashed border-slate-200/60 rounded-xl flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                    <span className="text-xs font-medium">Nenhum lead nesta etapa</span>
                    <span className="text-[10px] text-slate-300 mt-0.5">Arraste um card para cá</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Conversion Funnel Chart (Abaixo da Pipeline) */}
      {showVisualFunnel && (
        <div className="pt-2">
          <VisualFunnel 
            leads={leads} 
            stages={stages} 
            funnelType="conventional" 
          />
        </div>
      )}

      {/* Stage Customization Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in duration-200 flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm">Personalizar Etapas do Funil de Vendas</h3>
                  <p className="text-[10px] text-slate-400">Configure as etapas do funil comercial, ordens e cores</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSettings(false)} 
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                disabled={isOperating}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Presets Reset */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Restaurar Padrão do Funil de Vendas</span>
                  <p className="text-[10px] text-slate-400">Restaura as etapas comerciais padrão (Interesse, Contato, Qualificação, Proposta, Negociação, Ganho, Perdido).</p>
                </div>
                <button
                  type="button"
                  onClick={handleResetPreset}
                  disabled={isOperating}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Restaurar Padrão
                </button>
              </div>

              {/* Create New Stage Form */}
              <form onSubmit={handleAddStage} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Adicionar Nova Etapa ao Funil</span>
                </h4>
                
                <div className="flex flex-col sm:flex-row gap-2.5 items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nome da Etapa</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Em Negociação, Reunião Agendada..."
                      value={newStageLabel}
                      onChange={(e) => setNewStageLabel(e.target.value)}
                      disabled={isOperating}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white font-semibold"
                    />
                  </div>

                  <div className="w-full sm:w-36">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cor</label>
                    <select
                      value={newStageColor}
                      onChange={(e) => setNewStageColor(e.target.value)}
                      disabled={isOperating}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white"
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
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Etapas Atuais ({activeStages.length})</h4>
                
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {activeStages.map((stg, index) => {
                    const isEditing = editingStageId === stg.id;
                    const stageLeadsCount = leads.filter(l => l.stage === stg.id).length;

                    return (
                      <div key={stg.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 gap-3 hover:bg-slate-50/50 transition-colors">
                        
                        {/* Stage Info/Editor Form */}
                        <div className="flex-1 flex items-center space-x-3 min-w-0">
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
                              <span className="text-[9px] bg-slate-100 text-slate-500 font-mono px-2 py-0.5 rounded-md uppercase shrink-0">
                                ID: {stg.id}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Stage Action Controls */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2.5 py-1 rounded-full shrink-0">
                            {stageLeadsCount} lead{stageLeadsCount !== 1 ? 's' : ''}
                          </span>

                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleMoveStageOrder(index, "up")}
                              disabled={index === 0 || isOperating}
                              className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 rounded transition-colors cursor-pointer"
                              title="Subir Ordem"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveStageOrder(index, "down")}
                              disabled={index === stages.length - 1 || isOperating}
                              className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 rounded transition-colors cursor-pointer"
                              title="Descer Ordem"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStage(stg.id, editingLabel, editingColor)}
                                  disabled={isOperating || !editingLabel.trim()}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                                  title="Salvar alterações"
                                >
                                  <Check className="w-3.5 h-3.5 font-bold" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingStageId(null)}
                                  disabled={isOperating}
                                  className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
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
                                  const matchedColor = COLOR_PRESETS.find(p => p.bg === stg.bg)?.id || "slate";
                                  setEditingColor(matchedColor);
                                }}
                                disabled={isOperating}
                                className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                title="Editar nome e cor"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {activeStages.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteStage(stg.id)}
                                disabled={isOperating}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                title="Excluir Etapa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
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
