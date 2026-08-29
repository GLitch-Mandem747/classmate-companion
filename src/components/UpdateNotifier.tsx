import { useEffect, useState } from 'react';
import { Download, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error';

export function UpdateNotifier() {
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [version, setVersion] = useState('');
  const [error, setError] = useState('');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    const cleanups = [
      api.onUpdateChecking(() => setStatus('checking')),
      api.onUpdateAvailable((info) => {
        setVersion(info.version);
        setStatus('available');
        setDismissed(false);
      }),
      api.onUpdateNotAvailable(() => setStatus('idle')),
      api.onUpdateDownloadProgress(() => setStatus('downloading')),
      api.onUpdateDownloaded((info) => {
        setVersion(info.version);
        setStatus('downloaded');
        setDismissed(false);
      }),
      api.onUpdateError((message) => {
        setError(message);
        setStatus('error');
      }),
    ];

    api.checkForUpdates();

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  if (!window.electronAPI || dismissed) return null;
  if (status === 'idle' || status === 'checking') return null;

  const handleDownload = async () => {
    setError('');
    await window.electronAPI?.downloadUpdate();
  };

  const handleInstall = () => {
    window.electronAPI?.installUpdate();
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] max-w-sm rounded-lg border border-border bg-card p-4 shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          {status === 'available' && (
            <>
              <p className="text-sm font-semibold">Update available</p>
              <p className="text-xs text-muted-foreground">
                Version {version} is ready to download.
              </p>
            </>
          )}
          {status === 'downloading' && (
            <>
              <p className="text-sm font-semibold">Downloading update…</p>
              <p className="text-xs text-muted-foreground">Please keep the app open.</p>
            </>
          )}
          {status === 'downloaded' && (
            <>
              <p className="text-sm font-semibold">Update ready</p>
              <p className="text-xs text-muted-foreground">
                Version {version} will install when you restart.
              </p>
            </>
          )}
          {status === 'error' && (
            <>
              <p className="text-sm font-semibold">Update check failed</p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setDismissed(true)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-3 flex gap-2">
        {status === 'available' && (
          <Button size="sm" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        )}
        {status === 'downloaded' && (
          <Button size="sm" onClick={handleInstall}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Restart &amp; Install
          </Button>
        )}
        {status === 'error' && (
          <Button size="sm" variant="outline" onClick={() => window.electronAPI?.checkForUpdates()}>
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}
