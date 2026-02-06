// src/Auth/Login.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Eye, EyeOff, ArrowRight, Mail, Lock, 
  WifiOff, AlertCircle, CheckCircle2, Zap
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { canUseOffline, saveOfflineSession } from "../offline/offlineAuth";
import { useFazenda } from "../context/FazendaContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [lembrar, setLembrar] = useState(false);
  const [erro, setErro] = useState("");
  const [offlineError, setOfflineError] = useState("");
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const { setFazendaAtualId } = useFazenda();
  const navigate = useNavigate();

  // Efeito parallax suave no mouse
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setMousePosition({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const salvo = localStorage.getItem("rememberEmail");
    if (salvo) {
      setEmail(salvo);
      setLembrar(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const validar = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErro("Por favor, insira um email válido");
      return false;
    }
    if (!senha.trim()) {
      setErro("A senha é obrigatória");
      return false;
    }
    setErro("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;

    setCarregando(true);
    setOfflineError("");

    try {
      const emailTrim = email.trim().toLowerCase();
      
      if (!navigator.onLine) {
        const allowed = await canUseOffline();
        if (allowed) {
          navigate("/inicio", { replace: true });
          return;
        }
        setOfflineError("Conexão necessária para primeiro acesso neste dispositivo.");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailTrim,
        password: senha,
      });

      if (error) {
        setErro("Credenciais inválidas. Verifique seu email e senha.");
        return;
      }

      if (lembrar) localStorage.setItem("rememberEmail", emailTrim);
      else localStorage.removeItem("rememberEmail");

      await saveOfflineSession({
        userId: data.user.id,
        email: data.user.email,
        savedAtISO: new Date().toISOString(),
      });

      const { data: perfil } = await supabase
        .from("profiles")
        .select("role, tipo_conta")
        .eq("id", data.user.id)
        .single();

      const tipoConta = perfil?.tipo_conta || "PRODUTOR";
      
      if (perfil?.role === "admin") navigate("/admin", { replace: true });
      else if (tipoConta === "ASSISTENTE_TECNICO") navigate("/tecnico", { replace: true });
      else navigate("/inicio", { replace: true });

    } catch (err) {
      setErro("Erro ao conectar. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      background: "#0f172a",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      overflow: "hidden",
      position: "relative",
    }}>
      {/* Background Animado - Círculos Gradientes */}
      <div style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}>
        <motion.div 
          animate={{ 
            x: mousePosition.x * 2,
            y: mousePosition.y * 2,
            scale: [1, 1.2, 1],
          }}
          transition={{ 
            x: { type: "spring", stiffness: 50 },
            y: { type: "spring", stiffness: 50 },
            scale: { duration: 8, repeat: Infinity }
          }}
          style={{
            position: "absolute",
            top: "-20%",
            left: "-10%",
            width: "600px",
            height: "600px",
            background: "radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(60px)",
          }}
        />
        <motion.div 
          animate={{ 
            x: -mousePosition.x * 2,
            y: -mousePosition.y * 2,
            scale: [1.2, 1, 1.2],
          }}
          transition={{ 
            x: { type: "spring", stiffness: 50 },
            y: { type: "spring", stiffness: 50 },
            scale: { duration: 10, repeat: Infinity }
          }}
          style={{
            position: "absolute",
            bottom: "-20%",
            right: "-10%",
            width: "800px",
            height: "800px",
            background: "radial-gradient(circle, rgba(147,51,234,0.2) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(80px)",
          }}
        />
      </div>

      {/* Lado Esquerdo - Imagem/Brand */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          flex: 1,
          backgroundImage: "url('/icones/telafundo.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
          display: "none",
        }}
        className="left-side"
      >
        {/* Overlay Gradient */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,58,138,0.6) 50%, rgba(88,28,135,0.4) 100%)",
        }} />
        
        {/* Glassmorphism Card no Left Side */}
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          color: "#fff",
        }}>
          <div>
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "40px",
              }}
            >
              <div style={{
                width: "50px",
                height: "50px",
                background: "linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 10px 30px -10px rgba(59,130,246,0.5)",
              }}>
                <Zap size={24} color="white" />
              </div>
              <span style={{ fontSize: "1.5rem", fontWeight: 700 }}>SmartCow</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{
                fontSize: "3.5rem",
                fontWeight: 700,
                margin: "0 0 20px",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              Gestão<br />
              <span style={{ 
                background: "linear-gradient(135deg, #60a5fa 0%, #c084fc 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                Inteligente
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{
                fontSize: "1.125rem",
                opacity: 0.9,
                margin: 0,
                fontWeight: 400,
                maxWidth: 450,
                lineHeight: 1.6,
                color: "#cbd5e1",
              }}
            >
              Tecnologia de ponta para maximizar a produtividade do seu rebanho com análises em tempo real.
            </motion.p>

            {/* Features */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              style={{ marginTop: "40px", display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {[
                "Segurança de dados premium",
                "Sincronização em nuvem",
                "Análises em tempo real"
              ].map((text, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + idx * 0.1 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    color: "#e2e8f0",
                  }}
                >
                  <div style={{
                    width: "8px",
                    height: "8px",
                    background: "linear-gradient(135deg, #3b82f6, #9333ea)",
                    borderRadius: "50%",
                    boxShadow: "0 0 10px rgba(59,130,246,0.5)",
                  }} />
                  {text}
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            style={{
              display: "flex",
              gap: "40px",
              paddingTop: "40px",
              borderTop: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {[
              { value: "+10k", label: "Animais gerenciados" },
              { value: "98%", label: "Satisfação" },
              { value: "24/7", label: "Suporte técnico" }
            ].map((stat, idx) => (
              <div key={idx}>
                <div style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "4px" }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: "0.875rem", opacity: 0.7 }}>{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Lado Direito - Formulário */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "48px",
          position: "relative",
          zIndex: 10,
          boxShadow: "-20px 0 60px -20px rgba(0,0,0,0.3)",
        }}
      >
        {/* Mobile Logo */}
        <div style={{
          display: "block",
          textAlign: "center",
          marginBottom: "32px",
        }} className="mobile-logo">
          <div style={{
            width: "60px",
            height: "60px",
            background: "linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            boxShadow: "0 10px 30px -10px rgba(59,130,246,0.5)",
          }}>
            <Zap size={28} color="white" />
          </div>
          <h2 style={{ 
            fontSize: "1.75rem", 
            fontWeight: 700, 
            color: "#0f172a",
            margin: 0,
          }}>
            SmartCow
          </h2>
        </div>

        <div style={{ marginBottom: "32px" }}>
          <h3 style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            color: "#0f172a",
            margin: "0 0 8px",
          }}>
            Bem-vindo de volta
          </h3>
          <p style={{ color: "#64748b", margin: 0, fontSize: "1rem" }}>
            Entre com suas credenciais para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Campo Email - Floating Label */}
          <div style={{ position: "relative" }}>
            <motion.div 
              animate={{ 
                scale: focusedField === "email" ? 1.02 : 1,
              }}
              transition={{ type: "spring", stiffness: 300 }}
              style={{ position: "relative" }}
            >
              <Mail 
                size={20} 
                style={{
                  position: "absolute",
                  left: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: focusedField === "email" ? "#3b82f6" : "#9ca3af",
                  transition: "all 0.3s",
                  zIndex: 2,
                }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                placeholder=" "
                style={{
                  width: "100%",
                  padding: "16px 16px 16px 48px",
                  borderRadius: "12px",
                  border: "2px solid",
                  borderColor: erro && !email ? "#ef4444" : focusedField === "email" ? "#3b82f6" : "#e5e7eb",
                  fontSize: "1rem",
                  outline: "none",
                  transition: "all 0.3s",
                  background: focusedField === "email" ? "#ffffff" : "#f9fafb",
                }}
              />
              <label style={{
                position: "absolute",
                left: "48px",
                top: email || focusedField === "email" ? "4px" : "50%",
                transform: email || focusedField === "email" ? "translateY(0)" : "translateY(-50%)",
                fontSize: email || focusedField === "email" ? "0.75rem" : "1rem",
                color: focusedField === "email" ? "#3b82f6" : "#9ca3af",
                transition: "all 0.3s",
                pointerEvents: "none",
                background: "transparent",
                padding: "0 4px",
              }}>
                Email
              </label>
              {/* Barra de progresso no foco */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: focusedField === "email" ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: "12px",
                  right: "12px",
                  height: "2px",
                  background: "linear-gradient(90deg, #3b82f6, #9333ea)",
                  transformOrigin: "left",
                  borderRadius: "2px",
                }}
              />
            </motion.div>
          </div>

          {/* Campo Senha */}
          <div style={{ position: "relative" }}>
            <motion.div 
              animate={{ 
                scale: focusedField === "senha" ? 1.02 : 1,
              }}
              transition={{ type: "spring", stiffness: 300 }}
              style={{ position: "relative" }}
            >
              <Lock 
                size={20} 
                style={{
                  position: "absolute",
                  left: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: focusedField === "senha" ? "#3b82f6" : "#9ca3af",
                  transition: "all 0.3s",
                  zIndex: 2,
                }}
              />
              <input
                type={mostrarSenha ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                onFocus={() => setFocusedField("senha")}
                onBlur={() => setFocusedField(null)}
                placeholder=" "
                style={{
                  width: "100%",
                  padding: "16px 48px 16px 48px",
                  borderRadius: "12px",
                  border: "2px solid",
                  borderColor: erro && !senha ? "#ef4444" : focusedField === "senha" ? "#3b82f6" : "#e5e7eb",
                  fontSize: "1rem",
                  outline: "none",
                  transition: "all 0.3s",
                  background: focusedField === "senha" ? "#ffffff" : "#f9fafb",
                }}
              />
              <label style={{
                position: "absolute",
                left: "48px",
                top: senha || focusedField === "senha" ? "4px" : "50%",
                transform: senha || focusedField === "senha" ? "translateY(0)" : "translateY(-50%)",
                fontSize: senha || focusedField === "senha" ? "0.75rem" : "1rem",
                color: focusedField === "senha" ? "#3b82f6" : "#9ca3af",
                transition: "all 0.3s",
                pointerEvents: "none",
              }}>
                Senha
              </label>
              
              <motion.button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                whileTap={{ scale: 0.9 }}
                style={{
                  position: "absolute",
                  right: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#6b7280",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={mostrarSenha}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                  </motion.div>
                </AnimatePresence>
              </motion.button>

              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: focusedField === "senha" ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: "12px",
                  right: "12px",
                  height: "2px",
                  background: "linear-gradient(90deg, #3b82f6, #9333ea)",
                  transformOrigin: "left",
                  borderRadius: "2px",
                }}
              />
            </motion.div>
          </div>

          {/* Opções */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "4px",
          }}>
            <label style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              fontSize: "0.875rem",
              color: "#374151",
              fontWeight: 500,
            }}>
              <div 
                onClick={() => setLembrar(!lembrar)}
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "6px",
                  border: "2px solid",
                  borderColor: lembrar ? "#3b82f6" : "#d1d5db",
                  background: lembrar ? "#3b82f6" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.3s",
                  cursor: "pointer",
                }}
              >
                <AnimatePresence>
                  {lembrar && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <CheckCircle2 size={14} color="white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <input
                type="checkbox"
                checked={lembrar}
                onChange={(e) => setLembrar(e.target.checked)}
                style={{ display: "none" }}
              />
              Lembrar-me
            </label>

            <Link 
              to="/esqueci-senha"
              style={{
                fontSize: "0.875rem",
                color: "#3b82f6",
                textDecoration: "none",
                fontWeight: 600,
                position: "relative",
              }}
              onMouseEnter={(e) => {
                e.target.style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                e.target.style.textDecoration = "none";
              }}
            >
              Esqueceu a senha?
            </Link>
          </div>

          {/* Erro */}
          <AnimatePresence>
            {(erro || offlineError) && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 16px",
                  background: offlineError ? "#fef3c7" : "#fee2e2",
                  border: `1px solid ${offlineError ? "#fcd34d" : "#fecaca"}`,
                  borderRadius: "10px",
                  color: offlineError ? "#92400e" : "#dc2626",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                {offlineError ? <WifiOff size={18} /> : <AlertCircle size={18} />}
                {erro || offlineError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Botão Entrar */}
          <motion.button
            type="submit"
            disabled={carregando}
            whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -10px rgba(59,130,246,0.5)" }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: "100%",
              padding: "16px 24px",
              marginTop: "8px",
              background: carregando ? "#93c5fd" : "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: carregando ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.3s",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Efeito de brilho no hover */}
            <motion.div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                transform: "translateX(-100%)",
              }}
              whileHover={{ transform: "translateX(100%)" }}
              transition={{ duration: 0.6 }}
            />
            
            {carregando ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                style={{
                  width: "20px",
                  height: "20px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                }}
              />
            ) : (
              <>
                <span>Entrar</span>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight size={20} />
                </motion.div>
              </>
            )}
          </motion.button>

          {/* Botão Instalar PWA */}
          {canInstall && (
            <motion.button
              type="button"
              onClick={() => deferredPrompt?.prompt()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: "100%",
                padding: "14px 24px",
                background: "transparent",
                color: "#0f172a",
                border: "2px solid #e5e7eb",
                borderRadius: "12px",
                fontSize: "0.9375rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.3s",
              }}
            >
              Instalar Aplicativo
            </motion.button>
          )}
        </form>

        {/* Footer */}
        <div style={{
          marginTop: "32px",
          textAlign: "center",
          fontSize: "0.875rem",
          color: "#6b7280",
        }}>
          Não tem uma conta?{" "}
          <Link 
            to="/cadastro" 
            style={{ 
              color: "#3b82f6", 
              fontWeight: 700,
              textDecoration: "none",
              position: "relative",
            }}
            onMouseEnter={(e) => {
              e.target.style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => {
              e.target.style.textDecoration = "none";
            }}
          >
            Criar conta gratuita
          </Link>
        </div>

        {/* Versão */}
        <div style={{
          position: "absolute",
          bottom: "24px",
          left: "48px",
          right: "48px",
          textAlign: "center",
          fontSize: "0.75rem",
          color: "#9ca3af",
        }}>
          SmartCow v2.0 • Termos de Uso • Privacidade
        </div>
      </motion.div>

      {/* Media Queries via Style Tag */}
      <style>{`
        @media (min-width: 1024px) {
          .left-side {
            display: block !important;
          }
          .mobile-logo {
            display: none !important;
          }
        }
        
        @media (max-width: 1023px) {
          .left-side {
            display: none !important;
          }
          .mobile-logo {
            display: block !important;
          }
        }

        /* Smooth scrolling */
        * {
          scroll-behavior: smooth;
        }

        /* Input autofill styling */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px #f9fafb inset;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
    </div>
  );
}