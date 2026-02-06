import { useEffect, useMemo, useState } from "react";
import Select from "react-select";

/* =========================================================
   DESIGN SYSTEM (consistente)
   ========================================================= */
const theme = {
  colors: {
    slate: { 50: "#f8fafc", 100: "#f1f5f9", 200: "#e2e8f0", 300: "#cbd5e1", 400: "#94a3b8", 500: "#64748b", 600: "#475569", 700: "#334155", 800: "#1e293b", 900: "#0f172a" },
    primary: { 50: "#eff6ff", 100: "#dbeafe", 500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8" },
    warning: { 50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 500: "#f59e0b", 600: "#d97706" },
    danger: { 50: "#fef2f2", 100: "#fee2e2", 500: "#ef4444", 600: "#dc2626" },
    success: { 50: "#f0fdf4", 500: "#22c55e" },
  },
  shadows: { sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)", md: "0 4px 6px -1px rgb(0 0 0 / 0.1)", lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)" },
  radius: { sm: "6px", md: "8px", lg: "12px", xl: "16px" },
};

const Icons = {
  calendar: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  user: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  cow: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9z"/><path d="M4 9V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3"/></svg>,
  alert: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  syringe: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m10 17-5 5"/><path d="m14 14-2 2"/></svg>,
  dna: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 15c6.667-6 13.333 0 20-6"/><path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993"/><path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993"/><path d="M17 6l-2.5-2.5"/><path d="M14 8l-1-1"/><path d="M7 18l2.5 2.5"/><path d="M3.5 14.5l.5.5"/><path d="M20 9l.5.5"/><path d="M6.5 12.5l1 1"/><path d="M16.5 10.5l1 1"/><path d="M10 16l1.5 1.5"/></svg>,
  packages: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>,
};

/* =========================================================
   HELPERS (mantidos do original)
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
const brToISO = (br) => { const dt = parseBR(br); return dt ? toISODate(dt) : null; };
const addDays = (dt, n) => { const d = new Date(dt.getTime()); d.setDate(d.getDate() + n); return d; };
const diffDays = (a, b) => {
  if (!a || !b) return 0;
  const A = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const B = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((A - B) / DAY);
};

const RAZOES = [
  "Aceitando monta", "Montando", "Muco", "Marcação de tinta", "Cio silencioso",
  "Atividade (sensor)", "IATF", "RESSINC", "IATF / programa", "ReSynch", "Outro",
];
const TIPO_SEMEN = ["Convencional", "Fêmea sexado", "Macho sexado"];
const EVIDENCIAS = ["MUCO", "ACEITA_MONTA", "MONTANDO", "CIO_FRACO", "SEM_CIO_VISIVEL", "OUTRO"];
const RAZOES_EVIDENCIA = new Set(["IATF", "RESSINC"]);

/* =========================================================
   SUB-COMPONENTES UI
   ========================================================= */

const InputGroup = ({ label, children, error, icon: Icon, help }) => (
  <div style={{ marginBottom: "4px" }}>
    <label style={{
      display: "flex", alignItems: "center", gap: "6px",
      fontSize: "11px", fontWeight: 700, color: theme.colors.slate[600],
      textTransform: "uppercase", letterSpacing: "0.08em",
      marginBottom: "6px",
    }}>
      {Icon && <span style={{ color: theme.colors.slate[400] }}><Icon /></span>}
      {label}
    </label>
    {children}
    {help && !error && (
      <div style={{ marginTop: "4px", fontSize: "12px", color: theme.colors.slate[500] }}>
        {help}
      </div>
    )}
    {error && (
      <div style={{
        marginTop: "4px", fontSize: "12px", color: theme.colors.danger[600],
        display: "flex", alignItems: "center", gap: "4px", fontWeight: 600,
      }}>
        <Icons.alert /> {error}
      </div>
    )}
  </div>
);

const AlertCard = ({ type, title, children }) => {
  const styles = {
    warning: { bg: theme.colors.warning[50], border: theme.colors.warning[200], icon: "⚠️", titleColor: theme.colors.warning[600] },
    danger: { bg: theme.colors.danger[50], border: theme.colors.danger[200], icon: "🛑", titleColor: theme.colors.danger[600] },
    info: { bg: theme.colors.primary[50], border: theme.colors.primary[200], icon: "ℹ️", titleColor: theme.colors.primary[600] },
  };
  const s = styles[type] || styles.info;
  
  return (
    <div style={{
      padding: "12px 16px", background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: theme.radius.lg, display: "flex", gap: "12px", alignItems: "flex-start",
    }}>
      <span style={{ fontSize: "20px" }}>{s.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: "13px", color: s.titleColor, marginBottom: "2px" }}>
          {title}
        </div>
        <div style={{ fontSize: "13px", color: theme.colors.slate[700], lineHeight: 1.5 }}>
          {children}
        </div>
      </div>
    </div>
  );
};

const DatePreview = ({ label, start, end, highlight }) => (
  <div style={{
    padding: "12px", background: highlight ? theme.colors.primary[50] : theme.colors.slate[50],
    borderRadius: theme.radius.md, border: `1px solid ${highlight ? theme.colors.primary[200] : theme.colors.slate[200]}`,
    textAlign: "center", minWidth: "120px",
  }}>
    <div style={{ fontSize: "10px", fontWeight: 700, color: theme.colors.slate[500], textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
      {label}
    </div>
    <div style={{ fontSize: "14px", fontWeight: 700, color: theme.colors.slate[800] }}>
      {start === end ? formatBR(start) : `${formatBR(start)} - ${formatBR(end)}`}
    </div>
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
    "&:hover": { borderColor: state.isFocused ? theme.colors.primary[500] : theme.colors.slate[300] },
    fontSize: 14, background: "#fff",
  }),
  valueContainer: (base) => ({ ...base, padding: "0 12px" }),
  indicatorsContainer: (base) => ({ ...base, height: 40 }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? theme.colors.primary[50] : state.isFocused ? theme.colors.slate[50] : "white",
    color: state.isSelected ? theme.colors.primary[900] : theme.colors.slate[700],
    fontWeight: state.isSelected ? 600 : 400, fontSize: 14,
  }),
};

export default function Inseminacao({
  animal,
  touros = [],
  inseminadores = [],
  initialData = null,
  protocoloVinculadoOptions = [],
  protocoloVinculadoId = "",
  protocoloVinculadoRequired = false,
  onSelectProtocoloVinculado,
  onChangeDraft,
  vwpDias = 50,
  dg30 = [28, 35],
  dg60 = [55, 75],
}) {
  // Estados
  const [data, setData] = useState(formatBR(today()));
  const [touroId, setTouroId] = useState("");
  const [insId, setInsId] = useState("");
  const [obs, setObs] = useState("");
  const [razao, setRazao] = useState("");
  const [evidencia, setEvidencia] = useState("");
  const [tipoSemen, setTipoSemen] = useState("Convencional");
  const [palhetas, setPalhetas] = useState(1);
  const isVinculadoProtocolo = Boolean(initialData?.protocolo_aplicacao_id);

  // Sort touros
  const tourosOrdenados = useMemo(() => {
    const arr = [...touros];
    arr.sort((a, b) => {
      const ra = Number.isFinite(+a.restantes) ? +a.restantes : -1;
      const rb = Number.isFinite(+b.restantes) ? +b.restantes : -1;
      return rb - ra;
    });
    return arr;
  }, [touros]);

  // Options
  const inseminadorOptions = useMemo(() => inseminadores.map((i) => ({ value: i.id, label: i.nome })), [inseminadores]);
  const razoesOptions = useMemo(() => RAZOES.map((r) => ({ value: r, label: r })), []);
  const tipoSemenOptions = useMemo(() => TIPO_SEMEN.map((t) => ({ value: t, label: t })), []);
  const evidenciaOptions = useMemo(() => EVIDENCIAS.map((e) => ({ value: e, label: e })), []);
  
  const touroOptions = useMemo(() => tourosOrdenados.map((t) => {
    const restoOK = Number.isFinite(+t.restantes);
    const isDisabled = restoOK && +t.restantes <= 0;
    const extra = (t.codigo || t.raca ? `(${t.codigo || t.raca})` : "") + (restoOK ? ` • ${t.restantes} rest.` : "");
    return { value: t.id, label: `${t.nome} ${extra}`.trim(), isDisabled, raw: t };
  }), [tourosOrdenados]);

  const selectedTouro = useMemo(() => touroOptions.find(o => o.value === touroId) || null, [touroOptions, touroId]);
  const touroSel = useMemo(() => tourosOrdenados.find(t => t.id === touroId), [tourosOrdenados, touroId]);

  // Validações
  const restanteTouro = +touroSel?.restantes;
  const hasRestanteConfiavel = Number.isFinite(restanteTouro);
  const semEstoque = hasRestanteConfiavel && restanteTouro <= 0;
  const estoqueInsuficiente = hasRestanteConfiavel && palhetas > restanteTouro;

  // Cálculos datas
  const ultimaIA = parseAnyDate(animal?.ultima_ia);
  const dtAtual = parseBR(data) || today();
  const diasDesdeIA = ultimaIA ? diffDays(dtAtual, ultimaIA) : null;
  const partoDt = parseBR(animal?.parto);
  const delHoje = partoDt ? diffDays(dtAtual, partoDt) : null;

  const dg30Inicio = addDays(dtAtual, dg30[0]);
  const dg30Fim = addDays(dtAtual, dg30[1]);
  const dg60Inicio = addDays(dtAtual, dg60[0]);
  const dg60Fim = addDays(dtAtual, dg60[1]);

  useEffect(() => {
    if (!initialData) return;
    setData(initialData?.data || formatBR(today()));
    setTouroId(initialData?.touroId || "");
    setInsId(initialData?.inseminadorId || "");
    setObs(initialData?.obs || "");
    setRazao(initialData?.razao || "");
    setEvidencia(initialData?.evidencia || "");
    setTipoSemen(initialData?.tipoSemen || "Convencional");
    setPalhetas(initialData?.palhetas ?? 1);
  }, [initialData]);

  useEffect(() => {
    if (!RAZOES_EVIDENCIA.has(razao)) {
      setEvidencia("");
    }
  }, [razao]);

  // Avisos
  const avisos = [];
  if (diasDesdeIA !== null && diasDesdeIA >= 0 && diasDesdeIA < 18) {
    avisos.push({ type: "warning", title: "Intervalo curto", text: `Última IA há ${diasDesdeIA} dia(s). Avalie risco de dupla contagem.` });
  }
  if (delHoje !== null && delHoje < vwpDias) {
    avisos.push({ type: "warning", title: "Abaixo do VWP", text: `Animal com ${delHoje} DEL (mínimo recomendado: ${vwpDias}).` });
  }
  if (semEstoque) avisos.push({ type: "danger", title: "Sem estoque", text: "Touro selecionado não possui doses disponíveis." });
  else if (estoqueInsuficiente) avisos.push({ type: "danger", title: "Estoque insuficiente", text: `Solicitado ${palhetas} palheta(s), mas há apenas ${touroSel.restantes} disponível(eis).` });

  const extrasResumo = useMemo(() => {
    const parts = [];
    if (razao) parts.push(`Razão: ${razao}`);
    if (evidencia && RAZOES_EVIDENCIA.has(razao)) parts.push(`Evidência: ${evidencia}`);
    if (tipoSemen) parts.push(`Sêmen: ${tipoSemen}`);
    if (Number.isFinite(+palhetas)) parts.push(`Palhetas: ${palhetas}`);
    return parts.join(" | ");
  }, [razao, evidencia, tipoSemen, palhetas]);

  useEffect(() => {
    onChangeDraft?.({
      data,
      inseminadorId: insId,
      touroId,
      razao,
      evidencia,
      tipoSemen,
      palhetas,
      obs,
    });
  }, [data, insId, touroId, razao, evidencia, tipoSemen, palhetas, obs, onChangeDraft]);

  return (
    <form id="form-IA" onSubmit={(e) => e.preventDefault()} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {isVinculadoProtocolo && (
        <div style={{
          alignSelf: "flex-start",
          padding: "6px 10px",
          borderRadius: "999px",
          background: theme.colors.primary[50],
          color: theme.colors.primary[700],
          fontSize: "11px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          border: `1px solid ${theme.colors.primary[200]}`,
        }}>
          Vinculado ao protocolo
        </div>
      )}
      
      {/* SEÇÃO 1: DADOS PRINCIPAIS */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "16px",
        padding: "20px", background: "#fff", borderRadius: theme.radius.xl,
        border: `1px solid ${theme.colors.slate[200]}`, boxShadow: theme.shadows.sm,
      }}>
        {/* Data */}
        <div style={{ gridColumn: "span 3" }}>
          <InputGroup label="Data da IA" icon={Icons.calendar} help="Formato: dd/mm/aaaa" error={!brToISO(data) ? "Informe uma data válida no formato dd/mm/aaaa." : null}>
            <input
              value={data}
              onChange={(e) => {
                setData(e.target.value);
              }}
              placeholder="dd/mm/aaaa"
              style={{
                width: "100%", padding: "10px 12px", fontSize: "14px",
                borderRadius: theme.radius.md, border: `1px solid ${theme.colors.slate[200]}`,
                outline: "none", fontFamily: "monospace",
                ":focus": { borderColor: theme.colors.primary[500], boxShadow: `0 0 0 3px ${theme.colors.primary[100]}` },
              }}
            />
          </InputGroup>
        </div>

        {/* Inseminador */}
        <div style={{ gridColumn: "span 5" }}>
          <InputGroup label="Inseminador" icon={Icons.user} error={!insId ? "Selecione o inseminador." : null}>
            <Select
              styles={selectStyles}
              options={inseminadorOptions}
              value={insId ? (inseminadorOptions.find(o => o.value === insId) || null) : null}
              onChange={(opt) => {
                setInsId(opt?.value || "");
              }}
              placeholder="Selecione..."
              isClearable
              menuPortalTarget={document.body}
            />
          </InputGroup>
        </div>

        {/* Razão */}
        <div style={{ gridColumn: "span 4" }}>
          <InputGroup label="Razão" icon={() => <span>🎯</span>}>
            <Select
              styles={selectStyles}
              options={razoesOptions}
              value={razoesOptions.find(o => o.value === razao) || null}
              onChange={(opt) => setRazao(opt?.value || "")}
              placeholder="Selecione..."
              isClearable
              menuPortalTarget={document.body}
            />
          </InputGroup>
        </div>

        {RAZOES_EVIDENCIA.has(razao) && (
          <div style={{ gridColumn: "span 4" }}>
            <InputGroup label="Evidência" icon={() => <span>🧾</span>}>
              <Select
                styles={selectStyles}
                options={evidenciaOptions}
                value={evidenciaOptions.find(o => o.value === evidencia) || null}
                onChange={(opt) => setEvidencia(opt?.value || "")}
                placeholder="Selecione..."
                isClearable
                menuPortalTarget={document.body}
              />
            </InputGroup>
          </div>
        )}

        {protocoloVinculadoOptions.length > 1 && (
          <div style={{ gridColumn: "span 4" }}>
            <InputGroup
              label="Protocolo vinculado"
              icon={() => <span>🧩</span>}
              error={protocoloVinculadoRequired && !protocoloVinculadoId ? "Selecione o protocolo vinculado." : null}
            >
              <Select
                styles={selectStyles}
                options={protocoloVinculadoOptions}
                value={protocoloVinculadoOptions.find((o) => o.value === protocoloVinculadoId) || null}
                onChange={(opt) => onSelectProtocoloVinculado?.(opt?.value || "")}
                placeholder="Selecione..."
                isClearable
                menuPortalTarget={document.body}
              />
            </InputGroup>
          </div>
        )}
      </div>

      {/* SEÇÃO 2: DADOS DO SÊMEN */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "16px",
        padding: "20px", background: theme.colors.slate[50], borderRadius: theme.radius.xl,
        border: `1px solid ${theme.colors.slate[200]}`,
      }}>
        <div style={{ gridColumn: "span 12", marginBottom: "4px" }}>
          <h4 style={{ margin: 0, fontSize: "12px", fontWeight: 800, color: theme.colors.slate[600], textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: "8px" }}>
            <Icons.syringe /> Material Genético
          </h4>
        </div>

        {/* Touro */}
        <div style={{ gridColumn: "span 6" }}>
          <InputGroup label="Touro" icon={Icons.cow} error={!touroId ? "Selecione o touro." : (semEstoque ? "Sem estoque disponível" : null)}>
            <Select
              styles={selectStyles}
              options={touroOptions}
              value={touroId ? selectedTouro : null}
              onChange={(opt) => {
                setTouroId(opt?.value || "");
              }}
              placeholder="Selecione o touro..."
              isOptionDisabled={(o) => o.isDisabled}
              isClearable
              menuPortalTarget={document.body}
            />
          </InputGroup>
          {hasRestanteConfiavel && (
            <div style={{ 
              marginTop: "6px", fontSize: "12px", fontWeight: 600,
              color: restanteTouro < 5 ? theme.colors.danger[600] : theme.colors.success[600],
              display: "flex", alignItems: "center", gap: "4px",
            }}>
              <Icons.packages />
              {restanteTouro} doses em estoque
              {restanteTouro < 5 && <span style={{ color: theme.colors.danger[600] }}> (crítico)</span>}
            </div>
          )}
        </div>

        {/* Tipo */}
        <div style={{ gridColumn: "span 3" }}>
          <InputGroup label="Tipo Sêmen" icon={Icons.dna}>
            <Select
              styles={selectStyles}
              options={tipoSemenOptions}
              value={tipoSemenOptions.find(o => o.value === tipoSemen) || null}
              onChange={(opt) => setTipoSemen(opt?.value || "Convencional")}
              isClearable={false}
              menuPortalTarget={document.body}
            />
          </InputGroup>
        </div>

        {/* Palhetas */}
        <div style={{ gridColumn: "span 2" }}>
          <InputGroup label="Palhetas" icon={() => <span>🔢</span>} error={Number.isFinite(+palhetas) && +palhetas >= 1 ? (estoqueInsuficiente ? "Insuficiente" : null) : "Informe ao menos 1 palheta."}>
            <input
              type="number"
              min={1}
              max={touroSel?.restantes || 999}
              value={palhetas}
              onChange={(e) => {
                const parsed = parseInt(e.target.value || "0", 10);
                setPalhetas(Number.isFinite(parsed) ? parsed : 0);
              }}
              style={{
                width: "100%", padding: "10px 12px", fontSize: "14px",
                borderRadius: theme.radius.md, border: `1px solid ${estoqueInsuficiente ? theme.colors.danger[300] : theme.colors.slate[200]}`,
                outline: "none", textAlign: "center",
                background: estoqueInsuficiente ? theme.colors.danger[50] : "#fff",
              }}
            />
          </InputGroup>
        </div>

      </div>

      {/* SEÇÃO 3: ALERTAS INTELIGENTES */}
      {avisos.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {avisos.map((aviso, idx) => (
            <AlertCard key={idx} type={aviso.type} title={aviso.title}>
              {aviso.text}
            </AlertCard>
          ))}
        </div>
      )}

      {/* SEÇÃO 4: CRONOGRAMA DG */}
      <div style={{
        padding: "20px", background: "#fff", borderRadius: theme.radius.xl,
        border: `1px solid ${theme.colors.slate[200]}`, boxShadow: theme.shadows.sm,
      }}>
        <h4 style={{ margin: "0 0 16px 0", fontSize: "13px", fontWeight: 800, color: theme.colors.slate[700], textTransform: "uppercase", letterSpacing: "0.05em" }}>
          📅 Cronograma de Diagnósticos Sugeridos
        </h4>
        
        <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
          <DatePreview 
            label="DG 30 dias (US/PA)" 
            start={dg30Inicio} 
            end={dg30Fim} 
            highlight={true}
          />
          
          <div style={{ color: theme.colors.slate[300], fontSize: "24px" }}>→</div>
          
          <DatePreview 
            label="DG 60 dias (Confirmação)" 
            start={dg60Inicio} 
            end={dg60Fim} 
            highlight={false}
          />

          <div style={{ flex: 1, minWidth: "200px", padding: "12px", background: theme.colors.slate[50], borderRadius: theme.radius.md, borderLeft: `4px solid ${theme.colors.primary[500]}` }}>
            <div style={{ fontSize: "12px", color: theme.colors.slate[600], lineHeight: 1.5 }}>
              <strong>Protocolo recomendado:</strong> Realizar primeiro diagnóstico entre <strong>{dg30[0]}-{dg30[1]} dias</strong> após a IA. Se negativo ou duvidoso, repetir entre <strong>{dg60[0]}-{dg60[1]} dias</strong>.
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 5: OBSERVAÇÕES */}
      <div style={{ padding: "0 4px" }}>
        <InputGroup label="Observações Complementares" icon={() => <span>📝</span>}>
          <textarea
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            placeholder="Detalhes adicionais sobre o procedimento, condição do animal, etc..."
            rows={3}
            style={{
              width: "100%", padding: "12px", fontSize: "14px", lineHeight: 1.6,
              borderRadius: theme.radius.md, border: `1px solid ${theme.colors.slate[200]}`,
              outline: "none", resize: "vertical", fontFamily: "inherit",
              ":focus": { borderColor: theme.colors.primary[500] },
            }}
          />
        </InputGroup>
        
        {extrasResumo && (
          <div style={{ marginTop: "8px", padding: "8px 12px", background: theme.colors.slate[50], borderRadius: theme.radius.md, fontSize: "12px", color: theme.colors.slate[600] }}>
            <strong>Resumo técnico:</strong> {extrasResumo}
          </div>
        )}
      </div>
    </form>
  );
}
