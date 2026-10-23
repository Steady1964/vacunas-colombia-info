import type { AppliedAdministrationGroup } from '@/lib/schedule/administrationCoveragePresentation';

export function CoverageRequirements({
  group,
}: {
  group: AppliedAdministrationGroup;
}) {
  return (
    <div className="coverage-requirements">
      <p>
        <strong>Una sola aplicación.</strong>{' '}
        {group.requirements.length > 1
          ? 'Cubre estos requisitos de esta etapa:'
          : 'Cubre este requisito del calendario:'}
      </p>
      <ul className="coverage-list">
        {group.requirements.map((requirement) => (
          <li key={requirement.id}>
            <strong>{requirement.name}</strong>
            <span>Cubierto por {group.administration.productName}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
