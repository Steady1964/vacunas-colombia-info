# Vacunas Colombia

Agenda y carné familiar local de vacunación infantil para Colombia. No sustituye al vacunador ni al carné oficial.

## Desarrollo

Requiere Node.js y pnpm. Instalar las versiones del lockfile con `pnpm install --frozen-lockfile`; ejecutar `pnpm dev` para desarrollo y `pnpm build` / `pnpm start` para producción.

## Pruebas

`pnpm test` ejecuta Vitest con IndexedDB aislada en memoria. Los tests usan nombres de base propios y no abren ni borran la base familiar del navegador.

Las fechas civiles se validan y calculan con meses calendario o días exactos, sin serializarlas a UTC. Ejecutar las pruebas de fechas bajo `TZ=America/Bogota`, `TZ=America/New_York` y `TZ=Pacific/Kiritimati` para comprobar límites de mes, bisiestos y horario de verano.

## Perfiles, calendario y aplicaciones

Crea el primer perfil con apodo, nacimiento y la referencia indicada por tu vacunador; no viene preseleccionada. Puedes elegir **Esquema 2026** (serie primaria a 6/12/18 semanas) o **Esquema anterior a 2026** (2/4/6 meses, edición 2 de EPS Sanitas sin fecha editorial visible). En **Ajustes → Agregar otro perfil** puedes crear más niños. El selector superior recuerda el perfil activo y cada niño conserva su referencia y su historial independiente.

**Calendario** presenta fechas civiles, filtros PAI/complementarias y fuentes por requisito. Cambiar entre Esquema 2026 y Esquema anterior a 2026 pide confirmación y actualiza catálogo y serie primaria en una misma transacción: no cambia IDs, fechas reales, lotes ni prestadores del historial. Una combinación legada de 2/4/6 meses con hitos 2026 permanece legible y editable en perfiles existentes, pero no puede elegirse para perfiles nuevos. Las referencias opcionales se eligen explícitamente por perfil.

**Registrar vacuna aplicada** registra una aplicación física, aunque un producto combinado cubra varios requisitos. Puedes guardar un producto incompleto por revisar, sin cobertura automática, y corregirlo desde **Carné → Editar** conservando su ID y los campos opcionales. Un error de escritura conserva el formulario para reintentar. Editar el nacimiento no reescribe aplicaciones; las que resulten incoherentes se señalan para revisión.

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

## Borrado local y teclado

**Carné → Eliminar** identifica la aplicación por producto y fecha; **Ajustes → Eliminar perfil de…** identifica al niño y elimina sus aplicaciones e incidencias en la misma transacción. Ambos ofrecen copia antes de confirmar. **Eliminar todos los datos** exige dos confirmaciones diferenciadas; conserva los archivos descargados y la caché de la aplicación, que no contiene historiales.

Las confirmaciones de borrado y cambio de esquema enfocan la opción de cancelar y mantienen la tabulación dentro del diálogo. Al cerrar vuelven al control de origen; después de eliminar un control, el foco pasa al contenido principal. Los errores de almacenamiento no crean una familia alternativa ni borran datos para continuar.
