import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import path, { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { connection } from './knex'
import { callback_server } from './oauth-callback'
import { readFileSync, statSync, unlink } from 'fs'
import * as Sentry from "@sentry/electron/main";
import { copyFile } from 'fs/promises';
const pdf = require('pdf-parse');
const XLSX = require('xlsx');

let mainWindow



Sentry.init({
  dsn: "https://1c08a05bf43a9d508cdf18e2d9ff25e5@o4507732393525248.ingest.de.sentry.io/4507787898847312",
});

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('ynter', process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient('ynter')
}

const gotTheLock = app.requestSingleInstanceLock()

function getFilesizeInMb(filename) {
  var stats = statSync(filename);
  var fileSizeInMb = stats.size;
  return fileSizeInMb / (1024*1024);
}

function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minHeight: 500,
    minWidth: 780,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false
    },
    ...(process.platform === 'linux' ? { icon } : {}),
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  app.on('open-url', (_event, url) => {
    console.log('Welcome Back', `You arrived from: ${url}`)
  })
}


if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, _commandLine, _workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(async () => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.electron')

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    // Start callback server event
    ipcMain.handle('Server:start', callback_server)

    // Open/create database event
    ipcMain.handle('Database:open', connection)

    // Show error window event
    ipcMain.handle("Show:error", (_ev, title, content) => {
      dialog.showErrorBox(title, content);
    })

    ipcMain.handle("Show:openfile", async (_ev) => {
      try {
        const result = await dialog.showOpenDialog({
          properties: ['openFile'], filters: [
            { name: "PDF & Excel", extensions: ["pdf", "xls", "xlsx", "csv"] }]
        })
  
        if (!(result.canceled)) {
          // file path
          const file = result.filePaths[0];

          const filesize = getFilesizeInMb(file);
          if (filesize > 10) {
            dialog.showErrorBox("Try again", "Couldn't add the file, it's too large.\nMax size is 10mb.");
            return;
          }
  
          // Check if is pdf or excel file
          const isPdf = file.endsWith(".pdf");
          if (isPdf) {
            // Read file data
            const dataBuffer = readFileSync(file);
            // Use pdf-parse to get all pdf text
            const data = await pdf(dataBuffer)
            return {filename: path.basename(file), data: data.text};
          }
  
          // Means that is excel file
          const workbook = XLSX.readFile(file);
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(sheet);
          
          return {filename: path.basename(file), data: JSON.stringify(json)};
        }
        return;
      } catch (error) {
       return; 
      }
    });

    ipcMain.handle("Show:copyFile", async (_ev, file: string) => {
      try {
        if (!file)
          return "";
          const filename = generateRandomString(5);
          const destinationPath = path.join(app.getPath("userData"), filename + path.extname(file));

          await Promise.all([copyFile(file, destinationPath)]);
          
          return destinationPath;
      } catch (error) {
       throw error; 
      }
    });

    ipcMain.handle("Show:getFile", async (_ev) => {
      try {
        const result = await dialog.showOpenDialog({})
  
        if (!(result.canceled)) {
          // file path
          const file = result.filePaths[0];
          const filesize = getFilesizeInMb(file);
          const filename = path.basename(file);

          // Retur name path and size
          return {filename, file, filesize};
        }
        return;
      } catch (error) {
       throw error; 
      }
    });

    ipcMain.handle("Show:savefile", async (_ev, file) => {
      try {
        const result = await dialog.showSaveDialog({})
  
        if (!(result.canceled)) {
          // file path
          const destinationPath = result.filePath + path.extname(file);
          await Promise.all([copyFile(file, destinationPath)]);
        }
        return;
      } catch (error) {
       return; 
      }
    });

    ipcMain.handle("Delete:file", async (_ev, file) => {
      if (!file)
        return;
      unlink(file, (err) => {
        if (err) {
            console.error('Error deleting the file:', err);
        } else {
            console.log('File deleted successfully');
        }
    });
    })

    createWindow()

    app.on('activate', function () {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('open-url', (_event, _url) => {
  })


  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })


};
// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
