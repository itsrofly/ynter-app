import { contextBridge, ipcRenderer, shell } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  Database: (query: string, params?: any[]) => ipcRenderer.invoke('Database:open', query, params),
  showError: (content: string) => ipcRenderer.invoke("Show:error", "Try again", content),
  showOpenFile: () => ipcRenderer.invoke("Show:openfile"),
  showCopyFile: (file: string) => ipcRenderer.invoke("Show:copyFile", file),
  showGetFile: () => ipcRenderer.invoke("Show:getFile"),
  ShowSavefile: (file: string) => ipcRenderer.invoke("Show:savefile", file),
  DeleteFile: (file: string) => ipcRenderer.invoke("Delete:file", file),
  Server: () => ipcRenderer.invoke("Server:start")
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld("openExternal", shell.openExternal)
    contextBridge.exposeInMainWorld('onUpdateSession', (callback) => ipcRenderer.on('update-session', (_event, value) => callback(value))
    )
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.openExternal = shell.openExternal
    // @ts-ignore (define in dts)
  window.onUpdateSession = (callback) => ipcRenderer.on('update-session', (_event, value) => callback(value))
}