import React, { useState } from "react";
import { 
  MessageSquare, Plus, Trash2, Edit2, Check, X, HelpCircle, Layers, 
  Send, Sparkles, Wand2, RefreshCw, Copy, CheckCheck, Lightbulb, Search,
  TrendingUp, HeartHandshake, AlertTriangle, Filter
} from "lucide-react";
import { MessageTemplate, PipelineStage } from "../types";

interface TemplatesViewProps {
  templates: MessageTemplate[];
  stages?: PipelineStage[];
  onTemplatesChange: () => void;
  onOpenWhatsAppWithTemplate?: (message: string) => void;
}

export default function TemplatesView({
  templates,
  stages = [],
  onTemplatesChange,
  onOpenWhatsAppWithTemplate
}: TemplatesViewProps) {
  // Navigation & Filtering
  const [selectedModuleTab, setSelectedModuleTab] = useState<"all" | "sales" | "post_sales" | "delinquents">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Form State
  const [name, setName] = useState("");
  const [funnelModule, setFunnelModule] = useState<"sales" | "post_sales" | "delinquents">("sales");
  const [category, setCategory] = useState<MessageTemplate['category']>("introduction");
  const [stageId, setStageId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Delete in-app confirmation
  const [templateToDelete, setTemplateToDelete] = useState<MessageTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // AI Modal states
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiFunnelModule, setAiFunnelModule] = useState<"sales" | "post_sales" | "delinquents">("sales");
  const [aiTone, setAiTone] = useState("Amigável, acolhedor e persuasivo");
  const [aiCategory, setAiCategory] = useState("introduction");
  const [aiBusinessContext, setAiBusinessContext] = useState("Revenda de semijoias consignadas finas banhadas a ouro 18k e prata");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Helper to categorize templates with fallback
  const getTemplateModule = (t: MessageTemplate): "sales" | "post_sales" | "delinquents" => {
    if (t.funnelModule) return t.funnelModule;
    const lowerName = t.name.toLowerCase();
    const lowerMsg = t.message.toLowerCase();
    if (lowerName.includes("cobrança") || lowerName.includes("lembrete") || lowerName.includes("atraso") || lowerMsg.includes("dias_atraso") || lowerMsg.includes("pendente")) {
      return "delinquents";
    }
    if (lowerName.includes("pós-venda") || lowerName.includes("onboarding") || lowerName.includes("nps") || lowerName.includes("renovação") || lowerName.includes("acompanhamento de uso")) {
      return "post_sales";
    }
    return "sales";
  };

  // Variables preview substitute
  const getPreviewMessage = (msgText: string) => {
    return msgText
      .replace(/{nome}/g, "Mariana Silveira")
      .replace(/{apelido}/g, "Mari")
      .replace(/{chamado}/g, "Mari")
      .replace(/{empresa}/g, "Glow Semijoias")
      .replace(/{valor}/g, "1.850,00")
      .replace(/{email}/g, "mariana@gmail.com")
      .replace(/{etapa}/g, "Apresentação da Coleção")
      .replace(/{dias_atraso}/g, "7")
      .replace(/{valor_inadimplente}/g, "650,00");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId || undefined,
          name,
          funnelModule,
          category,
          stageId: stageId || undefined,
          message
        })
      });

      if (response.ok) {
        onTemplatesChange();
        cancelForm();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!templateToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/templates/${templateToDelete.id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        onTemplatesChange();
        setTemplateToDelete(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const startEdit = (template: MessageTemplate) => {
    setEditingId(template.id);
    setName(template.name);
    setFunnelModule(getTemplateModule(template));
    setCategory(template.category);
    setStageId(template.stageId || "");
    setMessage(template.message);
    setShowForm(true);
  };

  const cancelForm = () => {
    setEditingId(null);
    setName("");
    setFunnelModule(selectedModuleTab === "all" ? "sales" : selectedModuleTab);
    setCategory("introduction");
    setStageId("");
    setMessage("");
    setShowForm(false);
  };

  const handleCopyTemplate = (temp: MessageTemplate) => {
    navigator.clipboard.writeText(temp.message);
    setCopiedId(temp.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Generate with AI
  const handleGenerateAiTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic.trim()) return;

    setIsGeneratingAi(true);
    setAiError(null);

    try {
      const res = await fetch("/api/ai/generate-whatsapp-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiTopic,
          objective: aiTopic,
          tone: aiTone,
          category: aiCategory,
          funnelModule: aiFunnelModule,
          businessContext: aiBusinessContext,
          additionalDetails: aiBusinessContext,
          targetContext: aiFunnelModule === "delinquents" ? "collection" : aiFunnelModule === "post_sales" ? "post_sales" : "sales"
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Falha ao gerar o modelo de mensagem com a IA.");
      }

      const data = await res.json();
      const generatedMessage = data.template || data.message;
      const generatedTitle = data.title || data.name || `Modelo IA: ${aiTopic.substring(0, 30)}`;

      if (generatedMessage) {
        setName(generatedTitle);
        setMessage(generatedMessage);
        setFunnelModule(aiFunnelModule);
        setCategory(aiCategory as MessageTemplate['category']);
        setShowAiModal(false);
        setShowForm(true);
      } else {
        throw new Error("A resposta da IA não retornou o texto da mensagem.");
      }
    } catch (err: any) {
      console.error("Erro na geração com IA:", err);
      setAiError(err.message || "Não foi possível conectar com a IA no momento. Tente novamente.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const getModuleBadge = (mod: "sales" | "post_sales" | "delinquents") => {
    switch (mod) {
      case "sales":
        return {
          label: "Funil de Vendas",
          classes: "bg-blue-50 text-blue-700 border-blue-200",
          icon: <TrendingUp className="w-3 h-3 text-blue-600" />
        };
      case "post_sales":
        return {
          label: "Pós-Vendas",
          classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: <HeartHandshake className="w-3 h-3 text-emerald-600" />
        };
      case "delinquents":
        return {
          label: "Inadimplência / Cobrança",
          classes: "bg-rose-50 text-rose-700 border-rose-200",
          icon: <AlertTriangle className="w-3 h-3 text-rose-600" />
        };
    }
  };

  const getCategoryBadge = (cat: MessageTemplate['category']) => {
    switch (cat) {
      case "introduction":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "followup":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "proposal":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getCategoryLabel = (cat: MessageTemplate['category']) => {
    switch (cat) {
      case "introduction": return "Primeiro Contato";
      case "followup": return "Follow-up";
      case "proposal": return "Catálogo / Proposta";
      default: return "Geral / Cobrança";
    }
  };

  // Module counts
  const salesCount = templates.filter(t => getTemplateModule(t) === "sales").length;
  const postSalesCount = templates.filter(t => getTemplateModule(t) === "post_sales").length;
  const delinquentsCount = templates.filter(t => getTemplateModule(t) === "delinquents").length;

  // Filtered Templates
  const filteredTemplates = templates.filter(t => {
    const tModule = getTemplateModule(t);
    const matchesModule = selectedModuleTab === "all" || tModule === selectedModuleTab;
    const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
    const matchesSearch = 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesModule && matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Header and Actions */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-extrabold text-white">Modelos de Mensagens WhatsApp</h2>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                {templates.length} Modelos
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Modelos organizados por Funil de Vendas, Pós-Vendas e Inadimplência com auxílio de IA.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {/* AI Generator Button */}
          <button
            onClick={() => {
              setAiError(null);
              setAiFunnelModule(selectedModuleTab === "all" ? "sales" : selectedModuleTab);
              setShowAiModal(true);
            }}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-md shadow-purple-600/20 cursor-pointer active:scale-95 border border-purple-400/30"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Criar com IA ✨</span>
          </button>

          {!showForm && (
            <button
              onClick={() => {
                setFunnelModule(selectedModuleTab === "all" ? "sales" : selectedModuleTab);
                setShowForm(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Modelo Manual</span>
            </button>
          )}
        </div>
      </div>

      {/* Module Categorization Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        
        {/* Module Segmented Buttons */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedModuleTab("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              selectedModuleTab === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Todos</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              selectedModuleTab === "all" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
            }`}>
              {templates.length}
            </span>
          </button>

          <button
            onClick={() => setSelectedModuleTab("sales")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              selectedModuleTab === "sales"
                ? "bg-blue-600 text-white shadow-xs shadow-blue-600/20"
                : "text-slate-600 hover:text-blue-700 hover:bg-blue-50"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Funil de Vendas</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              selectedModuleTab === "sales" ? "bg-white/20 text-white" : "bg-blue-100 text-blue-800"
            }`}>
              {salesCount}
            </span>
          </button>

          <button
            onClick={() => setSelectedModuleTab("post_sales")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              selectedModuleTab === "post_sales"
                ? "bg-emerald-600 text-white shadow-xs shadow-emerald-600/20"
                : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Pós-Vendas</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              selectedModuleTab === "post_sales" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
            }`}>
              {postSalesCount}
            </span>
          </button>

          <button
            onClick={() => setSelectedModuleTab("delinquents")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              selectedModuleTab === "delinquents"
                ? "bg-rose-600 text-white shadow-xs shadow-rose-600/20"
                : "text-slate-600 hover:text-rose-700 hover:bg-rose-50"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Inadimplência</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              selectedModuleTab === "delinquents" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-800"
            }`}>
              {delinquentsCount}
            </span>
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center space-x-2">
          <div className="relative w-full md:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value="all">Todas as Categorias</option>
            <option value="introduction">Primeiro Contato</option>
            <option value="followup">Follow-up</option>
            <option value="proposal">Catálogo / Proposta</option>
            <option value="other">Outros / Cobrança</option>
          </select>
        </div>

      </div>

      {/* Form Overlay Card */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl space-y-4 animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Edit2 className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">
                {editingId ? "Editar Modelo de Mensagem" : "Cadastrar Novo Modelo de WhatsApp"}
              </h3>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  setAiError(null);
                  setAiFunnelModule(funnelModule);
                  setShowAiModal(true);
                }}
                className="text-xs font-bold text-purple-600 hover:bg-purple-50 px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-colors cursor-pointer border border-purple-200"
              >
                <Sparkles className="w-3 h-3" />
                <span>Pedir ajuda da IA</span>
              </button>

              <button 
                type="button" 
                onClick={cancelForm} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Template Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Título do Modelo *</label>
                <input
                  type="text"
                  placeholder="Ex: Apresentação Inicial de Semijoias"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              {/* Module Destination Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Módulo do Sistema (Destino)</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFunnelModule("sales")}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      funnelModule === "sales"
                        ? "border-blue-500 bg-blue-50 text-blue-800 shadow-xs"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span>Funil Vendas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFunnelModule("post_sales")}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      funnelModule === "post_sales"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <HeartHandshake className="w-4 h-4 text-emerald-600" />
                    <span>Pós-Vendas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFunnelModule("delinquents")}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      funnelModule === "delinquents"
                        ? "border-rose-500 bg-rose-50 text-rose-800 shadow-xs"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Inadimplência</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Etapa do Funil (Opcional)</label>
                  <select
                    value={stageId}
                    onChange={(e) => setStageId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="">Todas as Etapas</option>
                    {stages.map(stg => (
                      <option key={stg.id} value={stg.id}>{stg.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Categoria Comercial</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as MessageTemplate['category'])}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="introduction">Primeiro Contato / Apresentação</option>
                    <option value="followup">Follow-up / Acompanhamento</option>
                    <option value="proposal">Proposta / Catálogo</option>
                    <option value="other">Cobrança / Pós-Venda / Outros</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-600">Texto da Mensagem (WhatsApp) *</label>
                  <span className="text-[10px] text-slate-400 font-mono">{message.length} caracteres</span>
                </div>
                <textarea
                  placeholder="Olá, {apelido}! Tudo bem? Gostaria de te apresentar nossa nova coleção de semijoias finas..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={6}
                  className="w-full p-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-sans leading-relaxed"
                />
              </div>
            </div>

            {/* Dynamic Guide & Live Preview */}
            <div className="space-y-4 bg-slate-50 p-4 rounded-xl flex flex-col justify-between border border-slate-100">
              <div>
                <h4 className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                  <HelpCircle className="w-4 h-4 text-emerald-500" />
                  <span>Substituição Dinâmica de Variáveis</span>
                </h4>
                <p className="text-[10px] text-slate-500 mt-1">
                  As chaves serão substituídas automaticamente com os dados reais do contato ao disparar:
                </p>
                <div className="grid grid-cols-2 gap-1.5 mt-2 text-[10px] font-mono text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/60">
                  <div><strong className="text-emerald-600">{"{nome}"}</strong> - Nome Completo</div>
                  <div><strong className="text-emerald-600">{"{apelido}"}</strong> - Primeiro nome</div>
                  <div><strong className="text-emerald-600">{"{valor}"}</strong> - R$ Limite/Valor</div>
                  <div><strong className="text-emerald-600">{"{etapa}"}</strong> - Etapa do Funil</div>
                  <div><strong className="text-emerald-600">{"{email}"}</strong> - E-mail</div>
                  <div><strong className="text-emerald-600">{"{dias_atraso}"}</strong> - Dias em atraso</div>
                </div>
              </div>

              {/* Real-time preview */}
              <div className="flex-1 mt-3 flex flex-col">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Simulação no WhatsApp</span>
                <div className="flex-1 bg-emerald-900 text-white p-3.5 rounded-xl text-xs leading-relaxed font-sans overflow-y-auto whitespace-pre-wrap select-none min-h-[110px] shadow-inner border border-emerald-800">
                  {message.trim() ? getPreviewMessage(message) : <span className="text-emerald-300/60 italic">Digite sua mensagem para visualizar a prévia instantânea aqui...</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={cancelForm}
              className="text-xs font-semibold px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 py-2 rounded-xl transition-colors shadow-md shadow-emerald-600/15 flex items-center space-x-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Salvar Modelo</span>
            </button>
          </div>
        </form>
      )}

      {/* Grid of Templates cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTemplates.length > 0 ? (
          filteredTemplates.map((temp) => {
            const stageObj = stages.find(s => s.id === temp.stageId);
            const isCopied = copiedId === temp.id;
            const tModule = getTemplateModule(temp);
            const moduleInfo = getModuleBadge(tModule);

            return (
              <div
                key={temp.id}
                className="bg-white p-4.5 rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-xs flex flex-col justify-between space-y-4 transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                      {/* Module Badge */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${moduleInfo.classes}`}>
                        {moduleInfo.icon}
                        <span>{moduleInfo.label}</span>
                      </span>

                      {/* Category Badge */}
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border uppercase ${getCategoryBadge(temp.category)}`}>
                        {getCategoryLabel(temp.category)}
                      </span>

                      {stageObj && (
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {stageObj.label}
                        </span>
                      )}
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex items-center space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(temp)}
                        className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded cursor-pointer"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setTemplateToDelete(temp)}
                        className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm leading-snug">{temp.name}</h4>
                    <div className="mt-2.5 p-3 bg-slate-50 rounded-xl text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap border border-slate-100">
                      {temp.message}
                    </div>
                  </div>
                </div>

                {/* Footer with Use button */}
                <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                  <button
                    onClick={() => handleCopyTemplate(temp)}
                    className="text-[10px] text-slate-500 hover:text-emerald-600 font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                    title="Copiar texto bruto do modelo"
                  >
                    {isCopied ? (
                      <>
                        <CheckCheck className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar texto</span>
                      </>
                    )}
                  </button>

                  {onOpenWhatsAppWithTemplate && (
                    <button
                      onClick={() => onOpenWhatsAppWithTemplate(temp.message)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-xl transition-all shadow-xs flex items-center space-x-1 cursor-pointer active:scale-95"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Usar no WhatsApp 💬</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-16 text-slate-400 text-xs bg-white border border-dashed border-slate-200 rounded-2xl">
            Nenhum modelo encontrado para esta seleção. Clique em "Criar com IA ✨" ou "Novo Modelo Manual".
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {templateToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Excluir Modelo de Mensagem?</h3>
              <p className="text-xs text-slate-500">
                Tem certeza que deseja remover o modelo <span className="font-bold text-slate-800">"{templateToDelete.name}"</span>?
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setTemplateToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1.5"
              >
                {isDeleting ? "Excluindo..." : "Confirmar Exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Template Generator Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-purple-200">
            
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white flex items-center justify-between border-b border-purple-900/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/30 text-amber-300 flex items-center justify-center border border-purple-400/40">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Gerador Inteligente de Mensagens (IA)</h3>
                  <p className="text-[10px] text-purple-200">Crie modelos persuasivos por módulo com IA</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAiModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateAiTemplate} className="p-6 space-y-4">
              
              {aiError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                  {aiError}
                </div>
              )}

              {/* Module selection in AI */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Módulo de Aplicação da Mensagem *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAiFunnelModule("sales")}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      aiFunnelModule === "sales"
                        ? "border-blue-500 bg-blue-50 text-blue-800 shadow-xs"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                    <span>Funil de Vendas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAiFunnelModule("post_sales")}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      aiFunnelModule === "post_sales"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pós-Vendas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAiFunnelModule("delinquents")}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      aiFunnelModule === "delinquents"
                        ? "border-rose-500 bg-rose-50 text-rose-800 shadow-xs"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Inadimplência</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Qual é o objetivo principal desta mensagem? *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    aiFunnelModule === "delinquents"
                      ? "Ex: Notificação amigável de parcela vencida há 5 dias com link de Pix"
                      : aiFunnelModule === "post_sales"
                      ? "Ex: Mensagem calorosa de boas-vindas e agendamento da primeira reunião de onboarding"
                      : "Ex: Convidar revendedora para pegar novo mostruário com lançamentos"
                  }
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tom de Voz</label>
                  <select
                    value={aiTone}
                    onChange={(e) => setAiTone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 bg-white"
                  >
                    <option value="Amigável, acolhedor e persuasivo">Amigável & Acolhedor 💖</option>
                    <option value="Profissional, elegante e sofisticado">Profissional & Elegante 💎</option>
                    <option value="Urgente, promocional e imperdível">Promocional & Urgente ⚡</option>
                    <option value="Compreensivo, flexível e orientativo (Cobrança)">Compreensivo & Firme (Cobrança) 🤝</option>
                    <option value="Agradecimento e encantamento (Pós-Venda)">Encantamento & VIP (Pós-Venda) 👑</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria Comercial</label>
                  <select
                    value={aiCategory}
                    onChange={(e) => setAiCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 bg-white"
                  >
                    <option value="introduction">Primeiro Contato / Apresentação</option>
                    <option value="followup">Follow-up / Acompanhamento</option>
                    <option value="proposal">Apresentação de Coleção / Catálogo</option>
                    <option value="other">Cobrança / Acordo / Pós-Venda</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contexto do seu negócio / Produto
                </label>
                <input
                  type="text"
                  value={aiBusinessContext}
                  onChange={(e) => setAiBusinessContext(e.target.value)}
                  placeholder="Ex: Revenda de semijoias com banho de ouro 18k e garantia"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 text-slate-600"
                />
              </div>

              <div className="bg-purple-50/70 p-3 rounded-xl border border-purple-100 flex items-start space-x-2">
                <Lightbulb className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-purple-800 leading-relaxed">
                  A IA formatará a mensagem para o WhatsApp com negritos, quebras de linha e variáveis como <code className="font-mono font-bold bg-white px-1 rounded">{"{apelido}"}</code> e <code className="font-mono font-bold bg-white px-1 rounded">{"{valor}"}</code>.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingAi || !aiTopic.trim()}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl flex items-center space-x-1.5 shadow-md shadow-purple-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingAi ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Gerando Copy com IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Gerar Modelo Agora</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
