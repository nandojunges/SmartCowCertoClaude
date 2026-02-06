// src/pages/ConsumoReposicao/CalendarioSanitario.jsx
import React, { useMemo, useState, useEffect, useCallback } from "react";

/** =====================================================================
 * CALENDÁRIO SANITÁRIO — LAYOUT MODERNO + FUNCIONALIDADE COMPLETA
 * - CRUD em memória (preparado para Supabase)
 * - Status automático: Vencido, Próximo (7 dias), Em dia
 * - Controle de exames sanitários com cálculo de validade
 * ===================================================================== */

const CATEGORIAS = ["Bezerra", "Novilha", "Vaca em lactação", "Vaca seca", "Todo plantel"];
const TIPOS = ["Vacina", "Vermífugo", "Vitamina", "Antiparasitário", "Preventivo"];
const VIAS = ["Subcutânea", "Oral", "Intramuscular"];

export default function CalendarioSanitario() {
  // Estado mock inicial
  const [manejos, setManejos] = useState(() => [
    {
      id: "m1",
      categoria: "Bezerra",
      tipo: "Vacina",
      produto: "Clostridioses",
      frequencia: "180",
      idade: "60 dias",
      via: "Subcutânea",
      dose: 2,
      dataInicial: isoDate(new Date()),
      proximaAplicacao: "",
      ultimaAplicacao: "",
      observacoes: "",
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [filtros, setFiltros] = useState({ status: "__ALL__", categoria: "__ALL__" });

  // Modais
  const [modalCadastro, setModalCadastro] = useState({ open: false, index: null });
  const [modalRegistro, setModalRegistro] = useState({ open: false, index: null });
  const [modalExames, setModalExames] = useState(false);
  const [modalExcluir, setModalExcluir] = useState({ open: false, index: null });

  useEffect(() => {
    setErro("");
    setLoading(false);
  }, []);

  const toggleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      if (prev.direction === "desc") return { key: null, direction: null };
      return { key, direction: "asc" };
    });
  };

  const statusFromManejo = useCallback((m) => {
    const raw = m?.proximaAplicacao || m?.dataInicial;
    if (!raw) return { label: "Sem data", color: "#9ca3af", bg: "#f3f4f6", key: "Sem data" };
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dt = new Date(raw);
    dt.setHours(0, 0, 0, 0);
    const dias = Math.ceil((dt - hoje) / 86400000);

    if (dias < 0) return { label: "Vencido", color: "#dc2626", bg: "#fee2e2", key: "Vencido" };
    if (dias <= 7) return { label: "Próximo", color: "#d97706", bg: "#fef3c7", key: "Próximo" };
    return { label: "Em dia", color: "#059669", bg: "#d1fae5", key: "Em dia" };
  }, []);

  // CRUD
  const salvarManejo = (registro) => {
    const id = registro?.id || cryptoId();
    setManejos((prev) => {
      const arr = [...prev];
      const idx = arr.findIndex((m) => m.id === id);
      const payload = { ...registro, id };
      if (idx >= 0) arr[idx] = payload;
      else arr.push(payload);
      return arr.sort((a, b) => new Date(a.proximaAplicacao || 0) - new Date(b.proximaAplicacao || 0));
    });
    setModalCadastro({ open: false, index: null });
  };

  const salvarRegistro = (dataAplicacao, observacoes) => {
    const idx = modalRegistro.index;
    const cur = manejos[idx];
    if (!cur) return;

    let proximaAplicacao = "";
    const dias = parseInt(cur.frequencia, 10);
    if (Number.isFinite(dias) && dataAplicacao) {
      const d = new Date(dataAplicacao);
      d.setDate(d.getDate() + dias);
      proximaAplicacao = isoDate(d);
    }

    setManejos((prev) => {
      const arr = [...prev];
      arr[idx] = { ...arr[idx], ultimaAplicacao: dataAplicacao, proximaAplicacao, observacoes };
      return arr;
    });
    setModalRegistro({ open: false, index: null });
  };

  const confirmarExclusao = () => {
    setManejos((prev) => prev.filter((_, i) => i !== modalExcluir.index));
    setModalExcluir({ open: false, index: null });
  };

  // Filtros e ordenação
  const manejosExibidos = useMemo(() => {
    let lista = [...manejos];

    if (filtros.status !== "__ALL__") {
      lista = lista.filter((m) => statusFromManejo(m).key === filtros.status);
    }
    if (filtros.categoria !== "__ALL__") {
      lista = lista.filter((m) => m.categoria === filtros.categoria);
    }

    if (sortConfig.key) {
      const dir = sortConfig.direction === "desc" ? -1 : 1;
      lista.sort((a, b) => {
        if (sortConfig.key === "produto")
          return String(a.produto || "").localeCompare(String(b.produto || "")) * dir;
        if (sortConfig.key === "data")
          return (new Date(a.proximaAplicacao || a.dataInicial || 0) - new Date(b.proximaAplicacao || b.dataInicial || 0)) * dir;
        return 0;
      });
    }
    return lista;
  }, [manejos, filtros, sortConfig, statusFromManejo]);

  const resumo = useMemo(() => {
    const total = manejosExibidos.length;
    const vencidos = manejosExibidos.filter((m) => statusFromManejo(m).key === "Vencido").length;
    const proximos = manejosExibidos.filter((m) => statusFromManejo(m).key === "Próximo").length;
    const semData = manejosExibidos.filter((m) => statusFromManejo(m).key === "Sem data").length;
    return { total, vencidos, proximos, semData };
  }, [manejosExibidos, statusFromManejo]);

  // Estilos
  const styles = {
    page: { width: "100%", minHeight: "100vh", backgroundColor: "#f8fafc", padding: "24px" },
    container: { maxWidth: "1400px", margin: "0 auto" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" },
    titleGroup: { display: "flex", flexDirection: "column", gap: "4px" },
    title: { fontSize: "24px", fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.025em" },
    subtitle: { fontSize: "14px", color: "#64748b", margin: 0 },
    headerActions: { display: "flex", gap: "12px" },
    primaryButton: {
      padding: "10px 20px", backgroundColor: "#3b82f6", color: "#fff", border: "none",
      borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer",
      boxShadow: "0 1px 3px rgba(59,130,246,0.3)", display: "flex", alignItems: "center", gap: "8px",
    },
    secondaryButton: {
      padding: "10px 20px", backgroundColor: "#fff", color: "#374151", border: "1px solid #e5e7eb",
      borderRadius: "10px", fontSize: "14px", fontWeight: 500, cursor: "pointer",
    },
    alert: {
      padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px",
      backgroundColor: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca",
    },
    filtersBar: {
      display: "flex", gap: "16px", marginBottom: "24px", padding: "20px",
      backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", alignItems: "center",
    },
    filterGroup: { display: "flex", flexDirection: "column", gap: "6px" },
    filterLabel: { fontSize: "12px", fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" },
    select: { padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", backgroundColor: "#fff", minWidth: "180px" },
    tableContainer: {
      backgroundColor: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden", position: "relative",
    },
    table: { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
    thead: { backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" },
    th: { padding: "16px 20px", textAlign: "left", fontSize: "12px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" },
    thSortable: { cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" },
    td: { padding: "16px 20px", color: "#334155", borderBottom: "1px solid #f1f5f9", verticalAlign: "middle" },
    tr: { transition: "background-color 0.15s" },
    trHover: { backgroundColor: "#f8fafc" },
    tdCenter: { textAlign: "center" },
    statusBadge: { padding: "6px 12px", borderRadius: "9999px", fontSize: "12px", fontWeight: 700, display: "inline-block" },
    categoriaBadge: { padding: "6px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, backgroundColor: "#eff6ff", color: "#1e40af" },
    tipoBadge: { padding: "6px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, backgroundColor: "#f3e8ff", color: "#7c3aed" },
    doseBadge: { fontFamily: "monospace", fontSize: "14px", fontWeight: 600, color: "#0f172a", backgroundColor: "#f1f5f9", padding: "4px 8px", borderRadius: "6px" },
    actionButtons: { display: "flex", gap: "8px", justifyContent: "center" },
    iconButton: { padding: "8px", backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", cursor: "pointer", fontSize: "14px", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center" },
    iconButtonDanger: { color: "#ef4444" },
    footer: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", backgroundColor: "#f8fafc", borderTop: "1px solid #e2e8f0" },
    footerStats: { display: "flex", gap: "24px", fontSize: "14px" },
    statItem: { display: "flex", alignItems: "center", gap: "6px" },
    statValue: { fontWeight: 700 },
    emptyState: { padding: "48px", textAlign: "center", color: "#64748b" },
  };

  return (
    <section style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.titleGroup}>
            <h1 style={styles.title}>Calendário Sanitário</h1>
            <p style={styles.subtitle}>Controle de vacinas, vermífugos e exames obrigatórios</p>
          </div>
          <div style={styles.headerActions}>
            <button style={styles.secondaryButton} onClick={() => setModalExames(true)}>
              📋 Exames
            </button>
            <button style={styles.primaryButton} onClick={() => setModalCadastro({ open: true, index: null })}>
              <span>+</span>
              <span>Novo Manejo</span>
            </button>
          </div>
        </div>

        {erro && <div style={styles.alert}><strong>Erro:</strong> {erro}</div>}

        {/* Filtros */}
        <div style={styles.filtersBar}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Status</label>
            <select style={styles.select} value={filtros.status} onChange={(e) => setFiltros(prev => ({ ...prev, status: e.target.value }))}>
              <option value="__ALL__">Todos os status</option>
              <option value="Em dia">Em dia</option>
              <option value="Próximo">Próximo (7 dias)</option>
              <option value="Vencido">Vencido</option>
              <option value="Sem data">Sem data</option>
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Categoria</label>
            <select style={styles.select} value={filtros.categoria} onChange={(e) => setFiltros(prev => ({ ...prev, categoria: e.target.value }))}>
              <option value="__ALL__">Todas categorias</option>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Tabela */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr>
                <th style={styles.th}>Categoria</th>
                <th style={styles.th}>Tipo</th>
                <th style={styles.th}>
                  <div style={styles.thSortable} onClick={() => toggleSort("produto")}>
                    <span>Produto</span>
                    {sortConfig.key === "produto" && <span>{sortConfig.direction === "asc" ? "↑" : "↓"}</span>}
                  </div>
                </th>
                <th style={{...styles.th, textAlign: "center"}}>Frequência</th>
                <th style={styles.th}>Idade</th>
                <th style={styles.th}>Via</th>
                <th style={{...styles.th, textAlign: "center"}}>Dose</th>
                <th style={{...styles.th, textAlign: "center"}}>
                  <div style={{...styles.thSortable, justifyContent: "center"}} onClick={() => toggleSort("data")}>
                    <span>Próxima Aplicação</span>
                    {sortConfig.key === "data" && <span>{sortConfig.direction === "asc" ? "↑" : "↓"}</span>}
                  </div>
                </th>
                <th style={{...styles.th, textAlign: "center"}}>Status</th>
                <th style={{...styles.th, textAlign: "center"}}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {manejosExibidos.length === 0 ? (
                <tr>
                  <td colSpan={10} style={styles.emptyState}>
                    <div style={{fontSize: "48px", marginBottom: "16px"}}>💉</div>
                    <div style={{fontSize: "16px", fontWeight: 600, marginBottom: "8px"}}>Nenhum manejo cadastrado</div>
                    <div>Cadastre vacinas, vermífugos e outros protocolos sanitários</div>
                  </td>
                </tr>
              ) : (
                manejosExibidos.map((m, idx) => {
                  const rowId = m.id || idx;
                  const isHovered = hoveredRowId === rowId;
                  const status = statusFromManejo(m);
                  const dataExibir = m.proximaAplicacao || m.dataInicial;
                  
                  return (
                    <tr key={rowId} style={{...styles.tr, ...(isHovered ? styles.trHover : {})}}
                        onMouseEnter={() => setHoveredRowId(rowId)}
                        onMouseLeave={() => setHoveredRowId(null)}>
                      <td style={styles.td}>
                        <span style={styles.categoriaBadge}>{m.categoria}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.tipoBadge}>{m.tipo}</span>
                      </td>
                      <td style={{...styles.td, fontWeight: 600, color: "#0f172a"}}>{m.produto}</td>
                      <td style={{...styles.td, ...styles.tdCenter, fontSize: "13px"}}>
                        {m.frequencia ? `${m.frequencia} dias` : "—"}
                      </td>
                      <td style={styles.td}>{m.idade || "—"}</td>
                      <td style={{...styles.td, fontSize: "13px", color: "#64748b"}}>{m.via}</td>
                      <td style={{...styles.td, ...styles.tdCenter}}>
                        <span style={styles.doseBadge}>{m.dose}mL</span>
                      </td>
                      <td style={{...styles.td, ...styles.tdCenter, fontWeight: 500}}>
                        {dataExibir ? formatBR(dataExibir) : <span style={{color: "#9ca3af"}}>Não agendado</span>}
                      </td>
                      <td style={{...styles.td, ...styles.tdCenter}}>
                        <span style={{...styles.statusBadge, backgroundColor: status.bg, color: status.color}}>
                          {status.label}
                        </span>
                      </td>
                      <td style={{...styles.td, ...styles.tdCenter}}>
                        <div style={styles.actionButtons}>
                          <button style={styles.iconButton} onClick={() => setModalCadastro({ open: true, index: idx })} title="Editar">✏️</button>
                          <button style={styles.iconButton} onClick={() => setModalRegistro({ open: true, index: idx })} title="Registrar aplicação">✓</button>
                          <button style={{...styles.iconButton, ...styles.iconButtonDanger}} onClick={() => setModalExcluir({ open: true, index: idx })} title="Excluir">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Footer */}
          {manejosExibidos.length > 0 && (
            <div style={styles.footer}>
              <div style={styles.footerStats}>
                <div style={styles.statItem}>
                  <span>Total:</span>
                  <span style={{...styles.statValue, color: "#0f172a"}}>{resumo.total}</span>
                </div>
                <div style={styles.statItem}>
                  <span>Vencidos:</span>
                  <span style={{...styles.statValue, color: "#dc2626"}}>{resumo.vencidos}</span>
                </div>
                <div style={styles.statItem}>
                  <span>Próximos 7 dias:</span>
                  <span style={{...styles.statValue, color: "#d97706"}}>{resumo.proximos}</span>
                </div>
                <div style={styles.statItem}>
                  <span>Sem data:</span>
                  <span style={{...styles.statValue, color: "#6b7280"}}>{resumo.semData}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modais */}
      {modalCadastro.open && (
        <Modal title={modalCadastro.index !== null ? "✏️ Editar Manejo" : "➕ Novo Manejo Sanitário"} onClose={() => setModalCadastro({ open: false })}>
          <CadastroManejoForm 
            value={modalCadastro.index !== null ? manejos[modalCadastro.index] : null}
            onCancel={() => setModalCadastro({ open: false })}
            onSave={salvarManejo}
          />
        </Modal>
      )}

      {modalRegistro.open && (
        <Modal title="✓ Registrar Aplicação" onClose={() => setModalRegistro({ open: false })}>
          <RegistroAplicacaoForm 
            manejo={manejos[modalRegistro.index]}
            onCancel={() => setModalRegistro({ open: false })}
            onSave={salvarRegistro}
          />
        </Modal>
      )}

      {modalExames && (
        <Modal title="📋 Controle de Exames Sanitários" onClose={() => setModalExames(false)}>
          <ExamesSanitariosForm 
            onCancel={() => setModalExames(false)}
            onSave={() => setModalExames(false)}
          />
        </Modal>
      )}

      {modalExcluir.open && (
        <Modal title="⚠️ Confirmar Exclusão" onClose={() => setModalExcluir({ open: false })}>
          <div style={{color: "#374151", marginBottom: "20px", lineHeight: 1.6}}>
            Deseja realmente excluir o manejo <strong>"{manejos[modalExcluir.index]?.produto}"</strong>?
            <br />
            <span style={{fontSize: "13px", color: "#ef4444"}}>Esta ação não poderá ser desfeita.</span>
          </div>
          <div style={{display: "flex", justifyContent: "flex-end", gap: "12px"}}>
            <button style={styles.secondaryButton} onClick={() => setModalExcluir({ open: false })}>Cancelar</button>
            <button style={{...styles.primaryButton, backgroundColor: "#ef4444"}} onClick={confirmarExclusao}>Excluir Manejo</button>
          </div>
        </Modal>
      )}
    </section>
  );
}

/* =================== Sub-componentes =================== */

function CadastroManejoForm({ value, onCancel, onSave }) {
  const [form, setForm] = useState(() => ({
    id: value?.id || null,
    categoria: value?.categoria || "",
    tipo: value?.tipo || "",
    produto: value?.produto || "",
    frequencia: value?.frequencia || "",
    idade: value?.idade || "",
    via: value?.via || "",
    dose: value?.dose || "",
    dataInicial: value?.dataInicial || "",
  }));

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const proximaEstimada = useMemo(() => {
    if (!form.dataInicial || !form.frequencia) return "";
    const dias = parseInt(form.frequencia, 10);
    const d = new Date(form.dataInicial);
    if (Number.isFinite(dias)) {
      d.setDate(d.getDate() + dias);
      return isoDate(d);
    }
    return "";
  }, [form.dataInicial, form.frequencia]);

  const styles = {
    grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" },
    formGroup: { display: "flex", flexDirection: "column", gap: "6px" },
    label: { fontSize: "13px", fontWeight: 600, color: "#374151" },
    input: { padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px" },
    select: { padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", backgroundColor: "#fff" },
    preview: { backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "12px 16px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" },
    previewLabel: { fontSize: "13px", color: "#166534", fontWeight: 600 },
    previewValue: { fontSize: "16px", fontWeight: 700, color: "#059669" },
    buttonGroup: { display: "flex", justifyContent: "flex-end", gap: "12px" },
    btnSecondary: { padding: "10px 20px", border: "1px solid #e5e7eb", backgroundColor: "#fff", borderRadius: "8px", cursor: "pointer", fontWeight: 500 },
    btnPrimary: { padding: "10px 20px", border: "none", backgroundColor: "#3b82f6", color: "#fff", borderRadius: "8px", cursor: "pointer", fontWeight: 600 },
  };

  return (
    <div>
      <div style={styles.preview}>
        <span style={styles.previewLabel}>📅 Próxima aplicação estimada</span>
        <span style={styles.previewValue}>{proximaEstimada ? formatBR(proximaEstimada) : "—"}</span>
      </div>

      <div style={styles.grid}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Categoria *</label>
          <select style={styles.select} value={form.categoria} onChange={e => set("categoria", e.target.value)}>
            <option value="">Selecione...</option>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Tipo *</label>
          <select style={styles.select} value={form.tipo} onChange={e => set("tipo", e.target.value)}>
            <option value="">Selecione...</option>
            {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{...styles.formGroup, gridColumn: "span 2"}}>
          <label style={styles.label}>Produto / Princípio Ativo *</label>
          <input style={styles.input} value={form.produto} onChange={e => set("produto", e.target.value)} placeholder="Ex: Clostridioses, Ivermectina..." />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Frequência (dias) *</label>
          <input type="number" style={styles.input} value={form.frequencia} onChange={e => set("frequencia", e.target.value)} placeholder="180" />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Idade de Aplicação</label>
          <input style={styles.input} value={form.idade} onChange={e => set("idade", e.target.value)} placeholder="Ex: 60 dias" />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Via de Administração</label>
          <select style={styles.select} value={form.via} onChange={e => set("via", e.target.value)}>
            <option value="">Selecione...</option>
            {VIAS.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Dose (mL) *</label>
          <input type="number" style={styles.input} value={form.dose} onChange={e => set("dose", e.target.value)} placeholder="2" />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Data Inicial</label>
          <input type="date" style={styles.input} value={form.dataInicial} onChange={e => set("dataInicial", e.target.value)} />
        </div>
      </div>

      <div style={styles.buttonGroup}>
        <button style={styles.btnSecondary} onClick={onCancel}>Cancelar</button>
        <button style={styles.btnPrimary} onClick={() => {
          if (!form.categoria || !form.tipo || !form.produto || !form.dose || !form.frequencia) {
            alert("Preencha todos os campos obrigatórios (*)");
            return;
          }
          onSave({ ...form, proximaAplicacao: proximaEstimada });
        }}>Salvar Manejo</button>
      </div>
    </div>
  );
}

function RegistroAplicacaoForm({ manejo, onCancel, onSave }) {
  const [data, setData] = useState(isoDate(new Date()));
  const [obs, setObs] = useState("");

  const styles = {
    infoBox: { backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "16px", marginBottom: "20px" },
    infoTitle: { fontWeight: 700, color: "#1e40af", marginBottom: "4px" },
    infoText: { color: "#64748b", fontSize: "14px" },
    formGroup: { display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" },
    label: { fontSize: "13px", fontWeight: 600, color: "#374151" },
    input: { padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px" },
    textarea: { padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", minHeight: "80px", resize: "vertical" },
    buttonGroup: { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" },
    btnSecondary: { padding: "10px 20px", border: "1px solid #e5e7eb", backgroundColor: "#fff", borderRadius: "8px", cursor: "pointer", fontWeight: 500 },
    btnPrimary: { padding: "10px 20px", border: "none", backgroundColor: "#059669", color: "#fff", borderRadius: "8px", cursor: "pointer", fontWeight: 600 },
  };

  return (
    <div>
      <div style={styles.infoBox}>
        <div style={styles.infoTitle}>{manejo?.produto}</div>
        <div style={styles.infoText}>{manejo?.tipo} • {manejo?.categoria} • Dose: {manejo?.dose}mL</div>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Data da Aplicação *</label>
        <input type="date" style={styles.input} value={data} onChange={e => setData(e.target.value)} />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Observações</label>
        <textarea style={styles.textarea} value={obs} onChange={e => setObs(e.target.value)} placeholder="Lote do produto, reação adversa, etc..." />
      </div>

      <div style={styles.buttonGroup}>
        <button style={styles.btnSecondary} onClick={onCancel}>Cancelar</button>
        <button style={styles.btnPrimary} onClick={() => onSave(data, obs)}>Confirmar Aplicação</button>
      </div>
    </div>
  );
}

function ExamesSanitariosForm({ onCancel, onSave }) {
  const [dados, setDados] = useState({
    tipo: "", outroTipo: "", abrangencia: "", animal: "",
    status: "Propriedade Não Certificada", validadeCertificado: "", dataUltimo: "",
  });

  const set = (k, v) => setDados(p => ({ ...p, [k]: v }));

  const precisaStatus = (t) => ["Brucelose", "Tuberculose", "Brucelose e Tuberculose (certificação conjunta)"].includes(t);

  const calcularProxima = () => {
    if (!dados.dataUltimo) return "";
    const d = new Date(dados.dataUltimo);
    switch (dados.tipo) {
      case "Brucelose":
      case "Tuberculose": d.setFullYear(d.getFullYear() + 1); return isoDate(d);
      case "Brucelose e Tuberculose (certificação conjunta)": 
        return dados.validadeCertificado || (d.setFullYear(d.getFullYear() + 1) && isoDate(d));
      case "Leptospirose": d.setMonth(d.getMonth() + 6); return isoDate(d);
      default: return "";
    }
  };

  const styles = {
    grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" },
    formGroup: { display: "flex", flexDirection: "column", gap: "6px" },
    label: { fontSize: "13px", fontWeight: 600, color: "#374151" },
    input: { padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px" },
    select: { padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", backgroundColor: "#fff" },
    preview: { backgroundColor: "#fef3c7", border: "1px solid #fde68a", borderRadius: "8px", padding: "12px 16px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" },
    previewLabel: { fontSize: "13px", color: "#92400e", fontWeight: 600 },
    previewValue: { fontSize: "16px", fontWeight: 700, color: "#b45309" },
    buttonGroup: { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" },
    btnSecondary: { padding: "10px 20px", border: "1px solid #e5e7eb", backgroundColor: "#fff", borderRadius: "8px", cursor: "pointer", fontWeight: 500 },
    btnPrimary: { padding: "10px 20px", border: "none", backgroundColor: "#3b82f6", color: "#fff", borderRadius: "8px", cursor: "pointer", fontWeight: 600 },
  };

  return (
    <div>
      <div style={styles.grid}>
        <div style={{...styles.formGroup, gridColumn: "span 2"}}>
          <label style={styles.label}>Tipo de Exame *</label>
          <select style={styles.select} value={dados.tipo} onChange={e => set("tipo", e.target.value)}>
            <option value="">Selecione...</option>
            <option value="Brucelose">Brucelose</option>
            <option value="Tuberculose">Tuberculose</option>
            <option value="Brucelose e Tuberculose (certificação conjunta)">Brucelose e Tuberculose (certificação conjunta)</option>
            <option value="Leptospirose">Leptospirose</option>
            <option value="Tripanossoma">Tripanossoma</option>
            <option value="Babesiose">Babesiose</option>
            <option value="Outros">Outros (especificar)</option>
          </select>
        </div>

        {dados.tipo === "Outros" && (
          <div style={{...styles.formGroup, gridColumn: "span 2"}}>
            <label style={styles.label}>Especificar Exame</label>
            <input style={styles.input} value={dados.outroTipo} onChange={e => set("outroTipo", e.target.value)} />
          </div>
        )}

        <div style={styles.formGroup}>
          <label style={styles.label}>Abrangência *</label>
          <select style={styles.select} value={dados.abrangencia} onChange={e => set("abrangencia", e.target.value)}>
            <option value="">Selecione...</option>
            <option value="Propriedade inteira">Propriedade inteira</option>
            <option value="Animal específico">Animal específico</option>
            <option value="Animal novo em entrada">Animal novo em entrada</option>
          </select>
        </div>

        {(dados.abrangencia === "Animal específico" || dados.abrangencia === "Animal novo em entrada") && (
          <div style={styles.formGroup}>
            <label style={styles.label}>Identificação do Animal</label>
            <input style={styles.input} value={dados.animal} onChange={e => set("animal", e.target.value)} placeholder="Brinco, nome ou ID" />
          </div>
        )}

        {precisaStatus(dados.tipo) && (
          <div style={styles.formGroup}>
            <label style={styles.label}>Status da Propriedade</label>
            <select style={styles.select} value={dados.status} onChange={e => set("status", e.target.value)}>
              <option value="Propriedade Não Certificada">Propriedade Não Certificada</option>
              <option value="Propriedade Certificada">Propriedade Certificada</option>
            </select>
          </div>
        )}

        {precisaStatus(dados.tipo) && dados.status === "Propriedade Certificada" && (
          <div style={styles.formGroup}>
            <label style={styles.label}>Validade do Certificado</label>
            <input type="date" style={styles.input} value={dados.validadeCertificado} onChange={e => set("validadeCertificado", e.target.value)} />
          </div>
        )}

        <div style={styles.formGroup}>
          <label style={styles.label}>Data do Último Exame *</label>
          <input type="date" style={styles.input} value={dados.dataUltimo} onChange={e => set("dataUltimo", e.target.value)} />
        </div>
      </div>

      <div style={styles.preview}>
        <span style={styles.previewLabel}>📅 Próxima obrigatoriedade</span>
        <span style={styles.previewValue}>{calcularProxima() ? formatBR(calcularProxima()) : "—"}</span>
      </div>

      <div style={styles.buttonGroup}>
        <button style={styles.btnSecondary} onClick={onCancel}>Cancelar</button>
        <button style={styles.btnPrimary} onClick={() => {
          if (!dados.tipo || !dados.dataUltimo || !dados.abrangencia) {
            alert("Preencha os campos obrigatórios (*)");
            return;
          }
          onSave();
        }}>Salvar Registro</button>
      </div>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div style={{
      position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)",
      display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, padding: "20px"
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: "16px", width: "800px", maxWidth: "95vw",
        maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          background: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)", color: "#fff",
          padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <span style={{fontWeight: 700, fontSize: "18px"}}>{title}</span>
          <button onClick={onClose} style={{background: "none", border: "none", color: "#fff", fontSize: "24px", cursor: "pointer"}}>×</button>
        </div>
        <div style={{padding: "24px", overflow: "auto"}}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* =================== Helpers =================== */
function isoDate(d) {
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt.getTime())) return "";
  return dt.toISOString().split("T")[0];
}

function formatBR(iso) {
  if (!iso) return "—";
  try {
    const [ano, mes, dia] = iso.split("-");
    return `${dia}/${mes}/${ano}`;
  } catch {
    return "—";
  }
}

function cryptoId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `id_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  }
}