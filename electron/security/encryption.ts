import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

const KEY_FILE_NAME = 'encryption.key';
const SCRYPT_SALT = 'mc-manager-encryption-v1';

let cachedKey: Buffer | null = null;

function resolveUserDataPath() {
    return app.getPath('userData');
}

function loadOrCreateKeyFile() {
    const userDataPath = resolveUserDataPath();
    const keyPath = path.join(userDataPath, KEY_FILE_NAME);

    if (fs.existsSync(keyPath)) {
        const raw = fs.readFileSync(keyPath, 'utf-8').trim();
        if (raw.length === 64) {
            return Buffer.from(raw, 'hex');
        }
    }

    fs.mkdirSync(userDataPath, { recursive: true });
    const generatedKey = crypto.randomBytes(32);
    fs.writeFileSync(keyPath, generatedKey.toString('hex'), { encoding: 'utf-8' });
    return generatedKey;
}

export function getEncryptionKey() {
    if (cachedKey) {
        return cachedKey;
    }

    const providedSecret = process.env.MC_MANAGER_ENCRYPTION_SECRET?.trim();
    if (providedSecret) {
        cachedKey = crypto.scryptSync(providedSecret, SCRYPT_SALT, 32);
        return cachedKey;
    }

    cachedKey = loadOrCreateKeyFile();
    return cachedKey;
}
