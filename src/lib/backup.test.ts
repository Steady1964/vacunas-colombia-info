import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ADMIN_A,
  CHILD_A,
  CHILD_B,
  FIXED_NOW,
  FIXED_TODAY,
  makeAdministration,
  makeProfile,
} from '../test/fixtures';
import { makeLegacyFamily } from '../test/legacyDatabase';
import {
  applyImport,
  parseBackup,
  previewImport,
  serializeBackup,
} from './backup';
import { openDatabase, REVISION_KEY, type VaccineDb } from './db';
import { readFamily, saveAdministration, setPreference } from './repository';
import {
  CURRENT_CATALOG_VERSION,
  HISTORICAL_CATALOG_VERSION,
  getCatalog,
} from '../data/catalog';
import type { BackupV2, FamilySnapshot, ImportContext } from './types';

let sequence = 0;
let name: string;
let db: VaccineDb;
const context: ImportContext = { today: FIXED_TODAY, now: FIXED_NOW };
const empty: FamilySnapshot = {
  profiles: [],
  administrations: [],
  preferences: [],
  migrationIssues: [],
  revision: 0,
};
function makeFamily(): FamilySnapshot {
  return {
    profiles: [makeProfile()],
    administrations: [
      makeAdministration({
        brand: 'Marca',
        lot: 'Lote',
        provider: 'IPS',
        notes: 'Observación',
        doseNumber: 1,
        milestoneId: 'primary-1',
      }),
    ],
    preferences: [
      { key: 'activeProfileId', value: CHILD_A },
      { key: `optional-products:${CHILD_A}`, value: ['rotateq'] },
    ],
    migrationIssues: [],
    revision: 0,
  };
}
function textOf(snapshot: FamilySnapshot): string {
  const { revision: omittedRevision, ...family } = snapshot;
  return JSON.stringify({ formatVersion: 2, exportedAt: FIXED_NOW, ...family });
}
async function seed(snapshot: FamilySnapshot): Promise<void> {
  await db.transaction(
    'rw',
    db.profiles,
    db.administrations,
    db.preferences,
    db.migrationIssues,
    async () => {
      await db.profiles.bulkPut(snapshot.profiles);
      await db.administrations.bulkPut(snapshot.administrations);
      await db.preferences.bulkPut(snapshot.preferences);
      await db.migrationIssues.bulkPut(snapshot.migrationIssues);
      await db.preferences.put({ key: REVISION_KEY, value: snapshot.revision });
    },
  );
}
beforeEach(async () => {
  name = `test-backup-${++sequence}`;
  db = await openDatabase(name);
});
afterEach(async () => {
  db.close();
  await Dexie.delete(name);
});

describe('private validated v2 backups', () => {
  it.each([false, true])(
    'restores a laboratory-rejected hexavalent, retaining legacy provenance: %s',
    async (withLegacy) => {
      const rejected = makeAdministration({
        productId: 'hexavalent-acellular',
        productName: 'Hexaxim',
        brand: 'Sanofi',
        doseNumber: 1,
        milestoneId: 'primary-1',
        appliedDate: '2026-08-25',
        coveredRequirementIds: [],
        coverageStatus: 'needs-review',
        reviewReasons: ['unidentified-product'],
        lot: 'BACKUP-LOT',
        provider: 'IPS de prueba',
        notes: 'Texto original',
        ...(withLegacy
          ? {
              legacy: {
                raw: { vaccine: 'Nombre anterior', date: '2026-08-25' },
                migratedAt: FIXED_NOW,
                generatedTimestamps: false,
              },
            }
          : {}),
      });
      const snapshot: FamilySnapshot = {
        ...empty,
        profiles: [makeProfile({ birthDate: '2026-07-10' })],
        administrations: [rejected],
      };
      const text = textOf(snapshot);
      const expected = {
        ...rejected,
        coverageStatus: 'verified',
        coveredRequirementIds: ['penta-1', 'ipv-1'],
        reviewReasons: [],
      };
      expect(parseBackup(text, context).administrations).toEqual([expected]);
      const preview = previewImport(text, await readFamily(db), context);
      await applyImport(db, preview, 'merge');
      const restored = await readFamily(db);
      expect(restored.administrations).toEqual([expected]);
      expect(
        parseBackup(serializeBackup(restored, FIXED_NOW), context)
          .administrations,
      ).toEqual([expected]);
    },
  );

  it('roundtrips all captured fields, pending profiles, issues and raw metadata without exporting revision', async () => {
    const migrated = parseBackup(JSON.stringify(makeLegacyFamily()), context);
    migrated.preferences = [
      { key: 'activeProfileId', value: CHILD_A },
      { key: `optional-products:${CHILD_A}`, value: ['rotateq'] },
    ];
    const snapshot: FamilySnapshot = { ...migrated, revision: 22 };
    const serialized = serializeBackup(snapshot, FIXED_NOW);
    expect(serialized).not.toContain('internal:revision');
    expect(JSON.parse(serialized)).not.toHaveProperty('revision');
    expect(parseBackup(serialized, context)).toEqual(migrated);
    const preview = previewImport(serialized, await readFamily(db), context);
    await applyImport(db, preview, 'replace');
    const restored = await readFamily(db);
    expect(restored.profiles).toEqual(
      [...snapshot.profiles].sort((a, b) => a.id.localeCompare(b.id)),
    );
    expect(restored.administrations).toEqual(
      [...snapshot.administrations].sort((a, b) => a.id.localeCompare(b.id)),
    );
    expect(restored.migrationIssues).toEqual(
      [...snapshot.migrationIssues].sort((a, b) => a.id.localeCompare(b.id)),
    );
    expect(restored.revision).toBe(1);
    const repeated = previewImport(serialized, restored, context);
    expect(repeated.conflicts).toEqual([]);
    expect(repeated.added).toEqual({
      profiles: 0,
      administrations: 0,
      migrationIssues: 0,
    });
    await applyImport(db, repeated, 'merge');
    expect((await readFamily(db)).administrations).toEqual(
      restored.administrations,
    );
    expect((await readFamily(db)).revision).toBe(2);
  });

  it('ignores only migration-generated clocks when the same v1 file is imported again', async () => {
    const text = JSON.stringify(makeLegacyFamily());
    await applyImport(
      db,
      previewImport(text, await readFamily(db), context),
      'merge',
    );
    const local = await readFamily(db);
    const later = { today: '2026-10-18', now: '2026-10-18T15:00:00.000Z' };
    const second = previewImport(text, local, later);
    expect(second.conflicts).toEqual([]);
    expect(second.identical).toEqual({
      profiles: local.profiles.length,
      administrations: local.administrations.length,
      migrationIssues: local.migrationIssues.length,
    });
    await applyImport(db, second, 'merge');
    const after = await readFamily(db);
    expect(after.profiles).toEqual(local.profiles);
    expect(after.administrations).toEqual(local.administrations);
    expect(after.migrationIssues).toEqual(local.migrationIssues);
  });

  it('does not turn an unchanged legacy application into a conflict when its future date becomes today', async () => {
    const legacy = makeLegacyFamily();
    legacy.doses[0].date = '2026-10-17';
    const text = JSON.stringify(legacy);
    await applyImport(
      db,
      previewImport(text, await readFamily(db), context),
      'merge',
    );
    const before = await readFamily(db);
    expect(
      before.administrations.find((record) => record.id === ADMIN_A)
        ?.reviewReasons,
    ).toContain('future-date');
    const nextDay = { today: '2026-10-17', now: '2026-10-17T15:00:00.000Z' };
    const repeated = previewImport(text, before, nextDay);
    expect(repeated.conflicts).toEqual([]);
    await applyImport(db, repeated, 'merge');
    expect((await readFamily(db)).administrations).toEqual(
      before.administrations,
    );
    await db.administrations.update(ADMIN_A, {
      lot: 'Corrección real del lote',
    });
    const changed = await readFamily(db);
    expect(previewImport(text, changed, nextDay).conflicts).toContainEqual({
      entity: 'administration',
      id: ADMIN_A,
    });
  });

  it('detects a genuine local review rather than downgrading it from the old v1 file', async () => {
    const text = JSON.stringify(makeLegacyFamily());
    await applyImport(
      db,
      previewImport(text, await readFamily(db), context),
      'merge',
    );
    await saveAdministration(
      db,
      {
        id: ADMIN_A,
        childId: CHILD_A,
        mode: 'edit',
        input: {
          productId: 'hexavalent-acellular',
          productName: 'Hexavalente confirmada',
          appliedDate: '2026-03-14',
          doseNumber: 1,
          milestoneId: 'primary-1',
          accessType: 'private',
          paiwebStatus: 'unknown',
        },
      },
      { ...context, catalog: getCatalog(CURRENT_CATALOG_VERSION)! },
    );
    const before = await readFamily(db);
    const preview = previewImport(text, before, {
      today: '2026-10-17',
      now: '2026-10-17T15:00:00.000Z',
    });
    expect(preview.conflicts).toContainEqual({
      entity: 'administration',
      id: ADMIN_A,
    });
    await expect(applyImport(db, preview, 'merge')).rejects.toThrow(
      'conflicting-import',
    );
    expect(await readFamily(db)).toEqual(before);
    expect(
      before.administrations.find((record) => record.id === ADMIN_A)
        ?.coverageStatus,
    ).toBe('verified');
  });

  it('normalizes object keys and coverage/reason set order, but not timestamps captured by the family', () => {
    const family = makeFamily();
    const verified = makeAdministration({
      productId: 'hexavalent-acellular',
      doseNumber: 1,
      milestoneId: 'primary-1',
      coverageStatus: 'verified',
      coveredRequirementIds: ['penta-1', 'ipv-1'],
      reviewReasons: [],
      legacy: {
        raw: {
          nested: { b: 2, a: 1 },
          createdAt: FIXED_NOW,
          updatedAt: FIXED_NOW,
        },
        generatedTimestamps: false,
        migratedAt: FIXED_NOW,
      },
    });
    family.administrations = [verified];
    const reversed = structuredClone(family);
    reversed.administrations[0].coveredRequirementIds.reverse();
    reversed.administrations[0].legacy!.raw.nested = { a: 1, b: 2 };
    expect(previewImport(textOf(reversed), family, context).conflicts).toEqual(
      [],
    );
    reversed.administrations[0].updatedAt = '2026-10-16T16:00:00.000Z';
    expect(
      previewImport(textOf(reversed), family, context).conflicts,
    ).toContainEqual({ entity: 'administration', id: ADMIN_A });
  });

  it('preserves original coverage as review provenance when the catalog cannot be verified', () => {
    const family = makeFamily();
    family.profiles[0].referenceCatalogVersion = 'unavailable-catalog';
    const verified = makeAdministration({
      productId: 'hexavalent-acellular',
      doseNumber: 1,
      milestoneId: 'primary-1',
      coveredRequirementIds: ['penta-1', 'ipv-1'],
      coverageStatus: 'verified',
      reviewReasons: [],
    });
    family.administrations = [verified];
    const incoming = parseBackup(textOf(family), context);
    expect(incoming.administrations[0]).toMatchObject({
      coverageStatus: 'needs-review',
      coveredRequirementIds: [],
      reviewReasons: ['unverified-rule'],
      legacy: { raw: { importedRecord: verified } },
    });
    const current = {
      ...empty,
      profiles: incoming.profiles,
      administrations: incoming.administrations,
    };
    expect(
      previewImport(textOf(family), current, {
        ...context,
        now: '2026-10-17T15:00:00.000Z',
      }).conflicts,
    ).toEqual([]);
  });

  it('roundtrips a verified application after its profile switches to the historical reference', () => {
    const family = makeFamily();
    family.profiles = [
      makeProfile({
        primaryScheduleId: 'CO-PAI-PRIMARY-2-4-6',
        referenceCatalogVersion: HISTORICAL_CATALOG_VERSION,
      }),
    ];
    const verified = makeAdministration({
      productId: 'hexavalent-acellular',
      productName: 'Hexavalente acelular (DTPa-HB-IPV-Hib)',
      brand: 'Hexaxim',
      doseNumber: 1,
      milestoneId: 'primary-1',
      coveredRequirementIds: ['penta-1', 'ipv-1'],
      coverageStatus: 'verified',
      reviewReasons: [],
    });
    family.administrations = [verified];

    const serialized = serializeBackup(family, FIXED_NOW);
    expect(parseBackup(serialized, context).administrations).toEqual([
      verified,
    ]);
    expect(previewImport(serialized, family, context).conflicts).toEqual([]);
  });

  it('exports a birth-change contradiction explicitly for review without mutating stored history or causing repeat conflicts', async () => {
    const family = makeFamily();
    family.profiles[0].birthDate = '2026-04-01';
    const original = structuredClone(family);
    const restored = parseBackup(serializeBackup(family, FIXED_NOW), context);
    expect(family).toEqual(original);
    expect(restored.administrations[0].reviewReasons).toContain('before-birth');
    expect(restored.administrations[0].legacy?.raw.importedRecord).toEqual(
      original.administrations[0],
    );
    const firstPreview = previewImport(
      serializeBackup(family, FIXED_NOW),
      family,
      context,
    );
    expect(firstPreview.conflicts).toEqual([]);
    await applyImport(
      db,
      previewImport(
        serializeBackup(family, FIXED_NOW),
        await readFamily(db),
        context,
      ),
      'replace',
    );
    const current = await readFamily(db);
    expect(
      previewImport(
        serializeBackup(family, '2026-10-17T15:00:00.000Z'),
        current,
        context,
      ).conflicts,
    ).toEqual([]);
    expect(
      previewImport(serializeBackup(current, FIXED_NOW), current, context)
        .conflicts,
    ).toEqual([]);
    const modified = structuredClone(current);
    modified.administrations[0].lot = 'Cambio real';
    expect(
      previewImport(serializeBackup(family, FIXED_NOW), modified, context)
        .conflicts,
    ).toContainEqual({ entity: 'administration', id: ADMIN_A });
  });

  it.each([
    ['invalid JSON', () => '{', 'invalid-json'],
    [
      'future format',
      () => JSON.stringify({ formatVersion: 99 }),
      'unsupported-backup-version',
    ],
    [
      'impossible date',
      () => {
        const family = makeFamily();
        family.administrations[0].appliedDate = '2026-02-30';
        return textOf(family);
      },
      'invalid-backup',
    ],
    [
      'future application',
      () => {
        const family = makeFamily();
        family.administrations[0].appliedDate = '2099-01-01';
        return textOf(family);
      },
      'future-date',
    ],
    [
      'before birth',
      () => {
        const family = makeFamily();
        family.administrations[0].appliedDate = '2026-01-01';
        return textOf(family);
      },
      'before-birth',
    ],
    [
      'unsupported date exception',
      () => {
        const family = makeFamily();
        family.administrations[0].appliedDate = '2026-01-01';
        family.administrations[0].reviewReasons = ['before-birth'];
        family.administrations[0].legacy = {
          raw: { id: 'another-id', date: '2026-01-01', profileId: CHILD_A },
          migratedAt: FIXED_NOW,
          generatedTimestamps: false,
        };
        return textOf(family);
      },
      'before-birth',
    ],
    [
      'future birth',
      () => {
        const family = makeFamily();
        family.profiles[0].birthDate = '2099-01-01';
        return textOf(family);
      },
      'future-date',
    ],
    [
      'duplicate profile ID',
      () => {
        const family = makeFamily();
        family.profiles.push(makeProfile());
        return textOf(family);
      },
      'duplicate-id',
    ],
    [
      'duplicate application ID',
      () => {
        const family = makeFamily();
        family.administrations.push(makeAdministration());
        return textOf(family);
      },
      'duplicate-id',
    ],
    [
      'orphan application',
      () => {
        const family = makeFamily();
        family.profiles = [];
        family.preferences = [];
        return textOf(family);
      },
      'missing-profile',
    ],
    [
      'false coverage',
      () => {
        const family = makeFamily();
        family.administrations = [
          makeAdministration({
            productId: 'hexavalent-acellular',
            doseNumber: 1,
            milestoneId: 'primary-1',
            coverageStatus: 'verified',
            reviewReasons: [],
            coveredRequirementIds: ['penta-2'],
          }),
        ];
        return textOf(family);
      },
      'invalid-coverage',
    ],
  ])('rejects %s without touching IndexedDB', async (_label, source, code) => {
    await seed(makeFamily());
    const before = await readFamily(db);
    expect(() => previewImport(source(), before, context)).toThrow(code);
    expect(await readFamily(db)).toEqual(before);
  });

  it('keeps preview/cancellation pure and rejects a preview made stale by another committed mutation', async () => {
    await seed(makeFamily());
    const before = await readFamily(db);
    const preview = previewImport(
      textOf({
        ...makeFamily(),
        profiles: [makeProfile(), makeProfile({ id: CHILD_B })],
      }),
      before,
      context,
    );
    expect(await readFamily(db)).toEqual(before);
    await setPreference(db, `optional-products:${CHILD_A}`, []);
    const changed = await readFamily(db);
    await expect(applyImport(db, preview, 'replace')).rejects.toThrow(
      'stale-preview',
    );
    expect(await readFamily(db)).toEqual(changed);
  });

  it('aborts the complete merge on one ID conflict, including reassigned child ownership', async () => {
    const current = makeFamily();
    await seed(current);
    const incoming = makeFamily();
    incoming.profiles.push(makeProfile({ id: CHILD_B, nickname: 'Sol' }));
    incoming.administrations[0].childId = CHILD_B;
    incoming.administrations.push(
      makeAdministration({ id: 'new-application', childId: CHILD_B }),
    );
    const before = await readFamily(db);
    const preview = previewImport(textOf(incoming), before, context);
    expect(preview.conflicts).toContainEqual({
      entity: 'administration',
      id: ADMIN_A,
    });
    await expect(applyImport(db, preview, 'merge')).rejects.toThrow(
      'conflicting-import',
    );
    expect(await readFamily(db)).toEqual(before);
  });

  it('retains nonclinical local preferences on merge and keeps revision local on replace', async () => {
    await seed({ ...makeFamily(), revision: 35 });
    const incoming = makeFamily();
    incoming.profiles.push(makeProfile({ id: CHILD_B }));
    incoming.preferences = [{ key: 'activeProfileId', value: CHILD_B }];
    const before = await readFamily(db);
    await applyImport(
      db,
      previewImport(textOf(incoming), before, context),
      'merge',
    );
    expect((await db.preferences.get('activeProfileId'))?.value).toBe(CHILD_A);
    expect((await readFamily(db)).revision).toBe(36);
    const replacement: FamilySnapshot = {
      ...empty,
      profiles: [makeProfile({ id: CHILD_B })],
      preferences: [{ key: 'activeProfileId', value: CHILD_A }],
    };
    await applyImport(
      db,
      previewImport(textOf(replacement), await readFamily(db), context),
      'replace',
    );
    const after = await readFamily(db);
    expect(after.revision).toBe(37);
    expect(after.profiles.map((profile) => profile.id)).toEqual([CHILD_B]);
    expect(after.preferences).toContainEqual({
      key: 'activeProfileId',
      value: CHILD_B,
    });
  });

  it('rolls back deletion and every imported row if replace fails after clearing', async () => {
    await seed(makeFamily());
    const before = await readFamily(db);
    const replacement = { ...empty, profiles: [makeProfile({ id: CHILD_B })] };
    const preview = previewImport(textOf(replacement), before, context);
    const fail = (unusedKey: string, record: { id: string }) => {
      if (record.id === CHILD_B)
        throw new Error('injected-import-write-failure');
    };
    db.profiles.hook('creating', fail);
    try {
      await expect(applyImport(db, preview, 'replace')).rejects.toThrow(
        'injected-import-write-failure',
      );
    } finally {
      db.profiles.hook('creating').unsubscribe(fail);
    }
    expect(await readFamily(db)).toEqual(before);
  });

  it('treats a repaired row and its old issue as a conflict rather than a new independent identity', () => {
    const local = makeFamily();
    const incoming: BackupV2 = {
      formatVersion: 2,
      exportedAt: FIXED_NOW,
      profiles: [makeProfile()],
      administrations: [],
      preferences: [],
      migrationIssues: [
        {
          id: `administration:${ADMIN_A}`,
          kind: 'administration',
          entityId: ADMIN_A,
          childId: CHILD_A,
          raw: { id: ADMIN_A, date: 'invalid' },
          reasons: ['invalid-date'],
          migratedAt: FIXED_NOW,
        },
      ],
    };
    expect(
      previewImport(JSON.stringify(incoming), local, context).conflicts,
    ).toContainEqual({ entity: 'administration', id: ADMIN_A });
  });
});
