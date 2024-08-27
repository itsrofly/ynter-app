import { ElectronAPI } from '@electron-toolkit/preload'
import { shell } from 'electron'

declare global {
  interface Window {
    openExternal: shell.openExternal,
    onUpdateSession:(callback),
    api: {
      Database(query: string, params?: any[]): any,
      showError(content: string): void,
      Server(): Promise<string | undefined>,
      showOpenFile(): Promise<{filename: string, data: string} | undefined>,
      showCopyFile(file: string): Promise<string | undefined>,
      showGetFile(): Promise<{filename: string, file: string, filesize: number}>,
      ShowSavefile(file: string): void,
      DeleteFile(file: string): void
    }
  }
}
