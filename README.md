# Vacunas Colombia

Agenda y carné familiar local de vacunación infantil para Colombia. No sustituye al vacunador ni al carné oficial.

## Desarrollo

Requiere Node.js y pnpm. Instalar las versiones del lockfile con `pnpm install --frozen-lockfile`; ejecutar `pnpm dev` para desarrollo y `pnpm build` / `pnpm start` para producción.

## Pruebas

`pnpm test` ejecuta Vitest con IndexedDB aislada en memoria. Los tests usan nombres de base propios y no abren ni borran la base familiar del navegador.

Las fechas civiles se validan y calculan con meses calendario o días exactos, sin serializarlas a UTC. Ejecutar las pruebas de fechas bajo `TZ=America/Bogota`, `TZ=America/New_York` y `TZ=Pacific/Kiritimati` para comprobar límites de mes, bisiestos y horario de verano.

## Datos existentes y migración

La aplicación conserva la base IndexedDB `vacunas-colombia` y transforma el esquema anterior mediante una transacción versionada. Preserva IDs, fechas reales, marcas, lote, IPS y notas; no elimina automáticamente posibles duplicados.

Las aplicaciones heredadas requieren revisión antes de conceder cobertura. Perfiles sin esquema piden una elección consciente; filas incoherentes o sin perfil permanecen como registros pendientes, exportables y corregibles. Un fallo de apertura o migración nunca autoriza borrar los datos automáticamente.

## Copias de seguridad locales

El respaldo JSON contiene información familiar privada **sin cifrar** y debe guardarse con cuidado. La exportación incluye todos los perfiles, aplicaciones, selecciones y registros pendientes de revisión; también puede importarse el formato anterior de la aplicación.

Importar exige validar y previsualizar antes de guardar. Combinar omite IDs idénticos, pero rechaza la operación completa si algún ID contiene datos diferentes. Reemplazar requiere confirmación y ofrece guardar una copia previa. Si otra pestaña modificó los datos después de la previsualización, hay que actualizarla antes de importar.

Los eventos históricos incoherentes tras editar nacimiento se conservan y se exportan como datos explícitamente por revisar, con su procedencia, sin reescribir el historial en IndexedDB.
