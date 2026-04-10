import crypto from 'crypto';

const ITERATIONS = 120000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

export function hashPassword(password: string) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
    return `${ITERATIONS}:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
    const [iterationsRaw, salt, hash] = stored.split(':');
    const iterations = Number(iterationsRaw);
    if (!iterations || !salt || !hash) return false;

    const computed = crypto.pbkdf2Sync(password, salt, iterations, KEY_LENGTH, DIGEST).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computed, 'hex'));
}
