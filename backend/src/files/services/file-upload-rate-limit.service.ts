import { Injectable, Logger } from '@nestjs/common';

const DEFAULT_MAX_UPLOADS = 10;
const DEFAULT_WINDOW_SECONDS = 60;

/**
 * In-memory sliding-window rate limiter for file uploads per user.
 * Prunes old entries to avoid unbounded memory growth.
 */
@Injectable()
export class FileUploadRateLimitService {
    private readonly logger = new Logger(FileUploadRateLimitService.name);

    /** userId -> timestamps (ms) of uploads in the current window */
    private readonly windowByUser = new Map<string, number[]>();

    private readonly maxUploads: number;
    private readonly windowMs: number;

    constructor() {
        this.maxUploads =
            typeof process.env.FILE_UPLOAD_RATE_LIMIT_MAX === 'string'
                ? Math.max(1, parseInt(process.env.FILE_UPLOAD_RATE_LIMIT_MAX, 10) || DEFAULT_MAX_UPLOADS)
                : DEFAULT_MAX_UPLOADS;
        this.windowMs =
            typeof process.env.FILE_UPLOAD_RATE_LIMIT_WINDOW_SEC === 'string'
                ? Math.max(1, parseInt(process.env.FILE_UPLOAD_RATE_LIMIT_WINDOW_SEC, 10) || DEFAULT_WINDOW_SECONDS) * 1000
                : DEFAULT_WINDOW_SECONDS * 1000;
    }

    /**
     * Returns true if the user is allowed to upload a file and records the upload.
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

        if (timestamps.length >= this.maxUploads) {
            this.logger.warn(
                `File upload rate limit exceeded for user ${userId} (${timestamps.length}/${this.maxUploads} in ${this.windowMs / 1000}s)`,
            );
            return false;
        }

        timestamps.push(now);
        return true;
    }

    /** Returns how many uploads the user can still make in the current window (without recording). */
    getRemainingUploads(userId: string): number {
        const now = Date.now();
        const cutoff = now - this.windowMs;

        const timestamps = this.windowByUser.get(userId);
        if (!timestamps) {
            return this.maxUploads;
        }

        // Remove timestamps outside the window
        while (timestamps.length > 0 && timestamps[0]! < cutoff) {
            timestamps.shift();
        }

        return Math.max(0, this.maxUploads - timestamps.length);
    }

    /** Returns seconds until the user can upload again (0 if they can upload now). */
    getRetryAfterSeconds(userId: string): number {
        const timestamps = this.windowByUser.get(userId);
        if (!timestamps || timestamps.length < this.maxUploads) {
            return 0;
        }

        const oldestTimestamp = timestamps[0];
        if (!oldestTimestamp) {
            return 0;
        }

        const cutoff = Date.now() - this.windowMs;
        const waitMs = oldestTimestamp - cutoff + 1000; // Add 1 second buffer
        return Math.ceil(Math.max(0, waitMs) / 1000);
    }
}
