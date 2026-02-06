// src/Pages/Ajustes/VisaoGeral/index.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Shield, MapPin, Camera, Loader2,
  CheckCircle, AlertCircle, ChevronRight 
} from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { useFazenda } from "../../../context/FazendaContext";
import { toast } from "react-toastify";
import PerfilUsuario from "./PerfilUsuario";
import SegurancaConta from "./SegurancaConta";

const TABS = [
  { id: "perfil", label: "Meu Perfil", icon: User, desc: "Dados pessoais e foto" },
  { id: "seguranca", label: "Segurança", icon: Shield, desc: "Senha e acesso" },
];

export default function VisaoGeral() {
  const [activeTab, setActiveTab] = useState("perfil");
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    id: null,
    email: "",
    nome: "",
    avatar: null,
    telefone: "",
    cidade: "",
    estado: "",
    bio: "",
    created_at: null,
  });

  // Carregar dados do usuário
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Buscar perfil completo
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        setUserData({
          id: user.id,
          email: user.email,
          nome: profile?.full_name || user.user_metadata?.full_name || "",
          avatar: profile?.avatar_url || null,
          telefone: profile?.telefone || "",
          cidade: profile?.cidade || "",
          estado: profile?.estado || "",
          bio: profile?.bio || "",
          created_at: user.created_at,
        });
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const updateUserData = (newData) => {
    setUserData({ ...userData, ...newData });
  };

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        height: 400,
        flexDirection: "column",
        gap: 16,
        color: "#64748b"
      }}>
        <Loader2 size={32} className="animate-spin" />
        <span>Carregando suas informações...</span>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.4s ease-out" }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#0f172a" }}>
          Visão Geral
        </h2>
        <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 16 }}>
          Gerencie seus dados pessoais e segurança da conta
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 32 }}>
        {/* Sidebar de Navegação */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Card do Usuário Resumo */}
          <div style={{
            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
            borderRadius: 20,
            padding: 24,
            color: "#ffffff",
            marginBottom: 8,
            boxShadow: "0 10px 30px -5px rgba(59, 130, 246, 0.3)",
          }}>
            <div style={{ 
              width: 80, 
              height: 80, 
              borderRadius: "50%", 
              margin: "0 auto 16px",
              border: "4px solid rgba(255,255,255,0.3)",
              overflow: "hidden",
              background: "#ffffff",
            }}>
              {userData.avatar ? (
                <img 
                  src={userData.avatar} 
                  alt="Perfil" 
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ 
                  width: "100%", 
                  height: "100%", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  fontSize: 32,
                  color: "#3b82f6",
                }}>
                  {userData.nome?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
            </div>
            <h3 style={{ margin: 0, textAlign: "center", fontSize: 18, fontWeight: 700 }}>
              {userData.nome || "Sem nome"}
            </h3>
            <p style={{ margin: "4px 0 0", textAlign: "center", fontSize: 13, opacity: 0.9 }}>
              {userData.email}
            </p>
            <div style={{ 
              marginTop: 16, 
              paddingTop: 16, 
              borderTop: "1px solid rgba(255,255,255,0.2)",
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
            }}>
              <span>Membro desde</span>
              <span style={{ fontWeight: 600 }}>
                {new Date(userData.created_at).toLocaleDateString("pt-BR")}
              </span>
            </div>
          </div>

          {/* Menu de Tabs */}
          {TABS.map((tab) => {
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
                  padding: "16px 20px",
                  borderRadius: 12,
                  border: "none",
                  background: isActive ? "#eff6ff" : "transparent",
                  color: isActive ? "#1d4ed8" : "#64748b",
                  cursor: "pointer",
                  textAlign: "left",
                  fontWeight: isActive ? 700 : 500,
                  transition: "all 0.2s",
                  position: "relative",
                }}
              >
                <Icon size={20} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14 }}>{tab.label}</div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>{tab.desc}</div>
                </div>
                <ChevronRight 
                  size={16} 
                  style={{ 
                    transform: isActive ? "rotate(90deg)" : "none",
                    transition: "transform 0.2s",
                    opacity: isActive ? 1 : 0
                  }} 
                />
              </button>
            );
          })}
        </div>

        {/* Conteúdo */}
        <div style={{ minHeight: 600 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === "perfil" ? (
                <PerfilUsuario userData={userData} onUpdate={updateUserData} />
              ) : (
                <SegurancaConta userData={userData} onUpdate={updateUserData} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}