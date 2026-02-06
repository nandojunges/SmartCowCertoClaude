import React, { useState, useEffect } from "react";

/* ── Mock data ── */
const MOCK = {
  rebanho: 142,
  emLactacao: 98,
  secas: 22,
  bezerras: 22,
  producaoHoje: 18.4,       // mil litros
  metaProducao: 18.0,
  mediaVaca: 28.6,           // L/vaca
  ccs: 285,
  prenhez: 41,
  servicoRate: 52,
  concepcaoRate: 32,

  alertas: [
    { id: 1, gravidade: "critico", animal: "#0523", texto: "CMT positivo — separar antes da ordenha da tarde", modulo: "Saúde" },
    { id: 2, gravidade: "alto",    animal: "#0892", texto: "CCS subiu 180k→420k em 5 dias — antibiograma preventivo", modulo: "Saúde" },
    { id: 3, gravidade: "medio",   animal: "#1041", texto: "Janela IATF fecha amanhã — observar cio 06h/18h", modulo: "Reprodução" },
    { id: 4, gravidade: "medio",   animal: "#1029", texto: "IPP 425 dias — decidir descarte ou resgate", modulo: "Reprodução" },
  ],

  tarefas: [
    { id: 1, prioridade: "alta",    texto: "Separar Lote 3 para tratamento (mastite)", prazo: "3h" },
    { id: 2, prioridade: "alta",    texto: "Comprar PGF2α — estoque: 3 doses, precisa 8", prazo: "hoje" },
    { id: 3, prioridade: "media",   texto: "Aplicação PGF2α Lote 4 (dia 18 protocolo)", prazo: "8h" },
    { id: 4, prioridade: "normal",  texto: "Avaliar bezerros para venda — peso ideal, preço +8%", prazo: "5 dias" },
  ],

  ultimosEventos: [
    { hora: "06:30", texto: "Ordenha manhã concluída — 9.2k L" },
    { hora: "07:15", texto: "CMT Lote 3 realizado — 3 positivos" },
    { hora: "08:00", texto: "Cio observado #0744" },
  ],
};

/* ── Cores ── */
const COR = {
  fundo:    "#F4F6FA",
  card:     "#FFFFFF",
  borda:    "#E8ECF2",
  titulo:   "#0F172A",
  texto:    "#334155",
  sutil:    "#94A3B8",
  azul:     "#2563EB",
  verde:    "#16A34A",
  amarelo:  "#D97706",
  vermelho: "#DC2626",
  roxo:     "#7C3AED",
};

function corGravidade(g) {
  if (g === "critico") return COR.vermelho;
  if (g === "alto") return COR.amarelo;
  return COR.azul;
}

function corPrioridade(p) {
  if (p === "alta") return COR.vermelho;
  if (p === "media") return COR.amarelo;
  return COR.sutil;
}

/* ── Componentes mínimos ── */
function MetricCard({ label, valor, unidade, destaque }) {
  return (
    <div style={{
      background: COR.card,
      border: `1px solid ${COR.borda}`,
      borderRadius: 12,
      padding: "16px 18px",
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: COR.sutil, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </div>
      <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: destaque || COR.titulo }}>{valor}</span>
        {unidade && <span style={{ fontSize: 13, fontWeight: 600, color: COR.sutil }}>{unidade}</span>}
      </div>
    </div>
  );
}

/* ── Página ── */
export default function Inicio() {
  const [hora, setHora] = useState(() =>
    new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  );
  const [concluidas, setConcluidas] = useState(() => new Set());

  useEffect(() => {
    const t = setInterval(() => {
      setHora(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    }, 60_000);
    return () => clearInterval(t);
  }, []);

  const dataTexto = new Date().toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long",
  });

  const toggleConcluida = (id) =>
    setConcluidas(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const producaoPct = Math.round((MOCK.producaoHoje / MOCK.metaProducao) * 100);

  return (
    <div style={{ background: COR.fundo, minHeight: "100vh", padding: "20px 24px 40px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: COR.titulo, margin: 0 }}>
              Bom dia ☀️
            </h1>
            <p style={{ fontSize: 14, color: COR.sutil, margin: "4px 0 0" }}>
              {dataTexto} · {hora}
            </p>
          </div>
          <div style={{
            display: "flex", gap: 8, alignItems: "center",
            background: MOCK.alertas.some(a => a.gravidade === "critico")
              ? "rgba(220,38,38,0.08)" : "rgba(22,163,74,0.08)",
            border: `1px solid ${MOCK.alertas.some(a => a.gravidade === "critico")
              ? "rgba(220,38,38,0.2)" : "rgba(22,163,74,0.2)"}`,
            borderRadius: 999, padding: "6px 14px",
            fontSize: 13, fontWeight: 700,
            color: MOCK.alertas.some(a => a.gravidade === "critico") ? COR.vermelho : COR.verde,
          }}>
            {MOCK.alertas.some(a => a.gravidade === "critico") ? "⚠ Atenção necessária" : "✓ Tudo em dia"}
          </div>
        </div>

        {/* ── Métricas principais ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
          <MetricCard label="Rebanho total"     valor={MOCK.rebanho}      unidade="cab" />
          <MetricCard label="Em lactação"        valor={MOCK.emLactacao}   unidade="cab" />
          <MetricCard label="Produção hoje"      valor={MOCK.producaoHoje} unidade="mil L"
            destaque={producaoPct >= 100 ? COR.verde : COR.amarelo} />
          <MetricCard label="Média/vaca"         valor={MOCK.mediaVaca}    unidade="L" />
          <MetricCard label="CCS"                valor={MOCK.ccs}          unidade="mil"
            destaque={MOCK.ccs > 250 ? COR.vermelho : COR.verde} />
          <MetricCard label="Tx prenhez"         valor={MOCK.prenhez}      unidade="%"
            destaque={MOCK.prenhez >= 45 ? COR.verde : COR.amarelo} />
        </div>

        {/* ── Grid: Alertas + Tarefas + Eventos ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          {/* Alertas */}
          <div style={{
            background: COR.card, border: `1px solid ${COR.borda}`,
            borderRadius: 12, overflow: "hidden",
          }}>
            <div style={{
              padding: "14px 18px", borderBottom: `1px solid ${COR.borda}`,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: COR.titulo }}>Alertas</span>
              <span style={{
                fontSize: 12, fontWeight: 700, color: COR.vermelho,
                background: "rgba(220,38,38,0.08)", borderRadius: 999, padding: "3px 10px",
              }}>
                {MOCK.alertas.length}
              </span>
            </div>

            <div style={{ padding: "6px 10px" }}>
              {MOCK.alertas.map(a => (
                <div key={a.id} style={{
                  display: "flex", gap: 10, alignItems: "flex-start",
                  padding: "10px 8px",
                  borderBottom: `1px solid ${COR.borda}`,
                }}>
                  <span style={{
                    marginTop: 4, width: 8, height: 8, borderRadius: 999, flexShrink: 0,
                    background: corGravidade(a.gravidade),
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: COR.titulo }}>
                      {a.animal}
                      <span style={{ fontWeight: 400, color: COR.texto, marginLeft: 6 }}>{a.texto}</span>
                    </div>
                    <span style={{
                      display: "inline-block", marginTop: 4,
                      fontSize: 11, fontWeight: 600, color: COR.sutil,
                      background: COR.fundo, borderRadius: 4, padding: "2px 6px",
                    }}>
                      {a.modulo}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tarefas */}
          <div style={{
            background: COR.card, border: `1px solid ${COR.borda}`,
            borderRadius: 12, overflow: "hidden",
          }}>
            <div style={{
              padding: "14px 18px", borderBottom: `1px solid ${COR.borda}`,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: COR.titulo }}>Tarefas do dia</span>
              <span style={{
                fontSize: 12, fontWeight: 700, color: COR.azul,
                background: "rgba(37,99,235,0.08)", borderRadius: 999, padding: "3px 10px",
              }}>
                {MOCK.tarefas.length - concluidas.size} restantes
              </span>
            </div>

            <div style={{ padding: "6px 10px" }}>
              {MOCK.tarefas.map(t => {
                const feita = concluidas.has(t.id);
                return (
                  <div key={t.id} style={{
                    display: "flex", gap: 10, alignItems: "flex-start",
                    padding: "10px 8px",
                    borderBottom: `1px solid ${COR.borda}`,
                    opacity: feita ? 0.45 : 1,
                  }}>
                    <button
                      onClick={() => toggleConcluida(t.id)}
                      style={{
                        marginTop: 2, width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                        border: `2px solid ${feita ? COR.verde : "#CBD5E1"}`,
                        background: feita ? COR.verde : "transparent",
                        cursor: "pointer", padding: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 600, color: COR.titulo,
                        textDecoration: feita ? "line-through" : "none",
                      }}>
                        {t.texto}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700,
                          color: corPrioridade(t.prioridade),
                        }}>
                          {t.prioridade}
                        </span>
                        <span style={{ fontSize: 11, color: COR.sutil }}>· {t.prazo}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Últimos eventos ── */}
        <div style={{
          marginTop: 16, background: COR.card, border: `1px solid ${COR.borda}`,
          borderRadius: 12, padding: "14px 18px",
        }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: COR.titulo, marginBottom: 10 }}>
            Hoje
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {MOCK.ultimosEventos.map((e, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: COR.azul }}>{e.hora}</span>
                <span style={{ fontSize: 13, color: COR.texto }}>{e.texto}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
