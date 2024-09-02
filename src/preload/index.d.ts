import { shell } from 'electron'

declare global {
  interface Window {
    openExternal: shell.openExternal
    onUpdateSession: callback
    onPinCode: callback
    api: {
      Database(query: string, params?: (string | number | null)[]): Promise<any>
      Utils(query: string, params?: (string | number | null)[]): Promise<any>
      sendPinCode(pin): void
      showError(content: string): void
      Server(): Promise<string | undefined>
      showOpenFile(): Promise<{ filename: string; data: string } | undefined>
      showCopyFile(file: string): Promise<string | undefined>
      showGetFile(): Promise<{ filename: string; file: string; filesize: number }>
      showSavefile(file: string): void
      DeleteFile(file: string): void
    }
  }
}
