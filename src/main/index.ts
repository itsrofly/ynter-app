import { app, shell, BrowserWindow, ipcMain, dialog, safeStorage } from 'electron'
import path, { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../build/icon.png?asset'
import { connection, connectionUtils } from './knex'
import { callback_server } from './oauth-callback'
import { readFileSync, statSync, unlink } from 'fs'
import * as Sentry from '@sentry/electron/main'
import { copyFile, readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'

const pdf = require('pdf-parse')
const XLSX = require('xlsx')

let mainWindow

function getFilesizeInMb(filename): number {
  const stats = statSync(filename)
  const fileSizeInMb = stats.size
  return fileSizeInMb / (1024 * 1024)
}

function generateRandomString(length): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const charactersLength = characters.length

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }

  return result
}

function UpsertKeyValue(obj, keyToChange, value): void {
  const keyToChangeLower = keyToChange.toLowerCase()
  for (const key of Object.keys(obj)) {
    if (key.toLowerCase() === keyToChangeLower) {
      // Reassign old key
      obj[key] = value
      // Done
      return
    }
  }
  // Insert at end instead
  obj[keyToChange] = value
}

; (async (): Promise<void> => {
  Sentry.init({
    dsn: 'https://1c08a05bf43a9d508cdf18e2d9ff25e5@o4507732393525248.ingest.de.sentry.io/4507787898847312'
  })
})()

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('ynter', process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient('ynter')
}

const gotTheLock = app.requestSingleInstanceLock()

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minHeight: 500,
    minWidth: 780,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: true,
      contextIsolation: true,
      sandbox: false, //  if you want to use bytecode to protect preload scripts
      webSecurity: true,
      devTools: !app.isPackaged
    },
    ...(process.platform === 'linux' ? { icon } : {})
  })

  mainWindow.setMenu(null)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // This is need for not disabling websecurity
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const { responseHeaders } = details
    UpsertKeyValue(responseHeaders, 'Access-Control-Allow-Origin', ['*'])
    UpsertKeyValue(responseHeaders, 'Access-Control-Allow-Headers', ['*'])
    callback({ responseHeaders })
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
  app.on('second-instance', () => {
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
    electronApp.setAppUserModelId('app.ynter.co')

    // Initial password, Besically no pin is setup
    const filePath = path.join(app.getPath('userData'), '42');
    const secretNoPassword = 'no justice, no code';
    const encryptedData = safeStorage.encryptString(secretNoPassword);

    if (!existsSync(filePath))
      writeFile(filePath, encryptedData);

    //app.commandLine.appendSwitch('lang', 'en-US'); // Set default language
    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    // Start callback server event
    ipcMain.handle('Server:start', callback_server)

    // Open/create/execute database event
    ipcMain.handle('Database:open', connection)
    ipcMain.handle('Utils:open', connectionUtils)

    // Show error window event
    ipcMain.handle('Show:error', (_ev, title, content) => {
      dialog.showErrorBox(title, content)
    })

    // Show select file and extract text from the file
    ipcMain.handle('Show:openfile', async () => {
      try {
        // Show select file dialog with filter
        const result = await dialog.showOpenDialog({
          properties: ['openFile'],
          filters: [{ name: 'PDF & Excel', extensions: ['pdf', 'xls', 'xlsx', 'csv'] }]
        })

        if (!result.canceled) {
          // Get file
          const file = result.filePaths[0]

          // Check size
          const filesize = getFilesizeInMb(file)
          if (filesize > 10) {
            dialog.showErrorBox(
              'Try again',
              "Couldn't add the file, it's too large.\nMax size is 10mb."
            )
            return
          }
          // Check if is pdf or excel file
          const isPdf = file.endsWith('.pdf')
          if (isPdf) {
            // Read file data
            const dataBuffer = readFileSync(file)
            // Use pdf-parse to get all pdf text
            const data = await pdf(dataBuffer)
            return { filename: path.basename(file), data: data.text }
          }

          // Means that is excel file
          const workbook = XLSX.readFile(file)
          const sheetName = workbook.SheetNames[0]
          const sheet = workbook.Sheets[sheetName]
          const json = XLSX.utils.sheet_to_json(sheet)

          return { filename: path.basename(file), data: JSON.stringify(json) }
        }
        return
      } catch (error) {
        return
      }
    })

    ipcMain.handle("pin-code-check", async (_event, value) => {
      // Read encrypted data from disk
      const encryptedData = await readFile(path.join(app.getPath('userData'), '42'));

      // Decrypt data
      const decryptedData = safeStorage.decryptString(encryptedData);
      
      if (decryptedData === value)
        mainWindow.webContents.send("pin-code", true)
      else
        mainWindow.webContents.send("pin-code", false)
    })

    // Copy file to the appData folder with a random name
    ipcMain.handle('Show:copyFile', async (_ev, file: string) => {
      if (!file) return ''
      // Get random name
      const filename = generateRandomString(5)
      // Copy file to the appData
      const destinationPath = path.join(app.getPath('userData'), filename + path.extname(file))
      await Promise.all([copyFile(file, destinationPath)])

      return destinationPath
    })

    // Show select file dialog and get file informations
    ipcMain.handle('Show:getFile', async () => {
      const result = await dialog.showOpenDialog({})

      if (!result.canceled) {
        const file = result.filePaths[0]
        const filesize = getFilesizeInMb(file)
        const filename = path.basename(file)

        // Retur name path and size
        return { filename, file, filesize }
      }
      return
    })

    // Show save file dialog and copy the file to the select file path
    ipcMain.handle('Show:savefile', async (_ev, file) => {
      try {
        // Dialog result
        const result = await dialog.showSaveDialog({})

        if (!result.canceled) {
          // Copy file to the dialog selected path
          const destinationPath = result.filePath + path.extname(file)
          await Promise.all([copyFile(file, destinationPath)])
        }
        return
      } catch (error) {
        return
      }
    })

    // Used to delete file
    ipcMain.handle('Delete:file', async (_ev, file) => {
      if (!file) return
      unlink(file, (err) => {
        if (err) {
          console.error('Error deleting the file:', err)
        } else {
          console.log('File deleted successfully')
        }
      })
    })

    createWindow()

    app.on('activate', function () {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('open-url', () => { })

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}
// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
