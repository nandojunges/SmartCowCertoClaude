// src/Pages/Reproducao/SidebarConfig/SidebarConfig.jsx
import React from "react";

/**
 * SidebarConfig (NAV apenas)
 * - NÃO renderiza conteúdo (isso é responsabilidade do Reproducao.jsx)
 * - Só dispara onChangeAba("tabela" | "protocolos" | "inseminador")
 *
 * Assim você sempre consegue voltar pra TABELA principal (aba "tabela"),
 * que é criada dentro do arquivo pai Reproducao.jsx.
 */

// =========================
//   CONSTANTES DE LAYOUT
// =========================
const LARGURA_BARRA = 80;
const TOP_OFFSET = 72; // altura real do teu TopBar (igual Animais)
const TAMANHO_ICONE = 22;

// Paleta igual Animais
const NAVY = "#0B1F3A";
const NAVY_2 = "#0A1A33";
const ACCENT = "#19B6A4";
const TXT = "rgba(255,255,255,0.86)";
const MUTED = "rgba(255,255,255,0.62)";

// ✅ inclui a aba principal (tabela)
const ITENS_PADRAO = [
  { id: "tabela", label: "Tabela", icon: "📋" },
  { id: "protocolos", label: "Protocolos", icon: "💉" },
  { id: "inseminador", label: "Inseminador", icon: "👨‍🌾" },
];

export default function SidebarConfig({
  abaAtiva = "tabela",
  onChangeAba,
  topOffset = TOP_OFFSET,
  larguraBarra = LARGURA_BARRA,
  itens = ITENS_PADRAO,
}) {
  return (
    <aside
      style={{
        position: "fixed",
        left: 0,
        top: topOffset,
        bottom: 0,
        width: `${larguraBarra}px`,
        background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY_2} 100%)`,
        borderRight: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 20,
        paddingBottom: 20,
        gap: 14,
        zIndex: 20,
      }}
    >
      {itens.map((btn) => {
        const ativo = abaAtiva === btn.id;

        return (
          <button
            key={btn.id}
            type="button"
            onClick={() => onChangeAba?.(btn.id)}
            title={btn.label}
            style={{
              width: 56,
              height: 46,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.10)",
              background: ativo
                ? "rgba(255,255,255,0.08)"
                : "rgba(255,255,255,0.03)",
              color: ativo ? TXT : MUTED,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              position: "relative",
              transition:
                "background 0.12s ease, transform 0.12s ease, border-color 0.12s ease",
              boxShadow: ativo ? "0 10px 18px rgba(0,0,0,0.22)" : "none",
              outline: "none",
            }}
            onMouseEnter={(e) => {
              if (!ativo) {
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)";
              }
            }}
            onMouseLeave={(e) => {
              if (!ativo) {
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                e.currentTarget.style.transform = "translateY(0px)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)";
              }
            }}
          >
            {/* Indicador ativo (barra teal à esquerda) */}
            {ativo && (
              <span
                style={{
                  position: "absolute",
                  left: 6,
                  top: 10,
                  bottom: 10,
                  width: 4,
                  borderRadius: 999,
                  background: ACCENT,
                  boxShadow: "0 0 0 4px rgba(25,182,164,0.12)",
                }}
              />
            )}

            {/* “ícone” (emoji) */}
            <span
              style={{
                fontSize: TAMANHO_ICONE,
                lineHeight: 1,
                filter: ativo ? "none" : "saturate(0.85)",
              }}
            >
              {btn.icon}
            </span>
          </button>
        );
      })}
    </aside>
  );
}
