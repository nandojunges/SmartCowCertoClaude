// src/Pages/Reproducao/SidebarConfig/RelatoriosTab.jsx
import { useState } from "react";

export default function RelatoriosTab() {
  const [relatorioSelecionado, setRelatorioSelecionado] = useState(null);

  const relatorios = [
    {
      id: "taxa_prenhez",
      titulo: "Taxa de Prenhez",
      descricao: "Percentual de prenhez por lote, protocolo ou período",
      icon: "🤰",
      cor: "#10b981",
      filtros: ["Período", "Lote", "Protocolo"]
    },
    {
      id: "eficiencia_ia",
      titulo: "Eficiência de IA",
      descricao: "Taxa de concepção, repasse e distribuição de IAs",
      icon: "🎯",
      cor: "#0ea5e9",
      filtros: ["Touro", "Inseminador", "Período"]
    },
    {
      id: "dias_abertos",
      titulo: "Dias Abertos",
      descricao: "Média de dias abertos por categoria e lote",
      icon: "📅",
      cor: "#f59e0b",
      filtros: ["Categoria", "Lactação"]
    },
    {
      id: "uso_protocolos",
      titulo: "Uso de Protocolos",
      descricao: "Estatísticas de utilização dos protocolos cadastrados",
      icon: "📊",
      cor: "#8b5cf6",
      filtros: ["Protocolo", "Período"]
    },
    {
      id: "curva_lactacao",
      titulo: "Curva de Lactação",
      descricao: "Produção por lote de parição e estação",
      icon: "🥛",
      cor: "#ec4899",
      filtros: ["Lote", "Período"]
    },
    {
      id: "sincronizacao",
      titulo: "Sincronização",
      descricao: "Acompanhamento de grupos de pré-sincronização",
      icon: "🔄",
      cor: "#06b6d4",
      filtros: ["Grupo", "Status"]
    }
  ];

  const gerarRelatorio = (id) => {
    console.log("Gerando relatório:", id);
    alert(`Gerando relatório: ${id}\n\n(Integrar com geração de PDF/Excel)`);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ margin: "0 0 20px 0", color: "#1e293b", fontSize: "20px" }}>
        📊 Relatórios de Reprodução
      </h2>

      <div style={{ display: "grid", gap: "12px" }}>
        {relatorios.map((rel) => (
          <div
            key={rel.id}
            style={{
              background: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "20px",
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = rel.cor;
              e.currentTarget.style.transform = "translateX(4px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.transform = "translateX(0)";
            }}
          >
            <div style={{ display: "flex", gap: "16px", alignItems: "start" }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: `${rel.cor}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px"
              }}>
                {rel.icon}
              </div>
              
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: "0 0 4px 0", color: "#1e293b", fontSize: "16px" }}>
                  {rel.titulo}
                </h3>
                <p style={{ margin: "0 0 12px 0", color: "#64748b", fontSize: "14px" }}>
                  {rel.descricao}
                </p>
                
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {rel.filtros.map((filtro, idx) => (
                    <span key={idx} style={{
                      padding: "2px 8px",
                      background: "#f1f5f9",
                      color: "#64748b",
                      borderRadius: "4px",
                      fontSize: "12px"
                    }}>
                      {filtro}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => gerarRelatorio(rel.id)}
                style={{
                  padding: "10px 20px",
                  background: rel.cor,
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "13px",
                  whiteSpace: "nowrap"
                }}
              >
                Gerar
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ 
        marginTop: "24px", 
        padding: "16px", 
        background: "#f0fdf4", 
        borderRadius: "8px",
        border: "1px solid #bbf7d0"
      }}>
        <h4 style={{ margin: "0 0 8px 0", color: "#166534", fontSize: "14px" }}>
          💡 Dica
        </h4>
        <p style={{ margin: 0, color: "#15803d", fontSize: "13px" }}>
          Os relatórios podem ser exportados em PDF ou Excel. Configure períodos específicos para análises mais precisas.
        </p>
      </div>
    </div>
  );
}