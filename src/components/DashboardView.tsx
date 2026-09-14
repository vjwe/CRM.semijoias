import React, { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { 
  TrendingUp, Users, DollarSign, Award, Target, Sparkles, Loader2, ArrowRight,
  TrendingDown, ShieldAlert, BarChart3, HelpCircle
} from "lucide-react";
import { Lead, SalesReport, PipelineStage } from "../types";
import VisualFunnel from "./VisualFunnel";

interface DashboardViewProps {
  leads: Lead[];
  stages: PipelineStage[];
}

const COLORS = ["#10b981", "#3b82f6", "#6366f1", "#f59e0b", "#8b5cf6", "#ec4899", "#64748b"];

export default function DashboardView({ leads, stages }: DashboardViewProps) {
  const [aiReport, setAiReport] = useState<SalesReport | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [errorAi, setErrorAi] = useState("");

  // Calculate Metrics
  const totalLeads = leads.length;
  const activeLeads = leads.filter((l) => l.stage !== "won" && l.stage !== "lost").length;
  const wonLeads = leads.filter((l) => l.stage === "won" || l.stage.includes("won") || l.stage.includes("retention") || l.stage.includes("referral"));
  const lostLeads = leads.filter((l) => l.stage === "lost" || l.stage.includes("lost"));

  const totalWonValue = wonLeads.reduce((acc, curr) => acc + curr.value, 0);
  const activePipelineValue = leads
    .filter((l) => l.stage !== "won" && l.stage !== "lost")
    .reduce((acc, curr) => acc + curr.value, 0);

  const conversionRate = totalLeads > 0 ? (wonLeads.length / totalLeads) * 100 : 0;
  const averageTicket = wonLeads.length > 0 ? totalWonValue / wonLeads.length : 0;

  // Prepare Chart Data 1: Value per Stage using dynamic stages list
  const stageData = stages.map((stage) => {
    const stageLeads = leads.filter((l) => l.stage === stage.id);
    return {
      name: stage.label,
      "Valor (R$)": stageLeads.reduce((acc, curr) => acc + curr.value, 0),
      Quantidade: stageLeads.length,
    };
  });

  // Prepare Chart Data 2: Source Distribution
  const sourceCounts: Record<string, { count: number; value: number }> = {};
  leads.forEach((l) => {
    if (!sourceCounts[l.source]) {
      sourceCounts[l.source] = { count: 0, value: 0 };
    }
    sourceCounts[l.source].count += 1;
    sourceCounts[l.source].value += l.value;
  });

  const sourceData = Object.keys(sourceCounts).map((sourceKey) => ({
    name: sourceKey,
    value: sourceCounts[sourceKey].count,
    amount: sourceCounts[sourceKey].value,
  }));

  // Prepare Chart Data 3: Registration Trend (Fake grouped by last days for nice visual line chart)
  const trendData = [
    { name: "Semana 1", "Novos Leads": Math.round(totalLeads * 0.15) + 1, "Vendas (R$)": totalWonValue * 0.1 },
    { name: "Semana 2", "Novos Leads": Math.round(totalLeads * 0.25) + 2, "Vendas (R$)": totalWonValue * 0.2 },
    { name: "Semana 3", "Novos Leads": Math.round(totalLeads * 0.3) + 1, "Vendas (R$)": totalWonValue * 0.45 },
    { name: "Semana 4", "Novos Leads": Math.round(totalLeads * 0.3) + 3, "Vendas (R$)": totalWonValue * 0.25 },
  ];

  const fetchAiReport = async () => {
    setLoadingAi(true);
    setErrorAi("");
    try {
      const res = await fetch("/api/reports/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        const data = await res.json();
        setAiReport(data);
      } else {
        setErrorAi("Não foi possível gerar o relatório. Verifique sua conexão.");
      }
    } catch (err) {
      setErrorAi("Erro de comunicação com o servidor.");
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    // Generate initial report
    fetchAiReport();
  }, [leads.length]); // regenerate if leads count changes

  return (
    <div className="space-y-6">
      
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Vendas Concluídas</span>
            <span className="text-xl font-black text-slate-800 font-mono">
              R$ {totalWonValue.toLocaleString('pt-BR')}
            </span>
            <span className="text-[10px] text-emerald-500 font-medium block mt-0.5">
              {wonLeads.length} contratos fechados
            </span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Pipeline Ativo</span>
            <span className="text-xl font-black text-slate-800 font-mono">
              R$ {activePipelineValue.toLocaleString('pt-BR')}
            </span>
            <span className="text-[10px] text-blue-500 font-medium block mt-0.5">
              {activeLeads} negócios em andamento
            </span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Conversão Funil</span>
            <span className="text-xl font-black text-slate-800 font-mono">
              {conversionRate.toFixed(1)}%
            </span>
            <span className="text-[10px] text-indigo-500 font-medium block mt-0.5">
              Parceiros convertidos / total
            </span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Ticket Médio</span>
            <span className="text-xl font-black text-slate-800 font-mono">
              R$ {averageTicket.toLocaleString('pt-BR')}
            </span>
            <span className="text-[10px] text-amber-600 font-medium block mt-0.5">
              Média por negócio ganho
            </span>
          </div>
        </div>

      </div>

      {/* Reduced Funnel Diagrams Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VisualFunnel leads={leads} stages={stages} funnelType="conventional" compact={true} />
        <VisualFunnel leads={leads} stages={stages} funnelType="inverted" compact={true} />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* BarChart: Value per stage (8 cols) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm tracking-wide">Volume Financeiro por Etapa</h3>
              <p className="text-[11px] text-slate-400">Distribuição em Reais (R$) de todo o pipeline de vendas</p>
            </div>
            <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              Total: R$ {(totalWonValue + activePipelineValue).toLocaleString('pt-BR')}
            </div>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" tickLine={false} />
                <YAxis fontSize={11} stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${v >= 1000 ? (v / 1000) + 'k' : v}`} />
                <Tooltip 
                  formatter={(value: any) => [`R$ ${value.toLocaleString('pt-BR')}`, "Volume Total"]}
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "12px" }}
                />
                <Bar dataKey="Valor (R$)" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PieChart: Lead Origins (4 cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col h-[400px]">
          <div>
            <h3 className="font-bold text-slate-800 text-sm tracking-wide">Origem dos Leads</h3>
            <p className="text-[11px] text-slate-400">Percentual de leads capturados por canal</p>
          </div>
          
          {sourceData.length > 0 ? (
            <>
              <div className="flex-1 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {sourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any, name: string, props: any) => [
                        `${value} leads (R$ ${props.payload.amount.toLocaleString('pt-BR')})`, 
                        name
                      ]}
                      contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "11px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legends list */}
              <div className="space-y-1.5 overflow-y-auto max-h-[110px] px-1 text-xs text-slate-500">
                {sourceData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="truncate max-w-[120px] font-medium text-slate-600">{entry.name}</span>
                    </div>
                    <span className="font-bold text-slate-700">{entry.value} leads ({((entry.value / totalLeads) * 100).toFixed(0)}%)</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
              Sem dados de origem disponíveis
            </div>
          )}
        </div>

      </div>

      {/* AI Performance Report Section (Gemini Grounded Intelligence) */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Glow effect background */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-5 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-500 flex items-center justify-center text-white shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-slate-100">Consultoria de Vendas IA</h3>
                <span className="text-[9px] bg-emerald-500/15 text-emerald-400 font-bold px-2 py-0.5 rounded-full uppercase">Powered by Gemini</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Relatório executivo automático, análise de gargalo e insights comerciais</p>
            </div>
          </div>

          <button
            onClick={fetchAiReport}
            disabled={loadingAi}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-900 text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer self-start md:self-auto shrink-0 shadow-lg shadow-emerald-500/20"
          >
            {loadingAi ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Analisando Funil...</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Atualizar Relatório</span>
              </>
            )}
          </button>
        </div>

        {/* Report Content Grid */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main AI summary markdown block */}
          <div className="lg:col-span-7 bg-slate-950/40 border border-slate-800/80 p-5 rounded-xl text-xs leading-relaxed text-slate-300">
            {loadingAi ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                <p className="text-slate-400 font-mono text-[11px] animate-pulse">Lendo histórico comercial e mapeando gargalos...</p>
              </div>
            ) : errorAi ? (
              <div className="text-center py-12 text-rose-400 flex flex-col items-center justify-center space-y-2">
                <ShieldAlert className="w-8 h-8" />
                <span>{errorAi}</span>
              </div>
            ) : aiReport ? (
              <div className="space-y-4 font-sans max-h-[300px] overflow-y-auto pr-1">
                {/* Visual markdown simulator (simple line parser with styling) */}
                {aiReport.summary.split("\n").map((line, i) => {
                  if (line.startsWith("###")) {
                    return <h4 key={i} className="text-sm font-bold text-white mt-4 mb-2">{line.replace("###", "").trim()}</h4>;
                  }
                  if (line.startsWith("####")) {
                    return <h5 key={i} className="text-xs font-bold text-emerald-400 mt-3 mb-1.5 uppercase tracking-wide">{line.replace("####", "").trim()}</h5>;
                  }
                  if (line.startsWith("*") || line.startsWith("-")) {
                    return (
                      <div key={i} className="flex items-start space-x-2 pl-2 my-1">
                        <span className="text-emerald-500 mt-0.5 shrink-0">•</span>
                        <span>{line.replace(/^[\*\-]\s*/, "")}</span>
                      </div>
                    );
                  }
                  if (line.trim() === "") return <div key={i} className="h-2" />;
                  return <p key={i} className="text-slate-300 mb-2">{line}</p>;
                })}
                <span className="block text-[9px] text-slate-500 text-right mt-6">
                  Gerado em: {new Date(aiReport.generatedAt).toLocaleString("pt-BR")}
                </span>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-500 flex flex-col items-center justify-center space-y-2">
                <BarChart3 className="w-8 h-8 opacity-40" />
                <span>Nenhuma análise carregada. Clique em Atualizar Relatório.</span>
              </div>
            )}
          </div>

          {/* Quick Actionable AI Insights */}
          <div className="lg:col-span-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <span>Metas e Ações Recomendadas</span>
            </h4>

            {aiReport && aiReport.insights && aiReport.insights.length > 0 ? (
              <div className="space-y-3">
                {aiReport.insights.map((insight, idx) => (
                  <div 
                    key={idx}
                    className="bg-slate-950/40 border-l-4 border-emerald-500 p-3 rounded-r-xl text-xs text-slate-300 flex items-start space-x-3 transition-all hover:bg-slate-900/50"
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <span className="block font-bold text-slate-200 mb-0.5">Ação Recomendada</span>
                      <p className="leading-snug text-slate-300 font-medium">{insight}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-950/40 border border-slate-850 p-6 text-center rounded-xl text-xs text-slate-500">
                Aguardando carregamento de insights comerciais.
              </div>
            )}

            {/* Simulated progress ring or general CRM score */}
            <div className="bg-slate-950/20 border border-slate-800/60 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Eficiência de Fechamento</span>
                <span className="text-sm font-extrabold text-emerald-400 mt-1 block">Alta Performance</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-slate-100 font-mono">{conversionRate.toFixed(0)}%</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Taxa de Conversão</span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
