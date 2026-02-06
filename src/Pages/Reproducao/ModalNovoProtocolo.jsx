import React, { useEffect, useMemo, useRef, useState } from "react";

/* ========================= DESIGN TOKENS ========================= */
const TOKENS = {
  colors: {
    primary: "#2563EB",
    primaryDark: "#1D4ED8",
    primaryLight: "#DBEAFE",
    secondary: "#7C3AED",
    danger: "#DC2626",
    dangerLight: "#FEE2E2",
    success: "#059669",
    warning: "#D97706",
    gray50: "#F9FAFB",
    gray100: "#F3F4F6",
    gray200: "#E5E7EB",
    gray300: "#D1D5DB",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    gray600: "#4B5563",
    gray700: "#374151",
    gray800: "#1F2937",
    gray900: "#111827",
  },
  shadows: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    glow: "0 0 0 3px rgba(37, 99, 235, 0.15)",
  },
  radii: {
    sm: "6px",
    md: "10px",
    lg: "14px",
    xl: "18px",
    full: "9999px",
  },
  transitions: {
    fast: "all 0.15s ease",
    normal: "all 0.2s ease",
    slow: "all 0.3s ease",
  },
};

/* ========================= UI HELPERS ========================= */
const Icon = ({ name, size = 20, color = "currentColor" }) => {
  const icons = {
    plus: <path d="M12 4v16m8-8H4" />,
    trash: <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />,
    chevronDown: <path d="M19 9l-7 7-7-7" />,
    chevronUp: <path d="M5 15l7-7 7 7" />,
    calendar: <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
    flask: <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />,
    check: <path d="M5 13l4 4L19 7" />,
    close: <path d="M6 18L18 6M6 6l12 12" />,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      {icons[name] || null}
    </svg>
  );
};

const Badge = ({ children, variant = "default", size = "md" }) => {
  const variants = {
    default: { bg: TOKENS.colors.gray100, color: TOKENS.colors.gray700, border: TOKENS.colors.gray200 },
    primary: { bg: TOKENS.colors.primaryLight, color: TOKENS.colors.primaryDark, border: "#BFDBFE" },
    success: { bg: "#D1FAE5", color: TOKENS.colors.success, border: "#A7F3D0" },
    danger: { bg: TOKENS.colors.dangerLight, color: TOKENS.colors.danger, border: "#FECACA" },
    warning: { bg: "#FEF3C7", color: TOKENS.colors.warning, border: "#FDE68A" },
    purple: { bg: "#EDE9FE", color: TOKENS.colors.secondary, border: "#DDD6FE" },
  };

  const v = variants[variant];
  const sizes = {
    sm: { padding: "2px 8px", fontSize: "11px" },
    md: { padding: "4px 10px", fontSize: "12px" },
    lg: { padding: "6px 12px", fontSize: "13px" },
  };
  const s = sizes[size];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        background: v.bg,
        color: v.color,
        border: `1px solid ${v.border}`,
        borderRadius: TOKENS.radii.full,
        fontWeight: "600",
        ...s,
        transition: TOKENS.transitions.fast,
      }}
    >
      {children}
    </span>
  );
};

const Button = ({ children, variant = "primary", size = "md", onClick, disabled = false, icon = null, style = {} }) => {
  const variants = {
    primary: {
      background: `linear-gradient(135deg, ${TOKENS.colors.primary}, ${TOKENS.colors.primaryDark})`,
      color: "#fff",
      border: "none",
      boxShadow: TOKENS.shadows.md,
    },
    secondary: {
      background: "#fff",
      color: TOKENS.colors.gray700,
      border: `1px solid ${TOKENS.colors.gray200}`,
      boxShadow: TOKENS.shadows.sm,
    },
    ghost: {
      background: "transparent",
      color: TOKENS.colors.gray600,
      border: "none",
      boxShadow: "none",
    },
    danger: {
      background: "#fff",
      color: TOKENS.colors.danger,
      border: `1px solid ${TOKENS.colors.dangerLight}`,
      boxShadow: TOKENS.shadows.sm,
    },
  };

  const sizes = {
    sm: { height: "32px", padding: "0 12px", fontSize: "13px" },
    md: { height: "40px", padding: "0 16px", fontSize: "14px" },
    lg: { height: "48px", padding: "0 24px", fontSize: "15px" },
  };

  const v = variants[variant];
  const s = sizes[size];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        borderRadius: TOKENS.radii.md,
        fontWeight: "600",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        transition: TOKENS.transitions.normal,
        ...v,
        ...s,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled && variant === "primary") {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = TOKENS.shadows.lg;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && variant === "primary") {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = v.boxShadow;
        }
      }}
    >
      {icon && <Icon name={icon} size={size === "sm" ? 16 : 18} />}
      {children}
    </button>
  );
};

/* ========================= DADOS ========================= */
const HORMONIOS = ["Benzoato de Estradiol", "Cipionato de Estradiol", "PGF2α", "GnRH", "eCG", "hCG", "Progesterona"];

const ACOES = ["Inserir Dispositivo", "Retirar Dispositivo", "Inseminação", "Observação de Cio", "Exame"];

const TEMPLATES = {
  IATF: [
    { dia: 0, hormonio: "Benzoato de Estradiol" },
    { dia: 0, acao: "Inserir Dispositivo" },
    { dia: 7, hormonio: "PGF2α" },
    { dia: 7, acao: "Retirar Dispositivo" },
    { dia: 9, acao: "Inseminação" },
  ],
  "PRÉ-SINCRONIZAÇÃO": [{ dia: 0, hormonio: "GnRH" }, { dia: 7, hormonio: "PGF2α" }],
};

/* ========================= TIMELINE ITEM ========================= */
const TimelineItem = ({
  dia,
  etapas,
  isLast,
  onAdd,
  onRemoveEtapa,
  onRemoveDia,
  formOpen,
  formData,
  setFormData,
  onSelectEtapa,
  onCancelForm,
}) => {
  const hasEtapas = etapas && etapas.length > 0;

  return (
    <div style={{ display: "flex", gap: "16px", position: "relative" }}>
      {!isLast && (
        <div
          style={{
            position: "absolute",
            left: "20px",
            top: "40px",
            bottom: "-16px",
            width: "2px",
            background: TOKENS.colors.gray200,
            zIndex: 0,
          }}
        />
      )}

      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: TOKENS.radii.full,
          background: hasEtapas ? TOKENS.colors.primary : "#fff",
          border: `2px solid ${hasEtapas ? TOKENS.colors.primary : TOKENS.colors.gray300}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "800",
          fontSize: "13px",
          color: hasEtapas ? "#fff" : TOKENS.colors.gray500,
          flexShrink: 0,
          zIndex: 1,
          boxShadow: hasEtapas ? `0 0 0 4px ${TOKENS.colors.primaryLight}` : "none",
        }}
      >
        D{dia}
      </div>

      <div style={{ flex: 1, paddingBottom: "24px" }}>
        <div
          style={{
            background: "#fff",
            border: `1px solid ${TOKENS.colors.gray200}`,
            borderRadius: TOKENS.radii.lg,
            padding: "16px",
            boxShadow: TOKENS.shadows.sm,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: hasEtapas ? "12px" : "0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Icon name="calendar" size={16} color={TOKENS.colors.gray400} />
              <span style={{ fontWeight: "700", color: TOKENS.colors.gray800, fontSize: "15px" }}>Dia {dia}</span>
              {hasEtapas && (
                <Badge variant="primary" size="sm">
                  {etapas.length} etapa{etapas.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => (formOpen ? onCancelForm() : onAdd(dia))}
                icon={formOpen ? "chevronUp" : "plus"}
                style={{ color: TOKENS.colors.primary }}
              >
                {formOpen ? "Fechar" : "Adicionar"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onRemoveDia(dia)} icon="trash" style={{ color: TOKENS.colors.gray400 }} />
            </div>
          </div>

          {hasEtapas && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: formOpen ? "16px" : "0" }}>
              {etapas.map((etapa, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectEtapa(dia, idx)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    background: TOKENS.colors.gray50,
                    borderRadius: TOKENS.radii.md,
                    border: `1px solid ${TOKENS.colors.gray100}`,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {etapa.hormonio ? (
                      <>
                        <div
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: TOKENS.radii.full,
                            background: TOKENS.colors.primaryLight,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Icon name="flask" size={14} color={TOKENS.colors.primary} />
                        </div>
                          <div>
                            <div style={{ fontWeight: "600", fontSize: "13px", color: TOKENS.colors.gray800 }}>{etapa.hormonio}</div>
                            <div style={{ fontSize: "11px", color: TOKENS.colors.gray400 }}>
                              Hormônio{etapa.dose_ml !== undefined && etapa.dose_ml !== "" ? ` • ${etapa.dose_ml} mL` : ""}
                            </div>
                          </div>
                      </>
                    ) : (
                      <>
                        <div
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: TOKENS.radii.full,
                            background: "#E0E7FF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Icon name="check" size={14} color={TOKENS.colors.secondary} />
                        </div>
                        <div>
                          <div style={{ fontWeight: "600", fontSize: "13px", color: TOKENS.colors.gray800 }}>{etapa.acao}</div>
                          <div style={{ fontSize: "11px", color: TOKENS.colors.gray400 }}>Ação</div>
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveEtapa(dia, idx);
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px",
                      borderRadius: TOKENS.radii.sm,
                      color: TOKENS.colors.gray400,
                      transition: TOKENS.transitions.fast,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = TOKENS.colors.danger)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = TOKENS.colors.gray400)}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {formOpen && (
            <div
              style={{
                background: TOKENS.colors.gray50,
                borderRadius: TOKENS.radii.md,
                padding: "16px",
                border: `1px dashed ${TOKENS.colors.gray300}`,
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: TOKENS.colors.gray600, marginBottom: "6px" }}>
                    Hormônio (opcional)
                  </label>
                  <select
                    value={formData.hormonio}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        hormonio: e.target.value,
                        dose_ml: e.target.value ? f.dose_ml : "",
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: TOKENS.radii.md,
                      border: `1px solid ${TOKENS.colors.gray200}`,
                      background: "#fff",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  >
                    <option value="">Nenhum</option>
                    {HORMONIOS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: TOKENS.colors.gray600, marginBottom: "6px" }}>
                    Ação (opcional)
                  </label>
                  <select
                    value={formData.acao}
                    onChange={(e) => setFormData((f) => ({ ...f, acao: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: TOKENS.radii.md,
                      border: `1px solid ${TOKENS.colors.gray200}`,
                      background: "#fff",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  >
                    <option value="">Nenhuma</option>
                    {ACOES.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.hormonio && (
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: TOKENS.colors.gray600, marginBottom: "6px" }}>Dose (mL)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.dose_ml ?? ""}
                    onChange={(e) => setFormData((f) => ({ ...f, dose_ml: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: TOKENS.radii.md,
                      border: `1px solid ${TOKENS.colors.gray200}`,
                      background: "#fff",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                </div>
              )}

              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <Button variant="ghost" size="sm" onClick={onCancelForm}>
                  Cancelar
                </Button>
                <Button variant="primary" size="sm" onClick={() => onAdd(dia)}>
                  Nova Etapa no mesmo dia
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ========================= MODAL ========================= */
export default function ModalNovoProtocolo({ onFechar, onSalvar, protocoloInicial = null }) {
  const isEdit = !!protocoloInicial?.id;

  const [tipo, setTipo] = useState((protocoloInicial?.tipo || "IATF").toUpperCase());
  const [nome, setNome] = useState(protocoloInicial?.nome || "");
  const [descricao, setDescricao] = useState(protocoloInicial?.descricao || "");

  const [dias, setDias] = useState(() => {
    if (!protocoloInicial) return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const setD = new Set((protocoloInicial?.etapas || []).map((e) => e?.dia ?? 0));
    const arr = Array.from(setD).sort((a, b) => a - b);
    return arr.length ? arr : [0];
  });

  const [etapas, setEtapas] = useState(() => {
    if (!protocoloInicial) return {};
    return (protocoloInicial?.etapas || []).reduce((acc, e) => {
      const d = e?.dia ?? 0;
      (acc[d] ||= []).push({ hormonio: e?.hormonio || "", acao: e?.acao || "", dose_ml: e?.dose_ml ?? "" });
      return acc;
    }, {});
  });

  const [formDia, setFormDia] = useState(null);
  const [formEtapaIdx, setFormEtapaIdx] = useState(null);
  const [form, setForm] = useState({ hormonio: "", acao: "", dose_ml: "" });
  const [activeTab, setActiveTab] = useState("builder"); // builder | preview

  const overlayRef = useRef(null);

  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtml;
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onFechar?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onFechar]);

  const aplicarTemplate = (tplKey) => {
    const tpl = TEMPLATES[tplKey];
    if (!tpl) return;
    const novo = {};
    tpl.forEach((e) => {
      (novo[e.dia] ||= []).push({ hormonio: e.hormonio || "", acao: e.acao || "", dose_ml: e.dose_ml ?? "" });
    });
    const ds = Object.keys(novo).map(Number).sort((a, b) => a - b);
    setDias(ds);
    setEtapas(novo);
    setFormDia(null);
    setFormEtapaIdx(null);
  };

  const adicionarDia = () => {
    const n = dias.length ? Math.max(...dias) + 1 : 0;
    setDias([...dias, n]);
  };

  const removerDia = (d) => {
    setDias((arr) => arr.filter((x) => x !== d));
    setEtapas((prev) => {
      const cp = { ...prev };
      delete cp[d];
      return cp;
    });
    if (formDia === d) {
      setFormDia(null);
      setFormEtapaIdx(null);
    }
  };

  const normalizeDose = (value) => {
    if (value === "" || value == null) return "";
    const normalized = String(value).replace(",", ".").trim();
    if (!normalized) return "";
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : "";
  };

  const abrirEtapa = (d) => {
    const list = etapas[d] || [];
    const novoIdx = list.length;
    setEtapas((prev) => ({
      ...prev,
      [d]: [...(prev[d] || []), { hormonio: "", acao: "", dose_ml: "" }],
    }));
    setFormDia(d);
    setFormEtapaIdx(novoIdx);
    setForm({ hormonio: "", acao: "", dose_ml: "" });
  };

  const atualizarForm = (updater) => {
    if (formDia == null || formEtapaIdx == null) return;
    setForm((prevForm) => {
      const nextForm = typeof updater === "function" ? updater(prevForm) : updater;
      const etapaAtualizada = {
        hormonio: nextForm.hormonio || "",
        acao: nextForm.acao || "",
        dose_ml: nextForm.hormonio ? normalizeDose(nextForm.dose_ml) : "",
      };
      setEtapas((prev) => {
        const list = prev[formDia] ? [...prev[formDia]] : [];
        if (!list[formEtapaIdx]) return prev;
        list[formEtapaIdx] = etapaAtualizada;
        return { ...prev, [formDia]: list };
      });
      return { ...nextForm, dose_ml: etapaAtualizada.dose_ml };
    });
  };

  const cancelarFormularioEtapa = () => {
    if (formDia == null || formEtapaIdx == null) {
      setFormDia(null);
      setFormEtapaIdx(null);
      return;
    }
    const etapaAtual = etapas[formDia]?.[formEtapaIdx];
    const vazia = !etapaAtual?.hormonio && !etapaAtual?.acao;
    if (vazia) {
      setEtapas((prev) => {
        const list = prev[formDia] ? [...prev[formDia]] : [];
        list.splice(formEtapaIdx, 1);
        return { ...prev, [formDia]: list };
      });
    }
    setFormDia(null);
    setFormEtapaIdx(null);
    setForm({ hormonio: "", acao: "", dose_ml: "" });
  };

  const selecionarEtapaParaEditar = (dia, idx) => {
    const etapa = etapas[dia]?.[idx];
    if (!etapa) return;
    setFormDia(dia);
    setFormEtapaIdx(idx);
    setForm({
      hormonio: etapa.hormonio || "",
      acao: etapa.acao || "",
      dose_ml: etapa.dose_ml ?? "",
    });
  };

  const removerEtapa = (dia, idx) => {
    setEtapas((prev) => {
      const list = prev[dia] ? [...prev[dia]] : [];
      list.splice(idx, 1);
      return { ...prev, [dia]: list };
    });
    if (formDia === dia && formEtapaIdx === idx) {
      setFormDia(null);
      setFormEtapaIdx(null);
      setForm({ hormonio: "", acao: "", dose_ml: "" });
    }
  };

  const totalEtapas = Object.values(etapas).reduce((sum, arr) => sum + (arr || []).filter((e) => e?.hormonio || e?.acao).length, 0);
  const valido = nome.trim() && totalEtapas > 0 && tipo;

  const handleSalvar = () => {
    if (!valido) return;

    const etapasList = [];
    Object.entries(etapas).forEach(([d, arr]) => {
      (arr || []).forEach((e) => {
        if (!e?.hormonio && !e?.acao) return;
        etapasList.push({ ...e, dia: parseInt(d, 10) });
      });
    });
    etapasList.sort((a, b) => a.dia - b.dia);

    onSalvar?.({
      nome: nome.trim(),
      descricao,
      tipo: String(tipo).toUpperCase(),
      etapas: etapasList,
    });
  };

  const previewData = useMemo(() => {
    return dias
      .map((d) => ({ dia: d, etapas: etapas[d] || [] }))
      .sort((a, b) => a.dia - b.dia);
  }, [dias, etapas]);

  return (
    <div
      ref={overlayRef}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={(e) => e.target === overlayRef.current && onFechar?.()}
    >
      <div
        style={{
          background: "#fff",
          width: "100%",
          maxWidth: "900px",
          height: "90vh",
          borderRadius: TOKENS.radii.xl,
          boxShadow: TOKENS.shadows.xl,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "#fff",
            borderBottom: `1px solid ${TOKENS.colors.gray200}`,
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: TOKENS.radii.lg,
                background: TOKENS.colors.primaryLight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="flask" size={20} color={TOKENS.colors.primary} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: TOKENS.colors.gray900 }}>
                {isEdit ? "Editar Protocolo" : "Novo Protocolo"}
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: "13px", color: TOKENS.colors.gray500 }}>Configure as etapas do tratamento</p>
            </div>
          </div>

          <button
            onClick={onFechar}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              borderRadius: TOKENS.radii.full,
              color: TOKENS.colors.gray400,
              transition: TOKENS.transitions.fast,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = TOKENS.colors.gray100)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Icon name="close" size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", padding: "0 24px", borderBottom: `1px solid ${TOKENS.colors.gray200}` }}>
          {[
            { id: "builder", label: "Construtor", icon: "menu" },
            { id: "preview", label: "Visualização", icon: "calendar" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "12px 16px",
                background: "transparent",
                border: "none",
                borderBottom: `2px solid ${activeTab === tab.id ? TOKENS.colors.primary : "transparent"}`,
                color: activeTab === tab.id ? TOKENS.colors.primary : TOKENS.colors.gray500,
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "-1px",
                transition: TOKENS.transitions.fast,
              }}
            >
              <Icon name={tab.icon} size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
          {activeTab === "builder" ? (
            <>
              {/* Sidebar */}
              <div
                style={{
                  width: "320px",
                  borderRight: `1px solid ${TOKENS.colors.gray200}`,
                  background: TOKENS.colors.gray50,
                  padding: "24px",
                  overflowY: "auto",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: TOKENS.colors.gray700, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Tipo do Protocolo
                    </label>
                    <select
                      value={tipo}
                      onChange={(e) => setTipo(e.target.value.toUpperCase())}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: TOKENS.radii.md, border: `1px solid ${TOKENS.colors.gray200}`, background: "#fff", fontSize: "14px", outline: "none" }}
                    >
                      <option value="IATF">IATF (Inseminação Artificial em Tempo Fixo)</option>
                      <option value="PRÉ-SINCRONIZAÇÃO">Pré-sincronização</option>
                      <option value="CUSTOM">Personalizado</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: TOKENS.colors.gray700, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Nome do Protocolo *
                    </label>
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Ex: IATF 9 dias"
                      style={{ width: "100%", padding: "10px 12px", borderRadius: TOKENS.radii.md, border: `1px solid ${TOKENS.colors.gray200}`, background: "#fff", fontSize: "14px", outline: "none" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: TOKENS.colors.gray700, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Descrição (opcional)
                    </label>
                    <textarea
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      placeholder="Observações internas..."
                      rows={3}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: TOKENS.radii.md,
                        border: `1px solid ${TOKENS.colors.gray200}`,
                        background: "#fff",
                        fontSize: "14px",
                        outline: "none",
                        resize: "vertical",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>

                  <div style={{ padding: "16px", background: "#fff", borderRadius: TOKENS.radii.lg, border: `1px solid ${TOKENS.colors.gray200}` }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: TOKENS.colors.gray700, marginBottom: "12px", textTransform: "uppercase" }}>Templates Rápidos</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <button
                        onClick={() => aplicarTemplate("IATF")}
                        style={{ padding: "10px 12px", background: TOKENS.colors.primaryLight, border: "none", borderRadius: TOKENS.radii.md, color: TOKENS.colors.primaryDark, fontWeight: "600", fontSize: "13px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: "8px" }}
                      >
                        <span style={{ fontSize: "16px" }}>⚡</span>
                        IATF Padrão (9 dias)
                      </button>
                      <button
                        onClick={() => aplicarTemplate("PRÉ-SINCRONIZAÇÃO")}
                        style={{ padding: "10px 12px", background: "#EDE9FE", border: "none", borderRadius: TOKENS.radii.md, color: TOKENS.colors.secondary, fontWeight: "600", fontSize: "13px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: "8px" }}
                      >
                        <span style={{ fontSize: "16px" }}>⚡</span>
                        Pré-sincronização (7 dias)
                      </button>
                    </div>
                  </div>

                  <div style={{ padding: "16px", background: "#fff", borderRadius: TOKENS.radii.lg, border: `1px solid ${TOKENS.colors.gray200}` }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: TOKENS.colors.gray700, marginBottom: "12px", textTransform: "uppercase" }}>Resumo</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div style={{ textAlign: "center", padding: "12px", background: TOKENS.colors.gray50, borderRadius: TOKENS.radii.md }}>
                        <div style={{ fontSize: "24px", fontWeight: "800", color: TOKENS.colors.primary }}>{dias.length}</div>
                        <div style={{ fontSize: "12px", color: TOKENS.colors.gray500 }}>Dias</div>
                      </div>
                      <div style={{ textAlign: "center", padding: "12px", background: TOKENS.colors.gray50, borderRadius: TOKENS.radii.md }}>
                        <div style={{ fontSize: "24px", fontWeight: "800", color: TOKENS.colors.secondary }}>{totalEtapas}</div>
                        <div style={{ fontSize: "12px", color: TOKENS.colors.gray500 }}>Etapas</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div style={{ flex: 1, padding: "24px", overflowY: "auto", background: "#fff" }}>
                <div style={{ maxWidth: "600px", margin: "0 auto" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: TOKENS.colors.gray800 }}>Linha do Tempo do Protocolo</h3>
                  </div>

                  <div>
                    {[...dias].sort((a, b) => a - b).map((d, idx) => (
                      <TimelineItem
                        key={d}
                        dia={d}
                        etapas={etapas[d] || []}
                        isLast={idx === dias.length - 1}
                        formOpen={formDia === d}
                        formData={form}
                        setFormData={atualizarForm}
                        onAdd={abrirEtapa}
                        onSelectEtapa={selecionarEtapaParaEditar}
                        onRemoveDia={removerDia}
                        onRemoveEtapa={removerEtapa}
                        onCancelForm={cancelarFormularioEtapa}
                      />
                    ))}
                  </div>

                  {dias.length > 0 && (
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                      <Button variant="secondary" size="sm" onClick={adicionarDia} icon="plus">
                        Adicionar Dia
                      </Button>
                    </div>
                  )}

                  {dias.length === 0 && (
                    <div style={{ textAlign: "center", padding: "40px", color: TOKENS.colors.gray400 }}>
                      <Icon name="calendar" size={48} color={TOKENS.colors.gray300} />
                      <p>Nenhum dia adicionado ainda.</p>
                      <Button variant="primary" size="sm" onClick={adicionarDia}>
                        Adicionar Primeiro Dia
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, padding: "40px", overflowY: "auto", background: TOKENS.colors.gray50 }}>
              <div style={{ maxWidth: "700px", margin: "0 auto" }}>
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                  <h2 style={{ margin: "0 0 8px", color: TOKENS.colors.gray800 }}>{nome || "Protocolo sem nome"}</h2>
                  <p style={{ margin: 0, color: TOKENS.colors.gray500 }}>{descricao || "Sem descrição"}</p>
                  <div style={{ marginTop: "12px" }}>
                    <Badge variant="primary" size="lg">
                      {tipo}
                    </Badge>
                  </div>
                </div>

                <div style={{ background: "#fff", borderRadius: TOKENS.radii.xl, padding: "32px", boxShadow: TOKENS.shadows.lg }}>
                  {previewData.map(({ dia, etapas: ets }) => (
                    <div key={dia} style={{ display: "flex", gap: "20px", marginBottom: "24px", opacity: ets.length ? 1 : 0.5 }}>
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: TOKENS.radii.full,
                          background: ets.length ? TOKENS.colors.primary : TOKENS.colors.gray200,
                          color: ets.length ? "#fff" : TOKENS.colors.gray500,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "800",
                          fontSize: "14px",
                          flexShrink: 0,
                        }}
                      >
                        D{dia}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "700", color: TOKENS.colors.gray800, marginBottom: "8px", fontSize: "16px" }}>Dia {dia}</div>
                        {ets.length ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {ets.map((e, i) => (
                              <div
                                key={i}
                                style={{
                                  padding: "12px 16px",
                                  background: e.hormonio ? TOKENS.colors.primaryLight : "#E0E7FF",
                                  borderRadius: TOKENS.radii.md,
                                  borderLeft: `4px solid ${e.hormonio ? TOKENS.colors.primary : TOKENS.colors.secondary}`,
                                }}
                              >
                                <span style={{ fontWeight: "600", color: TOKENS.colors.gray800 }}>{e.hormonio || e.acao}</span>
                                <span style={{ fontSize: "12px", color: TOKENS.colors.gray500, marginLeft: "8px" }}>{e.hormonio ? "Hormônio" : "Ação"}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ color: TOKENS.colors.gray400, fontStyle: "italic" }}>Nenhuma etapa neste dia</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${TOKENS.colors.gray200}`, padding: "16px 24px", background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "13px", color: TOKENS.colors.gray500 }}>
            {valido ? (
              <span style={{ color: TOKENS.colors.success, display: "flex", alignItems: "center", gap: "6px" }}>
                <Icon name="check" size={16} /> Pronto para salvar
              </span>
            ) : (
              <span>Preencha o nome e adicione pelo menos uma etapa</span>
            )}
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <Button variant="ghost" onClick={onFechar}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSalvar} disabled={!valido} icon="check">
              {isEdit ? "Salvar Alterações" : "Criar Protocolo"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
