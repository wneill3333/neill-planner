import { useRegisterSW } from 'virtual:pwa-register/react';

export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm rounded-lg bg-white p-4 shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <p className="text-sm text-gray-700 dark:text-gray-200">
        A new version is available.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => updateServiceWorker(true)}
          className="rounded-md bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600"
        >
          Update
        </button>
        <button
          onClick={() => setNeedRefresh(false)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
