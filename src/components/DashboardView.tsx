'use client';

import type { Catalog } from '@/data/catalog/types';
import type { ChildProfile, CivilDate } from '@/lib/types';
import { ageAt } from '@/lib/civilDate';
import { formatCivilDate } from '@/lib/datePresentation';
import {
  getPendingReferenceGroups,
  type PendingReference,
} from '@/lib/schedule/pendingReferencePresentation';
import type { ScheduleSummary } from '@/lib/schedule/summarizeSchedule';
import { PrimarySeriesFollowUp } from './PrimarySeriesFollowUp';
import { ReferenceTiming } from './ReferenceTiming';

export function DashboardView({
  profile,
  catalog,
  referenceLabel,
  summary,
  today,
  eventCount,
}: {
  profile: ChildProfile;
  catalog: Catalog;
  referenceLabel: string;
  summary: ScheduleSummary;
  today: CivilDate;
  eventCount: number;
}) {
  const age = ageAt(profile.birthDate, today);
  const groups = getPendingReferenceGroups(profile, catalog, summary.items);
  const next = [...groups.pai, ...groups.private, ...groups.conditional].filter(
    ({ requirement }) => summary.nextRequirementIds.includes(requirement.id),
  );
  const nextIsPast = summary.nextDate !== null && summary.nextDate < today;
  const nextSourceAges = [
    ...new Set(next.map((entry) => entry.sourceAgeLabel)),
  ].join(' / ');

  return (
    <div className="content-grid">
      <section className="card">
        <h2>Progreso del calendario</h2>
        <dl className="profile-context">
          <div>
            <dt>Edad actual</dt>
            <dd>
              {age.years} {age.years === 1 ? 'año' : 'años'}, {age.months}{' '}
              {age.months === 1 ? 'mes' : 'meses'} y {age.days}{' '}
              {age.days === 1 ? 'día' : 'días'}
            </dd>
          </div>
          <div>
            <dt>Esquema seleccionado</dt>
            <dd>{referenceLabel}</dd>
          </div>
        </dl>
        <strong className="progress-number">
          {summary.progressPercent === null
            ? '—'
            : `${summary.progressPercent}%`}
        </strong>
        {summary.progressPercent === null ? (
          <p>Sin requisitos programados hasta hoy.</p>
        ) : (
          <>
            <progress
              max={100}
              value={summary.progressPercent}
              aria-label="Requisitos cubiertos hasta hoy"
            />
            <p>
              {summary.dueCovered} de {summary.due} requisitos con fecha
              orientativa hasta hoy. No es un porcentaje de inmunidad.
            </p>
          </>
        )}
        <div className="stats">
          <div className="stat">
            <strong>{summary.applied}</strong>
            <span>Aplicados</span>
          </div>
          <div className="stat">
            <strong>{summary.upcoming}</strong>
            <span>En los próximos 30 días</span>
          </div>
          <div className="stat">
            <strong>
              {summary.pending + summary.past + summary.needsReview}
            </strong>
            <span>Pendientes / por revisar</span>
          </div>
        </div>
        <p>
          {summary.pending} pendientes futuros · {summary.past} con fecha pasada
          / por confirmar · {summary.needsReview} por verificar. Los contadores
          son requisitos, no aplicaciones.
        </p>
        <p>{eventCount} aplicaciones físicas en el carné.</p>
      </section>
      <section className="card">
        <div className="eyebrow">Primera dosis pendiente de referencia</div>
        <h2 className="break-words">
          {summary.nextDate
            ? formatCivilDate(summary.nextDate)
            : 'Sin fecha orientativa confirmada'}
        </h2>
        {next.length > 0 ? (
          <>
            <p>Edad de referencia según la fuente: {nextSourceAges}.</p>
            {next[0].calendarAgeLabel && (
              <p>Edad calendario en esa fecha: {next[0].calendarAgeLabel}.</p>
            )}
            <ul>
              {next.map(({ requirement }) => (
                <li key={requirement.id}>{requirement.name}</li>
              ))}
            </ul>
          </>
        ) : (
          <p>
            {groups.pai.length +
              groups.private.length +
              groups.conditional.length >
            0
              ? 'Consulta las referencias sin fecha en las listas y confirma la programación con el vacunador.'
              : 'No hay requisitos pendientes en las referencias seleccionadas.'}
          </p>
        )}
        {nextIsPast && (
          <p role="note">
            La fecha orientativa ya pasó. Confirma con el vacunador la
            programación individual; esta referencia no calcula un esquema de
            recuperación ni indica aplicar una dosis ahora.
          </p>
        )}
        <p>
          Las primeras referencias se cuentan desde el nacimiento. En el Esquema
          2026, la continuación de pentavalente/polio, rotavirus y neumococo usa
          la aplicación anterior confirmada de cada serie, como se explica
          abajo.
        </p>
      </section>
      <PrimarySeriesFollowUp items={summary.items} catalog={catalog} />
      <section className="card wide">
        <h2>Referencias pendientes</h2>
        <p>
          Incluyen todas las dosis sin cobertura verificada: fechas pasadas,
          futuras y por confirmar, no solo los próximos 30 días. Son requisitos
          del calendario, no aplicaciones físicas ni indicaciones de rescate.
        </p>
        <p>
          La referencia inicial no es una aplicación registrada. Los totales
          documentados se limitan al alcance indicado; no representan todas las
          vacunas o refuerzos de por vida ni confirman un producto.
        </p>
        <PendingReferenceList
          title="Próximas vacunas PAI"
          entries={groups.pai}
          today={today}
          catalog={catalog}
          emptyMessage="No hay requisitos PAI pendientes en la referencia seleccionada."
        />
        <PendingReferenceList
          title="Próximas vacunas No PAI"
          entries={groups.private}
          today={today}
          catalog={catalog}
          emptyMessage="No hay referencias particulares pendientes seleccionadas. En Calendario puedes mostrar referencias opcionales por producto; no se activan automáticamente ni representan todas las vacunas privadas disponibles."
        />
        {groups.conditional.length > 0 && (
          <>
            <p>
              El acceso condicional no equivale a No PAI: la elegibilidad y la
              financiación deben confirmarse para cada caso.
            </p>
            <PendingReferenceList
              title="Acceso por confirmar"
              entries={groups.conditional}
              today={today}
              catalog={catalog}
            />
          </>
        )}
        <p>Fechas orientativas. Confirma el esquema con tu vacunador.</p>
      </section>
    </div>
  );
}

function PendingReferenceList({
  title,
  entries,
  today,
  catalog,
  emptyMessage,
}: {
  title: string;
  entries: readonly PendingReference[];
  today: CivilDate;
  catalog: Catalog;
  emptyMessage?: string;
}) {
  return (
    <section className="mt-8 min-w-0">
      <h3>{title}</h3>
      {entries.length === 0 ? (
        <p>{emptyMessage}</p>
      ) : (
        <div
          className="table-scroll"
          role="region"
          aria-label={title}
          tabIndex={0}
        >
          <table className="min-w-[42rem]">
            <thead>
              <tr>
                <th scope="col">Fecha calculada</th>
                <th scope="col">Vacuna y dosis pendiente</th>
                <th scope="col">Dosis inicial de referencia</th>
                <th scope="col">Total documentado</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(
                ({
                  requirement,
                  initialReference,
                  documentedTotal,
                  sourceAgeLabel,
                }) => {
                  const isPast =
                    requirement.estimatedDate !== null &&
                    requirement.estimatedDate < today;
                  const nameIncludesDose = requirement.name
                    .toLocaleLowerCase('es')
                    .includes(`dosis ${requirement.doseNumber}`);
                  return (
                    <tr key={requirement.id}>
                      <td>
                        {requirement.estimatedDate
                          ? formatCivilDate(requirement.estimatedDate)
                          : requirement.timing?.kind === 'needs-review'
                            ? 'Fecha de continuación por confirmar'
                            : 'Sin fecha documentada'}
                        {isPast && (
                          <div className="mt-1 text-sm">
                            Referencia ya pasada
                          </div>
                        )}
                        <ReferenceTiming
                          requirement={requirement}
                          catalog={catalog}
                        />
                      </td>
                      <td>
                        <strong>{requirement.name}</strong>
                        {!nameIncludesDose && (
                          <div className="mt-1">
                            Dosis {requirement.doseNumber}
                          </div>
                        )}
                        <div className="mt-1 text-sm">
                          Edad de la referencia original: {sourceAgeLabel}
                        </div>
                        {requirement.note && (
                          <details className="mt-2">
                            <summary>Ver advertencias</summary>
                            <p className="mb-0 text-sm">{requirement.note}</p>
                          </details>
                        )}
                      </td>
                      <td>
                        {initialReference ? (
                          <>
                            <div>Dosis {initialReference.doseNumber}</div>
                            <div className="mt-1">
                              {initialReference.estimatedDate
                                ? formatCivilDate(
                                    initialReference.estimatedDate,
                                  )
                                : 'Fecha por confirmar'}
                            </div>
                            <div className="mt-1 text-sm">
                              {initialReference.sourceAgeLabel}
                            </div>
                          </>
                        ) : (
                          'Por confirmar'
                        )}
                      </td>
                      <td>
                        {documentedTotal ? (
                          <>
                            <strong>{documentedTotal.doseCount} dosis</strong>
                            <div className="mt-1 text-sm">
                              {documentedTotal.scope === 'primary-series'
                                ? 'Serie primaria, sin refuerzos'
                                : documentedTotal.scope === 'selected-reference'
                                  ? 'En esta referencia; no es un total de por vida'
                                  : `Curso del producto ${documentedTotal.productName}`}
                            </div>
                          </>
                        ) : (
                          'Por confirmar: curso no documentado o ambiguo'
                        )}
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
