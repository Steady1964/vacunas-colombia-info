import type { ReviewReason, VaccineAdministration } from '../types';
import type { ScheduleSummary } from './summarizeSchedule';

type CalendarRecordReview = {
  administration: VaccineAdministration;
  kind: 'needs-review' | 'outside-reference' | 'unlinked';
  reasons: ReviewReason[];
};

// Explains existing coverage results; never chooses a requirement for a record.
export function getCalendarRecordReviews(
  profileId: string,
  administrations: readonly VaccineAdministration[],
  summary: ScheduleSummary,
  reviewById?: Map<string, ReviewReason[]>,
): CalendarRecordReview[] {
  const requirements = new Map(summary.items.map((item) => [item.id, item]));
  const records: CalendarRecordReview[] = [];
  for (const administration of administrations) {
    if (administration.childId !== profileId) continue;
    const reasons = [
      ...new Set([
        ...administration.reviewReasons,
        ...(reviewById?.get(administration.id) ?? []),
      ]),
    ];
    if (reasons.length || administration.coverageStatus !== 'verified') {
      records.push({ administration, kind: 'needs-review', reasons });
      continue;
    }
    const corresponding = administration.coveredRequirementIds
      .map((id) => requirements.get(id))
      .filter((item) => item !== undefined);
    if (corresponding.length === 0) {
      records.push({ administration, kind: 'outside-reference', reasons });
    } else if (!corresponding.some((item) => item.status === 'applied')) {
      records.push({ administration, kind: 'unlinked', reasons });
    }
  }
  return records;
}
