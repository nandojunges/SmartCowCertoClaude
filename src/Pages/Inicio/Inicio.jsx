import React, { useMemo, useState, useEffect } from "react";

/* =========================
   MOCK (usa o teu mesmo)
========================= */
const INTELIGENCIA_HOJE = {
  data: new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }),
  hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),

  missoes: [
    {
      id: 1,
      tipo: "critico",
      titulo: "Separar Lote 3 para Tratamento",
      descricao: "Mastite subclínica detectada CMT ontem. Animais #0523, #1041, #0892 > 500k.",
      risco: "Risco de contaminação cruzada do tanque na ordenha da tarde.",
      impactoFinanceiro: 850,
      prazoHoras: 3,
      responsavel: "Funcionário A",
      local: "Curral Principal",
      modulo: "Saúde",
      status: "pendente",
      icone: "⚡",
      proximoPasso:
        "Separar e identificar as 3 vacas; aplicar protocolo do lote; registrar tratamento e marcar retorno em 48–72h.",
    },
    {
      id: 2,
      tipo: "estrategico",
      titulo: "Decisão imediata: Animal #1029",
      descricao: "IPP 425 dias. Custo: R$ 35/dia. Último cio há 45 dias sem observação.",
      risco: "Perda de 1 ano produtivo + descarte forçado por atraso reprodutivo.",
      impactoFinanceiro: 4500,
      prazoHoras: 48,
      responsavel: "Produtor",
      local: "Escritório / Manejo",
      modulo: "Reprodução",
      status: "pendente",
      icone: "🎯",
      proximoPasso:
        "Revisar histórico (IA, diagnósticos, protocolos); decidir: tentar embrião/IATF de resgate ou programar descarte/venda.",
    },
    {
      id: 3,
      tipo: "rotina",
      titulo: "Aplicação PGF2α — Lote 4 (Dia 18)",
      descricao: "8 animais no dia 18 do protocolo. Estoque disponível: 3 doses.",
      risco: "Parada do protocolo se não comprar hoje (perde janela do ciclo).",
      impactoFinanceiro: 1200,
      prazoHoras: 8,
      responsavel: "Funcionário B",
      local: "Farmácia / Estoque",
      modulo: "Reprodução",
      status: "em_andamento",
      icone: "💉",
      proximoPasso:
        "Acionar compra imediata (mín. 8 doses + reserva); confirmar horário de aplicação; registrar lote e carência no sistema.",
    },
  ],

  alertasAnimais: [
    {
      id: "0523",
      lote: "Lote 1",
      lactacao: "3ª",
      gravidade: "critico",
      titulo: "Repetição de cio suspeita",
      motivo:
        "3 cios observados, nenhuma IA registrada. Probabilidade de cisto ovariano: 78% (histórico do lote).",
      risco: "Anestro prolongado, perda de 210 dias produtivos.",
      acaoRecomendada: "Ultrassom hoje + plano de sincronização (ou decisão de descarte).",
      custoInacao: 3200,
      tags: ["Cisto provável", "IATF falha"],
      modulo: "Reprodução",
    },
    {
      id: "0892",
      lote: "Lote 3",
      lactacao: "2ª",
      gravidade: "alto",
      titulo: "CCS explosiva detectada",
      motivo:
        "CCS 180k → 420k em 5 dias. Padrão similar virou mastite aguda em 72h no histórico da fazenda.",
      risco: "Mastite clínica + perda de lactação.",
      acaoRecomendada: "Separar hoje + antibiograma preventivo.",
      custoInacao: 2800,
      tags: ["Subclínica avançando", "Isolar hoje"],
      modulo: "Saúde",
    },
    {
      id: "1041",
      lote: "Lote 2",
      lactacao: "4ª",
      gravidade: "medio",
      titulo: "Janela IATF fechando",
      motivo:
        "Animal no dia 20 do protocolo. Se não houver cio até amanhã, perde janela deste ciclo.",
      risco: "Atraso reprodutivo de 21 dias.",
      acaoRecomendada: "Observação intensiva 06h/18h ou IATF forçada.",
      custoInacao: 400,
      tags: ["Última chance", "Observar"],
      modulo: "Reprodução",
    },
  ],

  contexto: {
    // indicador “estimado” (sem medidor eletrônico)
    metaDia: 18000,
    estimativaHoje: 18450,
    performance: 102.5,
    tendenciaSeteDias: [17500, 17800, 17600, 18200, 18300, 18100, 18450],
    umidade: 68,
    temperatura: 24,
  },

  kpis: {
    prenhez: { valor: 41, meta: 45, delta: +2 }, // %
    servico: { valor: 52, meta: 55, delta: -1 }, // %
    concepcao: { valor: 32, meta: 35, delta: +1 }, // %
    delMedio: { valor: 165, meta: 160, delta: -3 }, // dias
    ccsMil: { valor: 285, meta: 250, delta: +7 }, // mil
    preParto: { valor: 12, meta: 10, delta: +1 }, // %
    scoreRepro: { valor: 82, meta: 85, delta: +1 }, // score
  },

  riscosTimeline: [
    { quando: "14:00", tipo: "critico", titulo: "Estoque PGF2α crítico", descricao: "3 doses apenas. Compra urgente." },
    { quando: "Amanhã 06h", tipo: "alerta", titulo: "IATF Lote 4", descricao: "8 animais aguardando. Sem estoque = parada." },
    { quando: "3 dias", tipo: "atencao", titulo: "IPP limite (Lote 2)", descricao: "3 animais atingem 420 dias simultaneamente." },
    { quando: "5 dias", tipo: "oportunidade", titulo: "Venda de bezerros", descricao: "Peso ideal. Preço em alta (+8%)." },
  ],
};

/* =========================
   Helpers visuais
========================= */
const palette = {
  navy: "#0B2140",
  navy2: "#0E2A52",
  ink: "#0F172A",
  text: "#0B1220",
  sub: "#52607A",
  line: "rgba(2, 6, 23, 0.08)",
  card: "#FFFFFF",
  soft: "#F6F8FC",
  chip: "rgba(2, 6, 23, 0.06)",
  critical: "#DC2626",
  high: "#F59E0B",
  medium: "#2563EB",
  good: "#16A34A",
  purple: "#7C3AED",
};

function gravColor(g) {
  if (g === "critico") return palette.critical;
  if (g === "alto") return palette.high;
  if (g === "medio") return palette.medium;
  return palette.good;
}

function fmtBRL(n) {
  try {
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  } catch {
    return `R$ ${n}`;
  }
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function SparkLine({ data = [], height = 28 }) {
  const pts = useMemo(() => {
    if (!data.length) return "";
    const min = Math.min(...data);
    const max = Math.max(...data);
    const den = max - min || 1;
    return data
      .map((v, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((v - min) / den) * 100;
        return `${x},${y}`;
      })
      .join(" ");
  }, [data]);

  return (
    <svg width="100%" height={height} viewBox="0 0 100 100" preserveAspectRatio="none" style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MiniBar({ value = 0, max = 100, color = "#2563EB" }) {
  const pct = clamp((value / (max || 1)) * 100, 0, 100);
  return (
    <div style={{ height: 8, borderRadius: 999, background: "rgba(2,6,23,0.08)", overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: color }} />
    </div>
  );
}

/* =========================
   UI building blocks
========================= */
function Card({ children, style }) {
  return (
    <div
      style={{
        background: palette.card,
        border: `1px solid ${palette.line}`,
        borderRadius: 16,
        boxShadow: "0 10px 24px rgba(2,6,23,0.05)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Pill({ children, tone = "neutral" }) {
  const map = {
    neutral: { bg: "rgba(255,255,255,0.14)", bd: "rgba(255,255,255,0.18)", tx: "rgba(255,255,255,0.9)" },
    ok: { bg: "rgba(34,197,94,0.18)", bd: "rgba(34,197,94,0.25)", tx: "#BBF7D0" },
    warn: { bg: "rgba(245,158,11,0.18)", bd: "rgba(245,158,11,0.25)", tx: "#FDE68A" },
    bad: { bg: "rgba(220,38,38,0.18)", bd: "rgba(220,38,38,0.25)", tx: "#FECACA" },
    info: { bg: "rgba(59,130,246,0.18)", bd: "rgba(59,130,246,0.25)", tx: "#BFDBFE" },
  };
  const s = map[tone] || map.neutral;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 999,
        background: s.bg,
        border: `1px solid ${s.bd}`,
        color: s.tx,
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function KPI({ label, value, suffix, hint, color = palette.medium, barValue, barMax }) {
  return (
    <Card style={{ padding: 14 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: palette.sub, letterSpacing: 0.4 }}>{label}</div>
        {hint ? <div style={{ fontSize: 11, color: palette.sub }}>{hint}</div> : null}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
        <div style={{ fontSize: 26, fontWeight: 900, color: palette.text }}>{value}</div>
        {suffix ? <div style={{ fontSize: 13, color: palette.sub, fontWeight: 800 }}>{suffix}</div> : null}
      </div>

      <div style={{ marginTop: 10, color }}>
        <MiniBar value={barValue ?? 0} max={barMax ?? 100} color={color} />
      </div>
    </Card>
  );
}

/* =========================
   Page
========================= */
export default function Inicio() {
  const [horaAtual, setHoraAtual] = useState(INTELIGENCIA_HOJE.hora);
  const [missoes, setMissoes] = useState(INTELIGENCIA_HOJE.missoes);
  const [openDetails, setOpenDetails] = useState(() => new Set()); // guarda ids abertos

  useEffect(() => {
    const t = setInterval(() => {
      const now = new Date();
      setHoraAtual(now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    }, 60000);
    return () => clearInterval(t);
  }, []);

  const pendentes = useMemo(() => missoes.filter((m) => m.status !== "concluido").length, [missoes]);

  const onToggleDone = (id) => {
    setMissoes((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: m.status === "concluido" ? "pendente" : "concluido" } : m))
    );
  };

  const toggleDetails = (id) => {
    setOpenDetails((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Plugue isso na tua navegação real (abas/rotas/modais)
  const onNavigate = (modulo, payload) => {
    // exemplo: setAbaAtiva(modulo) ou navigate(`/saude?...`)
    console.log("[SmartCow] navegar:", modulo, payload);
  };

  const k = INTELIGENCIA_HOJE.kpis;

  return (
    <div style={{ background: palette.soft, minHeight: "100vh" }}>
      {/* Top strip compacto (combina com menu) */}
      <div
        style={{
          background: `linear-gradient(180deg, ${palette.navy} 0%, ${palette.navy2} 100%)`,
          color: "white",
          padding: "18px 22px",
        }}
      >
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 800, letterSpacing: 0.8 }}>
                SMARTCOW • CENTRAL DO DIA
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.1, marginTop: 6 }}>
                {INTELIGENCIA_HOJE.data}
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                <Pill tone="info">⏱ {horaAtual}</Pill>
                <Pill tone={pendentes ? "warn" : "ok"}>📌 {pendentes} pendentes</Pill>
                <Pill tone="ok">🟢 sistema online</Pill>
                <Pill tone="neutral">
                  🌡 {INTELIGENCIA_HOJE.contexto.temperatura}°C • 💧 {INTELIGENCIA_HOJE.contexto.umidade}%
                </Pill>
              </div>
            </div>

            {/* Dois KPIs pequenos no header (sem “revista”) */}
            <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
              <div
                style={{
                  minWidth: 210,
                  padding: 14,
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.16)",
                }}
              >
                <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 800 }}>Meta reprodutiva</div>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 8 }}>
                  <div style={{ fontSize: 22, fontWeight: 900 }}>Prenhez</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#BFDBFE" }}>{k.prenhez.valor}%</div>
                </div>
                <div style={{ marginTop: 10, color: "#BFDBFE" }}>
                  <MiniBar value={k.prenhez.valor} max={100} color="#60A5FA" />
                </div>
                <div style={{ fontSize: 11, opacity: 0.75, marginTop: 8 }}>
                  Meta {k.prenhez.meta}% • tendência {k.prenhez.delta > 0 ? "+" : ""}{k.prenhez.delta}%
                </div>
              </div>

              <div
                style={{
                  minWidth: 210,
                  padding: 14,
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.16)",
                }}
              >
                <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 800 }}>Contexto (estimado)</div>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 8 }}>
                  <div style={{ fontSize: 22, fontWeight: 900 }}>Meta diária</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#BBF7D0" }}>
                    {INTELIGENCIA_HOJE.contexto.performance}%
                  </div>
                </div>
                <div style={{ marginTop: 10, color: "#86EFAC" }}>
                  <SparkLine data={INTELIGENCIA_HOJE.contexto.tendenciaSeteDias} />
                </div>
                <div style={{ fontSize: 11, opacity: 0.75, marginTop: 8 }}>
                  Estimativa {(INTELIGENCIA_HOJE.contexto.estimativaHoje / 1000).toFixed(1)}k L
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "18px 22px 28px" }}>
        {/* KPIs compactos (topo) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
          <KPI
            label="Taxa de serviço"
            value={k.servico.valor}
            suffix="%"
            hint={`meta ${k.servico.meta}%`}
            color={k.servico.valor >= k.servico.meta ? palette.good : palette.high}
            barValue={k.servico.valor}
            barMax={100}
          />
          <KPI
            label="Taxa de concepção"
            value={k.concepcao.valor}
            suffix="%"
            hint={`meta ${k.concepcao.meta}%`}
            color={k.concepcao.valor >= k.concepcao.meta ? palette.good : palette.high}
            barValue={k.concepcao.valor}
            barMax={100}
          />
          <KPI
            label="DEL médio"
            value={k.delMedio.valor}
            suffix="dias"
            hint={`meta ${k.delMedio.meta}`}
            color={k.delMedio.valor <= k.delMedio.meta ? palette.good : palette.high}
            barValue={clamp(200 - k.delMedio.valor, 0, 200)}
            barMax={200}
          />
          <KPI
            label="CCS (mil)"
            value={k.ccsMil.valor}
            suffix=""
            hint={`meta ${k.ccsMil.meta}`}
            color={k.ccsMil.valor <= k.ccsMil.meta ? palette.good : palette.critical}
            barValue={clamp(400 - k.ccsMil.valor, 0, 400)}
            barMax={400}
          />
          <KPI
            label="% pré-parto"
            value={k.preParto.valor}
            suffix="%"
            hint={`meta ${k.preParto.meta}%`}
            color={k.preParto.valor <= k.preParto.meta ? palette.good : palette.high}
            barValue={k.preParto.valor}
            barMax={30}
          />
          <KPI
            label="Score reprodutivo"
            value={k.scoreRepro.valor}
            suffix="/100"
            hint={`meta ${k.scoreRepro.meta}`}
            color={k.scoreRepro.valor >= k.scoreRepro.meta ? palette.good : palette.high}
            barValue={k.scoreRepro.valor}
            barMax={100}
          />
        </div>

        {/* Grid principal: Tarefas (esquerda) + IA (direita) */}
        <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 14, marginTop: 14 }}>
          {/* TAREFAS */}
          <Card style={{ overflow: "hidden" }}>
            {/* Cabeçalho azul curto só aqui (tua ideia) */}
            <div
              style={{
                background: `linear-gradient(180deg, rgba(11,33,64,0.08) 0%, rgba(11,33,64,0.02) 100%)`,
                borderBottom: `1px solid ${palette.line}`,
                padding: "14px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: palette.text }}>Tarefas do dia</div>
                <div style={{ fontSize: 12, color: palette.sub, marginTop: 2 }}>
                  Prioridade por risco real (tanque • reprodução • custo oculto). Detalhes ficam recolhidos.
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span
                  style={{
                    background: "rgba(220,38,38,0.10)",
                    border: "1px solid rgba(220,38,38,0.18)",
                    color: palette.critical,
                    padding: "6px 10px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 900,
                    whiteSpace: "nowrap",
                  }}
                >
                  🔥 {pendentes} pendentes
                </span>
              </div>
            </div>

            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              {missoes.map((m) => {
                const color = gravColor(m.tipo === "critico" ? "critico" : m.tipo === "estrategico" ? "alto" : "medio");
                const isOpen = openDetails.has(m.id);

                return (
                  <div
                    key={m.id}
                    style={{
                      border: `1px solid ${palette.line}`,
                      borderRadius: 14,
                      overflow: "hidden",
                      background: "#fff",
                    }}
                  >
                    {/* Linha principal: compacta */}
                    <div style={{ display: "grid", gridTemplateColumns: "10px 1fr auto", gap: 0 }}>
                      <div style={{ background: color }} />

                      <div style={{ padding: "12px 12px 10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <button
                            onClick={() => onToggleDone(m.id)}
                            title="Concluir"
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 7,
                              border: `2px solid ${m.status === "concluido" ? palette.good : "rgba(2,6,23,0.22)"}`,
                              background: m.status === "concluido" ? palette.good : "transparent",
                              cursor: "pointer",
                            }}
                          />
                          <div style={{ fontSize: 14, fontWeight: 900, color: palette.text }}>
                            {m.icone} {m.titulo}
                          </div>

                          <span style={{ background: palette.chip, border: `1px solid ${palette.line}`, padding: "4px 8px", borderRadius: 999, fontSize: 11, fontWeight: 800, color: palette.sub }}>
                            {m.modulo}
                          </span>

                          <span style={{ background: palette.chip, border: `1px solid ${palette.line}`, padding: "4px 8px", borderRadius: 999, fontSize: 11, fontWeight: 800, color: palette.sub }}>
                            {m.local}
                          </span>

                          <span style={{ marginLeft: "auto", fontSize: 12, color: palette.sub, fontWeight: 800 }}>
                            {m.responsavel}
                          </span>
                        </div>

                        <div style={{ marginTop: 8, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                          <span style={{ fontSize: 12, color: palette.sub }}>
                            ⏳ <b style={{ color: m.prazoHoras <= 3 ? palette.critical : palette.high }}>{m.prazoHoras}h</b>
                          </span>
                          <span style={{ fontSize: 12, color: palette.sub }}>
                            💸 <b style={{ color: palette.text }}>{fmtBRL(m.impactoFinanceiro)}</b>
                          </span>
                          <span style={{ fontSize: 12, color: palette.sub }}>
                            ⚠️ <b style={{ color: palette.text }}>{m.risco}</b>
                          </span>
                        </div>
                      </div>

                      {/* Ações */}
                      <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8, alignItems: "stretch" }}>
                        <button
                          onClick={() => onNavigate(m.modulo, m)}
                          style={{
                            padding: "10px 12px",
                            borderRadius: 10,
                            border: "none",
                            cursor: "pointer",
                            background: color,
                            color: "white",
                            fontWeight: 900,
                            fontSize: 12,
                          }}
                        >
                          Ir para ação →
                        </button>
                        <button
                          onClick={() => toggleDetails(m.id)}
                          style={{
                            padding: "9px 12px",
                            borderRadius: 10,
                            border: `1px solid ${palette.line}`,
                            background: "white",
                            cursor: "pointer",
                            fontWeight: 900,
                            fontSize: 12,
                            color: palette.text,
                          }}
                        >
                          {isOpen ? "Fechar detalhes" : "Detalhes"}
                        </button>
                      </div>
                    </div>

                    {/* Detalhes (accordion) */}
                    {isOpen ? (
                      <div style={{ borderTop: `1px solid ${palette.line}`, background: "rgba(11,33,64,0.02)" }}>
                        <div style={{ padding: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <div style={{ background: "white", border: `1px solid ${palette.line}`, borderRadius: 12, padding: 12 }}>
                            <div style={{ fontSize: 12, fontWeight: 900, color: palette.text }}>Resumo</div>
                            <div style={{ marginTop: 6, fontSize: 13, color: palette.sub, lineHeight: 1.35 }}>{m.descricao}</div>
                          </div>

                          <div style={{ background: "white", border: `1px solid ${palette.line}`, borderRadius: 12, padding: 12 }}>
                            <div style={{ fontSize: 12, fontWeight: 900, color: palette.text }}>Próximo passo</div>
                            <div style={{ marginTop: 6, fontSize: 13, color: palette.sub, lineHeight: 1.35 }}>{m.proximoPasso}</div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* IA PLANTEL */}
          <Card style={{ overflow: "hidden" }}>
            <div
              style={{
                padding: "14px 16px",
                borderBottom: `1px solid ${palette.line}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: palette.text }}>Inteligência do plantel</div>
                <div style={{ fontSize: 12, color: palette.sub, marginTop: 2 }}>
                  Sugestões executáveis cruzando lançamentos + histórico.
                </div>
              </div>

              <span
                style={{
                  background: "rgba(124,58,237,0.10)",
                  border: "1px solid rgba(124,58,237,0.18)",
                  color: palette.purple,
                  padding: "6px 10px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 900,
                  whiteSpace: "nowrap",
                }}
              >
                🤖 IA ativa
              </span>
            </div>

            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              {INTELIGENCIA_HOJE.alertasAnimais.map((a) => {
                const c = gravColor(a.gravidade);
                return (
                  <div key={a.id} style={{ border: `1px solid ${palette.line}`, borderRadius: 14, overflow: "hidden", background: "white" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "10px 1fr", gap: 0 }}>
                      <div style={{ background: c }} />

                      <div style={{ padding: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 10,
                              background: "rgba(124,58,237,0.08)",
                              border: "1px solid rgba(124,58,237,0.14)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 18,
                            }}
                          >
                            🐄
                          </div>

                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                              <div style={{ fontWeight: 900, color: palette.text }}>#{a.id}</div>
                              <div style={{ fontSize: 12, color: palette.sub }}>{a.lote} • {a.lactacao}</div>
                              <span
                                style={{
                                  marginLeft: "auto",
                                  fontSize: 12,
                                  fontWeight: 900,
                                  color: palette.text,
                                }}
                              >
                                custo inação: <span style={{ color: palette.critical }}>{fmtBRL(a.custoInacao)}</span>
                              </span>
                            </div>
                            <div style={{ marginTop: 4, fontSize: 13, fontWeight: 900, color: c }}>{a.titulo}</div>
                          </div>
                        </div>

                        {/* Estrutura anti-“jornal”: 3 linhas curtas */}
                        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                          <div style={{ fontSize: 12, color: palette.sub }}>
                            <b style={{ color: palette.text }}>Causa:</b> {a.motivo}
                          </div>
                          <div style={{ fontSize: 12, color: palette.sub }}>
                            <b style={{ color: palette.text }}>Risco:</b> {a.risco}
                          </div>
                          <div style={{ fontSize: 12, color: palette.sub }}>
                            <b style={{ color: palette.text }}>Ação recomendada:</b>{" "}
                            <span style={{ fontWeight: 900, color: palette.text }}>{a.acaoRecomendada}</span>
                          </div>
                        </div>

                        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                          {a.tags.map((t, i) => (
                            <span
                              key={i}
                              style={{
                                fontSize: 11,
                                fontWeight: 900,
                                padding: "5px 8px",
                                borderRadius: 999,
                                background: "rgba(2,6,23,0.05)",
                                border: `1px solid ${palette.line}`,
                                color: palette.sub,
                              }}
                            >
                              {t}
                            </span>
                          ))}

                          <button
                            onClick={() => onNavigate(a.modulo, a)}
                            style={{
                              marginLeft: "auto",
                              padding: "9px 12px",
                              borderRadius: 10,
                              border: "none",
                              cursor: "pointer",
                              background: c,
                              color: "white",
                              fontWeight: 900,
                              fontSize: 12,
                            }}
                          >
                            Abrir no módulo →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Pequeno bloco “observação do sistema” */}
              <div style={{ borderRadius: 14, border: `1px dashed ${palette.line}`, padding: 12, background: "rgba(11,33,64,0.03)" }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: palette.text }}>Diagnóstico rápido</div>
                <div style={{ marginTop: 6, fontSize: 12, color: palette.sub, lineHeight: 1.35 }}>
                  Umidade subindo ({INTELIGENCIA_HOJE.contexto.umidade}%). Histórico: tendência de mastite em 48h.
                  Foque hoje em: separar suspeitas + controle de CCS + reforço de rotina sanitária.
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Timeline compacta */}
        <div style={{ marginTop: 14 }}>
          <Card style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: palette.text }}>Linha do tempo (próximos riscos e oportunidades)</div>
              <div style={{ fontSize: 12, color: palette.sub }}>curta • objetiva • acionável</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 10 }}>
              {INTELIGENCIA_HOJE.riscosTimeline.map((r, i) => {
                const c =
                  r.tipo === "critico" ? palette.critical : r.tipo === "alerta" ? palette.high : r.tipo === "atencao" ? palette.medium : palette.good;
                return (
                  <div key={i} style={{ border: `1px solid ${palette.line}`, borderRadius: 14, padding: 12, background: "white" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 900, color: c }}>{r.quando}</div>
                      <span style={{ width: 10, height: 10, borderRadius: 999, background: c }} />
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13, fontWeight: 900, color: palette.text }}>{r.titulo}</div>
                    <div style={{ marginTop: 4, fontSize: 12, color: palette.sub, lineHeight: 1.35 }}>{r.descricao}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
