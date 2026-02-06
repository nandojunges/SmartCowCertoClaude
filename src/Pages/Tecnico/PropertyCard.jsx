import { useState } from "react";
import { FiArrowRight, FiX, FiUsers, FiPhone, FiClock, FiDroplet, FiCalendar, FiThermometer, FiAlertTriangle } from "react-icons/fi";
import { VisaoGeralTab, ReproducaoTab, SanitarioTab } from "./Tabs";

const styles = {
  // Compacto
  cardCompacto: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "24px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    transition: "all 0.2s",
    cursor: "pointer",
  },
  cardCompactoActive: {
    borderColor: "#93c5fd",
    boxShadow: "0 0 0 2px #dbeafe",
  },
  headerCompacto: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 4px 0",
  },
  subtitle: {
    fontSize: "13px",
    color: "#64748b",
  },
  actions: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  badgeAtivo: {
    padding: "4px 8px",
    backgroundColor: "#dbeafe",
    color: "#1e40af",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "700",
  },
  btnIcon: {
    padding: "8px",
    backgroundColor: "#f3f4f6",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    color: "#64748b",
  },
  gridCompacto: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  item: {
    display: "flex",
    flexDirection: "column",
    padding: "12px",
    backgroundColor: "#f8fafc",
    borderRadius: "10px",
    gap: "4px",
  },
  itemValor: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f172a",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  itemLabel: {
    fontSize: "12px",
    color: "#94a3b8",
  },
  eventos: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "12px",
    backgroundColor: "#f8fafc",
    borderRadius: "10px",
  },
  evento: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "#374151",
  },
  alerta: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px",
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
  },
  btnAcessar: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    color: "#374151",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginTop: "auto",
  },
  btnAcessarAtivo: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#2563eb",
    border: "none",
    borderRadius: "8px",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginTop: "auto",
  },

  // Expandido
  cardExpandido: {
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
  },
  cardExpandidoActive: {
    borderColor: "#93c5fd",
    boxShadow: "0 0 0 2px #dbeafe, 0 10px 15px -3px rgba(0,0,0,0.1)",
  },
  headerExpandido: {
    padding: "24px 24px 0 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottom: "1px solid #f1f5f9",
  },
  headerContent: {
    flex: 1,
  },
  titleExpandido: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
    margin: "0 0 8px 0",
  },
  meta: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
    fontSize: "13px",
    color: "#64748b",
  },
  badgeAtivoLarge: {
    padding: "4px 12px",
    backgroundColor: "#dbeafe",
    color: "#1e40af",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
  },
  btnMinimize: {
    padding: "8px",
    backgroundColor: "#f3f4f6",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    color: "#64748b",
  },
  tabs: {
    display: "flex",
    gap: "32px",
    padding: "0 24px",
    borderBottom: "1px solid #e2e8f0",
  },
  tab: {
    padding: "16px 0",
    border: "none",
    backgroundColor: "transparent",
    color: "#64748b",
    fontWeight: "600",
    cursor: "pointer",
    borderBottom: "2px solid transparent",
    marginBottom: "-1px",
  },
  tabAtiva: {
    color: "#2563eb",
    borderBottomColor: "#2563eb",
  },
  content: {
    padding: "24px",
    minHeight: "400px",
  },
  footer: {
    padding: "20px 24px",
    backgroundColor: "#f8fafc",
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
  },
  btnAcao: {
    padding: "12px 24px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    backgroundColor: "#ffffff",
    color: "#374151",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  btnAcaoPrimario: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
  },
};

export function PropertyCardCompact({ acesso, dados, isActive, onExpand, onAccess }) {
  return (
    <div style={{...styles.cardCompacto, ...(isActive ? styles.cardCompactoActive : {})}}>
      <div style={styles.headerCompacto}>
        <div>
          <h3 style={styles.title}>{dados.nome || acesso.fazenda_nome}</h3>
          <span style={styles.subtitle}>{dados.totalAnimais} animais totais</span>
        </div>
        <div style={styles.actions}>
          {isActive && <span style={styles.badgeAtivo}>ATIVO</span>}
          <button style={styles.btnIcon} onClick={onExpand}>
            <FiArrowRight size={18} />
          </button>
        </div>
      </div>

      <div style={styles.gridCompacto}>
        <div style={styles.item}>
          <div style={styles.itemValor}>
            <FiDroplet style={{color: "#3b82f6"}} size={20} />
            {dados.producaoMediaDia}L
          </div>
          <span style={styles.itemLabel}>Média/dia</span>
        </div>
        <div style={styles.item}>
          <div style={styles.itemValor}>
            <FiUsers style={{color: "#10b981"}} size={20} />
            {dados.vacasLactacao}
          </div>
          <span style={styles.itemLabel}>Em lactação</span>
        </div>
        <div style={styles.item}>
          <div style={styles.itemValor}>
            <span style={{color: "#ec4899", fontSize: "16px"}}>♥</span>
            {dados.taxaConcepcao}%
          </div>
          <span style={styles.itemLabel}>Concepção</span>
        </div>
        <div style={styles.item}>
          <div style={styles.itemValor}>
            <span style={{color: "#8b5cf6", fontSize: "16px"}}>⚡</span>
            {dados.taxaServico}%
          </div>
          <span style={styles.itemLabel}>Tx Serviço</span>
        </div>
      </div>

      <div style={styles.eventos}>
        <div style={styles.evento}>
          <FiCalendar size={14} color="#8b5cf6" />
          <span>{dados.partosPrevistosMes} partos este mês</span>
        </div>
        <div style={styles.evento}>
          <FiThermometer size={14} color="#f59e0b" />
          <span>{dados.secagensMes} secagens programadas</span>
        </div>
      </div>

      {dados.alertas?.length > 0 && (
        <div style={styles.alerta}>
          <FiAlertTriangle size={14} />
          <span>{dados.alertas.length} alerta(s) ativo(s)</span>
        </div>
      )}

      <button style={isActive ? styles.btnAcessarAtivo : styles.btnAcessar} onClick={() => onAccess(acesso.fazenda_id)}>
        {isActive ? "Continuar" : "Acessar"} <FiArrowRight size={16} />
      </button>
    </div>
  );
}

export function PropertyCardExpanded({ acesso, dados, isActive, onMinimize, onAccess, onNotificar }) {
  const [abaAtiva, setAbaAtiva] = useState("geral");

  return (
    <div style={{...styles.cardExpandido, ...(isActive ? styles.cardExpandidoActive : {})}}>
      <div style={styles.headerExpandido}>
        <div style={styles.headerContent}>
          <h2 style={styles.titleExpandido}>{dados.nome || acesso.fazenda_nome}</h2>
          <div style={styles.meta}>
            <span><FiUsers size={14} /> {dados.totalAnimais} animais</span>
            <span><FiPhone size={14} /> {dados.telefoneProdutor}</span>
            <span><FiClock size={14} /> Última visita: {new Date(dados.ultimaVisita).toLocaleDateString("pt-BR")}</span>
            {isActive && <span style={styles.badgeAtivoLarge}>ACESSANDO AGORA</span>}
          </div>
        </div>
        <button style={styles.btnMinimize} onClick={onMinimize}>
          <FiX size={24} />
        </button>
      </div>

      <div style={styles.tabs}>
        {[
          { id: "geral", label: "Visão Geral" },
          { id: "reproducao", label: "Reprodução" },
          { id: "sanitario", label: "Sanitário" }
        ].map(tab => (
          <button
            key={tab.id}
            style={{...styles.tab, ...(abaAtiva === tab.id ? styles.tabAtiva : {})}}
            onClick={() => setAbaAtiva(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {abaAtiva === "geral" && <VisaoGeralTab dados={dados} />}
        {abaAtiva === "reproducao" && <ReproducaoTab dados={dados} />}
        {abaAtiva === "sanitario" && <SanitarioTab dados={dados} onNotificar={onNotificar} />}
      </div>

      <div style={styles.footer}>
        <button style={styles.btnAcao} onClick={onNotificar}>
          Notificar Produtor
        </button>
        <button style={{...styles.btnAcao, ...styles.btnAcaoPrimario}} onClick={() => onAccess(acesso.fazenda_id)}>
          <FiArrowRight size={18} /> {isActive ? "Continuar Gestão" : "Acessar Sistema"}
        </button>
      </div>
    </div>
  );
}