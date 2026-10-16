import type { Source } from './types';

export const REVIEWED_AT = '2026-10-16';

// Verification is limited to the passages and scopes recorded in docs/catalog-sources.md.
export const sources: Source[] = [
  {
    id: 'minsalud-childhood-2026',
    title: 'MinSalud — Menores de seis años, tabla de citas y enfermedades',
    url: 'https://vacunacion.minsalud.gov.co/EV/Paginas/ninos-y-ninas-menores-de-6-anos.aspx',
    reviewedAt: REVIEWED_AT,
    verification: 'verified',
  },
  {
    id: 'minsalud-technical-index',
    title: 'MinSalud — Índice de lineamientos técnicos (no es una regla de dosis)',
    url: 'https://vacunacion.minsalud.gov.co/RT/Paginas/lineamientos-tecnicos.aspx',
    reviewedAt: REVIEWED_AT,
    verification: 'verified',
  },
  {
    id: 'minsalud-january-2026',
    title: 'MinSalud — Primera jornada nacional, enero 2026, pp. 27–30',
    url: 'https://www.minsalud.gov.co/sites/rid/Lists/BibliotecaDigital/RIDE/VS/PP/PAI/lineamientos-t%C3%A9cnicos-primera-jornada-nacional-vacunaci%C3%B3n-2026.pdf',
    reviewedAt: REVIEWED_AT,
    verification: 'verified',
  },
  {
    id: 'minsalud-hexavalent-2025',
    title: 'MinSalud — Hexavalente, septiembre 2025, versión 1, pp. 10–16: componentes, población y etapas',
    url: 'https://www.minsalud.gov.co/sites/rid/Lists/BibliotecaDigital/RIDE/VS/PP/PAI/lineamientos-tecnicos-aplicacion-vacuna-hexavalente.pdf',
    reviewedAt: REVIEWED_AT,
    verification: 'verified',
  },
  {
    id: 'minsalud-january-news-2026',
    title: 'MinSalud — Comunicación del 23 de enero de 2026',
    url: 'https://www.minsalud.gov.co/Comunicaciones/noticias/2026/Paginas/234-mil-personas-seran-vacunadas-en-enero-2026.aspx',
    reviewedAt: REVIEWED_AT,
    verification: 'verified',
  },
  {
    id: 'minsalud-poster-july-2026',
    title: 'MinSalud — Esquema de vacunación, actualización julio 2026, pp. 1–2',
    url: 'https://www.minsalud.gov.co/sites/rid/Lists/BibliotecaDigital/RIDE/VS/PP/ET/afiche-esquema-vacunacion-col-2026.pdf',
    reviewedAt: REVIEWED_AT,
    verification: 'verified',
  },
  {
    id: 'minsalud-measles-zero-2026',
    title: 'MinSalud — Dosis cero, comunicación del 19 de junio de 2026',
    url: 'https://www.minsalud.gov.co/Comunicaciones/noticias/2026/Paginas/dosis-cero.aspx',
    reviewedAt: REVIEWED_AT,
    verification: 'verified',
  },
  {
    id: 'gsk-rotarix',
    title: 'GSK — Rotarix, información de prescripción EE. UU., revisión septiembre 2026, §§ 1, 2.1, 11',
    url: 'https://gskpro.com/content/dam/global/hcpportal/en_US/Prescribing_Information/Rotarix/pdf/ROTARIX-PI-PIL.PDF',
    reviewedAt: REVIEWED_AT,
    verification: 'verified',
  },
  {
    id: 'msd-rotateq',
    title: 'MSD — RotaTeq, ficha India del 6 de febrero de 2026, pp. 1–2',
    url: 'https://www.msd.com/india/wp-content/uploads/sites/117/2026/04/RotaTeq%C2%AE_ROTAVIRUS-VACCINE-LIVE-ATTENUATED-ORAL-IP_Updated-PI_6-Feb-2026.pdf',
    reviewedAt: REVIEWED_AT,
    verification: 'verified',
  },
  {
    id: 'sanofi-hexaxim',
    title: 'Sanofi — Hexaxim, Singapur SG/HEX/0823/SmPC0922, pp. 1–3',
    url: 'https://www.sanofi.com/assets/countries/singapore/docs/Hexaxim-SG-0823--CCDSv12-.pdf',
    reviewedAt: REVIEWED_AT,
    verification: 'verified',
  },
  {
    id: 'ema-infanrix-hexa',
    title: 'EMA — Infanrix hexa, ficha oficial del titular GSK, §§ 2, 4.1–4.2, pp. 2–4',
    url: 'https://www.ema.europa.eu/en/documents/product-information/infanrix-hexa-epar-product-information_en.pdf',
    reviewedAt: REVIEWED_AT,
    verification: 'verified',
  },
  {
    id: 'ema-nimenrix',
    title: 'EMA — Nimenrix, composición y curso dependiente de edad, §§ 2, 4.1–4.2',
    url: 'https://www.ema.europa.eu/en/documents/product-information/nimenrix-epar-product-information_en.pdf',
    reviewedAt: REVIEWED_AT,
    verification: 'verified',
  },
  {
    id: 'ema-bexsero',
    title: 'EMA — Bexsero, composición y cursos dependientes de edad, §§ 2, 4.1–4.2',
    url: 'https://www.ema.europa.eu/en/documents/product-information/bexsero-epar-product-information_en.pdf',
    reviewedAt: REVIEWED_AT,
    verification: 'verified',
  },
  {
    id: 'gsk-infanrix-hexa-direct-review',
    title: 'Por revisar — ficha directa GSK Infanrix hexa no extraíble; se usa ficha oficial EMA para composición',
    url: 'https://gskpro.com/content/dam/global/hcpportal/en_SG/Therapyareas/Vaccines/pdf/infanrix-hexa-pi-ipi17-si-approved-31-may-2023.pdf',
    reviewedAt: REVIEWED_AT,
    verification: 'needs-review',
  },
  {
    id: 'sanofi-hexaxim-india-review',
    title: 'Por revisar — ficha Sanofi India no disponible (HTTP 404); se usa ficha Sanofi Singapur',
    url: 'https://www.sanofi.com/assets/countries/india/docs/science-and-innovation/for-healthcare-professionals/product-information/vaccines/hexaxim-iIndia-pi-nov-2022-ccds-v8-v10.pdf',
    reviewedAt: REVIEWED_AT,
    verification: 'needs-review',
  },
  {
    id: 'private-course-co-review',
    title: 'Por revisar — programación individual y correspondencias de meningococo en Colombia no confirmadas por este índice',
    url: 'https://vacunacion.minsalud.gov.co/RT/Paginas/lineamientos-tecnicos.aspx',
    reviewedAt: REVIEWED_AT,
    verification: 'needs-review',
  },
];
