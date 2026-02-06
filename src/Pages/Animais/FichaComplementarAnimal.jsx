// src/Pages/Animais/FichaComplementarAnimal.jsx
import React, { useEffect, useRef } from "react";

const grid2 = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
  columnGap: 16,
  rowGap: 18,
};

const lblPadrao = {
  fontWeight: 700,
  fontSize: 13,
  color: "#334155",
  display: "block",
  marginBottom: 6,
};

const inputBasePadrao = {
  width: "100%",
  borderRadius: 14,
  border: "1px solid #d1d5db",
  padding: "12px 14px",
  fontSize: 15,
  background: "#ffffff",
  boxSizing: "border-box",
};

const linhaLista = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginTop: 10,
};

const botaoAzulMais = {
  minWidth: 44,
  height: 44,
  borderRadius: "999px",
  border: "none",
  backgroundColor: "#1c3586",
  color: "#fff",
  fontSize: 24,
  fontWeight: 800,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
};

/**
 * Converte dd/mm/aaaa -> yyyy-mm-dd (ISO date)
 * Retorna null se inválida.
 */
function ddmmyyyyToISODate(ddmmyyyy) {
  const s = String(ddmmyyyy || "").trim();
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return null;

  const [dd, mm, yyyy] = s.split("/").map((x) => parseInt(x, 10));
  if (!dd || !mm || !yyyy) return null;

  const dt = new Date(yyyy, mm - 1, dd);
  const ok =
    dt.getFullYear() === yyyy &&
    dt.getMonth() === mm - 1 &&
    dt.getDate() === dd;

  if (!ok) return null;

  const pad2 = (n) => String(n).padStart(2, "0");
  return `${yyyy}-${pad2(mm)}-${pad2(dd)}`;
}

/**
 * Auto-save inteligente:
 * - salva no blur se data válida
 * - salva por debounce quando completar 10 chars (dd/mm/aaaa)
 * - evita duplicar se já salvou a mesma data para aquele campo
 */
export default function FichaComplementarAnimal({
  pai,
  setPai,
  mae,
  setMae,
  inseminacoesAnteriores,
  setInseminacoesAnteriores,
  partosAnteriores,
  setPartosAnteriores,
  secagensAnteriores,
  setSecagensAnteriores,
  atualizarDataLista,
  limparCamposVazios,
  adicionarCampoSeUltimoPreenchido,
  onAdicionarEvento,
  inputBase,
  lbl,
}) {
  const estiloInput = inputBase || inputBasePadrao;
  const estiloLbl = lbl || lblPadrao;

  // guarda o último ISO salvo por "tipo#index" para evitar duplicar inserts
  const lastSavedRef = useRef(new Map());
  // debounce timers por campo
  const timersRef = useRef(new Map());

  useEffect(() => {
    return () => {
      // cleanup timers ao desmontar
      for (const t of timersRef.current.values()) clearTimeout(t);
      timersRef.current.clear();
    };
  }, []);

  const makeKey = (tipo, index) => `${tipo}#${index}`;

  const salvarSeValido = async ({ tipo, index, valorBr, origem }) => {
    if (!onAdicionarEvento) return;

    const iso = ddmmyyyyToISODate(valorBr);
    if (!iso) return;

    const k = makeKey(tipo, index);
    const lastIso = lastSavedRef.current.get(k);
    if (lastIso === iso) return; // já salvou essa data

    // marca imediatamente como "salvo" pra evitar duplo clique/duplo blur
    lastSavedRef.current.set(k, iso);

    try {
      await onAdicionarEvento({
        tipo,
        data_evento: iso,
        meta: {
          origem: "ficha_complementar",
          modo: "historico",
          trigger: origem, // "blur" | "debounce"
          input: valorBr,
          index,
        },
      });
    } catch (e) {
      // se falhar, libera para tentar de novo
      lastSavedRef.current.delete(k);
      console.error("Falha ao salvar evento reprodutivo:", e);
    }
  };

  const agendarSalvar = ({ tipo, index, valorBr }) => {
    // Só agenda se parece completo
    if (String(valorBr || "").trim().length !== 10) return;

    const k = makeKey(tipo, index);
    const prev = timersRef.current.get(k);
    if (prev) clearTimeout(prev);

    const t = setTimeout(() => {
      salvarSeValido({ tipo, index, valorBr, origem: "debounce" });
    }, 450);

    timersRef.current.set(k, t);
  };

  const renderListaDatas = (lista, setLista, label, tipo) => (
    <div style={{ marginTop: 24 }}>
      <label style={estiloLbl}>{label}</label>

      {lista.map((data, index) => (
        <div
          key={`${label}-${index}`}
          style={{ ...linhaLista, marginTop: index === 0 ? 8 : 10 }}
        >
          <input
            style={{ ...estiloInput, flex: 1 }}
            placeholder="dd/mm/aaaa (opcional)"
            value={data}
            onChange={(e) => {
              const v = e.target.value;
              atualizarDataLista(lista, setLista, index, v);

              // auto-save por debounce quando completar dd/mm/aaaa
              agendarSalvar({ tipo, index, valorBr: v });
            }}
            onBlur={async (e) => {
              // ✅ pega o valor atual do input (evita salvar "data" antigo do closure)
              const valorAtual = e.target.value;

              // ✅ 1) salva primeiro (evita índice mudar se limpar remover itens)
              await salvarSeValido({
                tipo,
                index,
                valorBr: valorAtual,
                origem: "blur",
              });

              // ✅ 2) depois limpa vazios
              limparCamposVazios(lista, setLista);
            }}
          />

          {index === lista.length - 1 && (
            <button
              type="button"
              style={botaoAzulMais}
              onClick={async () => {
                const ultimoValor = lista[lista.length - 1];

                // antes de adicionar novo campo, garante salvar o atual se válido
                await salvarSeValido({
                  tipo,
                  index,
                  valorBr: ultimoValor,
                  origem: "blur",
                });

                // agora sim: só adiciona novo campo se o último foi preenchido
                adicionarCampoSeUltimoPreenchido(lista, setLista);
              }}
              title="Adicionar nova data"
            >
              +
            </button>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div
      style={{
        marginTop: 8,
        borderTop: "1px solid #e5e7eb",
        paddingTop: 16,
      }}
    >
      <div style={grid2}>
        <div>
          <label style={estiloLbl}>Pai (nome)</label>
          <input
            style={estiloInput}
            value={pai}
            onChange={(e) => setPai(e.target.value)}
            placeholder="Opcional"
          />
        </div>
        <div>
          <label style={estiloLbl}>Mãe (nome)</label>
          <input
            style={estiloInput}
            value={mae}
            onChange={(e) => setMae(e.target.value)}
            placeholder="Opcional"
          />
        </div>
      </div>

      {renderListaDatas(
        inseminacoesAnteriores,
        setInseminacoesAnteriores,
        "Inseminações anteriores",
        "IA"
      )}

      {renderListaDatas(
        partosAnteriores,
        setPartosAnteriores,
        "Partos anteriores",
        "PARTO"
      )}

      {renderListaDatas(
        secagensAnteriores,
        setSecagensAnteriores,
        "Secagens anteriores",
        "SECAGEM"
      )}

      <p style={{ marginTop: 16, fontSize: 12, color: "#6b7280" }}>
        Salvamento automático: ao completar a data ou ao sair do campo, o evento é registrado.
      </p>
    </div>
  );
}
