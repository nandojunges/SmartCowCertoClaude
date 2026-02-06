// src/Pages/Ajustes/IdentidadeVisual/SecaoTema.jsx
import React from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export default function SecaoTema({ config, setConfig }) {
  const temas = [
    { 
      id: "light", 
      label: "Claro", 
      icon: Sun, 
      desc: "Melhor para ambientes iluminados",
      preview: { bg: "#ffffff", text: "#0f172a", card: "#f8fafc" }
    },
    { 
      id: "dark", 
      label: "Escuro", 
      icon: Moon, 
      desc: "Reduz cansaço visual noturno",
      preview: { bg: "#0f172a", text: "#f8fafc", card: "#1e293b" }
    },
    { 
      id: "auto", 
      label: "Automático", 
      icon: Monitor, 
      desc: "Segue configuração do dispositivo",
      preview: { bg: "#f8fafc", text: "#0f172a", card: "#ffffff" }
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div>
        <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
          Modo de Exibição
        </h3>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: "#64748b" }}>
          Escolha entre tema claro, escuro ou automático.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {temas.map((tema) => {
            const Icon = tema.icon;
            const isActive = config.modoTema === tema.id;
            
            return (
              <button
                key={tema.id}
                onClick={() => setConfig({ ...config, modoTema: tema.id })}
                style={{
                  padding: 20,
                  borderRadius: 16,
                  border: `2px solid ${isActive ? config.corPrimaria : "#e2e8f0"}`,
                  background: isActive ? config.corPrimaria + "05" : "#fff",
                  cursor: "pointer",
                  textAlign: "left",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{ 
                  position: "absolute", 
                  top: 0, 
                  right: 0, 
                  width: 100, 
                  height: 100, 
                  background: tema.preview.bg,
                  opacity: 0.3,
                  borderRadius: "0 0 0 100%",
                }} />
                
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: isActive ? config.corPrimaria : "#f1f5f9",
                    color: isActive ? "#fff" : "#64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}>
                    <Icon size={20} />
                  </div>
                  
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                    {tema.label}
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>
                    {tema.desc}
                  </div>
                </div>

                {isActive && (
                  <div style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: config.corPrimaria,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                  }}>
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview do Tema */}
      <div>
        <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
          Preview
        </h3>
        
        <div style={{
          borderRadius: 20,
          overflow: "hidden",
          border: "1px solid #e2e8f0",
          background: config.modoTema === "dark" ? "#0f172a" : "#ffffff",
          transition: "all 0.3s",
        }}>
          <div style={{
            padding: "16px 24px",
            background: config.modoTema === "dark" ? "#1e293b" : "#f8fafc",
            borderBottom: `1px solid ${config.modoTema === "dark" ? "#334155" : "#e2e8f0"}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: config.corPrimaria,
            }} />
            <div>
              <div style={{ 
                height: 8, 
                width: 120, 
                background: config.modoTema === "dark" ? "#475569" : "#cbd5e1",
                borderRadius: 4,
                marginBottom: 6,
              }} />
              <div style={{ 
                height: 6, 
                width: 80, 
                background: config.modoTema === "dark" ? "#64748b" : "#94a3b8",
                borderRadius: 3,
              }} />
            </div>
          </div>
          
          <div style={{ padding: 24 }}>
            <div style={{ 
              height: 12, 
              width: "60%", 
              background: config.modoTema === "dark" ? "#f8fafc" : "#0f172a",
              borderRadius: 6,
              marginBottom: 12,
              opacity: 0.9,
            }} />
            <div style={{ 
              height: 8, 
              width: "100%", 
              background: config.modoTema === "dark" ? "#94a3b8" : "#64748b",
              borderRadius: 4,
              marginBottom: 8,
              opacity: 0.6,
            }} />
            <div style={{ 
              height: 8, 
              width: "80%", 
              background: config.modoTema === "dark" ? "#94a3b8" : "#64748b",
              borderRadius: 4,
              marginBottom: 24,
              opacity: 0.6,
            }} />
            
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{
                padding: "10px 24px",
                background: config.corPrimaria,
                borderRadius: 8,
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
              }}>
                Ação Principal
              </div>
              <div style={{
                padding: "10px 24px",
                background: config.modoTema === "dark" ? "#334155" : "#e2e8f0",
                borderRadius: 8,
                color: config.modoTema === "dark" ? "#f8fafc" : "#475569",
                fontSize: 14,
                fontWeight: 600,
              }}>
                Secundário
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        padding: 16,
        background: "#fef3c7",
        borderRadius: 12,
        border: "1px solid #fcd34d",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        <Sun size={20} color="#d97706" />
        <span style={{ fontSize: 14, color: "#92400e" }}>
          <strong>Dica:</strong> O modo escuro é ideal para uso noturno e economiza bateria em telas OLED.
        </span>
      </div>
    </div>
  );
}