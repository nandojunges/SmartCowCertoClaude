import { useEffect, useMemo, useRef, useState } from "react";
import Select, { components } from "react-select";
import CreatableSelect from "react-select/creatable";

/* =========================================================
   DESIGN SYSTEM
   ========================================================= */
const theme = {
  colors: {
    slate: { 50: "#f8fafc", 100: "#f1f5f9", 200: "#e2e8f0", 300: "#cbd5e1", 400: "#94a3b8", 500: "#64748b", 600: "#475569", 700: "#334155", 800: "#1e293b" },
    primary: { 50: "#eff6ff", 100: "#dbeafe", 500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8" },
    danger: { 50: "#fef2f2", 100: "#fee2e2", 500: "#ef4444", 600: "#dc2626" },
    success: { 50: "#f0fdf4", 500: "#22c55e" },
    warning: { 50: "#fffbeb", 500: "#f59e0b" },
  },
  shadows: { sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)", md: "0 4px 6px -1px rgb(0 0 0 / 0.1)", lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)" },
  radius: { sm: "6px", md: "8px", lg: "12px", xl: "16px" },
};

const Icons = {
  close: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
  plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>,
  pill: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>,
  calendar: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  clock: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  alert: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  chart: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>,
};

/* =========================================================
   HELPERS (mantidos do original)
   ========================================================= */
const todayBR = () => new Date().toLocaleDateString("pt-BR");
const pad = (n) => String(n).padStart(2, "0");
const toISODate = (dt) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
const parseBR = (str) => {
  if (!str) return null;
  const [d, m, y] = str.split("/").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return Number.isFinite(dt.getTime()) ? dt : null;
};
const addHours = (dt, h) => { const d = new Date(dt.getTime()); d.setHours(d.getHours() + h); return d; };
const duracaoTotalTexto = (reps, gapH) => {
  const r = Number(reps), gap = Number(gapH);
  if (!Number.isFinite(r) || !Number.isFinite(gap) || r <= 0 || gap <= 0) return "";
  const totalH = r * gap;
  const d = Math.floor(totalH / 24), hh = totalH % 24;
  if (d && hh) return `${d}d ${hh}h`;
  if (d) return `${d}d`;
  return `${hh}h`;
};

/* ===== normalização de produtos ===== */
const ascii = (t) => String(t ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const pickFirst = (...vals) => vals.find(v => v !== undefined && v !== null && `${v}`.trim() !== "");
const normalizeProduto = (p) => {
  const id = pickFirst(p.id, p.produto_id, p.produtoId, p.sku, p.codigo, p.uuid, p._id, null);
  const nome = pickFirst(p.nome, p.nome_comercial, p.nomeComercial, p.descricao, p.descr, p.titulo, p.label, p.nomeProduto, p.produto?.nome, p.produto?.descricao, p.item?.nome);
  const unidade = pickFirst(p.unidade, p.unidade_sigla, p.unidadeSigla, p.medida?.sigla, p.unidade?.sigla, p.produto?.unidade, p.un);
  const categoria = pickFirst(p.categoria, p.categoria_nome, p.categoriaNome, p.categoria?.nome, p.grupo, p.grupo?.nome, p.setor, p.tipo, p.classe, p.departamento, p.produto?.categoria, "");
  const tagsArr = pickFirst(p.tags, p.etiquetas, p.labels, p.rotulos, p.marcadores, []) || [];
  const saldoRaw = pickFirst(p.saldo, p.qtd, p.quantidade, p.estoque, p.qtd_disponivel, p.saldoAtual);
  const saldo = Number.isFinite(+saldoRaw) ? +saldoRaw : undefined;
  return { id, nome, unidade, categoria, saldo, tags: Array.isArray(tagsArr) ? tagsArr : [] };
};

const isFarmaciaOuRepro = (cat) => { const s = ascii(cat); return s.includes("farmac") || s.includes("reproduc") || s.includes("repro") || s.includes("vet"); };
const isSemen = (p) => { const n = ascii(p.nome), c = ascii(p.categoria), t = ascii((p.tags || []).join(" ")); return n.includes("semen") || c.includes("semen") || t.includes("semen"); };
const dedupBy = (arr, keyFn) => { const m=new Map(); for(const it of arr){ const k=keyFn(it); if(!m.has(k)) m.set(k,it);} return [...m.values()]; };
const nameFromOptionLabel = (label) => String(label).split(" (")[0].split(" • ")[0];

/* =========================================================
   SUB-COMPONENTES UI
   ========================================================= */

const InputGroup = ({ label, children, icon: Icon, help }) => (
  <div style={{ marginBottom: "4px" }}>
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "11px",
        fontWeight: 700,
        color: theme.colors.slate[500],
      }}
    >
      {Icon && (
        <span style={{ color: theme.colors.slate[400] }}>
          <Icon />
        </span>
      )}
      {label}
    </label>

    {children}

    {help && (
      <div
        style={{
          marginTop: "4px",
          fontSize: "11px",
          color: theme.colors.slate[500],
        }}
      >
        {help}
      </div>
    )}
  </div>
);

const Toggle = ({ checked, onChange, label, disabled }) => (
  <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 }}>
    <div style={{ position: "relative", width: "40px", height: "22px" }}>
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} style={{ opacity: 0, width: 0, height: 0 }} />
      <div style={{
        position: "absolute", inset: 0,
        backgroundColor: checked ? theme.colors.primary[600] : theme.colors.slate[200],
        borderRadius: "22px", transition: "0.3s",
      }}>
        <div style={{
          position: "absolute", height: "18px", width: "18px",
          left: checked ? "20px" : "2px", bottom: "2px",
          backgroundColor: "white", borderRadius: "50%", transition: "0.3s",
          boxShadow: theme.shadows.sm,
        }} />
      </div>
    </div>
    <span style={{ fontSize: "13px", fontWeight: 600, color: theme.colors.slate[700] }}>{label}</span>
  </label>
);

const CardTratamento = ({ item, index, produtos, produtoOptions, onUpdate, onRemove, isLast }) => {
  const calcBaixa = () => {
    const dose = Number(item.dose), reps = Number(item.repeticoes);
    if (!Number.isFinite(dose) || !Number.isFinite(reps)) return 0;
    return Math.max(0, dose * reps);
  };

  const duracao = duracaoTotalTexto(item.repeticoes, item.intervaloHoras);
  const baixa = calcBaixa();
  
  const selectedProd = item.produtoId?.startsWith("custom:") || item.produtoId?.startsWith("name:")
    ? { value: item.produtoId, label: item.produtoNome || nameFromOptionLabel(item._optLabel || "") || item.produtoId.slice(item.produtoId.indexOf(":")+1) }
    : produtoOptions.find(o => o.value === item.produtoId) || null;

  return (
    <div style={{
      background: "#fff", borderRadius: theme.radius.xl,
      border: `1px solid ${theme.colors.slate[200]}`,
      boxShadow: theme.shadows.sm,
      overflow: "hidden",
      marginBottom: isLast ? 0 : "16px",
    }}>
      {/* HEADER DO CARD */}
      <div style={{
        background: theme.colors.slate[50], padding: "12px 16px",
        borderBottom: `1px solid ${theme.colors.slate[200]}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "50%",
            background: theme.colors.primary[100], color: theme.colors.primary[600],
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "14px", fontWeight: 800,
          }}>
            {index + 1}
          </div>
          <span style={{ fontSize: "14px", fontWeight: 700, color: theme.colors.slate[700] }}>
            Tratamento #{index + 1}
          </span>
          {duracao && (
            <span style={{
              fontSize: "11px", padding: "2px 8px", borderRadius: theme.radius.full,
              background: theme.colors.warning[50], color: theme.colors.warning[600],
              fontWeight: 700,
            }}>
              Duração: {duracao}
            </span>
          )}
        </div>
        <button
          onClick={onRemove}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "6px 12px", fontSize: "12px", fontWeight: 600,
            color: theme.colors.danger[600], background: theme.colors.danger[50],
            border: `1px solid ${theme.colors.danger[200]}`, borderRadius: theme.radius.md,
            cursor: "pointer", transition: "all 0.2s",
          }}
        >
          <Icons.trash /> Remover
        </button>
      </div>

      {/* CONTEÚDO DO CARD */}
      <div style={{ padding: "20px" }}>
        {/* LINHA 1: Produto */}
        <div style={{ marginBottom: "16px" }}>
          <InputGroup label="Produto/Medicamento" icon={Icons.pill} help="Selecione do estoque ou digite um nome personalizado">
            <CreatableSelect
              styles={{
                control: (base, s) => ({ ...base, minHeight: 44, borderRadius: theme.radius.md, borderColor: s.isFocused ? theme.colors.primary[500] : theme.colors.slate[200], boxShadow: s.isFocused ? `0 0 0 3px ${theme.colors.primary[100]}` : "none" }),
                valueContainer: (b) => ({ ...b, padding: "0 12px" }),
                menuPortal: (b) => ({ ...b, zIndex: 9999 }),
              }}
              options={produtoOptions}
              value={selectedProd}
              onChange={(opt) => {
                if (!opt) { onUpdate({ produtoId:"", produtoNome:"", _optLabel:"" }); return; }
                const val = String(opt.value);
                if (val.startsWith("name:")) {
                  onUpdate({ produtoId: val, produtoNome: nameFromOptionLabel(opt.label), _optLabel: opt.label });
                  return;
                }
                const p = produtos.find(x => (x.id ?? `name:${x.nome}`) === val);
                onUpdate({ produtoId: val, produtoNome:"", _optLabel: opt.label, unidade: p?.unidade || item.unidade });
              }}
              onCreateOption={(input) => { const id=`custom:${input}`; onUpdate({produtoId:id, produtoNome:input, _optLabel:input}); }}
              placeholder="Buscar produto no estoque ou digitar nome..."
              formatCreateLabel={(input) => `✏️ Usar "${input}" (personalizado)`}
              noOptionsMessage={() => "Digite para criar novo ou aguarde carregar estoque..."}
              menuPortalTarget={document.body}
              isSearchable
            />
          </InputGroup>
        </div>

        {/* LINHA 2: Dosagem e Via */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
          <InputGroup label="Quantidade" icon={() => <span>💊</span>}>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="number"
                step="0.1"
                value={item.dose}
                onChange={(e) => onUpdate({dose: e.target.value.replace(",",".")})}
                placeholder="Ex: 20"
                style={{ flex: 1, padding: "10px", borderRadius: theme.radius.md, border: `1px solid ${theme.colors.slate[200]}`, fontSize: "14px" }}
              />
              <Select
                styles={{ control: (b,s) => ({ ...b, minHeight: 40, borderRadius: theme.radius.md, borderColor: s.isFocused ? theme.colors.primary[500] : theme.colors.slate[200] }), menuPortal: (b) => ({ ...b, zIndex: 9999 }) }}
                options={[
                  { value: "mL", label: "mL" }, { value: "g", label: "g" }, { value: "UI", label: "UI" },
                  { value: "mg/kg", label: "mg/kg" }, { value: "mL/quarter", label: "mL/quarter" },
                ]}
                value={item.unidade ? { value: item.unidade, label: item.unidade } : null}
                onChange={(opt) => onUpdate({ unidade: opt?.value || "" })}
                placeholder="Unid."
                menuPortalTarget={document.body}
              />
            </div>
          </InputGroup>

          <InputGroup label="Via" icon={() => <span>💉</span>}>
            <Select
              styles={{ control: (b,s) => ({ ...b, minHeight: 40, borderRadius: theme.radius.md, borderColor: s.isFocused ? theme.colors.primary[500] : theme.colors.slate[200] }), menuPortal: (b) => ({ ...b, zIndex: 9999 }) }}
              options={["IM","IV","SC","PO","Intramamário","Intrauterino"].map(v => ({ value: v, label: v }))}
              value={item.via ? { value: item.via, label: item.via } : null}
              onChange={(opt) => onUpdate({ via: opt?.value || "" })}
              placeholder="Via..."
              isClearable
              menuPortalTarget={document.body}
            />
          </InputGroup>

          <InputGroup label="Total a Baixar" icon={() => <span>📦</span>} help="Calculado automaticamente">
            <div style={{
              padding: "10px", borderRadius: theme.radius.md, background: theme.colors.slate[50],
              border: `1px solid ${theme.colors.slate[200]}`, textAlign: "center",
              fontWeight: 800, color: theme.colors.slate[700], fontSize: "14px",
            }}>
              {baixa} {item.unidade || "un"}
            </div>
          </InputGroup>
        </div>

        {/* LINHA 3: Esquema (Repetições e Intervalo) */}
        <div style={{ 
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px", 
          padding: "16px", background: theme.colors.primary[50], borderRadius: theme.radius.lg,
          marginBottom: "16px",
        }}>
          <InputGroup label="Repetições" icon={() => <span>🔁</span>} help="Quantas aplicações">
            <input
              type="number"
              min="1"
              value={item.repeticoes}
              onChange={(e) => onUpdate({repeticoes: e.target.value})}
              placeholder="Ex: 3"
              style={{ width: "100%", padding: "10px", borderRadius: theme.radius.md, border: `1px solid ${theme.colors.primary[200]}`, background: "#fff", fontSize: "14px" }}
            />
          </InputGroup>

          <InputGroup label="Intervalo" icon={Icons.clock} help="Horas entre cada dose">
            <input
              type="number"
              min="1"
              value={item.intervaloHoras}
              onChange={(e) => onUpdate({intervaloHoras: e.target.value})}
              placeholder="Ex: 24"
              style={{ width: "100%", padding: "10px", borderRadius: theme.radius.md, border: `1px solid ${theme.colors.primary[200]}`, background: "#fff", fontSize: "14px" }}
            />
          </InputGroup>

          <InputGroup label="Data Início" icon={Icons.calendar}>
            <input
              value={item.inicioData}
              onChange={(e) => onUpdate({inicioData: e.target.value})}
              placeholder="dd/mm/aaaa"
              style={{ width: "100%", padding: "10px", borderRadius: theme.radius.md, border: `1px solid ${theme.colors.primary[200]}`, background: "#fff", fontSize: "14px", fontFamily: "monospace" }}
            />
          </InputGroup>

          <InputGroup label="Hora" icon={Icons.clock}>
            <input
              value={item.inicioHora}
              onChange={(e) => onUpdate({inicioHora: e.target.value})}
              placeholder="hh:mm"
              style={{ width: "100%", padding: "10px", borderRadius: theme.radius.md, border: `1px solid ${theme.colors.primary[200]}`, background: "#fff", fontSize: "14px", fontFamily: "monospace" }}
            />
          </InputGroup>
        </div>

        {/* LINHA 4: Observação específica */}
        <InputGroup label="Observações do Tratamento" icon={() => <span>📝</span>}>
          <input
            value={item.obs}
            onChange={(e) => onUpdate({obs: e.target.value})}
            placeholder="Detalhes específicos: temperatura de armazenamento, cuidados especiais, etc."
            style={{ width: "100%", padding: "10px", borderRadius: theme.radius.md, border: `1px solid ${theme.colors.slate[200]}`, fontSize: "14px" }}
          />
        </InputGroup>
      </div>
    </div>
  );
};

/* =========================================================
   COMPONENTE PRINCIPAL
   ========================================================= */

const OCORRENCIAS = [
  "Metrite","Endometrite","Retenção de placenta","Mastite clínica","Mastite subclínica",
  "Cetose","Hipocalcemia (paresia pós-parto)","Deslocamento de abomaso","Acidose/Indigestão",
  "Pneumonia","Diarreia","Pododermatite/Lamíte","Anestro","Cisto folicular","Outro",
];

export default function OcorrenciaClinica({ animal, onSubmit }) {
  const [oc, setOc] = useState("Metrite");
  const [obs, setObs] = useState("");
  const [produtos, setProdutos] = useState([]);
  const fetchedOnce = useRef(false);
  const [showTrat, setShowTrat] = useState(false);
  const [items, setItems] = useState([]);
  const [agendar, setAgendar] = useState(true);
  const [baixarEstoque, setBaixarEstoque] = useState(true);

  // Fetch produtos (mantido igual)
  useEffect(() => {
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;
    (async () => {
      try {
        const qsFarmRepro = new URLSearchParams({ categorias: "Farmácia,Reprodução", limit: "1000" }).toString();
        const tries = [
          `/api/v1/consumo/estoque?${qsFarmRepro}`,
          "/api/v1/estoque/produtos?categoria=vet&limit=1000",
          "/api/v1/estoque/produtos?limit=1000",
          "/api/estoque/produtos?categoria=vet&limit=1000",
          "/api/estoque/produtos?limit=1000",
        ];
        let results = [];
        for (const url of tries) {
          try {
            const r = await fetch(url, { headers: { Accept: "application/json" } });
            if (!r.ok) continue;
            const j = await r.json();
            const arr = Array.isArray(j?.items) ? j.items : (Array.isArray(j) ? j : []);
            if (arr.length) { results = arr; break; }
          } catch (e) { /* ignore */ }
        }
        const normalizados = results.map(normalizeProduto).filter(p => p.nome);
        const anyFarmRepro = normalizados.some(p => { const s = ascii(p.categoria); return s.includes("farmac") || s.includes("reproduc") || s.includes("repro"); });
        let filtrados = anyFarmRepro ? normalizados.filter(p => isFarmaciaOuRepro(p.categoria)) : normalizados;
        filtrados = filtrados.filter(p => !isSemen(p));
        setProdutos(dedupBy(filtrados, (p) => `${p.id ?? "noid"}::${p.nome}`));
      } catch (e) {
        setProdutos([]);
      }
    })();
  }, []);

  const produtoOptions = useMemo(() => {
    if (!Array.isArray(produtos) || produtos.length === 0) return [];
    return produtos.map((p) => {
      const nome = p.nome || "(sem nome)";
      const un = p.unidade ? ` (${p.unidade})` : "";
      const saldo = Number.isFinite(p.saldo) ? ` • estoque: ${p.saldo}` : "";
      const value = p.id ?? `name:${nome}`;
      return { value, label: `${nome}${un}${saldo}`, raw: p };
    });
  }, [produtos]);

  const novaLinha = () => ({
    id: crypto.randomUUID(),
    produtoId: "", produtoNome: "", _optLabel: "",
    dose: "", unidade: "", via: "",
    inicioData: todayBR(), inicioHora: "08:00",
    intervaloHoras: "", repeticoes: "",
    obs: "",
  });

  const add = () => { if (!showTrat) setShowTrat(true); setItems(prev => [...prev, novaLinha()]); };
  const upd = (id, patch) => setItems(prev => prev.map(it => (it.id === id ? { ...it, ...patch } : it)));
  const del = (id) => setItems(prev => prev.filter(it => it.id !== id));

  const makeAgendaLabel = (it) => {
    const nome = it.produtoId?.startsWith("custom:") || it.produtoId?.startsWith("name:")
      ? it.produtoNome || nameFromOptionLabel(it._optLabel || "") || it.produtoId.slice(it.produtoId.indexOf(":")+1)
      : produtos.find(p => (p.id ?? `name:${p.nome}`) === it.produtoId)?.nome || it.produtoNome || "";
    const qtd = [it.dose, it.unidade].filter(Boolean).join(" ");
    const viaTxt = it.via ? ` via ${it.via}` : "";
    return `Aplicar ${qtd} de ${nome}${viaTxt}`;
  };

  const gerarAgendaDoItem = (it) => {
    const baseDate = parseBR(it.inicioData) ?? new Date();
    const [hh = 8, mm = 0] = String(it.inicioHora || "08:00").split(":").map(n => +n);
    baseDate.setHours(hh, mm, 0, 0);
    const reps = Math.max(1, Number(it.repeticoes) || 1);
    const gap = Math.max(1, Number(it.intervaloHoras) || 24);
    const eventos = [];
    for (let i = 0; i < reps; i++) {
      const d = addHours(baseDate, i * gap);
      const whenISO = `${toISODate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
      eventos.push({ whenISO, title: makeAgendaLabel(it), notes: it.obs || "" });
    }
    return { eventos, iso_list: eventos.map(e => e.whenISO) };
  };

  const salvar = () => {
    if (!oc) return alert("Escolha a ocorrência.");
    if (showTrat && !items.length) return alert("Adicione ao menos 1 tratamento ou oculte a seção.");
    for (const it of items) {
      if (!it.produtoId) return alert(`Tratamento #${items.indexOf(it) + 1}: Selecione o produto.`);
      if (!it.dose) return alert(`Tratamento #${items.indexOf(it) + 1}: Informe a quantidade.`);
      if (!it.unidade) return alert(`Tratamento #${items.indexOf(it) + 1}: Selecione a unidade.`);
      if (!it.repeticoes || !it.intervaloHoras) return alert(`Tratamento #${items.indexOf(it) + 1}: Preencha Nº de aplicações e Intervalo.`);
    }

    const tratamentos = items.map((it) => {
      const { eventos, iso_list } = gerarAgendaDoItem(it);
      const isIdless = String(it.produtoId).startsWith("custom:") || String(it.produtoId).startsWith("name:");
      const resolvedNome = it.produtoNome || nameFromOptionLabel(it._optLabel || "") || produtos.find(p => (p.id ?? `name:${p.nome}`) === it.produtoId)?.nome || "";
      return {
        produto_id: isIdless ? null : it.produtoId,
        produto_nome: isIdless ? resolvedNome : undefined,
        dose: Number(it.dose),
        unidade: it.unidade || "",
        via: it.via || "",
        repeticoes: Number(it.repeticoes),
        intervalo_horas: Number(it.intervaloHoras),
        inicio_iso: iso_list[0]?.slice(0,10) || toISODate(parseBR(it.inicioData) ?? new Date()),
        agenda_execucoes: showTrat && agendar ? iso_list : [],
        agenda_eventos: showTrat && agendar ? eventos : [],
        obs: it.obs || "",
        baixa_total: showTrat && baixarEstoque ? (Number(it.dose) * Number(it.repeticoes)) : 0,
      };
    });

    onSubmit?.({
      kind: "CLINICA",
      clin: oc,
      obs,
      tratamentos,
      criarAgenda: !!(showTrat && agendar),
      baixarEstoque: !!(showTrat && baixarEstoque),
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* SEÇÃO 1: OCORRÊNCIA */}
      <div style={{
        padding: "24px", background: "#fff", borderRadius: theme.radius.xl,
        border: `1px solid ${theme.colors.slate[200]}`, boxShadow: theme.shadows.sm,
      }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: "12px", fontWeight: 800, color: theme.colors.slate[600], textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: "8px" }}>
          <Icons.alert /> Dados da Ocorrência
        </h3>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px" }}>
          <InputGroup label="Tipo de Ocorrência" icon={() => <span>🏥</span>}>
            <Select
              styles={{
                control: (b,s) => ({ ...b, minHeight: 44, borderRadius: theme.radius.md, borderColor: s.isFocused ? theme.colors.primary[500] : theme.colors.slate[200], boxShadow: s.isFocused ? `0 0 0 3px ${theme.colors.primary[100]}` : "none" }),
                menuPortal: (b) => ({ ...b, zIndex: 9999 }),
              }}
              options={OCORRENCIAS.map(o => ({ value: o, label: o }))}
              value={{ value: oc, label: oc }}
              onChange={(opt) => setOc(opt?.value || "Metrite")}
              menuPortalTarget={document.body}
            />
          </InputGroup>

          <InputGroup label="Observações Gerais" icon={() => <span>📝</span>} help="Sintomas, histórico, condições do animal">
            <input
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Descreva os sintomas observados, histórico clínico recente..."
              style={{ width: "100%", padding: "12px", borderRadius: theme.radius.md, border: `1px solid ${theme.colors.slate[200]}`, fontSize: "14px" }}
            />
          </InputGroup>
        </div>
      </div>

      {/* SEÇÃO 2: TRATAMENTOS */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "12px", fontWeight: 800, color: theme.colors.slate[600], textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: "8px" }}>
            <Icons.pill /> Protocolo de Tratamento
          </h3>
          <div style={{ display: "flex", gap: "8px" }}>
            {showTrat && items.length > 0 && (
              <button
                onClick={() => setShowTrat(false)}
                style={{ padding: "8px 16px", fontSize: "13px", fontWeight: 600, color: theme.colors.slate[600], background: "transparent", border: `1px solid ${theme.colors.slate[200]}`, borderRadius: theme.radius.md, cursor: "pointer" }}
              >
                Ocultar Tratamentos
              </button>
            )}
            <button
              onClick={add}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 20px", fontSize: "13px", fontWeight: 700, color: "#fff", background: theme.colors.primary[600], border: "none", borderRadius: theme.radius.md, cursor: "pointer", boxShadow: `0 4px 12px ${theme.colors.primary[600]}40` }}
            >
              <Icons.plus /> Adicionar Medicamento
            </button>
          </div>
        </div>

        {showTrat && items.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {items.map((item, idx) => (
              <CardTratamento
                key={item.id}
                item={item}
                index={idx}
                produtos={produtos}
                produtoOptions={produtoOptions}
                onUpdate={(patch) => upd(item.id, patch)}
                onRemove={() => del(item.id)}
                isLast={idx === items.length - 1}
              />
            ))}
          </div>
        )}

        {showTrat && items.length === 0 && (
          <div style={{ padding: "40px", textAlign: "center", background: theme.colors.slate[50], borderRadius: theme.radius.xl, border: `2px dashed ${theme.colors.slate[200]}`, color: theme.colors.slate[400] }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>💊</div>
            <div style={{ fontSize: "14px", fontWeight: 600 }}>Nenhum tratamento adicionado</div>
            <div style={{ fontSize: "13px", marginTop: "4px" }}>Clique em "Adicionar Medicamento" para iniciar o protocolo terapêutico</div>
          </div>
        )}
      </div>

      {/* SEÇÃO 3: FLAGS E AÇÃO */}
      {showTrat && items.length > 0 && (
        <div style={{
          padding: "20px 24px", background: theme.colors.slate[50], borderRadius: theme.radius.xl,
          border: `1px solid ${theme.colors.slate[200]}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px",
        }}>
          <div style={{ display: "flex", gap: "24px" }}>
            <Toggle checked={agendar} onChange={(e) => setAgendar(e.target.checked)} label="Criar tarefas no calendário" />
            <Toggle checked={baixarEstoque} onChange={(e) => setBaixarEstoque(e.target.checked)} label="Baixar do estoque automaticamente" />
          </div>
        </div>
      )}

      {/* BOTÃO SALVAR */}
      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "8px" }}>
        <button
          onClick={salvar}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "14px 32px", fontSize: "15px", fontWeight: 700, color: "#fff", background: theme.colors.primary[600], border: "none", borderRadius: theme.radius.lg, cursor: "pointer", boxShadow: `0 4px 12px ${theme.colors.primary[600]}40` }}
        >
          <Icons.check />
          Registrar Ocorrência Clínica
        </button>
      </div>
    </div>
  );
}