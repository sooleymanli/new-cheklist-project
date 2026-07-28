import { useCallback, useEffect, useRef, useState } from 'react';

export type AutosaveState = 'idle' | 'saving' | 'saved' | 'pending' | 'error';

interface DraftResponse {
  fieldId: string;
  locationId?: string;
  value?: any;
  notes?: string;
}

interface LocalDraft {
  cells: Record<string, Record<string, any>>;
  updatedAt: number;
  // `true` while the local copy has not yet been confirmed saved on the server.
  pending: boolean;
}

const STORAGE_PREFIX = 'checklist-draft:';
const DEBOUNCE_MS = 1200;

const keyFor = (instanceId: string) => `${STORAGE_PREFIX}${instanceId}`;

function readLocal(instanceId: string): LocalDraft | null {
  try {
    const raw = localStorage.getItem(keyFor(instanceId));
    return raw ? (JSON.parse(raw) as LocalDraft) : null;
  } catch {
    return null;
  }
}

function writeLocal(instanceId: string, draft: LocalDraft) {
  try {
    localStorage.setItem(keyFor(instanceId), JSON.stringify(draft));
  } catch {
    /* storage full / unavailable — ignore */
  }
}

function clearLocal(instanceId: string) {
  try {
    localStorage.removeItem(keyFor(instanceId));
  } catch {
    /* ignore */
  }
}

interface Options {
  instanceId: string;
  /** Only auto-save while the instance is still editable. */
  enabled: boolean;
  /** Becomes true once the form has been initialised from server data. */
  initialized: boolean;
  /** Current matrix values, watched from react-hook-form. */
  cellData: Record<string, Record<string, any>>;
  /** Builds the API payload from the current `cellData`. */
  buildResponses: () => DraftResponse[];
  /** Performs the actual network save. Must reject on failure. */
  save: (responses: DraftResponse[]) => Promise<unknown>;
  /** Called with locally-cached cells when an unsynced offline draft is found. */
  onRestore?: (cells: Record<string, Record<string, any>>) => void;
}

/**
 * Background auto-save for the matrix fill form.
 *
 * - Debounces edits and saves them silently (no navigation).
 * - Writes every change to localStorage immediately, so data survives reloads
 *   and offline use.
 * - When offline, keeps the draft marked `pending` and re-syncs automatically
 *   as soon as the connection returns.
 */
export function useChecklistAutosave({
  instanceId,
  enabled,
  initialized,
  cellData,
  buildResponses,
  save,
  onRestore,
}: Options) {
  const [state, setState] = useState<AutosaveState>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncedRef = useRef<string | null>(null);
  const restoredRef = useRef(false);
  // Keep the latest builder/save without re-arming the debounce effect.
  const buildRef = useRef(buildResponses);
  const saveRef = useRef(save);
  buildRef.current = buildResponses;
  saveRef.current = save;

  const flush = useCallback(async () => {
    if (!enabled) return;
    const responses = buildRef.current();
    const serialized = JSON.stringify(cellData);

    if (!navigator.onLine) {
      // Stay offline: data is already persisted locally as `pending`.
      setState('pending');
      return;
    }

    setState('saving');
    try {
      await saveRef.current(responses);
      lastSyncedRef.current = serialized;
      writeLocal(instanceId, { cells: cellData, updatedAt: Date.now(), pending: false });
      setLastSavedAt(Date.now());
      setState('saved');
    } catch {
      // Network/server error — keep the pending local copy for a later retry.
      setState('error');
    }
  }, [enabled, cellData, instanceId]);

  // Restore an unsynced offline draft once, after the form is initialised.
  useEffect(() => {
    if (!enabled || !initialized || restoredRef.current) return;
    restoredRef.current = true;
    const local = readLocal(instanceId);
    if (local?.pending && local.cells && Object.keys(local.cells).length > 0) {
      onRestore?.(local.cells);
    }
  }, [enabled, initialized, instanceId, onRestore]);

  // Debounced auto-save whenever the matrix changes.
  useEffect(() => {
    if (!enabled || !initialized) return;
    const serialized = JSON.stringify(cellData);

    // First run establishes the baseline (server state) without saving.
    if (lastSyncedRef.current === null) {
      lastSyncedRef.current = serialized;
      return;
    }
    if (serialized === lastSyncedRef.current) return;

    // Persist locally right away so nothing is lost if we go offline / reload.
    writeLocal(instanceId, { cells: cellData, updatedAt: Date.now(), pending: true });
    setState('pending');

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void flush();
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [cellData, enabled, initialized, instanceId, flush]);

  // Track connectivity and re-sync pending drafts when back online.
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      const local = readLocal(instanceId);
      if (local?.pending) void flush();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setState((s) => (s === 'saving' || s === 'pending' ? 'pending' : s));
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [instanceId, flush]);

  // Clears the local cache (e.g. after a successful manual save / submit).
  const clear = useCallback(() => clearLocal(instanceId), [instanceId]);

  return { state, lastSavedAt, isOnline, syncNow: flush, clear };
}
