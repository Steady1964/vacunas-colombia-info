export default function OfflinePage() {
  return (
    <main className="wrap" style={{ maxWidth: 620, paddingTop: 64 }}>
      <section className="card">
        <h1 style={{ fontSize: 32 }}>Vacunas Colombia sin conexión</h1>
        <p>Si ya completaste la primera carga, puedes volver a Inicio para consultar tu calendario y usar el carné local.</p>
        <p>Si el navegador eliminó los recursos de la aplicación o esta es tu primera visita, necesitarás conexión para descargarlos otra vez. No borres tus datos del navegador: tus registros familiares pueden seguir guardados en el dispositivo.</p>
        <a className="btn" href="/">Volver a Inicio</a>
      </section>
    </main>
  )
}
