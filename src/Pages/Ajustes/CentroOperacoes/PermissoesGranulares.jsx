// src/Pages/Ajustes/CentroOperacoes/PermissoesGranulares.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Eye, EyeOff, Check, X } from "lucide-react";

const MODULOS = [
  { id: "animais", label: "Cadastro de Animais", icon: "🐄" },
  { id: "reproducao", label: "Reprodução", icon: "🧬" },
  { id: "saude", label: "Sanidade", icon: "💉" },
  { id: "financeiro", label: "Financeiro", icon: "💰" },
  { id: "relatorios", label: "Relatórios", icon: "📊" },
  { id: "configuracoes", label: "Configurações", icon: "⚙️" },
];

const PERMISSOES = [
  { id: "visualizar", label: "Visualizar", desc: "Apenas leitura dos dados" },
  { id: "editar", label: "Editar", desc: "Criar e modificar registros" },
  { id: "excluir", label: "Excluir", desc: "Remover permanentemente" },
  { id: "exportar", label: "Exportar", desc: "Download de dados" },
];

export default function PermissoesGranulares({ membros }) {
  const [membroSelecionado, setMembroSelecionado] = useState(null);
  const [permissoes, setPermissoes] = useState({});

  const togglePermissao = (modulo, permissao) => {
    const key = `${modulo}_${permissao}`;
    setPermissoes((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
          Controle de Permissões
        </h3>
        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
          Defina o que cada profissional pode acessar e modificar no sistema
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24 }}>
        {/* Lista de Membros */}
        <div style={{ 
          background: "#ffffff", 
          borderRadius: 16, 
          border: "1px solid #e2e8f0",
          padding: 16,
        }}>
          <h4 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#374151" }}>
            Selecionar Profissional
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {membros?.filter(m => m.status === "ATIVO").map((membro) => (
              <button
                key={membro.id}
                onClick={() => setMembroSelecionado(membro)}
                style={{
                  padding: 12,
                  borderRadius: 10,
                  border: "1px solid",
                  borderColor: membroSelecionado?.id === membro.id ? "#3b82f6" : "#e2e8f0",
                  background: membroSelecionado?.id === membro.id ? "#eff6ff" : "#ffffff",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>
                  {membro.profiles?.full_name || membro.nome_profissional}
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  {membro.tipo_profissional}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Matriz de Permissões */}
        {membroSelecionado ? (
          <div style={{ background: "#ffffff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24 }}>
            <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid #e2e8f0" }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                Configurando: {membroSelecionado.profiles?.full_name}
              </h4>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {MODULOS.map((modulo) => (
                <div key={modulo.id} style={{ 
                  padding: 16, 
                  background: "#f8fafc", 
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 20 }}>{modulo.icon}</span>
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>{modulo.label}</span>
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                    {PERMISSOES.map((perm) => {
                      const ativo = permissoes[`${modulo.id}_${perm.id}`];
                      return (
                        <button
                          key={perm.id}
                          onClick={() => togglePermissao(modulo.id, perm.id)}
                          style={{
                            padding: "10px",
                            borderRadius: 8,
                            border: `2px solid ${ativo ? "#10b981" : "#e2e8f0"}`,
                            background: ativo ? "#d1fae5" : "#ffffff",
                            cursor: "pointer",
                            textAlign: "center",
                          }}
                        >
                          <div style={{ 
                            fontWeight: 700, 
                            fontSize: 13, 
                            color: ativo ? "#065f46" : "#374151",
                            marginBottom: 4,
                          }}>
                            {ativo ? <Check size={14} style={{ display: "inline" }} /> : <X size={14} style={{ display: "inline" }} />} {perm.label}
                          </div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>
                            {perm.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
              <button
                style={{
                  padding: "10px 24px",
                  background: "#0f172a",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 10,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Salvar Permissões
              </button>
            </div>
          </div>
        ) : (
          <div style={{ 
            background: "#ffffff", 
            borderRadius: 16, 
            border: "1px solid #e2e8f0", 
            padding: 48,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#94a3b8",
          }}>
            <Shield size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
            <p>Selecione um profissional para configurar permissões</p>
          </div>
        )}
      </div>
    </div>
  );
}