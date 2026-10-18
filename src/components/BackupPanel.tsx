'use client';

import { useRef, useState } from 'react';
import type { VaccineDb } from '@/lib/db';
import type { CivilDate, FamilySnapshot, ImportPreview } from '@/lib/types';
import { applyImport, previewImport } from '@/lib/backup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { downloadBackup } from './downloadBackup';
import { operationError } from './presentation';

export function BackupPanel({
  db,
  snapshot,
  today,
  onBusyChange,
}: {
  db: VaccineDb;
  snapshot: FamilySnapshot;
  today: CivilDate;
  onBusyChange: (busy: boolean) => void;
}) {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [replace, setReplace] = useState(false);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const inFlight = useRef(false);

  function cancel() {
    if (busy) return;
    setPreview(null);
    setReplace(false);
    setStale(false);
    setError('');
    onBusyChange(false);
    if (fileInput.current) fileInput.current.value = '';
  }

  async function selectFile(file?: File) {
    if (!file || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    onBusyChange(true);
    setError('');
    setMessage('');
    setPreview(null);
    setReplace(false);
    setStale(false);
    try {
      const text = await file.text();
      setPreview(
        previewImport(text, snapshot, { today, now: new Date().toISOString() }),
      );
    } catch {
      setError(
        'No se pudo validar el respaldo. Comprueba que sea JSON de Vacunas Colombia v1 o v2, sin fechas o relaciones inválidas. No se modificó ningún dato.',
      );
      onBusyChange(false);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  async function apply(mode: 'merge' | 'replace') {
    if (!preview || inFlight.current || stale) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      await applyImport(db, preview, mode);
      setPreview(null);
      setReplace(false);
      onBusyChange(false);
      setMessage('Respaldo importado correctamente.');
      if (fileInput.current) fileInput.current.value = '';
    } catch (err) {
      setError(operationError(err));
      if (err instanceof Error && err.message.includes('stale-preview'))
        setStale(true);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  function exportCopy() {
    try {
      downloadBackup(snapshot);
      setMessage(
        'Copia preparada para descargar. Guárdala en un lugar seguro.',
      );
    } catch {
      setError(
        'No se pudo preparar la descarga. Puedes reintentar sin modificar tus datos.',
      );
    }
  }

  return (
    <section className="card">
      <h2>Respaldo y restauración local</h2>
      <p>
        El archivo JSON contiene toda la familia y los registros de migración.{' '}
        <strong>No está cifrado y contiene información privada.</strong> El
        archivo se lee en este dispositivo; no se sube a un servidor.
      </p>
      <Button variant="outline" disabled={busy} onClick={exportCopy}>
        Exportar respaldo familiar
      </Button>
      <div className="field">
        <Label htmlFor="backup-file">
          Importar archivo JSON (solo previsualiza)
        </Label>
        <Input
          ref={fileInput}
          id="backup-file"
          type="file"
          accept="application/json,.json"
          disabled={busy}
          onChange={(e) => void selectFile(e.target.files?.[0])}
        />
      </div>
      {preview && (
        <div className="notice">
          <h3>Previsualización: aún no se ha importado</h3>
          <p>
            Perfiles recibidos: {preview.incoming.profiles.length};
            aplicaciones: {preview.incoming.administrations.length};
            incidencias: {preview.incoming.migrationIssues.length}.
          </p>
          <p>
            Perfiles afectados:{' '}
            {preview.incoming.profiles.map((p) => p.nickname).join(', ') ||
              'Ninguno'}
            .
          </p>
          <p>
            Nuevos: {preview.added.profiles} perfiles,{' '}
            {preview.added.administrations} aplicaciones,{' '}
            {preview.added.migrationIssues} incidencias.
          </p>
          <p>
            Idénticos (se omiten al combinar): {preview.identical.profiles}{' '}
            perfiles, {preview.identical.administrations} aplicaciones,{' '}
            {preview.identical.migrationIssues} incidencias.
          </p>
          <p>
            {preview.reviewCount} registros por revisar;{' '}
            {preview.conflicts.length} conflictos de contenido.
          </p>
          {preview.conflicts.length > 0 && (
            <ul>
              {preview.conflicts.map((c) => (
                <li key={`${c.entity}:${c.id}`}>
                  {c.entity}: {c.id}
                </li>
              ))}
            </ul>
          )}
          <p>
            Combinar conserva preferencias locales. Cualquier conflicto impide
            toda la combinación.
          </p>
          <div className="actions">
            <Button
              disabled={busy || stale || preview.conflicts.length > 0}
              onClick={() => void apply('merge')}
            >
              Combinar
            </Button>
            <Button
              variant="outline"
              disabled={busy || stale}
              onClick={() => setReplace(true)}
            >
              Reemplazar toda la familia…
            </Button>
            <Button variant="outline" disabled={busy} onClick={cancel}>
              Cancelar importación
            </Button>
          </div>
          {replace && (
            <div role="group" aria-label="Confirmar reemplazo">
              <h3>Reemplazar elimina el conjunto local actual</h3>
              <p>
                Exporta una copia antes de continuar. Solo se conservarán los
                datos de este archivo. Esta acción no se puede deshacer sin
                respaldo.
              </p>
              <div className="actions">
                <Button variant="outline" disabled={busy} onClick={exportCopy}>
                  Descargar copia actual antes de reemplazar
                </Button>
                <Button
                  variant="destructive"
                  disabled={busy || stale}
                  onClick={() => void apply('replace')}
                >
                  Confirmo reemplazar todos los datos locales
                </Button>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => setReplace(false)}
                >
                  Conservar datos locales
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
