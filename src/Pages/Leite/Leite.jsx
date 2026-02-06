// src/pages/Leite/Leite.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Select from "react-select";
import { supabase } from "../../lib/supabaseClient";
import { withFazendaId } from "../../lib/fazendaScope";
import { useFazenda } from "../../context/FazendaContext";
import ResumoLeiteDia from "./ResumoLeiteDia";
import "../../styles/tabelaModerna.css";

let MEMO_LEITE = {
  data: null,
  lastAt: 0,
};

/* ===== HELPERS ===== */
const toNum = (v) => parseFloat(String(v ?? "0").replace(",", ".")) || 0;

function parseBR(str) {
  if (!str || str.length !== 10) return null;
  const [d, m, y] = str.split("/").map(Number);
  const dt = new Date(y, m - 1, d);
  return Number.isFinite(dt.getTime()) ? dt : null;
}

function toBR(dt) {
  if (!dt) return "";
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yyyy = dt.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatISOToBR(iso) {
  if (!iso) return "";
  const dt = new Date(iso);
  return Number.isNaN(dt.getTime()) ? "" : toBR(dt);
}

function calcularDEL(partoBR) {
  const dt = parseBR(partoBR);
  if (!dt) return 0;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  dt.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((hoje - dt) / 86400000));
}

function ymdHoje() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return hoje.toISOString().split("T")[0];
}

function addDaysISO(iso, delta) {
  if (!iso) return iso;
  const dt = new Date(iso + "T00:00:00");
  dt.setDate(dt.getDate() + delta);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getUltimoPartoBR(animal) {
  const iso = animal?.ultimo_parto;
  if (!iso) return "";
  const dt = new Date(iso);
  return Number.isNaN(dt.getTime()) ? "" : toBR(dt);
}

function mapearReproPorAnimal(lista = []) {
  const map = {};
  (lista || []).forEach((item) => {
    const id = item?.animal_id ?? item?.id;
    if (!id) return;
    map[id] = item;
  });
  return map;
}

function mesclarReproEmAnimais(animais = [], repro = []) {
  const mapRepro = mapearReproPorAnimal(repro);
  return animais.map((animal) => {
    const reproRow = mapRepro[animal?.id];
    if (!reproRow) return animal;
    const { id, animal_id, ...rest } = reproRow || {};
    return { ...animal, ...rest };
  });
}

function getDelValor(animal) {
  if (Number.isFinite(Number(animal?.del))) return Number(animal.del);
  return calcularDEL(getUltimoPartoBR(animal));
}

function normalizar(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function isLactatingAnimal(a) {
  if (!a) return false;
  if (a?.sexo === "macho") return false;
  const delValor = Number(a?.del);
  if (Number.isFinite(delValor)) return true;
  const temUltimoParto = !!a?.ultimo_parto;
  if (temUltimoParto) return true;
  const categoriaNorm = normalizar(a?.categoria);
  return categoriaNorm.includes("lact");
}

/* ===== THEME ===== */
const theme = {
  colors: {
    slate: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
    },
    brand: {
      50: "#eff6ff",
      100: "#dbeafe",
      200: "#bfdbfe",
      300: "#93c5fd",
      500: "#3b82f6",
      600: "#2563eb",
      700: "#1d4ed8",
      800: "#1e40af",
    },
    success: { 50: "#f0fdf4", 100: "#dcfce7", 200: "#bbf7d0", 500: "#22c55e", 600: "#16a34a", 700: "#15803d", 800: "#166534" },
    warning: { 50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 400: "#fbbf24", 500: "#f59e0b", 600: "#d97706", 800: "#92400e" },
    danger: { 50: "#fef2f2", 100: "#fee2e2", 200: "#fecaca", 500: "#ef4444", 600: "#dc2626" },
  },
  radius: { sm: "6px", md: "8px", lg: "12px" },
};

const Icon = ({ path, size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {path}
  </svg>
);

const Icons = {
  drop: (
    <>
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </>
  ),
  chevronDown: (
    <>
      <path d="m6 9 6 6 6-6" />
    </>
  ),
  chevronLeft: (
    <>
      <path d="m15 18-6-6 6-6" />
    </>
  ),
  chevronRight: (
    <>
      <path d="m9 18 6-6-6-6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
  save: (
    <>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </>
  ),
  plus: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </>
  ),
};

/* ===== COMPONENTES UI ===== */
const LoteHeader = ({ title, count, progress, collapsed, onToggle }) => (
  <button
    onClick={onToggle}
    style={{
      width: "100%",
      padding: "14px 20px",
      background: collapsed ? "#fff" : theme.colors.slate[100],
      border: "none",
      borderBottom: `2px solid ${theme.colors.slate[200]}`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      cursor: "pointer",
      textAlign: "left",
      fontWeight: 700,
      color: theme.colors.slate[800],
    }}
    type="button"
  >
    <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
      <div
        style={{
          transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
          transition: "transform 0.2s",
          color: theme.colors.slate[600],
          width: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon path={Icons.chevronDown} size={18} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          <span style={{ fontSize: "16px", fontWeight: 700 }}>{title}</span>
          <span
            style={{
              fontSize: "12px",
              padding: "4px 12px",
              background: collapsed ? theme.colors.slate[100] : theme.colors.slate[200],
              color: theme.colors.slate[700],
              borderRadius: "20px",
              fontWeight: 700,
            }}
          >
            {count} {count === 1 ? "animal" : "animais"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ flex: 1, height: "6px", background: theme.colors.slate[200], borderRadius: "3px", overflow: "hidden" }}>
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: progress === 100 ? theme.colors.success[500] : theme.colors.brand[500],
                borderRadius: "3px",
                transition: "width 0.3s",
              }}
            />
          </div>
          <span style={{ fontSize: "12px", color: theme.colors.slate[600], fontWeight: 700, minWidth: "36px" }}>{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  </button>
);

const OrdenhaInput = ({ value, onChange, onNext, onPrev, icon, placeholder, autoFocus, inputRef, disabled }) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      onNext?.();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onNext?.();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onPrev?.();
    }
  };

  return (
    <div style={{ position: "relative", width: 92 }}>
      <div
        style={{
          position: "absolute",
          left: "8px",
          top: "50%",
          transform: "translateY(-50%)",
          color: isFocused ? theme.colors.brand[500] : theme.colors.slate[400],
          opacity: disabled ? 0.5 : 1,
          zIndex: 2,
        }}
      >
        <Icon path={icon} size={14} />
      </div>
      <input
        ref={inputRef}
        type="number"
        step="0.1"
        value={value ?? ""}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
        style={{
          width: "100%",
          padding: "9px 8px 9px 28px",
          borderRadius: theme.radius.sm,
          border: `2px solid ${
            isFocused ? theme.colors.brand[500] : disabled ? theme.colors.slate[200] : theme.colors.slate[300]
          }`,
          fontSize: "13px",
          textAlign: "right",
          fontWeight: 800,
          fontFamily: "monospace",
          background: disabled ? theme.colors.slate[50] : "#fff",
          color: disabled ? theme.colors.slate[400] : theme.colors.slate[800],
          outline: "none",
          boxShadow: isFocused ? `0 0 0 3px ${theme.colors.brand[50]}` : "none",
          transition: "all 0.18s",
        }}
      />
    </div>
  );
};

/* ===== BOTÕES (novo padrão: leve, contorno e hover clean) ===== */
function ActionButton({ icon, children, onClick, disabled, variant = "brand", title }) {
  const [hover, setHover] = useState(false);

  const variants = {
    brand: {
      bg: "#fff",
      fg: theme.colors.brand[700],
      bd: theme.colors.brand[200],
      shadow: "0 1px 2px rgba(0,0,0,0.06)",
      hoverBg: theme.colors.brand[50],
      hoverBd: theme.colors.brand[300],
      hoverShadow: "0 6px 16px rgba(37,99,235,0.14)",
    },
    success: {
      bg: "#fff",
      fg: theme.colors.success[700],
      bd: theme.colors.success[200],
      shadow: "0 1px 2px rgba(0,0,0,0.06)",
      hoverBg: theme.colors.success[50],
      hoverBd: theme.colors.success[300] || theme.colors.success[200],
      hoverShadow: "0 6px 16px rgba(22,163,74,0.14)",
    },
    neutral: {
      bg: theme.colors.slate[100],
      fg: theme.colors.slate[700],
      bd: theme.colors.slate[300],
      shadow: "none",
      hoverBg: theme.colors.slate[50],
      hoverBd: theme.colors.slate[400],
      hoverShadow: "0 6px 16px rgba(15,23,42,0.08)",
    },
  };

  const v = variants[variant] || variants.brand;

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "11px 16px",
        borderRadius: 12,
        border: `2px solid ${hover ? v.hoverBd : v.bd}`,
        background: hover ? v.hoverBg : v.bg,
        color: v.fg,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.65 : 1,
        fontWeight: 800,
        fontSize: 14.5,
        letterSpacing: "0.01em",
        boxShadow: hover ? v.hoverShadow : v.shadow,
        transform: hover ? "translateY(-1px)" : "translateY(0)",
        transition: "all 0.16s ease",
        userSelect: "none",
      }}
    >
      {icon ? <span style={{ display: "inline-flex" }}>{icon}</span> : null}
      {children}
    </button>
  );
}

/* ===== CACHE ===== */
const LEITE_CACHE_KEY = "sc_leite_cache_v1";

function readLeiteCache() {
  if (typeof localStorage === "undefined") return { updatedAt: null, byDate: {}, lastAnimals: [], lastLotes: [] };
  try {
    const raw = localStorage.getItem(LEITE_CACHE_KEY);
    if (!raw) return { updatedAt: null, byDate: {}, lastAnimals: [], lastLotes: [] };
    const parsed = JSON.parse(raw);
    return {
      updatedAt: parsed.updatedAt || null,
      byDate: parsed.byDate || {},
      lastAnimals: Array.isArray(parsed.lastAnimals) ? parsed.lastAnimals : [],
      lastLotes: Array.isArray(parsed.lastLotes) ? parsed.lastLotes : [],
    };
  } catch {
    return { updatedAt: null, byDate: {}, lastAnimals: [], lastLotes: [] };
  }
}

function writeLeiteCache(nextCache) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(LEITE_CACHE_KEY, JSON.stringify(nextCache));
}

function updateLeiteCache({ dateISO, vacas, lotes, medicoesDia, ultimaMedicaoPorAnimal }) {
  const cacheAtual = readLeiteCache();
  const nextCache = {
    updatedAt: new Date().toISOString(),
    byDate: { ...cacheAtual.byDate, [dateISO]: { dateISO, medicoesDia: medicoesDia || [], ultimaMedicaoPorAnimal: ultimaMedicaoPorAnimal || {} } },
    lastAnimals: Array.isArray(vacas) ? vacas : cacheAtual.lastAnimals,
    lastLotes: Array.isArray(lotes) ? lotes : cacheAtual.lastLotes,
  };
  writeLeiteCache(nextCache);
  return nextCache;
}

/* ===== PÁGINA PRINCIPAL ===== */
export default function Leite() {
  const { fazendaAtualId } = useFazenda();
  const memoData = MEMO_LEITE.data || {};

  const [vacas, setVacas] = useState(() => memoData.vacas ?? []);
  const [ultimaMedicaoPorAnimal, setUltimaMedicaoPorAnimal] = useState(() => memoData.ultimaMedicaoPorAnimal ?? {});
  const [isOffline, setIsOffline] = useState(() => (typeof memoData.isOffline === "boolean" ? memoData.isOffline : !navigator.onLine));
  const [hasCache, setHasCache] = useState(() => memoData.hasCache ?? false);
  const [sincronizado, setSincronizado] = useState(() => memoData.sincronizado ?? false);
  const [reloadKey, setReloadKey] = useState(0);

  const [dataAtual, setDataAtual] = useState(() => memoData.dataAtual ?? ymdHoje());
  const [dataTabela, setDataTabela] = useState(() => memoData.dataTabela ?? null);
  const jaSetouUltimaTabelaRef = useRef(Boolean(memoData.dataTabela));

  const [medicoesPorDia, setMedicoesPorDia] = useState(() => memoData.medicoesPorDia ?? {});
  const [lotesLeite, setLotesLeite] = useState(() => memoData.lotesLeite ?? []);
  const [loadingLotes, setLoadingLotes] = useState(false);

  const [modoLancamento, setModoLancamento] = useState(false);
  const [configMedicao, setConfigMedicao] = useState({ data: ymdHoje(), tipo: "2" });
  const [medicoesLancamento, setMedicoesLancamento] = useState({});
  const [expandedLotesLancamento, setExpandedLotesLancamento] = useState({});
  const [lotesEdicaoLancamento, setLotesEdicaoLancamento] = useState({});
  const [salvandoLancamento, setSalvandoLancamento] = useState(false);
  const inputRefsLancamento = useRef({});

  const vacasLactacao = useMemo(() => vacas.filter(isLactatingAnimal), [vacas]);

  const medicoesDoDiaTabela = useMemo(() => {
    const key = dataTabela || ymdHoje();
    return medicoesPorDia[key] || {};
  }, [medicoesPorDia, dataTabela]);

  const hojeISO = useMemo(() => ymdHoje(), []);
  const dataEhPassada = useMemo(() => (dataTabela ? dataTabela < hojeISO : false), [dataTabela, hojeISO]);

  useEffect(() => {
    MEMO_LEITE.data = {
      vacas,
      ultimaMedicaoPorAnimal,
      isOffline,
      hasCache,
      sincronizado,
      dataAtual,
      dataTabela,
      medicoesPorDia,
      lotesLeite,
    };
  }, [vacas, ultimaMedicaoPorAnimal, isOffline, hasCache, sincronizado, dataAtual, dataTabela, medicoesPorDia, lotesLeite]);

  const montarMapaMedicoes = useCallback((rows, listaVacas) => {
    const mapaPorNumero = {};
    (rows || []).forEach((linha) => {
      const vaca = (listaVacas || []).find((v) => v.id === linha.animal_id);
      if (!vaca) return;
      const numeroStr = String(vaca.numero ?? "");
      mapaPorNumero[numeroStr] = {
        manha: linha.litros_manha != null ? String(linha.litros_manha) : "",
        tarde: linha.litros_tarde != null ? String(linha.litros_tarde) : "",
        terceira: linha.litros_terceira != null ? String(linha.litros_terceira) : "",
        total: linha.litros_total != null ? String(linha.litros_total) : "",
      };
    });
    return mapaPorNumero;
  }, []);

  const loadData = useCallback(
    async (dateISO) => {
      if (!dateISO) return;

      if (isOffline) {
        const cache = readLeiteCache();
        setHasCache(!!cache?.lastAnimals?.length);
        const payload = cache.byDate?.[dateISO] || {};
        setVacas(cache.lastAnimals || []);
        setLotesLeite(cache.lastLotes || []);
        setUltimaMedicaoPorAnimal(payload?.ultimaMedicaoPorAnimal || {});
        setMedicoesPorDia((prev) => ({
          ...prev,
          [dateISO]: montarMapaMedicoes(payload?.medicoesDia || [], cache.lastAnimals || []),
        }));
        return;
      }

      try {
        setLoadingLotes(true);
        const [animaisRes, reproRes, lotesRes, medicoesRes, ultimaRes] = await Promise.all([
          withFazendaId(supabase.from("animais").select("*"), fazendaAtualId),
          supabase.from("v_repro_tabela").select("*").eq("fazenda_id", fazendaAtualId).order("numero", { ascending: true }),
          withFazendaId(
            supabase
              .from("lotes")
              .select("id,nome,funcao,nivel_produtivo,ativo")
              .eq("funcao", "Lactação")
              .eq("ativo", true)
              .not("nivel_produtivo", "is", null),
            fazendaAtualId
          ).order("nome", { ascending: true }),
          withFazendaId(
            supabase.from("medicoes_leite").select("id, animal_id, data_medicao, tipo_lancamento, litros_manha, litros_tarde, litros_terceira, litros_total"),
            fazendaAtualId
          ).eq("data_medicao", dateISO),
          withFazendaId(
            supabase.from("medicoes_leite").select("animal_id, data_medicao, litros_manha, litros_tarde, litros_terceira, litros_total"),
            fazendaAtualId
          )
            .order("data_medicao", { ascending: false })
            .limit(2000),
        ]);

        const error = animaisRes.error || reproRes.error || lotesRes.error || medicoesRes.error || ultimaRes.error;
        if (error) {
          console.error("Erro:", error);
          setLoadingLotes(false);
          return;
        }

        const vacasData = mesclarReproEmAnimais(animaisRes.data || [], reproRes.data || []);
        const lotesData = lotesRes.data || [];
        const medicoesDia = medicoesRes.data || [];

        const ultimaMap = {};
        (ultimaRes.data || []).forEach((linha) => {
          if (!ultimaMap[linha.animal_id]) ultimaMap[linha.animal_id] = linha;
        });

        setVacas(vacasData);
        setLotesLeite(lotesData);
        setUltimaMedicaoPorAnimal(ultimaMap);
        setMedicoesPorDia((prev) => ({ ...prev, [dateISO]: montarMapaMedicoes(medicoesDia, vacasData) }));
        setLoadingLotes(false);
        setSincronizado(true);
        updateLeiteCache({ dateISO, vacas: vacasData, lotes: lotesData, medicoesDia, ultimaMedicaoPorAnimal: ultimaMap });
      } catch (e) {
        console.error("Erro:", e);
        setLoadingLotes(false);
      }
    },
    [fazendaAtualId, isOffline, montarMapaMedicoes]
  );

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    let ativo = true;
    (async () => {
      if (jaSetouUltimaTabelaRef.current) return;

      if (isOffline) {
        const cache = readLeiteCache();
        const dates = Object.keys(cache.byDate || {}).sort();
        const fallback = dates[dates.length - 1] || ymdHoje();
        setDataTabela(fallback);
        setDataAtual(fallback);
        jaSetouUltimaTabelaRef.current = true;
        return;
      }

      const { data } = await withFazendaId(supabase.from("medicoes_leite").select("data_medicao"), fazendaAtualId)
        .order("data_medicao", { ascending: false })
        .limit(1);

      if (!ativo) return;
      const resolved = data?.[0]?.data_medicao || ymdHoje();
      setDataTabela(resolved);
      setDataAtual(resolved);
      jaSetouUltimaTabelaRef.current = true;
    })();

    return () => {
      ativo = false;
    };
  }, [isOffline, fazendaAtualId]);

  useEffect(() => {
    if (dataTabela) loadData(dataTabela);
  }, [dataTabela, loadData, reloadKey]);

  const setDia = (iso) => {
    setModoLancamento(false);
    setMedicoesLancamento({});
    setLotesEdicaoLancamento({});
    setConfigMedicao((p) => ({ ...p, data: iso }));
    setDataTabela(iso);
    setDataAtual(iso);
  };

  const irParaAnterior = () => {
    const base = dataTabela || dataAtual || ymdHoje();
    setDia(addDaysISO(base, -1));
  };
  const irParaProxima = () => {
    const base = dataTabela || dataAtual || ymdHoje();
    setDia(addDaysISO(base, +1));
  };

  const vacasPorLote = useMemo(() => {
    const grupos = {};
    const semLote = [];

    vacasLactacao.forEach((vaca) => {
      const loteId = modoLancamento ? lotesEdicaoLancamento[String(vaca.numero)] ?? vaca.lote_id : vaca.lote_id;

      if (!loteId) semLote.push(vaca);
      else {
        if (!grupos[loteId]) grupos[loteId] = [];
        grupos[loteId].push(vaca);
      }
    });

    const resultado = Object.entries(grupos).map(([loteId, vacasDoLote]) => {
      const loteInfo = lotesLeite.find((l) => l.id === loteId) || { id: loteId, nome: `Lote ${String(loteId).slice(0, 8)}` };
      return { ...loteInfo, value: loteId, vacas: vacasDoLote };
    });

    if (semLote.length > 0) resultado.push({ value: "sem_lote", label: "Sem Lote Definido", vacas: semLote });

    return resultado.sort((a, b) => String(a.nome || a.label).localeCompare(String(b.nome || b.label)));
  }, [vacasLactacao, lotesLeite, modoLancamento, lotesEdicaoLancamento]);

  const iniciarNovaMedicao = () => {
    const dia = dataTabela || ymdHoje();
    setModoLancamento(true);
    setConfigMedicao({ data: dia, tipo: "2" });
    setMedicoesLancamento({});
    setLotesEdicaoLancamento({});
    const exp = {};
    vacasPorLote.forEach((l) => (exp[l.value] = true));
    setExpandedLotesLancamento(exp);
  };

  const cancelarLancamento = () => {
    setModoLancamento(false);
    setMedicoesLancamento({});
    setLotesEdicaoLancamento({});
  };

  const handleChangeLancamento = (numero, campo, valor) => {
    const numStr = String(numero);
    setMedicoesLancamento((prev) => {
      const antigo = prev[numStr] || {};
      const atualizado = { ...antigo, [campo]: valor };
      if (configMedicao.tipo !== "total" && ["manha", "tarde", "terceira"].includes(campo)) {
        const m = campo === "manha" ? toNum(valor) : toNum(antigo.manha);
        const t = campo === "tarde" ? toNum(valor) : toNum(antigo.tarde);
        const c = campo === "terceira" ? toNum(valor) : toNum(antigo.terceira);
        atualizado.total = (m + t + c).toFixed(1);
      }
      return { ...prev, [numStr]: atualizado };
    });
  };

  const handleChangeLoteLancamento = (numero, loteId) => {
    setLotesEdicaoLancamento((prev) => ({
      ...prev,
      [String(numero)]: loteId,
    }));
  };

  const focusNextLancamento = (currentId) => {
    const ids = Object.keys(inputRefsLancamento.current).sort();
    const idx = ids.indexOf(currentId);
    if (idx >= 0 && idx < ids.length - 1) {
      const next = ids[idx + 1];
      inputRefsLancamento.current[next]?.focus();
      inputRefsLancamento.current[next]?.select?.();
    }
  };

  const salvarLancamento = async () => {
    if (!fazendaAtualId || isOffline) {
      alert("Sem conexão ou fazenda não selecionada");
      return;
    }
    setSalvandoLancamento(true);

    try {
      // 1) Atualiza lotes alterados primeiro
      const lotesAlterados = Object.entries(lotesEdicaoLancamento);
      if (lotesAlterados.length > 0) {
        const updates = lotesAlterados
          .map(([numeroStr, loteId]) => {
            const vaca = vacasLactacao.find((v) => String(v.numero) === numeroStr);
            if (!vaca) return null;
            return withFazendaId(supabase.from("animais").update({ lote_id: loteId || null }), fazendaAtualId).eq("id", vaca.id);
          })
          .filter(Boolean);

        if (updates.length > 0) {
          await Promise.all(updates);
          setVacas((prev) =>
            prev.map((v) => {
              const numStr = String(v.numero);
              if (numStr in lotesEdicaoLancamento) {
                return { ...v, lote_id: lotesEdicaoLancamento[numStr] || null };
              }
              return v;
            })
          );
        }
      }

      // 2) Salva medições
      const rows = [];
      Object.entries(medicoesLancamento).forEach(([numeroStr, dados]) => {
        const vaca = vacasLactacao.find((v) => String(v.numero) === numeroStr);
        if (!vaca) return;

        const total =
          configMedicao.tipo === "total"
            ? toNum(dados.total)
            : toNum(dados.manha) + toNum(dados.tarde) + toNum(dados.terceira);

        if (total === 0) return;

        rows.push({
          animal_id: vaca.id,
          data_medicao: configMedicao.data,
          tipo_lancamento: configMedicao.tipo,
          litros_manha: configMedicao.tipo !== "total" ? (toNum(dados.manha) || null) : null,
          litros_tarde: configMedicao.tipo !== "total" ? (toNum(dados.tarde) || null) : null,
          litros_terceira: configMedicao.tipo === "3" ? (toNum(dados.terceira) || null) : null,
          litros_total: configMedicao.tipo === "total" ? total : total > 0 ? total : null,
          fazenda_id: fazendaAtualId,
        });
      });

      if (rows.length > 0) {
        const { error } = await withFazendaId(
          supabase.from("medicoes_leite").upsert(rows, { onConflict: ["animal_id", "data_medicao"] }),
          fazendaAtualId
        );
        if (error) throw error;
        alert(`${rows.length} medições salvas!`);
      } else if (lotesAlterados.length === 0) {
        alert("Nenhuma medição preenchida.");
      }

      setModoLancamento(false);
      setMedicoesLancamento({});
      setLotesEdicaoLancamento({});
      setDia(configMedicao.data);
      setReloadKey((k) => k + 1);
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar");
    }

    setSalvandoLancamento(false);
  };

  const resumoDia = useMemo(() => {
    let producaoTotal = 0,
      melhor = null,
      pior = null,
      qtdComMedicao = 0;

    vacasLactacao.forEach((vaca) => {
      const dados = medicoesDoDiaTabela[String(vaca.numero ?? "")] || {};
      const total =
        dados.total !== undefined && dados.total !== ""
          ? toNum(dados.total)
          : toNum(dados.manha) + toNum(dados.tarde) + toNum(dados.terceira);

      if (total > 0) {
        producaoTotal += total;
        qtdComMedicao++;
        if (!melhor || total > melhor.total) melhor = { vaca, total };
        if (!pior || total < pior.total) pior = { vaca, total };
      }
    });

    return {
      producaoTotal: producaoTotal.toFixed(1),
      mediaPorVaca: (vacasLactacao.length > 0 ? producaoTotal / vacasLactacao.length : 0).toFixed(1),
      melhor,
      pior,
      qtdComMedicao,
    };
  }, [vacasLactacao, medicoesDoDiaTabela]);

  // Opções para o select de lotes
  const lotesOptions = useMemo(() => {
    return [{ value: null, label: "Sem lote", isFixed: true }, ...lotesLeite.map((l) => ({ value: l.id, label: l.nome }))];
  }, [lotesLeite]);

  // Grid mais elástico (ocupa melhor a direita)
  const getGridColumns = () => {
    const animal = "minmax(170px, 1.2fr)";
    const del = "60px";
    const manha = "minmax(90px, 120px)";
    const tarde = "minmax(90px, 120px)";
    const terceira = "minmax(90px, 120px)";
    const total = "minmax(95px, 130px)";
    const lote = "minmax(320px, 2fr)";
    const indicador = "36px";

    if (modoLancamento) {
      if (configMedicao.tipo === "3") return `${animal} ${del} ${manha} ${tarde} ${terceira} ${total} ${lote} ${indicador}`;
      if (configMedicao.tipo === "total") return `${animal} ${del} ${total} ${lote} ${indicador}`;
      return `${animal} ${del} ${manha} ${tarde} ${total} ${lote} ${indicador}`; // tipo 2
    }
    return `${animal} ${del} ${manha} ${tarde} ${total} ${lote}`;
  };

  return (
    <div className="w-full px-6 py-4 font-sans">
      {/* STATUS (pequeno e discreto no topo) */}
      <div style={{ fontSize: 12, color: theme.colors.slate[500], marginBottom: 16, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: isOffline ? theme.colors.danger[500] : theme.colors.success[500],
            display: "inline-block",
          }}
        />
        {isOffline ? `Offline. ${hasCache ? "Usando cache." : "Sem cache."}` : "Online. Dados atualizados."}
        <span style={{ color: theme.colors.slate[300] }}>•</span>
        {loadingLotes ? "Carregando..." : `${lotesLeite.length} lotes`}
        <span style={{ color: theme.colors.slate[300] }}>•</span>
        {(dataTabela || ymdHoje()).split("-").reverse().join("/")}
        {dataEhPassada && <span style={{ color: theme.colors.warning[600], fontWeight: 700 }}>(passado)</span>}
      </div>

      {/* CONFIGURAÇÃO NOVA MEDIÇÃO */}
      {modoLancamento && (
        <div
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: 12,
            border: `2px solid ${theme.colors.brand[200]}`,
            marginBottom: 24,
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 900, color: theme.colors.slate[600], marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Data da Medição
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon path={Icons.calendar} size={16} />
                <input
                  type="date"
                  value={configMedicao.data}
                  onChange={(e) => setConfigMedicao((p) => ({ ...p, data: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: 10, border: `2px solid ${theme.colors.slate[300]}`, fontSize: 14, fontWeight: 800, color: theme.colors.slate[800] }}
                />
              </div>
            </div>

            <div style={{ minWidth: 280 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 900, color: theme.colors.slate[600], marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Tipo de Lançamento
              </label>
              <Select
                value={[
                  { value: "total", label: "Total diário" },
                  { value: "2", label: "2 ordenhas (manhã + tarde)" },
                  { value: "3", label: "3 ordenhas" },
                ].find((o) => o.value === configMedicao.tipo)}
                onChange={(opt) => setConfigMedicao((p) => ({ ...p, tipo: opt?.value || "2" }))}
                options={[
                  { value: "total", label: "Total diário (único valor)" },
                  { value: "2", label: "2 ordenhas (manhã + tarde)" },
                  { value: "3", label: "3 ordenhas (manhã + tarde + noite)" },
                ]}
                styles={{
                  control: (b) => ({
                    ...b,
                    minHeight: 40,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: theme.colors.slate[300],
                    boxShadow: "none",
                    fontWeight: 800,
                  }),
                  option: (b, s) => ({
                    ...b,
                    fontWeight: s.isSelected ? 900 : 600,
                    background: s.isSelected ? theme.colors.brand[100] : b.background,
                    color: s.isSelected ? theme.colors.brand[800] : b.color,
                  }),
                }}
              />
            </div>

            <div
              style={{
                padding: "10px 14px",
                background: theme.colors.brand[50],
                borderRadius: 12,
                color: theme.colors.brand[700],
                fontSize: 13,
                fontWeight: 900,
                border: `2px solid ${theme.colors.brand[200]}`,
              }}
            >
              {vacasLactacao.length} animais em lactação
            </div>
          </div>
        </div>
      )}

      {/* CARDS RESUMO */}
      <ResumoLeiteDia resumoDia={resumoDia} qtdLactacao={vacasLactacao.length} />

      {/* TOOLBAR - ABAIXO DOS CARDS */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginTop: 24,
          marginBottom: 24,
          padding: "14px 16px",
          background: "#fff",
          borderRadius: 14,
          border: `1px solid ${theme.colors.slate[200]}`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {!modoLancamento ? (
            <ActionButton
              variant="brand"
              onClick={iniciarNovaMedicao}
              icon={<Icon path={Icons.plus} size={18} />}
              title="Iniciar lançamento de medições"
            >
              Nova Medição
            </ActionButton>
          ) : (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <ActionButton variant="neutral" onClick={cancelarLancamento} icon={null}>
                Cancelar
              </ActionButton>

              <ActionButton
                variant="success"
                onClick={salvarLancamento}
                disabled={salvandoLancamento}
                icon={<Icon path={Icons.save} size={18} />}
              >
                {salvandoLancamento ? "Salvando..." : "Confirmar Medições"}
              </ActionButton>
            </div>
          )}
        </div>

        {/* Navegação de datas */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={irParaAnterior}
            title="Dia anterior"
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              border: `2px solid ${theme.colors.slate[200]}`,
              background: "#fff",
              color: theme.colors.slate[600],
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = theme.colors.brand[300];
              e.currentTarget.style.color = theme.colors.brand[600];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = theme.colors.slate[200];
              e.currentTarget.style.color = theme.colors.slate[600];
            }}
          >
            <Icon path={Icons.chevronLeft} size={20} />
          </button>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 150 }}>
            <span style={{ fontSize: 10, color: theme.colors.slate[500], fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
              Data Selecionada
            </span>
            <input
              type="date"
              value={dataAtual}
              onChange={(e) => setDia(e.target.value)}
              style={{
                height: 40,
                padding: "0 12px",
                borderRadius: 12,
                border: `2px solid ${theme.colors.slate[200]}`,
                fontWeight: 900,
                fontSize: 14,
                color: theme.colors.slate[800],
                textAlign: "center",
                fontFamily: "inherit",
              }}
            />
          </div>

          <button
            type="button"
            onClick={irParaProxima}
            title="Próximo dia"
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              border: `2px solid ${theme.colors.slate[200]}`,
              background: "#fff",
              color: theme.colors.slate[600],
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = theme.colors.brand[300];
              e.currentTarget.style.color = theme.colors.brand[600];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = theme.colors.slate[200];
              e.currentTarget.style.color = theme.colors.slate[600];
            }}
          >
            <Icon path={Icons.chevronRight} size={20} />
          </button>
        </div>
      </div>

      {/* TABELA (AGORA OCUPA MAIS A DIREITA) */}
      <div
        style={{
          marginBottom: 32,
          width: "100%",
          maxWidth: 1700, // <-- aumenta pra usar melhor telas largas (ajuste se quiser)
          margin: "0 auto 32px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {vacasPorLote.map((lote, loteIdx) => {
            const isExpanded = expandedLotesLancamento[lote.value] !== false;

            const vacasComDados = lote.vacas.filter((v) => {
              const numStr = String(v.numero);
              const dados = modoLancamento ? medicoesLancamento[numStr] || {} : medicoesDoDiaTabela[numStr] || {};
              const total =
                dados.total !== undefined && dados.total !== ""
                  ? toNum(dados.total)
                  : toNum(dados.manha) + toNum(dados.tarde) + toNum(dados.terceira);
              return total > 0;
            }).length;

            const progresso = lote.vacas.length > 0 ? (vacasComDados / lote.vacas.length) * 100 : 0;

            return (
              <div
                key={lote.value}
                style={{
                  background: "#fff",
                  borderRadius: 14,
                  border: `1px solid ${theme.colors.slate[200]}`,
                  overflow: "hidden",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
                }}
              >
                <LoteHeader
                  title={lote.nome || lote.label}
                  count={lote.vacas.length}
                  progress={progresso}
                  collapsed={!isExpanded}
                  onToggle={() => setExpandedLotesLancamento((p) => ({ ...p, [lote.value]: !isExpanded }))}
                />

                {isExpanded && (
                  <div style={{ padding: 0 }}>
                    {/* Headers */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: getGridColumns(),
                        gap: 12,
                        padding: "12px 18px",
                        background: theme.colors.slate[100],
                        borderBottom: `2px solid ${theme.colors.slate[200]}`,
                        fontSize: 11,
                        fontWeight: 900,
                        color: theme.colors.slate[600],
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      <div>Animal</div>
                      <div style={{ textAlign: "center" }}>DEL</div>

                      {(!modoLancamento || configMedicao.tipo !== "total") && (
                        <>
                          <div style={{ textAlign: "right" }}>Manhã</div>
                          <div style={{ textAlign: "right" }}>Tarde</div>
                        </>
                      )}

                      {modoLancamento && configMedicao.tipo === "3" && <div style={{ textAlign: "right" }}>3ª</div>}
                      {modoLancamento && configMedicao.tipo === "total" && <div style={{ textAlign: "right" }}>Total</div>}
                      {(!modoLancamento || configMedicao.tipo !== "total") && <div style={{ textAlign: "right" }}>Total</div>}

                      <div>Lote / Última Med.</div>
                      {modoLancamento && <div style={{ textAlign: "center" }} />}
                    </div>

                    {/* Rows */}
                    {lote.vacas.map((vaca, idx) => {
                      const numStr = String(vaca.numero);
                      const dados = modoLancamento ? medicoesLancamento[numStr] || {} : medicoesDoDiaTabela[numStr] || {};
                      const del = getDelValor(vaca);

                      // Cálculo do total
                      let totalCalc = 0;
                      if (modoLancamento && configMedicao.tipo === "total") {
                        totalCalc = toNum(dados.total);
                      } else {
                        totalCalc = toNum(dados.manha) + toNum(dados.tarde) + (modoLancamento && configMedicao.tipo === "3" ? toNum(dados.terceira) : 0);
                      }
                      const totalExibir =
                        dados.total !== undefined && dados.total !== ""
                          ? String(dados.total)
                          : totalCalc > 0
                          ? totalCalc.toFixed(1)
                          : "";

                      const baseKey = `${lote.value}-${idx}`;
                      const temAlgo = totalCalc > 0;

                      const ultimaRegistro = ultimaMedicaoPorAnimal?.[vaca.id];
                      const ultimaMedBR = ultimaRegistro?.data_medicao ? formatISOToBR(ultimaRegistro.data_medicao) : "—";

                      const loteAtual = modoLancamento ? lotesEdicaoLancamento[numStr] ?? vaca.lote_id : vaca.lote_id;
                      const nomeLoteAtual = lotesLeite.find((l) => l.id === loteAtual)?.nome || "Sem lote";
                      const loteFoiAlterado = modoLancamento && loteAtual !== vaca.lote_id;

                      return (
                        <div
                          key={vaca.id}
                          style={{
                            display: "grid",
                            gridTemplateColumns: getGridColumns(),
                            gap: 12,
                            alignItems: "center",
                            padding: "12px 18px",
                            background: temAlgo ? theme.colors.success[50] : idx % 2 === 0 ? "#fff" : theme.colors.slate[50],
                            borderBottom: `1px solid ${theme.colors.slate[200]}`,
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            if (modoLancamento) e.currentTarget.style.background = theme.colors.brand[50];
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = temAlgo ? theme.colors.success[50] : idx % 2 === 0 ? "#fff" : theme.colors.slate[50];
                          }}
                        >
                          {/* Animal */}
                          <div
                            style={{
                              borderLeft: `3px solid ${temAlgo ? theme.colors.success[500] : theme.colors.warning[500]}`,
                              paddingLeft: 10,
                              display: "flex",
                              flexDirection: "column",
                            }}
                          >
                            <span style={{ fontWeight: 900, fontFamily: "monospace", fontSize: 15, color: theme.colors.slate[900] }}>#{vaca.numero}</span>
                            {vaca.brinco && <span style={{ fontSize: 11, color: theme.colors.slate[500], fontWeight: 700 }}>Brinco {vaca.brinco}</span>}
                          </div>

                          {/* DEL */}
                          <div style={{ textAlign: "center" }}>
                            <span
                              style={{
                                fontFamily: "monospace",
                                fontSize: 12,
                                fontWeight: 900,
                                color: del > 400 ? theme.colors.danger[600] : del > 305 ? theme.colors.warning[600] : theme.colors.success[600],
                                background: del > 400 ? theme.colors.danger[100] : del > 305 ? theme.colors.warning[100] : theme.colors.success[100],
                                padding: "3px 10px",
                                borderRadius: 999,
                                border: `2px solid ${
                                  del > 400 ? theme.colors.danger[200] : del > 305 ? theme.colors.warning[200] : theme.colors.success[200]
                                }`,
                              }}
                            >
                              {del}
                            </span>
                          </div>

                          {/* Inputs ou displays */}
                          {(!modoLancamento || configMedicao.tipo !== "total") && (
                            <>
                              <OrdenhaInput
                                icon={Icons.drop}
                                placeholder="0,0"
                                value={dados.manha}
                                disabled={!modoLancamento}
                                onChange={(e) => handleChangeLancamento(numStr, "manha", e.target.value)}
                                onNext={() => focusNextLancamento(`${baseKey}-manha`)}
                                inputRef={(el) => {
                                  if (el) inputRefsLancamento.current[`${baseKey}-manha`] = el;
                                }}
                                autoFocus={modoLancamento && loteIdx === 0 && idx === 0}
                              />
                              <OrdenhaInput
                                icon={Icons.clock}
                                placeholder="0,0"
                                value={dados.tarde}
                                disabled={!modoLancamento}
                                onChange={(e) => handleChangeLancamento(numStr, "tarde", e.target.value)}
                                onNext={() => focusNextLancamento(`${baseKey}-tarde`)}
                                inputRef={(el) => {
                                  if (el) inputRefsLancamento.current[`${baseKey}-tarde`] = el;
                                }}
                              />
                            </>
                          )}

                          {modoLancamento && configMedicao.tipo === "3" && (
                            <OrdenhaInput
                              icon={Icons.clock}
                              placeholder="0,0"
                              value={dados.terceira}
                              disabled={!modoLancamento}
                              onChange={(e) => handleChangeLancamento(numStr, "terceira", e.target.value)}
                              onNext={() => focusNextLancamento(`${baseKey}-terceira`)}
                              inputRef={(el) => {
                                if (el) inputRefsLancamento.current[`${baseKey}-terceira`] = el;
                              }}
                            />
                          )}

                          {/* Total */}
                          <div>
                            {modoLancamento && configMedicao.tipo === "total" ? (
                              <OrdenhaInput
                                icon={Icons.drop}
                                placeholder="0,0"
                                value={dados.total}
                                onChange={(e) => handleChangeLancamento(numStr, "total", e.target.value)}
                                onNext={() => focusNextLancamento(`${baseKey}-total`)}
                                inputRef={(el) => {
                                  if (el) inputRefsLancamento.current[`${baseKey}-total`] = el;
                                }}
                              />
                            ) : (
                              <input
                                type="number"
                                value={totalExibir}
                                readOnly
                                style={{
                                  width: "100%",
                                  padding: "9px 10px",
                                  borderRadius: 10,
                                  border: `2px solid ${toNum(totalExibir) > 0 ? theme.colors.success[500] : theme.colors.slate[200]}`,
                                  fontSize: 13,
                                  textAlign: "right",
                                  fontWeight: 900,
                                  fontFamily: "monospace",
                                  background: toNum(totalExibir) > 0 ? theme.colors.success[50] : theme.colors.slate[50],
                                  color: toNum(totalExibir) > 0 ? theme.colors.success[800] : theme.colors.slate[400],
                                  opacity: modoLancamento ? 0.85 : 1,
                                }}
                              />
                            )}
                          </div>

                          {/* Lote / Última (layout em 2 colunas internas pra “usar” a direita) */}
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "minmax(160px, 1fr) auto",
                              gap: 10,
                              alignItems: "center",
                              minWidth: 0,
                            }}
                          >
                            <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                              {modoLancamento ? (
                                <Select
                                  value={lotesOptions.find((opt) => opt.value === loteAtual) || lotesOptions[0]}
                                  onChange={(opt) => handleChangeLoteLancamento(numStr, opt?.value)}
                                  options={lotesOptions}
                                  isSearchable={false}
                                  styles={{
                                    container: (b) => ({ ...b, width: "100%" }),
                                    control: (b) => ({
                                      ...b,
                                      minHeight: 36,
                                      borderRadius: 10,
                                      borderWidth: 2,
                                      borderColor: loteFoiAlterado ? theme.colors.warning[400] : theme.colors.slate[300],
                                      background: loteFoiAlterado ? theme.colors.warning[50] : "#fff",
                                      boxShadow: "none",
                                    }),
                                    valueContainer: (b) => ({ ...b, padding: "0 10px" }),
                                    singleValue: (b) => ({
                                      ...b,
                                      fontSize: 12,
                                      fontWeight: 900,
                                      color: loteFoiAlterado ? theme.colors.warning[800] : theme.colors.slate[700],
                                    }),
                                    option: (b, s) => ({ ...b, fontSize: 12, fontWeight: s.isSelected ? 900 : 600 }),
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 900,
                                    color: theme.colors.slate[700],
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    padding: "4px 0",
                                  }}
                                >
                                  {nomeLoteAtual}
                                </div>
                              )}
                            </div>

                            <div style={{ fontSize: 11, color: theme.colors.slate[500], fontWeight: 800, whiteSpace: "nowrap" }}>
                              Última: <strong style={{ color: theme.colors.slate[700] }}>{ultimaMedBR}</strong>
                            </div>
                          </div>

                          {/* Indicador de mudança */}
                          {modoLancamento && loteFoiAlterado && (
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                background: theme.colors.warning[100],
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: `2px solid ${theme.colors.warning[300]}`,
                                margin: "0 auto",
                              }}
                              title="Lote será alterado ao salvar"
                            >
                              <Icon path={Icons.arrowRight} size={14} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 16,
            padding: 14,
            background: theme.colors.slate[100],
            borderRadius: 12,
            fontSize: 12,
            color: theme.colors.slate[600],
            border: `1px solid ${theme.colors.slate[200]}`,
            maxWidth: 900,
          }}
        >
          <strong style={{ color: theme.colors.slate[800] }}>Dica:</strong> Use{" "}
          <kbd
            style={{
              background: "#fff",
              padding: "2px 6px",
              borderRadius: 6,
              border: `1px solid ${theme.colors.slate[300]}`,
              fontFamily: "monospace",
              fontWeight: 900,
            }}
          >
            Tab
          </kbd>{" "}
          ou{" "}
          <kbd
            style={{
              background: "#fff",
              padding: "2px 6px",
              borderRadius: 6,
              border: `1px solid ${theme.colors.slate[300]}`,
              fontFamily: "monospace",
              fontWeight: 900,
            }}
          >
            Enter
          </kbd>{" "}
          para navegar entre os campos rapidamente.
          {modoLancamento && <span style={{ marginLeft: 8, color: theme.colors.warning[600], fontWeight: 900 }}>• Lotes alterados são salvos junto com as medições</span>}
        </div>
      </div>
    </div>
  );
}
