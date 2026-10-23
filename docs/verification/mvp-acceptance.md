# Verificación de aceptación del MVP

**Fecha de ejecución:** 17 de octubre de 2026

**Rama:** `development`

**Aplicación:** build de producción de Next.js 16.4.2 servido con `pnpm start`

**Datos:** perfiles ficticios `Luna` y `Sol`; no se usó una base familiar real.

## Cómo leer este documento

- **Pasa (ejecutado):** se ejerció el comportamiento indicado y se observó el resultado obligatorio.
- **Falla (ejecutado):** se ejerció y el resultado no cumplió. No quedan filas con este estado.
- **No comprobado:** falta el entorno, dispositivo o autoridad necesarios; no equivale a aprobación.

La suite automatizada demuestra contratos de software, no vigencia ni pertinencia clínica. Los recorridos locales de navegador se ejecutaron en Chromium 150 administrado, con viewport móvil 390 × 844 y escritorio. Safari/iOS y Chrome/Android se emularon únicamente para instrucciones y user agent; no hubo dispositivo físico. La comprobación posterior del deployment facilitado por el usuario se registra por separado abajo y no modifica los resultados locales.

## Comprobaciones reproducibles

| Comprobación | Resultado observado |
|---|---|
| `pnpm install --frozen-lockfile` | Pasa; lockfile vigente, sin resolución adicional. |
| `pnpm test` | Pasa; 11 archivos y 91 pruebas después de las regresiones de respaldo, edición y catálogo descritas abajo. |
| `TZ=America/Bogota pnpm exec vitest run src/lib/civilDate.test.ts` | Pasa; 16/16. |
| `TZ=America/New_York pnpm exec vitest run src/lib/civilDate.test.ts` | Pasa; 16/16, incluidos días locales de 23 y 25 horas. |
| `TZ=Pacific/Kiritimati pnpm exec vitest run src/lib/civilDate.test.ts` | Pasa; 16/16. |
| `pnpm build` | Pasa con Next.js 16.4.2 y webpack; `/`, `/_not-found`, `/icon.svg` y `/offline` se prerenderizaron. Serwist generó `/sw.js`. |
| Producción local | Pasa en `127.0.0.1`; worker activo/controlador, manifiesto enlazado y cero errores de consola en el smoke final. |
| Fechas + `calculateSchedule.test.ts` + `summarizeSchedule.test.ts` en cada una de las tres zonas anteriores | Pasa; 3 archivos y 22/22 pruebas en Bogotá, Nueva York y Kiritimati. |

La advertencia de Serwist sobre registro automático es esperada: `register: false` evita un segundo registro y `PwaManager` registra el worker de forma explícita para controlar instalación y actualización. Next también informó un `package-lock.json` externo al repositorio; no forma parte de este proyecto ni del despliegue con `pnpm-lock.yaml`.

## A01–A17

| ID | Estado | Evidencia observada |
|---|---|---|
| A01 | **Pasa (ejecutado)** | Origen limpio: bienvenida sin perfiles demo ni cuenta. El formulario exigió apodo, nacimiento y referencia sin preselección antes de crear `Luna`. |
| A02 | **Pasa (ejecutado)** | `Luna`, nacimiento `2026-01-31`, Esquema 2026: calendario mostró `2026-03-14`, `2026-04-25` y `2026-06-06` para 42/84/126 días, catálogo `CO-PAI-SHARED-2026-10`. |
| A03 | **Pasa (ejecutado)** | Desde Calendario se eligió Esquema anterior a 2026. Cancelar conservó la pareja 2026; confirmar guardó `CO-PAI-PRIMARY-2-4-6` + `CO-PAI-EPS-SANITAS-UNDATED-ED2`. Fechas: `2026-03-31`, `2026-05-31`, `2026-07-31`. |
| A04 | **Pasa (ejecutado)** | Antes, después de cancelar y después de confirmar se comparó la administración completa en IndexedDB. ID, fecha `2026-03-14`, producto, marca `Hexaxim`, lote `LOTE-A01`, IPS, notas, timestamps y snapshot de cobertura permanecieron byte por byte iguales; no aparecieron eventos adicionales. |
| A05 | **Pasa (ejecutado)** | Se creó `Sol` con Esquema 2026 y `Luna` con el histórico. Tras recargar: dos perfiles, sus parejas catálogo/serie correctas y `Sol` activo persistieron. |
| A06 | **Pasa (ejecutado)** | 2026 mostró fiebre amarilla a 9 meses y SRP segunda dosis a 18 meses. El histórico mostró fiebre amarilla a 18 meses. La dosis cero permaneció como referencia condicional, no requisito universal. |
| A07 | **Pasa (ejecutado)** | Una aplicación física de hexavalente, dosis 1/`primary-1`, cubrió exactamente pentavalente 1 e IPV 1. Pentavalente 2 permaneció pendiente; el carné contó un solo evento. |
| A08 | **Pasa (ejecutado)** | Dos aplicaciones RotaTeq cubrieron rotavirus 1 y 2. Al habilitar su referencia opcional, `RotaTeq — tercera dosis del curso particular` permaneció “Por verificar con el vacunador”. Rotarix no recibió tercera dosis universal. |
| A09 | **Pasa (ejecutado)** | Carné de `Luna`: solo su hexavalente. Carné de `Sol`: solo sus dos RotaTeq. Eliminar `Sol` retiró sus dos eventos y conservó intacto el evento de `Luna`. |
| A10 | **Pasa (ejecutado)** | Recarga y reapertura conservaron dos perfiles, tres aplicaciones y selección activa en IndexedDB v30. |
| A11 | **Pasa (ejecutado)** | Un carné ficticio de 24 eventos produjo PDF A4 de 5 páginas. Primera y última página conservaron cabecera, apodo, nacimiento, fecha de exportación, leyenda no oficial, encabezados repetidos y todos los campos reales; no incluyeron navegación, acciones ni proyecciones pendientes. |
| A12 | **Pasa (ejecutado)** | Exportación v2 de dos perfiles/tres aplicaciones; autoimportación identificó 2 perfiles y 3 eventos idénticos y no duplicó. Un archivo con mismo ID y apodo distinto produjo conflicto, deshabilitó Combinar y Cancelar dejó 2/3 intactos. Reemplazo restauró 2/3 tras borrar un perfil. |
| A13 | **Pasa (ejecutado)** | Diálogo identificó `Sol`, explicó borrado atómico y ofreció copia. Confirmar dejó solo `Luna` y su hexavalente; después se restauró el respaldo completo. |
| A14 | **Pasa (ejecutado)** | Con servidor detenido y worker controlador: ruta no precargada mostró `/offline`; `/` abrió shell completo y conservó perfil/calendario/carné. Offline se creó/editó perfil, creó/editó evento, imprimió PDF y exportó/previsualizó/combinó respaldo. |
| A15 | **Pasa (ejecutado)** | Durante altas, cambios, respaldo y borrado hubo 18 solicitudes HTTP, todas `GET` al origen `127.0.0.1:3123`, sin cuerpo ni cookie. Ninguna URL incluyó apodo, nacimiento, lote, IPS o nota. Cache Storage tuvo 28 recursos estáticos y cero coincidencias de datos ficticios; no hubo local/session storage. |
| A16 | **Pasa (ejecutado)** | Inicio limpio y con datos, recarga y actualización no produjeron errores de hidratación. IndexedDB denegada/no disponible mostró estado de error sin crear familia alternativa ni resetear; los tests de migración verifican rollback. |
| A17 | **No comprobado en dispositivo físico** | Manifiesto, PNG 192/512, apple touch icon, nombre y `display: standalone` pasan en Chromium. Se ejerció `beforeinstallprompt` diferido y se observaron instrucciones con UA iOS/Android. Falta instalar/abrir mediante HTTPS en Safari/iOS y Chrome/Android físicos; A17 no está aceptado por completo. |

### Defecto encontrado durante A12

El respaldo exportado después de cambiar el perfil de 2026 al histórico era rechazado al autoimportarlo con `invalid-coverage`: la aplicación física conservaba correctamente su snapshot 2026, pero el importador lo comparaba solo con el catálogo actual del perfil. Se añadió una regresión que falla antes del cambio. El importador ahora acepta el snapshot únicamente cuando coincide exactamente con una regla verificada de otro catálogo local conocido; el motor de calendario sigue decidiendo por separado si ese evento cubre la referencia actual. Un snapshot inventado continúa rechazado o degradado a revisión. La prueba focal y las 24 pruebas de respaldo pasan.

### Correcciones de la revisión independiente

- **Edición administrativa tras cambiar referencia:** la regresión falló porque editar lote/IPS/notas de una hexavalente 2026 bajo el perfil histórico reducía `['penta-1', 'ipv-1']` a `['penta-1']`. El repositorio conserva el snapshot verificado cuando producto, marca, dosis y etapa no cambian; una selección distinta se recalcula. En producción se editó el lote bajo la referencia histórica y luego se volvió a 2026: el snapshot mantuvo ambos requisitos e IPV 1 volvió a mostrarse aplicada.
- **Reparación con destino de otra referencia:** con `Sol` activo en 2026 y `Luna` histórica como destino, guardar falló y conservó el formulario. Se corrigieron contexto y previsualización para resolver el catálogo del niño destino, no del activo. El smoke posterior reparó ambas direcciones: fiebre amarilla a 18 meses para el destino histórico y hexavalente con penta/IPV 1 para el destino 2026; solo se eliminaron las incidencias resueltas.
- **Fiebre amarilla histórica:** la regresión falló al registrar la etapa real de su calendario (`month-18`); la regla aún copiaba `month-9` desde 2026. La regla histórica ahora usa `month-18` y la fuente EPS Sanitas. La prueba rechaza la etapa opuesta en cada catálogo y el flujo de reparación guardó `yellow-fever` con cobertura en la etapa histórica correcta.

Estos últimos recorridos usaron otra familia ficticia aislada, con nacimiento `2025-01-31` para permitir una aplicación pasada a 18 meses. No modifican la evidencia de fechas A02/A03 de la familia original.

La variante de marca opcional ausente también falló antes de normalizar `undefined` y cadena vacía como la misma ausencia de identificación; las 15 pruebas de repositorio pasan. La segunda revisión independiente examinó las correcciones y no dejó hallazgos bloqueantes para el commit de Task 13.

## Correcciones M/F/P/H/U

| ID | Estado | Evidencia |
|---|---|---|
| M01 | **Pasa (ejecutado)** | Base v1 real de prueba: IDs/campos preservados, huérfanos e incoherencias conservados para revisión; segunda apertura sin duplicación. |
| M02 | **Pasa (ejecutado)** | Perfil legado sin esquema exige elección; producto no identificado no cubre; ambos estados sobreviven al respaldo. |
| M03 | **Pasa (ejecutado)** | Pruebas de fallo de migración/importación verifican rollback completo. La UI no propone borrar para recuperarse. |
| F01 | **Pasa (ejecutado)** | 16 pruebas en cada una de tres zonas: 29/30/31, bisiestos, mes/año, 42/84/126 días y DST 23/25 h. |
| F02 | **Pasa (ejecutado)** | Resúmenes cuentan requisitos únicos, hito multivacuna, hoy, ventana inclusiva de 30 días y denominador cero. A07 confirmó el flujo real. |
| F03 | **Pasa (ejecutado)** | Suite verifica idempotencia por command ID, error de escritura con formulario conservado y rechazo de fecha futura; UI mostró error accionable sin guardar. |
| F04 | **Pasa (ejecutado)** | Editar nacimiento y cambiar catálogo conserva eventos; contradicciones quedan por revisar y no se promueven automáticamente. |
| F05 | **Pasa (ejecutado)** | Eliminación de evento/perfil/familia exige confirmación y ofrece copia según alcance; transacciones y rollback cubiertos. A13 confirmó perfil + eventos. |
| P01 | **Pasa (ejecutado)** | Segundo build cambió `sw.js`: worker quedó en espera; cancelar conservó documento/formulario. Confirmar recargó solo la pestaña solicitante; otra pestaña mantuvo su campo sin guardar e IndexedDB intacta. |
| H01 | **Pasa (ejecutado)** | Alta ofrece solo 2026 e histórico; 42/84/126 días + FA 9 meses frente a 2/4/6 meses + FA 18 meses. |
| H02 | **Pasa (ejecutado)** | Referencia legada solo aparece en perfil existente, no en alta. Cancelar no cambia la pareja ni eventos; confirmar explícito preserva eventos. |
| U01 | **Pasa (ejecutado)** | 390 × 844: grid de cabecera/contenido/nav sin superposición, contenido con scroll propio y acciones estrechas en una columna; objetivos medidos en 44 px o más. |

## Red, almacenamiento y superficie de servidor

- No existen `app/**/route.*`, `pages/api`, Server Actions ni imports de Firebase, Supabase, MongoDB, analítica, publicidad o tracking.
- El único `fetch()` de la aplicación está en el service worker y resuelve navegaciones del mismo origen antes de usar `/offline`.
- `Cache Storage`: un precache Serwist de 28 URLs del shell; sin `blob:`, `data:`, respaldos ni contenido familiar.
- Datos familiares: exclusivamente IndexedDB `vacunas-colombia`; cookies, `localStorage` y `sessionStorage` vacíos en el recorrido.
- `/sw.js`: JavaScript, `no-cache, no-store, must-revalidate`, alcance `/`, CSP del worker. Cabeceras globales: `nosniff`, `DENY`, referrer estricto y permisos de cámara/micrófono/geolocalización desactivados.
- El acceso HTTPS al deployment real se comprobó el 18/10/2026, pero Vercel Authentication impidió cargar la aplicación. Las cabeceras de la aplicación, su PWA y sus flujos desplegados permanecen **no comprobados**; las cabeceras de autenticación de Vercel no las sustituyen.

## Comprobación del deployment Vercel — 18/10/2026

URL proporcionada por el usuario: [deployment de Vacunas Colombia](https://vacunas-colombia-info-8l73fpn0v-steady1964s-projects.vercel.app).

| Comprobación ejecutada | Resultado observado | Alcance |
|---|---|---|
| HTTPS con `curl`, sin omitir validación TLS | Respuesta HTTP/2 y `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` | El endpoint de Vercel responde por HTTPS; no demuestra que la aplicación esté accesible. |
| `/` | HTTP 302 hacia `https://vercel.com/sso-api` | Acceso a la aplicación bloqueado por autenticación. |
| `/sw.js` | HTTP 302 hacia Vercel SSO, `Content-Type: text/plain` | No se recibió JavaScript ni se verificaron las cabeceras del worker. |
| `/manifest.webmanifest` | HTTP 302 hacia Vercel SSO, `Content-Type: text/plain` | No se recibió el manifiesto ni se pudieron verificar sus íconos desplegados. |
| Chromium, viewport 390 × 844 | Navegación termina en `vercel.com/login`, título `Login – Vercel` | Se observó la pantalla de acceso, no la aplicación. |

**Resultado de este intento: bloqueado por autenticación.** No se ejercieron perfiles, aplicaciones, respaldos, instalación, offline ni privacidad de red de la aplicación en este deployment. Tampoco se identificó el commit desplegado. El cookie técnico `_vercel_sso_nonce` observado pertenece al control de acceso de Vercel; no se utilizó para afirmar nada sobre el almacenamiento familiar.

Después de este intento, el usuario solicitó completar la comprobación final local y realizar él mismo la validación en Vercel. No se necesita conceder acceso al asistente para continuar el trabajo local. No se cambiaron protecciones, credenciales ni configuración de Vercel, no se intentó eludir el control de acceso y no se introdujeron datos familiares.

## Comprobación final local solicitada — 18/10/2026

**Resultado: pasa en el entorno local ejercido.** Se construyó y ejecutó producción con `pnpm build` y `pnpm start --hostname 127.0.0.1 --port 3130`, no `next dev`. El origen estaba aislado de los recorridos anteriores y solo recibió datos ficticios. Esta comprobación no equivale a verificar el deployment.

| Comprobación | Evidencia observada |
|---|---|
| Suite y build | `pnpm test`: 11 archivos, 91/91 pruebas. `pnpm build`: Next.js 16.4.2/webpack completó generación de rutas y worker. |
| Respuestas HTTP | `/`, `/sw.js` y `/manifest.webmanifest`: 200. Cabeceras globales `nosniff`, `DENY`, referrer y permisos; worker JavaScript con `no-cache, no-store, must-revalidate`, alcance `/` y CSP propia. |
| Manifiesto e íconos | Manifiesto enlazado, nombre `Vacunas Colombia`, `short_name: Vacunas CO`, `display: standalone`. Imágenes decodificadas: 192 × 192, 512 × 512 y apple touch icon 180 × 180. Worker activo y página controlada tras primera carga. |
| Perfiles y referencias | Alta sin esquema preseleccionado. `Luna Local` con nacimiento 2026-01-31 mostró 2026-03-14/04-25/06-06. `Sol Local` con nacimiento 2025-01-31 e histórico mostró 2025-03-31/05-31/07-31 y FA 2026-07-31. Sus carnés permanecieron independientes. |
| Diseño móvil | Chromium a 390 × 844, captura observada. Sin overflow horizontal global; contenido terminó a 758 px y navegación empezó a 766 px, sin superposición. Acciones del carné apiladas. |
| Offline real | Se detuvo el servidor y se recargó `/`. Se editó el apodo y el lote de la hexavalente, y se creó otra aplicación manual por revisar, sin conexión. |
| PDF offline | Carné A4 generado con el servidor detenido; texto extraído confirmó apodo editado, nacimiento, fecha, leyenda no oficial y único evento con dosis/etapa/marca/lote/IPS/nota reales. |
| Respaldo offline | Exportación local de dos perfiles/un evento y autoimportación: 2 perfiles y 1 evento idénticos, combinación correcta sin duplicación. |
| Reconexión | Formulario abierto con nota sin guardar: al restaurar servidor/red se mantuvieron el mismo documento, diálogo y campo; después se guardó normalmente. No hubo recarga automática. |
| Persistencia y fallback | Tras cerrar y reabrir la pestaña con el servidor nuevamente detenido: perfil activo editado, dos perfiles y dos aplicaciones en IndexedDB v30. Ruta no precargada mostró `/offline`; volver a `/` recuperó la app cacheada. |
| Privacidad | 22 solicitudes HTTP observadas, todas `GET` al origen local, sin cuerpos ni cookies y sin datos familiares en URL. Un precache de 28 recursos, sin contenido de los registros ficticios. Cookies, localStorage y sessionStorage vacíos. Cero errores de navegador. |

Los servidores y pestañas de esta comprobación se cerraron. No se cambiaron archivos de producción ni se incorporaron respaldos/PDF/capturas al repositorio. **La validación del deployment Vercel queda a cargo del usuario**, igual que la evidencia física de instalación que decida aportar; la revisión clínica independiente sigue siendo un requisito separado.

## Navegación condicionada al perfil — 18/10/2026

**Resultado: pasa.** En producción local (`127.0.0.1:3131`), sin perfiles se observaron únicamente Inicio, Información y Ajustes; estas últimas dos vistas siguieron utilizables. Crear el primer perfil añadió Calendario y Carné y la recarga conservó los cinco destinos.

Con Carné abierto en una pestaña, eliminar el último perfil desde otra ocultó ambos destinos y dejó Inicio como destino activo, sin recargar. Restaurar el respaldo del perfil recuperó los cinco destinos en ambas pestañas. Se observaron capturas móviles y se midieron superficies de 390 × 844 y 1280 × 900: sin overflow horizontal global ni superposición de navegación, controles de 54 y 48 px respectivamente y cero errores de navegador. `pnpm test` pasó 91/91 y `pnpm build` completó producción. No se modificaron datos reales ni el deployment.

## Formato, nombres y separación de bloques — 18/10/2026

**Resultado: pasa.** El código propio se formateó con Prettier 3.9.10 (2 espacios, comillas simples, punto y coma, ancho objetivo 80) y se añadieron configuración compartida de VS Code/EditorConfig y scripts `format`/`format:check`. Se separaron declaraciones, efectos, handlers y grupos de JSX con líneas en blanco. Los cambios locales de indentación existentes se conservaron dentro del formato uniforme.

Los renombrados se aplicaron con el servidor TypeScript, consultando referencias antes de cambiar exports: `VaccineDb`, constantes globales inmutables y nombres locales de pruebas. No cambiaron nombres/versión de IndexedDB, campos persistidos, IDs clínicos, valores de catálogos ni contratos de respaldo. Se conservaron exports obligatorios de Next.js y nombres de APIs externas.

`pnpm format:check`, `pnpm install --frozen-lockfile`, las 91/91 pruebas y `pnpm build` pasaron. La revisión independiente no encontró defectos bloqueantes. En producción local se creó un perfil y una hexavalente, se conservaron las fechas 42/84/126 días y se exportó/importó el respaldo sin duplicación.

En escritorio (1280 × 900) y móvil (390 × 844), Información y Ajustes sin perfil dejaron **22 px** entre la tarjeta introductoria y el siguiente bloque; las columnas de Información conservaron 22 px. Las capturas observadas no mostraron overflow horizontal ni superposición de navegación móvil. El encabezado del carné dejó 22 px de margen inferior en pantalla y 0 px en impresión: el PDF A4 verificado conservó el evento y su leyenda sin navegación ni acciones. Las reglas nuevas se limitan a `@media screen`, sin cambiar el flujo de impresión.

Con el servidor detenido se recargó la app y se recuperaron el perfil y su evento offline. Cero errores de navegador. No se incorporaron artefactos ni datos ficticios al repositorio; la validación en Vercel continúa a cargo del usuario.

## Task 19 — Información como ayuda contextual

**Resultado: pasa en producción local.** Esta estructura sustituye el tab Información descrito en las comprobaciones anteriores. Sin perfiles quedan Inicio y Ajustes; al crear el primero aparecen Calendario y Carné. Eliminar el último desde otra pestaña ocultó ambos destinos y devolvió a Inicio la pestaña que mostraba Carné. El contenido de Inicio no se rediseñó.

Información y ayuda se abre desde un botón de la cabecera, sin navegar ni desmontar la vista actual. Se conservaron los textos clínicos, catálogos, productos y privacidad en cuatro secciones nativas desplegables, inicialmente cerradas y separadas por 16 px. Se verificaron apertura/cierre por teclado, foco contenido dentro del popup, cierre con Escape y retorno al botón después de finalizar la salida del diálogo. Abrir/cerrar la ayuda conservó Carné y Ajustes como vistas de origen.

Chromium a **320 × 740**, **390 × 844** y **1280 × 900**: sin overflow horizontal del popup ni de la página, cuerpo de ancho completo, desplazamiento interno al expandir las cuatro secciones y cierre siempre visible. El selector con un apodo largo no invadió el botón de ayuda y ambos controles conservaron al menos 44 px de alto. Se observaron capturas móviles y de escritorio; no se incorporaron al repositorio.

Con el servidor detenido se recargó la app cacheada, se abrió la ayuda y se desplegó Catálogo y fuentes con sus 18 enlaces. No se afirma que los documentos externos estén precargados. Cero errores de navegador en las superficies comprobadas.

`pnpm format:check`, las **91/91 pruebas** y `pnpm build` pasaron. La revisión independiente no encontró defectos bloqueantes, incluidos los ajustes de ancho del selector y alineación del popup. No se cambiaron reglas clínicas, almacenamiento ni contratos de respaldo. La validación en Vercel sigue a cargo del usuario.

## Task 21 — Ajustes compactos y sin duplicación

**Resultado: pasa en producción local.** La captura reportada correspondía a Ajustes, cuya cuadrícula de tarjetas seguía intacta después de trasladar Información al popup. Ajustes ahora agrupa perfiles/referencia, copias de seguridad, revisión, almacenamiento/borrado y privacidad en cinco secciones nativas desplegables de una columna. Perfiles empieza abierto; las otras secciones empiezan cerradas cuando no hay incidencias. La invitación general a crear un perfil permanece en Inicio y ya no se repite sobre Ajustes.

Chromium en **320 × 740**, **390 × 844** y **1280 × 900**: se midieron **22 px entre las cinco secciones**, sin overflow horizontal global. Tras crear/restaurar un perfil, el selector de referencia permaneció dentro de su sección, con 44 px de alto incluso a 320 px. Se observaron capturas móviles y de escritorio con los apartados expandidos y plegados.

Se creó un perfil desde el popup de Ajustes y se exportó un respaldo. La previsualización y el archivo seleccionado sobrevivieron a plegar/desplegar Copias de seguridad y navegar a Inicio y volver. La autoimportación conservó un único perfil; otra sesión vacía restauró el mismo respaldo y habilitó Calendario y Carné. Cancelar el cambio de referencia conservó Esquema 2026 y devolvió el foco al selector. Información mantuvo su popup de cuatro secciones y retorno del foco, sin reabrir Perfiles.

Con el servidor detenido, recargar y volver a Ajustes recuperó el perfil y permitió abrir Copias de seguridad. Cero errores de navegador. `pnpm format:check`, **91/91 pruebas** y `pnpm build` pasaron con Node 24.22.0/pnpm 12.14.0. La revisión independiente no encontró bloqueantes. Sin cambios en reglas clínicas, esquema persistido o contratos de respaldo; sin despliegue en Vercel.

## Task 22 — Dimensiones compartidas y responsive

**Resultado: pasa en Chromium local.** Se corrigió la causa de la captura: la regla propia `.grid` imponía dos columnas al diálogo y el select de esquema era más ancho que su columna. En la medición previa, un popup de 512 px tenía dos columnas de 220 px y un select de 311,5 px. El layout propio se migró completamente a `.content-grid`, sin añadir Bootstrap ni modificar dependencias.

Los diálogos ahora tienen una única columna, límites de viewport y cuerpo desplazable. Formularios de perfil/aplicación/reparación: máximo 40rem; Información: 56.25rem; confirmaciones: 32rem. Con fuente base de 16 px, son 640/900/512 px respectivamente. Los campos combinados solo usan dos columnas si su propio contenedor alcanza 34rem. Los controles de uso real miden al menos 44 px; los textos largos se parten en líneas en lugar de quedar cortados.

Se recorrieron los mismos **17 estados** en los siguientes escenarios:

| Viewport CSS | Variante | Resultado |
|---|---|---|
| 320 × 740 | Móvil estrecho | Pasa |
| 390 × 844 | Móvil | Pasa |
| 768 × 1024 | Tablet | Pasa |
| 1052 × 1260 | Tamaño usado para inspeccionar la captura | Pasa |
| 1280 × 900 | Escritorio | Pasa |
| 844 × 390 | Ventana horizontal de poca altura | Pasa |
| 640 × 450, DPR 2 | Geometría equivalente a una ventana de 1280 × 900 al 200 % | Pasa |
| 1052 × 1260, fuente raíz/cuerpo de 32 px | Texto al 200 % | Pasa |

Los estados abarcan alta/edición de perfil, validación de perfil vacío, confirmación de esquema dentro del formulario, alta/edición de aplicación, Información expandida, cambio de referencia/catálogo, borrado de perfil/aplicación/incidencia, ambos pasos del borrado total y reparación de perfil/aplicación antes y después de confirmar su destino. Los datos de prueba se introdujeron mediante los formularios y el importador reales, en un contexto de navegador propio con perfiles ficticios.

Las comprobaciones geométricas observaron márgenes mínimos de **16 px**, sin desbordamiento horizontal del popup/cuerpo ni controles recortados. Se midieron las opciones de los menús, los controles y sus límites; el encabezado/cierre de los formularios y el pie de confirmación permanecieron accesibles al desplazar el cuerpo. También se corrigió la expansión intrínseca de las columnas móviles y el desbordamiento de un apodo de 91 caracteres sin espacios. La cabecera compacta conserva su elipsis intencional; su menú permite leer el nombre completo.

El foco de cierre se comprobó por teclado en los ocho escenarios, con al menos 8 px de separación del borde antes de contar el borde del popup. El foco nativo se movió a `@layer base` para no imponerse sobre los indicadores de los componentes. Tab permaneció dentro del diálogo; cancelar el aviso de descarte conservó apodo, nacimiento y esquema del borrador. Se observaron capturas de producción de 1052/390 px con el esquema completo y sin título visual duplicado.

En producción local se recorrieron nuevamente los 15 estados base. Un borrador de aplicación conservó dueño, fecha, lote y notas al redimensionar **320 → 768 → 390 px**, con columnas **1 → 2 → 1**, y después se guardó como un único evento. Las mediciones tras redimensionar esperan a que el layout haya terminado de ajustarse. El PDF A4 de una página conservó fecha, dosis, IPS, lote editado, notas y leyenda no oficial, sin navegación ni acciones.

Con el servidor detenido, recargar recuperó el perfil y el evento editado, y permitió abrir los diálogos de edición e Información con las nuevas dimensiones. El recorrido final de producción no registró errores de navegador. En desarrollo se observó una petición RSC cancelada (`ERR_ABORTED`), sin fallo funcional en los recorridos.

`pnpm format:check`, **91/91 pruebas en 11 archivos** y `pnpm build` pasaron con Node 24.22.0/pnpm 12.14.0. La revisión independiente no encontró bloqueantes. No se alteraron contratos clínicos, esquema persistido, IDs ni formato de respaldo; no se versionaron fixtures, PDF o capturas.

**Límite:** el escenario DPR 2 verifica geometría equivalente, no el control de zoom nativo de Chrome. No se comprobó el teclado virtual ni dispositivos físicos Safari/iOS/Android ni un nuevo deployment Vercel. Se dejó activo el servidor de desarrollo del usuario; los servidores propios de comprobación se detuvieron.

## Task 23 — Inicio y contexto del perfil

**Resultado: pasa en Chromium local.** El botón **Registrar vacuna aplicada** queda únicamente en la cabecera de Inicio, sin duplicarlo en las tarjetas. Se conserva la entrada para perfiles con catálogo disponible cuya referencia necesite revisión; la acción ya no acompaña toda la navegación.

| Vista recorrida | Botones de registro observados |
|---|---|
| Inicio | 1 |
| Calendario | 0 |
| Carné | 0 |
| Ajustes | 0 |

Edad actual y esquema seleccionado usan bloques etiquetados independientes, separados por **18 px**. En **320, 390 y 1280 px** no hubo overflow horizontal; el botón de registro midió **44 px** de alto. El encabezado describe un registro de vacunas por perfil guardado en el dispositivo, sin atribuirle un historial médico familiar.

El recorrido de producción guardó una aplicación física de hexavalente desde Inicio y la recuperó en Carné, sin un segundo botón de registro. La revisión independiente no encontró regresiones. Las comprobaciones integradas de estas tareas y sus límites se registran en las secciones siguientes.

## Task 24 — Registro y referencias de productos

**Resultado: pasa en producción local.** La búsqueda por **Hexaxim** filtró el selector de producto sin cambiar por sí sola el valor «no identificado». Elegir hexavalente ofreció **6/12/18 semanas** en 2026 y **2/4/6 meses** en la referencia histórica. Rotarix ofreció solo dos etapas; RotaTeq conservó la tercera con edad por confirmar, sin tomar prestadas las 18 semanas de otra referencia. Fiebre amarilla ofreció 9 meses en 2026 y 18 meses en el catálogo histórico.

Se recorrieron los **6 productos complementarios × 3 filtros × 2 referencias = 36 estados**. Todos desplegaron su panel junto al botón, sin overflow a 390 px, con información y fuentes visibles incluso al excluir sus filas de la línea de tiempo. Hexavalente y Rotarix mostraron las correspondencias PAI ya existentes sin añadir dosis; ACWY, meningococo B y dosis cero mostraron el límite de fechas documentadas. La tercera dosis particular de RotaTeq permaneció sin edad/fecha calculada.

Se guardó una aplicación ficticia de fiebre amarilla en `month-18`, se cambió el perfil a 2026 y se abrió su edición: el valor de 18 meses permaneció seleccionado y marcado fuera de la referencia actual, junto a la opción documentada de 9 meses. Editar el lote conservó la fecha y etapa, sin convertirlas automáticamente en cobertura actual. Después se restauró la referencia histórica.

Las 10 nuevas pruebas de presentación comprueban el alcance por producto/esquema, catálogos incompatibles, captura manual, etapas conservadas y ausencia de edades verificadas. **101/101 pruebas en 12 archivos**, formato y build pasaron. No se modificaron catálogos clínicos, reglas de cobertura, esquemas persistidos ni etiquetas históricas del carné; la revisión independiente no encontró bloqueantes.

## Task 25 — Instalación y mensajes sin conexión

**Resultado: pasa en producción local.** En desarrollo se observó el mensaje explícito de uso sin conexión desactivado; en producción se observó la transición de preparación a disponibilidad. El mensaje deja claro que el estado pertenece a ese navegador y que instalar no sincroniza los registros.

**Cómo instalar la aplicación** abre tres tutoriales desplegables con pasos numerados y enlaces oficiales de Apple, Chrome y Edge. Las opciones de dispositivo aparecen antes de las notas explicativas y las tres quedan visibles inicialmente en **320 × 640, 390 × 844, 844 × 390 y 1280 × 900 px**. No hubo overflow horizontal; los diálogos respetaron al menos 16 px por borde y mantuvieron scroll interno. Los pasos tienen separación propia y los grupos 16 px. Enter abrió la primera sección; Escape cerró el popup y devolvió el foco al botón.

Se detectó un build nuevo con el worker anterior activo: un borrador de aplicación deshabilitó **Actualizar aplicación** y permaneció intacto. Después de descartar únicamente ese borrador ficticio, la confirmación explícita permitió cargar la nueva versión conservando los perfiles y registros.

Con el servidor propio detenido, una recarga del build final recuperó **Luna/2026**, **Sol/histórico**, sus dos aplicaciones físicas y las selecciones de RotaTeq/ACWY. El calendario y los tres tutoriales siguieron disponibles, con listas numeradas y fuentes integradas en la interfaz; los enlaces externos requieren conexión. El recorrido final de producción registró **0 errores de navegador**.

Formato, **101/101 pruebas en 12 archivos** y build Next 16.4.2 pasaron con Node 24.22.0/pnpm 12.14.0. La revisión independiente no encontró bloqueantes. Se actualizaron README y esta evidencia, sin nuevas dependencias ni cambios en la activación automática del worker.

**Límites:** no se instaló físicamente la PWA en iOS/Android/PC, no se forzó un fallo de registro del worker ni se comprobó un nuevo deployment Vercel. Las guías usan documentación oficial, no constituyen una certificación por dispositivo. No se versionaron capturas, datos ficticios ni artefactos de build; el servidor de desarrollo del usuario no se detuvo.

## Task 26 — Producto antes de etapa

**Resultado: pasa en navegador local.** La etapa empieza deshabilitada con producto no identificado. Escribir **Hexaxim** en la búsqueda no la habilitó; seleccionar hexavalente sí lo hizo. Volver a captura manual dejó la etapa deshabilitada y sin trasladar la selección anterior al nuevo producto.

El control mantiene su valor histórico cuando no se cambia explícitamente de producto; no se borra el registro para habilitarlo. La ayuda explica la condición y el estado deshabilitado tiene indicación visual. La comprobación de producción confirmó el estado inicial y permitió completar después la identificación de una aplicación guardada.

## Task 27 — Descartar edición mediante diálogo

**Resultado: pasa en Chromium local y producción.** Cancelar, Escape, el cierre y el fondo del formulario con cambios abrieron un diálogo de la aplicación, no `window.confirm`. La opción Cancelar recibió el foco inicial. Cancelar o Escape conservaron exactamente el borrador y devolvieron el foco; Confirmar cerró el formulario sin persistir el texto descartado. Un formulario sin cambios se cerró sin confirmación.

En **320, 390 y 1280 px** no hubo overflow: el ancho del diálogo fue 288, 358 y 512 px respectivamente, con botones de 44 px. La comprobación del fondo no registró diálogos nativos. El formulario permaneció montado mientras se decidía; no se sustituyó por otra instancia ni se escribió el borrador.

La protección nativa al cerrar o recargar la pestaña se conserva: los navegadores no permiten reemplazar `beforeunload` por un diálogo personalizado fiable.

## Task 28 — Carné y calendario: enlace por dosis

**Resultado: pasa mediante motor real, repositorio y navegador.** Una hexavalente ficticia con producto y dosis 1, pero sin etapa, se guardó en Carné y dejó pentavalente/IPV 1 sin enlace. Calendario mostró la fecha real, la etapa faltante y los motivos, con acceso directo a editar. Completar `primary-1` en ese mismo formulario produjo dos requisitos aplicados; pentavalente 2 permaneció sin enlace. No se marcó todo el producto ni toda la etapa como aplicada.

Las explicaciones y registros por revisar están en desplegables, separados del filtro de requisitos. El estado anterior se aclaró como **Fecha pasada · sin enlace confirmado**. La etiqueta de registro sin confirmación ahora también es correcta para aplicaciones nuevas incompletas, sin llamarlas heredadas.

Cuatro regresiones comprueban la transición incompleta/corregida, revisión contextual, aislamiento e inmutabilidad por perfil y requisitos opcionales fuera de la referencia. Pasaron **105/105 pruebas en 13 archivos**, formato y build. No se modificaron las reglas clínicas ni se concedió cobertura por nombre, edad o fecha aproximada.

**Límite diagnóstico:** no se accedió al registro real del navegador del usuario. Se demostró una causa reproducible y se hicieron visibles los motivos calculados; no se afirmó que su aplicación concreta tuviera necesariamente esa misma omisión.

## Task 29 — Carné infantil imprimible minimalista

**Resultado: pasa con PDF real de Chromium, extracción y rasterización nativa de PDFKit.** A4 vertical, márgenes de 14 mm, jerarquía monocromática y aplicaciones a 9,5 pt. Los títulos de columnas, apodo y nacimiento se repiten por página. Un `colgroup` fija las proporciones de las cuatro columnas impresas; las acciones permanecen solo en pantalla.

| Caso ficticio impreso | Resultado observado |
|---|---|
| Perfil sin aplicaciones | Una página con identidad, contador cero y explicación; sin vacunas previstas. |
| Una hexavalente identificada | Una página con fecha, dosis/etapa, marca, lote, IPS, acceso, PAIWEB, revisión y observaciones. |
| 41 aplicaciones, 40 de ellas incompletas con motivos de revisión | 17 páginas A4 sin páginas vacías; los 40 identificadores de prueba y la aplicación identificada se conservaron. |
| Observaciones de 100 líneas y 4.204 caracteres | Se paginaron completas; la línea 100 y el marcador final aparecen en la última página. |
| Apodo Unicode largo, lote de 131 caracteres y prestador largo | Texto ajustado sin recortes; se comprobó íntegra la cadena del lote y del prestador en el PDF extraído. |

La muestra extrema conserva deliberadamente los motivos de revisión en vez de reducir la letra para comprimirla. No se imprimieron navegación, botones ni diálogos. Se invirtió el orden cronológico y se verificaron primera/última fecha; el perfil vacío no mostró aplicaciones del otro niño. En 320/390 px la tabla desplazó dentro de su contenedor sin overflow de la página; a 1280 px no necesitó desplazamiento horizontal.

Con el servidor detenido se recargó la versión final, se recuperaron las 41 aplicaciones y se generó de nuevo el PDF completo, con todos sus identificadores, encabezados y campos largos. El recorrido final registró **0 errores de navegador**.

Fuentes de organización leídas: [Wisconsin DHS](https://www.dhs.wisconsin.gov/forms/f4/f44257.pdf), [Iowa HHS](https://hhs.iowa.gov/media/665/download?inline) y [CDC sobre registros](https://www.cdc.gov/vaccines-children/records/). No se copiaron certificaciones, firmas, requisitos ni recomendaciones clínicas de esas fuentes.

Verificación final de Tasks 26–29: formato, **105/105 pruebas en 13 archivos** y build Next 16.4.2 con Node 24.22.0/pnpm 12.14.0 correctos. Revisión independiente y revisión de los últimos ajustes sin hallazgos accionables. Sin cambios de catálogo, reglas clínicas, esquema de datos, dependencias o formato de respaldo.

**Límites:** impresión física, Safari/iOS/Android y nuevo deployment Vercel no comprobados. Los datos y PDF son ficticios y temporales, fuera del repositorio; no se usó el historial personal del usuario.

## Task 30 — Primera dosis pendiente sin saltos

**Resultado: pasa con regresión fallando antes y pasando después, motor y navegador de producción.** El selector anterior descartaba requisitos sin cubrir cuando su fecha estimada era anterior a hoy. Para nacimiento `2026-07-10`, con BCG y hepatitis B neonatal verificadas, devolvía noviembre en vez del primer grupo a 42 días.

| Referencia 2026 | Fecha civil calculada |
|---|---|
| Primera etapa, 6 semanas | 21 / agosto / 2026 |
| Segunda etapa, 12 semanas | 2 / octubre / 2026 |
| Tercera etapa, 18 semanas | 13 / noviembre / 2026 |

Ahora se selecciona el primer grupo fechado sin cobertura, incluso si está pasado. Cubrir solo parte de un grupo no salta sus requisitos restantes. Los estados y contadores de la ventana de 30 días conservan sus reglas; no se inventa una fecha de recuperación.

En producción se crearon el perfil y ambas aplicaciones de nacimiento mediante la interfaz: el resumen mostró agosto y las dosis 1, no las dosis 3. Cambiar a la referencia histórica mostró 10 / septiembre / 2026 y 2 meses. Editar después una fecha de aplicación neonatal a septiembre no desplazó la primera referencia de agosto: el anclaje sigue siendo el nacimiento del perfil.

**Precisión:** seis semanas son 42 días, no 45. Para este nacimiento, la edad calendario en la primera referencia es un mes y once días. La diferencia entre el 12 y el 13 de noviembre depende del nacimiento guardado; no se asumió el dato personal del usuario a partir de la fecha de aplicación.

## Task 31 — Fechas civiles con mes en letras

**Resultado: pasa en vistas reales y PDF.** Se utiliza un formateador común sin construir instantes UTC: día numérico, mes completo en español y año. Se migraron etiquetas de calendario, carné, perfiles, incidencias, fuentes, confirmaciones y texto accesible. Los campos nativos mantienen sus valores ISO y límites, con vista legible asociada.

Se observó `2026-07-10` en el valor nativo y **10 / julio / 2026** en la vista de nacimiento/aplicación. El cambio previo del usuario **Marca comercial o Laboratorio (opcional)** se preservó. En el PDF real se conservaron ambas vacunas y se verificó visualmente **10 / septiembre / 2026**, ajustado en la columna sin invadir la siguiente, además de julio y la fecha de exportación.

El formateador cubre bisiestos, meses completos, años menores de cien y fechas históricas inválidas que deben seguir siendo corregibles. Las cuatro suites de fechas, resumen y presentación pasaron **49/49** en cada zona: Bogotá, Nueva York y Kiritimati. No se modificaron cálculos, ordenación, JSON técnico, respaldos ni valores `dateTime`.

## Task 32 — Edad, fecha y tablas PAI/No PAI

**Resultado: pasa en producción local.** La tarjeta muestra una sola vez la edad según la fuente y la edad calendario de la primera fecha pendiente, seguidas de todas las vacunas de ese grupo. Para julio mostró **6 semanas**, **1 mes y 11 días** y **21 / agosto / 2026**. El nombre de cada vacuna no recibe otro sufijo numérico de dosis duplicado.

Las tablas compactas separan PAI, No PAI y acceso condicional. Cada fila incluye fecha, vacuna/dosis pendiente, primera referencia y total documentado con alcance. Se mantienen fechas pasadas, futuras y desconocidas; no se activa ningún producto particular automáticamente.

| Caso observado | Resultado |
|---|---|
| Pentavalente/IPV primarias | 3 dosis de serie primaria, sin incluir refuerzos. |
| Neumococo primario/refuerzo | 2 primarias; el refuerzo usa el total documentado de la referencia. |
| Rotavirus genérico | Total por confirmar cuando los cursos Rotarix/RotaTeq difieren. |
| RotaTeq particular seleccionado | Curso de 3 dosis, tercera sin fecha inventada. |
| ACWY seleccionado | Visible sin fecha ni total no documentados. |
| Dosis cero condicional | Grupo de acceso por confirmar, no clasificada automáticamente como No PAI. |

Las regresiones comprueban consenso de reglas verificadas, series completas, requisitos ausentes, reglas incompletas o no verificadas, totales contradictorios y referencias históricas. El total de una referencia seleccionada no se presenta como curso universal de un producto ni como obligación clínica.

En **320, 390 y 1280 px** no hubo overflow horizontal de la página; las tablas se desplazan internamente en móvil y caben sin desplazamiento en escritorio. Con el servidor detenido, recargar mantuvo la primera referencia de agosto, los grupos PAI/No PAI/condicional y las aplicaciones con fechas legibles. El recorrido final tuvo **0 errores de navegador**.

Verificación integrada Tasks 30–32: **135/135 pruebas en 15 archivos**, formato y build Next 16.4.2 correctos; **49/49** casos de fechas/referencias en cada una de las tres zonas horarias. Revisión independiente sin defectos accionables. Sin cambios de catálogo, cálculo clínico de fechas, cobertura, esquema de datos o dependencias.

**Límites:** datos ficticios, no historial personal del usuario; instalación física, impresión física y Vercel no comprobados. El cambio previo del usuario en la etiqueta de laboratorio se conservó fuera de los commits de estas tareas.

## Task 33 — Estados de revisión comprensibles

Se abrió en el navegador de desarrollo el desplegable **¿Qué significa «Por verificar con el vacunador»?** de Carné. Distingue aplicación guardada, biológico/marca no reconocido y enlace al calendario aún no confirmado. Indica revisar producto, marca, dosis y etapa con el soporte, sin sugerir repetir la vacuna. Las etiquetas compartidas ya no presentan una marca desconocida como si necesariamente faltara seleccionar el producto.

Se conservan los motivos técnicos y snapshots: el cambio no concede cobertura ni modifica aplicaciones. La ayuda no se imprime. Esta evidencia inicial corresponde al navegador de desarrollo, no a una certificación clínica ni al despliegue Vercel.

## Task 34 — Captura persistente de marca o laboratorio

El primer campo anterior guardaba solo una consulta transitoria: escribir **Hexaxim** y seleccionar hexavalente dejaba `brand` vacío, observado en el formulario real. Repositorio y esquema ya conservaban el campo `brand`; el problema identificado era la captura engañosa. Se eliminó esa búsqueda y se mantuvo un único campo real de marca/laboratorio, con sugerencias editables y ayuda sobre lo que se guarda.

En desarrollo se creó una aplicación particular de hexavalente, dosis 1, primera etapa, fecha **1 / septiembre / 2026**, marca **Hexaxim** y lote de prueba. El carné mostró la marca y el formulario la recuperó después de recargar. Se editó a **Laboratorio de ejemplo sin catálogo** y la siguiente recarga recuperó el texto exacto, sin conceder correspondencia por esa marca. Se restauró Hexaxim mediante edición y volvió a mostrarse verificada. En 390 px, el diálogo midió 358 px, con márgenes de 16 px y sin overflow de página.

La etiqueta preexistente del usuario se conserva. No se infiere la marca a partir de la categoría del biológico ni se modifica el esquema persistido.

## Task 35 — Continuación desde aplicaciones reales

**Resultado: pasa en motor y producción local.** Se añadió una capa derivada sobre el calendario por nacimiento, después de validar las correspondencias actuales y antes del resumen. No modifica aplicaciones, snapshots, catálogos inmutables ni respaldos. Usa el intervalo programático de seis semanas documentado para la serie primaria 2026; no se publica como mínimo clínico universal.

Las regresiones fallaron primero por fechas/estados incorrectos, no por imports: una primera dosis tardía conservaba octubre 2 en vez de octubre 13. Una segunda regresión mostró que conservar la tercera referencia por nacimiento podía adelantarla a la segunda calculada; ahora falta de antecedente real deja esa continuación por confirmar, con la referencia original visible.

Recorrido de producción con perfil ficticio nacido el 10 de julio, BCG/HB neonatal y dos aplicaciones particulares de hexavalente capturadas en la interfaz:

| Acción real | Continuación observada |
|---|---|
| Primera hexavalente el 21 de agosto | Dosis 2 el 2 de octubre, seis semanas después. |
| Editar primera aplicación al 1 de septiembre | Dosis 2 el 13 de octubre, no octubre 2. |
| Registrar segunda aplicación el 13 de octubre | Dosis 3 el 24 de noviembre, no noviembre 13. |
| Consultar Calendario | Pentavalente/IPV dosis 3 muestran noviembre 24, con edad original de 18 semanas y desglose del ancla real. |
| Cambiar a referencia histórica y confirmar | Dosis 2 conserva referencia de cuatro meses, noviembre 10; desaparece la capa de seis semanas. Las cuatro aplicaciones, fechas y marcas siguen en Carné. |
| Volver a Esquema 2026 | Se recupera la continuación del 24 de noviembre sin reescribir eventos. |

El resumen presenta hexavalente de una aplicación frente a pentavalente **+ IPV** de dos, solo con correspondencias y fuentes verificadas para la etapa. Explica que composición compartida no autoriza intercambiar fabricantes/productos a mitad de serie, y que el acceso PAI a hexavalente es restringido. No se programan por esta regla los demás biológicos, refuerzos, cursos particulares sin fecha documentada o continuaciones desde doce meses.

La prueba de marca se repitió en producción: editar a un laboratorio no catalogado, guardar y recargar recuperó el texto exacto y los motivos de revisión; restaurar Hexaxim recuperó la correspondencia. El respaldo real exportado contiene las dos marcas, fechas, dosis y lotes originales, sin metadatos derivados `timing`. El PDF A4 generado incluye las cuatro aplicaciones y ambas marcas; no imprime pendientes ni ayuda de revisión.

Se inspeccionó visualmente la tarjeta móvil y se midieron **320, 390 y 1280 px** sin overflow horizontal de página. Con el servidor de producción detenido se recargó, se recuperó noviembre 24 y se editó la segunda marca a **HEXAXIM**; otra recarga offline conservó exactamente ese texto, lote, dosis y correspondencia. **Cero errores del navegador de producción** durante el recorrido.

Verificación final: **169/169 pruebas en 16 archivos**, formato y build Next 16.4.2 correctos. Las tres suites temporales/calendario pasaron **59/59** en Bogotá, Nueva York y Kiritimati. Revisión independiente del código sin hallazgos accionables. Sin dependencias nuevas, cambio de formato persistido ni publicación Vercel.

**Límites:** no hubo revisión clínica independiente ni prueba en dispositivos físicos/impresora. Las fuentes respaldan el alcance indicado, no una recomendación personalizada de rescate o sustitución. El historial del usuario no fue inspeccionado. El servidor de desarrollo preexistente del usuario se dejó intacto.

## Task 36 — Laboratorio no confundido con marca comercial

La captura aportada identificó la causa que la corrección anterior de etiquetas no resolvía: el campo aceptaba laboratorio, pero el motor rechazaba cualquier texto distinto de las marcas del producto. No era un problema de aplicación física ni una nueva equivalencia clínica.

Las regresiones fallaron primero: hexavalente + Sanofi no cubría penta/IPV y la secuencia laboratorio/marca impedía calcular una tercera dosis coherente. Ahora el biológico seleccionado explícitamente, la dosis, etapa y fuentes determinan la correspondencia. El campo administrativo no la invalida por ser un laboratorio. Una marca comercial reconocida y contradictoria sigue por revisar; escribir una marca sin seleccionar el producto no lo identifica.

Se ejecutaron **55/55** pruebas focales de cobertura, intervalos y repositorio. En navegador de desarrollo se creó una aplicación ficticia con biológico hexavalente, nombre Hexaxim, laboratorio Sanofi, dosis 1, primera etapa y fecha 25 de agosto. La previsualización y Carné indicaron correspondencia verificada; Calendario mostró **pentavalente 1 e IPV 1 aplicadas**, sin marcar las dosis 2, cuya referencia pasó a octubre 6. Las etiquetas y ayuda describen el nuevo criterio.

Esta tarea corrige nuevas capturas/ediciones. La reparación automática de snapshots ya guardados con el rechazo anterior se verifica en Task 37; no se pretende resolverla solo cambiando el mensaje.

## Task 37 — Reparación persistente de la correspondencia anterior

**Resultado: pasa en migración real, importación y producción local.** La versión local 4 de IndexedDB repara únicamente snapshots cuyo rechazo anterior era `unidentified-product`, sin cobertura, con producto/dosis/etapa completos y texto administrativo no perteneciente a las marcas reconocidas. Revalida catálogo, fuentes, referencia, perfil y fechas. Un laboratorio no se convierte en alias de un producto.

Solo cambian `coverageStatus`, `coveredRequirementIds` y `reviewReasons`; se conservan todos los campos capturados, timestamps y procedencia. Una procedencia histórica conservada no invalida una selección posterior explícita; los motivos de revisión heredada aún sin resolver sí bloquean la reparación. Los casos manuales, de otra marca comercial, sin etapa, con otros motivos, fechas incoherentes, perfil inexistente o catálogo no disponible permanecen intactos. La importación de respaldos v2 reutiliza el mismo criterio.

Se observaron primero tres regresiones fallando por snapshots sin reparar y ausencia de actualización transaccional; después, dos fallos específicos de registros ya editados que conservaban procedencia. Las pruebas pasan tras corregir ambos límites y verifican reversión completa si falla la escritura de revisión, reapertura sin otra reparación y preservación de los registros no elegibles.

Para el recorrido real se preparó un origen de prueba independiente con la compilación anterior y una base versión 3 que contenía una aplicación ficticia de Hexaxim/Sanofi rechazada por ese único motivo. Tras activar el worker de la compilación nueva y recargar, **sin editar ni importar la aplicación**:

| Comprobación | Resultado |
|---|---|
| Versión de base | Dexie 3 → 4; versión nativa 30 → 40. |
| Revisión de datos | 20 → 21, mantenida en 21 al volver a abrir. |
| Registro persistido | Exactamente el original salvo los tres campos de correspondencia. |
| Carné | Marca/laboratorio Sanofi, fecha agosto 25, lote, IPS y nota originales; correspondencia verificada. |
| Calendario | Penta 1 e IPV 1 aplicadas; dosis 2 no aplicada y seguimiento desde la aplicación real a octubre 6. |
| Respaldo antiguo importado | Previsualización: una aplicación idéntica, cero conflictos y cero registros por revisar; combinar no duplica ni restaura el error. |
| Respaldo exportado | Una aplicación física, mismos datos originales y cobertura de penta 1/IPV 1. |

Se guardó después una segunda aplicación real ficticia de Hexaxim/Sanofi para octubre 6: penta/IPV 1–2 quedaron aplicadas y las dosis 3 siguieron pendientes, con referencia de noviembre 17. Con el servidor detenido se recargó y persistieron ambas aplicaciones, marcas y estados. **Cero errores del navegador de producción.**

Carné inspeccionado visualmente; en **320, 390 y 1280 px** no hubo overflow horizontal de página. La activación del worker se efectuó mediante su mensaje estándar y recarga en la prueba; no se certifica aquí la automatización del diálogo nativo de actualización. No se borraron cachés ni datos para obtener la reparación.

Verificación final: formato, **188/188 pruebas en 16 archivos** y build Next 16.4.2 correctos; **60/60** casos de migración/cobertura/intervalos en cada zona Bogotá, Nueva York y Kiritimati. Revisión independiente sin hallazgos accionables. Sin dependencias, cambios de equivalencias clínicas, formato de respaldo, push ni despliegue Vercel. Datos ficticios aislados; no se abrió ni modificó el historial personal del usuario.

## Task 38 — Calendario por aplicación física

Se añadió un modelo de presentación que une cada aplicación con sus propios requisitos activos y confirmados por el motor actual. No altera correspondencias, contadores, fechas proyectadas ni datos persistidos. Agrupa por identificador de aplicación, no por fecha, marca o producto.

Las seis regresiones fallaron primero con la agrupación ausente y pasaron después: hexavalente de una aplicación con dos requisitos; penta/IPV separadas el mismo día; aplicaciones distintas del mismo producto/fecha; exclusión de registros revisados y otros perfiles aunque exista cobertura agregada; fuentes y opcionales activos; etapas distintas y orden por fecha real sin mutación.

En el navegador de desarrollo, una aplicación Hexaxim/Sanofi del 25 de agosto se mostró como **una tarjeta de hexavalente**, con fecha real, dosis/etapa y una sola etiqueta Aplicada. Dentro figuraron penta/IPV 1 como **Cubierto por Hexaxim**; las siguientes dosis permanecieron en referencias pendientes. Filtro PAI: una tarjeta; complementarias: ninguna para esa aplicación de cobertura PAI. En 390 px la tarjeta pasó a una columna y no hubo overflow de página; se inspeccionó visualmente la presentación.

Las fuentes de los requisitos siguen accesibles en un desplegable. Las aplicaciones por revisar o fuera de la referencia conservan el panel de revisión y sus registros originales en Carné. Las pruebas focales pasan **6/6**; la verificación integrada de producción se registra con Task 39.

## Task 39 — Desglose de cobertura en Carné

**Resultado: pasa en producción local y offline.** Carné mantiene una fila por aplicación, todos sus datos, orden, edición y eliminación. Añade el desplegable cerrado **Qué cubre esta vacuna**, que reutiliza la misma correspondencia validada del Calendario. Un registro sin cobertura actual muestra una explicación explícita, no requisitos inferidos por nombre o fecha. La etiqueta administrativa ahora dice marca/laboratorio.

Se probaron mediante formularios reales dos perfiles ficticios separados:

| Caso | Presentación comprobada |
|---|---|
| Hexaxim/Sanofi particular, dosis 1 | Una tarjeta de hexavalente, fecha real agosto 25, una etiqueta Aplicada y penta/IPV 1 dentro como Cubierto por Hexaxim. Ningún evento aplicado separado de penta/IPV 1; las siguientes dosis permanecen pendientes. |
| Dos aplicaciones PAI de penta e IPV el mismo día | Dos tarjetas independientes, cada una con su propio requisito; no se fusionan en una hexavalente. |
| Captura manual con el mismo nombre Hexaxim y la misma fecha | Sigue por revisar en Carné/panel; su desplegable no hereda la cobertura del registro identificado. |
| RotaTeq 3 sin referencia opcional seleccionada | No aparece como aplicación con requisitos activos. Tras elegir explícitamente su referencia se muestra su requisito particular, no dosis PAI inferidas. |
| Filtros del perfil combinado | Todas: hexavalente y RotaTeq; PAI: solo hexavalente, aunque fue particular; complementarias: solo RotaTeq. |
| Cambio de perfil y regreso | Cada perfil conserva únicamente sus aplicaciones y referencias seleccionadas. |

En Carné se observaron tres filas del primer perfil, todos los desplegables cerrados inicialmente. Foco y Enter abrieron el de hexavalente con dos requisitos y el manual con su advertencia. El de RotaTeq mostró únicamente su tercera dosis particular. Los registros originales de ese perfil, incluidos sus campos y timestamps, permanecieron exactamente iguales al comparar IndexedDB antes y después de consultar, filtrar y cambiar de perfil.

En **320, 390 y 1280 px**, Calendario y Carné no produjeron overflow de página. Las tarjetas pasaron a una columna en móvil y el carné conservó el desplazamiento interno de su tabla. Se inspeccionó visualmente la tarjeta móvil de producción.

Se generó un **PDF A4 real con el desglose abierto**: una página, tres aplicaciones originales, fechas, lotes, IPS, marcas/laboratorios y notas conservados. Los desplegables y sus requisitos no se imprimieron ni crearon aplicaciones adicionales. Se extrajo el texto y se inspeccionó la miniatura real del PDF.

Con el servidor detenido se recargó: se recuperaron las dos tarjetas confirmadas y tres filas físicas del perfil combinado; el desglose siguió funcionando por teclado, las referencias opcionales persistieron y no reaparecieron eventos aplicados duplicados. **Cero errores del navegador de producción.**

Verificación integrada Tasks 38–39: formato, **194/194 pruebas en 17 archivos** y build Next 16.4.2 correctos. Las seis regresiones de atribución/agrupar por aplicación fallaron antes y pasaron después. Revisión independiente sin hallazgos accionables. Sin cambios de reglas clínicas, fechas del motor, fuentes, esquema de datos, dependencias o respaldo. Impresión física, dispositivos móviles físicos y Vercel no comprobados.

## Fuentes clínicas y vigencia

| Fuente o conjunto | Estado documental | Límite de aceptación |
|---|---|---|
| Salud Total, Esquema 2026 | **Leído y trazado** como fuente secundaria para 42/84/126 días; fecha editorial no visible. | No sustituye MinSalud ni demuestra vigencia futura o elegibilidad individual. |
| EPS Sanitas, edición 2 | **Leído y trazado** para la referencia histórica 2/4/6; fecha editorial no visible y no se le atribuye 2025. | Es referencia histórica, no declaración de vigencia 2026 ni universal. Polio queda neutral. |
| MinSalud 2026 y afiche julio 2026 | **Pasajes indicados en `docs/catalog-sources.md` leídos** para hitos, formulaciones y límites. | No hubo auditoría exhaustiva de toda la normativa ni de campañas posteriores. |
| Fichas de productos | **Pasajes identificados y versionados** para composición/cursos acotados. | No verifican INVIMA actual, disponibilidad, financiación PAI, intercambiabilidad o indicación individual. |
| URLs marcadas `needs-review` | **No verificadas**; permanecen explícitas y no conceden cobertura. | No publicar como regla válida. |
| Excel aportado | **Referencia de desarrollo**, no fuente clínica ni artefacto servido. | Tarifas, IPS, comparativas y ejemplos familiares no se incorporaron al catálogo. |
| Revisión por profesional clínico independiente | **No comprobado**. | La aplicación y este documento no certifican validez clínica ni autorizan publicación de las reglas. |

La trazabilidad detallada, páginas leídas y documentos fallidos están en [`docs/catalog-sources.md`](../catalog-sources.md).

## Resultado y límites para despliegue

El comportamiento de software aplicable pasa en producción local. **No se declara aceptación integral ni se solicita publicación** mientras falten:

1. instalación y apertura reales mediante HTTPS en Safari/iOS y Chrome/Android físicos (A17);
2. smoke del despliegue real de Vercel, incluidas cabeceras HTTPS, a cargo del usuario por su indicación;
3. revisión clínica independiente de vigencia y alcance antes de presentar las reglas como aprobadas para uso público.

No se versionaron `.next`, workers generados, bases IndexedDB, respaldos descargados, PDF, capturas ni fixtures temporales del recorrido.
