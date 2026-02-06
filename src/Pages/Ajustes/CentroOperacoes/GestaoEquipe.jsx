// src/Pages/Ajustes/CentroOperacoes/GestaoEquipe.jsx
import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Select from "react-select";
import { toast } from "react-toastify";
import { 
  Users, Plus, Mail, Shield, MoreVertical, 
  Phone, MapPin, Award, Calendar, Trash2, 
  Edit3, CheckCircle, XCircle, Clock 
} from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { useFazenda } from "../../../context/FazendaContext";
import { listAcessosDaFazenda } from "../../../lib/fazendaHelpers";
import { listarConvitesPendentesProdutor } from "../../../services/acessos";

const TIPOS_PROFISSIONAL = [
  { value: "Veterinário (Reprodução)", label: "🩺 Veterinário (Reprodução)", color: "#3b82f6" },
  { value: "Veterinário (Clínica)", label: "🩺 Veterinário (Clínico)", color: "#3b82f6" },
  { value: "Nutricionista", label: "🌾 Nutricionista", color: "#10b981" },
  { value: "Agrônomo", label: "🌱 Agrônomo", color: "#059669" },
  { value: "Técnico de Campo", label: "🔧 Técnico de Campo", color: "#f59e0b" },
  { value: "Consultor", label: "📊 Consultor", color: "#8b5cf6" },
  { value: "Zootecnista", label: "🐄 Zootecnista", color: "#ec4899" },
  { value: "Outro", label: "⚙️ Outro", color: "#64748b" },
];

const STATUS_COLORS = {
  ATIVO: { bg: "#d1fae5", text: "#065f46", label: "Ativo" },
  BLOQUEADO: { bg: "#fee2e2", text: "#991b1b", label: "Bloqueado" },
  PENDENTE: { bg: "#fef3c7", text: "#92400e", label: "Pendente" },
  REVOGADO: { bg: "#f3f4f6", text: "#374151", label: "Revogado" },
};

export default function GestaoEquipe({ dados, onUpdate }) {
  const { fazendaAtualId } = useFazenda();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [membros, setMembros] = useState([]);
  const [convites, setConvites] = useState([]);
  const [novoProfissional, setNovoProfissional] = useState({
    email: "",
    tipo: null,
    nome: "",
    telefone: "",
    registroProfissional: "", // CRMV, CRA, etc.
  });

  const carregarDados = useCallback(async () => {
    if (!fazendaAtualId) return;
    setLoading(true);
    
    try {
      const [acessosData, convitesData] = await Promise.all([
        listAcessosDaFazenda(fazendaAtualId),
        listarConvitesPendentesProdutor(fazendaAtualId),
      ]);
      
      setMembros(acessosData || []);
      setConvites(convitesData || []);
      onUpdate({ membros: acessosData || [], convites: convitesData || [] });
    } catch (error) {
      toast.error("Erro ao carregar equipe");
    } finally {
      setLoading(false);
    }
  }, [fazendaAtualId, onUpdate]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleConvidar = async (e) => {
    e.preventDefault();
    if (!novoProfissional.email || !novoProfissional.tipo) {
      toast.error("Preencha e-mail e tipo do profissional");
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from("convites_acesso")
        .upsert({
          fazenda_id: fazendaAtualId,
          email_convidado: novoProfissional.email.toLowerCase().trim(),
          status: "PENDENTE",
          tipo_profissional: novoProfissional.tipo.value,
          nome_profissional: novoProfissional.nome,
          telefone: novoProfissional.telefone,
          registro_profissional: novoProfissional.registroProfissional,
          created_at: new Date().toISOString(),
        }, { onConflict: "fazenda_id,email_convidado" });

      if (error) throw error;
      
      toast.success("Convite enviado com sucesso!");
      setShowModal(false);
      setNovoProfissional({
        email: "",
        tipo: null,
        nome: "",
        telefone: "",
        registroProfissional: "",
      });
      carregarDados();
    } catch (err) {
      toast.error(err.message || "Erro ao enviar convite");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (membro, novoStatus) => {
    try {
      const { error } = await supabase
        .from("fazenda_acessos")
        .update({ status: novoStatus })
        .eq("id", membro.id);

      if (error) throw error;
      
      toast.success(`Status atualizado para ${STATUS_COLORS[novoStatus]?.label || novoStatus}`);
      carregarDados();
    } catch (err) {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleRemover = async (membro) => {
    if (!confirm("Tem certeza que deseja revogar o acesso permanentemente?")) return;
    
    try {
      const { error } = await supabase
        .from("fazenda_acessos")
        .update({ status: "REVOGADO" })
        .eq("id", membro.id);

      if (error) throw error;
      toast.success("Acesso revogado");
      carregarDados();
    } catch (err) {
      toast.error("Erro ao revogar acesso");
    }
  };

  const handleCancelarConvite = async (convite) => {
    try {
      const { error } = await supabase
        .from("convites_acesso")
        .delete()
        .eq("id", convite.id);

      if (error) throw error;
      toast.success("Convite cancelado");
      carregarDados();
    } catch (err) {
      toast.error("Erro ao cancelar convite");
    }
  };

  return (
    <div>
      {/* Header da Seção */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: 24 
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
            Equipe Técnica
          </h3>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
            {membros.length} profissionais ativos • {convites.length} convites pendentes
          </p>
        </div>
        
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            background: "#0f172a",
            color: "#ffffff",
            border: "none",
            borderRadius: 10,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Plus size={18} />
          Convidar Profissional
        </button>
      </div>

      {/* Grid de Membros */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {/* Convites Pendentes */}
        {convites.map((convite) => (
          <motion.div
            key={convite.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: "#ffffff",
              borderRadius: 16,
              padding: 20,
              border: "2px dashed #fbbf24",
              position: "relative",
            }}
          >
            <div style={{ 
              position: "absolute", 
              top: 12, 
              right: 12,
              padding: "4px 10px",
              background: "#fef3c7",
              color: "#92400e",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}>
              <Clock size={12} /> Pendente
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
              <div style={{
                width: 50,
                height: 50,
                borderRadius: "50%",
                background: "#f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}>
                ✉️
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                  {convite.nome_profissional || "Aguardando aceite"}
                </h4>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>
                  {convite.email_convidado}
                </p>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              <span style={{
                padding: "4px 10px",
                background: "#eff6ff",
                color: "#1e40af",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
              }}>
                {convite.tipo_profissional}
              </span>
            </div>
            
            <button
              onClick={() => handleCancelarConvite(convite)}
              style={{
                width: "100%",
                padding: "8px",
                background: "#fee2e2",
                color: "#991b1b",
                border: "none",
                borderRadius: 8,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Cancelar Convite
            </button>
          </motion.div>
        ))}

        {/* Membros Ativos */}
        {membros.map((membro) => {
          const status = STATUS_COLORS[membro.status] || STATUS_COLORS.ATIVO;
          const tipoCor = TIPOS_PROFISSIONAL.find(t => t.value === membro.tipo_profissional)?.color || "#64748b";
          
          return (
            <motion.div
              key={membro.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                background: "#ffffff",
                borderRadius: 16,
                padding: 20,
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${tipoCor}20, ${tipoCor}40)`,
                    border: `2px solid ${tipoCor}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: tipoCor,
                    fontWeight: 700,
                    fontSize: 18,
                  }}>
                    {membro.profiles?.full_name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                      {membro.profiles?.full_name || membro.nome_profissional || "Sem nome"}
                    </h4>
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>
                      {membro.profiles?.email || "Email não disponível"}
                    </p>
                  </div>
                </div>
                
                <div style={{ position: "relative" }}>
                  <button
                    style={{
                      padding: "6px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "#94a3b8",
                    }}
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <div style={{ 
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  background: status.bg,
                  color: status.text,
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 8,
                }}>
                  {membro.status === "ATIVO" ? <CheckCircle size={12} /> : <XCircle size={12} />}
                  {status.label}
                </div>
                
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  <span style={{
                    padding: "4px 10px",
                    background: `${tipoCor}15`,
                    color: tipoCor,
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                  }}>
                    {membro.tipo_profissional}
                  </span>
                  {membro.registro_profissional && (
                    <span style={{
                      padding: "4px 10px",
                      background: "#f3f4f6",
                      color: "#374151",
                      borderRadius: 20,
                      fontSize: 12,
                    }}>
                      <Award size={12} style={{ display: "inline", marginRight: 4 }} />
                      {membro.registro_profissional}
                    </span>
                  )}
                </div>
              </div>
              
              <div style={{ display: "flex", gap: 8 }}>
                {membro.status === "ATIVO" ? (
                  <>
                    <button
                      onClick={() => handleStatusChange(membro, "BLOQUEADO")}
                      style={{
                        flex: 1,
                        padding: "8px",
                        background: "#f1f5f9",
                        color: "#475569",
                        border: "none",
                        borderRadius: 8,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      Bloquear
                    </button>
                    <button
                      onClick={() => handleRemover(membro)}
                      style={{
                        padding: "8px 12px",
                        background: "#fee2e2",
                        color: "#dc2626",
                        border: "none",
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleStatusChange(membro, "ATIVO")}
                    style={{
                      flex: 1,
                      padding: "8px",
                      background: "#d1fae5",
                      color: "#065f46",
                      border: "none",
                      borderRadius: 8,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    Reativar Acesso
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modal de Convite */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: 20,
            }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                background: "#ffffff",
                borderRadius: 20,
                padding: 32,
                width: "100%",
                maxWidth: 500,
                maxHeight: "90vh",
                overflow: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
                Convidar Profissional
              </h3>
              <p style={{ margin: "0 0 24px", color: "#64748b", fontSize: 14 }}>
                Preencha os dados do novo membro da equipe técnica.
              </p>
              
              <form onSubmit={handleConvidar} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#374151" }}>
                    E-mail profissional *
                  </label>
                  <input
                    type="email"
                    value={novoProfissional.email}
                    onChange={(e) => setNovoProfissional({ ...novoProfissional, email: e.target.value })}
                    placeholder="nome@clinica.com"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid #e2e8f0",
                      fontSize: 14,
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#374151" }}>
                    Especialidade *
                  </label>
                  <Select
                    options={TIPOS_PROFISSIONAL}
                    value={novoProfissional.tipo}
                    onChange={(selected) => setNovoProfissional({ ...novoProfissional, tipo: selected })}
                    placeholder="Selecione..."
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderRadius: 10,
                        minHeight: 42,
                        borderColor: "#e2e8f0",
                      }),
                    }}
                  />
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#374151" }}>
                      Nome/Apelido
                    </label>
                    <input
                      type="text"
                      value={novoProfissional.nome}
                      onChange={(e) => setNovoProfissional({ ...novoProfissional, nome: e.target.value })}
                      placeholder="Ex: Dra. Ana"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                        fontSize: 14,
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#374151" }}>
                      Registro (CRMV/CRA)
                    </label>
                    <input
                      type="text"
                      value={novoProfissional.registroProfissional}
                      onChange={(e) => setNovoProfissional({ ...novoProfissional, registroProfissional: e.target.value })}
                      placeholder="Ex: 12345"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                        fontSize: 14,
                      }}
                    />
                  </div>
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#374151" }}>
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={novoProfissional.telefone}
                    onChange={(e) => setNovoProfissional({ ...novoProfissional, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid #e2e8f0",
                      fontSize: 14,
                    }}
                  />
                </div>
                
                <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: 10,
                      border: "1px solid #e2e8f0",
                      background: "#ffffff",
                      color: "#475569",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !novoProfissional.email || !novoProfissional.tipo}
                    style={{
                      flex: 2,
                      padding: "10px",
                      borderRadius: 10,
                      border: "none",
                      background: loading ? "#cbd5e1" : "#0f172a",
                      color: "#ffffff",
                      fontWeight: 600,
                      cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    {loading ? "Enviando..." : "Enviar Convite"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}