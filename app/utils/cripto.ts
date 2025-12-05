import CryptoJS from "crypto-js";

export const encryptSeed = (seed: string, password: string): string => {
  return CryptoJS.AES.encrypt(seed, password).toString();
};

export const decryptSeed = (cipher: string, password: string): string | null => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, password);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || null;
  } catch {
    return null;
  }
};

export async function encryptPrivateKey(
    privateKey: string,
    password: string,
    salt: string
) {
    const key = await deriveKey(password, salt);

    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        new TextEncoder().encode(privateKey)
    );

    return {
        encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
        iv: btoa(String.fromCharCode(...iv))
    };
}

export function generateSalt() {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    return btoa(String.fromCharCode(...salt));
}

async function deriveKey(password: string, saltB64: string) {
    const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));

    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    return await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt,
            iterations: 200000,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

export async function decryptPrivateKey(
    encryptedB64: string,
    password: string,
    saltB64: string,
    ivB64: string
) {
    const encryptedBytes = Uint8Array.from(
        atob(encryptedB64),
        c => c.charCodeAt(0)
    );

    const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));

    const key = await deriveKey(password, saltB64);

    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        encryptedBytes
    );

    return new TextDecoder().decode(decrypted);
}
