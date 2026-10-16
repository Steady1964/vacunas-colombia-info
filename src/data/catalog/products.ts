import type { CoverageRule, Product } from './types';

const poster = 'minsalud-poster-july-2026';
const primaryRules = (prefix: string, sourceIds: string[], doses = 3): CoverageRule[] =>
  Array.from({ length: doses }, (_, index) => ({
    doseNumber: index + 1,
    milestoneId: `primary-${index + 1}`,
    requirementIds: [`${prefix}-${index + 1}`],
    sourceIds,
  }));

const rule = (doseNumber: number, milestoneId: string, requirementId: string, sourceIds = [poster]): CoverageRule =>
  ({ doseNumber, milestoneId, requirementIds: [requirementId], sourceIds });

export const products: Product[] = [
  {
    id: 'unidentified', name: 'Producto no identificado — captura manual',
    brands: [], components: [], sourceIds: [], coverageRules: [],
    note: 'Conserva lo escrito en el carné sin inferir producto, marca, componentes ni cobertura. Confirma el producto y la etapa con el vacunador.',
  },
  {
    id: 'pentavalent-cellular', name: 'Pentavalente celular (DPT-HB-Hib)', brands: [],
    components: ['diphtheria', 'tetanus', 'pertussis-whole-cell', 'hepatitis-b', 'hib'],
    sourceIds: [poster, 'minsalud-january-2026', 'minsalud-hexavalent-2025'],
    coverageRules: [
      ...primaryRules('penta', [poster, 'minsalud-january-2026', 'minsalud-hexavalent-2025']),
      rule(4, 'month-18', 'dpt-booster-1', [poster, 'minsalud-hexavalent-2025']),
    ],
    note: 'La referencia PAI utiliza pentavalente para el primer refuerzo a 18 meses. No equivale a una pentavalente acelular de distinta composición ni a hepatitis B neonatal.',
  },
  {
    id: 'ipv', name: 'Polio inactivada (IPV/VIP)', brands: [], components: ['poliovirus-inactivated'],
    sourceIds: [poster],
    coverageRules: [
      ...primaryRules('ipv', [poster]),
      rule(4, 'month-18', 'ipv-booster-1'),
      rule(5, 'year-5', 'ipv-booster-2'),
    ],
    note: 'Solo para polio inactivada identificada; no infiere equivalencia desde una anotación de polio oral o una marca.',
  },
  {
    id: 'hexavalent-acellular', name: 'Hexavalente acelular (DTPa-HB-IPV-Hib)',
    brands: ['Hexaxim', 'Infanrix hexa'],
    components: ['diphtheria', 'tetanus', 'pertussis-acellular', 'hepatitis-b', 'poliovirus-inactivated', 'hib'],
    sourceIds: ['sanofi-hexaxim', 'ema-infanrix-hexa', 'minsalud-january-2026', 'minsalud-hexavalent-2025', poster],
    coverageRules: [1, 2, 3].map((doseNumber) => ({
      doseNumber,
      milestoneId: `primary-${doseNumber}`,
      requirementIds: [`penta-${doseNumber}`, `ipv-${doseNumber}`],
      sourceIds: ['sanofi-hexaxim', 'ema-infanrix-hexa', 'minsalud-january-2026', 'minsalud-hexavalent-2025', poster],
    })),
    note: 'Elegir solo tras confirmar la formulación DTPa-HB-IPV-Hib y la etapa de una serie primaria de tres dosis. Las marcas son vocabulario, no identificación automática ni intercambiabilidad universal. No cubre hepatitis B neonatal ni refuerzos por inferencia. Acceso PAI restringido según lineamientos; no es universal.',
  },
  {
    id: 'rotarix', name: 'Rotarix — rotavirus, curso de dos dosis', brands: ['Rotarix'],
    components: ['rotavirus-live-human'], doseCount: 2, sourceIds: ['gsk-rotarix', poster],
    coverageRules: primaryRules('rota', ['gsk-rotarix', poster], 2),
    note: 'Curso de dos dosis del producto identificado. La ficha GSK limita la serie a 6–24 semanas; la referencia PAI no sustituye la ficha local ni permite rescate o mezcla automática de fabricantes.',
  },
  {
    id: 'rotateq', name: 'RotaTeq — rotavirus, curso de tres dosis', brands: ['RotaTeq'],
    components: ['rotavirus-live-human-bovine-reassortants'], doseCount: 3,
    sourceIds: ['msd-rotateq', poster],
    coverageRules: [
      ...primaryRules('rota', ['msd-rotateq', poster], 2),
      rule(3, 'primary-3', 'rota-private-3', ['msd-rotateq']),
    ],
    note: 'La tercera dosis solo aparece al mostrar la referencia de RotaTeq y no recibe fecha automática. Ficha MSD: curso entre 6 y 32 semanas, primera entre 6 y 12; no calcular recuperación ni asumir intercambiabilidad o acceso PAI.',
  },
  {
    id: 'bcg', name: 'BCG', brands: [], components: ['bcg'], doseCount: 1,
    sourceIds: [poster], coverageRules: [rule(1, 'birth', 'bcg')],
  },
  {
    id: 'hepatitis-b', name: 'Hepatitis B monovalente — neonatal', brands: [], components: ['hepatitis-b'],
    sourceIds: [poster], coverageRules: [rule(1, 'birth', 'hep-b-birth')],
    note: 'Regla limitada a la dosis neonatal confirmada; no se reconstruyen otras series a partir del nombre.',
  },
  {
    id: 'pneumococcal-conjugate', name: 'Neumococo conjugada — referencia PAI', brands: [],
    components: ['pneumococcal-conjugate'], sourceIds: [poster],
    coverageRules: [...primaryRules('pcv', [poster], 2), rule(3, 'month-12', 'pcv-booster')],
    note: 'Etapas del curso PAI de dos primarias y refuerzo, tras confirmar producto conjugado y curso con el vacunador. No establece valencia ni equivalencia con vacunas polisacáridas u otros cursos particulares.',
  },
  {
    id: 'influenza-seasonal', name: 'Influenza estacional — primovacunación', brands: [],
    components: ['influenza-seasonal'], sourceIds: [poster],
    coverageRules: [rule(1, 'month-6', 'influenza-1'), rule(2, 'month-7', 'influenza-2')],
    note: 'Seleccionar etapas solo con primovacunación y misma cepa confirmadas con el vacunador. No cubre automáticamente dosis de otra temporada ni genera el calendario anual posterior.',
  },
  {
    id: 'yellow-fever', name: 'Fiebre amarilla', brands: [], components: ['yellow-fever'],
    sourceIds: [poster], coverageRules: [rule(1, 'month-9', 'yellow-fever')],
  },
  {
    id: 'srp', name: 'Triple viral (SRP)', brands: [], components: ['measles', 'rubella', 'mumps'],
    sourceIds: [poster, 'minsalud-january-2026'],
    coverageRules: [rule(1, 'month-12', 'srp-1'), rule(2, 'month-18', 'srp-2')],
    note: 'La dosis cero es adicional, no se registra como SRP 1 o SRP 2.',
  },
  {
    id: 'varicella', name: 'Varicela monovalente', brands: [], components: ['varicella'],
    sourceIds: [poster], coverageRules: [rule(1, 'month-12', 'varicella-1'), rule(2, 'year-5', 'varicella-2')],
  },
  {
    id: 'hepatitis-a', name: 'Hepatitis A — referencia PAI', brands: [], components: ['hepatitis-a'],
    sourceIds: [poster], coverageRules: [rule(1, 'month-12', 'hep-a-1')],
    note: 'No determina el número de dosis de otros cursos particulares por fabricante.',
  },
  {
    id: 'dpt', name: 'DPT celular — segundo refuerzo', brands: [],
    components: ['diphtheria', 'tetanus', 'pertussis-whole-cell'], sourceIds: [poster],
    coverageRules: [rule(5, 'year-5', 'dpt-booster-2')],
    note: 'Dosis 5 de la serie DPT, segundo refuerzo. La referencia leída usa pentavalente para el primer refuerzo; no se asume que DPT aislada sustituya ese producto a 18 meses.',
  },
  {
    id: 'meningococcal-acwy', name: 'Meningococo ACWY — curso por confirmar', brands: ['Nimenrix'],
    components: ['meningococcal-a', 'meningococcal-c', 'meningococcal-w', 'meningococcal-y'],
    sourceIds: ['ema-nimenrix', 'private-course-co-review'], coverageRules: [],
    note: 'Composición documentada para Nimenrix; no identifica una marca heredada ni otras formulaciones. Dosis, refuerzos y elegibilidad colombiana individuales no confirmados: captura manual por revisar, sin fechas ni cobertura automática.',
  },
  {
    id: 'meningococcal-b', name: 'Meningococo B — curso por confirmar', brands: ['Bexsero'],
    components: ['meningococcal-b'], sourceIds: ['ema-bexsero', 'private-course-co-review'], coverageRules: [],
    note: 'Composición de referencia Bexsero: NHBA, NadA, fHbp y OMV/PorA P1.4; no se extrapola a otras marcas. Curso dependiente de edad y riesgo, sin programación individual colombiana verificada: registro por revisar y sin cobertura automática.',
  },
  {
    id: 'measles-zero', name: 'Sarampión — dosis cero adicional SR/SRP', brands: [],
    components: ['measles', 'rubella'], sourceIds: ['minsalud-measles-zero-2026'], coverageRules: [],
    note: 'Medida temporal, adicional y condicional para 6–11 meses; confirmar biológico y elegibilidad con el vacunador. No otorga cobertura SRP 1/2 ni programación universal.',
  },
];
