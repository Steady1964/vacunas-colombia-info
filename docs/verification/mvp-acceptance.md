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
