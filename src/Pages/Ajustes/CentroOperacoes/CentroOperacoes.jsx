// src/Pages/Ajustes/CentroOperacoes/index.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Shield, ClipboardList, Megaphone, ChevronRight } from "lucide-react";
import GestaoEquipe from "./GestaoEquipe";
import PermissoesGranulares from "./PermissoesGranulares";
import LogsAuditoria from "./LogsAuditoria";
import ComunicadosEquipe from "./ComunicadosEquipe";

const ABAS = [
  { id: "equipe", label: "Gestão de Equipe", icon: Users, desc: "Cadastro e acesso de profissionais" },
  { id: "permissoes", label: "Permissões", icon: Shield, desc: "Controle de acesso por módulo" },
  { id: "logs", label: "Logs de Atividade", icon: ClipboardList, desc: "Auditoria e histórico" },
  { id: "comunicados", label: "Comunicados", icon: Megaphone, desc: "Avisos internos da equipe" },
];

export default function CentroOperacoes() {
  const [abaAtiva, setAbaAtiva] = useState("equipe");
  const [dadosEquipe, setDadosEquipe] = useState({
    membros: [],
    convites: [],
  });

  const renderConteudo = () => {
    switch (abaAtiva) {
      case "equipe":
        return <GestaoEquipe dados={dadosEquipe} onUpdate={setDadosEquipe} />;
      case "permissoes":
        return <PermissoesGranulares membros={dadosEquipe.membros} />;
      case "logs":
        return <LogsAuditoria />;
      case "comunicados":
        return <ComunicadosEquipe membros={dadosEquipe.membros} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.4s ease-out" }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#0f172a" }}>
          Centro de Operações
        </h2>
        <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 16 }}>
          Gerenciamento completo da equipe técnica e segurança do sistema
        </p>
      </div>

      {/* Navegação em Cards */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(4, 1fr)", 
        gap: 16, 
        marginBottom: 32 
      }}>
        {ABAS.map((aba) => {
          const Icon = aba.icon;
          const isActive = abaAtiva === aba.id;
          
          return (
            <motion.button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: 20,
                borderRadius: 16,
                border: `2px solid ${isActive ? "#3b82f6" : "#e2e8f0"}`,
                background: isActive ? "#eff6ff" : "#ffffff",
                cursor: "pointer",
                textAlign: "left",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "flex-start",
                marginBottom: 12 
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: isActive ? "#3b82f6" : "#f1f5f9",
                  color: isActive ? "#ffffff" : "#64748b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Icon size={20} />
                </div>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#3b82f6",
                    }}
                  />
                )}
              </div>
              
              <h3 style={{ 
                margin: "0 0 4px", 
                fontSize: 15, 
                fontWeight: 700, 
                color: isActive ? "#1e40af" : "#0f172a" 
              }}>
                {aba.label}
              </h3>
              <p style={{ 
                margin: 0, 
                fontSize: 12, 
                color: "#64748b",
                lineHeight: 1.4 
              }}>
                {aba.desc}
              </p>
            </motion.button>
          );
        })}
      </div>

      {/* Conteúdo da Aba */}
      <AnimatePresence mode="wait">
        <motion.div
          key={abaAtiva}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderConteudo()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}