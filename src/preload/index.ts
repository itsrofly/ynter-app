import { contextBridge, ipcRenderer, shell } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
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
  // Save file, see main
  ShowSavefile: (file: string): Promise<void> => ipcRenderer.invoke('Show:savefile', file),
  DeleteFile: (file: string): Promise<void> => ipcRenderer.invoke('Delete:file', file),
  Server: (): Promise<string | undefined> => ipcRenderer.invoke('Server:start')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('openExternal', shell.openExternal)
    contextBridge.exposeInMainWorld('onUpdateSession', (callback) =>
      ipcRenderer.on('update-session', (_event, value) => callback(value))
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
  window.onUpdateSession = (callback): callback =>
    ipcRenderer.on('update-session', (_event, value) => callback(value))
}
