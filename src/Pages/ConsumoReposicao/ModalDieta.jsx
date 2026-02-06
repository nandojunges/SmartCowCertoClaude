// src/pages/ConsumoReposicao/ModalDieta.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Select from "react-select";
import { supabase } from "../../lib/supabaseClient";
import { withFazendaId } from "../../lib/fazendaScope";
import { useFazenda } from "../../context/FazendaContext";
import { enqueue, kvGet } from "../../offline/localDB";

const CATEGORIA_INGREDIENTE = "Cozinha";
const TIPOS_ENTRADA = ["ENTRADA", "entrada", "Entrada", "E", "e"];

const CACHE_ESTOQUE_KEY = "cache:estoque:list";
const CACHE_LOTES_KEY = "cache:lotes:list";

/* ===== Ícones e Cores ===== */
const ICONS = {
  lote: "🐄",
  data: "📅",
  ingrediente: "🌾",
  dinheiro: "💰",
  alerta: "⚠️",
  sucesso: "✓",
};

function generateLocalId() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {}
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

/* ===== Helpers Numéricos ===== */
function safeNum(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function parseNumBR(v) {
  if (v == null) return 0;
  const raw = String(v).trim();
  if (!raw) return 0;

  const normalized = raw.replace(/\s+/g, "");
  const hasComma = normalized.includes(",");
  const hasDot = normalized.includes(".");

  let s = normalized;
  if (hasComma && hasDot) {
    const lastComma = normalized.lastIndexOf(",");
    const lastDot = normalized.lastIndexOf(".");
    const decimalSep = lastComma > lastDot ? "," : ".";

    s = normalized
      .replace(decimalSep === "," ? /\./g : /,/g, "")
      .replace(decimalSep, ".");
  } else if (hasComma) {
    s = normalized.replace(",", ".");
  }

  s = s.replace(/[^0-9.-]/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function parseQuantidadeKgSeguro(valorDigitado, unidadeProduto) {
  const raw = String(valorDigitado ?? "").trim();
  if (!raw) return 0;

  const text = raw.toLowerCase();
  const unidade = String(unidadeProduto || "").trim().toLowerCase();
  const valorBase = parseNumBR(raw);
  if (!Number.isFinite(valorBase) || valorBase <= 0) return 0;

  if (/(^|\s)kg($|\s)/i.test(text) || text.includes("kg")) {
    return valorBase;
  }

  if (/(^|\s)g($|\s)/i.test(text) || text.includes("g")) {
    return valorBase / 1000;
  }

  const valorSemUnidade = valorBase >= 10 && valorBase <= 5000;
  if (valorSemUnidade) {
    if (unidade === "mg") return valorBase / 1_000_000;
    if (unidade === "g" || unidade === "ml") return valorBase / 1000;
  }

  return valorBase;
}

function formatBRL(n) {
  try {
    return (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  } catch {
    return `R$ ${(Number(n) || 0).toFixed(2)}`;
  }
}

function formatDateBR(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR");
}

function isoToDateOnly(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function sameDayISO(a, b) {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

function pickMostRecentRow(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const getTime = (r) => {
    const raw = r?.created_at ?? r?.data ?? r?.dia ?? r?.updated_at ?? null;
    const t = raw ? new Date(raw).getTime() : NaN;
    return Number.isFinite(t) ? t : 0;
  };
  return rows.reduce((best, curr) => (getTime(curr) > getTime(best) ? curr : best), rows[0]);
}

function extractUnitPriceFromMov(m) {
  if (!m) return 0;
  const direct = m?.valor_unitario_aplicado ?? m?.valor_unitario ?? m?.preco_unitario ?? m?.preco ?? null;
  if (direct != null && direct !== "") return safeNum(direct);
  const total = m?.valor_total ?? m?.total ?? null;
  const qtd = m?.quantidade ?? m?.qtd ?? null;
  const t = safeNum(total);
  const q = safeNum(qtd);
  return q > 0 && t > 0 ? t / q : 0;
}

/* ===== Componente Principal ===== */
export default function ModalDieta({ title = "Cadastro de Dieta", value, onCancel, onSave }) {
  const { fazendaAtualId } = useFazenda();
  const wrapRef = useRef(null);

  // Estados de dados externos
  const [lotesDb, setLotesDb] = useState([]);
  const [lotesLoading, setLotesLoading] = useState(false);
  const [produtosCozinha, setProdutosCozinha] = useState([]);
  const [produtosLoading, setProdutosLoading] = useState(false);
  const [precosMap, setPrecosMap] = useState({});
  const [numVacasLoading, setNumVacasLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    id: null,
    lote_id: "",
    lote_nome: "",
    numVacas: 0,
    data: new Date().toISOString(),
    ativo: true,
    observacao: "",
    ingredientes: [],
  });

  // Inicialização
  useEffect(() => {
    if (value) {
      setForm({
        id: value.id ?? null,
        lote_id: value.lote_id ?? "",
        lote_nome: value.lote_nome ?? "",
        numVacas: Number(value.numVacas || value.numvacas_snapshot || 0),
        data: value.data || new Date().toISOString(),
        ativo: value.ativo !== false,
        observacao: value.observacao ?? "",
        ingredientes: Array.isArray(value.ingredientes) ? value.ingredientes : [],
      });
    }
  }, [value]);

  /* ===== Carregamento de Dados ===== */
  const loadLotes = useCallback(async () => {
    setLotesLoading(true);
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const cache = await kvGet(CACHE_LOTES_KEY);
      const list = Array.isArray(cache) ? cache : [];
      setLotesDb(list.filter((l) => l?.ativo !== false).map((l) => ({ id: l.id, nome: l.nome })));
      setLotesLoading(false);
      return;
    }
    if (!fazendaAtualId) {
      setLotesDb([]);
      setLotesLoading(false);
      return;
    }
    const { data, error } = await withFazendaId(
      supabase.from("lotes").select("id, nome").eq("ativo", true),
      fazendaAtualId
    ).order("nome", { ascending: true });
    if (!error) setLotesDb(Array.isArray(data) ? data : []);
    setLotesLoading(false);
  }, [fazendaAtualId]);

  const loadProdutos = useCallback(async () => {
    setProdutosLoading(true);

    // ===== OFFLINE =====
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const cache = await kvGet(CACHE_ESTOQUE_KEY);
      const list = Array.isArray(cache) ? cache : [];

      // ✅ categoria cozinha + (se tiver quantidade) >0
      const cozinha = list.filter((p) => {
        const cat = String(p?.categoria || "").toLowerCase();
        if (!cat.includes(CATEGORIA_INGREDIENTE.toLowerCase())) return false;

        const qtd = Number(
          p?.quantidade_atual ??
          p?.quantidade ??
          p?.saldo ??
          p?.estoque ??
          p?.qtd ??
          0
        ) || 0;

        // se não tiver qtd no cache, deixa passar
        const hasQtd = (p?.quantidade_atual != null || p?.quantidade != null || p?.saldo != null || p?.estoque != null || p?.qtd != null);
        return hasQtd ? qtd > 0 : true;
      });

      const normalized = cozinha.map((p) => ({
        id: p.id,
        nome_comercial: p.nomeComercial || p.nome_comercial || p.nome || "—",
        unidade: p.unidade || p.unidade_medida || "un",
        categoria: p.categoria || CATEGORIA_INGREDIENTE,
      }));

      setProdutosCozinha(normalized);

      // preços aproximados via cache
      const prices = {};
      normalized.forEach((p) => {
        const original = cozinha.find((x) => String(x.id) === String(p.id));
        const qtd = Number(original?.quantidade ?? original?.qtd ?? 0) || 0;
        const total = Number(original?.valorTotal ?? original?.valor_total ?? 0) || 0;
        prices[p.id] = qtd > 0 ? total / qtd : 0;
      });

      setPrecosMap(prices);
      setProdutosLoading(false);
      return;
    }

    // ===== ONLINE =====
    if (!fazendaAtualId) {
      setProdutosCozinha([]);
      setPrecosMap({});
      setProdutosLoading(false);
      return;
    }

    // ✅ NÃO peça colunas que não existem (isso estava causando 400)
    const produtosQuery = supabase
      .from("estoque_produtos")
      .select("id, nome_comercial, unidade, categoria, fazenda_id")
      .eq("fazenda_id", fazendaAtualId)
      .eq("categoria", CATEGORIA_INGREDIENTE)
      .order("nome_comercial", { ascending: true });

    const { data: produtos, error } = await produtosQuery;

    if (error) {
      console.error("loadProdutos erro:", {
        status: error?.status,
        message: error?.message,
        details: error?.details,
        query: {
          from: "estoque_produtos",
          filters: {
            fazenda_id: fazendaAtualId,
            categoria: CATEGORIA_INGREDIENTE,
          },
          orderBy: "nome_comercial.asc",
        },
      });
      setProdutosCozinha([]);
      setPrecosMap({});
      setProdutosLoading(false);
      return;
    }

    const list = Array.isArray(produtos) ? produtos : [];
    console.log("loadProdutos OK -> itens:", list.length, list.slice(0, 3));
    setProdutosCozinha(list);

    // ✅ preços por movimentos (mantém teu cálculo)
    const nextPrices = {};
    for (const p of list) {
      const { data: movs, error: eMov } = await withFazendaId(
        supabase
          .from("estoque_movimentos")
          .select("*")
          .eq("produto_id", p.id)
          .in("tipo", TIPOS_ENTRADA),
        fazendaAtualId
      ).limit(20);

      if (eMov) {
        console.warn("loadProdutos mov erro:", eMov);
        nextPrices[p.id] = 0;
        continue;
      }

      const last = pickMostRecentRow(movs);
      nextPrices[p.id] = extractUnitPriceFromMov(last);
    }

    setPrecosMap(nextPrices);
    setProdutosLoading(false);
  }, [fazendaAtualId]);

  useEffect(() => {
    loadLotes();
    loadProdutos();
  }, [loadLotes, loadProdutos]);

  /* ===== Helpers de Cálculo ===== */
  const calcularCustos = useCallback((ingredientes, numVacas) => {
    const total = ingredientes.reduce((acc, ing) => {
      if (!ing.produto_id) return acc;
      const preco = safeNum(precosMap[ing.produto_id]);
      const produto = produtosCozinha.find((p) => p.id === ing.produto_id);
      const qtd = parseQuantidadeKgSeguro(ing.quantidade, produto?.unidade);
      return acc + preco * qtd * numVacas;
    }, 0);
    return {
      total,
      porVaca: numVacas > 0 ? total / numVacas : 0,
    };
  }, [precosMap, produtosCozinha]);

  const custos = useMemo(() => calcularCustos(form.ingredientes, form.numVacas), [calcularCustos, form.ingredientes, form.numVacas]);

  /* ===== Ações do Form ===== */
  const fetchNumVacas = useCallback(async (loteId) => {
    if (!loteId) return 0;
    setNumVacasLoading(true);
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const cache = await kvGet(CACHE_LOTES_KEY);
      const found = (cache || []).find((l) => String(l.id) === String(loteId));
      setNumVacasLoading(false);
      return Number(found?.numVacas || 0);
    }
    if (!fazendaAtualId) {
      setNumVacasLoading(false);
      return 0;
    }
    const { count } = await withFazendaId(
      supabase.from("animais").select("id", { count: "exact", head: true }).eq("ativo", true).eq("lote_id", loteId),
      fazendaAtualId
    );
    setNumVacasLoading(false);
    return Number(count || 0);
  }, [fazendaAtualId]);

  const handleSelectLote = async (loteId) => {
    const lote = lotesDb.find((l) => l.id === loteId);
    const numVacas = await fetchNumVacas(loteId);
    setForm((f) => ({
      ...f,
      lote_id: loteId,
      lote_nome: lote?.nome || "",
      numVacas,
    }));
  };

  const handleAddIngrediente = () => {
    setForm((f) => ({
      ...f,
      ingredientes: [...f.ingredientes, { id: generateLocalId(), produto_id: "", quantidade: "" }],
    }));
  };

  const handleRemoveIngrediente = (idx) => {
    setForm((f) => ({
      ...f,
      ingredientes: f.ingredientes.filter((_, i) => i !== idx),
    }));
  };

  const handleUpdateIngrediente = (idx, field, value) => {
    setForm((f) => {
      const ings = [...f.ingredientes];
      ings[idx] = { ...ings[idx], [field]: value };
      return { ...f, ingredientes: ings };
    });
  };

  /* ===== Validação e Save ===== */
  const validate = () => {
    if (!form.lote_id) return "Selecione um lote";
    if (!form.ingredientes.length) return "Adicione pelo menos um ingrediente";
    if (form.ingredientes.some((i) => {
      if (!i.produto_id) return true;
      const produto = produtosCozinha.find((p) => p.id === i.produto_id);
      return parseQuantidadeKgSeguro(i.quantidade, produto?.unidade) <= 0;
    })) {
      return "Preencha todos os ingredientes com produto e quantidade válida";
    }
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) return alert(err);

    setSaving(true);
    const resolvedFazendaId = fazendaAtualId || null;
    const dia = isoToDateOnly(form.data);

    const payloadDieta = {
      fazenda_id: resolvedFazendaId,
      lote_id: form.lote_id,
      dia,
      numvacas_snapshot: form.numVacas,
      custo_total: custos.total,
      custo_vaca_dia: custos.porVaca,
      ativo: form.id ? form.ativo !== false : true,
      observacao: form.observacao || null,
    };

    // Offline
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const dietaId = form.id || generateLocalId();
      const itens = form.ingredientes.map((ing) => {
        const produto = produtosCozinha.find((p) => p.id === ing.produto_id);
        const quantidadeKgVaca = parseQuantidadeKgSeguro(ing.quantidade, produto?.unidade);
        return ({
        fazenda_id: resolvedFazendaId,
        dieta_id: dietaId,
        produto_id: ing.produto_id,
        quantidade_kg_vaca: quantidadeKgVaca,
        preco_unitario_snapshot: safeNum(precosMap[ing.produto_id]),
        custo_parcial_snapshot: safeNum(precosMap[ing.produto_id]) * quantidadeKgVaca * form.numVacas,
      });
      });

      await enqueue(form.id ? "dieta.update" : "dieta.insert", { dieta: { ...payloadDieta, id: dietaId }, itens });

      onSave?.({
        ...payloadDieta,
        id: dietaId,
        lote: form.lote_nome,
        numVacas: form.numVacas,
        ingredientes: form.ingredientes,
        offline: true,
      });
      setSaving(false);
      return;
    }

    // Online
    try {
      if (form.id) {
        await withFazendaId(supabase.from("dietas").update(payloadDieta), resolvedFazendaId).eq("id", form.id);
        await withFazendaId(supabase.from("dietas_itens").delete(), resolvedFazendaId).eq("dieta_id", form.id);
      } else {
        const { data } = await supabase.from("dietas").insert(payloadDieta).select("id").single();
        form.id = data.id;
      }

      const itens = form.ingredientes.map((ing) => {
        const produto = produtosCozinha.find((p) => p.id === ing.produto_id);
        const quantidadeKgVaca = parseQuantidadeKgSeguro(ing.quantidade, produto?.unidade);
        return ({
        fazenda_id: resolvedFazendaId,
        dieta_id: form.id,
        produto_id: ing.produto_id,
        quantidade_kg_vaca: quantidadeKgVaca,
        preco_unitario_snapshot: safeNum(precosMap[ing.produto_id]),
        custo_parcial_snapshot: safeNum(precosMap[ing.produto_id]) * quantidadeKgVaca * form.numVacas,
      });
      });

      if (itens.length) await supabase.from("dietas_itens").insert(itens);
      onSave?.({ ...payloadDieta, id: form.id });
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar: " + (err.message || "Erro desconhecido"));
    } finally {
      setSaving(false);
    }
  };

  /* ===== Options ===== */
  const loteOptions = useMemo(() => lotesDb.map((l) => ({ value: l.id, label: l.nome })), [lotesDb]);
  const produtoOptions = useMemo(() => produtosCozinha.map((p) => ({ value: p.id, label: p.nome_comercial, unidade: p.unidade })), [produtosCozinha]);
  const dataOptions = useMemo(() => {
    const opts = [];
    for (let i = 0; i <= 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
      opts.push({ value: iso, label: i === 0 ? "Hoje" : formatDateBR(iso) });
    }
    return opts;
  }, []);

  const selectedLote = loteOptions.find((o) => o.value === form.lote_id) || null;
  const selectedData = dataOptions.find((o) => sameDayISO(o.value, form.data)) || null;

  /* ===== Estilos Inline ===== */
  const styles = {
    overlay: { position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999, padding: 20 },
    card: { width: "100%", maxWidth: 900, maxHeight: "90vh", background: "#fff", borderRadius: 20, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" },
    header: { background: "linear-gradient(135deg, #059669 0%, #10b981 100%)", padding: "20px 24px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" },
    headerTitle: { fontSize: 20, fontWeight: 800, display: "flex", alignItems: "center", gap: 12 },
    body: { flex: 1, overflow: "auto", padding: 24, background: "#f8fafc" },
    section: { background: "#fff", borderRadius: 16, padding: 20, marginBottom: 20, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
    sectionTitle: { fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 },
    grid2: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 },
    inputGroup: { display: "flex", flexDirection: "column", gap: 6 },
    label: { fontSize: 13, fontWeight: 700, color: "#374151" },
    badge: { display: "inline-flex", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: "#dbeafe", color: "#1e40af" },
    badgeWarning: { background: "#fef3c7", color: "#92400e" },
    ingredienteCard: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, marginBottom: 12, display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 12, alignItems: "end", transition: "all 0.2s" },
    calcText: { fontSize: 11, color: "#64748b", marginTop: 4, fontStyle: "italic" },
    emptyState: { textAlign: "center", padding: 40, color: "#64748b", border: "2px dashed #cbd5e1", borderRadius: 12, marginBottom: 20 },
    footer: { background: "#fff", borderTop: "1px solid #e2e8f0", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" },
    totalBox: { textAlign: "right" },
    totalLabel: { fontSize: 12, color: "#64748b", fontWeight: 600 },
    totalValue: { fontSize: 24, fontWeight: 800, color: "#059669" },
    totalSub: { fontSize: 13, color: "#374151", fontWeight: 600 },
    btnPrimary: { padding: "12px 24px", background: "#059669", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 1px 3px rgba(5, 150, 105, 0.3)" },
    btnSecondary: { padding: "12px 24px", background: "#fff", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", marginRight: 12 },
    btnAdd: { width: "100%", padding: 12, border: "2px dashed #cbd5e1", background: "#f8fafc", color: "#64748b", borderRadius: 10, cursor: "pointer", fontWeight: 600, transition: "all 0.2s" },
    btnRemove: { width: 36, height: 36, borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 },
  };

  // React Select styles
  const selectStyles = {
    control: (base, state) => ({ ...base, minHeight: 44, borderRadius: 10, borderColor: state.isFocused ? "#10b981" : "#e2e8f0", boxShadow: state.isFocused ? "0 0 0 3px rgba(16, 185, 129, 0.1)" : "none" }),
    menuPortal: (base) => ({ ...base, zIndex: 999999 }),
  };

  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerTitle}>
            <span>{ICONS.ingrediente}</span>
            {title}
          </div>
          <button onClick={onCancel} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: 36, height: 36, borderRadius: 10, cursor: "pointer", fontSize: 20 }}>×</button>
        </div>

        {/* Body */}
        <div style={styles.body} ref={wrapRef}>
          {/* Seção 1: Lote e Data */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>{ICONS.lote} Informações Básicas</div>
            <div style={styles.grid2}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Lote *</label>
                <Select
                  value={selectedLote}
                  onChange={(opt) => handleSelectLote(opt?.value)}
                  options={loteOptions}
                  placeholder={lotesLoading ? "Carregando..." : "Selecione o lote..."}
                  isLoading={lotesLoading}
                  styles={selectStyles}
                  menuPortalTarget={document.body}
                />
                {form.lote_id && (
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={styles.badge}>
                      {numVacasLoading ? "..." : `${form.numVacas} vacas`} no lote
                    </span>
                    {!numVacasLoading && form.numVacas === 0 && (
                      <span style={{ ...styles.badge, ...styles.badgeWarning }}>Atenção: Lote vazio</span>
                    )}
                  </div>
                )}
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Data da Dieta</label>
                <Select
                  value={selectedData}
                  onChange={(opt) => setForm((f) => ({ ...f, data: opt?.value }))}
                  options={dataOptions}
                  styles={selectStyles}
                  menuPortalTarget={document.body}
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Ingredientes */}
          <div style={styles.section}>
            <div style={{ ...styles.sectionTitle, justifyContent: "space-between" }}>
              <span>{ICONS.ingrediente} Composição da Dieta</span>
              <span style={{ fontSize: 12, color: "#64748b" }}>
                {form.ingredientes.length} ingrediente(s)
              </span>
            </div>

            {form.ingredientes.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🌾</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Nenhum ingrediente adicionado</div>
                <div style={{ fontSize: 13 }}>Adicione os produtos que compõem esta dieta</div>
              </div>
            ) : (
              form.ingredientes.map((ing, idx) => {
                const produto = produtoOptions.find((p) => p.value === ing.produto_id);
                const precoUnit = safeNum(precosMap[ing.produto_id]);
                const qtd = parseQuantidadeKgSeguro(ing.quantidade, produto?.unidade);
                const subtotal = precoUnit * qtd * form.numVacas;
                const subtotalPorVaca = precoUnit * qtd;

                return (
                  <div key={ing.id || idx} style={styles.ingredienteCard}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Ingrediente</label>
                      <Select
                        value={produto}
                        onChange={(opt) => handleUpdateIngrediente(idx, "produto_id", opt?.value)}
                        options={produtoOptions}
                        placeholder="Selecione..."
                        styles={selectStyles}
                        menuPortalTarget={document.body}
                        isLoading={produtosLoading}
                      />
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Quantidade (kg/vaca)</label>
                      <input
                        type="text"
                        value={ing.quantidade}
                        onChange={(e) => handleUpdateIngrediente(idx, "quantidade", e.target.value)}
                        placeholder="ex: 0,35 ou 350g"
                        style={{ ...styles.label, height: 44, border: "1px solid #e2e8f0", borderRadius: 10, padding: "0 12px", fontWeight: 600 }}
                      />
                      {produto?.unidade && <div style={styles.calcText}>Unidade: {produto.unidade}</div>}
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Preço Unit.</label>
                      <div style={{ height: 44, display: "flex", alignItems: "center", fontWeight: 700, color: "#374151" }}>
                        {precoUnit ? formatBRL(precoUnit) : "—"}
                      </div>
                      {precoUnit > 0 && <div style={styles.calcText}>por {produto?.unidade || "un"}</div>}
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Subtotal</label>
                      <div style={{ height: 44, display: "flex", alignItems: "center", fontWeight: 800, color: "#059669" }}>
                        {subtotal ? formatBRL(subtotal) : "—"}
                      </div>
                      {subtotalPorVaca > 0 && (
                        <div style={styles.calcText}>{formatBRL(subtotalPorVaca)}/vaca</div>
                      )}
                    </div>

                    <button style={styles.btnRemove} onClick={() => handleRemoveIngrediente(idx)} title="Remover">×</button>
                  </div>
                );
              })
            )}

            <button style={styles.btnAdd} onClick={handleAddIngrediente}>
              + Adicionar Ingrediente
            </button>

            {/* Observação */}
            <div style={{ marginTop: 16 }}>
              <label style={styles.label}>Observações (opcional)</label>
              <textarea
                value={form.observacao}
                onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))}
                placeholder="Notas sobre esta dieta..."
                style={{ width: "100%", minHeight: 80, border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, fontFamily: "inherit", resize: "vertical" }}
              />
            </div>
          </div>
        </div>

        {/* Footer com Resumo */}
        <div style={styles.footer}>
          <div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>
              {ICONS.dinheiro} Resumo Financeiro
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <div>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>Custo Total: </span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{formatBRL(custos.total)}</span>
              </div>
              <div>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>Custo/Vaca/Dia: </span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#059669" }}>{formatBRL(custos.porVaca)}</span>
              </div>
            </div>
          </div>

          <div>
            <button style={styles.btnSecondary} onClick={onCancel} disabled={saving}>
              Cancelar
            </button>
            <button style={styles.btnPrimary} onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar Dieta"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
