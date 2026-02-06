// src/Pages/Ajustes/CentroOperacoes/LogsAuditoria.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, User, Calendar, Activity } from "lucide-react";

const LOGS_MOCK = [
  { id: 1, usuario: "Dra. Ana Silva", acao: "Cadastrou animal #1045", modulo: "Animais", data: "2024-01-15 14:32", tipo: "CREATE" },
  { id: 2, usuario: "Dr. Carlos", acao: "Atualizou protocolo de vacinação", modulo: "Saúde", data: "2024-01-15 13:15", tipo: "UPDATE" },
  { id: 3, usuario: "João (Agrônomo)", acao: "Gerou relatório financeiro", modulo: "Relatórios", data: "2024-01-15 11:45", tipo: "EXPORT" },
  { id: 4, usuario: "Dra. Ana Silva", acao: "Excluiu registro de inseminação", modulo: "Reprodução", data: "2024-01-15 10:20", tipo: "DELETE" },
];

const TIPO_COLORS = {
  CREATE: { bg: "#d1fae5", text: "#065f46", label: "Criação" },
  UPDATE: { bg: "#dbeafe", text: "#1e40af", label: "Atualização" },
  DELETE: { bg: "#fee2e2", text: "#991b1b", label: "Exclusão" },
  EXPORT: { bg: "#fef3c7", text: "#92400e", label: "Exportação" },
};

export default function LogsAuditoria() {
  const [filtro, setFiltro] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos");

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
          Logs de Atividade
        </h3>
        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
          Histórico completo de ações realizadas no sistema
        </p>
      </div>

      {/* Filtros */}
      <div style={{ 
        display: "flex", 
        gap: 12, 
        marginBottom: 24,
        padding: 16,
        background: "#ffffff",
        borderRadius: 12,
        border: "1px solid #e2e8f0",
      }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            type="text"
            placeholder="Buscar por usuário ou ação..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px 10px 40px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              fontSize: 14,
            }}
          />
        </div>
        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            fontSize: 14,
            background: "#ffffff",
          }}
        >
          <option value="todos">Todos os tipos</option>
          <option value="CREATE">Criações</option>
          <option value="UPDATE">Atualizações</option>
          <option value="DELETE">Exclusões</option>
          <option value="EXPORT">Exportações</option>
        </select>
      </div>

      {/* Lista de Logs */}
      <div style={{ background: "#ffffff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "120px 1fr 150px 200px", 
          padding: "16px 20px",
          background: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          fontWeight: 600,
          fontSize: 13,
          color: "#64748b",
        }}>
          <span>Tipo</span>
          <span>Ação</span>
          <span>Módulo</span>
          <span>Data/Hora</span>
        </div>

        {LOGS_MOCK.map((log) => {
          const tipo = TIPO_COLORS[log.tipo];
          return (
            <motion.div
              key={log.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr 150px 200px",
                padding: "16px 20px",
                borderBottom: "1px solid #f1f5f9",
                alignItems: "center",
                fontSize: 14,
              }}
            >
              <span style={{
                display: "inline-flex",
                padding: "4px 10px",
                background: tipo.bg,
                color: tipo.text,
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                width: "fit-content",
              }}>
                {tipo.label}
              </span>
              <div>
                <div style={{ fontWeight: 600, color: "#0f172a" }}>{log.acao}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                  <User size={12} /> {log.usuario}
                </div>
              </div>
              <span style={{ color: "#475569" }}>{log.modulo}</span>
              <span style={{ color: "#64748b", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                <Calendar size={14} /> {log.data}
              </span>
            </motion.div>
          );
        })}
      </div>

      <div style={{ marginTop: 16, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
        Mostrando últimos 50 registros • <button style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontWeight: 600 }}>Carregar mais</button>
      </div>
    </div>
  );
}