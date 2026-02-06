// src/Pages/Ajustes/VisaoGeral/PerfilUsuario.jsx
import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Camera, MapPin, User, Phone, FileText, 
  MapPinned, CheckCircle, Loader2 
} from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { toast } from "react-toastify";

const ESTADOS_BR = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", 
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", 
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function PerfilUsuario({ userData, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: userData.nome || "",
    telefone: userData.telefone || "",
    cidade: userData.cidade || "",
    estado: userData.estado || "",
    bio: userData.bio || "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(userData.avatar);
  const fileInputRef = useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Imagem deve ter menos de 5MB");
        return;
      }
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
      setAvatarFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let avatarUrl = userData.avatar;

      // Upload do avatar se houver arquivo novo
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `avatars/${userData.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("profiles")
          .upload(fileName, avatarFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("profiles")
          .getPublicUrl(fileName);
        
        avatarUrl = publicUrl;
      }

      // Atualizar perfil no banco
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: userData.id,
          full_name: formData.nome,
          telefone: formData.telefone,
          cidade: formData.cidade,
          estado: formData.estado,
          bio: formData.bio,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      onUpdate({
        nome: formData.nome,
        telefone: formData.telefone,
        cidade: formData.cidade,
        estado: formData.estado,
        bio: formData.bio,
        avatar: avatarUrl,
      });

      toast.success("Perfil atualizado com sucesso!");
      setAvatarFile(null);
    } catch (error) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 style={{ margin: "0 0 24px", fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
        Informações do Produtor
      </h3>

      <form onSubmit={handleSubmit}>
        {/* Seção da Foto - Estilo Instagram */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 32, 
          marginBottom: 32,
          padding: 24,
          background: "#f8fafc",
          borderRadius: 16,
        }}>
          <div style={{ position: "relative" }}>
            <div 
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                overflow: "hidden",
                cursor: "pointer",
                border: "4px solid #e2e8f0",
                position: "relative",
                background: "#ffffff",
              }}
            >
              {avatarPreview ? (
                <img 
                  src={avatarPreview} 
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
                  background: "#e2e8f0",
                  color: "#64748b",
                  fontSize: 48,
                  fontWeight: 700,
                }}>
                  {formData.nome?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
              
              {/* Overlay de câmera */}
              <div style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0,
                transition: "opacity 0.2s",
                ":hover": { opacity: 1 },
              }}>
                <Camera size={32} color="#fff" />
              </div>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: "none" }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <h4 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
              Foto de Perfil
            </h4>
            <p style={{ margin: "0 0 16px", fontSize: 14, color: "#64748b", lineHeight: 1.5 }}>
              Escolha uma foto para personalizar sua conta. Recomendamos uma imagem de rosto em um círculo, como em redes sociais.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: "8px 16px",
                  background: "#0f172a",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Escolher foto
              </button>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={() => {
                    setAvatarPreview(null);
                    setAvatarFile(null);
                  }}
                  style={{
                    padding: "8px 16px",
                    background: "#fff",
                    color: "#64748b",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Remover
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Grid de Campos */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600, color: "#374151" }}>
              <User size={16} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
              Nome Completo
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                fontSize: 15,
                outline: "none",
                ":focus": { borderColor: "#3b82f6" }
              }}
              placeholder="Seu nome completo"
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600, color: "#374151" }}>
              <Phone size={16} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
              WhatsApp / Telefone
            </label>
            <input
              type="tel"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                fontSize: 15,
              }}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600, color: "#374151" }}>
              <MapPinned size={16} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
              Cidade
            </label>
            <input
              type="text"
              value={formData.cidade}
              onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                fontSize: 15,
              }}
              placeholder="Ex: Ribeirão Preto"
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600, color: "#374151" }}>
              <MapPin size={16} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
              Estado
            </label>
            <select
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                fontSize: 15,
                background: "#fff",
              }}
            >
              <option value="">Selecione...</option>
              {ESTADOS_BR.map((uf) => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bio */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600, color: "#374151" }}>
            <FileText size={16} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
            Bio / Sobre mim
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={3}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              fontSize: 15,
              resize: "vertical",
              minHeight: 100,
            }}
            placeholder="Conte um pouco sobre você e sua experiência com o rebanho..."
          />
          <span style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, display: "block" }}>
            Máximo 200 caracteres
          </span>
        </div>

        {/* Mapa de Localização */}
        {(formData.cidade && formData.estado) && (
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600, color: "#374151" }}>
              <MapPin size={16} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
              Localização da Fazenda
            </label>
            <div style={{
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid #e2e8f0",
              height: 250,
              background: "#f1f5f9",
            }}>
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight="0"
                marginWidth="0"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(
                  formData.cidade + ", " + formData.estado + ", Brasil"
                )}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                style={{ filter: "grayscale(0.2)" }}
              />
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "#64748b" }}>
              Localização aproximada baseada na cidade/estado informados.
            </p>
          </div>
        )}

        {/* Botão Salvar */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 32px",
              background: loading ? "#cbd5e1" : "#0f172a",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Salvando...
              </>
            ) : (
              <>
                <CheckCircle size={18} /> Salvar Alterações
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}