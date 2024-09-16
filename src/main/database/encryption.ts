import { existsSync, readFileSync, unlink, writeFileSync } from 'fs';
import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from 'crypto';

// Define your encryption key and IV (Initialization Vector)
const algorithm = 'aes-256-cbc'; // or another algorithm
const ivLength = 16; // AES block size

const password = import.meta.env.MAIN_VITE_ENCRYPTION_KEY;
const key = pbkdf2Sync(password, 'salt', 100000, 32, 'sha512'); // Derive a key from the password

// Encrypt a file
export function encryptFile(decryptedFile, encryptedFile): void {
  if (existsSync(decryptedFile)) {
    // Read Decrypted File as binary data
    const fileBuffer = readFileSync(decryptedFile);

    // Generate a random Initialization Vector
    const iv = randomBytes(ivLength);

    // Create a Cipher instance
    const cipher = createCipheriv(algorithm, key, iv);

    // Encrypt the file content
    const encryptedBuffer = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);

    // Write Encrypted File with IV prepended
    writeFileSync(encryptedFile, Buffer.concat([iv, encryptedBuffer]));

    // Remove decrypted File
    unlink(decryptedFile, (err) => {
      if (err) console.error('File Still on Use', decryptedFile);
    });
  }
}

// Decrypt a file
export function decryptFile(encryptedFile, decryptedFile): void {
  if (existsSync(encryptedFile)) {
    // Read Encrypted File as binary data
    const encryptedBuffer = readFileSync(encryptedFile);

    // Extract the IV and the actual encrypted data
    const iv = encryptedBuffer.slice(0, ivLength);
    const encryptedData = encryptedBuffer.slice(ivLength);

    // Create a Decipher instance
    const decipher = createDecipheriv(algorithm, key, iv);

    // Decrypt the file content
    const decryptedBuffer = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

    // Write Decrypted File
    writeFileSync(decryptedFile, decryptedBuffer);
  }
}
