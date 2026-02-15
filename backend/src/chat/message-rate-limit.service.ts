import { Injectable, Logger } from '@nestjs/common';

const DEFAULT_MAX_MESSAGES = 20;
const DEFAULT_WINDOW_SECONDS = 60;

/**
 * In-memory sliding-window rate limiter for message sending per user.
 * Prunes old entries to avoid unbounded memory growth.
 */
@Injectable()
export class MessageRateLimitService {
  private readonly logger = new Logger(MessageRateLimitService.name);

  /** userId -> timestamps (ms) of sent messages in the current window */
  private readonly windowByUser = new Map<string, number[]>();

  private readonly maxMessages: number;
  private readonly windowMs: number;

  constructor() {
    this.maxMessages =
      typeof process.env.MESSAGE_RATE_LIMIT_MAX === 'string'
        ? Math.max(1, parseInt(process.env.MESSAGE_RATE_LIMIT_MAX, 10) || DEFAULT_MAX_MESSAGES)
        : DEFAULT_MAX_MESSAGES;
    this.windowMs =
      typeof process.env.MESSAGE_RATE_LIMIT_WINDOW_SEC === 'string'
        ? Math.max(1, parseInt(process.env.MESSAGE_RATE_LIMIT_WINDOW_SEC, 10) || DEFAULT_WINDOW_SECONDS) * 1000
        : DEFAULT_WINDOW_SECONDS * 1000;
  }

  /**
   * Returns true if the user is allowed to send a message and records the send.
   * Returns false if the user has exceeded the rate limit (does not record).
   */
  tryAcquire(userId: string): boolean {
    const now = Date.now();
    const cutoff = now - this.windowMs;

    let timestamps = this.windowByUser.get(userId);
    if (!timestamps) {
      timestamps = [];
      this.windowByUser.set(userId, timestamps);
    }

    // Remove timestamps outside the window
    while (timestamps.length > 0 && timestamps[0]! < cutoff) {
      timestamps.shift();
    }

    if (timestamps.length >= this.maxMessages) {
      this.logger.warn(
        `Rate limit exceeded for user ${userId} (${timestamps.length}/${this.maxMessages} in ${this.windowMs / 1000}s)`,
      );
      return false;
    }

    timestamps.push(now);
    return true;
  }

  /** Returns how many messages the user can still send in the current window (without recording). */
  getRemaining(userId: string): number {
    const now = Date.now();
    const cutoff = now - this.windowMs;

    const timestamps = this.windowByUser.get(userId) ?? [];
    const inWindow = timestamps.filter((t) => t >= cutoff);
    return Math.max(0, this.maxMessages - inWindow.length);
  }

  /** Returns seconds until the oldest entry in the user's window expires (for retry-after). */
  getRetryAfterSeconds(userId: string): number {
    const timestamps = this.windowByUser.get(userId);
    if (!timestamps || timestamps.length === 0) return 0;
    const oldest = Math.min(...timestamps);
    const expiry = oldest + this.windowMs;
    const now = Date.now();
    return Math.max(0, Math.ceil((expiry - now) / 1000));
  }
}
