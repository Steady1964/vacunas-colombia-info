import type { Catalog, CoverageRule, Product, Requirement } from '../../data/catalog/types'
import { parseCivilDate } from '../civilDate'
import type { ChildProfile, CivilDate, ReviewReason, VaccineAdministration } from '../types'
import type { ScheduledRequirement } from './calculateSchedule'

export type SelectionCoverage = { coveredRequirementIds: string[]; coverageStatus: 'verified' | 'needs-review'; reviewReasons: ReviewReason[] }
export type CoverageResult = { coveredRequirementIds: Set<string>; reviewByAdministrationId: Map<string, ReviewReason[]> }
type Selection = { productId: string; doseNumber?: number; milestoneId?: string; brand?: string }
type CatalogIndex = { products: Map<string, Product>; requirements: Map<string, Requirement>; verifiedSources: Set<string> }

function indexCatalog(catalog: Catalog): CatalogIndex {
  const requirements = new Map(catalog.requirements.map(requirement => [requirement.id, requirement]))
  for (const optional of Object.values(catalog.optionalRequirements)) {
    for (const entry of optional) requirements.set(entry.requirement.id, entry.requirement)
  }
  return {
    products: new Map(catalog.products.map(product => [product.id, product])),
    requirements,
    verifiedSources: new Set(catalog.sources.filter(source => source.verification === 'verified').map(source => source.id)),
  }
}

function selectionCoverage(selection: Selection, index: CatalogIndex): SelectionCoverage {
  const reviewReasons: ReviewReason[] = []
  const product = index.products.get(selection.productId)
  if (!product || selection.productId === 'unidentified') reviewReasons.push('unidentified-product')
  if (!Number.isInteger(selection.doseNumber) || !selection.doseNumber || !selection.milestoneId) reviewReasons.push('unidentified-stage')
  let rule: CoverageRule | undefined
  if (product) {
    rule = product.coverageRules.find(candidate => candidate.doseNumber === selection.doseNumber && candidate.milestoneId === selection.milestoneId)
    if (!rule || rule.requirementIds.length === 0) reviewReasons.push('unverified-rule')
    const brand = selection.brand?.trim().toLocaleLowerCase('es')
    if (brand && product.brands.length > 0 && !product.brands.some(known => known.toLocaleLowerCase('es') === brand)) reviewReasons.push('unidentified-product')
    const sourceIds = [...product.sourceIds, ...(rule?.sourceIds ?? [])]
    if (sourceIds.length === 0 || sourceIds.some(id => !index.verifiedSources.has(id))) reviewReasons.push('unverified-rule')
  }
  if (rule) {
    for (const requirementId of rule.requirementIds) {
      const requirement = index.requirements.get(requirementId)
      if (!requirement || requirement.sourceIds.length === 0 || requirement.sourceIds.some(id => !index.verifiedSources.has(id))) {
        reviewReasons.push('unverified-rule')
        break
      }
    }
  }
  if (reviewReasons.length || !rule) return { coveredRequirementIds: [], coverageStatus: 'needs-review', reviewReasons: [...new Set(reviewReasons)] }
  return { coveredRequirementIds: [...new Set(rule.requirementIds)], coverageStatus: 'verified', reviewReasons: [] }
}

export function resolveSelection(selection: Selection, catalog: Catalog): SelectionCoverage {
  return selectionCoverage(selection, indexCatalog(catalog))
}

export function resolveCoverage(
  profile: ChildProfile,
  applications: readonly VaccineAdministration[],
  scheduled: readonly ScheduledRequirement[],
  catalog: Catalog,
  today: CivilDate,
): CoverageResult {
  const coveredRequirementIds = new Set<string>()
  const reviewByAdministrationId = new Map<string, ReviewReason[]>()
  const index = indexCatalog(catalog)
  const scheduledIds = new Set(scheduled.map(requirement => requirement.id))
  const rotavirusProducts = new Set<string>()
  for (const application of applications) {
    if (application.childId === profile.id && (application.productId === 'rotateq' || application.productId === 'rotarix')) rotavirusProducts.add(application.productId)
  }
  for (const application of applications) {
    if (application.childId !== profile.id) continue
    const selection = selectionCoverage(application, index)
    const reasons: ReviewReason[] = [...application.reviewReasons, ...selection.reviewReasons]
    if (application.coverageStatus !== 'verified') reasons.push('legacy-unconfirmed')
    if (profile.referenceCatalogVersion !== catalog.version) reasons.push('unverified-rule')
    try {
      parseCivilDate(application.appliedDate)
      if (application.appliedDate > today) reasons.push('future-date')
      if (application.appliedDate < profile.birthDate) reasons.push('before-birth')
    } catch {
      reasons.push('invalid-date')
    }
    if (rotavirusProducts.size > 1 && (application.productId === 'rotateq' || application.productId === 'rotarix')) reasons.push('mixed-course')
    if (application.coveredRequirementIds.some(id => !selection.coveredRequirementIds.includes(id))) reasons.push('unverified-rule')
    if (reasons.length) {
      reviewByAdministrationId.set(application.id, [...new Set(reasons)])
      continue
    }
    for (const requirementId of application.coveredRequirementIds) {
      if (scheduledIds.has(requirementId)) coveredRequirementIds.add(requirementId)
    }
  }
  return { coveredRequirementIds, reviewByAdministrationId }
}
