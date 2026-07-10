import React, { useState, useEffect } from "react";
import { KeyRound, Copy, RefreshCw, Check, Terminal, Send, HelpCircle, Info } from "lucide-react";

interface IntegrationViewProps {
  onIntegrationTriggered: () => void;
}

export default function IntegrationView({ onIntegrationTriggered }: IntegrationViewProps) {
  const [apiKey, setApiKey] = useState("");
  const [isCopiedKey, setIsCopiedKey] = useState(false);
  const [isCopiedCurl, setIsCopiedCurl] = useState(false);
  const [isLoadingKey, setIsLoadingKey] = useState(false);

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

  useEffect(() => {
    fetchApiKey();
  }, []);

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const appDomain = typeof window !== "undefined" ? window.location.origin : "https://sua-url-app.com";
  const webhookUrl = `${appDomain}/api/leads/webhook`;

  // Generate dynamic curl command text
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

  // Submit mock test request directly from browser to test Express webhook endpoint!
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
        onIntegrationTriggered(); // update notification / leads array in main component
      }
    } catch (err) {
      setTestResponse({ error: "Falha na comunicação ou CORS blocked" });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Intro info card */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-100 flex items-center space-x-2">
              <KeyRound className="w-6 h-6 text-emerald-400" />
              <span>Integração Direta via Webhook API</span>
            </h2>
            <p className="text-xs text-slate-400 max-w-xl">
              Integre seu CRM com sites, landing pages (Elementor, Typeform), RD Station, ActiveCampaign ou formulários proprietários. Cada webhook recebido cria automaticamente um lead no funil de vendas e envia um alerta sonoro e notificação em tempo real!
            </p>
          </div>
          
          {/* Key showcase container */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2 shrink-0">
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sua Chave Comercial Secreta</span>
            <div className="flex items-center space-x-3">
              <code className="font-mono text-xs text-emerald-400 bg-slate-950 px-2 py-1.5 rounded border border-slate-850 select-all font-semibold">
                {apiKey || "carregando..."}
              </code>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => copyToClipboard(apiKey, setIsCopiedKey)}
                  className="p-1.5 hover:bg-slate-850 rounded text-slate-400 hover:text-white transition-all"
                  title="Copiar Chave"
                >
                  {isCopiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={regenerateKey}
                  disabled={isLoadingKey}
                  className="p-1.5 hover:bg-slate-850 rounded text-slate-400 hover:text-white transition-all disabled:opacity-50"
                  title="Revogar e Criar Nova Chave"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingKey ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Webhook URL & cURL Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Setup documentation & URL instructions (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 text-sm tracking-wide">Configurar Endpoint</h3>
            
            <div className="space-y-3">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Método HTTP</span>
                <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-md">
                  POST
                </span>
              </div>

              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">URL de Destino (Webhook URL)</span>
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-mono text-[10px] text-slate-600 truncate mr-2 select-all font-medium">{webhookUrl}</span>
                  <button 
                    onClick={() => copyToClipboard(webhookUrl, () => {})} 
                    className="text-[10px] text-emerald-600 font-bold hover:underline shrink-0"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                <span className="font-bold text-xs text-slate-700 block flex items-center space-x-1">
                  <Info className="w-4 h-4 text-emerald-500" />
                  <span>Cabeçalhos Requeridos</span>
                </span>
                <ul className="text-[10px] text-slate-500 space-y-1 list-disc pl-4 font-medium">
                  <li><code>Content-Type: application/json</code></li>
                  <li><code>X-CRM-API-Key: sua-chave-secreta</code></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Webhook Payload Simulator inputs */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-800 text-sm tracking-wide">Simulador de Payload</h3>
            <p className="text-[10px] text-slate-400">Modifique os dados abaixo para atualizar o código cURL automaticamente</p>
            
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Nome do Lead</label>
                <input type="text" value={testName} onChange={(e) => setTestName(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Como deve ser chamado (Apelido)</label>
                <input type="text" value={testNickname} onChange={(e) => setTestNickname(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Email</label>
                  <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">WhatsApp / Cel</label>
                  <input type="text" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Valor (R$)</label>
                  <input type="number" value={testValue} onChange={(e) => setTestValue(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Origem / Canal</label>
                  <input type="text" value={testSource} onChange={(e) => setTestSource(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 text-xs" />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right: Code simulator terminal & execution (8 cols) */}
        <div className="lg:col-span-8 bg-slate-950 rounded-2xl border border-slate-850 p-5 flex flex-col justify-between h-[520px]">
          
          <div className="space-y-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-slate-300">Terminal de Teste de cURL</span>
              </div>

              <button
                onClick={() => copyToClipboard(curlCommand, setIsCopiedCurl)}
                className="text-[10px] font-mono font-bold text-slate-400 hover:text-white flex items-center space-x-1"
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
            <div className="flex-1 bg-slate-900 border border-slate-850 p-4 rounded-xl overflow-x-auto overflow-y-auto">
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
                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 text-xs font-bold px-5 py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-500/10 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simular Envio API Webhook</span>
              </button>
            </div>

            {/* Simulator Response Block */}
            {testResponse && (
              <div className="p-3.5 bg-slate-900/80 border border-slate-850 rounded-xl space-y-2">
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

    </div>
  );
}
