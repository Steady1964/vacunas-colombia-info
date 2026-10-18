import { describe, expect, it } from 'vitest';
import { makeAdministration, makeProfile } from '../test/fixtures';
import {
  childProfileSchema,
  pendingProfileSchema,
  storedProfileSchema,
  vaccineAdministrationSchema,
  validatePortablePreference,
} from './schemas';

describe('stored domain validation', () => {
  it('requires an explicit supported primary schedule', () => {
    expect(childProfileSchema.safeParse(makeProfile()).success).toBe(true);
    expect(
      childProfileSchema.safeParse({
        ...makeProfile(),
        primaryScheduleId: 'shortened',
      }).success,
    ).toBe(false);
    const pending = {
      ...makeProfile(),
      primaryScheduleId: null,
      migrationStatus: 'needs-schedule-choice',
    };
    expect(pendingProfileSchema.safeParse(pending).success).toBe(true);
    expect(storedProfileSchema.safeParse(pending).success).toBe(true);
    expect(childProfileSchema.safeParse(pending).success).toBe(false);
  });

  it('does not accept impossible civil dates or fabricated coverage status', () => {
    expect(
      childProfileSchema.safeParse(makeProfile({ birthDate: '2026-02-30' }))
        .success,
    ).toBe(false);
    expect(
      vaccineAdministrationSchema.safeParse(makeAdministration()).success,
    ).toBe(true);
    expect(
      vaccineAdministrationSchema.safeParse(
        makeAdministration({ coverageStatus: 'verified' }),
      ).success,
    ).toBe(false);
    expect(
      vaccineAdministrationSchema.safeParse(
        makeAdministration({ coveredRequirementIds: ['penta-1'] }),
      ).success,
    ).toBe(false);
  });

  it('accepts only portable preference namespaces and JSON values of the right shape', () => {
    expect(() =>
      validatePortablePreference('activeProfileId', null),
    ).not.toThrow();
    expect(() =>
      validatePortablePreference('optional-products:child', ['rotateq']),
    ).not.toThrow();
    expect(() => validatePortablePreference('internal:revision', 0)).toThrow(
      'invalid-preference',
    );
    expect(() =>
      validatePortablePreference('optional-products:child', [
        'rotateq',
        'rotateq',
      ]),
    ).toThrow('invalid-preference');
    expect(() =>
      validatePortablePreference('activeProfileId', { id: 'child' }),
    ).toThrow('invalid-preference');
  });
});
