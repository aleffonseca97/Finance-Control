/** Duração do JWT/cookie após cada renovação (middleware). */
export const SESSION_MAX_AGE_SEC = 12 * 60 * 60

/** Sem atividade (navegação em /dashboard) por este tempo → exige login de novo. */
export const IDLE_MAX_MS = SESSION_MAX_AGE_SEC * 1000
