// src/Pages/Ajustes/Notificacoes/index.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, Mail, MessageCircle, Smartphone, Clock, 
  Calendar, AlertTriangle, CheckCircle, Zap, 
  ChevronDown, ChevronUp, Send, History, Settings2,
  Volume2, VolumeX, Filter
} from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { useFazenda } from "../../../context/FazendaContext";
import { toast } from "react-toastify";

// Componente Toggle Switch corrigido e reutilizável
const ToggleSwitch = ({ checked, onChange, disabled = false, size = "md" }) => {
  const sizes = {
    sm: { width: 36, height: 20, knob: 16, translate: 16 },
    md: { width: 48, height: 24, knob: 20, translate: 24 },
    lg: { width: 56, height: 28, knob: 24, translate: 32 },
  };
  
  const s = sizes[size];

  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={{
        width: s.width,
        height: s.height,
        borderRadius: s.height / 2,
        background: checked ? "#10b981" : "#e2e8f0",
        position: "relative",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        transition: "background-color 0.3s ease",
        padding: 0,
      }}
    >
      <motion.div
        initial={false}
        animate={{ x: checked ? s.translate : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        style={{
          width: s.knob,
          height: s.knob,
          borderRadius: "50%",
          background: "#ffffff",
          position: "absolute",
          top: (s.height - s.knob) / 2,
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
};

// Categorias de notificação
const CATEGORIAS = [
  {
    id: "reproducao",
    titulo: "Reprodução",
    icone: "🧬",
    cor: "#8b5cf6",
    itens: [
      { id: "cio_detectado", label: "Detecção de Cio", desc: "Alerta quando um cio for registrado", default: true },
      { id: "ia_confirmada", label: "Confirmação de IA", desc: "Notificação após inseminação", default: true },
      { id: "previsao_parto", label: "Previsão de Parto", desc: "Alerta 7 dias antes do parto previsto", default: true },
      { id: "parto_registrado", label: "Parto Registrado", desc: "Confirmação de nascimento", default: true },
      { id: "falha_ia", label: "Falha/Falta de IA", desc: "Alerta de repetição ou falha", default: false },
    ]
  },
  {
    id: "sanidade",
    titulo: "Sanidade",
    icone: "💉",
    cor: "#ef4444",
    itens: [
      { id: "vacina_proxima", label: "Vacinação Próxima", desc: "Lembrete 3 dias antes da vacina", default: true },
      { id: "tratamento_iniciado", label: "Tratamento Iniciado", desc: "Início de protocolo medicinal", default: true },
      { id: "doenca_notificada", label: "Doença Identificada", desc: "Notificação de diagnóstico", default: true },
      { id: "quarentena", label: "Entrada/Saída Quarentena", desc: "Movimentação de animais isolados", default: true },
    ]
  },
  {
    id: "manejo",
    titulo: "Manejo",
    icone: "🔧",
    cor: "#f59e0b",
    itens: [
      { id: "secagem_programada", label: "Secagem Programada", desc: "Alerta 10 dias antes da secagem", default: true },
      { id: "pesagem_programada", label: "Pesagem Programada", desc: "Lembrete de pesagem mensal", default: false },
      { id: "manejo_chuva", label: "Manejo em Clima Adverso", desc: "Alertas meteorológicos para manejo", default: false },
    ]
  },
  {
    id: "sistema",
    titulo: "Sistema",
    icone: "⚙️",
    cor: "#64748b",
    itens: [
      { id: "backup_realizado", label: "Backup Realizado", desc: "Confirmação de backup diário", default: false },
      { id: "novo_acesso", label: "Novo Acesso Detectado", desc: "Quando técnico fizer login", default: true },
      { id: "relatorio_gerado", label: "Relatório Gerado", desc: "Notificação quando PDF estiver pronto", default: true },
    ]
  }
];

const CANAIS = [
  { id: "email", label: "E-mail", icone: Mail, desc: "Receba em seu e-mail cadastrado", cor: "#3b82f6" },
  { id: "whatsapp", label: "WhatsApp", icone: MessageCircle, desc: "Mensagens direto no celular", cor: "#10b981" },
  { id: "push", label: "Notificação Push", icone: Bell, desc: "Alertas no navegador/app", cor: "#8b5cf6" },
];

export default function Notificacoes() {
  const { fazendaAtualId } = useFazenda();
  const [loading, setLoading] = useState(false);
  const [activeCanais, setActiveCanais] = useState({ email: true, whatsapp: true, push: false });
  const [configs, setConfigs] = useState({});
  const [categoriaExpandida, setCategoriaExpandida] = useState("reproducao");
  const [horarioSilencio, setHorarioSilencio] = useState({ inicio: "22:00", fim: "06:00", ativo: true });
  const [showTeste, setShowTeste] = useState(false);

  // Carregar configurações
  useEffect(() => {
    const loadConfig = async () => {
      if (!fazendaAtualId) return;
      
      const { data } = await supabase
        .from("fazenda_config")
        .select("notificacoes")
        .eq("fazenda_id", fazendaAtualId)
        .single();

      if (data?.notificacoes) {
        setConfigs(data.notificacoes.configs || {});
        setActiveCanais(data.notificacoes.canais || { email: true, whatsapp: true, push: false });
        setHorarioSilencio(data.notificacoes.horarioSilencio || { inicio: "22:00", fim: "06:00", ativo: true });
      } else {
        // Inicializar com defaults
        const defaults = {};
        CATEGORIAS.forEach(cat => {
          cat.itens.forEach(item => {
            defaults[item.id] = { email: item.default, whatsapp: item.default, push: false };
          });
        });
        setConfigs(defaults);
      }
    };
    
    loadConfig();
  }, [fazendaAtualId]);

  const toggleConfig = (itemId, canal) => {
    setConfigs(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [canal]: !prev[itemId]?.[canal]
      }
    }));
  };

  const toggleCategoriaCanal = (categoriaId, canal) => {
    const categoria = CATEGORIAS.find(c => c.id === categoriaId);
    const allEnabled = categoria.itens.every(item => configs[item.id]?.[canal]);
    
    const newConfigs = { ...configs };
    categoria.itens.forEach(item => {
      newConfigs[item.id] = { ...newConfigs[item.id], [canal]: !allEnabled };
    });
    setConfigs(newConfigs);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await supabase
        .from("fazenda_config")
        .upsert({
          fazenda_id: fazendaAtualId,
          notificacoes: {
            configs,
            canais: activeCanais,
            horarioSilencio,
            updated_at: new Date().toISOString()
          }
        });
      toast.success("Configurações salvas!");
    } catch (error) {
      toast.error("Erro ao salvar");
    } finally {
      setLoading(false);
    }
  };

  const enviarTeste = async (canal) => {
    toast.info(`Enviando notificação de teste via ${canal}...`);
    // Simulação de envio
    setTimeout(() => {
      toast.success(`Notificação de teste enviada via ${canal}!`);
    }, 1500);
  };

  return (
    <div style={{ animation: "fadeIn 0.4s ease-out" }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#0f172a" }}>
          Central de Notificações
        </h2>
        <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 16 }}>
          Configure alertas por evento zootécnico e canais de comunicação
        </p>
      </div>

      {/* Seleção de Canais */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(3, 1fr)", 
        gap: 16, 
        marginBottom: 32 
      }}>
        {CANAIS.map((canal) => {
          const Icon = canal.icone;
          const isActive = activeCanais[canal.id];
          
          return (
            <motion.div
              key={canal.id}
              whileHover={{ y: -2 }}
              style={{
                padding: 20,
                borderRadius: 16,
                background: isActive ? `${canal.cor}10` : "#f8fafc",
                border: `2px solid ${isActive ? canal.cor : "#e2e8f0"}`,
                position: "relative",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: isActive ? canal.cor : "#e2e8f0",
                  color: isActive ? "#fff" : "#94a3b8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Icon size={20} />
                </div>
                <ToggleSwitch 
                  checked={isActive} 
                  onChange={() => setActiveCanais({ ...activeCanais, [canal.id]: !isActive })}
                  size="sm"
                />
              </div>
              
              <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                {canal.label}
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>{canal.desc}</p>
              
              {isActive && (
                <button
                  onClick={() => enviarTeste(canal.id)}
                  style={{
                    marginTop: 12,
                    padding: "6px 12px",
                    background: "#fff",
                    border: `1px solid ${canal.cor}`,
                    color: canal.cor,
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Send size={12} /> Testar
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Configurações por Categoria */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
            Configurações por Evento
          </h3>
          
          {/* Horário de Silêncio */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 16px",
            background: "#f8fafc",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
          }}>
            <Clock size={18} color="#64748b" />
            <span style={{ fontSize: 14, color: "#475569" }}>Modo Não Perturbe:</span>
            <input
              type="time"
              value={horarioSilencio.inicio}
              onChange={(e) => setHorarioSilencio({ ...horarioSilencio, inicio: e.target.value })}
              style={{ border: "1px solid #e2e8f0", borderRadius: 6, padding: "4px 8px", fontSize: 13 }}
            />
            <span style={{ color: "#94a3b8" }}>até</span>
            <input
              type="time"
              value={horarioSilencio.fim}
              onChange={(e) => setHorarioSilencio({ ...horarioSilencio, fim: e.target.value })}
              style={{ border: "1px solid #e2e8f0", borderRadius: 6, padding: "4px 8px", fontSize: 13 }}
            />
            <ToggleSwitch 
              checked={horarioSilencio.ativo} 
              onChange={(v) => setHorarioSilencio({ ...horarioSilencio, ativo: v })}
              size="sm"
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {CATEGORIAS.map((categoria) => {
            const expandida = categoriaExpandida === categoria.id;
            const todosEmail = categoria.itens.every(i => configs[i.id]?.email);
            const todosWhats = categoria.itens.every(i => configs[i.id]?.whatsapp);
            
            return (
              <motion.div
                key={categoria.id}
                layout
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  border: "1px solid #e2e8f0",
                  overflow: "hidden",
                }}
              >
                {/* Header da Categoria */}
                <div
                  onClick={() => setCategoriaExpandida(expandida ? null : categoria.id)}
                  style={{
                    padding: "20px 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    background: expandida ? `${categoria.cor}05` : "#fff",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 24 }}>{categoria.icone}</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                        {categoria.titulo}
                      </h4>
                      <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>
                        {categoria.itens.filter(i => configs[i.id]?.email || configs[i.id]?.whatsapp).length} de {categoria.itens.length} ativos
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    {/* Toggle Master por Canal */}
                    {activeCanais.email && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCategoriaCanal(categoria.id, "email");
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 12px",
                          background: todosEmail ? "#d1fae5" : "#f1f5f9",
                          border: "none",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                          color: todosEmail ? "#065f46" : "#64748b",
                          cursor: "pointer",
                        }}
                      >
                        <Mail size={14} /> {todosEmail ? "E-mail On" : "E-mail Off"}
                      </button>
                    )}
                    
                    {activeCanais.whatsapp && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCategoriaCanal(categoria.id, "whatsapp");
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 12px",
                          background: todosWhats ? "#d1fae5" : "#f1f5f9",
                          border: "none",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                          color: todosWhats ? "#065f46" : "#64748b",
                          cursor: "pointer",
                        }}
                      >
                        <MessageCircle size={14} /> {todosWhats ? "Whats On" : "Whats Off"}
                      </button>
                    )}
                    
                    <motion.div
                      animate={{ rotate: expandida ? 180 : 0 }}
                      style={{ color: "#94a3b8" }}
                    >
                      <ChevronDown size={20} />
                    </motion.div>
                  </div>
                </div>

                {/* Itens da Categoria */}
                <AnimatePresence>
                  {expandida && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ borderTop: "1px solid #f1f5f9" }}
                    >
                      <div style={{ padding: "12px 24px" }}>
                        {categoria.itens.map((item) => (
                          <div
                            key={item.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "16px 0",
                              borderBottom: "1px solid #f8fafc",
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <h5 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                                {item.label}
                              </h5>
                              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
                                {item.desc}
                              </p>
                            </div>
                            
                            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                              {activeCanais.email && (
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <Mail size={16} color={configs[item.id]?.email ? categoria.cor : "#cbd5e1"} />
                                  <ToggleSwitch
                                    checked={!!configs[item.id]?.email}
                                    onChange={() => toggleConfig(item.id, "email")}
                                    size="sm"
                                  />
                                </div>
                              )}
                              
                              {activeCanais.whatsapp && (
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <MessageCircle size={16} color={configs[item.id]?.whatsapp ? "#10b981" : "#cbd5e1"} />
                                  <ToggleSwitch
                                    checked={!!configs[item.id]?.whatsapp}
                                    onChange={() => toggleConfig(item.id, "whatsapp")}
                                    size="sm"
                                  />
                                </div>
                              )}
                              
                              {activeCanais.push && (
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <Bell size={16} color={configs[item.id]?.push ? "#8b5cf6" : "#cbd5e1"} />
                                  <ToggleSwitch
                                    checked={!!configs[item.id]?.push}
                                    onChange={() => toggleConfig(item.id, "push")}
                                    size="sm"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Resumo e Ações */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 24,
        background: "#f8fafc",
        borderRadius: 16,
        border: "1px solid #e2e8f0",
      }}>
        <div>
          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
            Resumo das Configurações
          </h4>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748b" }}>
            {Object.values(configs).filter(c => c.email || c.whatsapp || c.push).length} notificações ativas
            {horarioSilencio.ativo && ` • Silêncio das ${horarioSilencio.inicio} às ${horarioSilencio.fim}`}
          </p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={loading}
          style={{
            padding: "12px 32px",
            background: loading ? "#cbd5e1" : "#0f172a",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {loading ? "Salvando..." : "Salvar Configurações"}
        </button>
      </div>
    </div>
  );
}