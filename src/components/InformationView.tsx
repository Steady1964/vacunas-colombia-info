import type { Catalog } from '@/data/catalog/types';
import { PrivacyNotice } from './PrivacyNotice';

export function InformationView({ catalog }: { catalog: Catalog }) {
  return (
    <div className="information-sections dialog-body">
      <details className="information-section">
        <summary>Información para familias</summary>
        <div className="information-section-body">
          <h3>PAI y vacunas particulares</h3>
          <p>
            El Programa Ampliado de Inmunizaciones organiza el acceso público
            según edad, territorio y condiciones definidas por las autoridades
            sanitarias. Una referencia complementaria o particular no es una
            obligación universal ni garantiza financiación pública. Confirma la
            elegibilidad con tu vacunador.
          </p>

          <h3>Combinadas: un evento físico, varios componentes</h3>
          <p>
            Una aplicación de un producto combinado puede cubrir varios
            requisitos de una misma etapa únicamente cuando producto, dosis,
            etapa y fuentes están identificados. No equivale a varias
            aplicaciones físicas ni cumple automáticamente etapas posteriores.
            Las reglas no verificadas se conservan por revisar.
          </p>

          <h3>Rotavirus y variación por producto</h3>
          <p>
            La composición, número de dosis y límites de edad dependen del
            producto. Hay referencias de dos y tres dosis; la tercera no se
            agrega universalmente ni se considera cumplida al registrar dos
            aplicaciones. No calculamos rescates, intercambiabilidad ni nuevas
            fechas fuera de límites clínicos confirmados.
          </p>

          <h3>Fechas orientativas, no órdenes médicas</h3>
          <p>
            El Esquema 2026 ante el brote de tosferina es una referencia
            transitoria. Solo cambia la serie primaria; no revierte los hitos
            compartidos de otras actualizaciones. Una aplicación tardía no
            desplaza automáticamente el calendario. Prematuridad, atrasos,
            cambios de fabricante, intervalos y condiciones individuales
            requieren valoración del profesional.
          </p>
        </div>
      </details>

      <details className="information-section">
        <summary>Catálogo y fuentes</summary>
        <div className="information-section-body">
          <p>
            Versión {catalog.version} · consulta/revisión {catalog.reviewedAt}.
            La fecha de revisión no garantiza vigencia clínica individual.
          </p>
          <ul className="source-list">
            {catalog.sources.map((s) => (
              <li key={s.id}>
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.title ?? s.id}
                </a>
                <p>
                  Fecha editorial:{' '}
                  {s.publishedAt && s.publishedAt !== 'unknown'
                    ? s.publishedAt
                    : 'no visible en el documento'}{' '}
                  · Consulta/revisión: {s.reviewedAt} ·{' '}
                  {s.verification === 'verified'
                    ? 'Fuente verificada para las reglas documentadas'
                    : 'Por revisar: no concede cobertura automática'}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </details>

      <details className="information-section">
        <summary>Productos y correspondencias documentadas</summary>
        <div className="information-section-body">
          {catalog.products.map((p) => (
            <details key={p.id}>
              <summary>{p.name}</summary>
              <p>
                Marcas de referencia:{' '}
                {p.brands.join(', ') || 'No identificadas'}. Componentes:{' '}
                {p.components.join(', ') || 'Sin identificar'}.
              </p>
              {p.doseCount && (
                <p>
                  Curso de referencia del producto: {p.doseCount} dosis;
                  confirmar elegibilidad.
                </p>
              )}
              {p.note && <p>{p.note}</p>}
              <ul>
                {p.coverageRules.map((r, i) => (
                  <li key={`${r.milestoneId}-${r.doseNumber}-${i}`}>
                    Dosis {r.doseNumber}, etapa {r.milestoneId}:{' '}
                    {r.requirementIds
                      .map(
                        (id) =>
                          catalog.requirements.find((q) => q.id === id)?.name ??
                          id,
                      )
                      .join(', ')}
                    . Fuentes:{' '}
                    {r.sourceIds.map((id) => {
                      const s = catalog.sources.find((x) => x.id === id);
                      return (
                        <span key={id}>
                          {' '}
                          {s ? (
                            <a href={s.url} target="_blank" rel="noreferrer">
                              {s.title ?? s.id} ({s.reviewedAt};{' '}
                              {s.verification === 'verified'
                                ? 'verificada'
                                : 'por revisar'}
                              )
                            </a>
                          ) : (
                            'fuente no disponible'
                          )}{' '}
                        </span>
                      );
                    })}
                  </li>
                ))}
              </ul>
              {!p.coverageRules.length && (
                <p>
                  Sin correspondencia automática verificable. Permite capturar
                  el evento para revisión.
                </p>
              )}
            </details>
          ))}
        </div>
      </details>

      <details className="information-section">
        <summary>Privacidad y respaldos</summary>
        <div className="information-section-body">
          <PrivacyNotice />
        </div>
      </details>
    </div>
  );
}
