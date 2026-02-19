export enum Role {
  HC = "Head de Criação",
  DA = "Diretor de Arte",
  CC = "Coordenador de Comunicação",
  RED = "Redator",
  ATE = "Atendimento",
  PLAN = "Planejamento",
  MID = "Mídia",
  DIAG = "Diagramador",
  REV = "Revisor"
}

export enum Seniority {
  JUNIOR = "Júnior",
  PLENO = "Pleno",
  SENIOR = "Sênior",
  TODAS = "Todas"
}

export enum HubLocation {
  MATRIZ_SP = "Matriz / SP",
  ARICANDUVA_SP = "Hub Aricanduva / SP",
  PENHA_SP = "Hub Penha / SP",
  JACAREPAGUA_RJ = "Hub Jacarepaguá / RJ",
  BRASILIA = "Hub Brasília",
  SALVADOR = "Hub Salvador",
  FLORIDA = "Hub Florida"
}

export interface HubDetail {
  name: HubLocation;
  address: string;
  zip: string;
}

export interface FormData {
  role: Role | "";
  seniority: Seniority | "";
  location: HubLocation | "";
}

export interface Candidate {
  /** ID estável; por padrão usamos a URL do LinkedIn normalizada */
  id: string;
  fullName: string;
  jobTitle?: string;
  locationText?: string;
  distanceKm?: number;
  linkedinUrl: string;
  /** Evidências brutas retornadas pelo buscador */
  sourceTitle?: string;
  sourceSnippet?: string;
}

export type LogType = 'info' | 'success' | 'warning' | 'error';

export interface LogEntry {
  timestamp: string;
  message: string;
  type: LogType;
}