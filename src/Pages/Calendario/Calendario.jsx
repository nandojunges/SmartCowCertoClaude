// src/Pages/Calendario/Calendario.jsx
import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

// Hooks
import { useCalendar } from "./hooks/useCalendar";
import { useNotifications } from "./hooks/useNotifications";
import { useToast, Notificacoes } from "./components/Notificacoes";

// Componentes
import { BarraNavegacao } from "./components/BarraNavegacao";
import { BarraFiltros } from "./components/BarraFiltros";
import { RoletaDias } from "./components/RoletaDias";
import { GradeMensal } from "./components/GradeMensal";
import { VisualizacaoSemanal } from "./components/VisualizacaoSemanal";
import { ListaTarefas } from "./components/ListaTarefas";
import { FormularioTarefa } from "./components/FormularioTarefa";
import { DashboardEstatisticas } from "./components/DashboardEstatisticas";

// Estilos
import "./Calendario.css";

export default function Calendario() {
  const {
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
  } = useCalendar();

  const { permissao, solicitarPermissao, notificarTarefa } = useNotifications();
  const toast = useToast();

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [tarefaEditando, setTarefaEditando] = useState(null);
  const [mostrarDashboard, setMostrarDashboard] = useState(false);

  // ✅ Segurança: garantir Date válido (caso algo venha serializado)
  const dataSel = useMemo(() => {
    const d = dataSelecionada instanceof Date ? dataSelecionada : new Date(dataSelecionada);
    return Number.isFinite(d.getTime()) ? d : new Date();
  }, [dataSelecionada]);

  // Dados computados
  const dias = useMemo(() => {
    const modo = viewMode === "semana" ? "semana" : "mes";
    return gerarDias(modo);
  }, [gerarDias, viewMode]);

  const tarefasDoDia = useMemo(() => {
    const lista = tarefasFiltradas(dataSel);
    return Array.isArray(lista) ? lista : [];
  }, [tarefasFiltradas, dataSel]);

  const totalTarefas = useMemo(() => {
    const lista = obterTarefasDoDia(dataSel);
    return Array.isArray(lista) ? lista.length : 0;
  }, [obterTarefasDoDia, dataSel]);

  // ✅ Monta um "store" por data para Roleta/Grade/Semana,
  // sem depender de "tarefas" no retorno do hook.
  const tarefasStore = useMemo(() => {
    const store = {};
    for (const item of dias || []) {
      const dt = item?.data ?? item; // se teus componentes usam {data}, mantém compatível
      if (!dt) continue;
      const chave = formatarDataChave(dt);
      const lista = obterTarefasDoDia(dt);
      store[chave] = Array.isArray(lista) ? lista : [];
    }
    return store;
  }, [dias, formatarDataChave, obterTarefasDoDia]);

  // Handlers
  const handleSelecionarDia = useCallback(
    (data) => setDataSelecionada(data),
    [setDataSelecionada]
  );

  const handleAdicionarTarefa = useCallback(
    (tarefaData) => {
      if (tarefaData?.id) {
        atualizarTarefa(dataSel, tarefaData.id, tarefaData);
        toast.sucesso("Tarefa atualizada com sucesso!");
      } else {
        const novaTarefa = adicionarTarefa(dataSel, tarefaData);
        toast.sucesso("Tarefa criada com sucesso!");

        if (tarefaData?.lembrete && permissao === "granted") {
          notificarTarefa(
            novaTarefa,
            dataSel,
            parseInt(tarefaData.lembrete, 10)
          );
        }
      }

      setTarefaEditando(null);
      setMostrarFormulario(false);
    },
    [adicionarTarefa, atualizarTarefa, dataSel, toast, permissao, notificarTarefa]
  );

  const handleToggleTarefa = useCallback(
    (data, tarefaId) => {
      toggleConcluida(data, tarefaId);
      const lista = obterTarefasDoDia(data);
      const tarefa = Array.isArray(lista) ? lista.find((t) => t.id === tarefaId) : null;
      if (tarefa && !tarefa.concluida) toast.sucesso("Tarefa concluída! 🎉");
    },
    [toggleConcluida, obterTarefasDoDia, toast]
  );

  const handleExcluirTarefa = useCallback(
    (data, tarefaId) => {
      if (window.confirm("Tem certeza que deseja excluir esta tarefa?")) {
        excluirTarefa(data, tarefaId);
        toast.info("Tarefa excluída");
      }
    },
    [excluirTarefa, toast]
  );

  const handleEditarTarefa = useCallback((tarefa) => {
    setTarefaEditando(tarefa);
    setMostrarFormulario(true);
  }, []);

  const handleReorderTarefas = useCallback((novaOrdem) => {
    // Se teu hook tiver reorder real, plugue aqui.
    // Ex.: moverTarefa(...)

    // ✅ Evita log ruidoso em produção
    if (import.meta?.env?.DEV) {
      console.log("Reordenar:", novaOrdem);
    }
  }, []);

  const handleLimparFiltros = useCallback(() => {
    setFiltros({ categorias: [], status: "todas", busca: "" });
    toast.info("Filtros limpos");
  }, [setFiltros, toast]);

  const handleExportar = useCallback(() => {
    let dados = "{}";
    try {
      const raw = localStorage.getItem("calendario-tarefas");
      // se o raw for null, mantém "{}"
      if (raw && raw.trim()) dados = raw;
      // valida JSON
      JSON.parse(dados);
    } catch {
      // se estiver corrompido, exporta vazio para não quebrar download
      dados = "{}";
    }

    const blob = new Blob([dados], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `calendario-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.sucesso("Dados exportados!");
  }, [toast]);

  const handleImportar = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const dados = JSON.parse(event.target.result);
          localStorage.setItem("calendario-tarefas", JSON.stringify(dados));
          window.location.reload();
        } catch {
          toast.erro("Erro ao importar arquivo");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [toast]);

  const handleAgendarLembrete = useCallback(
    (tarefa) => {
      if (permissao !== "granted") {
        solicitarPermissao().then((concedida) => {
          if (concedida) {
            notificarTarefa(tarefa, dataSel, 15);
            toast.sucesso("Lembrete agendado!");
          }
        });
      } else {
        notificarTarefa(tarefa, dataSel, 15);
        toast.sucesso("Lembrete agendado!");
      }
    },
    [permissao, solicitarPermissao, notificarTarefa, dataSel, toast]
  );

  // ✅ Renderizar visualização atual (sem localStorage)
  const visualizacao = useMemo(() => {
    const propsBase = {
      dias,
      dataSelecionada: dataSel,
      onSelecionarDia: handleSelecionarDia,
      formatarDataChave,
    };

    switch (viewMode) {
      case "roleta":
        return <RoletaDias {...propsBase} tarefas={tarefasStore} />;

      case "grade":
        return <GradeMensal {...propsBase} tarefas={tarefasStore} />;

      case "semana":
        return (
          <VisualizacaoSemanal
            {...propsBase}
            tarefas={tarefasStore}
            onToggleTarefa={handleToggleTarefa}
            categorias={categorias}
          />
        );

      default:
        return null;
    }
  }, [
    dias,
    dataSel,
    handleSelecionarDia,
    formatarDataChave,
    viewMode,
    tarefasStore,
    handleToggleTarefa,
    categorias,
  ]);

  return (
    <div className="calendario-container">
      <Notificacoes notificacoes={toast.notificacoes} onRemover={toast.remover} />

      <BarraNavegacao
        dataAtual={dataAtual}
        dataSelecionada={dataSel}
        viewMode={viewMode}
        onMudarMes={mudarMes}
        onMudarSemana={mudarSemana}
        onIrParaHoje={navegarParaHoje}
        onToggleDashboard={() => setMostrarDashboard((v) => !v)}
        mostrarDashboard={mostrarDashboard}
        onExportar={handleExportar}
        onImportar={handleImportar}
      />

      <AnimatePresence>
        {mostrarDashboard && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <DashboardEstatisticas
              estatisticas={estatisticas}
              dataSelecionada={dataSel}
              tarefasHoje={obterTarefasDoDia(new Date())}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <BarraFiltros
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        filtros={filtros}
        onChangeFiltros={setFiltros}
        categorias={categorias}
        onLimparFiltros={handleLimparFiltros}
        totalTarefas={totalTarefas}
        tarefasFiltradas={tarefasDoDia.length}
      />

      <div className="area-visualizacao">{visualizacao}</div>

      {viewMode !== "semana" && (
        <div className="area-tarefas">
          <div className="tarefas-header">
            <div>
              <h3>
                {dataSel.toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </h3>
              <p>
                {tarefasDoDia.length}{" "}
                {tarefasDoDia.length === 1 ? "tarefa" : "tarefas"}
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setTarefaEditando(null);
                setMostrarFormulario(true);
              }}
              className="btn-adicionar"
              type="button"
              aria-label="Adicionar tarefa"
            >
              <Plus size={20} />
            </motion.button>
          </div>

          <ListaTarefas
            tarefas={tarefasDoDia}
            data={dataSel}
            categorias={categorias}
            onToggle={handleToggleTarefa}
            onExcluir={handleExcluirTarefa}
            onEditar={handleEditarTarefa}
            onReorder={handleReorderTarefas}
            onAgendarLembrete={handleAgendarLembrete}
          />
        </div>
      )}

      <FormularioTarefa
        aberto={mostrarFormulario}
        onFechar={() => {
          setMostrarFormulario(false);
          setTarefaEditando(null);
        }}
        onSalvar={handleAdicionarTarefa}
        categorias={categorias}
        tarefaParaEditar={tarefaEditando}
        dataSelecionada={dataSel}
      />
    </div>
  );
}
