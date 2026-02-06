import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import StatusConexao from "../components/StatusConexao";
import { useFazenda } from "../context/FazendaContext";

const ABAS_BASE = [
  { id: "inicio",     label: "Início",            icon: "🏠" },
  { id: "animais",    label: "Animais",           icon: "🐄" },
  { id: "bezerras",   label: "Bezerras",          icon: "🐮" },
  { id: "reproducao", label: "Reprodução",        icon: "🧬" },
  { id: "leite",      label: "Leite",             icon: "🥛" },
  { id: "saude",      label: "Saúde",             icon: "💉" },
  { id: "consumo",    label: "Consumo",           icon: "📦" },
  { id: "financeiro", label: "Financeiro",        icon: "💰" },
  { id: "calendario", label: "Calendário",        icon: "📅" },
  { id: "ajustes",    label: "Ajustes",           icon: "⚙️" },
];

const ABAS_TECNICO = [{ id: "tecnico", label: "Fazendas", icon: "🏘️" }];

function useAbaAtiva(pathname, abas) {
  const seg = pathname.split("/")[1] || abas[0]?.id || "inicio";
  return abas.some((a) => a.id === seg) ? seg : abas[0]?.id || "inicio";
}

export default function NavegacaoPrincipal() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { fazendaAtualId, clearFazendaAtualId, tipoConta, ready } = useFazenda();
  const consultorStorageKeys = [
    "modo",
    "consultorSession",
    "currentFarmId",
    "smartcow:currentFarmId",
  ];

  if (!ready) return null;

  const tipoContaAtual = tipoConta ? String(tipoConta).trim().toUpperCase() : null;
  if (!tipoContaAtual) return null;

  const isAssistenteTecnico = tipoContaAtual === "ASSISTENTE_TECNICO";
  const abas = isAssistenteTecnico ? ABAS_TECNICO : ABAS_BASE;
  const abaAtiva = useAbaAtiva(pathname, abas);

  // Cores do sistema (consistente com as outras páginas)
  const colors = {
    bg: "#0f172a",           // slate-900 (mais suave que o navy anterior)
    bgHover: "#1e293b",      // slate-800
    text: "#f8fafc",         // slate-50
    textMuted: "#94a3b8",    // slate-400
    accent: "#3b82f6",       // blue-500 (para combinar com o sistema)
    accentHover: "#2563eb",  // blue-600
    border: "rgba(148, 163, 184, 0.1)"
  };

  const limparDadosConsultor = () => {
    clearFazendaAtualId();
    if (typeof localStorage !== "undefined") {
      consultorStorageKeys.forEach((key) => localStorage.removeItem(key));
    }
  };

  return (
    <header
      style={{
        width: "100%",
        position: "sticky",
        top: 0,
        zIndex: 50,
        backgroundColor: colors.bg,
        borderBottom: `1px solid ${colors.border}`,
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
          padding: "12px 24px",
          maxWidth: "1800px",
          margin: "0 auto",
        }}
      >
        {/* Logo e Contexto */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <StatusConexao />
            <span
              style={{
                color: colors.text,
                fontWeight: 800,
                fontSize: 18,
                letterSpacing: "-0.02em",
              }}
            >
              SmartCow
            </span>
          </div>

          {isAssistenteTecnico && fazendaAtualId && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 999,
                background: "rgba(59, 130, 246, 0.15)",
                color: "#60a5fa",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Modo Consultor
            </span>
          )}
        </div>

        {/* Navegação - Estilo Pill (igual às sub-abas do Consumo) */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            overflowX: "auto",
            flex: 1,
            padding: "4px",
            backgroundColor: "rgba(30, 41, 59, 0.5)", // slate-800 com transparência
            borderRadius: 12,
            border: `1px solid ${colors.border}`,
          }}
        >
          <style>{`nav::-webkit-scrollbar{height:0px;}`}</style>

          {abas.map((aba) => {
            const isAtiva = abaAtiva === aba.id;

            return (
              <button
                key={aba.id}
                type="button"
                onClick={() => navigate(`/${aba.id}`)}
                title={aba.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 10,
                  border: "none",
                  background: isAtiva ? "rgba(59, 130, 246, 0.2)" : "transparent",
                  color: isAtiva ? "#fff" : colors.textMuted,
                  fontWeight: isAtiva ? 700 : 600,
                  fontSize: 13,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (!isAtiva) {
                    e.currentTarget.style.background = "rgba(148, 163, 184, 0.1)";
                    e.currentTarget.style.color = colors.text;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isAtiva) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = colors.textMuted;
                  }
                }}
              >
                <span style={{ fontSize: 14, opacity: isAtiva ? 1 : 0.7 }}>{aba.icon}</span>
                <span>{aba.label}</span>
                
                {/* Indicador ativo (ponto) */}
                {isAtiva && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: 4,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      backgroundColor: colors.accent,
                    }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Botão Sair - Estilo Ghost */}
        <button
          onClick={async () => {
            if (isAssistenteTecnico) {
              if (fazendaAtualId) {
                limparDadosConsultor();
                navigate("/tecnico");
                return;
              }
              clearFazendaAtualId();
              await supabase.auth.signOut();
              if (typeof localStorage !== "undefined") localStorage.clear();
              if (typeof sessionStorage !== "undefined") sessionStorage.clear();
              navigate("/login");
              return;
            }
            await supabase.auth.signOut();
            if (typeof localStorage !== "undefined") localStorage.clear();
            if (typeof sessionStorage !== "undefined") sessionStorage.clear();
            navigate("/login");
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            borderRadius: 10,
            background: "transparent",
            border: `1px solid ${colors.border}`,
            color: colors.textMuted,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 13,
            transition: "all 0.2s ease",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
            e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
            e.currentTarget.style.color = "#fca5a5";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = colors.border;
            e.currentTarget.style.color = colors.textMuted;
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Sair</span>
        </button>
      </div>
    </header>
  );
}