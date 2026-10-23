import type { Catalog } from '@/data/catalog/types';
import { formatCivilDate } from '@/lib/datePresentation';
import type { AppliedAdministrationGroup } from '@/lib/schedule/administrationCoveragePresentation';
import { CoverageRequirements } from './CoverageRequirements';
import { milestoneLabels } from './presentation';

export function AppliedVaccineCard({
  group,
  catalog,
}: {
  group: AppliedAdministrationGroup;
  catalog: Catalog;
}) {
  const { administration, product, requirements } = group;
  const sourceIds = new Set(requirements.flatMap((row) => row.sourceIds));

  return (
    <article
      className="event application-event"
      aria-label={`Aplicación de ${administration.productName} del ${formatCivilDate(administration.appliedDate)}`}
    >
      <div className="event-date">
        <span>Fecha real de aplicación</span>
        <time dateTime={administration.appliedDate}>
          {formatCivilDate(administration.appliedDate)}
        </time>
      </div>
      <div className="event-content">
        <div className="application-heading">
          <h3>{product.name}</h3>
          <span className="tag status-applied">Aplicada</span>
        </div>
        {administration.productName !== product.name && (
          <p className="application-recorded-name">
            Nombre registrado: <strong>{administration.productName}</strong>
          </p>
        )}
        <p>
          Dosis {administration.doseNumber} ·{' '}
          {milestoneLabels[administration.milestoneId ?? ''] ??
            administration.milestoneId}
        </p>
        <dl className="application-metadata">
          <div>
            <dt>Marca / laboratorio</dt>
            <dd>{administration.brand || 'No registrado'}</dd>
          </div>
          <div>
            <dt>Acceso de esta aplicación</dt>
            <dd>
              {administration.accessType === 'pai'
                ? 'PAI'
                : administration.accessType === 'private'
                  ? 'Particular'
                  : 'No registrado'}
            </dd>
          </div>
        </dl>
        <CoverageRequirements group={group} />
        <details>
          <summary>Fuentes de los requisitos cubiertos</summary>
          <p>
            Correspondencia de esta etapa en la referencia seleccionada. No
            representa otras inyecciones ni autoriza cambiar productos o marcas.
          </p>
          <ul>
            {[...sourceIds].map((id) => {
              const source = catalog.sources.find((entry) => entry.id === id);
              return (
                <li key={id}>
                  {source ? (
                    <a href={source.url} target="_blank" rel="noreferrer">
                      {source.title ?? source.id}
                    </a>
                  ) : (
                    id
                  )}
                </li>
              );
            })}
          </ul>
        </details>
      </div>
    </article>
  );
}
