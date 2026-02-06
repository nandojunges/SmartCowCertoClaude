import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiGrid,
  FiList,
  FiCalendar,
  FiMapPin,
  FiUsers,
  FiActivity,
  FiBell,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiCheck,
  FiX,
  FiArrowRight,
  FiHome,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { useFazenda } from "../../context/FazendaContext";
import { supabase } from "../../lib/supabaseClient";
import { getEmailDoUsuario } from "../../lib/fazendaHelpers";
import { listarConvitesPendentesTecnico } from "../../services/acessos";
import { MOCK_DADOS_FAZENDAS, MOCK_VISITAS } from "./mockData";
import DashboardStats from "./DashboardStats";
import { PropertyCardCompact, PropertyCardExpanded } from "./PropertyCard";
import { NotificarModal, AgendarVisitaModal } from "./Modals";

import "./TecnicoHome.css";

// ============================================
// COMPONENTE: Calendário Roleta com Agenda
// ============================================
const CalendarioAgenda = ({ visitas, onAgendar, fazendas }) => {
  const [dataAtual, setDataAtual] = useState(new Date());
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [mostrarModal, setMostrarModal] = useState(false);

  const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  // Gerar dias do mês
  const gerarDias = useCallback(() => {
    const ano = dataAtual.getFullYear();
    const mes = dataAtual.getMonth();
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const dias = [];

    // Dias do mês anterior
    const diaSemanaPrimeiro = primeiroDia.getDay();
    for (let i = diaSemanaPrimeiro - 1; i >= 0; i--) {
      dias.push({ data: new Date(ano, mes, -i), foraDoMes: true });
    }

    // Dias do mês atual
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      dias.push({ data: new Date(ano, mes, dia), foraDoMes: false });
    }

    // Dias do próximo mês
    const diaSemanaUltimo = ultimoDia.getDay();
    for (let i = 1; i < 7 - diaSemanaUltimo; i++) {
      dias.push({ data: new Date(ano, mes + 1, i), foraDoMes: true });
    }

    return dias;
  }, [dataAtual]);

  const dias = gerarDias();

  // Filtrar visitas do dia selecionado
  const visitasDoDia = useMemo(() => {
    const dataStr = dataSelecionada.toISOString().split("T")[0];
    return visitas.filter((v) => v.data === dataStr);
  }, [visitas, dataSelecionada]);

  const contarVisitas = useCallback((data) => {
    const dataStr = data.toISOString().split("T")[0];
    return visitas.filter((v) => v.data === dataStr).length;
  }, [visitas]);

  const ehHoje = (data) => {
    const hoje = new Date();
    return data.toDateString() === hoje.toDateString();
  };

  const estaSelecionado = (data) => {
    return data.toDateString() === dataSelecionada.toDateString();
  };

  const mudarMes = (direcao) => {
    setDataAtual(new Date(dataAtual.getFullYear(), dataAtual.getMonth() + direcao, 1));
  };

  const navegarParaHoje = () => {
    const hoje = new Date();
    setDataAtual(hoje);
    setDataSelecionada(hoje);
  };

  // Modal de agendamento rápido
  const ModalAgendamentoRapido = () => {
    const [formData, setFormData] = useState({
      fazendaId: "",
      horario: "09:00",
      observacao: "",
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onAgendar({
        id: Date.now(),
        data: dataSelecionada.toISOString().split("T")[0],
        ...formData,
        status: "agendada",
      });
      setMostrarModal(false);
      setFormData({ fazendaId: "", horario: "09:00", observacao: "" });
    };

    return (
      <AnimatePresence>
        {mostrarModal && (
          <>
            <motion.div 
              className="modal-overlay" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setMostrarModal(false)} 
            />
            <motion.div 
              className="modal-container modal-pequeno" 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="modal-header">
                <h3>Agendar Visita</h3>
                <p>{dataSelecionada.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</p>
                <button className="modal-close" onClick={() => setMostrarModal(false)}>
                  <FiX size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                  <label>Fazenda</label>
                  <select 
                    value={formData.fazendaId} 
                    onChange={(e) => setFormData({ ...formData, fazendaId: e.target.value })} 
                    required
                  >
                    <option value="">Selecione uma fazenda</option>
                    {fazendas.map((f) => (
                      <option key={f.fazenda_id} value={f.fazenda_id}>{f.fazenda_nome}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Horário</label>
                  <input 
                    type="time" 
                    value={formData.horario} 
                    onChange={(e) => setFormData({ ...formData, horario: e.target.value })} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Observação (opcional)</label>
                  <textarea 
                    value={formData.observacao} 
                    onChange={(e) => setFormData({ ...formData, observacao: e.target.value })} 
                    rows={2} 
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secundario" onClick={() => setMostrarModal(false)}>
                    Cancelar
                  </button>
                  <motion.button 
                    type="submit" 
                    className="btn-primario" 
                    whileHover={{ scale: 1.02 }} 
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiCheck size={16} /> Confirmar
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div className="calendario-agenda">
      {/* Header do calendário */}
      <div className="calendario-header">
        <div className="calendario-nav">
          <motion.button 
            className="nav-btn" 
            whileHover={{ scale: 1.1 }} 
            whileTap={{ scale: 0.9 }} 
            onClick={() => mudarMes(-1)}
          >
            <FiChevronLeft size={20} />
          </motion.button>
          <h4>{meses[dataAtual.getMonth()]} {dataAtual.getFullYear()}</h4>
          <motion.button 
            className="nav-btn" 
            whileHover={{ scale: 1.1 }} 
            whileTap={{ scale: 0.9 }} 
            onClick={() => mudarMes(1)}
          >
            <FiChevronRight size={20} />
          </motion.button>
        </div>
        <div className="calendario-acoes">
          <motion.button 
            className="btn-hoje" 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }} 
            onClick={navegarParaHoje}
          >
            Hoje
          </motion.button>
          <motion.button 
            className="btn-agendar-visita" 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }} 
            onClick={() => setMostrarModal(true)}
          >
            <FiPlus size={16} /> Visita
          </motion.button>
        </div>
      </div>

      {/* Roleta de dias */}
      <div className="roleta-dias">
        {dias.map(({ data, foraDoMes }, index) => {
          const selecionado = estaSelecionado(data);
          const hoje = ehHoje(data);
          const visitasCount = contarVisitas(data);

          return (
            <motion.div
              key={index}
              className={`dia-card ${selecionado ? "selecionado" : ""} ${hoje ? "hoje" : ""} ${foraDoMes ? "fora-mes" : ""}`}
              onClick={() => setDataSelecionada(data)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.01 }}
            >
              <span className="dia-semana">{diasSemana[data.getDay()]}</span>
              <span className="dia-numero">{data.getDate()}</span>
              {visitasCount > 0 && <div className="visitas-badge">{visitasCount}</div>}
              {selecionado && <motion.div className="selecao-indicador" layoutId="selecao" />}
            </motion.div>
          );
        })}
      </div>

      {/* Agenda do dia */}
      <div className="agenda-dia">
        <div className="agenda-header">
          <h5>
            <FiCalendar size={16} />
            {dataSelecionada.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </h5>
          <span className="visitas-count">
            {visitasDoDia.length} visita{visitasDoDia.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="agenda-lista">
          <AnimatePresence mode="popLayout">
            {visitasDoDia.length === 0 ? (
              <motion.div 
                className="agenda-vazia" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
              >
                <FiCalendar size={32} />
                <p>Nenhuma visita agendada</p>
                <button className="btn-link" onClick={() => setMostrarModal(true)}>Agendar agora</button>
              </motion.div>
            ) : (
              visitasDoDia.map((visita, index) => (
                <motion.div
                  key={visita.id}
                  className="visita-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <div className="visita-horario">
                    <FiClock size={14} />
                    {visita.horario}
                  </div>
                  <div className="visita-info">
                    <span className="visita-fazenda">
                      {fazendas.find((f) => f.fazenda_id === visita.fazendaId)?.fazenda_nome || "Fazenda"}
                    </span>
                    {visita.observacao && <span className="visita-obs">{visita.observacao}</span>}
                  </div>
                  <div className={`visita-status status-${visita.status}`}>
                    {visita.status === "agendada" ? "Agendada" : visita.status === "realizada" ? "Realizada" : "Cancelada"}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      <ModalAgendamentoRapido />
    </div>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function TecnicoHome() {
  const navigate = useNavigate();
  const { setFazendaAtualId, fazendaAtualId } = useFazenda();
  
  const [carregando, setCarregando] = useState(true);
  const [usuario, setUsuario] = useState(null);
  const [emailTecnico, setEmailTecnico] = useState("");
  const [acessos, setAcessos] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [expandedCard, setExpandedCard] = useState(null);
  const [visitas, setVisitas] = useState(MOCK_VISITAS);
  const [modalNotificar, setModalNotificar] = useState(false);
  const [modalAgendar, setModalAgendar] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState("propriedades");

  const carregarDados = useCallback(async (user) => {
    setCarregando(true);
    try {
      const perfil = await getEmailDoUsuario(user.id);
      const emailNorm = (perfil?.email ?? "").trim().toLowerCase();
      setEmailTecnico(emailNorm);

      const [convitesPendentes, { data: acessosData, error: acessosError }] = await Promise.all([
        emailNorm ? listarConvitesPendentesTecnico(emailNorm) : [],
        supabase
          .from("fazenda_acessos")
          .select("id, fazenda_id, created_at, status, fazendas (id, nome, owner_user_id)")
          .eq("user_id", user.id)
          .eq("status", "ATIVO")
          .order("created_at", { ascending: false })
      ]);

      if (acessosError) throw acessosError;

      const fazendaIds = [...new Set([
        ...convitesPendentes.map((c) => c.fazenda_id),
        ...(acessosData ?? []).map((a) => a.fazenda_id),
      ])].filter(Boolean);

      let fazendasMap = new Map();
      if (fazendaIds.length > 0) {
        const { data: fazendasData, error: fazendasError } = await supabase
          .from("fazendas")
          .select("id, nome, owner_user_id")
          .in("id", fazendaIds);

        if (fazendasError) throw fazendasError;
        fazendasMap = new Map((fazendasData ?? []).map((f) => [f.id, f]));
      }

      setUsuario(user);
      setAcessos((acessosData ?? []).map((a) => ({
        ...a,
        fazenda_nome: a.fazendas?.nome ?? fazendasMap.get(a.fazenda_id)?.nome ?? null,
      })));
    } catch (err) {
      toast.error(err.message || "Erro ao carregar dados");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!user || !isMounted) return;
        await carregarDados(user);
      } catch (err) {
        toast.error("Erro ao autenticar");
      }
    }
    init();
    return () => { isMounted = false; };
  }, [carregarDados]);

  const handleAcessarFazenda = (fazendaId) => {
    setFazendaAtualId(fazendaId);
    navigate("/inicio", { replace: true });
  };

  const handleAgendarVisita = (novaVisita) => {
    setVisitas([...visitas, novaVisita]);
    toast.success("Visita agendada! O produtor foi notificado.");
  };

  if (carregando) {
    return (
      <div className="tecnico-loading">
        <motion.div 
          className="spinner" 
          animate={{ rotate: 360 }} 
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }} 
        />
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="tecnico-container">
      {/* Header */}
      <motion.header 
        className="tecnico-header" 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="header-info">
          <motion.div 
            className="header-avatar" 
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            👨‍🌾
          </motion.div>
          <div>
            <h1>Dashboard Técnico</h1>
            <p>{emailTecnico} • {acessos.length} propriedade{acessos.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="view-toggle">
            <button 
              className={abaAtiva === "propriedades" ? "active" : ""} 
              onClick={() => setAbaAtiva("propriedades")}
            >
              <FiGrid size={16} /> Propriedades
            </button>
            <button 
              className={abaAtiva === "calendario" ? "active" : ""} 
              onClick={() => setAbaAtiva("calendario")}
            >
              <FiCalendar size={16} /> Calendário
            </button>
          </div>
        </div>
      </motion.header>

      {/* Estatísticas */}
      <DashboardStats fazendas={acessos} dadosFazendas={MOCK_DADOS_FAZENDAS} />

      {/* Conteúdo principal */}
      <AnimatePresence mode="wait">
        {abaAtiva === "propriedades" ? (
          <motion.section
            key="propriedades"
            className="propriedades-section"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="section-header">
              <h3>Propriedades Gerenciadas</h3>
              {expandedCard && (
                <motion.button 
                  className="btn-voltar" 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }} 
                  onClick={() => setExpandedCard(null)}
                >
                  <FiArrowRight size={16} style={{ transform: "rotate(180deg)" }} /> Voltar
                </motion.button>
              )}
            </div>

            <div className={`properties-container ${viewMode} ${expandedCard ? "expanded-view" : ""}`}>
              {acessos.map((acesso) => {
                const isExpanded = expandedCard === acesso.id;
                const dados = MOCK_DADOS_FAZENDAS[acesso.fazenda_id] || {};
                
                if (isExpanded) {
                  return (
                    <PropertyCardExpanded
                      key={acesso.id}
                      acesso={acesso}
                      dados={dados}
                      isActive={acesso.fazenda_id === fazendaAtualId}
                      onMinimize={() => setExpandedCard(null)}
                      onAccess={handleAcessarFazenda}
                      onNotificar={() => setModalNotificar(true)}
                    />
                  );
                }
                
                return (
                  <PropertyCardCompact
                    key={acesso.id}
                    acesso={acesso}
                    dados={dados}
                    isActive={acesso.fazenda_id === fazendaAtualId}
                    onExpand={() => setExpandedCard(acesso.id)}
                    onAccess={handleAcessarFazenda}
                  />
                );
              })}
            </div>
          </motion.section>
        ) : (
          <motion.section
            key="calendario"
            className="calendario-section"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <CalendarioAgenda 
              visitas={visitas} 
              onAgendar={handleAgendarVisita} 
              fazendas={acessos} 
            />
          </motion.section>
        )}
      </AnimatePresence>

      <NotificarModal 
        isOpen={modalNotificar} 
        onClose={() => setModalNotificar(false)} 
        fazendas={acessos}
      />
      
      <AgendarVisitaModal 
        isOpen={modalAgendar} 
        onClose={() => setModalAgendar(false)}
        fazendas={acessos}
        visitasExistentes={visitas}
        onAgendar={handleAgendarVisita}
      />
    </div>
  );
}