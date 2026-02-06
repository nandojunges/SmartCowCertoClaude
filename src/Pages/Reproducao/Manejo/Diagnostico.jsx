import { useEffect, useMemo, useState } from "react";
import Select from "react-select";

/* =========================================================
   DESIGN SYSTEM
   ========================================================= */
const theme = {
  colors: {
    slate: { 50: "#f8fafc", 100: "#f1f5f9", 200: "#e2e8f0", 300: "#cbd5e1", 400: "#94a3b8", 500: "#64748b", 600: "#475569", 700: "#334155", 800: "#1e293b" },
    primary: { 50: "#eff6ff", 100: "#dbeafe", 500: "#3b82f6", 600: "#2563eb" },
    success: { 50: "#f0fdf4", 100: "#dcfce7", 500: "#22c55e", 600: "#16a34a" },
    danger: { 50: "#fef2f2", 100: "#fee2e2", 500: "#ef4444", 600: "#dc2626" },
    warning: { 50: "#fffbeb", 100: "#fef3c7", 500: "#f59e0b", 600: "#d97706" },
    neutral: { 50: "#fafafa", 100: "#f5f5f5", 500: "#737373" },
  },
  shadows: { sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)", md: "0 4px 6px -1px rgb(0 0 0 / 0.1)", lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)" },
  radius: { sm: "6px", md: "8px", lg: "12px", xl: "16px" },
};

const Icons = {
  calendar: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  stethoscope: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>,
  check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  x: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
  help: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  alert: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  cow: () => <span style={{fontSize: "20px"}}>🐄</span>,
};

/* =========================================================
   HELPERS
   ========================================================= */
const DAY = 86400000;
const today = () => new Date();
const formatBR = (dt) => (dt ? dt.toLocaleDateString("pt-BR") : "—");
const toISODate = (dt) => {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
const parseBR = (str) => {
  if (!str || typeof str !== "string" || str.length !== 10) return null;
  const [d, m, y] = str.split("/").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return Number.isFinite(dt.getTime()) ? dt : null;
};
const parseISO = (str) => {
  if (!str || typeof str !== "string" || str.length !== 10) return null;
  const [y, m, d] = str.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return Number.isFinite(dt.getTime()) ? dt : null;
};
const parseAnyDate = (str) => {
  if (!str) return null;
  return str.includes("/") ? parseBR(str) : (str.includes("-") ? parseISO(str) : null);
};
const diffDays = (a, b) => {
  if (!a || !b) return 0;
  const A = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const B = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((A - B) / DAY);
};

const RESULTADOS = [
  { value: "Prenhe", label: "Prenha", color: theme.colors.success[600], bg: theme.colors.success[50], icon: "🟢" },
  { value: "Vazia", label: "Vazia", color: theme.colors.danger[600], bg: theme.colors.danger[50], icon: "🔴" },
  { value: "Não vista", label: "Não Vista", color: theme.colors.warning[600], bg: theme.colors.warning[50], icon: "🟡" },
];

const LABEL_DOPPLER = "Doppler (>=20d)";
const LABEL_DG30 = "DG 30d";
const LABEL_DG60 = "DG 60d";
const LABEL_AVANC = "Avançado (>90d)";
const LABEL_OUTRO = "Outro";
const LABEL_SEMIA = "— sem IA —";
const PERMITE_NAO_VISTA_CEDO = true;

const validarDGJanela = ({ diasDesdeIA, tipoExame, resultado, dg30, dg60, dopplerMin, avancadoMin, permiteNaoVistaCedo }) => {
  if (diasDesdeIA == null) {
    return { isValido: false, motivoBloqueio: "Sem IA registrada para calcular a janela do diagnóstico." };
  }

  const bloquearConclusivo = !permiteNaoVistaCedo || resultado !== "Não vista";
  if (diasDesdeIA < dopplerMin && bloquearConclusivo) {
    return { isValido: false, motivoBloqueio: `Diagnóstico conclusivo exige mínimo de ${dopplerMin} dias pós-IA.` };
  }

  const minPorTipo = {
    [LABEL_DOPPLER]: dopplerMin,
    [LABEL_DG30]: dg30[0],
    [LABEL_DG60]: dg60[0],
    [LABEL_AVANC]: avancadoMin,
    [LABEL_OUTRO]: dopplerMin,
  };

  const minimo = minPorTipo[tipoExame];
  if (minimo && diasDesdeIA < minimo && bloquearConclusivo) {
    return { isValido: false, motivoBloqueio: `${tipoExame} exige mínimo de ${minimo} dias pós-IA.` };
  }

  return { isValido: true, motivoBloqueio: "" };
};

/* =========================================================
   SUB-COMPONENTES
   ========================================================= */

const InputGroup = ({ label, children, error, icon: Icon, help }) => (
  <div style={{ marginBottom: "4px" }}>
    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 700, color: theme.colors.slate[600], textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
      {Icon && <span style={{ color: theme.colors.slate[400] }}><Icon /></span>}
      {label}
    </label>
    {children}
    {help && !error && <div style={{ marginTop: "4px", fontSize: "12px", color: theme.colors.slate[500] }}>{help}</div>}
    {error && <div style={{ marginTop: "4px", fontSize: "12px", color: theme.colors.danger[600], display: "flex", alignItems: "center", gap: "4px" }}><Icons.alert /> {error}</div>}
  </div>
);

const TimelineJanelas = ({ dias, dg30, dg60, dopplerMin, avancadoMin }) => {
  // Calcula posição percentual na timeline (0-100 dias como base visual)
  const percent = Math.min((dias / 120) * 100, 100);
  
  const janelas = [
    { id: 'doppler', label: 'Doppler', min: dopplerMin, max: dg30[0]-1, color: theme.colors.primary[500] },
    { id: 'dg30', label: 'DG 30d', min: dg30[0], max: dg30[1], color: theme.colors.success[500] },
    { id: 'dg60', label: 'DG 60d', min: dg60[0], max: dg60[1], color: theme.colors.success[600] },
    { id: 'avanc', label: 'Avançado', min: avancadoMin, max: 999, color: theme.colors.slate[500] },
  ];

  const janelaAtual = janelas.find(j => dias >= j.min && dias <= j.max);
  
  return (
    <div style={{ marginTop: "16px", padding: "20px", background: "#fff", borderRadius: theme.radius.lg, border: `1px solid ${theme.colors.slate[200]}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <span style={{ fontSize: "12px", fontWeight: 700, color: theme.colors.slate[700] }}>Posição no Ciclo</span>
        <span style={{ fontSize: "14px", fontWeight: 800, color: janelaAtual?.color || theme.colors.slate[400] }}>
          {dias !== null ? `${dias} dias pós-IA` : "Sem IA registrada"}
        </span>
      </div>

      {/* Barra de progresso com zonas coloridas */}
      <div style={{ position: "relative", height: "32px", marginBottom: "24px" }}>
        {/* Background com as zonas */}
        <div style={{ position: "absolute", inset: 0, display: "flex", borderRadius: theme.radius.md, overflow: "hidden" }}>
          <div style={{ flex: 20, background: `${theme.colors.primary[100]}`, borderRight: `1px solid ${theme.colors.slate[200]}` }} /> {/* 0-20 Doppler */}
          <div style={{ flex: 15, background: `${theme.colors.success[100]}`, borderRight: `1px solid ${theme.colors.slate[200]}` }} /> {/* 20-35 DG30 */}
          <div style={{ flex: 40, background: `${theme.colors.success[50]}`, borderRight: `1px solid ${theme.colors.slate[200]}` }} /> {/* 35-75 DG60 */}
          <div style={{ flex: 45, background: `${theme.colors.slate[100]}` }} /> {/* 75+ Avançado */}
        </div>
        
        {/* Labels das zonas */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", fontSize: "10px", fontWeight: 700 }}>
          <div style={{ flex: 20, textAlign: "center", color: theme.colors.primary[600] }}>DOPPLER<br/>20-27d</div>
          <div style={{ flex: 15, textAlign: "center", color: theme.colors.success[700] }}>DG30<br/>28-35d</div>
          <div style={{ flex: 40, textAlign: "center", color: theme.colors.success[600] }}>DG60<br/>55-75d</div>
          <div style={{ flex: 45, textAlign: "center", color: theme.colors.slate[500] }}>AVANÇADO<br/>90d+</div>
        </div>

        {/* Marcador da posição atual */}
        {dias !== null && (
          <div style={{
            position: "absolute", left: `${percent}%`, top: "-8px", bottom: "-8px",
            transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", zIndex: 10,
          }}>
            <div style={{ 
              width: "3px", height: "100%", background: janelaAtual?.color || theme.colors.danger[500],
              boxShadow: `0 0 8px ${janelaAtual?.color || theme.colors.danger[500]}50`,
              borderRadius: "2px",
            }} />
            <div style={{
              position: "absolute", top: "-6px", padding: "2px 8px", borderRadius: theme.radius.full,
              background: janelaAtual?.color || theme.colors.danger[500], color: "#fff",
              fontSize: "11px", fontWeight: 800, whiteSpace: "nowrap",
              boxShadow: theme.shadows.md,
            }}>
              HOJE • {dias}d
            </div>
          </div>
        )}
      </div>

      {/* Legenda de status */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {janelas.map(j => {
          const isActive = j.id === janelaAtual?.id;
          return (
            <div key={j.id} style={{ 
              display: "flex", alignItems: "center", gap: "6px", padding: "4px 12px",
              background: isActive ? j.color : theme.colors.slate[100],
              color: isActive ? "#fff" : theme.colors.slate[600],
              borderRadius: theme.radius.full, fontSize: "12px", fontWeight: isActive ? 700 : 600,
              transition: "all 0.2s",
            }}>
              {isActive && <Icons.check />}
              {j.label}
              {!isActive && <span style={{ opacity: 0.7 }}>({j.min}-{j.max === 999 ? '∞' : j.max}d)</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CardErroIA = () => (
  <div style={{
    padding: "24px", background: theme.colors.danger[50], borderRadius: theme.radius.xl,
    border: `2px dashed ${theme.colors.danger[200]}`, display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", textAlign: "center",
  }}>
    <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px" }}>
      🚫
    </div>
    <div>
      <h4 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: 800, color: theme.colors.danger[700] }}>
        Inseminação não encontrada
      </h4>
      <p style={{ margin: 0, fontSize: "14px", color: theme.colors.danger[600], lineHeight: 1.5 }}>
        Este animal não possui IA registrada ou a data é inválida. 
        É necessário registrar uma inseminação antes de lançar o diagnóstico.
      </p>
    </div>
  </div>
);

const ResultadoCard = ({ selected, onChange }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
    {RESULTADOS.map((res) => {
      const isSelected = selected === res.value;
      return (
        <button
          key={res.value}
          onClick={() => onChange(res.value)}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
            padding: "16px", borderRadius: theme.radius.lg,
            border: `2px solid ${isSelected ? res.color : theme.colors.slate[200]}`,
            background: isSelected ? res.bg : "#fff",
            cursor: "pointer", transition: "all 0.2s",
            boxShadow: isSelected ? `0 4px 12px ${res.color}20` : "none",
          }}
        >
          <span style={{ fontSize: "32px" }}>{res.icon}</span>
          <span style={{ 
            fontSize: "14px", fontWeight: isSelected ? 800 : 700,
            color: isSelected ? res.color : theme.colors.slate[700],
          }}>
            {res.label}
          </span>
        </button>
      );
    })}
  </div>
);

/* =========================================================
   COMPONENTE PRINCIPAL
   ========================================================= */

const selectStyles = {
  control: (base, state) => ({
    ...base, minHeight: 40, borderRadius: theme.radius.md,
    borderColor: state.isFocused ? theme.colors.primary[500] : theme.colors.slate[200],
    boxShadow: state.isFocused ? `0 0 0 3px ${theme.colors.primary[100]}` : "none",
    fontSize: 14,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? theme.colors.primary[50] : state.isFocused ? theme.colors.slate[50] : "white",
    color: state.isSelected ? theme.colors.primary[900] : theme.colors.slate[700],
    fontWeight: state.isSelected ? 600 : 400,
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
};

export default function Diagnostico({
  animal,
  onChangeDraft,
  dg30 = [28, 35],
  dg60 = [55, 75],
  dopplerMin = 20,
  avancadoMin = 90, // Corrigido de 100 para 90 conforme nome da constante
}) {
  const [resultado, setResultado] = useState("Prenhe");
  const [data, setData] = useState(formatBR(today()));
  const [comentario, setComentario] = useState("");

  const dtIA = useMemo(() => parseAnyDate(animal?.ultima_ia), [animal]);
  const dtExame = useMemo(() => parseBR(data) || today(), [data]);
  const diasDesdeIA = useMemo(() => (dtIA ? diffDays(dtExame, dtIA) : null), [dtIA, dtExame]);
  // Sugestão automática tipo exame
  const tipoDefault = useMemo(() => {
    if (diasDesdeIA == null) return LABEL_SEMIA;
    if (diasDesdeIA >= dg30[0] && diasDesdeIA <= dg30[1]) return LABEL_DG30;
    if (diasDesdeIA >= dg60[0] && diasDesdeIA <= dg60[1]) return LABEL_DG60;
    if (diasDesdeIA >= avancadoMin) return LABEL_AVANC;
    if (diasDesdeIA >= dopplerMin && diasDesdeIA < dg30[0]) return LABEL_DOPPLER;
    return LABEL_OUTRO;
  }, [diasDesdeIA, dg30, dg60, dopplerMin, avancadoMin]);

  const temIAValida = !!dtIA;

  const [tipoExame, setTipoExame] = useState(tipoDefault);
  const { isValido: isDGValido, motivoBloqueio } = useMemo(() => validarDGJanela({
    diasDesdeIA,
    tipoExame,
    resultado,
    dg30,
    dg60,
    dopplerMin,
    avancadoMin,
    permiteNaoVistaCedo: PERMITE_NAO_VISTA_CEDO,
  }), [diasDesdeIA, tipoExame, resultado, dg30, dg60, dopplerMin, avancadoMin]);

  useEffect(() => {
    if (!temIAValida) { setTipoExame(LABEL_SEMIA); return; }
    if (tipoExame === LABEL_SEMIA || tipoDefault !== LABEL_OUTRO) {
      setTipoExame(tipoDefault);
    }
  }, [tipoDefault, temIAValida]);

  useEffect(() => {
    onChangeDraft?.({
      kind: "DG",
      dg: resultado,
      isValido: isDGValido,
      motivoBloqueio,
      data,
      extras: {
        tipoExame,
        diasDesdeIA,
        comentario: comentario?.trim() || "",
      },
    });
  }, [resultado, data, tipoExame, comentario, diasDesdeIA, isDGValido, motivoBloqueio, onChangeDraft]);

  const tipoOptions = useMemo(() => {
    if (!temIAValida) return [{ value: LABEL_SEMIA, label: LABEL_SEMIA }];
    const inDoppler = diasDesdeIA >= dopplerMin && diasDesdeIA < dg30[0];
    const ordered = inDoppler
      ? [LABEL_DOPPLER, LABEL_DG30, LABEL_DG60, LABEL_AVANC, LABEL_OUTRO]
      : [LABEL_DG30, LABEL_DG60, LABEL_AVANC, LABEL_DOPPLER, LABEL_OUTRO];
    return ordered.map((v) => ({ value: v, label: v }));
  }, [temIAValida, diasDesdeIA, dopplerMin, dg30]);

  // Avisos
  const avisos = [];
  if (temIAValida && !isDGValido && motivoBloqueio) {
    avisos.push({ type: "error", title: "Bloqueio de janela mínima", text: motivoBloqueio });
  }
  if (!temIAValida) {
    avisos.push({ type: "error", title: "Sem IA registrada", text: "Registre uma inseminação antes do diagnóstico." });
  } else {
    if (diasDesdeIA < dg30[0]) {
      if (diasDesdeIA >= dopplerMin) {
        avisos.push({ type: "warning", title: "Período Doppler", text: `IA há ${diasDesdeIA} dias. Fora da janela DG30, mas adequado para Doppler.` });
      } else {
        avisos.push({ type: "warning", title: "Muito cedo", text: `IA há apenas ${diasDesdeIA} dias. Mínimo recomendado: ${dopplerMin} dias (Doppler) ou ${dg30[0]} dias (DG30).` });
      }
    }
    if (tipoExame === LABEL_DG30 && diasDesdeIA > dg30[1]) {
      avisos.push({ type: "info", title: "DG30 tardio", text: `IA há ${diasDesdeIA} dias. DG30 tardio permitido como primeiro diagnóstico.` });
    }
    if (diasDesdeIA > dg60[1] && diasDesdeIA < avancadoMin) {
      avisos.push({ type: "info", title: "DG tardia", text: `IA há ${diasDesdeIA} dias. Fora da janela DG60. Considere exame avançado.` });
    }
  }

  if (!temIAValida) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <CardErroIA />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* TIMELINE VISUAL */}
      <TimelineJanelas 
        dias={diasDesdeIA} 
        dg30={dg30} 
        dg60={dg60} 
        dopplerMin={dopplerMin} 
        avancadoMin={avancadoMin} 
      />

      {/* RESULTADO - CARDS GRANDES */}
      <div style={{ padding: "4px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 700, color: theme.colors.slate[600], textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
          <Icons.stethoscope /> Resultado do Exame
        </label>
        <ResultadoCard selected={resultado} onChange={setResultado} />
      </div>

      {/* DADOS DO EXAME */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px",
        padding: "20px", background: "#fff", borderRadius: theme.radius.xl,
        border: `1px solid ${theme.colors.slate[200]}`, boxShadow: theme.shadows.sm,
      }}>
        <InputGroup label="Data do Exame" icon={Icons.calendar} help={temIAValida ? `Baseado na IA de ${formatBR(dtIA)}` : ""}>
          <input
            value={data}
            onChange={(e) => setData(e.target.value)}
            placeholder="dd/mm/aaaa"
            style={{
              width: "100%", padding: "10px 12px", fontSize: "14px",
              borderRadius: theme.radius.md, border: `1px solid ${theme.colors.slate[200]}`,
              outline: "none", fontFamily: "monospace",
            }}
          />
        </InputGroup>

        <InputGroup label="Tipo de Exame" icon={() => <span>🔬</span>} help="Sugerido automaticamente baseado nos dias">
          <Select
            styles={selectStyles}
            options={tipoOptions}
            value={tipoOptions.find(o => o.value === tipoExame) || null}
            onChange={(opt) => setTipoExame(opt?.value || tipoDefault)}
            isClearable={false}
            menuPortalTarget={document.body}
          />
        </InputGroup>
      </div>

      {/* COMENTÁRIO */}
      <div style={{ padding: "0 4px" }}>
        <InputGroup label="Observações Técnicas" icon={() => <span>📝</span>} help="Ex: US 5.0 MHz; corpo lúteo presente; líquor uterino">
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Descreva achados do exame, equipamento utilizado, condições observadas..."
            rows={3}
            style={{
              width: "100%", padding: "12px", fontSize: "14px", lineHeight: 1.6,
              borderRadius: theme.radius.md, border: `1px solid ${theme.colors.slate[200]}`,
              outline: "none", resize: "vertical", fontFamily: "inherit",
            }}
          />
        </InputGroup>
      </div>

      {/* AVISOS CONTEXTUAIS */}
      {avisos.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {avisos.map((aviso, idx) => (
            <div key={idx} style={{
              padding: "12px 16px", borderRadius: theme.radius.lg,
              background: aviso.type === "error" ? theme.colors.danger[50] : aviso.type === "warning" ? theme.colors.warning[50] : theme.colors.primary[50],
              border: `1px solid ${aviso.type === "error" ? theme.colors.danger[200] : aviso.type === "warning" ? theme.colors.warning[200] : theme.colors.primary[200]}`,
              display: "flex", gap: "12px", alignItems: "flex-start",
            }}>
              <span style={{ fontSize: "20px" }}>
                {aviso.type === "error" ? "🛑" : aviso.type === "warning" ? "⚠️" : "ℹ️"}
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: "13px", color: aviso.type === "error" ? theme.colors.danger[700] : aviso.type === "warning" ? theme.colors.warning[700] : theme.colors.primary[700] }}>
                  {aviso.title}
                </div>
                <div style={{ fontSize: "13px", color: theme.colors.slate[700], marginTop: "2px" }}>
                  {aviso.text}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
