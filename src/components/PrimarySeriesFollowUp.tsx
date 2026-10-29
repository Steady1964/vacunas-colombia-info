import type { Catalog } from '@/data/catalog/types';
import { formatCivilDate } from '@/lib/datePresentation';
import type { RequirementView } from '@/lib/schedule/summarizeSchedule';
import { ReferenceTiming } from './ReferenceTiming';

export function PrimarySeriesFollowUp({
  items,
  catalog,
}: {
  items: readonly RequirementView[];
  catalog: Catalog;
}) {
  const nextByComponent = new Map<string, RequirementView>();
  for (const item of items) {
    if (!item.timing || item.status === 'applied') continue;
    const component = item.id.split('-')[0];
    const current = nextByComponent.get(component);
    if (!current || item.doseNumber < current.doseNumber)
      nextByComponent.set(component, item);
  }
  if (nextByComponent.size === 0) return null;

  const groups = new Map<string, RequirementView[]>();
  for (const item of nextByComponent.values()) {
    const component = item.id.split('-')[0];
    const series =
      component === 'penta' || component === 'ipv' ? 'penta-ipv' : component;
    const key = `${series}:${item.doseNumber}:${item.estimatedDate ?? 'review'}`;
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }
  const verifiedSources = new Set(
    catalog.sources
      .filter((source) => source.verification === 'verified')
      .map((source) => source.id),
  );
  function covers(productId: string, requirementIds: string[]): boolean {
    const product = catalog.products.find((entry) => entry.id === productId);
    return Boolean(
      product &&
      product.sourceIds.length > 0 &&
      product.sourceIds.every((id) => verifiedSources.has(id)) &&
      product.coverageRules.some(
        (rule) =>
          rule.sourceIds.length > 0 &&
          rule.sourceIds.every((id) => verifiedSources.has(id)) &&
          rule.requirementIds.length === requirementIds.length &&
          requirementIds.every((id) => rule.requirementIds.includes(id)),
      ),
    );
  }
  const productName = (id: string) =>
    catalog.products.find((product) => product.id === id)?.name ?? id;

  return (
    <section className="card wide">
      <h2>Siguientes dosis según aplicaciones registradas</h2>
      <p>
        Cada serie usa su propia aplicación anterior confirmada. BCG y hepatitis
        B neonatal no inician estos intervalos. Las series pueden tener fechas
        distintas.
      </p>
      {[...groups.entries()].map(([key, group]) => {
        const first = group[0];
        const dose = first.doseNumber;
        const pentaId = `penta-${dose}`;
        const ipvId = `ipv-${dose}`;
        const ids = new Set(group.map((item) => item.id));
        const calculated = group.every(
          (item) => item.timing?.kind === 'after-administration',
        );
        const paired = calculated && ids.has(pentaId) && ids.has(ipvId);
        const hexavalent =
          paired && covers('hexavalent-acellular', [pentaId, ipvId]);
        const separate =
          paired &&
          covers('pentavalent-cellular', [pentaId]) &&
          covers('ipv', [ipvId]);

        return (
          <section className="mt-6" key={key}>
            <h3>
              {first.id.startsWith('penta-') || first.id.startsWith('ipv-')
                ? `Pentavalente / polio · dosis ${dose}`
                : first.name}
            </h3>
            <p>
              <strong>
                {first.estimatedDate
                  ? formatCivilDate(first.estimatedDate)
                  : 'Fecha de continuación por confirmar'}
              </strong>
            </p>
            {first.timing?.kind === 'after-administration' && (
              <p>
                {first.timing.intervalDays / 7} semanas después de la aplicación
                del {formatCivilDate(first.timing.appliedDate)}. La edad de
                referencia desde el nacimiento no sustituye este intervalo.
              </p>
            )}
            {hexavalent || separate ? (
              <>
                <p>
                  Formulaciones de referencia para consultar con el vacunador:
                </p>
                <ul>
                  {hexavalent && (
                    <li>
                      <strong>{productName('hexavalent-acellular')}</strong>:
                      una aplicación física para los requisitos de pentavalente
                      y polio de esta etapa.
                    </li>
                  )}
                  {separate && (
                    <li>
                      <strong>
                        {productName('pentavalent-cellular')} +{' '}
                        {productName('ipv')}
                      </strong>
                      : dos aplicaciones físicas. Pentavalente sola no cubre
                      polio.
                    </li>
                  )}
                </ul>
                <p role="note">
                  Es una comparación de composición, no una autorización para
                  alternar productos o marcas a mitad de la serie. Confirma cuál
                  corresponde y la fecha con el vacunador. El acceso PAI a
                  hexavalente tiene criterios específicos; no se presume por
                  haber recibido una dosis particular.
                </p>
              </>
            ) : (
              <ul>
                {group.map((item) => (
                  <li key={item.id}>{item.name}</li>
                ))}
              </ul>
            )}
            {group
              .filter(
                (item, index) =>
                  index === 0 ||
                  (item.timing?.kind === 'needs-review' &&
                    first.timing?.kind === 'needs-review' &&
                    item.timing.reason !== first.timing.reason),
              )
              .map((item) => (
                <ReferenceTiming
                  key={item.id}
                  requirement={item}
                  catalog={catalog}
                />
              ))}
          </section>
        );
      })}
      <p>
        Estas fechas no son citas confirmadas. Si ya pasaron, hay etapas
        incompletas o productos diferentes, confirma la continuación con el
        vacunador; no se reinicia ni se prescribe un rescate automáticamente.
      </p>
    </section>
  );
}
