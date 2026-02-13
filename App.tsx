import React, { useEffect, useMemo, useState } from 'react';
import {
  Role,
  Seniority,
  HubLocation,
  FormData,
  Candidate,
  LogEntry,
  LogType
} from './types';
import { HUB_DETAILS } from './constants';
import { Dropdown } from './components/Dropdown';
import { LoadingScreen } from './components/LoadingScreen';
import { CandidateCard } from './components/CandidateCard';
import { buildGoogleQuery, buildGoogleUrl, consumeOneQueryOrThrow, getQuotaLocal } from './services/searchService';
import { TerminalLog } from './components/TerminalLog';

const App: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    role: "" as any,
    seniority: "" as any,
    location: "" as any
  });

  const [isLoading, setIsLoading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const [quota, setQuota] = useState<{ limit: number; used: number; remaining: number; date: string } | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const [lastQuery, setLastQuery] = useState<string>("");
  const [importText, setImportText] = useState<string>("");

  useEffect(() => {
    const d = getQuotaLocal();
    setQuota(d.quota);
    if (d.quota.remaining === 0) setIsLocked(true);
  }, []);

  const addLog = (message: string, type: LogType) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('pt-BR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev, { timestamp: timeString, message, type }]);
  };

  const applyQuota = (q: any) => {
    if (!q) return;
    setQuota(q);
    if (q.remaining === 0) setIsLocked(true);
  };

  const handleReset = () => {
    setFormData({
      role: "" as any,
      seniority: "" as any,
      location: "" as any
    });
    setCandidates([]);
    setHasSearched(false);
    setLogs([]);
    setLastQuery("");
    setImportText("");
  };

  const handleSearch = async () => {
    if (isLocked) {
      alert("Quota diária esgotada. Volte após o reset das quotas.");
      return;
    }

    if (!formData.role || !formData.seniority || !formData.location) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    setLogs([]);

    try {
      const { quota: q } = consumeOneQueryOrThrow();
      applyQuota(q);

      const hub = HUB_DETAILS[formData.location as HubLocation];
      const query = buildGoogleQuery(formData, hub);

      setLastQuery(query);
      setHasSearched(true);
      setCandidates([]);

      addLog(`🔎 Query gerada: ${query}`, "info");
      addLog("Abrindo Google em nova aba…", "info");

      const url = buildGoogleUrl(query);
      window.open(url, "_blank", "noopener,noreferrer");

      addLog("Google aberto. Agora cole abaixo os links (linkedin.com/in) encontrados.", "success");

      if (q.remaining > 0 && q.remaining <= 5) {
        addLog(`⚠️ Atenção: restam apenas ${q.remaining} pesquisas hoje.`, "warning");
      }

      if (q.remaining === 0) {
        setIsLocked(true);
        addLog("Quota diária esgotada. O app foi travado até o próximo reset.", "error");
      }
    } catch (error: any) {
      if (error?.message === "DAILY_QUOTA_EXCEEDED" || error?.quota) {
        applyQuota(error.quota);
        setIsLocked(true);
        addLog("Quota diária esgotada. O app foi travado até o próximo reset.", "error");
        alert("Quota diária esgotada. O app ficará travado até o reset das quotas.");
        return;
      }
      console.error(error);
      addLog("Erro ao iniciar busca assistida.", "error");
      alert("Erro ao iniciar busca.");
    }
  };

  const handleLoadMore = async () => {
    alert("No MVP (SERP Assistido), 'Carregar mais' significa fazer outra busca no Google (consome quota) com variações de termos.");
  };

  const getReportData = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };

    const parts = new Intl.DateTimeFormat('pt-BR', options).formatToParts(now);
    const day = parts.find(p => p.type === 'day')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const year = parts.find(p => p.type === 'year')?.value;
    const hour = parts.find(p => p.type === 'hour')?.value;
    const minute = parts.find(p => p.type === 'minute')?.value;

    const dateString = `${day}-${month}-${year}_${hour}-${minute}`;
    const filename = `starecruiter_relatorio_${dateString}.txt`;

    let content = "########\n\n";
    content += "RELATÓRIO DE CANDIDATOS | STARECRUITER\n\n";
    content += `VAGA: ${formData.role} - ${formData.seniority} - ${formData.location}\n\n`;

    candidates.forEach((candidate, index) => {
      content += `${index + 1}. ${candidate.fullName}\n`;
      if (candidate.jobTitle) content += `${candidate.jobTitle}\n`;
      if (candidate.locationText) {
        content += `${candidate.locationText}`;
        if (typeof candidate.distanceKm === 'number') content += ` • ${candidate.distanceKm.toFixed(1)} km`;
        content += "\n";
      }
      content += "\n";

      content += `LINKEDIN: ${candidate.linkedinUrl}\n`;
      if (candidate.sourceSnippet) content += `EVIDÊNCIA: ${candidate.sourceSnippet}\n`;
      if (candidate.sourceTitle) content += `TÍTULO: ${candidate.sourceTitle}\n`;

      content += "\n----------------------------------------\n\n";
    });

    return { filename, content };
  };

  const handleDownloadReport = () => {
    try {
      const { filename, content } = getReportData();

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      addLog("Relatório gerado e baixado com sucesso.", "success");
    } catch (err) {
      console.error("Erro ao gerar relatório:", err);
      addLog("Erro ao gerar arquivo de relatório.", "error");
      alert("Não foi possível gerar o relatório.");
    }
  };

  const handleCopyReport = async () => {
    try {
      const { content } = getReportData();
      await navigator.clipboard.writeText(content);
      addLog("Relatório copiado para a área de transferência.", "success");
    } catch (err) {
      console.error("Erro ao copiar:", err);
      addLog("Erro ao copiar relatório.", "error");
    }
  };

  const handleShareReport = async () => {
    const { filename, content } = getReportData();
    const file = new File([content], filename, { type: 'text/plain' });

    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Relatório de Candidatos - StarRecruiter',
          text: `Segue em anexo a lista de candidatos para a vaga de ${formData.role}.`,
        });
        addLog("Arquivo compartilhado com sucesso.", "success");
      } else {
        const subject = encodeURIComponent(`Relatório StarRecruiter: ${formData.role}`);
        const body = encodeURIComponent(content);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
        addLog("Compartilhamento de arquivo não suportado. Abrindo email.", "info");
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      if ((error as Error).name !== 'AbortError') {
        addLog("Erro ao tentar compartilhar.", "error");
      }
    }
  };

  function slugToName(url: string) {
    try {
      const u = new URL(url);
      const parts = u.pathname.split("/").filter(Boolean);
      const idx = parts.indexOf("in");
      const slug = idx >= 0 ? parts[idx + 1] : parts[parts.length - 1];
      if (!slug) return "Nome não identificado";
      const clean = slug.replace(/[^a-zA-Z0-9\-]/g, "").replace(/-+/g, "-");
      return clean
        .split("-")
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    } catch {
      return "Nome não identificado";
    }
  }

  function normalizeLinkedIn(url: string) {
    try {
      const u = new URL(url);
      u.protocol = "https:";
      u.search = "";
      u.hash = "";
      const s = u.toString().replace(/\/$/, "");
      return s;
    } catch {
      return url;
    }
  }

  const handleImportLinks = () => {
    const text = importText || "";
    const matches = text.match(/https?:\/\/(www\.)?linkedin\.com\/in\/[^\s)]+/gi) || [];
    const urls = matches.map(normalizeLinkedIn);

    if (urls.length === 0) {
      alert("Cole pelo menos 1 link de perfil do LinkedIn (linkedin.com/in/...)");
      return;
    }

    const existing = new Set(candidates.map(c => c.linkedinUrl));
    const unique: string[] = [];
    for (const u of urls) {
      if (existing.has(u)) continue;
      unique.push(u);
      existing.add(u);
    }

    const newCandidates: Candidate[] = unique.map((u) => ({
      id: `lkd:${u}`,
      linkedinUrl: u,
      fullName: slugToName(u),
      sourceTitle: "Importado manualmente (SERP Assistido)",
      sourceSnippet: "",
    }));

    setCandidates(prev => [...prev, ...newCandidates]);
    addLog(`✅ Importados ${newCandidates.length} perfil(is) do LinkedIn.`, "success");
  };

  const showSeniority = !!formData.role;
  const showLocation = !!formData.seniority;
  const showButton = !!formData.location;

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
      <LoadingScreen isVisible={isLoading} logs={logs} />

      {quota && (
        <div className={`w-full max-w-3xl mb-4 rounded-xl border px-4 py-3 text-sm ${quota.remaining === 0
          ? 'bg-red-500/10 border-red-500/30 text-red-200'
          : quota.remaining <= 5
            ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-200'
            : 'bg-white/5 border-white/10 text-white/80'
          }`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold">
                Pesquisas restantes hoje: {quota.remaining} / {quota.limit}
              </div>
              {quota.remaining <= 5 && quota.remaining > 0 && (
                <div className="mt-1">⚠️ Atenção: restam apenas {quota.remaining} pesquisas antes de travar.</div>
              )}
              {quota.remaining === 0 && (
                <div className="mt-1">🚫 Quota diária esgotada. O app está travado até o próximo reset.</div>
              )}
            </div>
            <div className="text-xs text-white/60">Dia: {quota.date}</div>
          </div>
        </div>
      )}

      {isLocked && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-red-500/30 bg-black p-6 text-center">
            <h2 className="text-xl font-bold text-red-200">Quota diária esgotada</h2>
            <p className="text-white/80 mt-3">
              Você atingiu o limite de pesquisas do dia. O Starecruiter será liberado automaticamente quando as quotas reiniciarem.
            </p>
            <p className="text-white/50 mt-2 text-sm">
              (Dica: ao virar o dia, basta recarregar a página.)
            </p>
          </div>
        </div>
      )}

      <img
        src="https://i.ibb.co/xqd9S5pL/image.png"
        alt="StarMKT"
        className="w-24 h-auto mb-8 md:absolute md:top-6 md:right-6 lg:right-8 z-10"
      />

      <div className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
          Starecruiter <span className="text-red-400 font-light">| Caça-talentos</span>
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Ferramenta de busca de talentos alimentada por Inteligência Artificial para a StarMKT.
          Encontre o profissional ideal com precisão de raio e fit cultural.
        </p>
      </div>

      {!hasSearched ? (
        <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8 border border-gray-100 transition-all duration-500">
          <div className="space-y-6">
            <Dropdown
              label="Selecione a função:"
              value={formData.role}
              options={Object.values(Role)}
              onChange={(val) => setFormData({ ...formData, role: val as Role, seniority: "" as any, location: "" as any })}
            />

            <Dropdown
              label="Senioridade:"
              value={formData.seniority}
              options={Object.values(Seniority)}
              disabled={!showSeniority}
              onChange={(val) => setFormData({ ...formData, seniority: val as Seniority, location: "" as any })}
            />

            <Dropdown
              label="Sede:"
              value={formData.location}
              options={Object.values(HubLocation)}
              disabled={!showLocation}
              onChange={(val) => setFormData({ ...formData, location: val as HubLocation })}
            />

            {showButton && (
              <div className="pt-4 animate-fade-in">
                <button
                  onClick={handleSearch}
                  disabled={isLoading || isLocked}
                  className="w-full bg-black text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:bg-gray-800 transform hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900  disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ENCONTRAR TALENTO
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full animate-fade-in pb-20">
          <div className="flex justify-between items-center mb-8 border-b pb-4 border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Resultados da Busca</h2>
              <p className="text-sm text-gray-500">
                {formData.role} • {formData.seniority} • {formData.location}
              </p>
            </div>
            <button
              onClick={handleReset}
              className="text-sm font-semibold text-gray-600 hover:text-black underline decoration-gray-300 hover:decoration-black underline-offset-4 transition-all"
            >
              Nova Pesquisa
            </button>
          </div>

          {/* SERP Assisted Import Panel */}
          <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-gray-800">Modo SERP Assistido</div>
                <div className="text-xs text-gray-500 mt-1">
                  1) O Google abriu com a busca. 2) Copie os links dos perfis (linkedin.com/in). 3) Cole aqui e importe.
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => lastQuery && window.open(buildGoogleUrl(lastQuery), "_blank", "noopener,noreferrer")}
                  className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-black transition"
                >
                  Reabrir Google
                </button>
              </div>
            </div>

            {lastQuery && (
              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-700 overflow-x-auto">
                <span className="font-semibold">Query:</span> {lastQuery}
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Cole aqui os links do Google (pode colar o texto inteiro da SERP, nós extraímos os linkedin.com/in automaticamente)…"
                className="md:col-span-4 min-h-[120px] w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
              />
              <button
                onClick={handleImportLinks}
                className="md:col-span-1 h-[120px] rounded-xl bg-red-500 text-white font-extrabold hover:bg-red-600 transition"
              >
                IMPORTAR
              </button>
            </div>

            <div className="mt-3 text-xs text-gray-500">
              Dica: você pode colar vários links de uma vez. O app remove duplicados automaticamente.
            </div>
          </div>

          {candidates.length === 0 ? (
            <div className="text-center py-14 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="text-gray-400 mb-4 text-6xl">📝</div>
              <h3 className="text-lg font-bold text-gray-700">Aguardando importação</h3>
              <p className="text-gray-500 max-w-md mx-auto mt-2">
                Cole os links dos perfis do LinkedIn no painel acima e clique em <b>IMPORTAR</b>.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 justify-items-center mb-12">
                {candidates.map((candidate) => (
                  <CandidateCard key={candidate.id} candidate={candidate} />
                ))}

                <button
                  onClick={handleLoadMore}
                  className="bg-white border-2 border-dashed border-gray-300 hover:border-black rounded-2xl w-full max-w-sm h-full min-h-[500px] flex flex-col items-center justify-center space-y-4 group transition-all duration-300 hover:shadow-lg"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-black transition-colors duration-300">
                    <svg className="w-8 h-8 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                  </div>
                  <span className="text-gray-500 font-semibold group-hover:text-black uppercase tracking-wide">
                    Carregar Mais 5
                  </span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row justify-center w-full mt-8 animate-fade-in-up gap-4">
                <button
                  onClick={handleDownloadReport}
                  className="flex-1 max-w-[200px] flex items-center justify-center space-x-2 bg-gray-900 text-white font-bold py-3 px-6 rounded-full shadow-xl hover:bg-black hover:scale-105 transition-all duration-300"
                >
                  <span>TXT</span>
                </button>

                <button
                  onClick={handleCopyReport}
                  className="flex-1 max-w-[200px] flex items-center justify-center space-x-2 bg-blue-600 text-white font-bold py-3 px-6 rounded-full shadow-xl hover:bg-blue-700 hover:scale-105 transition-all duration-300"
                >
                  <span>COPIAR</span>
                </button>

                <button
                  onClick={handleShareReport}
                  className="flex-1 max-w-[200px] flex items-center justify-center space-x-2 bg-white text-gray-800 border-2 border-gray-200 font-bold py-3 px-6 rounded-full shadow-lg hover:bg-gray-50 hover:border-gray-300 hover:scale-105 transition-all duration-300"
                >
                  <span>SHARE</span>
                </button>
              </div>
            </>
          )}

          {logs.length > 0 && (
            <div className="mt-16 border-t border-gray-200 pt-8 w-full max-w-4xl mx-auto">
              <h4 className="text-gray-500 uppercase tracking-widest text-xs font-bold mb-4 text-center">
                Log de Processamento do Sistema
              </h4>
              <TerminalLog logs={logs} />
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate3d(0, 20px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
        .animate-fade-in { animation: fadeInUp 0.6s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default App;
