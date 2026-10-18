'use client';

import { useState } from 'react';
import type { VaccineDb } from '@/lib/db';
import type {
  CivilDate,
  FamilySnapshot,
  ScheduleReferenceId,
  StoredProfile,
  VaccineAdministration,
} from '@/lib/types';
import type { Catalog } from '@/data/catalog/types';
import { Button } from '@/components/ui/button';
import { requestPersistentStorage } from '@/lib/pwa';
import { BackupPanel } from './BackupPanel';
import { MigrationReviewPanel } from './MigrationReviewPanel';
import { ScheduleSelector } from './ScheduleSelector';
import { PrivacyNotice } from './PrivacyNotice';

export function SettingsView({
  db,
  snapshot,
  profile,
  scheduleReferenceId,
  today,
  catalog,
  onNewProfile,
  onEditProfile,
  onDeleteProfile,
  onDeleteAll,
  onScheduleChange,
  onEditAdministration,
  onDirtyChange,
}: {
  db: VaccineDb;
  snapshot: FamilySnapshot;
  profile?: StoredProfile;
  scheduleReferenceId: ScheduleReferenceId | '';
  today: CivilDate;
  catalog: Catalog;
  onNewProfile: () => void;
  onEditProfile: (profile: StoredProfile) => void;
  onDeleteProfile: (profile: StoredProfile) => void;
  onDeleteAll: () => void;
  onScheduleChange: (id: ScheduleReferenceId) => void;
  onEditAdministration: (event: VaccineAdministration) => void;
  onDirtyChange: (key: string, dirty: boolean) => void;
}) {
  const [storageMessage, setStorageMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function persist() {
    setBusy(true);
    try {
      const result = await requestPersistentStorage();
      setStorageMessage(
        result === 'granted'
          ? 'El navegador concedió almacenamiento persistente. No garantiza permanencia: conserva copias.'
          : result === 'denied'
            ? 'El navegador no concedió persistencia. Puedes seguir usando la app y hacer respaldos.'
            : 'Este navegador no permite solicitar persistencia. Puedes seguir usando la app y hacer respaldos.',
      );
    } catch {
      setStorageMessage(
        'No fue posible solicitar persistencia. Tus datos no se modificaron; conserva respaldos.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="settings-sections" aria-labelledby="settings-heading">
      <header>
        <h2 id="settings-heading">Ajustes de la familia</h2>
        <p>
          Administra los perfiles y los datos guardados en este dispositivo.
        </p>
      </header>

      <details className="settings-section" open>
        <summary>Perfiles de la familia</summary>
        <div className="settings-section-body">
          {snapshot.profiles.length === 0 && (
            <p>Crea el primer perfil para habilitar Calendario y Carné.</p>
          )}
          {snapshot.profiles.map((p) => (
            <div className="review-row" key={p.id}>
              <strong>{p.nickname}</strong>
              <p>
                {p.birthDate} ·{' '}
                {p.primaryScheduleId
                  ? 'Esquema elegido'
                  : 'Pendiente de elegir esquema'}
              </p>
              <div className="actions">
                <Button variant="outline" onClick={() => onEditProfile(p)}>
                  Editar {p.nickname}
                </Button>
                <Button variant="outline" onClick={() => onDeleteProfile(p)}>
                  Eliminar perfil de {p.nickname}…
                </Button>
              </div>
            </div>
          ))}
          <Button onClick={onNewProfile}>
            {snapshot.profiles.length === 0
              ? 'Crear primer perfil'
              : 'Agregar otro perfil'}
          </Button>
          {profile && (
            <section className="settings-reference">
              <h3>Referencia de {profile.nickname}</h3>
              <ScheduleSelector
                value={scheduleReferenceId}
                onChange={onScheduleChange}
                id="settings-schedule"
              />
              <p>
                Versión del perfil: {profile.referenceCatalogVersion}. Los
                eventos históricos no cambian al cambiar de referencia.
              </p>
            </section>
          )}
        </div>
      </details>

      <details className="settings-section">
        <summary>Copias de seguridad</summary>
        <div className="settings-section-body">
          <BackupPanel
            db={db}
            snapshot={snapshot}
            today={today}
            onBusyChange={(dirty) => onDirtyChange('backup', dirty)}
          />
        </div>
      </details>

      <details
        className="settings-section"
        open={snapshot.migrationIssues.length > 0}
      >
        <summary>Revisar registros conservados</summary>
        <div className="settings-section-body">
          <MigrationReviewPanel
            db={db}
            snapshot={snapshot}
            today={today}
            catalog={catalog}
            onEditAdministration={onEditAdministration}
            onDirtyChange={(dirty) => onDirtyChange('migration', dirty)}
          />
        </div>
      </details>

      <details className="settings-section">
        <summary>Almacenamiento y borrado</summary>
        <div className="settings-section-body">
          <section className="card">
            <h2>Almacenamiento del dispositivo</h2>
            <p>
              Solicitar persistencia puede reducir las limpiezas automáticas,
              pero no reemplaza una copia de seguridad.
            </p>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void persist()}
            >
              {busy ? 'Solicitando…' : 'Solicitar almacenamiento persistente'}
            </Button>
            {storageMessage && <p role="status">{storageMessage}</p>}
            <hr />
            <h3>Borrar todos los datos familiares</h3>
            <p>
              Requiere dos confirmaciones y ofrece una copia antes de borrar. No
              elimina la aplicación offline.
            </p>
            <Button variant="destructive" onClick={onDeleteAll}>
              Eliminar todos los datos…
            </Button>
          </section>
        </div>
      </details>

      <details className="settings-section">
        <summary>Privacidad</summary>
        <div className="settings-section-body">
          <PrivacyNotice />
        </div>
      </details>
    </section>
  );
}
