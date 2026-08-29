/// <reference types="vite/client" />

interface UpdateInfo {
  version: string;
}

interface DownloadProgress {
  percent: number;
}

interface ElectronAPI {
  checkForUpdates: () => Promise<unknown>;
  downloadUpdate: () => Promise<unknown>;
  installUpdate: () => void;
  onUpdateChecking: (callback: () => void) => () => void;
  onUpdateAvailable: (callback: (info: UpdateInfo) => void) => () => void;
  onUpdateNotAvailable: (callback: () => void) => () => void;
  onUpdateDownloadProgress: (callback: (progress: DownloadProgress) => void) => () => void;
  onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => () => void;
  onUpdateError: (callback: (message: string) => void) => () => void;
}

interface Window {
  electronAPI?: ElectronAPI;
}
