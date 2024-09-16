// Electron
import { app, dialog, ipcMain, safeStorage, shell } from 'electron';

// fs & path
import { copyFile, readFile, writeFile } from 'fs/promises';
import { readFileSync, statSync, unlink, unlinkSync, existsSync } from 'fs';
import path from 'path';

// Supabase
import { supabase, User } from './supabase';

// Database & Server
import { connection, connectionUtils } from '../database/knex';
import { callback_server } from '../server/oauth-callback';

// PDF & Excel
const pdf = require('pdf-parse');
const XLSX = require('xlsx');

function getFilesizeInMb(filename): number {
  const stats = statSync(filename);
  const fileSizeInMb = stats.size;
  return fileSizeInMb / (1024 * 1024);
}

export function generateRandomString(length): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

const userFile = path.join(app.getPath('userData'), 'User.ynter');

app.whenReady().then(async () => {
  // Return country code
  ipcMain.handle('Country:code', () => {
    return app.getLocaleCountryCode();
  });

  // Return access_token
  ipcMain.handle('User:token', async () => {
    // If file dont exist ignore
    if (!existsSync(userFile)) return;

    const {
      data: { session }
    } = await supabase.auth.getSession();
    return session?.access_token;
  });

  // Logout user
  ipcMain.handle('User:logout', async () => {
    await supabase.auth.signOut();
    // Remove user file
    unlinkSync(userFile);
  });

  // Login using google oauth
  ipcMain.handle('User:oauth', async () => {
    try {
      // If file dont exist ignore
      if (existsSync(userFile)) {
        // Read encrypted data from disk
        const encryptedData = await readFile(userFile);

        // Decrypt data
        const decryptedData: User = JSON.parse(safeStorage.decryptString(encryptedData));

        if (decryptedData.pin) return;
      }
      // Create server listener
      const url = callback_server();

      // Create the auth and set the redirect to the server listener
      const { data } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'Profile email',
          skipBrowserRedirect: true,
          redirectTo: url
        }
      });

      // Open url in default url
      if (data.url) shell.openExternal(data.url);
    } catch (error) {
      console.error(error);
    }
  });

  // Login using otp
  ipcMain.handle('User:otp', async (_ev, email) => {
    try {
      // If file dont exist ignore
      if (existsSync(userFile)) {
        // Read encrypted data from disk
        const encryptedData = await readFile(userFile);

        // Decrypt data
        const decryptedData: User = JSON.parse(safeStorage.decryptString(encryptedData));

        if (decryptedData.pin) return;
      }

      // Create server listener
      const url = callback_server();

      // Login using supabase Otp
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: url
        }
      });
      return error;
    } catch (error) {
      console.error(error);
      return;
    }
  });

  // Create pin or update
  ipcMain.handle('Pin:setup', async (_ev, newPin, oldPin) => {
    try {
      // If file dont exist ignore
      if (!existsSync(userFile)) return;
      // Read encrypted data from disk
      let encryptedData = await readFile(userFile);

      // Decrypt data
      const decryptedData: User = JSON.parse(safeStorage.decryptString(encryptedData));

      // If pin
      if (decryptedData.pin) {
        // And pin is the old pin
        if (decryptedData.pin === oldPin) {
          decryptedData.pin = newPin; // Then update pin
          // Save file
          encryptedData = safeStorage.encryptString(JSON.stringify(decryptedData));
          writeFile(userFile, encryptedData);
          return true;
        }
        return false;
      } else {
        decryptedData.pin = newPin; // Setup pin
        // Save file
        encryptedData = safeStorage.encryptString(JSON.stringify(decryptedData));
        writeFile(userFile, encryptedData);
        return true;
      }
    } catch (error) {
      console.error(error);
      return false;
    }
  });

  // Forget pin
  ipcMain.handle('Pin:forget', async () => {
    try {
      // If file dont exist ignore
      if (!existsSync(userFile)) return;
      // Read encrypted data from disk
      const encryptedData = await readFile(userFile);

      // Decrypt data
      const decryptedData: User = JSON.parse(safeStorage.decryptString(encryptedData));

      // Create server listener
      const url = callback_server();

      console.log(decryptedData);

      // Login using supabase Otp,
      // This will reset the User file only if otp is a total success
      const { error } = await supabase.auth.signInWithOtp({
        email: decryptedData.email, // Uses the email address used to create the initial user settings
        options: {
          emailRedirectTo: url
        }
      });
      return error;
    } catch (error) {
      console.error(error);
      return;
    }
  });

  // Check if input pin is valid
  ipcMain.handle('Pin:check', async (_event, value) => {
    // If file dont exist ignore
    if (!existsSync(userFile)) return false;

    // Read encrypted data from disk
    const encryptedData = await readFile(userFile);

    // Decrypt data
    const decryptedData: User = JSON.parse(safeStorage.decryptString(encryptedData));

    // Check if is valid
    return decryptedData.pin === value;
  });

  // Check if has pin
  ipcMain.handle('Pin:has', async () => {
    // If file dont exist ignore
    if (!existsSync(userFile)) return false;
    // Read encrypted data from disk
    const encryptedData = await readFile(userFile);

    // Decrypt data
    const decryptedData: User = JSON.parse(safeStorage.decryptString(encryptedData));

    // Check if has pin
    return decryptedData.pin ? true : false;
  });

  // Open/create/execute database event
  ipcMain.handle('Database:open', connection);
  ipcMain.handle('Utils:open', connectionUtils);

  // Show error window event
  ipcMain.handle('Show:error', (_ev, title, content) => {
    dialog.showErrorBox(title, content);
  });

  // Show select file and extract text from the file
  ipcMain.handle('Show:openfile', async () => {
    try {
      // Show select file dialog with filter
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'PDF & Excel', extensions: ['pdf', 'xls', 'xlsx', 'csv'] }]
      });

      if (!result.canceled) {
        // Get file
        const file = result.filePaths[0];

        // Check size
        const filesize = getFilesizeInMb(file);
        if (filesize > 10) {
          dialog.showErrorBox(
            'Try again',
            "Couldn't add the file, it's too large.\nMax size is 10mb."
          );
          return;
        }
        // Check if is pdf or excel file
        const isPdf = file.endsWith('.pdf');
        if (isPdf) {
          // Read file data
          const dataBuffer = readFileSync(file);
          // Use pdf-parse to get all pdf text
          const data = await pdf(dataBuffer);
          return { filename: path.basename(file), data: data.text };
        }

        // Means that is excel file
        const workbook = XLSX.readFile(file);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet);

        return { filename: path.basename(file), data: JSON.stringify(json) };
      }
      return;
    } catch (error) {
      return;
    }
  });

  // Copy file to the appData folder with a random name
  ipcMain.handle('Show:copyFile', async (_ev, file: string) => {
    if (!file) return '';
    // Get random name
    const filename = generateRandomString(5);
    // Copy file to the appData
    const destinationPath = path.join(app.getPath('userData'), filename + path.extname(file));
    await Promise.all([copyFile(file, destinationPath)]);

    return destinationPath;
  });

  // Show select file dialog and get file informations
  ipcMain.handle('Show:getFile', async () => {
    const result = await dialog.showOpenDialog({});

    if (!result.canceled) {
      const file = result.filePaths[0];
      const filesize = getFilesizeInMb(file);
      const filename = path.basename(file);

      // Retur name path and size
      return { filename, file, filesize };
    }
    return;
  });

  // Show save file dialog and copy the file to the select file path
  ipcMain.handle('Show:savefile', async (_ev, file) => {
    try {
      // Dialog result
      const result = await dialog.showSaveDialog({});

      if (!result.canceled) {
        // Copy file to the dialog selected path
        const destinationPath = result.filePath + path.extname(file);
        await Promise.all([copyFile(file, destinationPath)]);
      }
      return;
    } catch (error) {
      return;
    }
  });

  // Used to delete file
  ipcMain.handle('Delete:file', async (_ev, file) => {
    if (!file) return;
    unlink(file, (err) => {
      if (err) {
        console.error('Error deleting the file:', err);
      } else {
        console.log('File deleted successfully');
      }
    });
  });
});
