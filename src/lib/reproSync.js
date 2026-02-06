// src/lib/reproSync.js
import { supabase } from "./supabaseClient";

const TIPOS_REPRO = ["IA", "PARTO", "SECAGEM", "DG", "ABORTO"];

function normalizarDataEvento(valor) {
  if (!valor) return null;
  const texto = String(valor).trim();
  if (!texto) return null;

  // dd/mm/aaaa
  const br = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) {
    const [, d, m, a] = br;
    return `${a}-${m}-${d}`;
  }

  // yyyy-mm-dd...
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  return null;
}

async function getAuthUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data?.user?.id || null;
}

/**
 * Sincroniza eventos no banco (upsert).
 * - Não engole erro: retorna { ok, error }
 * - Log detalhado para achar 403/RLS rápido
 */
export async function syncCadastroReproEventos({
  fazendaId,
  animalId,
  userId, // opcional
  eventos = [],
  debug = true,
}) {
  if (!fazendaId || !animalId) {
    return { ok: false, error: { message: "faltou fazendaId ou animalId" } };
  }

  const resolvedUserId = userId || (await getAuthUserId());

  // Normaliza/valida
  const norm = (eventos || [])
    .map((e) => {
      const tipo = e?.tipo;
      if (!TIPOS_REPRO.includes(tipo)) return null;

      const rawData =
        e?.data_evento ??
        e?.data ??
        e?.dataEvento ??
        e?.data_evento_br ??
        null;

      const data_evento = normalizarDataEvento(rawData);
      if (!data_evento) return null;

      const meta =
        e?.meta && typeof e.meta === "object" ? e.meta : {};

      const observacoes =
        typeof e?.observacoes === "string" ? e.observacoes : null;

      const row = {
        fazenda_id: fazendaId,
        animal_id: animalId,
        tipo,
        data_evento,
        meta,
        observacoes,
      };

      // IMPORTANTÍSSIMO: só manda user_id se tiver mesmo
      // (evita mandar null e bater em NOT NULL / policy)
      if (resolvedUserId) row.user_id = resolvedUserId;

      return row;
    })
    .filter(Boolean);

  // dedup tipo+data
  const unicos = Array.from(
    new Map(norm.map((r) => [`${r.tipo}-${r.data_evento}`, r])).values()
  );

  if (debug) {
    console.groupCollapsed("[reproSync] syncCadastroReproEventos");
    console.log("fazendaId", fazendaId);
    console.log("animalId", animalId);
    console.log("resolvedUserId", resolvedUserId);
    console.log("eventos recebidos", eventos);
    console.log("eventos normalizados/unicos", unicos);
    console.groupEnd();
  }

  if (unicos.length === 0) return { ok: true, data: [] };

  // Upsert com retorno (select) ajuda MUITO a ver se inseriu
  const { data, error } = await supabase
    .from("repro_eventos")
    .upsert(unicos, { onConflict: "fazenda_id,animal_id,tipo,data_evento" })
    .select("id,fazenda_id,animal_id,tipo,data_evento,user_id,created_at");

  if (error) {
    // devolve erro completo para o caller (CadastroAnimal)
    const err = {
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
      code: error?.code,
      raw: error,
    };

    console.error("[reproSync] ERRO upsert repro_eventos:", err);
    return { ok: false, error: err };
  }

  if (debug) {
    console.log("[reproSync] OK upsert =>", data);
  }

  return { ok: true, data };
}
