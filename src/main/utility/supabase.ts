import { createClient } from '@supabase/supabase-js';
import { app, safeStorage } from 'electron';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';

const supabaseUrl = import.meta.env.MAIN_VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.MAIN_VITE_SUPABASE_ANON_KEY;

export interface User {
  email: string;
  pin: null | string;
  access_token: string;
  refresh_token: string;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    flowType: 'pkce'
  }
});

app.whenReady().then(async () => {
  const userFile = path.join(app.getPath('userData'), 'User.ynter');
  // Load Session from file
  if (existsSync(userFile)) {
    try {
      // Read encrypted data from disk
      const encryptedData = await readFile(userFile);

      // Decrypt data
      const decryptedData: User = JSON.parse(safeStorage.decryptString(encryptedData));

      // Load session
      await supabase.auth.setSession({
        access_token: decryptedData.access_token,
        refresh_token: decryptedData.refresh_token
      });
    } catch (error) {
      console.error(error);
    }
  }
});
