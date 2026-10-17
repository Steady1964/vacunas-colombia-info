# Vacunas Colombia — Especificación de corrección del MVP

- Estado: aprobada por el usuario en la conversación para redactar el plan; no autoriza implementación.
- Fecha: 2026-10-16.
- Base auditada: `Steady1964/vacunas-colombia-info`, branch `v0/vacunas-colombia-pwa`, HEAD `f37e5c3`.
- Propósito: definir el resultado y los contratos necesarios para redactar después el plan de implementación con `superpowers:writing-plans`.

## 1. Autoridad, alcance y evidencia

Esta especificación complementa `Vacunas_Colombia_PWA_Vercel_v2.md`; no reduce su MVP ni reemplaza sus 17 criterios de aceptación. Ante diferencias de contenido clínico entre el Excel y el Markdown, aplicar la jerarquía del documento original: lineamientos oficiales verificados, especificación vigente y Excel como referencia auxiliar. No inventar equivalencias para resolver discrepancias.

El Excel de referencia es `Esquema de Vacunacion Colombia - PAI, Vacunas Acelulares, Tarifas y Puntos de Atencion.xlsx`. Su copia en `data/` es idéntica en la auditoría. No copiar perfiles, fechas de nacimiento o aplicaciones de ejemplo a la base de datos de la familia.

La auditoría observó errores de cobertura por nombre, fechas tradicionales y compartidas incorrectas, fallo después de guardar aplicaciones, duplicación al reenviar, alta del segundo perfil equivocada, ausencia de cambio de esquema e importación y fallo offline. El código funcional no cambió entre `24d7c78` y la base auditada. La compilación anterior fue satisfactoria, pero no prueba cumplimiento funcional. El detalle de las observaciones proviene de la conversación de auditoría; este documento define los requisitos de corrección, no afirma que ya estén implementados.

**Objetivo:** una agenda y un carné familiar privado, útil para varios niños, con fechas orientativas fiables respecto del catálogo seleccionado y sin presentar registros ambiguos como requisitos cumplidos.

**Fuera de alcance:** cuentas, backend de historiales, sincronización, Firebase/MongoDB/Supabase, analítica, anuncios, push, OCR, imágenes del carné, chat médico, prescripción, cálculo clínico de rescate, adultos, precios, directorios de IPS, pagos y administración remota. No rediseñar por completo la estética ni añadir funciones no exigidas por el MVP.

## 2. Decisiones de diseño aprobadas

Las siguientes decisiones fueron propuestas por el asistente y aprobadas por el usuario junto con esta especificación:

1. Corregir la aplicación existente, manteniendo Next.js App Router, React, TypeScript, Tailwind, Dexie, date-fns y lucide-react; incorporar shadcn/ui para los controles requeridos.
2. Separar catálogos, fechas, resolución de cobertura, persistencia y respaldo. Mantener las rutas de `app/`; no reescribir el producto en otro framework.
3. Conservar la base IndexedDB `vacunas-colombia` y migrar sus registros. No exigir borrar los datos para estrenar la corrección.
4. Rechazar fechas futuras en nuevas aplicaciones o ediciones. Preservar, pero señalar para revisión, las fechas futuras ya existentes.
5. Entregar respaldo JSON sin cifrar con advertencia explícita, opción permitida por el documento original. El cifrado no es condición de este MVP y no se simula.
6. En combinación de respaldos, omitir duplicados idénticos por ID y rechazar atómicamente los conflictos de contenido. Ofrecer cancelar/conservar los datos locales o reemplazar el conjunto completo, con previsualización, copia previa ofrecida y confirmación explícita. No inferir que un mismo ID representa el mismo niño si sus datos difieren.
7. No conceder cobertura a registros históricos ambiguos ni a productos sin correspondencia verificada. Conservarlos en el carné con indicación de revisión.
8. No registrar hora de aplicación inexistente ni reconstruir números de dosis desde texto libre como si fueran certezas clínicas.

## 3. Invariantes de datos y seguridad

- Una aplicación física corresponde a un único evento persistido, incluso cuando cubre varios requisitos.
- Los requisitos se identifican por IDs estables, no por etiquetas de UI, fechas o posiciones de listas.
- Cambiar nacimiento, esquema o catálogo no modifica IDs, producto capturado, fecha real, marca, lote, IPS ni notas de los eventos históricos.
- La cobertura de un requisito depende de una correspondencia verificada de producto, dosis y etapa; no basta igualdad de nombres ni coincidencia de fechas.
- Una dosis no cumple automáticamente dosis posteriores. Dos eventos de rotavirus no cumplen una tercera dosis.
- Todas las consultas de historial y todas las mutaciones se limitan al perfil explícitamente identificado. No usar el perfil activo como sustituto de `childId` después de una operación asíncrona.
- Ninguna operación fallida deja un respaldo importado o una eliminación parcialmente aplicados.
- Los perfiles y aplicaciones nunca se transmiten al hosting ni se incluyen en URL, cookies, logs, telemetría o cachés del service worker.
- Las fechas de nacimiento y aplicación son fechas civiles `YYYY-MM-DD`, no instantes UTC.
- Las reglas incompletas o no verificadas producen una indicación de revisión, nunca una equivalencia clínica inventada.

## 4. Arquitectura y contratos de dominio

### 4.1 Separación de responsabilidades

Organización objetivo, siguiendo los módulos exigidos por la especificación original:

```text
app/                                      # Rutas y composición de páginas
src/components/                           # Formularios, vistas y controles shadcn/ui
src/data/catalog/primary-traditional-2-4-6.ts
src/data/catalog/primary-shortened-6-12-18-weeks-2026.ts
src/data/catalog/shared-requirements-co-2026-10.ts
src/data/catalog/products.ts
src/lib/schedule/calculateSchedule.ts
src/lib/schedule/resolveCoverage.ts
src/lib/db.ts
src/lib/backup.ts
public/                                   # Manifest e íconos; recursos públicos no sensibles
```

El plan debe alinear alias e imports con esta organización y retirar `lib/data.ts` y sus consumidores obsoletos al completar el reemplazo. No mantener dos motores de calendario o dos modelos en uso. El nombre de archivos auxiliares y la división final de componentes quedan al implementador.

### 4.2 Perfiles y aplicaciones

Adoptar los campos de `ChildProfile`, `VaccineAdministration` y `LocalPreference` de la sección 6 del documento original. En particular:

- Perfil: `id`, `nickname`, `birthDate`, `country: 'CO'`, `primaryScheduleId`, `referenceCatalogVersion`, `createdAt`, `updatedAt`.
- Aplicación: `id`, `childId`, `productId`, `productName`, `appliedDate`, `doseNumber?`, `milestoneId?`, `coveredRequirementIds`, `brand?`, `lot?`, `provider?`, `accessType`, `paiwebStatus`, `notes?`, `createdAt`, `updatedAt`.
- Los valores de esquema son `CO-PAI-PRIMARY-2-4-6` y `CO-PAI-PRIMARY-6-12-18-WEEKS-2026`. El catálogo compartido se versiona aparte, inicialmente `CO-PAI-SHARED-2026-10` una vez verificada su referencia.
- Incorporar un estado explícito de cobertura: verificada o por revisar, con motivo legible. El carné puede contener aplicaciones por revisar; esas aplicaciones no aportan cobertura automática.
- Permitir captura manual mediante una entrada de catálogo explícita de producto no identificado, sin componentes ni cobertura asumida; conservar el nombre ingresado en `productName`. No presentar esa entrada como un biológico validado. Resolver el producto real mediante edición confirmada.
- Cada requisito identifica vacuna/componente, número de dosis, cobertura PAI/particular/condicional y fuente. El esquema aporta su desplazamiento temporal, sin formar parte de la identidad de la aplicación.
- Cada producto tiene ID estable, nombres/marcas, componentes y correspondencias verificadas por dosis/etapa. El número de dosis de rotavirus pertenece al producto, no a una regla universal de la categoría.
- Cada fuente clínica registra URL, fecha de revisión y las reglas que respalda. Una etiqueta visual de año no sustituye esta información.

### 4.3 Estados derivados

`calculateSchedule` combina nacimiento, esquema primario, catálogo compartido y fecha civil de hoy. No consulta IndexedDB ni modifica aplicaciones.

`resolveCoverage` recibe aplicaciones del niño y reglas verificadas. Devuelve requisitos cubiertos y registros por revisar. Su salida cuenta cada ID de requisito una sola vez, aunque existan eventos repetidos. No modifica registros históricos por una actualización automática del catálogo.

Los requisitos muestran Aplicada, Próxima, Pendiente o Fecha pasada / por confirmar. Decisión propuesta: Próxima significa fecha orientativa entre hoy y los próximos 30 días inclusive; Pendiente es una fecha futura posterior a esa ventana; Fecha pasada / por confirmar es anterior a hoy y no cubierta. Las listas pueden mostrar también requisitos futuros posteriores, sin confundirlos con el contador de próximos 30 días. Una coincidencia dudosa se presenta como Por verificar con el vacunador, sin aprobarla por defecto.

## 5. Migración de la base existente

La versión actual de Dexie tiene tablas `profiles` y `doses`. El diseño de migración debe ser versionado, transaccional e idempotente al reabrir. No renombrar la base ni iniciar otra vacía para ocultar el problema.

### 5.1 Transformación de perfiles

- Preservar `id`, `birthDate` y `createdAt`; mapear `name` a `nickname`.
- Mapear únicamente los valores explícitos `traditional` y `shortened` a los IDs canónicos. Esto conserva una selección real ya realizada.
- Si no existe una selección reconocible, conservar el perfil en un estado de migración pendiente y pedir elección al usuario. Hasta resolverla, no generar su calendario ni asignar un modo por año de nacimiento. Ese estado es excepcional de migración; todo perfil creado o confirmado debe cumplir el contrato normal de `ChildProfile`.
- No alterar aplicaciones al asignar la referencia de catálogo del perfil. Una actualización posterior debe informar cambios de referencia y preservar la elección primaria.

### 5.2 Transformación de aplicaciones

- Preservar `id`, relación al perfil, fecha literal y todos los campos originales. Mapear `profileId` a `childId`, `vaccine` a `productName`, `date` a `appliedDate`, `point` a `provider` y conservar marca, lote, acceso y notas.
- Preservar la fila original de migración como metadatos locales exportables para los datos sin correspondencia directa, incluido el texto libre de `dose`. No eliminar información para ajustarse al nuevo modelo.
- Para el MVP, todas las aplicaciones heredadas parten con cobertura por revisar y `coveredRequirementIds: []`. La familia puede confirmar producto/dosis/etapa mediante edición; no convertir automáticamente texto libre en cobertura.
- Los campos de acceso o PAIWEB no documentados se representan como desconocidos. No inferirlos a partir de la marca o IPS.
- Las marcas de tiempo técnicas que no existían se identifican como generadas en la migración; no se presentan como hora original de captura o aplicación.
- No deduplicar automáticamente aplicaciones antiguas parecidas: el error de reenvío pudo generar duplicados, pero también puede haber eventos legítimos. Permitir corrección mediante edición/eliminación confirmada.
- Conservar registros con fechas inválidas/futuras o perfiles inexistentes en un estado explícito de revisión, sin conceder cobertura ni mezclarlos con otro niño. Deben poder exportarse y corregirse o eliminarse mediante acción consciente.

La representación interna de los metadatos y estados excepcionales queda al implementador, pero debe ser persistida, visible para revisión y cubierta por respaldo. Las tablas antiguas se retiran solo cuando la transacción haya preservado todos sus registros. Un fallo aborta la migración sin destruir la base anterior. La UI nunca ofrece un borrado automático como solución a un error de apertura.

## 6. Catálogo, fuentes y reglas de fechas

### 6.1 Contenido mínimo

- Ambos catálogos incluyen nacimiento con BCG y hepatitis B neonatal, influenza a 6/7 meses, SRP 1, varicela 1, neumococo de refuerzo y hepatitis A a 12 meses, y los refuerzos documentados a 18 meses y 5 años.
- **Esquema 2026:** serie primaria a 42/84/126 días civiles (6/12/18 semanas); fiebre amarilla a 9 meses; SRP 2 a 18 meses. Sus reglas clínicas continúan respaldadas por las fuentes MinSalud ya documentadas. El PDF de Salud Total aportado se registra como referencia secundaria de presentación, no reemplaza una fuente primaria cuando difiere de ella.
- **Esquema anterior a 2026:** catálogo histórico independiente `CO-PAI-EPS-SANITAS-UNDATED-ED2`, basado en «Esquema General de Vacunación PAI - EPS Sanitas», edición 2; la pieza no muestra fecha editorial verificable y `reviewedAt` registra únicamente cuándo se consultó. La serie primaria se programa a 2/4/6 meses calendario y fiebre amarilla a 18 meses. La triple viral indicada a 18 meses se representa como SRP 2. Las recomendaciones adicionales para 2–5 y 5–14 años permanecen como notas condicionales, no como requisitos universales fechados.
- Cada referencia conserva IDs estables para requisitos equivalentes, pero sus proyecciones y fuentes pertenecen a su catálogo. Cambiar referencia recalcula solo el calendario derivado y nunca reescribe aplicaciones, IDs, fechas reales, marcas, lotes, IPS ni procedencia.
- Un perfil ya guardado con la combinación 2/4/6 y el catálogo compartido 2026 conserva esa combinación como referencia legada hasta que la persona confirme el cambio al catálogo histórico. No se reinterpreta silenciosamente ni se vuelve seleccionable para perfiles nuevos.
- Complementarias: búsqueda y captura de hexavalentes, meningococo y rotavirus de dos/tres dosis, sin hacerlas obligatorias para todos los perfiles. Una regla o equivalencia no respaldada por el catálogo seleccionado queda por revisar y no concede cobertura.

Las fuentes oficiales iniciales son las URLs de la sección 4.4 del documento original. La auditoría no verificó su vigencia clínica externa. El implementador debe revisar las reglas concretas, su fecha y aplicabilidad antes de codificarlas como verificadas. Una composición o equivalencia sin respaldo no produce cobertura automática. No afirmar cobertura pública universal de la hexavalente.

El catálogo debe distinguir la dosis cero de sarampión de SRP 1/SRP 2 y explicar su carácter adicional cuando se muestre; no generar esa indicación temporal para todos los niños. No codificar recuperación clínica, intervalos mínimos o intercambiabilidad a partir de aproximaciones aritméticas.

Para rotavirus, los dos requisitos de referencia no se convierten en tres para todos los perfiles. El tercer requisito particular solo pertenece a un curso de producto verificado de tres dosis, identificable en el registro/detalle del producto. Después de dos eventos sigue sin cumplir. Si su programación o límites de edad no están verificados, mostrar fecha por confirmar con el vacunador, sin proponer rescate ni incluirlo en el denominador de requisitos fechados.

### 6.2 Aritmética civil

- Analizar y validar fechas civiles en el navegador; no construirlas mediante parseo implícito UTC ni serializar con `toISOString().slice(0, 10)`.
- Meses y años: date-fns con ajuste al último día existente; no 30 días por mes ni 365 días por año.
- Esquema anterior a 2026: sumar 2, 4 y 6 meses calendario desde nacimiento.
- Esquema 2026: sumar exactamente 42, 84 y 126 días civiles. Mostrar 6/12/18 semanas y las etiquetas comunicacionales 1,5/3/4,5 meses.
- Los demás hitos usan meses/años calendario y pertenecen al catálogo seleccionado; no se comparten implícitamente entre referencias.
- Obtener hoy en el navegador, actualizarlo al volver a primer plano y al cruzar medianoche mientras la app esté abierta. No congelar hoy al importar un módulo.
- Una aplicación tardía no desplaza automáticamente futuras dosis ni crea un esquema de rescate.
- Rechazar fechas civiles inexistentes y nacimientos futuros. Validar nuevas aplicaciones dentro de nacimiento y hoy, ambos inclusive; un registro heredado incoherente se conserva para revisión.

### 6.3 Casos de referencia deterministas

| Nacimiento | Referencia | Resultado esperado |
|---|---|---|
| 2026-01-31 | Esquema 2026: 42/84/126 días | 2026-03-14 / 2026-04-25 / 2026-06-06 |
| 2026-01-31 | Esquema anterior a 2026: 2/4/6 meses | 2026-03-31 / 2026-05-31 / 2026-07-31 |
| 2026-01-31 | Influenza de ambos catálogos: 6/7 meses | 2026-07-31 / 2026-08-31 |
| 2026-01-31 | Fiebre amarilla, Esquema 2026: 9 meses | 2026-10-31 |
| 2026-01-31 | Fiebre amarilla, Esquema anterior a 2026: 18 meses | 2027-07-31 |
| 2026-01-31 | Otros refuerzos de 18 meses | 2027-07-31 |
| 2024-02-29 | 12 meses / 5 años | 2025-02-28 / 2029-02-28 |
| 2026-01-31 | Un mes, límite aritmético | 2026-02-28 |

La fecha civil resultante debe ser la misma bajo America/Bogota, una zona con horario de verano y Pacific/Kiritimati. Estos casos prueban aritmética; no validan indicaciones médicas individuales.

## 7. Flujos de familia, calendario y aplicaciones

### 7.1 Primer uso y perfiles

- Abrir sin ejemplos persistidos; mostrar bienvenida, aviso de almacenamiento local y formulario mínimo.
- Apodo, nacimiento y referencia de esquema requieren entrada consciente; no preseleccionar ni inferir la referencia.
- Mostrar **Esquema 2026 · 6, 12 y 18 semanas** y **Esquema anterior a 2026 · 2, 4 y 6 meses**. Explicar fuente, vigencia y que ninguna opción constituye una orden médica universal.
- Crear varios perfiles desde Ajustes mediante un formulario distinto del registro de vacunas. Cambiar perfil activo y recordar su ID como preferencia local; si se elimina, seleccionar otro existente o volver al inicio vacío.
- Editar apodo/nacimiento/esquema. Cambiar esquema exige la confirmación literal del documento original; cancelar no persiste nada.
- El selector del Calendario y el de Ajustes operan sobre el mismo perfil persistido; Inicio refleja el resultado confirmado.
- Una fecha de nacimiento editada que contradiga aplicaciones existentes no las reescribe: informar y marcarlas para revisión.

### 7.2 Calendario y dashboard

- Calendario con filtros PAI, Complementarias y Todas; detalle de enfermedad, dosis, cobertura, fuente y vigencia por requisito.
- Mostrar referencia elegida, versión del catálogo y, para perfiles legados 2/4/6 con catálogo 2026, un estado explícito que exige confirmación antes de adoptar el catálogo histórico.
- Dashboard con edad en años/meses/días o meses/días, siguiente fecha orientativa y todas las vacunas no cubiertas de esa fecha, contadores y próximas fechas ordenadas.
- No retirar todo un hito al registrar una sola vacuna: cada requisito conserva su estado independiente.
- Progreso: `requisitos cubiertos con fecha orientativa <= hoy / requisitos con fecha orientativa <= hoy × 100`. Excluir complementarias no elegidas y requisitos sin fecha confirmada. Un requisito cuenta una vez. Si el denominador es cero, mostrar Sin requisitos programados hasta hoy, no 100 % de protección.
- Los contadores representan requisitos, no eventos físicos ni hitos completos. El carné puede mostrar el conteo de administraciones por separado, claramente rotulado.
- Un mismo producto puede cubrir varios requisitos con un solo evento; no sumar de nuevo un requisito por duplicados del historial.

### 7.3 Registro, edición y eliminación

- Formulario con producto o captura manual identificada, dosis/etapa cuando se conozca y fecha real; marca, lote, IPS, acceso, PAIWEB y observaciones opcionales.
- Permitir guardar información incompleta clínicamente como evento por revisar, sin inventar correspondencias. La falta de dosis identificable no debe obligar a ingresar un texto falso para guardar un registro real.
- Capturar los valores y referencia al formulario antes de esperar operaciones asíncronas.
- Bloquear envíos mientras se guarda; una acción de envío conserva un ID estable. Tras éxito, refrescar las vistas desde datos persistidos y cerrar/limpiar el formulario. Ante fallo, conservar los campos y mostrar un mensaje sin datos privados.
- Volver a pulsar, enviar con Enter o reintentar la misma acción en curso no crea otro ID. Esto no implica detectar automáticamente toda aplicación parecida.
- Edición conserva el ID y solo cambia los campos confirmados; recalcula cobertura si cambian producto/dosis/etapa y actualiza las vistas.
- Eliminación de aplicación requiere confirmación. Eliminar perfil y sus aplicaciones utiliza una única transacción local y ofrece copia antes de confirmar.
- Borrar todos los datos requiere dos confirmaciones diferenciadas y oferta de respaldo. No borrar cachés de aplicación como sustituto de borrar IndexedDB.

## 8. Carné, impresión e información

- Carné del perfil activo con eventos reales, más recientes primero y opción de invertir orden. No insertar requisitos futuros en la tabla de aplicaciones.
- Mostrar producto, dosis conocida o Por verificar, fecha real, marca, lote e IPS cuando existan. Señalar eventos heredados inválidos o por revisar sin tratarlos como cobertura validada.
- Impresión A4 local mediante `window.print()` y CSS: apodo, nacimiento, tabla completa, fecha civil de exportación y leyenda literal de registro no oficial. Ocultar navegación, acciones, formularios y cabecera promocional; permitir saltos de página legibles.
- Información local sobre PAI/particulares, combinadas y variación por fabricante/edad, con fuentes y fecha de revisión. Sin recomendaciones farmacológicas, porcentajes comerciales ni promesas absolutas de equivalencia.

## 9. Exportación e importación local

- Nuevo respaldo con `formatVersion: 2`, fecha técnica de exportación, perfiles, aplicaciones, preferencias portables y metadatos de migración necesarios para no perder datos. No exportar cachés, permisos, contraseñas ni estado transitorio de formularios.
- Exportar el conjunto familiar completo, no solo el perfil activo. Advertir que el archivo no está cifrado y contiene información privada. Liberar URLs de Blob cuando ya no sean necesarias.
- Leer el archivo íntegramente en el navegador. Validar estructura, versión, tipos, enums, unicidad de IDs y relaciones perfil/aplicación antes de escribir.
- Versiones nuevas desconocidas o datos nuevos inválidos: rechazar sin mutaciones. Las excepciones de migración se aceptan únicamente dentro de una estructura explícita de registros por revisar, no como datos normales válidos.
- Admitir el formato existente `{version: 1, profiles, doses}` mediante la misma transformación segura de la migración local. No exigir editar un respaldo manualmente ni inventar correspondencias para importarlo.
- Previsualizar cantidades, perfiles afectados, registros por revisar y conflictos. La importación no sucede al seleccionar el archivo.
- Combinar: conservar IDs, añadir registros nuevos, omitir registros idénticos por ID y abortar toda la combinación ante el mismo ID con contenido diferente. Las preferencias no clínicas no deben convertir una copia familiar idéntica en un conflicto clínico; permitir conservar las preferencias locales.
- La igualdad por ID se evalúa sobre una representación normalizada determinista de los datos persistidos y su procedencia. Ignorar la fecha de exportación y timestamps técnicos generados exclusivamente por cada intento de importación/migración; no ignorar nacimiento, esquema, producto, dosis, fecha real, relación al perfil, cobertura confirmada ni campos capturados por la familia. Importar repetidamente un respaldo v1 sin cambios debe ser idempotente y no degradar una aplicación que ya fue revisada localmente: si esa revisión produce una diferencia real, informar conflicto y conservar el estado actual hasta una decisión explícita.
- Reemplazar: sustituir el conjunto familiar en una transacción solo después de previsualizar, ofrecer exportar el estado actual y confirmar la pérdida del conjunto previo.
- Cancelar, cerrar o fallar la lectura/validación/transacción deja el estado anterior intacto. Actualizar el perfil activo solo después de confirmar la transacción.

## 10. PWA, privacidad y despliegue

- Manifest enlazado desde el documento con `name: Vacunas Colombia`, `short_name: Vacunas CO`, `display: standalone`, `start_url`, colores e íconos reales 192/512; incluir soporte de ícono de pantalla de inicio iOS.
- Service worker compatible con Next.js instalado: precache del shell, código, estilos, catálogo e íconos y respuesta offline de respaldo. No cachear perfiles, eventos, respaldos ni HTML generado con datos de la familia.
- El plan debe elegir y demostrar una integración mantenida compatible con Next.js 16.4.2. Serwist es candidato del documento original, no una compatibilidad asumida en esta propuesta.
- Offline tras carga completa: crear/editar perfiles, registrar/editar aplicaciones, consultar calendario/carné, imprimir y exportar/importar archivos locales. La primera visita sin descarga previa no promete funcionamiento offline.
- Explicar instalación en Safari iOS. Android ofrece botón nativo solo al recibir `beforeinstallprompt`; en otros casos mostrar instrucciones válidas.
- Actualizaciones: no borrar IndexedDB; no forzar recarga durante un formulario con cambios sin guardar. Informar actualización disponible y activarla en un momento confirmado por el usuario.
- Pedir `navigator.storage.persist()` cuando esté soportado, tras una acción consciente del usuario; rechazo o ausencia de soporte no bloquean el uso. Explicar que no garantiza permanencia.
- Inicializar el acceso a Dexie y APIs del navegador solo del lado cliente, después de hidratación. Mostrar estado de carga separado de la bienvenida vacía; manejar errores de almacenamiento sin resetear datos.
- Privacidad en español: almacenamiento local, eliminación, respaldos no cifrados, riesgo de pérdida y datos técnicos que puede procesar el hosting. No afirmar anonimización o ausencia absoluta de tratamiento técnico.
- Sin llamadas con datos infantiles, SDK de analítica, mapas, fuentes remotas innecesarias o HTML sin escapar a partir de notas. Mantener cabeceras de seguridad apropiadas al alojamiento.
- Desplegar desde fuentes en Vercel con `pnpm-lock.yaml`; no versionar `.next/`, `node_modules/`, `.vercel/`, archivos locales de entorno ni compilados. No introducir endpoints o server actions para el historial.

## 11. Interfaz y accesibilidad

Conservar la identidad visual ligera existente y español de Colombia. Navegación inferior móvil con Inicio, Calendario, Carné, Información y Ajustes. No ampliar esto a un rediseño visual completo.

Controles shadcn/ui o controles accesibles coherentes con el stack, etiquetas asociadas, nombres accesibles, teclado, foco visible, contraste, estados con texto además de color y objetivos táctiles adecuados. Los diálogos devuelven el foco al cerrarse; formularios y errores son utilizables en iPhone, Android y escritorio.

En móvil, la aplicación reserva zonas distintas para cabecera, contenido desplazable y navegación inferior: la navegación no cubre tarjetas, tablas ni acciones. A 480 px o menos, los grupos `.actions` se presentan en una sola columna con botones de ancho completo y altura táctil mínima de 44 px; no se permite que el largo del texto decida de forma accidental si dos acciones quedan en una o dos filas. Impresión restablece el flujo normal y no hereda límites de altura o scroll de la carcasa móvil.

## 12. Trazabilidad de aceptación

Los siguientes IDs conservan la numeración del documento original. La tabla define evidencia a obtener durante implementación; no son resultados ya aprobados.

| ID | Resultado obligatorio | Evidencia de aceptación |
|---|---|---|
| A01 | Primer uso vacío con apodo, nacimiento y esquema sin preselección | Navegador con almacenamiento limpio; sin perfiles de ejemplo |
| A02 | Luna 2026-01-31 con Esquema 2026 | Fechas 42/84/126 exactas, etiqueta 2026 y catálogo 2026; sin registro de cuenta |
| A03 | Conmutación entre Esquema 2026 y Esquema anterior a 2026 | Confirmar/cancelar y comprobar fechas, catálogo seleccionado, persistencia y sincronización de vistas |
| A04 | Conmutación conserva aplicaciones | Comparar ID, fecha real, producto, marca, lote e IPS antes/después; sin eventos extra ni promociones automáticas de cobertura |
| A05 | Dos perfiles con referencias diferentes | Alta real de ambos y reapertura; cada esquema, catálogo y perfil activo persisten |
| A06 | Hitos propios de cada catálogo | Fiebre amarilla a 9 meses en 2026 y a 18 meses en el histórico; SRP 2 a 18; sin requisitos condicionales convertidos en universales |
| A07 | Hexavalente sin doble administración | Un evento, cobertura válida de requisitos de una única etapa, sin cubrir etapas posteriores |
| A08 | Rotavirus de tres dosis | Dos eventos no cumplen la tercera; producto de dos dosis no recibe tercera universal |
| A09 | Aislamiento entre perfiles | Cambiar, editar y eliminar en uno no mezcla ni modifica el historial del otro |
| A10 | Persistencia | Recarga y cierre/reapertura del navegador/PWA conservan perfiles, aplicaciones y selección |
| A11 | PDF familiar | Solo eventos, fechas reales, campos informados y leyenda no oficial; A4 legible de varias páginas |
| A12 | Ida y vuelta de respaldo | Restaurar todos los datos; importación repetida sin duplicados; conflicto/cancelación/fallo sin sobrescritura silenciosa |
| A13 | Eliminación de perfil | Confirmación y oferta de copia; borrado atómico de sus aplicaciones, sin afectar otros niños |
| A14 | Offline | Con producción precargada y red desactivada: abrir/recargar y ejercer funciones centrales reales |
| A15 | Privacidad de red | Inspeccionar Network y dependencias en producción durante los flujos; ningún dato familiar enviado |
| A16 | Hidratación y APIs cliente | Inicio limpio y con datos, recarga y fallo de IndexedDB sin errores de hidratación ni reseteos |
| A17 | Instalación | Manifest/íconos válidos; instalación e instrucciones comprobadas en iOS/Android, sin botón Android inoperante |

Aceptación adicional de correcciones y límites:

- M01: migrar una base v1 real de prueba preserva todos los IDs, fechas, campos y filas por revisar; abrir de nuevo no repite migración ni duplica eventos.
- M02: un perfil legado sin esquema requiere elección; una aplicación no identificada no concede cobertura; el respaldo conserva ambos estados.
- M03: fallo de migración o importación mantiene íntegros los datos anteriores. Nunca sugerir borrado automático para continuar.
- F01: fechas de 29/30/31, bisiestos, cambios de mes/año y zonas horarias; diferencia exacta entre meses calendario y 42/84/126 días.
- F02: una sola vacuna no completa un hito multivacuna; progreso/contadores cuentan requisitos únicos y respetan hoy, ventana de 30 días y denominador cero.
- F03: reenviar con clic/Enter durante el guardado no duplica; error de escritura conserva formulario; una fecha futura nueva se rechaza sin guardar.
- F04: editar nacimiento o actualizar catálogo preserva eventos históricos y no convierte dudas en cobertura automática.
- F05: eliminar una aplicación o borrar todos los datos respeta confirmaciones, oferta de copia y atomicidad aplicables.
- P01: cambiar la versión del service worker y del catálogo no borra datos ni provoca una recarga destructiva de formularios.
- H01: un perfil nuevo solo ofrece las dos referencias aprobadas; el histórico calcula 2/4/6 meses y fiebre amarilla a 18 meses, mientras 2026 calcula 42/84/126 días y fiebre amarilla a 9 meses.
- H02: un perfil legado 2/4/6 con catálogo 2026 conserva exactamente su calendario y aplicaciones hasta una confirmación explícita; cancelar no cambia ningún campo persistido.
- U01: en 390 × 844 px la cabecera y navegación permanecen utilizables sin cubrir el área desplazable; todos los grupos de acciones estrechos forman una sola columna de controles de al menos 44 px.

## 13. Verificación y documentación requeridas

Vitest debe cubrir contratos de comportamiento del motor de fechas, cobertura, progreso, migración y respaldo, especialmente límites e invariantes anteriores. Las pruebas deben ejercer las entradas utilizadas por el calendario real; no basta probar una rama de `estimate()` que el esquema nunca invoca. Evitar pruebas que solo comparan texto fuente, wiring o mocks que repiten sus entradas.

Además de pruebas unitarias, ejecutar la aplicación de producción y comprobar los recorridos A01–A17. Usar datos ficticios aislados. Registrar qué se comprobó en Chromium móvil/escritorio y qué en Safari/iOS y Android reales; no afirmar instalación o compatibilidad física basándose solo en emulación. Si falta un dispositivo, informar el límite y mantener pendiente su aceptación específica.

El README debe documentar instalación con lockfile, desarrollo, pruebas, build, despliegue en Vercel, estrategia offline/actualizaciones, límites médicos, fuentes/versionado y manejo de respaldo/migración. No versionar artefactos de compilación ni datos familiares usados en comprobaciones.

La publicación requiere revisión de vigencia de las reglas clínicas que se presenten como verificadas. La ausencia de una equivalencia solo permite captura por revisar; no justifica fingir que la regla fue verificada.

## 14. Criterio de cierre y decisiones dejadas al plan

El MVP se acepta cuando cumple el documento original, todos los escenarios aplicables anteriores y los entregables, con evidencia de comportamiento. Compilar, tener pantallas o pasar dos pruebas auxiliares no equivale a terminar.

El plan debe concretar la integración PWA compatible, el esquema/migración física de Dexie, los tipos de registros pendientes, la validación de respaldos, la distribución de componentes, las dependencias mínimas y el desglose de implementación. Esas decisiones no pueden cambiar el alcance, descartar registros ni debilitar los contratos definidos aquí.

Las decisiones técnicas de conservar datos, rechazar fechas futuras, mantener JSON explícitamente no cifrado y bloquear combinaciones conflictivas quedaron aprobadas conjuntamente con esta especificación. El plan debe respetarlas.

**Puerta de aprobación:** la especificación está aprobada para redactar el plan con `superpowers:writing-plans`. Revisar el plan y elegir el método de ejecución antes de implementar. Esta aprobación no afirma validación clínica de las referencias.
