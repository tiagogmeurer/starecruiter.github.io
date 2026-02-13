import { FormData, HubDetail, Role } from "../types";
import { ROLE_DEFINITIONS } from "../constants";

/**
 * MODO SERP ASSISTIDO (SEM API)
 * - Gera query Google (site:linkedin.com/in) com filtros de cargo + senioridade + sede
 * - Abre Google em nova aba
 * - Quota diária controlada via localStorage (cliente-side)
 */

// ====== QUOTA (localStorage) ======
const STORAGE_KEY = "starecruiter_quota_v1";
const DEFAULT_DAILY_LIMIT = 100;

type QuotaState = {
  date: string; // YYYY-MM-DD (America/Sao_Paulo)
  limit: number;
  used: number;
};

function todayKeySP(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const y = parts.find(p => p.type === "year")?.value ?? "1970";
  const m = parts.find(p => p.type === "month")?.value ?? "01";
  const d = parts.find(p => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

function loadQuotaState(): QuotaState {
  const today = todayKeySP();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: today, limit: DEFAULT_DAILY_LIMIT, used: 0 };

    const parsed = JSON.parse(raw) as Partial<QuotaState>;
    if (!parsed?.date || parsed.date !== today) {
      return { date: today, limit: DEFAULT_DAILY_LIMIT, used: 0 };
    }
    const limit = typeof parsed.limit === "number" ? parsed.limit : DEFAULT_DAILY_LIMIT;
    const used = typeof parsed.used === "number" ? parsed.used : 0;
    return { date: today, limit, used };
  } catch {
    return { date: today, limit: DEFAULT_DAILY_LIMIT, used: 0 };
  }
}

function saveQuotaState(state: QuotaState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getQuotaLocal() {
  const st = loadQuotaState();
  const remaining = Math.max(0, st.limit - st.used);
  return { quota: { date: st.date, limit: st.limit, used: st.used, remaining } };
}

export function consumeOneQueryOrThrow() {
  const st = loadQuotaState();
  const remaining = Math.max(0, st.limit - st.used);

  if (remaining <= 0) {
    const err: any = new Error("DAILY_QUOTA_EXCEEDED");
    err.quota = { date: st.date, limit: st.limit, used: st.used, remaining: 0 };
    throw err;
  }

  const next = { ...st, used: st.used + 1 };
  saveQuotaState(next);
  return { quota: { date: next.date, limit: next.limit, used: next.used, remaining: next.limit - next.used } };
}

// ====== GOOGLE QUERY ======

function qOr(list: string[]) {
  const safe = list.map(s => `"${s}"`).join(" OR ");
  return `(${safe})`;
}

function extractNeighborhoods(address: string): string[] {
  // Heurística simples: pega pedaços após "-" e após "|" (bairros), remove ruídos
  const parts = address
    .split(/[-|·]/g)
    .map(s => s.trim())
    .filter(Boolean);

  // remove coisas muito genéricas
  const blacklist = new Set(["loja", "suite", "trecho a", "lote", "área", "area", "pistão sul", "epnb"]);
  const out: string[] = [];
  for (const p of parts) {
    const low = p.toLowerCase();
    if (blacklist.has(low)) continue;
    // evita termos só números
    if (/^\d+$/.test(p)) continue;
    // remove prefixos comuns
    out.push(p.replace(/^av\.?\s+/i, "").replace(/^qs\s+/i, "QS ").trim());
  }
  return Array.from(new Set(out)).slice(0, 6);
}

function locationTermsForHub(hub: HubDetail): string[] {
  const addr = hub.address || "";
  const zip = hub.zip || "";
  const neighborhoods = extractNeighborhoods(addr);

  // Detecta UF/cidade por nome (HubLocation)
  const name = String(hub.name || "");

  // SP hubs
  if (name.includes("/ SP")) {
    return [
      "São Paulo, São Paulo, Brasil",
      "São Paulo e Região",
      "São Paulo Area, Brazil",
      "Greater São Paulo Area",
      ...neighborhoods,
      // alguns termos úteis pra SP
      "Zona Leste",
      "SP"
    ];
  }

  // RJ
  if (name.includes("/ RJ")) {
    return [
      "Rio de Janeiro, Rio de Janeiro, Brasil",
      "Rio de Janeiro e Região",
      "Rio de Janeiro Area, Brazil",
      "Greater Rio de Janeiro Area",
      ...neighborhoods,
      "RJ"
    ];
  }

  // Brasília
  if (name.toLowerCase().includes("bras")) {
    return [
      "Brasília, Distrito Federal, Brasil",
      "Brasília e Região",
      "Brasilia, Federal District, Brazil",
      "Greater Brasilia Area",
      ...neighborhoods,
      "DF"
    ];
  }

  // Salvador
  if (name.toLowerCase().includes("salvador")) {
    return [
      "Salvador, Bahia, Brasil",
      "Salvador e Região",
      "Salvador Area, Brazil",
      "Greater Salvador Area",
      ...neighborhoods,
      "BA"
    ];
  }

  // Florida
  if (name.toLowerCase().includes("florida")) {
    return [
      "Stuart, Florida",
      "Stuart, FL",
      "Florida, United States",
      ...neighborhoods,
      zip
    ].filter(Boolean);
  }

  // fallback
  return [...neighborhoods, zip].filter(Boolean);
}

function roleTerms(role: Role): string[] {
  // Palavras-chave para maximizar recall no Google
  switch (role) {
    case Role.HC:
      return ["Head of Creative", "Human Capital", "People", "RH", "Talent", "Recruitment"];
    case Role.DA:
      return ["Diretor de Arte", "Art Director", "Direção de Arte", "Diretor(a) de Arte"];
    case Role.RED:
      return ["Redator", "Copywriter", "Redação", "Conteúdo", "Content Writer"];
    case Role.ATE:
      return ["Atendimento", "Account Manager", "Customer Success", "Relacionamento", "Key Account"];
    case Role.PLAN:
      return ["Planejamento", "Strategic Planner", "Planner", "Estrategista"];
    case Role.MID:
      return ["Mídia", "Media Buyer", "Media Planner", "Tráfego", "Performance"];
    case Role.DIAG:
      return ["Diagramador", "Layout", "Layout Artist", "Designer Gráfico", "Design Gráfico"];
    case Role.REV:
      return ["Revisor", "Proofreader", "Revisão", "Copydesk"];
    default:
      // fallback: usa definição
      return [ROLE_DEFINITIONS[role] || String(role)];
  }
}

function seniorityTerms(s: string): string[] {
  const clean = String(s);
  if (clean.toLowerCase().includes("jún")) return ["Júnior", "Junior", "Jr"];
  if (clean.toLowerCase().includes("pl")) return ["Pleno", "Mid-level", "Mid Level", "Mid"];
  if (clean.toLowerCase().includes("sên")) return ["Sênior", "Senior", "Sr"];
  return [clean];
}

export function buildGoogleQuery(formData: FormData, hub: HubDetail): string {
  const roleKey = formData.role as unknown as Role;
  const roleLabel = ROLE_DEFINITIONS[roleKey] || String(formData.role || "");
  const roleHints = roleTerms(roleKey);
  // inclui a definição por segurança (ex.: "Diagramador (Layout Artist)")
  if (roleLabel && !roleHints.includes(roleLabel)) roleHints.unshift(roleLabel);

  const seniorityHints = seniorityTerms(String(formData.seniority || ""));
  const locHints = locationTermsForHub(hub);

  const rolePart = qOr(roleHints);
  const seniorityPart = qOr(seniorityHints);
  const locPart = qOr(locHints);

  // bloqueios básicos para reduzir vagas/anúncios
  const negatives = "-jobs -vagas -vaga -recrutamento -hiring -careers -job";

  return `site:linkedin.com/in ${rolePart} ${seniorityPart} ${locPart} ${negatives}`;
}

export function buildGoogleUrl(query: string): string {
  const q = encodeURIComponent(query);
  return `https://www.google.com/search?q=${q}`;
}
