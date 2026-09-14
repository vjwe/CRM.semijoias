export interface TimelineItem {
  id: string;
  type: 'note' | 'whatsapp_sent' | 'stage_changed' | 'created' | 'system';
  content: string;
  timestamp: string;
}

export type LeadStage = string;

export interface PipelineStage {
  id: string;
  label: string;
  color: string;
  bg: string;
  text: string;
  order: number;
  funnelType?: 'conventional' | 'inverted';
  layer?: 'topo' | 'meio' | 'fundo';
}

export interface CustomFieldDefinition {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'boolean';
  options?: string[];
  required?: boolean;
  showInTable?: boolean;
  order: number;
}

export type TargetModule = 'sales' | 'post_sales' | 'delinquents' | 'inadimplencia';

export interface Lead {
  id: string;
  name: string;
  nickname?: string;
  email?: string;
  phone: string;
  value: number;
  stage: LeadStage;
  source: string;
  createdAt: string;
  updatedAt: string;
  notes: TimelineItem[];
  lastContactAt?: string;
  targetModule?: TargetModule;
  isInadimplente?: boolean;
  valorInadimplente?: number;
  diasAtraso?: number;
  statusCobranca?: string;
  promessaPagamentoData?: string;
  promessaPagamentoValor?: number;
  postSalesStage?: string;
  postSalesHealth?: 'healthy' | 'warning' | 'risk';
  postSalesNps?: number;
  postSalesNotes?: string;
  postSalesLastContact?: string;
  customFields?: Record<string, any>;
}

export interface CompanyProfile {
  name: string;
  subtitle: string;
  segment: string;
  logoUrl?: string;
  document?: string;
  phone?: string;
  email?: string;
  address?: string;
  currency: string;
  defaultLeadValue?: number;
}

export interface MessageTemplate {
  id: string;
  name: string;
  message: string;
  category: 'introduction' | 'followup' | 'proposal' | 'other';
  funnelModule?: 'sales' | 'post_sales' | 'delinquents';
  stageId?: string;
  layer?: 'topo' | 'meio' | 'fundo' | 'all';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  read: boolean;
  createdAt: string;
}

export interface SalesReport {
  summary: string;
  generatedAt: string;
  insights: string[];
}

export interface AuthUser {
  username: string;
  authenticated: boolean;
}

export interface WebhookLog {
  id: string;
  timestamp: string;
  ip: string;
  apiKeyReceived: string;
  status: number;
  success: boolean;
  source: string;
  leadName?: string;
  message: string;
  payload: Record<string, any>;
  headers?: Record<string, any>;
}

export interface AdCampaign {
  id: string;
  name: string;
  platform: 'meta' | 'google' | 'tiktok' | 'other';
  status: 'active' | 'paused' | 'completed';
  budget: number;
  budgetType: 'daily' | 'total';
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  leadsGenerated: number;
  cpl: number;
  conversionsWon: number;
  revenueGenerated: number;
  roas: number;
  cpa: number;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  startDate: string;
  endDate?: string;
  targetAudience?: string;
  creativeUrl?: string;
  notes?: string;
}

export interface ShortenedUrl {
  id: string;
  originalUrl: string;
  shortUrl: string;
  shortCode: string;
  provider: 'isgd' | 'tinyurl' | 'spoo' | 'cleanuri' | 'internal';
  providerName: string;
  clicks: number;
  utmSource?: string;
  utmCampaign?: string;
  title?: string;
  createdAt: string;
}

