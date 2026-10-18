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
      <div className="section-heading">
        <div>
          <div className="eyebrow">Carné digital familiar</div>
          <h2>{profile.nickname}</h2>
          <p>
            Nacimiento: {profile.birthDate} · Fecha de exportación: {today}
          </p>
        </div>
        <div className="actions no-print">
          <Button variant="outline" onClick={() => setAscending((v) => !v)}>
            {ascending ? 'Más recientes primero' : 'Más antiguas primero'}
          </Button>
          <Button onClick={() => window.print()}>Imprimir / PDF A4</Button>
        </div>
      </div>
      <p className="notice">
        Registro familiar no oficial. No reemplaza el carné de vacunación
        expedido por el prestador ni PAIWEB.
      </p>
      {events.length ? (
        <div className="table-scroll">
          <table>
            <caption>Aplicaciones reales registradas ({events.length})</caption>
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Producto y dosis</th>
                <th scope="col">Marca, lote e IPS</th>
                <th scope="col">Acceso y revisión</th>
                <th scope="col" className="no-print">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {events.map((a) => {
                const reasons = reviewById?.get(a.id) ?? a.reviewReasons;
                return (
                  <tr key={a.id}>
                    <td>{a.appliedDate}</td>
                    <td>
                      <strong>{a.productName}</strong>
                      <br />
                      {a.doseNumber
                        ? `Dosis ${a.doseNumber}`
                        : 'Dosis por verificar'}
                      {a.milestoneId && (
                        <>
                          <br />
                          Etapa:{' '}
                          {milestoneLabels[a.milestoneId] ??
                            'Por verificar con el vacunador'}
                        </>
                      )}
                      {a.notes && <p>Observaciones: {a.notes}</p>}
                    </td>
                    <td>
                      Marca: {a.brand || 'No registrada'}
                      <br />
                      Lote: {a.lot || 'No registrado'}
                      <br />
                      IPS: {a.provider || 'No registrada'}
                    </td>
                    <td>
                      {a.accessType === 'pai'
                        ? 'PAI'
                        : a.accessType === 'private'
                          ? 'Particular'
                          : 'Acceso desconocido'}
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
                          <strong>Por verificar con el vacunador</strong>
                          <ul>
                            {reasons.map((r) => (
                              <li key={r}>{reviewLabels[r]}</li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        'Correspondencia registrada verificada (no certificación clínica)'
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
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p>
          Aún no hay aplicaciones reales registradas. Las fechas del calendario
          no se incluyen como vacunas aplicadas.
        </p>
      )}
    </section>
  );
}
