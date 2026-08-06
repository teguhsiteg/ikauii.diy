import crypto from "crypto";

// Pastikan secret key selalu 32 bytes untuk AES-256
const ENCRYPTION_KEY_BASE = process.env.INTERNAL_API_SECRET;
if (!ENCRYPTION_KEY_BASE) {
  throw new Error("INTERNAL_API_SECRET environment variable is not set. Encryption cannot be initialized.");
}
const ENCRYPTION_KEY = crypto.createHash('sha256').update(ENCRYPTION_KEY_BASE).digest('base64').substring(0, 32);
const IV_LENGTH = 16; // Untuk AES, IV selalu 16 bytes

export function encryptText(text: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
  } catch (error) {
    console.error("Encryption error:", error);
    return text; // Fallback to plaintext if error
  }
}

export function decryptText(text: string): string {
  try {
    const textParts = text.split(":");
    if (textParts.length !== 2) return text; // Jika format bukan encrypted string, kembalikan plaintext
    
    const iv = Buffer.from(textParts[0], "hex");
    const encryptedText = Buffer.from(textParts[1], "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error("Decryption error:", error);
    return text; // Fallback to plaintext if error
  }
}
