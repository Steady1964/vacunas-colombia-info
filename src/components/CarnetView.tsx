'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type {
  CivilDate,
  StoredProfile,
  VaccineAdministration,
  ReviewReason,
} from '@/lib/types';
import { milestoneLabels, reviewLabels } from './presentation';

export function CarnetView({
  profile,
  administrations,
  today,
  reviewById,
  onEdit,
  onDelete,
}: {
  profile: StoredProfile;
  administrations: VaccineAdministration[];
  today: CivilDate;
  reviewById?: Map<string, ReviewReason[]>;
  onEdit: (event: VaccineAdministration) => void;
  onDelete: (event: VaccineAdministration) => void;
}) {
  const [ascending, setAscending] = useState(false);

  const events = administrations
    .filter((a) => a.childId === profile.id)
    .sort(
      (a, b) =>
        (ascending ? 1 : -1) *
        (a.appliedDate.localeCompare(b.appliedDate) ||
          a.id.localeCompare(b.id)),
    );

  return (
    <section className="card carnet">
      <div className="section-heading carnet-heading">
        <div className="carnet-identity">
          <div className="carnet-kicker">
            Registro de vacunación · Carné familiar
          </div>
          <h2>{profile.nickname}</h2>
        </div>
        <div className="actions no-print">
          <Button variant="outline" onClick={() => setAscending((v) => !v)}>
            {ascending ? 'Más recientes primero' : 'Más antiguas primero'}
          </Button>
          <Button onClick={() => window.print()}>Imprimir / PDF A4</Button>
        </div>
      </div>
      <dl className="carnet-metadata">
        <div>
          <dt>Fecha de nacimiento</dt>
          <dd>{profile.birthDate}</dd>
        </div>
        <div>
          <dt>Fecha de exportación</dt>
          <dd>{today}</dd>
        </div>
        <div>
          <dt>Aplicaciones registradas</dt>
          <dd>{events.length}</dd>
        </div>
      </dl>
      <p className="carnet-disclaimer">
        Registro familiar no oficial. No reemplaza el carné expedido por el
        prestador ni PAIWEB. La revisión indica correspondencia del registro, no
        certificación clínica.
      </p>
      {events.length ? (
        <div className="table-scroll">
          <table className="carnet-table">
            <caption>
              Aplicaciones reales registradas
              <span className="carnet-table-context">
                {ascending
                  ? 'De la más antigua a la más reciente'
                  : 'De la más reciente a la más antigua'}
                . No incluye fechas previstas del calendario.
              </span>
            </caption>
            <colgroup>
              <col className="carnet-date-column" />
              <col className="carnet-product-column" />
              <col className="carnet-provider-column" />
              <col className="carnet-review-column" />
              <col className="no-print" />
            </colgroup>
            <thead>
              <tr className="carnet-page-identity">
                <th colSpan={4}>
                  {profile.nickname} · Nacimiento: {profile.birthDate}
                </th>
              </tr>
              <tr>
                <th scope="col" className="carnet-date-column">
                  Fecha de aplicación
                </th>
                <th scope="col" className="carnet-product-column">
                  Producto y dosis
                </th>
                <th scope="col" className="carnet-provider-column">
                  Datos de aplicación
                </th>
                <th scope="col" className="carnet-review-column">
                  Acceso y revisión
                </th>
                <th scope="col" className="no-print">
                  Acciones
                </th>
              </tr>
            </thead>
            {events.map((a) => {
              const reasons = reviewById?.get(a.id) ?? a.reviewReasons;
              return (
                <tbody key={a.id} className="carnet-application">
                  <tr>
                    <td className="carnet-date">{a.appliedDate}</td>
                    <td>
                      <strong>{a.productName}</strong>
                      <div className="carnet-detail">
                        {a.doseNumber
                          ? `Dosis ${a.doseNumber}`
                          : 'Dosis por verificar'}
                      </div>
                      <div className="carnet-detail">
                        Etapa:{' '}
                        {a.milestoneId
                          ? (milestoneLabels[a.milestoneId] ?? a.milestoneId)
                          : 'Por verificar con el vacunador'}
                      </div>
                    </td>
                    <td>
                      <div>Marca: {a.brand || 'No registrada'}</div>
                      <div>Lote: {a.lot || 'No registrado'}</div>
                      <div>
                        IPS / prestador: {a.provider || 'No registrado'}
                      </div>
                    </td>
                    <td>
                      Acceso:{' '}
                      {a.accessType === 'pai'
                        ? 'PAI'
                        : a.accessType === 'private'
                          ? 'Particular'
                          : 'Desconocido'}
                      <br />
                      PAIWEB:{' '}
                      {a.paiwebStatus === 'yes'
                        ? 'Sí'
                        : a.paiwebStatus === 'no'
                          ? 'No'
                          : 'No se conoce'}
                      <br />
                      {reasons.length || a.coverageStatus !== 'verified' ? (
                        <>
                          <strong className="carnet-review-status">
                            Por verificar con el vacunador
                          </strong>
                          <ul>
                            {reasons.map((r) => (
                              <li key={r}>{reviewLabels[r]}</li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <span className="carnet-review-status">
                          Correspondencia registrada verificada
                        </span>
                      )}
                    </td>
                    <td className="no-print">
                      <div className="actions">
                        <Button variant="outline" onClick={() => onEdit(a)}>
                          Editar
                        </Button>
                        <Button variant="outline" onClick={() => onDelete(a)}>
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {a.notes && (
                    <tr className="carnet-notes-row">
                      <td colSpan={4}>
                        <span className="carnet-notes-label">
                          Observaciones:{' '}
                        </span>
                        <span className="carnet-notes">{a.notes}</span>
                      </td>
                      <td className="no-print" />
                    </tr>
                  )}
                </tbody>
              );
            })}
          </table>
        </div>
      ) : (
        <p className="carnet-empty">
          Aún no hay aplicaciones reales registradas. Las fechas del calendario
          no se incluyen como vacunas aplicadas.
        </p>
      )}
    </section>
  );
}
