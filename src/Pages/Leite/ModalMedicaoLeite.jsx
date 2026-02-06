import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Select from "react-select";
import { supabase } from "../../lib/supabaseClient";
import { useFazenda } from "../../context/FazendaContext";

/* =========================================================
   DESIGN SYSTEM ATUALIZADO (Enterprise + Vivo)
   ========================================================= */
const theme = {
  colors: {
    slate: {
      50: "#f8fafc", 100: "#f1f5f9", 200: "#e2e8f0", 300: "#cbd5e1",
      400: "#94a3b8", 500: "#64748b", 600: "#475569", 700: "#334155",
      800: "#1e293b", 900: "#0f172a",
    },
    // Cores com mais vida mas profissionais
    brand: {
      50: "#eff6ff", 100: "#dbeafe", 500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8",
    },
    success: { 50: "#f0fdf4", 500: "#22c55e", 600: "#16a34a" },
    warning: { 50: "#fffbeb", 500: "#f59e0b", 600: "#d97706" },
    danger: { 50: "#fef2f2", 500: "#ef4444", 600: "#dc2626" },
    accent: "#6366f1", // Indigo vibrante
  },
  shadows: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  },
  radius: { sm: "6px", md: "10px", lg: "16px", xl: "20px" },
};

/* Ícones mais expressivos */
const Icon = ({ path, size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" 
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {path}
  </svg>
);

const Icons = {
  close: <><path d="M18 6 6 18M6 6l12 12"/></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  chevronLeft: <><path d="m15 18-6-6 6-6"/></>,
  chevronRight: <><path d="m9 18 6-6-6-6"/></>,
  chevronDown: <><path d="m6 9 6 6 6-6"/></>,
  drop: <><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></>,
  chart: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
  clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  alert: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
  check: <><polyline points="20 6 9 17 4 12"/></>,
  cow: <><path d="M12 8c-1.5 0-2.5 1-3 2s-2 1.5-3 2c-1 .5-2 .5-3 0-1-.5-1.5-1.5-1-2.5.5-1 2-1.5 3-1.5s2.5.5 3.5 1.5c.5.5 1.5.5 2 0 .5-.5 1.5-.5 2 0s1.5.5 2 0c.5-.5 1.5-.5 2 0"/></>, // Simplificado
  filter: <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
  arrowRight: <><path d="M5 12h14M12 5l7 7-7 7"/></>,
  save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>,
};

/* =========================================================
   HELPERS (mantidos)
   ========================================================= */
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

function calcularDEL(partoBR) {
  const dt = parseBR(partoBR);
  if (!dt) return 0;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  dt.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((hoje - dt) / 86400000));
}

function getDelValor(animal) {
  if (Number.isFinite(Number(animal?.del))) return Number(animal.del);
  const iso = animal?.ultimo_parto;
  if (!iso) return 0;
  const dt = new Date(iso);
  return Number.isNaN(dt.getTime()) ? 0 : calcularDEL(toBR(dt));
}

function addDaysISO(iso, delta) {
  if (!iso) return iso;
  const dt = new Date(iso + "T00:00:00");
  dt.setDate(dt.getDate() + delta);
  return dt.toISOString().split('T')[0];
}

/* =========================================================
   COMPONENTES UI APRIMORADOS
   ========================================================= */

// Card de métrica com animação e cor condicional
const MetricCard = ({ label, value, subtext, icon, color = "blue", animate = false }) => {
  const colorMap = {
    blue: { bg: theme.colors.brand[50], text: theme.colors.brand[600], border: theme.colors.brand[100] },
    green: { bg: theme.colors.success[50], text: theme.colors.success[600], border: theme.colors.success[50] },
    amber: { bg: theme.colors.warning[50], text: theme.colors.warning[600], border: theme.colors.warning[50] },
    red: { bg: theme.colors.danger[50], text: theme.colors.danger[600], border: theme.colors.danger[50] },
    slate: { bg: theme.colors.slate[50], text: theme.colors.slate[600], border: theme.colors.slate[200] },
  };
  
  const c = colorMap[color];
  
  return (
    <div style={{
      padding: "20px",
      background: "#fff",
      borderRadius: theme.radius.md,
      border: `1px solid ${c.border}`,
      boxShadow: theme.shadows.sm,
      display: "flex",
      alignItems: "flex-start",
      gap: "14px",
      flex: 1,
      minWidth: "180px",
      transition: "all 0.3s ease",
      transform: animate ? "scale(1.02)" : "scale(1)",
    }}>
      <div style={{
        padding: "10px",
        background: c.bg,
        borderRadius: theme.radius.sm,
        color: c.text,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Icon path={icon} size={20} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "12px", fontWeight: 600, color: theme.colors.slate[500], marginBottom: "4px" }}>
          {label}
        </div>
        <div style={{ 
          fontSize: "28px", 
          fontWeight: 700, 
          color: theme.colors.slate[800],
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}>
          {value}
        </div>
        {subtext && (
          <div style={{ fontSize: "12px", color: theme.colors.slate[400], marginTop: "6px", fontWeight: 500 }}>
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
};

// Header de lote com barra de progresso
const LoteHeader = ({ title, count, progress, collapsed, onToggle }) => (
  <button
    onClick={onToggle}
    style={{
      width: "100%",
      padding: "18px 20px",
      background: collapsed ? "#fff" : theme.colors.slate[50],
      border: "none",
      borderBottom: collapsed ? `1px solid ${theme.colors.slate[100]}` : "none",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      cursor: "pointer",
      textAlign: "left",
      transition: "all 0.2s",
    }}
    type="button"
  >
    <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
      <div style={{
        transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        color: theme.colors.slate[400],
      }}>
        <Icon path={Icons.chevronDown} size={18} />
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <span style={{ fontSize: "15px", fontWeight: 600, color: theme.colors.slate[800] }}>
            {title}
          </span>
          <span style={{
            fontSize: "11px",
            padding: "3px 10px",
            background: theme.colors.slate[100],
            color: theme.colors.slate[600],
            borderRadius: "20px",
            fontWeight: 600,
          }}>
            {count} animais
          </span>
        </div>
        
        {/* Barra de progresso do lote */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            flex: 1,
            height: "4px",
            background: theme.colors.slate[200],
            borderRadius: "2px",
            overflow: "hidden",
          }}>
            <div style={{
              width: `${progress}%`,
              height: "100%",
              background: progress === 100 ? theme.colors.success[500] : theme.colors.brand[500],
              borderRadius: "2px",
              transition: "width 0.5s ease",
            }} />
          </div>
          <span style={{ fontSize: "11px", color: theme.colors.slate[500], fontWeight: 500, minWidth: "32px" }}>
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    </div>
  </button>
);

// Input de ordenha com navegação por teclado
const OrdenhaInput = ({ 
  value, 
  onChange, 
  onNext, 
  onPrev,
  placeholder, 
  icon, 
  inputRef,
  label,
  autoFocus 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      onNext?.();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onNext?.();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      onPrev?.();
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <div style={{
        position: "absolute",
        left: "10px",
        top: "50%",
        transform: "translateY(-50%)",
        color: isFocused ? theme.colors.brand[500] : theme.colors.slate[400],
        transition: "color 0.2s",
        pointerEvents: "none",
      }}>
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
        style={{
          width: "100%",
          padding: "10px 10px 10px 34px",
          borderRadius: theme.radius.sm,
          border: `2px solid ${isFocused ? theme.colors.brand[500] : theme.colors.slate[200]}`,
          fontSize: "14px",
          textAlign: "right",
          fontWeight: 600,
          fontFamily: "monospace",
          background: "#fff",
          color: theme.colors.slate[800],
          outline: "none",
          transition: "all 0.2s",
          boxShadow: isFocused ? `0 0 0 3px ${theme.colors.brand[50]}` : "none",
        }}
      />
      {label && (
        <div style={{
          position: "absolute",
          right: "8px",
          top: "-8px",
          fontSize: "9px",
          fontWeight: 700,
          color: theme.colors.slate[400],
          background: "#fff",
          padding: "0 4px",
          textTransform: "uppercase",
        }}>
          {label}
        </div>
      )}
    </div>
  );
};

/* =========================================================
   COMPONENTE PRINCIPAL REFATORADO
   ========================================================= */
const opcoesTipoLancamento = [
  { value: "total", label: "Total diário" },
  { value: "2", label: "2 ordenhas (manhã + tarde)" },
  { value: "3", label: "3 ordenhas" },
];

export default function ModalMedicaoLeite({
  aberto,
  dataInicial,
  vacas = [],
  medicoesIniciais = {},
  onFechar,
  onSalvar,
}) {
  const { fazendaAtualId } = useFazenda();

  const [dataMedicao, setDataMedicao] = useState(dataInicial);
  const [tipoLancamento, setTipoLancamento] = useState("2");
  const [medicoes, setMedicoes] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [activeInput, setActiveInput] = useState(null); // Rastrea input focado

  const inputRefs = useRef({});
  const loteCacheRef = useRef({});
  const [lotesLeite, setLotesLeite] = useState([]);
  const [loadingLotes, setLoadingLotes] = useState(false);
  const [modoEdicaoPassado, setModoEdicaoPassado] = useState(false);
  const [expandedLotes, setExpandedLotes] = useState({});

  // Inicialização
  useEffect(() => {
    if (!aberto) return;
    setDataMedicao(dataInicial);

    const base = {};
    Object.entries(medicoesIniciais || {}).forEach(([k, v]) => {
      const numeroStr = String(k);
      base[numeroStr] = { ...(v || {}) };
      if (base[numeroStr]?.lote_id) {
        loteCacheRef.current[numeroStr] = base[numeroStr].lote_id;
      }
    });

    (vacas || []).forEach((v) => {
      const numeroStr = String(v.numero ?? "");
      if (!base[numeroStr]) base[numeroStr] = {};
      if (!base[numeroStr].lote_id) base[numeroStr].lote_id = v?.lote_id || "";
    });

    setMedicoes(base);
    
    // Expandir todos por padrão
    const allExpanded = {};
    vacas.forEach(v => {
      const loteId = base[String(v.numero)]?.lote_id || v.lote_id || "sem_lote";
      allExpanded[loteId] = true;
    });
    setExpandedLotes(allExpanded);
  }, [aberto, dataInicial, medicoesIniciais, vacas]);

  // Carregar lotes
  useEffect(() => {
    if (!aberto || !fazendaAtualId) return;
    let mounted = true;
    
    (async () => {
      setLoadingLotes(true);
      const { data, error } = await supabase
        .from("lotes")
        .select("id,nome,nivel_produtivo")
        .eq("fazenda_id", fazendaAtualId)
        .order("nome");
        
      if (!error && mounted) setLotesLeite(data || []);
      setLoadingLotes(false);
    })();
    
    return () => { mounted = false; };
  }, [aberto, fazendaAtualId]);

  const hojeISO = useMemo(() => new Date().toISOString().split('T')[0], []);
  const dataEhPassada = useMemo(() => dataMedicao < hojeISO, [dataMedicao, hojeISO]);
  const bloquearLote = dataEhPassada && !modoEdicaoPassado;

  const calcularTotal = useCallback(({ manha, tarde, terceira }) => {
    const m = toNum(manha), t = toNum(tarde), c = toNum(terceira);
    if (tipoLancamento === "3") return (m + t + c).toFixed(1);
    if (tipoLancamento === "2") return (m + t).toFixed(1);
    return "";
  }, [tipoLancamento]);

  const vacasPorLote = useMemo(() => {
    const grupos = {};
    const semLote = [];

    (vacas || []).forEach((vaca) => {
      const numeroStr = String(vaca.numero ?? "");
      const dados = medicoes[numeroStr] || {};
      const loteId = dados.lote_id || vaca.lote_id;

      if (!loteId) semLote.push(vaca);
      else {
        if (!grupos[loteId]) grupos[loteId] = [];
        grupos[loteId].push(vaca);
      }
    });

    const lotesOptions = lotesLeite.map((l) => ({
      value: l.id,
      label: l.nome,
      nivel: l.nivel_produtivo,
    }));

    const resultado = Object.entries(grupos).map(([loteId, vacasDoLote]) => {
      const loteInfo = lotesOptions.find((l) => l.value === loteId) || {
        value: loteId,
        label: `Lote ${String(loteId).slice(0, 8)}`,
        nivel: "",
      };
      return { ...loteInfo, vacas: vacasDoLote };
    });

    if (semLote.length > 0) {
      resultado.push({ value: "sem_lote", label: "Sem Lote Definido", nivel: "", vacas: semLote });
    }

    return resultado.sort((a, b) => String(a.label).localeCompare(String(b.label)));
  }, [vacas, medicoes, lotesLeite]);

  // Métricas com animação
  const metricas = useMemo(() => {
    let totalLitros = 0;
    let vacasOrdenhadas = 0;
    let vacasPendentes = 0;

    (vacas || []).forEach((vaca) => {
      const numeroStr = String(vaca.numero ?? "");
      const dados = medicoes[numeroStr] || {};
      const total = toNum(dados.total);

      if (total > 0) {
        totalLitros += total;
        vacasOrdenhadas++;
      } else {
        vacasPendentes++;
      }
    });

    const media = vacasOrdenhadas > 0 ? (totalLitros / vacasOrdenhadas).toFixed(1) : "0.0";

    return {
      totalLitros: totalLitros.toFixed(1),
      media,
      vacasOrdenhadas,
      vacasPendentes,
      totalVacas: (vacas || []).length,
      percentualCompleto: vacas.length > 0 ? (vacasOrdenhadas / vacas.length) * 100 : 0,
    };
  }, [vacas, medicoes]);

  const handleChange = (numero, campo, valor) => {
    const numeroStr = String(numero);
    setMedicoes((prev) => {
      const antigo = prev[numeroStr] || {};
      const atualizado = { ...antigo, [campo]: valor };

      if (campo === "lote_id") {
        if (valor) loteCacheRef.current[numeroStr] = valor;
        else delete loteCacheRef.current[numeroStr];
      }

      if (tipoLancamento !== "total" && ["manha", "tarde", "terceira"].includes(campo)) {
        const manha = campo === "manha" ? valor : antigo.manha || "0";
        const tarde = campo === "tarde" ? valor : antigo.tarde || "0";
        const terceira = campo === "terceira" ? valor : antigo.terceira || "0";
        atualizado.total = calcularTotal({ manha, tarde, terceira });
      }

      return { ...prev, [numeroStr]: atualizado };
    });
  };

  // Navegação inteligente entre inputs
  const focusNextInput = (currentId) => {
    const ids = Object.keys(inputRefs.current).sort();
    const currentIndex = ids.indexOf(currentId);
    if (currentIndex >= 0 && currentIndex < ids.length - 1) {
      const nextId = ids[currentIndex + 1];
      inputRefs.current[nextId]?.focus();
      inputRefs.current[nextId]?.select();
    }
  };

  const focusPrevInput = (currentId) => {
    const ids = Object.keys(inputRefs.current).sort();
    const currentIndex = ids.indexOf(currentId);
    if (currentIndex > 0) {
      const prevId = ids[currentIndex - 1];
      inputRefs.current[prevId]?.focus();
      inputRefs.current[prevId]?.select();
    }
  };

  const toggleLote = (loteId) => {
    setExpandedLotes((prev) => ({ ...prev, [loteId]: !prev[loteId] }));
  };

  const salvar = async () => {
    if (!fazendaAtualId || !dataMedicao) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      setSalvando(true);
      await Promise.resolve(onSalvar?.({ data: dataMedicao, tipoLancamento, medicoes }));
    } catch (e) {
      console.error("Erro ao salvar:", e);
      alert("Erro ao salvar medições.");
    } finally {
      setSalvando(false);
    }
  };

  if (!aberto) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(15, 23, 42, 0.6)",
      backdropFilter: "blur(4px)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
      padding: "24px",
      fontFamily: "Inter, system-ui, sans-serif",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: theme.radius.lg,
        width: "1150px",
        maxWidth: "95vw",
        maxHeight: "92vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: theme.shadows.xl,
      }}>
        
        {/* HEADER MODERNO */}
        <div style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "#fff",
          padding: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 700, letterSpacing: "-0.02em" }}>
              Registro de Produção de Leite
            </h1>
            <p style={{ margin: "6px 0 0 0", fontSize: "14px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "8px" }}>
              <Icon path={Icons.calendar} size={14} />
              {new Date(dataMedicao).toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <button
            onClick={onFechar}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              background: "rgba(255,255,255,0.1)",
              color: "#94a3b8",
              border: "none",
              borderRadius: theme.radius.sm,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.2)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              e.currentTarget.style.color = "#94a3b8";
            }}
          >
            <Icon path={Icons.close} size={18} />
          </button>
        </div>

        {/* CONTROLES APERFEIÇOADOS */}
        <div style={{
          padding: "20px 24px",
          background: "#fff",
          borderBottom: `1px solid ${theme.colors.slate[200]}`,
          display: "flex",
          gap: "20px",
          alignItems: "flex-end",
          flexWrap: "wrap",
        }}>
          {/* Seletor de Data */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: theme.colors.slate[600] }}>
              Data da Medição
            </label>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={() => setDataMedicao((d) => addDaysISO(d, -1))}
                style={{
                  padding: "10px",
                  border: `1px solid ${theme.colors.slate[300]}`,
                  background: "#fff",
                  borderRadius: theme.radius.sm,
                  cursor: "pointer",
                  color: theme.colors.slate[600],
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = theme.colors.brand[500]}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = theme.colors.slate[300]}
              >
                <Icon path={Icons.chevronLeft} size={16} />
              </button>
              <input
                type="date"
                value={dataMedicao}
                onChange={(e) => setDataMedicao(e.target.value)}
                style={{
                  padding: "10px 14px",
                  border: `1px solid ${theme.colors.slate[300]}`,
                  borderRadius: theme.radius.sm,
                  fontSize: "14px",
                  fontWeight: 500,
                  color: theme.colors.slate[800],
                  background: "#fff",
                  outline: "none",
                }}
              />
              <button
                onClick={() => setDataMedicao((d) => addDaysISO(d, 1))}
                style={{
                  padding: "10px",
                  border: `1px solid ${theme.colors.slate[300]}`,
                  background: "#fff",
                  borderRadius: theme.radius.sm,
                  cursor: "pointer",
                  color: theme.colors.slate[600],
                }}
              >
                <Icon path={Icons.chevronRight} size={16} />
              </button>
            </div>
          </div>

          {/* Tipo de Lançamento */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "240px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: theme.colors.slate[600] }}>
              Tipo de Lançamento
            </label>
            <Select
              value={opcoesTipoLancamento.find((o) => o.value === tipoLancamento)}
              onChange={(opt) => setTipoLancamento(opt?.value || "2")}
              options={opcoesTipoLancamento}
              styles={{
                control: (b) => ({
                  ...b,
                  minHeight: 42,
                  borderRadius: theme.radius.sm,
                  borderColor: theme.colors.slate[300],
                  boxShadow: "none",
                  fontSize: "14px",
                  "&:hover": { borderColor: theme.colors.brand[500] },
                }),
                option: (b, s) => ({
                  ...b,
                  background: s.isSelected ? theme.colors.brand[50] : s.isFocused ? theme.colors.slate[50] : "#fff",
                  color: s.isSelected ? theme.colors.brand[700] : theme.colors.slate[700],
                  fontWeight: s.isSelected ? 600 : 400,
                }),
              }}
            />
          </div>

          {/* Alerta de Data Passada */}
          {dataEhPassada && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              background: modoEdicaoPassado ? theme.colors.warning[50] : theme.colors.slate[50],
              border: `1px solid ${modoEdicaoPassado ? theme.colors.warning[200] : theme.colors.slate[200]}`,
              borderRadius: theme.radius.md,
              marginLeft: "auto",
            }}>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "8px", 
                color: modoEdicaoPassado ? theme.colors.warning[600] : theme.colors.slate[600],
                fontSize: "13px",
                fontWeight: 500,
              }}>
                <Icon path={Icons.alert} size={16} />
                <span>{modoEdicaoPassado ? "Modo edição ativado" : "Data passada - Lotes bloqueados"}</span>
              </div>
              <button
                onClick={() => setModoEdicaoPassado((v) => !v)}
                style={{
                  padding: "6px 14px",
                  fontSize: "12px",
                  fontWeight: 600,
                  background: modoEdicaoPassado ? "#fff" : theme.colors.brand[600],
                  color: modoEdicaoPassado ? theme.colors.warning[600] : "#fff",
                  border: `1px solid ${modoEdicaoPassado ? theme.colors.warning[300] : theme.colors.brand[600]}`,
                  borderRadius: theme.radius.sm,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {modoEdicaoPassado ? "Bloquear" : "Editar"}
              </button>
            </div>
          )}
        </div>

        {/* MÉTRICAS ANIMADAS */}
        <div style={{
          padding: "24px",
          background: theme.colors.slate[50],
          borderBottom: `1px solid ${theme.colors.slate[200]}`,
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
        }}>
          <MetricCard
            icon={Icons.drop}
            label="Produção Total"
            value={`${metricas.totalLitros} L`}
            subtext={`${metricas.vacasOrdenhadas} de ${metricas.totalVacas} vacas ordenhadas`}
            color={metricas.totalLitros > 0 ? "blue" : "slate"}
            animate={metricas.totalLitros > 0}
          />
          <MetricCard
            icon={Icons.chart}
            label="Média por Vaca"
            value={`${metricas.media} L`}
            subtext="média diária"
            color="green"
          />
          <MetricCard
            icon={Icons.clock}
            label="Pendentes"
            value={metricas.vacasPendentes}
            subtext={metricas.vacasPendentes === 1 ? "vaca sem registro" : "vacas sem registro"}
            color={metricas.vacasPendentes > 0 ? "amber" : "slate"}
          />
          <MetricCard
            icon={Icons.filter}
            label="Lotes Ativos"
            value={vacasPorLote.length}
            subtext="agrupamentos"
            color="slate"
          />
        </div>

        {/* LISTA POR LOTE COM NAVEGAÇÃO */}
        <div style={{ flex: 1, overflow: "auto", background: theme.colors.slate[50], padding: "20px" }}>
          {vacasPorLote.map((lote, loteIndex) => {
            const isExpanded = expandedLotes[lote.value] !== false;
            
            // Calcular progresso do lote
            const vacasComDados = lote.vacas.filter(v => {
              const num = String(v.numero);
              const dados = medicoes[num] || {};
              return toNum(dados.total) > 0;
            }).length;
            const progresso = (vacasComDados / lote.vacas.length) * 100;

            return (
              <div
                key={lote.value}
                style={{
                  marginBottom: "16px",
                  background: "#fff",
                  borderRadius: theme.radius.md,
                  border: `1px solid ${theme.colors.slate[200]}`,
                  overflow: "hidden",
                  boxShadow: theme.shadows.sm,
                }}
              >
                <LoteHeader
                  title={lote.label}
                  count={lote.vacas.length}
                  progress={progresso}
                  collapsed={!isExpanded}
                  onToggle={() => toggleLote(lote.value)}
                />

                {isExpanded && (
                  <div style={{ padding: "20px" }}>
                    <div style={{ 
                      display: "grid",
                      gridTemplateColumns: tipoLancamento === "3" 
                        ? "140px 70px 1fr 1fr 1fr 100px 180px" 
                        : tipoLancamento === "2"
                        ? "140px 70px 1fr 1fr 100px 180px"
                        : "140px 70px 100px 180px",
                      gap: "12px",
                      alignItems: "center",
                    }}>
                      {/* Headers */}
                      <div style={{ fontSize: "11px", fontWeight: 700, color: theme.colors.slate[500], textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Animal
                      </div>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: theme.colors.slate[500], textAlign: "center" }}>
                        DEL
                      </div>
                      {tipoLancamento !== "total" && (
                        <>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: theme.colors.slate[500], textAlign: "right" }}>
                            Ordenha Manhã
                          </div>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: theme.colors.slate[500], textAlign: "right" }}>
                            Ordenha Tarde
                          </div>
                        </>
                      )}
                      {tipoLancamento === "3" && (
                        <div style={{ fontSize: "11px", fontWeight: 700, color: theme.colors.slate[500], textAlign: "right" }}>
                          3ª Ordenha
                        </div>
                      )}
                      <div style={{ fontSize: "11px", fontWeight: 700, color: theme.colors.slate[500], textAlign: "right" }}>
                        Total
                      </div>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: theme.colors.slate[500] }}>
                        Lote
                      </div>

                      {/* Rows */}
                      {lote.vacas.map((vaca, idx) => {
                        const numeroStr = String(vaca.numero ?? "");
                        const dados = medicoes[numeroStr] || {};
                        const del = getDelValor(vaca);
                        
                        // Define cor do DEL
                        let delColor = theme.colors.slate[600];
                        let delBg = "transparent";
                        if (del > 400) { delColor = theme.colors.danger[600]; delBg = theme.colors.danger[50]; }
                        else if (del > 305) { delColor = theme.colors.warning[600]; delBg = theme.colors.warning[50]; }
                        else if (del > 0) { delColor = theme.colors.success[600]; delBg = theme.colors.success[50]; }

                        const baseKey = `${lote.value}-${idx}`;
                        const isPendente = toNum(dados.total) === 0;

                        return (
                          <React.Fragment key={vaca.id || idx}>
                            {/* Animal */}
                            <div style={{ 
                              padding: "8px 0", 
                              opacity: isPendente ? 1 : 0.85,
                              borderLeft: `3px solid ${isPendente ? theme.colors.warning[500] : "transparent"}`,
                              paddingLeft: isPendente ? "12px" : "15px",
                              marginLeft: isPendente ? "-3px" : "0",
                            }}>
                              <div style={{ 
                                fontWeight: 700, 
                                color: isPendente ? theme.colors.slate[900] : theme.colors.slate[700],
                                fontFamily: "monospace",
                                fontSize: "14px",
                              }}>
                                #{vaca.numero}
                              </div>
                              {vaca.brinco && (
                                <div style={{ fontSize: "11px", color: theme.colors.slate[400], marginTop: "2px" }}>
                                  Brinco {vaca.brinco}
                                </div>
                              )}
                            </div>

                            {/* DEL */}
                            <div style={{ textAlign: "center" }}>
                              <span style={{
                                fontFamily: "monospace",
                                fontSize: "12px",
                                fontWeight: 700,
                                color: delColor,
                                background: delBg,
                                padding: "4px 8px",
                                borderRadius: "20px",
                                display: "inline-block",
                              }}>
                                {del}
                              </span>
                            </div>

                            {/* Inputs de Ordenha */}
                            {tipoLancamento !== "total" && (
                              <>
                                <OrdenhaInput
                                  inputRef={(el) => { if(el) inputRefs.current[`${baseKey}-manha`] = el; }}
                                  value={dados.manha}
                                  onChange={(e) => handleChange(numeroStr, "manha", e.target.value)}
                                  onNext={() => focusNextInput(`${baseKey}-manha`)}
                                  onPrev={() => focusPrevInput(`${baseKey}-manha`)}
                                  icon={Icons.drop}
                                  placeholder="0,0"
                                  label="L"
                                  autoFocus={loteIndex === 0 && idx === 0}
                                />
                                <OrdenhaInput
                                  inputRef={(el) => { if(el) inputRefs.current[`${baseKey}-tarde`] = el; }}
                                  value={dados.tarde}
                                  onChange={(e) => handleChange(numeroStr, "tarde", e.target.value)}
                                  onNext={() => focusNextInput(`${baseKey}-tarde`)}
                                  onPrev={() => focusPrevInput(`${baseKey}-tarde`)}
                                  icon={Icons.clock}
                                  placeholder="0,0"
                                  label="L"
                                />
                              </>
                            )}

                            {tipoLancamento === "3" && (
                              <OrdenhaInput
                                inputRef={(el) => { if(el) inputRefs.current[`${baseKey}-terceira`] = el; }}
                                value={dados.terceira}
                                onChange={(e) => handleChange(numeroStr, "terceira", e.target.value)}
                                onNext={() => focusNextInput(`${baseKey}-terceira`)}
                                onPrev={() => focusPrevInput(`${baseKey}-terceira`)}
                                placeholder="0,0"
                                label="L"
                              />
                            )}

                            {/* Total (calculado ou input) */}
                            <div>
                              <input
                                type="number"
                                step="0.1"
                                value={dados.total || ""}
                                readOnly={tipoLancamento !== "total"}
                                onChange={(e) => tipoLancamento === "total" && handleChange(numeroStr, "total", e.target.value)}
                                style={{
                                  width: "100%",
                                  padding: "10px",
                                  borderRadius: theme.radius.sm,
                                  border: `2px solid ${toNum(dados.total) > 0 ? theme.colors.success[200] : theme.colors.slate[200]}`,
                                  fontSize: "14px",
                                  textAlign: "right",
                                  fontWeight: 700,
                                  fontFamily: "monospace",
                                  background: toNum(dados.total) > 0 ? theme.colors.success[50] : theme.colors.slate[50],
                                  color: toNum(dados.total) > 0 ? theme.colors.success[700] : theme.colors.slate[600],
                                }}
                              />
                            </div>

                            {/* Select de Lote */}
                            <div>
                              <Select
                                value={lotesLeite.find((l) => l.id === (dados.lote_id || vaca.lote_id))
                                  ? { value: dados.lote_id || vaca.lote_id, label: lotesLeite.find((l) => l.id === (dados.lote_id || vaca.lote_id))?.nome }
                                  : null
                                }
                                onChange={(opt) => handleChange(numeroStr, "lote_id", opt?.value || "")}
                                options={lotesLeite.map((l) => ({ value: l.id, label: l.nome }))}
                                isClearable
                                isDisabled={bloquearLote}
                                placeholder={loadingLotes ? "..." : "—"}
                                styles={{
                                  control: (b) => ({
                                    ...b,
                                    minHeight: 38,
                                    borderRadius: theme.radius.sm,
                                    borderColor: theme.colors.slate[200],
                                    background: bloquearLote ? theme.colors.slate[50] : "#fff",
                                    fontSize: "13px",
                                  }),
                                }}
                              />
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* FOOTER MODERNO */}
        <div style={{
          padding: "20px 24px",
          background: "#fff",
          borderTop: `1px solid ${theme.colors.slate[200]}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div style={{ fontSize: "13px", color: theme.colors.slate[500] }}>
            <span style={{ fontWeight: 600, color: theme.colors.slate[700] }}>Dica:</span> Use 
            <kbd style={{ background: theme.colors.slate[100], padding: "2px 6px", borderRadius: "4px", margin: "0 4px", fontFamily: "monospace" }}>Tab</kbd> 
            ou 
            <kbd style={{ background: theme.colors.slate[100], padding: "2px 6px", borderRadius: "4px", margin: "0 4px", fontFamily: "monospace" }}>Enter</kbd> 
            para navegar entre os campos
          </div>
          
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={onFechar}
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: 600,
                color: theme.colors.slate[600],
                background: "transparent",
                border: "none",
                borderRadius: theme.radius.sm,
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={salvar}
              disabled={salvando}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 24px",
                fontSize: "14px",
                fontWeight: 700,
                color: "#fff",
                background: `linear-gradient(135deg, ${theme.colors.brand[600]} 0%, ${theme.colors.brand[700]} 100%)`,
                border: "none",
                borderRadius: theme.radius.sm,
                cursor: salvando ? "not-allowed" : "pointer",
                opacity: salvando ? 0.7 : 1,
                boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)",
                transition: "all 0.2s",
              }}
            >
              <Icon path={Icons.save} size={16} />
              {salvando ? "Salvando..." : "Confirmar Medições"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}