// src/pages/Animais/Animais.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  ListChecks,
  PlusCircle,
  ArrowRightCircle,
  Ban,
  FileText,
  UploadCloud,
  DownloadCloud,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { withFazendaId } from "../../lib/fazendaScope";
import { useFazenda } from "../../context/FazendaContext";
import { kvGet, kvSet } from "../../offline/localDB";

// Páginas internas
import SubAbasAnimais from "./SubAbasAnimais";
import SaidaAnimal from "./SaidaAnimal";
import Inativas from "./Inativas";
import CadastroAnimal from "./CadastroAnimal";
import FichaAnimal from "./FichaAnimal/FichaAnimal";
import Relatorios from "../../pages/Animais/Relatorios/Relatorios";

let MEMO_ANIMAIS = {
  data: null,
  lastAt: 0,
};

/* =========================
   CONFIGURAÇÃO DE NAVEGAÇÃO
   ========================= */
const menuItems = [
  { id: "todos", label: "Todos os Animais", icon: ListChecks, desc: "Visão geral do plantel" },
  { id: "entrada", label: "Entrada", icon: PlusCircle, desc: "Cadastrar novos animais" },
  { id: "saida", label: "Saída", icon: ArrowRightCircle, desc: "Registrar baixas" },
  { id: "inativas", label: "Inativas", icon: Ban, desc: "Histórico de saídas" },
  { id: "relatorio", label: "Relatórios", icon: FileText, desc: "Análises e dados" },
];

const utilityItems = [
  { id: "importar", label: "Importar", icon: UploadCloud },
  { id: "exportar", label: "Exportar", icon: DownloadCloud },
];

/* =========================
   BARRA LATERAL MODERNA
   ========================= */
function SidebarModerna({ abaAtiva, setAbaAtiva, isOnline }) {
  return (
    <aside style={sidebarStyles.container}>
      <div style={sidebarStyles.logoArea}>
        <div style={sidebarStyles.logoIcon}>🐄</div>
        <div style={sidebarStyles.logoText}>Animais</div>
      </div>

      <nav style={sidebarStyles.nav}>
        <div style={sidebarStyles.sectionLabel}>Menu Principal</div>
        {menuItems.map((item) => {
          const ativo = abaAtiva === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setAbaAtiva(item.id)}
              style={{
                ...sidebarStyles.button,
                ...(ativo ? sidebarStyles.buttonActive : {}),
              }}
              onMouseEnter={(e) => {
                if (!ativo) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={(e) => {
                if (!ativo) e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <div style={{ 
                ...sidebarStyles.iconContainer, 
                backgroundColor: ativo ? "rgba(25, 182, 164, 0.15)" : "rgba(255,255,255,0.05)",
                color: ativo ? "#19B6A4" : "rgba(255,255,255,0.6)"
              }}>
                <Icon size={20} strokeWidth={2} />
              </div>
              <div style={sidebarStyles.buttonContent}>
                <div style={{ 
                  ...sidebarStyles.buttonLabel, 
                  color: ativo ? "#fff" : "rgba(255,255,255,0.8)" 
                }}>
                  {item.label}
                </div>
                <div style={sidebarStyles.buttonDesc}>{item.desc}</div>
              </div>
              {ativo && <div style={sidebarStyles.activeIndicator} />}
            </button>
          );
        })}

        <div style={{...sidebarStyles.sectionLabel, marginTop: 24}}>Ferramentas</div>
        {utilityItems.map((item) => {
          const ativo = abaAtiva === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setAbaAtiva(item.id)}
              style={sidebarStyles.button}
            >
              <div style={{ ...sidebarStyles.iconContainer, backgroundColor: "rgba(255,255,255,0.05)" }}>
                <Icon size={18} color="rgba(255,255,255,0.5)" />
              </div>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 500 }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div style={sidebarStyles.footer}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 8, 
          fontSize: 12, 
          color: isOnline ? "#34d399" : "#fbbf24",
          fontWeight: 600 
        }}>
          <div style={{ 
            width: 8, 
            height: 8, 
            borderRadius: "50%", 
            backgroundColor: isOnline ? "#34d399" : "#fbbf24",
            boxShadow: `0 0 0 3px ${isOnline ? "rgba(52, 211, 153, 0.2)" : "rgba(251, 191, 36, 0.2)"}`
          }} />
          {isOnline ? "Online" : "Modo Offline"}
        </div>
      </div>
    </aside>
  );
}

const sidebarStyles = {
  container: {
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
    borderRight: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    flexDirection: "column",
    zIndex: 20,
    boxShadow: "4px 0 24px rgba(0,0,0,0.15)",
  },
  logoArea: {
    padding: "24px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    background: "linear-gradient(135deg, #19B6A4 0%, #0d9488 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    boxShadow: "0 4px 12px rgba(25, 182, 164, 0.3)",
  },
  logoText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: 800,
    letterSpacing: "-0.025em",
  },
  nav: {
    flex: 1,
    padding: "20px 16px",
    overflowY: "auto",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: 12,
    paddingLeft: 12,
  },
  button: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px",
    borderRadius: 12,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    marginBottom: 4,
    transition: "all 0.2s ease",
    textAlign: "left",
    position: "relative",
  },
  buttonActive: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
  },
  buttonContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: 600,
    transition: "color 0.2s",
  },
  buttonDesc: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    fontWeight: 500,
  },
  activeIndicator: {
    position: "absolute",
    right: 0,
    top: "50%",
    transform: "translateY(-50%)",
    width: 3,
    height: 20,
    backgroundColor: "#19B6A4",
    borderRadius: "4px 0 0 4px",
    boxShadow: "0 0 8px rgba(25, 182, 164, 0.5)",
  },
  footer: {
    padding: "20px 24px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
  },
};

/* =========================
   COMPONENTE PRINCIPAL
   ========================= */
export default function Animais() {
  const { fazendaAtualId } = useFazenda();
  const memoData = MEMO_ANIMAIS.data || {};
  
  const [abaAtiva, setAbaAtiva] = useState(() => {
    try {
      const stored = localStorage.getItem("animais:abaAtiva");
      return menuItems.some((btn) => btn.id === stored) ? stored : "todos";
    } catch {
      return "todos";
    }
  });
  
  const [isOnline, setIsOnline] = useState(() =>
    typeof memoData.isOnline === "boolean" ? memoData.isOnline : navigator.onLine
  );

  const [animaisAtivos, setAnimaisAtivos] = useState(() => memoData.animaisAtivos ?? []);
  const [animaisInativos, setAnimaisInativos] = useState(() => memoData.animaisInativos ?? []);
  const [carregando, setCarregando] = useState(() => memoData.carregando ?? false);
  const [offlineAviso, setOfflineAviso] = useState(() => memoData.offlineAviso ?? "");

  const [fichaOpen, setFichaOpen] = useState(false);
  const [animalFicha, setAnimalFicha] = useState(null);

  // Persistência em memória
  useEffect(() => {
    MEMO_ANIMAIS.data = {
      animaisAtivos,
      animaisInativos,
      carregando,
      offlineAviso,
      isOnline,
      abaAtiva,
    };
  }, [animaisAtivos, animaisInativos, carregando, offlineAviso, isOnline, abaAtiva]);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("animais:abaAtiva", abaAtiva);
    } catch {}
  }, [abaAtiva]);

  /* ===== Carregamento de Dados (mantido intacto) ===== */
  const carregarAnimalCompleto = useCallback(async (id) => {
    if (!id || !isOnline || !fazendaAtualId) return null;

    const { data, error } = await withFazendaId(
      supabase
        .from("animais")
        .select(`id, numero, brinco, nascimento, sexo, origem, raca_id, pai_nome, mae_nome, categoria`)
        .eq("id", id),
      fazendaAtualId
    ).maybeSingle();

    if (error || !data) return null;

    let racaNome = null;
    if (data.raca_id) {
      const { data: racaRow } = await withFazendaId(
        supabase.from("racas").select("nome").eq("id", data.raca_id),
        fazendaAtualId
      ).maybeSingle();
      if (racaRow) racaNome = racaRow.nome;
    }

    let repro = null;
    try {
      const { data: reproData } = await supabase
        .from("v_repro_tabela")
        .select("*")
        .eq("animal_id", id)
        .maybeSingle();
      repro = reproData || null;
    } catch (err) {
      console.warn("Erro ao carregar dados reprodutivos:", err);
    }

    return { ...data, ...repro, raca_nome: racaNome };
  }, [fazendaAtualId, isOnline]);

  const carregarAnimais = useCallback(async (force = false) => {
    const CACHE_LIST_KEY = "cache:animais:list";
    const memo = MEMO_ANIMAIS.data;
    const memoFresh = memo && Date.now() - MEMO_ANIMAIS.lastAt < 30000;

    if (!force && memoFresh && (memo?.animaisAtivos?.length > 0 || memo?.animaisInativos?.length > 0)) {
      return;
    }

    setCarregando(true);
    setOfflineAviso("");

    if (!isOnline) {
      const cache = await kvGet(CACHE_LIST_KEY);
      const lista = Array.isArray(cache) ? cache : [];
      
      if (lista.length === 0) {
        setOfflineAviso("Sem dados offline. Conecte-se à internet para sincronizar.");
        setCarregando(false);
        return;
      }

      const ativos = lista.filter((a) => a?.ativo !== false);
      const inativos = lista.filter((a) => a?.ativo === false).map((a) => ({
        id: a?.id,
        numero: a?.numero,
        brinco: a?.brinco,
        saida_id: null,
        tipo_saida: "",
        motivo: "",
        data_saida: "",
        observacoes: "",
        valor: null,
      }));

      setAnimaisAtivos(ativos);
      setAnimaisInativos(inativos);
      setCarregando(false);
      return;
    }

    try {
      if (!fazendaAtualId) return;

      const [{ data: ativos }, { data: inativosRaw }] = await Promise.all([
        withFazendaId(supabase.from("animais").select("id, numero, brinco").eq("ativo", true), fazendaAtualId)
          .order("numero", { ascending: true }),
        withFazendaId(supabase.from("animais").select("id, numero, brinco").eq("ativo", false), fazendaAtualId)
          .order("numero", { ascending: true }),
      ]);

      setAnimaisAtivos(ativos || []);

      if (inativosRaw?.length) {
        const { data: saidas } = await withFazendaId(
          supabase.from("saidas_animais").select("*").in("animal_id", inativosRaw.map((a) => a.id)),
          fazendaAtualId
        );

        const saidasPorAnimal = {};
        (saidas || []).forEach((s) => {
          if (!saidasPorAnimal[s.animal_id]) saidasPorAnimal[s.animal_id] = [];
          saidasPorAnimal[s.animal_id].push(s);
        });

        const formatado = inativosRaw.map((a) => {
          const historico = saidasPorAnimal[a.id] || [];
          const ultima = historico[historico.length - 1];
          return {
            id: a.id,
            numero: a.numero,
            brinco: a.brinco,
            saida_id: ultima?.id ?? null,
            tipo_saida: ultima?.tipo_saida || "",
            motivo: ultima?.motivo || "",
            data_saida: ultima?.data_saida ? new Date(ultima.data_saida).toLocaleDateString("pt-BR") : "",
            observacoes: ultima?.observacoes || "",
            valor: ultima?.valor ?? null,
          };
        });
        setAnimaisInativos(formatado);
      } else {
        setAnimaisInativos([]);
      }

      // Cache
      const cacheData = [
        ...(ativos || []).map((a) => ({ ...a, ativo: true })),
        ...(inativosRaw || []).map((a) => ({ ...a, ativo: false })),
      ];
      await kvSet(CACHE_LIST_KEY, cacheData);
      MEMO_ANIMAIS.lastAt = Date.now();

    } finally {
      setCarregando(false);
    }
  }, [fazendaAtualId, isOnline]);

  useEffect(() => {
    if (fazendaAtualId) carregarAnimais();
  }, [carregarAnimais, fazendaAtualId]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleAtualizar = () => carregarAnimais(true);

  const handleVerFicha = async (animalBasico) => {
    const completo = await carregarAnimalCompleto(animalBasico?.id);
    setAnimalFicha(completo || animalBasico || null);
    setFichaOpen(true);
  };

  // Renderização do conteúdo atual
  const renderContent = () => {
    const props = {
      animais: animaisAtivos,
      onRefresh: handleAtualizar,
      isOnline,
      onVerFicha: handleVerFicha,
    };

    switch (abaAtiva) {
      case "todos":
        return <SubAbasAnimais {...props} />;
      case "entrada":
        return <CadastroAnimal {...props} onAtualizar={handleAtualizar} />;
      case "saida":
        return <SaidaAnimal {...props} onAtualizar={handleAtualizar} />;
      case "inativas":
        return <Inativas animais={animaisInativos} onAtualizar={handleAtualizar} onVerFicha={handleVerFicha} />;
      case "relatorio":
        return <Relatorios />;
      case "importar":
        return <div style={emptyStateStyles}>📥 Importação de dados em desenvolvimento</div>;
      case "exportar":
        return <div style={emptyStateStyles}>📤 Exportação de dados em desenvolvimento</div>;
      default:
        return <SubAbasAnimais {...props} />;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#f8fafc" }}>
      <SidebarModerna abaAtiva={abaAtiva} setAbaAtiva={setAbaAtiva} isOnline={isOnline} />
      
      <main style={{ flex: 1, marginLeft: 280, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Header Moderno */}
        <header style={mainStyles.header}>
          <div>
            <h1 style={mainStyles.title}>
              {menuItems.find(m => m.id === abaAtiva)?.label || utilityItems.find(u => u.id === abaAtiva)?.label}
            </h1>
            <p style={mainStyles.subtitle}>
              {menuItems.find(m => m.id === abaAtiva)?.desc || "Ferramenta de gerenciamento"}
            </p>
          </div>
          
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {carregando && (
              <div style={mainStyles.loadingBadge}>
                <div style={mainStyles.spinner} />
                Atualizando...
              </div>
            )}
            {offlineAviso && (
              <div style={mainStyles.warningBadge}>⚠️ {offlineAviso}</div>
            )}
            <button onClick={handleAtualizar} style={mainStyles.refreshBtn} title="Atualizar dados">
              🔄
            </button>
          </div>
        </header>

        {/* Conteúdo com scroll */}
        <div style={mainStyles.content}>
          <div style={mainStyles.card}>
            {renderContent()}
          </div>
        </div>
      </main>

      {fichaOpen && animalFicha && (
        <FichaAnimal
          animal={animalFicha}
          onClose={() => {
            setFichaOpen(false);
            setAnimalFicha(null);
          }}
        />
      )}
    </div>
  );
}

/* =========================
   ESTILOS DO CONTEÚDO PRINCIPAL
   ========================= */
const mainStyles = {
  header: {
    height: 80,
    backgroundColor: "#fff",
    borderBottom: "1px solid #e2e8f0",
    padding: "0 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  title: {
    fontSize: 24,
    fontWeight: 800,
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.025em",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    margin: "4px 0 0 0",
  },
  loadingBadge: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 16px",
    backgroundColor: "#eff6ff",
    color: "#1e40af",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
  },
  warningBadge: {
    padding: "8px 16px",
    backgroundColor: "#fef3c7",
    color: "#92400e",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
    maxWidth: 400,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  spinner: {
    width: 16,
    height: 16,
    border: "2px solid #bfdbfe",
    borderTopColor: "#3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    backgroundColor: "#fff",
    cursor: "pointer",
    fontSize: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },
  content: {
    flex: 1,
    padding: 24,
    overflow: "auto",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
    border: "1px solid #e2e8f0",
    minHeight: "calc(100vh - 180px)",
    overflow: "hidden",
  },
};

const emptyStateStyles = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  color: "#64748b",
  fontSize: 16,
  gap: 12,
  padding: 48,
};

// Adicionar keyframes para o spinner
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);