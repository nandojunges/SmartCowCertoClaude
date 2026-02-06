// src/Pages/Reproducao/Inseminador.jsx
// -----------------------------------------------------------------------------
// Gestão de Inseminadores — Layout Reorganizado & Gráfico Ajustado
// Ajustes pedidos:
// ✅ Linha verde por CIMA das colunas (z-index)
// ✅ Linha conecta EXATAMENTE no ponto (X centralizado por coluna)
// ✅ Colunas com mais contraste (principal e modal)
// ✅ Mantém tooltip fixed + modal com scroll interno
// -----------------------------------------------------------------------------

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useFazenda } from "../../context/FazendaContext";

const TOKENS = {
  colors: {
    primary: "#2563EB",
    primaryLight: "#EFF6FF",
    primaryDark: "#1E40AF",
    success: "#10B981",
    successLight: "#ECFDF5",
    warning: "#F59E0B",
    warningLight: "#FFFBEB",
    danger: "#EF4444",
    purple: "#8B5CF6",
    purpleLight: "#F5F3FF",
    orange: "#F97316",
    cyan: "#06B6D4",
    gray50: "#F9FAFB",
    gray100: "#F3F4F6",
    gray200: "#E5E7EB",
    gray300: "#D1D5DB",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    gray600: "#4B5563",
    gray700: "#374151",
    gray800: "#1F2937",
    gray900: "#111827",
  },
  shadows: {
    sm: "0 1px 2px rgba(0,0,0,.06)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.10)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.10)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.10)",
  },
};

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const getMonthKey = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const getMonthBuckets = (count, referenceDate = new Date()) => {
  const buckets = [];
  const base = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(base.getFullYear(), base.getMonth() - offset, 1);
    const key = getMonthKey(date);
    buckets.push({
      key,
      label: MONTH_LABELS[date.getMonth()],
      mes: MONTH_LABELS[date.getMonth()],
    });
  }

  return buckets;
};

const classifyIA = (razao) => {
  const text = String(razao ?? "").toLowerCase();
  if (text.includes("iatf")) return "iatf";
  if (text.includes("ressinc") || text.includes("resynch")) return "ressinc";
  return "cio";
};

const getDGStatus = (meta) => {
  const raw = meta?.dg ?? meta?.DG ?? "";
  const text = String(raw).trim().toLowerCase();
  if (text === "prenhe") return "Prenhe";
  if (text === "vazia") return "Vazia";
  return null;
};

const buildFinalDGMap = (eventosDG) => {
  const mapa = new Map();
  eventosDG.forEach((evento) => {
    if (!evento?.evento_pai_id) return;
    const status = getDGStatus(evento?.meta);
    if (!status) return;
    const data = new Date(evento?.data_evento);
    const atual = mapa.get(evento.evento_pai_id);
    if (!atual || data > atual.data) {
      mapa.set(evento.evento_pai_id, { status, data });
    }
  });
  return mapa;
};

const buildMonthlyData = ({ eventosIA, dgFinalMap, buckets }) => {
  const base = new Map(
    buckets.map((bucket) => [
      bucket.key,
      {
        mes: bucket.label,
        total: 0,
        concepcoes: 0,
        diagnosticados: 0,
        iatf: 0,
        cio: 0,
        ressinc: 0,
      },
    ])
  );

  eventosIA.forEach((evento) => {
    const key = getMonthKey(evento?.data_evento);
    const bucket = base.get(key);
    if (!bucket) return;

    bucket.total += 1;
    const classificacao = classifyIA(evento?.razao);
    bucket[classificacao] += 1;

    const dgFinal = dgFinalMap.get(evento?.id);
    if (dgFinal) {
      bucket.diagnosticados += 1;
      if (dgFinal.status === "Prenhe") {
        bucket.concepcoes += 1;
      }
    }
  });

  return buckets.map((bucket) => {
    const data = base.get(bucket.key);
    const diagnosticados = data?.diagnosticados ?? 0;
    const concepcoes = data?.concepcoes ?? 0;
    const taxa = diagnosticados > 0 ? Math.round((concepcoes / diagnosticados) * 100) : null;
    return { ...data, taxa };
  });
};

const Icon = ({ name, size = 16, color = "currentColor", style = {} }) => {
  const icons = {
    plus: <path d="M12 4v16m8-8H4" />,
    search: <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
    close: <path d="M6 18L18 6M6 6l12 12" />,
    chart: (
      <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    ),
    award: (
      <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    ),
    trendUp: <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
    user: <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={style}
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icons[name]}
    </svg>
  );
};

const Button = ({ children, variant = "primary", onClick, icon = null, style = {}, disabled = false }) => {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "10px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s",
    border: "none",
    opacity: disabled ? 0.6 : 1,
  };
  const variants = {
    primary: { background: TOKENS.colors.primary, color: "#fff", ...style },
    secondary: { background: "#fff", color: TOKENS.colors.gray700, border: `1px solid ${TOKENS.colors.gray200}`, ...style },
    ghost: { background: "transparent", color: TOKENS.colors.gray600, ...style },
  };
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled} style={{ ...base, ...variants[variant] }}>
      {icon && <Icon name={icon} size={14} />}
      {children}
    </button>
  );
};

/* ========================= Tooltip FIXED (não corta) ========================= */
function TooltipFixed({ open, anchorRect, data, taxa, onClose }) {
  if (!open || !anchorRect || !data) return null;

  const tooltipW = 170;
  const tooltipH = 170;
  const margin = 10;

  let left = anchorRect.left + anchorRect.width / 2 - tooltipW / 2;
  let top = anchorRect.top - tooltipH - 12;

  if (top < margin) top = anchorRect.bottom + 12;
  left = Math.max(margin, Math.min(left, window.innerWidth - tooltipW - margin));

  const arrowUp = top > anchorRect.top; // tooltip abaixo do ponto
  const arrowStyle = arrowUp
    ? {
        position: "absolute",
        top: -12,
        left: "50%",
        transform: "translateX(-50%)",
        border: "6px solid transparent",
        borderBottomColor: TOKENS.colors.gray900,
      }
    : {
        position: "absolute",
        top: "100%",
        left: "50%",
        transform: "translateX(-50%)",
        border: "6px solid transparent",
        borderTopColor: TOKENS.colors.gray900,
      };

  const taxaLabel = taxa === null || taxa === undefined ? "ND" : `${taxa}%`;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 20000,
        pointerEvents: "none",
      }}
      onMouseLeave={onClose}
    >
      <div
        style={{
          position: "fixed",
          left,
          top,
          width: tooltipW,
          background: TOKENS.colors.gray900,
          color: "#fff",
          padding: "12px",
          borderRadius: "10px",
          fontSize: "12px",
          boxShadow: TOKENS.shadows.xl,
          pointerEvents: "auto",
        }}
      >
        <div style={{ fontWeight: "800", marginBottom: "8px", color: TOKENS.colors.gray100 }}>{data.mes}</div>

        <div style={{ display: "grid", gap: "4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#9CA3AF" }}>IATF:</span>
            <span>{data.iatf ?? 0}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#9CA3AF" }}>IA Cio:</span>
            <span>{data.cio ?? 0}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#9CA3AF" }}>Ressinc:</span>
            <span>{data.ressinc ?? 0}</span>
          </div>
          <div
            style={{
              borderTop: "1px solid #374151",
              marginTop: "6px",
              paddingTop: "6px",
              display: "flex",
              justifyContent: "space-between",
              fontWeight: "800",
            }}
          >
            <span>Total:</span>
            <span>{data.total ?? 0}</span>
          </div>
          <div
            style={{
              color: taxa === null || taxa === undefined ? TOKENS.colors.gray400 : "#6EE7B7",
              display: "flex",
              justifyContent: "space-between",
              fontWeight: "700",
            }}
          >
            <span>Taxa:</span>
            <span>{taxaLabel}</span>
          </div>
        </div>

        <div style={arrowStyle} />
      </div>
    </div>
  );
}

/* ========================= GRÁFICO (linha por cima + conecta no ponto) ========================= */
const GraficoPerformance = ({ dados, titulo, subtitulo, destaque = false }) => {
  const chartHeight = 240;
  const chartPadding = { top: 20, bottom: 40, left: 10, right: 40 };
  const innerH = chartHeight - chartPadding.top - chartPadding.bottom;

  const maxTotal = Math.max(1, ...dados.map((d) => d.total || 0));

  // ✅ X CENTRAL de cada coluna (casa com o "left:50%" do ponto)
  // antes: idx/(n-1)*100 (isso cai nas "bordas" e desencontra)
  const getX = (index) => {
    const n = Math.max(1, dados.length);
    return ((index + 0.5) / n) * 100;
  };

  // Y em px dentro do chartHeight
  const getY = (taxa) => chartPadding.top + ((100 - taxa) / 100) * innerH;

  const getTaxa = (item) => {
    if (item?.taxa === null) return null;
    if (item?.taxa !== undefined) return Math.max(0, Math.min(100, item.taxa));
    const diagnosticados = item?.diagnosticados ?? 0;
    const conc = item?.concepcoes ?? 0;
    if (diagnosticados <= 0) return null;
    const t = Math.round((conc / diagnosticados) * 100);
    return Math.max(0, Math.min(100, t));
  };

  const points = dados.map((item, idx) => {
    const taxa = getTaxa(item);
    return {
      x: getX(idx),
      y: taxa === null ? null : getY(taxa),
      taxa,
      item,
    };
  });

  const lineSegments = [];
  let currentSegment = [];
  points.forEach((point) => {
    if (point.taxa === null) {
      if (currentSegment.length) {
        lineSegments.push(currentSegment);
        currentSegment = [];
      }
      return;
    }
    currentSegment.push(point);
  });
  if (currentSegment.length) lineSegments.push(currentSegment);

  const hasAnyTaxa = points.some((point) => point.taxa !== null);
  const hasGaps = points.some((point) => point.taxa === null);

  const polygonPoints = (() => {
    if (!hasAnyTaxa || hasGaps) return "";
    const baseY = chartHeight - chartPadding.bottom;
    const x0 = getX(0);
    const xN = getX(dados.length - 1);
    const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
    return `${x0},${baseY} ${linePoints} ${xN},${baseY}`;
  })();

  const [tooltip, setTooltip] = useState(null);
  const openTooltip = (e, item, taxa) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ rect, item, taxa });
  };
  const closeTooltip = () => setTooltip(null);

  // ✅ Contraste das barras (principal e destaque)
  const barBase = destaque ? "rgba(37, 99, 235, 0.34)" : "rgba(37, 99, 235, 0.28)";
  const barHover = destaque ? "rgba(37, 99, 235, 0.58)" : "rgba(37, 99, 235, 0.46)";
  const barBorder = destaque ? "rgba(37, 99, 235, 0.55)" : "rgba(37, 99, 235, 0.35)";

  return (
    <div
      style={{
        background: destaque ? TOKENS.colors.primaryLight : "#fff",
        borderRadius: "16px",
        padding: "24px",
        border: `1px solid ${destaque ? TOKENS.colors.primary : TOKENS.colors.gray200}`,
        boxShadow: destaque ? "0 0 0 4px rgba(37, 99, 235, 0.10)" : TOKENS.shadows.md,
        height: "100%",
        overflow: "visible",
        position: "relative",
      }}
    >
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: "800", color: TOKENS.colors.gray900 }}>{titulo}</h3>
        {subtitulo && <p style={{ margin: 0, fontSize: "13px", color: TOKENS.colors.gray500 }}>{subtitulo}</p>}
      </div>

      <div style={{ position: "relative", height: chartHeight, marginBottom: "16px", overflow: "visible" }}>
        {/* Grid + labels */}
        <div
          style={{
            position: "absolute",
            inset: `${chartPadding.top}px ${chartPadding.right}px ${chartPadding.bottom}px ${chartPadding.left}px`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            zIndex: 1,
            pointerEvents: "none",
          }}
        >
          {[100, 75, 50, 25, 0].map((pct, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", height: "1px" }}>
              <span
                style={{
                  position: "absolute",
                  right: "-32px",
                  fontSize: "11px",
                  color: TOKENS.colors.gray400,
                  fontWeight: "700",
                }}
              >
                {pct}%
              </span>
              <div style={{ flex: 1, borderTop: `1px ${i === 0 || i === 4 ? "solid" : "dashed"} ${TOKENS.colors.gray200}` }} />
            </div>
          ))}
        </div>

        {/* Barras + Pontos (ficam embaixo da linha) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "flex-end",
            padding: `${chartPadding.top}px ${chartPadding.right}px ${chartPadding.bottom}px ${chartPadding.left}px`,
            overflow: "visible",
            zIndex: 2,
          }}
        >
          {dados.map((item, idx) => {
            const total = item.total || 0;
            const taxa = getTaxa(item);
            const alturaBarra = (total / maxTotal) * innerH;

            const isHovered = tooltip?.item?.mes === item.mes;

            return (
              <div
                key={idx}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  position: "relative",
                  height: "100%",
                  justifyContent: "flex-end",
                  overflow: "visible",
                }}
              >
                {/* Ponto (hit area) */}
                {taxa !== null && (
                  <div
                    onMouseEnter={(e) => openTooltip(e, item, taxa)}
                    onMouseLeave={closeTooltip}
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: `${getY(taxa) - chartPadding.top}px`,
                      width: "18px",
                      height: "18px",
                      transform: "translateX(-50%)",
                      cursor: "default",
                      zIndex: 5,
                    }}
                  >
                    <div
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background: TOKENS.colors.success,
                        border: "2px solid #fff",
                        boxShadow: TOKENS.shadows.md,
                        transform: isHovered ? "scale(1.25)" : "scale(1)",
                        transition: "transform .15s",
                        margin: "4px auto 0",
                      }}
                    />
                  </div>
                )}

                {/* Barra */}
                <div
                  onMouseEnter={(e) => openTooltip(e, item, taxa)}
                  onMouseLeave={closeTooltip}
                  style={{
                    width: "62%",
                    height: `${alturaBarra}px`,
                    background: isHovered ? barHover : barBase,
                    borderRadius: "8px 8px 0 0",
                    transition: "all 0.2s ease",
                    position: "relative",
                    border: `1px solid ${barBorder}`,
                    boxShadow: isHovered ? "0 10px 20px rgba(37,99,235,0.18)" : "none",
                  }}
                >
                  {isHovered && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-20px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        fontSize: "12px",
                        fontWeight: "900",
                        color: TOKENS.colors.primary,
                      }}
                    >
                      {total}
                    </div>
                  )}
                </div>

                {/* Mês */}
                <div style={{ marginTop: "8px", fontSize: "12px", fontWeight: "800", color: TOKENS.colors.gray600 }}>
                  {item.mes}
                </div>
              </div>
            );
          })}
        </div>

        {/* ✅ SVG POR CIMA DAS BARRAS (linha/área por cima) */}
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            overflow: "visible",
            pointerEvents: "none",
            zIndex: 4,
          }}
          viewBox={`0 0 100 ${chartHeight}`}
          preserveAspectRatio="none"
        >
          {polygonPoints && <polygon points={polygonPoints} fill="rgba(16, 185, 129, 0.14)" />}
          {lineSegments.map((segment, index) => (
            <polyline
              key={`segment-${index}`}
              points={segment.map((point) => `${point.x},${point.y}`).join(" ")}
              fill="none"
              stroke={TOKENS.colors.success}
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </svg>
      </div>

      {/* Legenda */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          justifyContent: "center",
          paddingTop: "8px",
          borderTop: `1px solid ${TOKENS.colors.gray100}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "12px",
              height: "12px",
              background: barBase,
              borderRadius: "2px",
              border: `1px solid ${TOKENS.colors.primary}`,
            }}
          />
          <span style={{ fontSize: "12px", color: TOKENS.colors.gray600, fontWeight: "700" }}>Volume Total</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "20px", height: "3px", background: TOKENS.colors.success, borderRadius: "2px" }} />
          <span style={{ fontSize: "12px", color: TOKENS.colors.gray600, fontWeight: "700" }}>Taxa de Concepção</span>
        </div>
      </div>

      <TooltipFixed open={!!tooltip} anchorRect={tooltip?.rect} data={tooltip?.item} taxa={tooltip?.taxa} onClose={closeTooltip} />
    </div>
  );
};

/* ========================= COMPONENTES ========================= */
const InseminadorItem = ({ data, onClick, onEdit }) => {
  const iniciais = data.nome?.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
  const tipoColors = {
    Veterinário: TOKENS.colors.purple,
    Inseminador: TOKENS.colors.primary,
    Técnico: TOKENS.colors.cyan,
    Estagiário: TOKENS.colors.orange,
  };

  const taxaValue = data.taxa_concepcao;
  const taxaDisponivel = taxaValue !== null && taxaValue !== undefined;
  const taxaLabel = taxaDisponivel ? `${taxaValue}%` : "ND";
  const taxaColor = taxaDisponivel
    ? taxaValue > 70
      ? TOKENS.colors.success
      : taxaValue > 50
      ? TOKENS.colors.warning
      : TOKENS.colors.danger
    : TOKENS.colors.gray500;

  return (
    <div
      onClick={() => onClick(data)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        padding: "16px 20px",
        background: "#fff",
        borderRadius: "12px",
        border: `1px solid ${TOKENS.colors.gray200}`,
        cursor: "pointer",
        transition: "all 0.2s",
        boxShadow: TOKENS.shadows.sm,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "12px",
          background: tipoColors[data.tipo] || TOKENS.colors.gray400,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "900",
          fontSize: "16px",
        }}
      >
        {iniciais}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <span style={{ fontSize: "15px", fontWeight: "800", color: TOKENS.colors.gray900 }}>{data.nome}</span>
          <span
            style={{
              fontSize: "10px",
              padding: "2px 8px",
              borderRadius: "12px",
              background: TOKENS.colors.gray100,
              color: TOKENS.colors.gray600,
              fontWeight: "800",
              textTransform: "uppercase",
            }}
          >
            {data.tipo}
          </span>
        </div>
        <div style={{ fontSize: "12px", color: TOKENS.colors.gray500 }}>
          {data.registro || "Sem registro"} • {data.ativo ? "Ativo" : "Inativo"}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "20px",
              fontWeight: "900",
              color: taxaColor,
            }}
          >
            {taxaLabel}
          </div>
          <div style={{ fontSize: "10px", color: TOKENS.colors.gray400, fontWeight: "800", textTransform: "uppercase" }}>
            Concepção
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(data);
          }}
          style={{ padding: "8px" }}
        >
          ✏️
        </Button>
      </div>
    </div>
  );
};

/* ========================= MODAIS ========================= */
const ModalInseminador = ({ isOpen, onClose, onSave, initialData = null }) => {
  const [form, setForm] = useState({ nome: "", tipo: "Inseminador", registro: "", ativo: true, observacoes: "" });

  useEffect(() => {
    if (initialData) setForm({ ...initialData });
    else setForm({ nome: "", tipo: "Inseminador", registro: "", ativo: true, observacoes: "" });
  }, [initialData, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
        zIndex: 30000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: "#fff", width: "100%", maxWidth: "440px", borderRadius: "16px", boxShadow: TOKENS.shadows.xl, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${TOKENS.colors.gray200}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "900" }}>{initialData ? "Editar" : "Novo"} Inseminador</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <Icon name="close" size={20} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(form);
          }}
          style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <div>
            <label style={{ fontSize: "12px", fontWeight: "800", color: TOKENS.colors.gray700, marginBottom: "6px", display: "block" }}>NOME *</label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${TOKENS.colors.gray200}`, fontSize: "14px" }}
              autoFocus
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "800", color: TOKENS.colors.gray700, marginBottom: "6px", display: "block" }}>FUNÇÃO</label>
              <select
                value={form.tipo}
                onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${TOKENS.colors.gray200}`, fontSize: "14px" }}
              >
                {["Veterinário", "Inseminador", "Técnico", "Estagiário", "Outro"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "800", color: TOKENS.colors.gray700, marginBottom: "6px", display: "block" }}>REGISTRO</label>
              <input
                type="text"
                value={form.registro}
                placeholder={form.tipo === "Veterinário" ? "CRMV/UF" : "Nº Registro"}
                onChange={(e) => setForm((f) => ({ ...f, registro: e.target.value }))}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${TOKENS.colors.gray200}`, fontSize: "14px" }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: "800", color: TOKENS.colors.gray700, marginBottom: "6px", display: "block" }}>OBSERVAÇÕES</label>
            <textarea
              value={form.observacoes}
              rows={3}
              onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${TOKENS.colors.gray200}`, fontSize: "14px", resize: "none" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px", background: form.ativo ? TOKENS.colors.successLight : TOKENS.colors.gray100, borderRadius: "8px" }}>
            <input type="checkbox" id="ativo" checked={form.ativo} onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))} style={{ width: "16px", height: "16px" }} />
            <label htmlFor="ativo" style={{ fontSize: "13px", cursor: "pointer", fontWeight: "700" }}>
              Ativo para novas IAs
            </label>
          </div>

          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "8px" }}>
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="primary" disabled={!form.nome.trim()}>
              Salvar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ModalDetalhes = ({ isOpen, onClose, inseminador, dadosIndividuais, resumo, rankingPosicao }) => {
  if (!isOpen || !inseminador) return null;

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 30000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "18px",
      }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "#fff",
          width: "100%",
          maxWidth: "920px",
          borderRadius: "16px",
          boxShadow: TOKENS.shadows.xl,
          overflow: "hidden",
          maxHeight: "calc(100vh - 36px)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "22px 24px",
            borderBottom: `1px solid ${TOKENS.colors.gray200}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: TOKENS.colors.gray50,
            flex: "0 0 auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                background: TOKENS.colors.primary,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "900",
                fontSize: "20px",
              }}
            >
              {inseminador.nome?.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: "900" }}>{inseminador.nome}</h2>
              <div style={{ display: "flex", gap: "8px", fontSize: "13px", color: TOKENS.colors.gray600, flexWrap: "wrap" }}>
                <span style={{ padding: "4px 12px", background: TOKENS.colors.primaryLight, color: TOKENS.colors.primary, borderRadius: "20px", fontWeight: "800" }}>{inseminador.tipo}</span>
                {inseminador.registro && <span style={{ padding: "4px 12px", background: TOKENS.colors.gray100, borderRadius: "20px" }}>{inseminador.registro}</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: "8px" }}>
            <Icon name="close" size={24} />
          </button>
        </div>

        <div style={{ padding: "24px", background: TOKENS.colors.gray50, overflow: "auto", flex: "1 1 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
            {[
              { label: "Total IAs (Ano)", value: resumo?.totalIAs ?? 0, color: TOKENS.colors.primary, bg: TOKENS.colors.primaryLight },
              {
                label: "Taxa Média",
                value: resumo?.taxaMedia === null || resumo?.taxaMedia === undefined ? "ND" : `${resumo?.taxaMedia}%`,
                color: resumo?.taxaMedia === null || resumo?.taxaMedia === undefined ? TOKENS.colors.gray500 : TOKENS.colors.success,
                bg: resumo?.taxaMedia === null || resumo?.taxaMedia === undefined ? TOKENS.colors.gray100 : TOKENS.colors.successLight,
              },
              { label: "IATF Realizadas", value: resumo?.iatfRealizadas ?? 0, color: TOKENS.colors.purple, bg: TOKENS.colors.purpleLight },
              { label: "Ranking Geral", value: rankingPosicao ? `#${rankingPosicao}` : "—", color: TOKENS.colors.warning, bg: TOKENS.colors.warningLight },
            ].map((stat, i) => (
              <div key={i} style={{ background: stat.bg, padding: "18px", borderRadius: "12px", textAlign: "center", border: `2px solid ${stat.color}20` }}>
                <div style={{ fontSize: "28px", fontWeight: "900", color: stat.color, marginBottom: "4px" }}>{stat.value}</div>
                <div style={{ fontSize: "12px", color: TOKENS.colors.gray600, fontWeight: "700" }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <GraficoPerformance dados={dadosIndividuais} titulo={`Performance de ${inseminador.nome?.split(" ")[0]}`} subtitulo="Evolução mensal individual de inseminações" destaque={true} />

          {inseminador.observacoes && (
            <div style={{ marginTop: "24px", padding: "16px", background: "#fff", borderRadius: "12px", borderLeft: `4px solid ${TOKENS.colors.warning}` }}>
              <div style={{ fontSize: "12px", fontWeight: "900", color: TOKENS.colors.gray700, marginBottom: "8px", textTransform: "uppercase" }}>Observações</div>
              <div style={{ fontSize: "14px", color: TOKENS.colors.gray600, lineHeight: 1.6 }}>{inseminador.observacoes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ========================= PÁGINA PRINCIPAL ========================= */
export default function Inseminador() {
  const { fazendaAtualId } = useFazenda();
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDetalhes, setModalDetalhes] = useState(false);
  const [selecionado, setSelecionado] = useState(null);
  const [editando, setEditando] = useState(null);
  const [busca, setBusca] = useState("");
  const [eventosIA, setEventosIA] = useState([]);
  const [eventosDG, setEventosDG] = useState([]);
  const [loadingEventos, setLoadingEventos] = useState(true);

  const logSupabaseError = (contexto, error) => {
    console.error(`${contexto}:`, {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      error,
    });
  };

  useEffect(() => {
    const fetchEventos = async () => {
      if (!fazendaAtualId) {
        setEventosIA([]);
        setEventosDG([]);
        setLoadingEventos(false);
        return;
      }

      setLoadingEventos(true);
      const dataMin = new Date();
      dataMin.setDate(dataMin.getDate() - 210);
      const dataMinISO = dataMin.toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("repro_eventos")
        .select("id,tipo,data_evento,fazenda_id,inseminador_id,touro_id,touro_nome,razao,evento_pai_id,meta")
        .eq("fazenda_id", fazendaAtualId)
        .in("tipo", ["IA", "DG"])
        .gte("data_evento", dataMinISO);

      if (error) {
        logSupabaseError("Erro ao buscar eventos reprodutivos", error);
        setEventosIA([]);
        setEventosDG([]);
        setLoadingEventos(false);
        return;
      }

      const ias = [];
      const dgs = [];
      (data ?? []).forEach((evento) => {
        if (evento?.tipo === "IA") {
          ias.push(evento);
        } else if (evento?.tipo === "DG") {
          dgs.push(evento);
        }
      });

      setEventosIA(ias);
      setEventosDG(dgs);
      setLoadingEventos(false);
    };

    fetchEventos();
  }, [fazendaAtualId]);

  const monthBuckets = useMemo(() => getMonthBuckets(6), []);
  const monthBuckets12 = useMemo(() => getMonthBuckets(12), []);

  useEffect(() => {
    const fetchInseminadores = async () => {
      if (!fazendaAtualId) {
        setLista([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from("inseminadores")
        .select("id,fazenda_id,user_id,nome,tipo,registro,ativo,observacoes,created_at,updated_at")
        .eq("fazenda_id", fazendaAtualId)
        .order("nome", { ascending: true });

      if (error) {
        logSupabaseError("Erro ao buscar inseminadores", error);
        setLista([]);
      } else {
        setLista(
          (data ?? []).map((item) => {
            return {
              ...item,
              nome: item.nome ?? "",
              tipo: item.tipo ?? "",
              registro: item.registro ?? "",
              observacoes: item.observacoes ?? "",
              ativo: item.ativo ?? true,
              taxa_concepcao: item.taxa_concepcao ?? null,
            };
          })
        );
      }
      setLoading(false);
    };

    fetchInseminadores();
  }, [fazendaAtualId]);

  const currentMonthKey = useMemo(() => getMonthKey(new Date()), []);
  const dgFinalMap = useMemo(() => buildFinalDGMap(eventosDG), [eventosDG]);

  const dadosGerais = useMemo(() => {
    return buildMonthlyData({ eventosIA, dgFinalMap, buckets: monthBuckets });
  }, [eventosIA, dgFinalMap, monthBuckets]);

  const metricasPorInseminador = useMemo(() => {
    const mapa = new Map();

    eventosIA.forEach((evento) => {
      if (!evento?.inseminador_id) return;
      const mesKey = getMonthKey(evento?.data_evento);
      if (mesKey !== currentMonthKey) return;

      if (!mapa.has(evento.inseminador_id)) {
        mapa.set(evento.inseminador_id, { ias_mes: 0, prenhe_mes: 0, vazia_mes: 0, diag_mes: 0, taxa_concepcao: null });
      }

      const registro = mapa.get(evento.inseminador_id);
      registro.ias_mes += 1;

      const dgFinal = dgFinalMap.get(evento?.id);
      if (dgFinal?.status === "Prenhe") {
        registro.prenhe_mes += 1;
        registro.diag_mes += 1;
      } else if (dgFinal?.status === "Vazia") {
        registro.vazia_mes += 1;
        registro.diag_mes += 1;
      }
    });

    mapa.forEach((registro) => {
      registro.taxa_concepcao = registro.diag_mes > 0 ? Math.round((registro.prenhe_mes / registro.diag_mes) * 100) : null;
    });

    return mapa;
  }, [eventosIA, dgFinalMap, currentMonthKey]);

  const listaComMetricas = useMemo(() => {
    return lista.map((item) => {
      const metricas = metricasPorInseminador.get(item.id) ?? { ias_mes: 0, prenhe_mes: 0, vazia_mes: 0, diag_mes: 0, taxa_concepcao: null };
      return { ...item, ...metricas, taxa_concepcao: metricas.taxa_concepcao ?? null };
    });
  }, [lista, metricasPorInseminador]);

  const rankingGeral = useMemo(() => {
    const existeDG = listaComMetricas.some((item) => item.diag_mes > 0);
    return [...listaComMetricas]
      .filter((i) => i.ativo)
      .sort((a, b) => {
        if (!existeDG) {
          return b.ias_mes - a.ias_mes;
        }
        const taxaA = a.taxa_concepcao ?? -1;
        const taxaB = b.taxa_concepcao ?? -1;
        if (taxaB !== taxaA) return taxaB - taxaA;
        if (b.diag_mes !== a.diag_mes) return b.diag_mes - a.diag_mes;
        return b.ias_mes - a.ias_mes;
      });
  }, [listaComMetricas]);

  const rankingTop3 = useMemo(() => rankingGeral.slice(0, 3), [rankingGeral]);

  const destaqueDoMes = useMemo(() => rankingGeral.find((item) => item.ias_mes > 0) ?? null, [rankingGeral]);

  const filtered = useMemo(() => {
    return listaComMetricas.filter((i) => i.nome.toLowerCase().includes(busca.toLowerCase()));
  }, [listaComMetricas, busca]);

  const dadosIndividuais = useMemo(() => {
    if (!selecionado?.id) {
      return buildMonthlyData({ eventosIA: [], dgFinalMap, buckets: monthBuckets });
    }
    const iasFiltradas = eventosIA.filter((evento) => evento?.inseminador_id === selecionado.id);
    return buildMonthlyData({ eventosIA: iasFiltradas, dgFinalMap, buckets: monthBuckets });
  }, [selecionado, eventosIA, dgFinalMap, monthBuckets]);

  const resumoIndividuo = useMemo(() => {
    if (!selecionado?.id) {
      return { totalIAs: 0, taxaMedia: null, iatfRealizadas: 0 };
    }
    const keys12 = new Set(monthBuckets12.map((bucket) => bucket.key));
    let totalIAs = 0;
    let iatfRealizadas = 0;
    let prenheTotal = 0;
    let diagTotal = 0;

    eventosIA.forEach((evento) => {
      if (evento?.inseminador_id !== selecionado.id) return;
      const mesKey = getMonthKey(evento?.data_evento);
      if (!keys12.has(mesKey)) return;

      totalIAs += 1;
      if (classifyIA(evento?.razao) === "iatf") {
        iatfRealizadas += 1;
      }

      const dgFinal = dgFinalMap.get(evento?.id);
      if (dgFinal?.status === "Prenhe") {
        prenheTotal += 1;
        diagTotal += 1;
      } else if (dgFinal?.status === "Vazia") {
        diagTotal += 1;
      }
    });

    const taxaMedia = diagTotal > 0 ? Math.round((prenheTotal / diagTotal) * 100) : null;

    return { totalIAs, taxaMedia, iatfRealizadas };
  }, [selecionado, eventosIA, dgFinalMap, monthBuckets12]);

  const rankingPosicao = useMemo(() => {
    if (!selecionado?.id) return null;
    const index = rankingGeral.findIndex((item) => item.id === selecionado.id);
    return index >= 0 ? index + 1 : null;
  }, [selecionado, rankingGeral]);

  const getAuthUid = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Erro ao obter auth.uid():", error);
    }
    return data?.user?.id ?? null;
  };

  const handleSave = async (formData) => {
    if (!fazendaAtualId) {
      console.warn("Tentativa de salvar inseminador sem fazenda selecionada.");
      return;
    }

    const authUid = await getAuthUid();
    console.log("Inseminador salvar - fazendaAtualId:", fazendaAtualId, "auth.uid():", authUid);

    const payload = {
      nome: String(formData?.nome || formData?.nome_profissional || "").trim(),
      tipo:
        String(formData?.tipo || formData?.tipo_profissional || "Inseminador").trim() ||
        "Inseminador",
      registro: String(formData?.registro || "").trim() || null,
      ativo: formData?.ativo !== false,
      observacoes: String(formData?.observacoes || formData?.observacao || "").trim() || null,
      user_id: authUid,
      fazenda_id: fazendaAtualId,
    };

    try {
      if (editando?.id) {
        const { data, error } = await supabase
          .from("inseminadores")
          .update({
            nome: payload.nome,
            tipo: payload.tipo,
            registro: payload.registro,
            ativo: payload.ativo,
            observacoes: payload.observacoes,
            user_id: payload.user_id,
          })
          .eq("id", editando.id)
          .eq("fazenda_id", fazendaAtualId)
          .select()
          .single();

        if (error) {
          logSupabaseError("Erro ao atualizar inseminador", error);
          return;
        }

        setLista((prev) =>
          prev.map((item) =>
            item.id === editando.id
              ? {
                  ...data,
                  nome: data.nome ?? item.nome,
                  tipo: data.tipo ?? item.tipo,
                  registro: data.registro ?? item.registro,
                  observacoes: data.observacoes ?? item.observacoes,
                  ativo: data.ativo ?? item.ativo,
                  taxa_concepcao: data?.taxa_concepcao ?? item.taxa_concepcao ?? null,
                }
              : item
          )
        );
      } else {
        if (!payload.fazenda_id)
          throw {
            code: "VALIDATION",
            message: "Selecione uma fazenda antes de salvar.",
          };
        if (!payload.nome)
          throw { code: "VALIDATION", message: "Informe o nome do inseminador." };

        console.log("Payload insert inseminador (DB):", payload);
        const { data, error } = await supabase
          .from("inseminadores")
          .insert(payload)
          .select("*");

        if (error) {
          logSupabaseError("Erro ao inserir inseminador", error);
          return;
        }

        const inserted = Array.isArray(data) ? data[0] : data;

        setLista((prev) => [
          {
            ...inserted,
            nome: inserted?.nome ?? payload.nome ?? "",
            tipo: inserted?.tipo ?? payload.tipo ?? "",
            registro: inserted?.registro ?? payload.registro ?? "",
            observacoes: inserted?.observacoes ?? payload.observacoes ?? "",
            ativo: inserted?.ativo ?? payload.ativo,
            taxa_concepcao: inserted?.taxa_concepcao ?? null,
          },
          ...prev,
        ]);
      }
      setModalOpen(false);
      setEditando(null);
    } catch (error) {
      console.error("Erro ao salvar inseminador:", {
        code: error?.code,
        message: error?.message,
        details: error?.details,
        error,
      });
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: TOKENS.colors.gray50, fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${TOKENS.colors.gray200}`, padding: "20px 32px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ padding: "12px", background: TOKENS.colors.primaryLight, borderRadius: "12px" }}>
              <Icon name="user" size={24} color={TOKENS.colors.primary} />
            </div>
            <div>
              <h1 style={{ margin: "0 0 2px", fontSize: "24px", fontWeight: "900", color: TOKENS.colors.gray900 }}>Equipe de Inseminação</h1>
              <p style={{ margin: 0, fontSize: "13px", color: TOKENS.colors.gray500 }}>{listaComMetricas.filter((i) => i.ativo).length} profissionais ativos</p>
            </div>
          </div>
          <Button
            variant="primary"
            icon="plus"
            onClick={() => {
              setEditando(null);
              setModalOpen(true);
            }}
          >
            Novo Profissional
          </Button>
        </div>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px" }}>
        {/* Seção superior */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", marginBottom: "32px" }}>
          <GraficoPerformance dados={dadosGerais} titulo="Volume Geral da Equipe" subtitulo="Total de inseminações e taxa de concepção dos últimos 6 meses" />

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: `linear-gradient(135deg, ${TOKENS.colors.primary}, ${TOKENS.colors.primaryDark})`, color: "#fff", padding: "20px", borderRadius: "16px", boxShadow: TOKENS.shadows.lg }}>
              <div style={{ fontSize: "12px", fontWeight: "800", opacity: 0.9, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>Destaque do Mês</div>
              {destaqueDoMes ? (
                <>
                  <div style={{ fontSize: "22px", fontWeight: "900", marginBottom: "4px" }}>{destaqueDoMes.nome}</div>
                  <div style={{ fontSize: "14px", opacity: 0.9 }}>
                    {destaqueDoMes.taxa_concepcao === null || destaqueDoMes.taxa_concepcao === undefined
                      ? "Taxa ND"
                      : `${destaqueDoMes.taxa_concepcao}% taxa de concepção`}
                  </div>
                  <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.2)", display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                    <span>{destaqueDoMes.ias_mes} IAs realizadas</span>
                    <span>{destaqueDoMes.tipo}</span>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: "16px", fontWeight: "700" }}>Sem dados no mês</div>
              )}
            </div>

            <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: `2px solid ${TOKENS.colors.gray200}`, boxShadow: TOKENS.shadows.md }}>
              <div style={{ fontSize: "12px", fontWeight: "900", color: TOKENS.colors.gray700, marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>🏆 Ranking Top 3</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {loadingEventos ? (
                  <div style={{ color: TOKENS.colors.gray400, fontSize: "13px" }}>Carregando ranking...</div>
                ) : rankingTop3.length > 0 ? (
                  rankingTop3.map((item, idx) => (
                    <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          background: idx === 0 ? "#FEF3C7" : idx === 1 ? "#F3F4F6" : "#FFEDD5",
                          color: idx === 0 ? "#D97706" : idx === 1 ? "#6B7280" : "#C2410C",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: "900",
                        }}
                      >
                        {idx + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "14px", fontWeight: "800", color: TOKENS.colors.gray800 }}>{item.nome}</div>
                        <div style={{ fontSize: "11px", color: TOKENS.colors.gray500 }}>{item.tipo}</div>
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: "900",
                          color:
                            item.taxa_concepcao === null || item.taxa_concepcao === undefined ? TOKENS.colors.gray500 : TOKENS.colors.success,
                        }}
                      >
                        {item.taxa_concepcao === null || item.taxa_concepcao === undefined ? "ND" : `${item.taxa_concepcao}%`}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: TOKENS.colors.gray400, fontSize: "13px" }}>Sem dados no período</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lista */}
        <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: TOKENS.shadows.md, border: `1px solid ${TOKENS.colors.gray200}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "900", color: TOKENS.colors.gray800 }}>Todos os Profissionais</h3>

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <Icon name="search" size={16} color={TOKENS.colors.gray400} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  style={{ padding: "10px 12px 10px 36px", borderRadius: "8px", border: `1px solid ${TOKENS.colors.gray200}`, fontSize: "14px", width: "240px", outline: "none" }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px", color: TOKENS.colors.gray400 }}>Carregando...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: TOKENS.colors.gray400 }}>Nenhum resultado encontrado</div>
            ) : (
              filtered.map((item) => (
                <InseminadorItem
                  key={item.id}
                  data={item}
                  onClick={(data) => {
                    setSelecionado(data);
                    setModalDetalhes(true);
                  }}
                  onEdit={(data) => {
                    setEditando(data);
                    setModalOpen(true);
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <ModalInseminador
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditando(null);
        }}
        onSave={handleSave}
        initialData={editando}
      />

      <ModalDetalhes
        isOpen={modalDetalhes}
        onClose={() => setModalDetalhes(false)}
        inseminador={selecionado}
        dadosIndividuais={dadosIndividuais}
        resumo={resumoIndividuo}
        rankingPosicao={rankingPosicao}
      />
    </div>
  );
}
