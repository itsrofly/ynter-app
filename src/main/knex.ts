import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from 'crypto';
import { app } from 'electron'
import { existsSync, readFileSync, unlink, writeFileSync } from 'fs'
import knex from 'knex'
import path from 'path'
import { generateRandomString } from '.';


// Define your encryption key and IV (Initialization Vector)
const algorithm = 'aes-256-cbc'; // or another algorithm
const ivLength = 16; // AES block size

const password = "JAZ^&UAKL2z";
const key = pbkdf2Sync(password, 'salt', 100000, 32, 'sha512'); // Derive a key from the password

// Encrypt a file
async function encryptFile(decryptedFile, encryptedFile) {
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
      if (err)
        console.error("File Still on Use", decryptedFile);
    });
  }
}

// Decrypt a file
async function decryptFile(encryptedFile, decryptedFile) {
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

export const connection = async (
  _event,
  query: string,
  params?: (string | number | null)[]
): Promise<[] | object> => {

  const decryptedFile = path.join(app.getPath('userData'), generateRandomString(5))
  const encryptedFile = path.join(app.getPath('userData'), 'Ynter.db')

  await decryptFile(encryptedFile, decryptedFile)

  // Create connection, it will create the database file if not exist
  const conn = knex({
    client: 'sqlite3',
    connection: {
      filename: decryptedFile
    },
    useNullAsDefault: true
  })

  // Create table revenue when database file was created now
  await conn.raw(`
            -- Create table agenda if it does not exist
            CREATE TABLE IF NOT EXISTS agenda (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date DATE NOT NULL,
                note INTEGER,
                importance INTEGER NOT NULL,
                information TEXT NOT NULL
            ); `)

  // Same as before, cannot run all queries at the same time
  await conn.raw(`
            -- Create table notes if it does not exist
            CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                data TEXT,
                agenda INTEGER,
                priority INTEGER DEFAULT 0,
                trash INTEGER DEFAULT 0,
                updated_date DATE NOT NULL,
                FOREIGN KEY (agenda) REFERENCES agenda(id)
            );`)

  await conn.raw(`
            -- Create table revenue if it does not exist
            CREATE TABLE IF NOT EXISTS revenue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transaction_id TEXT,
                institution_id TEXT,
                name TEXT NOT NULL,
                note INTEGER,
                description TEXT,
                region TEXT,
                amount INTEGER NOT NULL,
                date DATE NOT NULL,
                category INTEGER NOT NULL,
                type INTEGER NOT NULL,
                bank TEXT NOT NULL,
                recurring INTEGER NOT NULL,
                file_name TEXT,
                file_path TEXT,
                FOREIGN KEY (note) REFERENCES notes(id)
            );`)

  await conn.raw(`
            -- Create table expense if it does not exist
            CREATE TABLE IF NOT EXISTS expense (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transaction_id TEXT,
                institution_id TEXT,
                name TEXT NOT NULL,
                note INTEGER,
                description TEXT,
                region TEXT,
                amount INTEGER NOT NULL,
                date DATE NOT NULL,
                category INTEGER NOT NULL,
                type INTEGER NOT NULL,
                bank TEXT NOT NULL,
                recurring INTEGER NOT NULL,
                file_name TEXT,
                file_path TEXT,
                FOREIGN KEY (note) REFERENCES notes(id)
            );`)

  // And just now execute the requested query with params
  const data = await conn.raw(query, params ? [...params] : [])

  // If the query is an insert, retrieve the last inserted row
  if (query.trim().toLowerCase().startsWith('insert')) {
    // Extract the table name from the query
    const match = query
      .trim()
      .toLowerCase()
      .match(/^insert\s+into\s+(\w+)/i)
    if (match) {
      const tableName = match[1]
      if (tableName !== "sqlite_sequence") {
      const lastInsertedRowId = await conn.raw('SELECT last_insert_rowid() AS id;')
      const lastInsertedRow = await conn(tableName).where('id', lastInsertedRowId[0].id).first()

      // Encrypt File
      await conn.destroy()
      await encryptFile(decryptedFile, encryptedFile)
      return lastInsertedRow
      }
    }
  }
  // Encrypt File
  await conn.destroy()
  await encryptFile(decryptedFile, encryptedFile)

  // received data
  return data
}

export const connectionUtils = async (
  _event,
  query: string,
  params?: (string | number | null)[]
): Promise<[] | object> => {
  // Create connection, it will create the database file if not exist
  const conn = knex({
    client: 'sqlite3',
    connection: {
      filename: path.join(app.getPath('userData'), 'Utils.db')
    },
    useNullAsDefault: true
  })

  await conn.raw(`
            -- Create table banks if it does not exist
            CREATE TABLE IF NOT EXISTS banks (
                internal_id INTEGER PRIMARY KEY AUTOINCREMENT,
                id TEXT NOT NULL UNIQUE,
                institution_name TEXT NOT NULL,
                cursor TEXT,
                enabled INTEGER DEFAULT 1
            ); `)

  // And just now execute the requested query with params
  const data = await conn.raw(query, params ? [...params] : [])


  // If the query is an insert, retrieve the last inserted row
  if (query.trim().toLowerCase().startsWith("insert")) {
    // Extract the table name from the query
    const match = query.trim().toLowerCase().match(/^insert\s+into\s+(\w+)/i);
    if (match) {
      const tableName = match[1];
      if (tableName !== "sqlite_sequence") {
        const lastInsertedRowId = await conn.raw("SELECT last_insert_rowid() AS id;");
        const lastInsertedRow = await conn(tableName)
          .where('internal_id', lastInsertedRowId[0].id)
          .first();
        return lastInsertedRow;
      }
    }
  }

  // received data
  return data
}
