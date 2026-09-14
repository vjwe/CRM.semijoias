import React, { useState } from "react";
import { Search, Building2, Phone, Mail, Plus, Download, ChevronRight, Filter, DollarSign, Calendar, Pencil, Trash2, AlertTriangle, X, Check, Loader2, HeartHandshake, Kanban, Sparkles } from "lucide-react";
import { Lead, LeadStage, PipelineStage, CustomFieldDefinition, TargetModule } from "../types";
import CSVImporter from "./CSVImporter";

interface LeadsListViewProps {
  leads: Lead[];
  stages: PipelineStage[];
  customFields?: CustomFieldDefinition[];
  onLeadClick: (lead: Lead) => void;
  onAddLeadClick: () => void;
  onImportComplete: () => void;
  onWhatsAppDirectClick: (lead: Lead) => void;
  onUpdateLead?: (updatedLead: Lead) => void;
  onDeleteLead?: (id: string) => void;
}

export default function LeadsListView({ 
  leads, 
  stages, 
  customFields = [],
  onLeadClick, 
  onAddLeadClick, 
  onImportComplete, 
  onWhatsAppDirectClick,
  onUpdateLead,
  onDeleteLead 
}: LeadsListViewProps) {
  const getStageStyle = (stageId: string) => {
    const stage = stages.find((s) => s.id === stageId);
    if (stage) {
      const bgMap: Record<string, string> = {
        prospect: "bg-slate-100 text-slate-800 border-slate-200",
        contacted: "bg-sky-50 text-sky-800 border-sky-100",
        qualified: "bg-indigo-50 text-indigo-800 border-indigo-100",
        proposal: "bg-amber-50 text-amber-800 border-amber-100",
        negotiation: "bg-purple-50 text-purple-800 border-purple-100",
        won: "bg-emerald-50 text-emerald-800 border-emerald-100",
        lost: "bg-rose-50 text-rose-800 border-rose-100",
      };
      
      const customStyle = bgMap[stage.id] || `${stage.bg} ${stage.text} border-slate-100`;
      return {
        label: stage.label,
        styleClass: customStyle
      };
    }
    return {
      label: stageId,
      styleClass: "bg-slate-150 text-slate-700 border-slate-250"
    };
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [funnelFilter, setFunnelFilter] = useState<"all" | "sales" | "post_sales" | "delinquents">("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [showImporter, setShowImporter] = useState(false);

  // Edit lead modal state
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editTargetModule, setEditTargetModule] = useState<TargetModule>("sales");
  const [editName, setEditName] = useState("");
  const [editNickname, setEditNickname] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editValue, setEditValue] = useState("");
  const [editStage, setEditStage] = useState<LeadStage>("prospect");
  const [editSource, setEditSource] = useState("");
  const [editIsInadimplente, setEditIsInadimplente] = useState(false);
  const [editValorInadimplente, setEditValorInadimplente] = useState("");
  const [editDiasAtraso, setEditDiasAtraso] = useState("");
  const [editStatusCobranca, setEditStatusCobranca] = useState<"friendly" | "active" | "legal" | "recovered">("friendly");
  const [editPostSalesStage, setEditPostSalesStage] = useState<string>("onboarding");
  const [editCustomFields, setEditCustomFields] = useState<Record<string, string>>({});

  const [isSaving, setIsSaving] = useState(false);

  // Delete confirm modal state
  const [deleteConfirmLead, setDeleteConfirmLead] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const openEditModal = (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLead(lead);
    setEditName(lead.name);
    setEditNickname(lead.nickname || "");
    setEditEmail(lead.email || "");
    setEditPhone(lead.phone || "");
    setEditValue(lead.value.toString());
    setEditStage(lead.stage);
    setEditSource(lead.source || "Manual");
    setEditIsInadimplente(!!lead.isInadimplente);
    setEditValorInadimplente(lead.valorInadimplente ? lead.valorInadimplente.toString() : "0");
    setEditDiasAtraso(lead.diasAtraso ? lead.diasAtraso.toString() : "0");
    setEditStatusCobranca(lead.statusCobranca || "friendly");
    setEditPostSalesStage(lead.postSalesStage || "onboarding");
    setEditCustomFields(lead.customFields ? { ...lead.customFields } : {});

    if (lead.isInadimplente) {
      setEditTargetModule("delinquents");
    } else if (lead.postSalesStage || lead.stage === "won" || stages.find(s => s.id === lead.stage)?.funnelType === "inverted") {
      setEditTargetModule("post_sales");
    } else {
      setEditTargetModule("sales");
    }
  };

  const openDeleteModal = (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmLead(lead);
  };

  const handleSaveEditLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    setIsSaving(true);

    const isDelinquent = editTargetModule === "delinquents" || editIsInadimplente;
    const isPostSales = editTargetModule === "post_sales";

    try {
      const response = await fetch(`/api/leads/${editingLead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          nickname: editNickname,
          email: editEmail,
          phone: editPhone,
          value: Number(editValue) || 0,
          stage: isPostSales ? (editStage === 'won' ? 'won' : 'won') : editStage,
          source: editSource,
          targetModule: editTargetModule,
          isInadimplente: isDelinquent,
          valorInadimplente: isDelinquent ? (Number(editValorInadimplente) || 0) : 0,
          diasAtraso: isDelinquent ? (Number(editDiasAtraso) || 0) : 0,
          statusCobranca: isDelinquent ? editStatusCobranca : undefined,
          postSalesStage: isPostSales ? editPostSalesStage : undefined,
          customFields: editCustomFields
        })
      });

      if (response.ok) {
        const updated = await response.json();
        if (onUpdateLead) onUpdateLead(updated);
        setEditingLead(null);
        showToast("Lead atualizado com sucesso! 🎉");
      } else {
        alert("Erro ao salvar alterações do lead.");
      }
    } catch (err) {
      console.error("Erro ao editar lead:", err);
      alert("Falha na comunicação com o servidor.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmLead) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/leads/${deleteConfirmLead.id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        if (onDeleteLead) onDeleteLead(deleteConfirmLead.id);
        const deletedName = deleteConfirmLead.name;
        setDeleteConfirmLead(null);
        showToast(`Lead "${deletedName}" foi excluído permanentemente! 🗑️`);
      } else {
        alert("Erro ao excluir o lead.");
      }
    } catch (err) {
      console.error("Erro ao excluir lead:", err);
      alert("Falha na comunicação com o servidor.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Get lists for filter dropdowns
  const sources = Array.from(new Set(leads.map((l) => l.source)));

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.nickname && lead.nickname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm);
    
    // Funnel / module filter
    let matchesFunnel = true;
    if (funnelFilter === "sales") {
      matchesFunnel = !lead.isInadimplente && !lead.postSalesStage && lead.stage !== "won";
    } else if (funnelFilter === "post_sales") {
      matchesFunnel = !lead.isInadimplente && (!!lead.postSalesStage || lead.stage === "won");
    } else if (funnelFilter === "delinquents") {
      matchesFunnel = !!lead.isInadimplente;
    }

    const matchesStage = stageFilter === "all" || lead.stage === stageFilter;
    const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;

    return matchesSearch && matchesFunnel && matchesStage && matchesSource;
  });

  // Client-side export to CSV
  const handleExportCSV = () => {
    if (leads.length === 0) return;
    
    const headers = ["ID", "Nome", "Apelido", "Email", "Telefone", "Valor", "Etapa", "Origem", "Criado Em"];
    
    const csvRows = [
      headers.join(","), // Headers line
      ...filteredLeads.map((lead) => [
        `"${lead.id}"`,
        `"${lead.name.replace(/"/g, '""')}"`,
        `"${(lead.nickname || "").replace(/"/g, '""')}"`,
        `"${lead.email}"`,
        `"${lead.phone}"`,
        lead.value,
        `"${lead.stage}"`,
        `"${lead.source}"`,
        `"${lead.createdAt}"`
      ].join(","))
    ];

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `crm_leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 relative">

      {/* Floating Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center space-x-2 animate-in slide-in-from-top duration-300">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}
      
      {/* Upper Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Diretório de Leads</h2>
          <p className="text-xs text-slate-400 mt-0.5">Gerencie, edite, altere etapas ou remova contatos do seu funil comercial</p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={onAddLeadClick}
            className="text-xs font-bold px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs hover:shadow-md transition-all flex items-center space-x-1 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Lead</span>
          </button>

          <button
            onClick={() => setShowImporter(!showImporter)}
            className={`text-xs font-semibold px-4 py-2 rounded-xl border transition-all cursor-pointer ${
              showImporter 
                ? "bg-slate-100 border-slate-300 text-slate-700" 
                : "border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-emerald-50/20"
            }`}
          >
            {showImporter ? "Ocultar Importador" : "Importar Leads CSV"}
          </button>
          
          <button
            onClick={handleExportCSV}
            disabled={filteredLeads.length === 0}
            className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all flex items-center space-x-1 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* CSV Importer container */}
      {showImporter && (
        <div className="animate-in slide-in-from-top-4 duration-300">
          <CSVImporter 
            onImportComplete={() => {
              onImportComplete();
              setShowImporter(false);
            }} 
          />
        </div>
      )}

      {/* Quick Funnel Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFunnelFilter("all")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            funnelFilter === "all"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <span>Todos ({leads.length})</span>
        </button>

        <button
          onClick={() => setFunnelFilter("sales")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
            funnelFilter === "sales"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50"
          }`}
        >
          <Kanban className="w-3.5 h-3.5" />
          <span>Funil de Vendas</span>
          <span className="bg-emerald-950/20 text-xs px-1.5 py-0.5 rounded-full font-mono">
            {leads.filter(l => !l.isInadimplente && !l.postSalesStage && l.stage !== "won").length}
          </span>
        </button>

        <button
          onClick={() => setFunnelFilter("post_sales")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
            funnelFilter === "post_sales"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-blue-700 border border-blue-200 hover:bg-blue-50"
          }`}
        >
          <HeartHandshake className="w-3.5 h-3.5" />
          <span>Pós-Vendas</span>
          <span className="bg-blue-950/20 text-xs px-1.5 py-0.5 rounded-full font-mono">
            {leads.filter(l => !l.isInadimplente && (!!l.postSalesStage || l.stage === "won")).length}
          </span>
        </button>

        <button
          onClick={() => setFunnelFilter("delinquents")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
            funnelFilter === "delinquents"
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-white text-rose-700 border border-rose-200 hover:bg-rose-50"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Inadimplência</span>
          <span className="bg-rose-950/20 text-xs px-1.5 py-0.5 rounded-full font-mono">
            {leads.filter(l => !!l.isInadimplente).length}
          </span>
        </button>
      </div>

      {/* Filters Form */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        
        {/* Text Search (5 cols) */}
        <div className="sm:col-span-5 relative">
          <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, apelido, fone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/40"
          />
        </div>

        {/* Stage Filter (3 cols) */}
        <div className="sm:col-span-3">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white"
          >
            <option value="all">Todas as Etapas</option>
            {stages.map((stg) => (
              <option key={stg.id} value={stg.id}>{stg.label}</option>
            ))}
          </select>
        </div>

        {/* Source Filter (3 cols) */}
        <div className="sm:col-span-3">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white"
          >
            <option value="all">Todas as Origens</option>
            {sources.map((src) => (
              <option key={src} value={src}>{src}</option>
            ))}
          </select>
        </div>

        {/* Counter (1 col) */}
        <div className="sm:col-span-1 text-center font-bold text-xs text-slate-500 font-mono hidden sm:block bg-slate-100 py-2 rounded-xl">
          {filteredLeads.length}
        </div>

      </div>

      {/* Dual Layout: Responsive Mobile Cards vs Desktop Table */}
      
      {/* 1. Mobile Cards view (hidden on desktop, comfy on cell phones) */}
      <div className="md:hidden space-y-3.5 pb-20">
        {filteredLeads.length > 0 ? (
          filteredLeads.map((lead) => (
            <div
              key={lead.id}
              onClick={() => onLeadClick(lead)}
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-500 shadow-xs flex flex-col space-y-3.5 cursor-pointer relative"
            >
              {/* Header profile */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm leading-tight">{lead.name}</h3>
                  {lead.nickname && (
                    <p className="text-[11px] text-slate-400 font-medium flex items-center mt-0.5">
                      <Building2 className="w-3.5 h-3.5 mr-1" />
                      <span>{lead.nickname}</span>
                    </p>
                  )}
                </div>
                
                <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase border ${getStageStyle(lead.stage).styleClass}`}>
                  {getStageStyle(lead.stage).label}
                </span>
              </div>

              {/* Sub-details */}
              <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
                <div className="flex items-center space-x-1">
                  <Phone className="w-3.5 h-3.5 text-slate-300" />
                  <span className="truncate font-mono">{lead.phone}</span>
                </div>
                <div className="flex items-center space-x-1 justify-end">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="font-extrabold text-emerald-600 font-mono">
                    R$ {lead.value.toLocaleString("pt-BR")}
                  </span>
                </div>
              </div>

              {/* Split actions for mobile cards */}
              <div className="flex items-center justify-between text-[11px] bg-slate-50 -mx-4 -mb-4 p-2 rounded-b-xl px-4 border-t border-slate-100 flex-wrap gap-2">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={(e) => openEditModal(lead, e)}
                    className="py-1 text-indigo-600 hover:text-indigo-800 font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={(e) => openDeleteModal(lead, e)}
                    className="py-1 text-rose-600 hover:text-rose-800 font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLeadClick(lead);
                    }}
                    className="py-1 text-slate-600 font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span>Histórico</span>
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onWhatsAppDirectClick(lead);
                    }}
                    className="py-1 text-emerald-600 hover:text-emerald-700 font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Phone className="w-3 h-3 text-emerald-500" />
                    <span>⚡ Zap</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-slate-400 text-xs bg-white border border-slate-150 rounded-xl">
            Nenhum contato encontrado
          </div>
        )}
      </div>

      {/* 2. Desktop Tabular Grid View */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Nome & Módulo</th>
                <th className="py-3 px-4">Como Chamar</th>
                <th className="py-3 px-4">E-mail</th>
                <th className="py-3 px-4">Telefone</th>
                <th className="py-3 px-4">Etapa / Status</th>
                <th className="py-3 px-4 text-right">Valor</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-600 font-medium">
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => onLeadClick(lead)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 group-hover:text-emerald-700">
                        {lead.name}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {lead.isInadimplente ? (
                          <span className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-2.5 h-2.5 mr-0.5 text-rose-500" />
                            Inadimplência
                          </span>
                        ) : lead.postSalesStage || lead.stage === "won" ? (
                          <span className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                            <HeartHandshake className="w-2.5 h-2.5 mr-0.5 text-blue-500" />
                            Pós-Vendas
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Kanban className="w-2.5 h-2.5 mr-0.5 text-emerald-500" />
                            Funil Vendas
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {lead.nickname ? (
                        <span className="flex items-center">
                          <Building2 className="w-3.5 h-3.5 mr-1.5 text-slate-300" />
                          <span>{lead.nickname}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">{lead.email || "-"}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">{lead.phone}</td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${getStageStyle(lead.stage).styleClass}`}>
                        {getStageStyle(lead.stage).label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600 font-mono">
                      R$ {lead.value.toLocaleString("pt-BR")}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        
                        {/* Edit Action Button */}
                        <button
                          onClick={(e) => openEditModal(lead, e)}
                          className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer flex items-center space-x-1"
                          title="Editar dados deste lead"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Editar</span>
                        </button>

                        {/* Delete Action Button */}
                        <button
                          onClick={(e) => openDeleteModal(lead, e)}
                          className="text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer flex items-center space-x-1"
                          title="Excluir este lead"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Excluir</span>
                        </button>

                        {/* Timeline / View */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onLeadClick(lead);
                          }}
                          className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer"
                        >
                          Histórico
                        </button>

                        {/* Direct WhatsApp */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onWhatsAppDirectClick(lead);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center space-x-1 shrink-0 cursor-pointer shadow-xs border border-emerald-500"
                        >
                          <Phone className="w-2.5 h-2.5 shrink-0" />
                          <span>⚡ Zap</span>
                        </button>

                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                    Nenhum contato comercial encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: EDIT LEAD MODAL
      ========================================================================= */}
      {editingLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in duration-200 my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Pencil className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-slate-100">Editar Lead - {editingLead.name}</h3>
              </div>
              <button 
                onClick={() => setEditingLead(null)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditLead} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Funnel / Module Destination Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Módulo / Destino no CRM
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditTargetModule("sales");
                      setEditIsInadimplente(false);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center space-y-1 ${
                      editTargetModule === "sales" && !editIsInadimplente
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
                    onClick={() => {
                      setEditTargetModule("post_sales");
                      setEditIsInadimplente(false);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center space-y-1 ${
                      editTargetModule === "post_sales" && !editIsInadimplente
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
                    onClick={() => {
                      setEditTargetModule("delinquents");
                      setEditIsInadimplente(true);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center space-y-1 ${
                      editTargetModule === "delinquents" || editIsInadimplente
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

              {/* Row 1: Name & Nickname */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Como deve ser chamado (Apelido/Empresa)</label>
                  <input
                    type="text"
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Row 2: Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">WhatsApp / Telefone *</label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Row 3: Value, Stage, Source */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Valor do Negócio (R$)</label>
                  <input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Etapa Atual no Funil</label>
                  <select
                    value={editStage}
                    onChange={(e) => setEditStage(e.target.value as LeadStage)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    {stages.map((stg) => (
                      <option key={stg.id} value={stg.id}>{stg.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Canal de Origem</label>
                  <input
                    type="text"
                    value={editSource}
                    onChange={(e) => setEditSource(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Delinquency Section */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsInadimplente}
                    onChange={(e) => setEditIsInadimplente(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span>Cliente Inadimplente / Em Débito Comercial</span>
                </label>

                {editIsInadimplente && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Valor em Atraso (R$)</label>
                      <input
                        type="number"
                        value={editValorInadimplente}
                        onChange={(e) => setEditValorInadimplente(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-rose-200 rounded-lg focus:outline-none focus:border-rose-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Dias de Atraso</label>
                      <input
                        type="number"
                        value={editDiasAtraso}
                        onChange={(e) => setEditDiasAtraso(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-rose-200 rounded-lg focus:outline-none focus:border-rose-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Status de Cobrança</label>
                      <select
                        value={editStatusCobranca}
                        onChange={(e) => setEditStatusCobranca(e.target.value as any)}
                        className="w-full px-3 py-1.5 text-xs border border-rose-200 rounded-lg focus:outline-none focus:border-rose-500 bg-white"
                      >
                        <option value="friendly">Notificação Amigável</option>
                        <option value="active">Cobrança Ativa (WhatsApp/Fone)</option>
                        <option value="legal">Encaminhado ao Jurídico / Serasa</option>
                        <option value="recovered">Dívida Recuperada / Quitado</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Fields section if available */}
              {customFields.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Campos Personalizados</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {customFields.map((cf) => (
                      <div key={cf.id}>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">{cf.label}</label>
                        <input
                          type={cf.type === 'number' ? 'number' : cf.type === 'date' ? 'date' : 'text'}
                          value={editCustomFields[cf.id] || ''}
                          onChange={(e) => setEditCustomFields({ ...editCustomFields, [cf.id]: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit / Cancel Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingLead(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Salvar Alterações</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: CONFIRM DELETE LEAD MODAL
      ========================================================================= */}
      {deleteConfirmLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in duration-200">
            <div className="p-6 text-center space-y-4">
              
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-extrabold text-slate-900">Excluir Lead Permanentemente?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tem certeza que deseja remover o lead <strong className="text-slate-800">"{deleteConfirmLead.name}"</strong>?
                  O histórico de conversas e anotações deste contato serão permanentemente apagados.
                </p>
              </div>

              {/* Lead preview box */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left text-xs font-mono text-slate-600 space-y-1">
                <div><span className="font-bold text-slate-800">Nome:</span> {deleteConfirmLead.name}</div>
                <div><span className="font-bold text-slate-800">Telefone:</span> {deleteConfirmLead.phone}</div>
                <div><span className="font-bold text-slate-800">E-mail:</span> {deleteConfirmLead.email || "-"}</div>
                <div><span className="font-bold text-slate-800">Valor:</span> R$ {deleteConfirmLead.value.toLocaleString('pt-BR')}</div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmLead(null)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>Sim, Excluir</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
