// src/pages/Animais/Plantel.jsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Select from "react-select";
import { supabase } from "../../lib/supabaseClient";
import { withFazendaId } from "../../lib/fazendaScope";
import { useFazenda } from "../../context/FazendaContext";
import { kvGet, kvSet } from "../../offline/localDB";
import FichaAnimal from "./FichaAnimal/FichaAnimal";
import ManejosPendentes from "./ManejosPendentes";
import "../../styles/tabelaModerna.css";

let MEMO_PLANTEL = { data: null, lastAt: 0 };

/* =========================
   Helpers de data
========================= */
function parseDateFlexible(s) {
  if (!s) return null;
  const str = String(s).trim();
  if (!str) return null;

  let m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const y = +m[1], mo = +m[2], d = +m[3];
    const dt = new Date(y, mo - 1, d);
    return Number.isFinite(+dt) ? dt : null;
  }

  m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) {
    const d = +m[1], mo = +m[2], y = +m[3];
    const dt = new Date(y, mo - 1, d);
    return Number.isFinite(+dt) ? dt : null;
  }

  return null;
}

function daysBetween(dateA, dateB) {
  if (!dateA || !dateB) return null;
  const ms = dateA.getTime() - dateB.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function idadeTexto(nascimento) {
  const dt = parseDateFlexible(nascimento);
  if (!dt) return "—";

  const hoje = new Date();
  let meses = (hoje.getFullYear() - dt.getFullYear()) * 12 + (hoje.getMonth() - dt.getMonth());
  if (hoje.getDate() < dt.getDate()) meses -= 1;
  if (meses < 0) meses = 0;

  const anos = Math.floor(meses / 12);
  const rem = meses % 12;
  return `${anos}a ${rem}m`;
}

function formatProducao(valor) {
  const num = Number(valor);
  if (!Number.isFinite(num)) return "—";
  return num.toFixed(1).replace(".", ",");
}

/* =========================
   Cálculos via repro_eventos
========================= */
function calcDel({ ultimoPartoISO, ultimaSecagemISO }) {
  const parto = parseDateFlexible(ultimoPartoISO);
  if (!parto) return null;

  const secagem = parseDateFlexible(ultimaSecagemISO);
  if (secagem && secagem.getTime() > parto.getTime()) return null;

  return daysBetween(new Date(), parto);
}

function calcSituacaoProdutiva({ sexo, mesesIdade, ultimoPartoISO, ultimaSecagemISO }) {
  if (sexo === "macho") return "não lactante";

  const del = calcDel({ ultimoPartoISO, ultimaSecagemISO });
  if (Number.isFinite(del)) return "lactante";

  const parto = parseDateFlexible(ultimoPartoISO);
  const secagem = parseDateFlexible(ultimaSecagemISO);

  if (secagem && (!parto || secagem.getTime() >= parto.getTime())) return "seca";
  if ((mesesIdade ?? 0) < 24) return "novilha";
  return "não lactante";
}

function calcSituacaoReprodutiva({ ultimaIAISO, ultimoPartoISO, ultimaSecagemISO }) {
  const ia = parseDateFlexible(ultimaIAISO);
  const parto = parseDateFlexible(ultimoPartoISO);
  const secagem = parseDateFlexible(ultimaSecagemISO);

  if (!ia) return "vazia";

  const temEventoDepoisDaIA = (parto && parto.getTime() > ia.getTime()) || (secagem && secagem.getTime() > ia.getTime());

  if (!temEventoDepoisDaIA) return "inseminada";
  if (parto && parto.getTime() > ia.getTime()) return "PEV / pós-parto";
  return "vazia";
}

/* =========================
   Helpers cache
========================= */
function normalizeReproResumo(obj) {
  if (!obj || typeof obj !== "object") return {};
  return obj;
}

function fallbackFromAnimal(a) {
  return {
    ultimaIAISO: a?.ultima_ia || a?.ultimaIAISO || null,
    ultimoPartoISO: a?.ultimo_parto || a?.ultimoPartoISO || null,
    ultimaSecagemISO: a?.ultima_secagem || a?.ultimaSecagemISO || null,
  };
}

/* =========================
   Componente Principal
========================= */
export default function Plantel({ isOnline = navigator.onLine }) {
  const { fazendaAtualId } = useFazenda();

  const CACHE_ANIMAIS = "cache:animais:list";
  const CACHE_FALLBACK = "cache:animais:plantel:v1";
  const CACHE_PLANTEL_BUNDLE = `cache:plantel:bundle:${fazendaAtualId || "none"}:v1`;
  const CACHE_REPRO_RESUMO = `cache:plantel:reproResumo:${fazendaAtualId || "none"}:v1`;

  const memoData = MEMO_PLANTEL.data || {};
  const [animais, setAnimais] = useState(() => memoData.animais ?? []);
  const [racaMap, setRacaMap] = useState(() => memoData.racaMap ?? {});
  const [lotes, setLotes] = useState(() => memoData.lotes ?? []);
  const [reproResumo, setReproResumo] = useState(() => memoData.reproResumo ?? {});

  const [carregando, setCarregando] = useState(() => !memoData.animais);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");
  const [offlineAviso, setOfflineAviso] = useState("");
  const [loteAviso, setLoteAviso] = useState("");

  // UI States
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const [hoveredColKey, setHoveredColKey] = useState(null);
  const [ultProducao, setUltProducao] = useState({});
  const [editingLoteId, setEditingLoteId] = useState(null);
  const [openPopoverKey, setOpenPopoverKey] = useState(null);
  const popoverRef = useRef(null);
  const triggerRefs = useRef({});
  const [popoverStyle, setPopoverStyle] = useState({ left: "50%", transform: "translateX(-50%)" });

  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [filtros, setFiltros] = useState({
    lote: "__ALL__",
    situacaoProdutiva: "__ALL__",
    situacaoReprodutiva: "__ALL__",
    origem: "__ALL__",
    animalRaca: "__ALL__",
    animalSexo: "__ALL__",
    animalBusca: "",
  });

  const LOTE_FIELD = "lote_id";
  const LOTE_TABLE = "lotes";

  // ficha
  const [animalSelecionado, setAnimalSelecionado] = useState(null);
  const abrirFichaAnimal = (animal) => setAnimalSelecionado(animal);
  const fecharFichaAnimal = () => setAnimalSelecionado(null);

  // memo
  useEffect(() => {
    MEMO_PLANTEL.data = { animais, lotes, racaMap, reproResumo };
    MEMO_PLANTEL.lastAt = Date.now();
  }, [animais, lotes, racaMap, reproResumo]);

  /* =========================
     Loaders (mantidos)
  ========================= */
  const carregarAnimais = useCallback(async () => {
    const res = await withFazendaId(supabase.from("animais").select("*"), fazendaAtualId)
      .eq("ativo", true)
      .order("numero", { ascending: true });

    if (res.error) throw res.error;
    const lista = Array.isArray(res.data) ? res.data : [];
    setAnimais(lista);
    return lista;
  }, [fazendaAtualId]);

  const carregarLotes = useCallback(async () => {
    const { data, error } = await withFazendaId(supabase.from(LOTE_TABLE).select("*"), fazendaAtualId)
      .order("id", { ascending: true });
    if (error) return [];
    const lista = Array.isArray(data) ? data : [];
    setLotes(lista);
    return lista;
  }, [LOTE_TABLE, fazendaAtualId]);

  const carregarRacas = useCallback(async () => {
    const { data, error } = await withFazendaId(supabase.from("racas").select("id, nome"), fazendaAtualId);
    if (error) throw error;

    const map = {};
    (data || []).forEach((r) => (map[r.id] = r.nome));
    setRacaMap(map);
    return map;
  }, [fazendaAtualId]);

  const carregarResumoRepro = useCallback(async (animalIds) => {
    if (!fazendaAtualId) return {};
    if (!Array.isArray(animalIds) || animalIds.length === 0) {
      setReproResumo({});
      await kvSet(CACHE_REPRO_RESUMO, {});
      return {};
    }

    const { data, error } = await withFazendaId(
      supabase.from("repro_eventos").select("animal_id,tipo,data_evento"),
      fazendaAtualId
    )
      .in("animal_id", animalIds)
      .in("tipo", ["IA", "PARTO", "SECAGEM"])
      .order("data_evento", { ascending: false })
      .limit(5000);

    if (error) {
      console.error("Erro ao carregar repro_eventos:", error);
      setReproResumo({});
      await kvSet(CACHE_REPRO_RESUMO, {});
      return {};
    }

    const rows = Array.isArray(data) ? data : [];
    const map = {};
    for (const ev of rows) {
      const id = ev?.animal_id;
      if (!id) continue;
      if (!map[id]) map[id] = { ultimaIAISO: null, ultimoPartoISO: null, ultimaSecagemISO: null };
      if (ev.tipo === "IA" && !map[id].ultimaIAISO) map[id].ultimaIAISO = ev.data_evento;
      if (ev.tipo === "PARTO" && !map[id].ultimoPartoISO) map[id].ultimoPartoISO = ev.data_evento;
      if (ev.tipo === "SECAGEM" && !map[id].ultimaSecagemISO) map[id].ultimaSecagemISO = ev.data_evento;
    }

    setReproResumo(map);
    await kvSet(CACHE_REPRO_RESUMO, map);
    return map;
  }, [fazendaAtualId, CACHE_REPRO_RESUMO]);

  const carregarDoCache = useCallback(async () => {
    const bundle = await kvGet(CACHE_PLANTEL_BUNDLE);
    if (bundle && typeof bundle === "object") {
      if (Array.isArray(bundle.animais)) setAnimais(bundle.animais.filter((a) => a?.ativo !== false));
      if (Array.isArray(bundle.lotes)) setLotes(bundle.lotes);
      if (bundle.racaMap && typeof bundle.racaMap === "object") setRacaMap(bundle.racaMap);
      if (bundle.reproResumo && typeof bundle.reproResumo === "object")
        setReproResumo(normalizeReproResumo(bundle.reproResumo));
      return true;
    }

    const prim = await kvGet(CACHE_ANIMAIS);
    const fallback = prim ? null : await kvGet(CACHE_FALLBACK);
    const cache = prim ?? fallback;

    if (cache) {
      if (Array.isArray(cache)) {
        setAnimais(cache.filter((a) => a?.ativo !== false));
      } else if (Array.isArray(cache.animais)) {
        setAnimais(cache.animais.filter((a) => a?.ativo !== false));
      }
    }

    const repro = await kvGet(CACHE_REPRO_RESUMO);
    if (repro && typeof repro === "object") setReproResumo(normalizeReproResumo(repro));

    return Boolean(cache || repro);
  }, [CACHE_ANIMAIS, CACHE_FALLBACK, CACHE_PLANTEL_BUNDLE, CACHE_REPRO_RESUMO]);

  useEffect(() => {
    if (!fazendaAtualId) {
      setCarregando(false);
      setAtualizando(false);
      return;
    }

    let ativo = true;

    (async () => {
      const memoFresh = MEMO_PLANTEL.data && Date.now() - MEMO_PLANTEL.lastAt < 30000;
      const hasData = Array.isArray(animais) && animais.length > 0;

      if (memoFresh && hasData) {
        setCarregando(false);
        setAtualizando(false);
        return;
      }

      setErro("");
      setLoteAviso("");
      setOfflineAviso("");

      if (hasData) setAtualizando(true);
      else setCarregando(true);

      try {
        if (!isOnline) {
          const ok = await carregarDoCache();
          if (!ok) {
            setOfflineAviso("Sem dados offline ainda. Conecte na internet uma vez para baixar os animais.");
          }
          return;
        }

        const [animaisData, lotesData, racasData] = await Promise.all([
          carregarAnimais(),
          carregarLotes(),
          carregarRacas(),
        ]);

        const ids = (animaisData || []).map((a) => a.id).filter(Boolean);
        const reproMap = await carregarResumoRepro(ids);

        await kvSet(CACHE_PLANTEL_BUNDLE, {
          animais: animaisData,
          lotes: lotesData,
          racaMap: racasData,
          reproResumo: reproMap,
          savedAt: Date.now(),
          fazenda_id: fazendaAtualId,
        });

        await kvSet(CACHE_ANIMAIS, animaisData);
      } catch (e) {
        console.error("Erro ao carregar plantel:", e);
        if (!ativo) return;
        const ok = await carregarDoCache();
        if (!ok)
          setErro("Não foi possível carregar os animais. Conecte na internet uma vez para baixar os dados.");
      } finally {
        if (ativo) {
          setCarregando(false);
          setAtualizando(false);
        }
      }
    })();

    return () => { ativo = false; };
  }, [fazendaAtualId, isOnline, carregarAnimais, carregarLotes, carregarRacas, carregarResumoRepro, carregarDoCache, CACHE_ANIMAIS, CACHE_PLANTEL_BUNDLE, animais]);

  /* =========================
     Lotes logic (mantido)
  ========================= */
  const loteOptions = useMemo(() => {
    const base = (lotes || []).map((l) => ({
      value: l.id,
      label: l.nome ?? l.descricao ?? l.titulo ?? l.label ?? String(l.id ?? "—"),
    }));
    return [{ value: null, label: "Sem lote" }, ...base];
  }, [lotes]);

  const lotesById = useMemo(() => {
    const map = {};
    (lotes || []).forEach((l) => {
      if (l?.id == null) return;
      map[l.id] = l.nome ?? l.descricao ?? l.titulo ?? l.label ?? String(l.id);
    });
    return map;
  }, [lotes]);

  const resolveSelectedLote = useCallback(
    (animal) => {
      const val = animal?.[LOTE_FIELD];
      if (val == null) return loteOptions.find((o) => o.value === null) || null;
      return loteOptions.find((o) => o.value === val) || null;
    },
    [loteOptions]
  );

  const resolveLoteLabel = useCallback(
    (animal) => {
      const val = animal?.[LOTE_FIELD];
      if (val == null || val === "") return "Sem lote";
      return lotesById[val] || "Sem lote";
    },
    [lotesById]
  );

  const closeLoteEdit = useCallback(() => setEditingLoteId(null), []);
  const handleLoteBlur = useCallback(() => setTimeout(() => setEditingLoteId(null), 150), []);

  const handleSetLote = useCallback(
    async (animal, option) => {
      if (!animal?.id) return;
      if (!fazendaAtualId) {
        setLoteAviso("Selecione uma fazenda antes de alterar o lote.");
        return;
      }
      if (!navigator.onLine) {
        setLoteAviso("Sem conexão. Conecte para alterar o lote.");
        return;
      }

      const valorNovo = option?.value ?? null;
      const valorAnterior = animal?.[LOTE_FIELD] ?? null;

      setAnimais((prev) => prev.map((a) => (a.id === animal.id ? { ...a, [LOTE_FIELD]: valorNovo } : a)));
      setLoteAviso("");

      try {
        const dataMudanca = new Date().toISOString().split("T")[0];
        const { error: histErr } = await supabase.from("animais_lote_historico").insert({
          animal_id: animal.id,
          lote_id: valorNovo,
          data_mudanca: dataMudanca,
          origem: "manual",
          fazenda_id: fazendaAtualId,
        });
        if (histErr) throw histErr;

        const { error: updErr } = await withFazendaId(
          supabase.from("animais").update({ [LOTE_FIELD]: valorNovo }),
          fazendaAtualId
        ).eq("id", animal.id);
        if (updErr) throw updErr;

        closeLoteEdit();
      } catch (e) {
        console.error(e);
        setAnimais((prev) => prev.map((a) => (a.id === animal.id ? { ...a, [LOTE_FIELD]: valorAnterior } : a)));
        setLoteAviso("Não foi possível atualizar o lote. Tente novamente.");
      }
    },
    [fazendaAtualId, closeLoteEdit]
  );

  /* =========================
     Produção (mantido)
  ========================= */
  useEffect(() => {
    let ativo = true;
    async function carregarUltimaProducao() {
      if (!isOnline) {
        if (ativo) setUltProducao({});
        return;
      }
      if (!Array.isArray(animais) || animais.length === 0) {
        if (ativo) setUltProducao({});
        return;
      }

      const ids = animais.map((a) => a.id).filter(Boolean);
      if (ids.length === 0) {
        if (ativo) setUltProducao({});
        return;
      }

      try {
        const { data, error } = await withFazendaId(
          supabase.from("medicoes_leite").select("*"),
          fazendaAtualId
        )
          .in("animal_id", ids)
          .order("data_medicao", { ascending: false })
          .limit(1200);

        if (error) {
          if (ativo) setUltProducao({});
          return;
        }

        const registros = Array.isArray(data) ? data : [];
        const mapa = {};
        for (const r of registros) {
          const id = r?.animal_id;
          if (!id || Object.prototype.hasOwnProperty.call(mapa, id)) continue;

          const totalRaw = r?.total ?? r?.total_litros ?? r?.litros_total;
          const total = Number(totalRaw);
          if (Number.isFinite(total)) {
            mapa[id] = total;
            continue;
          }

          const soma = ["manha", "tarde", "terceira", "noite"].reduce((acc, f) => {
            const v = Number(r?.[f] ?? 0);
            return Number.isFinite(v) ? acc + v : acc;
          }, 0);
          if (soma > 0) mapa[id] = soma;
        }

        if (ativo) setUltProducao(mapa);
      } catch {
        if (ativo) setUltProducao({});
      }
    }
    carregarUltimaProducao();
    return () => { ativo = false; };
  }, [animais, fazendaAtualId, isOnline]);

  /* =========================
     Resolvers DEL/Status
  ========================= */
  const resolveMesesIdade = useCallback((animal) => {
    const nasc = parseDateFlexible(animal?.nascimento);
    if (!nasc) return 0;
    const hoje = new Date();
    let meses = (hoje.getFullYear() - nasc.getFullYear()) * 12 + (hoje.getMonth() - nasc.getMonth());
    if (hoje.getDate() < nasc.getDate()) meses -= 1;
    return Math.max(0, meses);
  }, []);

  const resolveRepro = useCallback(
    (animal) => {
      const id = animal?.id;
      const fromMap = id ? reproResumo?.[id] : null;
      if (fromMap && (fromMap.ultimaIAISO || fromMap.ultimoPartoISO || fromMap.ultimaSecagemISO)) {
        return fromMap;
      }
      return fallbackFromAnimal(animal);
    },
    [reproResumo]
  );

  const resolveDelValor = useCallback((animal) => {
    const r = resolveRepro(animal);
    return calcDel(r);
  }, [resolveRepro]);

  const resolveSituacaoProdutiva = useCallback(
    (animal) => {
      const r = resolveRepro(animal);
      return calcSituacaoProdutiva({
        sexo: animal?.sexo,
        mesesIdade: resolveMesesIdade(animal),
        ultimoPartoISO: r.ultimoPartoISO,
        ultimaSecagemISO: r.ultimaSecagemISO,
      });
    },
    [resolveMesesIdade, resolveRepro]
  );

  const resolveStatusReprodutivo = useCallback(
    (animal) => {
      const r = resolveRepro(animal);
      return calcSituacaoReprodutiva(r);
    },
    [resolveRepro]
  );

  /* =========================
     Filtros & Ordenação
  ========================= */
  const linhas = useMemo(() => (Array.isArray(animais) ? animais : []), [animais]);

  const situacoesProdutivas = useMemo(() => {
    const set = new Set();
    linhas.forEach((a) => set.add(resolveSituacaoProdutiva(a)));
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [linhas, resolveSituacaoProdutiva]);

  const situacoesReprodutivas = useMemo(() => {
    const set = new Set();
    linhas.forEach((a) => set.add(resolveStatusReprodutivo(a)));
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [linhas, resolveStatusReprodutivo]);

  const allValue = "__ALL__";
  const semLoteValue = "__SEM_LOTE__";

  const origensDisponiveis = useMemo(() => {
    const set = new Set();
    linhas.forEach((a) => { if (a?.origem) set.add(a.origem); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [linhas]);

  const racasDisponiveis = useMemo(() => {
    const map = new Map();
    linhas.forEach((a) => {
      const id = a?.raca_id;
      if (id == null) return;
      const nome = racaMap[id];
      if (nome) map.set(id, nome);
    });
    return Array.from(map.entries()).map(([id, nome]) => ({ id, nome })).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [linhas, racaMap]);

  const sexosDisponiveis = useMemo(() => {
    const set = new Set();
    linhas.forEach((a) => { if (a?.sexo) set.add(a.sexo); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [linhas]);

  const situacaoProdutivaOptions = useMemo(
    () => [
      { value: allValue, label: "Todos" },
      { value: "lac", label: "LAC" },
      { value: "nao_lactante", label: "Não lactante" },
      ...situacoesProdutivas.filter((v) => !/lact|lac/i.test(v)).map((v) => ({ value: v, label: v })),
    ],
    [allValue, situacoesProdutivas]
  );

  const situacaoReprodutivaOptions = useMemo(
    () => [{ value: allValue, label: "Todos" }, ...situacoesReprodutivas.map((v) => ({ value: v, label: v }))],
    [allValue, situacoesReprodutivas]
  );

  const origemOptions = useMemo(
    () => [{ value: allValue, label: "Todos" }, ...origensDisponiveis.map((v) => ({ value: v, label: v }))],
    [allValue, origensDisponiveis]
  );

  const racaOptions = useMemo(
    () => [{ value: allValue, label: "Todas" }, ...racasDisponiveis.map((r) => ({ value: r.id, label: r.nome }))],
    [allValue, racasDisponiveis]
  );

  const sexoOptions = useMemo(
    () => [
      { value: allValue, label: "Todos" },
      ...sexosDisponiveis.map((s) => ({ value: s, label: s === "macho" ? "Macho" : s === "femea" ? "Fêmea" : s })),
    ],
    [allValue, sexosDisponiveis]
  );

  const loteOptionsFiltro = useMemo(
    () => [
      { value: allValue, label: "Todos" },
      { value: semLoteValue, label: "Sem lote" },
      ...(lotes || []).map((l) => ({ value: l.id, label: l.nome ?? l.descricao ?? l.titulo ?? l.label ?? String(l.id ?? "—") })),
    ],
    [allValue, lotes, semLoteValue]
  );

  const resolveOption = useCallback((options, value) => {
    const found = options.find((o) => String(o.value) === String(value));
    return found || options[0] || null;
  }, []);

  const selectStylesCompact = useMemo(
    () => ({
      container: (base) => ({ ...base, width: "100%", fontSize: 13 }),
      control: (base, state) => ({
        ...base,
        minHeight: 34,
        borderRadius: 8,
        fontWeight: 600,
        fontSize: 13,
        borderColor: state.isFocused ? "#3b82f6" : "#e2e8f0",
        boxShadow: state.isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.1)" : "none",
        backgroundColor: "#fff",
        cursor: "pointer",
        "&:hover": { borderColor: "#3b82f6" },
      }),
      valueContainer: (base) => ({ ...base, padding: "0 10px" }),
      indicatorsContainer: (base) => ({ ...base, height: 34 }),
      menu: (base) => ({ ...base, zIndex: 100, borderRadius: 8, overflow: "hidden", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }),
      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
      option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? "#eff6ff" : state.isFocused ? "#f8fafc" : "#fff",
        color: state.isSelected ? "#1e40af" : "#1e293b",
        fontWeight: state.isSelected ? 600 : 400,
        fontSize: 13,
        cursor: "pointer",
      }),
    }),
    []
  );

  const portalTarget = typeof document !== "undefined" ? document.body : null;

  useEffect(() => {
    if (!openPopoverKey) return;
    setPopoverStyle({ left: "50%", transform: "translateX(-50%)" });
    const updatePosition = () => {
      const triggerEl = triggerRefs.current?.[openPopoverKey];
      const popoverEl = popoverRef.current;
      if (!triggerEl || !popoverEl) return;
      const thRect = triggerEl.getBoundingClientRect();
      const popRect = popoverEl.getBoundingClientRect();
      let left = (thRect.width - popRect.width) / 2;
      const desiredLeft = thRect.left + left;
      const desiredRight = desiredLeft + popRect.width;
      if (desiredRight > window.innerWidth - 8) left = window.innerWidth - 8 - popRect.width - thRect.left;
      if (desiredLeft < 8) left = 8 - thRect.left;
      setPopoverStyle({ left: `${left}px`, transform: "translateX(0)" });
    };
    const raf = requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [openPopoverKey]);

  useEffect(() => {
    if (!openPopoverKey) return;
    const handleClickOutside = (event) => {
      const target = event.target;
      if (popoverRef.current?.contains(target)) return;
      if (target?.closest?.("[data-filter-trigger='true']")) return;
      setOpenPopoverKey(null);
    };
    const handleKeyDown = (event) => { if (event.key === "Escape") setOpenPopoverKey(null); };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openPopoverKey]);

  const handleColEnter = useCallback((colKey) => { setHoveredColKey(colKey); setHoveredRowId(null); }, []);
  const handleCellEnter = useCallback((rowId, colKey) => { setHoveredRowId(rowId); setHoveredColKey(colKey); }, []);

  const toggleSort = useCallback((key) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      if (prev.direction === "desc") return { key: null, direction: null };
      return { key, direction: "asc" };
    });
  }, []);

  const handleTogglePopover = useCallback((key) => { setOpenPopoverKey((prev) => (prev === key ? null : key)); }, []);

  const linhasFiltradas = useMemo(() => {
    const busca = filtros.animalBusca.trim().toLowerCase();
    return linhas.filter((a) => {
      if (filtros.lote !== allValue) {
        if (filtros.lote === semLoteValue) {
          if (a?.[LOTE_FIELD] != null && a?.[LOTE_FIELD] !== "") return false;
        } else if (String(a?.[LOTE_FIELD]) !== String(filtros.lote)) return false;
      }
      if (filtros.situacaoProdutiva !== allValue) {
        const sit = String(resolveSituacaoProdutiva(a) || "");
        const isLact = /lact|lac/i.test(sit);
        if (filtros.situacaoProdutiva === "lac" && !isLact) return false;
        if (filtros.situacaoProdutiva === "nao_lactante" && isLact) return false;
        if (filtros.situacaoProdutiva !== "lac" && filtros.situacaoProdutiva !== "nao_lactante" && sit !== filtros.situacaoProdutiva) return false;
      }
      if (filtros.situacaoReprodutiva !== allValue) {
        const sit = String(resolveStatusReprodutivo(a) || "");
        if (sit !== filtros.situacaoReprodutiva) return false;
      }
      if (filtros.origem !== allValue) {
        const orig = String(a?.origem || "");
        if (orig !== filtros.origem) return false;
      }
      if (filtros.animalRaca !== allValue) {
        if (String(a?.raca_id) !== String(filtros.animalRaca)) return false;
      }
      if (filtros.animalSexo !== allValue) {
        const sx = String(a?.sexo || "");
        if (sx !== filtros.animalSexo) return false;
      }
      if (busca) {
        const numero = String(a?.numero || "").toLowerCase();
        const brinco = String(a?.brinco || "").toLowerCase();
        const nome = String(a?.nome || "").toLowerCase();
        if (!numero.includes(busca) && !brinco.includes(busca) && !nome.includes(busca)) return false;
      }
      return true;
    });
  }, [linhas, filtros, allValue, semLoteValue, resolveSituacaoProdutiva, resolveStatusReprodutivo]);

  const linhasOrdenadas = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return linhasFiltradas;
    const sorted = [...linhasFiltradas];
    const factor = sortConfig.direction === "asc" ? 1 : -1;
    const compareNumber = (a, b) => {
      if (!Number.isFinite(a) && !Number.isFinite(b)) return 0;
      if (!Number.isFinite(a)) return 1;
      if (!Number.isFinite(b)) return -1;
      return a - b;
    };
    sorted.sort((a, b) => {
      if (sortConfig.key === "producao") {
        const aSit = String(resolveSituacaoProdutiva(a) || "");
        const bSit = String(resolveSituacaoProdutiva(b) || "");
        const aIsLact = /lact|lac/i.test(aSit);
        const bIsLact = /lact|lac/i.test(bSit);
        const aVal = aIsLact ? Number(ultProducao[a.id]) : null;
        const bVal = bIsLact ? Number(ultProducao[b.id]) : null;
        return compareNumber(aVal, bVal) * factor;
      }
      if (sortConfig.key === "del") {
        const aVal = resolveDelValor(a);
        const bVal = resolveDelValor(b);
        return compareNumber(aVal, bVal) * factor;
      }
      if (sortConfig.key === "animal") {
        const aNum = Number(a?.numero);
        const bNum = Number(b?.numero);
        if (Number.isFinite(aNum) && Number.isFinite(bNum)) return (aNum - bNum) * factor;
        return String(a?.numero || "").localeCompare(String(b?.numero || "")) * factor;
      }
      return 0;
    });
    return sorted;
  }, [linhasFiltradas, sortConfig, ultProducao, resolveSituacaoProdutiva, resolveDelValor]);

  const resumo = useMemo(() => {
    const total = linhasOrdenadas.length;
    const somas = linhasOrdenadas.reduce((acc, a) => {
      const sitProd = String(resolveSituacaoProdutiva(a) || "");
      const isLact = /lact|lac/i.test(sitProd);
      if (!isLact) return acc;
      const valor = Number(ultProducao[a?.id]);
      if (!Number.isFinite(valor)) return acc;
      return { soma: acc.soma + valor, qtd: acc.qtd + 1 };
    }, { soma: 0, qtd: 0 });
    const media = somas.qtd > 0 ? somas.soma / somas.qtd : null;

    const delSomas = linhasOrdenadas.reduce((acc, a) => {
      const sitProd = String(resolveSituacaoProdutiva(a) || "");
      const isLact = /lact|lac/i.test(sitProd);
      if (!isLact) return acc;
      const del = resolveDelValor(a);
      if (!Number.isFinite(del)) return acc;
      return { soma: acc.soma + del, qtd: acc.qtd + 1 };
    }, { soma: 0, qtd: 0 });
    const mediaDel = delSomas.qtd > 0 ? delSomas.soma / delSomas.qtd : null;

    return { total, media, mediaDel };
  }, [linhasOrdenadas, ultProducao, resolveSituacaoProdutiva, resolveDelValor]);

  const hasAnimais = linhasOrdenadas.length > 0;

  // Estilos modernos
  const styles = {
    page: {
      position: "relative",
      backgroundColor: "transparent",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    },
    container: { width: "100%" },
    manejosSection: {
      marginBottom: "24px",
      overflow: "visible",
      borderRadius: 0,
      border: "none",
      boxShadow: "none",
      backgroundColor: "transparent",
    },
    tableSection: {
      overflow: "visible",
      borderRadius: 0,
      border: "none",
      boxShadow: "none",
      backgroundColor: "transparent",
    },
    tableContainer: { overflowX: "auto" },
    table: {
      width: "100%",
      borderCollapse: "separate",
      borderSpacing: 0,
      fontSize: "14px",
      tableLayout: "fixed",
      minWidth: 1100,
    },
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
      userSelect: "none",
    },
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
    tr: { transition: "background-color 0.15s ease", cursor: "default" },
    trHover: { backgroundColor: "#f8fafc" },
    colHover: { backgroundColor: "#f1f5f9" },
    cellHover: { backgroundColor: "#e2e8f0" },
    thButton: { background: "transparent", border: "none", padding: 0, margin: 0, font: "inherit", color: "inherit", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" },
    popover: { position: "absolute", top: "calc(100% + 8px)", zIndex: 50, backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", minWidth: "280px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" },
    filterLabel: { display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "12px" },
    filterInput: { padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "13px", outline: "none", transition: "all 0.2s", "&:focus": { borderColor: "#3b82f6", boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)" } },
    pill: { display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: "9999px", fontSize: "12px", fontWeight: 600, lineHeight: 1 },
    pillOk: { backgroundColor: "#dcfce7", color: "#166534" },
    pillMute: { backgroundColor: "#f1f5f9", color: "#64748b" },
    pillInfo: { backgroundColor: "#dbeafe", color: "#1e40af" },
    pillWarn: { backgroundColor: "#fef3c7", color: "#92400e" },
    animalCell: { display: "flex", alignItems: "center", gap: "10px" },
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
    animalInfo: { display: "flex", flexDirection: "column", gap: "1px", minWidth: 0 },
    animalTitle: { fontWeight: 700, color: "#0f172a", fontSize: "14px", lineHeight: 1.1 },
    animalSub: { fontSize: "12.5px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px", lineHeight: 1.1 },
    dot: { color: "#cbd5e1" },
    num: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontWeight: 600 },
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
    summaryRow: { backgroundColor: "#f8fafc", borderTop: "2px solid #e2e8f0" },
    summaryContent: { display: "flex", gap: "32px", padding: "16px", fontSize: "13px", color: "#475569", fontWeight: 500 },
    summaryHighlight: { color: "#0f172a", fontWeight: 700 },
    alert: { padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px", fontWeight: 500 },
    alertDanger: { backgroundColor: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca" },
    alertWarn: { backgroundColor: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" },
    loading: { padding: "24px", textAlign: "center", color: "#64748b", fontSize: "14px" },
    loteBtn: { width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", height: "32px", padding: "0 12px", cursor: "pointer", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", border: "1px solid transparent" },
  };

  const getPillStyle = (type, value) => {
    const v = String(value).toLowerCase();
    if (type === "prod") {
      if (v.includes("lact")) return styles.pillOk;
      if (v.includes("seca")) return styles.pillWarn;
      return styles.pillMute;
    }
    if (type === "repro") {
      if (v.includes("pev")) return styles.pillInfo;
      if (v.includes("vaz")) return styles.pillMute;
      return styles.pillInfo;
    }
    return styles.pillInfo;
  };

  return (
    <section style={styles.page}>
      <div style={styles.container}>
        {erro && <div style={{...styles.alert, ...styles.alertDanger}}>{erro}</div>}
        {loteAviso && <div style={{...styles.alert, ...styles.alertWarn}}>{loteAviso}</div>}
        {offlineAviso && <div style={{...styles.alert, backgroundColor: "#dbeafe", color: "#1e40af", border: "1px solid #bfdbfe"}}>{offlineAviso}</div>}

        <div style={styles.manejosSection}>
          <ManejosPendentes />
        </div>

        {atualizando && hasAnimais && (
          <div style={{padding: "0 24px 16px", fontSize: "13px", color: "#64748b"}}>
            Atualizando animais...
          </div>
        )}

        <div style={styles.tableSection}>
          <div style={styles.tableContainer}>
            <table style={styles.table} onMouseLeave={() => { setHoveredRowId(null); setHoveredColKey(null); }}>
              <colgroup>
                <col style={{ width: "22%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "8%" }} />
              </colgroup>

              <thead>
                <tr>
                  {[
                    { key: "animal", label: "Animal", sortable: true },
                    { key: "lote", label: "Lote", filterable: true },
                    { key: "sitprod", label: "Situação Produtiva", filterable: true },
                    { key: "sitreprod", label: "Situação Reprodutiva", filterable: true },
                    { key: "producao", label: "Última Produção", sortable: true, align: "right" },
                    { key: "del", label: "DEL", sortable: true, align: "right" },
                    { key: "origem", label: "Origem" },
                    { key: "acoes", label: "Ações", align: "center" },
                  ].map((col) => (
                    <th
                      key={col.key}
                      style={{...styles.th, textAlign: col.align || "left"}}
                      onMouseEnter={() => handleColEnter(col.key)}
                      ref={(el) => { triggerRefs.current[col.key] = el; }}
                    >
                      {col.sortable || col.filterable ? (
                        <button
                          type="button"
                          data-filter-trigger="true"
                          onClick={() => {
                            if (col.sortable) toggleSort(col.key);
                            if (col.filterable) handleTogglePopover(col.key);
                          }}
                          style={styles.thButton}
                        >
                          <span>{col.label}</span>
                          {col.sortable && sortConfig.key === col.key && sortConfig.direction && (
                            <span style={{fontSize: "10px", opacity: 0.7}}>{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                          )}
                        </button>
                      ) : (
                        <span>{col.label}</span>
                      )}

                      {col.filterable && openPopoverKey === col.key && (
                        <div ref={popoverRef} style={styles.popover} onClick={(e) => e.stopPropagation()}>
                          {col.key === "animal" && (
                            <div>
                              <label style={styles.filterLabel}>
                                Raça
                                <Select menuPortalTarget={portalTarget} menuPosition="fixed" menuShouldBlockScroll styles={selectStylesCompact} options={racaOptions} value={resolveOption(racaOptions, filtros.animalRaca)} onChange={(opt) => setFiltros((prev) => ({ ...prev, animalRaca: opt?.value ?? allValue }))} />
                              </label>
                              <label style={styles.filterLabel}>
                                Sexo
                                <Select menuPortalTarget={portalTarget} menuPosition="fixed" menuShouldBlockScroll styles={selectStylesCompact} options={sexoOptions} value={resolveOption(sexoOptions, filtros.animalSexo)} onChange={(opt) => setFiltros((prev) => ({ ...prev, animalSexo: opt?.value ?? allValue }))} />
                              </label>
                              <label style={styles.filterLabel}>
                                Buscar
                                <input type="text" value={filtros.animalBusca} onChange={(ev) => setFiltros((prev) => ({ ...prev, animalBusca: ev.target.value }))} placeholder="Nº, brinco ou nome" style={styles.filterInput} />
                              </label>
                            </div>
                          )}
                          {col.key === "lote" && (
                            <label style={styles.filterLabel}>
                              Lote
                              <Select menuPortalTarget={portalTarget} menuPosition="fixed" menuShouldBlockScroll styles={selectStylesCompact} options={loteOptionsFiltro} value={resolveOption(loteOptionsFiltro, filtros.lote)} onChange={(opt) => setFiltros((prev) => ({ ...prev, lote: opt?.value ?? allValue }))} />
                            </label>
                          )}
                          {col.key === "sitprod" && (
                            <label style={styles.filterLabel}>
                              Situação
                              <Select menuPortalTarget={portalTarget} menuPosition="fixed" menuShouldBlockScroll styles={selectStylesCompact} options={situacaoProdutivaOptions} value={resolveOption(situacaoProdutivaOptions, filtros.situacaoProdutiva)} onChange={(opt) => setFiltros((prev) => ({ ...prev, situacaoProdutiva: opt?.value ?? allValue }))} />
                            </label>
                          )}
                          {col.key === "sitreprod" && (
                            <label style={styles.filterLabel}>
                              Situação
                              <Select menuPortalTarget={portalTarget} menuPosition="fixed" menuShouldBlockScroll styles={selectStylesCompact} options={situacaoReprodutivaOptions} value={resolveOption(situacaoReprodutivaOptions, filtros.situacaoReprodutiva)} onChange={(opt) => setFiltros((prev) => ({ ...prev, situacaoReprodutiva: opt?.value ?? allValue }))} />
                            </label>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {linhasOrdenadas.length === 0 && !carregando && (
                  <tr>
                    <td colSpan={8} style={{...styles.td, textAlign: "center", padding: "48px", color: "#64748b", fontWeight: 500}}>
                      Nenhum animal cadastrado ainda.
                    </td>
                  </tr>
                )}

                {linhasOrdenadas.map((a, idx) => {
                  const idade = idadeTexto(a.nascimento);
                  const racaNome = racaMap[a.raca_id] || "—";
                  const sexoLabel = a.sexo === "macho" ? "Macho" : a.sexo === "femea" ? "Fêmea" : a.sexo || "—";
                  const sitProd = resolveSituacaoProdutiva(a);
                  const sitReprod = resolveStatusReprodutivo(a);
                  const delValor = resolveDelValor(a);
                  const del = Number.isFinite(delValor) ? String(Math.round(delValor)) : "—";
                  const isLact = /lact|lac/i.test(String(sitProd || ""));
                  const litros = isLact ? ultProducao[a.id] : null;
                  const producaoTexto = isLact && Number.isFinite(Number(litros)) ? formatProducao(litros) : "—";
                  const loteSelecionado = resolveSelectedLote(a);
                  const isSemLote = !loteSelecionado || loteSelecionado.value == null;
                  const loteLabel = resolveLoteLabel(a);
                  const rowId = a.id ?? a.numero ?? a.brinco ?? idx;
                  const isHover = hoveredRowId === rowId;
                  const isColHover = (key) => hoveredColKey === key;

                  return (
                    <tr 
                      key={rowId} 
                      style={{
                        ...styles.tr, 
                        ...(isHover ? styles.trHover : {}),
                        ...(isColHover("animal") ? styles.colHover : {})
                      }}
                    >
                      <td 
                        style={{...styles.td, ...(isHover ? styles.trHover : {}), ...(isColHover("animal") ? styles.colHover : {}), ...(isHover && isColHover("animal") ? styles.cellHover : {})}}
                        onMouseEnter={() => handleCellEnter(rowId, "animal")}
                      >
                        <div style={styles.animalCell}>
                          <div style={styles.animalNum}>{a.numero ?? "—"}</div>
                          <div style={styles.animalInfo}>
                            <div style={styles.animalTitle}>{racaNome} <span style={styles.dot}>•</span> {sexoLabel}</div>
                            <div style={styles.animalSub}>
                              <span>{idade}</span>
                              <span style={styles.dot}>•</span>
                              <span>Brinco {a.brinco || "—"}</span>
          </div>
        </div>
                        </div>
                      </td>

                      <td 
                        style={{...styles.td, overflow: "visible", ...(isHover ? styles.trHover : {}), ...(isColHover("lote") ? styles.colHover : {}), ...(isHover && isColHover("lote") ? styles.cellHover : {})}}
                        onMouseEnter={() => handleCellEnter(rowId, "lote")}
                      >
                        {editingLoteId === a.id ? (
                          <div onKeyDown={(e) => { if (e.key === "Escape") closeLoteEdit(); }}>
                            <Select autoFocus menuIsOpen menuPortalTarget={portalTarget} menuPosition="fixed" menuShouldBlockScroll styles={selectStylesCompact} options={loteOptions} value={resolveSelectedLote(a)} placeholder="Selecionar lote…" onChange={(opt) => handleSetLote(a, opt)} onBlur={handleLoteBlur} isClearable />
                          </div>
                        ) : (
                          <button type="button" onClick={() => setEditingLoteId(a.id)} title="Clique para alterar" style={{...styles.pill, ...getPillStyle("prod", isSemLote ? "seca" : "lact"), ...styles.loteBtn}}>
                            {loteLabel}
                          </button>
                        )}
                      </td>

                      <td 
                        style={{...styles.td, textAlign: "center", ...(isHover ? styles.trHover : {}), ...(isColHover("sitprod") ? styles.colHover : {}), ...(isHover && isColHover("sitprod") ? styles.cellHover : {})}}
                        onMouseEnter={() => handleCellEnter(rowId, "sitprod")}
                      >
                        <span style={{...styles.pill, ...getPillStyle("prod", sitProd)}}>
                          {sitProd === "lactante" ? "LAC" : sitProd}
                        </span>
                      </td>

                      <td 
                        style={{...styles.td, textAlign: "center", ...(isHover ? styles.trHover : {}), ...(isColHover("sitreprod") ? styles.colHover : {}), ...(isHover && isColHover("sitreprod") ? styles.cellHover : {})}}
                        onMouseEnter={() => handleCellEnter(rowId, "sitreprod")}
                      >
                        <span style={{...styles.pill, ...getPillStyle("repro", sitReprod)}}>
                          {String(sitReprod).toUpperCase().slice(0, 3)}
                        </span>
                      </td>

                      <td 
                        style={{...styles.td, textAlign: "right", fontFamily: "ui-monospace, monospace", ...(isHover ? styles.trHover : {}), ...(isColHover("producao") ? styles.colHover : {}), ...(isHover && isColHover("producao") ? styles.cellHover : {})}}
                        onMouseEnter={() => handleCellEnter(rowId, "producao")}
                      >
                        {producaoTexto}
                      </td>

                      <td 
                        style={{...styles.td, textAlign: "right", fontWeight: 700, ...(isHover ? styles.trHover : {}), ...(isColHover("del") ? styles.colHover : {}), ...(isHover && isColHover("del") ? styles.cellHover : {})}}
                        onMouseEnter={() => handleCellEnter(rowId, "del")}
                      >
                        {del}
                      </td>

                      <td 
                        style={{...styles.td, fontWeight: 600, ...(isHover ? styles.trHover : {}), ...(isColHover("origem") ? styles.colHover : {}), ...(isHover && isColHover("origem") ? styles.cellHover : {})}}
                        onMouseEnter={() => handleCellEnter(rowId, "origem")}
                      >
                        {a.origem || "—"}
                      </td>

                      <td 
                        style={{...styles.td, textAlign: "center", ...(isHover ? styles.trHover : {}), ...(isColHover("acoes") ? styles.colHover : {}), ...(isHover && isColHover("acoes") ? styles.cellHover : {})}}
                        onMouseEnter={() => handleCellEnter(rowId, "acoes")}
                      >
                        <button onClick={() => abrirFichaAnimal(a)} style={styles.actionBtn}>Ficha</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {hasAnimais && (
                <tfoot>
                  <tr style={styles.summaryRow}>
                    <td colSpan={8}>
                      <div style={styles.summaryContent}>
                        <span>Total: <span style={styles.summaryHighlight}>{resumo.total}</span> animais</span>
                        <span>Média Produção (LAC): <span style={styles.summaryHighlight}>{Number.isFinite(resumo.media) ? formatProducao(resumo.media) : "—"}</span> L</span>
                        <span>Média DEL (LAC): <span style={styles.summaryHighlight}>{Number.isFinite(resumo.mediaDel) ? Math.round(resumo.mediaDel) : "—"}</span> dias</span>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {carregando && !hasAnimais && <div style={styles.loading}>Carregando plantel...</div>}
        </div>
      </div>

      {animalSelecionado && <FichaAnimal animal={animalSelecionado} onClose={fecharFichaAnimal} />}
    </section>
  );
}
