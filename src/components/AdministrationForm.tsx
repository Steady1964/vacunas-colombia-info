'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
  AdministrationCommand,
  AdministrationInput,
  CivilDate,
  StoredProfile,
  VaccineAdministration,
} from '@/lib/types';
import type { Catalog } from '@/data/catalog/types';
import { UNIDENTIFIED_PRODUCT_ID } from '@/data/catalog';
import { resolveSelection } from '@/lib/schedule/resolveCoverage';
import { getRegistrationStages } from '@/lib/schedule/referencePresentation';
import { milestoneLabels, operationError, reviewLabels } from './presentation';
import { formatCivilDate } from '@/lib/datePresentation';

export function AdministrationForm({
  commandId,
  child,
  administration,
  initialInput,
  today,
  catalog,
  onSave,
  onCancel,
  onDirtyChange,
}: {
  commandId: string;
  child: StoredProfile;
  administration?: VaccineAdministration;
  initialInput?: Partial<AdministrationInput>;
  today: CivilDate;
  catalog: Catalog;
  onSave: (command: AdministrationCommand) => Promise<void>;
  onCancel: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [input, setInput] = useState<AdministrationInput>(() => ({
    productId: administration?.productId ?? UNIDENTIFIED_PRODUCT_ID,
    productName: administration?.productName ?? '',
    appliedDate: administration?.appliedDate ?? '',
    doseNumber: administration?.doseNumber,
    milestoneId: administration?.milestoneId,
    brand: administration?.brand ?? '',
    lot: administration?.lot ?? '',
    provider: administration?.provider ?? '',
    accessType: administration?.accessType ?? 'unknown',
    paiwebStatus: administration?.paiwebStatus ?? 'unknown',
    notes: administration?.notes ?? '',
    ...initialInput,
  }));
  const owner = useRef(child.id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const pending = useRef<AdministrationCommand | null>(null);

  const selectedProduct = catalog.products.find(
    (product) => product.id === input.productId,
  );
  const hasIdentifiedProduct =
    input.productId !== UNIDENTIFIED_PRODUCT_ID &&
    selectedProduct !== undefined;
  const selection = resolveSelection(input, catalog);
  const stages = getRegistrationStages(
    child,
    catalog,
    input.productId,
    input.milestoneId,
  );
  const retainedStage = stages.find((stage) => stage.retained);

  function update<K extends keyof AdministrationInput>(
    key: K,
    value: AdministrationInput[K],
  ) {
    pending.current = null;
    onDirtyChange(true);
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    if (inFlight.current) return;
    const command = pending.current ?? {
      id: commandId,
      childId: owner.current,
      mode: administration ? ('edit' as const) : ('create' as const),
      input: { ...input },
    };
    pending.current = command;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      await onSave(command);
    } catch (err) {
      setError(operationError(err));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <p>
        Aplicación para <strong>{child.nickname}</strong>. Cambiar el perfil
        activo no cambia el dueño de este registro.
      </p>
      <fieldset disabled={busy}>
        <legend className="sr-only">
          {administration ? 'Editar aplicación' : 'Registrar aplicación real'}
        </legend>
        <div className="field">
          <Label htmlFor="product">Producto o biológico</Label>
          <select
            id="product"
            value={input.productId}
            onChange={(e) => {
              const product = catalog.products.find(
                (p) => p.id === e.target.value,
              );
              pending.current = null;
              onDirtyChange(true);
              setInput((prev) => ({
                ...prev,
                productId: e.target.value,
                productName:
                  e.target.value === UNIDENTIFIED_PRODUCT_ID
                    ? prev.productName
                    : (product?.name ?? ''),
                doseNumber: undefined,
                milestoneId: undefined,
              }));
            }}
          >
            {!catalog.products.some((p) => p.id === input.productId) && (
              <option value={input.productId}>
                Producto conservado no disponible: {input.productName}
              </option>
            )}
            {catalog.products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
          <p className="muted">
            Selecciona el biológico según su composición en el carné. La marca o
            el laboratorio se escribe por separado en el campo de abajo.
          </p>
        </div>
        <div className="field">
          <Label htmlFor="product-name">
            Nombre registrado del producto
            {input.productId === UNIDENTIFIED_PRODUCT_ID
              ? ' (captura manual)'
              : ''}
          </Label>
          <Input
            id="product-name"
            required
            value={input.productName}
            onChange={(e) => update('productName', e.target.value)}
          />
        </div>
        <div className="form-grid">
          <div className="field">
            <Label htmlFor="dose">Número de dosis (si se conoce)</Label>
            <Input
              id="dose"
              type="number"
              min={1}
              max={20}
              value={input.doseNumber ?? ''}
              onChange={(e) =>
                update(
                  'doseNumber',
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
            />
          </div>
          <div className="field">
            <Label htmlFor="milestone">Etapa confirmada</Label>
            <select
              id="milestone"
              disabled={!hasIdentifiedProduct}
              className="disabled:cursor-not-allowed disabled:opacity-60"
              value={input.milestoneId ?? ''}
              aria-describedby="milestone-help"
              onChange={(e) =>
                update('milestoneId', e.target.value || undefined)
              }
            >
              <option value="">Por verificar / no se conoce</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.retained
                    ? `Etapa conservada fuera de esta referencia: ${milestoneLabels[stage.id] ?? stage.id}`
                    : stage.label}
                </option>
              ))}
            </select>
            <p id="milestone-help" className="muted">
              {hasIdentifiedProduct
                ? 'Las edades y dosis corresponden al producto y la referencia de este perfil, no a una confirmación clínica de la aplicación.'
                : 'Selecciona primero un producto o biológico identificado para habilitar la etapa confirmada. Escribir en la búsqueda no lo selecciona.'}
              {!child.primaryScheduleId &&
                ' El perfil todavía no tiene un esquema confirmado; no se elige uno automáticamente.'}
              {child.referenceCatalogVersion !== catalog.version &&
                ' El catálogo recibido no corresponde al perfil; no se sustituye su referencia.'}
              {stages.filter((stage) => !stage.retained).length === 0 &&
                ' No hay etapas documentadas disponibles para esta selección. Puedes conservar el registro por revisar.'}
              {retainedStage &&
                ' La etapa guardada se conserva, pero no pertenece a las opciones actuales de este producto y esquema. Confírmala con el vacunador; no se cambia automáticamente.'}
            </p>
          </div>
        </div>
        <div className="field">
          <Label htmlFor="application-date">Fecha real de aplicación</Label>
          <Input
            id="application-date"
            aria-describedby="application-date-preview"
            type="date"
            required
            min={child.birthDate}
            max={today}
            value={input.appliedDate}
            onChange={(e) => update('appliedDate', e.target.value)}
          />
          <p id="application-date-preview">
            {input.appliedDate
              ? formatCivilDate(input.appliedDate)
              : 'Selecciona la fecha real de aplicación.'}
          </p>
        </div>
        {(['brand', 'lot', 'provider'] as const).map((key, index) => (
          <div className="field" key={key}>
            <Label htmlFor={key}>
              {
                [
                  'Marca comercial o Laboratorio (opcional)',
                  'Lote (opcional)',
                  'IPS o prestador (opcional)',
                ][index]
              }
            </Label>
            <Input
              id={key}
              list={key === 'brand' ? 'known-brands' : undefined}
              aria-describedby={key === 'brand' ? 'brand-help' : undefined}
              value={input[key] ?? ''}
              onChange={(e) => update(key, e.target.value)}
            />
            {key === 'brand' && (
              <>
                <datalist id="known-brands">
                  {selectedProduct?.brands.map((brand) => (
                    <option key={brand} value={brand} />
                  ))}
                </datalist>
                <p id="brand-help" className="muted">
                  Se guarda literalmente en el carné. Puedes elegir una marca
                  sugerida o escribir el laboratorio del soporte; elegir el
                  biológico no completa este campo. El laboratorio no invalida
                  el producto seleccionado. Una marca comercial reconocida de
                  otro biológico sí requiere revisar la selección.
                </p>
              </>
            )}
          </div>
        ))}
        <div className="field">
          <Label htmlFor="access">Tipo de acceso</Label>
          <select
            id="access"
            value={input.accessType}
            onChange={(e) =>
              update(
                'accessType',
                e.target.value as AdministrationInput['accessType'],
              )
            }
          >
            <option value="unknown">No se conoce</option>
            <option value="pai">PAI</option>
            <option value="private">Particular</option>
          </select>
        </div>
        <div className="field">
          <Label htmlFor="paiweb">¿Consta en PAIWEB?</Label>
          <select
            id="paiweb"
            value={input.paiwebStatus}
            onChange={(e) =>
              update(
                'paiwebStatus',
                e.target.value as AdministrationInput['paiwebStatus'],
              )
            }
          >
            <option value="unknown">No se conoce</option>
            <option value="yes">Sí</option>
            <option value="no">No</option>
          </select>
        </div>
        <div className="field">
          <Label htmlFor="notes">Observaciones (opcional)</Label>
          <textarea
            id="notes"
            rows={3}
            value={input.notes ?? ''}
            onChange={(e) => update('notes', e.target.value)}
          />
        </div>
        <div className="notice">
          {selection.coverageStatus === 'verified' ? (
            <>
              <strong>Correspondencia identificada:</strong>{' '}
              {selection.coveredRequirementIds
                .map(
                  (id) =>
                    catalog.requirements.find((r) => r.id === id)?.name ?? id,
                )
                .join(', ')}
              . Una sola aplicación física.
            </>
          ) : (
            <>
              <strong>
                Se guardará por revisar, sin cobertura automática.
              </strong>{' '}
              {selection.reviewReasons.map((r) => reviewLabels[r]).join('. ')}.
              Puedes guardar un registro real incompleto y confirmarlo después
              con tu vacunador.
            </>
          )}
        </div>
        {administration?.legacy && (
          <details>
            <summary>Procedencia conservada de la migración</summary>
            <pre>{JSON.stringify(administration.legacy.raw, null, 2)}</pre>
          </details>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="actions">
          <Button type="submit">
            {busy ? 'Guardando…' : 'Guardar aplicación'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
