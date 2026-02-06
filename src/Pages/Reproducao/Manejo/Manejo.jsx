import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useFazenda } from "../../../context/FazendaContext";
import { toast } from "react-toastify";

import Inseminacao from "./Inseminacao";
import Diagnostico from "./Diagnostico";
import AplicarProtocolo from "./AplicarProtocolo";
import OcorrenciaClinica from "./OcorrenciaClinica";

/* =========================================================
   DESIGN SYSTEM - PROFISSIONAL/MÉDICO
   ========================================================= */
const theme = {
  colors: {
    // Paleta monocromática Slate + um tom de Indigo sóbrio
    slate: { 50: "#f8fafc", 100: "#f1f5f9", 200: "#e2e8f0", 300: "#cbd5e1", 400: "#94a3b8", 500: "#64748b", 600: "#475569", 700: "#334155", 800: "#1e293b", 900: "#0f172a", 950: "#020617" },
    accent: { 50: "#eef2ff", 100: "#e0e7ff", 500: "#6366f1", 600: "#4f46e5", 700: "#4338ca", 900: "#312e81" },
    success: "#059669", warning: "#d97706", danger: "#dc2626",
  },
  // Bordas mais quadradas (profissional) vs arredondadas (infantil)
  radius: { sm: "4px", md: "6px", lg: "8px" },
};

// Ícones com stroke mais fino (1.5px) e menor tamanho - mais elegantes
const Icons = {
  close: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
  stethoscope: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>,
  syringe: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m10 17-5 5"/><path d="m14 14-2 2"/></svg>,
  calendar: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>,
  alert: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>,
  arrowLeft: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  chevronRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
};

/* =========================================================
   HELPERS
   ========================================================= */
function toISODate(dt) { return dt.toISOString().split('T')[0]; }
function brToISO(br) {
  const m = String(br || "").trim().match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return null;
  const dt = new Date(+m[3], +m[2] - 1, +m[1]);
  return Number.isFinite(dt.getTime()) ? toISODate(dt) : null;
}


function normalizePayloadDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return brToISO(raw);
  return null;
}

function normalizePayloadTime(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (/^\d{2}:\d{2}:\d{2}$/.test(raw)) return raw;
  if (/^\d{2}:\d{2}$/.test(raw)) return `${raw}:00`;
  return null;
}

const RAZOES_VINCULO_AUTOMATICO = new Set(["IATF", "RESSINC"]);
const normalizeTexto = (valor) => {
  if (!valor) return "";
  return valor
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

function parseISODate(value) {
  if (!value || typeof value !== "string") return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  return Number.isFinite(dt.getTime()) ? dt : null;
}

function diffDays(a, b) {
  if (!a || !b) return null;
  const toUtcDay = (value) => {
    if (!value) return null;
    if (value instanceof Date) {
      return Date.UTC(value.getFullYear(), value.getMonth(), value.getDate());
    }
    if (typeof value === "string") {
      const ymd = value.slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
      const [y, m, d] = ymd.split("-").map(Number);
      return Date.UTC(y, m - 1, d);
    }
    return null;
  };

  const startA = toUtcDay(a);
  const startB = toUtcDay(b);
  if (!Number.isFinite(startA) || !Number.isFinite(startB)) return null;
  return Math.round((startA - startB) / 86400000);
}

const DG_LABEL_DOPPLER = "Doppler (>=20d)";
const DG_LABEL_DG30 = "DG 30d";
const DG_LABEL_DG60 = "DG 60d";
const DG_LABEL_AVANC = "Avançado (>90d)";
const DG_LABEL_OUTRO = "Outro";
const DG_PERMITE_NAO_VISTA_CEDO = true;
const DG_PARAM_DEFAULTS = {
  dg30: [28, 35],
  dg60: [55, 75],
  dopplerMin: 20,
  avancadoMin: 90,
};

function validarDGJanela({ diasDesdeIA, tipoExame, resultado, dg30, dg60, dopplerMin, avancadoMin, permiteNaoVistaCedo }) {
  if (diasDesdeIA == null) {
    return { isValido: false, motivoBloqueio: "Sem IA registrada para calcular a janela do diagnóstico." };
  }

  const bloquearConclusivo = !permiteNaoVistaCedo || resultado !== "Não vista";
  if (diasDesdeIA < dopplerMin && bloquearConclusivo) {
    return { isValido: false, motivoBloqueio: `Diagnóstico conclusivo exige mínimo de ${dopplerMin} dias pós-IA.` };
  }

  const minPorTipo = {
    [DG_LABEL_DOPPLER]: dopplerMin,
    [DG_LABEL_DG30]: dg30[0],
    [DG_LABEL_DG60]: dg60[0],
    [DG_LABEL_AVANC]: avancadoMin,
    [DG_LABEL_OUTRO]: dopplerMin,
  };
  const minimo = minPorTipo[tipoExame];
  if (minimo && diasDesdeIA < minimo && bloquearConclusivo) {
    return { isValido: false, motivoBloqueio: `${tipoExame} exige mínimo de ${minimo} dias pós-IA.` };
  }

  return { isValido: true, motivoBloqueio: "" };
}

function addDays(baseDate, days) {
  if (!baseDate || !Number.isFinite(days)) return null;
  const dt = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  dt.setDate(dt.getDate() + days);
  return dt;
}

function formatBRDate(value) {
  if (!value) return "—";
  const dt = typeof value === "string" ? parseISODate(value) : value;
  return dt ? dt.toLocaleDateString("pt-BR") : "—";
}

function parseEtapasSnapshot(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function sanitizeReproEventoPayload(payload) {
  if (!payload || typeof payload !== "object") return payload;

  const { evidencia_ia: _evidenciaIa, ...cleanPayload } = payload;
  if (cleanPayload.meta && typeof cleanPayload.meta === "object") {
    const { evidencia_ia: _metaEvidenciaIa, ...cleanMeta } = cleanPayload.meta;
    cleanPayload.meta = cleanMeta;
  }

  return cleanPayload;
}

async function insertReproEvento(payload) {
  const sanitizedPayload = sanitizeReproEventoPayload(payload);
  const { data, error } = await supabase.from("repro_eventos").insert([sanitizedPayload]).select("*").maybeSingle();
  if (error) throw error;
  return data;
}

/* =========================================================
   COMPONENTES DE UI SOBRIOS
   ========================================================= */

// Navegação lateral tipo "Rail" - muito usada em software profissional (Linear, Figma, etc)
const NavItem = ({ icon: Icon, label, description, active, onClick, disabled }) => (
  <button
    onClick={disabled ? undefined : onClick}
    style={{
      display: "flex",
      width: "100%",
      alignItems: "flex-start",
      gap: "12px",
      padding: "12px 16px",
      marginBottom: "4px",
      background: active ? theme.colors.accent[50] : "transparent",
      border: "none",
      borderLeft: active ? `2px solid ${theme.colors.accent[600]}` : "2px solid transparent",
      borderRadius: `0 ${theme.radius.md} ${theme.radius.md} 0`,
      cursor: disabled ? "not-allowed" : "pointer",
      textAlign: "left",
      transition: "all 0.15s ease",
      opacity: disabled ? 0.4 : (active ? 1 : 0.7),
    }}
    onMouseEnter={(e) => {
      if (!active && !disabled) e.currentTarget.style.background = theme.colors.slate[100];
    }}
    onMouseLeave={(e) => {
      if (!active && !disabled) e.currentTarget.style.background = "transparent";
    }}
  >
    <div style={{ 
      color: active ? theme.colors.accent[600] : theme.colors.slate[500],
      marginTop: "2px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "20px",
      height: "20px"
    }}>
      <Icon />
    </div>
    
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ 
        fontSize: "13px", 
        fontWeight: active ? 600 : 500, 
        color: active ? theme.colors.accent[900] : theme.colors.slate[800],
        marginBottom: "2px",
        letterSpacing: "-0.01em"
      }}>
        {label}
      </div>
      <div style={{ 
        fontSize: "12px", 
        color: theme.colors.slate[500], 
        lineHeight: 1.4,
        fontWeight: 400,
        display: active ? "block" : "none" // Só mostra descrição quando ativo para economizar espaço visual
      }}>
        {description}
      </div>
    </div>
    
    {active && !disabled && (
      <div style={{ color: theme.colors.accent[600], marginTop: "2px" }}>
        <Icons.chevronRight />
      </div>
    )}
  </button>
);

export default function VisaoGeral({
  open = false,
  animal = null,
  initialTab = null,
  bulkMode = false,
  bulkAnimals = [],
  onClose,
  onSaved,
}) {
  const { fazendaAtualId } = useFazenda();
  const animalId = animal?.id || animal?.animal_id;
  const isDebug = Boolean(import.meta.env.DEV);
  const [inseminadores, setInseminadores] = useState([]);
  const [touros, setTouros] = useState([]);
  const [protocolos, setProtocolos] = useState([]);
  const [loadingProt, setLoadingProt] = useState(false);
  const [erroProt, setErroProt] = useState("");
  
  const [selectedType, setSelectedType] = useState(initialTab);
  const [isAnimating, setIsAnimating] = useState(false);
  const [draftIA, setDraftIA] = useState(null);
  const [draftDG, setDraftDG] = useState(null);
  const [erroSalvar, setErroSalvar] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [bulkSearch, setBulkSearch] = useState("");
  const [bulkSelectedIds, setBulkSelectedIds] = useState([]);
  const [bulkReady, setBulkReady] = useState(false);
  const [protocoloVinculadoOptions, setProtocoloVinculadoOptions] = useState([]);
  const [protocoloVinculadoId, setProtocoloVinculadoId] = useState("");
  const [bulkProtocolConflicts, setBulkProtocolConflicts] = useState([]);
  const [bulkProtocolSelections, setBulkProtocolSelections] = useState({});
  const [iaMatchAplicacaoId, setIaMatchAplicacaoId] = useState(null);
  const [iaMatchProtocoloId, setIaMatchProtocoloId] = useState(null);
  const [iaBanner, setIaBanner] = useState(null);
  const [iaBlockMessage, setIaBlockMessage] = useState("");
  const [bulkIABlockMessage, setBulkIABlockMessage] = useState("");
  const [bulkIAMatches, setBulkIAMatches] = useState({});

  const bulkActive = Boolean(bulkMode);

  const resolveAnimalId = useCallback((item) => item?.animal_id ?? item?.id ?? item?.animalId ?? null, []);

  const bulkList = useMemo(() => {
    return (Array.isArray(bulkAnimals) ? bulkAnimals : [])
      .map((item) => ({
        ...item,
        _bulkId: resolveAnimalId(item),
      }))
      .filter((item) => item._bulkId);
  }, [bulkAnimals, resolveAnimalId]);

  const bulkSelectedAnimals = useMemo(() => {
    return bulkList.filter((item) => bulkSelectedIds.includes(String(item._bulkId)));
  }, [bulkList, bulkSelectedIds]);

  const bulkPreviewAnimal = bulkSelectedAnimals[0] || null;

  useEffect(() => {
    if (open) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    }
  }, [open]);

  useEffect(() => {
    setErroSalvar("");
    if (selectedType !== "IA") setDraftIA(null);
    if (selectedType !== "IA") {
      setProtocoloVinculadoOptions([]);
      setProtocoloVinculadoId("");
      setBulkProtocolConflicts([]);
      setBulkProtocolSelections({});
    }
    if (selectedType !== "IA") {
      setIaMatchAplicacaoId(null);
      setIaMatchProtocoloId(null);
      setIaBanner(null);
      setIaBlockMessage("");
      setBulkIABlockMessage("");
      setBulkIAMatches({});
    }
  }, [selectedType]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open && bulkActive) {
      setSelectedType(null);
      setDraftIA(null);
      setErroSalvar("");
      setBulkSearch("");
      setBulkSelectedIds([]);
      setBulkReady(false);
      setProtocoloVinculadoOptions([]);
      setProtocoloVinculadoId("");
      setBulkProtocolConflicts([]);
      setBulkProtocolSelections({});
    }
  }, [open, bulkActive]);

  useEffect(() => {
    if (!draftIA?.razao || !RAZOES_VINCULO_AUTOMATICO.has(draftIA.razao)) {
      setProtocoloVinculadoOptions([]);
      setProtocoloVinculadoId("");
      setBulkProtocolConflicts([]);
      setBulkProtocolSelections({});
    }
  }, [draftIA?.razao]);

  const getAplicacoesAtivas = useCallback(async ({ animalId: targetAnimalId, dataEvento }) => {
    if (!fazendaAtualId || !targetAnimalId || !dataEvento) return [];
    const { data, error } = await supabase
      .from("repro_aplicacoes")
      .select("id, protocolo_id, data_inicio, etapas_snapshot")
      .eq("fazenda_id", fazendaAtualId)
      .eq("animal_id", targetAnimalId)
      .eq("status", "ATIVO")
      .lte("data_inicio", dataEvento);

    if (error) throw error;

    return Array.isArray(data) ? data : [];
  }, [fazendaAtualId]);

  const resolveVinculoIA = useCallback((aplicacoes, dataEventoDate, targetAnimalId) => {
    const alvoNormalizado = normalizeTexto("Inseminação");
    const matches = [];
    const previsoes = [];

    (Array.isArray(aplicacoes) ? aplicacoes : []).forEach((aplicacao) => {
      const dataInicio = parseISODate(aplicacao?.data_inicio);
      if (!dataInicio) return;
      const diaAlvo = diffDays(dataEventoDate, dataInicio);
      const etapas = parseEtapasSnapshot(aplicacao?.etapas_snapshot);
      const matchEtapa = etapas.find(
        (etapa) =>
          Number(etapa?.dia) === diaAlvo &&
          normalizeTexto(etapa?.acao) === alvoNormalizado
      );
      if (matchEtapa) {
        matches.push({ aplicacao, dataInicio, diaAlvo });
      }

      const etapaInsem = etapas.find(
        (etapa) =>
          normalizeTexto(etapa?.acao) === alvoNormalizado &&
          Number.isFinite(+etapa?.dia)
      );
      if (etapaInsem) {
        const dia = Number(etapaInsem.dia);
        const dataPrevista = addDays(dataInicio, dia);
        if (dataPrevista) {
          previsoes.push({ aplicacao, dataInicio, dia, dataPrevista });
        }
      }
    });

    const match = matches.length === 1 ? matches[0] : null;
    const next = previsoes.length > 0
      ? previsoes.sort((a, b) => a.dataPrevista - b.dataPrevista)[0]
      : null;

    return {
      animalId: targetAnimalId,
      hasMatch: matches.length > 0,
      match,
      next,
    };
  }, []);

  const isIABannerEqual = useCallback((a, b) => {
    if (a === b) return true;
    if (!a || !b) return false;
    return a.type === b.type && a.title === b.title && a.message === b.message;
  }, []);

  const areMatchesEqual = useCallback((prev, next) => {
    if (prev === next) return true;
    const prevKeys = Object.keys(prev || {});
    const nextKeys = Object.keys(next || {});
    if (prevKeys.length !== nextKeys.length) return false;
    return nextKeys.every((key) => prev?.[key] === next?.[key]);
  }, []);

  const clearStatus = useCallback(() => {
    setIaMatchAplicacaoId((prev) => (prev === null ? prev : null));
    setIaMatchProtocoloId((prev) => (prev === null ? prev : null));
    setIaBanner((prev) => (prev === null ? prev : null));
    setIaBlockMessage((prev) => (prev === "" ? prev : ""));
    setBulkIABlockMessage((prev) => (prev === "" ? prev : ""));
    setBulkIAMatches((prev) => (Object.keys(prev || {}).length === 0 ? prev : {}));
  }, []);

  const resolveStatus = useCallback(async (activeRef) => {
    if (!open || selectedType !== "IA") {
      clearStatus();
      return;
    }
    const razaoEvento = draftIA?.razao;
    if (!razaoEvento || !RAZOES_VINCULO_AUTOMATICO.has(razaoEvento)) {
      clearStatus();
      return;
    }
    const dataEventoISO = brToISO(draftIA?.data);
    if (!dataEventoISO) {
      clearStatus();
      return;
    }

    const dataEventoDate = parseISODate(dataEventoISO);
    if (!dataEventoDate) {
      clearStatus();
      return;
    }

    if (bulkActive && bulkReady && bulkSelectedAnimals.length > 0) {
      try {
        const resultados = await Promise.all(
          bulkSelectedAnimals.map(async (item) => {
            const targetId = resolveAnimalId(item);
            if (!targetId) return null;
            const aplicacoes = await getAplicacoesAtivas({
              animalId: targetId,
              dataEvento: dataEventoISO,
            });
            return resolveVinculoIA(aplicacoes, dataEventoDate, targetId);
          })
        );

        if (!activeRef?.current) return;

        const matchesMap = {};
        let hasInvalid = false;

        resultados.filter(Boolean).forEach((info) => {
          matchesMap[info.animalId] = info;
          if (!info.hasMatch) {
            hasInvalid = true;
          }
        });

        setBulkIAMatches((prev) => (areMatchesEqual(prev, matchesMap) ? prev : matchesMap));
        const nextBulkMessage = hasInvalid
          ? "Alguns animais não têm IA prevista nessa data. Ajuste a data ou a razão."
          : "";
        setBulkIABlockMessage((prev) => (prev === nextBulkMessage ? prev : nextBulkMessage));
        setIaBanner((prev) => (prev === null ? prev : null));
        setIaBlockMessage((prev) => (prev === "" ? prev : ""));
      } catch (error) {
        console.error("Erro ao validar IA coletiva:", error);
      }
      return;
    }

    if (!animalId) {
      clearStatus();
      return;
    }

    try {
      const aplicacoes = await getAplicacoesAtivas({
        animalId,
        dataEvento: dataEventoISO,
      });
      if (!activeRef?.current) return;

      const info = resolveVinculoIA(aplicacoes, dataEventoDate, animalId);
      if (info.hasMatch && info.match) {
        const detail = `Data início ${formatBRDate(info.match.dataInicio)} • D${info.match.diaAlvo} • Data do evento ${formatBRDate(dataEventoDate)}`;
        const nextBanner = {
          type: "info",
          title: "IA prevista pelo protocolo: VINCULANDO AUTOMATICAMENTE",
          message: detail,
        };
        setIaMatchAplicacaoId((prev) => (prev === info.match.aplicacao.id ? prev : info.match.aplicacao.id));
        setIaMatchProtocoloId((prev) => (prev === (info.match.aplicacao.protocolo_id || null) ? prev : info.match.aplicacao.protocolo_id || null));
        setIaBanner((prev) => (isIABannerEqual(prev, nextBanner) ? prev : nextBanner));
        setIaBlockMessage((prev) => (prev === "" ? prev : ""));
      } else {
        const dataPrevista = info.next?.dataPrevista || null;
        const msg = `Esse animal não tem IA prevista no protocolo para ${formatBRDate(dataEventoDate)}. IA prevista em ${formatBRDate(dataPrevista)}. Altere a data ou a razão.`;
        const nextBanner = {
          type: "danger",
          title: "IA fora do protocolo",
          message: msg,
        };
        setIaMatchAplicacaoId((prev) => (prev === null ? prev : null));
        setIaMatchProtocoloId((prev) => (prev === null ? prev : null));
        setIaBanner((prev) => (isIABannerEqual(prev, nextBanner) ? prev : nextBanner));
        setIaBlockMessage((prev) => (prev === msg ? prev : msg));
      }
      setBulkIABlockMessage((prev) => (prev === "" ? prev : ""));
      setBulkIAMatches((prev) => (Object.keys(prev || {}).length === 0 ? prev : {}));
    } catch (error) {
      console.error("Erro ao validar IA:", error);
    }
  }, [
    open,
    selectedType,
    draftIA?.razao,
    draftIA?.data,
    bulkActive,
    bulkReady,
    bulkSelectedAnimals,
    animalId,
    clearStatus,
    getAplicacoesAtivas,
    resolveAnimalId,
    resolveVinculoIA,
    areMatchesEqual,
    isIABannerEqual,
  ]);

  useEffect(() => {
    const activeRef = { current: true };
    resolveStatus(activeRef);
    return () => {
      activeRef.current = false;
    };
  }, [resolveStatus]);

  useEffect(() => {
    const fetchInseminadores = async () => {
      if (!open || !fazendaAtualId) {
        setInseminadores([]);
        return;
      }

      const { data, error } = await supabase
        .from("inseminadores")
        .select("id, nome")
        .eq("fazenda_id", fazendaAtualId)
        .eq("ativo", true)
        .order("nome", { ascending: true });

      if (error) {
        console.error("Erro ao carregar inseminadores:", error);
        setInseminadores([]);
        return;
      }

      setInseminadores(Array.isArray(data) ? data : []);
    };

    fetchInseminadores();
  }, [open, fazendaAtualId]);

  useEffect(() => {
    const fetchTouros = async () => {
      if (!open || !fazendaAtualId) {
        setTouros([]);
        return;
      }

      const { data, error } = await supabase
        .from("estoque_produtos")
        .select("id, nome_comercial, categoria, sub_tipo, ativo")
        .eq("fazenda_id", fazendaAtualId)
        .eq("ativo", true)
        .eq("categoria", "Reprodução")
        .in("sub_tipo", ["Sêmen", "Embrião"])
        .order("nome_comercial", { ascending: true });

      if (error) {
        console.error("Erro ao carregar produtos de reprodução:", error);
        setTouros([]);
        return;
      }

      const mapped = (Array.isArray(data) ? data : []).map((item) => ({
        id: item.id,
        nome: item.nome_comercial,
        restantes: undefined,
      }));

      setTouros(mapped);
    };

    fetchTouros();
  }, [open, fazendaAtualId]);

  useEffect(() => {
    const fetchProtocolos = async () => {
      if (!open || !fazendaAtualId) {
        setProtocolos([]);
        setErroProt("");
        setLoadingProt(false);
        return;
      }

      setLoadingProt(true);
      try {
        const { data, error } = await supabase
          .from("repro_protocolos")
          .select("id, nome, tipo, descricao, etapas, ativo, fazenda_id, user_id")
          .eq("fazenda_id", fazendaAtualId)
          .eq("ativo", true)
          .order("tipo", { ascending: true })
          .order("nome", { ascending: true });

        if (error) {
          console.error("[repro_protocolos] erro select:", error);
          setErroProt("Não consegui carregar os protocolos (verifique permissões/RLS).");
          setProtocolos([]);
          return;
        }

        setProtocolos(data || []);
        setErroProt("");
      } finally {
        setLoadingProt(false);
      }
    };

    fetchProtocolos();
  }, [open, fazendaAtualId]);

  const handleClose = () => {
    setSelectedType(null);
    setDraftIA(null);
    setDraftDG(null);
    setErroSalvar("");
    setSalvando(false);
    setBulkSearch("");
    setBulkSelectedIds([]);
    setBulkReady(false);
    setProtocoloVinculadoOptions([]);
    setProtocoloVinculadoId("");
    setBulkProtocolConflicts([]);
    setBulkProtocolSelections({});
    onClose?.();
  };

  const handleSaved = async () => {
    await onSaved?.();
    handleClose();
  };

  const insertReproEventos = async (payloads) => {
    const sanitizedPayloads = payloads.map((item) => sanitizeReproEventoPayload(item));
    const { error } = await supabase.from("repro_eventos").insert(sanitizedPayloads);
    if (error) throw error;
  };

  const getAplicacoesCompativeis = async ({ animalId: targetAnimalId, dataEvento }) => {
    if (!fazendaAtualId || !targetAnimalId || !dataEvento) return [];
    const { data, error } = await supabase
      .from("repro_aplicacoes")
      .select("id, protocolo_id, data_inicio, etapas_snapshot")
      .eq("fazenda_id", fazendaAtualId)
      .eq("animal_id", targetAnimalId)
      .eq("status", "ATIVO")
      .lte("data_inicio", dataEvento);

    if (error) throw error;

    const dataEventoDate = parseISODate(dataEvento);
    if (!dataEventoDate) return [];

    const alvoNormalizado = normalizeTexto("Inseminação");

    return (Array.isArray(data) ? data : []).filter((aplicacao) => {
      const dataInicio = parseISODate(aplicacao?.data_inicio);
      if (!dataInicio) return false;
      const diaAlvo = diffDays(dataEventoDate, dataInicio);
      if (diaAlvo === null) return false;
      const etapas = parseEtapasSnapshot(aplicacao?.etapas_snapshot);
      return etapas.some((etapa) =>
        Number(etapa?.dia) === diaAlvo &&
        normalizeTexto(etapa?.acao) === alvoNormalizado
      );
    });
  };

  const getIATarget = async ({ animalId: targetAnimalId, dataEvento }) => {
    if (!fazendaAtualId || !targetAnimalId || !dataEvento) return null;
    const { data, error } = await supabase
      .from("repro_eventos")
      .select("id, data_evento, inseminador_id, touro_id, touro_nome, protocolo_id, protocolo_aplicacao_id, razao, tipo_semen, palhetas, lote, evidencia, user_id, fazenda_id")
      .eq("fazenda_id", fazendaAtualId)
      .eq("animal_id", targetAnimalId)
      .eq("tipo", "IA")
      .lte("data_evento", dataEvento)
      .order("data_evento", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  };

  const mapIAFields = (iaAlvo) => ({
    evento_pai_id: iaAlvo?.id || null,
    inseminador_id: iaAlvo?.inseminador_id || null,
    touro_id: iaAlvo?.touro_id || null,
    touro_nome: iaAlvo?.touro_nome || null,
    protocolo_id: iaAlvo?.protocolo_id || null,
    protocolo_aplicacao_id: iaAlvo?.protocolo_aplicacao_id || null,
    razao: iaAlvo?.razao || null,
    tipo_semen: iaAlvo?.tipo_semen || null,
    palhetas: iaAlvo?.palhetas ?? null,
    lote: iaAlvo?.lote || null,
    evidencia: iaAlvo?.evidencia || null,
  });

  const buildDGMeta = (draft, iaAlvo) => ({
    dg: draft?.dg || "",
    tipoExame: draft?.extras?.tipoExame || "",
    diasDesdeIA: draft?.extras?.diasDesdeIA ?? null,
    comentario: draft?.extras?.comentario || "",
    ia_ref: iaAlvo?.id ? { id: iaAlvo.id, data: iaAlvo.data_evento } : null,
  });

  const buildAplicacaoOption = (aplicacao) => {
    const labelBase = aplicacao?.protocolo_id
      ? `Protocolo ${aplicacao.protocolo_id}`
      : "Aplicação";
    const dataLabel = formatBRDate(aplicacao?.data_inicio);
    return {
      value: aplicacao?.id,
      label: `${labelBase} • ${dataLabel}`,
      protocolo_id: aplicacao?.protocolo_id || null,
    };
  };

  const handleSubmit = async (payload) => {
    const hasBulkSelection = bulkActive && bulkReady && bulkSelectedAnimals.length > 0;
    const baseAnimalId = animalId;

    if (!fazendaAtualId || (!hasBulkSelection && !baseAnimalId)) {
      console.warn("Manejo salvar: fazendaAtualId", fazendaAtualId, "animal", animal);
      setErroSalvar("Não foi possível salvar: fazenda ou animal não identificado.");
      return;
    }

    if (bulkActive && !hasBulkSelection) {
      setErroSalvar("Selecione ao menos 1 animal para a ação coletiva.");
      return;
    }

    try {
      setErroSalvar("");
      setSalvando(true);
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const legacyAuthUser = typeof supabase.auth.user === "function" ? supabase.auth.user() : null;
      const userId = authData?.user?.id || legacyAuthUser?.id;
      if (!userId) throw new Error("Sessão inválida (auth.uid vazio)");

      if (payload.kind === "IA") {
        const dataEvento = normalizePayloadDate(payload.data);
        if (!dataEvento) throw new Error("Não foi possível salvar: confira a data no formato dd/mm/aaaa.");
        const razaoEvento = payload?.extras?.razao || null;
        const evidenciaEvento = payload?.extras?.evidencia || null;
        const exigeVinculo = Boolean(razaoEvento && RAZOES_VINCULO_AUTOMATICO.has(razaoEvento));
        const baseEvento = {
          fazenda_id: fazendaAtualId,
          tipo: "IA",
          data_evento: dataEvento,
          user_id: userId,
          inseminador_id: payload.inseminadorId || null,
          touro_id: payload.touroId || null,
          touro_nome: payload.touroNome || null,
          razao: razaoEvento,
          evidencia: evidenciaEvento,
          tipo_semen: payload?.extras?.tipoSemen || null,
          palhetas: payload?.extras?.palhetas ?? null,
          observacoes: payload.obs || null,
          meta: payload?.extras || null,
        };

        if (hasBulkSelection) {
          if (exigeVinculo && bulkIABlockMessage) {
            setErroSalvar(bulkIABlockMessage);
            return;
          }
          if (!exigeVinculo) {
            await insertReproEventos(
              bulkSelectedAnimals.map((item) => ({
                ...baseEvento,
                animal_id: resolveAnimalId(item),
                protocolo_aplicacao_id: null,
                protocolo_id: null,
              }))
            );
            return;
          }

          const vinculos = [];
          let semVinculo = 0;
          let vinculoManual = 0;

          const conflitos = [];
          const itens = await Promise.all(
            bulkSelectedAnimals.map(async (item) => {
              const currentAnimalId = resolveAnimalId(item);
              if (!exigeVinculo) {
                semVinculo += 1;
                return { item, animalId: currentAnimalId, aplicacao: null };
              }

              const aplicacoes = await getAplicacoesCompativeis({
                animalId: currentAnimalId,
                dataEvento,
              });

              if (aplicacoes.length === 1) {
                vinculos.push(aplicacoes[0]);
                return { item, animalId: currentAnimalId, aplicacao: aplicacoes[0] };
              }

              if (aplicacoes.length === 0) {
                semVinculo += 1;
                return { item, animalId: currentAnimalId, aplicacao: null };
              }

              const options = aplicacoes.map(buildAplicacaoOption);
              const selectedId = bulkProtocolSelections[currentAnimalId];
              const resolved = aplicacoes.find((app) => String(app.id) === String(selectedId));
              if (!resolved) {
                conflitos.push({
                  animalId: currentAnimalId,
                  numero: item?.numero,
                  brinco: item?.brinco,
                  options,
                });
                return { item, animalId: currentAnimalId, aplicacao: null, conflito: true };
              }

              vinculoManual += 1;
              return { item, animalId: currentAnimalId, aplicacao: resolved };
            })
          );

          if (conflitos.length > 0) {
            setBulkProtocolConflicts(conflitos);
            setErroSalvar("Selecione o protocolo vinculado para os animais em conflito.");
            return;
          }

          setBulkProtocolConflicts([]);

          if (semVinculo > 0) {
            setErroSalvar("Alguns animais não têm IA prevista nessa data. Ajuste a data ou a razão.");
            return;
          }

          await insertReproEventos(
            itens.map(({ item, animalId: targetId, aplicacao }) => ({
              ...baseEvento,
              animal_id: targetId,
              protocolo_aplicacao_id: aplicacao?.id || null,
              protocolo_id: aplicacao?.protocolo_id || null,
            }))
          );

          const autoVinculadas = vinculos.length;
          const manuais = vinculoManual;
          toast.info(
            [
              `${autoVinculadas} vinculadas automaticamente`,
              `${manuais} exigiram escolha manual`,
            ].join(" • ")
          );
        } else {
          let protocoloAplicacaoId = null;
          let protocoloId = null;

          if (exigeVinculo) {
            if (iaMatchAplicacaoId) {
              protocoloAplicacaoId = iaMatchAplicacaoId;
              protocoloId = iaMatchProtocoloId;
              setProtocoloVinculadoOptions([]);
              setProtocoloVinculadoId("");
            } else {
              if (iaBlockMessage) {
                setErroSalvar(iaBlockMessage);
                return;
              }
              const aplicacoes = await getAplicacoesCompativeis({
                animalId: baseAnimalId,
                dataEvento,
              });

              if (aplicacoes.length === 1) {
                protocoloAplicacaoId = aplicacoes[0].id;
                protocoloId = aplicacoes[0].protocolo_id;
                setProtocoloVinculadoOptions([]);
                setProtocoloVinculadoId("");
              } else if (aplicacoes.length === 0) {
                setErroSalvar("Esse animal não tem IA prevista nessa data. Ajuste a data ou a razão.");
                setProtocoloVinculadoOptions([]);
                setProtocoloVinculadoId("");
                return;
              } else {
                const options = aplicacoes.map(buildAplicacaoOption);
                const selectedId = protocoloVinculadoId;
                const selectedApp = aplicacoes.find((app) => String(app.id) === String(selectedId));
                if (!selectedApp) {
                  setProtocoloVinculadoOptions(options);
                  setErroSalvar("Selecione o protocolo vinculado para continuar.");
                  return;
                }
                protocoloAplicacaoId = selectedApp.id;
                protocoloId = selectedApp.protocolo_id;
                setProtocoloVinculadoOptions(options);
              }
            }
          }

          await insertReproEvento({
            ...baseEvento,
            animal_id: baseAnimalId,
            protocolo_aplicacao_id: protocoloAplicacaoId,
            protocolo_id: protocoloId,
          });
        }
      } else if (payload.kind === "PROTOCOLO_APLICADO") {
        if (!payload?.aplicacao) {
          throw new Error("Aplicação de protocolo não retornada.");
        }
        toast.success("Protocolo aplicado com sucesso");
      } else if (payload.kind === "PROTOCOLO") {
        const protocoloId = payload?.protocolo_id;
        const dataInicio = normalizePayloadDate(payload?.data);
        const horaInicio = normalizePayloadTime(payload?.horaInicio);

        if (!protocoloId || !fazendaAtualId || !userId) {
          throw new Error("Não foi possível aplicar o protocolo: valide protocolo, fazenda e sessão do usuário.");
        }
        if (!dataInicio) {
          throw new Error("Não foi possível aplicar o protocolo: data de início inválida.");
        }
        if (!horaInicio) {
          throw new Error("Não foi possível aplicar o protocolo: horário inicial inválido (use HH:mm).");
        }

        if (hasBulkSelection) {
          const inserts = bulkSelectedAnimals.map((item) => ({
            user_id: userId,
            fazenda_id: fazendaAtualId,
            animal_id: resolveAnimalId(item),
            protocolo_id: protocoloId,
            data_inicio: dataInicio,
            status: "ATIVO",
            tipo: payload?.tipo || null,
            hora_inicio: horaInicio,
          }));
          const { error: aplicacaoError } = await supabase
            .from("repro_aplicacoes")
            .insert(inserts);
          if (aplicacaoError) throw aplicacaoError;
        } else {
          const animalPayloadId = payload?.animal_id || baseAnimalId;
          const { error: aplicacaoError } = await supabase
            .from("repro_aplicacoes")
            .insert({
              user_id: userId,
              fazenda_id: fazendaAtualId,
              animal_id: animalPayloadId,
              protocolo_id: protocoloId,
              data_inicio: dataInicio,
              status: "ATIVO",
              tipo: payload?.tipo || null,
              hora_inicio: horaInicio,
            });
          if (aplicacaoError) throw aplicacaoError;
        }
        toast.success("Protocolo aplicado com sucesso");
      }
      await handleSaved();
    } catch (e) {
      console.error(e);
      const msg = [e?.message || "Erro ao salvar", e?.code ? `Código: ${e.code}` : ""].filter(Boolean).join(" | ");
      setErroSalvar(msg);
    } finally {
      setSalvando(false);
    }
  };

  const handleSalvarRegistro = async () => {
    setErroSalvar("");

    if (!fazendaAtualId || (!bulkActive && !animalId)) {
      console.warn("Manejo salvar: fazendaAtualId", fazendaAtualId, "animal", animal);
      setErroSalvar("Não foi possível salvar: fazenda ou animal não identificado.");
      return;
    }

    if (bulkActive && (!bulkReady || bulkSelectedAnimals.length === 0)) {
      setErroSalvar("Selecione ao menos 1 animal para continuar.");
      return;
    }

    if (!selectedType) {
      setErroSalvar("Selecione um tipo de evento para salvar.");
      return;
    }

    if (selectedType === "IA") {
      if (!draftIA) {
        setErroSalvar("Preencha os dados da inseminação antes de salvar.");
        return;
      }

      const dataEvento = brToISO(draftIA.data);
      if (!dataEvento) {
        setErroSalvar("Data inválida. Use o formato dd/mm/aaaa.");
        return;
      }

      if (!draftIA.inseminadorId) {
        setErroSalvar("Selecione o inseminador para salvar o registro.");
        return;
      }

      if (!draftIA.touroId) {
        setErroSalvar("Selecione o touro para salvar o registro.");
        return;
      }

      if (!(Number.isFinite(+draftIA.palhetas) && +draftIA.palhetas >= 1)) {
        setErroSalvar("Informe ao menos 1 palheta para salvar o registro.");
        return;
      }

      if (RAZOES_VINCULO_AUTOMATICO.has(draftIA.razao) && iaBlockMessage) {
        setErroSalvar(iaBlockMessage);
        return;
      }

      if (bulkActive && bulkIABlockMessage) {
        setErroSalvar(bulkIABlockMessage);
        return;
      }

      const touroSelecionado = touros.find((t) => String(t.id) === String(draftIA.touroId));

      await handleSubmit({
        kind: "IA",
        data: draftIA.data,
        inseminadorId: draftIA.inseminadorId,
        touroId: draftIA.touroId,
        touroNome: touroSelecionado?.nome || null,
        obs: draftIA.obs || null,
        extras: {
          razao: draftIA.razao || null,
          evidencia: draftIA.evidencia || null,
          tipoSemen: draftIA.tipoSemen || null,
          palhetas: draftIA.palhetas,
        },
      });
      return;
    }

    if (selectedType === "DG") {
      if (!draftDG) {
        setErroSalvar("Preencha os dados do diagnóstico antes de salvar.");
        return;
      }

      const dataEvento = brToISO(draftDG.data);
      if (!dataEvento) {
        setErroSalvar("Data inválida. Use o formato dd/mm/aaaa.");
        return;
      }

      try {
        setSalvando(true);
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        const legacyAuthUser = typeof supabase.auth.user === "function" ? supabase.auth.user() : null;
        const userId = authData?.user?.id || legacyAuthUser?.id;
        if (!userId) throw new Error("Sessão inválida (auth.uid vazio)");

        if (bulkActive) {
          const targets = await Promise.all(
            bulkSelectedAnimals.map(async (item) => {
              const resolvedAnimalId = resolveAnimalId(item);
              const iaAlvo = await getIATarget({ animalId: resolvedAnimalId, dataEvento });
              return { animalId: resolvedAnimalId, iaAlvo };
            })
          );
          const semIA = targets.filter((item) => !item.iaAlvo);
          if (semIA.length > 0) {
            setErroSalvar("Sem IA válida para alguns animais selecionados. Registre uma inseminação antes do diagnóstico.");
            return;
          }
          const invalidTarget = targets.find(({ iaAlvo }) => {
            const diasDesdeIA = diffDays(dataEvento, iaAlvo?.data_evento);
            const { isValido } = validarDGJanela({
              diasDesdeIA,
              tipoExame: draftDG?.extras?.tipoExame || DG_LABEL_OUTRO,
              resultado: draftDG?.dg || "",
              ...DG_PARAM_DEFAULTS,
              permiteNaoVistaCedo: DG_PERMITE_NAO_VISTA_CEDO,
            });
            return !isValido;
          });
          if (invalidTarget) {
            const diasDesdeIA = diffDays(dataEvento, invalidTarget.iaAlvo?.data_evento);
            const { motivoBloqueio } = validarDGJanela({
              diasDesdeIA,
              tipoExame: draftDG?.extras?.tipoExame || DG_LABEL_OUTRO,
              resultado: draftDG?.dg || "",
              ...DG_PARAM_DEFAULTS,
              permiteNaoVistaCedo: DG_PERMITE_NAO_VISTA_CEDO,
            });
            setErroSalvar(motivoBloqueio || "Diagnóstico fora da janela mínima para alguns animais.");
            return;
          }

          await insertReproEventos(
            targets.map(({ animalId: resolvedAnimalId, iaAlvo }) => ({
              fazenda_id: fazendaAtualId,
              animal_id: resolvedAnimalId,
              tipo: "DG",
              data_evento: dataEvento,
              user_id: userId,
              meta: buildDGMeta(draftDG, iaAlvo),
              ...mapIAFields(iaAlvo),
            }))
          );
          toast.success("DG salvo");
        } else {
          const iaAlvo = await getIATarget({ animalId, dataEvento });
          if (!iaAlvo) {
            setErroSalvar("Sem IA válida para este animal. Registre uma inseminação antes do diagnóstico.");
            return;
          }
          const diasDesdeIA = diffDays(dataEvento, iaAlvo?.data_evento);
          const { isValido, motivoBloqueio } = validarDGJanela({
            diasDesdeIA,
            tipoExame: draftDG?.extras?.tipoExame || DG_LABEL_OUTRO,
            resultado: draftDG?.dg || "",
            ...DG_PARAM_DEFAULTS,
            permiteNaoVistaCedo: DG_PERMITE_NAO_VISTA_CEDO,
          });
          if (!isValido) {
            setErroSalvar(motivoBloqueio || "Diagnóstico fora da janela mínima.");
            return;
          }
          await insertReproEvento({
            fazenda_id: fazendaAtualId,
            animal_id: animalId,
            tipo: "DG",
            data_evento: dataEvento,
            user_id: userId,
            meta: buildDGMeta(draftDG, iaAlvo),
            ...mapIAFields(iaAlvo),
          });
          toast.success("DG salvo");
        }
        await handleSaved();
      } catch (e) {
        console.error(e);
        const msg = [e?.message || "Erro ao salvar", e?.code ? `Código: ${e.code}` : ""].filter(Boolean).join(" | ");
        setErroSalvar(msg);
      } finally {
        setSalvando(false);
      }
      return;
    }

    const form = document.getElementById(`form-${selectedType}`);
    if (!form) {
      setErroSalvar("Formulário não encontrado para o tipo selecionado.");
      return;
    }
    form.requestSubmit();
  };

  if (!open) return null;

  const eventTypes = [
    {
      id: "DG",
      title: "Diagnóstico",
      fullTitle: "Diagnóstico de Gestação",
      description: "Palpação, ultrassom ou Doppler",
      icon: Icons.stethoscope,
      component: Diagnostico,
    },
    {
      id: "IA",
      title: "Inseminação",
      fullTitle: "Inseminação Artificial",
      description: "Registro de cobertura ou IA",
      icon: Icons.syringe,
      component: Inseminacao,
    },
    {
      id: "PROTOCOLO",
      title: "Protocolo",
      fullTitle: "Protocolo Hormonal",
      description: "Sincronização de cio ou IATF",
      icon: Icons.calendar,
      component: AplicarProtocolo,
    },
    {
      id: "CLINICA",
      title: "Clínica",
      fullTitle: "Ocorrência Clínica",
      description: "Abortos, tratamentos, manejos",
      icon: Icons.alert,
      component: OcorrenciaClinica,
    },
  ];

  const currentEvent = eventTypes.find(e => e.id === selectedType);
  const FormComponent = currentEvent?.component;
  const selectionCount = bulkSelectedAnimals.length;
  const bulkSelectionNumbers = bulkSelectedAnimals
    .map((item) => item?.numero)
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");
  const filteredBulkAnimals = bulkList.filter((item) => {
    if (!bulkSearch) return true;
    const term = bulkSearch.trim().toLowerCase();
    const numero = String(item?.numero || "").toLowerCase();
    const brinco = String(item?.brinco || "").toLowerCase();
    return numero.includes(term) || brinco.includes(term);
  });

  return (
    <div 
      onClick={(e) => e.target === e.currentTarget && handleClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(2, 6, 23, 0.6)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 20px",
      }}
    >
      <div style={{
        background: "#fff", 
        width: "min(900px, 95vw)", 
        height: "min(700px, 90vh)",
        borderRadius: theme.radius.lg, 
        overflow: "hidden",
        display: "flex",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
        border: `1px solid ${theme.colors.slate[200]}`,
        opacity: isAnimating ? 0 : 1,
        transform: isAnimating ? "scale(0.98)" : "scale(1)",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      }}>
        
        {/* SIDEBAR - Navegação minimalista */}
        <div style={{
          width: "240px",
          background: theme.colors.slate[50],
          borderRight: `1px solid ${theme.colors.slate[200]}`,
          display: "flex",
          flexDirection: "column",
        }}>
          {/* Header da Sidebar */}
          <div style={{
            padding: "20px 16px 16px",
            borderBottom: `1px solid ${theme.colors.slate[200]}`,
          }}>
            <div style={{ 
              fontSize: "11px", 
              fontWeight: 600, 
              color: theme.colors.slate[500], 
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "4px"
            }}>
              Manejo Reprodutivo
            </div>
            <div style={{ 
              fontSize: "16px", 
              fontWeight: 700, 
              color: theme.colors.slate[900],
              letterSpacing: "-0.02em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}>
              {bulkActive ? "Ação Coletiva" : (animal?.numero ? `Animal ${animal.numero}` : "Novo Registro")}
            </div>
            {bulkActive ? (
              <div style={{
                fontSize: "12px",
                color: theme.colors.slate[500],
                marginTop: "2px"
              }}>
                Selecionados: {selectionCount || 0}
                {bulkSelectionNumbers ? ` • ${bulkSelectionNumbers}${selectionCount > 3 ? "..." : ""}` : ""}
              </div>
            ) : (
              <div style={{
                fontSize: "12px",
                color: theme.colors.slate[500],
                marginTop: "2px"
              }}>
                Brinco: {animal?.brinco || "—"}
              </div>
            )}
            {isDebug && (
              <div style={{
                fontSize: "11px",
                color: theme.colors.slate[400],
                marginTop: "2px"
              }}>
                ID: {bulkActive ? (bulkSelectedAnimals[0]?._bulkId || "—") : (animalId || "—")}
              </div>
            )}
            {!bulkActive && animal?.lote && (
              <div style={{ 
                fontSize: "12px", 
                color: theme.colors.slate[500], 
                marginTop: "2px" 
              }}>
                Lote: {animal.lote}
              </div>
            )}
          </div>

          {/* Menu de Navegação */}
          <div style={{ 
            flex: 1, 
            overflowY: "auto", 
            padding: "12px 0",
          }}>
            <div style={{ 
              padding: "0 12px 8px 16px", 
              fontSize: "11px", 
              fontWeight: 600, 
              color: theme.colors.slate[400],
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
              Selecione o tipo
            </div>
            
            {eventTypes.map(type => (
              <NavItem
                key={type.id}
                icon={type.icon}
                label={type.title}
                description={type.description}
                active={selectedType === type.id}
                onClick={() => setSelectedType(type.id)}
                disabled={bulkActive && !bulkReady}
              />
            ))}
          </div>

          {/* Footer da Sidebar com dica */}
          <div style={{
            padding: "16px",
            borderTop: `1px solid ${theme.colors.slate[200]}`,
            background: theme.colors.slate[100],
          }}>
            <div style={{ 
              fontSize: "11px", 
              color: theme.colors.slate[500], 
              lineHeight: 1.5 
            }}>
              <strong style={{ color: theme.colors.slate[700] }}>Dica:</strong> Use atalhos de teclado para navegar mais rápido entre os registros.
            </div>
          </div>
        </div>

        {/* CONTEÚDO PRINCIPAL */}
        <div style={{ 
          flex: 1, 
          display: "flex", 
          flexDirection: "column",
          background: "#fff"
        }}>
          {/* Header do Conteúdo */}
          <div style={{
            height: "64px",
            borderBottom: `1px solid ${theme.colors.slate[200]}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
          }}>
            <div>
              <h2 style={{ 
                margin: 0, 
                fontSize: "16px", 
                fontWeight: 600, 
                color: theme.colors.slate[900],
                letterSpacing: "-0.01em"
              }}>
                {bulkActive && !bulkReady ? "Selecione os animais" : (currentEvent?.fullTitle || "Selecione uma opção")}
              </h2>
              {currentEvent && !(bulkActive && !bulkReady) && (
                <p style={{ 
                  margin: "2px 0 0 0", 
                  fontSize: "13px", 
                  color: theme.colors.slate[500] 
                }}>
                  Preencha os dados do registro abaixo
                </p>
              )}
            </div>
            
            <button
              onClick={handleClose}
              style={{ 
                background: "transparent", 
                border: "none", 
                padding: "8px", 
                borderRadius: theme.radius.md,
                cursor: "pointer",
                color: theme.colors.slate[500],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.colors.slate[100];
                e.currentTarget.style.color = theme.colors.slate[800];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = theme.colors.slate[500];
              }}
              title="Fechar (Esc)"
            >
              <Icons.close />
            </button>
          </div>

          {/* Área do Formulário */}
          <div style={{ 
            flex: 1, 
            overflowY: "auto",
            padding: "32px",
            background: "#fff"
          }}>
            {!selectedType ? (
              bulkActive && !bulkReady ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: theme.colors.slate[600],
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}>
                      Buscar animal
                    </label>
                    <input
                      value={bulkSearch}
                      onChange={(e) => setBulkSearch(e.target.value)}
                      placeholder="Digite número ou brinco..."
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: theme.radius.md,
                        border: `1px solid ${theme.colors.slate[200]}`,
                        fontSize: "14px",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div style={{ fontSize: "13px", color: theme.colors.slate[500] }}>
                    Selecionados: <strong style={{ color: theme.colors.slate[800] }}>{selectionCount}</strong>
                  </div>

                  <div style={{
                    flex: 1,
                    overflowY: "auto",
                    border: `1px solid ${theme.colors.slate[200]}`,
                    borderRadius: theme.radius.md,
                  }}>
                    {filteredBulkAnimals.length === 0 ? (
                      <div style={{ padding: "16px", color: theme.colors.slate[500], fontSize: "13px" }}>
                        Nenhum animal encontrado.
                      </div>
                    ) : (
                      filteredBulkAnimals.map((item) => {
                        const isSelected = bulkSelectedIds.includes(String(item._bulkId));
                        return (
                          <button
                            key={item._bulkId}
                            type="button"
                            onClick={() => {
                              setBulkSelectedIds((prev) => {
                                const key = String(item._bulkId);
                                if (prev.includes(key)) return prev.filter((id) => id !== key);
                                return [...prev, key];
                              });
                            }}
                            style={{
                              width: "100%",
                              textAlign: "left",
                              border: "none",
                              background: isSelected ? theme.colors.accent[50] : "#fff",
                              padding: "12px 14px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              cursor: "pointer",
                              borderBottom: `1px solid ${theme.colors.slate[100]}`,
                            }}
                          >
                            <div>
                              <div style={{ fontSize: "14px", fontWeight: 600, color: theme.colors.slate[800] }}>
                                Nº {item?.numero || "—"}
                              </div>
                              <div style={{ fontSize: "12px", color: theme.colors.slate[500] }}>
                                Brinco {item?.brinco || "—"}
                              </div>
                            </div>
                            {isSelected && (
                              <span style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "20px",
                                height: "20px",
                                borderRadius: "50%",
                                background: theme.colors.accent[600],
                                color: "#fff",
                                fontSize: "12px",
                              }}>
                                <Icons.check />
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                    <button
                      type="button"
                      onClick={handleClose}
                      style={{
                        padding: "10px 16px",
                        fontSize: "13px",
                        fontWeight: 600,
                        background: "transparent",
                        border: `1px solid ${theme.colors.slate[200]}`,
                        borderRadius: theme.radius.md,
                        cursor: "pointer",
                        color: theme.colors.slate[600],
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectionCount === 0) return;
                        setBulkReady(true);
                      }}
                      disabled={selectionCount === 0}
                      style={{
                        padding: "10px 18px",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#fff",
                        background: selectionCount === 0 ? theme.colors.slate[300] : theme.colors.accent[600],
                        border: "none",
                        borderRadius: theme.radius.md,
                        cursor: selectionCount === 0 ? "not-allowed" : "pointer",
                      }}
                    >
                      Prosseguir
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: theme.colors.slate[400],
                  textAlign: "center",
                }}>
                  <div style={{ 
                    width: "48px", 
                    height: "48px", 
                    borderRadius: "50%",
                    background: theme.colors.slate[100],
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                    color: theme.colors.slate[400]
                  }}>
                    <Icons.stethoscope />
                  </div>
                  <p style={{ margin: 0, fontSize: "14px" }}>
                    Selecione um tipo de evento no menu lateral<br/>
                    para iniciar o registro
                  </p>
                </div>
              )
            ) : (
              <FormComponent 
                animal={bulkActive ? bulkPreviewAnimal : animal}
                inseminadores={inseminadores}
                touros={touros}
                protocolos={protocolos}
                onSubmit={handleSubmit}
                onChangeDraft={selectedType === "IA" ? setDraftIA : selectedType === "DG" ? setDraftDG : undefined}
                protocoloVinculadoOptions={selectedType === "IA" ? protocoloVinculadoOptions : []}
                protocoloVinculadoId={selectedType === "IA" ? protocoloVinculadoId : ""}
                protocoloVinculadoRequired={selectedType === "IA" && protocoloVinculadoOptions.length > 1}
                onSelectProtocoloVinculado={selectedType === "IA" ? setProtocoloVinculadoId : undefined}
                bulkMode={bulkActive}
                key={selectedType} // Força remount ao trocar de aba
              />
            )}
            {selectedType === "IA" && bulkActive && bulkProtocolConflicts.length > 0 && (
              <div style={{
                marginTop: "20px",
                padding: "16px",
                borderRadius: theme.radius.md,
                border: `1px solid ${theme.colors.slate[200]}`,
                background: theme.colors.slate[50],
              }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: theme.colors.slate[700], marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Protocolo vinculado (necessário para salvar)
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {bulkProtocolConflicts.map((conflict) => {
                    const label = conflict?.numero ? `Nº ${conflict.numero}` : (conflict?.brinco ? `Brinco ${conflict.brinco}` : `Animal ${conflict.animalId}`);
                    return (
                      <div key={conflict.animalId} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: theme.colors.slate[700] }}>
                          {label}
                        </div>
                        <select
                          value={bulkProtocolSelections[conflict.animalId] || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            setBulkProtocolSelections((prev) => ({
                              ...prev,
                              [conflict.animalId]: value,
                            }));
                          }}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: theme.radius.md,
                            border: `1px solid ${theme.colors.slate[200]}`,
                            fontSize: "14px",
                            background: "#fff",
                          }}
                        >
                          <option value="">Selecione o protocolo vinculado...</option>
                          {conflict.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {selectedType === "PROTOCOLO" && loadingProt && (
              <div style={{
                marginTop: "16px",
                padding: "12px 14px",
                borderRadius: theme.radius.md,
                border: `1px solid ${theme.colors.slate[200]}`,
                background: theme.colors.slate[50],
                color: theme.colors.slate[600],
                fontSize: "13px",
                fontWeight: 500,
              }}>
                Carregando protocolos…
              </div>
            )}
            {selectedType === "PROTOCOLO" && erroProt && (
              <div style={{
                marginTop: "16px",
                padding: "12px 14px",
                borderRadius: theme.radius.md,
                border: `1px solid ${theme.colors.danger}`,
                background: "#fef2f2",
                color: theme.colors.danger,
                fontSize: "13px",
                fontWeight: 600,
              }}>
                {erroProt}
              </div>
            )}
          </div>

          {selectedType === "IA" && (iaBanner || (bulkActive && bulkIABlockMessage)) && (
            <div style={{
              padding: "12px 24px 0",
              background: "#fff",
            }}>
              {iaBanner && (
                <div style={{
                  padding: "12px 16px",
                  borderRadius: theme.radius.md,
                  border: `1px solid ${iaBanner.type === "danger" ? theme.colors.danger : theme.colors.accent[100]}`,
                  background: iaBanner.type === "danger" ? "#fef2f2" : theme.colors.accent[50],
                  color: iaBanner.type === "danger" ? theme.colors.danger : theme.colors.accent[900],
                  fontSize: "13px",
                  fontWeight: 600,
                }}>
                  <div style={{ fontWeight: 700, marginBottom: "4px" }}>{iaBanner.title}</div>
                  <div style={{ fontWeight: 500, color: theme.colors.slate[700] }}>{iaBanner.message}</div>
                </div>
              )}
              {!iaBanner && bulkActive && bulkIABlockMessage && (
                <div style={{
                  padding: "12px 16px",
                  borderRadius: theme.radius.md,
                  border: `1px solid ${theme.colors.danger}`,
                  background: "#fef2f2",
                  color: theme.colors.danger,
                  fontSize: "13px",
                  fontWeight: 600,
                }}>
                  {bulkIABlockMessage}
                </div>
              )}
            </div>
          )}

          {/* Footer com Ações */}
          {selectedType && (
            <div style={{
              height: "72px",
              borderTop: `1px solid ${theme.colors.slate[200]}`,
              background: theme.colors.slate[50],
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 24px",
            }}>
              <button
                onClick={() => setSelectedType(null)}
                style={{
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: theme.colors.slate[600],
                  background: "transparent",
                  border: "none",
                  borderRadius: theme.radius.md,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = theme.colors.slate[200]}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                Cancelar
              </button>
              
              <button
                onClick={handleSalvarRegistro}
                disabled={salvando || Boolean(iaBlockMessage) || Boolean(bulkIABlockMessage)}
                style={{
                  padding: "8px 20px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#fff",
                  background: (salvando || iaBlockMessage || bulkIABlockMessage) ? theme.colors.slate[300] : theme.colors.accent[600],
                  border: "none",
                  borderRadius: theme.radius.md,
                  cursor: (salvando || iaBlockMessage || bulkIABlockMessage) ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 1px 2px 0 rgba(0,0,0,0.1)",
                  transition: "all 0.15s",
                  opacity: (salvando || iaBlockMessage || bulkIABlockMessage) ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (salvando || iaBlockMessage || bulkIABlockMessage) return;
                  e.currentTarget.style.background = theme.colors.accent[700];
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  if (salvando || iaBlockMessage || bulkIABlockMessage) return;
                  e.currentTarget.style.background = theme.colors.accent[600];
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 1px 2px 0 rgba(0,0,0,0.1)";
                }}
              >
                <Icons.check />
                {salvando ? "Salvando..." : "Salvar Registro"}
              </button>
            </div>
          )}
          {selectedType && erroSalvar && (
            <div style={{
              padding: "10px 24px 14px",
              background: theme.colors.slate[50],
              borderTop: `1px solid ${theme.colors.slate[200]}`,
              color: theme.colors.danger,
              fontSize: "13px",
              fontWeight: 500,
            }}>
              {erroSalvar}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
