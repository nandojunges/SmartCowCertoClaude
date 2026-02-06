// src/Auth/Cadastro.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Eye, EyeOff, User, Building2, Phone, 
  CreditCard, Mail, Lock, ArrowRight, 
  CheckCircle2, AlertCircle, Loader2 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { supabase } from "../lib/supabaseClient";

// --------- Helpers de formatação (mantidos iguais) ----------
function formatPhone(v) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) {
    return d.replace(
      /^(\d{0,2})(\d{0,4})(\d{0,4}).*$/,
      (_, a, b, c) => [a && `(${a})`, b, c && `-${c}`].filter(Boolean).join(" ")
    );
  }
  return d.replace(
    /^(\d{2})(\d{5})(\d{0,4}).*$/,
    (_, a, b, c) => `(${a}) ${b}${c ? `-${c}` : ""}`
  );
}

function formatCpf(v) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d.replace(
    /^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2}).*$/,
    (_, a, b, c, d4) =>
      [a, b, c].filter(Boolean).join(".") + (d4 ? `-${d4}` : "")
  );
}

// ---------- Componente ----------
export default function Cadastro() {
  const [form, setForm] = useState({
    nome: "",
    fazenda: "",
    email: "",
    telefone: "",
    cpf: "",
    senha: "",
    confirmar: "",
  });
  const [tipoConta, setTipoConta] = useState("PRODUTOR");
  const [erro, setErro] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  
  const navigate = useNavigate();

  // ---------- Validação (mantida igual) ----------
  const validar = () => {
    if (
      !form.nome ||
      !form.email ||
      !form.telefone ||
      !form.cpf ||
      !form.senha ||
      !form.confirmar
    ) {
      setErro(
        tipoConta === "ASSISTENTE_TECNICO"
          ? "Preencha todos os campos obrigatórios."
          : "Preencha todos os campos obrigatórios."
      );
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setErro("E-mail inválido.");
      return false;
    }

    const telDigitos = form.telefone.replace(/\D/g, "");
    if (telDigitos.length < 10) {
      setErro("Telefone inválido.");
      return false;
    }

    const cpfDigitos = form.cpf.replace(/\D/g, "");
    if (cpfDigitos.length !== 11) {
      setErro("CPF deve ter 11 dígitos.");
      return false;
    }

    if (form.senha.length < 6) {
      setErro("A senha deve ter no mínimo 6 caracteres.");
      return false;
    }

    if (form.senha !== form.confirmar) {
      setErro("As senhas não conferem.");
      return false;
    }

    setErro("");
    return true;
  };

  // ---------- Submit (mantido igual) ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;

    setCarregando(true);
    const emailTrim = form.email.trim().toLowerCase();
    const telDigitos = form.telefone.replace(/\D/g, "");
    const cpfDigitos = form.cpf.replace(/\D/g, "");
    const fazendaTrim = form.fazenda.trim();

    try {
      const pendingCadastro = {
        nome: form.nome.trim(),
        fazenda: tipoConta === "PRODUTOR" ? fazendaTrim : "",
        email: emailTrim,
        telefone: telDigitos,
        cpf: cpfDigitos,
        senha: form.senha,
        tipo_conta: tipoConta,
      };
      localStorage.setItem("pendingCadastro", JSON.stringify(pendingCadastro));

      const metadata = {
        full_name: form.nome.trim(),
        phone: telDigitos,
        cpf: cpfDigitos,
        tipo_conta: tipoConta,
      };

      if (tipoConta === "PRODUTOR") {
        metadata.fazenda = fazendaTrim;
      }

      const { data, error } = await supabase.auth.signInWithOtp({
        email: emailTrim,
        options: {
          shouldCreateUser: true,
          data: metadata,
        },
      });

      if (error) {
        setErro(error.message || "Erro ao enviar código para o e-mail.");
        toast.error(error.message || "Erro ao enviar código.");
        setCarregando(false);
        return;
      }

      toast.success("Código de 6 dígitos enviado! Verifique seu e-mail.");
      navigate("/verificar-email", { replace: true });
    } catch (err) {
      console.error(err);
      setErro("Erro inesperado ao cadastrar.");
      toast.error("Erro inesperado ao cadastrar.");
      setCarregando(false);
    }
  };

  // Componente de Input Reutilizável com Ícone
  const InputField = ({ 
    label, 
    name, 
    type = "text", 
    placeholder, 
    value, 
    onChange, 
    icon: Icon,
    maxLength,
    inputMode,
    required = true,
    gridSpan = 1
  }) => (
    <motion.div 
      style={{ 
        gridColumn: `span ${gridSpan}`,
        position: "relative" 
      }}
      animate={{ 
        scale: focusedField === name ? 1.02 : 1,
      }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <label style={{
        display: "block",
        fontSize: "12px",
        marginBottom: "6px",
        color: required ? "#374151" : "#6b7280",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      }}>
        {label} {required && <span style={{ color: "#dc2626" }}>*</span>}
      </label>
      
      <div style={{ position: "relative" }}>
        {Icon && (
          <Icon 
            size={18} 
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: focusedField === name ? "#1565c0" : "#9ca3af",
              transition: "color 0.3s",
              zIndex: 2,
            }}
          />
        )}
        
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocusedField(name)}
          onBlur={() => setFocusedField(null)}
          maxLength={maxLength}
          inputMode={inputMode}
          style={{
            width: "100%",
            padding: Icon ? "12px 12px 12px 44px" : "12px",
            borderRadius: "12px",
            border: "2px solid",
            borderColor: erro && !value ? "#fecaca" : focusedField === name ? "#1565c0" : "#e5e7eb",
            fontSize: "0.95rem",
            outline: "none",
            transition: "all 0.3s ease",
            backgroundColor: focusedField === name ? "#ffffff" : "#f9fafb",
            boxShadow: focusedField === name ? "0 0 0 4px rgba(21,101,192,0.1)" : "none",
          }}
        />
        
        {/* Barra de progresso no foco */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: focusedField === name ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "absolute",
            bottom: 0,
            left: "12px",
            right: "12px",
            height: "2px",
            background: "linear-gradient(90deg, #1565c0, #9333ea)",
            transformOrigin: "left",
            borderRadius: "2px",
          }}
        />
      </div>
    </motion.div>
  );

  return (
    <div style={{
      minHeight: "100vh",
      width: "100%",
      margin: 0,
      padding: "20px",
      backgroundImage: "url('/icones/telafundo.png')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
    }}>
      {/* Overlay escuro sutil para melhorar legibilidade */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(135deg, rgba(15,23,42,0.4) 0%, rgba(0,0,0,0.2) 100%)",
        backdropFilter: "blur(2px)",
      }} />

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          backgroundColor: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(20px)",
          padding: "40px",
          borderRadius: "24px",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1)",
          width: "100%",
          maxWidth: "600px",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ textAlign: "center", marginBottom: "28px" }}
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            style={{
              width: "60px",
              height: "60px",
              background: "linear-gradient(135deg, #1565c0 0%, #9333ea 100%)",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 10px 30px -10px rgba(21,101,192,0.5)",
            }}
          >
            <User size={28} color="white" />
          </motion.div>
          
          <p style={{
            fontSize: "13px",
            color: "#6b7280",
            margin: "0 0 4px",
            textTransform: "uppercase",
            letterSpacing: "1px",
            fontWeight: 600,
          }}>
            Bem-vindo ao SmartCow
          </p>
          
          <h2 style={{
            fontWeight: 800,
            fontSize: "28px",
            margin: 0,
            color: "#0f172a",
            letterSpacing: "-0.5px",
          }}>
            Criar Conta
          </h2>
        </motion.div>

        {/* Alerta de Erro */}
        <AnimatePresence>
          {erro && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              style={{
                marginBottom: "20px",
                padding: "12px 16px",
                backgroundColor: "#fee2e2",
                border: "1px solid #fecaca",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "#dc2626",
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
              <AlertCircle size={18} />
              {erro}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Seletor de Tipo de Conta */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <label style={{
              display: "block",
              fontSize: "12px",
              marginBottom: "8px",
              color: "#374151",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}>
              Tipo de Conta
            </label>
            
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "12px",
            }}>
              {[
                { 
                  id: "PRODUTOR", 
                  title: "Produtor", 
                  desc: "Gestão completa da fazenda",
                  icon: Building2 
                },
                { 
                  id: "ASSISTENTE_TECNICO", 
                  title: "Assistente Técnico", 
                  desc: "Acesso focado em suporte",
                  icon: User 
                },
              ].map((option) => {
                const isSelected = tipoConta === option.id;
                const Icon = option.icon;
                
                return (
                  <motion.button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setTipoConta(option.id);
                      if (option.id === "ASSISTENTE_TECNICO") {
                        setForm((f) => ({ ...f, fazenda: "" }));
                      }
                    }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: "16px",
                      borderRadius: "14px",
                      border: "2px solid",
                      borderColor: isSelected ? "#1565c0" : "#e5e7eb",
                      background: isSelected 
                        ? "linear-gradient(135deg, rgba(21,101,192,0.1) 0%, rgba(147,51,234,0.05) 100%)"
                        : "#ffffff",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px",
                      transition: "all 0.3s",
                      boxShadow: isSelected 
                        ? "0 4px 20px -4px rgba(21,101,192,0.3)"
                        : "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                  >
                    <div style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: isSelected 
                        ? "linear-gradient(135deg, #1565c0 0%, #9333ea 100%)"
                        : "#f3f4f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.3s",
                    }}>
                      <Icon size={20} color={isSelected ? "white" : "#6b7280"} />
                    </div>
                    
                    <div style={{ textAlign: "center" }}>
                      <div style={{ 
                        fontWeight: 700, 
                        fontSize: "14px",
                        color: isSelected ? "#1565c0" : "#111827",
                        marginBottom: "2px",
                      }}>
                        {option.title}
                      </div>
                      <div style={{ 
                        fontSize: "11px", 
                        color: "#6b7280",
                        lineHeight: 1.3,
                      }}>
                        {option.desc}
                      </div>
                    </div>

                    {isSelected && (
                      <motion.div
                        layoutId="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        style={{
                          position: "absolute",
                          top: "8px",
                          right: "8px",
                          width: "20px",
                          height: "20px",
                          background: "#1565c0",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <CheckCircle2 size={12} color="white" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
            
            <p style={{
              margin: "8px 0 0",
              fontSize: "12px",
              color: "#6b7280",
              fontStyle: "italic",
            }}>
              {tipoConta === "ASSISTENTE_TECNICO"
                ? "Você pode seguir sem informar fazenda."
                : "Cadastre sua fazenda para personalizar o acesso."}
            </p>
          </motion.div>

          {/* Grid de Campos */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "16px",
          }}>
            <InputField
              label="Nome Completo"
              name="nome"
              placeholder="Seu nome"
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              icon={User}
              gridSpan={2}
              required
            />

            {tipoConta === "PRODUTOR" && (
              <InputField
                label="Nome da Fazenda"
                name="fazenda"
                placeholder="Ex: Fazenda Esperança"
                value={form.fazenda}
                onChange={(e) => setForm((f) => ({ ...f, fazenda: e.target.value }))}
                icon={Building2}
              />
            )}

            <InputField
              label="Telefone"
              name="telefone"
              placeholder="(99) 99999-9999"
              value={form.telefone}
              onChange={(e) => setForm((f) => ({ ...f, telefone: formatPhone(e.target.value) }))}
              icon={Phone}
              maxLength={16}
              inputMode="numeric"
              gridSpan={tipoConta === "PRODUTOR" ? 1 : 2}
            />

            <InputField
              label="CPF"
              name="cpf"
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={(e) => setForm((f) => ({ ...f, cpf: formatCpf(e.target.value) }))}
              icon={CreditCard}
              maxLength={14}
              inputMode="numeric"
              gridSpan={2}
            />

            <InputField
              label="E-mail"
              name="email"
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              icon={Mail}
              gridSpan={2}
            />

            {/* Campo Senha */}
            <motion.div 
              style={{ position: "relative" }}
              animate={{ scale: focusedField === "senha" ? 1.02 : 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <label style={{
                display: "block",
                fontSize: "12px",
                marginBottom: "6px",
                color: "#374151",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}>
                Senha <span style={{ color: "#dc2626" }}>*</span>
              </label>
              
              <div style={{ position: "relative" }}>
                <Lock 
                  size={18} 
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: focusedField === "senha" ? "#1565c0" : "#9ca3af",
                    transition: "color 0.3s",
                    zIndex: 2,
                  }}
                />
                
                <input
                  type={mostrarSenha ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={form.senha}
                  onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
                  onFocus={() => setFocusedField("senha")}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    width: "100%",
                    padding: "12px 44px 12px 44px",
                    borderRadius: "12px",
                    border: "2px solid",
                    borderColor: erro && !form.senha ? "#fecaca" : focusedField === "senha" ? "#1565c0" : "#e5e7eb",
                    fontSize: "0.95rem",
                    outline: "none",
                    transition: "all 0.3s",
                    backgroundColor: focusedField === "senha" ? "#ffffff" : "#f9fafb",
                    boxShadow: focusedField === "senha" ? "0 0 0 4px rgba(21,101,192,0.1)" : "none",
                  }}
                />
                
                <motion.button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    color: "#6b7280",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={mostrarSenha}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ duration: 0.2 }}
                    >
                      {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                    </motion.div>
                  </AnimatePresence>
                </motion.button>
              </div>
            </motion.div>

            {/* Campo Confirmar Senha */}
            <motion.div 
              style={{ position: "relative" }}
              animate={{ scale: focusedField === "confirmar" ? 1.02 : 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <label style={{
                display: "block",
                fontSize: "12px",
                marginBottom: "6px",
                color: "#374151",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}>
                Confirmar <span style={{ color: "#dc2626" }}>*</span>
              </label>
              
              <div style={{ position: "relative" }}>
                <Lock 
                  size={18} 
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: focusedField === "confirmar" ? "#1565c0" : "#9ca3af",
                    transition: "color 0.3s",
                    zIndex: 2,
                  }}
                />
                
                <input
                  type={mostrarConfirmar ? "text" : "password"}
                  placeholder="Repita a senha"
                  value={form.confirmar}
                  onChange={(e) => setForm((f) => ({ ...f, confirmar: e.target.value }))}
                  onFocus={() => setFocusedField("confirmar")}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    width: "100%",
                    padding: "12px 44px 12px 44px",
                    borderRadius: "12px",
                    border: "2px solid",
                    borderColor: erro && !form.confirmar ? "#fecaca" : focusedField === "confirmar" ? "#1565c0" : "#e5e7eb",
                    fontSize: "0.95rem",
                    outline: "none",
                    transition: "all 0.3s",
                    backgroundColor: focusedField === "confirmar" ? "#ffffff" : "#f9fafb",
                    boxShadow: focusedField === "confirmar" ? "0 0 0 4px rgba(21,101,192,0.1)" : "none",
                  }}
                />
                
                <motion.button
                  type="button"
                  onClick={() => setMostrarConfirmar((v) => !v)}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    color: "#6b7280",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={mostrarConfirmar}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ duration: 0.2 }}
                    >
                      {mostrarConfirmar ? <EyeOff size={18} /> : <Eye size={18} />}
                    </motion.div>
                  </AnimatePresence>
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Botão Submit */}
          <motion.button
            type="submit"
            disabled={carregando}
            whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -10px rgba(21,101,192,0.4)" }}
            whileTap={{ scale: 0.98 }}
            style={{
              background: carregando 
                ? "#93c5fd" 
                : "linear-gradient(135deg, #1565c0 0%, #1e40af 100%)",
              color: "#fff",
              borderRadius: "14px",
              padding: "14px 28px",
              fontWeight: 700,
              fontSize: "16px",
              border: "none",
              width: "100%",
              marginTop: "8px",
              cursor: carregando ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {carregando ? (
              <>
                <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <span>Criar Conta</span>
                <ArrowRight size={20} />
              </>
            )}
            
            {/* Efeito de brilho */}
            {!carregando && (
              <motion.div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                }}
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.6 }}
              />
            )}
          </motion.button>

          {/* Link para Login */}
          <div style={{
            textAlign: "center",
            marginTop: "8px",
            fontSize: "14px",
            color: "#6b7280",
          }}>
            Já tem uma conta?{" "}
            <a 
              href="/login"
              onClick={(e) => {
                e.preventDefault();
                navigate("/login");
              }}
              style={{
                color: "#1565c0",
                fontWeight: 700,
                textDecoration: "none",
                position: "relative",
              }}
              onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
              onMouseLeave={(e) => e.target.style.textDecoration = "none"}
            >
              Faça login
            </a>
          </div>
        </form>
      </motion.div>

      {/* CSS para animação do loader */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @media (max-width: 640px) {
          form > div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}