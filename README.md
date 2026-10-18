# Vacunas Colombia

Agenda y carné familiar local de vacunación infantil para Colombia. No sustituye al vacunador ni al carné oficial.

## Desarrollo

Requiere Node.js y pnpm. Instalar exactamente el lockfile con `pnpm install --frozen-lockfile`; ejecutar `pnpm dev` para desarrollo, `pnpm test` para la suite y `pnpm build` / `pnpm start` para producción. Los scripts de desarrollo y build fijan webpack porque esta integración de Serwist genera el service worker mediante su plugin de webpack; no se suprime ni se asume compatibilidad con Turbopack.

## Estilo de código y VS Code

`pnpm format` formatea el código propio de `app/`, `src/`, `scripts/` y la configuración raíz; `pnpm format:check` comprueba que siga el mismo formato. Prettier está fijado en el lockfile: 2 espacios, comillas simples, punto y coma y ancho objetivo de 80 caracteres. Los artefactos generados, dependencias, Excel y documentos de referencia quedan excluidos.

Los identificadores siguen la [guía TypeScript de Google](https://google.github.io/styleguide/tsguide.html#identifiers): `UpperCamelCase` para tipos, clases y componentes; `lowerCamelCase` para variables y funciones; `CONSTANT_CASE` para constantes globales inmutables. Se conservan nombres exigidos por Next.js, APIs externas, campos persistidos e identificadores clínicos. Las declaraciones, efectos, handlers y bloques de interfaz se separan con líneas en blanco según su responsabilidad.

VS Code recomienda **Prettier — Code formatter** (`esbenp.prettier-vscode`) y activa formato al guardar mediante `.vscode/settings.json`; `.editorconfig` comparte la indentación y finales LF con otros editores. No es necesario cambiar ajustes globales del editor.

## Pruebas

`pnpm test` ejecuta Vitest con IndexedDB aislada en memoria. Los tests usan nombres de base propios y no abren ni borran la base familiar del navegador.

Las fechas civiles se validan y calculan con meses calendario o días exactos, sin serializarlas a UTC. Ejecutar las pruebas de fechas bajo `TZ=America/Bogota`, `TZ=America/New_York` y `TZ=Pacific/Kiritimati` para comprobar límites de mes, bisiestos y horario de verano.

## Build y despliegue en Vercel

Importa el repositorio como proyecto Next.js y conserva los comandos `pnpm install --frozen-lockfile` y `pnpm build`, sin directorio de salida personalizado: se usa el servidor estándar de Next/Vercel, no `output: 'export'`. El historial no necesita variables secretas, base remota, endpoints ni Server Actions. Variables técnicas futuras del hosting no deben contener datos familiares.

Vercel reconstruye `.next` y los workers de `public/` a partir de las fuentes. No subas `.next`, `node_modules`, `.vercel`, archivos `.env`, respaldos JSON, bases IndexedDB exportadas, PDF ni datos de smoke. Después del despliegue comprueba por HTTPS el manifiesto, `/sw.js`, sus cabeceras, la instalación y el recorrido offline antes de publicar.

## Perfiles, calendario y aplicaciones

Crea el primer perfil con apodo, nacimiento y la referencia indicada por tu vacunador; no viene preseleccionada. Puedes elegir **Esquema 2026** (serie primaria a 6/12/18 semanas) o **Esquema anterior a 2026** (2/4/6 meses, edición 2 de EPS Sanitas sin fecha editorial visible). En **Ajustes → Agregar otro perfil** puedes crear más niños. El selector superior recuerda el perfil activo y cada niño conserva su referencia y su historial independiente.

Sin perfiles, la navegación muestra solo **Inicio**, **Información** y **Ajustes**. **Calendario** y **Carné** aparecen al crear o restaurar un perfil y se ocultan al eliminar el último; si otra pestaña lo elimina mientras consultabas una de esas vistas, se muestra Inicio.

**Calendario** presenta fechas civiles, filtros PAI/complementarias y fuentes por requisito. Cambiar entre Esquema 2026 y Esquema anterior a 2026 pide confirmación y actualiza catálogo y serie primaria en una misma transacción: no cambia IDs, fechas reales, lotes ni prestadores del historial. Una combinación legada de 2/4/6 meses con hitos 2026 permanece legible y editable en perfiles existentes, pero no puede elegirse para perfiles nuevos. Las referencias opcionales se eligen explícitamente por perfil.

**Registrar vacuna aplicada** registra una aplicación física, aunque un producto combinado cubra varios requisitos. Puedes guardar un producto incompleto por revisar, sin cobertura automática, y corregirlo desde **Carné → Editar** conservando su ID y los campos opcionales. Un error de escritura conserva el formulario para reintentar. Editar el nacimiento no reescribe aplicaciones; las que resulten incoherentes se señalan para revisión.

Corregir lote, IPS o notas de una aplicación verificada conserva su snapshot de cobertura aunque después se haya cambiado de referencia. Cambiar producto, marca, dosis o etapa lo recalcula con el catálogo del perfil; el calendario siempre valida la compatibilidad actual. Al reparar una incidencia, tanto la previsualización como el guardado usan la referencia del niño destino elegido explícitamente.

Las correspondencias y fechas se basan en catálogos inmutables de `src/data/catalog/`. La fecha editorial del documento y la fecha en que fue consultado se muestran por separado; una consulta no se presenta como fecha de publicación. Consulta las fuentes, reglas y límites en [docs/catalog-sources.md](docs/catalog-sources.md). La aplicación no calcula rescates ni intervalos clínicos mínimos.

## Carné imprimible y privacidad

**Carné** contiene únicamente aplicaciones físicas del perfil activo, no las fechas orientativas pendientes. Permite invertir el orden y abrir la impresión del navegador para guardar un PDF A4 con apodo, nacimiento, fecha de exportación, producto, dosis o estado por verificar, marca, lote, IPS, acceso y PAIWEB. El documento es un registro familiar no oficial y no reemplaza el carné del prestador ni PAIWEB.

Los datos familiares permanecen en IndexedDB del navegador y no se sincronizan con una cuenta. El respaldo JSON no está cifrado. Borrar datos del navegador, desinstalar la app o cambiar de dispositivo puede eliminar el historial; solicitar almacenamiento persistente reduce algunos borrados automáticos, pero no garantiza permanencia. El hosting puede procesar IP y solicitudes técnicas para servir la web; la aplicación no incorpora publicidad, analítica, push ni SDK de seguimiento.

## Datos existentes y migración

La aplicación conserva la base IndexedDB `vacunas-colombia` y transforma el esquema anterior mediante una transacción versionada. Preserva IDs, fechas reales, marcas, lote, IPS y notas; no elimina automáticamente posibles duplicados.

Las aplicaciones heredadas requieren revisión antes de conceder cobertura. Perfiles sin esquema piden una elección consciente; filas incoherentes o sin perfil permanecen como registros pendientes, exportables y corregibles. Un fallo de apertura o migración nunca autoriza borrar los datos automáticamente.

En **Ajustes → Revisar registros conservados** puedes corregir una aplicación o una incidencia sin perder su identificador ni sus datos originales. Un perfil pendiente necesita elegir esquema. Reparar una aplicación huérfana exige elegir y confirmar el niño destino; resolver una fila no elimina las demás incidencias. Las fechas futuras o anteriores al nacimiento heredadas permanecen señaladas, no se convierten automáticamente en cobertura.

## Copias de seguridad locales

El respaldo JSON contiene información familiar privada **sin cifrar** y debe guardarse con cuidado. La exportación incluye todos los perfiles, aplicaciones, selecciones y registros pendientes de revisión; también puede importarse el formato anterior de la aplicación.

En **Ajustes → Importar archivo JSON** la selección solo valida y previsualiza: aún no escribe datos. **Combinar** omite IDs con los mismos valores y rechaza toda la operación si algún ID contiene datos diferentes; conserva las preferencias locales. **Reemplazar** requiere confirmación y ofrece descargar una copia previa. Si otra pestaña modificó los datos después de la previsualización, la importación queda bloqueada: cancela y vuelve a seleccionar el archivo. Cancelar, un formato inválido o un fallo de transacción dejan intacto el conjunto anterior.

Los eventos históricos incoherentes tras editar nacimiento se conservan y se exportan como datos explícitamente por revisar, con su procedencia, sin reescribir el historial en IndexedDB.

## Instalación, uso offline y actualizaciones

La primera carga necesita conexión. En producción, el service worker guarda únicamente el shell y recursos estáticos de la aplicación; los perfiles y aplicaciones continúan en IndexedDB y no se copian a Cache Storage. Después de que la app indique que está preparada, Inicio, calendario, carné, impresión y respaldos locales pueden usarse sin conexión. Otras rutas muestran `/offline` si la red falla y no estaban precargadas.

La instalación depende del navegador: la app muestra el botón nativo solo cuando recibe `beforeinstallprompt`, o instrucciones para el menú de Android y **Compartir → Agregar a pantalla de inicio** en Safari iOS. Requiere HTTPS fuera de `localhost`. Los íconos versionados se regeneran desde `app/icon.svg` con `pnpm generate:icons`.

Una nueva versión queda en espera. **Actualizar aplicación** se habilita únicamente sin formularios/cambios pendientes y pide confirmación antes de activar y recargar esa pestaña. Recuperar conexión, `controllerchange` en otra pestaña y una actualización cancelada no recargan ni reemplazan datos familiares.

El despliegue conserva el servidor estándar de Next.js/Vercel; no usa `output: 'export'`. `pnpm build` genera `public/sw.js` y `public/swe-worker-*.js`: son artefactos ignorados y Vercel los recrea, mientras `app/sw.ts`, manifiesto e íconos fuente sí pertenecen al repositorio.

## Actualización del catálogo y estado de aceptación

Una regla nueva exige fuente leída, alcance explícito, ID/versiones inmutables y pruebas a través del motor real. Crea una versión nueva de catálogo o referencia; no reescribas aplicaciones históricas ni conviertas una URL, índice, marca o fecha de consulta en validación clínica. Actualiza `src/data/catalog/`, sus pruebas y [`docs/catalog-sources.md`](docs/catalog-sources.md), incluyendo páginas o secciones leídas, fecha editorial separada de la consulta y cualquier límite `needs-review`.

La evidencia ejecutada y los límites de despliegue están en [`docs/verification/mvp-acceptance.md`](docs/verification/mvp-acceptance.md). Permanece pendiente la instalación física por HTTPS en Safari/iOS y Chrome/Android, el smoke de un despliegue Vercel real y la revisión clínica independiente; por ello esa evidencia no autoriza afirmar aceptación integral ni publicar reglas como aprobadas.

## Borrado local y teclado

**Carné → Eliminar** identifica la aplicación por producto y fecha; **Ajustes → Eliminar perfil de…** identifica al niño y elimina sus aplicaciones e incidencias en la misma transacción. Ambos ofrecen copia antes de confirmar. **Eliminar todos los datos** exige dos confirmaciones diferenciadas; conserva los archivos descargados y la caché de la aplicación, que no contiene historiales.

Las confirmaciones de borrado y cambio de esquema enfocan la opción de cancelar y mantienen la tabulación dentro del diálogo. Al cerrar vuelven al control de origen; después de eliminar un control, el foco pasa al contenido principal. Los errores de almacenamiento no crean una familia alternativa ni borran datos para continuar.
