import React, { useState } from "react";
import { MessageSquare, Plus, Trash2, Edit2, Check, X, HelpCircle } from "lucide-react";
import { MessageTemplate } from "../types";

interface TemplatesViewProps {
  templates: MessageTemplate[];
  onTemplatesChange: () => void;
}

export default function TemplatesView({ templates, onTemplatesChange }: TemplatesViewProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<MessageTemplate['category']>("introduction");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Variables preview substitute
  const getPreviewMessage = (msgText: string) => {
    return msgText
      .replace(/{nome}/g, "João Silva")
      .replace(/{apelido}/g, "Joãozinho")
      .replace(/{chamado}/g, "Joãozinho")
      .replace(/{empresa}/g, "Joãozinho")
      .replace(/{valor}/g, "5.400,00")
      .replace(/{email}/g, "joao@acme.com");
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
          category,
          message
        })
      });

      if (response.ok) {
        onTemplatesChange();
        setName("");
        setMessage("");
        setCategory("introduction");
        setEditingId(null);
        setShowForm(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este modelo de mensagem?")) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        onTemplatesChange();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (template: MessageTemplate) => {
    setEditingId(template.id);
    setName(template.name);
    setCategory(template.category);
    setMessage(template.message);
    setShowForm(true);
  };

  const cancelForm = () => {
    setEditingId(null);
    setName("");
    setCategory("introduction");
    setMessage("");
    setShowForm(false);
  };

  const getCategoryBadge = (cat: MessageTemplate['category']) => {
    switch (cat) {
      case "introduction":
        return "bg-sky-50 text-sky-700 border-sky-100";
      case "followup":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "proposal":
        return "bg-indigo-50 text-indigo-700 border-indigo-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  const getCategoryLabel = (cat: MessageTemplate['category']) => {
    switch (cat) {
      case "introduction": return "Primeiro Contato / Apresentação";
      case "followup": return "Follow-up / Cobrança";
      case "proposal": return "Apresentação de Proposta / Fechamento";
      default: return "Outros / Avisos";
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Toggle Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Modelos de WhatsApp</h2>
          <p className="text-xs text-slate-400 mt-0.5">Defina templates de mensagens comerciais e economize tempo</p>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1 shadow-md shadow-emerald-600/10"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Modelo</span>
          </button>
        )}
      </div>

      {/* Form Overlay Card */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4 animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm">
              {editingId ? "Editar Modelo de Mensagem" : "Cadastrar Novo Modelo"}
            </h3>
            <button type="button" onClick={cancelForm} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Template Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Título do Modelo (Identificação interna)</label>
                <input
                  type="text"
                  placeholder="Ex: Follow-up 3 dias após proposta"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Categoria de Mensagem</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as MessageTemplate['category'])}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="introduction">Primeiro Contato / Apresentação</option>
                  <option value="followup">Follow-up / Acompanhamento</option>
                  <option value="proposal">Proposta Comercial / Fechamento</option>
                  <option value="other">Outros / Informativos</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Texto da Mensagem (WhatsApp)</label>
                <textarea
                  placeholder="Olá, {apelido}. Vamos conversar?..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={5}
                  className="w-full p-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>
            </div>

            {/* Dynamic Guide & Live Preview */}
            <div className="space-y-4 bg-slate-50 p-4 rounded-xl flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                  <HelpCircle className="w-4 h-4 text-emerald-500" />
                  <span>Substituição Dinâmica de Variáveis</span>
                </h4>
                <p className="text-[10px] text-slate-500 mt-1">
                  Você pode usar chaves para que o CRM preencha automaticamente os dados do lead ao abrir o WhatsApp comercial:
                </p>
                <div className="grid grid-cols-2 gap-2 mt-2.5 text-[10px] font-mono text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100">
                  <div><strong className="text-emerald-600">{"{nome}"}</strong> - Nome Completo</div>
                  <div><strong className="text-emerald-600">{"{apelido}"}</strong> - Como chamar (Apelido)</div>
                  <div><strong className="text-emerald-600">{"{valor}"}</strong> - Valor R$</div>
                  <div><strong className="text-emerald-600">{"{email}"}</strong> - E-mail do Lead</div>
                </div>
              </div>

              {/* Real-time preview */}
              <div className="flex-1 mt-4 flex flex-col">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Visualização do Envio Rápido</span>
                <div className="flex-1 bg-white border border-slate-150 p-3 rounded-lg text-[11px] text-slate-600 leading-relaxed font-sans overflow-y-auto whitespace-pre-wrap select-none min-h-[100px]">
                  {message.trim() ? getPreviewMessage(message) : <span className="text-slate-300 italic">Preencha o modelo à esquerda para ver a simulação com um lead de teste...</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={cancelForm}
              className="text-xs font-semibold px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 py-2 rounded-xl transition-colors shadow-md shadow-emerald-600/10 flex items-center space-x-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Salvar Modelo</span>
            </button>
          </div>
        </form>
      )}

      {/* Grid of Templates cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {templates.length > 0 ? (
          templates.map((temp) => (
            <div
              key={temp.id}
              className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase ${getCategoryBadge(temp.category)}`}>
                    {getCategoryLabel(temp.category).split(" / ")[0]}
                  </span>
                  
                  {/* Action buttons */}
                  <div className="flex items-center space-x-1 opacity-60 hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(temp)}
                      className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(temp.id)}
                      className="p-1 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-800 text-xs leading-snug">{temp.name}</h4>
                  <div className="mt-2.5 p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600 leading-relaxed font-sans whitespace-pre-wrap">
                    {temp.message}
                  </div>
                </div>
              </div>

              {/* Preview with test data banner */}
              <div className="border-t border-slate-100/50 pt-2.5 text-[10px] text-slate-400 font-medium flex items-center justify-between">
                <span>Contém {temp.message.split("{").length - 1} variáveis</span>
                <span className="text-emerald-600 font-semibold select-none">Ativo para WhatsApp</span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-16 text-slate-400 text-xs bg-white border border-dashed border-slate-200 rounded-2xl">
            Nenhum modelo de WhatsApp cadastrado. Clique em Novo Modelo para cadastrar.
          </div>
        )}
      </div>

    </div>
  );
}
