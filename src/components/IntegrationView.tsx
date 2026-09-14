import React, { useState, useEffect } from "react";
import { KeyRound, Copy, RefreshCw, Check, Terminal, Send, Info, Download, Globe, Code, Sparkles, Layers, CheckCircle2, Play, Layout, SlidersHorizontal, Monitor, BookOpen, HelpCircle, FileText, ExternalLink, ShieldCheck, AlertTriangle, AlertCircle, X, Eye, Trash2, Clock } from "lucide-react";
import { CustomFieldDefinition, WebhookLog } from "../types";

interface IntegrationViewProps {
  onIntegrationTriggered: () => void;
  customFields?: CustomFieldDefinition[];
}

export default function IntegrationView({ onIntegrationTriggered, customFields = [] }: IntegrationViewProps) {
  const [apiKey, setApiKey] = useState("");
  const [isCopiedKey, setIsCopiedKey] = useState(false);
  const [isCopiedCurl, setIsCopiedCurl] = useState(false);
  const [isLoadingKey, setIsLoadingKey] = useState(false);

  // Active top tab in Integration View
  const [activeTab, setActiveTab] = useState<'form_builder' | 'wordpress' | 'webhook_api' | 'webhook_logs' | 'tutorial'>('form_builder');

  // Webhook Logs State
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  const [isCopiedLogPayload, setIsCopiedLogPayload] = useState(false);

  // Payload tester state
  const [testName, setTestName] = useState("Joaquim Barbosa");
  const [testNickname, setTestNickname] = useState("Quinzinho");
  const [testEmail, setTestEmail] = useState("joaquim@barbosa.com.br");
  const [testPhone, setTestPhone] = useState("11977771234");
  const [testValue, setTestValue] = useState("15500");
  const [testSource, setTestSource] = useState("Site / Formulario de Contato");
  const [testNotes, setTestNotes] = useState("Gostaria de saber o prazo para implantação do sistema comercial.");

  // Test request status
  const [testLoading, setTestLoading] = useState(false);
  const [testResponse, setTestResponse] = useState<any | null>(null);
  const [testStatus, setTestStatus] = useState<number | null>(null);

  // ---------------------------------------------------------------------------
  // UNIVERSAL FORM BUILDER STATE
  // ---------------------------------------------------------------------------
  const [builderTitle, setBuilderTitle] = useState("Solicitar Atendimento Comercial");
  const [builderSubtitle, setBuilderSubtitle] = useState("Preencha os dados abaixo e entraremos em contato rapidamente via WhatsApp.");
  const [builderButtonText, setBuilderButtonText] = useState("Enviar e Falar com Consultor");
  const [builderTheme, setBuilderTheme] = useState<'light' | 'dark' | 'blue' | 'minimal'>('light');
  const [builderRedirectUrl, setBuilderRedirectUrl] = useState("");
  const [builderSuccessMsg, setBuilderSuccessMsg] = useState("Obrigado! Seus dados foram enviados com sucesso. Entraremos em contato em breve.");
  
  // Field toggles
  const [includeEmail, setIncludeEmail] = useState(true);
  const [includeValue, setIncludeValue] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [selectedCustomFields, setSelectedCustomFields] = useState<string[]>([]);

  // Generated code active tab
  const [codeType, setCodeType] = useState<'html_js' | 'wp_shortcode' | 'react' | 'curl'>('html_js');
  const [isCopiedSnippet, setIsCopiedSnippet] = useState(false);

  // Interactive Live Preview Simulation State inside the Builder
  const [previewName, setPreviewName] = useState("");
  const [previewEmail, setPreviewEmail] = useState("");
  const [previewPhone, setPreviewPhone] = useState("");
  const [previewValue, setPreviewValue] = useState("");
  const [previewNotes, setPreviewNotes] = useState("");
  const [previewCustomValues, setPreviewCustomValues] = useState<Record<string, string>>({});
  const [previewSubmitting, setPreviewSubmitting] = useState(false);
  const [previewSuccess, setPreviewSuccess] = useState(false);

  const fetchApiKey = async () => {
    setIsLoadingKey(true);
    try {
      const response = await fetch("/api/integration/key");
      if (response.ok) {
        const data = await response.json();
        setApiKey(data.apiKey);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingKey(false);
    }
  };

  const regenerateKey = async () => {
    if (!confirm("Tem certeza que deseja revogar e gerar uma nova Chave de API? Integrações antigas deixarão de funcionar!")) return;
    setIsLoadingKey(true);
    try {
      const response = await fetch("/api/integration/key/regenerate", { method: "POST" });
      if (response.ok) {
        const data = await response.json();
        setApiKey(data.apiKey);
        setTestResponse(null);
        setTestStatus(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingKey(false);
    }
  };

  const fetchWebhookLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch("/api/integration/webhook-logs?limit=10");
      if (res.ok) {
        const data = await res.json();
        setWebhookLogs(data);
      }
    } catch (err) {
      console.error("Erro ao carregar logs de webhooks:", err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const clearWebhookLogs = async () => {
    if (!confirm("Tem certeza que deseja zerar o histórico de logs de webhooks de entrada?")) return;
    try {
      const res = await fetch("/api/integration/webhook-logs", { method: "DELETE" });
      if (res.ok) {
        setWebhookLogs([]);
      }
    } catch (err) {
      console.error("Erro ao limpar logs de webhooks:", err);
    }
  };

  useEffect(() => {
    fetchApiKey();
    fetchWebhookLogs();
  }, []);

  useEffect(() => {
    if (activeTab === 'webhook_logs') {
      fetchWebhookLogs();
    }
  }, [activeTab]);

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const appDomain = typeof window !== "undefined" ? window.location.origin : "https://sua-url-app.com";
  const webhookUrl = `${appDomain}/api/leads/webhook`;

  const toggleCustomField = (id: string) => {
    setSelectedCustomFields(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Dynamic cURL command text
  const curlCommand = `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -H "X-CRM-API-Key: ${apiKey || "SUA_CHAVE_AQUI"}" \\
  -d '{
    "name": "${testName}",
    "nickname": "${testNickname}",
    "email": "${testEmail}",
    "phone": "${testPhone}",
    "value": ${Number(testValue) || 0},
    "source": "${testSource}",
    "notes": "${testNotes}"
  }'`;

  // Submit mock test request from webhook tester
  const handleTestWebhook = async () => {
    setTestLoading(true);
    setTestResponse(null);
    setTestStatus(null);

    try {
      const response = await fetch("/api/leads/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CRM-API-Key": apiKey
        },
        body: JSON.stringify({
          name: testName,
          nickname: testNickname,
          email: testEmail,
          phone: testPhone,
          value: Number(testValue) || 0,
          source: testSource,
          notes: testNotes
        })
      });

      setTestStatus(response.status);
      const data = await response.json();
      setTestResponse(data);

      if (response.ok) {
        onIntegrationTriggered();
      }
      fetchWebhookLogs();
    } catch (err) {
      setTestResponse({ error: "Falha na comunicação ou CORS blocked" });
      fetchWebhookLogs();
    } finally {
      setTestLoading(false);
    }
  };

  // Live preview form submission inside the Form Builder tab
  const handleLivePreviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPreviewSubmitting(true);
    setPreviewSuccess(false);

    try {
      const response = await fetch("/api/leads/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CRM-API-Key": apiKey
        },
        body: JSON.stringify({
          name: previewName || "Lead Teste Formulário",
          email: previewEmail,
          phone: previewPhone || "11999998888",
          value: Number(previewValue) || 0,
          source: "Formulário Incorporado (Site/Landing Page)",
          notes: previewNotes,
          customFields: previewCustomValues
        })
      });

      if (response.ok) {
        setPreviewSuccess(true);
        onIntegrationTriggered();
        setTimeout(() => {
          setPreviewName("");
          setPreviewEmail("");
          setPreviewPhone("");
          setPreviewValue("");
          setPreviewNotes("");
          setPreviewCustomValues({});
          setPreviewSuccess(false);
        }, 3500);
      }
    } catch (err) {
      alert("Falha ao entregar o formulário ao CRM.");
    } finally {
      setPreviewSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // CODE SNIPPET GENERATION
  // ---------------------------------------------------------------------------
  const getThemeStyles = () => {
    switch (builderTheme) {
      case 'dark':
        return {
          bg: '#0f172a',
          card: '#1e293b',
          text: '#f8fafc',
          subtext: '#94a3b8',
          border: '#334155',
          inputBg: '#0f172a',
          inputText: '#f8fafc',
          btnBg: '#10b981',
          btnText: '#0f172a'
        };
      case 'blue':
        return {
          bg: '#f0f9ff',
          card: '#ffffff',
          text: '#0c4a6e',
          subtext: '#0369a1',
          border: '#bae6fd',
          inputBg: '#ffffff',
          inputText: '#0c4a6e',
          btnBg: '#0284c7',
          btnText: '#ffffff'
        };
      case 'minimal':
        return {
          bg: 'transparent',
          card: '#ffffff',
          text: '#1e293b',
          subtext: '#64748b',
          border: '#e2e8f0',
          inputBg: '#f8fafc',
          inputText: '#1e293b',
          btnBg: '#0f172a',
          btnText: '#ffffff'
        };
      default: // light
        return {
          bg: '#f8fafc',
          card: '#ffffff',
          text: '#0f172a',
          subtext: '#475569',
          border: '#e2e8f0',
          inputBg: '#ffffff',
          inputText: '#0f172a',
          btnBg: '#10b981',
          btnText: '#ffffff'
        };
    }
  };

  const st = getThemeStyles();

  // Selected fields string for shortcode
  const shortcodeFieldsList = [
    'name',
    includeEmail ? 'email' : null,
    'phone',
    includeValue ? 'value' : null,
    includeNotes ? 'notes' : null,
    ...selectedCustomFields
  ].filter(Boolean).join(',');

  const generateHtmlJsSnippet = () => {
    return `<!-- Formulario de Captura de Leads CRM WhatsCRM -->
<div id="crm-lead-form-wrapper" style="max-width: 500px; margin: 0 auto; padding: 24px; background: ${st.card}; border: 1px solid ${st.border}; border-radius: 16px; font-family: system-ui, -apple-system, sans-serif; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
  
  ${builderTitle ? `<h3 style="margin: 0 0 8px 0; color: ${st.text}; font-size: 20px; font-weight: 800; text-align: center;">${builderTitle}</h3>` : ''}
  ${builderSubtitle ? `<p style="margin: 0 0 20px 0; color: ${st.subtext}; font-size: 13px; text-align: center; line-height: 1.5;">${builderSubtitle}</p>` : ''}

  <form id="crm-lead-form" onsubmit="return submitCrmLeadForm(event)">
    <div style="margin-bottom: 14px;">
      <label style="display: block; font-size: 12px; font-weight: 700; color: ${st.subtext}; margin-bottom: 4px;">Nome Completo *</label>
      <input type="text" name="name" required placeholder="Seu nome completo" style="width: 100%; padding: 11px 14px; background: ${st.inputBg}; color: ${st.inputText}; border: 1px solid ${st.border}; border-radius: 10px; font-size: 14px; box-sizing: border-box;" />
    </div>

    ${includeEmail ? `<div style="margin-bottom: 14px;">
      <label style="display: block; font-size: 12px; font-weight: 700; color: ${st.subtext}; margin-bottom: 4px;">E-mail *</label>
      <input type="email" name="email" required placeholder="seu@email.com" style="width: 100%; padding: 11px 14px; background: ${st.inputBg}; color: ${st.inputText}; border: 1px solid ${st.border}; border-radius: 10px; font-size: 14px; box-sizing: border-box;" />
    </div>` : ''}

    <div style="margin-bottom: 14px;">
      <label style="display: block; font-size: 12px; font-weight: 700; color: ${st.subtext}; margin-bottom: 4px;">WhatsApp / Telefone *</label>
      <input type="tel" name="phone" required placeholder="(11) 99999-9999" style="width: 100%; padding: 11px 14px; background: ${st.inputBg}; color: ${st.inputText}; border: 1px solid ${st.border}; border-radius: 10px; font-size: 14px; box-sizing: border-box;" />
    </div>

    ${includeValue ? `<div style="margin-bottom: 14px;">
      <label style="display: block; font-size: 12px; font-weight: 700; color: ${st.subtext}; margin-bottom: 4px;">Valor Estimado (R$)</label>
      <input type="number" name="value" placeholder="1500" style="width: 100%; padding: 11px 14px; background: ${st.inputBg}; color: ${st.inputText}; border: 1px solid ${st.border}; border-radius: 10px; font-size: 14px; box-sizing: border-box;" />
    </div>` : ''}

    ${selectedCustomFields.map(fId => {
      const fDef = customFields.find(c => c.id === fId);
      const label = fDef ? fDef.label : fId;
      return `<div style="margin-bottom: 14px;">
      <label style="display: block; font-size: 12px; font-weight: 700; color: ${st.subtext}; margin-bottom: 4px;">${label}</label>
      <input type="text" name="${fId}" placeholder="" style="width: 100%; padding: 11px 14px; background: ${st.inputBg}; color: ${st.inputText}; border: 1px solid ${st.border}; border-radius: 10px; font-size: 14px; box-sizing: border-box;" />
    </div>`;
    }).join('\n    ')}

    ${includeNotes ? `<div style="margin-bottom: 16px;">
      <label style="display: block; font-size: 12px; font-weight: 700; color: ${st.subtext}; margin-bottom: 4px;">Mensagem / Detalhes</label>
      <textarea name="notes" rows="3" placeholder="Como podemos te ajudar?" style="width: 100%; padding: 11px 14px; background: ${st.inputBg}; color: ${st.inputText}; border: 1px solid ${st.border}; border-radius: 10px; font-size: 14px; box-sizing: border-box;"></textarea>
    </div>` : ''}

    <button type="submit" id="crm-submit-btn" style="width: 100%; background: ${st.btnBg}; color: ${st.btnText}; font-weight: 800; font-size: 15px; padding: 14px; border: none; border-radius: 10px; cursor: pointer; transition: opacity 0.2s;">
      ${builderButtonText}
    </button>
    
    <div id="crm-status-msg" style="margin-top: 14px; font-size: 13px; font-weight: 600; text-align: center; display: none;"></div>
  </form>
</div>

<script>
function submitCrmLeadForm(event) {
  event.preventDefault();
  var form = event.target;
  var btn = document.getElementById('crm-submit-btn');
  var msg = document.getElementById('crm-status-msg');
  var formData = new FormData(form);

  var payload = {
    name: formData.get('name'),
    email: formData.get('email') || '',
    phone: formData.get('phone'),
    value: parseFloat(formData.get('value')) || 0,
    notes: formData.get('notes') || '',
    source: 'Formulario Website (HTML)',
    api_key: '${apiKey}',
    customFields: {}
  };

  // Extract custom fields
  for (var pair of formData.entries()) {
    if (pair[0].indexOf('cf_') === 0) {
      payload.customFields[pair[0]] = pair[1];
    }
  }

  btn.disabled = true;
  btn.innerText = 'Enviando...';
  msg.style.display = 'none';

  fetch('${webhookUrl}', {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      'X-CRM-API-Key': '${apiKey}'
    },
    body: JSON.stringify(payload)
  })
  .then(function(res) {
    if (!res.ok) {
      return res.json().then(function(errData) {
        throw new Error(errData.error || errData.message || 'Erro ' + res.status);
      }).catch(function() {
        throw new Error('Erro HTTP ' + res.status);
      });
    }
    return res.json();
  })
  .then(function(data) {
    btn.disabled = false;
    btn.innerText = '✓ Enviado!';
    msg.style.display = 'block';
    msg.style.color = '#10b981';
    msg.innerText = '${builderSuccessMsg}';
    form.reset();
    ${builderRedirectUrl ? `setTimeout(function(){ window.location.href = '${builderRedirectUrl}'; }, 1000);` : ''}
  })
  .catch(function(err) {
    btn.disabled = false;
    btn.innerText = '${builderButtonText}';
    msg.style.display = 'block';
    msg.style.color = '#ef4444';
    msg.innerText = 'Falha ao enviar: ' + (err.message || 'Verifique a conexão ou a API Key');
  });

  return false;
}
</script>`;
  };

  const generateReactSnippet = () => {
    return `import React, { useState } from 'react';

export default function LeadCaptureForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    value: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('${webhookUrl}', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CRM-API-Key': '${apiKey}'
        },
        body: JSON.stringify({
          ...formData,
          value: Number(formData.value) || 0,
          source: 'React App'
        })
      });

      if (response.ok) {
        setSuccess(true);
        setFormData({ name: '', email: '', phone: '', value: '', notes: '' });
      }
    } catch (err) {
      alert('Erro ao enviarLead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white rounded-2xl border border-slate-100 shadow-xl max-w-md mx-auto space-y-4">
      <h3 className="font-extrabold text-lg text-slate-900">${builderTitle}</h3>
      
      <input
        type="text"
        required
        placeholder="Nome Completo *"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        className="w-full px-3 py-2 border rounded-xl text-sm"
      />

      <input
        type="email"
        required
        placeholder="E-mail *"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        className="w-full px-3 py-2 border rounded-xl text-sm"
      />

      <input
        type="tel"
        required
        placeholder="WhatsApp *"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        className="w-full px-3 py-2 border rounded-xl text-sm"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-xl transition-all"
      >
        {loading ? 'Enviando...' : '${builderButtonText}'}
      </button>

      {success && <p className="text-emerald-600 text-xs text-center font-bold">${builderSuccessMsg}</p>}
    </form>
  );
}`;
  };

  const getActiveCodeText = () => {
    switch (codeType) {
      case 'wp_shortcode':
        return `[crm_lead_form title="${builderTitle}" button="${builderButtonText}" button_color="${st.btnBg}" fields="${shortcodeFieldsList}"${builderRedirectUrl ? ` redirect="${builderRedirectUrl}"` : ''}]`;
      case 'react':
        return generateReactSnippet();
      case 'curl':
        return curlCommand;
      default:
        return generateHtmlJsSnippet();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Integração Universal
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-100 flex items-center space-x-2">
              <KeyRound className="w-6 h-6 text-emerald-400" />
              <span>Gerador de Formulários & API Webhook</span>
            </h2>
            <p className="text-xs text-slate-400 max-w-xl">
              Crie formulários HTML altamente customizados para qualquer site (Wix, Webflow, WordPress, React) ou integre diretamente via endpoint POST seguro.
            </p>
          </div>
          
          {/* Key showcase container */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2 shrink-0">
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Chave Secreta da API</span>
            <div className="flex items-center space-x-3">
              <code className="font-mono text-xs text-emerald-400 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-850 select-all font-bold">
                {apiKey || "carregando..."}
              </code>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => copyToClipboard(apiKey, setIsCopiedKey)}
                  className="p-2 hover:bg-slate-850 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
                  title="Copiar Chave"
                >
                  {isCopiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={regenerateKey}
                  disabled={isLoadingKey}
                  className="p-2 hover:bg-slate-850 rounded-xl text-slate-400 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
                  title="Revogar e Criar Nova Chave"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingKey ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-slate-800/80 flex-wrap gap-y-2">
          <button
            onClick={() => setActiveTab('form_builder')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'form_builder'
                ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Construtor de Formulários Universal</span>
          </button>

          <button
            onClick={() => setActiveTab('wordpress')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'wordpress'
                ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Plugin WordPress (ZIP)</span>
          </button>

          <button
            onClick={() => setActiveTab('webhook_api')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'webhook_api'
                ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Testador de Webhook & cURL</span>
          </button>

          <button
            onClick={() => setActiveTab('webhook_logs')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer relative ${
              activeTab === 'webhook_logs'
                ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Logs de Eventos (Últimos 10)</span>
            {webhookLogs.some(l => l.status !== 201 && !l.success) && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('tutorial')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'tutorial'
                ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                : "bg-indigo-900/60 text-indigo-200 border border-indigo-700/50 hover:bg-indigo-800 hover:text-white"
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>📖 Tutorial & Guia de Uso</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: UNIVERSAL FORM BUILDER
      ========================================================================= */}
      {activeTab === 'form_builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Controls Column (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-5">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
                <SlidersHorizontal className="w-5 h-5 text-emerald-500" />
                <h3 className="font-extrabold text-slate-900 text-sm">Personalização do Formulário</h3>
              </div>

              {/* Form texts */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Título Principal do Formulário</label>
                  <input
                    type="text"
                    value={builderTitle}
                    onChange={(e) => setBuilderTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Subtítulo / Descrição Instrucional</label>
                  <input
                    type="text"
                    value={builderSubtitle}
                    onChange={(e) => setBuilderSubtitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Texto do Botão de Envio</label>
                  <input
                    type="text"
                    value={builderButtonText}
                    onChange={(e) => setBuilderButtonText(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Tema / Estilo Visual</label>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setBuilderTheme('light')}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                        builderTheme === 'light' ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-slate-200 text-slate-600"
                      }`}
                    >
                      ☀️ Clean Light
                    </button>
                    <button
                      type="button"
                      onClick={() => setBuilderTheme('dark')}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                        builderTheme === 'dark' ? "border-emerald-500 bg-slate-900 text-white" : "border-slate-200 text-slate-600"
                      }`}
                    >
                      🌙 Dark Emerald
                    </button>
                    <button
                      type="button"
                      onClick={() => setBuilderTheme('blue')}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                        builderTheme === 'blue' ? "border-sky-500 bg-sky-50 text-sky-900" : "border-slate-200 text-slate-600"
                      }`}
                    >
                      🟦 Corporate Blue
                    </button>
                    <button
                      type="button"
                      onClick={() => setBuilderTheme('minimal')}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                        builderTheme === 'minimal' ? "border-slate-800 bg-slate-100 text-slate-900" : "border-slate-200 text-slate-600"
                      }`}
                    >
                      Minimalista
                    </button>
                  </div>
                </div>

                {/* Fields Selection */}
                <div className="pt-2">
                  <label className="block text-slate-600 font-bold mb-2">Campos a Exibir:</label>
                  <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <label className="flex items-center space-x-2 text-slate-700 font-bold opacity-70">
                      <input type="checkbox" checked disabled className="rounded text-emerald-600" />
                      <span>Nome Completo * (Obrigatório)</span>
                    </label>

                    <label className="flex items-center space-x-2 text-slate-700 font-bold opacity-70">
                      <input type="checkbox" checked disabled className="rounded text-emerald-600" />
                      <span>WhatsApp / Telefone * (Obrigatório)</span>
                    </label>

                    <label className="flex items-center space-x-2 text-slate-700 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeEmail}
                        onChange={(e) => setIncludeEmail(e.target.checked)}
                        className="rounded text-emerald-600"
                      />
                      <span>E-mail</span>
                    </label>

                    <label className="flex items-center space-x-2 text-slate-700 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeValue}
                        onChange={(e) => setIncludeValue(e.target.checked)}
                        className="rounded text-emerald-600"
                      />
                      <span>Valor Estimado (R$)</span>
                    </label>

                    <label className="flex items-center space-x-2 text-slate-700 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeNotes}
                        onChange={(e) => setIncludeNotes(e.target.checked)}
                        className="rounded text-emerald-600"
                      />
                      <span>Mensagem / Observações</span>
                    </label>

                    {/* Dynamic Custom Fields */}
                    {customFields.length > 0 && (
                      <div className="pt-2 border-t border-slate-200 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Campos Personalizados do CRM</span>
                        {customFields.map((cf) => (
                          <label key={cf.id} className="flex items-center space-x-2 text-slate-700 font-medium cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedCustomFields.includes(cf.id)}
                              onChange={() => toggleCustomField(cf.id)}
                              className="rounded text-emerald-600"
                            />
                            <span>{cf.label} ({cf.id})</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">URL de Redirecionamento Pós-Envio (Opcional)</label>
                  <input
                    type="url"
                    value={builderRedirectUrl}
                    onChange={(e) => setBuilderRedirectUrl(e.target.value)}
                    placeholder="Ex: https://seusite.com/obrigado"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Preview & Generated Code (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Live Interactive Preview Box */}
            <div className="bg-slate-100 p-6 rounded-3xl border border-slate-200 shadow-inner space-y-3">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center space-x-2 text-slate-700 font-bold text-xs">
                  <Monitor className="w-4 h-4 text-emerald-600" />
                  <span>Pré-Visualização em Tempo Real (Pode Testar)</span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Ao enviar, cria lead real no CRM
                </span>
              </div>

              {/* Rendered form component inside simulator */}
              <div style={{ background: st.card, borderColor: st.border }} className="p-6 rounded-2xl border shadow-lg transition-all">
                {builderTitle && <h3 style={{ color: st.text }} className="text-lg font-extrabold text-center mb-1">{builderTitle}</h3>}
                {builderSubtitle && <p style={{ color: st.subtext }} className="text-xs text-center mb-5 leading-relaxed">{builderSubtitle}</p>}

                <form onSubmit={handleLivePreviewSubmit} className="space-y-3 text-xs">
                  <div>
                    <label style={{ color: st.subtext }} className="block font-bold mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Seu nome"
                      value={previewName}
                      onChange={(e) => setPreviewName(e.target.value)}
                      style={{ background: st.inputBg, color: st.inputText, borderColor: st.border }}
                      className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {includeEmail && (
                    <div>
                      <label style={{ color: st.subtext }} className="block font-bold mb-1">E-mail *</label>
                      <input
                        type="email"
                        required
                        placeholder="seu@email.com"
                        value={previewEmail}
                        onChange={(e) => setPreviewEmail(e.target.value)}
                        style={{ background: st.inputBg, color: st.inputText, borderColor: st.border }}
                        className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}

                  <div>
                    <label style={{ color: st.subtext }} className="block font-bold mb-1">WhatsApp / Telefone *</label>
                    <input
                      type="text"
                      required
                      placeholder="(11) 99999-9999"
                      value={previewPhone}
                      onChange={(e) => setPreviewPhone(e.target.value)}
                      style={{ background: st.inputBg, color: st.inputText, borderColor: st.border }}
                      className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {includeValue && (
                    <div>
                      <label style={{ color: st.subtext }} className="block font-bold mb-1">Valor Estimado (R$)</label>
                      <input
                        type="number"
                        placeholder="1500"
                        value={previewValue}
                        onChange={(e) => setPreviewValue(e.target.value)}
                        style={{ background: st.inputBg, color: st.inputText, borderColor: st.border }}
                        className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}

                  {selectedCustomFields.map((fId) => {
                    const fDef = customFields.find(c => c.id === fId);
                    return (
                      <div key={fId}>
                        <label style={{ color: st.subtext }} className="block font-bold mb-1">{fDef ? fDef.label : fId}</label>
                        <input
                          type="text"
                          value={previewCustomValues[fId] || ""}
                          onChange={(e) => setPreviewCustomValues({ ...previewCustomValues, [fId]: e.target.value })}
                          style={{ background: st.inputBg, color: st.inputText, borderColor: st.border }}
                          className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    );
                  })}

                  {includeNotes && (
                    <div>
                      <label style={{ color: st.subtext }} className="block font-bold mb-1">Mensagem / Observações</label>
                      <textarea
                        rows={2}
                        placeholder="Como podemos ajudar?"
                        value={previewNotes}
                        onChange={(e) => setPreviewNotes(e.target.value)}
                        style={{ background: st.inputBg, color: st.inputText, borderColor: st.border }}
                        className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={previewSubmitting}
                    style={{ background: st.btnBg, color: st.btnText }}
                    className="w-full py-3 rounded-xl font-extrabold text-sm shadow-md transition-all cursor-pointer hover:opacity-90 disabled:opacity-50 mt-2"
                  >
                    {previewSubmitting ? "Enviando para CRM..." : builderButtonText}
                  </button>

                  {previewSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-center text-xs font-bold rounded-xl animate-in fade-in">
                      🎉 {builderSuccessMsg}
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* Generated Code Display Box */}
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Code className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-extrabold text-slate-100 text-xs uppercase tracking-wider">Código Pronto para Copiar</h4>
                </div>

                <button
                  onClick={() => copyToClipboard(getActiveCodeText(), setIsCopiedSnippet)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 shadow-md shadow-emerald-500/10 cursor-pointer"
                >
                  {isCopiedSnippet ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopiedSnippet ? "Copiado!" : "Copiar Código"}</span>
                </button>
              </div>

              {/* Code Format Selector */}
              <div className="flex space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                <button
                  onClick={() => setCodeType('html_js')}
                  className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                    codeType === 'html_js' ? "bg-slate-800 text-emerald-400" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  HTML + JS
                </button>
                <button
                  onClick={() => setCodeType('wp_shortcode')}
                  className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                    codeType === 'wp_shortcode' ? "bg-slate-800 text-emerald-400" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Shortcode WP
                </button>
                <button
                  onClick={() => setCodeType('react')}
                  className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                    codeType === 'react' ? "bg-slate-800 text-emerald-400" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  React / Next.js
                </button>
                <button
                  onClick={() => setCodeType('curl')}
                  className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                    codeType === 'curl' ? "bg-slate-800 text-emerald-400" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  cURL / API
                </button>
              </div>

              {/* Code Viewport */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 overflow-x-auto max-h-72 font-mono text-[11px] text-emerald-300 leading-relaxed select-all whitespace-pre">
                {getActiveCodeText()}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* =========================================================================
          TAB 2: WORDPRESS PLUGIN DOWNLOAD & GUIDE
      ========================================================================= */}
      {activeTab === 'wordpress' && (
        <div id="wordpress-plugin-section" className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-start space-x-3.5">
              <div className="bg-sky-50 text-sky-600 p-3 rounded-2xl border border-sky-100 shrink-0">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base tracking-tight flex items-center space-x-2">
                  <span>Plugin Oficial para WordPress & Construtores Visuals</span>
                  <span className="bg-sky-50 text-sky-700 border border-sky-100 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Recomendado</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Com o plugin instalado, você ganha um painel administrativo no WordPress e o shortcode <code>[crm_lead_form]</code> além de suporte a Elementor Pro, Contact Form 7 e WPForms.
                </p>
              </div>
            </div>

            <a
              href="/api/integration/wordpress-plugin"
              download="crm-leads-webhook-integration.zip"
              className="inline-flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-6 py-3.5 rounded-2xl transition-all shadow-md shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Baixar Plugin WordPress (.zip)</span>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            {/* Col 1: Instalação */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider block">Passo 1: Instalação</span>
              <p className="text-slate-600 leading-relaxed">
                Baixe o arquivo <code>.zip</code> clicando no botão acima. No seu painel WordPress, acesse <strong>Plugins &gt; Adicionar Novo &gt; Enviar Plugin</strong>, selecione o arquivo baixado e clique em <strong>Ativar Plugin</strong>.
              </p>
            </div>

            {/* Col 2: Configuração */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider block">Passo 2: Configuração</span>
              <p className="text-slate-600 leading-relaxed">
                No menu do WordPress, acesse <strong>CRM Webhook &gt; Configurações</strong> e preencha as credenciais:
              </p>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 space-y-2">
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">URL do Webhook</span>
                  <div className="flex items-center justify-between mt-0.5">
                    <code className="text-[10px] font-mono text-slate-750 truncate max-w-[150px]">{webhookUrl}</code>
                    <button onClick={() => copyToClipboard(webhookUrl, () => {})} className="text-[10px] text-sky-600 hover:underline font-bold shrink-0 cursor-pointer">Copiar</button>
                  </div>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">Chave de API (API Key)</span>
                  <div className="flex items-center justify-between mt-0.5">
                    <code className="text-[10px] font-mono text-emerald-600 truncate max-w-[150px]">{apiKey || "carregando..."}</code>
                    <button onClick={() => copyToClipboard(apiKey, () => {})} className="text-[10px] text-sky-600 hover:underline font-bold shrink-0 cursor-pointer">Copiar</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Col 3: Como Mapear */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider block">Passo 3: Mapeamento Inteligente</span>
              <p className="text-slate-600 leading-relaxed">
                O plugin reconhece automaticamente os campos do formulário WordPress com base nos IDs ou Rótulos (Labels):
              </p>
              <ul className="space-y-1 text-slate-500 font-medium pl-2 list-none">
                <li className="flex items-center"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span><span>Nome: <code>nome</code> ou <code>name</code></span></li>
                <li className="flex items-center"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span><span>E-mail: <code>email</code> ou <code>e-mail</code></span></li>
                <li className="flex items-center"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span><span>Celular: <code>whatsapp</code>, <code>telefone</code> ou <code>phone</code></span></li>
                <li className="flex items-center"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span><span>Valor (R$): <code>valor</code> ou <code>value</code></span></li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: WEBHOOK API & CURL TESTER
      ========================================================================= */}
      {activeTab === 'webhook_api' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Setup documentation & URL instructions (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm">Dados do Endpoint</h3>
              
              <div className="space-y-3">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Método HTTP</span>
                  <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    POST
                  </span>
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">URL do Webhook</span>
                  <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="font-mono text-[10px] text-slate-600 truncate mr-2 select-all font-medium">{webhookUrl}</span>
                    <button 
                      onClick={() => copyToClipboard(webhookUrl, () => {})} 
                      className="text-[10px] text-emerald-600 font-bold hover:underline shrink-0 cursor-pointer"
                    >
                      Copiar
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-1.5">
                  <span className="font-bold text-xs text-slate-700 block flex items-center space-x-1">
                    <Info className="w-4 h-4 text-emerald-500" />
                    <span>Cabeçalhos do Request</span>
                  </span>
                  <ul className="text-[10px] text-slate-500 space-y-1 list-disc pl-4 font-medium">
                    <li><code>Content-Type: application/json</code></li>
                    <li><code>X-CRM-API-Key: sua-chave-secreta</code></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Webhook Payload Simulator inputs */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
              <h3 className="font-extrabold text-slate-900 text-sm">Simulador de Payload</h3>
              <p className="text-[10px] text-slate-400">Modifique os dados abaixo para atualizar o cURL</p>
              
              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Nome do Lead</label>
                  <input type="text" value={testName} onChange={(e) => setTestName(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Apelido</label>
                  <input type="text" value={testNickname} onChange={(e) => setTestNickname(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-xs" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Email</label>
                    <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">WhatsApp</label>
                    <input type="text" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-xs" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Valor (R$)</label>
                    <input type="number" value={testValue} onChange={(e) => setTestValue(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Origem</label>
                    <input type="text" value={testSource} onChange={(e) => setTestSource(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-xs" />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right: Code simulator terminal & execution (8 cols) */}
          <div className="lg:col-span-8 bg-slate-950 rounded-3xl border border-slate-850 p-6 flex flex-col justify-between h-[540px]">
            
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono font-bold text-slate-300">Terminal de Execução cURL</span>
                </div>

                <button
                  onClick={() => copyToClipboard(curlCommand, setIsCopiedCurl)}
                  className="text-[10px] font-mono font-bold text-slate-400 hover:text-white flex items-center space-x-1 cursor-pointer"
                >
                  {isCopiedCurl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Comando</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code Block */}
              <div className="flex-1 bg-slate-900 border border-slate-850 p-4 rounded-2xl overflow-x-auto overflow-y-auto">
                <pre className="text-[11px] font-mono text-slate-300 whitespace-pre leading-relaxed select-all">
                  {curlCommand}
                </pre>
              </div>
            </div>

            {/* Test trigger and response widget */}
            <div className="mt-4 pt-4 border-t border-slate-850 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ação Comercial Rápida</span>
                  <span className="text-[11px] text-slate-300">Simular o recebimento desse lead agora no sistema</span>
                </div>

                <button
                  onClick={handleTestWebhook}
                  disabled={testLoading || !apiKey}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 text-xs font-bold px-5 py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-500/10 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Simular Envio API Webhook</span>
                </button>
              </div>

              {/* Simulator Response Block */}
              {testResponse && (
                <div className="p-3.5 bg-slate-900/80 border border-slate-850 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-400">Resposta do Servidor:</span>
                    <span className={`font-bold ${testStatus === 201 ? "text-emerald-400" : "text-rose-400"}`}>
                      STATUS {testStatus} {testStatus === 201 ? "Created" : "Error"}
                    </span>
                  </div>
                  <pre className="text-[10px] font-mono text-slate-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {JSON.stringify(testResponse, null, 2)}
                  </pre>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* =========================================================================
          TAB 4: TUTORIAL & MANUAIS DE INTEGRAÇÃO PASSO A PASSO
      ========================================================================= */}
      {activeTab === 'tutorial' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/40 p-6 rounded-3xl text-white space-y-2 shadow-lg">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-6 h-6 text-emerald-400" />
              <h3 className="text-lg font-extrabold text-slate-100">Guia Completo & Tutoriais de Integração</h3>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Aprenda a conectar qualquer site, landing page ou sistema externo ao seu CRM. Todos os leads capturados entram automaticamente no seu Funil de Vendas com notificações em tempo real.
            </p>
          </div>

          {/* Tutorial Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Guide 1: Universal Form Builder */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-emerald-600 font-extrabold text-sm pb-2 border-b border-slate-100">
                  <Sparkles className="w-5 h-5 shrink-0" />
                  <span>1. Construtor Universal (Qualquer Site)</span>
                </div>
                <p className="text-xs text-slate-500">
                  Ideal para Wix, Webflow, WordPress, React, HTML puro, Landbot, Shopify e landing pages customizadas.
                </p>

                <div className="space-y-2.5 text-xs text-slate-700 font-medium">
                  <div className="flex items-start space-x-2">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0">Passo 1</span>
                    <span>Acesse a aba <strong>Construtor de Formulários Universal</strong> e escolha títulos, cores e campos desejados.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0">Passo 2</span>
                    <span>Teste o envio no quadro de <strong>Pré-Visualização em Tempo Real</strong> e verifique o lead surgindo no CRM.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0">Passo 3</span>
                    <span>Escolha o formato do código: <strong>HTML/JS Embutido</strong>, <strong>React JSX</strong> ou <strong>Shortcode WP</strong>.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0">Passo 4</span>
                    <span>Copie o código e cole no seu criador de sites na opção "Embed / Bloco HTML".</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('form_builder')}
                className="w-full mt-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1 cursor-pointer"
              >
                <span>Ir para Construtor Universal</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </button>
            </div>

            {/* Guide 2: WordPress Plugin */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sky-600 font-extrabold text-sm pb-2 border-b border-slate-100">
                  <Globe className="w-5 h-5 shrink-0" />
                  <span>2. Plugin Oficial para WordPress (ZIP)</span>
                </div>
                <p className="text-xs text-slate-500">
                  Integração nativa com Elementor Pro Forms, Contact Form 7, WPForms e via Shortcode [crm_lead_form].
                </p>

                <div className="space-y-2.5 text-xs text-slate-700 font-medium">
                  <div className="flex items-start space-x-2">
                    <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0">Passo 1</span>
                    <span>Na aba <strong>Plugin WordPress (ZIP)</strong>, clique no botão para baixar o arquivo <code>.zip</code>.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0">Passo 2</span>
                    <span>No seu WordPress Admin, acesse <strong>Plugins &gt; Adicionar Novo &gt; Enviar Plugin</strong> e instale o ZIP.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0">Passo 3</span>
                    <span>Vá no menu lateral <strong>CRM Webhook &gt; Configurações</strong> e cole sua <strong>URL Webhook</strong> e a <strong>Chave Secreta</strong>.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0">Passo 4</span>
                    <span>Use o Shortcode <code>[crm_lead_form]</code> em qualquer página ou ative o envio automático no Elementor/CF7.</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('wordpress')}
                className="w-full mt-4 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1 cursor-pointer"
              >
                <span>Ir para Plugin WordPress</span>
                <Globe className="w-4 h-4 text-sky-600" />
              </button>
            </div>

            {/* Guide 3: Webhook & cURL API Direct */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-indigo-600 font-extrabold text-sm pb-2 border-b border-slate-100">
                  <Terminal className="w-5 h-5 shrink-0" />
                  <span>3. API Webhook Direct (Zapier, Make, cURL)</span>
                </div>
                <p className="text-xs text-slate-500">
                  Conecte via HTTP POST do Zapier, Make/Integromat, N8N, Typeform, Facebook Lead Ads ou scripts backend.
                </p>

                <div className="space-y-2.5 text-xs text-slate-700 font-medium">
                  <div className="flex items-start space-x-2">
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0">Passo 1</span>
                    <span>Copie a <strong>URL do Endpoint</strong> (<code>/api/leads/webhook</code>) e a sua <strong>Chave Secreta</strong>.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0">Passo 2</span>
                    <span>Adicione os cabeçalhos <code>Content-Type: application/json</code> e <code>X-CRM-API-Key: SUA_CHAVE</code>.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0">Passo 3</span>
                    <span>Envie o JSON contendo ao menos <code>name</code> e <code>phone</code> ou <code>email</code>.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0">Passo 4</span>
                    <span>Teste diretamente no <strong>Testador de Webhook & cURL</strong> do CRM para validar respostas HTTP 201 Created.</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('webhook_api')}
                className="w-full mt-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1 cursor-pointer"
              >
                <span>Ir para Testador cURL</span>
                <Terminal className="w-4 h-4 text-indigo-600" />
              </button>
            </div>

          </div>

          {/* Troubleshooting FAQ Box */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-sm pb-3 border-b border-slate-100">
              <HelpCircle className="w-5 h-5 text-amber-500" />
              <span>Dúvidas Frequentes & Solução de Problemas (Troubleshooting)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <h4 className="font-bold text-slate-800">❌ O formulário aciona no testador mas falha no site real?</h4>
                <p className="text-slate-500 leading-relaxed">
                  Verifique se o site externo possui bloqueio de script. O servidor do CRM já possui suporte nativo a <strong>CORS habilitado</strong> (Cross-Origin Resource Sharing) e aceita envios de qualquer domínio.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <h4 className="font-bold text-slate-800">🔑 O que significa erro Status 401 Unauthorized?</h4>
                <p className="text-slate-500 leading-relaxed">
                  Significa que o cabeçalho <code>X-CRM-API-Key</code> enviado no formulário ou plugin está incorreto. Copie novamente a Chave Secreta exibida no topo deste painel.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <h4 className="font-bold text-slate-800">📱 É obrigatório pedir e-mail no formulário?</h4>
                <p className="text-slate-500 leading-relaxed">
                  Não! O sistema aceita envios apenas com <strong>Nome + WhatsApp/Telefone</strong>. O e-mail tornou-se um campo opcional para aumentar a taxa de conversão do seu site.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <h4 className="font-bold text-slate-800">🔔 Onde vejo quando um lead entra pelo formulário?</h4>
                <p className="text-slate-500 leading-relaxed">
                  Uma notificação sonora/visual é gerada instantaneamente no sino superior e o novo lead entra no topo da coluna <strong>Prospect (Aguardando Contato)</strong> do seu Funil de Vendas.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* =========================================================================
          TAB 4: LOGS DE EVENTOS DE ENTRADA WEBHOOK (ÚLTIMOS 10)
      ========================================================================= */}
      {activeTab === 'webhook_logs' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Auditoria & Diagnóstico API
                  </span>
                  <span className="bg-slate-100 text-slate-600 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                    Mostrando últimos {webhookLogs.length} eventos
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <span>Log de Eventos de Entrada de Webhooks</span>
                </h3>
                <p className="text-xs text-slate-500 max-w-2xl">
                  Acompanhe todas as requisições recebidas pelo endpoint <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700 font-mono">/api/leads/webhook</code> em tempo real. Identifique falhas de chave de API (401), falta de parâmetros obrigatórios (400) ou integrações bem sucedidas (201).
                </p>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <button
                  onClick={fetchWebhookLogs}
                  disabled={isLoadingLogs}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingLogs ? "animate-spin text-emerald-600" : ""}`} />
                  <span>Atualizar Logs</span>
                </button>

                <button
                  onClick={clearWebhookLogs}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Limpar Histórico</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200/80 flex items-center justify-center shrink-0">
                  <Terminal className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Registrado</div>
                  <div className="text-xl font-black text-slate-900">{webhookLogs.length}</div>
                </div>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-100 p-3.5 rounded-2xl flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Sucessos (201 OK)</div>
                  <div className="text-xl font-black text-emerald-800">
                    {webhookLogs.filter(l => l.status === 201 || l.success).length}
                  </div>
                </div>
              </div>

              <div className="bg-rose-50/70 border border-rose-100 p-3.5 rounded-2xl flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Erros & Bloqueios</div>
                  <div className="text-xl font-black text-rose-800">
                    {webhookLogs.filter(l => l.status !== 201 && !l.success).length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Webhook Logs Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            {webhookLogs.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <FileText className="w-7 h-7" />
                </div>
                <h4 className="font-extrabold text-slate-800 text-base">Nenhum evento registrado no histórico</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Assim que o Plugin WordPress, Construtor de Formulários ou cURL enviarem um payload, os eventos aparecerão nesta lista.
                </p>
                <button
                  onClick={() => setActiveTab('webhook_api')}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer mt-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar Disparo de Teste Agora</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Status HTTP</th>
                      <th className="py-3.5 px-4">Data & Hora</th>
                      <th className="py-3.5 px-4">Origem / Fonte</th>
                      <th className="py-3.5 px-4">Lead Identificado</th>
                      <th className="py-3.5 px-4">Diagnóstico / Mensagem</th>
                      <th className="py-3.5 px-4 text-right">Payload JSON</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                    {webhookLogs.slice(0, 10).map((log) => {
                      const isSuccess = log.status === 201 || log.success;
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-all">
                          {/* Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-black ${
                                isSuccess
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : log.status === 401
                                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                                  : "bg-amber-100 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {isSuccess ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                              )}
                              <span>HTTP {log.status}</span>
                            </span>
                          </td>

                          {/* Timestamp */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                            <div className="flex items-center space-x-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{new Date(log.timestamp).toLocaleTimeString('pt-BR')}</span>
                              <span className="text-[10px] text-slate-400">({new Date(log.timestamp).toLocaleDateString('pt-BR')})</span>
                            </div>
                          </td>

                          {/* Source */}
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {log.source || "Formulário / API"}
                          </td>

                          {/* Lead Name */}
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-800">{log.leadName || log.payload?.name || "(Sem nome)"}</span>
                            {log.payload?.email && (
                              <span className="block text-[10px] text-slate-400 font-normal">{log.payload.email}</span>
                            )}
                          </td>

                          {/* Message Diagnostic */}
                          <td className="py-3.5 px-4 max-w-xs">
                            <p className={`line-clamp-2 text-xs font-semibold ${isSuccess ? "text-emerald-700" : "text-rose-700"}`}>
                              {log.message}
                            </p>
                            {log.apiKeyReceived && !isSuccess && (
                              <span className="block text-[10px] font-mono text-slate-500 truncate mt-0.5">
                                Chave enviada: {log.apiKeyReceived}
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-lg transition-all inline-flex items-center space-x-1.5 cursor-pointer shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Inspecionar</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal for Inspecionar Webhook Log */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 space-y-0">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center space-x-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black ${
                    selectedLog.status === 201 || selectedLog.success
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  }`}
                >
                  HTTP {selectedLog.status}
                </span>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Inspeção Completa do Evento Webhook</h3>
                  <p className="text-[11px] text-slate-400">{new Date(selectedLog.timestamp).toLocaleString('pt-BR')}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Diagnostic Box */}
              <div className={`p-4 rounded-2xl border text-xs ${
                selectedLog.status === 201 || selectedLog.success
                  ? "bg-emerald-950/40 border-emerald-800/50 text-emerald-200"
                  : "bg-rose-950/40 border-rose-800/50 text-rose-200"
              }`}>
                <div className="font-bold mb-1 flex items-center space-x-2">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>Resultado do Processamento:</span>
                </div>
                <p className="font-medium">{selectedLog.message}</p>
              </div>

              {/* Metadata details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Origem Declarada</span>
                  <span className="font-semibold text-slate-200">{selectedLog.source || "Não especificada"}</span>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">IP do Cliente / Origem</span>
                  <span className="font-mono text-slate-200">{selectedLog.ip || "127.0.0.1"}</span>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 col-span-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Chave de API (X-CRM-API-Key) Recebida</span>
                  <code className="font-mono text-xs text-amber-400 block truncate">{selectedLog.apiKeyReceived || "(ausente)"}</code>
                </div>
              </div>

              {/* Payload JSON view */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payload JSON Recebido no Body</label>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(selectedLog.payload, null, 2), setIsCopiedLogPayload)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    {isCopiedLogPayload ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopiedLogPayload ? "Copiado!" : "Copiar JSON"}</span>
                  </button>
                </div>
                <pre className="bg-slate-950 border border-slate-800 p-4 rounded-2xl font-mono text-xs text-emerald-400 overflow-x-auto max-h-56">
                  {JSON.stringify(selectedLog.payload, null, 2)}
                </pre>
              </div>

              {/* Headers view if any */}
              {selectedLog.headers && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cabeçalhos HTTP (Headers)</label>
                  <pre className="bg-slate-950 border border-slate-800 p-3 rounded-2xl font-mono text-xs text-slate-400 overflow-x-auto">
                    {JSON.stringify(selectedLog.headers, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Fechar Inspeção
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
