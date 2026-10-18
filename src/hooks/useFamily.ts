'use client';

import { useEffect, useState } from 'react';
import { liveQuery } from 'dexie';
import { openDatabase, type VaccineDb } from '../lib/db';
import { readFamily } from '../lib/repository';
import type { FamilySnapshot } from '../lib/types';

type FamilyState = {
  status: 'loading' | 'ready' | 'error' | 'blocked';
  db: VaccineDb | null;
  snapshot: FamilySnapshot | null;
  errorCode?: string;
};

export function useFamily(): FamilyState {
  const [state, setState] = useState<FamilyState>({
    status: 'loading',
    db: null,
    snapshot: null,
  });

  useEffect(() => {
    let disposed = false;
    let interrupted = false;
    let database: VaccineDb | null = null;
    let subscription: { unsubscribe(): void } | undefined;

    const onVersionChange = () => {
      interrupted = true;
      subscription?.unsubscribe();
      database?.close();
      if (!disposed)
        setState((previous) => ({
          ...previous,
          status: 'blocked',
          errorCode: 'storage-version-changed',
        }));
    };

    void openDatabase()
      .then((db) => {
        if (disposed) {
          db.close();
          return;
        }
        database = db;
        db.on('versionchange', onVersionChange);
        subscription = liveQuery(() => readFamily(db)).subscribe({
          next(snapshot) {
            if (!disposed && !interrupted)
              setState({ status: 'ready', db, snapshot });
          },
          error() {
            if (!disposed && !interrupted)
              setState((previous) => ({
                ...previous,
                status: 'error',
                db,
                errorCode: 'storage-read-failed',
              }));
          },
        });
      })
      .catch((error) => {
        if (disposed) return;
        const blocked =
          error instanceof Error && error.message === 'storage-blocked';
        setState((previous) => ({
          ...previous,
          status: blocked ? 'blocked' : 'error',
          errorCode: blocked
            ? 'storage-blocked'
            : error instanceof Error && error.message === 'storage-unavailable'
              ? 'storage-unavailable'
              : 'storage-open-failed',
        }));
      });

    return () => {
      disposed = true;
      subscription?.unsubscribe();
      database?.on('versionchange').unsubscribe(onVersionChange);
      database?.close();
    };
  }, []);

  return state;
}
