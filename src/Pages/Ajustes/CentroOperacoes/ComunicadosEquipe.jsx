// src/Pages/Ajustes/CentroOperacoes/ComunicadosEquipe.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, Plus, Pin, Trash2, AlertCircle, Info } from "lucide-react";

const COMUNICADOS_MOCK = [
  { id: 1, titulo: "Manutenção programada", mensagem: "O sistema ficará indisponível no sábado das 2h às 4h para atualizações.", tipo: "aviso", fixado: true, data: "2024-01-15", autor: "Admin" },
  { id: 2, titulo: "Novo protocolo de vacinação", mensagem: "A partir de fevereiro, adotaremos o novo calendário sanitário. Consultem a aba Saúde.", tipo: "info", fixado: false, data: "2024-01-14", autor: "Dra. Ana" },
];

const TIPO_CONFIG = {
  urgente: { icon: AlertCircle, color: "#dc2626", bg: "#fee2e2" },
  aviso: { icon: Megaphone, color: "#d97706", bg: "#fef3c7" },
  info: { icon: Info, color: "#2563eb", bg: "#dbeafe" },
};

export default function ComunicadosEquipe({ membros }) {
  const [comunicados, setComunicados] = useState(COMUNICADOS_MOCK);
  const [showForm, setShowForm] = useState(false);
  const [novoComunicado, setNovoComunicado] = useState({
    titulo: "",
    mensagem: "",
    tipo: "info",
    fixado: false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const comunicado = {
      id: Date.now(),
      ...novoComunicado,
      data: new Date().toISOString().split("T")[0],
      autor: "Você",
    };
    setComunicados([comunicado, ...comunicados]);
    setShowForm(false);
    setNovoComunicado({ titulo: "", mensagem: "", tipo: "info", fixado: false });
  };

  const handleDelete = (id) => {
    setComunicados(comunicados.filter((c) => c.id !== id));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
            Comunicados Internos
          </h3>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
            Avisos e informações para toda a equipe técnica
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
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
          <Plus size={18} /> Novo Comunicado
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <AnimatePresence>
          {comunicados.map((com) => {
            const config = TIPO_CONFIG[com.tipo];
            const Icon = config.icon;
            
            return (
              <motion.div
                key={com.id}
                layout
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  background: "#ffffff",
                  borderRadius: 16,
                  padding: 24,
                  border: "1px solid #e2e8f0",
                  borderLeft: `4px solid ${config.color}`,
                  position: "relative",
                }}
              >
                {com.fixado && (
                  <div style={{ 
                    position: "absolute", 
                    top: 16, 
                    right: 48,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    color: "#64748b",
                    fontSize: 12,
                    fontWeight: 600,
                  }}>
                    <Pin size={14} /> Fixado
                  </div>
                )}
                
                <button
                  onClick={() => handleDelete(com.id)}
                  style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: 4,
                  }}
                >
                  <Trash2 size={16} />
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: config.bg,
                    color: config.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                      {com.titulo}
                    </h4>
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>
                      Por {com.autor} • {com.data}
                    </p>
                  </div>
                </div>
                
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                  {com.mensagem}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Modal Novo Comunicado */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: 20,
            }}
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              style={{
                background: "#ffffff",
                borderRadius: 20,
                padding: 32,
                width: "100%",
                maxWidth: 500,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ margin: "0 0 24px", fontSize: 20, fontWeight: 800 }}>Novo Comunicado</h3>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Título</label>
                  <input
                    type="text"
                    value={novoComunicado.titulo}
                    onChange={(e) => setNovoComunicado({ ...novoComunicado, titulo: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0" }}
                    required
                  />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Mensagem</label>
                  <textarea
                    value={novoComunicado.mensagem}
                    onChange={(e) => setNovoComunicado({ ...novoComunicado, mensagem: e.target.value })}
                    rows={4}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", resize: "vertical" }}
                    required
                  />
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Tipo</label>
                    <select
                      value={novoComunicado.tipo}
                      onChange={(e) => setNovoComunicado({ ...novoComunicado, tipo: e.target.value })}
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0" }}
                    >
                      <option value="info">Informativo</option>
                      <option value="aviso">Aviso</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 8 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={novoComunicado.fixado}
                        onChange={(e) => setNovoComunicado({ ...novoComunicado, fixado: e.target.checked })}
                      />
                      <span style={{ fontSize: 14 }}>Fixar no topo</span>
                    </label>
                  </div>
                </div>
                
                <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer" }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    style={{ flex: 2, padding: 10, borderRadius: 8, border: "none", background: "#0f172a", color: "#fff", fontWeight: 600, cursor: "pointer" }}
                  >
                    Publicar Comunicado
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