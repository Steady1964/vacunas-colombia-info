import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeLegacyFamily, seedLegacyDatabase } from '../test/legacyDatabase';
import { openDatabase, VaccineDb } from './db';
import type { FamilySnapshot } from './types';
import { CURRENT_CATALOG_VERSION, getCatalog } from '../data/catalog';
import { FIXED_NOW, makeAdministration, makeProfile } from '../test/fixtures';
import type { ChildProfile, VaccineAdministration } from './types';
import { calculateSchedule } from './schedule/calculateSchedule';
import { resolveCoverage } from './schedule/resolveCoverage';
import { summarizeSchedule } from './schedule/summarizeSchedule';

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

describe('repairing laboratory-only brand rejections', () => {
  const profile = makeProfile({ birthDate: '2026-07-10' });
  const rejected = makeAdministration({
    productId: 'hexavalent-acellular',
    productName: 'Hexaxim',
    brand: 'Sanofi',
    doseNumber: 1,
    milestoneId: 'primary-1',
    appliedDate: '2026-08-25',
    lot: 'TEST-LOT',
    provider: 'IPS de prueba',
    notes: 'Conservar todos los datos capturados',
    coverageStatus: 'needs-review',
    coveredRequirementIds: [],
    reviewReasons: ['unidentified-product'],
  });

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(FIXED_NOW);
  });
  afterEach(() => vi.useRealTimers());

  async function seedVersionThree(
    name: string,
    record: VaccineAdministration = rejected,
    savedProfile: ChildProfile = profile,
  ) {
    const old = new Dexie(name);
    old.version(3).stores({
      profiles: 'id, nickname',
      administrations: 'id, childId, appliedDate',
      preferences: 'key',
      migrationIssues: 'id, kind, childId',
    });
    try {
      await old.open();
      await old.table('profiles').put(savedProfile);
      await old.table('administrations').put(record);
      await old
        .table('preferences')
        .put({ key: 'internal:revision', value: 20 });
    } finally {
      old.close();
    }
  }

  it.each([false, true])(
    'repairs existing coverage once, retaining legacy provenance: %s',
    async (withLegacy) => {
      const record = {
        ...rejected,
        ...(withLegacy
          ? {
              legacy: {
                raw: { vaccine: 'Nombre anterior', date: '2026-08-25' },
                migratedAt: FIXED_NOW,
                generatedTimestamps: false,
              },
            }
          : {}),
      };
      const name = testName();
      await seedVersionThree(name, record);
      const db = await openDatabase(name);
      databases.push(db);
      const snapshot = await readPersistedFamily(db);
      const repaired = snapshot.administrations[0];
      expect(repaired).toEqual({
        ...record,
        coverageStatus: 'verified',
        coveredRequirementIds: ['penta-1', 'ipv-1'],
        reviewReasons: [],
      });
      expect(snapshot.revision).toBe(21);
      const catalog = getCatalog(CURRENT_CATALOG_VERSION)!;
      const schedule = calculateSchedule(profile, catalog, '2026-10-16', []);
      const summary = summarizeSchedule(
        schedule,
        resolveCoverage(profile, [repaired], schedule, catalog, '2026-10-16'),
        '2026-10-16',
      );
      expect(
        summary.items
          .filter((row) => row.status === 'applied')
          .map((row) => row.id)
          .sort(),
      ).toEqual(['ipv-1', 'penta-1']);
      db.close();
      const reopened = await openDatabase(name);
      databases.push(reopened);
      expect(await readPersistedFamily(reopened)).toEqual(snapshot);
    },
  );

  const unresolvedCases: {
    name: string;
    record?: Partial<VaccineAdministration>;
    profile?: Partial<ChildProfile>;
  }[] = [
    { name: 'manual biologic', record: { productId: 'unidentified' } },
    { name: 'missing stage', record: { milestoneId: undefined } },
    { name: 'known contradictory brand', record: { brand: 'Rotarix' } },
    {
      name: 'another unresolved reason',
      record: { reviewReasons: ['unidentified-product', 'unidentified-stage'] },
    },
    {
      name: 'unconfirmed legacy provenance',
      record: {
        reviewReasons: ['legacy-unconfirmed', 'unidentified-product'],
        legacy: {
          raw: { product: 'Hexaxim' },
          migratedAt: FIXED_NOW,
          generatedTimestamps: false,
        },
      },
    },
    { name: 'before birth', record: { appliedDate: '2026-07-09' } },
    { name: 'future date', record: { appliedDate: '2099-01-01' } },
    { name: 'invalid date', record: { appliedDate: '2026-02-30' } },
    { name: 'missing profile', record: { childId: 'other-child' } },
    {
      name: 'unavailable catalog',
      profile: { referenceCatalogVersion: 'missing' },
    },
    { name: 'not a brand rejection', record: { brand: 'Hexaxim' } },
    {
      name: 'already verified snapshot',
      record: {
        coverageStatus: 'verified',
        reviewReasons: [],
        coveredRequirementIds: ['penta-1', 'ipv-1'],
      },
    },
  ];
  it.each(unresolvedCases)(
    'does not promote or rewrite $name',
    async (entry) => {
      const name = testName();
      const record = { ...rejected, ...entry.record };
      const savedProfile = { ...profile, ...entry.profile };
      await seedVersionThree(name, record, savedProfile);
      const db = await openDatabase(name);
      databases.push(db);
      expect(await db.administrations.get(record.id)).toEqual(record);
      expect((await readPersistedFamily(db)).revision).toBe(20);
    },
  );

  it('rolls back the repaired application if its revision write fails', async () => {
    const name = testName();
    await seedVersionThree(name);
    const upgrading = new VaccineDb(name);
    databases.push(upgrading);
    upgrading.preferences.hook('updating', () => {
      throw new Error('injected-brand-repair-failure');
    });
    await expect(upgrading.open()).rejects.toThrow(
      'injected-brand-repair-failure',
    );
    upgrading.close();
    const old = new Dexie(name);
    old.version(3).stores({
      profiles: 'id, nickname',
      administrations: 'id, childId, appliedDate',
      preferences: 'key',
      migrationIssues: 'id, kind, childId',
    });
    try {
      await old.open();
      expect(await old.table('administrations').get(rejected.id)).toEqual(
        rejected,
      );
      expect(await old.table('preferences').get('internal:revision')).toEqual({
        key: 'internal:revision',
        value: 20,
      });
    } finally {
      old.close();
    }
  });
});
