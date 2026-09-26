import type { Block, Scenario, Topic } from '../domain/types'

export const CONTENT_VERSION = 'convocatoria-2025-banco-2026-09-v2'
/**
 * Suelo por tema, no un objetivo fijo.
 *
 * Antes era un numero exacto y todos los temas tenian que tener lo mismo, que
 * era razonable mientras el banco se construia de una pieza. Al crecer por
 * importancia en el examen, los bloques III y IV tienen que poder adelantar a
 * los otros sin obligar a escribir 264 preguntas de golpe.
 */
export const MIN_QUESTIONS_PER_TOPIC = 8
export const STATE_VERSION = 1
export const OFFICIAL_BOE_URL =
  'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-26262'
export const BAQUEDANO_URL = 'https://www.baquedano.es/todo.html'
export const OFFICIAL_INAP_URL =
  'https://www.inap.es/es/seleccion/procesos-selectivos-de-cuerposescalas-generales/cuerpo-de-tecnicos-auxiliares-de-informatica-de-la-administracion-del-estado'

export const examRules = {
  title: 'Ejercicio único · Ingreso libre',
  reference: 'BOE-A-2025-26262 · Anexo V',
  resolvedOn: '18/12/2025',
  examDate: '23/05/2026',
  durationMinutes: 120,
  theoryQuestions: 80,
  theoryReserves: 5,
  scenarioQuestions: 20,
  scenarioReserves: 5,
  options: 4,
  penaltyPerError: 1 / 3,
  partOneInitialCutoff: 40,
  partOneMinimumCutoff: 24,
  partTwoMinimumDirect: 6,
  targetPartOne: 50,
  targetPartTwo: 12,
  note: 'La próxima convocatoria puede modificar el programa o las reglas. Verifica siempre el BOE y las bases vigentes.',
}

export const blocks: Block[] = [
  {
    id: 'I',
    title: 'Organización del Estado y Administración electrónica',
    shortTitle: 'Organización',
    description:
      'Derecho constitucional, función pública y servicios electrónicos.',
    accent: '#6d5dfc',
  },
  {
    id: 'II',
    title: 'Tecnología básica',
    shortTitle: 'Tecnología básica',
    description:
      'Hardware, periféricos, algoritmos, sistemas operativos y bases de datos.',
    accent: '#117f75',
  },
  {
    id: 'III',
    title: 'Desarrollo de sistemas',
    shortTitle: 'Desarrollo',
    description:
      'Modelado, programación, SQL, arquitectura, web, calidad y control de versiones.',
    accent: '#d06b24',
  },
  {
    id: 'IV',
    title: 'Sistemas y comunicaciones',
    shortTitle: 'Sistemas y redes',
    description:
      'Administración, seguridad, TCP/IP, Internet, VPN y redes locales.',
    accent: '#c43d62',
  },
]

export const topics: Topic[] = [
  {
    id: 'B1-T01',
    blockId: 'I',
    number: 1,
    title:
      'La Constitución Española de 1978. Derechos y deberes fundamentales. Su garantía y suspensión. La Corona: funciones constitucionales del Rey.',
    focus: 'Derechos, deberes, garantía de derechos y funciones de la Corona.',
  },
  {
    id: 'B1-T02',
    blockId: 'I',
    number: 2,
    title:
      'Las Cortes Generales: atribuciones del Congreso de los Diputados y del Senado. El Tribunal Constitucional: composición y atribuciones. El Defensor del Pueblo.',
    focus: 'Poder Legislativo, Tribunal Constitucional y Defensor del Pueblo.',
  },
  {
    id: 'B1-T03',
    blockId: 'I',
    number: 3,
    title:
      'El Gobierno: composición, nombramiento y cese. Las funciones del Gobierno. Relaciones entre el Gobierno y las Cortes Generales.',
    focus:
      'Composición del Gobierno, investidura, funciones y control parlamentario.',
  },
  {
    id: 'B1-T04',
    blockId: 'I',
    number: 4,
    title:
      'El texto refundido del Estatuto Básico del Empleo Público y demás normativa de aplicación: derechos y deberes, formas de provisión de puestos, promoción interna y carrera profesional; situaciones administrativas, incompatibilidades y régimen sancionador. La Ley 19/2013, de 9 de diciembre, de transparencia, acceso a la información pública y buen gobierno. La Agenda 2030 y los Objetivos de Desarrollo Sostenible.',
    focus:
      'TREBEP, transparencia, buen gobierno y Objetivos de Desarrollo Sostenible.',
  },
  {
    id: 'B1-T05',
    blockId: 'I',
    number: 5,
    title:
      'Políticas de igualdad y contra la violencia de género. Igualdad de trato y no discriminación de las personas LGTBI. Discapacidad y dependencia: régimen jurídico.',
    focus: 'Igualdad, violencia de género, LGTBI, discapacidad y dependencia.',
  },
  {
    id: 'B1-T06',
    blockId: 'I',
    number: 6,
    title:
      'La sociedad de la información. Identidad y firma electrónica: régimen jurídico. El DNI electrónico. La Agenda Digital para España.',
    focus: 'Identidad, firma electrónica, DNI-e y Agenda Digital.',
  },
  {
    id: 'B1-T07',
    blockId: 'I',
    number: 7,
    title:
      'La protección de datos personales y su régimen jurídico: principios, derechos y obligaciones. Derechos digitales.',
    focus: 'RGPD, LOPDGDD, AEPD y derechos digitales.',
  },
  {
    id: 'B1-T08',
    blockId: 'I',
    number: 8,
    title:
      'Acceso electrónico de los ciudadanos a los servicios públicos y normativa de desarrollo. La gestión electrónica de los procedimientos administrativos: registros, notificaciones y uso de medios electrónicos. Esquema Nacional de Seguridad y de Interoperabilidad. Normas técnicas de Interoperabilidad.',
    focus: 'Procedimiento electrónico, notificaciones, ENS y NTI.',
  },
  {
    id: 'B1-T09',
    blockId: 'I',
    number: 9,
    title:
      'Instrumentos para el acceso electrónico a las Administraciones públicas: sedes electrónicas, canales y puntos de acceso, identificación y autenticación. Infraestructuras y servicios comunes en materia de administración electrónica.',
    focus: 'Sede electrónica, Cl@ve, DNI-e y servicios comunes.',
  },
  {
    id: 'B2-T01',
    blockId: 'II',
    number: 1,
    title:
      'Informática básica. Representación y comunicación de la información: elementos constitutivos de un sistema de información. Características y funciones. Arquitectura de ordenadores. Componentes internos de los equipos microinformáticos.',
    focus: 'Representación de datos, arquitectura, CPU, memoria y buses.',
  },
  {
    id: 'B2-T02',
    blockId: 'II',
    number: 2,
    title:
      'Periféricos: conectividad y administración. Elementos de impresión, almacenamiento, visualización y digitalización.',
    focus: 'Periféricos, puertos, impresión, almacenamiento y digitalización.',
  },
  {
    id: 'B2-T03',
    blockId: 'II',
    number: 3,
    title:
      'Tipos abstractos y estructuras de datos. Organizaciones de ficheros. Algoritmos. Formatos de información y ficheros.',
    focus: 'Listas, pilas, colas, árboles, grafos, algorítmica y ficheros.',
  },
  {
    id: 'B2-T04',
    blockId: 'II',
    number: 4,
    title:
      'Sistemas operativos: características y elementos constitutivos. Sistemas Windows, Unix y Linux y sistemas operativos para dispositivos móviles.',
    focus: 'Procesos, memoria, archivos, Windows, Unix/Linux y móvil.',
  },
  {
    id: 'B2-T05',
    blockId: 'II',
    number: 5,
    title:
      'Sistemas de gestión de bases de datos relacionales, orientados a objetos y NoSQL: características y componentes.',
    focus: 'Modelos de datos, motores, esquemas, transacciones y repositorios.',
  },
  {
    id: 'B3-T01',
    blockId: 'III',
    number: 1,
    title:
      'Modelado de datos, metodologías y reglas. Entidades, atributos y relaciones. Diseño de bases de datos. Diseño lógico y físico. Modelo lógico relacional. Normalización.',
    focus: 'Modelo ER, claves, normalización y diseño lógico/físico.',
  },
  {
    id: 'B3-T02',
    blockId: 'III',
    number: 2,
    title:
      'Lenguajes de programación. Representación de tipos de datos. Operadores. Instrucciones condicionales. Bucles y recursividad. Procedimientos, funciones y parámetros. Vectores y registros. Estructura de un programa.',
    focus: 'Paradigmas, estructuras de control, funciones y tipos de datos.',
  },
  {
    id: 'B3-T03',
    blockId: 'III',
    number: 3,
    title:
      'Lenguajes de interrogación de bases de datos. Estándar ANSI SQL. Procedimientos almacenados. Eventos y disparadores.',
    focus: 'Consultas, joins, agregación, DDL, procedimientos y disparadores.',
  },
  {
    id: 'B3-T04',
    blockId: 'III',
    number: 4,
    title:
      'Diseño y programación orientada a objetos. Objetos, clases, herencia, métodos, sobrecarga. Ventajas e inconvenientes. Patrones de diseño y UML.',
    focus: 'Pilares de POO, patrones, principios SOLID y UML.',
  },
  {
    id: 'B3-T05',
    blockId: 'III',
    number: 5,
    title:
      'Arquitectura Java EE/Jakarta EE y plataforma .NET: componentes, persistencia y seguridad. Características, elementos, lenguajes y funciones. Desarrollo de interfaces.',
    focus:
      'Jakarta EE, .NET, componentes, persistencia, seguridad e interfaces.',
  },
  {
    id: 'B3-T06',
    blockId: 'III',
    number: 6,
    title:
      'Arquitectura de sistemas cliente/servidor y multicapas: componentes y operación. Arquitecturas de servicios web y protocolos asociados.',
    focus: 'Capas, MVC, API, servicios web, REST y software intermedio.',
  },
  {
    id: 'B3-T07',
    blockId: 'III',
    number: 7,
    title:
      'Aplicaciones web. Desarrollo front-end y en servidor, multiplataforma y multidispositivo. HTML, XML y sus derivaciones. Navegadores y lenguajes de programación web y de script.',
    focus: 'HTML, CSS, JavaScript, XML, navegador y diseño adaptable.',
  },
  {
    id: 'B3-T08',
    blockId: 'III',
    number: 8,
    title:
      'Accesibilidad, diseño universal y usabilidad. Acceso y usabilidad de las tecnologías, productos y servicios relacionados con la sociedad de la información. Confidencialidad y disponibilidad de la información en puestos de usuario final. Conceptos de seguridad en el desarrollo de los sistemas.',
    focus: 'WCAG, diseño universal, privacidad, disponibilidad y seguridad.',
  },
  {
    id: 'B3-T09',
    blockId: 'III',
    number: 9,
    title:
      'Repositorios: estructura y actualización. Generación de código y documentación. Metodologías de desarrollo. Pruebas. Programas para control de versiones. Plataformas de desarrollo colaborativo de software.',
    focus: 'Git, metodologías, pruebas, documentación y CI/CD.',
  },
  {
    id: 'B4-T01',
    blockId: 'IV',
    number: 1,
    title:
      'Administración del sistema operativo y software de base. Actualización, mantenimiento y reparación del sistema operativo.',
    focus:
      'Windows y Linux, servicio, registros, consola, paquetes y recuperación.',
  },
  {
    id: 'B4-T02',
    blockId: 'IV',
    number: 2,
    title:
      'Administración de bases de datos. Sistemas de almacenamiento y su virtualización. Políticas, sistemas y procedimientos de backup y recuperación. Backup de sistemas físicos y virtuales. Virtualización de sistemas y de puestos.',
    focus:
      'Copias de seguridad, RAID, volúmenes, NFS, VM, VDI y alta disponibilidad.',
  },
  {
    id: 'B4-T03',
    blockId: 'IV',
    number: 3,
    title:
      'Administración de servidores de correo electrónico y sus protocolos. Administración de contenedores y microservicios.',
    focus: 'SMTP, IMAP, POP3, SPF, DKIM, contenedores y orquestación.',
  },
  {
    id: 'B4-T04',
    blockId: 'IV',
    number: 4,
    title:
      'Administración de redes de área local. Gestión de usuarios. Gestión de dispositivos. Monitorización y control de tráfico.',
    focus:
      'Segmentación, conmutadores, VLAN, enlaces, monitorización y diagnóstico de averías.',
  },
  {
    id: 'B4-T05',
    blockId: 'IV',
    number: 5,
    title:
      'Conceptos de seguridad de los sistemas de información. Seguridad física. Seguridad lógica. Amenazas y vulnerabilidades. Técnicas criptográficas y protocolos seguros. Mecanismos de firma digital. Infraestructura física de un CPD: acondicionamiento y equipamiento. Sistemas de gestión de incidencias. Control remoto de puestos de usuario.',
    focus: 'CPD, controles, amenazas, criptografía, firma e incidentes.',
  },
  {
    id: 'B4-T06',
    blockId: 'IV',
    number: 6,
    title:
      'Medios de transmisión. Modos de comunicación. Equipos terminales y equipos de interconexión y conmutación. Redes de comunicaciones. Redes de conmutación y difusión. Comunicaciones móviles e inalámbricas.',
    focus:
      'Sistemas simplex/half/full duplex, cableado, Switching, WLAN y móvil.',
  },
  {
    id: 'B4-T07',
    blockId: 'IV',
    number: 7,
    title:
      'El modelo TCP/IP y el modelo de referencia de interconexión de sistemas abiertos (OSI) de ISO. Protocolos TCP/IP.',
    focus: 'Capas OSI/TCP-IP, encapsulación, ICMP, ARP y protocolos.',
  },
  {
    id: 'B4-T08',
    blockId: 'IV',
    number: 8,
    title:
      'Internet: arquitectura de red. Origen, evolución y estado actual. Principales servicios. Protocolos HTTP, HTTPS y SSL/TLS.',
    focus:
      'Internet, DNS, HTTP, HTTPS, certificados, cookies y extremos seguros.',
  },
  {
    id: 'B4-T09',
    blockId: 'IV',
    number: 9,
    title:
      'Seguridad y protección en redes de comunicaciones. Seguridad perimetral. Acceso remoto seguro a redes. Redes privadas virtuales (VPN). Seguridad en el puesto del usuario.',
    focus:
      'Perímetro, cortafuegos, servidor bastion, VPN, punto final y confianza cero.',
  },
  {
    id: 'B4-T10',
    blockId: 'IV',
    number: 10,
    title:
      'Redes locales. Tipología. Técnicas de transmisión. Métodos de acceso. Dispositivos de interconexión.',
    focus:
      'Topologías, Ethernet, CSMA/CD, concentradores, conmutadores, enrutadores y puentes.',
  },
]

export const scenarios: Scenario[] = [
  {
    id: 'III',
    blockId: 'III',
    title: 'Portal de servicios al ciudadano',
    context:
      'Un organismo necesita modernizar un portal de trámites con una arquitectura de tres capas, base de datos relacional, API, control de versiones y pruebas automatizadas.',
    tasks: [
      'Modela y normaliza los datos de usuarios y trámites.',
      'Selecciona componentes y persistencia en un entorno Jakarta EE o .NET.',
      'Diseña servicios web y una interfaz accesible y adaptable.',
      'Planifica repositorios, pruebas, integración y despliegue.',
    ],
  },
  {
    id: 'IV',
    blockId: 'IV',
    title: 'Incidente en un servicio corporativo',
    context:
      'Tras un pico de tráfico, usuarios reportan lentitud. Un switch y un servidor de correo requieren análisis, mientras el equipo debe preservar evidencias y recuperar el servicio.',
    tasks: [
      'Analiza tráfico, direccionamiento, DNS y conectividad.',
      'Investiga autenticación, correo, cortafuegos y exposición de servicios.',
      'Aplica copias, virtualización, seguridad física y procedimientos de incidencia.',
      'Documenta causa, contención, recuperación y prevención.',
    ],
  },
]
