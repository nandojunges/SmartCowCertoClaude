import { useState } from "react";
import {
  FiDroplet,
  FiClock,
  FiTrendingUp,
  FiHeart,
  FiCalendar,
  FiAlertTriangle,
  FiCheckCircle,
  FiPlus,
  FiSearch,
  FiFilter,
  FiActivity,
  FiZap,
  FiChevronRight,
  FiAlertOctagon,
  FiTarget,
  FiBarChart2,
  FiThermometer,
  FiShield, // ✅ faltava (você usa no Sanitário)
} from "react-icons/fi";

const styles = {
  container: { animation: "fadeIn 0.3s ease" },
  section: { marginBottom: "24px" },
  sectionTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#64748b",
    margin: "0 0 16px 0",
    letterSpacing: "0.5px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  // Grid layouts
  grid4: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" },
  grid3: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },

  // Cards de status
  statusCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
    position: "relative",
    overflow: "hidden",
  },
  statusIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 12px",
  },
  statusValue: {
    fontSize: "32px",
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: "4px",
  },
  statusLabel: {
    fontSize: "13px",
    color: "#64748b",
    fontWeight: "600",
  },
  statusSub: {
    fontSize: "11px",
    color: "#94a3b8",
    marginTop: "4px",
  },
  statusTrend: {
    position: "absolute",
    top: "12px",
    right: "12px",
    padding: "4px 8px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "700",
  },

  // Progress bars
  progressContainer: {
    marginBottom: "16px",
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px",
    fontSize: "13px",
  },
  progressLabel: {
    color: "#374151",
    fontWeight: "600",
  },
  progressValue: {
    color: "#0f172a",
    fontWeight: "700",
  },
  progressTrack: {
    height: "8px",
    backgroundColor: "#e2e8f0",
    borderRadius: "4px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: "4px",
    transition: "width 0.3s ease",
  },

  // Ações rápidas
  acoesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "12px",
    marginBottom: "24px",
  },
  acaoBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    padding: "16px 12px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.2s",
    fontSize: "12px",
    fontWeight: "600",
    color: "#374151",
  },

  // Lista de animais
  listaContainer: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    overflow: "hidden",
  },
  listaItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 20px",
    borderBottom: "1px solid #f1f5f9",
  },
  listaItemLast: {
    borderBottom: "none",
  },
  animalIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontSize: "14px",
    fontWeight: "700",
  },
  animalInfo: {
    flex: 1,
  },
  animalName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: "2px",
  },
  animalMeta: {
    fontSize: "12px",
    color: "#64748b",
  },
  animalStatus: {
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "700",
  },

  // Timeline
  timeline: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  timelineItem: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
  },
  timelineDot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    marginTop: "4px",
    flexShrink: 0,
    border: "2px solid #ffffff",
    boxShadow: "0 0 0 2px currentColor",
  },
  timelineContent: {
    flex: 1,
    paddingBottom: "16px",
    borderBottom: "1px dashed #e2e8f0",
  },
  timelineTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: "4px",
  },
  timelineMeta: {
    fontSize: "12px",
    color: "#64748b",
  },

  // Cards comparativos
  compareCard: {
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    padding: "20px",
  },
  compareTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  compareItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid #e2e8f0",
  },
  compareLabel: {
    fontSize: "13px",
    color: "#64748b",
  },
  compareValue: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#0f172a",
  },

  // Botões
  btnPrimario: {
    padding: "8px 16px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  btnSecundario: {
    padding: "8px 16px",
    backgroundColor: "#f3f4f6",
    color: "#374151",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  btnOutline: {
    padding: "6px 12px",
    backgroundColor: "transparent",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "12px",
    color: "#64748b",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },

  // Alerta box
  alertBox: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px",
    backgroundColor: "#f3e8ff",
    borderRadius: "10px",
    color: "#6b21a8",
    marginTop: "16px",
  },

  // Cards padrão
  card: {
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    padding: "20px",
  },
  cardTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 16px 0",
  },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid #e2e8f0",
  },
};

// Mock de animais em destaque reprodutivo
const ANIMAIS_DESTAQUE = [
  { id: "B-045", nome: "Brasilina", status: "cio", dias: 0, lactacao: 2 },
  { id: "B-078", nome: "Estrela", status: "aberta", dias: 145, lactacao: 3 },
  { id: "B-092", nome: "Maravilha", status: "pre_parto", dias: -12, lactacao: 4 },
  { id: "B-023", nome: "Princesa", status: "secagem", dias: 5, lactacao: 1 },
];

export function VisaoGeralTab({ dados }) {
  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>ESTRATIFICAÇÃO DO REBANHO</h4>
        <div style={styles.grid4}>
          {[
            { label: "Vacas Lactação", value: dados.vacasLactacao, icon: FiDroplet, color: "#3b82f6" },
            { label: "Vacas Secas", value: dados.vacasSecas, icon: FiClock, color: "#f59e0b" },
            { label: "Novilhas", value: dados.novilhas, icon: FiTrendingUp, color: "#8b5cf6" },
            { label: "Bezerras", value: dados.bezerras, icon: FiHeart, color: "#ec4899" },
          ].map((item, idx) => (
            <div key={idx} style={{ ...styles.card, textAlign: "center" }}>
              <div
                style={{
                  ...styles.statusIcon,
                  backgroundColor: item.color + "15",
                  color: item.color,
                  margin: "0 auto 8px",
                }}
              >
                <item.icon size={20} />
              </div>
              <span style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a" }}>
                {item.value}
              </span>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>PRODUÇÃO & EFICIÊNCIA</h4>
        <div style={styles.grid3}>
          <div style={styles.card}>
            <span style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a" }}>
              {dados.producaoMediaDia}L
            </span>
            <div style={{ fontSize: "14px", color: "#64748b", marginTop: "4px" }}>Média/dia</div>
            <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>Meta: 30L</div>
          </div>
          <div style={styles.card}>
            <span style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a" }}>
              R${dados.custoLitro}
            </span>
            <div style={{ fontSize: "14px", color: "#64748b", marginTop: "4px" }}>Custo/Litro</div>
            <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
              Bom: &lt;R$2,00
            </div>
          </div>
          <div style={styles.card}>
            <span style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a" }}>
              {dados.taxaDescarte}%
            </span>
            <div style={{ fontSize: "14px", color: "#64748b", marginTop: "4px" }}>Descarte Anual</div>
            <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>Meta: &lt;20%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReproducaoTab({ dados }) {
  const [filtroAnimais, setFiltroAnimais] = useState("todos");

  const getStatusInfo = (status) => {
    switch (status) {
      case "cio":
        return { color: "#ec4899", bg: "#fce7f3", label: "CIO DETECTADO" };
      case "aberta":
        return { color: "#ef4444", bg: "#fee2e2", label: "ABERTA" };
      case "pre_parto":
        return { color: "#8b5cf6", bg: "#ede9fe", label: "PRÉ-PARTO" };
      case "secagem":
        return { color: "#f59e0b", bg: "#fef3c7", label: "A SECAR" };
      default:
        return { color: "#6b7280", bg: "#f3f4f6", label: "NORMAL" };
    }
  };

  const animaisFiltrados =
    filtroAnimais === "todos"
      ? ANIMAIS_DESTAQUE
      : ANIMAIS_DESTAQUE.filter((a) => a.status === filtroAnimais);

  return (
    <div style={styles.container}>
      {/* Cards de Status Reprodutivo */}
      <div style={styles.grid4}>
        <div style={styles.statusCard}>
          <div style={{ ...styles.statusIcon, backgroundColor: "#fce7f3", color: "#ec4899" }}>
            <FiHeart size={24} />
          </div>
          <div style={styles.statusValue}>{dados.taxaConcepcao}%</div>
          <div style={styles.statusLabel}>Taxa de Concepção</div>
          <div style={styles.statusSub}>Meta: &gt;60%</div>
          <span
            style={{
              ...styles.statusTrend,
              backgroundColor: dados.taxaConcepcao < 60 ? "#fee2e2" : "#dcfce7",
              color: dados.taxaConcepcao < 60 ? "#dc2626" : "#166534",
            }}
          >
            {dados.taxaConcepcao < 60 ? "↓ Abaixo" : "↑ OK"}
          </span>
        </div>

        <div style={styles.statusCard}>
          <div style={{ ...styles.statusIcon, backgroundColor: "#dbeafe", color: "#3b82f6" }}>
            <FiZap size={24} />
          </div>
          <div style={styles.statusValue}>{dados.taxaServico}%</div>
          <div style={styles.statusLabel}>Taxa de Serviço</div>
          <div style={styles.statusSub}>Últimos 30 dias</div>
          <span style={{ ...styles.statusTrend, backgroundColor: "#dbeafe", color: "#1e40af" }}>
            {dados.taxaServico > 80 ? "↑ Ótimo" : "→ Regular"}
          </span>
        </div>

        <div style={styles.statusCard}>
          <div style={{ ...styles.statusIcon, backgroundColor: "#fef3c7", color: "#d97706" }}>
            <FiClock size={24} />
          </div>
          <div style={styles.statusValue}>{dados.iepMedio}</div>
          <div style={styles.statusLabel}>IEP Médio (dias)</div>
          <div style={styles.statusSub}>Ideal: 390-400</div>
          <span
            style={{
              ...styles.statusTrend,
              backgroundColor: dados.iepMedio > 420 ? "#fee2e2" : "#dcfce7",
              color: dados.iepMedio > 420 ? "#dc2626" : "#166534",
            }}
          >
            {dados.iepMedio > 420 ? "↑ Alto" : "✓ Normal"}
          </span>
        </div>

        <div style={styles.statusCard}>
          <div style={{ ...styles.statusIcon, backgroundColor: "#fee2e2", color: "#ef4444" }}>
            <FiAlertOctagon size={24} />
          </div>
          <div style={styles.statusValue}>{dados.diasAbertosMedio}</div>
          <div style={styles.statusLabel}>Dias Abertos Médio</div>

          {/* ✅ AQUI estava quebrando o Babel (o "<" em JSX) */}
          <div style={styles.statusSub}>Meta: {"<"} 100 dias</div>

          <span
            style={{
              ...styles.statusTrend,
              backgroundColor: dados.diasAbertosMedio > 120 ? "#fee2e2" : "#fef3c7",
              color: dados.diasAbertosMedio > 120 ? "#dc2626" : "#d97706",
            }}
          >
            {dados.diasAbertosMedio > 120 ? "⚠ Crítico" : "Atenção"}
          </span>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>AÇÕES RÁPIDAS</h4>
        <div style={styles.acoesGrid}>
          <button style={styles.acaoBtn} onClick={() => {}}>
            <FiZap size={20} color="#ec4899" />
            Registrar Cio
          </button>
          <button style={styles.acaoBtn} onClick={() => {}}>
            <FiActivity size={20} color="#3b82f6" />
            Registrar IA
          </button>
          <button style={styles.acaoBtn} onClick={() => {}}>
            <FiCheckCircle size={20} color="#10b981" />
            Confirmar Gestação
          </button>
          <button style={styles.acaoBtn} onClick={() => {}}>
            <FiCalendar size={20} color="#8b5cf6" />
            Agendar Secagem
          </button>
          <button style={styles.acaoBtn} onClick={() => {}}>
            <FiAlertTriangle size={20} color="#f59e0b" />
            Registrar Aborto
          </button>
        </div>
      </div>

      {/* Layout em 2 colunas: Animais + Comparativos */}
      <div style={styles.grid2}>
        {/* Coluna Esquerda: Animais em Destaque */}
        <div>
          <div style={{ ...styles.sectionTitle, marginBottom: "12px" }}>
            ANIMAIS EM DESTAQUE
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                style={{
                  ...styles.btnOutline,
                  ...(filtroAnimais === "todos"
                    ? { backgroundColor: "#eff6ff", color: "#2563eb", borderColor: "#93c5fd" }
                    : {}),
                }}
                onClick={() => setFiltroAnimais("todos")}
              >
                Todos
              </button>
              <button
                style={{
                  ...styles.btnOutline,
                  ...(filtroAnimais === "aberta"
                    ? { backgroundColor: "#fee2e2", color: "#dc2626", borderColor: "#fca5a5" }
                    : {}),
                }}
                onClick={() => setFiltroAnimais("aberta")}
              >
                Abertas
              </button>
            </div>
          </div>

          <div style={styles.listaContainer}>
            {animaisFiltrados.map((animal, idx) => {
              const status = getStatusInfo(animal.status);
              return (
                <div
                  key={animal.id}
                  style={{
                    ...styles.listaItem,
                    ...(idx === animaisFiltrados.length - 1 ? styles.listaItemLast : {}),
                  }}
                >
                  <div style={{ ...styles.animalIcon, backgroundColor: status.bg, color: status.color }}>
                    {animal.id.split("-")[1]}
                  </div>
                  <div style={styles.animalInfo}>
                    <div style={styles.animalName}>
                      {animal.nome}{" "}
                      <span style={{ color: "#94a3b8", fontSize: "12px" }}>({animal.id})</span>
                    </div>
                    <div style={styles.animalMeta}>
                      {animal.status === "cio"
                        ? "Detecção hoje"
                        : animal.status === "aberta"
                        ? `${animal.dias} dias aberta`
                        : animal.status === "pre_parto"
                        ? `Parto em ${Math.abs(animal.dias)} dias`
                        : `Secar em ${animal.dias} dias`}{" "}
                      • Lactação {animal.lactacao}
                    </div>
                  </div>
                  <span style={{ ...styles.animalStatus, backgroundColor: status.bg, color: status.color }}>
                    {status.label}
                  </span>
                  <button
                    style={{
                      padding: "4px",
                      backgroundColor: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "#64748b",
                    }}
                  >
                    <FiChevronRight size={18} />
                  </button>
                </div>
              );
            })}
          </div>

          <button style={{ ...styles.btnOutline, width: "100%", marginTop: "12px", justifyContent: "center" }}>
            <FiSearch size={14} /> Ver Todos os Animais
          </button>
        </div>

        {/* Coluna Direita: Comparativos e Metas */}
        <div>
          <h4 style={{ ...styles.sectionTitle, marginBottom: "12px" }}>DESEMPENHO VS META</h4>

          <div style={styles.compareCard}>
            <div style={styles.compareTitle}>
              <FiTarget size={16} color="#8b5cf6" />
              Índices Principais
            </div>

            <div style={styles.progressContainer}>
              <div style={styles.progressHeader}>
                <span style={styles.progressLabel}>Taxa de Concepção</span>
                <span style={styles.progressValue}>{dados.taxaConcepcao}% / 60%</span>
              </div>
              <div style={styles.progressTrack}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${Math.min((dados.taxaConcepcao / 60) * 100, 100)}%`,
                    backgroundColor: dados.taxaConcepcao >= 60 ? "#10b981" : "#ef4444",
                  }}
                />
              </div>
            </div>

            <div style={styles.progressContainer}>
              <div style={styles.progressHeader}>
                <span style={styles.progressLabel}>IEP (Intervalo Entre Partos)</span>
                <span style={styles.progressValue}>{dados.iepMedio}d / 400d</span>
              </div>
              <div style={styles.progressTrack}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${Math.min((400 / dados.iepMedio) * 100, 100)}%`,
                    backgroundColor: dados.iepMedio <= 400 ? "#10b981" : "#f59e0b",
                  }}
                />
              </div>
            </div>

            <div style={styles.progressContainer}>
              <div style={styles.progressHeader}>
                <span style={styles.progressLabel}>Taxa de Serviço</span>
                <span style={styles.progressValue}>{dados.taxaServico}% / 85%</span>
              </div>
              <div style={styles.progressTrack}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${Math.min((dados.taxaServico / 85) * 100, 100)}%`,
                    backgroundColor: dados.taxaServico >= 85 ? "#10b981" : "#3b82f6",
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ ...styles.compareCard, marginTop: "16px" }}>
            <div style={styles.compareTitle}>
              <FiBarChart2 size={16} color="#3b82f6" />
              Comparação Mensal
            </div>
            {[
              { label: "Concepção este mês", value: `${dados.taxaConcepcao}%`, trend: "+5%", positive: true },
              { label: "Serviços realizados", value: "24", trend: "+3", positive: true },
              { label: "Falhas detectadas", value: "3", trend: "-2", positive: true },
              { label: "IEP projetado", value: `${dados.iepProjeto}d`, trend: "-15d", positive: true },
            ].map((item, idx) => (
              <div key={idx} style={styles.compareItem}>
                <span style={styles.compareLabel}>{item.label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={styles.compareValue}>{item.value}</span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: item.positive ? "#10b981" : "#ef4444",
                      fontWeight: "600",
                    }}
                  >
                    {item.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline de Eventos */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>PRÓXIMOS EVENTOS REPRODUTIVOS</h4>
        <div style={styles.timeline}>
          {[
            { dia: "Hoje", evento: "Detecção de Cio", animal: "Brasilina (B-045)", tipo: "urgente" },
            { dia: "Amanhã", evento: "Inseminação Programada", animal: "Estrela (B-078)", tipo: "normal" },
            { dia: "Em 3 dias", evento: "Secagem Programada", animal: "Maravilha (B-092)", tipo: "alerta" },
            { dia: "Em 7 dias", evento: "Confirmação de Gestação", animal: "3 animais", tipo: "normal" },
          ].map((item, idx) => (
            <div key={idx} style={styles.timelineItem}>
              <div
                style={{
                  ...styles.timelineDot,
                  color:
                    item.tipo === "urgente" ? "#ef4444" : item.tipo === "alerta" ? "#f59e0b" : "#3b82f6",
                  backgroundColor:
                    item.tipo === "urgente"
                      ? "#fee2e2"
                      : item.tipo === "alerta"
                      ? "#fef3c7"
                      : "#dbeafe",
                }}
              />
              <div style={styles.timelineContent}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={styles.timelineTitle}>{item.evento}</div>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>{item.dia}</span>
                </div>
                <div style={styles.timelineMeta}>{item.animal}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Eventos Programados Alert */}
      <div style={styles.alertBox}>
        <FiCalendar style={{ color: "#8b5cf6", flexShrink: 0 }} size={20} />
        <div>
          <strong style={{ display: "block", marginBottom: "4px" }}>Eventos Programados</strong>
          <span style={{ fontSize: "14px" }}>
            {dados.partosPrevistosMes} partos e {dados.secagensMes} secagens previstos para este mês. Próximo parto
            estimado em 12 dias (Maravilha B-092).
          </span>
        </div>
        <button style={{ ...styles.btnPrimario, marginLeft: "auto", whiteSpace: "nowrap" }}>Ver Calendário</button>
      </div>
    </div>
  );
}

export function SanitarioTab({ dados, onNotificar }) {
  const [filtro, setFiltro] = useState("todos");

  const historicoSanitario = dados.historico || [
    { id: 1, tipo: "Vacina", nome: "Vacina Aftosa", data: "2024-01-15", status: "concluido", qtdAnimais: 145 },
    { id: 2, tipo: "Vermifugação", nome: "Ivermectina", data: "2024-01-10", status: "concluido", qtdAnimais: 89 },
    { id: 3, tipo: "Tratamento", nome: "Mastite - Antibiótico", data: "2024-01-28", status: "em_andamento", qtdAnimais: 2 },
  ];

  const proximasAcoes = dados.proximasAcoes || [
    { id: 1, acao: "Vacina Brucelose", dataPrevista: "2024-02-15", diasPara: 13, qtdAnimais: 45 },
    { id: 2, acao: "Vermifugação Rotina", dataPrevista: "2024-02-10", diasPara: 8, qtdAnimais: 89 },
  ];

  const getStatusStyle = (status) => {
    switch (status) {
      case "concluido":
        return { bg: "#dcfce7", color: "#166534", label: "Concluído" };
      case "em_andamento":
        return { bg: "#fef3c7", color: "#d97706", label: "Em Tratamento" };
      case "pendente":
        return { bg: "#dbeafe", color: "#1e40af", label: "Pendente" };
      default:
        return { bg: "#f3f4f6", color: "#6b7280", label: "N/A" };
    }
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case "Vacina":
        return { icon: FiShield, color: "#3b82f6" };
      case "Vermifugação":
        return { icon: FiActivity, color: "#8b5cf6" };
      case "Tratamento":
        return { icon: FiThermometer, color: "#ef4444" };
      default:
        return { icon: FiShield, color: "#6b7280" };
    }
  };

  return (
    <div style={styles.container}>
      {/* Cards de Resumo Sanitário */}
      <div style={styles.grid4}>
        <div style={{ ...styles.card, display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ ...styles.statusIcon, backgroundColor: "#dcfce7", color: "#166534" }}>
            <FiCheckCircle size={20} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>Status Geral</div>
            <div style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>Saudável</div>
          </div>
        </div>

        <div style={{ ...styles.card, display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ ...styles.statusIcon, backgroundColor: "#dbeafe", color: "#1e40af" }}>
            <FiShield size={20} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>Vacinação</div>
            <div style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>Em dia</div>
          </div>
        </div>

        <div style={{ ...styles.card, display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ ...styles.statusIcon, backgroundColor: "#fef3c7", color: "#d97706" }}>
            <FiActivity size={20} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>Vermifugação</div>
            <div style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>Próxima em 8d</div>
          </div>
        </div>

        <div style={{ ...styles.card, display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ ...styles.statusIcon, backgroundColor: "#fee2e2", color: "#dc2626" }}>
            <FiAlertTriangle size={20} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>Alertas</div>
            <div style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>
              {dados.alertas?.length || 0} ativo(s)
            </div>
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>AÇÕES RÁPIDAS</h4>
        <div style={styles.acoesGrid}>
          <button style={styles.acaoBtn} onClick={() => {}}>
            <FiPlus size={20} color="#2563eb" />
            Registrar Ocorrência
          </button>
          <button style={styles.acaoBtn} onClick={() => {}}>
            <FiThermometer size={20} color="#ef4444" />
            Registrar Caso Clínico
          </button>
          <button style={styles.acaoBtn} onClick={() => {}}>
            <FiShield size={20} color="#3b82f6" />
            Aplicar Vacina
          </button>
          <button style={styles.acaoBtn} onClick={() => {}}>
            <FiActivity size={20} color="#8b5cf6" />
            Vermifugar
          </button>
        </div>
      </div>

      {/* Alertas Críticos (se houver) */}
      {dados.alertas && dados.alertas.length > 0 && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>
            ALERTAS ATIVOS
            <span style={{ color: "#ef4444", fontSize: "12px" }}>{dados.alertas.length} caso(s) crítico(s)</span>
          </h4>
          {dados.alertas.map((alerta) => (
            <div
              key={alerta.id}
              style={{
                ...styles.card,
                marginBottom: "12px",
                borderLeft: `4px solid ${alerta.gravidade === "alta" ? "#ef4444" : "#f59e0b"}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <FiAlertTriangle color={alerta.gravidade === "alta" ? "#ef4444" : "#f59e0b"} />
                <strong>{alerta.tipo === "mastite" ? "Problema de Úbere" : "Problema Reprodutivo"}</strong>
                <span
                  style={{
                    marginLeft: "auto",
                    padding: "2px 8px",
                    backgroundColor: "#fee2e2",
                    color: "#dc2626",
                    borderRadius: "10px",
                    fontSize: "11px",
                    fontWeight: "700",
                  }}
                >
                  {alerta.qtd} animal(is)
                </span>
              </div>
              <p style={{ fontSize: "14px", color: "#374151", margin: "0 0 12px 0" }}>{alerta.mensagem}</p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button style={styles.btnSecundario}>Ver Animais</button>
                <button style={styles.btnPrimario} onClick={onNotificar}>
                  <FiAlertTriangle size={14} /> Notificar Produtor
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Próximas Ações Programadas */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>PRÓXIMAS AÇÕES PROGRAMADAS</h4>
        <div style={styles.listaContainer}>
          {proximasAcoes.map((acao, idx) => (
            <div
              key={acao.id}
              style={{ ...styles.listaItem, ...(idx === proximasAcoes.length - 1 ? styles.listaItemLast : {}) }}
            >
              <div style={{ ...styles.statusIcon, backgroundColor: "#dbeafe", color: "#1e40af" }}>
                <FiCalendar size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>{acao.acao}</div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  Previsto para {new Date(acao.dataPrevista).toLocaleDateString("pt-BR")} • Em {acao.diasPara} dias •{" "}
                  {acao.qtdAnimais} animais
                </div>
              </div>
              <button style={{ ...styles.btnOutline, color: "#2563eb", borderColor: "#dbeafe" }}>Executar</button>
            </div>
          ))}
        </div>
      </div>

      {/* Histórico Sanitário */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>
          HISTÓRICO SANITÁRIO
          <button style={styles.btnOutline}>
            <FiFilter size={14} /> Filtrar
          </button>
        </h4>
        <div style={styles.listaContainer}>
          {historicoSanitario.map((item, idx) => {
            const { icon: Icon, color } = getTipoIcon(item.tipo);
            const statusStyle = getStatusStyle(item.status);

            return (
              <div
                key={item.id}
                style={{ ...styles.listaItem, ...(idx === historicoSanitario.length - 1 ? styles.listaItemLast : {}) }}
              >
                <div style={{ ...styles.statusIcon, backgroundColor: color + "15", color }}>
                  <Icon size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>{item.nome}</div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    {item.tipo} • {new Date(item.data).toLocaleDateString("pt-BR")} • {item.qtdAnimais} animais tratados
                  </div>
                </div>
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: "20px",
                    fontSize: "11px",
                    fontWeight: "700",
                    backgroundColor: statusStyle.bg,
                    color: statusStyle.color,
                  }}
                >
                  {statusStyle.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty State Melhorado (quando não há alertas) */}
      {(!dados.alertas || dados.alertas.length === 0) && (
        <div
          style={{
            textAlign: "center",
            padding: "48px 24px",
            backgroundColor: "#f0fdf4",
            borderRadius: "12px",
            border: "1px solid #86efac",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              backgroundColor: "#dcfce7",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <FiCheckCircle size={32} color="#10b981" />
          </div>
          <h4 style={{ fontSize: "18px", fontWeight: "700", color: "#166534", marginBottom: "8px" }}>
            Rebanho Saudável!
          </h4>
          <p style={{ fontSize: "14px", color: "#15803d", marginBottom: "24px" }}>
            Não há alertas sanitários ativos. Todos os animais estão dentro dos parâmetros esperados. Continue com o
            acompanhamento preventivo.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button style={styles.btnSecundario} onClick={() => {}}>
              <FiSearch size={16} /> Ver Histórico Completo
            </button>
            <button style={styles.btnPrimario} onClick={() => {}}>
              <FiPlus size={16} /> Registrar Ação Preventiva
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
