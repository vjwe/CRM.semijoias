import React, { useState, useEffect } from "react";
import { 
  X, Building2, Sliders, Shield, Plus, Trash2, Check, Save, KeyRound, AlertCircle,
  HardDrive, Download, Upload, FileSpreadsheet, FileCode, CheckCircle2, Laptop, 
  Terminal, Copy, RefreshCw, FolderArchive
} from "lucide-react";
import { CompanyProfile, CustomFieldDefinition } from "../types";

interface DatabaseStatus {
  mode: string;
  isOfflineReady: boolean;
  dataDirectory: string;
  totalSizeKb: string;
  counts: {
    leads: number;
    templates: number;
    stages: number;
    campaigns: number;
    shortenedUrls: number;
    notifications: number;
    customFields: number;
    webhookLogs: number;
  };
  files: Array<{ name: string; sizeKb: string; updatedAt: string }>;
  environment?: {
    nodeVersion: string;
    platform: string;
    uptimeSeconds: number;
  };
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: CompanyProfile;
  customFields: CustomFieldDefinition[];
  onCompanyUpdated: (updated: CompanyProfile) => void;
  onCustomFieldsUpdated: (fields: CustomFieldDefinition[]) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  company,
  customFields,
  onCompanyUpdated,
  onCustomFieldsUpdated
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'company' | 'fields' | 'security' | 'database'>('company');

  // Company state
  const [companyForm, setCompanyForm] = useState<CompanyProfile>({ ...company });
  const [companySaving, setCompanySaving] = useState(false);
  const [companySuccess, setCompanySuccess] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);

  // Sync companyForm with company prop whenever company changes or modal opens
  useEffect(() => {
    if (company) {
      setCompanyForm({ ...company });
    }
  }, [company, isOpen]);

  // Custom fields state
  const [fieldsList, setFieldsList] = useState<CustomFieldDefinition[]>([...customFields]);
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<'text' | 'number' | 'select' | 'date' | 'boolean'>('text');
  const [newShowInTable, setNewShowInTable] = useState(true);
  const [newRequired, setNewRequired] = useState(false);
  const [fieldsSaving, setFieldsSaving] = useState(false);

  // Sync fieldsList with customFields prop whenever customFields changes or modal opens
  useEffect(() => {
    if (customFields) {
      setFieldsList([...customFields]);
    }
  }, [customFields, isOpen]);

  // Security state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [secStatus, setSecStatus] = useState<{ error?: string; success?: string }>({});
  const [secSaving, setSecSaving] = useState(false);

  // Local database state
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [dbLoading, setDbLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [copiedCommand, setCopiedCommand] = useState(false);

  const loadDatabaseStatus = async () => {
    setDbLoading(true);
    try {
      const res = await fetch("/api/database/status");
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      }
    } catch (err) {
      console.error("Erro ao carregar status do banco de dados local:", err);
    } finally {
      setDbLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'database' && isOpen) {
      loadDatabaseStatus();
    }
  }, [activeTab, isOpen]);

  const handleRestoreJsonFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setRestoreLoading(true);
    setRestoreSuccess(null);
    setRestoreError(null);

    try {
      const text = await file.text();
      const parsedData = JSON.parse(text);

      const res = await fetch("/api/database/restore-json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedData)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Falha ao processar arquivo de restauração.");
      }

      const result = await res.json();
      setRestoreSuccess(result.message || "Banco de dados restaurado com sucesso!");
      loadDatabaseStatus();
      setTimeout(() => setRestoreSuccess(null), 5000);
    } catch (err: any) {
      console.error("Erro ao restaurar arquivo:", err);
      setRestoreError(err.message || "Arquivo inválido ou corrompido.");
    } finally {
      setRestoreLoading(false);
      // Reset input value
      event.target.value = "";
    }
  };

  const copyLaunchCommand = () => {
    navigator.clipboard.writeText("npm install && npm run dev");
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2500);
  };

  if (!isOpen) return null;

  // Save company details
  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompanySaving(true);
    setCompanySuccess(false);
    setCompanyError(null);

    try {
      const response = await fetch("/api/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyForm)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Erro ao salvar dados da empresa.");
      }

      const data = await response.json();
      setCompanyForm(data);
      onCompanyUpdated(data);
      setCompanySuccess(true);
      setTimeout(() => setCompanySuccess(false), 3500);
    } catch (err: any) {
      console.error("Erro ao salvar empresa:", err);
      setCompanyError(err.message || "Não foi possível salvar as alterações.");
    } finally {
      setCompanySaving(false);
    }
  };

  // Add custom field
  const handleAddCustomField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    setFieldsSaving(true);
    try {
      const response = await fetch("/api/custom-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: newLabel,
          type: newType,
          showInTable: newShowInTable,
          required: newRequired
        })
      });

      if (response.ok) {
        const newField = await response.json();
        const updated = [...fieldsList, newField];
        setFieldsList(updated);
        onCustomFieldsUpdated(updated);
        setNewLabel("");
        setNewType("text");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFieldsSaving(false);
    }
  };

  // Delete custom field
  const handleDeleteCustomField = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este campo personalizado?")) return;

    try {
      const response = await fetch(`/api/custom-fields/${id}`, { method: "DELETE" });
      if (response.ok) {
        const updated = fieldsList.filter(f => f.id !== id);
        setFieldsList(updated);
        onCustomFieldsUpdated(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update Security Credentials
  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecStatus({});
    setSecSaving(true);

    try {
      const response = await fetch("/api/auth/credentials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newUsername: newUsername.trim() || undefined,
          newPassword: newPassword.trim() || undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erro ao atualizar senha");
      }

      setSecStatus({ success: "Credenciais de acesso atualizadas com sucesso!" });
      setCurrentPassword("");
      setNewUsername("");
      setNewPassword("");
    } catch (err: any) {
      setSecStatus({ error: err.message });
    } finally {
      setSecSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Configurações Gerais do CRM</h2>
              <p className="text-xs text-slate-500">Personalize dados da empresa, campos dinâmicos e credenciais</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 px-6 pt-2 bg-slate-50/30">
          <button
            onClick={() => setActiveTab('company')}
            className={`px-4 py-3 text-xs font-bold flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'company'
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Dados da Empresa</span>
          </button>

          <button
            onClick={() => setActiveTab('fields')}
            className={`px-4 py-3 text-xs font-bold flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'fields'
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Campos do Lead ({fieldsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-3 text-xs font-bold flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'security'
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Segurança & Senha</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`px-4 py-3 text-xs font-bold flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'database'
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Banco de Dados & Modo Local</span>
          </button>
        </div>

        {/* Body content per tab */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: COMPANY */}
          {activeTab === 'company' && (
            <form onSubmit={handleSaveCompany} className="space-y-4">
              {companySuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Dados da empresa salvos com sucesso!</span>
                </div>
              )}

              {companyError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{companyError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Nome Comercial da Empresa</label>
                  <input
                    type="text"
                    required
                    value={companyForm.name}
                    onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Slogan ou Subtítulo</label>
                  <input
                    type="text"
                    value={companyForm.subtitle}
                    onChange={(e) => setCompanyForm({ ...companyForm, subtitle: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Segmento de Atuação</label>
                  <input
                    type="text"
                    value={companyForm.segment}
                    onChange={(e) => setCompanyForm({ ...companyForm, segment: e.target.value })}
                    placeholder="Ex: Consultoria, Serviços, Varejo"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">CNPJ / CPF</label>
                  <input
                    type="text"
                    value={companyForm.document || ""}
                    onChange={(e) => setCompanyForm({ ...companyForm, document: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">E-mail Comercial</label>
                  <input
                    type="email"
                    value={companyForm.email || ""}
                    onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Telefone / WhatsApp Comercial</label>
                  <input
                    type="text"
                    value={companyForm.phone || ""}
                    onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-600 font-bold mb-1">Endereço Físico</label>
                  <input
                    type="text"
                    value={companyForm.address || ""}
                    onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Moeda (Símbolo)</label>
                  <input
                    type="text"
                    value={companyForm.currency || "R$"}
                    onChange={(e) => setCompanyForm({ ...companyForm, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Valor Estimado Padrão do Lead ({companyForm.currency})</label>
                  <input
                    type="number"
                    value={companyForm.defaultLeadValue || 1000}
                    onChange={(e) => setCompanyForm({ ...companyForm, defaultLeadValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={companySaving}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <Save className="w-4 h-4 text-emerald-400" />
                  <span>{companySaving ? "Salvando..." : "Salvar Dados da Empresa"}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: CUSTOM FIELDS */}
          {activeTab === 'fields' && (
            <div className="space-y-6">
              
              {/* Form to Add New Field */}
              <form onSubmit={handleAddCustomField} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                <h4 className="font-bold text-xs text-slate-800 flex items-center space-x-2">
                  <Plus className="w-4 h-4 text-emerald-500" />
                  <span>Criar Novo Campo Personalizado</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Nome do Campo (Rótulo)</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Segmento, CPF/CNPJ, Cargo"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Tipo de Dado</label>
                    <select
                      value={newType}
                      onChange={(e: any) => setNewType(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
                    >
                      <option value="text">Texto Simples</option>
                      <option value="number">Número</option>
                      <option value="date">Data</option>
                      <option value="boolean">Sim / Não (Checkbox)</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-4 pt-4">
                    <label className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newShowInTable}
                        onChange={(e) => setNewShowInTable(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Exibir na Tabela</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={fieldsSaving || !newLabel.trim()}
                    className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    + Adicionar Campo
                  </button>
                </div>
              </form>

              {/* List of Existing Fields */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-slate-700">Campos Personalizados Ativos ({fieldsList.length})</h4>
                
                {fieldsList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-4 text-center border border-dashed rounded-xl">
                    Nenhum campo personalizado cadastrado. Crie o primeiro acima!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {fieldsList.map((f) => (
                      <div key={f.id} className="flex items-center justify-between p-3.5 bg-white border border-slate-100 rounded-xl shadow-2xs hover:border-slate-200 transition-all">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-slate-50 text-slate-600 rounded-lg text-xs font-mono font-bold">
                            {f.id}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">{f.label}</span>
                            <span className="text-[10px] text-slate-400">Tipo: <strong className="text-slate-600">{f.type}</strong> {f.showInTable && "• Exibido na Tabela"}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteCustomField(f.id)}
                          className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Remover campo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: SECURITY */}
          {activeTab === 'security' && (
            <form onSubmit={handleSaveSecurity} className="space-y-4">
              {secStatus.error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
                  {secStatus.error}
                </div>
              )}
              {secStatus.success && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>{secStatus.success}</span>
                </div>
              )}

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-4 text-xs">
                <div className="flex items-center space-x-2 text-slate-800 font-bold">
                  <KeyRound className="w-4 h-4 text-emerald-500" />
                  <span>Alterar Credenciais de Acesso ao Sistema</span>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Senha Atual (Obrigatória)</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Digite a senha atual"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Novo Nome de Usuário (Opcional)</label>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="Deixe em branco para manter atual"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Nova Senha (Opcional)</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Deixe em branco para manter atual"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={secSaving || !currentPassword}
                  className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>{secSaving ? "Atualizando..." : "Atualizar Credenciais"}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: LOCAL DATABASE & OFFLINE ENGINE */}
          {activeTab === 'database' && (
            <div className="space-y-6">
              {/* Offline & Local Badge Banner */}
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-500/20">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white uppercase tracking-wider">
                        100% Offline
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">Banco de Dados Local Ativo</h3>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Seus dados residem exclusivamente no disco rígido do seu computador na pasta <code className="bg-white px-1.5 py-0.5 rounded border border-emerald-200 text-emerald-800 font-mono text-[11px]">./data/</code>.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={loadDatabaseStatus}
                  disabled={dbLoading}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 shrink-0 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${dbLoading ? "animate-spin text-emerald-600" : ""}`} />
                  <span>Atualizar Status</span>
                </button>
              </div>

              {/* Local Storage Metrics */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Métricas de Armazenamento Local</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Total de Leads</span>
                    <span className="text-lg font-extrabold text-slate-900">{dbStatus?.counts.leads ?? "0"}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Modelos WhatsApp</span>
                    <span className="text-lg font-extrabold text-slate-900">{dbStatus?.counts.templates ?? "0"}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Campanhas Ads</span>
                    <span className="text-lg font-extrabold text-slate-900">{dbStatus?.counts.campaigns ?? "0"}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Tamanho no Disco</span>
                    <span className="text-lg font-extrabold text-emerald-600">{dbStatus?.totalSizeKb ?? "0 KB"}</span>
                  </div>
                </div>
              </div>

              {/* Export & Backup Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cópia de Segurança & Exportação</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Backup ZIP */}
                  <a
                    href="/api/database/backup-zip"
                    download
                    className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 transition-all shadow-xs flex flex-col justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <FolderArchive className="w-4 h-4" />
                      </div>
                      <h5 className="text-xs font-bold text-slate-900">Backup Completo (ZIP)</h5>
                      <p className="text-[11px] text-slate-500 mt-1">Todos os arquivos JSON do banco empacotados em um único arquivo compactado.</p>
                    </div>
                    <div className="mt-4 flex items-center text-xs font-bold text-emerald-600 space-x-1">
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar ZIP</span>
                    </div>
                  </a>

                  {/* Export Leads CSV */}
                  <a
                    href="/api/database/export-leads-csv"
                    download
                    className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 transition-all shadow-xs flex flex-col justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-2.5 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <h5 className="text-xs font-bold text-slate-900">Planilha de Leads (CSV)</h5>
                      <p className="text-[11px] text-slate-500 mt-1">Exportação compatível com Microsoft Excel, Google Sheets e LibreOffice Calc.</p>
                    </div>
                    <div className="mt-4 flex items-center text-xs font-bold text-sky-600 space-x-1">
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar CSV</span>
                    </div>
                  </a>

                  {/* Export JSON Dump */}
                  <a
                    href="/api/database/export-json"
                    download
                    className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 transition-all shadow-xs flex flex-col justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2.5 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <FileCode className="w-4 h-4" />
                      </div>
                      <h5 className="text-xs font-bold text-slate-900">Dump Completo (JSON)</h5>
                      <p className="text-[11px] text-slate-500 mt-1">Arquivo unificado de dados para migração ou cópias de restauração rápida.</p>
                    </div>
                    <div className="mt-4 flex items-center text-xs font-bold text-purple-600 space-x-1">
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar JSON</span>
                    </div>
                  </a>
                </div>
              </div>

              {/* Restore Section */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center space-x-2">
                  <Upload className="w-4 h-4 text-slate-700" />
                  <h4 className="text-xs font-bold text-slate-900">Restaurar Banco de Dados a Partir de Backup</h4>
                </div>
                <p className="text-xs text-slate-600">
                  Selecione um arquivo de backup no formato <code className="text-slate-800 font-mono font-bold">.json</code> (exportado pelo botão "Dump Completo") para restaurar leads, funis e modelos.
                </p>

                {restoreSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>{restoreSuccess}</span>
                  </div>
                )}

                {restoreError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    <span>{restoreError}</span>
                  </div>
                )}

                <div>
                  <label className="inline-flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer space-x-2">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{restoreLoading ? "Restaurando..." : "Selecionar Arquivo de Backup (JSON)"}</span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      disabled={restoreLoading}
                      onChange={handleRestoreJsonFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* How to run locally instructions */}
              <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Laptop className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold text-white">Como Executar Localmente na Sua Máquina</h4>
                  </div>
                  <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Porta: 3000</span>
                </div>

                <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    1. Baixe o projeto para seu computador e certifique-se de ter o <strong>Node.js</strong> instalado (<a href="https://nodejs.org" target="_blank" rel="noreferrer" className="text-emerald-400 underline">nodejs.org</a>).
                  </p>
                  <p>
                    2. No <strong>Windows</strong>: Dê um duplo clique no arquivo <code className="text-emerald-400 font-mono">iniciar-crm-windows.bat</code>. Ele instalará os pacotes e abrirá o navegador automaticamente em <code className="text-emerald-400 font-mono">http://localhost:3000</code>.
                  </p>
                  <p>
                    3. No <strong>Mac ou Linux</strong>: Execute o script <code className="text-emerald-400 font-mono">./iniciar-crm-linux-mac.sh</code> ou use o comando no terminal:
                  </p>
                </div>

                <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400">
                  <span>npm install && npm run dev</span>
                  <button
                    type="button"
                    onClick={copyLaunchCommand}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer flex items-center space-x-1"
                    title="Copiar comando"
                  >
                    {copiedCommand ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] text-emerald-400">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[10px] text-slate-300">Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
