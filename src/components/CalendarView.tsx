'use client';

import { useState } from 'react';
import type { ChildProfile, ScheduleReferenceId } from '@/lib/types';
import type { Catalog } from '@/data/catalog/types';
import type { ScheduleSummary } from '@/lib/schedule/summarizeSchedule';
import {
  getProductReferences,
  getScheduleReferences,
  referenceAgeLabel,
} from '@/lib/schedule/referencePresentation';
import { Button } from '@/components/ui/button';
import { ScheduleSelector } from './ScheduleSelector';
import { STATUS_LABELS } from './presentation';

export function CalendarView({
  profile,
  referenceId,
  catalog,
  summary,
  optionalIds,
  onScheduleChange,
  onOptionalChange,
}: {
  profile: ChildProfile;
  referenceId: ScheduleReferenceId;
  catalog: Catalog;
  summary: ScheduleSummary;
  optionalIds: string[];
  onScheduleChange: (id: ScheduleReferenceId) => void;
  onOptionalChange: (ids: string[]) => Promise<void>;
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
        Catálogo {catalog.version} · revisión {catalog.reviewedAt}
      </p>
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
      <div className="timeline">
        {summary.items
          .filter(
            (r) =>
              filter === 'all' ||
              (filter === 'pai' ? r.access === 'pai' : r.access !== 'pai'),
          )
          .map((r) => (
            <article className="event" key={r.id}>
              <div className="event-date">
                <strong>{ageLabel(r.id)}</strong>
                <br />
                <time dateTime={r.estimatedDate ?? undefined}>
                  {r.estimatedDate ?? 'Fecha por confirmar'}
                </time>
              </div>
              <div className="dotline" />
              <div className="event-content">
                <strong>{r.name}</strong>
                <span className={`tag status-${r.status}`}>
                  {STATUS_LABELS[r.status]}
                </span>
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
                                  {scheduled.estimatedDate}
                                </time>
                              ) : (
                                'Fecha individual por confirmar'
                              )}
                              {scheduled &&
                                ` · ${STATUS_LABELS[scheduled.status]}`}
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
                  ? source.publishedAt
                  : 'no visible en el documento'}{' '}
                · consulta/revisión: {source.reviewedAt} ·{' '}
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
