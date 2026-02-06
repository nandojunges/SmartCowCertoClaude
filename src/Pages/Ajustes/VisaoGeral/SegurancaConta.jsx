// src/Pages/Ajustes/VisaoGeral/SegurancaConta.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Mail, Lock, Shield, Smartphone, AlertTriangle,
  CheckCircle, Loader2, Eye, EyeOff, LogOut
} from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function SegurancaConta({ userData, onUpdate }) {
  const navigate = useNavigate();
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [emailForm, setEmailForm] = useState({
    novoEmail: "",
    confirmarEmail: "",
    senhaAtual: "",
  });

  const [senhaForm, setSenhaForm] = useState({
    senhaAtual: "",
    novaSenha: "",
    confirmarSenha: "",
  });

  const handleEmailChange = async (e) => {
    e.preventDefault();
    
    if (emailForm.novoEmail !== emailForm.confirmarEmail) {
      toast.error("Os emails não coincidem");
      return;
    }

    setLoadingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: emailForm.novoEmail,
      });

      if (error) throw error;

      toast.success("Email de confirmação enviado! Verifique sua caixa de entrada.");
      setEmailForm({ novoEmail: "", confirmarEmail: "", senhaAtual: "" });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingEmail(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (senhaForm.novaSenha.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (senhaForm.novaSenha !== senhaForm.confirmarSenha) {
      toast.error("As senhas não coincidem");
      return;
    }

    setLoadingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: senhaForm.novaSenha,
      });

      if (error) throw error;

      toast.success("Senha atualizada com sucesso!");
      setSenhaForm({ senhaAtual: "", novaSenha: "", confirmarSenha: "" });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleLogoutAll = async () => {
    if (!confirm("Tem certeza que deseja sair de todos os dispositivos?")) return;
    
    try {
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) throw error;
      navigate("/login");
    } catch (error) {
      toast.error("Erro ao encerrar sessões");
    }
  };

  return (
    <div>
      <h3 style={{ margin: "0 0 24px", fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
        Segurança da Conta
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Card - Alterar Email */}
        <div style={{
          background: "#fff",
          borderRadius: 16,
          padding: 24,
          border: "1px solid #e2e8f0",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#eff6ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#3b82f6",
            }}>
              <Mail size={20} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Email de Acesso</h4>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
                Email atual: <strong>{userData.email}</strong>
              </p>
            </div>
          </div>

          <form onSubmit={handleEmailChange} style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#374151" }}>
                  Novo Email
                </label>
                <input
                  type="email"
                  value={emailForm.novoEmail}
                  onChange={(e) => setEmailForm({ ...emailForm, novoEmail: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    fontSize: 14,
                  }}
                  placeholder="novo@email.com"
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#374151" }}>
                  Confirmar Novo Email
                </label>
                <input
                  type="email"
                  value={emailForm.confirmarEmail}
                  onChange={(e) => setEmailForm({ ...emailForm, confirmarEmail: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    fontSize: 14,
                  }}
                  placeholder="Repita o email"
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                disabled={loadingEmail || !emailForm.novoEmail || !emailForm.confirmarEmail}
                style={{
                  padding: "10px 24px",
                  background: loadingEmail ? "#cbd5e1" : "#3b82f6",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loadingEmail ? "not-allowed" : "pointer",
                }}
              >
                {loadingEmail ? "Enviando..." : "Atualizar Email"}
              </button>
            </div>
          </form>
        </div>

        {/* Card - Alterar Senha */}
        <div style={{
          background: "#fff",
          borderRadius: 16,
          padding: 24,
          border: "1px solid #e2e8f0",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#fef3c7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#d97706",
            }}>
              <Lock size={20} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Alterar Senha</h4>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
                Escolha uma senha forte e única
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ position: "relative" }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#374151" }}>
                  Nova Senha
                </label>
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={senhaForm.novaSenha}
                  onChange={(e) => setSenhaForm({ ...senhaForm, novaSenha: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    fontSize: 14,
                  }}
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#64748b",
                    marginTop: 12,
                  }}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#374151" }}>
                  Confirmar Nova Senha
                </label>
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={senhaForm.confirmarSenha}
                  onChange={(e) => setSenhaForm({ ...senhaForm, confirmarSenha: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    fontSize: 14,
                  }}
                  placeholder="Repita a senha"
                />
              </div>
            </div>

            <div style={{ 
              padding: 12, 
              background: "#f8fafc", 
              borderRadius: 8, 
              fontSize: 13, 
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <Shield size={16} />
              <span>Dica: Use letras maiúsculas, minúsculas, números e símbolos para maior segurança.</span>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                disabled={loadingPassword || !senhaForm.novaSenha || !senhaForm.confirmarSenha}
                style={{
                  padding: "10px 24px",
                  background: loadingPassword ? "#cbd5e1" : "#d97706",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loadingPassword ? "not-allowed" : "pointer",
                }}
              >
                {loadingPassword ? "Atualizando..." : "Alterar Senha"}
              </button>
            </div>
          </form>
        </div>

        {/* Card - Sessões Ativas */}
        <div style={{
          background: "#fff",
          borderRadius: 16,
          padding: 24,
          border: "1px solid #e2e8f0",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#fee2e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#dc2626",
            }}>
              <Smartphone size={20} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Sessões Ativas</h4>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
                Gerencie seus dispositivos conectados
              </p>
            </div>
          </div>

          <div style={{ 
            padding: 16, 
            background: "#f0fdf4", 
            borderRadius: 10, 
            border: "1px solid #bbf7d0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <CheckCircle size={20} color="#10b981" />
              <div>
                <div style={{ fontWeight: 600, color: "#0f172a", fontSize: 14 }}>Este dispositivo</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Último acesso: Agora</div>
              </div>
            </div>
            <span style={{
              padding: "4px 12px",
              background: "#10b981",
              color: "#fff",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
            }}>
              Ativo
            </span>
          </div>

          <button
            onClick={handleLogoutAll}
            style={{
              width: "100%",
              padding: "12px",
              background: "#fee2e2",
              color: "#dc2626",
              border: "1px solid #fecaca",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <LogOut size={18} /> Encerrar todas as sessões
          </button>
        </div>
      </div>
    </div>
  );
}