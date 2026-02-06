import React, { useEffect, useMemo, useRef, useState } from "react";
import Select from "react-select";

/** =========================================================
 *  MODAL + SUBCOMPONENTES — LIMPEZA
 *  - Modal base (overlay + ESC)
 *  - CadastroCicloModal (form)
 *  - PlanoSemanal (visualização)
 *  - Helpers/Constantes exportados p/ Limpeza.jsx
 * ========================================================= */

export const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const DIAS_COMPLETOS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];
export const TIPOS = ["Ordenhadeira", "Resfriador", "Tambo", "Outros"];

/* ===== helpers ===== */
export const formatBRL = (n) =>
  (Number(n) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export const convToMl = (valor, unidade) => {
  const v = Number(valor) || 0;
  const u = String(unidade || "").toLowerCase();
  return u.startsWith("l") ? v * 1000 : v;
};

export const parseCond = (c) => {
  if (!c) return { tipo: "sempre" };
  if (typeof c === "object") return c;
  if (String(c).toLowerCase().includes("manhã")) return { tipo: "manha" };
  if (String(c).toLowerCase().includes("tarde")) return { tipo: "tarde" };
  const m = String(c).match(/a cada\s*(\d+)/i);
  if (m) return { tipo: "cada", intervalo: parseInt(m[1], 10) };
  return { tipo: "sempre" };
};

export const vezesPorDia = (cond, freq) => {
  switch (cond?.tipo) {
    case "cada":
      return (Number(freq) || 1) / Math.max(1, Number(cond.intervalo) || 1);
    case "manha":
    case "tarde":
      return 1;
    default:
      return Number(freq) || 1;
  }
};

export function isNum(n) {
  if (n === "" || n === null || n === undefined) return false;
  const v = Number(n);
  return typeof v === "number" && !Number.isNaN(v);
}

export function cryptoId() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch {}
  return `id_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

export const formatGrupoEquivalenciaLabel = (value) => {
  const bruto = String(value || "").trim();
  if (!bruto) return "";

  const semPrefixo = bruto.startsWith("HIGIENE_") ? bruto.slice("HIGIENE_".length) : bruto;

  return semPrefixo
    .split("_")
    .map((parte) => parte.trim())
    .filter(Boolean)
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1).toLowerCase())
    .join(" ");
};

/* =================== Modal base =================== */
export function Modal({ title, children, onClose }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          width: "800px",
          maxWidth: "95vw",
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
            color: "#fff",
            padding: "20px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontWeight: 700, fontSize: "18px" }}>{title}</span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: "24px",
              cursor: "pointer",
            }}
            aria-label="Fechar"
            title="Fechar (ESC)"
          >
            ×
          </button>
        </div>

        <div style={{ padding: "24px", overflow: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

/* =================== Cadastro (form modal) =================== */
export function CadastroCicloModal({
  value,
  onCancel,
  onSave,
  tipos,
  gruposFuncionaisOptions,
  precoPorML,
  erroValidacao = "",
  erroNomeDuplicado = false,
  onClearErroValidacao,
}) {
  const [form, setForm] = useState(value);
  const [previewCusto, setPreviewCusto] = useState(0);
  const nomeInputRef = useRef(null);

  useEffect(() => {
    setForm(value);
  }, [value]);

  const tipoOptions = useMemo(() => (tipos || []).map((t) => ({ value: t, label: t })), [tipos]);
  const frequenciaOptions = useMemo(
    () => [1, 2, 3, 4].map((f) => ({ value: f, label: `${f}x ao dia` })),
    []
  );
  const condicaoOptions = useMemo(
    () => [
      { value: "sempre", label: "Sempre" },
      { value: "manha", label: "Somente Manhã" },
      { value: "tarde", label: "Somente Tarde" },
      { value: "cada", label: "A cada X ordenhas" },
    ],
    []
  );
  const unidadeOptions = useMemo(
    () => [
      { value: "mL", label: "mL" },
      { value: "L", label: "L" },
    ],
    []
  );

  const rsStyles = useMemo(
    () => ({
      control: (base) => ({
        ...base,
        borderColor: "#d1d5db",
        borderRadius: 10,
        minHeight: 44,
        boxShadow: "none",
        fontSize: 14,
        ":hover": { borderColor: "#d1d5db" },
      }),
      valueContainer: (base) => ({ ...base, padding: "2px 12px" }),
      placeholder: (base) => ({ ...base, color: "#94a3b8" }),
      menu: (base) => ({ ...base, zIndex: 99999, borderRadius: 10 }),
      option: (base) => ({ ...base, fontSize: 14 }),
    }),
    []
  );

  useEffect(() => {
    if (!Array.isArray(gruposFuncionaisOptions) || !gruposFuncionaisOptions.length) return;
    setForm((prev) => {
      if (!prev) return prev;
      const fallbackGrupo = gruposFuncionaisOptions[0].value;
      const etapas = (prev.etapas || []).map((etapa) => {
        const grupoAtual = String(
          etapa?.grupo_equivalencia || etapa?.produto || ""
        ).trim();
        return { ...etapa, grupo_equivalencia: grupoAtual || fallbackGrupo };
      });
      return { ...prev, etapas };
    });
  }, [gruposFuncionaisOptions]);

  const getQuantidadeEtapa = (etapa) => etapa?.quantidade ?? etapa?.quantidade_ml ?? "";

  useEffect(() => {
    const freq = Number(form.frequencia) || 1;
    const custo = (form.etapas || []).reduce((acc, e) => {
      const cond = parseCond(e.condicao);
      const vezes = vezesPorDia(cond, freq);
      const ml = convToMl(getQuantidadeEtapa(e), e.unidade);
      const preco = precoPorML?.[e.grupo_equivalencia] ?? 0;
      return acc + ml * vezes * preco;
    }, 0);
    setPreviewCusto(custo);
  }, [form, precoPorML]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!erroNomeDuplicado) return;
    nomeInputRef.current?.focus();
  }, [erroNomeDuplicado]);

  const toggleDia = (d) =>
    set(
      "diasSemana",
      form.diasSemana.includes(d)
        ? form.diasSemana.filter((x) => x !== d)
        : [...form.diasSemana, d]
    );

  const setEtapa = (i, campo, val) => {
    const arr = [...form.etapas];
    arr[i] = { ...arr[i], [campo]: val };
    set("etapas", arr);
  };

  const getCondicaoOption = (condicao) => {
    const parsed = parseCond(condicao);
    return condicaoOptions.find((c) => c.value === parsed?.tipo) || condicaoOptions[0];
  };

  const addEtapa = () =>
    set("etapas", [
      ...form.etapas,
      {
        grupo_equivalencia: gruposFuncionaisOptions?.[0]?.value || "",
        quantidade: "",
        unidade: "mL",
        condicao: { tipo: "sempre" },
        complementar: false,
      },
    ]);

  const rmEtapa = (i) => set("etapas", form.etapas.filter((_, idx) => idx !== i));

  const styles = {
    formGroup: { marginBottom: "20px" },
    label: {
      display: "block",
      fontSize: "13px",
      fontWeight: 600,
      color: "#374151",
      marginBottom: "6px",
    },
    input: {
      width: "100%",
      padding: "10px 12px",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      fontSize: "14px",
    },
    select: { width: "100%" },
    diasGrid: { display: "flex", gap: "8px", flexWrap: "wrap" },
    diaChip: {
      padding: "8px 16px",
      borderRadius: "8px",
      border: "2px solid #e2e8f0",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: 600,
      transition: "all 0.2s",
      background: "#fff",
    },
    diaChipAtivo: { backgroundColor: "#3b82f6", color: "#fff", borderColor: "#3b82f6" },
    diaChipInativo: { backgroundColor: "#fff", color: "#64748b" },

    etapaCard: {
      backgroundColor: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      padding: "16px",
      marginBottom: "12px",
    },
    etapaHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "12px",
    },
    etapaTitle: { fontWeight: 700, color: "#1e40af" },

    row: { display: "flex", gap: "12px", marginBottom: "12px" },
    col: { flex: 1 },

    checkboxLabel: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "14px",
      color: "#374151",
      cursor: "pointer",
    },

    previewBox: {
      backgroundColor: "#f0fdf4",
      border: "1px solid #bbf7d0",
      borderRadius: "8px",
      padding: "12px 16px",
      marginBottom: "20px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    previewLabel: { fontSize: "13px", color: "#166534", fontWeight: 600 },
    previewValue: { fontSize: "18px", fontWeight: 700, color: "#059669" },
    erroBanner: {
      marginBottom: "16px",
      backgroundColor: "#fef2f2",
      color: "#b91c1c",
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: "#fecaca",
      borderRadius: "8px",
      padding: "10px 12px",
      fontSize: "13px",
      fontWeight: 500,
    },

    buttonGroup: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "12px",
      marginTop: "24px",
    },
    btnSecondary: {
      padding: "10px 20px",
      border: "1px solid #e5e7eb",
      backgroundColor: "#fff",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: 500,
    },
    btnPrimary: {
      padding: "10px 20px",
      border: "none",
      backgroundColor: "#3b82f6",
      color: "#fff",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: 600,
    },
    btnAdd: {
      padding: "8px 16px",
      border: "2px dashed #cbd5e1",
      backgroundColor: "#fff",
      borderRadius: "8px",
      cursor: "pointer",
      color: "#64748b",
      fontWeight: 500,
      width: "100%",
      marginTop: "8px",
    },
    btnRemove: {
      padding: "6px 12px",
      fontSize: "12px",
      color: "#ef4444",
      border: "1px solid #fecaca",
      backgroundColor: "#fef2f2",
      borderRadius: "6px",
      cursor: "pointer",
    },
  };

  return (
    <div style={{ maxHeight: "70vh", overflow: "auto", paddingRight: "8px" }}>
      {!gruposFuncionaisOptions?.length && (
        <div
          style={{
            marginBottom: "16px",
            backgroundColor: "#fffbeb",
            color: "#92400e",
            border: "1px solid #fde68a",
            borderRadius: "8px",
            padding: "10px 12px",
            fontSize: "13px",
          }}
        >
          Cadastre produtos com categoria Higiene e grupo_equivalencia no estoque.
        </div>
      )}

      <div style={styles.previewBox}>
        <span style={styles.previewLabel}>💰 Custo Estimado (Preview)</span>
        <span style={styles.previewValue}>{formatBRL(previewCusto)} / dia</span>
      </div>

      {erroValidacao ? <div style={styles.erroBanner}>{erroValidacao}</div> : null}

      <div style={styles.formGroup}>
        <label style={styles.label}>Nome do Ciclo *</label>
        <input
          ref={nomeInputRef}
          style={{
            ...styles.input,
            ...(erroNomeDuplicado
              ? {
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "#ef4444",
                }
              : null),
          }}
          value={form.nome}
          onChange={(e) => {
            if (erroValidacao) onClearErroValidacao?.();
            set("nome", e.target.value);
          }}
          placeholder="Ex: CIP Ordenhadeira Tarde"
        />
      </div>

      <div style={styles.row}>
        <div style={styles.col}>
          <label style={styles.label}>Tipo de Equipamento *</label>
          <Select
            styles={rsStyles}
            options={tipoOptions}
            value={tipoOptions.find((t) => t.value === form.tipo) || null}
            onChange={(option) => set("tipo", option?.value || "")}
            placeholder="Selecione o tipo..."
          />
        </div>
        <div style={styles.col}>
          <label style={styles.label}>Frequência por dia *</label>
          <Select
            styles={rsStyles}
            options={frequenciaOptions}
            value={frequenciaOptions.find((f) => f.value === form.frequencia) || null}
            onChange={(option) => set("frequencia", Number(option?.value || 1))}
            placeholder="Selecione a frequência..."
          />
        </div>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Dias da Semana *</label>
        <div style={styles.diasGrid}>
          {DIAS.map((dia, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => toggleDia(idx)}
              style={{
                ...styles.diaChip,
                ...(form.diasSemana.includes(idx) ? styles.diaChipAtivo : styles.diaChipInativo),
              }}
            >
              {dia}
            </button>
          ))}
        </div>
      </div>

      <div style={{ ...styles.formGroup, borderTop: "2px solid #e2e8f0", paddingTop: "20px" }}>
        <label style={{ ...styles.label, fontSize: "16px", color: "#0f172a" }}>
          Etapas de Limpeza
        </label>

        {form.etapas.map((etapa, i) => (
          <div key={i} style={styles.etapaCard}>
            <div style={styles.etapaHeader}>
              <span style={styles.etapaTitle}>Etapa {i + 1}</span>
              {form.etapas.length > 1 && (
                <button type="button" style={styles.btnRemove} onClick={() => rmEtapa(i)}>
                  Remover
                </button>
              )}
            </div>

            <div style={styles.row}>
              <div style={{ flex: 2 }}>
                <label style={styles.label}>Grupo funcional</label>
                <Select
                  styles={rsStyles}
                  options={gruposFuncionaisOptions || []}
                  value={(gruposFuncionaisOptions || []).find((o) => o.value === etapa.grupo_equivalencia) || null}
                  onChange={(option) => setEtapa(i, "grupo_equivalencia", option?.value || "")}
                  placeholder={(gruposFuncionaisOptions || []).length === 0 ? "Cadastre produtos com categoria Higiene e grupo_equivalencia no estoque." : "Selecione o grupo funcional..."}
                  isDisabled={!(gruposFuncionaisOptions || []).length}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Qtd</label>
                <input
                  type="number"
                  style={styles.input}
                  value={getQuantidadeEtapa(etapa)}
                  onChange={(e) => setEtapa(i, "quantidade", e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Unidade</label>
                <Select
                  styles={rsStyles}
                  options={unidadeOptions}
                  value={unidadeOptions.find((u) => u.value === etapa.unidade) || unidadeOptions[0]}
                  onChange={(option) => setEtapa(i, "unidade", option?.value || "mL")}
                />
              </div>
            </div>

            <div style={styles.row}>
              <div style={styles.col}>
                <label style={styles.label}>Condição de Aplicação</label>
                <Select
                  styles={rsStyles}
                  options={condicaoOptions}
                  value={getCondicaoOption(etapa.condicao)}
                  onChange={(option) =>
                    setEtapa(i, "condicao", {
                      tipo: option?.value || "sempre",
                      intervalo: option?.value === "cada" ? 2 : undefined,
                    })
                  }
                />
              </div>

              {etapa.condicao?.tipo === "cada" && (
                <div style={styles.col}>
                  <label style={styles.label}>Intervalo (ordenhas)</label>
                  <input
                    type="number"
                    min="2"
                    style={styles.input}
                    value={etapa.condicao?.intervalo || 2}
                    onChange={(e) =>
                      setEtapa(i, "condicao", { tipo: "cada", intervalo: Number(e.target.value) })
                    }
                  />
                </div>
              )}
            </div>

            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={!!etapa.complementar}
                onChange={(e) => setEtapa(i, "complementar", e.target.checked)}
              />
              <span>Etapa complementar (executada junto com a anterior)</span>
            </label>
          </div>
        ))}

        <button type="button" style={styles.btnAdd} onClick={addEtapa}>
          + Adicionar Etapa
        </button>
      </div>

      <div style={styles.buttonGroup}>
        <button type="button" style={styles.btnSecondary} onClick={onCancel}>
          Cancelar
        </button>
        <button type="button" style={styles.btnPrimary} onClick={() => onSave(form)}>
          Salvar Ciclo
        </button>
      </div>
    </div>
  );
}

/* =================== Plano semanal (visualização) =================== */
export function PlanoSemanal({ ciclo }) {
  const freq = Number(ciclo?.frequencia) || 1;
  const etapas = ciclo?.etapas || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "60vh", overflow: "auto" }}>
      {DIAS.map((diaNome, diaIdx) => {
        if (!ciclo?.diasSemana?.includes(diaIdx)) return null;

        const execs = [];
        for (let exec = 0; exec < freq; exec++) {
          const horario =
            freq === 1 ? "Única" : exec === 0 ? "Manhã" : exec === 1 ? "Tarde" : `Ordenha ${exec + 1}`;

          const itens = [];
          etapas.forEach((e) => {
            const cond = parseCond(e.condicao);

            let aplicar = true;
            if (cond.tipo === "cada") aplicar = (exec + 1) % (cond.intervalo || 1) === 0;
            else if (cond.tipo === "manha") aplicar = horario === "Manhã";
            else if (cond.tipo === "tarde") aplicar = horario === "Tarde";

            if (aplicar) {
              const grupoLabel = formatGrupoEquivalenciaLabel(e.grupo_equivalencia);
              itens.push(`${e.quantidade}${e.unidade} de ${grupoLabel || "—"}`);
            }
          });

          if (itens.length) execs.push({ horario, itens });
        }

        if (execs.length === 0) return null;

        return (
          <div
            key={diaIdx}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "16px",
              backgroundColor: "#f8fafc",
            }}
          >
            <div style={{ fontWeight: 700, color: "#1e40af", marginBottom: "12px", fontSize: "16px" }}>
              {diaNome}
            </div>

            {execs.map((ex, i) => (
              <div key={i} style={{ marginBottom: i < execs.length - 1 ? "12px" : 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#64748b", marginBottom: "6px" }}>
                  {ex.horario}
                </div>
                <ul style={{ margin: 0, paddingLeft: "20px" }}>
                  {ex.itens.map((item, k) => (
                    <li key={k} style={{ color: "#334155", fontSize: "14px", marginBottom: "4px" }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
