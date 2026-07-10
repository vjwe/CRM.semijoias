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
}

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
  isInadimplente?: boolean;
  valorInadimplente?: number;
  diasAtraso?: number;
  statusCobranca?: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  message: string;
  category: 'introduction' | 'followup' | 'proposal' | 'other';
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
