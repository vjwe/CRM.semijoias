import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { 
  Megaphone, Plus, Search, Filter, TrendingUp, DollarSign, Users, MousePointer, 
  Eye, CheckCircle2, PauseCircle, PlayCircle, Trash2, Edit3, ExternalLink, 
  Sparkles, Copy, Check, BarChart3, ArrowUpRight, Target, RefreshCw, Layers, 
  HelpCircle, Link as LinkIcon, QrCode, Scissors, Zap, Share2, Globe, 
  History, MessageSquare, Download, CheckCheck, Sparkle
} from "lucide-react";
import { AdCampaign, Lead, ShortenedUrl } from "../types";

interface AdsViewProps {
  leads?: Lead[];
  onRefreshLeads?: () => void;
}

export default function AdsView({ leads = [], onRefreshLeads }: AdsViewProps) {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<AdCampaign | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formPlatform, setFormPlatform] = useState<AdCampaign['platform']>("meta");
  const [formStatus, setFormStatus] = useState<AdCampaign['status']>("active");
  const [formBudget, setFormBudget] = useState("");
  const [formBudgetType, setFormBudgetType] = useState<AdCampaign['budgetType']>("daily");
  const [formSpend, setFormSpend] = useState("");
  const [formImpressions, setFormImpressions] = useState("");
  const [formClicks, setFormClicks] = useState("");
  const [formLeadsGenerated, setFormLeadsGenerated] = useState("");
  const [formConversionsWon, setFormConversionsWon] = useState("");
  const [formRevenueGenerated, setFormRevenueGenerated] = useState("");
  const [formUtmSource, setFormUtmSource] = useState("");
  const [formUtmMedium, setFormUtmMedium] = useState("");
  const [formUtmCampaign, setFormUtmCampaign] = useState("");
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [formTargetAudience, setFormTargetAudience] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // UTM Generator tool states
  const [showUtmTool, setShowUtmTool] = useState(false);
  const [utmBaseUrl, setUtmBaseUrl] = useState("https://seusite.com.br/revenda");
  const [utmGenSource, setUtmGenSource] = useState("meta_ads");
  const [utmGenMedium, setUtmGenMedium] = useState("stories_instagram");
  const [utmGenCampaign, setUtmGenCampaign] = useState("captacao_revendedoras_ouro");
  const [utmGenTerm, setUtmGenTerm] = useState("");
  const [utmGenContent, setUtmGenContent] = useState("video_mostruario_01");

  // URL Shortener states
  const [shortenedUrls, setShortenedUrls] = useState<ShortenedUrl[]>([]);
  const [isShortening, setIsShortening] = useState(false);
  const [shortenerProvider, setShortenerProvider] = useState<ShortenedUrl['provider']>("isgd");
  const [customAlias, setCustomAlias] = useState("");
  const [shortenerError, setShortenerError] = useState<string | null>(null);
  const [lastShortened, setLastShortened] = useState<ShortenedUrl | null>(null);
  const [copiedShortId, setCopiedShortId] = useState<string | null>(null);
  const [qrModalData, setQrModalData] = useState<{ url: string; title: string; shortUrl: string } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [showShortHistory, setShowShortHistory] = useState(true);
  const [deletingShortId, setDeletingShortId] = useState<string | null>(null);

  // Generate QR code locally (100% offline without external network calls)
  useEffect(() => {
    if (qrModalData?.shortUrl) {
      QRCode.toDataURL(qrModalData.shortUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: "#0f172a",
          light: "#ffffff"
        }
      })
        .then((dataUri) => setQrDataUrl(dataUri))
        .catch((err) => {
          console.error("Erro ao gerar QR Code localmente:", err);
        });
    } else {
      setQrDataUrl("");
    }
  }, [qrModalData]);

  const loadCampaigns = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/ads/campaigns");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data);
      }
    } catch (err) {
      console.error("Erro ao carregar campanhas de anúncios:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadShortenedUrls = async () => {
    try {
      const res = await fetch("/api/shortened-urls");
      if (res.ok) {
        const data = await res.json();
        setShortenedUrls(data);
        if (data.length > 0 && !lastShortened) {
          setLastShortened(data[0]);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar links encurtados:", err);
    }
  };

  useEffect(() => {
    loadCampaigns();
    loadShortenedUrls();
  }, []);

  // Delete campaign modal state
  const [campaignToDelete, setCampaignToDelete] = useState<AdCampaign | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenCreateModal = () => {
    setEditingCampaign(null);
    setFormName("");
    setFormPlatform("meta");
    setFormStatus("active");
    setFormBudget("1000");
    setFormBudgetType("daily");
    setFormSpend("0");
    setFormImpressions("0");
    setFormClicks("0");
    setFormLeadsGenerated("0");
    setFormConversionsWon("0");
    setFormRevenueGenerated("0");
    setFormUtmSource("meta_ads");
    setFormUtmMedium("feed_reels");
    setFormUtmCampaign("");
    setFormStartDate(new Date().toISOString().split("T")[0]);
    setFormTargetAudience("");
    setFormNotes("");
    setShowModal(true);
  };

  const handleOpenEditModal = (camp: AdCampaign) => {
    setEditingCampaign(camp);
    setFormName(camp.name);
    setFormPlatform(camp.platform);
    setFormStatus(camp.status);
    setFormBudget(camp.budget.toString());
    setFormBudgetType(camp.budgetType);
    setFormSpend(camp.spend.toString());
    setFormImpressions(camp.impressions.toString());
    setFormClicks(camp.clicks.toString());
    setFormLeadsGenerated(camp.leadsGenerated.toString());
    setFormConversionsWon(camp.conversionsWon.toString());
    setFormRevenueGenerated(camp.revenueGenerated.toString());
    setFormUtmSource(camp.utmSource || "");
    setFormUtmMedium(camp.utmMedium || "");
    setFormUtmCampaign(camp.utmCampaign || "");
    setFormStartDate(camp.startDate || "");
    setFormTargetAudience(camp.targetAudience || "");
    setFormNotes(camp.notes || "");
    setShowModal(true);
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setIsSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        platform: formPlatform,
        status: formStatus,
        budget: Number(formBudget) || 0,
        budgetType: formBudgetType,
        spend: Number(formSpend) || 0,
        impressions: Number(formImpressions) || 0,
        clicks: Number(formClicks) || 0,
        leadsGenerated: Number(formLeadsGenerated) || 0,
        conversionsWon: Number(formConversionsWon) || 0,
        revenueGenerated: Number(formRevenueGenerated) || 0,
        utmSource: formUtmSource || `${formPlatform}_ads`,
        utmMedium: formUtmMedium || "cpc",
        utmCampaign: formUtmCampaign || formName.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
        startDate: formStartDate,
        targetAudience: formTargetAudience,
        notes: formNotes
      };

      const url = editingCampaign ? `/api/ads/campaigns/${editingCampaign.id}` : "/api/ads/campaigns";
      const method = editingCampaign ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowModal(false);
        await loadCampaigns();
      }
    } catch (err) {
      console.error("Erro ao salvar campanha:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (camp: AdCampaign) => {
    const nextStatus = camp.status === "active" ? "paused" : "active";
    try {
      const res = await fetch(`/api/ads/campaigns/${camp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        setCampaigns(prev => prev.map(c => c.id === camp.id ? { ...c, status: nextStatus } : c));
      }
    } catch (err) {
      console.error("Erro ao alternar status da campanha:", err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!campaignToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/ads/campaigns/${campaignToDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        setCampaigns(prev => prev.filter(c => c.id !== campaignToDelete.id));
        setCampaignToDelete(null);
      } else {
        alert("Erro ao excluir campanha no servidor.");
      }
    } catch (err) {
      console.error("Erro ao remover campanha:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Metrics summary
  const totalSpend = campaigns.reduce((acc, c) => acc + (c.spend || 0), 0);
  const totalRevenue = campaigns.reduce((acc, c) => acc + (c.revenueGenerated || 0), 0);
  const totalImpressions = campaigns.reduce((acc, c) => acc + (c.impressions || 0), 0);
  const totalClicks = campaigns.reduce((acc, c) => acc + (c.clicks || 0), 0);
  const totalLeadsGenerated = campaigns.reduce((acc, c) => acc + (c.leadsGenerated || 0), 0);
  const totalConversionsWon = campaigns.reduce((acc, c) => acc + (c.conversionsWon || 0), 0);

  const overallRoas = totalSpend > 0 ? (totalRevenue / totalSpend) : 0;
  const overallCpc = totalClicks > 0 ? (totalSpend / totalClicks) : 0;
  const overallCpl = totalLeadsGenerated > 0 ? (totalSpend / totalLeadsGenerated) : 0;
  const overallCpa = totalConversionsWon > 0 ? (totalSpend / totalConversionsWon) : 0;
  const overallCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const overallConversionRate = totalLeadsGenerated > 0 ? (totalConversionsWon / totalLeadsGenerated) * 100 : 0;

  // Filtered campaigns
  const filteredCampaigns = campaigns.filter(c => {
    const matchesPlatform = platformFilter === "all" || c.platform === platformFilter;
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.utmCampaign && c.utmCampaign.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (c.targetAudience && c.targetAudience.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesPlatform && matchesStatus && matchesSearch;
  });

  // Generated UTM URL
  const generatedUtmUrl = `${utmBaseUrl.trim()}?utm_source=${encodeURIComponent(utmGenSource)}&utm_medium=${encodeURIComponent(utmGenMedium)}&utm_campaign=${encodeURIComponent(utmGenCampaign)}${utmGenTerm ? `&utm_term=${encodeURIComponent(utmGenTerm)}` : ""}${utmGenContent ? `&utm_content=${encodeURIComponent(utmGenContent)}` : ""}`;

  const copyUtmToClipboard = () => {
    navigator.clipboard.writeText(generatedUtmUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShortenCurrentUrl = async () => {
    try {
      setIsShortening(true);
      setShortenerError(null);

      const targetUrl = generatedUtmUrl.trim();
      if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
        setShortenerError("A URL base deve começar com http:// ou https://");
        return;
      }

      const res = await fetch("/api/shorten-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: targetUrl,
          provider: shortenerProvider,
          customAlias: customAlias.trim() || undefined,
          utmSource: utmGenSource,
          utmCampaign: utmGenCampaign,
          title: utmGenCampaign ? `Campanha: ${utmGenCampaign}` : `Link Rastreado ${utmGenSource}`
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao encurtar o link.");
      }

      const newShortItem: ShortenedUrl = await res.json();
      setLastShortened(newShortItem);
      setShortenedUrls(prev => [newShortItem, ...prev.filter(x => x.id !== newShortItem.id)]);
      setCustomAlias("");
    } catch (err: any) {
      console.error("Erro ao encurtar link:", err);
      setShortenerError(err.message || "Não foi possível encurtar o link. Tente outro provedor.");
    } finally {
      setIsShortening(false);
    }
  };

  const handleCopyShortUrl = (url: string, id?: string) => {
    navigator.clipboard.writeText(url);
    setCopiedShortId(id || url);
    setTimeout(() => setCopiedShortId(null), 2000);
  };

  const handleDeleteShortUrl = async (id: string) => {
    try {
      setDeletingShortId(id);
      const res = await fetch(`/api/shortened-urls/${id}`, { method: "DELETE" });
      if (res.ok) {
        setShortenedUrls(prev => prev.filter(s => s.id !== id));
        if (lastShortened?.id === id) {
          setLastShortened(null);
        }
      }
    } catch (err) {
      console.error("Erro ao excluir link encurtado:", err);
    } finally {
      setDeletingShortId(null);
    }
  };

  const getPlatformBadge = (platform: AdCampaign['platform']) => {
    switch (platform) {
      case "meta":
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1">Meta Ads</span>;
      case "google":
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1">Google Ads</span>;
      case "tiktok":
        return <span className="bg-slate-900 text-pink-400 border border-pink-500/30 px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1">TikTok Ads</span>;
      default:
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md text-[11px] font-bold">Outros</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-white tracking-tight">Gestão de Anúncios Pagos (ADS)</h1>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                ROAS Geral: {overallRoas.toFixed(2)}x
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Monitore o retorno sobre investimento (ROI/ROAS), CPL, CPC, CTR e conversões de vendas em tempo real integradas ao funil comercial.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          <button
            onClick={() => setShowUtmTool(!showUtmTool)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 border border-slate-700 cursor-pointer"
          >
            <LinkIcon className="w-4 h-4 text-sky-400" />
            <span>{showUtmTool ? "Fechar Gerador UTM & Encurtador" : "UTM Builder & Encurtador"}</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shadow-lg shadow-emerald-600/20 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Campanha de Anúncios</span>
          </button>
        </div>
      </div>

      {/* UTM Generator & Open Source Shortener Expandable Tool */}
      {showUtmTool && (
        <div className="bg-white p-6 rounded-2xl border border-sky-200 shadow-lg space-y-6 animate-in slide-in-from-top-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 border border-sky-500/20 flex items-center justify-center">
                <LinkIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-slate-800">Gerador de Links Rastreados (UTM Builder) & Encurtador de URL</h3>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" /> API Open Source
                  </span>
                </div>
                <p className="text-xs text-slate-500">Crie links rastreados com parâmetros UTM e encurte-os instantaneamente com APIs abertas para bio, anúncios e WhatsApp.</p>
              </div>
            </div>
            <button 
              onClick={() => setShowUtmTool(false)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-3 py-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Fechar
            </button>
          </div>

          {/* Form UTM Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">URL do Site / Landing Page</label>
              <input
                type="text"
                value={utmBaseUrl}
                onChange={(e) => setUtmBaseUrl(e.target.value)}
                placeholder="https://seusite.com.br"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 font-mono bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Origem da Campanha (utm_source)</label>
              <select
                value={utmGenSource}
                onChange={(e) => setUtmGenSource(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 bg-white font-mono"
              >
                <option value="meta_ads">meta_ads (Instagram / Facebook)</option>
                <option value="google_ads">google_ads (Google Search / PMax)</option>
                <option value="tiktok_ads">tiktok_ads (TikTok Ads)</option>
                <option value="whatsapp_direto">whatsapp_direto</option>
                <option value="influenciadora">influenciadora_parceria</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mídia / Posicionamento (utm_medium)</label>
              <input
                type="text"
                value={utmGenMedium}
                onChange={(e) => setUtmGenMedium(e.target.value)}
                placeholder="ex: stories_instagram, feed, reels, cpc"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nome da Campanha (utm_campaign)</label>
              <input
                type="text"
                value={utmGenCampaign}
                onChange={(e) => setUtmGenCampaign(e.target.value)}
                placeholder="ex: revendedoras_ouro_18k"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Identificação do Criativo (utm_content)</label>
              <input
                type="text"
                value={utmGenContent}
                onChange={(e) => setUtmGenContent(e.target.value)}
                placeholder="ex: video_unboxing_01, foto_mostruario"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Palavra-Chave / Termo (utm_term - Opcional)</label>
              <input
                type="text"
                value={utmGenTerm}
                onChange={(e) => setUtmGenTerm(e.target.value)}
                placeholder="ex: revenda_consignada"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          {/* Raw Generated UTM URL Box */}
          <div className="bg-slate-900 p-4 rounded-xl text-white space-y-2 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Link Rastreado Completo (UTM Original):
              </span>
              <button
                type="button"
                onClick={copyUtmToClipboard}
                className="bg-sky-600 hover:bg-sky-500 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-white" />
                    <span>Copiar Original ({generatedUtmUrl.length} caracteres)</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs font-mono text-slate-300 break-all bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 select-all">
              {generatedUtmUrl}
            </p>
          </div>

          {/* Open Source URL Shortener Integration Panel */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 p-5 rounded-xl border border-indigo-900/50 shadow-inner text-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Scissors className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    Encurtador de Link com API Open Source
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/30">
                      is.gd / TinyURL / spoo.me / CleanURI
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-300">Encurte a URL rastreada para economizar caracteres em anúncios, SMS, bio do Instagram e WhatsApp.</p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Provedor Open Source / API:
                </label>
                <select
                  value={shortenerProvider}
                  onChange={(e) => setShortenerProvider(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white font-medium focus:outline-none focus:border-emerald-500"
                >
                  <option value="isgd">is.gd (Open API - Gratuito & Recomendado)</option>
                  <option value="tinyurl">TinyURL (API Pública Rápida)</option>
                  <option value="spoo">spoo.me (Open Source URL Shortener)</option>
                  <option value="cleanuri">CleanURI (API Aberta de Encurtamento)</option>
                  <option value="internal">CRM Local (/s/...) (Redirecionador Próprio)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Apelido Customizado (Opcional):
                </label>
                <input
                  type="text"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                  placeholder="ex: revenda_ouro_2026"
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleShortenCurrentUrl}
                  disabled={isShortening}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 active:scale-98"
                >
                  {isShortening ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Encurtando via API...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      <span>Encurtar Link Agora</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error state */}
            {shortenerError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-lg flex items-center space-x-2">
                <span>⚠️ {shortenerError}</span>
              </div>
            )}

            {/* Last Shortened Result Showcase Card */}
            {lastShortened && (
              <div className="bg-slate-950/80 p-4 rounded-xl border border-emerald-500/40 space-y-3 animate-in zoom-in-95">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                      Link Encurtado Ativo
                    </span>
                    <span className="text-xs font-semibold text-slate-300">
                      {lastShortened.providerName}
                    </span>
                    <span className="text-[11px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                      Economia de {Math.max(0, Math.round((1 - (lastShortened.shortUrl.length / lastShortened.originalUrl.length)) * 100))}% de caracteres
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Cliques registrados: <span className="text-emerald-400 font-bold">{lastShortened.clicks || 0}</span>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                  <div className="space-y-0.5 overflow-hidden">
                    <a
                      href={lastShortened.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 font-mono font-bold text-sm break-all flex items-center gap-1.5 transition-colors"
                    >
                      <span>{lastShortened.shortUrl}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    </a>
                    <p className="text-[10px] text-slate-400 truncate max-w-xl font-mono">
                      Destino: {lastShortened.originalUrl}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-2">
                    <button
                      type="button"
                      onClick={() => handleCopyShortUrl(lastShortened.shortUrl, lastShortened.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all shadow cursor-pointer active:scale-95"
                    >
                      {copiedShortId === lastShortened.id || copiedShortId === lastShortened.shortUrl ? (
                        <>
                          <CheckCheck className="w-3.5 h-3.5 text-white" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Link Curto</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setQrModalData({
                        url: lastShortened.originalUrl,
                        shortUrl: lastShortened.shortUrl,
                        title: lastShortened.title || "QR Code de Campanha"
                      })}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 border border-slate-700 cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5 text-sky-400" />
                      <span>QR Code</span>
                    </button>

                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Olá! Confira nosso link: ${lastShortened.shortUrl}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-700/80 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-200" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Shortened URLs History Section */}
            {shortenedUrls.length > 0 && (
              <div className="pt-2 border-t border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-sky-400" /> Histórico de Links Encurtados ({shortenedUrls.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowShortHistory(!showShortHistory)}
                    className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold cursor-pointer"
                  >
                    {showShortHistory ? "Recolher Histórico" : "Expandir Histórico"}
                  </button>
                </div>

                {showShortHistory && (
                  <div className="overflow-x-auto rounded-lg border border-slate-800 max-h-64 overflow-y-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900/90 text-slate-400 font-semibold text-[11px] border-b border-slate-800 sticky top-0">
                        <tr>
                          <th className="p-2.5">Link Encurtado</th>
                          <th className="p-2.5">Provedor</th>
                          <th className="p-2.5">Cliques</th>
                          <th className="p-2.5">Criado em</th>
                          <th className="p-2.5 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 bg-slate-950/40">
                        {shortenedUrls.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="p-2.5 font-mono">
                              <div className="font-bold text-emerald-400 flex items-center gap-1">
                                <a href={item.shortUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                  {item.shortUrl}
                                </a>
                              </div>
                              <div className="text-[10px] text-slate-500 truncate max-w-xs" title={item.originalUrl}>
                                {item.title || item.originalUrl}
                              </div>
                            </td>
                            <td className="p-2.5">
                              <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] border border-slate-700">
                                {item.providerName || item.provider}
                              </span>
                            </td>
                            <td className="p-2.5 font-bold text-white">
                              {item.clicks || 0}
                            </td>
                            <td className="p-2.5 text-[10px] text-slate-400">
                              {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="p-2.5 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleCopyShortUrl(item.shortUrl, item.id)}
                                title="Copiar link"
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                              >
                                {copiedShortId === item.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => setQrModalData({
                                  url: item.originalUrl,
                                  shortUrl: item.shortUrl,
                                  title: item.title || "QR Code"
                                })}
                                title="Ver QR Code"
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteShortUrl(item.id)}
                                disabled={deletingShortId === item.id}
                                title="Excluir do histórico"
                                className="p-1 rounded bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Spend */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Investimento</span>
            <DollarSign className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-lg font-black text-slate-900">
            R$ {totalSpend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Total aplicado em Ads</span>
        </div>

        {/* Revenue */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Faturamento</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg font-black text-emerald-600">
            R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-emerald-600 font-bold">Retorno em Vendas</span>
        </div>

        {/* ROAS */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">ROAS Geral</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg font-black text-amber-600">
            {overallRoas.toFixed(2)}x
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Retorno p/ cada R$ 1</span>
        </div>

        {/* Leads & CPL */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Leads & CPL</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-lg font-black text-indigo-600">
            {totalLeadsGenerated} leads
          </div>
          <span className="text-[10px] text-slate-500 font-medium">CPL: R$ {overallCpl.toFixed(2)}</span>
        </div>

        {/* Clicks & CPC */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Cliques & CPC</span>
            <MousePointer className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-lg font-black text-slate-800">
            {totalClicks.toLocaleString('pt-BR')}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">CPC: R$ {overallCpc.toFixed(2)} ({overallCtr.toFixed(1)}% CTR)</span>
        </div>

        {/* Conversions & CPA */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Vendas & CPA</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg font-black text-slate-900">
            {totalConversionsWon} vendas
          </div>
          <span className="text-[10px] text-slate-500 font-medium">CPA: R$ {overallCpa.toFixed(2)} ({overallConversionRate.toFixed(1)}%)</span>
        </div>
      </div>

      {/* Campaigns Table and Filters Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center space-x-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por campanha, público ou UTM..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            {/* Platform Filter */}
            <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-xl p-1 text-xs">
              <button
                onClick={() => setPlatformFilter("all")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${platformFilter === "all" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"}`}
              >
                Todas
              </button>
              <button
                onClick={() => setPlatformFilter("meta")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${platformFilter === "meta" ? "bg-blue-600 text-white" : "text-slate-600 hover:text-blue-600"}`}
              >
                Meta Ads
              </button>
              <button
                onClick={() => setPlatformFilter("google")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${platformFilter === "google" ? "bg-amber-600 text-white" : "text-slate-600 hover:text-amber-600"}`}
              >
                Google Ads
              </button>
              <button
                onClick={() => setPlatformFilter("tiktok")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${platformFilter === "tiktok" ? "bg-slate-900 text-pink-400" : "text-slate-600 hover:text-pink-600"}`}
              >
                TikTok Ads
              </button>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Somente Ativas 🟢</option>
              <option value="paused">Somente Pausadas ⏸️</option>
              <option value="completed">Concluídas</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100">
                <th className="py-3 px-4">Campanha & Plataforma</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Investido</th>
                <th className="py-3 px-3 text-right">Cliques / CTR</th>
                <th className="py-3 px-3 text-right">Leads / CPL</th>
                <th className="py-3 px-3 text-right">Vendas / CPA</th>
                <th className="py-3 px-3 text-right">Receita Gerada</th>
                <th className="py-3 px-3 text-right">ROAS</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Megaphone className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-slate-600">Nenhuma campanha encontrada com esses filtros.</p>
                      <button
                        onClick={handleOpenCreateModal}
                        className="text-xs font-bold text-emerald-600 hover:underline"
                      >
                        Cadastrar nova campanha agora
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-slate-50/70 transition-colors">
                    
                    {/* Name and platform */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-start space-x-2.5">
                        <div className="mt-0.5">{getPlatformBadge(camp.platform)}</div>
                        <div>
                          <div className="font-bold text-slate-900">{camp.name}</div>
                          {camp.targetAudience && (
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{camp.targetAudience}</p>
                          )}
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              utm_campaign={camp.utmCampaign}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3">
                      <button
                        onClick={() => handleToggleStatus(camp)}
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                          camp.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                        }`}
                        title="Clique para pausar ou reativar"
                      >
                        {camp.status === "active" ? (
                          <>
                            <PlayCircle className="w-3 h-3 text-emerald-600" />
                            <span>Ativa</span>
                          </>
                        ) : (
                          <>
                            <PauseCircle className="w-3 h-3 text-slate-500" />
                            <span>Pausada</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Spend */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="font-bold text-slate-900">
                        R$ {camp.spend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Orç: R$ {camp.budget}/dia
                      </span>
                    </td>

                    {/* Clicks & CTR */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="font-bold text-slate-800">
                        {camp.clicks.toLocaleString('pt-BR')} cliques
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {camp.ctr.toFixed(2)}% CTR (CPC R$ {camp.cpc.toFixed(2)})
                      </span>
                    </td>

                    {/* Leads & CPL */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="font-bold text-indigo-700">
                        {camp.leadsGenerated} leads
                      </div>
                      <span className="text-[10px] text-indigo-500 font-semibold">
                        CPL: R$ {camp.cpl.toFixed(2)}
                      </span>
                    </td>

                    {/* Conversions & CPA */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="font-bold text-slate-900">
                        {camp.conversionsWon} vendas
                      </div>
                      <span className="text-[10px] text-slate-500">
                        CPA: R$ {camp.cpa.toFixed(2)}
                      </span>
                    </td>

                    {/* Revenue */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="font-black text-emerald-600">
                        R$ {camp.revenueGenerated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </td>

                    {/* ROAS */}
                    <td className="py-3.5 px-3 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-black ${
                        camp.roas >= 8 ? "bg-emerald-100 text-emerald-800" :
                        camp.roas >= 4 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
                      }`}>
                        {camp.roas.toFixed(2)}x
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleOpenEditModal(camp)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Editar métricas da campanha"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setCampaignToDelete(camp)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Excluir campanha"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Campaign Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingCampaign ? "Editar Métricas da Campanha" : "Cadastrar Nova Campanha de Anúncios"}
                  </h3>
                  <p className="text-[11px] text-slate-400">Insira os dados de veiculação e performance comercial.</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveCampaign} className="p-6 space-y-4 overflow-y-auto flex-1">
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome da Campanha *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Meta Ads - Revenda Semijoias Consignadas 18k"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Plataforma</label>
                  <select
                    value={formPlatform}
                    onChange={(e) => setFormPlatform(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white font-semibold"
                  >
                    <option value="meta">Meta Ads (Instagram / FB)</option>
                    <option value="google">Google Ads (Search/PMax)</option>
                    <option value="tiktok">TikTok Ads</option>
                    <option value="other">Outra Rede / Influencer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white font-semibold"
                  >
                    <option value="active">Ativa 🟢</option>
                    <option value="paused">Pausada ⏸️</option>
                    <option value="completed">Concluída 🏁</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Orçamento Diário (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formBudget}
                    onChange={(e) => setFormBudget(e.target.value)}
                    placeholder="100.00"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Métricas de Performance da Campanha</span>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Total Investido (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formSpend}
                      onChange={(e) => setFormSpend(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-emerald-500 font-bold text-rose-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Impressões</label>
                    <input
                      type="number"
                      value={formImpressions}
                      onChange={(e) => setFormImpressions(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cliques no Link</label>
                    <input
                      type="number"
                      value={formClicks}
                      onChange={(e) => setFormClicks(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Leads Capturados</label>
                    <input
                      type="number"
                      value={formLeadsGenerated}
                      onChange={(e) => setFormLeadsGenerated(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-emerald-500 font-bold text-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Vendas / Fechamentos</label>
                    <input
                      type="number"
                      value={formConversionsWon}
                      onChange={(e) => setFormConversionsWon(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-emerald-500 font-bold text-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Receita Gerada (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formRevenueGenerated}
                      onChange={(e) => setFormRevenueGenerated(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-emerald-500 font-bold text-emerald-700"
                    />
                  </div>
                </div>
              </div>

              {/* UTM & Audience details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Público-Alvo / Segmentação</label>
                  <input
                    type="text"
                    value={formTargetAudience}
                    onChange={(e) => setFormTargetAudience(e.target.value)}
                    placeholder="Ex: Mulheres 25-45 anos, interesse em semijoias"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Código UTM da Campanha (utm_campaign)</label>
                  <input
                    type="text"
                    value={formUtmCampaign}
                    onChange={(e) => setFormUtmCampaign(e.target.value)}
                    placeholder="Ex: captacao_ouro_18k_2026"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Anotações / Estratégia</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Informações sobre criativos, testes A/B, ângulos de copy..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !formName.trim()}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? "Salvando..." : editingCampaign ? "Atualizar Campanha" : "Cadastrar Campanha"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Delete Campaign In-App Confirmation Modal */}
      {campaignToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Excluir Campanha de Anúncio?</h3>
              <p className="text-xs text-slate-500">
                Tem certeza que deseja excluir permanentemente a campanha <span className="font-bold text-slate-800">"{campaignToDelete.name}"</span>? Esta ação não pode ser desfeita.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Plataforma:</span>
                <span className="font-semibold text-slate-700 capitalize">{campaignToDelete.platform} Ads</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Investido:</span>
                <span className="font-semibold text-slate-700">R$ {campaignToDelete.spend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Leads Gerados:</span>
                <span className="font-semibold text-slate-700">{campaignToDelete.leadsGenerated} leads</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setCampaignToDelete(null)}
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
                {isDeleting ? (
                  <span>Excluindo...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirmar Exclusão</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrModalData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-100 text-center">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">QR Code de Rastreamento</h3>
              </div>
              <button
                type="button"
                onClick={() => setQrModalData(null)}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-700">{qrModalData.title}</p>
              <p className="text-[11px] text-slate-400">Escaneie para testar ou baixe para usar em catálogos, banners e stories.</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 inline-block shadow-inner">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="w-48 h-48 mx-auto rounded-lg"
                />
              ) : (
                <div className="w-48 h-48 mx-auto flex items-center justify-center text-slate-400 text-xs font-semibold">
                  Gerando QR Code...
                </div>
              )}
            </div>

            <div className="bg-slate-900 text-slate-300 p-2.5 rounded-xl text-xs font-mono break-all text-left">
              <span className="text-[10px] uppercase font-bold text-sky-400 block">Link Encurtado:</span>
              <span className="text-emerald-400 font-bold">{qrModalData.shortUrl}</span>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => handleCopyShortUrl(qrModalData.shortUrl)}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
              >
                {copiedShortId === qrModalData.shortUrl ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>

              <a
                href={qrDataUrl || "#"}
                download={`qrcode-${qrModalData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`}
                className="flex-1 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-md shadow-sky-600/20 flex items-center justify-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar PNG</span>
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
