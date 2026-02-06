import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { X, Package, Pill, FlaskConical, Info, Box, Calendar, DollarSign, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useFazenda } from "../../context/FazendaContext";

/* ===================== DESIGN SYSTEM ===================== */
const theme = {
  colors: {
    slate: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
    },
    indigo: {
      50: "#eef2ff",
      100: "#e0e7ff",
      500: "#6366f1",
      600: "#4f46e5",
      700: "#4338ca",
    },
    success: "#059669",
    warning: "#d97706",
    danger: "#dc2626",
  },
  radius: { sm: "4px", md: "6px", lg: "10px" },
};

const rsStyles = {
  container: (b) => ({ ...b, width: "100%" }),
  control: (base, state) => ({
    ...base,
    minHeight: 40,
    borderRadius: theme.radius.md,
    borderColor: state.isFocused ? theme.colors.indigo[500] : theme.colors.slate[300],
    boxShadow: state.isFocused ? `0 0 0 1px ${theme.colors.indigo[500]}` : "none",
    fontSize: 13,
    background: state.isFocused ? "#fff" : theme.colors.slate[50],
    cursor: "pointer",
    "&:hover": { borderColor: theme.colors.slate[400] },
  }),
  valueContainer: (base) => ({ ...base, padding: "0 12px" }),
  placeholder: (base) => ({ ...base, color: theme.colors.slate[400] }),
  menuPortal: (b) => ({ ...b, zIndex: 99999 }),
  menu: (b) => ({
    ...b,
    zIndex: 99999,
    borderRadius: theme.radius.md,
    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
  }),
  option: (base, state) => ({
    ...base,
    fontSize: 13,
    background: state.isSelected
      ? theme.colors.indigo[50]
      : state.isFocused
      ? theme.colors.slate[50]
      : "transparent",
    color: state.isSelected ? theme.colors.indigo[700] : theme.colors.slate[700],
    fontWeight: state.isSelected ? 600 : 400,
    cursor: "pointer",
  }),
};

const GRUPOS_FALLBACK = [
  // === FARMÁCIA ===
  {
    value: "ANTIBIOTICO_PENICILINAS",
    categoria: "Farmácia",
    label: "Antibiótico — Penicilinas (β-lactâmicos)",
    tags: ["ANTIBIOTICO"],
  },
  {
    value: "ANTIBIOTICO_CEFALOSPORINAS",
    categoria: "Farmácia",
    label: "Antibiótico — Cefalosporinas (β-lactâmicos)",
    tags: ["ANTIBIOTICO"],
  },
  {
    value: "ANTIBIOTICO_TETRACICLINAS",
    categoria: "Farmácia",
    label: "Antibiótico — Tetraciclinas (ex: oxitetraciclina)",
    tags: ["ANTIBIOTICO"],
  },
  {
    value: "ANTIBIOTICO_MACROLIDEOS",
    categoria: "Farmácia",
    label: "Antibiótico — Macrolídeos (ex: tilosina/tulatromicina)",
    tags: ["ANTIBIOTICO"],
  },
  {
    value: "ANTIBIOTICO_AMINOGLICOSIDEOS",
    categoria: "Farmácia",
    label: "Antibiótico — Aminoglicosídeos (ex: gentamicina/neomicina)",
    tags: ["ANTIBIOTICO"],
  },
  {
    value: "ANTIBIOTICO_SULFONAMIDAS_TMP",
    categoria: "Farmácia",
    label: "Antibiótico — Sulfas + Trimetoprim",
    tags: ["ANTIBIOTICO"],
  },
  {
    value: "ANTIBIOTICO_FLUOROQUINOLONAS",
    categoria: "Farmácia",
    label: "Antibiótico — Fluoroquinolonas (ex: enrofloxacina)",
    tags: ["ANTIBIOTICO"],
  },
  {
    value: "ANTIBIOTICO_FENICOIS",
    categoria: "Farmácia",
    label: "Antibiótico — Fenicóis (ex: florfenicol)",
    tags: ["ANTIBIOTICO"],
  },
  {
    value: "ANTIBIOTICO_LINCOSAMIDAS",
    categoria: "Farmácia",
    label: "Antibiótico — Lincosamidas (ex: lincomicina)",
    tags: ["ANTIBIOTICO"],
  },
  {
    value: "ANTIBIOTICO_POLIMIXINAS",
    categoria: "Farmácia",
    label: "Antibiótico — Polimixinas (ex: polimixina B)",
    tags: ["ANTIBIOTICO"],
  },

  { value: "AINE_FLUNIXINA", categoria: "Farmácia", label: "Anti-inflamatório (AINE) — Flunixina", tags: ["AINE"] },
  { value: "AINE_MELOXICAM", categoria: "Farmácia", label: "Anti-inflamatório (AINE) — Meloxicam", tags: ["AINE"] },
  { value: "AINE_KETOPROFENO", categoria: "Farmácia", label: "Anti-inflamatório (AINE) — Cetoprofeno", tags: ["AINE"] },
  { value: "AINE_TOLFENAMICO", categoria: "Farmácia", label: "Anti-inflamatório (AINE) — Ácido tolfenâmico", tags: ["AINE"] },
  { value: "AINE_CARPROFENO", categoria: "Farmácia", label: "Anti-inflamatório (AINE) — Carprofeno", tags: ["AINE"] },
  { value: "CORTICOIDE_DEXAMETASONA", categoria: "Farmácia", label: "Corticoide — Dexametasona", tags: ["CORTICOIDE"] },
  { value: "CORTICOIDE_PREDNISOLONA", categoria: "Farmácia", label: "Corticoide — Prednisolona/Prednisona", tags: ["CORTICOIDE"] },
  { value: "CORTICOIDE_HIDROCORTISONA", categoria: "Farmácia", label: "Corticoide — Hidrocortisona", tags: ["CORTICOIDE"] },

  { value: "HORMONIO_PROGESTERONA", categoria: "Farmácia", label: "Hormônio — Progesterona (P4 / dispositivos)", tags: ["HORMONIO"] },
  { value: "HORMONIO_PROSTAGLANDINA", categoria: "Farmácia", label: "Hormônio — Prostaglandina (PGF2α / análogos)", tags: ["HORMONIO"] },
  { value: "HORMONIO_GNRH", categoria: "Farmácia", label: "Hormônio — GnRH (análogos)", tags: ["HORMONIO"] },
  { value: "HORMONIO_ECG", categoria: "Farmácia", label: "Hormônio — eCG", tags: ["HORMONIO"] },
  { value: "HORMONIO_HCG", categoria: "Farmácia", label: "Hormônio — hCG", tags: ["HORMONIO"] },
  { value: "HORMONIO_FSH", categoria: "Farmácia", label: "Hormônio — FSH", tags: ["HORMONIO"] },
  { value: "HORMONIO_ESTRADIOL_BENZOATO", categoria: "Farmácia", label: "Hormônio — Benzoato de Estradiol", tags: ["HORMONIO"] },
  { value: "HORMONIO_ESTRADIOL_CIPIONATO", categoria: "Farmácia", label: "Hormônio — Cipionato de Estradiol", tags: ["HORMONIO"] },
  { value: "HORMONIO_ESTRADIOL", categoria: "Farmácia", label: "Hormônio — Estradiol (outros ésteres)", tags: ["HORMONIO"] },
  { value: "HORMONIO_OXITOCINA", categoria: "Farmácia", label: "Hormônio — Ocitocina", tags: ["HORMONIO"] },

  { value: "ANTIPARASITARIO_ENDO", categoria: "Farmácia", label: "Antiparasitário — Endoparasiticida", tags: ["ANTIPARASITARIO"] },
  { value: "ANTIPARASITARIO_ECTO", categoria: "Farmácia", label: "Antiparasitário — Ectoparasiticida", tags: ["ANTIPARASITARIO"] },
  { value: "VITAMINAS_SUPLEMENTOS", categoria: "Farmácia", label: "Vitaminas / Suplementos injetáveis", tags: ["VITAMINAS"] },
  { value: "ANTISSEPTICO", categoria: "Farmácia", label: "Antisséptico / tópicos", tags: ["ANTISSEPTICO"] },
  { value: "ANESTESICO_SEDATIVO", categoria: "Farmácia", label: "Anestésico / Sedativo", tags: ["ANESTESICO"] },
  { value: "ANTIMICROBIANO_INTRA_MAMARIO", categoria: "Farmácia", label: "Intra-mamário (mastite) — grupo funcional", tags: ["INTRAMAMARIO"] },
  { value: "SOLUTION_FLUIDOTERAPIA", categoria: "Farmácia", label: "Soluções / fluidoterapia", tags: ["SOLUTION"] },

  // === COZINHA ===
  { value: "COZINHA_RACAO_CONCENTRADO", categoria: "Cozinha", label: "Ração / Concentrado", tags: [] },
  { value: "COZINHA_VOLUMOSO_SILAGEM", categoria: "Cozinha", label: "Volumoso / Silagem / Feno", tags: [] },
  { value: "COZINHA_MINERAL", categoria: "Cozinha", label: "Mineral / Mistura mineral", tags: [] },
  { value: "COZINHA_NUCLEO_PREMIX", categoria: "Cozinha", label: "Núcleo / Pré-mistura (premix)", tags: [] },
  { value: "COZINHA_ADITIVO", categoria: "Cozinha", label: "Aditivo (geral)", tags: [] },
  { value: "COZINHA_TAMPONANTE", categoria: "Cozinha", label: "Tamponante (ex: bicarbonato)", tags: [] },
  { value: "COZINHA_PROBIOTICO", categoria: "Cozinha", label: "Probiótico", tags: [] },
  { value: "COZINHA_PREBIOTICO", categoria: "Cozinha", label: "Prebiótico", tags: [] },
  { value: "COZINHA_LEVEDURA", categoria: "Cozinha", label: "Levedura", tags: [] },
  { value: "COZINHA_IONOFORO", categoria: "Cozinha", label: "Ionóforo (ex: monensina/lasalocida)", tags: [] },
  { value: "COZINHA_ANTIFUNGICO_CONSERVANTE", categoria: "Cozinha", label: "Conservante / antifúngico", tags: [] },
  { value: "COZINHA_ADS_MICOTOXINA", categoria: "Cozinha", label: "Adsorvente de micotoxina", tags: [] },
  { value: "COZINHA_UREIA_NNP", categoria: "Cozinha", label: "Ureia / NNP", tags: [] },
  { value: "COZINHA_SAIS", categoria: "Cozinha", label: "Sais (sal comum, calcário, etc.)", tags: [] },
  { value: "COZINHA_FITOTERAPICO_HOMEOPATICO", categoria: "Cozinha", label: "Fitoterápico / Homeopático", tags: [] },

  // === HIGIENE ===
  { value: "HIGIENE_DETERGENTE_ALCALINO", categoria: "Higiene e Limpeza", label: "Detergente alcalino", tags: [] },
  { value: "HIGIENE_DETERGENTE_ACIDO", categoria: "Higiene e Limpeza", label: "Detergente ácido", tags: [] },
  { value: "HIGIENE_SANITIZANTE_CLORADO", categoria: "Higiene e Limpeza", label: "Sanitizante clorado", tags: [] },
  { value: "HIGIENE_AMONIO_QUATERNARIO", categoria: "Higiene e Limpeza", label: "Amônio quaternário", tags: [] },
  { value: "HIGIENE_PEROXIDO_PERACETICO", categoria: "Higiene e Limpeza", label: "Peróxido / Ácido peracético", tags: [] },
  { value: "HIGIENE_IODOFORO", categoria: "Higiene e Limpeza", label: "Iodóforo", tags: [] },
  { value: "HIGIENE_CLOREXIDINA", categoria: "Higiene e Limpeza", label: "Clorexidina", tags: [] },
  { value: "HIGIENE_DEGRAXANTE", categoria: "Higiene e Limpeza", label: "Desengraxante", tags: [] },
  { value: "HIGIENE_DIP_PRE_POS", categoria: "Higiene e Limpeza", label: "Pré/Pós-dip (grupo funcional)", tags: [] },
  { value: "HIGIENE_DESINFETANTE_GERAL", categoria: "Higiene e Limpeza", label: "Desinfetante geral", tags: [] },

  // === REPRODUÇÃO ===
  { value: "REPRO_SEMEN", categoria: "Reprodução", label: "Sêmen (doses)", tags: [] },
  { value: "REPRO_EMBRIAO", categoria: "Reprodução", label: "Embrião", tags: [] },
  { value: "REPRO_NITROGENIO", categoria: "Reprodução", label: "Nitrogênio líquido", tags: [] },
  { value: "REPRO_MATERIAL_INSEMINACAO", categoria: "Reprodução", label: "Material de inseminação", tags: [] },
  { value: "REPRO_LUVAS_LUBRIFICANTE", categoria: "Reprodução", label: "Luvas / Lubrificantes", tags: [] },
  { value: "REPRO_MATERIAL_COLETA", categoria: "Reprodução", label: "Material de coleta / manejo repro", tags: [] },
];

const CATEGORIAS_GRUPO_EQ = new Set(["Farmácia", "Cozinha", "Reprodução", "Higiene", "Higiene e Limpeza"]);
const TAGS_POR_CODIGO = Object.fromEntries(GRUPOS_FALLBACK.map((grupo) => [grupo.value, grupo.tags || []]));
const TAGS_TIPO_FARMACIA = [
  { termos: ["Antibiótico"], tags: ["ANTIBIOTICO"] },
  { termos: ["Hormônio"], tags: ["HORMONIO"] },
  { termos: ["Anti-inflamatório"], tags: ["AINE", "CORTICOIDE"] },
  { termos: ["Antiparasitário"], tags: ["ANTIPARASITARIO"] },
  { termos: ["Vitaminas"], tags: ["VITAMINAS"] },
  { termos: ["Antisséptico"], tags: ["ANTISSEPTICO"] },
  { termos: ["Anestésico", "Sedativo"], tags: ["ANESTESICO"] },
  { termos: ["Intra-mamário"], tags: ["INTRAMAMARIO"] },
  { termos: ["Soluções", "Fluidoterapia"], tags: ["SOLUTION"] },
];

export default function ModalNovoProduto({ open, onClose, onSaved, initial = null }) {
  const { fazendaAtualId } = useFazenda();
  const isEdit = !!initial?.id;
  const [form, setForm] = useState(() => toForm(initial));
  const [loteEditId, setLoteEditId] = useState(null);
  const [gruposEq, setGruposEq] = useState([]);
  const [carregandoGrupos, setCarregandoGrupos] = useState(false);

  /* ===================== LOOKUPS ===================== */
  const categorias = useMemo(
    () => [
      { value: "Farmácia", label: "Farmácia", icon: Pill },
      { value: "Reprodução", label: "Reprodução", icon: FlaskConical },
      { value: "Higiene", label: "Higiene e Limpeza", icon: Package },
      { value: "Materiais", label: "Materiais Gerais", icon: Box },
      { value: "Cozinha", label: "Cozinha", icon: Package },
    ],
    []
  );

  const subtiposFarmacia = useMemo(
    () => [
      { value: "Antibiótico", label: "Antibiótico" },
      { value: "Anti-inflamatório", label: "Anti-inflamatório" },
      { value: "Vacina", label: "Vacina" },
      { value: "Antiparasitário", label: "Antiparasitário" },
      { value: "Hormônio", label: "Hormônio" },
      { value: "Outros", label: "Outros" },
    ],
    []
  );

  const subtiposRepro = useMemo(
    () => [
      { value: "Sêmen", label: "Sêmen (Palheta)" },
      { value: "Embrião", label: "Embrião" },
      { value: "Material", label: "Material de IA/Coleta" },
    ],
    []
  );

  const formasCompra = useMemo(
    () => [
      { value: "EMBALADO", label: "Embalado (frasco/saco/caixa/galão...)" },
      { value: "A_GRANEL", label: "A granel (peso/volume total)" },
    ],
    []
  );

  const unidadesMedida = useMemo(
    () => [
      { value: "un", label: "Unidade (un)" },
      { value: "dose", label: "Dose" },
      { value: "ml", label: "mL" },
      { value: "L", label: "Litro (L)" },
      { value: "g", label: "g" },
      { value: "kg", label: "kg" },
    ],
    []
  );

  const tiposEmbalagem = useMemo(
    () => [
      { value: "frasco", label: "Frasco" },
      { value: "ampola", label: "Ampola" },
      { value: "caixa", label: "Caixa" },
      { value: "saco", label: "Saco" },
      { value: "balde", label: "Balde" },
      { value: "galao", label: "Galão" },
      { value: "tonel", label: "Tonel" },
      { value: "unidade", label: "Unidade" },
      { value: "palheta", label: "Palheta" },
    ],
    []
  );

  /* ===================== OPEN / INIT ===================== */
  useEffect(() => {
    if (!open) return;
    setForm(toForm(initial));
    setLoteEditId(null);
  }, [initial, open]);

  useEffect(() => {
    setGruposEq(GRUPOS_FALLBACK);
    setCarregandoGrupos(false);
  }, []);

  useEffect(() => {
    let ativo = true;

    if (!open || !initial?.id || !fazendaAtualId) return undefined;

    const buscarLote = async (orderBy) => {
      const { data, error } = await supabase
        .from("estoque_lotes")
        .select("id, created_at, validade, quantidade_inicial, quantidade_atual, valor_total")
        .eq("produto_id", initial.id)
        .order(orderBy, { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (error) return { data: null, error };
      return { data, error: null };
    };

    const carregarUltimoLote = async () => {
      const primeiro = await buscarLote("created_at");
      const lote = primeiro.data;

      if (!ativo) return;
      if (!lote) {
        setLoteEditId(null);
        return;
      }

      const qtdEmbalagensDerivada = derivarQtdEmbalagens({ produto: initial, lote });

      setLoteEditId(lote.id || null);
      setForm((f) => ({
        ...f,
        quantidadeTotal: lote.quantidade_inicial !== null && lote.quantidade_inicial !== undefined ? String(lote.quantidade_inicial) : "",
        valorTotalEntrada: lote.valor_total !== null && lote.valor_total !== undefined ? String(lote.valor_total) : "",
        dataCompra: lote.created_at ? toISODateOnly(lote.created_at) : "",
        validadeEntrada: toISODateOnly(lote.validade),
        qtdEmbalagens: qtdEmbalagensDerivada,
      }));
    };

    carregarUltimoLote();

    return () => {
      ativo = false;
    };
  }, [open, initial?.id, fazendaAtualId, initial]);

  const menuPortalTarget = typeof document !== "undefined" ? document.body : null;

  const isFarmacia = form.categoria === "Farmácia";
  const isReproducao = form.categoria === "Reprodução";
  const isCozinha = form.categoria === "Cozinha";
  const isHigiene = form.categoria === "Higiene";
  const isAntibiotico = isFarmacia && form.subTipo === "Antibiótico";
  const mostraGrupoEquivalencia = isFarmacia || isReproducao || isCozinha || isHigiene;
  const categoriaGrupoEquivalencia = normalizarCategoriaGrupo(form.categoria);

  const gruposOptions = useMemo(() => {
    const listaBase = (gruposEq || []).filter((g) => (g.categoria || "") === categoriaGrupoEquivalencia);
    const tagsTipoFarmacia = isFarmacia ? obterTagsTipoFarmacia(form.subTipo) : [];

    if (isFarmacia && tagsTipoFarmacia.length > 0) {
      const filtrados = listaBase.filter((grupo) => (grupo.tags || []).some((tag) => tagsTipoFarmacia.includes(tag)));
      const listaFinal = filtrados.length > 0 ? filtrados : listaBase;
      return listaFinal.map((g) => ({ value: g.value, label: g.label }));
    }

    return listaBase.map((g) => ({ value: g.value, label: g.label }));
  }, [gruposEq, categoriaGrupoEquivalencia, isFarmacia, form.subTipo]);

  // Sugestões inteligentes (não trava nada)
  useEffect(() => {
    if (!open) return;

    if (!isEdit && isReproducao) {
      setForm((f) => ({
        ...f,
        subTipo: f.subTipo || "Sêmen",
        formaCompra: f.formaCompra || "EMBALADO",
        unidadeMedida: f.unidadeMedida || "dose",
        tipoEmbalagem: f.tipoEmbalagem || "palheta",
        tamanhoPorEmbalagem: f.tamanhoPorEmbalagem || "1",
      }));
    }

    if (!isEdit && isFarmacia && form.subTipo === "Hormônio") {
      setForm((f) => ({
        ...f,
        formaCompra: f.formaCompra || "EMBALADO",
        tipoEmbalagem: f.tipoEmbalagem || "frasco",
        unidadeMedida: f.unidadeMedida || "ml",
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, form.categoria, form.subTipo]);

  /* ===================== CALC ===================== */
  const totalCalculado = useMemo(() => {
    if (form.reutilizavel) {
      const qtdEmb = toNum(form.qtdEmbalagens);
      const usos = toNum(form.usosPorUnidade);
      return Math.max(0, qtdEmb * usos);
    }

    if (form.formaCompra === "A_GRANEL") {
      return Math.max(0, toNum(form.quantidadeTotal));
    }

    const qtd = toNum(form.qtdEmbalagens);
    const tam = toNum(form.tamanhoPorEmbalagem);
    return Math.max(0, qtd * tam);
  }, [
    form.formaCompra,
    form.qtdEmbalagens,
    form.tamanhoPorEmbalagem,
    form.quantidadeTotal,
    form.reutilizavel,
    form.usosPorUnidade,
  ]);

  const unidadeFinal = form.reutilizavel ? "uso" : form.unidadeMedida || "";

  /* ===================== VALIDAR ===================== */
  const validar = () => {
    if (!form.nomeComercial?.trim()) {
      alert("Informe o nome comercial.");
      return null;
    }
    if (isFarmacia && !form.subTipo) {
      alert("Selecione o tipo (Farmácia).");
      return null;
    }
    if (isReproducao && !form.subTipo) {
      alert("Selecione o tipo (Reprodução).");
      return null;
    }

    if (mostraGrupoEquivalencia && !form.grupoEquivalencia) {
      alert("Selecione o grupo funcional (equivalência).");
      return null;
    }

    if (!form.formaCompra) {
      alert("Selecione como este produto é comprado.");
      return null;
    }

    if (form.formaCompra === "EMBALADO") {
      if (!form.tipoEmbalagem) {
        alert("Selecione o tipo de embalagem (frasco/saco/caixa...).");
        return null;
      }
      if (!form.qtdEmbalagens || toNum(form.qtdEmbalagens) <= 0) {
        alert("Informe quantas embalagens foram compradas.");
        return null;
      }

      if (form.reutilizavel) {
        if (!form.usosPorUnidade || toNum(form.usosPorUnidade) < 2) {
          alert("Produto reutilizável: informe usos por unidade (mínimo 2).");
          return null;
        }
      } else {
        if (!form.unidadeMedida) {
          alert("Selecione a unidade de medida (mL/L/kg/un...).");
          return null;
        }
        if (!form.tamanhoPorEmbalagem || toNum(form.tamanhoPorEmbalagem) <= 0) {
          alert("Informe o tamanho por embalagem (ex: 50 mL, 25 kg).");
          return null;
        }
      }
    }

    if (form.formaCompra === "A_GRANEL") {
      if (!form.unidadeMedida) {
        alert("Selecione a unidade de medida (mL/L/kg/g...).");
        return null;
      }
      if (!form.quantidadeTotal || toNum(form.quantidadeTotal) <= 0) {
        alert("Informe a quantidade total comprada (a granel).");
        return null;
      }
    }

    if (isAntibiotico) {
      const leiteOk = form.semCarenciaLeite || toNum(form.carenciaLeiteDias) > 0;
      const carneOk = form.semCarenciaCarne || toNum(form.carenciaCarneDias) > 0;

      if (!leiteOk) {
        alert("Antibiótico: informe carência de leite (dias) ou marque 'Sem carência'.");
        return null;
      }
      if (!carneOk) {
        alert("Antibiótico: informe carência de carne (dias) ou marque 'Sem carência'.");
        return null;
      }
    }

    const normalizedForm = {
      ...form,
      categoria: form.categoria || "Cozinha",
      subTipo: isCozinha ? "" : form.subTipo,
    };

    return normalizeProdutoPayload(normalizedForm, isEdit, loteEditId);
  };

  if (!open) return null;

  /* ===================== RENDER ===================== */
  return (
    <div style={overlay} onClick={onClose}>
      <div style={modalContainer} onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div style={header}>
          <div style={headerLeft}>
            <div style={headerIcon}>
              <Package size={20} />
            </div>
            <div>
              <h2 style={headerTitle}>{isEdit ? "Editar Produto" : "Cadastrar Produto"}</h2>
              <p style={headerSubtitle}>Cadastre o produto e como ele é controlado (catálogo)</p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={btnClose}>
            <X size={20} />
          </button>
        </div>

        <div style={content}>
          {/* 1) IDENTIFICAÇÃO */}
          <section style={section}>
            <div style={sectionTitle}>Identificação</div>

            <div style={grid2}>
              <Field label="Nome Comercial *">
                <input
                  style={input}
                  value={form.nomeComercial}
                  onChange={(e) => setForm((f) => ({ ...f, nomeComercial: e.target.value }))}
                  placeholder="Ex: Benzoato de Estradiol, GnRH, CIDR, Palheta..."
                />
              </Field>

              <Field label="Categoria *">
                <Select
                  options={categorias}
                  value={categorias.find((c) => c.value === form.categoria) || null}
                  onChange={(opt) => {
                    setForm((f) => ({
                      ...f,
                      categoria: opt?.value || "",
                      subTipo: "",
                      grupoEquivalencia: "",
                      formaCompra: "",
                      tipoEmbalagem: "",
                      qtdEmbalagens: "",
                      tamanhoPorEmbalagem: "",
                      unidadeMedida: "",
                      quantidadeTotal: "",
                      reutilizavel: false,
                      usosPorUnidade: "3",
                      carenciaLeiteDias: "",
                      carenciaCarneDias: "",
                      semCarenciaLeite: false,
                      semCarenciaCarne: false,

                      // não persiste no catálogo
                      valorTotalEntrada: "",
                      validadeEntrada: "",
                      dataCompra: "",
                    }));
                  }}
                  styles={rsStyles}
                  placeholder="Selecione..."
                  menuPortalTarget={menuPortalTarget}
                />
              </Field>
            </div>

            {(isFarmacia || isReproducao) && (
              <div style={{ marginTop: 14 }}>
                <Field label={isFarmacia ? "Tipo (Farmácia) *" : "Tipo (Reprodução) *"}>
                  <Select
                    options={isFarmacia ? subtiposFarmacia : subtiposRepro}
                    value={(isFarmacia ? subtiposFarmacia : subtiposRepro).find((t) => t.value === form.subTipo) || null}
                    onChange={(opt) => {
                      const v = opt?.value || "";
                      setForm((f) => ({
                        ...f,
                        subTipo: v,
                        grupoEquivalencia: f.categoria === "Farmácia" ? "" : f.grupoEquivalencia,
                        ...(v !== "Antibiótico"
                          ? {
                              carenciaLeiteDias: "",
                              carenciaCarneDias: "",
                              semCarenciaLeite: false,
                              semCarenciaCarne: false,
                            }
                          : {}),
                      }));
                    }}
                    styles={rsStyles}
                    placeholder="Selecione..."
                    menuPortalTarget={menuPortalTarget}
                  />
                </Field>
              </div>
            )}

            {mostraGrupoEquivalencia && (
              <div style={{ marginTop: 14 }}>
                <Field label="Grupo funcional (equivalência) *">
                  <Select
                    value={gruposOptions.find((o) => o.value === form.grupoEquivalencia) || null}
                    onChange={(opt) => setForm((f) => ({ ...f, grupoEquivalencia: opt?.value || "" }))}
                    options={gruposOptions}
                    isLoading={carregandoGrupos}
                    styles={rsStyles}
                    placeholder="Selecione..."
                    menuPortalTarget={menuPortalTarget}
                  />
                  <span style={fieldHint}>
                    Ex.: PROSTAGLANDINA (Sincrucil/Estron/Inducil) — o consumo automático usa isso, não o nome comercial.
                    <br />
                    Selecione o grupo por equivalência funcional.
                  </span>
                </Field>
              </div>
            )}
          </section>

          {/* 2) COMO FOI COMPRADO */}
          <section style={section}>
            <div style={sectionTitle}>Compra e Embalagem</div>

            <div style={grid2}>
              <Field label="Como você compra esse produto? *">
                <Select
                  options={formasCompra}
                  value={formasCompra.find((x) => x.value === form.formaCompra) || null}
                  onChange={(opt) => {
                    const v = opt?.value || "";
                    setForm((f) => ({
                      ...f,
                      formaCompra: v,
                      tipoEmbalagem: "",
                      qtdEmbalagens: "",
                      tamanhoPorEmbalagem: "",
                      quantidadeTotal: "",
                      reutilizavel: v === "A_GRANEL" ? false : f.reutilizavel,
                    }));
                  }}
                  styles={rsStyles}
                  placeholder="Selecione..."
                  menuPortalTarget={menuPortalTarget}
                />
              </Field>

              <Field label="Unidade de medida (estoque) *">
                <Select
                  options={unidadesMedida}
                  value={unidadesMedida.find((u) => u.value === form.unidadeMedida) || null}
                  onChange={(opt) => setForm((f) => ({ ...f, unidadeMedida: opt?.value || "" }))}
                  styles={rsStyles}
                  placeholder="mL / L / kg / un..."
                  menuPortalTarget={menuPortalTarget}
                  isDisabled={form.reutilizavel}
                />
                {form.reutilizavel && <span style={fieldHint}>Reutilizável: o estoque passa a ser controlado por “uso”.</span>}
              </Field>
            </div>

            {form.formaCompra === "EMBALADO" && (
              <div style={{ marginTop: 14 }}>
                <div style={grid3}>
                  <Field label="Tipo de embalagem *">
                    <Select
                      options={tiposEmbalagem}
                      value={tiposEmbalagem.find((t) => t.value === form.tipoEmbalagem) || null}
                      onChange={(opt) => setForm((f) => ({ ...f, tipoEmbalagem: opt?.value || "" }))}
                      styles={rsStyles}
                      placeholder="Frasco / Saco / Caixa..."
                      menuPortalTarget={menuPortalTarget}
                    />
                  </Field>

                  <Field label="Quantas embalagens? *">
                    <input
                      style={input}
                      type="number"
                      value={form.qtdEmbalagens}
                      onChange={(e) => setForm((f) => ({ ...f, qtdEmbalagens: e.target.value }))}
                      placeholder="Ex: 5"
                    />
                  </Field>

                  {!form.reutilizavel ? (
                    <Field label="Tamanho por embalagem *">
                      <div style={flexRow}>
                        <input
                          style={{ ...input, flex: 1 }}
                          type="number"
                          value={form.tamanhoPorEmbalagem}
                          onChange={(e) => setForm((f) => ({ ...f, tamanhoPorEmbalagem: e.target.value }))}
                          placeholder="Ex: 50"
                        />
                        <div style={{ width: 110, marginLeft: 8 }}>
                          <Select
                            options={unidadesMedida.filter((u) => u.value !== "dose")}
                            value={unidadesMedida.find((u) => u.value === form.unidadeMedida) || null}
                            onChange={(opt) => setForm((f) => ({ ...f, unidadeMedida: opt?.value || "" }))}
                            styles={rsStyles}
                            placeholder="un"
                            menuPortalTarget={menuPortalTarget}
                            isDisabled={form.reutilizavel}
                          />
                        </div>
                      </div>
                      <span style={fieldHint}>Ex.: frasco 50 mL, saco 25 kg, caixa 12 un…</span>
                    </Field>
                  ) : (
                    <Field label="Usos por unidade *">
                      <input
                        style={input}
                        type="number"
                        min="2"
                        value={form.usosPorUnidade}
                        onChange={(e) => setForm((f) => ({ ...f, usosPorUnidade: e.target.value }))}
                        placeholder="Ex: 3"
                      />
                      <span style={fieldHint}>Ex.: 1 CIDR pode render 3 usos.</span>
                    </Field>
                  )}
                </div>

                <div style={{ marginTop: 12 }}>
                  <label style={checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={form.reutilizavel}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          reutilizavel: e.target.checked,
                          unidadeMedida: e.target.checked ? "" : f.unidadeMedida,
                        }))
                      }
                    />
                    <span>Produto reutilizável (dispositivo/implante)</span>
                  </label>
                </div>
              </div>
            )}

            {form.formaCompra === "A_GRANEL" && (
              <div style={{ marginTop: 14 }}>
                <div style={grid2}>
                  <Field label="Quantidade total comprada *">
                    <div style={flexRow}>
                      <input
                        style={{ ...input, flex: 1 }}
                        type="number"
                        value={form.quantidadeTotal}
                        onChange={(e) => setForm((f) => ({ ...f, quantidadeTotal: e.target.value }))}
                        placeholder="Ex: 120"
                      />
                      <div style={{ width: 160, marginLeft: 8 }}>
                        <Select
                          options={unidadesMedida.filter((u) => u.value !== "dose")}
                          value={unidadesMedida.find((u) => u.value === form.unidadeMedida) || null}
                          onChange={(opt) => setForm((f) => ({ ...f, unidadeMedida: opt?.value || "" }))}
                          styles={rsStyles}
                          placeholder="kg / L..."
                          menuPortalTarget={menuPortalTarget}
                        />
                      </div>
                    </div>
                    <span style={fieldHint}>Use “a granel” quando registra direto o total (sem frascos/sacos).</span>
                  </Field>

                  <div style={infoBox}>
                    <Info size={16} />
                    <div>Aqui você não precisa informar embalagem. Você registra o total comprado e pronto.</div>
                  </div>
                </div>
              </div>
            )}

            {!!form.formaCompra && (
              <div style={{ marginTop: 14 }}>
                <div style={calcBox}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Total calculado (referência do cadastro):</div>
                  <div style={{ fontSize: 14, color: theme.colors.indigo[900] }}>
                    <strong>{Number(totalCalculado || 0)}</strong> <strong>{unidadeFinal || ""}</strong>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 3) VALOR + VALIDADE (opcional -> vira LOTE se preenchido) */}
          <section style={section}>
            <div style={sectionTitle}>Valor e Validade (opcional)</div>

            <div style={grid3}>
              <Field label="Valor Total (R$)">
                <div style={{ position: "relative" }}>
                  <DollarSign size={16} style={{ position: "absolute", left: 10, top: 12, color: theme.colors.slate[400] }} />
                  <input
                    style={{ ...input, paddingLeft: 34 }}
                    type="number"
                    step="0.01"
                    value={form.valorTotalEntrada}
                    onChange={(e) => setForm((f) => ({ ...f, valorTotalEntrada: e.target.value }))}
                    placeholder="Ex: 350.00"
                  />
                </div>
              </Field>

              <Field label="Data da Compra">
                <div style={{ position: "relative" }}>
                  <Calendar size={16} style={{ position: "absolute", left: 10, top: 12, color: theme.colors.slate[400] }} />
                  <input
                    style={{ ...input, paddingLeft: 34 }}
                    type="date"
                    value={form.dataCompra}
                    onChange={(e) => setForm((f) => ({ ...f, dataCompra: e.target.value }))}
                  />
                </div>
              </Field>

              <Field label="Validade">
                <input
                  style={input}
                  type="date"
                  value={form.validadeEntrada}
                  onChange={(e) => setForm((f) => ({ ...f, validadeEntrada: e.target.value }))}
                />
              </Field>
            </div>

            <div style={{ marginTop: 10 }}>
              <div style={infoBox}>
                <Info size={16} />
                <div>
                  Se você preencher Valor/Data/Validade, isso vira uma <b>entrada de lote</b> no estoque. Se deixar em branco, cadastra só o catálogo.
                </div>
              </div>
            </div>
          </section>

          {/* 4) CARÊNCIAS (só se antibiótico) */}
          {isAntibiotico && (
            <section style={{ ...section, background: `${theme.colors.warning}08`, borderColor: `${theme.colors.warning}30` }}>
              <div style={{ ...sectionTitle, color: theme.colors.warning }}>
                <AlertCircle size={16} style={{ marginRight: 8 }} />
                Carências (Antibiótico)
              </div>

              <div style={grid2}>
                <CarenciaBox
                  titulo="Carência Leite"
                  dias={form.carenciaLeiteDias}
                  setDias={(v) => setForm((f) => ({ ...f, carenciaLeiteDias: v }))}
                  sem={form.semCarenciaLeite}
                  setSem={(v) => setForm((f) => ({ ...f, semCarenciaLeite: v, carenciaLeiteDias: v ? "" : f.carenciaLeiteDias }))}
                />
                <CarenciaBox
                  titulo="Carência Carne"
                  dias={form.carenciaCarneDias}
                  setDias={(v) => setForm((f) => ({ ...f, carenciaCarneDias: v }))}
                  sem={form.semCarenciaCarne}
                  setSem={(v) => setForm((f) => ({ ...f, semCarenciaCarne: v, carenciaCarneDias: v ? "" : f.carenciaCarneDias }))}
                />
              </div>

              <div style={{ marginTop: 10 }}>
                <div style={infoBox}>
                  <Info size={16} />
                  <div>Se não tiver carência, marque “Sem carência”. Caso tenha, informe os dias.</div>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* FOOTER */}
        <div style={footer}>
          <button type="button" style={btnSecondary} onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            style={btnPrimary}
            onClick={() => {
              const out = validar();
              if (out) onSaved?.(out);
            }}
          >
            {isEdit ? "Salvar Alterações" : "Cadastrar Produto"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===================== SUBCOMPONENTES ===================== */
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function CarenciaBox({ titulo, dias, setDias, sem, setSem }) {
  return (
    <div style={carenciaBox}>
      <div style={carenciaHeader}>{titulo}</div>
      <div style={carenciaRow}>
        <input
          style={{
            ...input,
            flex: 1,
            opacity: sem ? 0.55 : 1,
            background: sem ? "#fff" : theme.colors.slate[50],
          }}
          type="number"
          value={dias || ""}
          onChange={(e) => setDias(e.target.value)}
          disabled={sem}
          placeholder="Dias"
        />
        <label style={checkboxLabel}>
          <input type="checkbox" checked={!!sem} onChange={(e) => setSem(e.target.checked)} />
          <span>Sem carência</span>
        </label>
      </div>
    </div>
  );
}

/* ===================== HELPERS ===================== */
function pick(d, ...keys) {
  for (const k of keys) {
    if (d && d[k] !== undefined && d[k] !== null) return d[k];
  }
  return undefined;
}

function toNum(v) {
  if (v === null || v === undefined || v === "") return 0;
  const s = String(v).replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function toForm(initial) {
  const d = initial || {};
  const categoriaInicial = pick(d, "categoria");
  return {
    // identificação
    nomeComercial: pick(d, "nomeComercial", "nome_comercial") ?? "",
    categoria: categoriaInicial ? categoriaInicial : "Cozinha",
    subTipo: pick(d, "subTipo", "sub_tipo") ?? "",

    // compra
    formaCompra: pick(d, "formaCompra", "forma_compra") ?? "",
    tipoEmbalagem: pick(d, "tipoEmbalagem", "tipo_embalagem") ?? "",
    qtdEmbalagens: pick(d, "qtdEmbalagens") ?? "",
    tamanhoPorEmbalagem: pick(d, "tamanhoPorEmbalagem", "tamanho_por_embalagem") ?? "",
    unidadeMedida: pick(d, "unidadeMedida", "unidade_medida", "unidade") ?? "",

    // a granel (não persiste no catálogo)
    quantidadeTotal: pick(d, "quantidadeTotal") ?? "",

    // reutilização
    reutilizavel: !!pick(d, "reutilizavel"),
    usosPorUnidade: String(pick(d, "usosPorUnidade", "usos_por_unidade") ?? "3"),

    // valor/validade (vira lote se preenchido)
    valorTotalEntrada: "",
    validadeEntrada: "",
    dataCompra: "",

    // carências
    carenciaLeiteDias: pick(d, "carenciaLeiteDias", "carencia_leite") ?? "",
    carenciaCarneDias: pick(d, "carenciaCarneDias", "carencia_carne") ?? "",
    semCarenciaLeite: !!pick(d, "semCarenciaLeite", "sem_carencia_leite"),
    semCarenciaCarne: !!pick(d, "semCarenciaCarne", "sem_carencia_carne"),

    grupoEquivalencia: pick(d, "grupoEquivalencia", "grupo_equivalencia") ?? "",

    // ativo (edição)
    ativo: pick(d, "ativo"),
  };
}

function parseBR(value) {
  if (!value || typeof value !== "string") return null;
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const iso = `${yyyy}-${mm}-${dd}`;
  const dt = new Date(iso);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function toISODateOnly(value) {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const br = parseBR(value);
  if (br) return br.toISOString().slice(0, 10);
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
}

function derivarQtdEmbalagens({ produto, lote }) {
  if (!produto || !lote) return "";
  const qi = Number(lote.quantidade_inicial ?? 0);
  if (!Number.isFinite(qi) || qi <= 0) return "";

  if (produto.reutilizavel) {
    const usos = Number(produto.usos_por_unidade ?? produto.usosPorUnidade ?? 0);
    if (Number.isFinite(usos) && usos > 0) return String(Math.max(1, Math.round(qi / usos)));
    return "";
  }

  if (produto.forma_compra === "EMBALADO" || produto.formaCompra === "EMBALADO") {
    const tam = Number(produto.tamanho_por_embalagem ?? produto.tamanhoPorEmbalagem ?? 0);
    if (Number.isFinite(tam) && tam > 0) return String(Math.max(1, Math.round(qi / tam)));
  }

  return "";
}

function normalizarCategoriaGrupo(categoria) {
  if (categoria === "Higiene") return "Higiene e Limpeza";
  return categoria || "";
}

function obterTagsTipoFarmacia(tipoFarmacia) {
  if (!tipoFarmacia) return [];
  const match = TAGS_TIPO_FARMACIA.find((item) => item.termos.some((termo) => tipoFarmacia.includes(termo)));
  return match ? match.tags : [];
}

/**
 * ✅ Retorna payload do catálogo em snake_case.
 */
function normalizeProdutoPayload(f, isEdit, loteEditId) {
  let quantidadeEntrada = 0;
  if (f.formaCompra === "A_GRANEL") {
    quantidadeEntrada = Number(f.quantidadeTotal) || 0;
  } else if (f.formaCompra === "EMBALADO") {
    if (f.reutilizavel) {
      quantidadeEntrada = (Number(f.qtdEmbalagens) || 0) * (Number(f.usosPorUnidade) || 0);
    } else {
      quantidadeEntrada = (Number(f.qtdEmbalagens) || 0) * (Number(f.tamanhoPorEmbalagem) || 0);
    }
  }

  const categoriaFinal = String(f.categoria || "Cozinha").trim() || "Cozinha";
  const tipoEmbalagemFinal =
    f.formaCompra === "EMBALADO" ? String(f.tipoEmbalagem || "").trim() : null;
  const tamanhoPorEmbalagemFinal =
    f.formaCompra === "EMBALADO"
      ? f.reutilizavel
        ? Math.max(1, toNum(f.tamanhoPorEmbalagem || 1))
        : toNum(f.tamanhoPorEmbalagem)
      : null;
  const unidadeMedidaFinal = f.reutilizavel ? "uso" : String(f.unidadeMedida || "un").trim() || "un";
  const usosPorUnidadeFinal = f.reutilizavel ? toNum(f.usosPorUnidade) : null;
  const categoriaGrupo = normalizarCategoriaGrupo(f.categoria);
  const grupoEquivalenciaFinal = CATEGORIAS_GRUPO_EQ.has(categoriaGrupo)
    ? f.grupoEquivalencia && String(f.grupoEquivalencia).trim()
      ? String(f.grupoEquivalencia).trim()
      : null
    : null;

  return {
    nome_comercial: String(f.nomeComercial || "").trim(),
    categoria: categoriaFinal,
    sub_tipo: categoriaFinal === "Cozinha" ? null : f.subTipo || "",
    grupo_equivalencia: grupoEquivalenciaFinal,
    forma_compra: f.formaCompra || "",
    tipo_embalagem: tipoEmbalagemFinal,
    tamanho_por_embalagem: tamanhoPorEmbalagemFinal,
    unidade_medida: unidadeMedidaFinal,
    reutilizavel: !!f.reutilizavel,
    usos_por_unidade: f.reutilizavel ? Math.max(2, usosPorUnidadeFinal || 0) : null,
    carencia_leite: f.carenciaLeiteDias || "",
    carencia_carne: f.carenciaCarneDias || "",
    sem_carencia_leite: !!f.semCarenciaLeite,
    sem_carencia_carne: !!f.semCarenciaCarne,
    ativo: isEdit && f.ativo === false ? false : true,
    quantidade_total: quantidadeEntrada,
    total_calculado: quantidadeEntrada,
    data_compra: f.dataCompra || null,
    validade: f.validadeEntrada || null,
    valor_total: f.valorTotalEntrada !== "" ? Number(f.valorTotalEntrada) : null,
    _entrada: {
      quantidade: quantidadeEntrada,
      data_compra: f.dataCompra || null,
      validade: f.validadeEntrada || null,
      valor_total: f.valorTotalEntrada !== "" ? Number(f.valorTotalEntrada) : null,
      observacoes: null,
    },
    _loteEditId: loteEditId || null,
  };
}

/* ===================== ESTILOS ===================== */
const overlay = {
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  background: "rgba(15, 23, 42, 0.6)",
  backdropFilter: "blur(4px)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "20px",
};

const modalContainer = {
  width: "min(980px, 96vw)",
  maxHeight: "90vh",
  background: "#fff",
  borderRadius: theme.radius.lg,
  boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
  display: "flex",
  flexDirection: "column",
  border: `1px solid ${theme.colors.slate[200]}`,
  overflow: "hidden",
};

const header = {
  padding: "18px 22px",
  borderBottom: `1px solid ${theme.colors.slate[200]}`,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: theme.colors.slate[50],
};

const headerLeft = { display: "flex", alignItems: "center", gap: "14px" };
const headerIcon = {
  width: "40px",
  height: "40px",
  borderRadius: theme.radius.md,
  background: theme.colors.indigo[100],
  color: theme.colors.indigo[600],
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const headerTitle = { margin: 0, fontSize: "16px", fontWeight: 800, color: theme.colors.slate[900] };
const headerSubtitle = { margin: "4px 0 0 0", fontSize: "13px", color: theme.colors.slate[500], lineHeight: 1.35 };

const btnClose = {
  background: "transparent",
  border: "none",
  padding: "8px",
  borderRadius: theme.radius.md,
  cursor: "pointer",
  color: theme.colors.slate[500],
};

const content = {
  flex: 1,
  overflow: "auto",
  padding: "22px",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const section = {
  border: `1px solid ${theme.colors.slate[200]}`,
  borderRadius: theme.radius.lg,
  padding: "18px",
  background: "#fff",
};

const sectionTitle = {
  fontSize: "13px",
  fontWeight: 800,
  color: theme.colors.slate[800],
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: "14px",
  display: "flex",
  alignItems: "center",
};

const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" };
const grid3 = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" };

const input = {
  width: "100%",
  height: "40px",
  padding: "0 12px",
  borderRadius: theme.radius.md,
  border: `1px solid ${theme.colors.slate[300]}`,
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
  background: theme.colors.slate[50],
};

const labelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: 700,
  color: theme.colors.slate[700],
  marginBottom: "6px",
};

const flexRow = { display: "flex", alignItems: "center" };

const fieldHint = {
  fontSize: "11px",
  color: theme.colors.slate[500],
  marginTop: "4px",
  display: "block",
};

const infoBox = {
  gridColumn: "1 / -1",
  padding: "12px",
  background: "#fff",
  borderRadius: theme.radius.md,
  border: `1px solid ${theme.colors.indigo[200]}`,
  display: "flex",
  gap: "10px",
  alignItems: "center",
  fontSize: "13px",
  color: theme.colors.slate[600],
};

const calcBox = {
  padding: "14px",
  background: theme.colors.indigo[100],
  borderRadius: theme.radius.md,
  border: `1px solid ${theme.colors.indigo[200]}`,
  color: theme.colors.indigo[900],
};

const carenciaBox = {
  border: `1px solid ${theme.colors.slate[200]}`,
  borderRadius: theme.radius.md,
  padding: "14px",
  background: "#fff",
};

const carenciaHeader = { fontSize: "13px", fontWeight: 800, color: theme.colors.slate[800], marginBottom: "10px" };
const carenciaRow = { display: "flex", alignItems: "center", gap: "12px" };

const checkboxLabel = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "13px",
  color: theme.colors.slate[700],
  cursor: "pointer",
  userSelect: "none",
  whiteSpace: "nowrap",
};

const footer = {
  padding: "18px 22px",
  borderTop: `1px solid ${theme.colors.slate[200]}`,
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  background: "#fff",
};

const btnSecondary = {
  padding: "10px 18px",
  borderRadius: theme.radius.md,
  border: `1px solid ${theme.colors.slate[300]}`,
  background: "#fff",
  color: theme.colors.slate[700],
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
};

const btnPrimary = {
  padding: "10px 18px",
  borderRadius: theme.radius.md,
  border: "none",
  background: theme.colors.indigo[600],
  color: "#fff",
  fontSize: "13px",
  fontWeight: 800,
  cursor: "pointer",
};
