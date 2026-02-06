import { useState } from "react";
import { toast } from "react-toastify";
import { FiX, FiMessageSquare, FiCalendar, FiPlus, FiChevronLeft, FiChevronRight } from "react-icons/fi";

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  },
  container: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "500px",
    maxHeight: "90vh",
    overflow: "auto",
    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
  },
  containerLarge: {
    maxWidth: "800px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderBottom: "1px solid #e2e8f0",
  },
  title: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  closeBtn: {
    background: "none",
    border: "none",
    padding: "8px",
    cursor: "pointer",
    color: "#64748b",
    borderRadius: "6px",
  },
  body: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
  },
  select: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    fontSize: "14px",
    backgroundColor: "#ffffff",
  },
  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    fontSize: "14px",
  },
  textarea: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    fontSize: "14px",
    resize: "vertical",
    fontFamily: "inherit",
  },
  urgenciaGroup: {
    display: "flex",
    gap: "8px",
  },
  urgenciaBtn: {
    flex: 1,
    padding: "10px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
  },
  btnPrimario: {
    padding: "12px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginTop: "8px",
  },
  // Calendario
  calHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    fontWeight: "700",
    color: "#0f172a",
  },
  calGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "4px",
  },
  calDayHeader: {
    textAlign: "center",
    fontSize: "12px",
    color: "#94a3b8",
    fontWeight: "600",
    padding: "8px 0",
  },
  calDay: {
    aspectRatio: "1",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    position: "relative",
    border: "1px solid transparent",
  },
  calDaySelected: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    borderColor: "#2563eb",
  },
  calDayWithEvent: {
    borderColor: "#e2e8f0",
  },
  eventDots: {
    display: "flex",
    gap: "2px",
    position: "absolute",
    bottom: "4px",
  },
  dot: {
    width: "4px",
    height: "4px",
    borderRadius: "50%",
  },
};

const FiSend = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

export function NotificarModal({ isOpen, onClose, fazendas }) {
  const [mensagem, setMensagem] = useState("");
  const [urgencia, setUrgencia] = useState("normal");
  const [fazendaSelecionada, setFazendaSelecionada] = useState("todas");

  if (!isOpen) return null;

  const handleEnviar = () => {
    if (!mensagem.trim()) {
      toast.error("Digite uma mensagem");
      return;
    }
    toast.success(`Notificação enviada!`);
    onClose();
    setMensagem("");
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.title}><FiMessageSquare /> Notificar Produtor</h3>
          <button style={styles.closeBtn} onClick={onClose}><FiX /></button>
        </div>
        
        <div style={styles.body}>
          <div style={styles.field}>
            <label>Propriedade</label>
            <select style={styles.select} value={fazendaSelecionada} onChange={(e) => setFazendaSelecionada(e.target.value)}>
              <option value="todas">Todas as propriedades</option>
              {fazendas.map(f => (
                <option key={f.fazenda_id} value={f.fazenda_id}>{f.fazenda_nome}</option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label>Nível de Urgência</label>
            <div style={styles.urgenciaGroup}>
              {["normal", "urgente", "critico"].map((nivel) => (
                <button
                  key={nivel}
                  style={{
                    ...styles.urgenciaBtn,
                    backgroundColor: urgencia === nivel ? 
                      (nivel === "normal" ? "#dbeafe" : nivel === "urgente" ? "#fef3c7" : "#fee2e2") : "#f3f4f6",
                    color: urgencia === nivel ?
                      (nivel === "normal" ? "#1e40af" : nivel === "urgente" ? "#d97706" : "#dc2626") : "#6b7280"
                  }}
                  onClick={() => setUrgencia(nivel)}
                >
                  {nivel.charAt(0).toUpperCase() + nivel.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.field}>
            <label>Mensagem</label>
            <textarea style={styles.textarea} rows={4} placeholder="Digite a mensagem..." value={mensagem} onChange={(e) => setMensagem(e.target.value)} />
          </div>

          <button style={styles.btnPrimario} onClick={handleEnviar}>
            <FiSend size={16} /> Enviar Notificação
          </button>
        </div>
      </div>
    </div>
  );
}

export function AgendarVisitaModal({ isOpen, onClose, fazendas, visitasExistentes, onAgendar }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [formData, setFormData] = useState({ fazendaId: "", hora: "09:00", tipo: "Rotina", observacoes: "" });

  if (!isOpen) return null;

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const visitasDoMes = visitasExistentes.filter(v => {
    const vDate = new Date(v.data);
    return vDate.getMonth() === currentDate.getMonth() && vDate.getFullYear() === currentDate.getFullYear();
  });

  const handleSubmit = () => {
    if (!selectedDate || !formData.fazendaId) {
      toast.error("Selecione data e propriedade");
      return;
    }
    
    const dataFormatada = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
    
    onAgendar({
      id: Date.now(),
      fazendaId: parseInt(formData.fazendaId),
      data: dataFormatada,
      hora: formData.hora,
      tipo: formData.tipo,
      observacoes: formData.observacoes
    });
    
    onClose();
  };

  const dias = getDaysInMonth(currentDate);

  return (
    <div style={styles.overlay}>
      <div style={{...styles.container, ...styles.containerLarge}}>
        <div style={styles.header}>
          <h3 style={styles.title}><FiCalendar /> Agendar Visita</h3>
          <button style={styles.closeBtn} onClick={onClose}><FiX /></button>
        </div>

        <div style={{...styles.body, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px"}}>
          <div>
            <div style={styles.calHeader}>
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}>
                <FiChevronLeft />
              </button>
              <span>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}>
                <FiChevronRight />
              </button>
            </div>
            
            <div style={styles.calGrid}>
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => (
                <div key={d} style={styles.calDayHeader}>{d}</div>
              ))}
              {dias.map((dia, idx) => {
                if (!dia) return <div key={idx} />;
                const visitasNoDia = visitasDoMes.filter(v => new Date(v.data).getDate() === dia);
                const isSelected = selectedDate === dia;
                return (
                  <div 
                    key={idx} 
                    style={{
                      ...styles.calDay,
                      ...(isSelected ? styles.calDaySelected : {}),
                      ...(visitasNoDia.length > 0 ? styles.calDayWithEvent : {})
                    }}
                    onClick={() => setSelectedDate(dia)}
                  >
                    <span>{dia}</span>
                    {visitasNoDia.length > 0 && (
                      <div style={styles.eventDots}>
                        {visitasNoDia.map((v, i) => (
                          <div key={i} style={{...styles.dot, backgroundColor: v.fazendaId === 1 ? "#3b82f6" : "#10b981"}} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
            <div style={styles.field}>
              <label>Propriedade *</label>
              <select style={styles.select} value={formData.fazendaId} onChange={(e) => setFormData({...formData, fazendaId: e.target.value})}>
                <option value="">Selecione...</option>
                {fazendas.map(f => (
                  <option key={f.fazenda_id} value={f.fazenda_id}>{f.fazenda_nome}</option>
                ))}
              </select>
            </div>

            <div style={styles.field}>
              <label>Data Selecionada</label>
              <input type="text" style={styles.input} readOnly value={selectedDate ? `${selectedDate}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}` : "Clique no calendário..."} />
            </div>

            <div style={styles.field}>
              <label>Horário *</label>
              <input type="time" style={styles.input} value={formData.hora} onChange={(e) => setFormData({...formData, hora: e.target.value})} />
            </div>

            <div style={styles.field}>
              <label>Tipo de Visita</label>
              <select style={styles.select} value={formData.tipo} onChange={(e) => setFormData({...formData, tipo: e.target.value})}>
                <option>Rotina</option>
                <option>Emergência</option>
                <option>Inseminação</option>
                <option>Vacinação</option>
              </select>
            </div>

            <button style={styles.btnPrimario} onClick={handleSubmit}>
              <FiPlus /> Agendar Visita
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}