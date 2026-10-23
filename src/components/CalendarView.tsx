'use client';

import { useState } from 'react';
import type {
  ChildProfile,
  ReviewReason,
  ScheduleReferenceId,
  VaccineAdministration,
} from '@/lib/types';
import type { Catalog } from '@/data/catalog/types';
import type { ScheduleSummary } from '@/lib/schedule/summarizeSchedule';
import { getCalendarRecordReviews } from '@/lib/schedule/calendarAdministrationPresentation';
import type { AppliedAdministrationGroup } from '@/lib/schedule/administrationCoveragePresentation';
import { formatCivilDate } from '@/lib/datePresentation';
import {
  getProductReferences,
  getScheduleReferences,
  referenceAgeLabel,
} from '@/lib/schedule/referencePresentation';
import { Button } from '@/components/ui/button';
import { ScheduleSelector } from './ScheduleSelector';
import { milestoneLabels, reviewLabels, STATUS_LABELS } from './presentation';
import { ReferenceTiming } from './ReferenceTiming';
import { AppliedVaccineCard } from './AppliedVaccineCard';

const CALENDAR_STATUS_LABELS: Record<keyof typeof STATUS_LABELS, string> = {
  ...STATUS_LABELS,
  past: 'Fecha pasada · sin enlace confirmado',
};

const REVIEW_ACTIONS: Record<ReviewReason, string> = {
  'unknown-schedule':
    'Confirma la referencia del perfil con el vacunador antes de enlazar aplicaciones.',
  'unidentified-product':
    'Revisa el producto identificado y la marca con el soporte de aplicación; no se asignan por semejanza de nombres.',
  'unidentified-stage':
    'Completa la dosis y la etapa confirmada según el soporte; no las deduzcas de la fecha o la edad.',
  'unverified-rule':
    'Confirma la correspondencia y su fuente con el vacunador. Editar no garantiza un enlace si el catálogo no lo documenta.',
  'invalid-date': 'Corrige la fecha real de aplicación según el soporte.',
  'future-date':
    'Revisa la fecha: una aplicación real no puede ser posterior a hoy.',
  'before-birth':
    'Revisa la fecha de aplicación y el nacimiento del perfil con el soporte.',
  'mixed-course':
    'Consulta al vacunador sobre los productos registrados; no se asume intercambiabilidad ni se decide un rescate.',
  'missing-profile':
    'Revisa el perfil de origen. No traslades el registro a otro niño para enlazarlo.',
  'legacy-unconfirmed':
    'Revisa y guarda los datos confirmados con el soporte. Un registro incompleto o heredado se conserva sin conceder cobertura.',
};

export function CalendarView({
  profile,
  referenceId,
  catalog,
  summary,
  coverageGroups,
  optionalIds,
  onScheduleChange,
  onOptionalChange,
  administrations,
  reviewById,
  onEditAdministration,
}: {
  profile: ChildProfile;
  referenceId: ScheduleReferenceId;
  catalog: Catalog;
  summary: ScheduleSummary;
  coverageGroups: readonly AppliedAdministrationGroup[];
  optionalIds: string[];
  onScheduleChange: (id: ScheduleReferenceId) => void;
  onOptionalChange: (ids: string[]) => Promise<void>;
  administrations: readonly VaccineAdministration[];
  reviewById: Map<string, ReviewReason[]> | undefined;
  onEditAdministration: (event: VaccineAdministration) => void;
}) {
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const referenceByRequirementId = new Map(
    [
      ...getScheduleReferences(profile, catalog),
      ...Object.values(catalog.optionalRequirements).flat(),
    ].map((reference) => [reference.requirement.id, reference]),
  );
  const optionalProductIds = [
    ...new Set([...Object.keys(catalog.optionalRequirements), ...optionalIds]),
  ];
  const recordReviews = getCalendarRecordReviews(
    profile.id,
    administrations,
    summary,
    reviewById,
  );
  const appliedGroups = coverageGroups.filter((group) =>
    group.requirements.some(
      (requirement) =>
        filter === 'all' ||
        (filter === 'pai'
          ? requirement.access === 'pai'
          : requirement.access !== 'pai'),
    ),
  );
  const pendingRequirements = summary.items.filter(
    (requirement) =>
      requirement.status !== 'applied' &&
      (filter === 'all' ||
        (filter === 'pai'
          ? requirement.access === 'pai'
          : requirement.access !== 'pai')),
  );

  function ageLabel(requirementId: string) {
    const reference = referenceByRequirementId.get(requirementId);
    return reference
      ? referenceAgeLabel(reference, catalog)
      : 'Edad por confirmar';
  }

  async function toggle(id: string) {
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await onOptionalChange(
        optionalIds.includes(id)
          ? optionalIds.filter((x) => x !== id)
          : [...optionalIds, id],
      );
      setNotice(
        optionalIds.includes(id)
          ? 'Referencia ocultada.'
          : 'Referencia mostrada debajo de su botón, independientemente del filtro de la línea de tiempo.',
      );
    } catch {
      setError(
        'No se pudo guardar la selección. Intenta de nuevo; no se cambió la referencia.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <h2>Calendario de referencia</h2>
      <p>
        Catálogo {catalog.version} · revisión{' '}
        {formatCivilDate(catalog.reviewedAt)}
      </p>
      <details className="information-section">
        <summary>¿Por qué una dosis sigue pendiente?</summary>
        <p className="information-section-body">
          El Carné conserva las aplicaciones reales; este calendario muestra
          requisitos y fechas estimadas de la referencia del perfil. La fecha
          estimada no es la fecha real de aplicación ni tiene que coincidir con
          ella. «Aplicada» indica una correspondencia documentada de producto,
          dosis y etapa, no una certificación clínica. Registrar una dosis no
          marca todas las dosis ni todas las vacunas de esa etapa como
          aplicadas.
        </p>
      </details>
      <ScheduleSelector
        value={referenceId}
        onChange={onScheduleChange}
        id="calendar-schedule"
      />
      <div className="field">
        <label htmlFor="calendar-filter">Mostrar requisitos</label>
        <select
          id="calendar-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Todas</option>
          <option value="pai">PAI</option>
          <option value="private">Complementarias</option>
        </select>
      </div>
      {recordReviews.length > 0 && (
        <details className="information-section">
          <summary id="calendar-record-reviews">
            Aplicaciones sin enlace confirmado ({recordReviews.length})
          </summary>
          <div className="information-section-body">
            <p>
              Estos registros de {profile.nickname} siguen en el Carné. Se
              muestran independientemente del filtro de requisitos; no se
              asignan a una dosis pendiente sin confirmar sus datos. Consulta el
              soporte de aplicación y al vacunador antes de corregirlos.
            </p>
            <ul>
              {recordReviews.map(({ administration, kind, reasons }) => (
                <li key={administration.id}>
                  <strong>{administration.productName}</strong>
                  <p>
                    Fecha real registrada:{' '}
                    <time dateTime={administration.appliedDate}>
                      {formatCivilDate(administration.appliedDate)}
                    </time>
                    {' · '}
                    {administration.doseNumber
                      ? `Dosis ${administration.doseNumber}`
                      : 'Dosis sin identificar'}
                    {' · '}
                    {administration.milestoneId
                      ? (milestoneLabels[administration.milestoneId] ??
                        'Etapa registrada por verificar')
                      : 'Etapa sin identificar'}
                  </p>
                  {kind === 'needs-review' && (
                    <>
                      <p>No concede cobertura automática: requiere revisión.</p>
                      {reasons.length > 0 ? (
                        <ul>
                          {reasons.map((reason) => (
                            <li key={reason}>
                              <strong>{reviewLabels[reason]}.</strong>{' '}
                              {REVIEW_ACTIONS[reason]}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>
                          El registro está guardado por verificar. Confirma el
                          producto, la dosis y la etapa con el soporte antes de
                          volver a guardarlo.
                        </p>
                      )}
                    </>
                  )}
                  {kind === 'outside-reference' && (
                    <p>
                      Sus requisitos guardados no aparecen en la referencia
                      consultada. Revisa la referencia del perfil y, si
                      corresponde al producto documentado, las referencias
                      complementarias de abajo. No se sustituye por otro
                      producto ni se enlaza por nombre o fecha.
                    </p>
                  )}
                  {kind === 'unlinked' && (
                    <p>
                      Tiene una correspondencia guardada, pero el resumen actual
                      no la confirma como aplicada. Revisa los datos y la
                      referencia del perfil con el vacunador; no se concede
                      cobertura solo porque el registro esté en el Carné.
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onEditAdministration(administration)}
                    aria-label={`Revisar y editar ${administration.productName} del ${formatCivilDate(administration.appliedDate)}`}
                  >
                    Revisar / editar registro
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </details>
      )}
      <section aria-labelledby="calendar-applications">
        <h3 id="calendar-applications">Vacunas realmente aplicadas</h3>
        <p>
          Una tarjeta por aplicación física, con su fecha real. Los requisitos
          que cubre aparecen dentro: no son otras vacunas administradas.
        </p>
        <p className="muted">
          El filtro considera los requisitos cubiertos, no quién financió la
          aplicación. Una vacuna particular puede cubrir requisitos PAI.
        </p>
        {appliedGroups.length > 0 ? (
          <div className="timeline">
            {appliedGroups.map((group) => (
              <AppliedVaccineCard
                key={group.administration.id}
                group={group}
                catalog={catalog}
              />
            ))}
          </div>
        ) : (
          <p>
            No hay aplicaciones con cobertura confirmada para este filtro. Los
            registros por revisar o fuera de la referencia siguen en Carné y en
            el desplegable de revisión.
          </p>
        )}
      </section>
      <h3>Referencias pendientes</h3>
      <p>
        Estos son requisitos del calendario, no aplicaciones registradas. Cubrir
        una dosis no marca las siguientes como aplicadas.
      </p>
      {pendingRequirements.length === 0 && (
        <p>No hay requisitos pendientes para este filtro.</p>
      )}
      <div className="timeline">
        {pendingRequirements.map((r) => (
          <article className="event" key={r.id}>
            <div className="event-date">
              <strong>Referencia: {ageLabel(r.id)}</strong>
              <br />
              <span>
                {r.timing?.kind === 'after-administration'
                  ? 'Desde aplicación real'
                  : r.timing?.kind === 'needs-review'
                    ? 'Continuación por confirmar'
                    : 'Fecha estimada por edad'}
              </span>
              <br />
              <time dateTime={r.estimatedDate ?? undefined}>
                {formatCivilDate(r.estimatedDate ?? '')}
              </time>
            </div>
            <div className="dotline" />
            <div className="event-content">
              <strong>{r.name}</strong>
              <span className={`tag status-${r.status}`}>
                {CALENDAR_STATUS_LABELS[r.status]}
              </span>
              <p>Dosis {r.doseNumber}</p>
              <ReferenceTiming requirement={r} catalog={catalog} />
              <details>
                <summary>Enfermedad, acceso y fuentes</summary>
                <p>
                  Previene: {r.disease}. Dosis {r.doseNumber}. Etapa:{' '}
                  {ageLabel(r.id)}.
                </p>
                <p>
                  {r.access === 'pai'
                    ? 'Referencia PAI, sujeta a elegibilidad.'
                    : r.access === 'private'
                      ? 'Referencia particular / complementaria.'
                      : 'Acceso condicional: confirmar elegibilidad con el vacunador.'}
                </p>
                {r.note && <p>{r.note}</p>}
                <SourceReferences ids={r.sourceIds} catalog={catalog} />
              </details>
            </div>
          </article>
        ))}
      </div>
      <section>
        <h3>Referencias de productos complementarios</h3>
        <p>
          Selecciona conscientemente los productos que quieres consultar. No se
          seleccionan a partir de marcas heredadas ni se convierten en
          obligaciones universales.
        </p>
        {optionalProductIds.map((id) => {
          const product = catalog.products.find((entry) => entry.id === id);
          const references = getProductReferences(profile, catalog, id);
          const selected = optionalIds.includes(id);
          const panelId = `optional-reference-${id}`;
          const headingId = `optional-product-${id}`;
          const datedReferences = references.some(({ requirement }) =>
            summary.items.some(
              (item) => item.id === requirement.id && item.estimatedDate,
            ),
          );
          return (
            <div className="optional-product" key={id}>
              <strong id={headingId}>{product?.name ?? id}</strong>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                aria-expanded={selected}
                aria-controls={panelId}
                onClick={() => void toggle(id)}
              >
                {selected
                  ? 'Ocultar referencia de este producto'
                  : 'Mostrar referencia de este producto'}
              </Button>
              {selected && (
                <div id={panelId} role="region" aria-labelledby={headingId}>
                  <p>
                    Consulta del producto seleccionado, visible aunque el filtro
                    de la línea de tiempo excluya sus requisitos. No confirma
                    indicación, acceso PAI ni intercambiabilidad.
                  </p>
                  {product ? (
                    <>
                      {product.brands.length > 0 && (
                        <p>
                          Marcas de referencia: {product.brands.join(', ')}.
                        </p>
                      )}
                      {product.note && <p>{product.note}</p>}
                    </>
                  ) : (
                    <p>
                      Producto no disponible en este catálogo. Se conserva tu
                      selección, sin sustituirlo por otro producto.
                    </p>
                  )}
                  {(catalog.optionalRequirements[id]?.length ?? 0) === 0 && (
                    <p>
                      No hay etapas complementarias independientes documentadas
                      para este producto en el catálogo.
                      {references.length > 0 &&
                        ' Las correspondencias con la referencia del perfil se muestran a continuación; no crean dosis adicionales.'}
                    </p>
                  )}
                  {!datedReferences && (
                    <p className="notice">
                      No hay fechas individuales documentadas disponibles para
                      este producto en la referencia actual. No se calculan
                      edades ni fechas por analogía con otro curso. Confirma la
                      programación con el vacunador.
                    </p>
                  )}
                  {references.length > 0 && (
                    <ul>
                      {references.map((reference) => {
                        const { requirement } = reference;
                        const scheduled = summary.items.find(
                          (item) => item.id === requirement.id,
                        );
                        return (
                          <li key={requirement.id}>
                            <strong>{requirement.name}</strong>
                            <p>
                              {referenceAgeLabel(reference, catalog)} · Dosis{' '}
                              {requirement.doseNumber} ·{' '}
                              {scheduled?.estimatedDate ? (
                                <time dateTime={scheduled.estimatedDate}>
                                  {formatCivilDate(scheduled.estimatedDate)}
                                </time>
                              ) : (
                                'Fecha individual por confirmar'
                              )}
                              {scheduled &&
                                ` · ${CALENDAR_STATUS_LABELS[scheduled.status]}`}
                            </p>
                            <p>
                              Previene: {requirement.disease}.{' '}
                              {requirement.access === 'pai'
                                ? 'Referencia PAI, sujeta a elegibilidad.'
                                : requirement.access === 'private'
                                  ? 'Referencia particular / complementaria.'
                                  : 'Acceso condicional; confirmar elegibilidad.'}
                            </p>
                            {requirement.note && <p>{requirement.note}</p>}
                            <SourceReferences
                              ids={requirement.sourceIds}
                              catalog={catalog}
                            />
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {product && (
                    <>
                      <h4>Fuentes del producto</h4>
                      <SourceReferences
                        ids={product.sourceIds}
                        catalog={catalog}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {notice && <p role="status">{notice}</p>}
        {error && <p role="alert">{error}</p>}
      </section>
      <p className="notice">
        Fechas orientativas. Consulta al vacunador para confirmar la
        programación. No calculamos rescate clínico ni intervalos mínimos.
      </p>
    </section>
  );
}

function SourceReferences({
  ids,
  catalog,
}: {
  ids: string[];
  catalog: Catalog;
}) {
  if (ids.length === 0)
    return <p>Sin fuentes documentadas disponibles: por revisar.</p>;
  return (
    <ul>
      {ids.map((id) => {
        const source = catalog.sources.find((entry) => entry.id === id);
        return (
          <li key={id}>
            {source ? (
              <>
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.title ?? source.id}
                </a>{' '}
                · fecha editorial:{' '}
                {source.publishedAt && source.publishedAt !== 'unknown'
                  ? formatCivilDate(source.publishedAt)
                  : 'no visible en el documento'}{' '}
                · consulta/revisión: {formatCivilDate(source.reviewedAt)} ·{' '}
                {source.verification === 'verified'
                  ? 'Verificada para las reglas documentadas'
                  : 'Por revisar; no concede equivalencia automática'}
              </>
            ) : (
              'Fuente no disponible: por revisar'
            )}
          </li>
        );
      })}
    </ul>
  );
}
