import React, { useMemo, useState, useCallback } from "react";
import "../../styles/tabelaModerna.css";

function parseDateFlexible(s) {
  if (!s) return null;
  const str = String(s).trim();
  if (!str) return null;

  let m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    const dt = new Date(y, mo - 1, d);
    return Number.isFinite(dt.getTime()) ? dt : null;
  }

  m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) {
    const d = Number(m[1]);
    const mo = Number(m[2]);
    const y = Number(m[3]);
    const dt = new Date(y, mo - 1, d);
    return Number.isFinite(dt.getTime()) ? dt : null;
  }

  return null;
}

function formatDateBR(dateObj) {
  if (!dateObj) return "—";
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const yyyy = dateObj.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function daysBetween(dateA, dateB) {
  if (!dateA || !dateB) return null;
  const ms = dateA.getTime() - dateB.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

const BUTTONS = [
  { key: "secagem", label: "Secagem", action: "Registrar Secagem" },
  { key: "preparto", label: "Pré-parto", action: "Iniciar Pré-parto" },
  { key: "parto", label: "Parto", action: "Registrar Parto" },
];

export default function ManejosPendentes({ animais = [], onAction }) {
  const [active, setActive] = useState(null);

  const hoje = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    return base;
  }, []);

  const resolvePrevParto = useCallback((animal) => {
    return (
      parseDateFlexible(animal?.data_prev_parto) ||
      parseDateFlexible(animal?.dataPrevParto) ||
      parseDateFlexible(animal?.previsao_parto) ||
      parseDateFlexible(animal?.previsaoParto) ||
      parseDateFlexible(animal?.data_prevista_parto) ||
      parseDateFlexible(animal?.dataPrevistaParto) ||
      null
    );
  }, []);

  const { listas, temPrevParto } = useMemo(() => {
    const base = { secagem: [], preparto: [], parto: [] };
    let hasPrev = false;
    (Array.isArray(animais) ? animais : []).forEach((animal) => {
      const prevParto = resolvePrevParto(animal);
      if (!prevParto) return;
      hasPrev = true;
      const diasPara = daysBetween(prevParto, hoje);
      if (!Number.isFinite(diasPara)) return;
      const item = { animal, prevParto, diasPara };
      if (diasPara <= 7) {
        base.parto.push(item);
      } else if (diasPara <= 21) {
        base.preparto.push(item);
      } else if (diasPara <= 60) {
        base.secagem.push(item);
      }
    });
    base.secagem.sort((a, b) => (a.diasPara ?? 0) - (b.diasPara ?? 0));
    base.preparto.sort((a, b) => (a.diasPara ?? 0) - (b.diasPara ?? 0));
    base.parto.sort((a, b) => (a.diasPara ?? 0) - (b.diasPara ?? 0));
    return { listas: base, temPrevParto: hasPrev };
  }, [animais, hoje, resolvePrevParto]);

  const activeList = active ? listas[active] || [] : [];

  const handleToggle = (key) => {
    setActive((prev) => (prev === key ? null : key));
  };

  const handleAction = (tipo, animal) => {
    const id = animal?.animal_id ?? animal?.id;
    if (onAction) {
      onAction({ tipo, animalId: id, animal });
      return;
    }
    console.log("manejo_pendente", { tipo, animal_id: id });
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.band}>
        {BUTTONS.map((btn) => {
          const count = listas[btn.key]?.length || 0;
          const isActive = active === btn.key;
          return (
            <button
              key={btn.key}
              type="button"
              onClick={() => handleToggle(btn.key)}
              style={{
                ...styles.pillButton,
                ...(isActive ? styles.pillButtonActive : {}),
              }}
            >
              <span style={styles.pillLabel}>{btn.label}</span>
              <span style={{ ...styles.pillCount, ...(isActive ? styles.pillCountActive : {}) }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {!temPrevParto && (
        <div style={styles.disclaimer}>
          Pendências dependem da previsão de parto (ainda não disponível nos dados atuais).
        </div>
      )}

      {active && (
        <div style={styles.listWrap}>
          {activeList.length === 0 ? (
            <div style={styles.empty}>Nenhum animal elegível.</div>
          ) : (
            <div className="st-table-wrap">
              <div className="st-scroll">
                <table className="st-table">
                  <colgroup>
                    <col style={{ width: "40%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "20%" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="st-th">Animal</th>
                      <th className="st-th">Prev. Parto</th>
                      <th className="st-th">Dias</th>
                      <th className="st-th st-td-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeList.map((item) => {
                      const animal = item.animal || {};
                      const id = animal?.animal_id ?? animal?.id;
                      const numero = animal?.numero ?? "—";
                      const brinco = animal?.brinco ?? "—";
                      return (
                        <tr key={`${active}-${id}`} className="st-row">
                          <td className="st-td st-col-animal">
                            <div style={styles.animalCell}>
                              <span style={styles.animalNumero}>Nº {numero}</span>
                              <span style={styles.animalBrinco}>Brinco {brinco}</span>
                            </div>
                          </td>
                          <td className="st-td">{formatDateBR(item.prevParto)}</td>
                          <td className="st-td">
                            {Number.isFinite(item.diasPara) ? `Faltam ${item.diasPara}` : "—"}
                          </td>
                          <td className="st-td st-td-center">
                            <button
                              type="button"
                              style={styles.actionBtn}
                              onClick={() => handleAction(active, animal)}
                            >
                              {BUTTONS.find((btn) => btn.key === active)?.action}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "16px",
  },
  band: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  pillButton: {
    border: "1px solid #e2e8f0",
    backgroundColor: "#ffffff",
    borderRadius: "999px",
    padding: "6px 12px",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#0f172a",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  pillButtonActive: {
    backgroundColor: "#e0f2fe",
    borderColor: "#38bdf8",
    color: "#0c4a6e",
  },
  pillLabel: {
    fontSize: "13px",
  },
  pillCount: {
    minWidth: "20px",
    height: "20px",
    borderRadius: "999px",
    backgroundColor: "#f1f5f9",
    color: "#475569",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: 700,
    padding: "0 6px",
  },
  pillCountActive: {
    backgroundColor: "#bae6fd",
    color: "#075985",
  },
  listWrap: {
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    backgroundColor: "#ffffff",
    padding: "8px 12px 12px",
  },
  empty: {
    fontSize: "13px",
    color: "#64748b",
    padding: "8px",
  },
  disclaimer: {
    fontSize: "12px",
    color: "#64748b",
  },
  animalCell: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  animalNumero: {
    fontWeight: 700,
    color: "#0f172a",
    fontSize: "13px",
  },
  animalBrinco: {
    fontSize: "12px",
    color: "#64748b",
  },
  actionBtn: {
    padding: "6px 10px",
    backgroundColor: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: 600,
    color: "#0f172a",
    cursor: "pointer",
  },
};
