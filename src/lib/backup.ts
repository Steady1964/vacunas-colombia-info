import {
  CURRENT_CATALOG_VERSION,
  HISTORICAL_CATALOG_VERSION,
  getCatalog,
} from '../data/catalog';
import { backupV2Schema, legacyFamilyV1Schema } from './backupSchemas';
import { parseCivilDate } from './civilDate';
import { REVISION_KEY, type VaccineDb } from './db';
import { migrateLegacyFamily } from './migration';
import { readRevision, repairActiveProfile } from './repository';
import { resolveSelection } from './schedule/resolveCoverage';
import { repairBrandRejection } from './repairBrandRejection';
import {
  timestampSchema,
  vaccineAdministrationSchema,
  validatePortablePreference,
} from './schemas';
import type {
  BackupV2,
  FamilySnapshot,
  ImportContext,
  ImportPreview,
  JsonObject,
  LegacyMetadata,
  ReviewReason,
  VaccineAdministration,
} from './types';

const KNOWN_CATALOG_VERSIONS = [
  CURRENT_CATALOG_VERSION,
  HISTORICAL_CATALOG_VERSION,
] as const;

/** Stable recursive key ordering; arrays preserve meaning and captured raw order. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

function comparable(entity: object): string {
  const result = structuredClone(entity) as Record<string, unknown>;
  if ('legacy' in result && result.legacy) {
    const legacy = result.legacy as LegacyMetadata;
    if (legacy.raw.reviewContext === 'birth-date-contradiction') {
      const original = vaccineAdministrationSchema.safeParse(
        legacy.raw.importedRecord,
      );
      if (
        original.success &&
        canonical(
          preserveForReview(original.data, ['before-birth'], legacy.migratedAt),
        ) === canonical(entity)
      )
        return comparable(original.data);
    }
    const created = timestampSchema.safeParse(legacy.raw.createdAt);
    const updated = timestampSchema.safeParse(legacy.raw.updatedAt);
    if (
      legacy.generatedTimestamps &&
      !created.success &&
      result.createdAt === legacy.migratedAt
    )
      delete result.createdAt;
    const generatedUpdated = created.success ? created.data : legacy.migratedAt;
    if (
      legacy.generatedTimestamps &&
      !updated.success &&
      result.updatedAt === generatedUpdated
    )
      delete result.updatedAt;
    // Passing time changes a derived warning, not the family's original record.
    if (
      result.coverageStatus === 'needs-review' &&
      Array.isArray(result.reviewReasons) &&
      result.reviewReasons.includes('legacy-unconfirmed') &&
      legacy.raw.id === result.id &&
      legacy.raw.date === result.appliedDate &&
      legacy.raw.profileId === result.childId
    ) {
      result.reviewReasons = result.reviewReasons.filter(
        (reason) => reason !== 'future-date',
      );
    }
    result.legacy = {
      raw: legacy.raw,
      generatedTimestamps: legacy.generatedTimestamps,
    };
  }
  if ('migratedAt' in result && 'raw' in result) delete result.migratedAt;
  for (const key of ['coveredRequirementIds', 'reviewReasons', 'reasons']) {
    if (Array.isArray(result[key])) result[key] = [...result[key]].sort();
  }
  return canonical(result);
}

function validateRelations(backup: BackupV2): void {
  const profiles = new Set(backup.profiles.map((profile) => profile.id));
  const administrations = new Set(
    backup.administrations.map((administration) => administration.id),
  );
  const issues = new Set(backup.migrationIssues.map((issue) => issue.id));
  const preferences = new Set(
    backup.preferences.map((preference) => preference.key),
  );
  if (
    profiles.size !== backup.profiles.length ||
    administrations.size !== backup.administrations.length ||
    issues.size !== backup.migrationIssues.length ||
    preferences.size !== backup.preferences.length
  )
    throw new Error('duplicate-id');
  for (const administration of backup.administrations)
    if (!profiles.has(administration.childId))
      throw new Error('missing-profile');
  for (const issue of backup.migrationIssues) {
    if (issue.id !== `${issue.kind}:${issue.entityId}`)
      throw new Error('invalid-migration-issue');
    if (
      issue.kind === 'profile'
        ? profiles.has(issue.entityId)
        : administrations.has(issue.entityId)
    )
      throw new Error('duplicate-id');
  }
  for (const preference of backup.preferences) {
    validatePortablePreference(preference.key, preference.value);
    if (
      preference.key.startsWith('optional-products:') &&
      !profiles.has(preference.key.slice('optional-products:'.length))
    )
      throw new Error('missing-profile');
  }
}

function preserveForReview(
  administration: VaccineAdministration,
  reasons: ReviewReason[],
  migratedAt: string,
): VaccineAdministration {
  const original = JSON.parse(JSON.stringify(administration)) as JsonObject;
  return {
    ...administration,
    coveredRequirementIds: [],
    coverageStatus: 'needs-review',
    reviewReasons: [...new Set([...administration.reviewReasons, ...reasons])],
    legacy: {
      raw: {
        importedRecord: original,
        ...(reasons.length === 1 && reasons[0] === 'before-birth'
          ? { reviewContext: 'birth-date-contradiction' }
          : {}),
      },
      migratedAt,
      generatedTimestamps: false,
    },
  };
}

export function serializeBackup(
  snapshot: FamilySnapshot,
  exportedAt: string,
): string {
  timestampSchema.parse(exportedAt);
  const profiles = new Map(
    snapshot.profiles.map((profile) => [profile.id, profile]),
  );
  const administrations = snapshot.administrations.map((administration) => {
    const profile = profiles.get(administration.childId);
    if (
      !profile ||
      administration.appliedDate >= profile.birthDate ||
      (administration.coverageStatus === 'needs-review' &&
        administration.reviewReasons.includes('before-birth') &&
        administration.legacy)
    )
      return administration;
    return preserveForReview(administration, ['before-birth'], exportedAt);
  });
  const backup: BackupV2 = {
    formatVersion: 2,
    exportedAt,
    profiles: snapshot.profiles,
    administrations,
    preferences: snapshot.preferences.filter(
      (preference) =>
        preference.key === 'activeProfileId' ||
        preference.key.startsWith('optional-products:'),
    ),
    migrationIssues: snapshot.migrationIssues,
  };
  backupV2Schema.parse(backup);
  validateRelations(backup);
  return JSON.stringify(backup, null, 2);
}

export function parseBackup(text: string, context: ImportContext): BackupV2 {
  parseCivilDate(context.today);
  timestampSchema.parse(context.now);
  let input: unknown;
  try {
    input = JSON.parse(text);
  } catch {
    throw new Error('invalid-json');
  }
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new Error('invalid-backup');
  const version = input as { version?: unknown; formatVersion?: unknown };
  let backup: BackupV2;
  if (version.version === 1 && version.formatVersion === undefined) {
    const legacy = legacyFamilyV1Schema.safeParse(input);
    if (!legacy.success) throw new Error('invalid-backup');
    const migrated = migrateLegacyFamily(legacy.data, context.now);
    backup = {
      formatVersion: 2,
      exportedAt: context.now,
      profiles: migrated.profiles,
      administrations: migrated.administrations,
      preferences: [],
      migrationIssues: migrated.migrationIssues,
    };
  } else if (version.formatVersion === 2 && version.version === undefined) {
    const result = backupV2Schema.safeParse(input);
    if (!result.success) throw new Error('invalid-backup');
    backup = result.data;
  } else throw new Error('unsupported-backup-version');
  validateRelations(backup);
  const profiles = new Map(
    backup.profiles.map((profile) => [profile.id, profile]),
  );
  for (const profile of backup.profiles)
    if (profile.birthDate > context.today) throw new Error('future-date');
  for (const administration of backup.administrations) {
    const profile = profiles.get(administration.childId)!;
    const raw = administration.legacy?.raw;
    const importedRecord = vaccineAdministrationSchema.safeParse(
      raw?.importedRecord,
    );
    const inheritedOriginal =
      importedRecord.success &&
      raw?.reviewContext === 'birth-date-contradiction' &&
      canonical(
        preserveForReview(
          importedRecord.data,
          ['before-birth'],
          administration.legacy!.migratedAt,
        ),
      ) === canonical(administration);
    const inheritedLegacy =
      raw?.id === administration.id &&
      raw.date === administration.appliedDate &&
      raw.profileId === administration.childId;
    const inheritedDate =
      administration.coverageStatus === 'needs-review' &&
      (inheritedLegacy || inheritedOriginal);
    if (
      administration.appliedDate > context.today &&
      !(inheritedDate && administration.reviewReasons.includes('future-date'))
    )
      throw new Error('future-date');
    if (
      administration.appliedDate < profile.birthDate &&
      !(inheritedDate && administration.reviewReasons.includes('before-birth'))
    )
      throw new Error('before-birth');
    const repaired = repairBrandRejection(
      administration,
      profile,
      context.today,
    );
    if (repaired) Object.assign(administration, repaired);
    if (administration.coverageStatus !== 'verified') continue;
    const catalog = getCatalog(profile.referenceCatalogVersion);
    const selection = catalog
      ? resolveSelection(administration, catalog)
      : undefined;
    const storedCoverage = canonical(
      [...administration.coveredRequirementIds].sort(),
    );
    if (catalog && profile.primaryScheduleId !== null) {
      if (
        selection?.coverageStatus === 'verified' &&
        canonical([...selection.coveredRequirementIds].sort()) ===
          storedCoverage
      )
        continue;

      // An explicit reference change leaves the original application byte-for-byte
      // intact. Accept an exact snapshot verified by another known catalog; the
      // schedule engine still decides whether it covers the profile's current rules.
      let knownSnapshot = false;
      for (const version of KNOWN_CATALOG_VERSIONS) {
        if (version === profile.referenceCatalogVersion) continue;
        const previousCatalog = getCatalog(version);
        const previousSelection = previousCatalog
          ? resolveSelection(administration, previousCatalog)
          : undefined;
        if (
          previousSelection?.coverageStatus === 'verified' &&
          canonical([...previousSelection.coveredRequirementIds].sort()) ===
            storedCoverage
        ) {
          knownSnapshot = true;
          break;
        }
      }
      if (knownSnapshot) continue;
      if (selection?.coverageStatus === 'verified')
        throw new Error('invalid-coverage');
    }
    // Unavailable evidence cannot grant coverage; the complete original survives.
    const reasons: ReviewReason[] = selection?.reviewReasons.length
      ? selection.reviewReasons
      : [
          profile.primaryScheduleId === null
            ? 'unknown-schedule'
            : 'unverified-rule',
        ];
    Object.assign(
      administration,
      preserveForReview(administration, reasons, context.now),
    );
  }
  return backup;
}

export function previewImport(
  text: string,
  current: FamilySnapshot,
  context: ImportContext,
): ImportPreview {
  const incoming = parseBackup(text, context);
  const preview: ImportPreview = {
    incoming,
    baseRevision: current.revision,
    added: { profiles: 0, administrations: 0, migrationIssues: 0 },
    identical: { profiles: 0, administrations: 0, migrationIssues: 0 },
    conflicts: [],
    reviewCount:
      incoming.profiles.filter((profile) => profile.primaryScheduleId === null)
        .length +
      incoming.administrations.filter(
        (administration) => administration.coverageStatus === 'needs-review',
      ).length +
      incoming.migrationIssues.length,
  };
  const collections = [
    ['profiles', 'profile'],
    ['administrations', 'administration'],
    ['migrationIssues', 'migrationIssue'],
  ] as const;
  for (const [key, entity] of collections) {
    const existing = new Map<string, object>(
      current[key].map((record) => [record.id, record]),
    );
    for (const record of incoming[key]) {
      const local = existing.get(record.id);
      if (!local) preview.added[key]++;
      else if (comparable(local) === comparable(record))
        preview.identical[key]++;
      else preview.conflicts.push({ entity, id: record.id });
    }
  }
  // A migrated issue and its repaired row are also the same identity, not two
  // unrelated records that may be silently merged into one family.
  for (const issue of incoming.migrationIssues) {
    const collection =
      issue.kind === 'profile' ? current.profiles : current.administrations;
    if (collection.some((record) => record.id === issue.entityId))
      preview.conflicts.push({ entity: issue.kind, id: issue.entityId });
  }
  for (const issue of current.migrationIssues) {
    const collection =
      issue.kind === 'profile' ? incoming.profiles : incoming.administrations;
    if (collection.some((record) => record.id === issue.entityId))
      preview.conflicts.push({ entity: issue.kind, id: issue.entityId });
  }
  return preview;
}

export async function applyImport(
  db: VaccineDb,
  preview: ImportPreview,
  mode: 'merge' | 'replace',
): Promise<void> {
  if (mode !== 'merge' && mode !== 'replace')
    throw new Error('invalid-import-mode');
  const incoming = backupV2Schema.parse(preview.incoming);
  validateRelations(incoming);
  await db.transaction(
    'rw',
    db.profiles,
    db.administrations,
    db.preferences,
    db.migrationIssues,
    async () => {
      const revision = await readRevision(db);
      if (revision !== preview.baseRevision) throw new Error('stale-preview');
      if (revision === Number.MAX_SAFE_INTEGER)
        throw new Error('revision-overflow');
      if (mode === 'merge' && preview.conflicts.length)
        throw new Error('conflicting-import');
      if (mode === 'replace') {
        await db.profiles.clear();
        await db.administrations.clear();
        await db.migrationIssues.clear();
        await db.preferences.clear();
        await db.profiles.bulkPut(incoming.profiles);
        await db.administrations.bulkPut(incoming.administrations);
        await db.migrationIssues.bulkPut(incoming.migrationIssues);
        await db.preferences.bulkPut(incoming.preferences);
      } else {
        for (const profile of incoming.profiles) {
          const local = await db.profiles.get(profile.id);
          if (
            (await db.migrationIssues.get(`profile:${profile.id}`)) ||
            (local && comparable(local) !== comparable(profile))
          )
            throw new Error('conflicting-import');
          if (!local) await db.profiles.add(profile);
        }
        for (const administration of incoming.administrations) {
          const local = await db.administrations.get(administration.id);
          if (
            (await db.migrationIssues.get(
              `administration:${administration.id}`,
            )) ||
            (local && comparable(local) !== comparable(administration))
          )
            throw new Error('conflicting-import');
          if (!local) await db.administrations.add(administration);
        }
        for (const issue of incoming.migrationIssues) {
          const local = await db.migrationIssues.get(issue.id);
          const repaired =
            issue.kind === 'profile'
              ? await db.profiles.get(issue.entityId)
              : await db.administrations.get(issue.entityId);
          if (repaired || (local && comparable(local) !== comparable(issue)))
            throw new Error('conflicting-import');
          if (!local) await db.migrationIssues.add(issue);
        }
        // Nonclinical local preferences win; incoming keys fill only absent values.
        for (const preference of incoming.preferences)
          if (!(await db.preferences.get(preference.key)))
            await db.preferences.add(preference);
      }
      await repairActiveProfile(db);
      await db.preferences.put({ key: REVISION_KEY, value: revision + 1 });
    },
  );
}
