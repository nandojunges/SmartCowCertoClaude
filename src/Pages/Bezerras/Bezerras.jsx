// src/Pages/Bezerras/Bezerras.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  LayoutDashboard,
  Users,
  GitCompare,
  FileText,
  CalendarDays,
  X,
} from "lucide-react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";

// ✅ Importa as “subpáginas” (ajuste paths conforme tua estrutura real)
import Dashboard from "./pages/Dashboard";
import BezerraList from "./pages/BezerraList";
import BezerraDetail from "./pages/BezerraDetail";
import Comparativo from "./pages/Comparativo";
import Relatorios from "./pages/Relatorios";
import Calendario from "./pages/Calendario";

/**
 * ✅ CONTEXTO NO PADRÃO QUE TEUS ARQUIVOS ESTÃO IMPORTANDO:
 * Comparativo.jsx está fazendo: import { AppContext } from "../Bezerras";
 */
export const AppContext = React.createContext(null);

// (opcional) alias, se tu quiser usar internamente com outro nome
export const BezerrasContext = AppContext;

export default function Bezerras() {
  const location = useLocation();
  const navigate = useNavigate();

  // seleção para comparativo (até 4)
  const [selectedBezerras, setSelectedBezerras] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("bezerras_selected") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("bezerras_selected", JSON.stringify(selectedBezerras || []));
  }, [selectedBezerras]);

  const toggleBezerraSelection = useCallback((bezerra) => {
    setSelectedBezerras((prev) => {
      const arr = Array.isArray(prev) ? prev : [];
      const exists = arr.find((b) => b?.id === bezerra?.id);

      if (exists) return arr.filter((b) => b?.id !== bezerra?.id);
      if (arr.length >= 4) return arr;

      return [...arr, bezerra];
    });
  }, []);

  const limparSelecao = useCallback(() => setSelectedBezerras([]), []);

  const ctx = useMemo(
    () => ({
      selectedBezerras,
      toggleBezerraSelection,
      limparSelecao,
    }),
    [selectedBezerras, toggleBezerraSelection, limparSelecao]
  );

  // ======== Abas baseadas na URL =========
  // Ajuste se tua rota base não for /bezerras
  const path = location.pathname || "";
  const isComparativo = path.includes("/comparativo");
  const isRelatorios = path.includes("/relatorios");
  const isCalendario = path.includes("/calendario");
  const isDetalhe = /\/bezerras\/[^/]+$/.test(path); // /bezerras/:id
  const isLista = path.endsWith("/bezerras") || path.endsWith("/bezerras/") || isDetalhe;
  const isDashboard = path.includes("/dashboard");

  // Se tu quer que /bezerras abra a LISTA ou o DASHBOARD, define aqui:
  // - padrão: lista (mais coerente com teu BezerraList navegar p/ detalhes)
  const DEFAULT_ROUTE = "lista"; // "dashboard" | "lista"

  const go = (to) => {
    // navega relativo ao /bezerras (assumindo que esse componente está na rota /bezerras/*)
    navigate(to);
  };

  return (
    <AppContext.Provider value={ctx}>
      <div style={ui.wrap}>
        {/* Header */}
        <div style={ui.header}>
          <div>
            <div style={ui.kicker}>Bezerras • Cria e recria</div>
            <div style={ui.titleRow}>
              <h1 style={ui.title}>Bezerras</h1>
              {selectedBezerras?.length ? (
                <span style={ui.badge}>
                  {selectedBezerras.length} selecionada{selectedBezerras.length > 1 ? "s" : ""}
                </span>
              ) : null}
            </div>
          </div>

          {/* Box seleção comparativo */}
          {selectedBezerras?.length ? (
            <div style={ui.selectionBox}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div style={{ fontWeight: 900, color: "#0f172a" }}>Modo Comparação</div>
                <button onClick={limparSelecao} style={ui.iconBtn} title="Limpar seleção" type="button">
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                {selectedBezerras.slice(0, 4).map((b) => (
                  <div key={b?.id} style={ui.selectionItem}>
                    <span style={{ fontWeight: 900 }}>
                      {b?.brinco || b?.numero || "—"}
                    </span>
                    <span style={{ color: "#334155", fontWeight: 800 }}>
                      {b?.nome || ""}
                    </span>
                  </div>
                ))}
              </div>

              <button
                style={{
                  ...ui.primaryBtn,
                  ...(selectedBezerras.length < 2 ? ui.primaryBtnDisabled : null),
                }}
                onClick={() => go("comparativo")}
                disabled={selectedBezerras.length < 2}
                type="button"
                title={selectedBezerras.length < 2 ? "Selecione ao menos 2 bezerras" : "Ver comparativo"}
              >
                Ver Comparativo
              </button>
            </div>
          ) : null}
        </div>

        {/* Abas */}
        <div style={ui.tabs}>
          <Tab
            active={isDashboard}
            onClick={() => go("dashboard")}
            icon={LayoutDashboard}
            label="Dashboard"
          />
          <Tab
            active={isLista}
            onClick={() => go("")} // rota base -> lista (ver Routes abaixo)
            icon={Users}
            label="Bezerras"
          />
          <Tab
            active={isComparativo}
            onClick={() => go("comparativo")}
            icon={GitCompare}
            label="Comparativo"
            badge={selectedBezerras?.length ? selectedBezerras.length : null}
          />
          <Tab
            active={isRelatorios}
            onClick={() => go("relatorios")}
            icon={FileText}
            label="Relatórios"
          />
          <Tab
            active={isCalendario}
            onClick={() => go("calendario")}
            icon={CalendarDays}
            label="Calendário"
          />
        </div>

        {/* Conteúdo */}
        <div style={ui.contentCard}>
          <Routes>
            {/* padrão: /bezerras -> lista OU dashboard */}
            <Route
              index
              element={DEFAULT_ROUTE === "dashboard" ? <Navigate to="dashboard" replace /> : <BezerraList />}
            />

            <Route path="dashboard" element={<Dashboard />} />

            {/* detalhe: /bezerras/:id (BezerraDetail usa useParams e navigate) */}
            <Route path=":id" element={<BezerraDetail />} />

            <Route path="comparativo" element={<Comparativo />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="calendario" element={<Calendario />} />

            {/* fallback */}
            <Route path="*" element={<Navigate to="" replace />} />
          </Routes>
        </div>
      </div>
    </AppContext.Provider>
  );
}

/* ===================== UI ===================== */

function Tab({ active, onClick, icon: Icon, label, badge }) {
  return (
    <button
      onClick={onClick}
      type="button"
      style={{
        ...ui.tab,
        ...(active ? ui.tabActive : null),
      }}
    >
      <Icon size={18} />
      <span>{label}</span>
      {badge ? <span style={ui.badgeSmall}>{badge}</span> : null}
    </button>
  );
}

const ui = {
  wrap: {
    padding: "18px 18px 22px",
    fontFamily: "Poppins, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  kicker: {
    fontWeight: 900,
    color: "#64748b",
    fontSize: "0.88rem",
    marginBottom: 4,
  },
  titleRow: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  title: { margin: 0, fontWeight: 1100, fontSize: "1.6rem", color: "#0f172a" },

  tabs: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  tab: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "white",
    cursor: "pointer",
    fontWeight: 1000,
    color: "#0f172a",
    boxShadow: "0 1px 2px rgba(0,0,0,.04)",
  },
  tabActive: {
    border: "1px solid #93c5fd",
    background: "#eff6ff",
    color: "#1e3a8a",
  },

  contentCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    background: "white",
    padding: 14,
    boxShadow: "0 1px 2px rgba(0,0,0,.04)",
    minHeight: 420,
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid #cbd5e1",
    background: "#f1f5f9",
    color: "#0f172a",
    fontWeight: 1000,
    fontSize: "0.82rem",
    whiteSpace: "nowrap",
  },
  badgeSmall: {
    marginLeft: 6,
    padding: "2px 8px",
    borderRadius: 999,
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#991b1b",
    fontWeight: 1000,
    fontSize: "0.8rem",
  },

  selectionBox: {
    minWidth: 280,
    border: "1px solid #c7d2fe",
    background: "#eef2ff",
    borderRadius: 16,
    padding: 12,
  },
  selectionItem: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "8px 10px",
  },
  primaryBtn: {
    width: "100%",
    marginTop: 10,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(30,58,138,.25)",
    background: "#eff6ff",
    color: "#1e3a8a",
    fontWeight: 1100,
    cursor: "pointer",
  },
  primaryBtnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    background: "white",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
  },
};
