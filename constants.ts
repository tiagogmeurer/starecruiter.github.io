import { HubDetail, HubLocation, Role } from "./types";

export const ROLE_DEFINITIONS: Record<Role, string> = {
  [Role.HC]: "Head of Creative / Human Capital",
  [Role.DA]: "Diretor de Arte (Art Director)",
  [Role.RED]: "Redator (Copywriter)",
  [Role.ATE]: "Atendimento (Account Manager)",
  [Role.PLAN]: "Planejamento (Strategic Planner)",
  [Role.MID]: "Mídia (Media Buyer/Planner)",
  [Role.DIAG]: "Diagramador (Layout Artist)",
  [Role.REV]: "Revisor (Proofreader)"
};

export const HUB_DETAILS: Record<HubLocation, HubDetail> = {
  [HubLocation.MATRIZ_SP]: {
    name: HubLocation.MATRIZ_SP,
    address: "Av. Ver. Abel Ferreira, 1800 - Vila Reg. Feijó | Jd. Anália Franco",
    zip: "03340-000"
  },
  [HubLocation.ARICANDUVA_SP]: {
    name: HubLocation.ARICANDUVA_SP,
    address: "Av. Aricanduva, 5555 | Jardim Marília",
    zip: "03527-900"
  },
  [HubLocation.PENHA_SP]: {
    name: HubLocation.PENHA_SP,
    address: "Av. Condessa Elizabeth de Robiano, 5500 | Jardim America da Penha",
    zip: "03707-015"
  },
  [HubLocation.JACAREPAGUA_RJ]: {
    name: HubLocation.JACAREPAGUA_RJ,
    address: "Av. Ayrton Senna, 6000 | Jacarepaguá",
    zip: "22775-005"
  },
  [HubLocation.BRASILIA]: {
    name: HubLocation.BRASILIA,
    address: "QS 9, 100 · Lote 4 Área | (Pistão Sul – EPNB)",
    zip: "71976-370"
  },
  [HubLocation.SALVADOR]: {
    name: HubLocation.SALVADOR,
    address: "Av. Luís Viana Filho, 3056 – Loja | Trecho A Imbuí",
    zip: "41720-200"
  },
  [HubLocation.FLORIDA]: {
    name: HubLocation.FLORIDA,
    address: "759 SW Federal Highway | Suite 304, Stuart",
    zip: "Florida 34994"
  }
};

export const LOADING_MESSAGES = [
  "Iniciando protocolos de busca...",
  "Varrendo mecanismos de pesquisa...",
  "Vasculhando o Linkedin...",
  "Dando uma olhada no Behance...",
  "Analisando geolocalização (Raio 100km)...",
  "Verificando compatibilidade de senioridade...",
  "Capturando detalhes de contato...",
  "Capturando pegada digital...",
  "Interpretando pegada digitral...",
  "Calculando fit cultural...",
  "Compilando os 5 melhores perfis..."
];