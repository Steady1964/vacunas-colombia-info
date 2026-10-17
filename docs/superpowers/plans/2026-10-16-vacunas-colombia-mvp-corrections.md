# Vacunas Colombia MVP Corrections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** corregir el MVP existente hasta satisfacer la especificación aprobada y los criterios originales más H01/H02/U01, conservando los datos familiares y sin backend de historiales.

**Architecture:** mantener `app/` y el dominio en `src/`, con catálogos versionados, aritmética civil pura, cobertura por requisito y repositorio IndexedDB transaccional. El Esquema 2026 y el Esquema anterior a 2026 son referencias completas distintas; el perfil persiste la pareja catálogo/serie y los datos históricos nunca se reinterpretan sin confirmación. En móvil, una carcasa de tres filas reserva espacio para cabecera, contenido desplazable y navegación. Serwist genera el shell offline sin cachear datos familiares.
**Tech Stack:** Next.js 16.4.2, React 19.3.1, TypeScript 7, Tailwind 4, shadcn/ui, lucide-react, Dexie 4.4.6, date-fns 4.4.0, Vitest 5; añadir Zod 4.6.7, fake-indexeddb 6.2.6 para pruebas y Serwist/@serwist/next 9.5.13 para PWA.

**Spec:** [Especificación aprobada](../specs/2026-10-16-vacunas-colombia-mvp-corrections-design.md). También leer `Vacunas_Colombia_PWA_Vercel_v2.md` y `AGENTS.md`; la primera conserva autoridad sobre todo el MVP.

**Estado:** T1–T8 implementadas en `development`; este plan incorpora el cambio aprobado de referencias y layout antes de continuar T11–T13. Las casillas históricas permanecen sin marcar porque no se reconstruye evidencia retroactivamente; el registro de ejecución y los commits son la fuente del estado observado.

## Global Constraints

- Nombre visible: **Vacunas Colombia**; `short_name: Vacunas CO`; idioma español de Colombia.
- Referencias seleccionables: **Esquema 2026** = `CO-PAI-SHARED-2026-10` + `CO-PAI-PRIMARY-6-12-18-WEEKS-2026`; **Esquema anterior a 2026** = `CO-PAI-EPS-SANITAS-UNDATED-ED2` + `CO-PAI-PRIMARY-2-4-6`.
- Base IndexedDB: `vacunas-colombia`. No perder registros, cambiar de base ni exigir borrar datos para migrar. La combinación ya guardada `CO-PAI-SHARED-2026-10` + `CO-PAI-PRIMARY-2-4-6` sigue resolviendo como referencia legada, pero no se ofrece al crear perfiles.
- Fechas civiles `YYYY-MM-DD`; histórico **2/4/6 meses calendario**, 2026 **42/84/126 días**. No usar UTC para serializar fechas civiles.
- Próximas: desde hoy hasta **30 días** inclusive. Progreso: requisitos únicos cubiertos/programados hasta hoy; no porcentaje de inmunidad.
- Aplicaciones nuevas/ediciones: fecha entre nacimiento y hoy, inclusive. Datos heredados incoherentes se conservan para revisión.
- Una administración física se guarda una vez; cobertura solo por producto, dosis y etapa verificadas. Ninguna inferencia desde nombres o fechas.
- Las aplicaciones heredadas comienzan por revisar y sin cobertura automática. No deduplicarlas ni corregirlas silenciosamente.
- Respaldo JSON **sin cifrar**, con aviso; merge conflictivo aborta completo. Reemplazo exige previsualización, oferta de copia y confirmación.
- Sin Firebase/MongoDB/Supabase, cuentas, APIs de historial, Server Actions de datos familiares, analítica, anuncios, push, sincronización, OCR ni recomendaciones farmacológicas.
- No datos familiares en URLs, logs, cookies, tráfico saliente o caché del service worker. El Excel es referencia de desarrollo, no se sirve ni se sube a terceros.
- Conservar diseño ligero; controles accesibles, etiquetas asociadas, foco/teclado y navegación inferior móvil. En móvil la navegación no se superpone al contenido; a 480 px o menos los grupos de acciones se apilan a ancho completo. No rediseñar todo el producto.
- Antes de modificar código, leer las guías relevantes de `node_modules/next/dist/docs/`. Antes de retirar/cambiar exports existentes, localizar referencias con LSP y actualizar todos sus consumidores; sin aliases de compatibilidad.
- Las tareas no autorizan publicación con reglas clínicas no verificadas. Una regla sin fuente queda por revisar y no concede cobertura.
- No ejecutar commits, instalaciones o cambios de aplicación durante la fase de planificación. Los comandos de este archivo son instrucciones para ejecución posterior.

## Review Focus

1. **Cambio de perfil con formulario abierto o escritura pendiente:** guardar en el niño capturado al abrir el formulario, nunca en el nuevo perfil activo; rechazo si aquel fue eliminado. Prueba permanente de T5 y recorrido de T7.
2. **Base antigua con fechas inválidas, huérfanos o esquema desconocido:** conservar la fila original y pedir revisión; no inventar perfil/fecha/esquema ni bloquear otras familias válidas. Pruebas de T4 y reparación de T8.
3. **Cambios entre previsualización e importación:** si otra pestaña modificó la familia, rechazar la operación como previsualización obsoleta antes de sobrescribir. Prueba de T6.
4. **App abierta al cruzar medianoche o volver del segundo plano:** recalcular hoy y estados, incluyendo días de 23/25 horas por horario de verano; no mantener fechas congeladas. Prueba de reloj en T1 y recorrido de T7.
5. **Actualización PWA/IndexedDB con otra pestaña y formulario modificado:** no recargar ni desmontar el formulario automáticamente ni borrar datos; mostrar actualización/bloqueo de almacenamiento y permitir salida consciente. Pruebas de apertura/versionado en T4 y recorrido real T12.

## Mapa de archivos y responsabilidad

| Área | Archivos objetivo |
|---|---|
| Tipos/validación/reloj | `src/lib/types.ts`, `src/lib/schemas.ts`, `src/lib/civilDate.ts`, `src/hooks/useToday.ts` |
| Catálogo | `src/data/catalog/{types,sources,index,products,primary-traditional-2-4-6,primary-shortened-6-12-18-weeks-2026,shared-requirements-co-2026-10,historical-requirements-co-undated}.ts` |
| Motor puro | `src/lib/schedule/{calculateSchedule,resolveCoverage,summarizeSchedule}.ts` |
| Migración y almacenamiento | `src/lib/{migration,db,repository}.ts`, `src/hooks/useFamily.ts` |
| Respaldo | `src/lib/{backup,backupSchemas}.ts` |
| Aplicación | `src/components/AppClient.tsx`, `ProfileForm.tsx`, `AdministrationForm.tsx`, `ProfileSelector.tsx`, `ScheduleSelector.tsx`, `DashboardView.tsx`, `CalendarView.tsx`, `CarnetView.tsx`, `InformationView.tsx`, `SettingsView.tsx` |
| Respaldo y reparación UI | `src/components/BackupPanel.tsx`, `MigrationReviewPanel.tsx`, `DataRemovalDialog.tsx`, `PrivacyNotice.tsx` |
| PWA | `app/sw.ts`, `app/offline/page.tsx`, `src/components/PwaManager.tsx`, `src/lib/pwa.ts`, íconos PNG en `public/icons/` |
| Configuración | `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `vitest.config.ts`, `components.json`, `next.config.ts`, `.gitignore` |
| Documentación/pruebas | `README.md`, `docs/catalog-sources.md`, `docs/verification/mvp-acceptance.md`, pruebas junto a sus módulos y `src/test/{setup,fixtures}.ts` |
| Corte definitivo | Modificar `app/page.tsx`, `app/layout.tsx`, `app/globals.css`; eliminar `lib/data.ts` y `lib/data.test.ts` en T7 |

No crear todos estos archivos vacíos. Cada tarea entrega su comportamiento completo; T7 conserva las vistas existentes funcionando al cambiar de modelo. El único motor activo al terminar el corte es el nuevo. Mantener imports relativos en dominio hasta T7; en ese corte `@/*` pasa a `./src/*` tanto en TypeScript como en Vitest.

## Secuencia y criterios comunes

Un solo plan: migración, cobertura, vistas y PWA comparten contratos. Orden restante: T9 → T10 → T11 → T12 → T13. No paralelizar modificaciones que cambien los mismos contratos; sí pueden investigarse fuentes o verificarse dispositivos de forma independiente.

Para pruebas nuevas, comprobar primero el fallo relevante y luego el resultado correcto; un error de importación no sustituye el fallo semántico cuando ya existe una implementación. Ejecutar pruebas de la tarea después de cerrar sus cambios, no mientras otros agentes editan sus dependencias. No añadir pruebas de texto fuente, wiring o mocks que repitan lo mismo que reciben. Los recorridos de navegador son verificaciones reales, no pretextos para añadir otra suite UI. Los ejemplos de aserciones de este plan son instrucciones, no código ya incorporado.

Al terminar cada tarea: actualizar la documentación afectada, ejecutar su comprobación y crear un commit específico con el patrón obligatorio `Task NN : Implementation : description`. No incluir cambios ajenos ni hacer push.

---

### T1: Contratos, validación y aritmética civil

**Files:** crear `src/lib/types.ts`, `schemas.ts`, `civilDate.ts`, `civilDate.test.ts`, `src/test/setup.ts`, `src/test/fixtures.ts`, `vitest.config.ts`; modificar `package.json`, `pnpm-lock.yaml`, `README.md`.

**Interfaces:**
- Definir `CivilDate = string`, `Timestamp = string`, `JsonValue = null | boolean | number | string | JsonValue[] | JsonObject`, `JsonObject = {[key:string]:JsonValue}`, `PrimaryScheduleId`, `ChildProfile`, `VaccineAdministration`, `LocalPreference` con los campos exactos de la spec. `coverageStatus: 'verified' | 'needs-review'`, `reviewReasons: ReviewReason[]`; conservar `legacy?: { raw: JsonObject; migratedAt: Timestamp; generatedTimestamps: boolean }`.
- `PendingProfile = Omit<ChildProfile, 'primaryScheduleId'> & { primaryScheduleId: null; migrationStatus: 'needs-schedule-choice' }`; `StoredProfile = ChildProfile | PendingProfile`. Fechas inválidas no entran en estos tipos normales: irán a `MigrationIssue` en T4.
- `ReviewReason = 'unknown-schedule' | 'unidentified-product' | 'unidentified-stage' | 'unverified-rule' | 'invalid-date' | 'future-date' | 'before-birth' | 'mixed-course' | 'missing-profile' | 'legacy-unconfirmed'`. Los textos españoles se presentan en UI; el código no incluye información personal.
- `parseCivilDate(value: string): CivilDate` rechaza valores inexistentes; `todayCivil(now?: Date): CivilDate`; `addCivil(birth: CivilDate, offset: {unit:'days'|'months'|'years';value:number}): CivilDate`; `ageAt(birth: CivilDate, today: CivilDate): {years:number;months:number;days:number}`; `millisecondsUntilNextLocalDay(now: Date): number`.
- En `schemas.ts`: schemas Zod para fechas, perfiles normales/pendientes, aplicaciones y preferencias; validación de fecha en contexto se completa en T5. Desconocido es un valor explícito, no una cadena inventada desde una marca.
- Fixtures: `CHILD_A`, `CHILD_B`, `ADMIN_A` son UUIDs fijos válidos; `makeProfile(overrides?: Partial<ChildProfile>): ChildProfile`, `makeAdministration(overrides?: Partial<VaccineAdministration>): VaccineAdministration`. Defaults: Luna, 2026-01-31, acortado, producto `unidentified` por revisar. Ninguna fixture se importa en la aplicación.

- [ ] **1. Añadir dependencias de validación y pruebas:** `pnpm add zod@4.6.7` y `pnpm add -D fake-indexeddb@6.2.6`. Configurar Vitest en Node con `src/test/setup.ts`; usar IndexedDB de memoria, nombres únicos por prueba y cierre/borrado de esas bases, nunca `vacunas-colombia` real. Mantener también los tests existentes hasta T7.
- [ ] **2. Escribir casos de comportamiento fallidos en `civilDate.test.ts`:**

```ts
expect(addCivil('2026-01-31', { unit: 'months', value: 2 })).toBe('2026-03-31')
expect(addCivil('2026-01-31', { unit: 'days', value: 42 })).toBe('2026-03-14')
expect(addCivil('2024-02-29', { unit: 'years', value: 5 })).toBe('2029-02-28')
expect(() => parseCivilDate('2026-02-29')).toThrow()
expect(ageAt('2026-01-31', '2026-03-01')).toEqual({ years: 0, months: 1, days: 1 })
```

Añadir las siete filas de la tabla de la spec, días 29/30/31, cambio de año, y `todayCivil` a las 23:30 locales. Para `America/New_York`, el tiempo de medianoche a medianoche del 2026-03-08 debe ser 23 horas y el del 2026-11-01, 25 horas.
- [ ] **3. Ejecutar fallo:** `pnpm exec vitest run src/lib/civilDate.test.ts`. Esperado inicialmente: fallo de funciones/casos nuevos; después de existir el módulo, comprobar que las aserciones detectan aproximación por días y conversión UTC.
- [ ] **4. Implementar funciones y schemas:** parseo civil explícito, date-fns y formato local; para `ageAt` descomponer años/meses ajustados al último día y días restantes, sin edades negativas válidas. No usar `toISOString` salvo timestamps técnicos.
- [ ] **5. Verificar:** ejecutar el archivo de fechas bajo `TZ=America/Bogota`, `TZ=America/New_York` y `TZ=Pacific/Kiritimati`; todos los casos aplicables pasan. Documentar comandos de desarrollo/pruebas en README. La prueba real de estas funciones conectadas a UI es T7.
- [ ] **6. Commit sugerido:** `feat: add validated civil dates and vaccination domain contracts`.

### T2: Catálogo versionado con fuentes y correspondencias explícitas

**Files:** crear los ocho módulos de `src/data/catalog/` del mapa, `src/data/catalog/catalog.test.ts`, `docs/catalog-sources.md`; ampliar fixtures solo cuando se necesiten casos reales de catálogo.

**Interfaces:**
- En `catalog/types.ts`: `Source {id,url,reviewedAt,verification:'verified'|'needs-review'}`, `Requirement {id,name,disease,doseNumber,milestoneId,access:'pai'|'private'|'conditional',sourceIds}`, `Projection {requirementId,offset:{unit,value}|null}`, `Product {id,name,brands,components,doseCount?:number,sourceIds,coverageRules: CoverageRule[]}`, `CoverageRule {doseNumber,milestoneId,requirementIds,sourceIds}` y `Catalog {version,reviewedAt,sources,requirements,primarySchedules,sharedProjections,products,optionalRequirements}`.
- `getCatalog(version: string): Catalog | undefined`, `CURRENT_CATALOG_VERSION`, `UNIDENTIFIED_PRODUCT_ID = 'unidentified'` en `catalog/index.ts`. La entrada no identificada carece de componentes y reglas.
- IDs fijos: `bcg`, `hep-b-birth`, `penta-1..3`, `ipv-1..3`, `rota-1..2`, `pcv-1..2`, `influenza-1..2`, `yellow-fever`, `srp-1..2`, `varicella-1..2`, `pcv-booster`, `hep-a-1`, `dpt-booster-1..2`, `ipv-booster-1..2`; `rota-private-3` es opcional y nunca sustituye los dos primeros. Hitos estables `birth`, `primary-1..3`, `month-6`, `month-7`, `month-9`, `month-12`, `month-18`, `year-5`.
- Productos identificables: `pentavalent-cellular`, `ipv`, `hexavalent-acellular`, `rotarix`, `rotateq`, `meningococcal-acwy`, `meningococcal-b` y los biológicos de requisitos compartidos. No asignar reglas a un producto genérico si fabricante/formulación/etapa no permiten verificarlas. Añadir marcas como vocabulario, no como equivalencias automáticas.

- [ ] **1. Revisar fuentes antes de introducir reglas:** leer las cinco URLs oficiales de §4.4 del Markdown y fichas oficiales de los fabricantes para composición/curso de los productos. Registrar URL exacta, documento/página, fecha, regla respaldada y elegibilidad en `docs/catalog-sources.md` y `sources.ts`. No copiar afirmaciones clínicas del Excel como evidencia. Si una regla no puede verificarse, marcarla `needs-review`, mantener captura manual y no inventar edades, rescate o equivalencia; informar el límite clínico en aceptación final.
- [ ] **2. Escribir prueba de representación clínica que evita el bug observado:** con el catálogo de producción, los tres requisitos penta/IPV existen en ambos modos, sin SRP 2 a cinco años y sin rotavirus privado 3 universal. Verificar que `getCatalog('desconocido')` devuelve `undefined`, no el actual. Una regla que referencia una fuente por revisar no puede considerarse elegible para cobertura. No probar copias literales de arrays: comprobar proyecciones y resolución mediante los consumidores de T3 cuando estén disponibles.
- [ ] **3. Ejecutar:** `pnpm exec vitest run src/data/catalog/catalog.test.ts`; esperado fallo hasta disponer de los datos/contratos.
- [ ] **4. Implementar los módulos completos:** primarias con 2/4/6 meses o 42/84/126 días; compartidas con meses/años reales; enfermedad, dosis, acceso y fuente en cada requisito. Mantener el refuerzo neumocócico y las dos dosis primarias correspondientes, sin inventar tercera primaria para todas las vacunas. Dosis cero de sarampión separada y no universal. Reglas verificadas de hexavalente cubren penta/IPV de la misma etapa, nunca etapas posteriores.
- [ ] **5. Verificar:** pruebas del catálogo más lectura de su evidencia. No dar por aprobada la vigencia clínica por pasar tests; las fuentes por revisar siguen claramente señaladas. README enlaza el registro de fuentes.
- [ ] **6. Commit sugerido:** `feat: add versioned Colombia vaccination catalogs and product evidence`.

### T3: Programación, cobertura y progreso por requisito

**Files:** crear `src/lib/schedule/{calculateSchedule,resolveCoverage,summarizeSchedule}.ts` y sus tres `.test.ts`.

**Interfaces:**
- `ScheduledRequirement = Requirement & {estimatedDate:CivilDate|null; conditional:boolean}`.
- `calculateSchedule(profile: ChildProfile, catalog: Catalog, today: CivilDate, selectedOptionalProductIds: readonly string[]): ScheduledRequirement[]`. Orden por fecha; sin fecha al final. Una versión no coincidente es error explícito; no usar otra referencia a escondidas.
- `resolveSelection(selection: {productId:string;doseNumber?:number;milestoneId?:string}, catalog: Catalog): {coveredRequirementIds:string[];coverageStatus:'verified'|'needs-review';reviewReasons:ReviewReason[]}` en `resolveCoverage.ts`.
- `resolveCoverage(profile: ChildProfile, applications: readonly VaccineAdministration[], scheduled: readonly ScheduledRequirement[], catalog: Catalog, today: CivilDate): {coveredRequirementIds:Set<string>;reviewByAdministrationId:Map<string,ReviewReason[]>}`. Lee snapshots de cobertura validados, revisa producto/dosis/etapa y fechas respecto del perfil sin reescribir eventos. No promueve automáticamente un evento `needs-review`.
- `summarizeSchedule(scheduled:readonly ScheduledRequirement[], coverage:ReturnType<typeof resolveCoverage>, today:CivilDate): {items: RequirementView[];applied:number;upcoming:number;pending:number;past:number;needsReview:number;due:number;dueCovered:number;progressPercent:number|null;nextDate:CivilDate|null;nextRequirementIds:string[]}`. `RequirementView` es `ScheduledRequirement` más `status:'applied'|'upcoming'|'pending'|'past'|'needs-review'`. Las cinco cuentas de estado son disjuntas; sin fecha ni cobertura verificada es `needs-review`. Dashboard muestra Aplicados, Próximos y Pendientes/por revisar; la tercera tarjeta suma `pending + past + needsReview`, con detalle por estado.
- Opcionales seleccionadas se guardarán en la preferencia portable `optional-products:<childId>`; no elegirlas por observar una cadena de marca en datos heredados. Rotavirus privado 3 sin calendario verificado tiene fecha `null` y no entra en progreso ni en próximos.

- [ ] **1. Escribir regresiones fallidas:** las fechas A02/A03 deben salir de `calculateSchedule`, no de una rama aislada de aritmética. Una aplicación hexavalente confirmada de `primary-1` cubre exactamente `penta-1` e `ipv-1`; un segundo evento idéntico no aumenta el conjunto. Dos eventos válidos de Rotateq 1/2 no cubren `rota-private-3`. Producto/etapa desconocidos y cursos mezclados no se promocionan a verificados.

```ts
expect([...coverage.coveredRequirementIds].sort()).toEqual(['ipv-1', 'penta-1'])
expect(coverage.coveredRequirementIds.has('penta-2')).toBe(false)
expect(coverage.coveredRequirementIds.has('rota-private-3')).toBe(false)
expect(summary.progressPercent).toBe(67) // fixture: dos requisitos cubiertos de tres ya programados
```

La última fixture contiene además un requisito futuro y uno opcional sin fecha: ninguno pertenece al denominador. Duplicar un evento no cambia 67. Con cero requisitos vencidos/programados, el porcentaje es `null`.
- [ ] **2. Añadir límites de estado:** hoy y hoy+30 son Próxima; hoy+31 Pendiente; ayer sin cobertura es Fecha pasada / por confirmar. Si se cubre una vacuna de un hito con varias, las demás siguen pendientes y visibles. Una fecha real futura heredada o anterior al nacimiento editado no concede cobertura. Cambiar modo/versión deja idénticos los objetos de aplicaciones recibidos.
- [ ] **3. Ejecutar:** `pnpm exec vitest run src/lib/schedule src/data/catalog/catalog.test.ts`; observar fallos semánticos y después implementar las firmas sin acceder a Dexie. Devolver copias de vistas, no mutar entradas.
- [ ] **4. Verificar:** ejecutar el mismo comando hasta PASS y los casos de fechas en las tres zonas de T1. No calcular recuperación clínica ni usar la fecha de una administración tardía como nuevo origen de programación.
- [ ] **5. Commit sugerido:** `fix: resolve vaccination coverage and progress by stable requirements`.

### T4: Migración transaccional de IndexedDB y registros pendientes

**Files:** crear `src/lib/migration.ts`, `src/lib/db.ts`, `migration.test.ts`, `db.test.ts`; ampliar `types.ts`, `schemas.ts` y `src/test/fixtures.ts`.

**Interfaces:**
- `LegacyFamilyV1` conserva exactamente `{version:1,profiles,doses}` del exportador actual; los registros de entrada se tratan como datos no confiables. `MigrationIssue {id:string;kind:'profile'|'administration';entityId:string;childId?:string;raw:JsonObject;reasons:ReviewReason[];migratedAt:Timestamp}`. ID de issue determinista `profile:<id>` o `administration:<id>`; conservar `entityId` al reparar.
- `FamilySnapshot {profiles:StoredProfile[];administrations:VaccineAdministration[];preferences:LocalPreference[];migrationIssues:MigrationIssue[];revision:number}`.
- `migrateLegacyFamily(input: LegacyFamilyV1, migratedAt: Timestamp): FamilySnapshot` en `migration.ts`; sin efectos de almacenamiento. `VaccineDB extends Dexie`, `openDatabase(name?: string): Promise<VaccineDB>` en `db.ts`; ningún singleton se abre al importar el módulo. Por defecto, nombre `vacunas-colombia`; los tests siempre pasan otro nombre.
- Tablas finales: `profiles: 'id, nickname'`, `administrations: 'id, childId, appliedDate'`, `preferences: 'key'`, `migrationIssues: 'id, kind, childId'`. La revisión local reside en la preferencia interna `internal:revision` y no es portable.
- Versiones Dexie: conservar definición v1; v2 añade tablas nuevas y transforma filas en una transacción de upgrade, preservando originales y limpiando `profiles` solo después de leerlas; v3 retira `doses` una vez transformada. Fresh install crea directamente el esquema final vacío. Una única apertura debe recorrer upgrades sin confirmaciones interactivas dentro de la transacción.

- [ ] **1. Crear fixtures v1 con `seedLegacyDatabase(name: string, snapshot: LegacyFamilyV1): Promise<void>` en los helpers de prueba:** dos perfiles válidos, uno sin esquema, dosis con campos opcionales/texto libre, duplicados con IDs distintos, fecha futura, fecha inexistente y huérfano. La helper reproduce las tablas/indexes de `lib/data.ts` y cierra antes de migrar.
- [ ] **2. Escribir casos fallidos:** preservar UUIDs, fechas literales, `createdAt`, lote/IPS/notas y texto de dosis; mapear solo esquemas conocidos. Todas las dosis normales heredadas empiezan por revisar y sin cobertura. Esquema desconocido con nacimiento válido → `PendingProfile`; fila de perfil inválida → issue con raw íntegro, no fecha inventada. Huérfanos/fechas inválidas → issues; no inventar niños. Reabrir no duplica registros ni vuelve a migrar timestamps.
- [ ] **3. Escribir prueba de rollback:** abortar una transacción real de upgrade del IndexedDB de prueba y reabrir con el esquema v1 para comprobar que perfiles/dosis originales siguen intactos. Añadir apertura sin IndexedDB y apertura bloqueada por otra conexión: error identificable, nunca creación alternativa o borrado automático.
- [ ] **4. Ejecutar:** `pnpm exec vitest run src/lib/migration.test.ts src/lib/db.test.ts`; después implementar la transformación y las versiones. Conservar raw/timestamps generados como metadatos de procedencia; normalizar acceso conocido, de lo contrario `unknown`; no parsear números de dosis desde texto libre.
- [ ] **5. Verificar:** pruebas PASS y snapshot de todos los registros, incluidos issues. Documentar en README el comportamiento de la migración y qué debe revisar la familia. La prueba real con la UI migrada se hace en T7/T8, sin abrir aún la base familiar de la máquina para experimentar.
- [ ] **6. Commit sugerido:** `feat: migrate legacy vaccination records without data loss`.

### T5: Repositorio atómico, guardado idempotente y estado reactivo

**Files:** crear `src/lib/repository.ts`, `repository.test.ts`, `src/hooks/useFamily.ts`, `useToday.ts`; ampliar tipos/schemas según estos contratos.

**Interfaces:**
- `MutationContext {today:CivilDate;now:Timestamp;catalog:Catalog}`.
- `ProfileInput {nickname:string;birthDate:CivilDate;primaryScheduleId:PrimaryScheduleId}`; `saveProfile(db: VaccineDB, command:{id:string;mode:'create'|'edit';input:ProfileInput}, context:MutationContext): Promise<ChildProfile>`. Crear asigna versión vigente; editar conserva la versión ya elegida. `changeCatalogVersion(db, childId:string, version:string, context): Promise<void>` informa la actualización y nunca modifica aplicaciones.
- `AdministrationInput` contiene los campos editables de la spec, no `coveredRequirementIds` ni IDs de perfil. `saveAdministration(db, command:{id:string;childId:string;mode:'create'|'edit';input:AdministrationInput}, context): Promise<VaccineAdministration>`: validar perfil/fecha y resolver cobertura; no aceptar arrays de cobertura arbitrarios de la UI.
- `readFamily(db): Promise<FamilySnapshot>` consistente en una transacción; `setPreference(db,key:string,value:JsonValue): Promise<void>` admite solo `activeProfileId` y `optional-products:<childId>` desde UI. Toda mutación aumenta `internal:revision` en la misma transacción.
- `deleteAdministration(db:VaccineDB,childId:string,id:string): Promise<void>`, `deleteProfile(db:VaccineDB,childId:string): Promise<void>`, `deleteMigrationIssue(db:VaccineDB,issueId:string): Promise<void>`, `clearFamily(db:VaccineDB): Promise<void>`; eliminar perfil borra también preferencias de ese niño y sus issues referenciados. Eliminar un issue individual solo borra esa fila, sin reasignar ni borrar otros registros; también incrementa la revisión local.
- `clearFamily` y replace conservan monotonía de `internal:revision`: leer el valor anterior y escribir anterior+1 dentro de la misma transacción, incluso cuando se limpien todas las preferencias. Nunca reiniciar la revisión a cero ni adoptar la de un archivo importado.
- `repairMigrationIssue(db,issueId:string,command:ProfileCommand|AdministrationCommand,context): Promise<void>` reutiliza las validaciones, preserva el ID original y elimina el issue solo tras guardar la corrección. `ProfileCommand`/`AdministrationCommand` son los argumentos de `saveProfile`/`saveAdministration`. Solo la reparación explícita de un huérfano permite asignar otro niño; no la edición ordinaria.
- `useFamily(): {status:'loading'|'ready'|'error'|'blocked';db:VaccineDB|null;snapshot:FamilySnapshot|null;errorCode?:string}` abre desde efecto cliente y subscribe `liveQuery(() => readFamily(db))` de Dexie. Cierra/suelta suscripciones al desmontar. Un bloqueo/versionchange conserva el último snapshot; no desmonta formularios con datos.
- `useToday(): CivilDate | null` inicia tras montaje y actualiza mediante el temporizador de T1, `visibilitychange` y `focus`; libera listeners/timeout. Nunca calcula hoy en el servidor para mostrar una fecha distinta al hidratar.

- [ ] **1. Escribir pruebas de repo fallidas:** guardar la misma creación con igual ID/input devuelve el evento persistido, no un duplicado; mismo ID con input diferente rechaza conflicto. Editar conserva ID/createdAt y actualiza campos/updatedAt; elimina solo el niño/evento identificado. Simular fallo de transacción y verificar ausencia de cambios parciales.
- [ ] **2. Cubrir fechas y ownership:** rechazar 2099-01-01 y fecha anterior al nacimiento sin escribir; guardar producto no identificado como evento por revisar válido. Guardar para A tras seleccionar B continúa en A; si A fue eliminado, falla sin registrar en B. Editar una aplicación de otro niño con un `childId` distinto rechaza; huérfano solo se reubica por la reparación confirmada.
- [ ] **3. Cubrir invariantes de perfil y versiones:** cambiar nacimiento/esquema/catálogo deja idénticas todas las filas de administraciones. La revisión por nacimiento contradictorio se deriva en T3, no reescribe su cobertura histórica. Eliminar A deja intactos B y sus eventos; `clearFamily` borra perfiles/eventos/issues/preferencias sin eliminar recursos PWA.
- [ ] **4. Ejecutar:** `pnpm exec vitest run src/lib/repository.test.ts`; implementar transacciones y validaciones. Después de un commit de escritura, una actualización UI fallida no da permiso para generar otro ID: el formulario conserva el comando hasta cerrar tras éxito.
- [ ] **5. Verificar:** pruebas PASS y documentar límites/errores de almacenamiento en README. No crear endpoints. El comportamiento de hooks y formulario real se comprueba al conectarlos en T7, no mediante mocks que solo reenvían llamadas.
- [ ] **6. Commit sugerido:** `fix: persist profile-scoped administrations atomically and idempotently`.

### T6: Respaldo validado, previsualización y restauración atómica

**Files:** crear `src/lib/backup.ts`, `backupSchemas.ts`, `backup.test.ts`; consumir repo/migración sin duplicar sus reglas.

**Interfaces:**
- `BackupV2 {formatVersion:2;exportedAt:Timestamp;profiles:StoredProfile[];administrations:VaccineAdministration[];preferences:LocalPreference[];migrationIssues:MigrationIssue[]}`; metadatos legacy viven con su entidad. Excluir `internal:revision`, permisos y UI transitoria.
- `ImportContext {today:CivilDate;now:Timestamp}`; `serializeBackup(snapshot: FamilySnapshot, exportedAt: Timestamp): string`; `parseBackup(text:string,context:ImportContext): BackupV2` admite únicamente v1 conocido o v2 validado; errores estructurados sin incluir texto privado. Usar `context.now` para metadatos técnicos de migración y `context.today` para validar nuevas fechas de nacimiento/aplicación, sin consultar un reloj global durante la comparación.
- `previewImport(text:string,current:FamilySnapshot,context:ImportContext): ImportPreview`, con `incoming:BackupV2`, `baseRevision:number`, cantidades nuevas/iguales, `conflicts:{entity:'profile'|'administration'|'migrationIssue';id:string}[]` y número de registros por revisar. Comparar representaciones normalizadas; ignorar solo fechas de exportación y marcas técnicas generadas en la migración, no datos familiares/procedencia capturada.
- `applyImport(db:VaccineDB, preview:ImportPreview, mode:'merge'|'replace'): Promise<void>`. Releer `internal:revision` dentro de la transacción; si difiere, error `stale-preview`, sin escribir. Merge con conflictos → error `conflicting-import`; replace borra y carga todo en la misma transacción. Mantener preferencias locales al combinar; reparar ID activo inválido solo tras commit.

- [ ] **1. Escribir roundtrip de todos los campos e issues:** serializar, parsear e importar preserva fechas, esquemas y raw; exportar/importar dos veces no duplica. Repetir v1 no produce conflicto por timestamps de migración; una edición local real sí informa conflicto y no degrada cobertura confirmada.
- [ ] **2. Escribir rechazos con snapshot antes/después idéntico:** JSON inválido, versión futura, fecha imposible/futura o anterior al nacimiento en fila normal v2, nacimiento futuro, UUID duplicado, aplicación nueva huérfana, cobertura falsa y relación cambiada de niño bajo el mismo ID. Los datos incoherentes de v1 se conservan como issues, no se convierten en filas normales v2 inválidas. La cobertura importada debe validarse con su catálogo verificable; versión/regla no disponible conserva evento por revisar sin otorgarle cobertura automática. Nunca descartar silenciosamente la cobertura original: conservarla como procedencia de revisión.
- [ ] **3. Escribir límites de operación:** cancelar no llama `applyImport`; una escritura local posterior a preview provoca `stale-preview`; fallo tras borrar durante replace revierte y conserva toda la familia; merge con una sola colisión no agrega otras filas nuevas. Los huérfanos solo son válidos dentro de `migrationIssues`, no en filas normales de v2.
- [ ] **4. Ejecutar:** `pnpm exec vitest run src/lib/backup.test.ts`; implementar schemas, normalización y operaciones atómicas. Diferenciar ID de formato v1 (`version`) y v2 (`formatVersion`) sin aceptar versiones desconocidas por similitud.
- [ ] **5. Verificar:** pruebas PASS; documentar privacidad, formatos y resolución de conflicto en README. No crear funciones de cifrado ficticias ni envío de archivo al servidor.
- [ ] **6. Commit sugerido:** `feat: validate and restore local vaccination backups safely`.

### T7: Corte de la aplicación al modelo nuevo y flujos centrales completos

**Files:** crear `src/components/AppClient.tsx`, `ProfileForm.tsx`, `AdministrationForm.tsx`, `ProfileSelector.tsx`, `ScheduleSelector.tsx`, `DashboardView.tsx`, `CalendarView.tsx`, `CarnetView.tsx`, `InformationView.tsx`, `SettingsView.tsx`, `src/components/ui/` con los controles utilizados y `src/lib/utils.ts`; crear `components.json`; modificar `app/page.tsx`, `app/globals.css`, `tsconfig.json`, `vitest.config.ts`, `package.json`, `pnpm-lock.yaml`; eliminar `lib/data.ts`, `lib/data.test.ts`.

**Interfaces:**
- `app/page.tsx` solo compone `AppClient`. El prerender del servidor y el primer render cliente muestran el mismo estado de carga, sin acceder a IndexedDB ni APIs del navegador durante render; abrir almacenamiento únicamente después de montaje.
- Estado único de diálogo: `null | {type:'create-profile'} | {type:'edit-profile';childId:string} | {type:'create-administration';childId:string;commandId:string} | {type:'edit-administration';childId:string;administrationId:string}`. No reutilizar `showForm` para acciones distintas.
- Formularios reciben entidad/niño y `onSave` tipados; `AdministrationForm` recibe el comando estable y `today`. Ninguna callback asíncrona consulta el selector activo para decidir ownership.
- `DashboardView`/`CalendarView` reciben perfil, catálogo y resumen de T3. `ScheduleSelector` emite un ID tipado, no muta preferencias globales. `CarnetView` recibe solo eventos del niño. `SettingsView` funciona desde esta tarea con perfiles y exportación básica; T8 amplía importación/reparación/destrucción.
- `InformationView` conserva información/fuentes reales al cortar; T11 completa presentación y privacidad. No introducir botones sin handler o componentes vacíos para las tareas siguientes.

- [ ] **1. Reproducir antes del corte:** en navegador aislado, crear un niño, abrir Agregar otro perfil y observar el formulario incorrecto; revisar fecha tradicional y fallo de guardado ya documentados. Registrar la evidencia sin reinsertar datos en la base real del usuario.
- [ ] **2. Incorporar shadcn/ui según su documentación vigente:** configurar `components.json` con aliases `@/components`, `@/components/ui`, `@/lib/utils` y Tailwind existente. Usar CLI para añadir `button input label select dialog alert-dialog tabs`; conservar la paleta y CSS existentes, sin aceptar una sustitución completa del diseño. El lockfile registra las dependencias que genere; no añadir una biblioteca UI adicional.
- [ ] **3. Implementar el cliente completo para las funciones existentes y los flujos centrales nuevos:** loading, error/blocked sin reset, bienvenida vacía, alta/edición de varios perfiles y selección persistida, calendario/detalles/filtros, dashboard de requisitos y registro/edición de aplicaciones con todos los opcionales. Un perfil pendiente muestra su elección consciente antes del calendario; catálogo no disponible requiere confirmación para cambiar de referencia, no fallback silencioso.
- [ ] **4. Implementar conmutación confirmada compartida por Calendario/Ajustes:** texto exacto `El calendario estimado cambiará; las vacunas que ya registraste permanecerán intactas.` Cancelar mantiene DB y vistas; confirmar guarda perfil y recalcula solo derivados. Selector inicial vacío y textos del documento original para vacunador, acortado transitorio y tradicional. Elegir complementarias mediante una acción visible Mostrar referencia de este producto; guardar sus IDs por perfil. No seleccionar cursos por marcas heredadas; mezclas quedan por revisar.
- [ ] **5. Implementar guardado observable:** capturar formulario/valores/niño/ID antes del await, bloquear clic/Enter en curso, conservar campos/comando ante fallo y cerrar tras commit/refresco. Hacer visible que producto/dosis/hito ambiguos se guardan por revisar. Etiquetas asociadas, errores accionables sin datos privados, foco y teclado en diálogos. Conservar todos los campos en edición.
- [ ] **6. Hacer el corte atómico de consumidores:** cambiar `@/*` a `./src/*` en TS y Vitest, convertir imports, eliminar exportaciones/modelos antiguos y sus dos tests reemplazados. Comprobar referencias con LSP antes de retirar; no crear un re-export de `lib/data.ts`. Navegación inferior móvil con las cinco vistas; no perder carné ni exportación ya existentes al separar componentes.
- [ ] **7. Verificar:** `pnpm test` y `pnpm build`; luego `pnpm start --hostname 127.0.0.1 --port 3100` y navegador real. Ejecutar A01–A10, A16, F02/F03/F04 y Review Focus 1/4: dos niños, ambas series, una hexavalente, fabricante rotavirus, edición, cambio de esquema cancelado/confirmado, reapertura, fallo de escritura, cambio de perfil durante formulario y regreso de segundo plano tras cambio de fecha. Comprobar exactamente las fechas de la spec y los campos/eventos intactos. Inspeccionar consola y superficie móvil/teclado. No basta con pasar los tests de dominio.
- [ ] **8. Actualizar README con los recorridos disponibles; commit sugerido:** `feat: connect family profiles and vaccination views to the corrected local model`.

### T8: Importación, revisión de migración y acciones destructivas en UI

**Files:** crear `src/components/BackupPanel.tsx`, `MigrationReviewPanel.tsx`, `DataRemovalDialog.tsx`; modificar `SettingsView.tsx`, `AdministrationForm.tsx`, `AppClient.tsx`, `CarnetView.tsx` y README.

**Interfaces:**
- `BackupPanel({db,snapshot,onBusyChange})` exporta la familia y prepara `ImportPreview` con T6. Elegir archivo nunca lo aplica. Inputs/estado de preview viven solo en cliente.
- `MigrationReviewPanel({db,snapshot,today,catalog})` lista issues y aplicaciones legadas por revisar, permite confirmar/corregir una fila conservando su ID o eliminarla con confirmación/oferta de copia. Para un huérfano, solicitar perfil destino explícitamente y mostrar origen/destino antes de reparar. No borrar todos los issues al resolver uno.
- `DataRemovalDialog` modela scopes `administration`, `migration-issue`, `profile`, `all`; `all` requiere dos confirmaciones diferenciadas. La confirmación de negocio se recoge en UI, no dentro de la transacción Dexie.

- [ ] **1. Definir y ejecutar recorrido fallido antes de conectar:** exportar y buscar Importar, reparar un registro legado, eliminar un perfil; las funciones ausentes quedan documentadas, sin pruebas permanentes de existencia de botones.
- [ ] **2. Implementar BackupPanel:** descarga con Blob/URL y liberación de recursos, aviso JSON privado no cifrado; selección de archivo local, errores de validación, preview de cantidades/conflictos/revisión, Combinar habilitado solo si no hay conflictos y Reemplazar con aviso/oferta de copia/confirmación. Cancelar limpia preview sin mutaciones. Error `stale-preview` obliga a obtener nueva preview, no reintenta reemplazo automáticamente.
- [ ] **3. Implementar revisión y borrado:** mostrar por qué los registros no conceden cobertura; resolver producto/dosis/etapa a través del formulario real; conservar raw original. Eliminar aplicación con confirmación; eliminar perfil con sus datos y oferta de copia; borrar todo con dos confirmaciones. Tras borrar el último niño vuelve bienvenida vacía; tras borrar el activo cambia a uno existente.
- [ ] **4. Verificar en producción:** A12/A13, M01–M03, F05 y Review Focus 2/3. Crear una base v1 aislada y abrirla por la aplicación para comprobar migración real; exportar, reimportar dos veces, conflicto de ID, cancelación y fallo. Probar cambio de datos en otra pestaña entre preview/confirmación; el estado previo no se sobrescribe. Reabrir y verificar niños no afectados. Comprobar que ninguna lectura de archivo genera upload/fetch de datos familiares.
- [ ] **5. Ejecutar pruebas de repo/migración/backup tras los cambios; actualizar README con restauración/revisión/borrado; commit sugerido:** `feat: add safe backup import and local data review controls`.


### Task 9: Carcasa móvil y jerarquía consistente de acciones

**Files:** modificar `app/globals.css`; actualizar este plan y la evidencia de aceptación de U01. No cambiar componentes ni paleta salvo que la comprobación geométrica demuestre que CSS no puede expresar el contrato.

**Interfaces:**
- A `max-width: 700px`, `.app` ocupa `100dvh` en tres filas `auto minmax(0,1fr) auto`; `.wrap` es la única zona desplazable y `.nav` ocupa su propia fila, sin `position: fixed`.
- A `max-width: 480px`, `.actions` usa una columna y sus botones ocupan el ancho disponible con altura mínima de 44 px. Escritorio conserva las filas compactas actuales.
- `@media print` revierte altura, overflow y grid de la carcasa para no recortar el PDF.

- [ ] **1. Registrar RED en navegador real:** en producción, viewport 390 × 844 y Ajustes con dos perfiles, comprobar que `wrap.bottom > nav.top` y que dos grupos `.actions` equivalentes terminan con diferente número de filas. Conservar captura y métricas; no crear un test de texto CSS.
- [ ] **2. Implementar la carcasa y acciones estrechas:** modificar únicamente las reglas responsive/print necesarias; conservar cabecera, tarjetas, paleta y navegación de cinco vistas.
- [ ] **3. Ejecutar GREEN y smoke:** en 390 × 844 comprobar `wrap.bottom <= nav.top`, scroll completo, cinco acciones navegables y todos los grupos estrechos en una columna con controles ≥44 px. Repetir a 700 px y escritorio para detectar regresión; generar un PDF real y comprobar que no queda recortado.
- [ ] **4. Ejecutar `pnpm test` y `pnpm build`; commit:** `Task 09 : Implementation : correct mobile navigation and action hierarchy`.

### Task 10: Referencias clínicas 2026 e histórica versionadas

**Files:** crear `src/data/catalog/historical-requirements-co-undated.ts`; modificar `src/data/catalog/{types,sources,index,catalog.test}.ts`, `src/lib/{types,schemas,repository,repository.test}.ts`, `src/components/{ProfileForm,ScheduleSelector,DashboardView,CalendarView,SettingsView,AppClient}.tsx`, `src/components/presentation.ts`, `docs/catalog-sources.md`, README y pruebas consumidoras de `ProfileCommand`.

**Interfaces:**
- Exportar `HISTORICAL_CATALOG_VERSION = 'CO-PAI-EPS-SANITAS-UNDATED-ED2'` y mantener `CURRENT_CATALOG_VERSION = 'CO-PAI-SHARED-2026-10'`. `getCatalog(version)` resuelve ambos y continúa devolviendo `undefined` para desconocidos.
- Definir `ScheduleReferenceId = 'CO-PAI-REFERENCE-2026' | 'CO-PAI-REFERENCE-PRE-2026' | 'CO-PAI-REFERENCE-LEGACY-2-4-6-2026'` y un registro inmutable que mapea cada referencia a `primaryScheduleId`, `catalogVersion`, etiqueta y `selectable`. Solo las dos primeras se ofrecen al crear; la tercera únicamente representa perfiles ya guardados.
- `ScheduleReferenceId` vive en `src/lib/types.ts`; el registro y los resolutores viven en `src/data/catalog/index.ts`. `Catalog.primarySchedules` pasa a `Partial<Record<PrimaryScheduleId, Projection[]>>` y todo consumidor comprueba soporte explícito antes de calcular.
- `ProfileInput` transporta `scheduleReferenceId` en lugar de un `primaryScheduleId` aislado. `saveProfile` resuelve y valida la pareja con el catálogo de contexto, y actualiza `primaryScheduleId` + `referenceCatalogVersion` en una sola transacción. La referencia legada solo puede conservarse al editar el mismo perfil; no se crea ni se adopta.
- El catálogo histórico usa serie primaria a 2/4/6 meses y mueve `yellow-fever` a `month-18`; conserva SRP 2 a 18 meses. Las notas condicionales de 2–5/5–14 años no crean requisitos universales. El catálogo 2026 conserva 42/84/126 días, fiebre amarilla a 9 meses y las fuentes MinSalud.
- Extender `Source` con `publishedAt?: CivilDate | 'unknown'`. Añadir las dos URLs aportadas a `sources.ts`: EPS Sanitas edición 2 respalda reglas históricas con `publishedAt: 'unknown'` y `reviewedAt` como fecha de consulta; Salud Total identifica el esquema 2026, queda como referencia secundaria leída y no reemplaza MinSalud donde difiere. Información muestra ambas fechas sin presentar `reviewedAt` como emisión.

- [ ] **1. Escribir RED de catálogo:** casos literales para nacimiento 2026-01-31: histórico produce primarias 03-31/05-31/07-31 y fiebre amarilla 2027-07-31; 2026 produce 03-14/04-25/06-06 y fiebre amarilla 2026-10-31. Verificar que el catálogo histórico rechaza la serie acortada, que la pareja catálogo 2026 + 2/4/6 solo se identifica como legado no seleccionable y que desconocido sigue sin fallback.
- [ ] **2. Ejecutar RED:** `pnpm test -- src/data/catalog/catalog.test.ts`; debe fallar por catálogo/referencia histórica ausente, no por import o fixture incorrectos.
- [ ] **3. Implementar ambos catálogos y fuentes:** separar requisitos/proyecciones históricas, registrar versiones inmutables y rechazar combinaciones no soportadas. No copiar del PDF reglas fuera del alcance infantil aprobado.
- [ ] **4. Escribir RED transaccional:** en `repository.test.ts`, crear y cambiar referencias actualiza catálogo/serie juntos y conserva las administraciones byte por byte; editar apodo de un perfil legado conserva su pareja; intentar crear o adoptar la referencia legada falla sin escritura.
- [ ] **5. Ejecutar RED y luego implementar el comando de perfil:** actualizar schemas, repositorio, fixtures y todos los consumidores. Ejecutar las pruebas focales hasta GREEN y después toda la suite.
- [ ] **6. Actualizar UI y documentos:** etiquetas exactas **Esquema 2026** / **Esquema anterior a 2026**, fuente y vigencia visibles, estado legado explícito; actualizar README y `docs/catalog-sources.md` con alcance y diferencias.
- [ ] **7. Smoke de producción:** crear un perfil por referencia, comprobar fechas e hitos, cancelar/confirmar cambio desde Calendario y Ajustes, recargar y comparar todos los campos de aplicaciones antes/después. Abrir un perfil legado y verificar que no cambia hasta confirmación.
- [ ] **8. Ejecutar `pnpm test` y `pnpm build`; commit:** `Task 10 : Implementation : separate 2026 and historical vaccination references`.
### Task 11: Carné imprimible, información y privacidad accesibles

**Files:** crear `src/components/PrivacyNotice.tsx`; modificar `CarnetView.tsx`, `InformationView.tsx`, `SettingsView.tsx`, `app/globals.css`, `app/layout.tsx` y README.

**Interfaces:**
- `CarnetView({profile,administrations,today})` ordena eventos reales, ofrece invertir orden y ejecuta `window.print()` tras acción consciente; `today` es la fecha civil de exportación.
- `PrivacyNotice` explica lo guardado/dónde/borrado/respaldo/riesgos/datos técnicos del hosting; no pide consentimiento ficticio de nube ni promete anonimización.
- Detalle informativo de catálogo presenta la fuente concreta y su fecha/estado; no confundir fuentes no verificadas con equivalencias aprobadas.

- [ ] **1. Comprobar impresión previa:** generar PDF A4 desde el navegador y observar cabecera/botón promocional y campos ausentes. Esta evidencia funcional sustituye tests de texto CSS.
- [ ] **2. Implementar carné completo e impresión:** producto, dosis o Por verificar, fecha literal, marca/lote/IPS cuando existan; solo administraciones del perfil. Tabla semántica con encabezados repetibles y saltos legibles, apodo/nacimiento/fecha de exportación. Ocultar acciones, navegación, formularios y hero. Leyenda literal: `Registro familiar no oficial. No reemplaza el carné de vacunación expedido por el prestador ni PAIWEB.`
- [ ] **3. Completar Información/Privacidad:** PAI frente a particular, combinadas y variación por producto/edad, enlaces oficiales/fecha de revisión, advertencias sobre medidas transitorias y almacenamiento. No trasladar medicamentos o comparaciones comerciales del Excel. Solicitar almacenamiento persistente desde acción consciente (por ejemplo Guardar perfil o Ajustes), manejar false/no soporte sin bloquear.
- [ ] **4. Verificar A11 y accesibilidad:** guardar un PDF real con registros suficientes para varias páginas; inspeccionar documento/imagen, orden normal/invertido, lotes/IPS, fecha y leyenda, sin pendientes como aplicadas. Navegar todas las vistas con teclado, comprobar foco de diálogos, labels, errores, contraste y ancho de móvil. Probar rechazo/ausencia de `navigator.storage.persist`. Inspeccionar red: sin fuentes externas ni SDKs nuevos.
- [ ] **5. Actualizar README; commit:** `Task 11 : Implementation : complete printable card privacy and accessibility`.

### Task 12: PWA compatible, offline verificable e instalación sin recargas destructivas

**Files:** crear `app/sw.ts`, `app/offline/page.tsx`, `src/components/PwaManager.tsx`, `src/lib/pwa.ts`, `public/icons/icon-192.png`, `icon-512.png`, `apple-touch-icon.png`; modificar `public/manifest.webmanifest`, `next.config.ts`, `app/layout.tsx`, `AppClient.tsx`, `.gitignore`, `package.json`, `pnpm-lock.yaml`, README.

**Interfaces y decisión concreta:**
- Usar `@serwist/next@9.5.13` y `serwist@9.5.13` en modo webpack; scripts `dev: next dev --webpack`, `build: next build --webpack`, `start: next start`. No ocultar incompatibilidad de Turbopack con warnings suprimidos. Conservar render estático de rutas bajo despliegue Next estándar de Vercel y cabeceras existentes; no forzar `output: 'export'` ni introducir backend. El proyecto no requiere endpoints de usuario.
- `withSerwistInit`: `swSrc:'app/sw.ts'`, `swDest:'public/sw.js'`, `register:false`, `reloadOnOnline:false`, `cacheOnNavigation:false`, `disable: process.env.NODE_ENV !== 'production'`. Incluir `/`, `/offline`, `/manifest.webmanifest`, `/icon.svg`, `/icons/icon-192.png`, `/icons/icon-512.png` y `/icons/apple-touch-icon.png` en `additionalPrecacheEntries` con revisión nueva por build; el plugin incorpora chunks compilados. No usar revisión constante para HTML. En configuración, una revisión calculada una vez con `crypto.randomUUID()` por build es suficiente para estos pocos recursos.
- Worker: `self.__SW_MANIFEST`, `skipWaiting:false`, `clientsClaim:true`, `navigationPreload:false`, y no copiar `defaultCache`: mantener `runtimeCaching` vacío. Registrar navegación de `/` con `serwist.registerCapture` y `serwist.createHandlerBoundToUrl('/')`; `/offline` también pertenece al precache. Para otras navegaciones GET del mismo origen, registrar un handler sin caché que haga fetch y, ante fallo de red, devuelva `serwist.matchPrecache('/offline')`; si falta incluso ese recurso, devolver `Response.error()`. No cachear consultas arbitrarias, POST, blobs de respaldo, RSC dinámico o datos familiares. El catálogo local viaja en los chunks. Probar que `/` precacheada devuelve el shell completo, no solo el aviso offline.
- `pwa.ts` exporta `registerPwa(): Promise<ServiceWorkerRegistration|null>` con `/sw.js`, scope `/`, `updateViaCache:'none'`; `requestPersistentStorage(): Promise<'granted'|'denied'|'unsupported'>`; funciones sin push/subscription. Registro único después de montaje y solo en producción.
- `PwaManager({hasUnsavedChanges:boolean,storageBlocked:boolean})` registra, captura `beforeinstallprompt`, muestra instrucciones iOS/Android y ofrece actualización cuando el worker espera. Solo tras confirmación y formulario limpio envía `SKIP_WAITING` al waiting worker. No ejecutar `location.reload` por recuperar conexión ni por `controllerchange` sin confirmación. Otras pestañas no se recargan automáticamente; formularios/snapshots se conservan ante cambio de worker/versionchange. Capturar `hasUnsavedChanges` desde formularios de perfiles/aplicaciones/importación.

- [ ] **1. Reproducir el fallo original con build de producción:** esperar carga completa, desactivar red y recargar; registrar que falla antes de instalar el worker. No probar offline contra `next dev`.
- [ ] **2. Añadir dependencias y configuración:** `pnpm add @serwist/next@9.5.13 serwist@9.5.13`. Conservar cabeceras `nosniff`, referrer y permisos; para `/sw.js`, servir JavaScript con no-cache/no-store y alcance `/`. Excluir en Git solo los generados exactos `public/sw.js`, `public/sw.js.map`, `public/swe-worker-*.js` y sus mapas, sin excluir `app/sw.ts` ni íconos fuente. Tipar worker con WebWorker y `@serwist/next/typings` según las APIs del paquete.
- [ ] **3. Implementar precache y estados de instalación/actualización:** manifest con nombre/short_name correctos, PNGs válidos en tamaños declarados y apple touch icon. Enlazarlo en metadata de layout sin duplicar manifests. Generar los PNGs localmente a partir de `app/icon.svg`, no depender de un generador remoto ni subir archivos. Página `/offline` en español enlaza Inicio y explica límite de primera carga, sin datos personales.
- [ ] **4. Demostrar compatibilidad real:** `pnpm build` y `pnpm start --hostname 127.0.0.1 --port 3100`; comprobar `/sw.js` y sus cabeceras, worker activo, manifiesto y todos los recursos precacheados. La metadata npm permite Next >=14 y el ejemplo mantenido usa Next 16, pero eso no sustituye este build/offline de 16.4.2. Si falla, corregir la integración en esta tarea; no recortar offline a una página de aviso ni cambiar la versión de Next a ciegas.
- [ ] **5. Verificar A14/A17/P01:** después de esperar `navigator.serviceWorker.ready` y control de la página, desconectar red y abrir/recargar `/`; crear/editar perfil, registrar/editar vacuna, calendario, carné, imprimir y exportar/importar. Inspeccionar Cache Storage: solo recursos de app. Volver online no recarga ni pierde campos. Crear otro build con cambio de revisión y misma IndexedDB: worker espera; cancelar actualización conserva el formulario; confirmar limpio activa/reabre y los eventos siguen intactos. Repetir con otra pestaña abierta y un formulario modificado; no auto-recarga ni reset.
- [ ] **6. Verificar instalación real:** Safari/iOS y Chrome/Android con HTTPS, ícono/nombre/standalone, instrucciones contextualizadas y botón Android solo cuando existe evento. Registrar por separado emulación y dispositivo físico; si no está disponible, dejar A17 pendiente de esa evidencia sin afirmar aceptación total. Actualizar README de estrategia/actualizaciones y commit: `Task 12 : Implementation : add safe offline PWA support`.

### Task 13: Aceptación integral, privacidad de red y documentación de despliegue

**Files:** modificar `README.md`, `docs/catalog-sources.md` cuando una regla cambie; crear `docs/verification/mvp-acceptance.md`; ajustar únicamente código/tests donde la verificación encuentre un defecto real.

**Interfaces:** usar las APIs anteriores. No introducir motores/validadores alternativos, datos demo persistidos ni infraestructura de pruebas UI nueva para esta tarea.

- [ ] **1. Ejecutar comprobaciones finales:** `pnpm install --frozen-lockfile`, `pnpm test`, archivos de fechas/calendario en las tres zonas de T1 y `pnpm build`. Esperado PASS/build completo; ninguna afirmación de offline se deriva solo de compilar. Si ya se observó un fallo reportado por el usuario, corregir desde esa evidencia y no gastar una ejecución en reconfirmarlo.
- [ ] **2. Ejecutar A01–A17 con producción y datos ficticios aislados:** seguir las filas de la spec, más M01–M03/F01–F05/P01. Registrar acciones, resultado, navegador/dispositivo y evidencia (PDF/captura/salida) sin subir la base familiar del usuario. La aceptación no puede reducirse a un subconjunto porque los tests pasen.
- [ ] **3. Inspeccionar red y privacidad mientras se ejercen los flujos:** solo descargas de recursos del origen/hosting; ningún nombre, nacimiento, nota, lote o historial en URL/cuerpo/cookies/logs ni caches del SW. Verificar ausencia de SDKs/endpoints de historial y de importación de la base en código de servidor. HTTPS y cabeceras funcionan en Vercel; no confundir peticiones técnicas del hosting con datos de historiales.
- [ ] **4. Completar README:** instalación con pnpm/lockfile, scripts y elección webpack por Serwist, pruebas, build, despliegue Next estándar en Vercel, sin variables secretas para usuarios, actualización de catálogo, fuentes/vigencia, límites médicos, migración/filas por revisar, respaldo no cifrado/restauración, pérdida de datos del navegador, instalación/offline y aceptación pendiente por dispositivo si aplica. No versionar `.next`, `node_modules`, backups reales o archivos de smoke temporales.
- [ ] **5. Documentar resultado y límites:** `docs/verification/mvp-acceptance.md` distingue ejecutado/pasa/falla/no comprobado para cada criterio y fuente clínica. Una regla sin verificación no se publica como válida. Si falta dispositivo o revisión clínica, declarar exactamente ese requisito pendiente; no declarar el MVP terminado.
- [ ] **6. Revisión final de alcance y cambios propios; commit:** `Task 13 : Implementation : record acceptance and deployment evidence`. Solo solicitar despliegue/publicación cuando todo requisito aplicable tenga evidencia y autorización.

## Matriz de cobertura del plan

| Requisito de la spec | Tareas responsables |
|---|---|
| Arquitectura y contratos; fechas civiles | T1, T2, T3, T7 |
| A01–A06: perfiles, selección y calendarios | T1–T5, T7 |
| A07–A08: combinadas y rotavirus | T2, T3, T5, T7 |
| A09–A10: aislamiento y persistencia | T4, T5, T7 |
| A11: carné/PDF | T7, T11 |
| A12: respaldo e importación | T4, T6, T8 |
| A13: eliminación | T5, T8 |
| A14: offline | T12 |
| A15: privacidad | T5–T12, T13 |
| A16: hidratación/almacenamiento cliente | T4, T5, T7 |
| A17: instalación | T12, T13 |
| H01/H02: catálogos 2026/histórico y conservación legada | T2, T3, T5, T10 |
| U01: navegación móvil y acciones sin superposición | T9, T11 |
| M01–M03: migración/integridad | T4, T6, T8 |
| F01/F02: fechas/progreso | T1, T3, T7, T10 |
| F03/F04: guardado/cambios no destructivos | T3, T5, T7, T10 |
| F05/P01: borrado y actualizaciones | T5, T8, T12 |
| Accesibilidad, información, fuentes, README | T2, T7, T9–T11, T13 |

## Fundamento técnico consultado durante la planificación

- Guías instaladas de Next: `node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md` y `static-exports.md`. La guía PWA recomienda Serwist para caché offline completa; las secciones de push del ejemplo no aplican a este producto.
- [Paquete publicado @serwist/next 9.5.13](https://registry.npmjs.org/@serwist%2Fnext/9.5.13): peer Next >=14; no certifica por sí mismo compatibilidad de ejecución.
- [Ejemplo webpack mantenido](https://github.com/serwist/serwist/tree/main/examples/next-basic), su [package.json](https://github.com/serwist/serwist/blob/main/examples/next-basic/package.json), [configuración](https://github.com/serwist/serwist/blob/main/examples/next-basic/next.config.mjs) y [worker](https://github.com/serwist/serwist/blob/main/examples/next-basic/app/sw.ts). No copiar `skipWaiting:true` ni caché amplia del ejemplo: contradicen los contratos aprobados de privacidad/actualización.
- [Integración webpack y opciones reales](https://github.com/serwist/serwist/blob/main/packages/next/src/index.ts): sustenta `register`, `reloadOnOnline`, `cacheOnNavigation` y selección explícita de webpack.
- [API del núcleo Serwist](https://github.com/serwist/serwist/blob/main/packages/core/src/Serwist.ts): confirma `registerCapture`, `createHandlerBoundToUrl`, `matchPrecache` y el mensaje `SKIP_WAITING`; el worker de T12 usa estos contratos sin caché dinámica amplia.
- Versiones publicadas consultadas de [Zod](https://registry.npmjs.org/zod/4.6.7) y [fake-indexeddb](https://registry.npmjs.org/fake-indexeddb/6.2.6). No se instalaron estos paquetes al escribir el plan.

## Revisión propia y puerta de ejecución

Revisión documental actualizada: T9 y T10 cubren U01/H01/H02, definen archivos, contratos, ciclos RED/GREEN y conservación de perfiles legados. T11–T13 mantienen impresión, PWA y aceptación. Las reglas de 2026 continúan usando MinSalud; los dos PDF aportados quedan trazados con su alcance real.

La ejecución nativa en `development`, un commit por tarea y el patrón de mensajes ya fueron aprobados. Esta enmienda concreta el cambio de producto seleccionado por el usuario, pero requiere su revisión antes de modificar código de producción. Ninguna tarea autoriza push, despliegue o publicación clínica.
