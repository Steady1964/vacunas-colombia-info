import { getScheduleReference, supportsSchedule } from '../data/catalog';
import { REVISION_KEY, type VaccineDb } from './db';
import { resolveSelection } from './schedule/resolveCoverage';
import {
  administrationInputSchema,
  idSchema,
  profileInputSchema,
  timestampSchema,
  validatePortablePreference,
} from './schemas';
import { parseCivilDate } from './civilDate';
import type {
  AdministrationCommand,
  AdministrationInput,
  ChildProfile,
  FamilySnapshot,
  JsonValue,
  MutationContext,
  ProfileCommand,
  VaccineAdministration,
} from './types';

export async function readRevision(db: VaccineDb): Promise<number> {
  const value = (await db.preferences.get(REVISION_KEY))?.value;
  if (value === undefined) return 0;
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)
    throw new Error('invalid-revision');
  return value;
}

export async function bumpRevision(db: VaccineDb): Promise<void> {
  const revision = await readRevision(db);
  if (revision === Number.MAX_SAFE_INTEGER)
    throw new Error('revision-overflow');
  await db.preferences.put({ key: REVISION_KEY, value: revision + 1 });
}

export async function readFamily(db: VaccineDb): Promise<FamilySnapshot> {
  return db.transaction(
    'r',
    db.profiles,
    db.administrations,
    db.preferences,
    db.migrationIssues,
    async () => ({
      profiles: await db.profiles.toArray(),
      administrations: await db.administrations.toArray(),
      preferences: (await db.preferences.toArray()).filter(
        (preference) => preference.key !== REVISION_KEY,
      ),
      migrationIssues: await db.migrationIssues.toArray(),
      revision: await readRevision(db),
    }),
  );
}

function validateContext(context: MutationContext): void {
  parseCivilDate(context.today);
  timestampSchema.parse(context.now);
}

async function writeProfile(
  db: VaccineDb,
  command: ProfileCommand,
  context: MutationContext,
): Promise<ChildProfile> {
  validateContext(context);
  idSchema.parse(command.id);
  const input = profileInputSchema.parse(command.input);
  if (input.birthDate > context.today) throw new Error('future-date');
  const reference = getScheduleReference(input.scheduleReferenceId);
  if (
    !reference ||
    reference.catalogVersion !== context.catalog.version ||
    !supportsSchedule(context.catalog, reference.primaryScheduleId)
  ) {
    throw new Error('schedule-reference-unavailable');
  }
  const existing = await db.profiles.get(command.id);
  if (
    !reference.selectable &&
    (command.mode !== 'edit' ||
      !existing ||
      existing.primaryScheduleId !== reference.primaryScheduleId ||
      existing.referenceCatalogVersion !== reference.catalogVersion)
  ) {
    throw new Error('schedule-reference-unavailable');
  }
  if (command.mode === 'create' && existing) {
    if (
      existing.nickname === input.nickname &&
      existing.birthDate === input.birthDate &&
      existing.primaryScheduleId === reference.primaryScheduleId &&
      existing.referenceCatalogVersion === reference.catalogVersion
    )
      return existing as ChildProfile;
    throw new Error('conflict');
  }
  if (command.mode === 'edit' && !existing) throw new Error('missing-profile');
  const profile: ChildProfile = {
    id: command.id,
    nickname: input.nickname,
    birthDate: input.birthDate,
    country: 'CO',
    primaryScheduleId: reference.primaryScheduleId,
    referenceCatalogVersion: reference.catalogVersion,
    createdAt: existing?.createdAt ?? context.now,
    updatedAt: context.now,
    ...(existing?.legacy ? { legacy: existing.legacy } : {}),
  };
  await db.profiles.put(profile);
  return profile;
}

function sameAdministrationInput(
  existing: VaccineAdministration,
  input: AdministrationInput,
): boolean {
  const keys: (keyof AdministrationInput)[] = [
    'productId',
    'productName',
    'appliedDate',
    'doseNumber',
    'milestoneId',
    'brand',
    'lot',
    'provider',
    'accessType',
    'paiwebStatus',
    'notes',
  ];
  return keys.every((key) => existing[key] === input[key]);
}

async function writeAdministration(
  db: VaccineDb,
  command: AdministrationCommand,
  context: MutationContext,
): Promise<VaccineAdministration> {
  validateContext(context);
  idSchema.parse(command.id);
  idSchema.parse(command.childId);
  const input = administrationInputSchema.parse(command.input);
  const profile = await db.profiles.get(command.childId);
  if (!profile) throw new Error('missing-profile');
  if (profile.referenceCatalogVersion !== context.catalog.version)
    throw new Error('catalog-mismatch');
  if (input.appliedDate > context.today) throw new Error('future-date');
  if (input.appliedDate < profile.birthDate) throw new Error('before-birth');
  const existing = await db.administrations.get(command.id);
  if (existing && existing.childId !== command.childId)
    throw new Error('ownership-conflict');
  if (command.mode === 'create' && existing) {
    if (sameAdministrationInput(existing, input)) return existing;
    throw new Error('conflict');
  }
  if (command.mode === 'edit' && !existing)
    throw new Error('missing-administration');
  const selectionUnchanged =
    existing?.coverageStatus === 'verified' &&
    existing.productId === input.productId &&
    (existing.brand ?? '') === (input.brand ?? '') &&
    existing.doseNumber === input.doseNumber &&
    existing.milestoneId === input.milestoneId;
  const coverage = selectionUnchanged
    ? {
        coveredRequirementIds: existing.coveredRequirementIds,
        coverageStatus: existing.coverageStatus,
        reviewReasons: existing.reviewReasons,
      }
    : resolveSelection(input, context.catalog);
  if (profile.primaryScheduleId === null) {
    coverage.coveredRequirementIds = [];
    coverage.coverageStatus = 'needs-review';
    coverage.reviewReasons = [
      ...new Set([...coverage.reviewReasons, 'unknown-schedule' as const]),
    ];
  }
  const administration: VaccineAdministration = {
    id: command.id,
    childId: command.childId,
    ...input,
    ...coverage,
    createdAt: existing?.createdAt ?? context.now,
    updatedAt: context.now,
    ...(existing?.legacy ? { legacy: existing.legacy } : {}),
  };
  await db.administrations.put(administration);
  return administration;
}

export async function saveProfile(
  db: VaccineDb,
  command: ProfileCommand,
  context: MutationContext,
): Promise<ChildProfile> {
  return db.transaction(
    'rw',
    db.profiles,
    db.preferences,
    db.migrationIssues,
    async () => {
      if (await db.migrationIssues.get(`profile:${command.id}`))
        throw new Error('migration-issue-pending');
      const profile = await writeProfile(db, command, context);
      await bumpRevision(db);
      return profile;
    },
  );
}

export async function saveAdministration(
  db: VaccineDb,
  command: AdministrationCommand,
  context: MutationContext,
): Promise<VaccineAdministration> {
  return db.transaction(
    'rw',
    db.profiles,
    db.administrations,
    db.preferences,
    db.migrationIssues,
    async () => {
      if (await db.migrationIssues.get(`administration:${command.id}`))
        throw new Error('migration-issue-pending');
      const administration = await writeAdministration(db, command, context);
      await bumpRevision(db);
      return administration;
    },
  );
}

export async function setPreference(
  db: VaccineDb,
  key: string,
  value: JsonValue,
): Promise<void> {
  validatePortablePreference(key, value);
  await db.transaction('rw', db.profiles, db.preferences, async () => {
    const childId =
      key === 'activeProfileId'
        ? value
        : key.slice('optional-products:'.length);
    if (
      childId !== null &&
      (typeof childId !== 'string' || !(await db.profiles.get(childId)))
    )
      throw new Error('missing-profile');
    await db.preferences.put({ key, value });
    await bumpRevision(db);
  });
}

export async function deleteAdministration(
  db: VaccineDb,
  childId: string,
  id: string,
): Promise<void> {
  await db.transaction('rw', db.administrations, db.preferences, async () => {
    const existing = await db.administrations.get(id);
    if (existing && existing.childId !== childId)
      throw new Error('ownership-conflict');
    await db.administrations.delete(id);
    await bumpRevision(db);
  });
}

export async function deleteMigrationIssue(
  db: VaccineDb,
  issueId: string,
): Promise<void> {
  await db.transaction('rw', db.migrationIssues, db.preferences, async () => {
    await db.migrationIssues.delete(issueId);
    await bumpRevision(db);
  });
}

export async function repairActiveProfile(db: VaccineDb): Promise<void> {
  const active = await db.preferences.get('activeProfileId');
  const profiles = await db.profiles.toArray();
  if (
    active &&
    typeof active.value === 'string' &&
    profiles.some((profile) => profile.id === active.value)
  )
    return;
  await db.preferences.put({
    key: 'activeProfileId',
    value: profiles[0]?.id ?? null,
  });
}

export async function deleteProfile(
  db: VaccineDb,
  childId: string,
): Promise<void> {
  await db.transaction(
    'rw',
    db.profiles,
    db.administrations,
    db.preferences,
    db.migrationIssues,
    async () => {
      await db.administrations.where('childId').equals(childId).delete();
      await db.migrationIssues.where('childId').equals(childId).delete();
      await db.migrationIssues.delete(`profile:${childId}`);
      await db.preferences.delete(`optional-products:${childId}`);
      await db.profiles.delete(childId);
      await repairActiveProfile(db);
      await bumpRevision(db);
    },
  );
}

export async function clearFamily(db: VaccineDb): Promise<void> {
  await db.transaction(
    'rw',
    db.profiles,
    db.administrations,
    db.preferences,
    db.migrationIssues,
    async () => {
      const revision = await readRevision(db);
      if (revision === Number.MAX_SAFE_INTEGER)
        throw new Error('revision-overflow');
      await db.profiles.clear();
      await db.administrations.clear();
      await db.preferences.clear();
      await db.migrationIssues.clear();
      await db.preferences.put({ key: REVISION_KEY, value: revision + 1 });
    },
  );
}

export async function repairMigrationIssue(
  db: VaccineDb,
  issueId: string,
  command: ProfileCommand | AdministrationCommand,
  context: MutationContext,
): Promise<void> {
  await db.transaction(
    'rw',
    db.profiles,
    db.administrations,
    db.preferences,
    db.migrationIssues,
    async () => {
      const issue = await db.migrationIssues.get(issueId);
      if (!issue) throw new Error('missing-migration-issue');
      if (issue.entityId !== command.id) throw new Error('identity-conflict');
      const isAdministration = 'childId' in command;
      if ((issue.kind === 'administration') !== isAdministration)
        throw new Error('issue-kind-conflict');
      if (
        isAdministration &&
        !issue.reasons.includes('missing-profile') &&
        issue.childId !== command.childId
      )
        throw new Error('ownership-conflict');
      const originalCreatedAt = timestampSchema.safeParse(issue.raw.createdAt);
      const originalUpdatedAt = timestampSchema.safeParse(issue.raw.updatedAt);
      const provenance = {
        createdAt: originalCreatedAt.success
          ? originalCreatedAt.data
          : context.now,
        legacy: {
          raw: issue.raw,
          migratedAt: issue.migratedAt,
          generatedTimestamps:
            !originalCreatedAt.success || !originalUpdatedAt.success,
        },
      };
      if (issue.kind === 'profile') {
        if (await db.profiles.get(command.id)) throw new Error('conflict');
        const profile = await writeProfile(
          db,
          { ...(command as ProfileCommand), mode: 'create' },
          context,
        );
        await db.profiles.put({ ...profile, ...provenance });
      } else {
        if (await db.administrations.get(command.id))
          throw new Error('conflict');
        const administration = await writeAdministration(
          db,
          { ...(command as AdministrationCommand), mode: 'create' },
          context,
        );
        await db.administrations.put({ ...administration, ...provenance });
      }
      await db.migrationIssues.delete(issueId);
      await bumpRevision(db);
    },
  );
}
