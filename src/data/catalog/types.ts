import type { CivilDate, PrimaryScheduleId } from '../../lib/types';

export interface Source {
  id: string;
  url: string;
  reviewedAt: string;
  verification: 'verified' | 'needs-review';
  title?: string;
  publishedAt?: CivilDate | 'unknown';
}

export interface Requirement {
  id: string;
  name: string;
  disease: string;
  doseNumber: number;
  milestoneId: string;
  access: 'pai' | 'private' | 'conditional';
  sourceIds: string[];
  note?: string;
}

export interface Projection {
  requirementId: string;
  offset: { unit: 'days' | 'months' | 'years'; value: number } | null;
}

export interface CoverageRule {
  doseNumber: number;
  milestoneId: string;
  requirementIds: string[];
  sourceIds: string[];
}

export interface Product {
  id: string;
  name: string;
  brands: string[];
  components: string[];
  doseCount?: number;
  sourceIds: string[];
  coverageRules: CoverageRule[];
  note?: string;
}

export interface Catalog {
  version: string;
  reviewedAt: string;
  sources: Source[];
  requirements: Requirement[];
  primarySchedules: Partial<Record<PrimaryScheduleId, Projection[]>>;
  sharedProjections: Projection[];
  products: Product[];
  optionalRequirements: Record<
    string,
    { requirement: Requirement; projection: Projection }[]
  >;
}
