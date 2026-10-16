# Vacunas Colombia — PWA de vacunación infantil para Colombia

> **PROMPT DE IMPLEMENTACIÓN PARA v0 (VERCEL).** Genera una aplicación **real, funcional, instalable y lista para desplegar**. No quiero un prototipo visual ni un dashboard con información ficticia. Prioriza sencillez, claridad, accesibilidad y privacidad. El resultado debe funcionar en iPhone, Android y escritorio desde un único código.
>
> **Restricciones no negociables:** SIN Firebase, SIN MongoDB, SIN Supabase, SIN backend para historiales, SIN cuentas/login, SIN sincronización remota, SIN SDK de analítica, SIN anuncios, SIN envío de información infantil a servidores. Los registros personales se guardan solamente en **IndexedDB del navegador**, en el dispositivo del usuario.

## 1. Qué quiero construir

Una aplicación web progresiva (PWA) llamada **Vacunas Colombia**, de uso familiar, para **llevar control del esquema de vacunación de uno o varios niños en Colombia**.

El padre, madre o cuidador podrá:

1. Crear un perfil con **nombre o apodo** y **fecha de nacimiento** (sin apellidos ni número de documento obligatorio).
2. Seleccionar para cada niño entre **esquema tradicional (2, 4 y 6 meses)** y **esquema acortado (6, 12 y 18 semanas; referencias 1,5, 3 y 4,5 meses)** y ver **fechas orientativas** calculadas por nacimiento, según catálogos versionados del PAI colombiano.
3. Cambiar el esquema seleccionado sin borrar aplicaciones reales ya registradas; marcar las vacunas efectivamente aplicadas y registrar fecha real, marca y datos opcionales.
4. Consultar un **carné digital familiar** con el historial efectivamente registrado.
5. Ver vacunas próximas, pendientes y aplicadas en un dashboard sencillo.
6. Exportar el carné a PDF e importar/exportar una copia de seguridad local.
7. Instalar la aplicación como ícono en la pantalla de inicio y utilizarla sin conexión después de su primera carga completa.

**No es un sistema médico, una historia clínica ni una integración oficial con PAIWEB.** La aplicación ayuda a organizar información ingresada por la familia y no certifica la aplicación ni decide el esquema clínico individual.

## 2. Stack y arquitectura — implementar exactamente esto

- **Framework:** Next.js (App Router) + React + TypeScript.
- **Estilos/UI:** Tailwind CSS + shadcn/ui + lucide-react, diseño *mobile-first*.
- **Base de datos del usuario:** IndexedDB, usando **Dexie.js** (persistencia auténtica, no `localStorage` para el historial).
- **Fechas:** `date-fns`, en idioma español; persistir fechas civiles como `YYYY-MM-DD`, sin conversión a UTC que cambie de día.
- **Catálogo de vacunación:** archivos JSON o TypeScript locales en el proyecto; no requiere descargar datos de un servicio externo.
- **PWA:** manifest, íconos 192/512, service worker funcional, shell offline y pantalla offline de respaldo. Usar una integración actual y compatible con la versión de Next.js (por ejemplo Serwist, si encaja); no agregar backend de notificaciones.
- **Despliegue:** Vercel (preferiblemente rutas estáticas / exportación estática cuando sea compatible); la aplicación NO necesita API Routes, Server Actions ni funciones serverless para administrar perfiles o dosis.
- **PDF:** vista de impresión bien formateada (`window.print()` + CSS `@media print`) para guardar como PDF con capacidades nativas del dispositivo; no enviar información a servicios externos de conversión.
- **Pruebas:** Vitest para el cálculo de fechas y las reglas de correspondencia entre vacunas combinadas y requisitos del esquema.

**Arquitectura de datos:**

```text
                     Vercel
                HTML + JS + CSS
                       |
              descarga la PWA
                       v
              Navegador / PWA
               ├─ Dashboard
               ├─ Calendario PAI (Tradicional / Acortado)
               ├─ Carné digital
               ├─ Catálogo informativo local
               └─ IndexedDB (Dexie)
                   ├─ Perfiles infantiles + esquema elegido
                   ├─ Dosis aplicadas
                   └─ Preferencias locales

NO hay transmisión de nombres, fechas de nacimiento o vacunas
hacia Vercel, Firebase ni una base de datos externa.
```

El hosting necesariamente entrega archivos al navegador y puede procesar datos técnicos de conexión como IP; **no afirmar en la política que el sitio no trata absolutamente ningún dato técnico**. Asegurar, en cambio, que la aplicación **no envía al servidor los perfiles ni el historial vacunal**.

## 3. Alcance estricto del MVP

### 3.1 Primer uso: crear perfil

- Nombre visible de la aplicación en bienvenida, cabeceras, ícono, PDF y ajustes: **Vacunas Colombia**.
- Pantalla de bienvenida: "Organiza las vacunas de tu peque".
- Formulario mínimo: **nombre/apodo**, **fecha de nacimiento**, **selector de esquema** y botón **Comenzar**.
- **Selector obligatorio (shadcn Select o control segmentado):**
  - **Esquema tradicional (2, 4 y 6 meses)** — cadencia de referencia anterior para la serie primaria.
  - **Esquema acortado (6, 12 y 18 semanas)** — opción de referencia según lineamientos de 2026; mostrar también los nombres coloquiales 1,5 / 3 / 4,5 meses.
- Mostrar **acortado** como referencia de 2026, pero **no preseleccionar ningún esquema**: pedir elección consciente al crear cada perfil. No asignarlo automáticamente según el año de nacimiento.
- Añadir texto al lado del selector: **"Elige el esquema que te indicó tu vacunador. Las fechas son orientativas y las medidas pueden cambiar."**
- La selección es **independiente para cada perfil** y persiste en IndexedDB; no es una preferencia global.
- No solicitar correo, contraseña, documento, EPS, teléfono ni dirección.
- Permitir **varios perfiles** (por ejemplo, hermanos) y seleccionar perfil activo.
- Los datos no deben aparecer en la URL, cookies ni parámetros de red.
- No crear un perfil real de ejemplo al iniciar: si se desea mostrar datos de demostración, que sean **ficticios y separados**, nunca guardados automáticamente.

### 3.2 Pantalla Inicio / Dashboard

En móvil mostrar tarjetas compactas, con la información del perfil activo:

- Nombre/apodo y edad actual (años, meses y días o meses y días, según corresponda).
- **Esquema seleccionado (Tradicional o Acortado)**, **próxima fecha orientativa** y sus vacunas; acceso para cambiarlo en Ajustes.
- Conteo de requisitos **aplicados**, **próximos** y **pendientes/por revisar**.
- Progreso del calendario: porcentaje de requisitos programados hasta la edad actual que están registrados como cumplidos; explicar cómo se calcula y no presentar como porcentaje de "inmunidad".
- Lista de próximas vacunas en orden cronológico.
- Acción destacada **Registrar vacuna aplicada**.
- Aviso discreto: **"Fechas orientativas. Confirma el esquema con tu vacunador"**.

No colocar gráficas complicadas. Interfaz ligera, legible y útil en una pantalla pequeña.

### 3.3 Calendario

- Línea de tiempo generada **a partir del esquema elegido por ese perfil**:
  - Tradicional: nacimiento; serie primaria a **2, 4, 6 meses**; demás hitos compartidos según el catálogo de referencia vigente.
  - Acortado: nacimiento; serie primaria a **6, 12, 18 semanas** (etiquetas 1,5 / 3 / 4,5 meses); demás hitos compartidos según catálogo vigente.
  - Mostrar también hitos de **influenza (6 y 7 meses), fiebre amarilla (9 meses), 12 meses, 18 meses y 5 años** cuando correspondan a las reglas compartidas verificadas.
- Mostrar sobre la línea de tiempo un **selector visible Tradicional / Acortado**, conectado a la preferencia del perfil y sincronizado con Inicio y Ajustes; nunca un filtro meramente decorativo.
- Cada hito muestra: edad, fecha estimada, vacunas y sus dosis.
- Estados: **Aplicada**, **Próxima**, **Pendiente**, **Fecha pasada / por confirmar**. No mostrar "vencida" como si la dosis fuera necesariamente imposible de aplicar.
- Filtros **PAI**, **Complementarias** y **Todas**.
- Cada requisito abre detalle breve: enfermedad que previene, dosis correspondiente, cobertura PAI/particular, y fuentes del calendario.
- Si se cambia la fecha de nacimiento **o el esquema del perfil**, **recalcular solamente fechas proyectadas, listas de pendientes y progreso**; preservar intactas las aplicaciones históricas, sus fechas reales, marcas y lotes.
- Antes de cambiar el esquema, mostrar confirmación informativa: **"El calendario estimado cambiará; las vacunas que ya registraste permanecerán intactas."** Guardar selección y actualizar todas las vistas al confirmar.
- No mover automáticamente vacunas aplicadas a otro número de dosis o hito sin correspondencia segura; cualquier coincidencia dudosa debe quedar **"Por verificar con el vacunador"**.
- Si se selecciona el tradicional, mostrar nota discreta: **"Referencia de esquema tradicional; confirma con el vacunador si corresponde a tu hijo según los lineamientos actuales."**

### 3.4 Registrar dosis realmente aplicada

Formulario sencillo:

**Obligatorios:**
- Vacuna/producto o biológico registrado.
- Número de dosis / hito relacionado, cuando sea posible identificarlo.
- Fecha **real** de aplicación.

**Opcionales:**
- Marca comercial (ej. Hexaxim, Infanrix Hexa, Rotarix, RotaTeq).
- Lote.
- IPS o punto de vacunación.
- Tipo de acceso: **PAI gratuito**, **particular** o **desconocido**.
- ¿Figura en PAIWEB?: **Sí / No / No sé** (solo una declaración del usuario; sin conexión a PAIWEB).
- Observaciones breves.

Debe permitir **editar y eliminar** una dosis aplicada, con confirmación al eliminar. Guardar cada evento de aplicación **una sola vez**. No usar un simple booleano que borre datos importantes.

**Ejemplo importante de vacuna combinada:** una aplicación física de **hexavalente acelular** puede corresponder al requisito de pentavalente y al de polio IPV de una misma etapa. Contabilizar la cobertura de componentes sin duplicar la administración en el carné. Solo aplicar esta relación si el producto, la dosis y el hito tienen correspondencia fiable; ante dudas, mostrar **"por confirmar con el vacunador"** y dejar el registro editable.

**Rotavirus:** contemplar que productos de distintas marcas pueden tener esquemas distintos (por ejemplo, dos dosis frente a tres dosis). No añadir automáticamente una tercera dosis para todos los usuarios y no sugerir nuevas fechas de recuperación fuera de los límites de edad sin validación clínica.

### 3.5 Carné digital familiar

- Mostrar **solo aplicaciones efectivamente registradas**, en orden cronológico (más recientes primero, con opción de invertir).
- Datos visibles: vacuna, dosis, fecha real, marca, lote e IPS cuando estén informados.
- Botón **Imprimir / Guardar PDF**; diseño A4 imprimible, encabezado con apodo y fecha de nacimiento, tabla clara de aplicaciones y fecha de exportación.
- Incluir una leyenda visible en pantalla y PDF: **"Registro familiar no oficial. No reemplaza el carné de vacunación expedido por el prestador ni PAIWEB."**
- Los requisitos futuros no deben aparecer como si se hubieran aplicado.

### 3.6 Información

Vista de consulta simple, alimentada desde catálogo local:

- Qué es el PAI en Colombia.
- Diferencia descriptiva entre vacunas PAI y particulares.
- Explicación de qué significa una vacuna combinada (pentavalente/hexavalente).
- Explicación breve de por qué algunas vacunas varían por fabricante o por edad.
- Enlace visible a fuentes oficiales y **fecha de actualización del catálogo**.

No incorporar como verdades clínicas automáticas afirmaciones no verificadas del Excel: porcentajes de reducción de fiebre, intercambiabilidad universal, tratamientos, dosis de medicamentos, contraindicaciones absolutas ni comparaciones comerciales de eficacia. No incluir un chatbot médico.

### 3.7 Ajustes y respaldo

- Cambiar perfil y editar nombre/apodo, fecha de nacimiento y **esquema seleccionado (Tradicional / Acortado)** sin perder eventos aplicados.
- **Exportar respaldo JSON** con versión de formato; dejar claro que un JSON no cifrado contiene información privada y requiere guardarse con cuidado. Idealmente, implementar **respaldo cifrado con contraseña** mediante Web Crypto (AES-GCM y derivación de clave apropiada) sin enviar la contraseña o los datos al servidor; si impide completar el MVP, entregar respaldo JSON funcional con aviso explícito y dejar cifrado como mejora posterior, sin simular que está cifrado.
- **Importar respaldo**, validar el esquema antes de guardar, ofrecer previsualización y evitar duplicados por ID; ante conflicto preguntar si combinar o reemplazar, nunca sobrescribir silenciosamente.
- **Eliminar perfil**, con confirmación.
- **Borrar todos los datos locales**, con doble confirmación.
- Aviso de seguridad: los datos pueden perderse al borrar datos del navegador, desinstalar la PWA, cambiar de dispositivo, usar navegación privada o por políticas de almacenamiento del navegador. **Ofrecer copia de seguridad antes de acciones destructivas.**
- Solicitar almacenamiento persistente con `navigator.storage.persist()` cuando esté disponible, manejando rechazo o falta de soporte sin bloquear el uso. Esto reduce ciertos riesgos, pero **no garantiza permanencia**.

## 4. Dos esquemas seleccionables y catálogo Colombia (2026)

**El selector NO representa dos calendarios históricos completos e inmutables.** Distingue principalmente el ritmo de la **serie primaria** (2/4/6 meses frente a 6/12/18 semanas). Otras actualizaciones del PAI —como la SRP 2 a los 18 meses desde 2023 y fiebre amarilla desde 9 meses en la referencia de 2026— **tienen historias y fechas de adopción distintas** y no deben revertirse automáticamente al seleccionar "Tradicional".

### 4.1 Valores del selector y diferencias

| Elemento | Esquema tradicional | Esquema acortado (referencia 2026) |
|---|---|---|
| Identificador | `CO-PAI-PRIMARY-2-4-6` | `CO-PAI-PRIMARY-6-12-18-WEEKS-2026` |
| Etiqueta UI | **Tradicional (2, 4 y 6 meses)** | **Acortado (6, 12 y 18 semanas)** |
| Primera aplicación de la serie primaria | A los **2 meses calendario** | **6 semanas** desde el nacimiento (42 días) |
| Segunda aplicación de la serie primaria | A los **4 meses calendario** | **12 semanas** desde el nacimiento (84 días) |
| Tercera aplicación de la serie primaria | A los **6 meses calendario** | **18 semanas** desde el nacimiento (126 días) |
| Vacunas de referencia | Pentavalente / hexavalente cuando corresponda, IPV y vacunas administradas simultáneamente según lineamientos | Las mismas categorías, con edades de la serie primaria adelantadas conforme a los lineamientos aplicables |
| Refuerzos DPT/polio | Referencias a los **18 meses y 5 años** | **Iguales**, sujetos al catálogo oficial vigente |

- Los hitos acortados deben expresarse como **semanas exactas**, porque el lineamiento los define como intervalos de **6 semanas**; **NO usar `+1 mes +15 días`, `+3 meses` ni `+4 meses +15 días` como equivalencias matemáticas**. Las etiquetas "1,5 / 3 / 4,5 meses" son comunicacionales.
- Para tradicional, usar `addMonths` con normalización al final del mes. Para acortado, usar **`addDays(fechaNacimiento, 42/84/126)`** en fechas civiles.
- La selección no implica que ambos modos tengan igual vigencia clínica. El **esquema acortado está descrito como transitorio ante el brote de tosferina**, y corresponde al vacunador determinar cuál usar en cada caso.
- El selector es un **modo de organización y comparación**, no una orden médica. Si ya existe un esquema parcial o atraso, no calcular recuperación ni reprogramar dosis basándose solo en el modo elegido.

### 4.2 Hitos compartidos y vacuna por vacuna

Las siguientes edades **no deben intercambiarse de forma indiscriminada** al modificar el selector de serie primaria. Se gestionan en un **catálogo común de referencia con fuente y fecha de vigencia**, y solo se muestran cuando apliquen:

| Hito común | Requisitos orientativos / notas |
|---|---|
| Al nacer | BCG y hepatitis B neonatal |
| 6 y 7 meses | Influenza estacional, de acuerdo con elegibilidad y separación entre dosis; verificar lineamientos actuales |
| 9 meses | Fiebre amarilla conforme a reglas vigentes, evaluación clínica y contexto individual |
| 12 meses | SRP 1, varicela 1, neumococo de refuerzo, hepatitis A |
| 18 meses | Refuerzos de DPT/polio y SRP 2 cuando corresponda |
| 5 años | DPT/polio y varicela cuando correspondan; **no duplicar SRP 2** ya aplicada |

**Nota histórica verificada:** el documento técnico del MinSalud de enero de 2026 indica que la **segunda dosis de SRP se administra a los 18 meses desde el 1 de enero de 2023**. Por tanto, no es correcto asignar SRP 2 a los cinco años solo por escoger la serie primaria "tradicional". Asimismo, fiebre amarilla tiene ajustes que no coinciden necesariamente con el momento del cambio de la serie primaria. Una tabla antigua del Excel puede documentar prácticas de otra fecha, pero **no sustituye los lineamientos actuales**.

**Complementarias:** permitir buscar y registrar productos particulares (incluidas hexavalentes, meningococo y rotavirus de dos o tres dosis), sin convertir automáticamente en "obligatorias" todas las vacunas del catálogo. La correspondencia de un producto combinado con requisitos debe basarse en componentes y dosis verificadas, sin duplicar aplicaciones.

**Alertas de seguridad clínica:**

1. La "dosis cero" para sarampión de los 6 a 11 meses es una medida temporal adicional; no reemplaza SRP 1 o SRP 2.
2. La elegibilidad de hexavalente PAI es específica; no afirmar cobertura pública universal.
3. Rotavirus varía por producto, límites de edad y dosis. No crear automáticamente esquemas de recuperación sin validación clínica.
4. Dosis atrasadas, intervalos mínimos, prematuridad, indicaciones regionales y cambios de fabricante requieren valoración del profesional; mostrar **"Consulta al vacunador para confirmar la programación"**.
5. Ninguna fecha calculada constituye una orden de vacunación ni una certificación clínica. Mostrar siempre el esquema elegido y la versión del catálogo.

### 4.3 Implementación versionada

Mantener **tres módulos independientes**, para evitar mezclar una selección familiar con cambios normativos:

```text
src/data/catalog/primary-traditional-2-4-6.ts
src/data/catalog/primary-shortened-6-12-18-weeks-2026.ts
src/data/catalog/shared-requirements-co-2026-10.ts
src/data/catalog/products.ts
```

Los IDs de los requisitos deben mantenerse **estables en ambos modos** (ej. `dtp-1`, `dtp-2`, `dtp-3`, `ipv-1`), y el hito/fecha de previsión debe ser una propiedad del esquema, no parte de la identidad de la vacuna aplicada. Mantener el `referenceCatalogVersion` aparte del `primaryScheduleId`. Al actualizar el catálogo en el futuro, no modificar registros históricos ni sobrescribir la selección del padre.

### 4.4 Fuentes oficiales para codificar y mantener la referencia

- MinSalud — Menores de seis años (referencia vigente): https://vacunacion.minsalud.gov.co/EV/Paginas/ninos-y-ninas-menores-de-6-anos.aspx
- MinSalud — Lineamientos técnicos PAI (incluye acortamiento): https://vacunacion.minsalud.gov.co/RT/Paginas/lineamientos-tecnicos.aspx
- MinSalud — Primera jornada nacional de vacunación 2026, pp. 27-30 (esquema tradicional frente al acortado; medidas transitorias; SRP desde 2023): https://www.minsalud.gov.co/sites/rid/Lists/BibliotecaDigital/RIDE/VS/PP/PAI/lineamientos-t%C3%A9cnicos-primera-jornada-nacional-vacunaci%C3%B3n-2026.pdf
- MinSalud — Comunicación de enero 2026: https://www.minsalud.gov.co/Comunicaciones/noticias/2026/Paginas/234-mil-personas-seran-vacunadas-en-enero-2026.aspx
- MinSalud — Dosis cero sarampión 2026: https://www.minsalud.gov.co/Comunicaciones/noticias/2026/Paginas/dosis-cero.aspx

**Fecha de revisión de esta especificación: 16 de octubre de 2026.** El catálogo y la vigencia de medidas transitorias deben revisarse antes de publicación y en actualizaciones posteriores. Los modos no reemplazan las indicaciones de una IPS o del vacunador.

## 5. Datos del Excel adjunto: qué aprovechar y qué NO

El archivo de referencia se llama **`Esquema de Vacunacion Colombia - PAI, Vacunas Acelulares, Tarifas y Puntos de Atencion.xlsx`**. Tiene estas hojas:

- `Esquema PAI Estado`: categorías, enfermedades prevenibles y base para modo **Tradicional 2/4/6**; **revisar hitos desactualizados** y no copiar automáticamente su fiebre amarilla a 18 meses ni su SRP 2 a 5 años como reglas actuales.
- `Vacunas Acelulares y Privadas`: nombres comerciales, categorías y composición; usar como **punto de partida**, no como prescripción clínica.
- `Rastreador Vacunal`: inspiración para campos de carné y registro real (fecha, marca, lote, IPS, PAIWEB, notas); **no utilizar la fecha de nacimiento ni los datos de ejemplo que ya existan en la hoja**.
- `Comparativa_Marcas`: vocabulario de marcas; **no copiar afirmaciones absolutas sobre equivalencias**.
- `Guia y Recomendaciones`, `Cuidados y Urgencias`, `Seguridad Vacunacion`: solo información verificable con fuentes clínicas oficiales; no incluir recomendaciones de fármacos en el MVP.
- `Tarifas y Costos`, `Puntos Atencion Ciudades`, `Vacunacion en EPS`, `Simulador presupuesto`: **fuera del MVP**; son datos cambiantes y no necesarios para un carné sencillo.

Si v0 no puede leer el Excel, **el texto de esta especificación debe ser suficiente para construir el MVP**. No bloquear el trabajo por el Excel.

## 6. Modelo de IndexedDB y reglas

Utilizar **Dexie.js**, con tablas locales y migraciones versionadas:

```ts
type ChildProfile = {
  id: string;               // UUID local
  nickname: string;
  birthDate: string;        // YYYY-MM-DD, fecha civil
  country: 'CO';
  primaryScheduleId: 'CO-PAI-PRIMARY-2-4-6' | 'CO-PAI-PRIMARY-6-12-18-WEEKS-2026';
  referenceCatalogVersion: string;  // p. ej. CO-PAI-SHARED-2026-10
  createdAt: string;
  updatedAt: string;
};

type VaccineAdministration = {
  id: string;               // UUID local
  childId: string;
  productId: string;        // estable en catálogo
  productName: string;      // nombre capturado, por trazabilidad
  appliedDate: string;     // fecha REAL YYYY-MM-DD
  doseNumber?: number;
  milestoneId?: string;
  coveredRequirementIds: string[];
  brand?: string;
  lot?: string;
  provider?: string;
  accessType: 'pai' | 'private' | 'unknown';
  paiwebStatus: 'yes' | 'no' | 'unknown';
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

type LocalPreference = {
  key: string;
  value: unknown;
};
```

**No almacenar solamente el estado visual de cada vacuna.** El estado se deriva cruzando requisitos del catálogo y aplicaciones registradas. Usar las dosis aplicadas como fuente de verdad. La cobertura `coveredRequirementIds` debe representar correspondencias válidas, no asumir que cualquier producto de la misma categoría cubre cualquier número de dosis.

Catálogos locales diferenciados y motor de programación:

```text
src/data/catalog/primary-traditional-2-4-6.ts
src/data/catalog/primary-shortened-6-12-18-weeks-2026.ts
src/data/catalog/shared-requirements-co-2026-10.ts
src/data/catalog/products.ts
src/lib/schedule/calculateSchedule.ts
src/lib/schedule/resolveCoverage.ts
src/lib/db.ts
src/lib/backup.ts
```

La lógica carga el modo a partir de `ChildProfile.primaryScheduleId` para el perfil activo. Al cambiarlo, persistir la opción por niño y recomputar la vista; **jamás migrar ni cambiar fechas de eventos aplicados**. El respaldo JSON debe conservar `primaryScheduleId`. En las migraciones de perfiles creados antes de añadir el selector, asignar modo solo después de solicitar confirmación a la persona usuaria (no adivinar).

### Lógica de fechas

- Generar fechas orientativas por **fecha de nacimiento**, **esquema primario seleccionado**, **hito** y **versión del catálogo compartido**.
- Usar fechas civiles, sin desfases por huso horario o horario de verano.
- Para edades expresadas en meses enteros, sumar meses calendario conservando el día cuando exista y ajustando el último día cuando no exista (ejemplo: 31 de enero + 1 mes → último día de febrero).
- Para el **esquema acortado**, contar 42/84/126 días desde la fecha civil de nacimiento (6/12/18 semanas), mostrando **"fecha orientativa"**. No usar aproximaciones basadas en meses fraccionarios. Para el **tradicional**, usar 2/4/6 meses calendario.
- Si una aplicación fue registrada tarde, **no generar automáticamente un esquema de rescate clínico** basándose solo en aritmética; indicar "confirma la próxima fecha con el vacunador".
- Ante una dosis capturada con fecha futura, pedir confirmación o rechazarla como dosis "aplicada".
- Determinar la fecha de hoy en el navegador; nunca usar fechas fijas codificadas.

## 7. Privacidad, seguridad y manejo responsable

- Historial y perfiles en IndexedDB, **solo cliente**. No importar la base de datos en código ejecutado del lado servidor.
- **No Firebase / no cuentas / no endpoints / no cargas de archivos a terceros**.
- No usar Google Analytics, Vercel Analytics, Sentry, publicidad, mapas, cookies de seguimiento, autenticación ni fuentes remotas que no sean necesarias para el funcionamiento.
- Evitar exponer nombre/fecha/observaciones en la URL, `console.log`, mensajes de error, métricas o caché de Service Worker. El service worker cachea **recursos de la aplicación**, no información clínica.
- No guardar datos sensibles en `localStorage` o `sessionStorage`; IndexedDB es el almacén principal. Evitar variables públicas de configuración con secretos (no son necesarios).
- Implementar cabeceras de seguridad apropiadas y minimizar dependencias de terceros. No utilizar `dangerouslySetInnerHTML` con notas ingresadas por los usuarios.
- Una sección "Privacidad" debe explicar en español: qué se guarda, dónde, cómo se elimina, cómo funciona el respaldo y que borrar datos del navegador o cambiar de dispositivo puede causar pérdida irreversible. No presentar almacenamiento local como anonimización ni exención legal absoluta.
- No es necesario pedir una aceptación de "tratamiento en la nube" porque el MVP no envía historiales al desarrollador; ofrecer aviso claro del almacenamiento local y consentimiento del usuario para comenzar a registrar. Esto **no sustituye revisión legal** si en el futuro se añaden servidores o recopilación de datos.
- **Nunca subir el Excel del usuario a un backend**. El Excel es referencia de desarrollo, no fuente de datos privados a almacenar.

## 8. PWA en iOS y Android

- `manifest` con **`name: "Vacunas Colombia"`**, **`short_name: "Vacunas CO"`**, `display: standalone`, `start_url`, tema e íconos correctos; metadata del documento, nombre del PDF, textos y README coherentes con **Vacunas Colombia**.
- Compatible con HTTPS (Vercel) y usable al instalar en pantalla de inicio.
- En iOS mostrar instrucciones contextuales para Safari: compartir → agregar a pantalla de inicio. En Android ofrecer botón nativo de instalación **solamente si** el navegador expone `beforeinstallprompt`; de lo contrario mostrar instrucciones, no un botón roto.
- Funciones centrales (crear perfil, registrar dosis, ver calendario y carné) deben funcionar offline después de la carga inicial y el almacenamiento del catálogo.
- No intentar notificaciones push automáticas en este MVP: el envío de push requiere infraestructura y puede complicar el objetivo de cero backend. Si se desea recordar una cita, implementar **"Añadir al calendario"** descargando un archivo `.ics` generado localmente tras acción del usuario, con texto genérico y advertencia de que el calendario del teléfono podría sincronizarse con iCloud/Google.
- Verificar que las actualizaciones de PWA no borren los registros locales; migraciones de Dexie cuidadosas.

## 9. Estilo y pantallas

Idioma: **español de Colombia**. Tono cercano pero profesional, sin lenguaje clínico alarmista.

**Navegación inferior en móvil:**

1. **Inicio** — resumen y próxima vacuna.
2. **Calendario** — esquema por edad y fechas.
3. **Carné** — aplicaciones reales y exportar PDF.
4. **Información** — explicaciones y fuentes.
5. **Ajustes** — perfiles, copias y privacidad.

**Estética:** fondo claro, colores suaves (azul petróleo / verde agua o turquesa), cards sencillas, estados con texto y color, botones grandes, excelente contraste y tipografía legible. Diseño tipo app de salud familiar, sin parecer una historia clínica compleja. Soportar dispositivos pequeños.

**UX importante:**
- Formularios con validación y mensajes de error útiles.
- Indicar claramente qué datos son opcionales.
- Mostrar estados vacíos reales ("Aún no has registrado vacunas").
- No mostrar datos falsos como si fueran reales.
- Confirmar acciones destructivas; mostrar estado persistido al reabrir/reiniciar la página.
- Accesibilidad: labels, teclado, tamaños táctiles adecuados, `aria-label` donde corresponda.

## 10. Criterios de aceptación obligatorios

El MVP está terminado solo si se cumplen estas pruebas:

1. Abro **Vacunas Colombia** por primera vez: está vacía y me pide apodo + nacimiento + selector Tradicional/Acortado.
2. Creo el perfil **"Luna"** con nacimiento ficticio **2026-01-31** y elijo **Acortado**: aparecen las tres fechas de referencia 2026-03-14, 2026-04-25 y 2026-06-06 (42/84/126 días) sin registrarme.
3. Cambio **Luna** a **Tradicional**: sus tres fechas principales pasan a 2026-03-31, 2026-05-31 y 2026-07-31 (2/4/6 meses calendario). Revierto a Acortado y recupero las fechas originales.
4. Registro una aplicación antes de cambiar de esquema: después del cambio el carné sigue mostrando **exactamente el mismo evento y fecha real**, sin alteraciones ni duplicación.
5. Creo otro perfil con esquema distinto: cada uno recuerda independientemente su esquema después de recargar o reiniciar la PWA.
6. El esquema orientativo para este perfil incluye **fiebre amarilla a los 9 meses** y **SRP 2 a los 18 meses** según catálogo 2026, sin duplicar SRP 2 a los cinco años.
7. Registro una aplicación real de hexavalente: el carné muestra **un solo evento**; los requisitos cubiertos del hito pueden marcarse cumplidos si existe correspondencia válida.
8. Registro una vacuna de rotavirus particular de tres dosis: no se marca automáticamente como aplicada la tercera dosis cuando solo se han ingresado dos eventos.
9. Cambio entre dos perfiles: sus aplicaciones no se mezclan.
10. Recargo la página y cierro/abro la PWA: los datos siguen guardados en IndexedDB.
11. Exporto el carné como PDF: no aparecen vacunas pendientes como aplicadas, se imprime la fecha real y la advertencia "no oficial".
12. Exporto e importo un respaldo: recupero todos los perfiles y aplicaciones, sin generar duplicados ni corromper las fechas.
13. Elimino un perfil: desaparecen sus dosis mediante borrado local correctamente confirmado.
14. Con la PWA previamente cargada, activo modo avión: dashboard, calendario, carné y registro local siguen funcionando.
15. No existen llamadas a Firebase ni envíos al servidor con apodo, fecha de nacimiento o historial. Revisar la pestaña Network y configuración de dependencias.
16. Los componentes se renderizan sin errores de hidratación de Next.js, incluidos IndexedDB y APIs del navegador.
17. La instalación se explica correctamente para iOS y Android y la aplicación tiene íconos válidos.

**Pruebas unitarias mínimas:** fechas para 29/30/31, año bisiesto, cálculo exacto de 42/84/126 días frente a 2/4/6 meses, conmutación de esquemas por perfil sin perder dosis, recarga sin desfase de día, ausencia de doble conteo hexavalente, rotavirus de dos/tres dosis, migración del catálogo sin alterar administraciones históricas.

## 11. Qué debe entregar v0

Implementa el proyecto y entrega:

1. Código fuente funcional, no solo pantallas bonitas.
2. `README.md` con instalación, desarrollo, pruebas y despliegue en Vercel.
3. `manifest`, íconos, service worker y estrategia offline.
4. **Dos esquemas primarios seleccionables** y **un catálogo común versionado** con enlaces a fuentes oficiales y reglas de cambio sin pérdida de datos.
5. Dexie.js con esquema/migraciones y CRUD completo.
6. Exportación/importación de respaldo y vista de impresión/PDF.
7. Pruebas del cálculo de fechas y cobertura de vacunas combinadas.
8. Sin secretos ni claves de Firebase, porque **no se necesita ningún backend de usuarios**.

**Prioridad de implementación:**

`Perfil + selector por niño → dos esquemas versionados + catálogo común → registro de dosis → dashboard → carné/PDF → respaldo → PWA/offline → pruebas/documentación`.

**NO construir por ahora:** comparación de precios de Cajasan/Comfenalco, directorio de IPS, cuentas, sincronización entre padres, vacunas para adultos, pagos, monetización, sistema de recetas, carga de imágenes del carné, OCR, chat médico, notificaciones push programadas ni sistema de administración de usuarios.

> **Instrucción final:** Si algún detalle de la normativa vacunal o una equivalencia entre productos no puede verificarse, no inventes una regla clínica. Implementa el dato como configurable y muéstralo como "pendiente de validación con el vacunador". La función principal debe ser una agenda y un carné familiar privado, ligero y útil con selección Tradicional/Acortado por niño. **La selección no debe causar pérdida ni alteración de aplicaciones reales registradas**.
