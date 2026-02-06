import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Select from "react-select";
import { toast } from "react-toastify";
import { supabase } from "../../../lib/supabaseClient";
import { useFazenda } from "../../../context/FazendaContext";

/* =========================================================
   DESIGN SYSTEM (consistente com o modal que criamos)
   ========================================================= */
const theme = {
  colors: {
    slate: { 50: "#f8fafc", 100: "#f1f5f9", 200: "#e2e8f0", 300: "#cbd5e1", 400: "#94a3b8", 500: "#64748b", 600: "#475569", 700: "#334155", 800: "#1e293b", 900: "#0f172a" },
    primary: { 50: "#eff6ff", 100: "#dbeafe", 500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8" },
    warning: { 50: "#fffbeb", 100: "#fef3c7", 500: "#f59e0b", 600: "#d97706" },
    success: { 50: "#ecfdf5", 500: "#10b981", 600: "#059669" },
    danger: { 50: "#fef2f2", 500: "#ef4444", 600: "#dc2626" },
  },
  shadows: { sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)", md: "0 4px 6px -1px rgb(0 0 0 / 0.1)", lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)" },
  radius: { sm: "6px", md: "8px", lg: "12px", xl: "16px" },
};

const Icons = {
  calendar: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  clock: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  syringe: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m10 17-5 5"/><path d="m14 14-2 2"/></svg>,
  check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  alert: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  arrowRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>,
};

/* =========================================================
   HELPERS (mantidos do original)
   ========================================================= */
const todayBR = () => new Date().toLocaleDateString("pt-BR");
const pad2 = (n) => String(n).padStart(2, "0");
const nowHM = () => {
  const d = new Date();
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

const isoToBR = (value) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return "";
  const [yyyy, mm, dd] = String(value).split("-");
  return `${dd}/${mm}/${yyyy}`;
};

const onlyDigits = (v) => String(v || "").replace(/\D/g, "");

const maskDateBackfill = (input) => {
  const digits = onlyDigits(input).slice(-8).padStart(8, "0");
  const dd = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  return `${dd}/${mm}/${yyyy}`;
};

const maskHourBackfill = (input) => {
  const digits = onlyDigits(input).slice(-4).padStart(4, "0");
  const hh = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  return `${hh}:${mm}`;
};

const getProtoId = (p) => p?.id ?? p?.uuid ?? p?.ID ?? p?.codigo ?? "";
const getAnimalId = (a) => a?.id ?? a?.uuid ?? a?.animal_id ?? a?.cow_id ?? a?.ID ?? a?.codigo ?? "";

function isValidBRDate(s) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(String(s || ""))) return false;
  const [dd, mm, yyyy] = String(s).split("/").map(Number);
  const d = new Date(yyyy, mm - 1, dd);
  return d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd;
}

function brToISO(s) {
  if (!isValidBRDate(s)) return null;
  const [dd, mm, yyyy] = s.split("/").map(Number);
  return `${yyyy}-${pad2(mm)}-${pad2(dd)}`;
}

function addDaysBR(s, days) {
  if (!isValidBRDate(s)) return null;
  const [dd, mm, yyyy] = s.split("/").map(Number);
  const d = new Date(yyyy, mm - 1, dd);
  d.setDate(d.getDate() + Number(days || 0));
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function isValidHour(value) {
  const match = String(value || "").match(/^(\d{2}):(\d{2})$/);
  if (!match) return false;
  const hh = Number(match[1]);
  const mm = Number(match[2]);
  return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
}

/* =========================================================
   SUB-COMPONENTES UI
   ========================================================= */

const InputGroup = ({ label, children, error, icon: Icon }) => (
  <div style={{ marginBottom: "20px" }}>
    <label style={{
      display: "flex", alignItems: "center", gap: "6px",
      fontSize: "12px", fontWeight: 700, color: theme.colors.slate[700],
      textTransform: "uppercase", letterSpacing: "0.05em",
      marginBottom: "8px",
    }}>
      {Icon && <span style={{ color: theme.colors.slate[400] }}><Icon /></span>}
      {label}
    </label>
    {children}
    {error && (
      <div style={{
        marginTop: "6px", fontSize: "12px", color: theme.colors.danger[600],
        display: "flex", alignItems: "center", gap: "4px",
      }}>
        <Icons.alert /> {error}
      </div>
    )}
  </div>
);

const TextInput = ({ value, onChange, placeholder, type = "text", hasError, actionIcon: ActionIcon, onActionClick }) => (
  <div style={{ position: "relative" }}>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: "100%", padding: "10px 40px 10px 14px", fontSize: "14px",
        borderRadius: theme.radius.md,
        border: `1px solid ${hasError ? theme.colors.danger[300] : theme.colors.slate[200]}`,
        backgroundColor: "#fff", color: theme.colors.slate[800],
        outline: "none", transition: "all 0.2s",
        boxShadow: hasError ? `0 0 0 3px ${theme.colors.danger[50]}` : "none",
      }}
    />
    {ActionIcon && (
      <button
        type="button"
        onClick={onActionClick}
        style={{
          position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)",
          border: "none", background: "transparent", color: theme.colors.slate[500],
          display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: "4px",
        }}
      >
        <ActionIcon />
      </button>
    )}
  </div>
);

const CardEtapa = ({ etapa, isFirst, isLast }) => (
  <div style={{
    display: "flex", gap: "16px", position: "relative",
    opacity: isFirst ? 1 : 0.9,
  }}>
    {/* Linha conectora */}
    {!isLast && (
      <div style={{
        position: "absolute", left: "20px", top: "48px", bottom: "-16px",
        width: "2px", background: `linear-gradient(to bottom, ${theme.colors.primary[200]}, ${theme.colors.slate[200]})`,
      }} />
    )}
    
    {/* Círculo/Dia */}
    <div style={{
      width: "40px", height: "40px", borderRadius: "50%",
      background: isFirst ? theme.colors.primary[600] : "#fff",
      color: isFirst ? "#fff" : theme.colors.slate[600],
      border: `2px solid ${isFirst ? theme.colors.primary[600] : theme.colors.slate[200]}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "12px", fontWeight: 800, flexShrink: 0,
      zIndex: 1, boxShadow: theme.shadows.sm,
    }}>
      {etapa.idx}
    </div>
    
    {/* Conteúdo */}
    <div style={{
      flex: 1, padding: "12px 16px", background: "#fff",
      borderRadius: theme.radius.lg, border: `1px solid ${theme.colors.slate[200]}`,
      boxShadow: theme.shadows.sm, marginBottom: "12px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
        <span style={{ fontWeight: 700, color: theme.colors.slate[800], fontSize: "14px" }}>
          Etapa {etapa.idx}
        </span>
      </div>
      
      <div style={{ fontSize: "13px", color: theme.colors.slate[500], display: "flex", alignItems: "center", gap: "6px" }}>
        <Icons.calendar />
        {etapa.dataPrevista || "Data inválida"}
      </div>
      {etapa.detalhe && (
        <div style={{ marginTop: "6px", fontSize: "13px", color: theme.colors.slate[600] }}>
          • {etapa.detalhe}
        </div>
      )}
    </div>
  </div>
);

const Toggle = ({ checked, onChange, label }) => (
  <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
    <div style={{ position: "relative", width: "44px", height: "24px" }}>
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={onChange}
        style={{ opacity: 0, width: 0, height: 0 }}
      />
      <div style={{
        position: "absolute", inset: 0,
        backgroundColor: checked ? theme.colors.primary[600] : theme.colors.slate[200],
        borderRadius: "24px", transition: "0.3s",
        ":before": {
          content: '""', position: "absolute", height: "18px", width: "18px",
          left: checked ? "22px" : "4px", bottom: "3px",
          backgroundColor: "white", borderRadius: "50%", transition: "0.3s",
          boxShadow: theme.shadows.sm,
        }
      }} />
    </div>
    <span style={{ fontSize: "14px", fontWeight: 600, color: theme.colors.slate[700] }}>
      {label}
    </span>
  </label>
);

/* =========================================================
   COMPONENTE PRINCIPAL - VERSÃO PROFISSIONAL
   ========================================================= */

const tipoOptions = [
  { value: "IATF", label: "IATF - Inseminação em Tempo Fixo", color: theme.colors.primary[600] },
  { value: "PRESYNC", label: "Pré-sincronização", color: theme.colors.warning[600] },
];

const DUPLICIDADE_ATIVO_MSG = "Já existe um protocolo ATIVO para este animal. Encerre antes de aplicar outro.";

const selectStyles = {
  control: (base, state) => ({
    ...base, minHeight: 42, borderRadius: theme.radius.md,
    borderColor: state.isFocused ? theme.colors.primary[500] : theme.colors.slate[200],
    boxShadow: state.isFocused ? `0 0 0 3px ${theme.colors.primary[100]}` : "none",
    "&:hover": { borderColor: theme.colors.primary[400] }, fontSize: 14,
  }),
  option: (base, state) => ({
    ...base, 
    backgroundColor: state.isSelected ? theme.colors.primary[50] : state.isFocused ? theme.colors.slate[50] : "white",
    color: state.isSelected ? theme.colors.primary[900] : theme.colors.slate[700],
    fontWeight: state.isSelected ? 600 : 400,
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
};

export default function AplicarProtocolo({ animal, protocolos = [], onSubmit, bulkMode = false }) {
  const { fazendaAtualId } = useFazenda();
  const [tipo, setTipo] = useState("IATF");
  const [protId, setProtId] = useState("");
  const [dataInicio, setDataInicio] = useState(todayBR());
  const [horaInicio, setHoraInicio] = useState(nowHM());
  const [criarAgenda, setCriarAgenda] = useState(true);
  const [erro, setErro] = useState("");
  const [touched, setTouched] = useState({});
  const hiddenDateRef = useRef(null);
  const hiddenTimeRef = useRef(null);

  // Reset protocolo ao mudar tipo
  useEffect(() => {
    setProtId("");
    setErro("");
  }, [tipo]);

  const normalizeTipo = useCallback((value) => {
    const t = String(value || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toUpperCase().replace(/[\s_-]/g, "");
    if (t.includes("IATF")) return "IATF";
    if (t.includes("PRE") || t.includes("PRESYNC")) return "PRESYNC";
    return "";
  }, []);

  const opcoes = useMemo(() => {
    const t = normalizeTipo(tipo);
    return (Array.isArray(protocolos) ? protocolos : []).filter((p) => {
      const tp = normalizeTipo(p?.tipo);
      const fazendaOk = !p?.fazenda_id || String(p.fazenda_id) === String(fazendaAtualId);
      const ativoOk = p?.ativo !== false;
      return fazendaOk && ativoOk && tp === t;
    });
  }, [protocolos, tipo, fazendaAtualId, normalizeTipo]);

  const protSel = useMemo(() => 
    opcoes.find((p) => getProtoId(p) === protId) || null,
  [opcoes, protId]);

  // Validação em tempo real
  useEffect(() => {
    if (!touched.data) return;
    if (dataInicio && !isValidBRDate(dataInicio)) {
      setErro("Data inválida. Use formato dd/mm/aaaa");
    } else if (touched.hora && !isValidHour(horaInicio)) {
      setErro("Hora inválida. Use formato HH:mm");
    } else {
      setErro("");
    }
  }, [dataInicio, horaInicio, touched]);

  const etapasResumo = useMemo(() => {
    const ets = Array.isArray(protSel?.etapas) ? protSel.etapas : [];
    return ets.map((et, i) => {
      const offset = Number.isFinite(+et?.dia) ? +et.dia : i === 0 ? 0 : i;
      const descricao = et?.descricao || et?.acao || "";
      const hormonioTexto = et?.hormonio ? `${et.hormonio}${et?.dose ? ` (${et.dose})` : ""}` : "";
      const detalhe = hormonioTexto || et?.acao || (descricao && descricao !== `Etapa ${i + 1}` ? descricao : "");
      const dataPrevista = addDaysBR(dataInicio, offset);
      return {
        idx: i + 1,
        offset,
        dataPrevista,
        detalhe,
      };
    }).filter((et) => et.dataPrevista || et.detalhe || Number.isFinite(et.offset));
  }, [protSel, dataInicio]);

  const protocoloOptions = useMemo(() => 
    opcoes.map((p) => ({ value: getProtoId(p), label: p.nome, data: p })),
  [opcoes]);

  const selectedTipoOption = useMemo(() => 
    tipoOptions.find((o) => o.value === tipo) || tipoOptions[0],
  [tipo]);

  const handleSubmit = async () => {
    setTouched({ data: true, hora: true, protocolo: true });
    
    if (!fazendaAtualId) return setErro("Fazenda não identificada. Tente novamente.");
    if (!protId) return setErro("Escolha um protocolo.");
    if (!isValidBRDate(dataInicio)) return setErro("Data de início inválida.");
    if (!isValidHour(horaInicio)) return setErro("Hora inválida.");

    if (bulkMode) {
      setErro("");
      onSubmit?.({
        kind: "PROTOCOLO",
        protocolo_id: protId,
        data: dataInicio,
        horaInicio,
        tipo,
      });
      return;
    }

    if (!getAnimalId(animal)) return setErro("Animal inválido (sem identificador).");

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;

      const user = authData?.user;
      const userId = user?.id;
      if (!userId) throw new Error("Sessão inválida. Faça login novamente.");

      const animalId = String(getAnimalId(animal));
      const dataISO = brToISO(dataInicio);
      const horaInicioTime = `${horaInicio}:00`;

      const { data: aplicacaoAtiva, error: aplicacaoAtivaError } = await supabase
        .from("repro_aplicacoes")
        .select("id, protocolo_id, data_inicio, status")
        .eq("fazenda_id", fazendaAtualId)
        .eq("animal_id", animalId)
        .eq("status", "ATIVO")
        .maybeSingle();

      if (aplicacaoAtivaError) throw aplicacaoAtivaError;
      if (aplicacaoAtiva) {
        setErro(DUPLICIDADE_ATIVO_MSG);
        return;
      }

      const { data: row, error } = await supabase
        .from("repro_aplicacoes")
        .insert({
          user_id: userId,
          fazenda_id: fazendaAtualId,
          animal_id: animalId,
          protocolo_id: protId,
          data_inicio: dataISO,
          status: "ATIVO",
          tipo,
          hora_inicio: horaInicioTime,
        })
        .select("*")
        .single();

      if (error) {
        console.error("Erro Supabase ao aplicar protocolo:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }

      setErro("");
      onSubmit?.({ kind: "PROTOCOLO_APLICADO", aplicacao: row });
      toast.success("Protocolo aplicado");
    } catch (e) {
      console.error("Falha ao aplicar protocolo:", {
        code: e?.code,
        message: e?.message,
        details: e?.details,
        hint: e?.hint,
      });
      if (e?.code === "23505") {
        setErro(DUPLICIDADE_ATIVO_MSG);
        return;
      }
      setErro(`Não foi possível aplicar o protocolo. ${e?.message || "Tente novamente."}`);
    }
  };

  return (
    <form
      id="form-PROTOCOLO"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      style={{ display: "flex", flexDirection: "column", gap: "24px" }}
    >
      
      {/* SEÇÃO: CONFIGURAÇÃO BÁSICA */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "20px",
        padding: "24px", background: "#fff", borderRadius: theme.radius.xl,
        border: `1px solid ${theme.colors.slate[200]}`, boxShadow: theme.shadows.sm,
      }}>
        <div style={{ gridColumn: "span 6" }}>
          <InputGroup label="Tipo de Protocolo" icon={() => <span>🏷️</span>}>
            <Select
              styles={selectStyles}
              options={tipoOptions}
              value={selectedTipoOption}
              onChange={(opt) => setTipo(opt?.value || "IATF")}
              isClearable={false}
              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              formatOptionLabel={(opt) => (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ 
                    width: "8px", height: "8px", borderRadius: "50%", 
                    background: opt.color 
                  }} />
                  {opt.label}
                </div>
              )}
            />
          </InputGroup>
        </div>

        <div style={{ gridColumn: "span 6" }}>
          <InputGroup 
            label="Protocolo" 
            error={touched.protocolo && !protId ? "Selecione um protocolo" : null}
            icon={() => <span>📋</span>}
          >
            <Select
              styles={selectStyles}
              options={protocoloOptions}
              value={protocoloOptions.find(o => o.value === protId) || null}
              onChange={(opt) => setProtId(opt?.value || "")}
              placeholder={opcoes.length ? "Busque e selecione o protocolo..." : "Nenhum protocolo disponível"}
              isClearable
              isSearchable
              isDisabled={!opcoes.length}
              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              noOptionsMessage={() => "Nenhum protocolo encontrado"}
            />
          </InputGroup>
        </div>

        <div style={{ gridColumn: "span 7" }}>
          <InputGroup 
            label="Data de Início" 
            icon={Icons.calendar}
            error={touched.data && dataInicio && !isValidBRDate(dataInicio) ? "Formato inválido" : null}
          >
            <TextInput
              value={dataInicio}
              onChange={(e) => setDataInicio(maskDateBackfill(e.target.value))}
              placeholder="dd/mm/aaaa"
              hasError={touched.data && !isValidBRDate(dataInicio)}
              actionIcon={Icons.calendar}
              onActionClick={() => hiddenDateRef.current?.showPicker?.()}
            />
            <input
              ref={hiddenDateRef}
              type="date"
              value={brToISO(dataInicio) || ""}
              onChange={(e) => setDataInicio(isoToBR(e.target.value))}
              style={{ position: "absolute", pointerEvents: "none", opacity: 0, width: 0, height: 0 }}
              tabIndex={-1}
            />
          </InputGroup>
        </div>

        <div style={{ gridColumn: "span 5" }}>
          <InputGroup 
            label="Horário Padrão" 
            icon={Icons.clock}
            error={touched.hora && horaInicio && !isValidHour(horaInicio) ? "Formato HH:mm" : null}
          >
            <TextInput
              value={horaInicio}
              onChange={(e) => setHoraInicio(maskHourBackfill(e.target.value))}
              placeholder="HH:mm"
              hasError={touched.hora && !isValidHour(horaInicio)}
              actionIcon={Icons.clock}
              onActionClick={() => hiddenTimeRef.current?.showPicker?.()}
            />
            <input
              ref={hiddenTimeRef}
              type="time"
              value={isValidHour(horaInicio) ? horaInicio : ""}
              onChange={(e) => setHoraInicio(maskHourBackfill(e.target.value))}
              style={{ position: "absolute", pointerEvents: "none", opacity: 0, width: 0, height: 0 }}
              tabIndex={-1}
            />
          </InputGroup>
        </div>

        <div style={{ gridColumn: "span 12", display: "flex", alignItems: "flex-end", paddingBottom: "20px" }}>
          <Toggle 
            checked={criarAgenda} 
            onChange={(e) => setCriarAgenda(e.target.checked)}
            label="Criar agenda automática das etapas"
          />
        </div>
      </div>

      {/* SEÇÃO: TIMELINE DE ETAPAS */}
      {protSel && criarAgenda && (
        <div style={{
          padding: "24px", background: theme.colors.slate[50], 
          borderRadius: theme.radius.xl, border: `1px solid ${theme.colors.slate[200]}`,
        }}>
          <div style={{ 
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: "20px", paddingBottom: "16px", borderBottom: `1px solid ${theme.colors.slate[200]}`,
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: theme.colors.slate[800] }}>
                Cronograma Previsto
              </h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: theme.colors.slate[500] }}>
                {etapasResumo.length} etapas calculadas a partir de {dataInicio}
              </p>
            </div>
            <div style={{
              padding: "6px 12px", background: "#fff", borderRadius: theme.radius.md,
              fontSize: "12px", fontWeight: 700, color: theme.colors.primary[600],
              border: `1px solid ${theme.colors.primary[200]}`,
            }}>
              Duração: {etapasResumo[etapasResumo.length - 1]?.offset || 0} dias
            </div>
          </div>

          {etapasResumo.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "40px", color: theme.colors.slate[400],
              background: "#fff", borderRadius: theme.radius.lg, border: `1px dashed ${theme.colors.slate[300]}`,
            }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>📋</div>
              <div style={{ fontSize: "14px", fontWeight: 600 }}>Nenhuma etapa cadastrada</div>
              <div style={{ fontSize: "13px", marginTop: "4px" }}>Este protocolo não possui etapas definidas.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {etapasResumo.map((etapa, idx) => (
                <CardEtapa 
                  key={idx} 
                  etapa={etapa} 
                  isFirst={idx === 0}
                  isLast={idx === etapasResumo.length - 1}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ERRO GLOBAL */}
      {erro && (
        <div style={{
          padding: "16px", background: theme.colors.danger[50],
          border: `1px solid ${theme.colors.danger[200]}`, borderRadius: theme.radius.lg,
          display: "flex", alignItems: "center", gap: "12px", color: theme.colors.danger[600],
        }}>
          <Icons.alert />
          <span style={{ fontSize: "14px", fontWeight: 600 }}>{erro}</span>
        </div>
      )}

    </form>
  );
}
