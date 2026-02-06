// src/pages/Leite/ResumoLeiteDia.jsx
import React from "react";

/* ========== DESIGN SYSTEM ========== */
const theme = {
  colors: {
    slate: { 50: "#f8fafc", 100: "#f1f5f9", 200: "#e2e8f0", 400: "#94a3b8", 500: "#64748b", 600: "#475569", 800: "#1e293b", 900: "#0f172a" },
    brand: { 50: "#eff6ff", 100: "#dbeafe", 500: "#3b82f6", 600: "#2563eb" },
    success: { 50: "#f0fdf4", 100: "#dcfce7", 500: "#22c55e", 600: "#16a34a" },
    warning: { 50: "#fffbeb", 100: "#fef3c7", 500: "#f59e0b", 600: "#d97706" },
    danger: { 50: "#fef2f2", 100: "#fee2e2", 500: "#ef4444", 600: "#dc2626" },
  },
  shadows: { sm: "0 1px 3px 0 rgb(0 0 0 / 0.1)", md: "0 4px 6px -1px rgb(0 0 0 / 0.1)", lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)" },
  radius: { md: "12px", lg: "16px" },
};

/* ========== ÍCONES ========== */
const Icon = ({ path, size = 20, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
);

const Icons = {
  drop: <><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></>,
  chart: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
  trophy: <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></>,
  alert: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
  trendUp: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
  cow: <><path d="M12 8c-1.5 0-2.5 1-3 2s-2 1.5-3 2c-1 .5-2 .5-3 0-1-.5-1.5-1.5-1-2.5.5-1 2-1.5 3-1.5s2.5.5 3.5 1.5c.5.5 1.5.5 2 0 .5-.5 1.5-.5 2 0s1.5.5 2 0c.5-.5 1.5-.5 2 0"/></>,
};

/* ========== CARD MELHORADO ========== */
function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color = "blue", 
  trend = null,
  highlight = false 
}) {
  const colorMap = {
    blue: { 
      bg: theme.colors.brand[50], 
      border: theme.colors.brand[100], 
      iconBg: "#fff", 
      iconColor: theme.colors.brand[600],
      text: theme.colors.brand[600] 
    },
    green: { 
      bg: theme.colors.success[50], 
      border: theme.colors.success[100], 
      iconBg: "#fff", 
      iconColor: theme.colors.success[600],
      text: theme.colors.success[600] 
    },
    amber: { 
      bg: theme.colors.warning[50], 
      border: theme.colors.warning[100], 
      iconBg: "#fff", 
      iconColor: theme.colors.warning[600],
      text: theme.colors.warning[600] 
    },
    red: { 
      bg: theme.colors.danger[50], 
      border: theme.colors.danger[100], 
      iconBg: "#fff", 
      iconColor: theme.colors.danger[600],
      text: theme.colors.danger[600] 
    },
    slate: { 
      bg: theme.colors.slate[50], 
      border: theme.colors.slate[200], 
      iconBg: "#fff", 
      iconColor: theme.colors.slate[600],
      text: theme.colors.slate[600] 
    },
  };

  const c = colorMap[color];

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: theme.radius.lg,
        padding: "20px",
        boxShadow: highlight ? theme.shadows.lg : theme.shadows.sm,
        border: `1px solid ${c.border}`,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s ease",
        cursor: "default",
      }}
    >
      {/* Background sutil com cor */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "100px",
          height: "100px",
          background: `radial-gradient(circle at top right, ${c.bg}, transparent 70%)`,
          opacity: 0.6,
          pointerEvents: "none",
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, position: "relative", zIndex: 1 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: c.iconBg,
            border: `2px solid ${c.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          }}
        >
          <Icon path={icon} size={22} color={c.iconColor} />
        </div>
        
        {trend && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 8px",
              borderRadius: 20,
              background: trend > 0 ? theme.colors.success[50] : theme.colors.danger[50],
              color: trend > 0 ? theme.colors.success[600] : theme.colors.danger[600],
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            <span style={{ fontSize: 14 }}>{trend > 0 ? "↑" : "↓"}</span>
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: theme.colors.slate[500],
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 6,
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: theme.colors.slate[800],
            letterSpacing: "-0.02em",
            lineHeight: 1,
            marginBottom: 6,
          }}
        >
          {value}
        </div>

        {subtitle && (
          <div style={{ fontSize: 13, color: theme.colors.slate[500], fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
            {color === "amber" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: theme.colors.warning[500] }}></span>}
            {subtitle}
          </div>
        )}
      </div>

      {/* Barra de progresso decorativa no bottom (opcional) */}
      {highlight && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: c.bg }}>
          <div style={{ width: "60%", height: "100%", background: c.iconColor, borderRadius: "0 2px 0 0" }} />
        </div>
      )}
    </div>
  );
}

/* ========== COMPONENTE PRINCIPAL ========== */
export default function ResumoLeiteDia({ resumoDia, qtdLactacao = 0 }) {
  const { producaoTotal, mediaPorVaca, melhor, pior, qtdComMedicao } = resumoDia || {};
  
  // Calcular tendência (simulação - você pode conectar com dados reais de comparação)
  const hasData = parseFloat(producaoTotal) > 0;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "16px",
        marginBottom: "24px",
      }}
    >
      {/* Card 1: Produção Total */}
      <MetricCard
        title="Produção Total do Dia"
        value={`${producaoTotal ?? "0.0"} L`}
        subtitle={qtdComMedicao > 0 ? `${qtdComMedicao} de ${qtdLactacao} vacas ordenhadas` : "Nenhuma medição registrada"}
        icon={Icons.drop}
        color="blue"
        trend={hasData ? 12 : null} // Exemplo: +12% - substituir por cálculo real se disponível
      />

      {/* Card 2: Média */}
      <MetricCard
        title="Média por Vaca"
        value={`${mediaPorVaca ?? "0.0"} L`}
        subtitle={`${qtdLactacao} vacas em lactação ativa`}
        icon={Icons.chart}
        color="green"
      />

      {/* Card 3: Melhor Vaca */}
      <MetricCard
        title="Melhor Produtora"
        value={melhor ? `${parseFloat(melhor.total).toFixed(1)} L` : "—"}
        subtitle={melhor ? `Animal #${melhor.vaca.numero}${melhor.vaca.brinco ? ` • Brinco ${melhor.vaca.brinco}` : ""}` : "Sem dados suficientes"}
        icon={Icons.trophy}
        color="amber"
        highlight={!!melhor}
      />

      {/* Card 4: Pior Vaca / Alerta */}
      <MetricCard
        title="Menor Produção"
        value={pior ? `${parseFloat(pior.total).toFixed(1)} L` : "—"}
        subtitle={pior ? `Animal #${pior.vaca.numero}${pior.vaca.brinco ? ` • Brinco ${pior.vaca.brinco}` : ""}` : "Sem dados suficientes"}
        icon={Icons.alert}
        color={pior ? "red" : "slate"}
      />
    </div>
  );
}