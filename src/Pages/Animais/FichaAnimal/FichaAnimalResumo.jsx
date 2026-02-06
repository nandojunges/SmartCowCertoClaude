import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

/* =========================================================
   DESIGN SYSTEM - Tokens refinados
   ========================================================= */
const tokens = {
  colors: {
    // Base neutra sofisticada
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
    // Acentos agrícolas
    primary: {
      50: "#ecfdf5",
      100: "#d1fae5",
      500: "#10b981",
      600: "#059669",
      700: "#047857",
      900: "#064e3b",
    },
    status: {
      success: "#22c55e",
      warning: "#f59e0b",
      danger: "#ef4444",
      info: "#3b82f6",
      neutral: "#6b7280",
    }
  },
  shadows: {
    xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    sm: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
  },
  radius: {
    sm: "6px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    "2xl": "24px",
    full: "9999px",
  },
  space: {
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "20px",
    6: "24px",
    8: "32px",
  }
};

/* =========================================================
   HELPERS
   ========================================================= */

function parseDateFlexible(s) {
  if (!s) return null;
  let str = String(s).trim();
  
  let m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const dt = new Date(+m[1], +m[2] - 1, +m[3]);
    return Number.isFinite(+dt) ? dt : null;
  }

  m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) {
    const dt = new Date(+m[3], +m[2] - 1, +m[1]);
    return Number.isFinite(+dt) ? dt : null;
  }

  return null;
}

function fmtDataBR(s) {
  const dt = parseDateFlexible(s);
  if (!dt) return null;
  return dt.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function calcIdade(nascimento) {
  const dt = parseDateFlexible(nascimento);
  if (!dt) return null;
  
  const hoje = new Date();
  let anos = hoje.getFullYear() - dt.getFullYear();
  let meses = hoje.getMonth() - dt.getMonth();
  
  if (meses < 0) {
    anos--;
    meses += 12;
  }
  if (hoje.getDate() < dt.getDate() && meses === 0) {
    anos--;
    meses = 11;
  }
  
  if (anos > 0 && meses > 0) return `${anos}a ${meses}m`;
  if (anos > 0) return `${anos} anos`;
  return `${meses} meses`;
}

function calcDEL(dataParto) {
  const parto = parseDateFlexible(dataParto);
  if (!parto) return null;
  const dias = Math.floor((new Date() - parto) / 86400000);
  return dias >= 0 ? dias : null;
}

function normalizeStatus(v) {
  const s = (v ?? "").toString().trim().toLowerCase();
  if (!s || s === "—" || s === "-" || s === "null") return null;
  return s;
}

function normalizeDgResult(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim().toLowerCase();
  if (!text) return null;
  if (["positivo", "pos", "p", "true", "prenhe", "prenha"].includes(text)) return "POSITIVO";
  if (["negativo", "neg", "n", "false", "vazia"].includes(text)) return "NEGATIVO";
  if (["não vista", "nao vista", "pendente"].includes(text)) return "PENDENTE";
  return null;
}

function getStatusMeta(status) {
  const map = {
    prenha: { 
      label: "Prenha", 
      color: tokens.colors.status.success,
      bg: "rgba(34, 197, 94, 0.1)",
      icon: "●",
      desc: "Gestação confirmada"
    },
    vazia: { 
      label: "Vazia", 
      color: tokens.colors.status.warning,
      bg: "rgba(245, 158, 11, 0.1)",
      icon: "○",
      desc: "Aguardando inseminação"
    },
    inseminada: { 
      label: "Inseminada", 
      color: tokens.colors.status.info,
      bg: "rgba(59, 130, 246, 0.1)",
      icon: "◐",
      desc: "Aguardando confirmação"
    },
    seca: { 
      label: "Seca", 
      color: tokens.colors.status.danger,
      bg: "rgba(239, 68, 68, 0.1)",
      icon: "◑",
      desc: "Período de descanso"
    },
    lactacao: { 
      label: "Lactação", 
      color: tokens.colors.primary[600],
      bg: "rgba(5, 150, 105, 0.1)",
      icon: "◕",
      desc: "Produzindo leite"
    },
  };
  return map[status] || { 
    label: status || "Indefinido", 
    color: tokens.colors.slate[400],
    bg: tokens.colors.slate[100],
    icon: "◌",
    desc: "Status não definido"
  };
}

/* =========================================================
   COMPONENTES ATÔMICOS
   ========================================================= */

const Card = ({ children, style = {}, className = "", onClick }) => (
  <div 
    onClick={onClick}
    className={className}
    style={{
      backgroundColor: "#ffffff",
      borderRadius: tokens.radius.xl,
      border: `1px solid ${tokens.colors.slate[200]}`,
      boxShadow: tokens.shadows.sm,
      transition: "all 0.2s ease",
      ...(onClick && { cursor: "pointer" }),
      ":hover": {
        boxShadow: tokens.shadows.md,
        transform: "translateY(-1px)",
      },
      ...style,
    }}
  >
    {children}
  </div>
);

const Badge = ({ status, size = "md" }) => {
  const meta = getStatusMeta(status);
  const sizes = {
    sm: { padding: "4px 10px", fontSize: "11px" },
    md: { padding: "6px 14px", fontSize: "12px" },
    lg: { padding: "8px 18px", fontSize: "14px", fontWeight: 700 },
  };
  
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      backgroundColor: meta.bg,
      color: meta.color,
      borderRadius: tokens.radius.full,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      border: `1px solid ${meta.color}30`,
      ...sizes[size],
    }}>
      <span style={{ fontSize: "8px" }}>{meta.icon}</span>
      {meta.label}
    </div>
  );
};

const MetricBox = ({ value, label, subtext, trend, loading }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: tokens.space[2] }}>
    <span style={{
      fontSize: "11px",
      fontWeight: 600,
      color: tokens.colors.slate[500],
      textTransform: "uppercase",
      letterSpacing: "0.08em",
    }}>
      {label}
    </span>
    
    {loading ? (
      <div style={{
        height: "36px",
        width: "60%",
        background: `linear-gradient(90deg, ${tokens.colors.slate[200]} 25%, ${tokens.colors.slate[100]} 50%, ${tokens.colors.slate[200]} 75%)`,
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
        borderRadius: tokens.radius.md,
      }} />
    ) : (
      <div style={{ display: "flex", alignItems: "baseline", gap: tokens.space[2] }}>
        <span style={{
          fontSize: "32px",
          fontWeight: 800,
          color: tokens.colors.slate[800],
          lineHeight: 1,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          letterSpacing: "-0.02em",
        }}>
          {value || "—"}
        </span>
        {trend && (
          <span style={{
            fontSize: "13px",
            color: trend > 0 ? tokens.colors.status.success : tokens.colors.status.danger,
            fontWeight: 600,
          }}>
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
    )}
    
    {subtext && (
      <span style={{ 
        fontSize: "13px", 
        color: tokens.colors.slate[500],
        fontWeight: 500,
      }}>
        {subtext}
      </span>
    )}
  </div>
);

const DataRow = ({ label, value, highlight = false }) => (
  <div style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: `${tokens.space[2]} 0`,
    borderBottom: `1px solid ${tokens.colors.slate[100]}`,
  }}>
    <span style={{
      fontSize: "13px",
      color: tokens.colors.slate[500],
      fontWeight: 500,
    }}>
      {label}
    </span>
    <span style={{
      fontSize: "14px",
      color: highlight ? tokens.colors.slate[900] : tokens.colors.slate[700],
      fontWeight: highlight ? 700 : 600,
    }}>
      {value || "—"}
    </span>
  </div>
);

const SectionHeader = ({ icon, title, action }) => (
  <div style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: tokens.space[5],
    paddingBottom: tokens.space[3],
    borderBottom: `2px solid ${tokens.colors.slate[100]}`,
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: tokens.space[3] }}>
      <span style={{ 
        fontSize: "20px",
        filter: "grayscale(0.2)",
      }}>{icon}</span>
      <h3 style={{
        margin: 0,
        fontSize: "14px",
        fontWeight: 800,
        color: tokens.colors.slate[800],
        textTransform: "uppercase",
        letterSpacing: "0.12em",
      }}>
        {title}
      </h3>
    </div>
    {action}
  </div>
);

const TimelineEvent = ({ type, date, result, isLast }) => {
  const normalizedResult = normalizeDgResult(result);
  const resultLabel = normalizedResult === "POSITIVO"
    ? "Prenha"
    : normalizedResult === "NEGATIVO"
      ? "Vazia"
      : normalizedResult === "PENDENTE"
        ? "Não vista"
        : null;
  const icons = {
    PARTO: "🐄",
    IA: "💉",
    SECAGEM: "🥛",
    DG: normalizedResult === "POSITIVO" ? "✓" : normalizedResult === "NEGATIVO" ? "✕" : "•",
  };
  
  const labels = {
    PARTO: "Parto",
    IA: "Inseminação",
    SECAGEM: "Secagem",
    DG: "Diagnóstico Gestação",
  };

  const colors = {
    PARTO: tokens.colors.primary[600],
    IA: tokens.colors.status.info,
    SECAGEM: tokens.colors.status.danger,
    DG: normalizedResult === "POSITIVO" ? tokens.colors.status.success : normalizedResult === "NEGATIVO" ? tokens.colors.status.danger : tokens.colors.status.warning,
  };

  return (
    <div style={{ display: "flex", gap: tokens.space[4], position: "relative" }}>
      {/* Linha vertical */}
      {!isLast && (
        <div style={{
          position: "absolute",
          left: "15px",
          top: "32px",
          bottom: "-8px",
          width: "2px",
          background: tokens.colors.slate[200],
        }} />
      )}
      
      {/* Círculo */}
      <div style={{
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        background: colors[type] || tokens.colors.slate[400],
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: "14px",
        fontWeight: 700,
        flexShrink: 0,
        boxShadow: `0 0 0 4px ${tokens.colors.slate[50]}`,
        zIndex: 1,
      }}>
        {icons[type] || "•"}
      </div>
      
      {/* Conteúdo */}
      <div style={{ 
        flex: 1, 
        paddingBottom: tokens.space[4],
        marginTop: "-4px",
      }}>
        <div style={{ 
          fontWeight: 700, 
          color: tokens.colors.slate[800],
          fontSize: "14px",
          marginBottom: "2px",
        }}>
          {labels[type]}
          {resultLabel && (
            <span style={{
              marginLeft: tokens.space[2],
              fontSize: "12px",
              padding: "2px 8px",
              borderRadius: tokens.radius.full,
              background: normalizedResult === "POSITIVO" 
                ? "rgba(34, 197, 94, 0.15)" 
                : normalizedResult === "NEGATIVO"
                  ? "rgba(239, 68, 68, 0.15)"
                  : "rgba(245, 158, 11, 0.15)",
              color: normalizedResult === "POSITIVO"
                ? tokens.colors.status.success
                : normalizedResult === "NEGATIVO"
                  ? tokens.colors.status.danger
                  : tokens.colors.status.warning,
            }}>
              {resultLabel}
            </span>
          )}
        </div>
        <div style={{ 
          fontSize: "13px", 
          color: tokens.colors.slate[500],
          fontWeight: 500,
        }}>
          {fmtDataBR(date)}
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   COMPONENTE PRINCIPAL - V2 PROFISSIONAL
   ========================================================= */

export default function FichaAnimalResumo({ animal }) {
  const [reproEvents, setReproEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const animalId = animal?.id ?? animal?.animal_id ?? animal?.uuid ?? null;
  const fazendaId = animal?.fazenda_id ?? animal?.fazendaId ?? null;

  useEffect(() => {
    let cancelled = false;
    
    async function fetchReproData() {
      if (!animalId || !fazendaId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("repro_eventos")
        .select("*")
        .eq("fazenda_id", fazendaId)
        .eq("animal_id", animalId)
        .in("tipo", ["PARTO", "IA", "SECAGEM", "DG"])
        .order("data_evento", { ascending: false })
        .limit(5);

      if (!cancelled) {
        if (!error) setReproEvents(data || []);
        setLoading(false);
      }
    }

    fetchReproData();
    return () => { cancelled = true; };
  }, [animalId, fazendaId]);

  if (!animal) return null;

  // Processamento
  const ultimoParto = reproEvents.find(e => e.tipo === "PARTO")?.data_evento || animal?.ultimo_parto;
  const ultimaIA = reproEvents.find(e => e.tipo === "IA")?.data_evento;
  const ultimaSecagem = reproEvents.find(e => e.tipo === "SECAGEM")?.data_evento;
  const ultimoDG = reproEvents.find(e => e.tipo === "DG");
  
  const del = calcDEL(ultimoParto);
  const idade = calcIdade(animal.nascimento);
  
  // Lógica situação
  const situacaoRep = useMemo(() => {
    const repRaw = normalizeStatus(animal?.situacao_reprodutiva || animal?.situacao_rep);
    if (repRaw) return repRaw;

    const dtParto = parseDateFlexible(ultimoParto);
    const dtIA = parseDateFlexible(ultimaIA);
    const dtSec = parseDateFlexible(ultimaSecagem);
    const dtDG = ultimoDG ? parseDateFlexible(ultimoDG.data_evento) : null;
    
    if (dtSec && dtIA && dtSec > dtIA) return "seca";
    const dgResult = normalizeDgResult(ultimoDG?.meta?.dg);
    if (dgResult === "POSITIVO" && dtDG > dtIA) return "prenha";
    if (dgResult === "NEGATIVO" && dtDG > dtIA) return "vazia";
    if (dtIA && (!dtParto || dtIA > dtParto)) return "inseminada";
    return "vazia";
  }, [animal, ultimoParto, ultimaIA, ultimaSecagem, ultimoDG]);

  const racaNome = animal?.raca_nome || animal?.raca || (animal?.racas?.nome) || "Não informada";
  const meta = getStatusMeta(situacaoRep);

  return (
    <div style={{
      maxWidth: "1200px",
      margin: "0 auto",
      padding: tokens.space[6],
      backgroundColor: tokens.colors.slate[50],
      minHeight: "100vh",
      fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* HEADER ELEGANTE */}
      <div style={{
        marginBottom: tokens.space[6],
        padding: tokens.space[6],
        background: "white",
        borderRadius: tokens.radius["2xl"],
        border: `1px solid ${tokens.colors.slate[200]}`,
        boxShadow: tokens.shadows.sm,
        display: "flex",
        alignItems: "center",
        gap: tokens.space[5],
      }}>
        <div style={{
          width: "72px",
          height: "72px",
          borderRadius: tokens.radius.xl,
          background: `linear-gradient(135deg, ${tokens.colors.primary[100]} 0%, ${tokens.colors.primary[50]} 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "32px",
          border: `2px solid ${tokens.colors.primary[200]}`,
        }}>
          🐄
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: tokens.space[3],
            marginBottom: tokens.space[1],
          }}>
            <h1 style={{ 
              margin: 0, 
              fontSize: "28px", 
              fontWeight: 800,
              color: tokens.colors.slate[900],
              letterSpacing: "-0.02em",
            }}>
              {animal.numero || "Sem número"}
            </h1>
            <Badge status={situacaoRep} size="md" />
          </div>
          
          <div style={{ 
            display: "flex", 
            gap: tokens.space[4],
            color: tokens.colors.slate[500],
            fontSize: "14px",
            fontWeight: 500,
          }}>
            <span>{racaNome}</span>
            <span style={{ color: tokens.colors.slate[300] }}>•</span>
            <span>{idade}</span>
            <span style={{ color: tokens.colors.slate[300] }}>•</span>
            <span style={{ textTransform: "capitalize" }}>{animal.sexo}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: tokens.space[2] }}>
          <button style={{
            padding: "10px 20px",
            background: "white",
            border: `1px solid ${tokens.colors.slate[200]}`,
            borderRadius: tokens.radius.lg,
            color: tokens.colors.slate[700],
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.2s",
            boxShadow: tokens.shadows.xs,
          }}>
            Editar Ficha
          </button>
          <button style={{
            padding: "10px 20px",
            background: tokens.colors.primary[600],
            border: "none",
            borderRadius: tokens.radius.lg,
            color: "white",
            fontWeight: 700,
            fontSize: "14px",
            cursor: "pointer",
            boxShadow: `0 4px 12px ${tokens.colors.primary[600]}40`,
            transition: "all 0.2s",
          }}>
            + Novo Evento
          </button>
        </div>
      </div>

      {/* GRID PRINCIPAL */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(12, 1fr)",
        gap: tokens.space[5],
      }}>
        
        {/* COLUNA ESQUERDA - MÉTRICAS (4 cols) */}
        <div style={{ gridColumn: "span 4", display: "flex", flexDirection: "column", gap: tokens.space[5] }}>
          
          {/* CARD DEL */}
          <Card style={{ padding: tokens.space[5], position: "relative", overflow: "hidden" }}>
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: del 
                ? del > 305 
                  ? `linear-gradient(90deg, ${tokens.colors.status.warning}, ${tokens.colors.status.danger})`
                  : `linear-gradient(90deg, ${tokens.colors.primary[500]}, ${tokens.colors.primary[600]})`
                : tokens.colors.slate[200],
            }} />
            
            <MetricBox 
              value={del ? `${del}d` : "—"}
              label="Dias em Lactação"
              subtext={del ? `Início: ${fmtDataBR(ultimoParto)}` : "Animal não lactando"}
              loading={loading}
            />
            
            {del && (
              <div style={{ marginTop: tokens.space[4] }}>
                <div style={{
                  height: "6px",
                  background: tokens.colors.slate[100],
                  borderRadius: tokens.radius.full,
                  overflow: "hidden",
                }}>
                  <div style={{
                    width: `${Math.min((del / 400) * 100, 100)}%`,
                    height: "100%",
                    background: del > 305 ? tokens.colors.status.warning : tokens.colors.primary[500],
                    borderRadius: tokens.radius.full,
                    transition: "width 0.8s ease",
                  }} />
                </div>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: tokens.space[2],
                  fontSize: "11px",
                  color: tokens.colors.slate[400],
                  fontWeight: 600,
                }}>
                  <span>0</span>
                  <span>305 dias (ideal)</span>
                  <span>400+</span>
                </div>
              </div>
            )}
          </Card>

          {/* CARD STATUS REPRODUTIVO */}
          <Card style={{ padding: tokens.space[5] }}>
            <div style={{ textAlign: "center", padding: `${tokens.space[2]} 0` }}>
              <div style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: meta.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: "32px",
                border: `3px solid ${meta.color}30`,
              }}>
                {meta.icon}
              </div>
              
              <h4 style={{
                margin: "0 0 4px 0",
                fontSize: "20px",
                fontWeight: 800,
                color: tokens.colors.slate[800],
              }}>
                {meta.label}
              </h4>
              
              <p style={{
                margin: "0 0 16px 0",
                fontSize: "13px",
                color: tokens.colors.slate[500],
              }}>
                {meta.desc}
              </p>

              <div style={{
                padding: tokens.space[3],
                background: tokens.colors.slate[50],
                borderRadius: tokens.radius.lg,
                textAlign: "left",
              }}>
                <DataRow label="Último Parto" value={fmtDataBR(ultimoParto)} />
                <DataRow label="Última IA" value={fmtDataBR(ultimaIA)} />
                <DataRow label="Última Secagem" value={fmtDataBR(ultimaSecagem)} />
              </div>
            </div>
          </Card>

          {/* GENEALOGIA COMPACTA */}
          <Card style={{ padding: tokens.space[5] }}>
            <SectionHeader icon="🌳" title="Genealogia" />
            
            <div style={{ display: "flex", flexDirection: "column", gap: tokens.space[3] }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: tokens.space[3],
                padding: tokens.space[3],
                background: tokens.colors.slate[50],
                borderRadius: tokens.radius.lg,
                borderLeft: `3px solid ${tokens.colors.status.info}`,
              }}>
                <span style={{ fontSize: "24px" }}>👑</span>
                <div>
                  <div style={{ fontSize: "12px", color: tokens.colors.slate[500], fontWeight: 600 }}>Pai</div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: tokens.colors.slate[800] }}>
                    {animal.pai_nome || animal.pai || "Não registrado"}
                  </div>
                </div>
              </div>
              
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: tokens.space[3],
                padding: tokens.space[3],
                background: tokens.colors.slate[50],
                borderRadius: tokens.radius.lg,
                borderLeft: `3px solid ${tokens.colors.status.warning}`,
              }}>
                <span style={{ fontSize: "24px" }}>🐄</span>
                <div>
                  <div style={{ fontSize: "12px", color: tokens.colors.slate[500], fontWeight: 600 }}>Mãe</div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: tokens.colors.slate[800] }}>
                    {animal.mae_nome || animal.mae || "Não registrada"}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* COLUNA DIREITA - INFO DETALHADA (8 cols) */}
        <div style={{ gridColumn: "span 8", display: "flex", flexDirection: "column", gap: tokens.space[5] }}>
          
          {/* CARD IDENTIFICAÇÃO */}
          <Card style={{ padding: tokens.space[5] }}>
            <SectionHeader icon="📋" title="Identificação Completa" />
            
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: tokens.space[4],
            }}>
              {[
                { label: "Número", value: animal.numero, highlight: true },
                { label: "Brinco", value: animal.brinco },
                { label: "Sexo", value: animal.sexo },
                { label: "Raça", value: racaNome },
                { label: "Nascimento", value: fmtDataBR(animal.nascimento) },
                { label: "Idade", value: idade },
                { label: "Origem", value: animal.origem },
                { label: "Categoria", value: animal.categoria_atual || animal.categoria },
                { label: "Lote", value: animal.lote },
              ].map((item, idx) => (
                <div key={idx} style={{
                  padding: tokens.space[3],
                  background: tokens.colors.slate[50],
                  borderRadius: tokens.radius.lg,
                }}>
                  <div style={{
                    fontSize: "11px",
                    color: tokens.colors.slate[400],
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: tokens.space[1],
                  }}>
                    {item.label}
                  </div>
                  <div style={{
                    fontSize: "15px",
                    fontWeight: item.highlight ? 800 : 600,
                    color: item.highlight ? tokens.colors.slate[900] : tokens.colors.slate[700],
                  }}>
                    {item.value || "—"}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* CARD DETALHES PRODUTIVOS */}
          <Card style={{ padding: tokens.space[5] }}>
            <SectionHeader icon="📊" title="Dados Produtivos" />
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: tokens.space[4] }}>
              <div>
                <h5 style={{
                  margin: "0 0 12px 0",
                  fontSize: "12px",
                  color: tokens.colors.slate[500],
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}>
                  Situação Atual
                </h5>
                <DataRow label="Situação Produtiva" value={animal.situacao_produtiva} />
                <DataRow label="Pasto Atual" value={animal.pasto_atual} />
                <DataRow label="Aptidão" value={animal.aptidao} />
              </div>
              
              <div>
                <h5 style={{
                  margin: "0 0 12px 0",
                  fontSize: "12px",
                  color: tokens.colors.slate[500],
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}>
                  Métricas
                </h5>
                <DataRow label="Peso Atual" value={animal.peso_atual ? `${animal.peso_atual} kg` : null} />
                <DataRow label="CC (Cond. Corporal)" value={animal.cc} />
                <DataRow label="Produção Estimada" value={animal.producao ? `${animal.producao} L/dia` : null} />
              </div>
            </div>

            {animal.observacoes && (
              <div style={{
                marginTop: tokens.space[4],
                padding: tokens.space[4],
                background: tokens.colors.primary[50],
                borderRadius: tokens.radius.lg,
                borderLeft: `4px solid ${tokens.colors.primary[500]}`,
              }}>
                <div style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: tokens.colors.primary[700],
                  marginBottom: tokens.space[1],
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}>
                  Observações
                </div>
                <div style={{
                  fontSize: "14px",
                  color: tokens.colors.slate[700],
                  lineHeight: 1.6,
                }}>
                  {animal.observacoes}
                </div>
              </div>
            )}
          </Card>

          {/* TIMELINE */}
          <Card style={{ padding: tokens.space[5] }}>
            <SectionHeader 
              icon="⏱️" 
              title="Histórico Reprodutivo" 
              action={loading && <span style={{ fontSize: "13px", color: tokens.colors.slate[400] }}>Carregando...</span>}
            />
            
            {reproEvents.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: `${tokens.space[8]} ${tokens.space[4]}`,
                color: tokens.colors.slate[400],
              }}>
                <div style={{ fontSize: "40px", marginBottom: tokens.space[3], opacity: 0.5 }}>📭</div>
                <div style={{ fontSize: "15px", fontWeight: 600 }}>Nenhum evento registrado</div>
                <div style={{ fontSize: "13px", marginTop: tokens.space[1] }}>
                  Registre partos, inseminações e diagnósticos para acompanhar o histórico
                </div>
              </div>
            ) : (
              <div style={{ paddingLeft: tokens.space[2] }}>
                {reproEvents.map((event, idx) => (
                  <TimelineEvent 
                    key={idx}
                    type={event.tipo}
                    date={event.data_evento}
                    result={event?.meta?.dg}
                    isLast={idx === reproEvents.length - 1}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
