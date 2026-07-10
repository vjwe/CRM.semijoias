import React, { useState } from "react";
import { Search, Building2, Phone, Mail, Plus, Download, ChevronRight, Filter, DollarSign, Calendar } from "lucide-react";
import { Lead, LeadStage, PipelineStage } from "../types";
import CSVImporter from "./CSVImporter";

interface LeadsListViewProps {
  leads: Lead[];
  stages: PipelineStage[];
  onLeadClick: (lead: Lead) => void;
  onAddLeadClick: () => void;
  onImportComplete: () => void;
  onWhatsAppDirectClick: (lead: Lead) => void;
}

export default function LeadsListView({ leads, stages, onLeadClick, onAddLeadClick, onImportComplete, onWhatsAppDirectClick }: LeadsListViewProps) {
  const getStageStyle = (stageId: string) => {
    const stage = stages.find((s) => s.id === stageId);
    if (stage) {
      // Map to styling
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
  const [stageFilter, setStageFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [showImporter, setShowImporter] = useState(false);

  // Get lists for filter dropdowns
  const sources = Array.from(new Set(leads.map((l) => l.source)));

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.nickname && lead.nickname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm);
    
    const matchesStage = stageFilter === "all" || lead.stage === stageFilter;
    const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;

    return matchesSearch && matchesStage && matchesSource;
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
    <div className="space-y-6">
      
      {/* Upper Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Diretório de Leads</h2>
          <p className="text-xs text-slate-400 mt-0.5">Veja todos os contatos comerciais, faça buscas e exporte tabelas</p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={onAddLeadClick}
            className="text-xs font-bold px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs hover:shadow-md transition-all flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Lead</span>
          </button>

          <button
            onClick={() => setShowImporter(!showImporter)}
            className={`text-xs font-semibold px-4 py-2 rounded-xl border transition-all ${
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
            className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all flex items-center space-x-1 disabled:opacity-50"
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
              <div className="flex items-center justify-between text-[10px] bg-slate-50 -mx-4 -mb-4 p-2 rounded-b-xl px-4 border-t border-slate-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLeadClick(lead);
                  }}
                  className="py-1 text-slate-500 hover:text-slate-800 font-bold flex items-center space-x-1"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span>Histórico</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onWhatsAppDirectClick(lead);
                  }}
                  className="py-1 text-emerald-600 hover:text-emerald-700 font-bold flex items-center space-x-1"
                >
                  <Phone className="w-3 h-3 text-emerald-500" />
                  <span>⚡ Enviar Zap (1-Clique)</span>
                </button>
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
                <th className="py-3 px-4">Nome</th>
                <th className="py-3 px-4">Como Chamar</th>
                <th className="py-3 px-4">E-mail</th>
                <th className="py-3 px-4">Telefone</th>
                <th className="py-3 px-4">Etapa</th>
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
                    <td className="py-3.5 px-4 font-bold text-slate-800 group-hover:text-emerald-700">
                      {lead.name}
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
                    <td className="py-3.5 px-4 font-mono text-[11px]">{lead.email}</td>
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
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onLeadClick(lead);
                          }}
                          className="text-slate-600 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer"
                        >
                          Histórico
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onWhatsAppDirectClick(lead);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center space-x-1 shrink-0 cursor-pointer shadow-xs border border-emerald-500"
                        >
                          <Phone className="w-2.5 h-2.5 shrink-0" />
                          <span>⚡ Zap 1-Clique</span>
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

    </div>
  );
}
