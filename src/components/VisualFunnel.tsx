import React from "react";
import { Lead, PipelineStage } from "../types";
import { DollarSign, Users, TrendingUp, Sparkles, AlertCircle, ArrowDown, ArrowUp } from "lucide-react";

interface VisualFunnelProps {
  leads: Lead[];
  stages: PipelineStage[];
  funnelType: "conventional" | "inverted";
  onStageClick?: (stageId: string) => void;
}

export default function VisualFunnel({ leads, stages, funnelType, onStageClick }: VisualFunnelProps) {
  // Filter stages for this funnel type
  const funnelStages = stages.filter(s => (s.funnelType || "conventional") === funnelType);

  // If no stages found, show empty state
  if (funnelStages.length === 0) {
    return (
      <div className="p-8 text-center bg-white border border-slate-100 rounded-2xl">
        <p className="text-sm text-slate-400">Nenhuma etapa configurada para este funil.</p>
      </div>
    );
  }

  // Calculate statistics
  const totalLeadsInFunnel = leads.filter(l => funnelStages.some(s => s.id === l.stage)).length;
  const totalValueInFunnel = leads
    .filter(l => funnelStages.some(s => s.id === l.stage))
    .reduce((sum, curr) => sum + curr.value, 0);

  // Map stages to compute width, percentages, counts, values
  const stageStats = funnelStages.map((stage, index) => {
    const stageLeads = leads.filter(l => l.stage === stage.id);
    const count = stageLeads.length;
    const value = stageLeads.reduce((sum, curr) => sum + curr.value, 0);
    
    // Percentage relative to the top stage or total funnel leads
    const firstStageCount = leads.filter(l => l.stage === funnelStages[0].id).length || 1;
    const previousStageCount = index > 0 
      ? leads.filter(l => l.stage === funnelStages[index - 1].id).length || 1
      : count;

    const pctOfTotal = totalLeadsInFunnel > 0 ? (count / totalLeadsInFunnel) * 100 : 0;
    const pctConversion = index === 0 ? 100 : Math.min(100, Math.round((count / (previousStageCount || 1)) * 100));

    // Calculate symmetrical width percentage
    // Conventional: Widest at top (index 0) and narrowest at bottom
    // Inverted: Narrowest at top (index 0) and widest at bottom
    let widthPct = 100;
    if (funnelType === "conventional") {
      // Scale down from 100% to 45%
      const step = (100 - 45) / Math.max(1, funnelStages.length - 1);
      widthPct = 100 - (index * step);
    } else {
      // Scale up from 45% to 100%
      const step = (100 - 45) / Math.max(1, funnelStages.length - 1);
      widthPct = 45 + (index * step);
    }

    return {
      stage,
      count,
      value,
      pctOfTotal,
      pctConversion,
      widthPct
    };
  });

  // Color mapping matching the images
  const getGradientForIndex = (index: number, total: number) => {
    if (funnelType === "conventional") {
      // From dark green/teal to bright emerald matching the acquisition funnel
      const ratio = index / Math.max(1, total - 1);
      if (ratio < 0.25) return "from-emerald-800 to-emerald-700 hover:from-emerald-750 hover:to-emerald-650";
      if (ratio < 0.5) return "from-emerald-700 to-emerald-600 hover:from-emerald-650 hover:to-emerald-550";
      if (ratio < 0.75) return "from-emerald-600 to-emerald-500 hover:from-emerald-550 hover:to-emerald-450";
      return "from-emerald-500 to-emerald-400 hover:from-emerald-450 hover:to-emerald-350";
    } else {
      // From amber/gold to success green representing CS/expansion funnel
      const ratio = index / Math.max(1, total - 1);
      if (ratio < 0.25) return "from-amber-600 to-amber-500 hover:from-amber-550 hover:to-amber-450";
      if (ratio < 0.5) return "from-amber-500 to-amber-400 hover:from-amber-450 hover:to-amber-350";
      if (ratio < 0.75) return "from-emerald-500 to-teal-500 hover:from-emerald-450 hover:to-teal-450";
      return "from-emerald-600 to-teal-600 hover:from-emerald-550 hover:to-teal-550";
    }
  };

  return (
    <div className="bg-slate-950 text-white rounded-3xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Title / Headers */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-4 mb-6 relative z-10">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 flex items-center space-x-1">
            <Sparkles className="w-3 h-3 animate-pulse" />
            <span>{funnelType === "conventional" ? "Ciclo de Vida do Lead" : "Ciclo de Vida do Cliente"}</span>
          </span>
          <h3 className="text-lg font-extrabold text-white tracking-tight flex items-center space-x-2">
            <span>{funnelType === "conventional" ? "Funil Convencional (Aquisição)" : "Funil Invertido (Pós-Venda)"}</span>
            <span className="text-xs font-normal text-slate-400">
              (Total: {totalLeadsInFunnel} Contatos)
            </span>
          </h3>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <span className="block text-[10px] text-slate-400 uppercase font-bold">Volume Financeiro</span>
            <span className="text-md font-extrabold text-emerald-400">R$ {totalValueInFunnel.toLocaleString('pt-BR')}</span>
          </div>
        </div>
      </div>

      {/* Visual Stack Diagram */}
      <div className="flex flex-col items-center justify-center space-y-2 py-4 relative z-10">
        
        {funnelType === "conventional" && (
          <div className="text-center mb-2 flex items-center space-x-1 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-900/40">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Atração & Marketing</span>
            <ArrowDown className="w-3 h-3 text-emerald-400" />
          </div>
        )}

        {funnelType === "inverted" && (
          <div className="text-center mb-2 flex items-center space-x-1 bg-amber-950/40 px-3 py-1 rounded-full border border-amber-900/40">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Sucesso & Retenção (Início)</span>
            <ArrowDown className="w-3 h-3 text-amber-400" />
          </div>
        )}

        <div className="w-full max-w-2xl flex flex-col items-center space-y-1.5">
          {stageStats.map((item, index) => {
            const gradient = getGradientForIndex(index, stageStats.length);
            
            return (
              <div 
                key={item.stage.id} 
                className="w-full flex flex-col items-center group transition-all duration-300"
                style={{ width: `${item.widthPct}%` }}
              >
                {/* Horizontal Segment Bar */}
                <button
                  onClick={() => onStageClick && onStageClick(item.stage.id)}
                  className={`w-full bg-gradient-to-r ${gradient} text-white font-medium py-3 px-4 sm:px-6 rounded-xl flex items-center justify-between shadow-lg border border-white/5 transition-all duration-300 transform group-hover:scale-[1.02] cursor-pointer text-left relative overflow-hidden`}
                >
                  {/* Absolute subtle diagonal lines overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.02)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.02)_50%,rgba(255,255,255,0.02)_75%,transparent_75%,transparent)] bg-[size:16px_16px] pointer-events-none" />

                  {/* Stage Label / Order */}
                  <div className="flex items-center space-x-2 sm:space-x-4 shrink-0 relative z-10">
                    <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center font-bold text-[10px]">
                      {index + 1}
                    </span>
                    <div>
                      <span className="block font-extrabold text-xs sm:text-sm tracking-wide text-white">{item.stage.label}</span>
                      <span className="block text-[9px] sm:text-[10px] text-white/75 font-mono">
                        {item.count} {item.count === 1 ? "lead" : "leads"} ativo
                      </span>
                    </div>
                  </div>

                  {/* Conversion / Financial Stats */}
                  <div className="flex items-center space-x-3 sm:space-x-6 relative z-10">
                    <div className="text-right">
                      <span className="block text-[10px] text-white/70 uppercase font-semibold">Conversão</span>
                      <span className="text-xs sm:text-sm font-extrabold text-white font-mono">
                        {item.pctConversion}%
                      </span>
                    </div>
                    <div className="text-right min-w-[70px] sm:min-w-[100px] border-l border-white/10 pl-3 sm:pl-6">
                      <span className="block text-[10px] text-white/70 uppercase font-semibold">Pipeline</span>
                      <span className="text-xs sm:text-sm font-black text-white font-mono">
                        R$ {item.value.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {funnelType === "conventional" && (
          <div className="text-center mt-3 flex items-center space-x-1 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-900/40">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Fechamento da Venda 🤝</span>
          </div>
        )}

        {funnelType === "inverted" && (
          <div className="text-center mt-3 flex items-center space-x-1 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-900/40">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Expansão & Promotores 🚀</span>
            <ArrowUp className="w-3 h-3 text-emerald-400" />
          </div>
        )}

      </div>

      {/* Helpful Instructions Footnote */}
      <div className="mt-4 flex items-center justify-center space-x-2 text-[11px] text-slate-400 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/40">
        <AlertCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>Dica: Clique em qualquer etapa do funil acima para rolar e focar diretamente na coluna correspondente do quadro Kanban abaixo.</span>
      </div>
    </div>
  );
}
