// src/Pages/Ajustes/IdentidadeVisual/SecaoTipografia.jsx
import React from "react";
import { Type, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

const FONTES = [
  { id: "Inter", nome: "Inter", categoria: "Sem Serifa", desc: "Moderna e limpa" },
  { id: "Roboto", nome: "Roboto", categoria: "Sem Serifa", desc: "Google Material" },
  { id: "Lato", nome: "Lato", categoria: "Sem Serifa", desc: "Amigável e profissional" },
  { id: "Merriweather", nome: "Merriweather", categoria: "Serifada", desc: "Clássica e elegante" },
  { id: "Poppins", nome: "Poppins", categoria: "Sem Serifa", desc: "Geométrica e jovem" },
  { id: "Fira Code", nome: "Fira Code", categoria: "Monoespaçada", desc: "Para relatórios técnicos" },
];

const TAMANHOS_BASE = [
  { id: "small", label: "Pequeno", desc: "14px base - Mais conteúdo na tela" },
  { id: "medium", label: "Padrão", desc: "16px base - Equilibrado" },
  { id: "large", label: "Grande", desc: "18px base - Melhor acessibilidade" },
];

export default function SecaoTipografia({ config, setConfig }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div>
        <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
          Fonte Principal
        </h3>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: "#64748b" }}>
          Escolha a tipografia que será usada em todo o sistema.
        </p>

        <div style={{ display: "grid", gap: 12 }}>
          {FONTES.map((fonte) => (
            <button
              key={fonte.id}
              onClick={() => setConfig({ ...config, fonte: fonte.id })}
              style={{
                display: "flex",
                alignItems: "center",
                padding: 16,
                borderRadius: 12,
                border: `2px solid ${config.fonte === fonte.id ? config.corPrimaria : "#e2e8f0"}`,
                background: config.fonte === fonte.id ? config.corPrimaria + "05" : "#fff",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s",
              }}
            >
              <div style={{ 
                width: 60, 
                height: 60, 
                borderRadius: 10, 
                background: "#f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 16,
                fontFamily: fonte.id,
                fontSize: 24,
                fontWeight: 700,
                color: config.corPrimaria,
              }}>
                Aa
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: 16, 
                  fontWeight: 700, 
                  color: "#0f172a",
                  fontFamily: fonte.id,
                  marginBottom: 4,
                }}>
                  {fonte.nome}
                </div>
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  {fonte.categoria} • {fonte.desc}
                </div>
              </div>
              {config.fonte === fonte.id && (
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: config.corPrimaria,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  ✓
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: "#e2e8f0" }} />

      <div>
        <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
          Tamanho da Fonte Base
        </h3>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: "#64748b" }}>
          Ajuste o tamanho base para melhor legibilidade.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {TAMANHOS_BASE.map((tam) => (
            <button
              key={tam.id}
              onClick={() => setConfig({ ...config, tamanhoFonte: tam.id })}
              style={{
                padding: 20,
                borderRadius: 12,
                border: `2px solid ${config.tamanhoFonte === tam.id ? config.corPrimaria : "#e2e8f0"}`,
                background: config.tamanhoFonte === tam.id ? config.corPrimaria + "05" : "#fff",
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              <div style={{ 
                fontSize: tam.id === "small" ? 14 : tam.id === "medium" ? 18 : 22, 
                fontWeight: 700, 
                color: "#0f172a",
                marginBottom: 8,
              }}>
                A
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>
                {tam.label}
              </div>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                {tam.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: "#e2e8f0" }} />

      <div>
        <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
          Preview em Texto
        </h3>
        <div style={{
          padding: 24,
          background: "#f8fafc",
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          fontFamily: config.fonte,
        }}>
          <h4 style={{ margin: "0 0 12px", fontSize: 24, fontWeight: 700, color: "#0f172a" }}>
            Gestão Rural Inteligente
          </h4>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "#475569" }}>
            A tipografia escolhida afeta a legibilidade de todos os textos do sistema, 
            desde relatórios técnicos até notificações no campo. Escolha uma fonte que 
            combine com a identidade da sua fazenda.
          </p>
          <div style={{ marginTop: 16, display: "flex", gap: 16, fontSize: 14 }}>
            <span style={{ fontWeight: 700, color: config.corPrimaria }}>Botão Primário</span>
            <span style={{ fontWeight: 600, color: "#64748b" }}>Texto Secundário</span>
            <span style={{ fontFamily: "monospace", background: "#e2e8f0", padding: "2px 6px", borderRadius: 4 }}>
              Código: 12345
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}