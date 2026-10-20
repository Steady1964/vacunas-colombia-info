'use client';

import { useEffect, useRef, useState } from 'react';
import {
  CalendarDays,
  HeartPulse,
  Info,
  Settings,
  ShieldCheck,
  Syringe,
} from 'lucide-react';
import { useFamily } from '@/hooks/useFamily';
import { useToday } from '@/hooks/useToday';
import {
  CURRENT_CATALOG_VERSION,
  getCatalog,
  getScheduleReference,
  identifyScheduleReference,
  supportsSchedule,
} from '@/data/catalog';
import type { Catalog } from '@/data/catalog/types';
import type {
  ChildProfile,
  ScheduleReferenceId,
  StoredProfile,
  VaccineAdministration,
} from '@/lib/types';
import {
  clearFamily,
  deleteAdministration,
  deleteProfile,
  saveAdministration,
  saveProfile,
  setPreference,
} from '@/lib/repository';
import { calculateSchedule } from '@/lib/schedule/calculateSchedule';
import { resolveCoverage } from '@/lib/schedule/resolveCoverage';
import { summarizeSchedule } from '@/lib/schedule/summarizeSchedule';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ProfileForm } from './ProfileForm';
import { ProfileSelector } from './ProfileSelector';
import { AdministrationForm } from './AdministrationForm';
import { DashboardView } from './DashboardView';
import { CalendarView } from './CalendarView';
import { CarnetView } from './CarnetView';
import { InformationView } from './InformationView';
import { SettingsView } from './SettingsView';
import { DataRemovalDialog, type RemovalScope } from './DataRemovalDialog';
import { PwaManager } from './PwaManager';
import { operationError, SCHEDULE_CONFIRMATION } from './presentation';

type View = 'inicio' | 'calendario' | 'carne' | 'ajustes';

type FormDialog =
  | { type: 'create-profile'; commandId: string }
  | { type: 'edit-profile'; profile: StoredProfile; commandId: string }
  | {
      type: 'create-administration';
      child: StoredProfile;
      commandId: string;
      catalog: Catalog;
    }
  | {
      type: 'edit-administration';
      child: StoredProfile;
      administration: VaccineAdministration;
      commandId: string;
      catalog: Catalog;
    };

type Removal = {
  scope: RemovalScope;
  label: string;
  childId?: string;
  administrationId?: string;
};

const NAVIGATION_ITEMS = [
  { id: 'inicio', label: 'Inicio', icon: HeartPulse },
  { id: 'calendario', label: 'Calendario', icon: CalendarDays },
  { id: 'carne', label: 'Carné', icon: ShieldCheck },
  { id: 'ajustes', label: 'Ajustes', icon: Settings },
] as const;

export function AppClient() {
  const family = useFamily();
  const today = useToday();
  const [requestedView, setView] = useState<View>('inicio');
  const [dialog, setDialog] = useState<FormDialog | null>(null);
  const [formDirty, setFormDirty] = useState(false);
  const [discardRequested, setDiscardRequested] = useState(false);
  const [otherDirty, setOtherDirty] = useState<Record<string, boolean>>({});
  const [mutationBusy, setMutationBusy] = useState(false);
  const [error, setError] = useState('');
  const [removal, setRemoval] = useState<Removal | null>(null);
  const [scheduleChange, setScheduleChange] = useState<{
    profile: StoredProfile;
    referenceId: ScheduleReferenceId;
    returnFocusId: 'calendar-schedule' | 'settings-schedule';
  } | null>(null);
  const [catalogChange, setCatalogChange] = useState<StoredProfile | null>(
    null,
  );
  const mutationLock = useRef(false);
  const discardReturnFocus = useRef<HTMLElement | null>(null);

  const snapshot = family.snapshot;
  const storedActive = snapshot?.preferences.find(
    (p) => p.key === 'activeProfileId',
  )?.value;
  const active =
    snapshot?.profiles.find((p) => p.id === storedActive) ??
    snapshot?.profiles[0];
  const view =
    !active && (requestedView === 'calendario' || requestedView === 'carne')
      ? 'inicio'
      : requestedView;
  const currentCatalog = getCatalog(CURRENT_CATALOG_VERSION);
  const catalog = active
    ? getCatalog(active.referenceCatalogVersion)
    : currentCatalog;
  const applications =
    snapshot?.administrations.filter((a) => a.childId === active?.id) ?? [];
  const optionalValue = snapshot?.preferences.find(
    (p) => p.key === `optional-products:${active?.id}`,
  )?.value;
  const optionalIds = Array.isArray(optionalValue)
    ? optionalValue.filter((v): v is string => typeof v === 'string')
    : [];
  const profile: ChildProfile | undefined = active?.primaryScheduleId
    ? (active as ChildProfile)
    : undefined;
  const activeReferenceId = profile
    ? identifyScheduleReference(profile)
    : undefined;
  const activeReference = activeReferenceId
    ? getScheduleReference(activeReferenceId)
    : undefined;
  const scheduled =
    profile &&
    catalog &&
    activeReference &&
    supportsSchedule(catalog, profile.primaryScheduleId) &&
    today
      ? calculateSchedule(profile, catalog, today, optionalIds)
      : null;
  const coverage =
    profile && catalog && today && scheduled
      ? resolveCoverage(profile, applications, scheduled, catalog, today)
      : null;
  const summary =
    scheduled && coverage && today
      ? summarizeSchedule(scheduled, coverage, today)
      : null;
  const referenceUnavailable = Boolean(
    active && (!catalog || (profile && !activeReference)),
  );
  const hasUnsavedChanges =
    formDirty ||
    Boolean(dialog) ||
    Object.values(otherDirty).some(Boolean) ||
    mutationBusy ||
    Boolean(scheduleChange) ||
    Boolean(catalogChange) ||
    Boolean(removal);
  const writable =
    family.status === 'ready' && Boolean(family.db) && Boolean(today);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    function protect(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = '';
    }
    window.addEventListener('beforeunload', protect);
    return () => window.removeEventListener('beforeunload', protect);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (
      !family.db ||
      family.status !== 'ready' ||
      !active ||
      storedActive === active.id
    )
      return;
    void setPreference(family.db, 'activeProfileId', active.id).catch(() =>
      setError(
        'No se pudo recordar el perfil activo. Puedes seleccionarlo de nuevo; tus perfiles permanecen guardados.',
      ),
    );
  }, [family.db, family.status, active?.id, storedActive]);

  function closeForm() {
    setDialog(null);
    setDiscardRequested(false);
    setFormDirty(false);
  }

  function requestCloseForm() {
    if (mutationBusy || discardRequested) return;
    if (!formDirty) {
      closeForm();
      return;
    }
    discardReturnFocus.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setDiscardRequested(true);
  }

  function createProfile() {
    setFormDirty(false);
    setDialog({ type: 'create-profile', commandId: crypto.randomUUID() });
  }

  function editProfile(p: StoredProfile) {
    setFormDirty(false);
    setDialog({ type: 'edit-profile', profile: p, commandId: p.id });
  }

  function editAdministration(a: VaccineAdministration) {
    const child = snapshot?.profiles.find((p) => p.id === a.childId);
    const reference = child && getCatalog(child.referenceCatalogVersion);
    if (!child || !reference) {
      setError(
        'El catálogo de este registro no está disponible. Selecciona el perfil y confirma una referencia disponible antes de editar.',
      );
      return;
    }
    setFormDirty(false);
    setDialog({
      type: 'edit-administration',
      child,
      administration: a,
      commandId: a.id,
      catalog: reference,
    });
  }

  function register() {
    if (!active || !catalog) return;
    setFormDirty(false);
    setDialog({
      type: 'create-administration',
      child: active,
      commandId: crypto.randomUUID(),
      catalog,
    });
  }

  async function mutate(action: () => Promise<void>) {
    if (mutationLock.current) return;
    mutationLock.current = true;
    setMutationBusy(true);
    setError('');
    try {
      await action();
    } catch (err) {
      setError(operationError(err));
    } finally {
      mutationLock.current = false;
      setMutationBusy(false);
    }
  }

  async function confirmSchedule() {
    const change = scheduleChange;
    if (!change || !family.db || !today) return;
    const selectedReference = getScheduleReference(change.referenceId);
    const selectedCatalog =
      selectedReference && getCatalog(selectedReference.catalogVersion);
    if (!selectedReference || !selectedCatalog) {
      setError('La referencia seleccionada no está disponible.');
      return;
    }
    await mutate(async () => {
      await saveProfile(
        family.db!,
        {
          id: change.profile.id,
          mode: 'edit',
          input: {
            nickname: change.profile.nickname,
            birthDate: change.profile.birthDate,
            scheduleReferenceId: selectedReference.id,
          },
        },
        { today, now: new Date().toISOString(), catalog: selectedCatalog },
      );
      setScheduleChange(null);
    });
  }

  if (!snapshot || !today || !currentCatalog)
    return (
      <main className="app">
        <header className="topbar">
          <div className="brand">
            <Syringe />
            Vacunas Colombia
          </div>
        </header>
        <section className="wrap">
          <div className="card" role="status">
            <h1>
              {family.status === 'error' || family.status === 'blocked'
                ? 'Almacenamiento no disponible'
                : 'Cargando tu información local…'}
            </h1>
            <p>
              {family.status === 'error' || family.status === 'blocked'
                ? 'No borres los datos del navegador. Cierra otras pestañas de la app si bloquean la actualización y vuelve a abrirla. No se creó una familia alternativa ni se reiniciaron tus datos.'
                : 'Abrimos el almacenamiento de este dispositivo sin enviar datos familiares.'}
            </p>
            {!currentCatalog && (
              <p>No está disponible el catálogo incluido en esta versión.</p>
            )}
          </div>
        </section>
        <PwaManager
          hasUnsavedChanges={hasUnsavedChanges}
          storageBlocked={family.status === 'blocked'}
        />
      </main>
    );

  return (
    <main className="app" tabIndex={-1}>
      <header className="topbar no-print">
        <div className="brand">
          <span className="brandmark">
            <Syringe size={18} />
          </span>
          Vacunas Colombia
        </div>
        <div className="topbar-actions">
          {active && (
            <ProfileSelector
              profiles={snapshot.profiles}
              activeId={active.id}
              disabled={!writable || mutationBusy}
              onChange={(id) =>
                void mutate(async () => {
                  await setPreference(family.db!, 'activeProfileId', id);
                })
              }
            />
          )}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                id="information-trigger"
                type="button"
                variant="outline"
                className="information-button"
                aria-label="Información y ayuda"
                title="Información y ayuda"
              >
                <Info size={20} aria-hidden="true" />
                <span className="information-button-label">Información</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="information-dialog">
              <DialogHeader>
                <DialogTitle>Información y ayuda</DialogTitle>
                <DialogDescription>
                  Consulta la guía para familias, las fuentes y el cuidado de
                  tus datos. Las fechas son orientativas y no sustituyen al
                  vacunador.
                </DialogDescription>
              </DialogHeader>
              <InformationView catalog={catalog ?? currentCatalog} />
            </DialogContent>
          </Dialog>
        </div>
      </header>
      <div className="wrap">
        {family.status !== 'ready' && (
          <div className="notice no-print" role="alert">
            <strong>El almacenamiento está bloqueado o no disponible.</strong>{' '}
            Conservamos la última vista y los formularios. No borres datos;
            cierra otras pestañas que bloqueen la actualización. Las escrituras
            pueden fallar hasta resolverlo.
          </div>
        )}
        {error && (
          <div className="error no-print" role="alert">
            {error}
            <Button variant="outline" onClick={() => setError('')}>
              Cerrar aviso
            </Button>
          </div>
        )}
        <section className="hero no-print">
          <div>
            <div className="eyebrow">Tu carné, en tu dispositivo</div>
            <h1>
              {active
                ? `Un paso a la vez, ${active.nickname}.`
                : 'Organiza las vacunas de tu peque.'}
            </h1>
            <p className="sub">
              Fechas orientativas y un registro de vacunas para cada perfil,
              guardado en este dispositivo.
            </p>
          </div>
          {active && view === 'inicio' && (
            <Button disabled={!writable || !catalog} onClick={register}>
              Registrar vacuna aplicada
            </Button>
          )}
        </section>
        {!active && view === 'inicio' && (
          <section className="card no-print">
            <h2>Empieza con un perfil</h2>
            <p>
              Solo necesitamos un nombre o apodo, fecha de nacimiento y el
              esquema que te indicó tu vacunador. No hay perfiles de ejemplo ni
              cuentas. La información se guarda en este dispositivo; conserva
              respaldos.
            </p>
            <Button disabled={!writable} onClick={createProfile}>
              Crear primer perfil
            </Button>
            {snapshot.migrationIssues.length > 0 && (
              <p>
                Hay registros heredados conservados. Abre Ajustes para
                revisarlos o exportarlos.
              </p>
            )}
          </section>
        )}
        {active &&
          !active.primaryScheduleId &&
          view !== 'carne' &&
          view !== 'ajustes' && (
            <section className="card">
              <h2>Este perfil necesita elegir esquema</h2>
              <p>
                No inferimos el esquema desde el nacimiento. Elige
                conscientemente la referencia indicada por tu vacunador antes de
                generar fechas. Las aplicaciones heredadas se conservan por
                revisar.
              </p>
              <Button disabled={!writable} onClick={() => editProfile(active)}>
                Elegir esquema y revisar perfil
              </Button>
            </section>
          )}
        {active && referenceUnavailable && view !== 'carne' && (
          <section className="card">
            <h2>Referencia del calendario no disponible</h2>
            <p>
              Este perfil conserva {active.referenceCatalogVersion} y{' '}
              {active.primaryScheduleId ?? 'un esquema pendiente'}. No
              sustituimos esa combinación silenciosamente. El historial
              permanece en el Carné y en los respaldos.
            </p>
            <Button
              disabled={!writable}
              onClick={() => setCatalogChange(active)}
            >
              Revisar cambio a Esquema 2026
            </Button>
          </section>
        )}
        {view === 'inicio' && profile && activeReference && summary && (
          <DashboardView
            profile={profile}
            referenceLabel={activeReference.label}
            summary={summary}
            today={today}
            eventCount={applications.length}
          />
        )}
        {view === 'calendario' &&
          profile &&
          activeReferenceId &&
          catalog &&
          summary && (
            <CalendarView
              key={profile.id}
              profile={profile}
              referenceId={activeReferenceId}
              catalog={catalog}
              summary={summary}
              administrations={applications}
              reviewById={coverage?.reviewByAdministrationId}
              onEditAdministration={editAdministration}
              optionalIds={optionalIds}
              onScheduleChange={(referenceId) => {
                if (referenceId !== activeReferenceId)
                  setScheduleChange({
                    profile,
                    referenceId,
                    returnFocusId: 'calendar-schedule',
                  });
              }}
              onOptionalChange={(ids) =>
                setPreference(
                  family.db!,
                  `optional-products:${profile.id}`,
                  ids,
                )
              }
            />
          )}
        {view === 'carne' && active && (
          <CarnetView
            key={active.id}
            profile={active}
            administrations={applications}
            today={today}
            reviewById={coverage?.reviewByAdministrationId}
            onEdit={editAdministration}
            onDelete={(event) =>
              setRemoval({
                scope: 'administration',
                label: `la aplicación de ${event.productName} del ${event.appliedDate}`,
                childId: event.childId,
                administrationId: event.id,
              })
            }
          />
        )}
        {family.db && (
          <div
            hidden={view !== 'ajustes'}
            className="settings-container no-print"
          >
            <SettingsView
              db={family.db}
              snapshot={snapshot}
              profile={active}
              scheduleReferenceId={activeReferenceId ?? ''}
              today={today}
              catalog={catalog ?? currentCatalog}
              onNewProfile={createProfile}
              onEditProfile={editProfile}
              onDeleteProfile={(p) =>
                setRemoval({
                  scope: 'profile',
                  label: `el perfil ${p.nickname}`,
                  childId: p.id,
                })
              }
              onDeleteAll={() =>
                setRemoval({ scope: 'all', label: 'todos los datos' })
              }
              onScheduleChange={(referenceId) => {
                if (active && referenceId !== activeReferenceId)
                  setScheduleChange({
                    profile: active,
                    referenceId,
                    returnFocusId: 'settings-schedule',
                  });
              }}
              onEditAdministration={editAdministration}
              onDirtyChange={(key, dirty) =>
                setOtherDirty((prev) => ({ ...prev, [key]: dirty }))
              }
            />
          </div>
        )}
        <p className="footer-note no-print">
          Fechas orientativas. Confirma el esquema con tu vacunador.
        </p>
        <PwaManager
          hasUnsavedChanges={hasUnsavedChanges}
          storageBlocked={family.status === 'blocked'}
        />
      </div>
      <nav className="nav no-print" aria-label="Navegación principal">
        {NAVIGATION_ITEMS.map(
          (item) =>
            (active || (item.id !== 'calendario' && item.id !== 'carne')) && (
              <Button
                key={item.id}
                variant="ghost"
                aria-current={view === item.id ? 'page' : undefined}
                className={view === item.id ? 'active' : ''}
                onClick={() => setView(item.id)}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Button>
            ),
        )}
      </nav>
      {dialog && family.db && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) requestCloseForm();
          }}
        >
          <DialogContent className="form-dialog">
            <DialogHeader>
              <DialogTitle>
                {dialog.type === 'create-profile'
                  ? 'Crear un perfil'
                  : dialog.type === 'edit-profile'
                    ? 'Editar perfil'
                    : dialog.type === 'create-administration'
                      ? 'Registrar aplicación'
                      : 'Editar aplicación'}
              </DialogTitle>
              <DialogDescription>
                Los datos se guardan únicamente en este dispositivo. Revisa los
                campos antes de confirmar.
              </DialogDescription>
            </DialogHeader>
            <div className="dialog-body">
              {dialog.type === 'create-profile' ||
              dialog.type === 'edit-profile' ? (
                <ProfileForm
                  key={dialog.commandId}
                  commandId={dialog.commandId}
                  profile={
                    dialog.type === 'edit-profile' ? dialog.profile : undefined
                  }
                  today={today}
                  onCancel={requestCloseForm}
                  onDirtyChange={setFormDirty}
                  onSave={async (command) => {
                    const selectedReference = getScheduleReference(
                      command.input.scheduleReferenceId,
                    );
                    const selectedCatalog =
                      selectedReference &&
                      getCatalog(selectedReference.catalogVersion);
                    if (!selectedReference || !selectedCatalog)
                      throw new Error('unknown-catalog');
                    setMutationBusy(true);
                    try {
                      const saved = await saveProfile(family.db!, command, {
                        today,
                        now: new Date().toISOString(),
                        catalog: selectedCatalog,
                      });
                      closeForm();
                      if (command.mode === 'create') {
                        setView('inicio');
                        void setPreference(
                          family.db!,
                          'activeProfileId',
                          saved.id,
                        ).catch(() =>
                          setError(
                            'El perfil se guardó, pero no se pudo recordar la selección. Selecciónalo en la cabecera.',
                          ),
                        );
                      }
                    } finally {
                      setMutationBusy(false);
                    }
                  }}
                />
              ) : (
                <AdministrationForm
                  key={dialog.commandId}
                  commandId={dialog.commandId}
                  child={dialog.child}
                  administration={
                    dialog.type === 'edit-administration'
                      ? dialog.administration
                      : undefined
                  }
                  today={today}
                  catalog={dialog.catalog}
                  onCancel={requestCloseForm}
                  onDirtyChange={setFormDirty}
                  onSave={async (command) => {
                    setMutationBusy(true);
                    try {
                      await saveAdministration(family.db!, command, {
                        today,
                        now: new Date().toISOString(),
                        catalog: dialog.catalog,
                      });
                      closeForm();
                    } finally {
                      setMutationBusy(false);
                    }
                  }}
                />
              )}
            </div>
          </DialogContent>
          <AlertDialog
            open={discardRequested}
            onOpenChange={(open) => {
              if (!open && !mutationBusy) setDiscardRequested(false);
            }}
          >
            <AlertDialogContent
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                const target = discardReturnFocus.current;
                if (target?.isConnected && !target.matches(':disabled')) {
                  target.focus({ preventScroll: true });
                }
              }}
            >
              <div className="dialog-body">
                <AlertDialogHeader>
                  <AlertDialogTitle>Hay cambios sin guardar</AlertDialogTitle>
                  <AlertDialogDescription>
                    ¿Desea descartarlos? Los cambios de esta edición no se
                    guardarán.
                  </AlertDialogDescription>
                </AlertDialogHeader>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={mutationBusy}>
                  Cancelar
                </AlertDialogCancel>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={mutationBusy}
                  onClick={closeForm}
                >
                  Confirmar
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Dialog>
      )}
      {scheduleChange && (
        <AlertDialog
          open
          onOpenChange={(open) => {
            if (!open && !mutationBusy) setScheduleChange(null);
          }}
        >
          <AlertDialogContent
            onCloseAutoFocus={(event) => {
              const target =
                scheduleChange &&
                document.getElementById(scheduleChange.returnFocusId);
              if (target) {
                event.preventDefault();
                target.focus({ preventScroll: true });
              }
            }}
          >
            <div className="dialog-body">
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Confirmar cambio de esquema de{' '}
                  {scheduleChange.profile.nickname}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {SCHEDULE_CONFIRMATION}
                </AlertDialogDescription>
              </AlertDialogHeader>
              {error && (
                <p role="alert" className="error">
                  {error}
                </p>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={mutationBusy}>
                Cancelar
              </AlertDialogCancel>
              <Button
                disabled={mutationBusy || !writable}
                onClick={() => void confirmSchedule()}
              >
                Confirmar cambio
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {catalogChange && (
        <AlertDialog
          open
          onOpenChange={(open) => {
            if (!open && !mutationBusy) setCatalogChange(null);
          }}
        >
          <AlertDialogContent>
            <div className="dialog-body">
              <AlertDialogHeader>
                <AlertDialogTitle>Cambiar a Esquema 2026</AlertDialogTitle>
                <AlertDialogDescription>
                  El perfil cambiará de la combinación{' '}
                  {catalogChange.referenceCatalogVersion} /{' '}
                  {catalogChange.primaryScheduleId ?? 'sin esquema'} a Esquema
                  2026. Se recalcularán las referencias sin reescribir las
                  aplicaciones históricas. Las correspondencias no verificables
                  seguirán por revisar.
                </AlertDialogDescription>
              </AlertDialogHeader>
              {error && (
                <p role="alert" className="error">
                  {error}
                </p>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={mutationBusy}>
                Cancelar
              </AlertDialogCancel>
              <Button
                disabled={mutationBusy || !writable}
                onClick={() =>
                  void mutate(async () => {
                    await saveProfile(
                      family.db!,
                      {
                        id: catalogChange.id,
                        mode: 'edit',
                        input: {
                          nickname: catalogChange.nickname,
                          birthDate: catalogChange.birthDate,
                          scheduleReferenceId: 'CO-PAI-REFERENCE-2026',
                        },
                      },
                      {
                        today,
                        now: new Date().toISOString(),
                        catalog: currentCatalog,
                      },
                    );
                    setCatalogChange(null);
                  })
                }
              >
                Confirmar Esquema 2026
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {removal && family.db && (
        <DataRemovalDialog
          scope={removal.scope}
          label={removal.label}
          snapshot={snapshot}
          onClose={() => setRemoval(null)}
          onDelete={async () => {
            if (removal.scope === 'all') await clearFamily(family.db!);
            else if (removal.scope === 'profile')
              await deleteProfile(family.db!, removal.childId!);
            else
              await deleteAdministration(
                family.db!,
                removal.childId!,
                removal.administrationId!,
              );
          }}
        />
      )}
    </main>
  );
}
