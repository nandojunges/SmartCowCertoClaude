import { useMemo } from "react";
import { FiHeart, FiAlertTriangle, FiClock, FiActivity } from "react-icons/fi";

const styles = {
  container: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
    marginBottom: "32px",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "20px",
    display: "flex",
    gap: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
    position: "relative",
  },
  iconSection: {
    width: "48px",
    height: "48px",
    borderRadius: "10px",
    backgroundColor: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  value: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
  },
  title: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
    marginTop: "4px",
  },
  sub: {
    fontSize: "12px",
    marginTop: "4px",
  },
  trend: {
    fontSize: "11px",
    color: "#94a3b8",
    marginTop: "4px",
  },
  badge: {
    position: "absolute",
    top: "16px",
    right: "16px",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "700",
  },
};

export default function DashboardStats({ fazendas, dadosFazendas }) {
  const stats = useMemo(() => {
    const totalAnimais = fazendas.reduce((acc, f) => acc + (dadosFazendas[f.fazenda_id]?.totalAnimais || 0), 0);
    const totalAlertas = fazendas.reduce((acc, f) => acc + (dadosFazendas[f.fazenda_id]?.alertas?.length || 0), 0);
    
    const totalVacas = fazendas.reduce((acc, f) => acc + (dadosFazendas[f.fazenda_id]?.vacasLactacao || 0), 0);
    const mediaConcepcao = fazendas.reduce((acc, f) => {
      const d = dadosFazendas[f.fazenda_id];
      return acc + (d?.taxaConcepcao || 0) * (d?.vacasLactacao || 0);
    }, 0) / (totalVacas || 1);

    const vacasAbertasCriticas = fazendas.reduce((acc, f) => {
      const d = dadosFazendas[f.fazenda_id];
      return acc + (d?.alertas?.find(a => a.tipo === "reproducao")?.qtd || 0);
    }, 0);

    const iepMedio = fazendas.reduce((acc, f) => acc + (dadosFazendas[f.fazenda_id]?.iepMedio || 0), 0) / (fazendas.length || 1);

    return { totalAnimais, totalAlertas, mediaConcepcao, vacasAbertasCriticas, iepMedio };
  }, [fazendas, dadosFazendas]);

  const cards = [
    {
      icon: FiHeart,
      title: "Taxa de Concepção Geral",
      value: `${stats.mediaConcepcao.toFixed(1)}%`,
      sub: "Meta: >60%",
      status: stats.mediaConcepcao < 55 ? "critico" : stats.mediaConcepcao < 60 ? "alerta" : "bom",
      trend: stats.mediaConcepcao < 60 ? "↓ 5% vs mês anterior" : "↑ 2% vs mês anterior"
    },
    {
      icon: FiAlertTriangle,
      title: "Alertas Sanitários Ativos",
      value: stats.totalAlertas,
      sub: "Em todas as propriedades",
      status: stats.totalAlertas > 3 ? "critico" : stats.totalAlertas > 0 ? "alerta" : "bom",
      trend: stats.totalAlertas > 0 ? `${stats.totalAlertas} propriedades afetadas` : "Tudo sob controle"
    },
    {
      icon: FiClock,
      title: "Vacas Abertas Críticas",
      value: stats.vacasAbertasCriticas,
      sub: "> 150 dias",
      status: stats.vacasAbertasCriticas > 5 ? "critico" : stats.vacasAbertasCriticas > 0 ? "alerta" : "bom",
      acao: "Revisar protocolos"
    },
    {
      icon: FiActivity,
      title: "IEP Médio Geral",
      value: `${stats.iepMedio.toFixed(0)} dias`,
      sub: "Ideal: 390-400 dias",
      status: stats.iepMedio > 420 ? "critico" : stats.iepMedio > 400 ? "alerta" : "bom",
      trend: stats.iepMedio > 400 ? "Acima do ideal" : "Dentro do parâmetro"
    }
  ];

  return (
    <div style={styles.container}>
      {cards.map((card, idx) => (
        <div key={idx} style={{
          ...styles.card,
          borderLeft: `4px solid ${card.status === "critico" ? "#ef4444" : card.status === "alerta" ? "#f59e0b" : "#10b981"}`
        }}>
          <div style={styles.iconSection}>
            <card.icon size={24} color={card.status === "critico" ? "#ef4444" : card.status === "alerta" ? "#f59e0b" : "#10b981"} />
          </div>
          <div style={styles.content}>
            <span style={styles.value}>{card.value}</span>
            <span style={styles.title}>{card.title}</span>
            <span style={{...styles.sub, color: card.status === "critico" ? "#ef4444" : "#64748b"}}>
              {card.sub}
            </span>
            {card.trend && <span style={styles.trend}>{card.trend}</span>}
          </div>
          {card.status !== "bom" && (
            <div style={{...styles.badge, backgroundColor: card.status === "critico" ? "#fee2e2" : "#fef3c7", color: card.status === "critico" ? "#dc2626" : "#d97706"}}>
              {card.status === "critico" ? "Ação Necessária" : "Atenção"}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}