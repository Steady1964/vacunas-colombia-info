import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { makeLegacyFamily, seedLegacyDatabase } from '../test/legacyDatabase';
import { openDatabase, VaccineDb } from './db';
import type { FamilySnapshot } from './types';

let sequence = 0;
const databases: VaccineDb[] = [];
const names: string[] = [];
function testName(): string {
  const name = `test-storage-${++sequence}`;
  names.push(name);
  return name;
}
async function readPersistedFamily(db: VaccineDb): Promise<FamilySnapshot> {
  const [profiles, administrations, preferences, migrationIssues] =
    await Promise.all([
      db.profiles.toArray(),
      db.administrations.toArray(),
      db.preferences.toArray(),
      db.migrationIssues.toArray(),
    ]);
  return {
    profiles,
    administrations,
    preferences: preferences.filter(
      (preference) => preference.key !== 'internal:revision',
    ),
    migrationIssues,
    revision: Number(
      preferences.find((preference) => preference.key === 'internal:revision')
        ?.value ?? 0,
    ),
  };
}
afterEach(async () => {
  for (const db of databases.splice(0)) db.close();
  for (const name of names.splice(0)) await Dexie.delete(name);
});

describe('database opening and transactional schema upgrades', () => {
  it('creates only final tables without family examples', async () => {
    const db = await openDatabase(testName());
    databases.push(db);
    expect(db.tables.map((table) => table.name).sort()).toEqual([
      'administrations',
      'migrationIssues',
      'preferences',
      'profiles',
    ]);
    expect(await readPersistedFamily(db)).toEqual({
      profiles: [],
      administrations: [],
      preferences: [],
      migrationIssues: [],
      revision: 0,
    });
  });

  it('migrates the same database once and retains every old row after reopening', async () => {
    const name = testName();
    const legacy = makeLegacyFamily();
    await seedLegacyDatabase(name, legacy);
    const first = await openDatabase(name);
    databases.push(first);
    const snapshot = await readPersistedFamily(first);
    expect(
      snapshot.profiles.length +
        snapshot.migrationIssues.filter((issue) => issue.kind === 'profile')
          .length,
    ).toBe(legacy.profiles.length);
    expect(
      snapshot.administrations.length +
        snapshot.migrationIssues.filter(
          (issue) => issue.kind === 'administration',
        ).length,
    ).toBe(legacy.doses.length);
    expect(snapshot.revision).toBe(1);
    expect(first.tables.some((table) => table.name === 'doses')).toBe(false);
    first.close();
    const second = await openDatabase(name);
    databases.push(second);
    expect(await readPersistedFamily(second)).toEqual(snapshot);
  });

  it('rolls back the actual upgrade if an administration write fails', async () => {
    const name = testName();
    const legacy = makeLegacyFamily();
    await seedLegacyDatabase(name, legacy);
    const upgrading = new VaccineDb(name);
    databases.push(upgrading);
    upgrading.administrations.hook('creating', () => {
      throw new Error('injected-upgrade-failure');
    });
    await expect(upgrading.open()).rejects.toThrow('injected-upgrade-failure');
    upgrading.close();
    const old = new Dexie(name);
    old
      .version(1)
      .stores({ profiles: 'id, name', doses: 'id, profileId, date' });
    try {
      await old.open();
      expect(
        (await old.table('profiles').toArray()).sort((a, b) =>
          a.id.localeCompare(b.id),
        ),
      ).toEqual(
        [...legacy.profiles].sort((a, b) =>
          String(a.id).localeCompare(String(b.id)),
        ),
      );
      expect(
        (await old.table('doses').toArray()).sort((a, b) =>
          a.id.localeCompare(b.id),
        ),
      ).toEqual(
        [...legacy.doses].sort((a, b) =>
          String(a.id).localeCompare(String(b.id)),
        ),
      );
    } finally {
      old.close();
    }
  });

  it('rejects a blocked upgrade without deleting or opening an alternative database', async () => {
    const name = testName();
    await seedLegacyDatabase(name, makeLegacyFamily());
    const old = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(name, 10);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      await expect(openDatabase(name)).rejects.toThrow('storage-blocked');
    } finally {
      old.close();
    }
    const migrated = await openDatabase(name);
    databases.push(migrated);
    expect(
      (await readPersistedFamily(migrated)).profiles.length,
    ).toBeGreaterThan(0);
  });

  it('reports unavailable IndexedDB without a fallback family', async () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB');
    Object.defineProperty(globalThis, 'indexedDB', {
      configurable: true,
      value: undefined,
    });
    try {
      await expect(openDatabase(testName())).rejects.toThrow(
        'storage-unavailable',
      );
    } finally {
      if (original) Object.defineProperty(globalThis, 'indexedDB', original);
    }
  });
});
