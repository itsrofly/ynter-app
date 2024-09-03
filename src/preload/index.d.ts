import { shell } from 'electron'

declare global {
  interface Window {
    openExternal: shell.openExternal
    onUpdateSession: callback
    onPinCode: callback
    api: {
      Session(): Promise<string | undefined>
      googleOauth(): Promise<void>
      otpSign(email: string): Promise<any>
      Logout(): Promise<void>
      Database(query: string, params?: (string | number | null)[]): Promise<any>
      Utils(query: string, params?: (string | number | null)[]): Promise<any>
      sendPinCode(pin): void
      showError(content: string): void
      Server(): Promise<string | undefined>
      showOpenFile(): Promise<{ filename: string; data: string } | undefined>
      showCopyFile(file: string): Promise<string | undefined>
      showGetFile(): Promise<{ filename: string; file: string; filesize: number }>
      showSavefile(file: string): void
      deleteFile(file: string): void
    }
  }
}
