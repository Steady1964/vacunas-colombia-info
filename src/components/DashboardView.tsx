'use client';

import type { ChildProfile, CivilDate } from '@/lib/types';
import { ageAt } from '@/lib/civilDate';
import type { ScheduleSummary } from '@/lib/schedule/summarizeSchedule';

export function DashboardView({
  profile,
  referenceLabel,
  summary,
  today,
  eventCount,
}: {
  profile: ChildProfile;
  referenceLabel: string;
  summary: ScheduleSummary;
  today: CivilDate;
  eventCount: number;
}) {
  const age = ageAt(profile.birthDate, today);
  const next = summary.items.filter((item) =>
    summary.nextRequirementIds.includes(item.id),
  );

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
            <span>Próximos (30 días)</span>
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
        <div className="eyebrow">Siguiente fecha orientativa</div>
        <h2>{summary.nextDate ?? 'Sin próxima fecha confirmada'}</h2>
        {next.length > 0 ? (
          <ul>
            {next.map((r) => (
              <li key={r.id}>
                {r.name} · dosis {r.doseNumber}
              </li>
            ))}
          </ul>
        ) : (
          <p>Consulta al vacunador para confirmar la programación.</p>
        )}
      </section>
      <section className="card wide">
        <h2>Próximas vacunas</h2>
        {summary.items.some((r) => r.status === 'upcoming') ? (
          <ul className="upcoming-list">
            {summary.items
              .filter((r) => r.status === 'upcoming')
              .map((r) => (
                <li key={r.id}>
                  <strong>{r.estimatedDate}</strong> · {r.name} · dosis{' '}
                  {r.doseNumber}
                </li>
              ))}
          </ul>
        ) : (
          <p>No hay requisitos sin cubrir con fecha en los próximos 30 días.</p>
        )}
        <p>Fechas orientativas. Confirma el esquema con tu vacunador.</p>
      </section>
    </div>
  );
}
