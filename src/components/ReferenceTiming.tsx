import type { Catalog } from '@/data/catalog/types';
import { formatCivilDate } from '@/lib/datePresentation';
import type { ScheduledRequirement } from '@/lib/schedule/calculateSchedule';

export function ReferenceTiming({
  requirement,
  catalog,
}: {
  requirement: ScheduledRequirement;
  catalog: Catalog;
}) {
  const timing = requirement.timing;
  if (!timing) return null;

  return (
    <details className="mt-2 text-sm">
      <summary>
        {timing.kind === 'after-administration'
          ? 'Calculada desde una aplicación real'
          : 'Por qué falta confirmar esta fecha'}
      </summary>
      {timing.kind === 'after-administration' ? (
        <p>
          {timing.intervalDays / 7} semanas ({timing.intervalDays} días) después
          de la aplicación del {formatCivilDate(timing.appliedDate)}. Es el
          intervalo de la pauta seleccionada, no un mínimo universal ni una
          autorización para cambiar de producto.
        </p>
      ) : (
        <p>{timing.reason}</p>
      )}
      <p>
        Referencia original por edad:{' '}
        {formatCivilDate(timing.referenceDate ?? '')}. No reemplaza la fecha
        real registrada ni indica aplicar una dosis ahora.
      </p>
      <ul>
        {timing.sourceIds.map((id) => {
          const source = catalog.sources.find((entry) => entry.id === id);
          return (
            <li key={id}>
              {source ? (
                <>
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.title ?? source.id}
                  </a>
                  {source.verification !== 'verified' && ' · por verificar'}
                </>
              ) : (
                <>Fuente no disponible: {id}</>
              )}
            </li>
          );
        })}
      </ul>
    </details>
  );
}
