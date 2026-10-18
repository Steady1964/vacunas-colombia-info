export function PrivacyNotice() {
  return (
    <section className="card">
      <h2>Privacidad y cuidado de tus datos</h2>
      <p>
        Guardamos apodos, fechas de nacimiento, esquema elegido y aplicaciones
        (producto, fecha, marca, lote, IPS, acceso, PAIWEB y observaciones) en
        IndexedDB de este navegador y dispositivo. No pedimos cuentas ni
        enviamos el historial a un servidor. No hay sincronización entre
        dispositivos.
      </p>
      <p>
        Quien tenga acceso a este navegador puede consultar la información. Usa
        un apodo y evita documentos o información innecesaria en observaciones.
        El respaldo JSON contiene información privada{' '}
        <strong>sin cifrar</strong>: guárdalo en un lugar seguro y compártelo
        solo conscientemente.
      </p>
      <p>
        Los datos pueden perderse al borrar datos del navegador, desinstalar la
        aplicación, cambiar de dispositivo o por decisiones de almacenamiento
        del sistema. Pedir almacenamiento persistente no garantiza permanencia.
        Haz copias de respaldo y conserva el carné expedido por tu prestador.
      </p>
      <p>
        En Ajustes puedes eliminar una aplicación, un perfil con sus
        aplicaciones o todos los datos familiares mediante confirmación. Esto no
        elimina las copias que hayas descargado: debes borrarlas por separado.
        La caché del shell permite usar la app offline después de su descarga;
        no contiene respaldos ni historiales familiares.
      </p>
      <p>
        El alojamiento puede procesar datos técnicos necesarios para servir la
        web, como dirección IP y solicitudes de recursos. No prometemos
        anonimización absoluta. No incorporamos publicidad, analítica,
        notificaciones push ni SDK de seguimiento. Los enlaces de fuentes abren
        sitios externos sujetos a sus propias políticas; no les adjuntamos
        información familiar.
      </p>
    </section>
  );
}
