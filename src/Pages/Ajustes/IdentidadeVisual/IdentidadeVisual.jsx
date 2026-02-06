// src/Pages/Ajustes/IdentidadeVisual/index.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Palette, Type, Image, Mail, QrCode, Monitor, 
  Smartphone, Download, CheckCircle, Loader2 
} from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { useFazenda } from "../../../context/FazendaContext";
import { toast } from "react-toastify";
import SecaoTipografia from "./SecaoTipografia";
import SecaoTema from "./SecaoTema";
import SecaoMidiaKit from "./SecaoMidiaKit";

const CORES_PRESET = [
  { id: "azul", hex: "#3b82f6", nome: "Azul Royal" },
  { id: "verde", hex: "#10b981", nome: "Verde Pastagem" },
  { id: "laranja", hex: "#f97316", nome: "Laranja Terra" },
  { id: "vermelho", hex: "#ef4444", nome: "Vermelho Boi" },
  { id: "roxo", hex: "#8b5cf6", nome: "Roxo Açaí" },
  { id: "rosa", hex: "#ec4899", nome: "Rosa Floral" },
  { id: "turquesa", hex: "#14b8a6", nome: "Turquesa Água" },
  { id: "marrom", hex: "#92400e", nome: "Marrom Café" },
];

export default function IdentidadeVisual() {
  const { fazendaAtualId } = useFazenda();
  const [activeTab, setActiveTab] = useState("marca");
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    logo: null,
    corPrimaria: "#3b82f6",
    corSecundaria: "#1e40af",
    fonte: "Inter",
    modoTema: "light",
    banner: null,
    favicon: null,
    assinaturaEmail: true,
    qrCodeAtivo: true,
  });

  // Carregar configurações salvas
  useEffect(() => {
    const loadConfig = async () => {
      if (!fazendaAtualId) return;
      
      const { data } = await supabase
        .from("fazenda_config")
        .select("*")
        .eq("fazenda_id", fazendaAtualId)
        .single();

      if (data) {
        setConfig(prev => ({ ...prev, ...data.config }));
      }
    };
    loadConfig();
  }, [fazendaAtualId]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await supabase
        .from("fazenda_config")
        .upsert({
          fazenda_id: fazendaAtualId,
          config: config,
          updated_at: new Date().toISOString(),
        });
      toast.success("Identidade visual salva!");
    } catch (error) {
      toast.error("Erro ao salvar");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "marca", label: "Marca", icon: Palette },
    { id: "tipografia", label: "Tipografia", icon: Type },
    { id: "tema", label: "Tema", icon: Monitor },
    { id: "midia", label: "Mídia Kit", icon: Image },
  ];

  return (
    <div style={{ animation: "fadeIn 0.4s ease-out" }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#0f172a" }}>
          Identidade Visual
        </h2>
        <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 16 }}>
          Personalize a aparência do sistema para sua fazenda
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 32 }}>
        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 18px",
                  borderRadius: 12,
                  border: "none",
                  background: isActive ? config.corPrimaria + "15" : "transparent",
                  color: isActive ? config.corPrimaria : "#64748b",
                  cursor: "pointer",
                  fontWeight: isActive ? 700 : 500,
                  textAlign: "left",
                  transition: "all 0.2s",
                }}
              >
                <Icon size={20} />
                {tab.label}
              </button>
            );
          })}

          <div style={{ marginTop: "auto", paddingTop: 24, borderTop: "1px solid #e2e8f0" }}>
            <button
              onClick={handleSave}
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: loading ? "#cbd5e1" : config.corPrimaria,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {loading ? <Loader2 size={18} className="spin" /> : <CheckCircle size={18} />}
              {loading ? "Salvando..." : "Aplicar Alterações"}
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              {activeTab === "marca" && (
                <SecaoMarca config={config} setConfig={setConfig} />
              )}
              {activeTab === "tipografia" && (
                <SecaoTipografia config={config} setConfig={setConfig} />
              )}
              {activeTab === "tema" && (
                <SecaoTema config={config} setConfig={setConfig} />
              )}
              {activeTab === "midia" && (
                <SecaoMidiaKit config={config} fazendaId={fazendaAtualId} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Seção Marca (Logo + Cores) - Componente interno ou separar se preferir
function SecaoMarca({ config, setConfig }) {
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo deve ter menos de 2MB");
      return;
    }

    // Preview local
    const url = URL.createObjectURL(file);
    setConfig({ ...config, logo: url });
    
    // Upload para storage (simulado aqui)
    toast.success("Logo carregado!");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Upload de Logo */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
            Logo da Fazenda
          </h3>
          <p style={{ margin: "0 0 16px", fontSize: 14, color: "#64748b" }}>
            Recomendado: PNG transparente, 512x512px
          </p>
          
          <div
            onClick={() => document.getElementById("logo-input").click()}
            style={{
              width: 200,
              height: 200,
              borderRadius: 24,
              border: "2px dashed #cbd5e1",
              background: "#f8fafc",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <input
              id="logo-input"
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              style={{ display: "none" }}
            />
            {config.logo ? (
              <img src={config.logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 20 }} />
            ) : (
              <>
                <Image size={40} color="#94a3b8" style={{ marginBottom: 12 }} />
                <span style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>Clique para adicionar</span>
              </>
            )}
          </div>
        </div>

        {/* Preview */}
        <div style={{
          background: "#fff",
          borderRadius: 20,
          padding: 32,
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
        }}>
          <h4 style={{ margin: "0 0 20px", fontSize: 14, fontWeight: 700, color: "#374151" }}>Preview</h4>
          
          <div style={{
            padding: 24,
            background: config.corPrimaria + "10",
            borderRadius: 16,
            border: `2px solid ${config.corPrimaria}30`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: config.logo ? "transparent" : config.corPrimaria,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}>
                {config.logo ? (
                  <img src={config.logo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ color: "#fff", fontSize: 24, fontWeight: 800 }}>F</span>
                )}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, color: "#0f172a" }}>Fazenda Exemplo</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>Sistema de Gestão</div>
              </div>
            </div>
            
            <button style={{
              width: "100%",
              padding: "12px",
              background: config.corPrimaria,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 14,
            }}>
              Botão de Exemplo
            </button>
          </div>
        </div>
      </div>

      {/* Paleta de Cores */}
      <div>
        <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
          Cor Primária
        </h3>
        <p style={{ margin: "0 0 16px", fontSize: 14, color: "#64748b" }}>
          Esta cor será usada nos botões, gráficos e indicadores do sistema.
        </p>
        
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {CORES_PRESET.map((cor) => (
            <button
              key={cor.id}
              onClick={() => setConfig({ ...config, corPrimaria: cor.hex })}
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: cor.hex,
                border: config.corPrimaria === cor.hex ? "3px solid #0f172a" : "3px solid transparent",
                cursor: "pointer",
                boxShadow: config.corPrimaria === cor.hex ? `0 0 0 4px ${cor.hex}40` : "none",
                transition: "all 0.2s",
                position: "relative",
              }}
              title={cor.nome}
            >
              {config.corPrimaria === cor.hex && (
                <CheckCircle size={20} color="#fff" style={{ position: "absolute", inset: 0, margin: "auto" }} />
              )}
            </button>
          ))}
          
          {/* Color Picker Custom */}
          <div style={{ position: "relative" }}>
            <input
              type="color"
              value={config.corPrimaria}
              onChange={(e) => setConfig({ ...config, corPrimaria: e.target.value })}
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                border: "3px dashed #cbd5e1",
                cursor: "pointer",
                padding: 0,
                overflow: "hidden",
              }}
            />
          </div>
        </div>
      </div>

      {/* Favicon */}
      <div>
        <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
          Favicon (Ícone do Navegador)
        </h3>
        <p style={{ margin: "0 0 16px", fontSize: 14, color: "#64748b" }}>
          Ícone que aparece na aba do navegador. Recomendado: 32x32px ou 64x64px.
        </p>
        
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 8,
            background: config.corPrimaria,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 32,
            fontWeight: 800,
          }}>
            F
          </div>
          <button
            style={{
              padding: "10px 20px",
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              color: "#374151",
            }}
          >
            Alterar Favicon
          </button>
        </div>
      </div>
    </div>
  );
}