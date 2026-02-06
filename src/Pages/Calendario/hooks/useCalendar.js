// src/Pages/Calendario/hooks/useCalendar.js
import { useCallback, useMemo, useState } from "react";

// yyyy-mm-dd
function keyFromDate(dt) {
  const d = dt instanceof Date ? dt : new Date(dt);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function useCalendar() {
  // ✅ Estado só em memória (depois troca por Supabase)
  const [tarefasStore, setTarefasStore] = useState(() => ({}));

  // Foco da navegação (mês atual na UI)
  const [dataAtual, setDataAtual] = useState(() => new Date());
  const [dataSelecionada, setDataSelecionada] = useState(() => new Date());

  const [viewMode, setViewMode] = useState("grade"); // "roleta" | "grade" | "semana"
  const [filtros, setFiltros] = useState({ categorias: [], status: "todas", busca: "" });

  // ✅ Categorias: pode ser estático por enquanto (layout)
  const categorias = useMemo(() => {
    return ["trabalho", "pessoal", "estudo", "lazer", "saude", "financeiro", "importante"];
  }, []);

  const formatarDataChave = useCallback((data) => keyFromDate(data), []);

  const obterTarefasDoDia = useCallback(
    (data) => {
      const k = keyFromDate(data);
      return Array.isArray(tarefasStore[k]) ? tarefasStore[k] : [];
    },
    [tarefasStore]
  );

  // ✅ Ações (em memória)
  const adicionarTarefa = useCallback((data, tarefaData) => {
    const k = keyFromDate(data);
    const nova = {
      id: String(Date.now()),
      titulo: tarefaData?.titulo || "",
      categoria: tarefaData?.categoria || "",
      horario: tarefaData?.horario || "",
      lembrete: tarefaData?.lembrete || "",
      concluida: false,
      ...tarefaData,
    };

    setTarefasStore((prev) => ({
      ...prev,
      [k]: [...(prev[k] || []), nova],
    }));

    return nova;
  }, []);

  const atualizarTarefa = useCallback((data, tarefaId, patch) => {
    const k = keyFromDate(data);
    setTarefasStore((prev) => ({
      ...prev,
      [k]: (prev[k] || []).map((t) => (t.id === tarefaId ? { ...t, ...patch } : t)),
    }));
  }, []);

  const excluirTarefa = useCallback((data, tarefaId) => {
    const k = keyFromDate(data);
    setTarefasStore((prev) => ({
      ...prev,
      [k]: (prev[k] || []).filter((t) => t.id !== tarefaId),
    }));
  }, []);

  const moverTarefa = useCallback((dataOrigem, dataDestino, tarefaId) => {
    const kO = keyFromDate(dataOrigem);
    const kD = keyFromDate(dataDestino);

    setTarefasStore((prev) => {
      const origem = [...(prev[kO] || [])];
      const destino = [...(prev[kD] || [])];
      const idx = origem.findIndex((t) => t.id === tarefaId);
      if (idx === -1) return prev;

      const [tarefa] = origem.splice(idx, 1);
      destino.push(tarefa);

      return { ...prev, [kO]: origem, [kD]: destino };
    });
  }, []);

  const toggleConcluida = useCallback((data, tarefaId) => {
    const k = keyFromDate(data);
    setTarefasStore((prev) => ({
      ...prev,
      [k]: (prev[k] || []).map((t) => (t.id === tarefaId ? { ...t, concluida: !t.concluida } : t)),
    }));
  }, []);

  // ✅ Filtros só pra UI (funcionam, mas simples)
  const tarefasFiltradas = useCallback(
    (data) => {
      let lista = obterTarefasDoDia(data);

      if (filtros.categorias?.length) {
        lista = lista.filter((t) => filtros.categorias.includes(t.categoria));
      }
      if (filtros.status === "concluidas") lista = lista.filter((t) => t.concluida);
      if (filtros.status === "pendentes") lista = lista.filter((t) => !t.concluida);

      const b = (filtros.busca || "").trim().toLowerCase();
      if (b) lista = lista.filter((t) => (t.titulo || "").toLowerCase().includes(b));

      return lista;
    },
    [obterTarefasDoDia, filtros]
  );

  // ✅ Dias para layout (grade/semana)
  const gerarDias = useCallback(
    (modo = "mes") => {
      const foco = modo === "semana" ? new Date(dataSelecionada) : new Date(dataAtual);
      const out = [];

      if (modo === "semana") {
        const start = new Date(foco);
        start.setDate(start.getDate() - start.getDay()); // domingo
        for (let i = 0; i < 7; i++) {
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          out.push({ data: d, foraDoMes: false });
        }
        return out;
      }

      // mês
      const first = new Date(foco.getFullYear(), foco.getMonth(), 1);
      const last = new Date(foco.getFullYear(), foco.getMonth() + 1, 0);

      for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
        out.push({ data: new Date(d), foraDoMes: false });
      }
      return out;
    },
    [dataAtual, dataSelecionada]
  );

  const navegarParaHoje = useCallback(() => {
    const hoje = new Date();
    setDataAtual(hoje);
    setDataSelecionada(hoje);
  }, []);

  const mudarMes = useCallback((delta) => {
    setDataAtual((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  }, []);

  const mudarSemana = useCallback((delta) => {
    setDataSelecionada((d) => {
      const nd = new Date(d);
      nd.setDate(d.getDate() + delta * 7);
      return nd;
    });
  }, []);

  // ✅ Estatísticas fake (pra cards/animação)
  const estatisticas = useMemo(() => {
    const all = Object.values(tarefasStore).flat();
    const total = all.length;
    const concluidas = all.filter((t) => t?.concluida).length;
    return { total, concluidas, pendentes: total - concluidas };
  }, [tarefasStore]);

  return {
    dataAtual,
    dataSelecionada,
    setDataSelecionada,
    viewMode,
    setViewMode,
    filtros,
    setFiltros,
    categorias,

    adicionarTarefa,
    atualizarTarefa,
    excluirTarefa,
    moverTarefa,
    toggleConcluida,

    obterTarefasDoDia,
    tarefasFiltradas,
    formatarDataChave,
    gerarDias,

    navegarParaHoje,
    mudarMes,
    mudarSemana,

    estatisticas,

    // ✅ store “bruto” pro layout de grade/roleta
    tarefas: tarefasStore,
  };
}
