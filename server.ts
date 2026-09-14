import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { Lead, MessageTemplate, AppNotification, TimelineItem, LeadStage, PipelineStage, CustomFieldDefinition, CompanyProfile, AuthUser, WebhookLog, AdCampaign, TargetModule, ShortenedUrl } from "./src/types";
import AdmZip from "adm-zip";

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Universal CORS Middleware for cross-origin form submissions (WordPress, Elementor, HTML Forms, External APIs)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CRM-API-Key, x-crm-api-key, x-api-key");
  res.header("Access-Control-Expose-Headers", "*");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// Paths for JSON storage
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const LEADS_FILE = path.join(DATA_DIR, "leads.json");
const TEMPLATES_FILE = path.join(DATA_DIR, "templates.json");
const NOTIFICATIONS_FILE = path.join(DATA_DIR, "notifications.json");
const STAGES_FILE = path.join(DATA_DIR, "stages.json");
const COMPANY_FILE = path.join(DATA_DIR, "company.json");
const CUSTOM_FIELDS_FILE = path.join(DATA_DIR, "custom_fields.json");
const AUTH_FILE = path.join(DATA_DIR, "auth.json");
const WEBHOOK_LOGS_FILE = path.join(DATA_DIR, "webhook_logs.json");
const ADS_CAMPAIGNS_FILE = path.join(DATA_DIR, "ads_campaigns.json");
const SHORTENED_URLS_FILE = path.join(DATA_DIR, "shortened_urls.json");

const DEFAULT_SHORTENED_URLS: ShortenedUrl[] = [
  {
    id: "short-1",
    originalUrl: "https://glowsemijoias.com.br/revenda?utm_source=meta_ads&utm_medium=stories_instagram&utm_campaign=captacao_revendedoras_ouro&utm_content=video_mostruario_01",
    shortUrl: "https://is.gd/glow_ouro",
    shortCode: "glow_ouro",
    provider: "isgd",
    providerName: "is.gd (Open API)",
    clicks: 184,
    utmSource: "meta_ads",
    utmCampaign: "captacao_revendedoras_ouro",
    title: "Link Stories Meta - Vídeo Mostruário",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "short-2",
    originalUrl: "https://glowsemijoias.com.br/consignado?utm_source=google_ads&utm_medium=cpc_search&utm_campaign=palavras_chave_revenda_consignada",
    shortUrl: "https://tinyurl.com/glowconsignado",
    shortCode: "glowconsignado",
    provider: "tinyurl",
    providerName: "TinyURL API",
    clicks: 92,
    utmSource: "google_ads",
    utmCampaign: "palavras_chave_revenda_consignada",
    title: "Google Search - Revenda Consignada",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const DEFAULT_ADS_CAMPAIGNS: AdCampaign[] = [
  {
    id: "ad-camp-1",
    name: "Meta Ads - Captação Revendedoras Ouro 18k (Feed & Reels)",
    platform: "meta",
    status: "active",
    budget: 1500,
    budgetType: "daily",
    spend: 4250,
    impressions: 89400,
    clicks: 3120,
    ctr: 3.49,
    cpc: 1.36,
    leadsGenerated: 142,
    cpl: 29.92,
    conversionsWon: 28,
    revenueGenerated: 42000,
    roas: 9.88,
    cpa: 151.78,
    utmSource: "meta_ads",
    utmMedium: "instagram_feed",
    utmCampaign: "captacao_revendedoras_ouro",
    startDate: "2026-08-01",
    targetAudience: "Mulheres 25-50 anos, interesse em empreendedorismo, moda e semijoias",
    notes: "Campanha com melhor taxa de conversão e maior volume de mostruários consignados ativos."
  },
  {
    id: "ad-camp-2",
    name: "Google Search - Fundo de Funil 'Como revender semijoias consignadas'",
    platform: "google",
    status: "active",
    budget: 800,
    budgetType: "daily",
    spend: 2800,
    impressions: 24500,
    clicks: 1470,
    ctr: 6.00,
    cpc: 1.90,
    leadsGenerated: 86,
    cpl: 32.55,
    conversionsWon: 19,
    revenueGenerated: 28500,
    roas: 10.17,
    cpa: 147.36,
    utmSource: "google_ads",
    utmMedium: "cpc_search",
    utmCampaign: "palavras_chave_revenda_consignada",
    startDate: "2026-08-05",
    targetAudience: "Pesquisas de alta intenção comercial no Google Brasil",
    notes: "Leads altamente qualificados com fechamento rápido em menos de 48h."
  },
  {
    id: "ad-camp-3",
    name: "TikTok Ads - Vídeos de Unboxing & Mostruário Lucrativo",
    platform: "tiktok",
    status: "active",
    budget: 600,
    budgetType: "daily",
    spend: 1650,
    impressions: 125000,
    clicks: 2950,
    ctr: 2.36,
    cpc: 0.56,
    leadsGenerated: 94,
    cpl: 17.55,
    conversionsWon: 12,
    revenueGenerated: 18000,
    roas: 10.90,
    cpa: 137.50,
    utmSource: "tiktok_ads",
    utmMedium: "spark_ads_video",
    utmCampaign: "unboxing_mostruario_renda_extra",
    startDate: "2026-08-10",
    targetAudience: "Jovens e mulheres 20-40 anos buscando renda extra e independência financeira",
    notes: "Custo por lead extremamente barato. Ideal para topo de funil e qualificação rápida no WhatsApp."
  },
  {
    id: "ad-camp-4",
    name: "Meta Ads - Remarketing Catálogo Novo & Coleção Primavera",
    platform: "meta",
    status: "paused",
    budget: 400,
    budgetType: "daily",
    spend: 920,
    impressions: 18600,
    clicks: 640,
    ctr: 3.44,
    cpc: 1.43,
    leadsGenerated: 35,
    cpl: 26.28,
    conversionsWon: 8,
    revenueGenerated: 12400,
    roas: 13.47,
    cpa: 115.00,
    utmSource: "meta_ads",
    utmMedium: "stories_remarketing",
    utmCampaign: "remarketing_catalogo_primavera",
    startDate: "2026-08-12",
    targetAudience: "Visitantes do site e seguidores do Instagram nos últimos 60 dias",
    notes: "Excelente ROAS para recuperação de leads que não haviam respondido no primeiro contato."
  }
];


const DEFAULT_WEBHOOK_LOGS: WebhookLog[] = [
  {
    id: "wlog-1",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    ip: "187.55.102.14",
    apiKeyReceived: "crm_sec_live_98a72b643",
    status: 201,
    success: true,
    source: "Plugin WordPress (Contact Form 7)",
    leadName: "Fernanda Costa",
    message: "Lead capturado com sucesso via Webhook",
    payload: {
      name: "Fernanda Costa",
      email: "fernanda.costa@empresa.com.br",
      phone: "11988884433",
      source: "Plugin WordPress (Contact Form 7)",
      notes: "Interessada no catálogo de revenda consignada"
    },
    headers: {
      "content-type": "application/json",
      "user-agent": "WordPress/6.4; Contact-Form-7/5.8"
    }
  },
  {
    id: "wlog-2",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    ip: "177.12.98.201",
    apiKeyReceived: "crm_sec_live_98a72b643",
    status: 201,
    success: true,
    source: "Formulário Universal (Elementor)",
    leadName: "Renato Silveira",
    message: "Lead capturado com sucesso via Webhook",
    payload: {
      name: "Renato Silveira",
      email: "renato@silveira.com",
      phone: "21997766554",
      value: 2500,
      source: "Formulário Universal (Elementor)"
    },
    headers: {
      "content-type": "application/json",
      "user-agent": "ElementorPro/3.18"
    }
  },
  {
    id: "wlog-3",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    ip: "200.18.99.12",
    apiKeyReceived: "crm_sec_live_chave_antiga_expirada",
    status: 401,
    success: false,
    source: "Plugin WordPress (WooCommerce)",
    leadName: "Carlos Eduardo",
    message: "Erro 401: Chave de API inválida ou ausente.",
    payload: {
      name: "Carlos Eduardo",
      email: "carlos@loja.com.br",
      phone: "31988776655"
    },
    headers: {
      "content-type": "application/json",
      "x-crm-api-key": "crm_sec_live_chave_antiga_expirada"
    }
  }
];

const DEFAULT_COMPANY: CompanyProfile = {
  name: "CRM Multinegócios",
  subtitle: "Gestão Comercial & Funil de Vendas",
  segment: "Serviços e Comercial",
  document: "12.345.678/0001-90",
  phone: "(11) 98888-7777",
  email: "contato@suaempresa.com.br",
  address: "Av. Paulista, 1000 - São Paulo / SP",
  currency: "R$",
  defaultLeadValue: 1500
};

const DEFAULT_CUSTOM_FIELDS: CustomFieldDefinition[] = [
  { id: "cf_segmento", label: "Segmento / Atividade", type: "text", required: false, showInTable: true, order: 1 },
  { id: "cf_cpf_cnpj", label: "CPF ou CNPJ", type: "text", required: false, showInTable: true, order: 2 },
  { id: "cf_data_agendamento", label: "Data Reunião / Agendamento", type: "date", required: false, showInTable: false, order: 3 }
];

const DEFAULT_AUTH = {
  username: "admin",
  password: "123"
};

const DEFAULT_STAGES: PipelineStage[] = [
  { id: "prospect", label: "Contato Inicial / Lead", color: "border-slate-300", bg: "bg-slate-100", text: "text-slate-800", order: 1, funnelType: "conventional", layer: "topo" },
  { id: "contacted", label: "Atendimento & Diagnóstico", color: "border-sky-300", bg: "bg-sky-50", text: "text-sky-800", order: 2, funnelType: "conventional", layer: "topo" },
  { id: "qualified", label: "Qualificação & Reunião", color: "border-indigo-300", bg: "bg-indigo-50", text: "text-indigo-800", order: 3, funnelType: "conventional", layer: "meio" },
  { id: "proposal", label: "Proposta / Orçamento", color: "border-amber-300", bg: "bg-amber-50", text: "text-amber-800", order: 4, funnelType: "conventional", layer: "meio" },
  { id: "negotiation", label: "Negociação de Contrato", color: "border-purple-300", bg: "bg-purple-50", text: "text-purple-800", order: 5, funnelType: "conventional", layer: "meio" },
  { id: "won", label: "Venda Concluída 🎉", color: "border-emerald-300", bg: "bg-emerald-50", text: "text-emerald-800", order: 6, funnelType: "conventional", layer: "fundo" },
  { id: "lost", label: "Sem Interesse (Perda)", color: "border-rose-300", bg: "bg-rose-50", text: "text-rose-800", order: 7, funnelType: "conventional", layer: "fundo" },
  { id: "onboarding", label: "Onboarding (Boas-Vindas)", color: "border-sky-300", bg: "bg-sky-50", text: "text-sky-800", order: 8, funnelType: "inverted", layer: "topo" },
  { id: "activation", label: "Ativação / Treinamento", color: "border-indigo-300", bg: "bg-indigo-50", text: "text-indigo-800", order: 9, funnelType: "inverted", layer: "meio" },
  { id: "retention", label: "Retenção / Sucesso", color: "border-emerald-300", bg: "bg-emerald-50", text: "text-emerald-800", order: 10, funnelType: "inverted", layer: "meio" },
  { id: "expansion", label: "Expansão / Upsell", color: "border-amber-300", bg: "bg-amber-50", text: "text-amber-800", order: 11, funnelType: "inverted", layer: "fundo" },
  { id: "referral", label: "Indicação de Parceiro", color: "border-rose-300", bg: "bg-rose-50", text: "text-rose-800", order: 12, funnelType: "inverted", layer: "fundo" }
];

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 11);

// Default Seed Data
const DEFAULT_LEADS: Lead[] = [
  {
    id: "lead-1",
    name: "Mariana Mendes (Revendedora SP)",
    nickname: "Mari",
    email: "mariana.mendes@email.com",
    phone: "11987654321",
    value: 3500,
    stage: "won",
    source: "Instagram",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    notes: [
      { id: "note-1-1", type: "created", content: "Lead criado via direct do Instagram interessada em revenda", timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "note-1-2", type: "whatsapp_sent", content: "Mensagem de boas-vindas com catálogo enviada", timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "note-1-3", type: "stage_changed", content: "Etapa atualizada para Apresentação / Atendimento", timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "note-1-4", type: "note", content: "Reunião de escolha de peças concluída. Escolheu mostruário folheado a ouro.", timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "note-1-5", type: "stage_changed", content: "Etapa atualizada para Escolha de Mostruário", timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "note-1-6", type: "stage_changed", content: "Etapa atualizada para Orçamento e Condições", timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "note-1-7", type: "note", content: "Contrato de consignado e valores aprovados", timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "note-1-8", type: "stage_changed", content: "Etapa atualizada para Envio das Semijoias", timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "note-1-9", type: "stage_changed", content: "Mostruário entregue! Primeira venda iniciada.", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    lastContactAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "lead-2",
    name: "Paula Albuquerque (Atacado Campinas)",
    nickname: "Paula",
    email: "paula.semijoias@gmail.com",
    phone: "19998877665",
    value: 1800,
    stage: "proposal",
    source: "Indicação",
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    notes: [
      { id: "note-2-1", type: "created", content: "Contato via indicação de outra revendedora", timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "note-2-2", type: "whatsapp_sent", content: "Apresentação de condições para compras no atacado", timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "note-2-3", type: "stage_changed", content: "Etapa atualizada para Apresentação / Atendimento", timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "note-2-4", type: "stage_changed", content: "Etapa atualizada para Escolha de Mostruário", timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "note-2-5", type: "note", content: "Selecionando peças da linha clássica e ródio branco", timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "note-2-6", type: "stage_changed", content: "Etapa atualizada para Orçamento e Condições", timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    lastContactAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "lead-3",
    name: "Clara Reis (Consignado Curitiba)",
    nickname: "Clarinha",
    email: "clara.reis@gmail.com",
    phone: "41971234567",
    value: 5200,
    stage: "negotiation",
    source: "Google Ads",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    notes: [
      { id: "note-3-1", type: "created", content: "Lead cadastrado via formulário de revenda Google Ads", timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "note-3-2", type: "stage_changed", content: "Etapa atualizada para Apresentação / Atendimento", timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "note-3-3", type: "stage_changed", content: "Etapa atualizada para Escolha de Mostruário", timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "note-3-4", type: "stage_changed", content: "Etapa atualizada para Orçamento e Condições", timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "note-3-5", type: "stage_changed", content: "Etapa atualizada para Envio das Semijoias", timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "note-3-6", type: "note", content: "Maleta enviada via Correios. Código de rastreamento enviado.", timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() }
    ],
    lastContactAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "lead-4",
    name: "Sofia Silva (Varejo Premium)",
    nickname: "Sofi",
    email: "",
    phone: "81988887777",
    value: 450,
    stage: "contacted",
    source: "WhatsApp",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    notes: [
      { id: "note-4-1", type: "created", content: "Iniciou conversa querendo ver alianças de casamento", timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "note-4-2", type: "stage_changed", content: "Etapa atualizada para Apresentação / Atendimento", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "note-4-3", type: "whatsapp_sent", content: "Enviado tabela de medidas e fotos das alianças banhadas em ouro", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    lastContactAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "lead-5",
    name: "Beatriz Oliveira (Revenda Consignada)",
    nickname: "Bia",
    email: "beatriz.oliveira@outlook.com",
    phone: "19991238844",
    value: 2400,
    stage: "qualified",
    source: "Instagram",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    notes: [
      { id: "note-5-1", type: "created", content: "Preencheu formulário no Instagram interessada em revenda", timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "note-5-2", type: "stage_changed", content: "Etapa atualizada para Apresentação / Atendimento", timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "note-5-3", type: "note", content: "Contato telefônico realizado: Já tem experiência com revenda de cosméticos.", timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString() },
      { id: "note-5-4", type: "stage_changed", content: "Etapa atualizada para Escolha de Mostruário", timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() }
    ],
    lastContactAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "lead-6",
    name: "Camila Fernandes (Atraso Consignado)",
    nickname: "Cami",
    email: "",
    phone: "11965432109",
    value: 1200,
    stage: "lost",
    source: "Instagram",
    isInadimplente: true,
    valorInadimplente: 1200,
    diasAtraso: 45,
    statusCobranca: "active",
    createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    notes: [
      { id: "note-6-1", type: "created", content: "Lead de consignado iniciado há mais de um mês", timestamp: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "note-6-2", type: "system", content: "Marcado como INADIMPLENTE. Débito de R$ 1.200,00 referente ao acerto das semijoias vendidas em atraso de 45 dias.", timestamp: new Date().toISOString() }
    ]
  },
  {
    id: "lead-7",
    name: "Gabriela Santos (Acordo Pendente)",
    nickname: "Gabi",
    email: "",
    phone: "21988776655",
    value: 2800,
    stage: "lost",
    source: "Indicação",
    isInadimplente: true,
    valorInadimplente: 1400,
    diasAtraso: 18,
    statusCobranca: "negotiation",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    notes: [
      { id: "note-7-1", type: "created", content: "Compra parcelada no atacado", timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "note-7-2", type: "system", content: "Marcado como INADIMPLENTE. Parcela de R$ 1.400,00 com atraso de 18 dias.", timestamp: new Date().toISOString() }
    ]
  }
];

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: "temp-1",
    name: "Apresentação de Catálogo e Parceria",
    category: "introduction",
    funnelModule: "sales",
    message: "Olá, {nome}! Tudo bem? Sou da Glow Semijoias. ✨ Vi que você se interessou pelo nosso catálogo de peças folheadas em Ouro 18k e Ródio Branco. Estarei te enviando as fotos e tabela de atacado e consignado. Qual tipo de parceria você busca hoje: revender com maleta ou comprar atacado?"
  },
  {
    id: "temp-2",
    name: "Follow-up de Escolha de Mostruário",
    category: "followup",
    funnelModule: "sales",
    message: "Olá, {apelido}. Tudo bem? Estou passando para saber se você conseguiu dar uma olhada na nossa nova coleção de semijoias. Se quiser, posso montar uma seleção personalizada de brincos, colares e anéis mais vendidos na sua região para facilitar o seu início!"
  },
  {
    id: "temp-3",
    name: "Envio de Proposta e Condições",
    category: "proposal",
    funnelModule: "sales",
    message: "Olá, {apelido}! Acabei de preparar a sua proposta personalizada no valor de R$ {valor} com condições especiais! 📋✨ Conseguimos manter essa condição para pedidos confirmados até hoje. Vamos fechar?"
  },
  {
    id: "temp-4",
    name: "Boas-Vindas e Entrega de Kit (Onboarding)",
    category: "introduction",
    funnelModule: "post_sales",
    message: "Parabéns, {apelido}! 🎉 Seja muito bem-vinda(o) à nossa equipe Glow Semijoias! Seu mostruário inicial foi preparado com todo carinho. Surgiu alguma dúvida sobre a tabela de preços ou instruções de cuidados com as peças? Estamos 100% à disposição para te apoiar no que precisar!"
  },
  {
    id: "temp-5",
    name: "Pesquisa de Satisfação & Atendimento (CSAT)",
    category: "followup",
    funnelModule: "post_sales",
    message: "Oi, {apelido}! Tudo bem? Gostaríamos muito de saber como está sendo sua experiência com a nossa linha de produtos. De 0 a 10, qual nota você daria para a qualidade das peças e a rapidez do nosso suporte? Seu feedback nos ajuda a melhorar sempre! 💖"
  },
  {
    id: "temp-6",
    name: "Aumento de Limite & Nova Coleção (Upsell)",
    category: "proposal",
    funnelModule: "post_sales",
    message: "Oi, {apelido}! 💎 Temos uma ótima notícia: pelo seu excelente histórico de vendas, liberamos um aumento de limite para o seu mostruário com as novidades da coleção de lançamentos. Gostaria que eu separasse as peças para você?"
  },
  {
    id: "temp-7",
    name: "Lembrete Amigável de Acerto 🌸",
    category: "other",
    funnelModule: "delinquents",
    message: "Olá, {apelido}! Tudo bem? Passando com carinho para lembrar que o acerto do seu mostruário no valor de R$ {valor} venceu recentemente. Caso já tenha realizado o pagamento via Pix, favor desconsiderar. Se precisar da chave Pix ou de algum suporte, me avise por aqui!"
  },
  {
    id: "temp-8",
    name: "Notificação de Atraso e Regularização ⚠️",
    category: "other",
    funnelModule: "delinquents",
    message: "Olá, {apelido}. Tudo bem? Estamos tentando contato referente ao saldo em aberto de R$ {valor} ({dias_atraso} dias de vencimento). Precisamos alinhar essa pendência para mantermos seu cadastro ativo e liberarmos novos mostruários. Como podemos te ajudar a regularizar hoje?"
  },
  {
    id: "temp-9",
    name: "Proposta de Acordo e Desconto para Quitação 🤝",
    category: "other",
    funnelModule: "delinquents",
    message: "Olá, {apelido}! Entendemos que imprevistos acontecem. Queremos muito te apoiar a quitar suas pendências de R$ {valor}. Conseguimos parcelar este saldo no cartão/Pix ou conceder uma condição com desconto especial para pagamento à vista hoje. Vamos fechar esse acordo?"
  }
];

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-1",
    title: "Novo lead integrado via API",
    message: "O lead Juliana Rocha (Alfa Engenharia) foi recebido via Webhook do RD Station e adicionado ao seu funil.",
    type: "info",
    read: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "notif-2",
    title: "Meta batida! 🏆",
    message: "O negócio com Roberto Silva (R$ 15.000) foi fechado com sucesso, atingindo a meta semanal!",
    type: "success",
    read: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "notif-3",
    title: "Lead inativo há mais de 5 dias",
    message: "O lead Carlos Eduardo está na etapa de Negociação há 4 dias sem nenhum novo contato registrado.",
    type: "warning",
    read: false,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  }
];

// Helper to read database
function readJsonFile<T>(filePath: string, defaultData: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), "utf8");
      return defaultData;
    }
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content) as T;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return defaultData;
  }
}

// Helper to write database
function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
  }
}

// Memory database loaded on start, persistent on edits
let leads: Lead[] = readJsonFile(LEADS_FILE, DEFAULT_LEADS);
// Backward compatibility mapping for company -> nickname
leads = leads.map((l: any) => {
  if (l.company && !l.nickname) {
    l.nickname = l.company;
  }
  if (!l.customFields) {
    l.customFields = {};
  }
  return l;
});
let templates: MessageTemplate[] = readJsonFile(TEMPLATES_FILE, DEFAULT_TEMPLATES);
let notifications: AppNotification[] = readJsonFile(NOTIFICATIONS_FILE, DEFAULT_NOTIFICATIONS);
let stages: PipelineStage[] = readJsonFile(STAGES_FILE, DEFAULT_STAGES);
let companyProfile: CompanyProfile = readJsonFile(COMPANY_FILE, DEFAULT_COMPANY);
let customFieldsList: CustomFieldDefinition[] = readJsonFile(CUSTOM_FIELDS_FILE, DEFAULT_CUSTOM_FIELDS);
let authData = readJsonFile(AUTH_FILE, DEFAULT_AUTH);
let webhookLogs: WebhookLog[] = readJsonFile(WEBHOOK_LOGS_FILE, DEFAULT_WEBHOOK_LOGS);
let adsCampaigns: AdCampaign[] = readJsonFile(ADS_CAMPAIGNS_FILE, DEFAULT_ADS_CAMPAIGNS);
let shortenedUrls: ShortenedUrl[] = readJsonFile(SHORTENED_URLS_FILE, DEFAULT_SHORTENED_URLS);

function recordWebhookLog(log: WebhookLog) {
  webhookLogs.unshift(log);
  if (webhookLogs.length > 100) {
    webhookLogs = webhookLogs.slice(0, 100);
  }
  writeJsonFile(WEBHOOK_LOGS_FILE, webhookLogs);
}

// Static CRM API Key (regenerated via endpoint, defaults to crm-api-key-demo-123)
let CRM_API_KEY = "crm_sec_live_98a72b643";

// API Endpoints for CRM Dashboard & Management

// 0. Company Profile Endpoints
app.get("/api/company", (req, res) => {
  res.json(companyProfile);
});

app.put("/api/company", (req, res) => {
  try {
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({ error: "Dados inválidos para a empresa." });
    }

    companyProfile = {
      ...companyProfile,
      name: req.body.name ? String(req.body.name).trim() : companyProfile.name,
      subtitle: req.body.subtitle !== undefined ? String(req.body.subtitle).trim() : companyProfile.subtitle,
      segment: req.body.segment !== undefined ? String(req.body.segment).trim() : companyProfile.segment,
      document: req.body.document !== undefined ? String(req.body.document).trim() : companyProfile.document,
      phone: req.body.phone !== undefined ? String(req.body.phone).trim() : companyProfile.phone,
      email: req.body.email !== undefined ? String(req.body.email).trim() : companyProfile.email,
      address: req.body.address !== undefined ? String(req.body.address).trim() : companyProfile.address,
      currency: req.body.currency !== undefined ? String(req.body.currency).trim() : companyProfile.currency,
      defaultLeadValue: req.body.defaultLeadValue !== undefined ? Number(req.body.defaultLeadValue) : companyProfile.defaultLeadValue
    };

    writeJsonFile(COMPANY_FILE, companyProfile);
    console.log("Perfil da empresa atualizado com sucesso:", companyProfile.name);
    res.json(companyProfile);
  } catch (err: any) {
    console.error("Erro ao atualizar empresa:", err);
    res.status(500).json({ error: "Erro interno ao atualizar perfil da empresa." });
  }
});

// 0b. Custom Fields Endpoints
app.get("/api/custom-fields", (req, res) => {
  const sorted = [...customFieldsList].sort((a, b) => a.order - b.order);
  res.json(sorted);
});

app.put("/api/custom-fields", (req, res) => {
  if (!Array.isArray(req.body)) {
    return res.status(400).json({ error: "Esperado um array de campos personalizados" });
  }
  customFieldsList = req.body;
  writeJsonFile(CUSTOM_FIELDS_FILE, customFieldsList);
  res.json(customFieldsList);
});

app.post("/api/custom-fields", (req, res) => {
  const { label, type, options, required, showInTable } = req.body;
  if (!label || !type) {
    return res.status(400).json({ error: "Rótulo (label) e Tipo (type) são obrigatórios" });
  }
  const id = "cf_" + generateId();
  const maxOrder = customFieldsList.reduce((m, c) => c.order > m ? c.order : m, 0);
  const newField: CustomFieldDefinition = {
    id,
    label,
    type: type || "text",
    options: options || [],
    required: !!required,
    showInTable: showInTable !== undefined ? !!showInTable : true,
    order: maxOrder + 1
  };
  customFieldsList.push(newField);
  writeJsonFile(CUSTOM_FIELDS_FILE, customFieldsList);
  res.status(201).json(newField);
});

app.delete("/api/custom-fields/:id", (req, res) => {
  const idx = customFieldsList.findIndex(f => f.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Campo não encontrado" });
  const removed = customFieldsList.splice(idx, 1)[0];
  writeJsonFile(CUSTOM_FIELDS_FILE, customFieldsList);
  res.json(removed);
});

// 0c. Authentication Endpoints
app.get("/api/auth/check", (req, res) => {
  // Simple session status check
  res.json({ username: authData.username, authenticated: true });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Informe usuário e senha" });
  }
  if (username === authData.username && password === authData.password) {
    return res.json({ success: true, username: authData.username, token: "session_token_active" });
  }
  res.status(401).json({ error: "Usuário ou senha incorretos" });
});

app.post("/api/auth/logout", (req, res) => {
  res.json({ success: true });
});

app.put("/api/auth/credentials", (req, res) => {
  const { currentPassword, newUsername, newPassword } = req.body;
  if (currentPassword !== authData.password) {
    return res.status(400).json({ error: "Senha atual incorreta" });
  }
  if (newUsername) authData.username = newUsername.trim();
  if (newPassword) authData.password = newPassword.trim();
  writeJsonFile(AUTH_FILE, authData);
  res.json({ success: true, username: authData.username });
});

// API Endpoints for CRM Dashboard & Management

// 1. Get API Key
app.get("/api/integration/key", (req, res) => {
  res.json({ apiKey: CRM_API_KEY });
});

// 2. Regenerate API Key
app.post("/api/integration/key/regenerate", (req, res) => {
  CRM_API_KEY = "crm_sec_live_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  res.json({ apiKey: CRM_API_KEY });
});

// 2.1 Webhook Incoming Event Logs
app.get("/api/integration/webhook-logs", (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  res.json(webhookLogs.slice(0, limit));
});

app.delete("/api/integration/webhook-logs", (req, res) => {
  webhookLogs = [];
  writeJsonFile(WEBHOOK_LOGS_FILE, webhookLogs);
  res.json({ success: true, message: "Logs de webhooks zerados com sucesso." });
});

// 2b. Download WordPress Plugin ZIP
app.get("/api/integration/wordpress-plugin", (req, res) => {
  try {
    const zip = new AdmZip();
    const phpFilePath = path.join(process.cwd(), "assets", "crm-leads-webhook-integration.php");
    
    if (!fs.existsSync(phpFilePath)) {
      return res.status(404).json({ error: "Arquivo PHP do plugin não encontrado no servidor." });
    }
    
    const phpContent = fs.readFileSync(phpFilePath);
    zip.addFile("crm-leads-webhook-integration/crm-leads-webhook-integration.php", phpContent);
    const zipBuffer = zip.toBuffer();
    
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", "attachment; filename=crm-leads-webhook-integration.zip");
    res.send(zipBuffer);
  } catch (err: any) {
    console.error("Erro ao gerar ZIP do plugin WordPress:", err);
    res.status(500).json({ error: "Falha ao gerar o arquivo ZIP do plugin WordPress." });
  }
});

// 3. Leads CRUD
app.get("/api/leads", (req, res) => {
  res.json(leads);
});

app.get("/api/leads/:id", (req, res) => {
  const lead = leads.find((l) => l.id === req.params.id);
  if (!lead) return res.status(404).json({ error: "Lead não encontrado" });
  res.json(lead);
});

app.post("/api/leads", (req, res) => {
  const { 
    name, nickname, company, email, phone, value, stage, source, 
    targetModule,
    isInadimplente, valorInadimplente, diasAtraso, statusCobranca, 
    promessaPagamentoData, promessaPagamentoValor,
    postSalesStage, postSalesHealth, postSalesNps, postSalesNotes,
    customFields 
  } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: "Campos obrigatórios: nome, telefone" });
  }

  // Handle targetModule routing
  let finalStage: LeadStage = (stage as LeadStage) || "prospect";
  let finalIsInadimplente = !!isInadimplente;
  let finalValorInadimplente = Number(valorInadimplente) || 0;
  let finalPostSalesStage = postSalesStage;

  if (targetModule === "delinquents" || targetModule === "inadimplencia") {
    finalIsInadimplente = true;
    finalValorInadimplente = finalValorInadimplente || Number(value) || 1200;
  } else if (targetModule === "post_sales" || targetModule === "pos_vendas") {
    finalStage = "won";
    finalPostSalesStage = finalPostSalesStage || "onboarding";
    finalIsInadimplente = false;
  } else {
    finalIsInadimplente = false;
  }

  const assignedTargetModule: TargetModule = 
    (targetModule as TargetModule) || 
    (finalIsInadimplente ? "delinquents" : "sales");

  const newLead: Lead = {
    id: "lead-" + generateId(),
    name,
    nickname: nickname || company || "",
    email: email || "",
    phone,
    value: Number(value) || 0,
    stage: finalStage,
    source: source || "Manual",
    targetModule: assignedTargetModule,
    isInadimplente: finalIsInadimplente,
    valorInadimplente: finalIsInadimplente ? finalValorInadimplente : 0,
    diasAtraso: finalIsInadimplente ? (Number(diasAtraso) || 15) : 0,
    statusCobranca: finalIsInadimplente ? (statusCobranca || "friendly") : undefined,
    promessaPagamentoData: finalIsInadimplente ? (promessaPagamentoData || "") : "",
    promessaPagamentoValor: finalIsInadimplente ? (Number(promessaPagamentoValor) || 0) : 0,
    postSalesStage: assignedTargetModule === "post_sales" ? (finalPostSalesStage || "onboarding") : undefined,
    postSalesHealth: assignedTargetModule === "post_sales" ? (postSalesHealth || "healthy") : undefined,
    postSalesNps: (assignedTargetModule === "post_sales" && postSalesNps !== undefined) ? Number(postSalesNps) : undefined,
    postSalesNotes: assignedTargetModule === "post_sales" ? (postSalesNotes || "") : "",
    customFields: customFields || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: [
      { 
        id: "note-" + generateId(), 
        type: "created", 
        content: `Lead registrado no sistema com destino ao módulo [${assignedTargetModule === 'delinquents' ? 'Inadimplência / Cobrança' : assignedTargetModule === 'post_sales' ? 'Pós-Vendas' : 'Funil de Vendas'}] (${source || "Manual"})`, 
        timestamp: new Date().toISOString() 
      }
    ]
  };

  leads.unshift(newLead);
  writeJsonFile(LEADS_FILE, leads);

  // Add Notification
  const newNotif: AppNotification = {
    id: "notif-" + generateId(),
    title: "Novo lead criado",
    message: `O lead ${newLead.name} (${newLead.nickname ? "chamado de " + newLead.nickname : "Sem apelido"}) foi adicionado ao CRM.`,
    type: "info",
    read: false,
    createdAt: new Date().toISOString()
  };
  notifications.unshift(newNotif);
  writeJsonFile(NOTIFICATIONS_FILE, notifications);

  res.status(201).json(newLead);
});

app.put("/api/leads/:id", (req, res) => {
  const { id } = req.params;
  const index = leads.findIndex((l) => l.id === id);
  if (index === -1) return res.status(404).json({ error: "Lead não encontrado" });

  const currentLead = leads[index];
  const { 
    name, nickname, company, email, phone, value, stage, notes, addNote, 
    markWhatsAppContact, isInadimplente, valorInadimplente, diasAtraso, 
    statusCobranca, promessaPagamentoData, promessaPagamentoValor,
    postSalesStage, postSalesHealth, postSalesNps, postSalesNotes,
    customFields 
  } = req.body;

  let stageChanged = false;
  let oldStage = currentLead.stage;

  if (stage && stage !== currentLead.stage) {
    stageChanged = true;
    currentLead.stage = stage as LeadStage;
    // If moved to won and doesn't have postSalesStage, initialize in onboarding
    if (stage === "won" && !currentLead.postSalesStage) {
      currentLead.postSalesStage = "onboarding";
      currentLead.postSalesHealth = currentLead.postSalesHealth || "healthy";
    }
  }

  if (name !== undefined) currentLead.name = name;
  if (nickname !== undefined) currentLead.nickname = nickname;
  if (company !== undefined) currentLead.nickname = company;
  if (email !== undefined) currentLead.email = email;
  if (phone !== undefined) currentLead.phone = phone;
  if (value !== undefined) currentLead.value = Number(value) || 0;
  if (customFields !== undefined) {
    currentLead.customFields = { ...(currentLead.customFields || {}), ...customFields };
  }

  const nowStr = new Date().toISOString();

  // Delinquency status change logging
  if (isInadimplente !== undefined && isInadimplente !== currentLead.isInadimplente) {
    const statusText = isInadimplente 
      ? `Marcado como INADIMPLENTE. Débito de R$ ${Number(valorInadimplente || 0).toLocaleString('pt-BR')} em atraso.` 
      : `Regularizado! Cliente removido da lista de inadimplentes.`;
    currentLead.notes.push({
      id: "note-" + generateId(),
      type: "system",
      content: statusText,
      timestamp: nowStr
    });
  }

  if (isInadimplente !== undefined) currentLead.isInadimplente = !!isInadimplente;
  if (valorInadimplente !== undefined) currentLead.valorInadimplente = Number(valorInadimplente) || 0;
  if (diasAtraso !== undefined) currentLead.diasAtraso = Number(diasAtraso) || 0;
  if (statusCobranca !== undefined) currentLead.statusCobranca = statusCobranca;
  if (promessaPagamentoData !== undefined) currentLead.promessaPagamentoData = promessaPagamentoData;
  if (promessaPagamentoValor !== undefined) currentLead.promessaPagamentoValor = Number(promessaPagamentoValor) || 0;

  // Post-Sales fields
  if (postSalesStage !== undefined) {
    if (postSalesStage !== currentLead.postSalesStage) {
      currentLead.notes.push({
        id: "note-" + generateId(),
        type: "stage_changed",
        content: `Pós-Venda: fase alterada para "${postSalesStage}"`,
        timestamp: nowStr
      });
    }
    currentLead.postSalesStage = postSalesStage;
  }
  if (postSalesHealth !== undefined) currentLead.postSalesHealth = postSalesHealth;
  if (postSalesNps !== undefined) currentLead.postSalesNps = Number(postSalesNps);
  if (postSalesNotes !== undefined) currentLead.postSalesNotes = postSalesNotes;

  currentLead.updatedAt = nowStr;

  // Add standard note from timeline update
  if (addNote && addNote.trim() !== "") {
    currentLead.notes.push({
      id: "note-" + generateId(),
      type: "note",
      content: addNote,
      timestamp: nowStr
    });
    currentLead.lastContactAt = nowStr;
  }

  // Add stage change log
  if (stageChanged) {
    currentLead.notes.push({
      id: "note-" + generateId(),
      type: "stage_changed",
      content: `Etapa atualizada de ${oldStage.toUpperCase()} para ${currentLead.stage.toUpperCase()}`,
      timestamp: nowStr
    });

    // Create Notification on major state updates
    if (currentLead.stage === "won" || currentLead.stage === "lost") {
      const title = currentLead.stage === "won" ? "Negócio Fechado! 🎉" : "Negócio Perdido 😢";
      const message = currentLead.stage === "won"
        ? `Parabéns! Venda de R$ ${currentLead.value.toLocaleString('pt-BR')} concluída com ${currentLead.name}.`
        : `O lead ${currentLead.name} (${currentLead.nickname ? "chamado de " + currentLead.nickname : "Sem apelido"}) foi movido para Perdido.`;

      notifications.unshift({
        id: "notif-" + generateId(),
        title,
        message,
        type: currentLead.stage === "won" ? "success" : "warning",
        read: false,
        createdAt: nowStr
      });
      writeJsonFile(NOTIFICATIONS_FILE, notifications);
    }
  }

  // Add WhatsApp contact timeline logging
  if (markWhatsAppContact) {
    currentLead.notes.push({
      id: "note-" + generateId(),
      type: "whatsapp_sent",
      content: markWhatsAppContact,
      timestamp: nowStr
    });
    currentLead.lastContactAt = nowStr;
  }

  leads[index] = currentLead;
  writeJsonFile(LEADS_FILE, leads);

  res.json(currentLead);
});

app.delete("/api/leads/:id", (req, res) => {
  const index = leads.findIndex((l) => l.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Lead não encontrado" });

  const deletedLead = leads.splice(index, 1)[0];
  writeJsonFile(LEADS_FILE, leads);

  res.json({ message: "Lead removido com sucesso", id: deletedLead.id });
});

// 4. Bulk CSV Import
app.post("/api/leads/import", (req, res) => {
  const { importedLeads } = req.body;
  if (!Array.isArray(importedLeads) || importedLeads.length === 0) {
    return res.status(400).json({ error: "Nenhum lead enviado para importação." });
  }

  const nowStr = new Date().toISOString();
  const addedLeads: Lead[] = [];

  for (const item of importedLeads) {
    if (!item.name) continue;

    const newLead: Lead = {
      id: "lead-" + generateId(),
      name: item.name,
      nickname: item.nickname || item.company || "",
      email: item.email || "",
      phone: item.phone || "",
      value: Number(item.value) || 0,
      stage: (item.stage as LeadStage) || "prospect",
      source: item.source || "CSV Import",
      createdAt: nowStr,
      updatedAt: nowStr,
      notes: [
        { id: "note-" + generateId(), type: "created", content: "Lead importado em lote via CSV", timestamp: nowStr }
      ]
    };
    addedLeads.push(newLead);
  }

  leads = [...addedLeads, ...leads];
  writeJsonFile(LEADS_FILE, leads);

  // Add summary notification
  notifications.unshift({
    id: "notif-" + generateId(),
    title: "Importação CSV concluída",
    message: `${addedLeads.length} leads foram importados com sucesso para o funil.`,
    type: "success",
    read: false,
    createdAt: nowStr
  });
  writeJsonFile(NOTIFICATIONS_FILE, notifications);

  res.json({ success: true, count: addedLeads.length, leads: addedLeads });
});

// 5. External API Webhook endpoint (receives leads from Facebook Forms, Typeform, RD Station, ActiveCampaign, WP Plugin, Elementor, HTML Forms, etc.)
app.post("/api/leads/webhook", (req, res) => {
  // Flexible API Key Extraction (Headers, Query string, or Body payload)
  const apiKeyReceived = (
    req.headers["x-crm-api-key"] ||
    req.headers["x-api-key"] ||
    req.headers["authorization"] ||
    req.query.api_key ||
    req.query.x_crm_api_key ||
    req.query.key ||
    req.body?.api_key ||
    req.body?.x_crm_api_key ||
    req.body?.apiKey ||
    req.body?.["x-crm-api-key"] ||
    req.body?.crm_webhook_api_key ||
    ""
  ).toString().replace(/^Bearer\s+/i, "").trim();

  const clientIp = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1").toString();
  const nowStr = new Date().toISOString();

  // Extract fields with full support for Portuguese & English field aliases
  const rawName = (
    req.body?.name ||
    req.body?.nome ||
    req.body?.["your-name"] ||
    req.body?.your_name ||
    req.body?.["seu-nome"] ||
    req.body?.lead_name ||
    req.body?.cliente ||
    req.body?.full_name ||
    req.body?.first_name ||
    req.query?.name ||
    req.query?.nome ||
    ""
  ).toString().trim();

  const email = (
    req.body?.email ||
    req.body?.["your-email"] ||
    req.body?.your_email ||
    req.body?.["seu-email"] ||
    req.body?.mail ||
    req.query?.email ||
    ""
  ).toString().trim();

  const phone = (
    req.body?.phone ||
    req.body?.telefone ||
    req.body?.["your-phone"] ||
    req.body?.your_phone ||
    req.body?.["your-tel"] ||
    req.body?.["seu-telefone"] ||
    req.body?.whatsapp ||
    req.body?.celular ||
    req.body?.tel ||
    req.body?.phone_number ||
    req.query?.phone ||
    req.query?.telefone ||
    ""
  ).toString().trim();

  const nickname = (
    req.body?.nickname ||
    req.body?.apelido ||
    req.body?.company ||
    req.body?.empresa ||
    req.body?.razao_social ||
    req.body?.["your-company"] ||
    ""
  ).toString().trim();

  const source = (
    req.body?.source ||
    req.body?.origem ||
    req.body?.fonte ||
    req.body?.["your-source"] ||
    "Formulário Site / WordPress"
  ).toString().trim();

  const notes = (
    req.body?.notes ||
    req.body?.mensagem ||
    req.body?.message ||
    req.body?.["your-message"] ||
    req.body?.observacoes ||
    req.body?.obs ||
    req.body?.detalhes ||
    ""
  ).toString().trim();

  const value = Number(req.body?.value || req.body?.valor || req.body?.orcamento || req.body?.amount) || 0;
  const customFields = req.body?.customFields || {};

  // Validate API Key
  if (!apiKeyReceived || apiKeyReceived !== CRM_API_KEY) {
    recordWebhookLog({
      id: "wlog-" + generateId(),
      timestamp: nowStr,
      ip: clientIp,
      apiKeyReceived: apiKeyReceived || "(ausente)",
      status: 401,
      success: false,
      source: source || "Webhook Externo",
      leadName: rawName || "Tentativa de Conexão",
      message: `Erro 401: Chave de API inválida. Chave recebida: "${apiKeyReceived || "ausente"}".`,
      payload: req.body || {},
      headers: {
        "content-type": req.headers["content-type"] || "desconhecido",
        "user-agent": req.headers["user-agent"] || "desconhecido",
        "x-crm-api-key": apiKeyReceived || null
      }
    });
    return res.status(401).json({
      error: "Chave de API inválida ou ausente.",
      receivedKey: apiKeyReceived || "ausente",
      help: "Verifique e copie a Chave Secreta da API exibida no painel de Integração do CRM."
    });
  }

  // Validate presence of contact info
  if (!rawName && !email && !phone) {
    recordWebhookLog({
      id: "wlog-" + generateId(),
      timestamp: nowStr,
      ip: clientIp,
      apiKeyReceived: apiKeyReceived,
      status: 400,
      success: false,
      source: source || "Webhook Externo",
      leadName: "(Incompleto)",
      message: "Erro 400: Nenhum dado de contato (nome, e-mail ou telefone) foi enviado no payload.",
      payload: req.body || {},
      headers: {
        "content-type": req.headers["content-type"] || "desconhecido",
        "user-agent": req.headers["user-agent"] || "desconhecido"
      }
    });
    return res.status(400).json({ error: "Erro 400: Forneça ao menos um nome, e-mail ou telefone do lead." });
  }

  // Smart fallback for Lead Name
  const finalName = rawName || (email ? email.split("@")[0] : "") || (phone ? `Lead ${phone}` : "Lead do Site");

  const newLead: Lead = {
    id: "lead-" + generateId(),
    name: finalName,
    nickname: nickname || "",
    email: email || "",
    phone: phone || "",
    value: value,
    stage: "prospect",
    source: source || "Integração API Webhook",
    customFields: customFields || {},
    createdAt: nowStr,
    updatedAt: nowStr,
    notes: [
      { id: "note-" + generateId(), type: "created", content: `Lead capturado via Webhook/Formulário (${source})`, timestamp: nowStr }
    ]
  };

  if (notes) {
    newLead.notes.push({
      id: "note-" + generateId(),
      type: "note",
      content: `Mensagem enviada pelo Lead: ${notes}`,
      timestamp: nowStr
    });
  }

  leads.unshift(newLead);
  writeJsonFile(LEADS_FILE, leads);

  // Add Notification
  notifications.unshift({
    id: "notif-" + generateId(),
    title: "Lead Capturado via API Webhook 🔌",
    message: `Novo lead de ${newLead.name} (${newLead.phone || newLead.email}) recebido de ${newLead.source}.`,
    type: "info",
    read: false,
    createdAt: nowStr
  });
  writeJsonFile(NOTIFICATIONS_FILE, notifications);

  // Log successful incoming webhook
  recordWebhookLog({
    id: "wlog-" + generateId(),
    timestamp: nowStr,
    ip: clientIp,
    apiKeyReceived: apiKeyReceived,
    status: 201,
    success: true,
    source: source || "Integração API Webhook",
    leadName: finalName,
    message: "Lead cadastrado com sucesso no Funil do CRM",
    payload: req.body || {},
    headers: {
      "content-type": req.headers["content-type"] || "desconhecido",
      "user-agent": req.headers["user-agent"] || "desconhecido"
    }
  });

  res.status(201).json({
    success: true,
    message: "Lead capturado e cadastrado com sucesso no CRM",
    leadId: newLead.id
  });
});

// 6. Templates CRUD
app.get("/api/templates", (req, res) => {
  res.json(templates);
});

app.post("/api/templates", (req, res) => {
  const { id, name, message, category, stageId, layer, funnelModule } = req.body;

  if (!name || !message || !category) {
    return res.status(400).json({ error: "Campos obrigatórios: name, message, category" });
  }

  // Derive funnelModule if not explicitly provided
  let finalModule: 'sales' | 'post_sales' | 'delinquents' = funnelModule || "sales";
  if (!funnelModule) {
    if (category === "other" || name.toLowerCase().includes("cobrança") || name.toLowerCase().includes("inadimpl") || name.toLowerCase().includes("atraso") || name.toLowerCase().includes("acordo")) {
      finalModule = "delinquents";
    } else if (name.toLowerCase().includes("pós") || name.toLowerCase().includes("onboarding") || name.toLowerCase().includes("csat") || name.toLowerCase().includes("boas-vindas")) {
      finalModule = "post_sales";
    }
  }

  if (id) {
    const idx = templates.findIndex((t) => t.id === id);
    if (idx !== -1) {
      templates[idx] = { 
        id, 
        name, 
        message, 
        category,
        funnelModule: finalModule,
        stageId: stageId || undefined,
        layer: layer || "all"
      };
      writeJsonFile(TEMPLATES_FILE, templates);
      return res.json(templates[idx]);
    }
  }

  const newTemp: MessageTemplate = {
    id: "temp-" + generateId(),
    name,
    message,
    category,
    funnelModule: finalModule,
    stageId: stageId || undefined,
    layer: layer || "all"
  };

  templates.push(newTemp);
  writeJsonFile(TEMPLATES_FILE, templates);
  res.status(201).json(newTemp);
});

app.delete("/api/templates/:id", (req, res) => {
  const index = templates.findIndex((t) => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Template não encontrado" });

  const deleted = templates.splice(index, 1)[0];
  writeJsonFile(TEMPLATES_FILE, templates);
  res.json(deleted);
});

// 6.5 Stages CRUD
// Get all stages
app.get("/api/stages", (req, res) => {
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);
  res.json(sortedStages);
});

// Create a new stage
app.post("/api/stages", (req, res) => {
  const { label, color, bg, text, funnelType, layer } = req.body;
  if (!label) {
    return res.status(400).json({ error: "O campo 'label' é obrigatório" });
  }

  const id = "stage-" + generateId();
  const maxOrder = stages.reduce((max, s) => s.order > max ? s.order : max, 0);

  const newStage: PipelineStage = {
    id,
    label,
    color: color || "border-slate-300",
    bg: bg || "bg-slate-50",
    text: text || "text-slate-800",
    order: maxOrder + 1,
    funnelType: funnelType || "conventional",
    layer: layer || "topo"
  };

  stages.push(newStage);
  writeJsonFile(STAGES_FILE, stages);
  res.status(201).json(newStage);
});

// Update an existing stage
app.put("/api/stages/:id", (req, res) => {
  const { id } = req.params;
  const idx = stages.findIndex((s) => s.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Etapa não encontrada" });
  }

  const { label, color, bg, text, order, funnelType, layer } = req.body;

  if (label !== undefined) stages[idx].label = label;
  if (color !== undefined) stages[idx].color = color;
  if (bg !== undefined) stages[idx].bg = bg;
  if (text !== undefined) stages[idx].text = text;
  if (order !== undefined) stages[idx].order = Number(order);
  if (funnelType !== undefined) stages[idx].funnelType = funnelType;
  if (layer !== undefined) stages[idx].layer = layer;

  writeJsonFile(STAGES_FILE, stages);
  res.json(stages[idx]);
});

// Delete a stage
app.delete("/api/stages/:id", (req, res) => {
  const { id } = req.params;
  const idx = stages.findIndex((s) => s.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Etapa não encontrada" });
  }

  const deletedStage = stages.splice(idx, 1)[0];
  writeJsonFile(STAGES_FILE, stages);

  // Re-order remaining stages to be consecutive
  stages.sort((a, b) => a.order - b.order);
  stages.forEach((s, i) => {
    s.order = i + 1;
  });
  writeJsonFile(STAGES_FILE, stages);

  // If there are leads in the deleted stage, reassign them to the first available stage
  const fallbackStage = stages.length > 0 ? stages[0].id : "prospect";
  let reassignedCount = 0;
  leads.forEach((lead) => {
    if (lead.stage === id) {
      lead.stage = fallbackStage;
      lead.updatedAt = new Date().toISOString();
      lead.notes.push({
        id: "note-" + generateId(),
        type: "stage_changed",
        content: `Etapa excluída. Lead movido automaticamente para ${fallbackStage.toUpperCase()}`,
        timestamp: new Date().toISOString()
      });
      reassignedCount++;
    }
  });

  if (reassignedCount > 0) {
    writeJsonFile(LEADS_FILE, leads);
  }

  res.json({ success: true, deleted: deletedStage, reassignedCount, fallbackStage });
});

// Reorder stages in bulk
app.post("/api/stages/reorder", (req, res) => {
  const { stageIds } = req.body;
  if (!Array.isArray(stageIds)) {
    return res.status(400).json({ error: "Envie um array 'stageIds'" });
  }

  stageIds.forEach((id, index) => {
    const stage = stages.find((s) => s.id === id);
    if (stage) {
      stage.order = index + 1;
    }
  });

  writeJsonFile(STAGES_FILE, stages);
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);
  res.json(sortedStages);
});

// Switch/Reset Funnel Presets
app.post("/api/stages/reset", (req, res) => {
  stages = JSON.parse(JSON.stringify(DEFAULT_STAGES));
  writeJsonFile(STAGES_FILE, stages);

  const validStageIds = new Set(stages.map((s) => s.id));
  const fallbackStage = "prospect";
  let reassignedCount = 0;

  leads.forEach((lead) => {
    if (!validStageIds.has(lead.stage)) {
      lead.stage = fallbackStage;
      lead.updatedAt = new Date().toISOString();
      lead.notes.push({
        id: "note-" + generateId(),
        type: "stage_changed",
        content: `Funil reconfigurado para os padrões. Lead reposicionado para a etapa inicial: ${fallbackStage.toUpperCase()}`,
        timestamp: new Date().toISOString()
      });
      reassignedCount++;
    }
  });

  if (reassignedCount > 0) {
    writeJsonFile(LEADS_FILE, leads);
  }

  res.json({ success: true, stages, reassignedCount });
});

// 7. Notifications CRUD
app.get("/api/notifications", (req, res) => {
  res.json(notifications);
});

app.post("/api/notifications/read", (req, res) => {
  const { id, all } = req.body;

  if (all) {
    notifications.forEach((n) => (n.read = true));
  } else if (id) {
    const notif = notifications.find((n) => n.id === id);
    if (notif) notif.read = true;
  }

  writeJsonFile(NOTIFICATIONS_FILE, notifications);
  res.json({ success: true, count: notifications.filter((n) => !n.read).length });
});

// 8. Performance AI Report (Gemini API Integration)
app.post("/api/reports/ai-summary", async (req, res) => {
  try {
    const totalLeads = leads.length;
    const activeLeads = leads.filter(l => l.stage !== 'won' && l.stage !== 'lost').length;
    const wonLeads = leads.filter(l => l.stage === 'won');
    const lostLeads = leads.filter(l => l.stage === 'lost');

    const totalWonValue = wonLeads.reduce((acc, curr) => acc + curr.value, 0);
    const activePipelineValue = leads.filter(l => l.stage !== 'won' && l.stage !== 'lost').reduce((acc, curr) => acc + curr.value, 0);

    // Distribution by stage
    const stageCounts: Record<string, number> = {};
    leads.forEach(l => {
      stageCounts[l.stage] = (stageCounts[l.stage] || 0) + 1;
    });

    // Distribution by source
    const sourceCounts: Record<string, number> = {};
    leads.forEach(l => {
      sourceCounts[l.source] = (sourceCounts[l.source] || 0) + 1;
    });

    // conversion calculation
    const conversionRate = totalLeads > 0 ? (wonLeads.length / totalLeads) * 100 : 0;

    const getFallbackReport = (isServiceUnavailable = false) => {
      const title = isServiceUnavailable 
        ? "### 📊 Relatório de Desempenho do Funil (Gerado Localmente devido a alta demanda do serviço de IA)"
        : "### 📊 Relatório de Desempenho do Funil (Gerado Localmente)";

      const mockSummary = `${title}

Atualmente, o CRM gerencia **${totalLeads} leads** no total, apresentando um volume de negócios ativos de **R$ ${activePipelineValue.toLocaleString('pt-BR')}** distribuídos entre as etapas do funil.

#### 📈 Métricas de Sucesso:
*   **Taxa de Conversão Geral:** ${conversionRate.toFixed(1)}% (${wonLeads.length} negócios ganhos de ${totalLeads}).
*   **Faturamento Concluído:** R$ ${totalWonValue.toLocaleString('pt-BR')}.
*   **Ticket Médio Ganhos:** R$ ${(wonLeads.length > 0 ? totalWonValue / wonLeads.length : 0).toLocaleString('pt-BR')}.

#### 🔍 Gargalos e Observações Identificados:
*   **Concentração em Propostas/Negociações:** Existem ${stageCounts['proposal'] || 0} leads em Proposta e ${stageCounts['negotiation'] || 0} em Negociação. Essas etapas acumulam uma grande parcela do pipeline, indicando necessidade de acompanhamento (follow-up) mais assertivo.
*   **Origem dos Melhores Leads:** A origem mais frequente é **${Object.keys(sourceCounts).reduce((a, b) => sourceCounts[a] > sourceCounts[b] ? a : b, 'Nenhuma')}**, que representa o maior volume de captações.`;

      return {
        summary: mockSummary,
        generatedAt: new Date().toISOString(),
        insights: [
          "Foque nos leads em fase de Proposta e Negociação hoje, eles somam o maior volume financeiro no pipeline ativo.",
          "Crie uma automação de WhatsApp de follow-up para leads que estão há mais de 3 dias sem contato.",
          `Sua principal fonte de leads é "${Object.keys(sourceCounts).reduce((a, b) => sourceCounts[a] > sourceCounts[b] ? a : b, 'Nenhuma')}". Aloque mais orçamento nesta origem.`
        ]
      };
    };

    // Check if API key is provided
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      // Fallback local report if API key is missing
      console.log("Gemini API key is not configured. Using fallback local algorithm for CRM report.");
      return res.json(getFallbackReport(false));
    }

    // Initialize Gemini SDK with User-Agent required for telemetry
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const systemPrompt = `Você é um Diretor de Vendas e Especialista em CRM altamente experiente.
Analise os dados estruturados do CRM de vendas fornecidos em formato JSON e crie um relatório executivo de desempenho em Português do Brasil.
O relatório deve ser encorajador, analítico, objetivo e direto ao ponto. Use formatação Markdown elegante.
Forneça dicas de aceleração comercial com base nas etapas que apresentam maior acúmulo (gargalo) e sugira melhorias.`;

    const prompt = `Analise os seguintes dados do CRM:
Métricas Gerais:
- Total de Leads: ${totalLeads}
- Leads Ativos (no funil): ${activeLeads}
- Negócios Ganhos (Won): ${wonLeads.length} (Valor total: R$ ${totalWonValue})
- Negócios Perdidos (Lost): ${lostLeads.length}
- Valor Total do Pipeline Ativo: R$ ${activePipelineValue}
- Taxa de Conversão: ${conversionRate.toFixed(1)}%

Distribuição por Etapa:
${JSON.stringify(stageCounts, null, 2)}

Distribuição por Canal de Entrada (Origem):
${JSON.stringify(sourceCounts, null, 2)}

Amostra de Leads e seu histórico recente:
${JSON.stringify(leads.slice(0, 5).map(l => ({ name: l.name, nickname: l.nickname, value: l.value, stage: l.stage, lastContact: l.lastContactAt })), null, 2)}

Por favor, gere:
1. Um resumo executivo formatado em Markdown descrevendo a saúde do funil de vendas.
2. 3 insights estratégicos práticos (curtos, acionáveis, em formato de lista simples) para a equipe comercial acelerar as vendas hoje.

Retorne no formato JSON com as chaves:
{
  "summary": "texto em markdown aqui",
  "insights": ["insight 1", "insight 2", "insight 3"]
}`;

    let response = null;
    let usedModel = "";

    const candidateModels = ["gemini-3.6-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];

    for (const model of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            temperature: 0.7,
          },
        });
        if (response && response.text) {
          usedModel = model;
          break;
        }
      } catch (modelErr: any) {
        // Quietly break to fallback on quota limit or rate limit errors
        break;
      }
    }

    if (!response) {
      console.log("Serviço de IA indisponível ou em limite de cota. Entregando relatório analítico local com sucesso.");
      return res.json(getFallbackReport(true));
    }

    const contentText = response.text;
    if (!contentText) {
      throw new Error("Resposta do Gemini vazia");
    }

    let cleanText = contentText.trim();
    const extractJsonString = (str: string): string => {
      let s = str.trim();
      if (s.startsWith("```")) {
        s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      }
      s = s.trim();
      const firstOpen = s.indexOf("{");
      const lastClose = s.lastIndexOf("}");
      if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
        return s.slice(firstOpen, lastClose + 1);
      }
      return s;
    };

    let parsedReport: any = null;
    try {
      const jsonStr = extractJsonString(cleanText);
      parsedReport = JSON.parse(jsonStr);
    } catch (parseError) {
      console.warn("Falha ao analisar JSON da resposta direta do Gemini. Tentando limpeza secundária...", parseError);
      try {
        const firstOpen = cleanText.indexOf("{");
        const lastClose = cleanText.lastIndexOf("}");
        if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
          parsedReport = JSON.parse(cleanText.slice(firstOpen, lastClose + 1));
        } else {
          throw new Error("Nenhum objeto JSON {...} encontrado na resposta");
        }
      } catch (innerParseErr) {
        console.error("Todas as tentativas de parse de JSON falharam:", innerParseErr);
        throw new Error("Falha ao processar resposta da IA em formato JSON estruturado");
      }
    }

    res.json({
      summary: parsedReport.summary || "Não foi possível gerar o resumo.",
      generatedAt: new Date().toISOString(),
      insights: parsedReport.insights || []
    });

  } catch (error) {
    console.error("Erro ao processar relatório (usando fallback final):", error);
    try {
      const fallbackReport = `### 📊 Relatório de Desempenho do Funil (Gerado Localmente devido a erro técnico)

Atualmente, o CRM gerencia **${leads.length} leads** no total. Ocorreu um erro ao processar o relatório de IA de forma completa, mas as métricas básicas continuam disponíveis no painel principal.`;
      res.json({
        summary: fallbackReport,
        generatedAt: new Date().toISOString(),
        insights: [
          "Foque nos leads em fase de Proposta e Negociação hoje.",
          "Verifique se o seu modelo ou API Key do Gemini possui permissão para gerar respostas estruturadas JSON.",
          "Tente gerar o relatório novamente em alguns minutos."
        ]
      });
    } catch (innerErr) {
      res.status(500).json({ error: "Erro crítico ao gerar o relatório inteligente. Tente novamente mais tarde." });
    }
  }
});

// 9. AI WhatsApp Template Generator (Gemini API Integration)
app.post("/api/ai/generate-whatsapp-template", async (req, res) => {
  try {
    const objective = (req.body.objective || req.body.topic || req.body.prompt || req.body.goal || "Apresentação e Venda de Semijoias Consignadas").trim();
    const tone = req.body.tone || "amigavel";
    const category = req.body.category || req.body.aiCategory || "followup";
    const funnelModule: 'sales' | 'post_sales' | 'delinquents' = req.body.funnelModule || (req.body.targetContext === "collection" ? "delinquents" : req.body.targetContext === "post_sales" ? "post_sales" : "sales");
    const additionalDetails = req.body.additionalDetails || req.body.businessContext || "";

    const companyName = companyProfile.name || "Glow Semijoias";
    const segment = companyProfile.segment || "Semijoias Finas e Consignação";

    const getFallbackTemplate = () => {
      let fallbackName = "Modelo Inteligente WhatsApp";
      let fallbackCategory: "introduction" | "followup" | "proposal" | "other" = (category as any) || "followup";
      let fallbackMessage = "";
      let fallbackExplanation = "Modelo gerado com as melhores práticas de copywriting para conversão e engajamento no WhatsApp.";

      const lowerObj = objective.toLowerCase();

      if (funnelModule === "delinquents" || lowerObj.includes("cobrança") || lowerObj.includes("atraso") || lowerObj.includes("débito")) {
        fallbackName = "Cobrança Amigável com Desconto";
        fallbackCategory = "other";
        if (tone === "formal" || tone.toLowerCase().includes("formal")) {
          fallbackMessage = `Prezado(a) {nome}, tudo bem?\n\nConstatamos uma pendência no valor de R$ {valor} com {dias_atraso} dias de vencimento referente ao seu contrato com a ${companyName}.\n\nPara facilitar a regularização, temos condições especiais para quitação à vista ou parcelamento. Poderia nos informar o melhor horário para alinharmos?`;
        } else if (tone === "firme" || tone.toLowerCase().includes("firme")) {
          fallbackMessage = `Olá, {apelido}! Precisamos falar com urgência sobre o acerto pendente de R$ {valor} ({dias_atraso} dias em aberto). Por favor, nos envie o comprovante ou responda esta mensagem para evitarmos restrições no seu cadastro e liberarmos novos mostruários.`;
        } else {
          fallbackMessage = `Oi, {apelido}! Tudo bem com você? ✨\n\nPassando com carinho para lembrar sobre o acerto do seu mostruário no valor de R$ {valor}.\n\nSabemos que a correria do dia a dia acontece! Consegue dar uma olhada e nos avisar se prefere acertar via PIX ou se deseja parcelar? Estamos aqui para te apoiar! 💖`;
        }
      } else if (funnelModule === "post_sales" || lowerObj.includes("pós") || lowerObj.includes("boas-vindas") || lowerObj.includes("onboarding") || lowerObj.includes("csat")) {
        fallbackName = "Boas-Vindas e Acompanhamento Pós-Venda";
        fallbackCategory = "introduction";
        if (lowerObj.includes("csat") || lowerObj.includes("pesquisa") || lowerObj.includes("satisfação")) {
          fallbackName = "Pesquisa de Satisfação & Atendimento";
          fallbackCategory = "followup";
          fallbackMessage = `Oi, {apelido}! Tudo bem? ✨\n\nGostaríamos muito de saber como está sendo sua experiência revendendo as peças da ${companyName}.\n\nDe 0 a 10, como você avalia o suporte da nossa equipe e a aceitação das peças pelas suas clientes? Seu feedback é fundamental para nós! 💖`;
        } else if (lowerObj.includes("upsell") || lowerObj.includes("aumento") || lowerObj.includes("lançamento")) {
          fallbackName = "Liberação de Novo Mostruário VIP";
          fallbackCategory = "proposal";
          fallbackMessage = `Olá, {apelido}! 💎\n\nTemos uma novidade exclusiva: devido ao seu ótimo desempenho de vendas, seu limite foi ampliado e a nova coleção de semijoias já está pronta para envio.\n\nQuer que eu separe os modelos mais desejados do mês para você receber em primeira mão?`;
        } else {
          fallbackMessage = `Parabéns pela parceria, {apelido}! 🎉\n\nSeja muito bem-vinda(o) à família ${companyName}! Estamos muito felizes em ter você conosco.\n\nSeu mostruário/pedido já foi preparado com todo carinho. Qualquer dúvida que tiver durante os primeiros dias de vendas, pode me chamar direto por aqui. Como estão suas expectativas? 💎✨`;
        }
      } else if (lowerObj.includes("apresent") || lowerObj.includes("primeiro") || category === "introduction") {
        fallbackName = "Apresentação e Primeiro Contato";
        fallbackCategory = "introduction";
        fallbackMessage = `Olá, {apelido}! Tudo ótimo com você? ✨\n\nMeu nome é [Seu Nome], da ${companyName} (${segment}). Vi que você demonstrou interesse em nosso catálogo exclusivo de semijoias.\n\nTrabalhamos com condições especiais de consignação e atacado, com garantia de fábrica. Posso te enviar as fotos dos lançamentos que mais estão saindo esta semana?`;
      } else if (lowerObj.includes("proposta") || lowerObj.includes("orçamento") || category === "proposal") {
        fallbackName = "Envio e Fechamento de Proposta";
        fallbackCategory = "proposal";
        fallbackMessage = `Olá, {apelido}! Acabei de preparar a sua proposta personalizada no valor de R$ {valor}! 📋✨\n\nIncluí as melhores condições de pagamento e bônus especiais válidos para fechamento até amanhã. Consegue dar uma olhadinha agora para fecharmos o pedido?`;
      } else {
        fallbackName = "Follow-up de Alto Impacto";
        fallbackCategory = "followup";
        fallbackMessage = `Oi, {apelido}! Tudo bem por aí? Passando rapidinho para saber se você conseguiu analisar o que conversamos anteriormente sobre a ${companyName}.\n\nSurgiu alguma dúvida que eu possa te ajudar a esclarecer? Abraços! 💬`;
      }

      return {
        name: fallbackName,
        title: fallbackName,
        category: fallbackCategory,
        funnelModule: funnelModule,
        message: fallbackMessage,
        template: fallbackMessage,
        explanation: fallbackExplanation,
        suggestedVariables: ["{nome}", "{apelido}", "{empresa}", "{valor}", "{dias_atraso}"]
      };
    };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      return res.json(getFallbackTemplate());
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const systemPrompt = `Você é um Especialista em Copywriting Comercial de Alta Conversão focado em WhatsApp para empresas e CRM.
Seu objetivo é criar modelos de mensagens altamente persuasivos, humanos, envolventes e adequados ao canal WhatsApp.
Regras fundamentais:
1. Use quebras de parágrafo limpas (espaçamento duplo para facilitar a leitura no celular).
2. Utilize emojis com bom gosto e propósito visual.
3. Inclua variáveis dinâmicas quando aplicável:
   - {nome} -> Nome completo do cliente
   - {apelido} -> Apelido ou primeiro nome
   - {empresa} -> Nome da empresa
   - {valor} -> Valor monetário formatado
   - {dias_atraso} -> Quantidade de dias em atraso
   - {etapa} -> Etapa do funil
4. Crie sempre um Call To Action (CTA) claro no final estimulando uma resposta imediata.
5. Retorne estritamente um JSON estruturado.`;

    const prompt = `Crie um modelo de mensagem do WhatsApp com base nos seguintes dados:
- Objetivo / Descrição: "${objective}"
- Tom de Voz Solicitado: "${tone}" (ex: amigável, formal, persuasivo, direto, promocional, empático/firme)
- Categoria Sugerida: "${category}" (introduction, followup, proposal, other)
- Módulo do CRM: "${funnelModule}" (sales = Funil de Vendas, post_sales = Pós-Vendas & CS, delinquents = Inadimplência / Cobrança)
- Dados da Empresa: ${companyName} (${segment})
- Detalhes Adicionais: "${additionalDetails || "Nenhum"}"

Retorne estritamente em formato JSON com o seguinte schema:
{
  "name": "Título curto e descritivo do modelo (máximo 40 caracteres)",
  "category": "introduction" | "followup" | "proposal" | "other",
  "funnelModule": "sales" | "post_sales" | "delinquents",
  "message": "O texto completo da mensagem pronto para ser enviado via WhatsApp, contendo quebras de linha e placeholders como {apelido}, {valor}, etc.",
  "explanation": "Uma breve explicação em 1-2 frases sobre a estratégia persuasiva adotada nesta mensagem.",
  "suggestedVariables": ["{nome}", "{apelido}", "{valor}"]
}`;

    const candidateModels = ["gemini-3.7-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
    let responseText = "";

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            temperature: 0.75,
          },
        });
        if (response && response.text) {
          responseText = response.text;
          break;
        }
      } catch (err) {
        // continue to next model or fallback
      }
    }

    if (!responseText) {
      return res.json(getFallbackTemplate());
    }

    const extractJsonString = (str: string): string => {
      let s = str.trim();
      if (s.startsWith("```")) {
        s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      }
      s = s.trim();
      const firstOpen = s.indexOf("{");
      const lastClose = s.lastIndexOf("}");
      if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
        return s.slice(firstOpen, lastClose + 1);
      }
      return s;
    };

    try {
      const parsed = JSON.parse(extractJsonString(responseText));
      const modelTitle = parsed.name || parsed.title || "Modelo Gerado por IA";
      const modelMessage = parsed.message || parsed.template || "";
      return res.json({
        name: modelTitle,
        title: modelTitle,
        category: parsed.category || category || "followup",
        funnelModule: parsed.funnelModule || funnelModule,
        message: modelMessage,
        template: modelMessage,
        explanation: parsed.explanation || "Modelo gerado com inteligência artificial para engajamento rápido.",
        suggestedVariables: parsed.suggestedVariables || ["{nome}", "{apelido}", "{valor}"]
      });
    } catch (parseErr) {
      console.warn("Erro ao fazer parse do JSON do modelo IA, usando fallback.", parseErr);
      return res.json(getFallbackTemplate());
    }

  } catch (error) {
    console.error("Erro no gerador de modelos de IA (acionando fallback seguro):", error);
    const objective = (req.body?.objective || req.body?.topic || "").toString();
    const fallbackMessage = `Olá, {apelido}! Tudo bem com você? ✨\n\nPassando para falar sobre o andamento do seu atendimento na ${companyProfile.name || 'Glow Semijoias'}.\n\nComo posso te ajudar hoje?`;
    return res.json({
      name: `Modelo IA: ${objective.substring(0, 30) || 'Atendimento'}`,
      title: `Modelo IA: ${objective.substring(0, 30) || 'Atendimento'}`,
      category: req.body?.category || "followup",
      funnelModule: req.body?.funnelModule || "sales",
      message: fallbackMessage,
      template: fallbackMessage,
      explanation: "Modelo gerado com inteligência artificial para engajamento no WhatsApp.",
      suggestedVariables: ["{nome}", "{apelido}", "{empresa}"]
    });
  }
});

// 10. Paid Ads Management (ADS) Endpoints
app.get("/api/ads/campaigns", (req, res) => {
  res.json(adsCampaigns);
});

app.post("/api/ads/campaigns", (req, res) => {
  const {
    name, platform = "meta", status = "active", budget = 0, budgetType = "daily",
    spend = 0, impressions = 0, clicks = 0, leadsGenerated = 0, conversionsWon = 0,
    revenueGenerated = 0, utmSource, utmMedium, utmCampaign, startDate, endDate,
    targetAudience, creativeUrl, notes
  } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "O nome da campanha é obrigatório." });
  }

  const impressionsNum = Number(impressions) || 0;
  const clicksNum = Number(clicks) || 0;
  const spendNum = Number(spend) || 0;
  const leadsNum = Number(leadsGenerated) || 0;
  const convNum = Number(conversionsWon) || 0;
  const revNum = Number(revenueGenerated) || 0;

  const ctr = impressionsNum > 0 ? Number(((clicksNum / impressionsNum) * 100).toFixed(2)) : 0;
  const cpc = clicksNum > 0 ? Number((spendNum / clicksNum).toFixed(2)) : 0;
  const cpl = leadsNum > 0 ? Number((spendNum / leadsNum).toFixed(2)) : 0;
  const roas = spendNum > 0 ? Number((revNum / spendNum).toFixed(2)) : 0;
  const cpa = convNum > 0 ? Number((spendNum / convNum).toFixed(2)) : 0;

  const newCampaign: AdCampaign = {
    id: "ad-camp-" + generateId(),
    name: name.trim(),
    platform: platform as any,
    status: status as any,
    budget: Number(budget) || 0,
    budgetType: budgetType as any,
    spend: spendNum,
    impressions: impressionsNum,
    clicks: clicksNum,
    ctr,
    cpc,
    leadsGenerated: leadsNum,
    cpl,
    conversionsWon: convNum,
    revenueGenerated: revNum,
    roas,
    cpa,
    utmSource: utmSource || `${platform}_ads`,
    utmMedium: utmMedium || "cpc",
    utmCampaign: utmCampaign || name.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
    startDate: startDate || new Date().toISOString().split("T")[0],
    endDate: endDate || undefined,
    targetAudience: targetAudience || "",
    creativeUrl: creativeUrl || "",
    notes: notes || ""
  };

  adsCampaigns.unshift(newCampaign);
  writeJsonFile(ADS_CAMPAIGNS_FILE, adsCampaigns);

  // Add Notification
  const newNotif: AppNotification = {
    id: "notif-" + generateId(),
    title: "Nova Campanha de Anúncios Criada 🚀",
    message: `A campanha "${newCampaign.name}" (${newCampaign.platform.toUpperCase()}) foi cadastrada na gestão de ADS.`,
    type: "info",
    read: false,
    createdAt: new Date().toISOString()
  };
  notifications.unshift(newNotif);
  writeJsonFile(NOTIFICATIONS_FILE, notifications);

  res.status(201).json(newCampaign);
});

app.put("/api/ads/campaigns/:id", (req, res) => {
  const { id } = req.params;
  const index = adsCampaigns.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Campanha de anúncio não encontrada." });
  }

  const current = adsCampaigns[index];
  const body = req.body;

  const impressionsNum = body.impressions !== undefined ? Number(body.impressions) : current.impressions;
  const clicksNum = body.clicks !== undefined ? Number(body.clicks) : current.clicks;
  const spendNum = body.spend !== undefined ? Number(body.spend) : current.spend;
  const leadsNum = body.leadsGenerated !== undefined ? Number(body.leadsGenerated) : current.leadsGenerated;
  const convNum = body.conversionsWon !== undefined ? Number(body.conversionsWon) : current.conversionsWon;
  const revNum = body.revenueGenerated !== undefined ? Number(body.revenueGenerated) : current.revenueGenerated;

  const ctr = impressionsNum > 0 ? Number(((clicksNum / impressionsNum) * 100).toFixed(2)) : 0;
  const cpc = clicksNum > 0 ? Number((spendNum / clicksNum).toFixed(2)) : 0;
  const cpl = leadsNum > 0 ? Number((spendNum / leadsNum).toFixed(2)) : 0;
  const roas = spendNum > 0 ? Number((revNum / spendNum).toFixed(2)) : 0;
  const cpa = convNum > 0 ? Number((spendNum / convNum).toFixed(2)) : 0;

  const updated: AdCampaign = {
    ...current,
    ...body,
    spend: spendNum,
    impressions: impressionsNum,
    clicks: clicksNum,
    ctr,
    cpc,
    leadsGenerated: leadsNum,
    cpl,
    conversionsWon: convNum,
    revenueGenerated: revNum,
    roas,
    cpa
  };

  adsCampaigns[index] = updated;
  writeJsonFile(ADS_CAMPAIGNS_FILE, adsCampaigns);

  res.json(updated);
});

app.delete("/api/ads/campaigns/:id", (req, res) => {
  const { id } = req.params;
  const beforeCount = adsCampaigns.length;
  adsCampaigns = adsCampaigns.filter(c => c.id !== id);
  if (adsCampaigns.length === beforeCount) {
    return res.status(404).json({ error: "Campanha de anúncio não encontrada." });
  }
  writeJsonFile(ADS_CAMPAIGNS_FILE, adsCampaigns);
  res.json({ message: "Campanha removida com sucesso." });
});

// 11. Open Source URL Shortener Endpoints & Redirector
async function shortenUrlWithOpenSourceApi(originalUrl: string, provider: string = "isgd", customAlias?: string): Promise<{ shortUrl: string; provider: ShortenedUrl['provider']; providerName: string; shortCode: string }> {
  const cleanAlias = customAlias ? customAlias.trim().replace(/[^a-zA-Z0-9_-]/g, "") : "";
  const randomCode = Math.random().toString(36).substring(2, 8);

  // 1. is.gd API (Open Source / Public URL Shortener)
  if (provider === "isgd" || provider === "default") {
    try {
      const isGdEndpoint = `https://is.gd/create.php?format=json&url=${encodeURIComponent(originalUrl)}${cleanAlias ? `&shorturl=${encodeURIComponent(cleanAlias)}` : ""}`;
      const response = await fetch(isGdEndpoint, { headers: { "User-Agent": "CRM-Glow-Ads/1.0" } });
      const data: any = await response.json();
      if (data && data.shorturl) {
        const shortCode = data.shorturl.split("/").pop() || cleanAlias || randomCode;
        return {
          shortUrl: data.shorturl,
          provider: "isgd",
          providerName: "is.gd (Open API)",
          shortCode
        };
      }
    } catch (err) {
      console.warn("is.gd API unavailable, attempting fallback...", err);
    }
  }

  // 2. TinyURL API (Fast Public API)
  if (provider === "tinyurl" || provider === "isgd" || provider === "default") {
    try {
      const tinyEndpoint = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(originalUrl)}${cleanAlias ? `&alias=${encodeURIComponent(cleanAlias)}` : ""}`;
      const response = await fetch(tinyEndpoint);
      const text = await response.text();
      if (text && text.trim().startsWith("http")) {
        const shortUrl = text.trim();
        const shortCode = shortUrl.split("/").pop() || cleanAlias || randomCode;
        return {
          shortUrl,
          provider: "tinyurl",
          providerName: "TinyURL API",
          shortCode
        };
      }
    } catch (err) {
      console.warn("TinyURL API unavailable, attempting fallback...", err);
    }
  }

  // 3. spoo.me API (Open Source URL Shortener)
  if (provider === "spoo") {
    try {
      const formBody = new URLSearchParams();
      formBody.append("url", originalUrl);
      if (cleanAlias) formBody.append("alias", cleanAlias);

      const response = await fetch("https://spoo.me/", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formBody
      });
      const data: any = await response.json();
      if (data && data.short_url) {
        const shortCode = data.short_url.split("/").pop() || cleanAlias || randomCode;
        return {
          shortUrl: data.short_url,
          provider: "spoo",
          providerName: "spoo.me (Open Source)",
          shortCode
        };
      }
    } catch (err) {
      console.warn("spoo.me API unavailable...", err);
    }
  }

  // 4. CleanURI API
  if (provider === "cleanuri") {
    try {
      const formBody = new URLSearchParams();
      formBody.append("url", originalUrl);

      const response = await fetch("https://cleanuri.com/api/v1/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody
      });
      const data: any = await response.json();
      if (data && data.result_url) {
        const shortCode = data.result_url.split("/").pop() || cleanAlias || randomCode;
        return {
          shortUrl: data.result_url,
          provider: "cleanuri",
          providerName: "CleanURI API",
          shortCode
        };
      }
    } catch (err) {
      console.warn("CleanURI API unavailable...", err);
    }
  }

  // 5. Internal Fallback / Local CRM Shortener
  const shortCode = cleanAlias || randomCode;
  return {
    shortUrl: `/s/${shortCode}`,
    provider: "internal",
    providerName: "CRM Redirecionador Local",
    shortCode
  };
}

app.get("/api/shortened-urls", (req, res) => {
  res.json(shortenedUrls);
});

app.post("/api/shorten-url", async (req, res) => {
  try {
    const { url, provider = "isgd", customAlias, utmSource, utmCampaign, title } = req.body;

    if (!url || typeof url !== "string" || !url.trim().startsWith("http")) {
      return res.status(400).json({ error: "URL inválida. A URL deve iniciar com http:// ou https://" });
    }

    const cleanUrl = url.trim();
    const shortenResult = await shortenUrlWithOpenSourceApi(cleanUrl, provider, customAlias);

    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
    const host = req.headers["x-forwarded-host"] || req.get("host") || `localhost:${PORT}`;
    const fullShortUrl = shortenResult.shortUrl.startsWith("/") 
      ? `${protocol}://${host}${shortenResult.shortUrl}`
      : shortenResult.shortUrl;

    const newRecord: ShortenedUrl = {
      id: "short-" + generateId(),
      originalUrl: cleanUrl,
      shortUrl: fullShortUrl,
      shortCode: shortenResult.shortCode,
      provider: shortenResult.provider,
      providerName: shortenResult.providerName,
      clicks: 0,
      utmSource: utmSource || undefined,
      utmCampaign: utmCampaign || undefined,
      title: title || (utmCampaign ? `Campanha: ${utmCampaign}` : `Link Encurtado ${new Date().toLocaleDateString('pt-BR')}`),
      createdAt: new Date().toISOString()
    };

    shortenedUrls.unshift(newRecord);
    writeJsonFile(SHORTENED_URLS_FILE, shortenedUrls);

    // Notification
    const newNotif: AppNotification = {
      id: "notif-" + generateId(),
      title: "Link Encurtado Criado 🔗",
      message: `Novo link encurtado (${shortenResult.providerName}): ${fullShortUrl}`,
      type: "info",
      read: false,
      createdAt: new Date().toISOString()
    };
    notifications.unshift(newNotif);
    writeJsonFile(NOTIFICATIONS_FILE, notifications);

    res.status(201).json(newRecord);
  } catch (error: any) {
    console.error("Erro ao encurtar URL:", error);
    res.status(500).json({ error: error.message || "Erro ao processar encurtamento de link." });
  }
});

app.delete("/api/shortened-urls/:id", (req, res) => {
  const { id } = req.params;
  const beforeCount = shortenedUrls.length;
  shortenedUrls = shortenedUrls.filter(s => s.id !== id);
  if (shortenedUrls.length === beforeCount) {
    return res.status(404).json({ error: "Link encurtado não encontrado." });
  }
  writeJsonFile(SHORTENED_URLS_FILE, shortenedUrls);
  res.json({ message: "Link encurtado removido com sucesso." });
});

// Redirection route for internal short links /s/:code
app.get("/s/:code", (req, res) => {
  const { code } = req.params;
  const item = shortenedUrls.find(s => s.shortCode === code || s.shortUrl.endsWith(`/${code}`));
  if (item) {
    item.clicks = (item.clicks || 0) + 1;
    writeJsonFile(SHORTENED_URLS_FILE, shortenedUrls);
    return res.redirect(302, item.originalUrl);
  }
  res.status(404).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Redirecionando - CRM</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="font-family: system-ui, sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; background:#0f172a; color:#fff;">
        <div style="text-align:center; padding:2.5rem; background:#1e293b; border-radius:1.25rem; border:1px solid #334155; max-width:400px; box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);">
          <div style="font-size:3rem; margin-bottom:1rem;">🔗</div>
          <h2 style="margin:0 0 0.5rem 0; color:#f43f5e; font-size:1.25rem;">Link não encontrado</h2>
          <p style="color:#94a3b8; font-size:0.875rem; line-height:1.5;">O código de redirecionamento <strong>${code}</strong> não foi localizado no sistema.</p>
          <a href="/" style="display:inline-block; margin-top:1.5rem; padding:0.6rem 1.25rem; background:#10b981; color:#fff; text-decoration:none; border-radius:0.75rem; font-weight:bold; font-size:0.875rem;">Ir para o Painel</a>
        </div>
      </body>
    </html>
  `);
});

// 11. Local Database & Offline Engine Endpoints
app.get("/api/database/status", (req, res) => {
  try {
    const files = fs.existsSync(DATA_DIR) ? fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".json")) : [];
    let totalBytes = 0;
    const fileStats = files.map(fileName => {
      const p = path.join(DATA_DIR, fileName);
      const stat = fs.statSync(p);
      totalBytes += stat.size;
      return {
        name: fileName,
        sizeKb: (stat.size / 1024).toFixed(1) + " KB",
        updatedAt: stat.mtime.toISOString()
      };
    });

    res.json({
      mode: "local_offline",
      isOfflineReady: true,
      dataDirectory: DATA_DIR,
      totalSizeKb: (totalBytes / 1024).toFixed(1) + " KB",
      counts: {
        leads: leads.length,
        templates: templates.length,
        stages: stages.length,
        campaigns: adsCampaigns.length,
        shortenedUrls: shortenedUrls.length,
        notifications: notifications.length,
        customFields: customFieldsList.length,
        webhookLogs: webhookLogs.length
      },
      files: fileStats,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        uptimeSeconds: Math.floor(process.uptime())
      }
    });
  } catch (err: any) {
    console.error("Erro ao obter status do banco local:", err);
    res.status(500).json({ error: "Erro ao consultar status do banco de dados local." });
  }
});

// Download full ZIP backup of ./data folder
app.get("/api/database/backup-zip", (req, res) => {
  try {
    const zip = new AdmZip();
    const files = fs.existsSync(DATA_DIR) ? fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".json")) : [];
    
    files.forEach(fileName => {
      const fullPath = path.join(DATA_DIR, fileName);
      const content = fs.readFileSync(fullPath);
      zip.addFile(fileName, content);
    });

    // Add manifest
    const manifest = {
      exportedAt: new Date().toISOString(),
      companyName: companyProfile.name || "CRM",
      leadsCount: leads.length,
      templatesCount: templates.length,
      filesIncluded: files
    };
    zip.addFile("manifest.json", Buffer.from(JSON.stringify(manifest, null, 2), "utf8"));

    const zipBuffer = zip.toBuffer();
    const dateStr = new Date().toISOString().split("T")[0];
    const safeName = (companyProfile.name || "crm").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename=backup-crm-local-${safeName}-${dateStr}.zip`);
    res.send(zipBuffer);
  } catch (err: any) {
    console.error("Erro ao gerar backup ZIP:", err);
    res.status(500).json({ error: "Falha ao gerar o arquivo de backup ZIP." });
  }
});

// Export all CRM data as single JSON dump
app.get("/api/database/export-json", (req, res) => {
  try {
    const dump = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      company: companyProfile,
      leads,
      templates,
      stages,
      customFields: customFieldsList,
      adsCampaigns,
      shortenedUrls
    };

    const dateStr = new Date().toISOString().split("T")[0];
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=crm-dump-dados-${dateStr}.json`);
    res.send(JSON.stringify(dump, null, 2));
  } catch (err: any) {
    console.error("Erro ao exportar dump JSON:", err);
    res.status(500).json({ error: "Falha ao exportar dump dos dados." });
  }
});

// Export leads as CSV
app.get("/api/database/export-leads-csv", (req, res) => {
  try {
    const headers = [
      "ID", "Nome", "Apelido", "Telefone", "Email", "Valor", 
      "Etapa", "Modulo", "Origem", "Inadimplente", "Valor_Inadimplente", 
      "Dias_Atraso", "Status_Cobranca", "Data_Criacao"
    ];

    const rows = leads.map(l => [
      l.id,
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${(l.nickname || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      l.value || 0,
      l.stage,
      l.targetModule || (l.isInadimplente ? "delinquents" : "sales"),
      `"${(l.source || '').replace(/"/g, '""')}"`,
      l.isInadimplente ? "SIM" : "NAO",
      l.valorInadimplente || 0,
      l.diasAtraso || 0,
      l.statusCobranca || "",
      l.createdAt
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\r\n");
    const dateStr = new Date().toISOString().split("T")[0];

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=leads-export-${dateStr}.csv`);
    res.send(csvContent);
  } catch (err: any) {
    console.error("Erro ao exportar CSV de leads:", err);
    res.status(500).json({ error: "Falha ao gerar arquivo CSV." });
  }
});

// Restore database from JSON dump
app.post("/api/database/restore-json", (req, res) => {
  try {
    const data = req.body;
    if (!data || typeof data !== "object") {
      return res.status(400).json({ error: "Arquivo JSON inválido para restauração." });
    }

    let restoredLeads = 0;
    let restoredTemplates = 0;

    if (Array.isArray(data.leads)) {
      leads = data.leads;
      writeJsonFile(LEADS_FILE, leads);
      restoredLeads = leads.length;
    }
    if (Array.isArray(data.templates)) {
      templates = data.templates;
      writeJsonFile(TEMPLATES_FILE, templates);
      restoredTemplates = templates.length;
    }
    if (Array.isArray(data.stages) && data.stages.length > 0) {
      stages = data.stages;
      writeJsonFile(STAGES_FILE, stages);
    }
    if (data.company && typeof data.company === "object") {
      companyProfile = { ...companyProfile, ...data.company };
      writeJsonFile(COMPANY_FILE, companyProfile);
    }
    if (Array.isArray(data.customFields)) {
      customFieldsList = data.customFields;
      writeJsonFile(CUSTOM_FIELDS_FILE, customFieldsList);
    }
    if (Array.isArray(data.adsCampaigns)) {
      adsCampaigns = data.adsCampaigns;
      writeJsonFile(ADS_CAMPAIGNS_FILE, adsCampaigns);
    }
    if (Array.isArray(data.shortenedUrls)) {
      shortenedUrls = data.shortenedUrls;
      writeJsonFile(SHORTENED_URLS_FILE, shortenedUrls);
    }

    // Add restore notification
    notifications.unshift({
      id: "notif-" + generateId(),
      title: "Banco de Dados Local Restaurado! 💾",
      message: `Restauração concluída: ${restoredLeads} leads e ${restoredTemplates} modelos carregados com sucesso.`,
      type: "success",
      read: false,
      createdAt: new Date().toISOString()
    });
    writeJsonFile(NOTIFICATIONS_FILE, notifications);

    res.json({
      success: true,
      message: "Banco de dados restaurado com sucesso!",
      restoredCounts: {
        leads: leads.length,
        templates: templates.length,
        stages: stages.length,
        campaigns: adsCampaigns.length
      }
    });
  } catch (err: any) {
    console.error("Erro ao restaurar banco de dados:", err);
    res.status(500).json({ error: err.message || "Falha ao restaurar banco de dados." });
  }
});

// Vite Middleware integration for Fullstack flow
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
