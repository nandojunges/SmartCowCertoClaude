import React, { useMemo, useState, useCallback } from "react";

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

const Icon = ({ name, size = 16 }) => {
  const icons = {
    droplet: (
      <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
    ),
    home: (
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    ),
    heart: (
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    ),
    calendar: (
      <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    ),
    clock: (
      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
    check: (
      <path d="M5 13l4 4L19 7" />
    ),
    chevronRight: (
      <path d="M9 5l7 7-7 7" />
    ),
    chevronDown: (
      <path d="M19 9l-7 7-7-7" />
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      {icons[name] || null}
    </svg>
  );
};

const CONFIGS = {
  secagem: {
    label: "Secagem",
    action: "Secar",
    icon: "droplet",
    color: "#3B82F6",
    lightBg: "#DBEAFE",
    darkBg: "#1E40AF",
  },
  preparto: {
    label: "Pré-parto",
    action: "Iniciar",
    icon: "home",
    color: "#F59E0B",
    lightBg: "#FEF3C7",
    darkBg: "#D97706",
  },
  parto: {
    label: "Parto",
    action: "Registrar",
    icon: "heart",
    color: "#10B981",
    lightBg: "#D1FAE5",
    darkBg: "#059669",
  },
};

export default function ManejosPendentes({ animais = [], onAction }) {
  const [active, setActive] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

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
  const config = active ? CONFIGS[active] : null;

  const handleToggle = (key) => {
    setActive((prev) => (prev === key ? null : key));
    setExpandedRow(null);
  };

  const handleAction = (tipo, animal) => {
    const id = animal?.animal_id ?? animal?.id;
    if (onAction) {
      onAction({ tipo, animalId: id, animal });
      return;
    }
    console.log("manejo_pendente", { tipo, animal_id: id });
  };

  const getUrgencyColor = (dias) => {
    if (dias <= 3) return "#EF4444";
    if (dias <= 7) return "#F59E0B";
    if (dias <= 14) return "#3B82F6";
    return "#6B7280";
  };

  return (
    <div style={styles.wrapper}>
      {/* Pills */}
      <div style={styles.pillsContainer}>
        {Object.entries(CONFIGS).map(([key, cfg]) => {
          const count = listas[key]?.length || 0;
          const isActive = active === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => handleToggle(key)}
              style={{
                ...styles.pill,
                background: isActive ? cfg.lightBg : "#fff",
                borderColor: isActive ? cfg.color : "#E5E7EB",
                transform: isActive ? "translateY(-2px)" : "translateY(0)",
                boxShadow: isActive
                  ? "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                  : "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 2px 4px 0 rgba(0, 0, 0, 0.1)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
                }
              }}
            >
              <div
                style={{
                  ...styles.pillIcon,
                  background: isActive ? cfg.color : cfg.lightBg,
                  color: isActive ? "#fff" : cfg.color,
                }}
              >
                <Icon name={cfg.icon} size={14} />
              </div>
              <span style={{ ...styles.pillLabel, color: isActive ? cfg.darkBg : "#374151" }}>
                {cfg.label}
              </span>
              <span
                style={{
                  ...styles.pillBadge,
                  background: isActive ? cfg.color : "#F3F4F6",
                  color: isActive ? "#fff" : "#6B7280",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {!temPrevParto && (
        <div style={styles.disclaimer}>
          <Icon name="calendar" size={14} />
          <span>Pendências baseadas na previsão de parto dos animais</span>
        </div>
      )}

      {/* Lista expandida */}
      {active && config && (
        <div
          style={{
            ...styles.listContainer,
            borderColor: config.color,
          }}
        >
          <div
            style={{
              ...styles.listHeader,
              background: config.lightBg,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  background: config.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                }}
              >
                <Icon name={config.icon} size={16} />
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#111827" }}>
                  {config.label}
                </div>
                <div style={{ fontSize: "11px", color: "#6B7280" }}>
                  {activeList.length} {activeList.length === 1 ? "animal" : "animais"}
                </div>
              </div>
            </div>
            <button
              onClick={() => setActive(null)}
              style={styles.closeBtn}
            >
              <Icon name="chevronDown" size={16} />
            </button>
          </div>

          {activeList.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>🎉</div>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                Nenhum animal pendente
              </div>
              <div style={{ fontSize: "12px", color: "#9CA3AF" }}>
                Tudo em dia para {config.label.toLowerCase()}
              </div>
            </div>
          ) : (
            <div style={styles.listContent}>
              {activeList.map((item) => {
                const animal = item.animal || {};
                const id = animal?.animal_id ?? animal?.id;
                const numero = animal?.numero ?? "—";
                const brinco = animal?.brinco ?? "—";
                const isExpanded = expandedRow === id;
                const urgencyColor = getUrgencyColor(item.diasPara);

                return (
                  <div key={`${active}-${id}`} style={styles.rowContainer}>
                    <button
                      style={styles.row}
                      onClick={() => setExpandedRow(isExpanded ? null : id)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = config.lightBg;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#fff";
                      }}
                    >
                      <div style={styles.rowLeft}>
                        <div
                          style={{
                            ...styles.rowIndicator,
                            background: urgencyColor,
                          }}
                        />
                        <div style={styles.animalInfo}>
                          <div style={styles.animalNumero}>#{numero}</div>
                          <div style={styles.animalBrinco}>{brinco}</div>
                        </div>
                      </div>

                      <div style={styles.rowRight}>
                        <div
                          style={{
                            ...styles.daysChip,
                            background: `${urgencyColor}15`,
                            color: urgencyColor,
                            borderColor: `${urgencyColor}30`,
                          }}
                        >
                          <Icon name="clock" size={12} />
                          <span style={{ fontWeight: "700" }}>
                            {item.diasPara}d
                          </span>
                        </div>
                        <Icon
                          name={isExpanded ? "chevronDown" : "chevronRight"}
                          size={16}
                          color="#9CA3AF"
                        />
                      </div>
                    </button>

                    {isExpanded && (
                      <div
                        style={{
                          ...styles.expandedContent,
                          background: config.lightBg,
                        }}
                      >
                        <div style={styles.detailsGrid}>
                          <div style={styles.detailItem}>
                            <Icon name="calendar" size={14} color="#6B7280" />
                            <div>
                              <div style={styles.detailLabel}>Previsão</div>
                              <div style={styles.detailValue}>
                                {formatDateBR(item.prevParto)}
                              </div>
                            </div>
                          </div>
                          <div style={styles.detailItem}>
                            <Icon name="clock" size={14} color="#6B7280" />
                            <div>
                              <div style={styles.detailLabel}>Faltam</div>
                              <div style={styles.detailValue}>
                                {item.diasPara} {item.diasPara === 1 ? "dia" : "dias"}
                              </div>
                            </div>
                          </div>
                        </div>
                        <button
                          style={{
                            ...styles.actionButton,
                            background: config.color,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(active, animal);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = config.darkBg;
                            e.currentTarget.style.transform = "scale(1.02)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = config.color;
                            e.currentTarget.style.transform = "scale(1)";
                          }}
                        >
                          <Icon name="check" size={14} />
                          {config.action}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "16px",
  },
  pillsContainer: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  pill: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    borderRadius: "12px",
    border: "2px solid",
    cursor: "pointer",
    transition: "all 0.2s ease",
    background: "#fff",
  },
  pillIcon: {
    width: "24px",
    height: "24px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
  },
  pillLabel: {
    fontSize: "13px",
    fontWeight: "700",
    transition: "color 0.2s ease",
  },
  pillBadge: {
    minWidth: "20px",
    height: "20px",
    padding: "0 6px",
    borderRadius: "10px",
    fontSize: "11px",
    fontWeight: "800",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
  },
  disclaimer: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 12px",
    background: "#F9FAFB",
    borderRadius: "8px",
    fontSize: "12px",
    color: "#6B7280",
  },
  listContainer: {
    border: "2px solid",
    borderRadius: "16px",
    background: "#fff",
    overflow: "hidden",
    animation: "slideDown 0.3s ease",
  },
  listHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
  },
  closeBtn: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    border: "none",
    background: "rgba(255, 255, 255, 0.8)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px 16px",
    textAlign: "center",
  },
  listContent: {
    display: "flex",
    flexDirection: "column",
  },
  rowContainer: {
    borderTop: "1px solid #F3F4F6",
  },
  row: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    background: "#fff",
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  rowLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  rowIndicator: {
    width: "4px",
    height: "32px",
    borderRadius: "2px",
  },
  animalInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    alignItems: "flex-start",
  },
  animalNumero: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#111827",
  },
  animalBrinco: {
    fontSize: "11px",
    color: "#6B7280",
  },
  rowRight: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  daysChip: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 8px",
    borderRadius: "8px",
    fontSize: "12px",
    border: "1px solid",
  },
  expandedContent: {
    padding: "12px 16px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    animation: "slideDown 0.2s ease",
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  detailItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    padding: "10px",
    background: "#fff",
    borderRadius: "8px",
  },
  detailLabel: {
    fontSize: "11px",
    color: "#6B7280",
    marginBottom: "2px",
  },
  detailValue: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#111827",
  },
  actionButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "10px",
    border: "none",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "700",
    color: "#fff",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
};
