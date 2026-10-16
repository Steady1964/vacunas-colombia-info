# Vacunas Colombia

Agenda y carné familiar local de vacunación infantil para Colombia. No sustituye al vacunador ni al carné oficial.

## Desarrollo

Requiere Node.js y pnpm. Instalar las versiones del lockfile con `pnpm install --frozen-lockfile`; ejecutar `pnpm dev` para desarrollo y `pnpm build` / `pnpm start` para producción.

## Pruebas

`pnpm test` ejecuta Vitest con IndexedDB aislada en memoria. Los tests usan nombres de base propios y no abren ni borran la base familiar del navegador.

Las fechas civiles se validan y calculan con meses calendario o días exactos, sin serializarlas a UTC. Ejecutar las pruebas de fechas bajo `TZ=America/Bogota`, `TZ=America/New_York` y `TZ=Pacific/Kiritimati` para comprobar límites de mes, bisiestos y horario de verano.
