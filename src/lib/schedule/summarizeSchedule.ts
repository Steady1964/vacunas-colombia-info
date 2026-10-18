import { addCivil } from '../civilDate';
import type { CivilDate } from '../types';
import type { ScheduledRequirement } from './calculateSchedule';
import type { CoverageResult } from './resolveCoverage';

export type RequirementView = ScheduledRequirement & {
  status: 'applied' | 'upcoming' | 'pending' | 'past' | 'needs-review';
};
export type ScheduleSummary = {
  items: RequirementView[];
  applied: number;
  upcoming: number;
  pending: number;
  past: number;
  needsReview: number;
  due: number;
  dueCovered: number;
  progressPercent: number | null;
  nextDate: CivilDate | null;
  nextRequirementIds: string[];
};

export function summarizeSchedule(
  scheduled: readonly ScheduledRequirement[],
  coverage: CoverageResult,
  today: CivilDate,
): ScheduleSummary {
  const endOfWindow = addCivil(today, { unit: 'days', value: 30 });
  const items: RequirementView[] = [];
  const seen = new Set<string>();
  let applied = 0;
  let upcoming = 0;
  let pending = 0;
  let past = 0;
  let needsReview = 0;
  let due = 0;
  let dueCovered = 0;
  let nextDate: CivilDate | null = null;
  let nextRequirementIds: string[] = [];
  for (const requirement of scheduled) {
    if (seen.has(requirement.id)) continue;
    seen.add(requirement.id);
    const covered = coverage.coveredRequirementIds.has(requirement.id);
    if (requirement.estimatedDate && requirement.estimatedDate <= today) {
      due++;
      if (covered) dueCovered++;
    }
    let status: RequirementView['status'];
    if (covered) {
      status = 'applied';
      applied++;
    } else if (!requirement.estimatedDate) {
      status = 'needs-review';
      needsReview++;
    } else if (requirement.estimatedDate < today) {
      status = 'past';
      past++;
    } else if (requirement.estimatedDate <= endOfWindow) {
      status = 'upcoming';
      upcoming++;
    } else {
      status = 'pending';
      pending++;
    }
    items.push({ ...requirement, status });
    if (
      !covered &&
      requirement.estimatedDate &&
      requirement.estimatedDate >= today
    ) {
      if (!nextDate || requirement.estimatedDate < nextDate) {
        nextDate = requirement.estimatedDate;
        nextRequirementIds = [requirement.id];
      } else if (requirement.estimatedDate === nextDate)
        nextRequirementIds.push(requirement.id);
    }
  }
  return {
    items,
    applied,
    upcoming,
    pending,
    past,
    needsReview,
    due,
    dueCovered,
    progressPercent: due ? Math.round((dueCovered / due) * 100) : null,
    nextDate,
    nextRequirementIds,
  };
}
