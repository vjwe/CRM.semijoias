import React, { useState, useEffect } from "react";
import { X, Phone, Send, Clock, Trash2, Building2, Mail, DollarSign, Plus, Check, AlertTriangle } from "lucide-react";
import { Lead, MessageTemplate, LeadStage, TimelineItem, PipelineStage } from "../types";
import { getWhatsAppUrl, WhatsAppMode } from "../utils/whatsapp";

interface LeadDetailsModalProps {
  lead: Lead | null;
  onClose: () => void;
  onUpdateLead: (updatedLead: Lead) => void;
  onDeleteLead: (id: string) => void;
  templates: MessageTemplate[];
  stages: PipelineStage[];
}

export default function LeadDetailsModal({ lead, onClose, onUpdateLead, onDeleteLead, templates, stages }: LeadDetailsModalProps) {
  if (!lead) return null;

  const [name, setName] = useState(lead.name);
  const [nickname, setNickname] = useState(lead.nickname || "");
  const [email, setEmail] = useState(lead.email || "");
  const [phone, setPhone] = useState(lead.phone);
  const [value, setValue] = useState(lead.value.toString());
  const [stage, setStage] = useState<LeadStage>(lead.stage);
  const [source, setSource] = useState(lead.source);
  const [isInadimplente, setIsInadimplente] = useState(lead.isInadimplente || false);
  const [valorInadimplente, setValorInadimplente] = useState(lead.valorInadimplente?.toString() || "0");
  const [diasAtraso, setDiasAtraso] = useState(lead.diasAtraso?.toString() || "0");
  const [statusCobranca, setStatusCobranca] = useState(lead.statusCobranca || "friendly");
  
  const [newNote, setNewNote] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sync state with lead prop if it changes
  useEffect(() => {
    setName(lead.name);
    setNickname(lead.nickname || "");
    setEmail(lead.email || "");
    setPhone(lead.phone);
    setValue(lead.value.toString());
    setStage(lead.stage);
    setSource(lead.source);
    setIsInadimplente(lead.isInadimplente || false);
    setValorInadimplente(lead.valorInadimplente?.toString() || "0");
    setDiasAtraso(lead.diasAtraso?.toString() || "0");
    setStatusCobranca(lead.statusCobranca || "friendly");
  }, [lead]);

  // Handle template selection and variable replacement
  useEffect(() => {
    if (!selectedTemplateId) {
      setCustomMessage("");
      return;
    }
    const template = templates.find(t => t.id === selectedTemplateId);
    if (template) {
      // Replace variables
      let debtVal = lead.isInadimplente && lead.valorInadimplente ? lead.valorInadimplente : lead.value;
      let msg = template.message
        .replace(/{nome}/g, lead.name)
        .replace(/{apelido}/g, lead.nickname || lead.name)
        .replace(/{chamado}/g, lead.nickname || lead.name)
        .replace(/{empresa}/g, lead.nickname || "seu mostruário")
        .replace(/{valor}/g, debtVal ? debtVal.toLocaleString('pt-BR') : "0,00")
        .replace(/{email}/g, lead.email || "seu email")
        .replace(/{dias_atraso}/g, lead.diasAtraso ? lead.diasAtraso.toString() : "0");
      setCustomMessage(msg);
    }
  }, [selectedTemplateId, templates, lead]);

  const handleSaveBasic = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          nickname,
          email,
          phone,
          value: Number(value) || 0,
          stage,
          isInadimplente,
          valorInadimplente: Number(valorInadimplente) || 0,
          diasAtraso: Number(diasAtraso) || 0,
          statusCobranca
        })
      });
      if (response.ok) {
        const updated = await response.json();
        onUpdateLead(updated);
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addNote: newNote })
      });
      if (response.ok) {
        const updated = await response.json();
        onUpdateLead(updated);
        setNewNote("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!phone) {
      alert("Por favor, configure o telefone do lead para enviar mensagem.");
      return;
    }

    const finalMsg = customMessage.trim() || `Olá, ${lead.name}!`;
    
    // Save sent message to timeline history
    setIsLoading(true);
    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markWhatsAppContact: `Enviou mensagem via WhatsApp: "${finalMsg.substring(0, 80)}${finalMsg.length > 80 ? '...' : ''}"`
        })
      });
      if (response.ok) {
        const updated = await response.json();
        onUpdateLead(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }

    // Retrieve active WhatsApp platform mode from localStorage (synced with parent setting)
    const savedMode = localStorage.getItem("whatsapp_mode") as WhatsAppMode | null;
    const mode = savedMode || "app";

    const whatsappUrl = getWhatsAppUrl(phone, finalMsg, mode);
    window.open(whatsappUrl, "_blank");
  };

  const handleDelete = async () => {
    if (!confirm(`Deseja realmente excluir o lead "${lead.name}"?`)) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        onDeleteLead(lead.id);
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimelineBadge = (type: TimelineItem['type']) => {
    switch (type) {
      case "created":
        return "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200";
      case "stage_changed":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "whatsapp_sent":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "note":
        return "bg-amber-50 text-amber-800 border-amber-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getTimelineLabel = (type: TimelineItem['type']) => {
    switch (type) {
      case "created": return "Lead Importado";
      case "stage_changed": return "Atualização de Funil";
      case "whatsapp_sent": return "WhatsApp Enviado";
      case "note": return "Anotação Comercial";
      default: return "Ação do Sistema";
    }
  };

  return (
    <div id="lead-modal-container" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {lead.source}
            </span>
            <h2 className="text-lg font-bold text-slate-100 mt-1">{lead.name}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          
          {/* Left Column: Client Profile Info (4 Cols) */}
          <div className="md:col-span-5 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase">Informações Básicas</h3>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
              >
                {isEditing ? "Cancelar" : "Editar Perfil"}
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveBasic} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Como deve ser chamado (Apelido)</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Telefone (WhatsApp)</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Valor do Negócio (R$)</label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Etapa Atual</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as LeadStage)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    {stages.map((stg) => (
                      <option key={stg.id} value={stg.id}>{stg.label}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInadimplente}
                      onChange={(e) => setIsInadimplente(e.target.checked)}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                    />
                    <span className="text-xs font-bold text-slate-700">Inadimplente (Possui débito)</span>
                  </label>

                  {isInadimplente && (
                    <div className="space-y-3 pl-6 border-l-2 border-amber-300 animate-in slide-in-from-top-2 duration-200">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Valor em Atraso (R$)</label>
                        <input
                          type="number"
                          value={valorInadimplente}
                          onChange={(e) => setValorInadimplente(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Dias de Atraso</label>
                        <input
                          type="number"
                          value={diasAtraso}
                          onChange={(e) => setDiasAtraso(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Fase de Cobrança</label>
                        <select
                          value={statusCobranca}
                          onChange={(e) => setStatusCobranca(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white"
                        >
                          <option value="friendly">Lembrete Amigável</option>
                          <option value="active">Cobrança Ativa</option>
                          <option value="negotiation">Acordo / Parcelamento</option>
                          <option value="legal">Cartório / SPC</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors flex items-center justify-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                {lead.isInadimplente && (
                  <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 space-y-1.5">
                    <div className="flex items-center space-x-2 font-bold text-xs uppercase tracking-wide">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>CLIENTE INADIMPLENTE</span>
                    </div>
                    <div className="text-xs space-y-0.5">
                      <p>Débito: <span className="font-bold text-rose-700">R$ {lead.valorInadimplente?.toLocaleString('pt-BR')}</span></p>
                      <p>Atraso: <span className="font-bold text-rose-700">{lead.diasAtraso} dias</span></p>
                      <p>Fase atual: <span className="font-bold uppercase text-[10px] text-rose-700 bg-rose-100/50 px-1.5 py-0.5 rounded">
                        {lead.statusCobranca === "friendly" && "Lembrete Amigável"}
                        {lead.statusCobranca === "active" && "Cobrança Ativa"}
                        {lead.statusCobranca === "negotiation" && "Acordo / Parcelamento"}
                        {lead.statusCobranca === "legal" && "Cartório / SPC"}
                      </span></p>
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-3 text-sm text-slate-600">
                  <Building2 className="w-4.5 h-4.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="block text-xs text-slate-400">Como deve ser chamado</span>
                    <span className="font-semibold text-slate-700">{lead.nickname || "Não informado"}</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-sm text-slate-600">
                  <Mail className="w-4.5 h-4.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="block text-xs text-slate-400">E-mail</span>
                    <span className="font-semibold text-slate-700 select-all">{lead.email}</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-sm text-slate-600">
                  <Phone className="w-4.5 h-4.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="block text-xs text-slate-400">WhatsApp Comercial</span>
                    <span className="font-semibold text-slate-700 select-all">{lead.phone}</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-sm text-slate-600">
                  <DollarSign className="w-4.5 h-4.5 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="block text-xs text-slate-400">Valor Estimado</span>
                    <span className="font-semibold text-emerald-600 text-base">R$ {lead.value.toLocaleString('pt-BR')}</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-sm text-slate-600">
                  <Clock className="w-4.5 h-4.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="block text-xs text-slate-400">Cadastrado em</span>
                    <span className="font-medium text-slate-700">{new Date(lead.createdAt).toLocaleString('pt-BR')}</span>
                  </div>
                </div>

                {lead.lastContactAt && (
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Último Contato Realizado</span>
                    <span className="text-xs text-slate-600 font-medium">{new Date(lead.lastContactAt).toLocaleString('pt-BR')}</span>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-rose-200 hover:border-rose-300 hover:bg-rose-50 text-rose-600 text-xs font-semibold transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir Lead</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Interaction Hub & Timeline (7 Cols) */}
          <div className="md:col-span-7 p-6 flex flex-col h-[70vh] md:h-auto overflow-hidden">
            
            {/* Nav Tabs within Modal: Quick WhatsApp Template Sender vs Timeline logs */}
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase">Canal Direto de Comunicação (WhatsApp)</h3>
            </div>

            {/* Quick Sender Widget */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-3 mb-6 shrink-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Selecionar Modelo Rápido</label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="">-- Personalizado / Em branco --</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end justify-end">
                  <button
                    onClick={handleSendWhatsApp}
                    disabled={isLoading}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-500/10"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>WhatsApp com 1 Clique</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Mensagem Formatada (Suporta quebras de linha)</label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Selecione um modelo acima ou digite uma mensagem personalizada aqui..."
                  rows={3}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white"
                />
              </div>
            </div>

            {/* Note addition */}
            <form onSubmit={handleAddNote} className="mb-6 shrink-0">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-slate-500">Adicionar Anotação no Histórico</label>
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Ex: Ligamos hoje e pediu para enviar proposta na segunda."
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!newNote.trim() || isLoading}
                  className="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Incluir</span>
                </button>
              </div>
            </form>

            {/* Timeline Logs */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider sticky top-0 bg-white py-1">Histórico de Interações</h4>
              
              {lead.notes && lead.notes.length > 0 ? (
                <div className="relative border-l border-slate-100 pl-4 ml-2.5 space-y-5">
                  {lead.notes.slice().reverse().map((item) => (
                    <div key={item.id} className="relative">
                      {/* Timeline Dot */}
                      <span className="absolute -left-[23.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white" />
                      
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getTimelineBadge(item.type)}`}>
                            {getTimelineLabel(item.type)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(item.timestamp).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                          {item.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Sem registros de atividades no momento.
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
