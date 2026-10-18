import Dexie, { type Table } from 'dexie';
import { migrateLegacyFamily } from './migration';
import type {
  JsonObject,
  LocalPreference,
  MigrationIssue,
  StoredProfile,
  VaccineAdministration,
} from './types';

export const REVISION_KEY = 'internal:revision';

export class VaccineDb extends Dexie {
  profiles!: Table<StoredProfile, string>;
  administrations!: Table<VaccineAdministration, string>;
  preferences!: Table<LocalPreference, string>;
  migrationIssues!: Table<MigrationIssue, string>;

  constructor(name = 'vacunas-colombia') {
    super(name);
    this.version(1).stores({
      profiles: 'id, name',
      doses: 'id, profileId, date',
    });
    this.version(2)
      .stores({
        profiles: 'id, nickname',
        doses: 'id, profileId, date',
        administrations: 'id, childId, appliedDate',
        preferences: 'key',
        migrationIssues: 'id, kind, childId',
      })
      .upgrade(async (transaction) => {
        const profiles = await transaction
          .table<JsonObject>('profiles')
          .toArray();
        const doses = await transaction.table<JsonObject>('doses').toArray();
        const migrated = migrateLegacyFamily(
          { version: 1, profiles, doses },
          new Date().toISOString(),
        );
        await transaction.table('profiles').clear();
        await transaction.table('profiles').bulkPut(migrated.profiles);
        await transaction
          .table('administrations')
          .bulkPut(migrated.administrations);
        await transaction
          .table('migrationIssues')
          .bulkPut(migrated.migrationIssues);
        await transaction
          .table('preferences')
          .put({ key: REVISION_KEY, value: 1 });
      });
    this.version(3).stores({ doses: null });
  }
}

export async function openDatabase(
  name = 'vacunas-colombia',
): Promise<VaccineDb> {
  if (typeof globalThis.indexedDB === 'undefined')
    throw new Error('storage-unavailable');
  const db = new VaccineDb(name);
  let rejectBlocked: (reason: Error) => void = () => undefined;
  const blocked = new Promise<never>((_, reject) => {
    rejectBlocked = reject;
  });
  const onBlocked = () => {
    rejectBlocked(new Error('storage-blocked'));
    db.close();
  };
  db.on('blocked', onBlocked);
  try {
    await Promise.race([db.open(), blocked]);
    db.on('blocked').unsubscribe(onBlocked);
    return db;
  } catch (error) {
    db.close();
    db.on('blocked').unsubscribe(onBlocked);
    if (error instanceof Error && error.message === 'storage-blocked')
      throw error;
    throw new Error('storage-open-failed', { cause: error });
  }
}
