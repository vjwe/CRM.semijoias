import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { Lead, MessageTemplate, AppNotification, TimelineItem, LeadStage, PipelineStage } from "./src/types";

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Paths for JSON storage
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const LEADS_FILE = path.join(DATA_DIR, "leads.json");
const TEMPLATES_FILE = path.join(DATA_DIR, "templates.json");
const NOTIFICATIONS_FILE = path.join(DATA_DIR, "notifications.json");
const STAGES_FILE = path.join(DATA_DIR, "stages.json");

const DEFAULT_STAGES: PipelineStage[] = [
  { id: "prospect", label: "Interesse (Catálogo)", color: "border-slate-300", bg: "bg-slate-100", text: "text-slate-800", order: 1, funnelType: "conventional" },
  { id: "contacted", label: "Apresentação / Atendimento", color: "border-sky-300", bg: "bg-sky-50", text: "text-sky-800", order: 2, funnelType: "conventional" },
  { id: "qualified", label: "Escolha de Mostruário", color: "border-indigo-300", bg: "bg-indigo-50", text: "text-indigo-800", order: 3, funnelType: "conventional" },
  { id: "proposal", label: "Orçamento e Condições", color: "border-amber-300", bg: "bg-amber-50", text: "text-amber-800", order: 4, funnelType: "conventional" },
  { id: "negotiation", label: "Envio das Semijoias", color: "border-purple-300", bg: "bg-purple-50", text: "text-purple-800", order: 5, funnelType: "conventional" },
  { id: "won", label: "Venda Concluída 🎉", color: "border-emerald-300", bg: "bg-emerald-50", text: "text-emerald-800", order: 6, funnelType: "conventional" },
  { id: "lost", label: "Sem Interesse (Perda)", color: "border-rose-300", bg: "bg-rose-50", text: "text-rose-800", order: 7, funnelType: "conventional" },
  { id: "onboarding", label: "Onboarding (Boas-Vindas)", color: "border-sky-300", bg: "bg-sky-50", text: "text-sky-800", order: 8, funnelType: "inverted" },
  { id: "activation", label: "Ativação / Uso", color: "border-indigo-300", bg: "bg-indigo-50", text: "text-indigo-800", order: 9, funnelType: "inverted" },
  { id: "retention", label: "Retenção / Sucesso", color: "border-emerald-300", bg: "bg-emerald-50", text: "text-emerald-800", order: 10, funnelType: "inverted" },
  { id: "expansion", label: "Expansão (Upsell)", color: "border-amber-300", bg: "bg-amber-50", text: "text-amber-800", order: 11, funnelType: "inverted" },
  { id: "referral", label: "Indicação (Advogado)", color: "border-rose-300", bg: "bg-rose-50", text: "text-rose-800", order: 12, funnelType: "inverted" }
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
    name: "Boas-vindas + Catálogo Semijoias",
    category: "introduction",
    message: "Olá, {nome}! Tudo bem? Sou da Glow Semijoias. ✨ Vi que você se interessou pelo nosso catálogo de peças folheadas em Ouro 18k e Ródio Branco. Estarei te enviando as fotos e tabela de atacado e consignado. Qual tipo de parceria você busca hoje: revender com maleta ou comprar atacado?"
  },
  {
    id: "temp-2",
    name: "Follow-up de Seleção de Peças",
    category: "followup",
    message: "Olá, {nome}. Tudo bem? Estou passando para saber se você conseguiu dar uma olhada na nossa nova coleção de semijoias. Se quiser, posso montar uma seleção personalizada de brincos, colares e anéis mais vendidos na sua região para facilitar o seu início!"
  },
  {
    id: "temp-3",
    name: "Mostruário Liberado! (Ganho)",
    category: "proposal",
    message: "Parabéns, {nome}! 🎉 Seu mostruário de semijoias Glow já foi liberado e está pronto. Estamos finalizando a embalagem e o termo de consignado. Nosso objetivo é te ajudar a lucrar muito! Em breve te envio o rastreamento das peças."
  },
  {
    id: "temp-4",
    name: "Cobrança 1: Lembrete Amigável 🌸",
    category: "other",
    message: "Olá, {nome}! Tudo bem? Passando para lembrar que o acerto do seu mostruário de semijoias no valor de R$ {valor} venceu recentemente. Caso já tenha realizado o pagamento via Pix, favor desconsiderar. Se precisar de alguma facilidade ou da chave Pix, me avise por aqui!"
  },
  {
    id: "temp-5",
    name: "Cobrança 2: Notificação de Atraso Ativa ⚠️",
    category: "other",
    message: "Olá, {nome}. Tudo bem? Estamos tentando contato sobre o saldo pendente do seu acerto de semijoias no valor de R$ {valor}. Consta em nosso sistema um atraso de {dias_atraso} dias. Precisamos regularizar essa pendência para liberação do seu próximo mostruário. Como podemos facilitar para você hoje?"
  },
  {
    id: "temp-6",
    name: "Cobrança 3: Proposta de Acordo / Parcelamento 🤝",
    category: "other",
    message: "Olá, {nome}! Entendemos que imprevistos acontecem. Queremos muito te ajudar a continuar revendendo nossas semijoias e limpando suas pendências de R$ {valor}. Conseguimos parcelar este saldo em até 3x sem juros ou dar um desconto especial para quitação à vista hoje. Vamos fechar esse acordo?"
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
  return l;
});
let templates: MessageTemplate[] = readJsonFile(TEMPLATES_FILE, DEFAULT_TEMPLATES);
let notifications: AppNotification[] = readJsonFile(NOTIFICATIONS_FILE, DEFAULT_NOTIFICATIONS);
let stages: PipelineStage[] = readJsonFile(STAGES_FILE, DEFAULT_STAGES);

// Static CRM API Key (regenerated via endpoint, defaults to crm-api-key-demo-123)
let CRM_API_KEY = "crm_sec_live_98a72b643";

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
  const { name, nickname, company, email, phone, value, stage, source, isInadimplente, valorInadimplente, diasAtraso, statusCobranca } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: "Campos obrigatórios: nome, telefone" });
  }

  const newLead: Lead = {
    id: "lead-" + generateId(),
    name,
    nickname: nickname || company || "",
    email: email || "",
    phone,
    value: Number(value) || 0,
    stage: (stage as LeadStage) || "prospect",
    source: source || "Manual",
    isInadimplente: !!isInadimplente,
    valorInadimplente: Number(valorInadimplente) || 0,
    diasAtraso: Number(diasAtraso) || 0,
    statusCobranca: statusCobranca || "friendly",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: [
      { id: "note-" + generateId(), type: "created", content: `Lead criado manualmente (${source || "Manual"})`, timestamp: new Date().toISOString() }
    ]
  };

  leads.unshift(newLead);
  writeJsonFile(LEADS_FILE, leads);

  // Add Notification
  const newNotif: AppNotification = {
    id: "notif-" + generateId(),
    title: "Novo lead criado",
    message: `O lead ${newLead.name} (${newLead.nickname ? "chamado de " + newLead.nickname : "Sem apelido"}) foi adicionado à etapa ${newLead.stage}.`,
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
  const { name, nickname, company, email, phone, value, stage, notes, addNote, markWhatsAppContact, isInadimplente, valorInadimplente, diasAtraso, statusCobranca } = req.body;

  let stageChanged = false;
  let oldStage = currentLead.stage;

  if (stage && stage !== currentLead.stage) {
    stageChanged = true;
    currentLead.stage = stage as LeadStage;
  }

  if (name !== undefined) currentLead.name = name;
  if (nickname !== undefined) currentLead.nickname = nickname;
  if (company !== undefined) currentLead.nickname = company;
  if (email !== undefined) currentLead.email = email;
  if (phone !== undefined) currentLead.phone = phone;
  if (value !== undefined) currentLead.value = Number(value) || 0;

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

// 5. External API Webhook endpoint (receives leads from Facebook Forms, Typeform, RD Station, ActiveCampaign, etc.)
app.post("/api/leads/webhook", (req, res) => {
  const apiKeyHeader = req.headers["x-crm-api-key"] || req.query.api_key;

  if (!apiKeyHeader || apiKeyHeader !== CRM_API_KEY) {
    return res.status(401).json({ error: "Chave de API inválida ou ausente. Forneça o cabeçalho X-CRM-API-Key" });
  }

  const { name, nickname, company, email, phone, value, source, notes } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Campos 'name' e 'email' são obrigatórios no payload do webhook" });
  }

  const nowStr = new Date().toISOString();
  const newLead: Lead = {
    id: "lead-" + generateId(),
    name,
    nickname: nickname || company || "",
    email,
    phone: phone || "",
    value: Number(value) || 0,
    stage: "prospect",
    source: source || "Integração API Webhook",
    createdAt: nowStr,
    updatedAt: nowStr,
    notes: [
      { id: "note-" + generateId(), type: "created", content: `Lead capturado automaticamente via Webhook API (${source || "Externo"})`, timestamp: nowStr }
    ]
  };

  if (notes) {
    newLead.notes.push({
      id: "note-" + generateId(),
      type: "note",
      content: `Mensagem original do Lead: ${notes}`,
      timestamp: nowStr
    });
  }

  leads.unshift(newLead);
  writeJsonFile(LEADS_FILE, leads);

  // Add Notification
  notifications.unshift({
    id: "notif-" + generateId(),
    title: "Lead Capturado via API Webhook 🔌",
    message: `Novo lead de ${newLead.name} (${newLead.nickname ? "chamado de " + newLead.nickname : "Sem apelido"}) recebido de ${newLead.source}.`,
    type: "info",
    read: false,
    createdAt: nowStr
  });
  writeJsonFile(NOTIFICATIONS_FILE, notifications);

  res.status(201).json({
    success: true,
    message: "Lead capturado com sucesso via Webhook",
    leadId: newLead.id
  });
});

// 6. Templates CRUD
app.get("/api/templates", (req, res) => {
  res.json(templates);
});

app.post("/api/templates", (req, res) => {
  const { id, name, message, category } = req.body;

  if (!name || !message || !category) {
    return res.status(400).json({ error: "Campos obrigatórios: name, message, category" });
  }

  if (id) {
    const idx = templates.findIndex((t) => t.id === id);
    if (idx !== -1) {
      templates[idx] = { id, name, message, category };
      writeJsonFile(TEMPLATES_FILE, templates);
      return res.json(templates[idx]);
    }
  }

  const newTemp: MessageTemplate = {
    id: "temp-" + generateId(),
    name,
    message,
    category
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
  const { label, color, bg, text, funnelType } = req.body;
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
    funnelType: funnelType || "conventional"
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

  const { label, color, bg, text, order, funnelType } = req.body;

  if (label !== undefined) stages[idx].label = label;
  if (color !== undefined) stages[idx].color = color;
  if (bg !== undefined) stages[idx].bg = bg;
  if (text !== undefined) stages[idx].text = text;
  if (order !== undefined) stages[idx].order = Number(order);
  if (funnelType !== undefined) stages[idx].funnelType = funnelType;

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
    let retries = 3;
    let delayMs = 1500;
    let lastError = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            temperature: 0.7,
          },
        });
        break; // Success! Exit loop
      } catch (err: any) {
        lastError = err;
        console.warn(`Tentativa ${attempt} de chamada ao Gemini falhou:`, err.message || err);
        if (attempt < retries) {
          // Wait before retrying (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, attempt - 1)));
        }
      }
    }

    if (!response) {
      console.error("Todas as tentativas com Gemini falharam. Usando fallback local. Erro final:", lastError);
      return res.json(getFallbackReport(true));
    }

    const contentText = response.text;
    if (!contentText) {
      throw new Error("Resposta do Gemini vazia");
    }

    const parsedReport = JSON.parse(contentText.trim());
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
