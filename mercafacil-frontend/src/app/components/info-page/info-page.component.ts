import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

interface FaqItem { q: string; a: string; }
interface Section { title: string; text?: string; items?: FaqItem[]; bullets?: string[]; }
interface PageContent { title: string; subtitle: string; sections: Section[]; }

const PAGES: Record<string, PageContent> = {
  ayuda: {
    title: 'Ayuda y FAQ',
    subtitle: 'Resolvemos tus dudas sobre MercaFácil',
    sections: [
      {
        title: '¿Cómo funciona MercaFácil?',
        items: [
          { q: '¿Qué es MercaFácil?', a: 'MercaFácil es una plataforma centralizada que agrupa todos los comercios de Jaén Plaza. Puedes buscar productos, comparar precios entre tiendas y hacer tu pedido desde un único lugar, recibiéndolo en la puerta de tu casa.' },
          { q: '¿Necesito registrarme para comprar?', a: 'Sí, es necesario crear una cuenta de cliente para poder añadir productos al carrito y finalizar pedidos. El registro es gratuito y solo tarda unos segundos.' },
          { q: '¿Los precios son exactos?', a: 'Los precios se actualizan diariamente. Puede haber diferencias puntuales con el precio en tienda física. En caso de discrepancia, prevalece el precio mostrado en el momento de la confirmación del pedido.' },
          { q: '¿Puedo comprar en varias tiendas a la vez?', a: 'Sí. El carrito admite productos de diferentes tiendas del centro comercial. Tu pedido se prepara y entrega de forma conjunta.' },
        ]
      },
      {
        title: 'Pedidos y pagos',
        items: [
          { q: '¿Cómo puedo ver el estado de mi pedido?', a: 'Accede a "Mis pedidos" desde el menú superior. Allí verás el historial completo y, para pedidos en curso, podrás seguir la ubicación del repartidor en tiempo real en el mapa.' },
          { q: '¿Qué métodos de pago se aceptan?', a: 'Actualmente aceptamos pago con tarjeta de crédito o débito (Visa, Mastercard). El pago se simula de forma segura en la plataforma.' },
          { q: '¿Puedo cancelar un pedido?', a: 'Puedes cancelar un pedido mientras esté en estado "Pendiente". Una vez que el vendedor comienza la preparación, ya no es posible cancelarlo. Contacta con soporte en caso de duda.' },
        ]
      },
      {
        title: 'Cuenta y acceso',
        items: [
          { q: '¿Cómo cambio mi contraseña?', a: 'Actualmente el cambio de contraseña se gestiona a través del servicio de soporte. Escríbenos a soporte@mercafacil.es indicando tu correo de registro.' },
          { q: '¿Cómo elimino mi cuenta?', a: 'Para eliminar tu cuenta y todos tus datos, envía una solicitud a privacidad@mercafacil.es. Tramitaremos la baja en un plazo máximo de 30 días.' },
        ]
      }
    ]
  },

  devoluciones: {
    title: 'Política de Devoluciones',
    subtitle: 'Tu satisfacción es nuestra prioridad',
    sections: [
      {
        title: 'Plazo y condiciones generales',
        text: 'Tienes 14 días naturales desde la recepción del pedido para solicitar la devolución de cualquier artículo, sin necesidad de justificación, conforme a la normativa europea de comercio electrónico (Directiva 2011/83/UE).',
        bullets: [
          'El artículo debe estar en su estado original, sin usar, con etiquetas y embalaje original.',
          'Los artículos personalizados o fabricados a medida no son retornables.',
          'Los productos de alimentación abiertos no son retornables por razones de higiene.',
          'Los artículos de software, juegos o películas con el precinto roto no son retornables.',
        ]
      },
      {
        title: 'Cómo iniciar una devolución',
        text: 'Para tramitar tu devolución sigue estos pasos:',
        bullets: [
          'Accede a "Mis pedidos" y selecciona el pedido que contiene el artículo a devolver.',
          'Haz clic en "Solicitar devolución" e indica el motivo.',
          'Recibirás un correo electrónico con las instrucciones de recogida en un plazo de 48 h.',
          'Una vez recibido y verificado el artículo, procesaremos el reembolso.',
        ]
      },
      {
        title: 'Reembolsos',
        text: 'El reembolso se realiza por el mismo medio de pago utilizado en la compra. El plazo habitual es de 5 a 10 días hábiles desde que recibimos el artículo devuelto. Los gastos de envío originales no se reembolsan salvo que la devolución sea por un error nuestro o un artículo defectuoso.'
      },
      {
        title: 'Artículos defectuosos o incorrectos',
        text: 'Si recibes un artículo en mal estado o diferente al pedido, contáctanos en un plazo de 48 horas desde la recepción a través del formulario de contacto o en soporte@mercafacil.es. Gestionaremos la recogida y el reembolso completo (incluidos gastos de envío) sin coste alguno para ti.'
      }
    ]
  },

  contacto: {
    title: 'Contacto',
    subtitle: 'Estamos aquí para ayudarte',
    sections: [
      {
        title: 'Información de contacto',
        bullets: [
          'Email de soporte: soporte@mercafacil.es',
          'Email de facturación: facturacion@mercafacil.es',
          'Teléfono de atención al cliente: +34 953 000 000',
          'Horario: Lunes a Viernes, de 9:00 a 20:00 h',
        ]
      },
      {
        title: 'Dónde estamos',
        text: 'MercaFácil opera desde Jaén Plaza, uno de los principales centros comerciales de la ciudad. Puedes encontrarnos en:',
        bullets: [
          'Jaén Plaza — Paraje de las Lagunillas, 23009 Jaén',
          'Coordenadas: 37.7906159, -3.7740386',
          'Acceso por la A-316 desde el centro de Jaén',
        ]
      },
      {
        title: 'Formulario de contacto',
        text: 'Para cualquier consulta, escríbenos a soporte@mercafacil.es indicando tu nombre, correo de registro y una descripción detallada de tu consulta. Nuestro equipo te responderá en un plazo máximo de 24 horas en días laborables.'
      },
      {
        title: 'Incidencias con pedidos',
        text: 'Si tu consulta está relacionada con un pedido activo, puedes usar el chat integrado en "Mis pedidos" para comunicarte directamente con el repartidor o con el vendedor. Es la vía más rápida para resolver incidencias en tiempo real.'
      }
    ]
  },

  terminos: {
    title: 'Términos de Uso',
    subtitle: 'Condiciones generales de uso de la plataforma MercaFácil',
    sections: [
      {
        title: '1. Objeto y aceptación',
        text: 'Los presentes Términos de Uso regulan el acceso y la utilización de la plataforma MercaFácil, gestionada por el centro comercial Jaén Plaza. Al registrarte o utilizar los servicios de MercaFácil, aceptas expresamente estas condiciones en su totalidad. Si no estás de acuerdo con alguno de los términos, debes abstenerte de usar la plataforma.'
      },
      {
        title: '2. Registro y cuenta de usuario',
        bullets: [
          'El registro es gratuito y requiere facilitar datos verídicos, completos y actualizados.',
          'Eres responsable de mantener la confidencialidad de tus credenciales de acceso.',
          'Cada usuario puede disponer únicamente de una cuenta activa.',
          'MercaFácil se reserva el derecho de suspender cuentas que incumplan estas condiciones.',
        ]
      },
      {
        title: '3. Uso permitido del servicio',
        text: 'MercaFácil es una plataforma de compra destinada exclusivamente a consumidores finales. Queda prohibido:',
        bullets: [
          'Realizar compras con fines de reventa comercial sin autorización expresa.',
          'Usar herramientas automatizadas (bots, scrapers) para acceder a la plataforma.',
          'Intentar acceder a áreas restringidas o cuentas de otros usuarios.',
          'Publicar o transmitir contenido ilícito, ofensivo o que vulnere derechos de terceros.',
        ]
      },
      {
        title: '4. Precios y disponibilidad',
        text: 'Los precios mostrados incluyen IVA y son orientativos. MercaFácil no garantiza la disponibilidad permanente de los productos. En caso de que un artículo no esté disponible tras la confirmación del pedido, nos pondremos en contacto contigo para ofrecer alternativas o proceder al reembolso.'
      },
      {
        title: '5. Limitación de responsabilidad',
        text: 'MercaFácil actúa como intermediario entre los comercios del centro comercial y el usuario final. No somos responsables de los retrasos o incidencias derivados de causas de fuerza mayor, ni de la calidad de los productos, que es responsabilidad de cada tienda vendedora.'
      },
      {
        title: '6. Modificaciones',
        text: 'MercaFácil se reserva el derecho de modificar estos Términos de Uso en cualquier momento. Los cambios se comunicarán a través de la plataforma o por correo electrónico con una antelación mínima de 15 días. El uso continuado del servicio tras la entrada en vigor de los cambios implica su aceptación.'
      },
      {
        title: '7. Legislación aplicable',
        text: 'Estos Términos se rigen por la legislación española. Para cualquier controversia, las partes se someten a los Juzgados y Tribunales de Jaén, salvo que la normativa vigente establezca un fuero imperativo diferente.'
      }
    ]
  },

  privacidad: {
    title: 'Política de Privacidad',
    subtitle: 'Cómo tratamos tus datos personales',
    sections: [
      {
        title: '1. Responsable del tratamiento',
        text: 'El responsable del tratamiento de los datos personales recogidos a través de MercaFácil es Jaén Plaza S.L., con CIF ficticio B23000000, domicilio social en Paraje de las Lagunillas s/n, 23009 Jaén. Correo de contacto: privacidad@mercafacil.es.'
      },
      {
        title: '2. Datos que recopilamos',
        bullets: [
          'Datos de registro: nombre, correo electrónico y contraseña (almacenada cifrada).',
          'Datos de pedido: dirección de envío, artículos comprados e historial de transacciones.',
          'Datos de ubicación (solo repartidores): coordenadas GPS transmitidas durante una entrega activa, no almacenadas de forma permanente.',
          'Datos de uso: páginas visitadas, búsquedas realizadas y productos consultados.',
        ]
      },
      {
        title: '3. Finalidad del tratamiento',
        bullets: [
          'Gestión del registro y autenticación de usuarios.',
          'Procesamiento y seguimiento de pedidos.',
          'Comunicación de novedades, ofertas y cambios en el servicio (con tu consentimiento).',
          'Mejora de la plataforma mediante análisis estadístico anónimo.',
          'Cumplimiento de obligaciones legales.',
        ]
      },
      {
        title: '4. Base legal',
        text: 'El tratamiento de tus datos se basa en: (a) la ejecución del contrato de compraventa para la gestión de pedidos; (b) tu consentimiento expreso para el envío de comunicaciones comerciales; (c) el interés legítimo de MercaFácil para el análisis y mejora del servicio; y (d) el cumplimiento de obligaciones legales.'
      },
      {
        title: '5. Conservación de los datos',
        text: 'Conservamos tus datos mientras mantengas una cuenta activa en MercaFácil. Una vez eliminada la cuenta, los datos se bloquean durante el plazo legal aplicable y se eliminan definitivamente transcurrido dicho período.'
      },
      {
        title: '6. Tus derechos',
        text: 'Puedes ejercer en cualquier momento los derechos de acceso, rectificación, supresión ("derecho al olvido"), limitación, portabilidad y oposición al tratamiento. Para ello, escribe a privacidad@mercafacil.es adjuntando copia de tu documento de identidad. Tienes derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (aepd.es).'
      },
      {
        title: '7. Cookies',
        text: 'MercaFácil utiliza cookies técnicas necesarias para el funcionamiento de la plataforma (sesión, carrito, preferencias de idioma). No utilizamos cookies de seguimiento ni compartimos datos con redes publicitarias de terceros.'
      }
    ]
  }
};

@Component({
  selector: 'app-info-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './info-page.component.html',
  styleUrl: './info-page.component.css'
})
export class InfoPageComponent implements OnInit {
  content: PageContent | null = null;

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    const pageId = this.route.snapshot.data['pageId'] as string;
    this.content = PAGES[pageId] ?? null;
  }
}
