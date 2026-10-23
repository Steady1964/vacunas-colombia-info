# Vacunas Colombia

Agenda y carné familiar local de vacunación infantil para Colombia. No sustituye al vacunador ni al carné oficial.

## Desarrollo

Entorno verificado: **Node.js 24 LTS** (24.15.0 o posterior), **Corepack 0.36.0** y **pnpm 12.14.0**, fijado con su integridad en `package.json`. Con Node 24 activo:

```bash
npm install --global corepack@0.36.0
corepack enable pnpm
corepack install --global pnpm@12.14.0
pnpm --version
pnpm install --frozen-lockfile
```

Corepack 0.33.0 busca `bin/pnpm.cjs`, pero pnpm 12 usa `bin/pnpm.mjs`. Actualiza Corepack antes de instalar pnpm 12; si esa versión ya estaba cacheada con Corepack antiguo, mueve su carpeta de caché a un respaldo y vuelve a ejecutar `corepack install --global pnpm@12.14.0`. No hace falta borrar toda la caché ni modificar el lockfile a mano.

Al migrar desde un pnpm anterior, si falla la eliminación de `node_modules/.pnpm` con `ERR_PNPM_PACKAGE_MANAGER_REMOVE_MODULES_DIR`, detén los procesos que usen las dependencias, mueve `node_modules` a un respaldo fuera del proyecto y repite `pnpm install --frozen-lockfile`. No borres el lockfile ni los datos del navegador.

Ejecutar `pnpm dev` para desarrollo, `pnpm test` para la suite y `pnpm build` / `pnpm start` para producción. Los scripts de desarrollo y build fijan webpack porque esta integración de Serwist genera el service worker mediante su plugin de webpack; no se suprime ni se asume compatibilidad con Turbopack.

## Estilo de código y VS Code

`pnpm format` formatea el código propio de `app/`, `src/`, `scripts/` y la configuración raíz; `pnpm format:check` comprueba que siga el mismo formato. Prettier está fijado en el lockfile: 2 espacios, comillas simples, punto y coma y ancho objetivo de 80 caracteres. Los artefactos generados, dependencias, Excel y documentos de referencia quedan excluidos.

Los identificadores siguen la [guía TypeScript de Google](https://google.github.io/styleguide/tsguide.html#identifiers): `UpperCamelCase` para tipos, clases y componentes; `lowerCamelCase` para variables y funciones; `CONSTANT_CASE` para constantes globales inmutables. Se conservan nombres exigidos por Next.js, APIs externas, campos persistidos e identificadores clínicos. Las declaraciones, efectos, handlers y bloques de interfaz se separan con líneas en blanco según su responsabilidad.

VS Code recomienda **Prettier — Code formatter** (`esbenp.prettier-vscode`) y activa formato al guardar mediante `.vscode/settings.json`; `.editorconfig` comparte la indentación y finales LF con otros editores. No es necesario cambiar ajustes globales del editor.

### Dimensiones y comportamiento responsive

La interfaz conserva Tailwind CSS 4 y componentes shadcn/Radix. Los layouts propios usan clases específicas como `.content-grid`; no se redefine la utilidad `.grid` de Tailwind. Los estilos de foco nativos están en `@layer base` para no anular los indicadores de foco de los componentes.

| Superficie | Límite con fuente base de 16 px |
|---|---|
| Perfil, aplicación y reparación | Ancho máximo `40rem` (640 px) |
| Información | Ancho máximo `56.25rem` (900 px) |
| Confirmaciones | Ancho máximo `32rem` (512 px) |
| Todos los diálogos | Ancho/alto limitados al viewport menos `2rem`; al menos 16 px por borde con la fuente base |
| Inputs, botones predeterminados, selects y opciones | Al menos 44 px de alto; el texto puede aumentar la altura |
| Cierre de formularios e Información | Área de 44 × 44 px, separada 8 px del borde antes de contar el borde del diálogo |

El encabezado y el formulario nunca forman dos columnas. El cuerpo `.dialog-body` tiene desplazamiento interno, mínimo de altura cero y 6 px de espacio para el foco. En formularios e Información, el encabezado y el cierre quedan fuera de ese desplazamiento; en confirmaciones, las acciones quedan fuera del cuerpo desplazable. Los títulos y descripciones de diálogo tienen margen cero y usan la separación del componente.

Los pares de campos `.form-grid` pasan de una a dos columnas mediante una consulta al contenedor `vaccine-form` de al menos `34rem` (544 px con fuente base), no por el ancho de la pantalla. Los controles respetan el ancho disponible; los esquemas y las opciones largas saltan de línea. Solo el nombre del selector compacto de la cabecera usa puntos suspensivos; su menú muestra el nombre completo y respeta los márgenes del viewport.

Redimensionar cambia únicamente el layout: no desmonta el formulario, descarta el borrador ni guarda automáticamente. Guardar/cancelar, las confirmaciones y los controles de foco mantienen sus contratos anteriores. La matriz observada y los límites de comprobación están en [la evidencia de aceptación](docs/verification/mvp-acceptance.md).

## Pruebas

`pnpm test` ejecuta Vitest con IndexedDB aislada en memoria. Los tests usan nombres de base propios y no abren ni borran la base familiar del navegador.

Las fechas civiles se validan y calculan con meses calendario o días exactos, sin serializarlas a UTC. Ejecutar las pruebas de fechas bajo `TZ=America/Bogota`, `TZ=America/New_York` y `TZ=Pacific/Kiritimati` para comprobar límites de mes, bisiestos y horario de verano.

## Build y despliegue en Vercel

Importa el repositorio como proyecto Next.js y conserva los comandos `pnpm install --frozen-lockfile` y `pnpm build`, sin directorio de salida personalizado: se usa el servidor estándar de Next/Vercel, no `output: 'export'`. El historial no necesita variables secretas, base remota, endpoints ni Server Actions. Variables técnicas futuras del hosting no deben contener datos familiares.

Vercel reconstruye `.next` y los workers de `public/` a partir de las fuentes. No subas `.next`, `node_modules`, `.vercel`, archivos `.env`, respaldos JSON, bases IndexedDB exportadas, PDF ni datos de smoke. Después del despliegue comprueba por HTTPS el manifiesto, `/sw.js`, sus cabeceras, la instalación y el recorrido offline antes de publicar.

## Perfiles, calendario y aplicaciones

Crea el primer perfil con apodo, nacimiento y la referencia indicada por tu vacunador; no viene preseleccionada. Puedes elegir **Esquema 2026** (serie primaria a 6/12/18 semanas) o **Esquema anterior a 2026** (2/4/6 meses, edición 2 de EPS Sanitas sin fecha editorial visible). En **Ajustes → Perfiles de la familia → Agregar otro perfil** puedes crear más niños. El selector superior recuerda el perfil activo y cada niño conserva su referencia y su historial independiente.

Sin perfiles, la navegación muestra solo **Inicio** y **Ajustes**. **Calendario** y **Carné** aparecen al crear o restaurar un perfil y se ocultan al eliminar el último; si otra pestaña lo elimina mientras consultabas una de esas vistas, se muestra Inicio.

**Inicio** concentra el único botón **Registrar vacuna aplicada**; no se repite en Calendario, Carné ni Ajustes. La edad actual y el esquema seleccionado se muestran en bloques etiquetados distintos, sin concatenarlos. El registro pertenece a cada perfil, no representa un historial médico de toda la familia.

La **primera dosis pendiente de referencia** es la fecha estimada más antigua que aún no tiene cobertura confirmada, aunque ya haya pasado. No se sustituye por una tercera dosis futura ni se limita a los próximos 30 días; ese contador es solo una ventana informativa. Las primeras referencias se calculan desde el nacimiento guardado en el perfil; BCG y hepatitis B neonatal no desplazan las siguientes series. Una referencia vencida requiere programación individual con el vacunador: la app no calcula rescates ni indica aplicarla ahora.

En **Esquema 2026**, **Siguiente dosis de la serie pentavalente / polio** calcula la continuación a **seis semanas (42 días) de la aplicación real anterior confirmada**, dentro del alcance infantil documentado. Una primera hexavalente aplicada el 1 de septiembre da una segunda referencia el 13 de octubre, aunque la fecha inicial por edad fuera el 2 de octubre. La tercera no recibe una fecha calculada hasta registrar la segunda: no se encadenan aplicaciones ficticias. Se conservan la fecha original por edad y las fuentes en desplegables del resumen y el calendario. El histórico 2/4/6, los refuerzos y las demás vacunas conservan sus reglas; 42 días no es un mínimo clínico universal.

Para una etapa conjunta pendiente se muestran **hexavalente** (una aplicación) y **pentavalente + IPV** (dos), solo cuando las correspondencias de esa etapa están documentadas. Es una comparación de composición para consultar con el vacunador, no permiso automático de cambiar producto o marca a mitad de serie. Pentavalente sola no cubre polio y la financiación PAI de hexavalente tiene criterios específicos. Ante productos/marcas mixtos, duplicados, fechas incoherentes, etapas ausentes, fuentes no verificadas o continuación desde los doce meses, la fecha queda por confirmar sin borrar aplicaciones.

Las fechas de consulta, calendario, carné, perfiles y PDF se muestran como **21 / agosto / 2026**. Los selectores nativos conservan el calendario del navegador y añaden una vista de la fecha elegida con el mes en letras. Los valores de almacenamiento, respaldos, atributos técnicos e IDs siguen en su formato original; no se convierten a UTC. Una fecha histórica inválida conserva su texto y se marca para revisión, sin inventar otra fecha.

Las tablas **Próximas vacunas PAI** y **Próximas vacunas No PAI** incluyen las referencias pendientes ordenadas por fecha, también las ya pasadas y las que no tienen fecha documentada. Muestran vacuna/dosis, fecha calculada, dosis inicial de referencia y total con su alcance: **serie primaria**, **referencia seleccionada** o **curso del producto**. El total no se interpreta como vacunación de por vida. Los cursos ambiguos quedan por confirmar; Rotarix y RotaTeq no se confunden. El acceso condicional tiene un grupo separado y las referencias particulares solo aparecen tras seleccionarlas en Calendario.

**Información y ayuda** es un botón de la cabecera, no un tab. Abre un popup sin cambiar la vista actual, con secciones desplegables de información para familias, catálogo/fuentes, productos y privacidad. Las cuatro secciones empiezan cerradas; sus títulos permiten elegir qué leer. El popup tiene desplazamiento interno, se cierra con Escape y devuelve el foco al botón.

**Ajustes** organiza perfiles/referencia, copias de seguridad, revisión de registros, almacenamiento/borrado y privacidad en secciones desplegables de una columna, separadas por 22 px. Perfiles empieza abierto; revisión también se abre si hay incidencias conservadas. Crear o editar un perfil sigue abriendo su popup. Cerrar una sección o cambiar de vista no desmonta sus formularios ni descarta una previsualización de respaldo. La invitación general a crear el primer perfil se muestra solo en Inicio, sin duplicarse en Ajustes.

**Calendario** presenta fechas civiles, filtros PAI/complementarias y fuentes por requisito. Cambiar entre Esquema 2026 y Esquema anterior a 2026 pide confirmación y actualiza catálogo y serie primaria en una misma transacción: no cambia IDs, fechas reales, lotes ni prestadores del historial. Una combinación legada de 2/4/6 meses con hitos 2026 permanece legible y editable en perfiles existentes, pero no puede elegirse para perfiles nuevos. Las referencias opcionales se eligen explícitamente por perfil.

**Fecha pasada · sin enlace confirmado** significa que venció la fecha estimada de un requisito sin una aplicación vinculada y confirmada; no significa que se haya eliminado un registro del Carné. **¿Por qué una dosis sigue pendiente?** explica la diferencia. Si hay aplicaciones sin enlace, otro desplegable muestra la fecha real, dosis/etapa, motivos concretos y **Revisar / editar registro**. Un registro manual, incompleto o sin correspondencia documentada se conserva sin marcar dosis por similitud de nombre; registrar la primera dosis tampoco marca las siguientes.

En **Carné**, **¿Qué significa «Por verificar con el vacunador»?** explica que la aplicación está guardada y solo falta confirmar su enlace con el esquema. **Biológico o marca sin confirmar en el catálogo** incluye tanto un producto manual/no disponible como una marca no reconocida; no significa que la vacuna no se haya aplicado. **Registro guardado sin enlace confirmado al esquema** tampoco indica pérdida del registro ni recomienda repetir la dosis.

**Mostrar referencia de este producto** despliega información junto al botón, aunque el filtro de la línea de tiempo la excluya. Incluye las correspondencias disponibles, fuentes y fechas documentadas; los cursos sin edad o fecha verificada permanecen explícitamente por confirmar. Consultar un producto ya representado en PAI no crea dosis adicionales.

**Registrar vacuna aplicada** registra una aplicación física, aunque un producto combinado cubra varios requisitos. Puedes guardar un producto incompleto por revisar, sin cobertura automática, y corregirlo desde **Carné → Editar** conservando su ID y los campos opcionales. Un error de escritura conserva el formulario para reintentar. Editar el nacimiento no reescribe aplicaciones; las que resulten incoherentes se señalan para revisión.

Selecciona **Producto o biológico** según su composición y escribe la **marca comercial o laboratorio** en su campo editable: ese texto sí se guarda y se muestra en el carné. Las sugerencias de marcas no completan ni sustituyen lo escrito, y una marca desconocida se conserva para revisión sin conceder cobertura. Se eliminó la búsqueda transitoria que parecía un campo de registro pero descartaba su texto. **Etapa confirmada** permanece deshabilitada en captura manual o con un producto no disponible; se activa al seleccionar un producto del catálogo y ofrece las edades y dosis documentadas para ese producto y esquema. Una etapa histórica fuera de esa referencia se conserva y se señala para revisión; cambiar explícitamente de producto exige volver a elegir dosis y etapa.

Salir de la creación o edición con cambios abre el diálogo **Hay cambios sin guardar**, con **Confirmar** y **Cancelar**. Cancelar o pulsar Escape conserva el borrador y devuelve el foco; Confirmar lo descarta sin guardar. Si no hay cambios, se cierra directamente. El cierre o recarga de la pestaña mantiene la protección nativa del navegador mediante `beforeunload`.

Corregir lote, IPS o notas de una aplicación verificada conserva su snapshot de cobertura aunque después se haya cambiado de referencia. Cambiar producto, marca, dosis o etapa lo recalcula con el catálogo del perfil; el calendario siempre valida la compatibilidad actual. Al reparar una incidencia, tanto la previsualización como el guardado usan la referencia del niño destino elegido explícitamente.

Las correspondencias y fechas se basan en catálogos inmutables de `src/data/catalog/`. La fecha editorial del documento y la fecha en que fue consultado se muestran por separado; una consulta no se presenta como fecha de publicación. Consulta las fuentes, reglas y límites en [docs/catalog-sources.md](docs/catalog-sources.md). La aplicación no calcula rescates ni intervalos clínicos mínimos.

## Carné imprimible y privacidad

**Carné** contiene únicamente aplicaciones físicas del perfil activo, no las fechas orientativas pendientes. Permite invertir el orden y guardar un **PDF A4 vertical**, minimalista y legible en blanco y negro: nombre destacado, nacimiento, fecha de exportación y número de aplicaciones; después, fecha real, producto, dosis/etapa, marca, lote, IPS, acceso, PAIWEB y revisión. Las observaciones conservan sus saltos de línea y pueden continuar en otra página. El documento sigue siendo un registro familiar no oficial, no un carné del prestador ni una certificación clínica o de PAIWEB.

La impresión usa márgenes de 14 mm y texto de aplicaciones de 9,5 pt. Nombre, nacimiento y títulos de columnas se repiten en cada página; los registros largos se ajustan sin reducir todo el carné a una sola hoja. En móvil, el desplazamiento horizontal queda dentro de la tabla, no de la página. Las acciones y la navegación no se imprimen.

Como referencias de organización se consultaron los registros de [Wisconsin DHS](https://www.dhs.wisconsin.gov/forms/f4/f44257.pdf) e [Iowa HHS](https://hhs.iowa.gov/media/665/download?inline), y la [guía de conservación de registros de CDC](https://www.cdc.gov/vaccines-children/records/). Solo orientan la jerarquía y los campos: no se copiaron certificados, firmas, requisitos vacunales ni recomendaciones clínicas extranjeras.

Los datos familiares permanecen en IndexedDB del navegador y no se sincronizan con una cuenta. El respaldo JSON no está cifrado. Borrar datos del navegador, desinstalar la app o cambiar de dispositivo puede eliminar el historial; solicitar almacenamiento persistente reduce algunos borrados automáticos, pero no garantiza permanencia. El hosting puede procesar IP y solicitudes técnicas para servir la web; la aplicación no incorpora publicidad, analítica, push ni SDK de seguimiento.

## Datos existentes y migración

La aplicación conserva la base IndexedDB `vacunas-colombia` y transforma el esquema anterior mediante una transacción versionada. Preserva IDs, fechas reales, marcas, lote, IPS y notas; no elimina automáticamente posibles duplicados.

Las aplicaciones heredadas requieren revisión antes de conceder cobertura. Perfiles sin esquema piden una elección consciente; filas incoherentes o sin perfil permanecen como registros pendientes, exportables y corregibles. Un fallo de apertura o migración nunca autoriza borrar los datos automáticamente.

En **Ajustes → Revisar registros conservados** puedes corregir una aplicación o una incidencia sin perder su identificador ni sus datos originales. Un perfil pendiente necesita elegir esquema. Reparar una aplicación huérfana exige elegir y confirmar el niño destino; resolver una fila no elimina las demás incidencias. Las fechas futuras o anteriores al nacimiento heredadas permanecen señaladas, no se convierten automáticamente en cobertura.

## Copias de seguridad locales

El respaldo JSON contiene información familiar privada **sin cifrar** y debe guardarse con cuidado. La exportación incluye todos los perfiles, aplicaciones, selecciones y registros pendientes de revisión; también puede importarse el formato anterior de la aplicación.

En **Ajustes → Copias de seguridad → Importar archivo JSON** la selección solo valida y previsualiza: aún no escribe datos. **Combinar** omite IDs con los mismos valores y rechaza toda la operación si algún ID contiene datos diferentes; conserva las preferencias locales. **Reemplazar** requiere confirmación y ofrece descargar una copia previa. Si otra pestaña modificó los datos después de la previsualización, la importación queda bloqueada: cancela y vuelve a seleccionar el archivo. Cancelar, un formato inválido o un fallo de transacción dejan intacto el conjunto anterior.

Los eventos históricos incoherentes tras editar nacimiento se conservan y se exportan como datos explícitamente por revisar, con su procedencia, sin reescribir el historial en IndexedDB.

## Instalación, uso offline y actualizaciones

La primera carga necesita conexión. En producción, el service worker guarda únicamente el shell y recursos estáticos de la aplicación; los perfiles y aplicaciones continúan en IndexedDB y no se copian a Cache Storage. Después de que la app indique que está preparada, Inicio, calendario, carné, impresión y respaldos locales pueden usarse sin conexión. Otras rutas muestran `/offline` si la red falla y no estaban precargadas.

En `pnpm dev`, el uso sin conexión está desactivado y el mensaje lo indica: no hay una preparación pendiente que el usuario deba completar. En producción se distinguen preparación, disponibilidad y fallo de registro del worker. Instalar la aplicación no sincroniza historiales entre navegadores o dispositivos.

La instalación depende del navegador: el botón nativo aparece solo al recibir `beforeinstallprompt`. **Cómo instalar la aplicación** está disponible siempre y abre una guía responsive con tres secciones desplegables, inicialmente cerradas: **iOS/Safari**, **Android/Chrome** y **PC/Chrome o Edge**. Las opciones de dispositivo aparecen primero; los pasos numerados se incluyen en la app para consultarlos offline cuando esté preparada. Los enlaces complementarios llevan a las guías oficiales de [Apple](https://support.apple.com/es-es/guide/iphone/iphea86e5236/ios), [Chrome para Android](https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DAndroid&hl=es-419), [Chrome para PC](https://support.google.com/chrome/answer/9658361?hl=es) y [Microsoft Edge](https://support.microsoft.com/es-es/edge/install-manage-or-uninstall-apps-in-microsoft-edge), y requieren conexión. Los nombres de menú pueden variar; instalar no es obligatorio. Requiere HTTPS fuera de `localhost`. Los íconos versionados se regeneran desde `app/icon.svg` con `pnpm generate:icons`.

Una nueva versión queda en espera. **Actualizar aplicación** se habilita únicamente sin formularios/cambios pendientes y pide confirmación antes de activar y recargar esa pestaña. Recuperar conexión, `controllerchange` en otra pestaña y una actualización cancelada no recargan ni reemplazan datos familiares.

El despliegue conserva el servidor estándar de Next.js/Vercel; no usa `output: 'export'`. `pnpm build` genera `public/sw.js` y `public/swe-worker-*.js`: son artefactos ignorados y Vercel los recrea, mientras `app/sw.ts`, manifiesto e íconos fuente sí pertenecen al repositorio.

## Actualización del catálogo y estado de aceptación

Una regla nueva exige fuente leída, alcance explícito, ID/versiones inmutables y pruebas a través del motor real. Crea una versión nueva de catálogo o referencia; no reescribas aplicaciones históricas ni conviertas una URL, índice, marca o fecha de consulta en validación clínica. Actualiza `src/data/catalog/`, sus pruebas y [`docs/catalog-sources.md`](docs/catalog-sources.md), incluyendo páginas o secciones leídas, fecha editorial separada de la consulta y cualquier límite `needs-review`.

La evidencia ejecutada y los límites de despliegue están en [`docs/verification/mvp-acceptance.md`](docs/verification/mvp-acceptance.md). Permanece pendiente la instalación física por HTTPS en Safari/iOS y Chrome/Android, el smoke de un despliegue Vercel real y la revisión clínica independiente; por ello esa evidencia no autoriza afirmar aceptación integral ni publicar reglas como aprobadas.

## Borrado local y teclado

**Carné → Eliminar** identifica la aplicación por producto y fecha; **Ajustes → Perfiles de la familia → Eliminar perfil de…** identifica al niño y elimina sus aplicaciones e incidencias en la misma transacción. Ambos ofrecen copia antes de confirmar. **Ajustes → Almacenamiento y borrado → Eliminar todos los datos** exige dos confirmaciones diferenciadas; conserva los archivos descargados y la caché de la aplicación, que no contiene historiales.

Las confirmaciones de borrado y cambio de esquema enfocan la opción de cancelar y mantienen la tabulación dentro del diálogo. Al cerrar vuelven al control de origen; después de eliminar un control, el foco pasa al contenido principal. Los errores de almacenamiento no crean una familia alternativa ni borran datos para continuar.
