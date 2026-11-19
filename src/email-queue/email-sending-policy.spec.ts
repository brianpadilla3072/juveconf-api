import {
  isRateLimitError,
  loadEmailSendingPolicy,
  sleep,
} from './email-sending-policy';

describe('email-sending-policy', () => {
  const VARS = [
    'EMAIL_MAX_PER_RUN',
    'EMAIL_SEND_DELAY_MS',
    'EMAIL_MAX_PER_DAY',
    'EMAIL_RATE_LIMIT_COOLDOWN_MS',
  ];
  const original: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of VARS) original[key] = process.env[key];
  });

  afterEach(() => {
    for (const key of VARS) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  });

  describe('isRateLimitError', () => {
    it('detecta el error real de Zoho que causó el incidente', () => {
      expect(
        isRateLimitError(
          'Message failed: 550 5.4.6 Unusual sending activity detected. ' +
            '<a href=https://www.zoho.com/mail/help/usage-policy.html>Learn more.</a>',
        ),
      ).toBe(true);
    });

    it('detecta variantes de límite de tasa', () => {
      const casos = [
        '421 4.7.0 Temporary local problem',
        '452 4.5.1 Too many recipients',
        'Message rate exceeded, try again later',
        'Daily sending limit reached',
        'SMTP throttling in effect',
      ];
      for (const caso of casos) expect(isRateLimitError(caso)).toBe(true);
    });

    it('NO marca errores permanentes como de tasa', () => {
      const casos = [
        '550 5.7.1 Sender is not allowed to relay emails',
        '550 5.1.1 The email account that you tried to reach does not exist',
        'ECONNREFUSED 127.0.0.1:465',
        'Connection closed unexpectedly',
        'Invalid login credentials',
      ];
      for (const caso of casos) expect(isRateLimitError(caso)).toBe(false);
    });

    it('tolera mensajes vacíos', () => {
      expect(isRateLimitError(undefined)).toBe(false);
      expect(isRateLimitError(null)).toBe(false);
      expect(isRateLimitError('')).toBe(false);
    });
  });

  describe('loadEmailSendingPolicy', () => {
    it('usa valores por defecto conservadores', () => {
      for (const key of VARS) delete process.env[key];
      expect(loadEmailSendingPolicy()).toEqual({
        maxPerRun: 10,
        delayMs: 3000,
        maxPerDay: 100,
        cooldownMs: 60 * 60 * 1000,
      });
    });

    it('respeta variables de entorno', () => {
      process.env.EMAIL_MAX_PER_RUN = '4';
      process.env.EMAIL_SEND_DELAY_MS = '1500';
      process.env.EMAIL_MAX_PER_DAY = '50';
      process.env.EMAIL_RATE_LIMIT_COOLDOWN_MS = '900000';
      expect(loadEmailSendingPolicy()).toEqual({
        maxPerRun: 4,
        delayMs: 1500,
        maxPerDay: 50,
        cooldownMs: 900000,
      });
    });

    it('valores inválidos caen al default y 0 se clampéa a 1 en los límites', () => {
      process.env.EMAIL_MAX_PER_RUN = 'basura';
      process.env.EMAIL_MAX_PER_DAY = '-5';
      expect(loadEmailSendingPolicy().maxPerRun).toBe(10);
      expect(loadEmailSendingPolicy().maxPerDay).toBe(100);

      process.env.EMAIL_MAX_PER_RUN = '0';
      process.env.EMAIL_SEND_DELAY_MS = '0';
      const policy = loadEmailSendingPolicy();
      expect(policy.maxPerRun).toBe(1);
      expect(policy.delayMs).toBe(0);
    });
  });

  it('sleep resuelve de inmediato con 0', async () => {
    await expect(sleep(0)).resolves.toBeUndefined();
  });
});
