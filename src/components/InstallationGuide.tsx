'use client';

import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

export function InstallationGuide() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" className="btn secondary">
          Cómo instalar la aplicación
        </Button>
      </DialogTrigger>
      <DialogContent className="information-dialog">
        <DialogHeader>
          <DialogTitle>Instalar Vacunas Colombia</DialogTitle>
          <DialogDescription>
            Elige tu dispositivo para consultar los pasos. Los nombres de los
            menús pueden variar según la versión del navegador.
          </DialogDescription>
        </DialogHeader>
        <div className="information-sections dialog-body">
          <details className="information-section">
            <summary>iPhone o iPad · Safari</summary>
            <div className="information-section-body">
              <ol className="list-decimal space-y-3 pl-6">
                <li>Abre Vacunas Colombia en Safari.</li>
                <li>
                  Abre el menú de la página y toca Compartir, o toca Compartir
                  directamente si aparece en la barra de Safari.
                </li>
                <li>
                  Elige Añadir a pantalla de inicio. Si no aparece, busca Editar
                  acciones en la lista de Compartir y añade esa acción.
                </li>
                <li>
                  Si se ofrece Abrir como app web, actívalo. Confirma con
                  Añadir.
                </li>
                <li>
                  Abre Vacunas Colombia desde su icono en la pantalla de inicio.
                </li>
              </ol>
              <p>
                <a
                  href="https://support.apple.com/es-es/guide/iphone/iphea86e5236/ios"
                  target="_blank"
                  rel="noreferrer"
                >
                  Guía oficial de Apple para iPhone (abre otra pestaña)
                </a>
              </p>
            </div>
          </details>
          <details className="information-section">
            <summary>Android · Chrome</summary>
            <div className="information-section-body">
              <ol className="list-decimal space-y-3 pl-6">
                <li>Abre Vacunas Colombia en Chrome.</li>
                <li>Abre Más, el menú de los tres puntos.</li>
                <li>
                  Elige Instalar y crear acceso directo y luego Instalar. En
                  versiones anteriores puede aparecer Agregar a pantalla de
                  inicio.
                </li>
                <li>Sigue la confirmación que aparezca en pantalla.</li>
                <li>Busca el icono de Vacunas Colombia para abrirla.</li>
              </ol>
              <p>
                <a
                  href="https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DAndroid&hl=es-419"
                  target="_blank"
                  rel="noreferrer"
                >
                  Guía oficial de Chrome para Android (abre otra pestaña)
                </a>
              </p>
            </div>
          </details>
          <details className="information-section">
            <summary>PC · Chrome o Microsoft Edge</summary>
            <div className="information-section-body">
              <ol className="list-decimal space-y-3 pl-6">
                <li>Abre Vacunas Colombia en Chrome o Microsoft Edge.</li>
                <li>
                  En Chrome, abre Más → Enviar, guardar y compartir → Instalar
                  página como aplicación. También puedes usar el icono de
                  instalación de la barra de direcciones, si aparece.
                </li>
                <li>
                  En Edge, usa el aviso o icono de instalación, si aparece. Como
                  alternativa, abre Configuración y más → Más herramientas →
                  Aplicaciones → Instala este sitio como una aplicación.
                </li>
                <li>
                  Confirma la instalación y sigue las opciones que muestre tu
                  navegador para abrir la aplicación.
                </li>
              </ol>
              <p>
                <a
                  href="https://support.google.com/chrome/answer/9658361?hl=es"
                  target="_blank"
                  rel="noreferrer"
                >
                  Guía oficial de Chrome para PC (abre otra pestaña)
                </a>
              </p>
              <p>
                <a
                  href="https://support.microsoft.com/es-es/edge/install-manage-or-uninstall-apps-in-microsoft-edge"
                  target="_blank"
                  rel="noreferrer"
                >
                  Guía oficial de Microsoft Edge (abre otra pestaña)
                </a>
              </p>
            </div>
          </details>
          <p>
            Estas instrucciones forman parte de la aplicación y se pueden leer
            sin conexión cuando su uso offline esté preparado. Los enlaces
            oficiales son complementarios y requieren conexión.
          </p>
          <p>
            Instalar no sincroniza tus registros ni garantiza el uso sin
            conexión: consulta el estado de preparación en la aplicación. Los
            datos se guardan localmente; crea un respaldo antes de cambiar de
            navegador o dispositivo y restáuralo en el destino.
          </p>
          <p>
            Si no encuentras una opción de instalación, puedes seguir usando la
            aplicación en una pestaña. La disponibilidad depende del navegador y
            su versión; instalar no es obligatorio.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
