import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'


// Custom APIs for renderer
const api = {
  Session: () => ipcRenderer.invoke('User:token'),
  Logout: () => ipcRenderer.invoke('User:logout'),
  googleOauth: () => ipcRenderer.invoke('User:oauth'),
  otpSign: () => ipcRenderer.invoke('User:otp'),
  // Ynter Database
  Database: (query: string, params?: string | number[]): Promise<[]> =>
    ipcRenderer.invoke('Database:open', query, params),
  // Utils Database
  Utils: (query: string, params?: string | number[]): Promise<[]> =>
    ipcRenderer.invoke('Utils:open', query, params),
  // Show Error
  showError: (content: string): Promise<void> =>
    ipcRenderer.invoke('Show:error', 'Try again', content),
  // Open File,  see main
  showOpenFile: (): Promise<{ filename: string; data: string } | undefined> =>
    ipcRenderer.invoke('Show:openfile'),
  // Copy file, see main
  showCopyFile: (file: string): Promise<string | undefined> =>
    ipcRenderer.invoke('Show:copyFile', file),
  // Get file,  see main
  showGetFile: (): Promise<{ filename: string; file: string; filesize: number }> =>
    ipcRenderer.invoke('Show:getFile'),
  sendPinCode: (pin: string) => ipcRenderer.invoke('pin-code-check', pin),
  // Save file, see main
  showSavefile: (file: string): Promise<void> => ipcRenderer.invoke('Show:savefile', file),
  // Delete file
  deleteFile: (file: string): Promise<void> => ipcRenderer.invoke('Delete:file', file),
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('onUpdateSession', (callback) =>
      ipcRenderer.on('update-session', (_event, name, email) => callback(name, email))
    )
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.onUpdateSession = (callback): callback =>
    ipcRenderer.on('update-session', (_event, name, email) => callback(name, email))
}

// Used to lock display
function lockDisplay() {
  // Add blur
  let blurbg = document.getElementById('blurbg')
  if (blurbg) {
    blurbg.style.filter = 'blur(15px)'
    blurbg.style.cursor = 'not-allowed'
  }

  // Add modal
  const modal = document.getElementById('loginmodal')
  if (modal) modal.style.display = 'block'

  // Disable interactivity
  const grid = document.getElementById('grid-container')
  if (grid) {
    grid.style.pointerEvents = 'none'
  }
}

// Used to unlock display
function unlockDisplay() {
  // Remove blur
  const blurbg = document.getElementById('blurbg')
  if (blurbg) blurbg.removeAttribute('style')

  // Remove pin modal
  const modal = document.getElementById('loginmodal')
  if (modal) modal.style.display = 'none'

  // Active grid-container
  const grid = document.getElementById('grid-container')
  if (grid) grid.style.pointerEvents = 'auto'
}



// Pin is good
ipcRenderer.on('pin-code', (_event, valid) => {
  if (valid)
    unlockDisplay();
  else {
    // Needs pin
    lockDisplay();

    // Setup lock timer
    let inactivityTimer
    const inactivityTime = 5 * 60 * 1000 // in 10 minutes of inactivity

    function resetTimer() {
      clearTimeout(inactivityTimer)
      inactivityTimer = setTimeout(lockDisplay, inactivityTime)
    }

    // Listen for user activity events
    window.onload = resetTimer
    window.onmousemove = resetTimer
    window.onkeydown = resetTimer
    window.onkeyup = resetTimer
    window.onscroll = resetTimer

  }
})
