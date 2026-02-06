/**
 * CENTRO DE COMANDO - CONFIGURAÇÕES v3.0
 * Conceito: "Digital Farm Command Center"
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ✅ ABAS DEDICADAS (arquivos separados)
import CentroOperacoes from "./CentroOperacoes/CentroOperacoes";
import VisaoGeral from "./VisaoGeral/VisaoGeral";
import IdentidadeVisual from "./IdentidadeVisual/IdentidadeVisual";
import Notificacoes from "./Notificacoes/Notificacoes";

import { Bell, Database, Layout, LogOut, Users, Palette } from "lucide-react";
import { useFazenda } from "../../context/FazendaContext";

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function Ajustes() {
  const { fazendaAtualId } = useFazenda();
  const [abaAtiva, setAbaAtiva] = useState("geral");

  const menuItems = [
    { id: "geral", label: "Visão Geral", icon: Layout },
    { id: "marca", label: "Identidade Visual", icon: Palette },
    { id: "operacoes", label: "Centro de Operações", icon: Users },
    { id: "notificacoes", label: "Notificações", icon: Bell },
    { id: "dados", label: "Dados & Backup", icon: Database },
  ];

  const renderConteudo = () => {
    switch (abaAtiva) {
      case "geral":
        return <VisaoGeral fazendaAtualId={fazendaAtualId} />;

      case "marca":
        return <IdentidadeVisual fazendaAtualId={fazendaAtualId} />;

      case "operacoes":
        return <CentroOperacoes fazendaAtualId={fazendaAtualId} />;

      case "notificacoes":
        // ✅ agora é arquivo dedicado
        return <Notificacoes fazendaAtualId={fazendaAtualId} />;

      case "dados":
        return (
          <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
            <Database size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
            <h3>Exportação de Dados</h3>
            <p>Funcionalidade em desenvolvimento</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ display: "flex", height: "100vh" }}>
        {/* Sidebar */}
        <aside
          style={{
            width: 280,
            background: "#fff",
            borderRight: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: "column",
            padding: "24px 16px",
          }}
        >
          <div style={{ marginBottom: 32, padding: "0 12px" }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
              Configurações
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
              Gerencie sua operação
            </p>
          </div>

          <nav style={{ flex: 1 }}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = abaAtiva === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setAbaAtiva(item.id)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    marginBottom: 4,
                    borderRadius: 10,
                    border: "none",
                    background: isActive ? "#eff6ff" : "transparent",
                    color: isActive ? "#2563eb" : "#64748b",
                    fontWeight: isActive ? 600 : 500,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    textAlign: "left",
                    fontSize: 14,
                  }}
                >
                  <Icon size={20} />
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      style={{
                        marginLeft: "auto",
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "#2563eb",
                      }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div style={{ padding: "16px 12px", borderTop: "1px solid #e2e8f0" }}>
            <button
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px",
                borderRadius: 10,
                border: "none",
                background: "transparent",
                color: "#ef4444",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              <LogOut size={20} />
              Sair do Sistema
            </button>
          </div>
        </aside>

        {/* Conteúdo Principal */}
        <main style={{ flex: 1, overflow: "auto", padding: "32px 40px" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={abaAtiva}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderConteudo()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
