// src/pages/ConsumoReposicao/Lotes.jsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { withFazendaId } from "../../lib/fazendaScope";
import { useFazenda } from "../../context/FazendaContext";
import { enqueue, kvGet, kvSet } from "../../offline/localDB";

import { ModalLoteCadastro, ModalLoteInfo, ModalConfirmarExclusao } from "./ModalLote";

let MEMO_LOTES = {
  data: null,
  lastAt: 0,
};

const CACHE_LOTES_KEY = "cache:lotes:list";

function normalizeLotesCache(cache) {
  return Array.isArray(cache) ? cache : [];
}

function generateLocalId() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // fallback abaixo
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

/* ===================== helpers (map modal <-> banco) ===================== */
function dbToUiLote(row) {
  if (!row) return row;
  return {
    ...row,
    nivelProducao: row.nivel_produtivo ?? "",
    numVacas: Number(row.num_animais ?? 0),
  };
}

function uiToDbPayload(form) {
  if (!form) return form;
  const funcao = form.funcao || "Outro";
  const payload = {
    nome: String(form.nome || "").trim(),
    funcao,
    descricao: String(form.descricao || "").trim() || null,
    ativo: !!form.ativo,
    nivel_produtivo: null,
  };

  if (funcao === "Lactação") {
    payload.nivel_produtivo = String(form.nivelProducao || form.nivel_produtivo || "").trim() || null;
  }

  return payload;
}

export default function Lotes() {
  const { fazendaAtualId } = useFazenda();
  const memoData = MEMO_LOTES.data || {};
  const [lotes, setLotes] = useState(() => memoData.lotes ?? []);
  const [loading, setLoading] = useState(() => !memoData.lotes);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState(() => memoData.erro ?? "");

  const [hoveredRowId, setHoveredRowId] = useState(null);
  const [hoveredColKey, setHoveredColKey] = useState(null);
  const [sortConfig, setSortConfig] = useState(
    () => memoData.sortConfig ?? { key: null, direction: null }
  );
  const [openPopoverKey, setOpenPopoverKey] = useState(null);
  const [filtros, setFiltros] = useState(
    () =>
      memoData.filtros ?? {
        funcao: "__ALL__",
        nivel: "__ALL__",
        status: "__ALL__",
      }
  );
  const [cad, setCad] = useState({ open: false, index: null, lote: null });
  const [info, setInfo] = useState(null);
  const [excluirId, setExcluirId] = useState(null);

  const updateCache = useCallback(async (nextList) => {
    setLotes(nextList);
    await kvSet(CACHE_LOTES_KEY, nextList);
  }, []);

  useEffect(() => {
    const memo = MEMO_LOTES.data;
    if (memo?.lotes === lotes && memo?.sortConfig === sortConfig && memo?.filtros === filtros) {
      return;
    }
    MEMO_LOTES.data = {
      ...(memo || {}),
      lotes,
      sortConfig,
      filtros,
      erro,
    };
    MEMO_LOTES.lastAt = Date.now();
  }, [lotes, sortConfig, filtros, erro]);

  const funcaoOptions = useMemo(() => {
    const values = Array.from(
      new Set((lotes || []).map((l) => l.funcao).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
    return values;
  }, [lotes]);

  const nivelOptions = useMemo(() => {
    const values = Array.from(
      new Set((lotes || []).map((l) => l.nivelProducao).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
    return values;
  }, [lotes]);

  const toggleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      if (prev.direction === "desc") return { key: null, direction: null };
      return { key, direction: "asc" };
    });
  };

  const handleTogglePopover = (key) => {
    setOpenPopoverKey((prev) => (prev === key ? null : key));
  };

  useEffect(() => {
    if (!openPopoverKey) return undefined;
    const handleClick = (event) => {
      if (event.target.closest('[data-filter-trigger="true"]')) return;
      setOpenPopoverKey(null);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [openPopoverKey]);

  const carregar = useCallback(async () => {
    const memoFresh = MEMO_LOTES.data && Date.now() - MEMO_LOTES.lastAt < 30000;
    const hasData = Array.isArray(lotes) && lotes.length > 0;
    if (memoFresh && hasData) {
      setLoading(false);
      setAtualizando(false);
      return;
    }
    if (hasData) {
      setAtualizando(true);
    } else {
      setLoading(true);
    }
    setErro("");

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const cache = normalizeLotesCache(await kvGet(CACHE_LOTES_KEY));
      setLotes(cache);
      setLoading(false);
      setAtualizando(false);
      return;
    }

    if (!fazendaAtualId) {
      setErro("Selecione uma fazenda para carregar os lotes.");
      setLoading(false);
      setAtualizando(false);
      return;
    }

    const { data, error } = await supabase
      .from("v_lotes_com_contagem")
      .select(
        "id,nome,funcao,nivel_produtivo,descricao,ativo,num_animais,created_at,updated_at,fazenda_id"
      )
      .eq("fazenda_id", fazendaAtualId)
      .order("nome", { ascending: true });

    if (error) {
      console.error("Erro ao carregar lotes:", error);
      setErro("Não foi possível carregar os lotes. Verifique suas permissões (RLS) e tente novamente.");
      setLoading(false);
      setAtualizando(false);
      return;
    }

    await updateCache((data || []).map(dbToUiLote));
    setLoading(false);
    setAtualizando(false);
  }, [fazendaAtualId, lotes, updateCache]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const abrirCadastro = () =>
    setCad({
      open: true,
      index: null,
      lote: {
        id: null,
        nome: "",
        funcao: "Lactação",
        nivelProducao: "",
        descricao: "",
        ativo: true,
        numVacas: 0,
      },
    });

  const abrirEdicao = (i) => {
    const item = lotes[i];
    if (!item) return;
    setCad({ open: true, index: i, lote: JSON.parse(JSON.stringify(item)) });
  };

  /* ===================== CRUD SUPABASE ===================== */
  const salvarBanco = async (loteFinal) => {
    const nome = String(loteFinal?.nome || "").trim();
    const funcao = String(loteFinal?.funcao || "").trim();

    // Validação aqui deve ser mínima; o Modal já valida e mostra bonito.
    // Se cair aqui sem nome/função, rejeita para o Modal tratar.
    if (!nome || !funcao) {
      const err = { code: "VALIDATION", message: "Preencha os campos obrigatórios." };
      throw err;
    }
    if (funcao === "Lactação" && !String(loteFinal?.nivelProducao || "").trim()) {
      const err = { code: "VALIDATION", message: "Informe o nível produtivo." };
      throw err;
    }

    setLoading(true);
    setErro("");

    const payload = {
      ...uiToDbPayload(loteFinal),
      fazenda_id: fazendaAtualId || null,
    };

    try {
      // =========================
      // Pré-checagem de duplicidade (UI/UX)
      // =========================
      const norm = (s) => String(s || "").trim().toLowerCase();
      const nomeNorm = norm(nome);
      const existeMesmoNome = (Array.isArray(lotes) ? lotes : []).some((l) => {
        const mesmoRegistro = loteFinal?.id && String(l.id) === String(loteFinal.id);
        if (mesmoRegistro) return false;
        // Escopo: fazenda atual
        const mesmaFazenda =
          !fazendaAtualId || String(l.fazenda_id || "") === String(fazendaAtualId);
        if (!mesmaFazenda) return false;
        return norm(l.nome) === nomeNorm;
      });
      if (existeMesmoNome) {
        // Simula o padrão do Postgres para o Modal capturar e exibir aviso
        throw {
          code: "23505",
          message: 'duplicate key value violates unique constraint "lotes_user_nome_ux"',
        };
      }

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const localId = loteFinal?.id || generateLocalId();
        const loteUi = {
          ...loteFinal,
          id: localId,
          nivelProducao: loteFinal?.nivelProducao || loteFinal?.nivel_produtivo || "",
          nivel_produtivo:
            loteFinal?.funcao === "Lactação"
              ? String(loteFinal?.nivelProducao || loteFinal?.nivel_produtivo || "").trim() || null
              : null,
        };

        const nextList = (
          loteFinal?.id
            ? lotes.map((l) => (String(l.id) === String(loteFinal.id) ? { ...l, ...loteUi } : l))
            : [...lotes, loteUi]
        ).sort((a, b) => String(a.nome || "").localeCompare(String(b.nome || "")));

        await updateCache(nextList);

        await enqueue(loteFinal?.id ? "lotes.update" : "lotes.insert", {
          id: localId,
          payload: { ...payload, id: localId },
        });

        setCad({ open: false, index: null, lote: null });
        setLoading(false);
        return;
      }

      if (loteFinal?.id) {
        const { error } = await withFazendaId(
          supabase.from("lotes").update(payload),
          fazendaAtualId
        ).eq("id", loteFinal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("lotes").insert(payload);
        if (error) throw error;
      }

      setCad({ open: false, index: null, lote: null });
      await carregar();
    } catch (e) {
      console.error("Erro ao salvar lote:", e);
      // Se for duplicidade, NÃO joga no alerta da página.
      // Deixa o Modal tratar e mostrar o aviso "nome já existe".
      const msg = String(e?.message || "");
      const isDuplicate =
        e?.code === "23505" ||
        msg.toLowerCase().includes("duplicate key") ||
        msg.includes("lotes_user_nome_ux");
      if (!isDuplicate) {
        setErro("Não foi possível salvar o lote. Confira os campos e tente novamente.");
      }
      // Propaga para o Modal (onSave async) exibir aviso bonito
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const alternarAtivoBanco = async (loteId, ativoAtual) => {
    if (!loteId) return;
    setLoading(true);
    setErro("");

    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const nextList = lotes.map((l) =>
          String(l.id) === String(loteId) ? { ...l, ativo: !ativoAtual } : l
        );
        await updateCache(nextList);
        await enqueue("lotes.update", { id: loteId, payload: { ativo: !ativoAtual } });
        setLoading(false);
        return;
      }

      const { error } = await withFazendaId(
        supabase.from("lotes").update({ ativo: !ativoAtual }),
        fazendaAtualId
      ).eq("id", loteId);
      if (error) throw error;
      await carregar();
    } catch (e) {
      console.error("Erro ao alternar ativo:", e);
      setErro("Não foi possível alterar o status. Verifique permissões (RLS).");
      setLoading(false);
    }
  };

  const confirmarExclusaoBanco = async () => {
    if (!excluirId) return;

    setLoading(true);
    setErro("");

    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const nextList = lotes.filter((l) => String(l.id) !== String(excluirId));
        await updateCache(nextList);
        await enqueue("lotes.delete", { id: excluirId });
        setExcluirId(null);
        setLoading(false);
        return;
      }

      const { error } = await withFazendaId(
        supabase.from("lotes").delete(),
        fazendaAtualId
      ).eq("id", excluirId);
      if (error) throw error;

      setExcluirId(null);
      await carregar();
    } catch (e) {
      console.error("Erro ao excluir lote:", e);
      setErro("Não foi possível excluir o lote. Se houver animais vinculados, o lote será removido e o lote_id fica null.");
      setLoading(false);
    }
  };

  const lotesExibidos = useMemo(() => {
    let lista = Array.isArray(lotes) ? [...lotes] : [];

    if (filtros.funcao !== "__ALL__") {
      lista = lista.filter((l) => l.funcao === filtros.funcao);
    }
    if (filtros.nivel !== "__ALL__") {
      lista = lista.filter((l) => l.nivelProducao === filtros.nivel);
    }
    if (filtros.status !== "__ALL__") {
      const ativo = filtros.status === "Ativo";
      lista = lista.filter((l) => !!l.ativo === ativo);
    }

    if (sortConfig.key) {
      const dir = sortConfig.direction === "desc" ? -1 : 1;
      lista.sort((a, b) => {
        switch (sortConfig.key) {
          case "nome":
            return String(a.nome || "").localeCompare(String(b.nome || "")) * dir;
          case "numVacas":
            return (Number(a.numVacas || 0) - Number(b.numVacas || 0)) * dir;
          case "nivel":
            return String(a.nivelProducao || "").localeCompare(String(b.nivelProducao || "")) * dir;
          default:
            return 0;
        }
      });
    }

    return lista;
  }, [lotes, filtros, sortConfig]);

  const hasLotes = lotesExibidos.length > 0;

  const resumo = useMemo(() => {
    const total = lotesExibidos.length;
    const totalVacas = lotesExibidos.reduce((acc, l) => acc + Number(l.numVacas || 0), 0);
    const ativos = lotesExibidos.filter((l) => l.ativo).length;
    const inativos = total - ativos;
    return { total, totalVacas, ativos, inativos };
  }, [lotesExibidos]);

  // Estilos inline modernos
  const styles = {
    container: {
      padding: "24px",
      maxWidth: "1400px",
      margin: "0 auto",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "24px",
    },
    titleGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "4px",
    },
    title: {
      fontSize: "24px",
      fontWeight: 700,
      color: "#0f172a",
      margin: 0,
      letterSpacing: "-0.025em",
    },
    subtitle: {
      fontSize: "14px",
      color: "#64748b",
      margin: 0,
    },
    headerActions: {
      display: "flex",
      gap: "12px",
    },
    primaryButton: {
      padding: "10px 20px",
      backgroundColor: "#3b82f6",
      color: "#ffffff",
      border: "none",
      borderRadius: "10px",
      fontSize: "14px",
      fontWeight: 600,
      cursor: "pointer",
      transition: "all 0.2s ease",
      boxShadow: "0 1px 3px 0 rgba(59, 130, 246, 0.3)",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    secondaryButton: {
      padding: "10px 20px",
      backgroundColor: "#ffffff",
      color: "#374151",
      border: "1px solid #e5e7eb",
      borderRadius: "10px",
      fontSize: "14px",
      fontWeight: 500,
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    filtersBar: {
      display: "flex",
      gap: "16px",
      marginBottom: "24px",
      padding: "20px",
      backgroundColor: "#f8fafc",
      borderRadius: "12px",
      border: "1px solid #e2e8f0",
      alignItems: "center",
    },
    filterGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
    },
    filterLabel: {
      fontSize: "12px",
      fontWeight: 600,
      color: "#475569",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },
    select: {
      padding: "8px 12px",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      fontSize: "14px",
      backgroundColor: "#ffffff",
      cursor: "pointer",
      minWidth: "140px",
      outline: "none",
      transition: "border-color 0.2s",
    },
    tableContainer: {
      backgroundColor: "#ffffff",
      borderRadius: "16px",
      border: "1px solid #e2e8f0",
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
      overflow: "hidden",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "14px",
    },
    thead: {
      backgroundColor: "#f8fafc",
      borderBottom: "2px solid #e2e8f0",
    },
    th: {
      padding: "16px 20px",
      textAlign: "left",
      fontSize: "12px",
      fontWeight: 700,
      color: "#475569",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      whiteSpace: "nowrap",
      userSelect: "none",
    },
    thSortable: {
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    td: {
      padding: "16px 20px",
      color: "#334155",
      borderBottom: "1px solid #f1f5f9",
      verticalAlign: "middle",
    },
    tr: {
      transition: "background-color 0.15s ease",
    },
    trHover: {
      backgroundColor: "#f8fafc",
    },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 10px",
      borderRadius: "9999px",
      fontSize: "12px",
      fontWeight: 600,
    },
    badgeOk: {
      backgroundColor: "#dcfce7",
      color: "#166534",
    },
    badgeMute: {
      backgroundColor: "#f3f4f6",
      color: "#6b7280",
    },
    categoryBadge: {
      display: "inline-flex",
      padding: "4px 10px",
      borderRadius: "6px",
      fontSize: "12px",
      fontWeight: 600,
      backgroundColor: "#eff6ff",
      color: "#1e40af",
    },
    numVacas: {
      fontFamily: "monospace",
      fontSize: "14px",
      fontWeight: 600,
      color: "#0f172a",
    },
    actionButtons: {
      display: "flex",
      gap: "8px",
      justifyContent: "center",
    },
    iconButton: {
      padding: "8px",
      backgroundColor: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px",
      transition: "all 0.2s ease",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "36px",
      height: "36px",
    },
    iconButtonDanger: {
      color: "#ef4444",
    },
    footer: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "20px 24px",
      backgroundColor: "#f8fafc",
      borderTop: "1px solid #e2e8f0",
    },
    footerStats: {
      display: "flex",
      gap: "24px",
      fontSize: "14px",
      color: "#64748b",
    },
    statItem: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
    },
    statValue: {
      fontWeight: 700,
      color: "#0f172a",
    },
    alert: {
      padding: "12px 16px",
      borderRadius: "8px",
      marginBottom: "20px",
      fontSize: "14px",
      backgroundColor: "#fee2e2",
      color: "#991b1b",
      border: "1px solid #fecaca",
    },
    loadingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(255, 255, 255, 0.8)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10,
    },
    emptyState: {
      padding: "48px",
      textAlign: "center",
      color: "#64748b",
    },
    popover: {
      position: "absolute",
      top: "100%",
      left: 0,
      marginTop: "8px",
      backgroundColor: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
      padding: "16px",
      zIndex: 50,
      minWidth: "200px",
    },
  };

  return (
    <section style={{ width: "100%", minHeight: "100vh", backgroundColor: "#f8fafc", padding: "24px" }}>
      <div style={styles.container}>
        {/* Header Moderno */}
        <div style={styles.header}>
          <div style={styles.titleGroup}>
            <h1 style={styles.title}>Gerenciamento de Lotes</h1>
            <p style={styles.subtitle}>Organize e acompanhe todos os lotes da sua fazenda</p>
          </div>
          <div style={styles.headerActions}>
            <button 
              style={styles.secondaryButton} 
              onClick={carregar}
              disabled={atualizando}
            >
              {atualizando ? "Atualizando..." : "↻ Atualizar"}
            </button>
            <button 
              style={styles.primaryButton} 
              onClick={abrirCadastro}
              disabled={loading}
            >
              <span>+</span>
              <span>Cadastrar Lote</span>
            </button>
          </div>
        </div>

        {/* Alerta de erro */}
        {erro && (
          <div style={styles.alert}>
            <strong>Erro:</strong> {erro}
          </div>
        )}

        {/* Filtros */}
        <div style={styles.filtersBar}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Função</label>
            <select 
              style={styles.select}
              value={filtros.funcao}
              onChange={(e) => setFiltros(prev => ({ ...prev, funcao: e.target.value }))}
            >
              <option value="__ALL__">Todas as funções</option>
              {funcaoOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Nível Produtivo</label>
            <select 
              style={styles.select}
              value={filtros.nivel}
              onChange={(e) => setFiltros(prev => ({ ...prev, nivel: e.target.value }))}
            >
              <option value="__ALL__">Todos os níveis</option>
              {nivelOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Status</label>
            <select 
              style={styles.select}
              value={filtros.status}
              onChange={(e) => setFiltros(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="__ALL__">Todos os status</option>
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
            </select>
          </div>
        </div>

        {/* Tabela Moderna */}
        <div style={{ ...styles.tableContainer, position: "relative" }}>
          {loading && !hasLotes && (
            <div style={styles.loadingOverlay}>
              <div>Carregando lotes...</div>
            </div>
          )}

          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr>
                <th style={styles.th}>
                  <div 
                    style={styles.thSortable}
                    onClick={() => toggleSort("nome")}
                  >
                    <span>Nome</span>
                    {sortConfig.key === "nome" && (
                      <span>{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th style={{ ...styles.th, textAlign: "center" }}>
                  <div 
                    style={{ ...styles.thSortable, justifyContent: "center" }}
                    onClick={() => toggleSort("numVacas")}
                  >
                    <span>Nº de Vacas</span>
                    {sortConfig.key === "numVacas" && (
                      <span>{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th style={styles.th}>Função</th>
                <th style={styles.th}>
                  <div 
                    style={styles.thSortable}
                    onClick={() => toggleSort("nivel")}
                  >
                    <span>Nível Produtivo</span>
                    {sortConfig.key === "nivel" && (
                      <span>{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th style={{ ...styles.th, textAlign: "center" }}>Status</th>
                <th style={{ ...styles.th, textAlign: "center" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {!loading && lotesExibidos.length === 0 ? (
                <tr>
                  <td colSpan={6} style={styles.emptyState}>
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
                    <div style={{ fontSize: "16px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>
                      Nenhum lote encontrado
                    </div>
                    <div style={{ fontSize: "14px" }}>
                      {lotes.length === 0 
                        ? "Cadastre seu primeiro lote para começar" 
                        : "Tente ajustar os filtros para ver mais resultados"}
                    </div>
                  </td>
                </tr>
              ) : (
                lotesExibidos.map((lote, index) => {
                  const rowId = lote.id || index;
                  const isHovered = hoveredRowId === rowId;
                  
                  return (
                    <tr 
                      key={rowId}
                      style={{
                        ...styles.tr,
                        ...(isHovered ? styles.trHover : {}),
                      }}
                      onMouseEnter={() => setHoveredRowId(rowId)}
                      onMouseLeave={() => setHoveredRowId(null)}
                    >
                      <td style={styles.td}>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>
                          {lote.nome || "—"}
                        </div>
                      </td>
                      <td style={{ ...styles.td, textAlign: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                          <span style={styles.numVacas}>{lote.numVacas || 0}</span>
                          <button 
                            style={styles.iconButton}
                            onClick={() => setInfo(lote)}
                            title="Ver detalhes"
                          >
                            ℹ️
                          </button>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.categoryBadge}>
                          {lote.funcao || "—"}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {lote.funcao === "Lactação" ? (
                          <span style={{ color: "#059669", fontWeight: 500 }}>
                            {lote.nivelProducao || "—"}
                          </span>
                        ) : (
                          <span style={{ color: "#9ca3af" }}>—</span>
                        )}
                      </td>
                      <td style={{ ...styles.td, textAlign: "center" }}>
                        <span style={{
                          ...styles.badge,
                          ...(lote.ativo ? styles.badgeOk : styles.badgeMute)
                        }}>
                          {lote.ativo ? "● Ativo" : "○ Inativo"}
                        </span>
                      </td>
                      <td style={{ ...styles.td, textAlign: "center" }}>
                        <div style={styles.actionButtons}>
                          <button 
                            style={styles.iconButton}
                            onClick={() => abrirEdicao(index)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button 
                            style={styles.iconButton}
                            onClick={() => alternarAtivoBanco(lote.id, lote.ativo)}
                            title={lote.ativo ? "Inativar" : "Ativar"}
                          >
                            {lote.ativo ? "⏸️" : "▶️"}
                          </button>
                          <button 
                            style={{ ...styles.iconButton, ...styles.iconButtonDanger }}
                            onClick={() => setExcluirId(lote.id)}
                            title="Excluir"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Footer com estatísticas */}
          {hasLotes && (
            <div style={styles.footer}>
              <div style={styles.footerStats}>
                <div style={styles.statItem}>
                  <span>Total de lotes:</span>
                  <span style={styles.statValue}>{resumo.total}</span>
                </div>
                <div style={styles.statItem}>
                  <span>Total de vacas:</span>
                  <span style={{ ...styles.statValue, color: "#3b82f6" }}>{resumo.totalVacas}</span>
                </div>
                <div style={styles.statItem}>
                  <span>Ativos:</span>
                  <span style={{ ...styles.statValue, color: "#10b981" }}>{resumo.ativos}</span>
                </div>
                <div style={styles.statItem}>
                  <span>Inativos:</span>
                  <span style={{ ...styles.statValue, color: "#6b7280" }}>{resumo.inativos}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modais mantidos intactos */}
      {cad.open && (
        <ModalLoteCadastro
          title={cad.index != null ? "✏️ Editar Lote" : "➕ Cadastro de Lote"}
          initialValue={cad.lote}
          onClose={() => setCad({ open: false, index: null, lote: null })}
          onCancel={() => setCad({ open: false, index: null, lote: null })}
          onSave={(payload) => salvarBanco(payload)}
        />
      )}

      {info && <ModalLoteInfo lote={info} onClose={() => setInfo(null)} />}

      {excluirId && (
        <ModalConfirmarExclusao
          title="Confirmar exclusão"
          onClose={() => setExcluirId(null)}
          onCancel={() => setExcluirId(null)}
          onConfirm={confirmarExclusaoBanco}
        />
      )}
    </section>
  );
}
