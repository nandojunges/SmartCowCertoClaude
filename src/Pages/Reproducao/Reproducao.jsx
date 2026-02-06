// src/Pages/Reproducao/Reproducao.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useFazenda } from "../../context/FazendaContext";
import Manejo from "./Manejo/Manejo";
import SidebarConfig from "./SidebarConfig/SidebarConfig";
import Protocolos from "./Protocolos";
import Inseminador from "./Inseminador";

export default function Reproducao() {
  const { fazendaAtualId } = useFazenda();

  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [animalSelecionado, setAnimalSelecionado] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState("tabela");
  const [eventosRepro, setEventosRepro] = useState([]);
  const [carregandoEventos, setCarregandoEventos] = useState(false);
  const [aplicacoesAtivasMap, setAplicacoesAtivasMap] = useState({});
  const [bulkManejoOpen, setBulkManejoOpen] = useState(false);

  // =========================
  // Estilos (otimizado p/ caber + reduzir margens)
  // =========================
  const styles = {
    page: {
      position: "relative",
      minHeight: "100vh",
      backgroundColor: "#f8fafc",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    },

    // ✅ cola mais na lateral (ganha espaço real de tabela)
    content: {
      marginLeft: "96px",
      padding: "10px 12px 18px",
    },

    statusBar: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      justifyContent: "space-between",
      marginBottom: "10px",
      fontSize: "13px",
      color: "#64748b",
    },
    statusBarLeft: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      flexWrap: "wrap",
    },
    statusBarActions: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    bulkBtn: {
      padding: "6px 12px",
      borderRadius: "9999px",
      border: "1px solid #cbd5e1",
      backgroundColor: "#ffffff",
      color: "#0f172a",
      fontSize: "12.5px",
      fontWeight: 700,
      cursor: "pointer",
      transition: "all 0.2s ease",
      whiteSpace: "nowrap",
    },
    bulkBtnDisabled: {
      opacity: 0.5,
      cursor: "not-allowed",
    },

    card: {
      backgroundColor: "#ffffff",
      borderRadius: "16px",
      border: "1px solid #e2e8f0",
      boxShadow:
        "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
      overflow: "hidden",
    },

    tableContainer: {
      overflowX: "auto",
    },

    // ✅ table-layout fixed dá mais “controle” e evita estouro feio
    table: {
      width: "100%",
      borderCollapse: "separate",
      borderSpacing: 0,
      fontSize: "14px",
      tableLayout: "fixed",
      minWidth: 1100, // evita esmagar demais quando a tela é menor
    },

    // ✅ cabeçalho mais compacto
    th: {
      padding: "12px 12px",
      textAlign: "left",
      fontSize: "11px",
      fontWeight: 700,
      color: "#475569",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      borderBottom: "2px solid #e2e8f0",
      backgroundColor: "#f8fafc",
      whiteSpace: "nowrap",
    },

    // ✅ linhas mais compactas (ganha espaço vertical e horizontal)
    td: {
      padding: "12px 12px",
      borderBottom: "1px solid #f1f5f9",
      color: "#334155",
      fontSize: "14px",
      verticalAlign: "middle",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },

    tr: { transition: "background-color 0.15s ease" },

    // ✅ quadradinho número menor
    animalNum: {
      width: "32px",
      height: "32px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#fce7f3",
      color: "#be185d",
      borderRadius: "10px",
      fontWeight: 800,
      fontSize: "13px",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      flexShrink: 0,
    },

    animalCell: { display: "flex", alignItems: "center", gap: "10px" },

    animalInfo: {
      display: "flex",
      flexDirection: "column",
      gap: "1px",
      minWidth: 0,
    },

    // ✅ tira “#” e deixa só o número
    animalTitle: {
      fontWeight: 700,
      color: "#0f172a",
      fontSize: "14px",
      lineHeight: 1.1,
    },

    animalSub: {
      fontSize: "12.5px",
      color: "#64748b",
      lineHeight: 1.1,
    },

    badge: {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 9px",
      borderRadius: "9999px",
      fontSize: "12px",
      fontWeight: 700,
      lineHeight: 1,
      maxWidth: "100%",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },

    badgePink: { backgroundColor: "#fce7f3", color: "#be185d" },
    badgeBlue: { backgroundColor: "#dbeafe", color: "#1e40af" },
    badgeGreen: { backgroundColor: "#dcfce7", color: "#166534" },
    badgeYellow: { backgroundColor: "#fef3c7", color: "#92400e" },
    badgeGray: { backgroundColor: "#f1f5f9", color: "#64748b" },

    num: {
      fontFamily:
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      fontWeight: 700,
    },

    // ✅ botão mais compacto (pra caber sem estourar)
    actionBtn: {
      padding: "6px 10px",
      backgroundColor: "#ec4899",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      fontSize: "12.5px",
      fontWeight: 700,
      cursor: "pointer",
      transition: "all 0.2s",
      whiteSpace: "nowrap",
    },

    emptyState: {
      padding: "40px",
      textAlign: "center",
      color: "#64748b",
      fontSize: "14px",
      fontWeight: 600,
    },

    errorState: {
      padding: "40px",
      textAlign: "center",
      color: "#991b1b",
      fontSize: "14px",
      fontWeight: 600,
      backgroundColor: "#fef2f2",
    },

    loadingState: {
      padding: "40px",
      textAlign: "center",
      color: "#64748b",
      fontSize: "14px",
      fontWeight: 600,
    },

    delBadge: (del) => ({
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 10px",
      borderRadius: "9999px",
      fontSize: "12px",
      fontWeight: 800,
      fontFamily:
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      backgroundColor: del > 400 ? "#fee2e2" : del > 305 ? "#fef3c7" : "#dcfce7",
      color: del > 400 ? "#991b1b" : del > 305 ? "#92400e" : "#166534",
      minWidth: 44,
      justifyContent: "center",
    }),
  };

  // =========================
  // Helpers
  // =========================
  const formatarData = (valor) => {
    if (!valor) return "—";
    if (typeof valor === "string") {
      if (valor.includes("/")) return valor;
      const iso = valor.slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
        const [y, m, d] = iso.split("-");
        return `${d}/${m}/${y}`;
      }
      return valor;
    }
    return "—";
  };

  const formatarDataUtc = (data) => {
    if (!(data instanceof Date)) return "—";
    const y = data.getUTCFullYear();
    const m = String(data.getUTCMonth() + 1).padStart(2, "0");
    const d = String(data.getUTCDate()).padStart(2, "0");
    return `${d}/${m}/${y}`;
  };

  const parseYmdAsUtcDate = (valor) => {
    if (!valor) return null;
    if (valor instanceof Date) {
      return new Date(Date.UTC(valor.getFullYear(), valor.getMonth(), valor.getDate()));
    }
    if (typeof valor === "string") {
      const iso = valor.slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
      const [y, m, d] = iso.split("-").map(Number);
      return new Date(Date.UTC(y, m - 1, d));
    }
    return null;
  };

  const calcularPartoPrevisto = (ultimaIa) => {
    const base = parseYmdAsUtcDate(ultimaIa);
    if (!base) return "—";
    const previsto = new Date(base.getTime() + 280 * 86400000);
    return formatarDataUtc(previsto);
  };

  const obterValor = (registro, campos, fallback = "—") => {
    for (const campo of campos) {
      const valor = registro?.[campo];
      if (valor !== null && valor !== undefined && valor !== "") return valor;
    }
    return fallback;
  };

  const getAnimalId = (registro) =>
    registro?.animal_id ?? registro?.id ?? registro?.animalId ?? null;

  // =========================
  // Carregar tabela principal
  // =========================
  const carregarTabela = useCallback(async () => {
    if (!fazendaAtualId) {
      setRegistros([]);
      setErro("");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro("");

    try {
      const { data, error } = await supabase
        .from("v_repro_tabela")
        .select("*")
        .eq("fazenda_id", fazendaAtualId)
        .order("numero", { ascending: true });

      if (error) throw error;
      setRegistros(Array.isArray(data) ? data : []);
    } catch (err) {
      setErro(err?.message || "Erro ao carregar reprodução.");
      setRegistros([]);
    } finally {
      setCarregando(false);
    }
  }, [fazendaAtualId]);

  useEffect(() => {
    carregarTabela();
  }, [carregarTabela]);


  const carregarAplicacoesAtivas = useCallback(async () => {
    if (!fazendaAtualId) {
      setAplicacoesAtivasMap({});
      return;
    }

    const { data, error } = await supabase
      .from("repro_aplicacoes")
      .select("animal_id, tipo, status")
      .eq("fazenda_id", fazendaAtualId)
      .eq("status", "ATIVO");

    if (error) {
      console.error("Erro ao carregar aplicações ativas:", error);
      setAplicacoesAtivasMap({});
      return;
    }

    const map = (Array.isArray(data) ? data : []).reduce((acc, item) => {
      const animalId = item?.animal_id;
      if (!animalId || acc[String(animalId)]) return acc;
      const tipo = String(item?.tipo || "").toUpperCase();
      acc[String(animalId)] = tipo.includes("IATF") ? "EM IATF" : "EM PRÉ";
      return acc;
    }, {});

    setAplicacoesAtivasMap(map);
  }, [fazendaAtualId]);

  useEffect(() => {
    carregarAplicacoesAtivas();
  }, [carregarAplicacoesAtivas]);

  // =========================
  // Timeline eventos do manejo
  // =========================
  const fetchTimeline = useCallback(
    async (animalId) => {
      const { data, error } = await supabase
        .from("repro_eventos")
        .select("*")
        .eq("animal_id", animalId)
        .eq("fazenda_id", fazendaAtualId)
        .order("data_evento", { ascending: false });

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },
    [fazendaAtualId]
  );

  useEffect(() => {
    if (!animalSelecionado?.animalId || !fazendaAtualId) {
      setEventosRepro([]);
      setCarregandoEventos(false);
      return;
    }

    let ativo = true;
    setCarregandoEventos(true);

    (async () => {
      try {
        const data = await fetchTimeline(animalSelecionado.animalId);
        if (ativo) setEventosRepro(data);
      } catch {
        if (ativo) setEventosRepro([]);
      } finally {
        if (ativo) setCarregandoEventos(false);
      }
    })();

    return () => {
      ativo = false;
    };
  }, [animalSelecionado, fazendaAtualId, fetchTimeline]);

  // =========================
  // ESC fecha o manejo
  // =========================
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (animalSelecionado) setAnimalSelecionado(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [animalSelecionado]);

  // =========================
  // Linhas tabela
  // =========================
  const linhas = useMemo(() => {
    return (registros || []).map((r) => ({
      raw: r,
      animalId: getAnimalId(r),
      numero: obterValor(r, ["numero"]),
      brinco: obterValor(r, ["brinco"]),
      categoria: obterValor(r, ["categoria", "categoria_atual"]),
      idadeMeses: obterValor(r, ["idade_meses", "meses_idade"]),
      lactacoes: obterValor(r, ["numero_lactacoes", "lactacoes"], 0),
      statusRepro: aplicacoesAtivasMap[String(getAnimalId(r))]
        || obterValor(r, [
          "status_reprodutivo",
          "situacao_reprodutiva",
          "situacao_repr",
        ]),
      del: obterValor(r, ["del"]),
      ultimaIA: obterValor(r, ["ultima_ia"]),
      ias: obterValor(r, ["numero_ias_lactacao", "numero_ias"], 0),
      ultimoParto: obterValor(r, ["ultimo_parto"]),
      ultimaSecagem: obterValor(r, ["ultima_secagem"]),
      situacaoProd: obterValor(r, ["situacao_produtiva"]),
    }));
  }, [registros, aplicacoesAtivasMap]);

  const getStatusBadgeStyle = (status) => {
    const s = String(status).toLowerCase();
    if (s.includes("vazia")) return styles.badgeGray;
    if (s.includes("inseminada") || s.includes("prenha")) return styles.badgeBlue;
    if (s.includes("parto") || s.includes("pev")) return styles.badgePink;
    if (s.includes("lact")) return styles.badgeGreen;
    return styles.badgeBlue;
  };

  // =========================
  // Render tabela (✅ removi coluna BRINCO)
  // =========================
  const TabelaModerna = (
    <div style={styles.card}>
      <div style={styles.tableContainer}>
        <table style={styles.table} className="repro-table">
          <colgroup><col style={{ width: 170 }} /><col style={{ width: 110 }} /><col style={{ width: 80 }} /><col style={{ width: 90 }} /><col style={{ width: 160 }} /><col style={{ width: 110 }} /><col style={{ width: 130 }} /><col style={{ width: 70 }} /><col style={{ width: 140 }} /><col style={{ width: 120 }} /><col style={{ width: 70 }} /><col style={{ width: 90 }} /></colgroup>

          <thead>
            <tr>
              <th style={styles.th}>Animal</th>
              <th style={styles.th}>Categoria</th>
              <th style={{ ...styles.th, textAlign: "center" }}>Idade</th>
              <th style={{ ...styles.th, textAlign: "center" }}>Lactações</th>
              <th style={styles.th}>Situação Repro.</th>
              <th style={styles.th}>Última IA</th>
              <th style={styles.th}>Parto Previsto</th>
              <th style={{ ...styles.th, textAlign: "center" }}>IAs</th>
              <th style={styles.th}>Situação Prod.</th>
              <th style={styles.th}>Último Parto</th>
              <th style={{ ...styles.th, textAlign: "center" }}>DEL</th>
              <th style={{ ...styles.th, textAlign: "center" }}>Ações</th>
            </tr>
          </thead>

          <tbody>
            {!fazendaAtualId ? (
              <tr>
                <td colSpan={12} style={styles.emptyState}>
                  Selecione uma fazenda para visualizar os registros
                </td>
              </tr>
            ) : carregando ? (
              <tr>
                <td colSpan={12} style={styles.loadingState}>
                  Carregando registros...
                </td>
              </tr>
            ) : erro ? (
              <tr>
                <td colSpan={12} style={styles.errorState}>
                  <div style={{ fontWeight: 800, marginBottom: 6 }}>Erro ao carregar dados</div>
                  <div style={{ fontSize: 13 }}>{erro}</div>
                </td>
              </tr>
            ) : linhas.length === 0 ? (
              <tr>
                <td colSpan={12} style={styles.emptyState}>
                  Nenhum registro encontrado para esta fazenda
                </td>
              </tr>
            ) : (
              linhas.map((linha, index) => (
                <tr key={linha.animalId ?? index} style={styles.tr}>
                  {/* ✅ Animal: número + brinco dentro (sem # e sem coluna extra) */}
                  <td style={styles.td}>
                    <div style={styles.animalCell}>
                      <div style={styles.animalNum}>{linha.numero}</div>
                      <div style={styles.animalInfo}>
                        <div style={styles.animalTitle}>{linha.numero}</div>
                        {linha.brinco && (
                          <div style={styles.animalSub}>Brinco {linha.brinco}</div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td style={styles.td}>
                    <span style={{ ...styles.badge, ...styles.badgeBlue }}>
                      {linha.categoria}
                    </span>
                  </td>

                  <td style={{ ...styles.td, textAlign: "center", ...styles.num }}>
                    {linha.idadeMeses}
                  </td>

                  <td style={{ ...styles.td, textAlign: "center", ...styles.num }}>
                    {linha.lactacoes}
                  </td>

                  {/* ✅ Situação Repro (nome padronizado) */}
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, ...getStatusBadgeStyle(linha.statusRepro) }}>
                      {linha.statusRepro}
                    </span>
                  </td>

                  <td style={styles.td}>{formatarData(linha.ultimaIA)}</td>

                  <td style={styles.td}>{calcularPartoPrevisto(linha.ultimaIA)}</td>

                  {/* ✅ IAs (sem “/lact”) */}
                  <td style={{ ...styles.td, textAlign: "center", ...styles.num }}>
                    {linha.ias}
                  </td>

                  {/* ✅ Situação Prod (nome padronizado) */}
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.badge,
                        ...(String(linha.situacaoProd).toLowerCase().includes("lact")
                          ? styles.badgeGreen
                          : styles.badgeYellow),
                      }}
                    >
                      {linha.situacaoProd}
                    </span>
                  </td>

                  <td style={styles.td}>{formatarData(linha.ultimoParto)}</td>

                  <td style={{ ...styles.td, textAlign: "center" }}>
                    <span style={styles.delBadge(Number(linha.del) || 0)}>
                      {linha.del || "—"}
                    </span>
                  </td>

                  <td style={{ ...styles.td, textAlign: "center" }}>
                    <button
                      type="button"
                      className="repro-action"
                      style={styles.actionBtn}
                      onClick={() => {
                        const animalDaLinha = {
                          ...(linha.raw || {}),
                          id: linha.raw?.id ?? linha.animalId ?? null,
                          animal_id: linha.raw?.animal_id ?? linha.animalId ?? null,
                          animalId: linha.animalId,
                          numero: linha.numero,
                          brinco: linha.brinco,
                        };
                        setAnimalSelecionado(animalDaLinha);
                      }}
                    >
                      Manejo
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const conteudoTabela = (
    <>
      <div style={styles.statusBar}>
        <div style={styles.statusBarLeft}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: carregando ? "#f59e0b" : "#22c55e",
              }}
            />
            <span>{carregando ? "Carregando..." : `${linhas.length} animais`}</span>
          </div>
          <span style={{ color: "#cbd5e1" }}>•</span>
          <span>{fazendaAtualId ? "Dados atualizados" : "Selecione uma fazenda"}</span>
        </div>
        <div style={styles.statusBarActions}>
          <button
            type="button"
            style={{
              ...styles.bulkBtn,
              ...((!fazendaAtualId || linhas.length === 0) ? styles.bulkBtnDisabled : null),
            }}
            onClick={() => {
              if (!fazendaAtualId || linhas.length === 0) return;
              setBulkManejoOpen(true);
            }}
            onMouseEnter={(e) => {
              if (!fazendaAtualId || linhas.length === 0) return;
              e.currentTarget.style.background = "#f8fafc";
              e.currentTarget.style.borderColor = "#94a3b8";
            }}
            onMouseLeave={(e) => {
              if (!fazendaAtualId || linhas.length === 0) return;
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.borderColor = "#cbd5e1";
            }}
          >
            + Ação Coletiva
          </button>
        </div>
      </div>

      {TabelaModerna}
    </>
  );

  // =========================
  // Hover CSS real
  // =========================
  useEffect(() => {
    const css = `
      .repro-table tbody tr:hover td { background: #f8fafc; }
      .repro-action:hover { background: #db2777 !important; transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    `;
    const id = "repro-css-hover";
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("style");
      el.id = id;
      el.innerText = css;
      document.head.appendChild(el);
    }
  }, []);

  return (
    <section style={styles.page}>
      <SidebarConfig abaAtiva={abaAtiva} onChangeAba={setAbaAtiva} />

      <div style={styles.content}>
        <div style={{ display: abaAtiva === "protocolos" ? "block" : "none" }}>
          <Protocolos />
        </div>
        <div style={{ display: abaAtiva === "inseminador" ? "block" : "none" }}>
          {fazendaAtualId ? (
            <Inseminador />
          ) : (
            <div style={styles.emptyState}>Selecione uma fazenda para visualizar os inseminadores.</div>
          )}
        </div>
        <div style={{ display: abaAtiva === "tabela" ? "block" : "none" }}>{conteudoTabela}</div>
      </div>

      <Manejo
        open={!!animalSelecionado || bulkManejoOpen}
        animal={animalSelecionado}
        bulkMode={bulkManejoOpen}
        bulkAnimals={linhas.map((linha) => ({
          ...(linha.raw || {}),
          id: linha.raw?.id ?? linha.animalId ?? null,
          animal_id: linha.raw?.animal_id ?? linha.animalId ?? null,
          animalId: linha.animalId,
          numero: linha.numero,
          brinco: linha.brinco,
        }))}
        eventosRepro={eventosRepro}
        carregandoEventos={carregandoEventos}
        onClose={() => {
          setAnimalSelecionado(null);
          setBulkManejoOpen(false);
        }}
        onSaved={async () => {
          await carregarTabela();
          await carregarAplicacoesAtivas();
          if (animalSelecionado?.animalId) {
            setCarregandoEventos(true);
            try {
              const data = await fetchTimeline(animalSelecionado.animalId);
              setEventosRepro(data);
            } finally {
              setCarregandoEventos(false);
            }
          }
        }}
      />
    </section>
  );
}
