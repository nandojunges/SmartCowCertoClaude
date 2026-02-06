// src/Pages/Reproducao/SidebarConfig/PreSyncTab.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useFazenda } from "../../../context/FazendaContext";

export default function PreSyncTab() {
  const { fazendaAtualId } = useFazenda();
  const [grupos, setGrupos] = useState([]);
  const [animais, setAnimais] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [novoGrupo, setNovoGrupo] = useState({
    nome: "",
    descricao: "",
    cor: "#10b981",
    data_inicio: "",
    protocolo_id: ""
  });

  const [grupoSelecionado, setGrupoSelecionado] = useState(null);

  useEffect(() => {
    carregarGrupos();
    carregarAnimais();
  }, [fazendaAtualId]);

  const carregarGrupos = async () => {
    if (!fazendaAtualId) return;
    const { data } = await supabase
      .from("repro_grupos_presync")
      .select("*, repro_protocolos(nome)")
      .eq("fazenda_id", fazendaAtualId);
    if (data) setGrupos(data);
  };

  const carregarAnimais = async () => {
    if (!fazendaAtualId) return;
    const { data } = await supabase
      .from("animais")
      .select("id, numero, brinco, categoria")
      .eq("fazenda_id", fazendaAtualId)
      .eq("sexo", "FEMEA");
    if (data) setAnimais(data);
  };

  const salvarGrupo = async () => {
    if (!novoGrupo.nome) return alert("Nome do grupo é obrigatório");
    
    await supabase.from("repro_grupos_presync").insert([{
      ...novoGrupo,
      fazenda_id: fazendaAtualId,
      created_at: new Date().toISOString()
    }]);
    
    setNovoGrupo({ nome: "", descricao: "", cor: "#10b981", data_inicio: "", protocolo_id: "" });
    carregarGrupos();
  };

  const excluirGrupo = async (id) => {
    if (!confirm("Excluir grupo?")) return;
    await supabase.from("repro_grupos_presync").delete().eq("id", id);
    carregarGrupos();
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ margin: "0 0 20px 0", color: "#1e293b", fontSize: "20px" }}>
        🔄 Grupos de Pré-sincronização
      </h2>

      {/* Criar Grupo */}
      <div style={{ 
        background: "#f8fafc", 
        padding: "20px", 
        borderRadius: "12px", 
        marginBottom: "24px",
        border: "1px solid #e2e8f0"
      }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", color: "#475569" }}>
          Novo Grupo
        </h3>

        <div style={{ display: "grid", gap: "12px" }}>
          <input
            type="text"
            placeholder="Nome do grupo"
            value={novoGrupo.nome}
            onChange={(e) => setNovoGrupo({...novoGrupo, nome: e.target.value})}
            style={inputStyle}
          />
          
          <input
            type="text"
            placeholder="Descrição"
            value={novoGrupo.descricao}
            onChange={(e) => setNovoGrupo({...novoGrupo, descricao: e.target.value})}
            style={inputStyle}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <input
              type="date"
              placeholder="Data de início"
              value={novoGrupo.data_inicio}
              onChange={(e) => setNovoGrupo({...novoGrupo, data_inicio: e.target.value})}
              style={inputStyle}
            />
            
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <input
                type="color"
                value={novoGrupo.cor}
                onChange={(e) => setNovoGrupo({...novoGrupo, cor: e.target.value})}
                style={{ width: "50px", height: "40px", border: "none", borderRadius: "6px" }}
              />
              <span style={{ fontSize: "13px", color: "#64748b" }}>Cor identificadora</span>
            </div>
          </div>

          <button
            onClick={salvarGrupo}
            style={{
              padding: "12px",
              background: "linear-gradient(135deg, #0f766e, #0d9488)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              marginTop: "8px"
            }}
          >
            Criar Grupo
          </button>
        </div>
      </div>

      {/* Lista de Grupos */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {grupos.map((grupo) => (
          <div 
            key={grupo.id}
            style={{
              background: "white",
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              borderLeft: `4px solid ${grupo.cor}`
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h4 style={{ margin: "0 0 4px 0", color: "#1e293b" }}>{grupo.nome}</h4>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>{grupo.descricao}</p>
                {grupo.data_inicio && (
                  <span style={{ fontSize: "12px", color: "#0f766e" }}>
                    Início: {new Date(grupo.data_inicio).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  onClick={() => setGrupoSelecionado(grupoSelecionado === grupo.id ? null : grupo.id)}
                  style={{
                    padding: "6px 12px",
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px"
                  }}
                >
                  {grupoSelecionado === grupo.id ? "Ocultar" : "Ver Animais"}
                </button>
                <button
                  onClick={() => excluirGrupo(grupo.id)}
                  style={btnIconStyle("#ef4444")}
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* Lista de animais do grupo (simulado - você pode criar uma tabela de relacionamento) */}
            {grupoSelecionado === grupo.id && (
              <div style={{ 
                marginTop: "12px", 
                padding: "12px", 
                background: "#f8fafc", 
                borderRadius: "6px",
                fontSize: "13px",
                color: "#64748b"
              }}>
                <p style={{ margin: "0 0 8px 0" }}>Animais neste grupo:</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {/* Aqui você faria um map dos animais vinculados ao grupo */}
                  <span style={{ padding: "2px 8px", background: "white", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                    Exemplo: Vaca 123
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  fontSize: "14px",
  width: "100%"
};

const btnIconStyle = (color) => ({
  background: color + "15",
  color: color,
  border: "none",
  padding: "6px 10px",
  borderRadius: "6px",
  cursor: "pointer"
});