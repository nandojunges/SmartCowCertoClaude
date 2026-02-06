// src/Pages/Animais/CadastroAnimal.jsx
import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { supabase } from "../../lib/supabaseClient";
import { withFazendaId } from "../../lib/fazendaScope";
import { useFazenda } from "../../context/FazendaContext";
import { enqueue, kvGet, kvSet } from "../../offline/localDB";
import FichaComplementarAnimal from "./FichaComplementarAnimal";

/* ============================
   Helpers
============================ */
function formatarDataDigitada(valor) {
  const s = String(valor || "").replace(/\D/g, "").slice(0, 8);
  const dia = s.slice(0, 2);
  const mes = s.slice(2, 4);
  const ano = s.slice(4, 8);
  let out = [dia, mes, ano].filter(Boolean).join("/");

  if (out.length === 10) {
    const [d, m, a] = out.split("/").map(Number);
    const dt = new Date(a, (m || 1) - 1, d || 1);
    if (dt.getDate() !== d || dt.getMonth() !== m - 1 || dt.getFullYear() !== a) {
      out = "";
    }
  }
  return out;
}

function calcularIdadeECategoria(nascimento, sexo) {
  if (!nascimento || nascimento.length !== 10) return { idade: "", categoria: "", meses: 0 };

  const [dia, mes, ano] = nascimento.split("/").map(Number);
  const nascDate = new Date(ano, mes - 1, dia);
  if (Number.isNaN(+nascDate)) return { idade: "", categoria: "", meses: 0 };

  const diffMs = Date.now() - nascDate.getTime();
  const meses = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));
  const idade = `${Math.floor(meses / 12)}a ${meses % 12}m`;

  let categoria = "";
  if (meses < 2) categoria = "Bezerro(a)";
  else if (meses < 12) categoria = "Novilho(a)";
  else if (meses < 24) categoria = sexo === "macho" ? "Touro jovem" : "Novilha";
  else categoria = sexo === "macho" ? "Touro" : "Vaca adulta";

  return { idade, categoria, meses };
}

function maskMoedaBR(v) {
  let n = String(v || "").replace(/\D/g, "");
  if (!n) return "";
  n = (parseInt(n, 10) / 100).toFixed(2);
  const [int, dec] = n.split(".");
  const intComPontos = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${intComPontos},${dec}`;
}

function parseBRtoDate(br) {
  if (!br || br.length !== 10) return null;
  const [d, m, a] = br.split("/").map(Number);
  const dt = new Date(a, m - 1, d);
  return Number.isNaN(+dt) ? null : dt;
}

function dataBRParaISO(br) {
  const dt = parseBRtoDate(br);
  if (!dt) return null;
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function obterUltimaDataValidaBR(lista) {
  const datas = (lista || [])
    .map(parseBRtoDate)
    .filter(Boolean)
    .sort((a, b) => a.getTime() - b.getTime());
  if (!datas.length) return "";
  const dt = datas[datas.length - 1];
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yyyy = dt.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function diasEntre(br) {
  const dt = parseBRtoDate(br);
  if (!dt) return null;
  const hoje = new Date();
  const diffMs = hoje.getTime() - dt.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function previsaoPartoBR(ultimaIABR) {
  const dt = parseBRtoDate(ultimaIABR);
  if (!dt) return "";
  const previsao = new Date(dt);
  previsao.setDate(previsao.getDate() + 283);
  const dd = String(previsao.getDate()).padStart(2, "0");
  const mm = String(previsao.getMonth() + 1).padStart(2, "0");
  const yyyy = previsao.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function gerarUUID() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch (error) {
    console.warn("Falha ao gerar UUID nativo:", error);
  }
  const randomPart = () => Math.random().toString(16).slice(2, 10);
  return `${Date.now().toString(16)}-${randomPart()}-${randomPart()}`;
}

/* ============================
   Componente principal
============================ */
export default function CadastroAnimal() {
  const { fazendaAtualId } = useFazenda();
  const CACHE_KEY = "cache:animais:list";

  const [mostrarFichaComplementar, setMostrarFichaComplementar] = useState(false);
  const [userId, setUserId] = useState(null);

  // ✅ após salvar o animal, este id habilita autosave de eventos pela ficha
  const [animalIdFicha, setAnimalIdFicha] = useState(null);

  // básicos
  const [numero, setNumero] = useState("1");
  const [autoNumero, setAutoNumero] = useState(true);
  const [brinco, setBrinco] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [sexo, setSexo] = useState("");
  const [raca, setRaca] = useState("");
  const [novaRaca, setNovaRaca] = useState("");
  const [racasBanco, setRacasBanco] = useState([]);

  // complementar
  const [pai, setPai] = useState("");
  const [mae, setMae] = useState("");
  const [inseminacoesAnteriores, setInseminacoesAnteriores] = useState([""]);
  const [partosAnteriores, setPartosAnteriores] = useState([""]);
  const [secagensAnteriores, setSecagensAnteriores] = useState([""]);

  // origem
  const [origem, setOrigem] = useState("propriedade");
  const [valorCompra, setValorCompra] = useState("");
  const [dataEntrada, setDataEntrada] = useState("");

  // derivados (somente UI)
  const [idade, setIdade] = useState("");
  const [categoria, setCategoria] = useState("");
  const [mesesIdade, setMesesIdade] = useState(0);

  // feedback
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [mensagemErro, setMensagemErro] = useState("");

  const sexoOptions = [
    { value: "femea", label: "Fêmea" },
    { value: "macho", label: "Macho" },
  ];
  const racaOptions = racasBanco.map((r) => ({ value: r.id, label: r.nome }));

  const racaSelecionadaLabel = useMemo(
    () => racaOptions.find((opt) => opt.value === raca)?.label || "",
    [racaOptions, raca]
  );

  const origemOptions = [
    { value: "propriedade", label: "Nascido na propriedade" },
    { value: "comprado", label: "Comprado" },
    { value: "doacao", label: "Doação" },
  ];

  const atualizarCachePlantel = async (novoAnimal) => {
    const cache = await kvGet(CACHE_KEY);
    const animaisCache = Array.isArray(cache)
      ? [...cache]
      : Array.isArray(cache?.animais)
      ? [...cache.animais]
      : [];
    const idx = animaisCache.findIndex((animal) => animal?.id === novoAnimal?.id);
    if (idx >= 0) {
      animaisCache[idx] = { ...animaisCache[idx], ...novoAnimal };
    } else {
      animaisCache.push(novoAnimal);
    }
    animaisCache.sort((a, b) => Number(a.numero) - Number(b.numero));
    await kvSet(CACHE_KEY, animaisCache);
  };

  const atualizarDataLista = (lista, setLista, index, novoValorBruto) => {
    const formatada = formatarDataDigitada(novoValorBruto);
    const nova = [...lista];
    nova[index] = formatada;
    setLista(nova);
  };

  const limparCamposVazios = (lista, setLista) => {
    const preenchidos = lista.filter((d) => d && d.trim() !== "");
    if (preenchidos.length === 0) setLista([""]);
    else setLista([...preenchidos, ""]);
  };

  const adicionarCampoSeUltimoPreenchido = (lista, setLista) => {
    const ultimo = lista[lista.length - 1];
    if (ultimo && ultimo.length === 10) setLista([...lista, ""]);
  };

  const ultimaIAResumo = useMemo(
    () => obterUltimaDataValidaBR(inseminacoesAnteriores),
    [inseminacoesAnteriores]
  );
  const ultimoPartoResumo = useMemo(
    () => obterUltimaDataValidaBR(partosAnteriores),
    [partosAnteriores]
  );
  const ultimaSecagemResumo = useMemo(
    () => obterUltimaDataValidaBR(secagensAnteriores),
    [secagensAnteriores]
  );

  const prevPartoBR = useMemo(() => previsaoPartoBR(ultimaIAResumo), [ultimaIAResumo]);

  // idade/categoria automáticas (UI)
  useEffect(() => {
    const { idade: id, categoria: cat, meses } = calcularIdadeECategoria(nascimento, sexo);
    setIdade(id);
    setCategoria(cat);
    setMesesIdade(meses);
  }, [nascimento, sexo]);

  // ✅ computa DEL só para mostrar (não grava em animais)
  const delResumo = useMemo(() => {
    // DEL = dias desde o último parto, somente se ainda não secou depois do parto
    const dtParto = parseBRtoDate(ultimoPartoResumo);
    const dtSec = parseBRtoDate(ultimaSecagemResumo);
    if (!dtParto) return null;
    if (dtSec && dtSec.getTime() > dtParto.getTime()) return null;
    return diasEntre(ultimoPartoResumo);
  }, [ultimoPartoResumo, ultimaSecagemResumo]);

  async function carregarProximoNumero() {
    if (!fazendaAtualId) return;
    const { data, error } = await withFazendaId(
      supabase.from("animais").select("numero"),
      fazendaAtualId
    )
      .order("numero", { ascending: false })
      .limit(1);
    if (error) return;
    const proximo =
      data && data.length > 0 && data[0].numero != null ? data[0].numero + 1 : 1;
    setNumero(String(proximo));
  }

  useEffect(() => {
    if (autoNumero) carregarProximoNumero();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoNumero, fazendaAtualId]);

  useEffect(() => {
    let ativo = true;
    const carregarUsuario = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.warn("Erro ao obter usuário autenticado:", error);
        return;
      }
      if (!ativo) return;
      setUserId(data?.user?.id || null);
    };
    carregarUsuario();
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    async function carregarRacas() {
      if (!fazendaAtualId) {
        setRacasBanco([]);
        return;
      }
      const { data, error } = await withFazendaId(
        supabase.from("racas").select("id, nome"),
        fazendaAtualId
      ).order("nome", { ascending: true });
      if (!error && data) setRacasBanco(data);
    }
    carregarRacas();
  }, [fazendaAtualId]);

  /* ========= ações ========= */
  const adicionarNovaRaca = async () => {
    const v = (novaRaca || "").trim();
    if (!v) return;
    if (!fazendaAtualId) {
      setMensagemErro("Selecione uma fazenda antes de cadastrar raça.");
      setTimeout(() => setMensagemErro(""), 2500);
      return;
    }
    const { data, error } = await supabase
      .from("racas")
      .insert({ nome: v, fazenda_id: fazendaAtualId })
      .select("id, nome")
      .single();

    if (!error && data) {
      setRacasBanco((prev) => [...prev, data]);
      setRaca(data.id);
      setNovaRaca("");
    }
  };

  const limpar = () => {
    setBrinco("");
    setNascimento("");
    setSexo("");
    setRaca("");
    setNovaRaca("");

    setPai("");
    setMae("");
    setInseminacoesAnteriores([""]);
    setPartosAnteriores([""]);
    setSecagensAnteriores([""]);

    setOrigem("propriedade");
    setValorCompra("");
    setDataEntrada("");

    setIdade("");
    setCategoria("");
    setMesesIdade(0);

    setMensagemErro("");
    setMensagemSucesso("");

    // ✅ volta ao modo “antes de salvar”
    setAnimalIdFicha(null);

    if (autoNumero) carregarProximoNumero();
    else setNumero("");
  };

  const montarEventos = (animalId) => {
    const eventos = [];

    const adicionarEventos = (lista, tipo) => {
      (lista || []).forEach((item) => {
        if (!item || !item.trim()) return;
        const iso = dataBRParaISO(item);
        if (!iso) return;

        eventos.push({
          fazenda_id: fazendaAtualId,
          animal_id: animalId,
          tipo, // 'IA' | 'PARTO' | 'SECAGEM'
          data_evento: iso,
          user_id: userId,
          observacoes: null,
          meta: {
            origem: "cadastro_animal",
            modo: "historico",
            input_br: item,
          },
        });
      });
    };

    adicionarEventos(inseminacoesAnteriores, "IA");
    adicionarEventos(partosAnteriores, "PARTO");
    adicionarEventos(secagensAnteriores, "SECAGEM");

    return eventos;
  };

  const salvar = async () => {
    if (!userId) {
      setMensagemErro("Usuário não carregou ainda. Aguarde 1 segundo e tente novamente.");
      setTimeout(() => setMensagemErro(""), 2500);
      return;
    }

    if (!brinco || !sexo) {
      setMensagemErro("Preencha Brinco e Sexo.");
      setTimeout(() => setMensagemErro(""), 2500);
      return;
    }

    if (!nascimento || !raca) {
      setMensagemErro("Preencha Nascimento e Raça.");
      setTimeout(() => setMensagemErro(""), 2500);
      return;
    }

    if (!fazendaAtualId) {
      setMensagemErro("Selecione uma fazenda antes de cadastrar.");
      setTimeout(() => setMensagemErro(""), 2500);
      return;
    }

    const nascimentoISO = dataBRParaISO(nascimento);
    if (!nascimentoISO) {
      setMensagemErro("Nascimento inválido.");
      setTimeout(() => setMensagemErro(""), 2500);
      return;
    }

    const dataEntradaISO = dataBRParaISO(dataEntrada);

    const valorCompraNumero =
      origem === "comprado" && valorCompra
        ? Number(valorCompra.replace(/\./g, "").replace(",", "."))
        : null;

    // ✅ animais: só colunas que EXISTEM na tabela agora (sem situacao/categoria/ultima_ia/ultimo_parto)
    const payloadAnimal = {
      user_id: userId,
      fazenda_id: fazendaAtualId,

      numero: Number(numero),
      brinco,
      nascimento: nascimentoISO,
      sexo,
      raca_id: raca,

      origem,
      valor_compra: valorCompraNumero,
      data_entrada: dataEntradaISO,

      pai_nome: pai || null,
      mae_nome: mae || null,

      ativo: true,
    };

    // OFFLINE
    if (!navigator.onLine) {
      const offlineId = gerarUUID();
      const payloadOffline = { ...payloadAnimal, id: offlineId };
      const eventos = montarEventos(offlineId);

      await enqueue("animais.upsert", payloadOffline);
      for (const evento of eventos) await enqueue("repro_eventos.insert", evento);

      await atualizarCachePlantel(payloadOffline);

      setMensagemSucesso("Animal salvo offline. Será sincronizado quando a conexão voltar.");
      setTimeout(() => setMensagemSucesso(""), 2500);
      limpar();
      return;
    }

    // ONLINE
    const { data: animalData, error: animalError } = await supabase
      .from("animais")
      .insert(payloadAnimal)
      .select()
      .single();

    if (animalError || !animalData) {
      console.error("Erro supabase animais.insert:", animalError);
      setMensagemErro(animalError?.message || "Erro ao salvar o animal no banco.");
      setTimeout(() => setMensagemErro(""), 3500);
      return;
    }

    const animalId = animalData.id;

    await atualizarCachePlantel({ ...payloadAnimal, id: animalId });

    const eventos = montarEventos(animalId);
    if (eventos.length > 0) {
      const { error: evErr } = await supabase.from("repro_eventos").insert(eventos);
      if (evErr) {
        console.error("Erro ao inserir repro_eventos:", evErr);
        setMensagemErro(evErr?.message || "Animal salvo, mas houve erro ao salvar eventos.");
        setTimeout(() => setMensagemErro(""), 4000);
      }
    }

    // ✅ habilita autosave da ficha complementar (só depois do animal existir no banco)
    setAnimalIdFicha(animalId);

    setMensagemSucesso("Animal cadastrado com sucesso! (Eventos salvos em repro_eventos)");
    setTimeout(() => setMensagemSucesso(""), 2500);
  };

  /**
   * ✅ Handler chamado pela FichaComplementarAnimal.
   * - Se animalIdFicha ainda não existe: não insere nada (FK) — vai entrar no salvar().
   * - Depois do salvar(): insere/atualiza eventos em repro_eventos e retorna o id criado.
   *
   * Suporta:
   * - { tipo, data_evento, meta, evento_id }
   * - { tipo, data } (compat legado)
   */
  const registrarEventoFicha = async (payload) => {
    if (!userId || !fazendaAtualId) return;

    // antes do animal existir no banco, não dá pra inserir em repro_eventos
    if (!animalIdFicha) return null;

    const tipo = payload?.tipo;
    if (!tipo) return null;

    const dataISO =
      payload?.data_evento || (payload?.data ? dataBRParaISO(payload.data) : null);
    if (!dataISO) return null;

    const meta =
      payload?.meta && typeof payload.meta === "object"
        ? payload.meta
        : { origem: "ficha_complementar", modo: "historico" };

    // offline: fila e retorna um id fake para o componente "prender" a linha (evita duplicar na UI)
    if (!navigator.onLine) {
      const offlineEventId = gerarUUID();
      await enqueue("repro_eventos.insert", {
        id: offlineEventId,
        fazenda_id: fazendaAtualId,
        animal_id: animalIdFicha,
        tipo,
        data_evento: dataISO,
        user_id: userId,
        observacoes: null,
        meta,
      });
      return offlineEventId;
    }

    // ✅ se veio evento_id: tenta UPDATE (evita duplicar quando o cara corrige a data)
    if (payload?.evento_id) {
      const { data, error } = await supabase
        .from("repro_eventos")
        .update({
          tipo,
          data_evento: dataISO,
          meta,
        })
        .eq("id", payload.evento_id)
        .eq("fazenda_id", fazendaAtualId)
        .eq("animal_id", animalIdFicha)
        .select("id")
        .single();

      if (!error && data?.id) return data.id;

      // se falhar (id não existe, etc.), cai para insert
      console.warn("UPDATE repro_eventos falhou, fazendo INSERT:", error);
    }

    // INSERT
    const { data: ins, error: insErr } = await supabase
      .from("repro_eventos")
      .insert([
        {
          fazenda_id: fazendaAtualId,
          animal_id: animalIdFicha,
          tipo,
          data_evento: dataISO,
          user_id: userId,
          observacoes: null,
          meta,
        },
      ])
      .select("id")
      .single();

    if (insErr) {
      console.error("Erro ao inserir evento pela ficha:", insErr);
      setMensagemErro(insErr?.message || "Erro ao salvar evento reprodutivo (ficha).");
      setTimeout(() => setMensagemErro(""), 3500);
      return null;
    }

    return ins?.id || null;
  };

  /* ========= UI resumo (somente visual) ========= */
  const situacaoProdutivaResumo = useMemo(() => {
    if (sexo === "macho") return "não lactante";
    const dtUltParto = parseBRtoDate(ultimoPartoResumo);
    const dtUltSecagem = parseBRtoDate(ultimaSecagemResumo);
    if (dtUltParto && (!dtUltSecagem || dtUltParto > dtUltSecagem)) return "lactante";
    if (dtUltSecagem && (!dtUltParto || dtUltSecagem >= dtUltParto)) return "seca";
    if (mesesIdade < 24) return "novilha";
    return "não lactante";
  }, [sexo, mesesIdade, ultimoPartoResumo, ultimaSecagemResumo]);

  const situacaoReprodutivaResumo = useMemo(() => {
    const dtUltIA = parseBRtoDate(ultimaIAResumo);
    const dtUltParto = parseBRtoDate(ultimoPartoResumo);
    const dtUltSecagem = parseBRtoDate(ultimaSecagemResumo);

    if (!dtUltIA) return "vazia";

    const temEventoDepoisDaIA =
      (dtUltParto && dtUltParto > dtUltIA) || (dtUltSecagem && dtUltSecagem > dtUltIA);

    if (!temEventoDepoisDaIA) return "inseminada";
    if (dtUltParto && dtUltParto > dtUltIA) return "pev / pós-parto";
    return "vazia";
  }, [ultimaIAResumo, ultimoPartoResumo, ultimaSecagemResumo]);

  /* ============================
     Layout
============================ */
  return (
    <div
      style={{
        maxWidth: 1300,
        margin: "0 auto",
        padding: "16px 20px 32px",
        fontFamily: "Poppins, system-ui, sans-serif",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {mensagemSucesso && <div style={alertSucesso}>{mensagemSucesso}</div>}
      {mensagemErro && <div style={alertErro}>{mensagemErro}</div>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
          columnGap: 56,
          alignItems: "flex-start",
        }}
      >
        {/* ------- COLUNA ESQUERDA ------- */}
        <div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              maxHeight: "calc(100vh - 220px)",
              overflowY: "auto",
              paddingRight: 8,
              paddingBottom: 40,
            }}
          >
            <div style={{ marginBottom: 12 }}>
              <h1 style={tituloPagina}>Entrada de Animal</h1>
            </div>

            {/* Identificação */}
            <div style={{ ...card, marginBottom: 28 }}>
              <div style={cardHeader}>
                <span style={cardTitle}>Identificação</span>
                <span style={pill}>campos obrigatórios</span>
              </div>

              <div style={grid2}>
                <div>
                  <label style={lbl}>
                    Número
                    <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 400 }}>
                      <input
                        type="checkbox"
                        checked={autoNumero}
                        onChange={(e) => setAutoNumero(e.target.checked)}
                        style={{ marginRight: 4 }}
                      />
                      numeração automática
                    </span>
                  </label>
                  <input
                    type="text"
                    value={numero}
                    onChange={(e) => !autoNumero && setNumero(e.target.value)}
                    readOnly={autoNumero}
                    style={autoNumero ? inputReadOnly : inputBase}
                  />
                </div>
                <div>
                  <label style={lbl}>Brinco *</label>
                  <input
                    type="text"
                    value={brinco}
                    onChange={(e) => setBrinco(e.target.value)}
                    style={inputBase}
                    placeholder="Digite o brinco"
                  />
                </div>
              </div>

              <div style={grid2}>
                <div>
                  <label style={lbl}>Nascimento *</label>
                  <input
                    type="text"
                    value={nascimento}
                    onChange={(e) => setNascimento(formatarDataDigitada(e.target.value))}
                    style={inputBase}
                    placeholder="dd/mm/aaaa"
                  />
                </div>
                <div>
                  <label style={lbl}>Sexo *</label>
                  <Select
                    options={sexoOptions}
                    value={sexoOptions.find((opt) => opt.value === sexo) || null}
                    onChange={(opt) => setSexo(opt?.value || "")}
                    placeholder="Selecione"
                    styles={{
                      container: (base) => ({ ...base, width: "100%", flex: 1 }),
                      control: (base) => ({
                        ...base,
                        borderRadius: 12,
                        borderColor: "#d1d5db",
                        minHeight: 46,
                        width: "100%",
                      }),
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: 18 }}>
                <label style={lbl}>Raça *</label>
                <div style={{ display: "flex", gap: 18, alignItems: "stretch" }}>
                  <Select
                    options={racaOptions}
                    value={racaOptions.find((opt) => opt.value === raca) || null}
                    onChange={(opt) => setRaca(opt?.value || "")}
                    placeholder="Selecione"
                    styles={{
                      container: (base) => ({
                        ...base,
                        flex: 1,
                        width: "100%",
                        boxSizing: "border-box",
                      }),
                      control: (base) => ({
                        ...base,
                        borderRadius: 14,
                        borderColor: "#d1d5db",
                        minHeight: 52,
                      }),
                    }}
                  />
                  <input
                    type="text"
                    value={novaRaca}
                    onChange={(e) => setNovaRaca(e.target.value)}
                    placeholder="Nova raça"
                    style={{ ...inputBase, flex: 1 }}
                  />
                  <button type="button" style={btnVerde} onClick={adicionarNovaRaca}>
                    Adicionar
                  </button>
                </div>
              </div>
            </div>

            {/* Origem */}
            <div style={card}>
              <div style={cardHeader}>
                <span style={cardTitle}>Origem do animal</span>
              </div>

              <div style={grid2}>
                <div>
                  <label style={lbl}>Origem</label>
                  <div style={{ display: "flex", width: "100%" }}>
                    <Select
                      options={origemOptions}
                      value={origemOptions.find((opt) => opt.value === origem) || null}
                      onChange={(opt) => setOrigem(opt?.value || "propriedade")}
                      placeholder="Selecione"
                      styles={{
                        container: (base) => ({
                          ...base,
                          flex: 1,
                          width: "100%",
                          boxSizing: "border-box",
                        }),
                        control: (base) => ({
                          ...base,
                          borderRadius: 14,
                          borderColor: "#d1d5db",
                          minHeight: 52,
                        }),
                      }}
                    />
                  </div>
                </div>

                {origem === "comprado" && (
                  <div>
                    <label style={lbl}>Valor de compra (R$)</label>
                    <input
                      type="text"
                      value={valorCompra}
                      onChange={(e) => setValorCompra(maskMoedaBR(e.target.value))}
                      style={inputBase}
                      placeholder="Opcional"
                    />
                  </div>
                )}
              </div>

              <div style={{ marginTop: 18 }}>
                <label style={lbl}>Data de entrada na fazenda</label>
                <input
                  type="text"
                  value={dataEntrada}
                  onChange={(e) => setDataEntrada(formatarDataDigitada(e.target.value))}
                  style={inputBase}
                  placeholder="dd/mm/aaaa (opcional)"
                />
              </div>
            </div>

            {/* Ficha complementar */}
            <div style={{ ...card, marginTop: 20 }}>
              <div style={cardHeader}>
                <div style={cardTitle}>Ficha complementar do animal</div>
                <button
                  type="button"
                  style={btnGhost}
                  onClick={() => setMostrarFichaComplementar((v) => !v)}
                >
                  {mostrarFichaComplementar ? "Fechar ficha complementar" : "Abrir ficha complementar"}
                </button>
              </div>

              {mostrarFichaComplementar && (
                <FichaComplementarAnimal
                  pai={pai}
                  setPai={setPai}
                  mae={mae}
                  setMae={setMae}
                  inseminacoesAnteriores={inseminacoesAnteriores}
                  setInseminacoesAnteriores={setInseminacoesAnteriores}
                  partosAnteriores={partosAnteriores}
                  setPartosAnteriores={setPartosAnteriores}
                  secagensAnteriores={secagensAnteriores}
                  setSecagensAnteriores={setSecagensAnteriores}
                  atualizarDataLista={atualizarDataLista}
                  limparCamposVazios={limparCamposVazios}
                  adicionarCampoSeUltimoPreenchido={adicionarCampoSeUltimoPreenchido}
                  onAdicionarEvento={registrarEventoFicha}
                  inputBase={inputBase}
                  lbl={lbl}
                />
              )}

              {!animalIdFicha && (
                <p style={{ marginTop: 14, fontSize: 12, color: "#64748b" }}>
                  * Dica: o salvamento automático de eventos (IA/Parto/Secagem) na ficha só fica ativo
                  depois de clicar em <b>Salvar</b> (porque precisa do ID do animal no banco).
                </p>
              )}
            </div>

            {/* Ações */}
            <div
              style={{
                ...card,
                marginTop: 16,
                display: "flex",
                gap: 12,
                justifyContent: "flex-end",
              }}
            >
              <button type="button" style={btnGhost} onClick={limpar}>
                Limpar formulário
              </button>
              <button type="button" style={btnPrimario} onClick={salvar}>
                💾 Salvar
              </button>
            </div>

            <div style={{ height: 40 }} />
          </div>
        </div>

        {/* ------- COLUNA DIREITA: RESUMO ------- */}
        <div>
          <div style={colunaDireitaSticky}>
            <div style={{ ...cardResumo, padding: "16px 16px 12px" }}>
              <div style={{ ...cardHeader, marginBottom: 6 }}>
                <div style={cardTitle}>Ficha do animal</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
                <div style={rowKV}>
                  <span style={k}>Número</span>
                  <span style={v}>{numero || "—"}</span>
                </div>
                <div style={rowKV}>
                  <span style={k}>Brinco</span>
                  <span style={v}>{brinco || "—"}</span>
                </div>
                <div style={rowKV}>
                  <span style={k}>Nascimento</span>
                  <span style={v}>{nascimento || "—"}</span>
                </div>
                <div style={rowKV}>
                  <span style={k}>Sexo</span>
                  <span style={v}>{sexo || "—"}</span>
                </div>
                <div style={rowKV}>
                  <span style={k}>Raça</span>
                  <span style={v}>{racaSelecionadaLabel || raca || "—"}</span>
                </div>

                <div style={{ height: 1, background: "#e5e7eb", margin: "4px 0" }} />

                <div style={rowKV}>
                  <span style={k}>Pai</span>
                  <span style={v}>{pai || "—"}</span>
                </div>
                <div style={rowKV}>
                  <span style={k}>Mãe</span>
                  <span style={v}>{mae || "—"}</span>
                </div>

                <div style={{ height: 1, background: "#e5e7eb", margin: "4px 0" }} />

                <div style={rowKV}>
                  <span style={k}>Último parto</span>
                  <span style={v}>{ultimoPartoResumo || "—"}</span>
                </div>
                <div style={rowKV}>
                  <span style={k}>Última IA</span>
                  <span style={v}>{ultimaIAResumo || "—"}</span>
                </div>
                <div style={rowKV}>
                  <span style={k}>Previsão de parto</span>
                  <span style={v}>{prevPartoBR || "—"}</span>
                </div>

                <div style={{ height: 1, background: "#e5e7eb", margin: "4px 0" }} />

                <div style={rowKV}>
                  <span style={k}>Situação produtiva</span>
                  <span style={v}>{situacaoProdutivaResumo || "—"}</span>
                </div>
                <div style={rowKV}>
                  <span style={k}>Situação reprodutiva</span>
                  <span style={v}>{situacaoReprodutivaResumo || "—"}</span>
                </div>
                <div style={rowKV}>
                  <span style={k}>DEL</span>
                  <span style={v}>{delResumo != null ? `${delResumo} dias` : "—"}</span>
                </div>

                <div style={{ height: 1, background: "#e5e7eb", margin: "4px 0" }} />

                <div style={rowKV}>
                  <span style={k}>Idade</span>
                  <span style={v}>{idade || "—"}</span>
                </div>
                <div style={rowKV}>
                  <span style={k}>Categoria (UI)</span>
                  <span style={v}>{categoria || "—"}</span>
                </div>

                <div style={{ height: 1, background: "#e5e7eb", margin: "4px 0" }} />

                <div style={rowKV}>
                  <span style={k}>Origem</span>
                  <span style={v}>
                    {origem === "comprado" && valorCompra ? `Comprado por R$ ${valorCompra}` : origem || "—"}
                  </span>
                </div>

                <div style={rowKV}>
                  <span style={k}>Autosave eventos</span>
                  <span style={v}>{animalIdFicha ? "ativo" : "aguardando salvar"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ============================
   Estilos
============================ */
const card = {
  background: "#ffffff",
  borderRadius: 18,
  border: "1px solid #e5e7eb",
  padding: 32,
  boxShadow: "0 1px 6px rgba(15, 23, 42, 0.04)",
  boxSizing: "border-box",
};

const cardHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 18,
};

const cardTitle = {
  fontSize: 16,
  fontWeight: 900,
};

const tituloPagina = { fontSize: 28, fontWeight: 900, marginBottom: 12, margin: 0 };

const colunaDireitaSticky = {
  position: "sticky",
  top: 12,
};

const pill = {
  background: "#eef2ff",
  color: "#3730a3",
  borderRadius: 999,
  padding: "4px 10px",
  border: "1px solid #c7d2fe",
  fontSize: 11,
  fontWeight: 700,
};

const grid2 = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
  columnGap: 16,
  rowGap: 20,
  marginBottom: 16,
};

const lbl = {
  fontWeight: 700,
  fontSize: 13,
  color: "#334155",
  marginBottom: 6,
  display: "block",
};

const inputBase = {
  width: "100%",
  borderRadius: 14,
  border: "1px solid #d1d5db",
  padding: "12px 14px",
  fontSize: 15,
  background: "#ffffff",
  boxSizing: "border-box",
};

const inputReadOnly = {
  ...inputBase,
  background: "#f3f4f6",
};

const btnPrimario = {
  background: "#2563eb",
  color: "#ffffff",
  border: "none",
  padding: "11px 26px",
  borderRadius: 14,
  fontWeight: 800,
  fontSize: 15,
  cursor: "pointer",
};

const btnGhost = {
  background: "#f9fafb",
  color: "#111827",
  border: "1px solid #e5e7eb",
  padding: "11px 24px",
  borderRadius: 14,
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
};

const btnVerde = {
  background: "#10b981",
  color: "#ffffff",
  border: "none",
  padding: "11px 16px",
  borderRadius: 14,
  fontWeight: 800,
  fontSize: 14,
  cursor: "pointer",
};

const alertSucesso = {
  backgroundColor: "#ecfdf5",
  color: "#065f46",
  border: "1px solid #34d399",
  padding: "8px 12px",
  borderRadius: 12,
  marginBottom: 12,
  fontWeight: 700,
};

const alertErro = {
  backgroundColor: "#fef2f2",
  color: "#991b1b",
  border: "1px solid #fca5a5",
  padding: "8px 12px",
  borderRadius: 12,
  marginBottom: 12,
  fontWeight: 700,
};

const cardResumo = {
  ...card,
  paddingTop: 28,
  paddingBottom: 24,
};

const rowKV = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  fontSize: 14,
};

const k = {
  color: "#64748b",
  fontWeight: 700,
};

const v = {
  color: "#111827",
  fontWeight: 900,
};
