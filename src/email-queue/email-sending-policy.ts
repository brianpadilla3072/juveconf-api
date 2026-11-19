/**
 * Política de envío de la cola de correos.
 *
 * Motivo: el 2026-11-19 se encolaron 211 entradas de una y el cron las
 * envió en ráfaga (50 por ciclo, sin pausa). Zoho respondió
 * "550 5.4.6 Unusual sending activity detected" y ~162 correos quedaron
 * FAILED, quemando los 3 intentos en menos de 2 horas.
 *
 * Esta política separa la decisión (cuántos / cada cuánto / cuándo parar)
 * del processor, para poder testearla y ajustarla por env sin recompilar.
 */

export interface EmailSendingPolicy {
  /** Máximo de correos por corrida del cron (o trigger manual). */
  maxPerRun: number;
  /** Milisegundos de pausa entre correos dentro de una corrida. */
  delayMs: number;
  /** Máximo de correos enviados por día, para no agotar el cupo del SMTP. */
  maxPerDay: number;
  /** Minutos que se pausa el envío tras detectar un límite de tasa. */
  cooldownMs: number;
}

function envPositiveInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.floor(parsed);
}

export function loadEmailSendingPolicy(): EmailSendingPolicy {
  return {
    maxPerRun: Math.max(1, envPositiveInt('EMAIL_MAX_PER_RUN', 10)),
    delayMs: Math.max(0, envPositiveInt('EMAIL_SEND_DELAY_MS', 3000)),
    maxPerDay: Math.max(1, envPositiveInt('EMAIL_MAX_PER_DAY', 100)),
    cooldownMs: Math.max(
      0,
      envPositiveInt('EMAIL_RATE_LIMIT_COOLDOWN_MS', 60 * 60 * 1000),
    ),
  };
}

/**
 * Errores SMTP transitorios por volumen. NO son errores del destinatario:
 * esos correos deben volver a intentarse, no marcarse FAILED definitivamente.
 *
 * Ojo: no incluimos un `550` genérico porque Zoho también devuelve 550 para
 * errores permanentes (por ejemplo "Sender is not allowed to relay emails"),
 * que no se arreglan esperando.
 */
const RATE_LIMIT_PATTERNS: RegExp[] = [
  /unusual sending activity/i,
  /message rate exceeded/i,
  /(rate|sending) limit/i,
  /too many (messages|recipients|connections|emails)/i,
  /throttl/i,
  /daily (sending )?limit/i,
  /\b421\b/, // SMTP: service not available, closing transmission channel
  /\b452\b/, // SMTP: insufficient system storage / temporary
];

export function isRateLimitError(message: string | null | undefined): boolean {
  if (!message) return false;
  return RATE_LIMIT_PATTERNS.some((pattern) => pattern.test(message));
}

/** Pausa entre envíos. Con 0 resuelve de inmediato (útil en tests). */
export function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}
