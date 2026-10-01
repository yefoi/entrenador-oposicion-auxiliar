export const blockPages = [
  {
    path: 'bloque-1-organizacion-administracion-electronica.html',
    blockId: 'I',
    title: 'Bloque 1 TAI | Organización del Estado y administración electrónica',
    description:
      'Temario TAI del Bloque 1: Constitución, Cortes Generales, función pública, transparencia, identidad, protección de datos y administración electrónica.',
    intro:
      'El primer bloque conecta la organización constitucional y la función pública con los servicios electrónicos que un técnico auxiliar debe entender para atender a la ciudadanía.',
    sections: [
      [
        'Qué abarca este bloque',
        'Constitución, poderes del Estado, Tribunal Constitucional, Defensor del Pueblo, Gobierno, TREBEP, igualdad, identidad y firma electrónica, protección de datos, procedimiento electrónico, sedes, Cl@ve y ENS.',
      ],
      [
        'Ideas para estudiar',
        'Aprende cada institución con una pregunta de función: quién decide, quién ejecuta, qué garantías existen y qué efecto tiene en la persona usuaria. Después contrasta la norma con un caso práctico de servicio público.',
      ],
      [
        'Práctica recomendada',
        'Alterna preguntas del bloque con textos del BOE. Usa la explicación de cada respuesta para volver al artículo relacionado y comprobar el concepto en su contexto.',
      ],
    ],
    keywords: ['administración electrónica', 'función pública', 'protección de datos', 'identidad electrónica'],
  },
  {
    path: 'bloque-2-tecnologia-basica.html',
    blockId: 'II',
    title: 'Bloque 2 TAI | Tecnología básica y fundamentos técnicos',
    description:
      'Temario TAI del Bloque 2: hardware, periféricos, algoritmos, estructuras de datos, sistemas operativos y bases de datos.',
    intro:
      'La tecnología básica es la base para razonar sobre errores, rendimiento y funcionamiento de los equipos que aparecen en un examen técnico.',
    sections: [
      [
        'Qué abarca este bloque',
        'Representación de la información, arquitectura, componentes, periféricos, conectividad, ficheros, algoritmos, estructuras de datos, Windows, Unix, Linux, móvil y fundamentos de bases de datos.',
      ],
      [
        'Ideas para estudiar',
        'Relaciona cada concepto con un ejemplo: un bit, un proceso, un árbol, una consulta o un servicio. Los diagramas y las explicaciones son más útiles que memorizar definiciones aisladas.',
      ],
      [
        'Práctica recomendada',
        'Resuelve primero por bloques y después mezcla preguntas fáciles, medias y difíciles. Anota cada error de concepto y vuelve al ejemplo que lo hace intuitivo.',
      ],
    ],
    keywords: ['hardware', 'sistemas operativos', 'algoritmos', 'estructuras de datos'],
  },
  {
    path: 'bloque-3-desarrollo-sistemas.html',
    blockId: 'III',
    title: 'Bloque 3 TAI | Desarrollo de sistemas',
    description:
      'Temario TAI del Bloque 3: modelado de datos, programación, SQL, Java y .NET, arquitectura, web, accesibilidad, calidad y Git.',
    intro:
      'Este bloque exige conectar el modelo del problema con su implementación, su persistencia, su seguridad, su interfaz y su ciclo de vida.',
    sections: [
      [
        'Qué abarca este bloque',
        'Entidades y relaciones, normalización, programación, SQL, programación orientada a objetos, patrones, UML, Jakarta EE, .NET, MVC, APIs, HTML, XML, accesibilidad, pruebas y control de versiones.',
      ],
      [
        'Ideas para estudiar',
        'No estudies sintaxis aislada: cada pregunta debe cerrar con una decisión de diseño, una consulta, un test o un impacto de seguridad. Practica especialmente los diagramas y las consultas SQL que relacionan tablas.',
      ],
      [
        'Práctica recomendada',
        'Alterna preguntas de los cuatro bloques. Para cada respuesta, identifica qué requisito del sistema se está comprobando y qué compromiso técnico lo rodea.',
      ],
    ],
    keywords: ['modelado de datos', 'SQL', 'UML', 'control de versiones'],
  },
  {
    path: 'bloque-4-sistemas-comunicaciones.html',
    blockId: 'IV',
    title: 'Bloque 4 TAI | Sistemas, seguridad y comunicaciones',
    description:
      'Temario TAI del Bloque 4: administración de sistemas, backup, seguridad, redes, TCP/IP, Internet, VPN, DNS, HTTP y redes locales.',
    intro:
      'El cuarto bloque se centra en cómo se mantienen, comunican y protegen los sistemas en un entorno real, con criterios de disponibilidad, seguridad y diagnóstico.',
    sections: [
      [
        'Qué abarca este bloque',
        'Windows y Linux, servicios, paquetes, bases de datos, RAID, copias, virtualización, correo, contenedores, LAN, switching, OSI, TCP/IP, DNS, HTTP, TLS, cortafuegos y VPN.',
      ],
      [
        'Ideas para estudiar',
        'Piensa en el síntoma, la causa y la evidencia. Un caso de red o seguridad es más fácil de recordar cuando identifica qué se observa, qué se mide y qué se cambia.',
      ],
      [
        'Práctica recomendada',
        'Estudia primero los protocolos y después las incidencias. Usa el simulacro para entrenar el tiempo y la penalización, sin confundir una estimación orientativa con una corrección oficial.',
      ],
    ],
    keywords: ['TCP/IP', 'redes locales', 'seguridad', 'backup'],
  },
]

export const intentPages = [
  {
    path: 'temario-tai.html',
    title: 'Temario TAI AGE | 33 temas y bloques explicados',
    description:
      'Consulta el temario de Técnico Auxiliar de Informática de la AGE, organizado en cuatro bloques y 33 temas, con acceso a práctica libre.',
    intro:
      'Este índice reúne el temario de referencia del Cuerpo de Técnicos Auxiliares de Informática de la AGE y te lleva a la práctica de cada tema.',
    sections: [
      [
        'Estructura del temario',
        'El programa se organiza en cuatro bloques: organización y administración electrónica, tecnología básica, desarrollo de sistemas y sistemas y comunicaciones. El contenido se distribuye en 33 temas numerados.',
      ],
      [
        'Cómo usarlo',
        'Lee el tema, practica ocho preguntas propias y revisa la explicación de cada respuesta. Después vuelve al punto que más errores haya generado.',
      ],
      [
        'Fuente y alcance',
        'Los títulos reproducen la convocatoria de referencia. El banco de Plaza TAI es propio, práctico y no oficial; confirma siempre el BOE y las bases vigentes.',
      ],
    ],
    keywords: ['temario TAI', 'programa TAI', 'técnico auxiliar informática'],
    image: {
      file: 'practica-tai-pregunta.png',
      alt: 'Pregunta del test TAI con cuatro opciones y su nivel de dificultad',
      caption: 'Cada tema se practica con preguntas propias de cuatro opciones.',
    },
  },
  {
    path: 'test-oposiciones-tai.html',
    title: 'Test gratis TAI AGE | Practica por bloques',
    description:
      'Test gratuito de oposiciones TAI con 568 preguntas propias, explicaciones, filtros por bloque y práctica adaptativa.',
    intro:
      'Practica sin cuenta y sin instalar nada. El progreso se guarda en el navegador y puedes filtrar por bloques, temas, dificultad y estado.',
    sections: [
      [
        'Cómo se corrige el examen, regla por regla',
        'El Anexo V de la convocatoria vigente fija un ejercicio único de dos partes que se hacen juntas: hasta 80 preguntas de todas las materias y un supuesto práctico de 20 preguntas elegido entre los bloques III y IV. Hay 120 minutos para las dos partes y 5 preguntas de reserva por parte. Cada error descuenta un tercio del valor de una respuesta correcta y las respuestas en blanco no penalizan. El ejercicio se califica de 0 a 100 puntos, 50 por parte, y hace falta un mínimo de 25 en cada una.',
      ],
      [
        'Qué significa que un error reste un tercio',
        'Es la regla que decide tu estrategia al contestar, y se calcula: acertar suma 1, fallar resta 0,33. Con las cuatro opciones intactas, responder al azar ni sube ni baja la nota, porque la mitad de las veces ganas y tres cuartas partes de las veces pierdes un tercio. En cuanto descartas una sola opción, la cuenta se pone a favor y responder deja de ser una apuesta inocente. Por eso el descarte se entrena aquí como una habilidad aparte, con un minijuego propio.',
      ],
      [
        'El trámite que deja la segunda parte sin corregir',
        'La convocatoria es explícita: si no marcas qué supuesto eliges, si marcas los dos o si la marca no es válida, la segunda parte no se corrige. Son 50 puntos perdidos por un trámite, no por no saber. En el simulacro se elige supuesto antes de empezar, igual que en el examen.',
      ],
      [
        'Privacidad',
        'El test funciona en el propio navegador: no hay registro, no se envía tu progreso a ningún servidor y puedes exportarlo desde Ajustes. Sin conexión sigue funcionando.',
      ],
    ],
    rawHtml: `<section class="site-card">
        <h2>Cuánto suma y cuánto resta cada respuesta</h2>
        <p>Con la penalización de un tercio, el valor esperado de responder depende solo de cuántas opciones hayas descartado. Los números salen de la propia regla, no de una estimación.</p>
        <table class="site-table">
          <caption>Valor esperado de responder, según las opciones que descartes</caption>
          <thead>
            <tr><th scope="col">Opciones descartadas</th><th scope="col">Opciones entre las que eliges</th><th scope="col">Valor esperado</th></tr>
          </thead>
          <tbody>
            <tr><td>Ninguna</td><td>4</td><td>0,00</td></tr>
            <tr><td>Una</td><td>3</td><td>+0,11</td></tr>
            <tr><td>Dos</td><td>2</td><td>+0,33</td></tr>
          </tbody>
        </table>
        <p>Leído al revés: con las cuatro opciones intactas, dejar la pregunta en blanco o arriesgar sale igual. En cuanto descartas la primera, contestar es mejor que dejar en blanco.</p>
        <h3>Tres formas de llegar al mínimo de la primera parte</h3>
        <p>Con la transformación lineal que usa este simulacro para orientar, 25 puntos sobre 50 equivalen a 40 de puntuación directa sobre 80. Estas tres combinaciones llegan al mismo sitio, y no cuestan lo mismo:</p>
        <table class="site-table">
          <thead>
            <tr><th scope="col">Aciertos</th><th scope="col">Errores</th><th scope="col">En blanco</th><th scope="col">Puntuación directa</th></tr>
          </thead>
          <tbody>
            <tr><td>40</td><td>0</td><td>40</td><td>40,0</td></tr>
            <tr><td>45</td><td>15</td><td>20</td><td>40,0</td></tr>
            <tr><td>48</td><td>24</td><td>8</td><td>40,0</td></tr>
          </tbody>
        </table>
        <p>La segunda fila es la útil: contestar veinte preguntas más, de las que quince salen mal, deja la nota exactamente igual que dejarlas en blanco. Y la tercera enseña el límite: cuando los errores pasan de un tercio de los aciertos, cada respuesta de más empieza a restar.</p>
      </section>
      <section class="site-card">
        <h2>Qué se practica en cada bloque</h2>
        <p>El banco sigue los cuatro bloques del programa, con dieciséis preguntas por tema y la explicación de cada opción incorrecta.</p>
        <table class="site-table">
          <thead>
            <tr><th scope="col">Bloque</th><th scope="col">Materias</th><th scope="col">Temas</th><th scope="col">Preguntas</th><th scope="col">Supuesto</th></tr>
          </thead>
          <tbody>
            <tr><td>I</td><td>Organización del Estado y administración electrónica</td><td>9</td><td>144</td><td>—</td></tr>
            <tr><td>II</td><td>Tecnología básica</td><td>5</td><td>80</td><td>—</td></tr>
            <tr><td>III</td><td>Desarrollo de sistemas</td><td>9</td><td>164</td><td>Sí</td></tr>
            <tr><td>IV</td><td>Sistemas y comunicaciones</td><td>10</td><td>180</td><td>Sí</td></tr>
          </tbody>
        </table>
        <p>Los bloques III y IV son los dos supuestos posibles de la segunda parte, así que incluyen veinte preguntas de caso con sus documentos para consultar. En total, 568 preguntas.</p>
      </section>`,
    keywords: ['test TAI', 'preguntas TAI', 'test oposiciones informática'],
    image: {
      file: 'practica-tai-explicacion-opciones.png',
      alt: 'Corrección de una pregunta TAI con la explicación de por qué falla cada opción',
      caption: 'Al responder, cada opción incorrecta explica por qué lo es.',
    },
  },
  {
    path: 'simulacro-tai.html',
    title: 'Simulacro TAI gratis | 80 + 20 preguntas',
    description:
      'Simulacro orientativo del examen TAI: 80 preguntas de teoría, 20 de supuesto y 120 minutos con penalización por error.',
    intro:
      'El simulacro reproduce la mecánica de la convocatoria de referencia para entrenar ritmo, lectura y decisión bajo penalización.',
    sections: [
      [
        'Formato',
        'Una parte teórica de hasta 80 preguntas, un supuesto de 20 preguntas en el bloque III o IV, cinco preguntas de reserva por parte y dos horas de duración.',
      ],
      [
        'Qué significa orientativo',
        'La puntuación es una estimación de práctica. No utiliza preguntas oficiales y no sustituye las bases, la Comisión Permanente de Selección ni la convocatoria vigente.',
      ],
      [
        'Cómo estudiarlo',
        'Practica primero por temas y reserva uno o dos simulacros completos para simular la presión de tiempo.',
      ],
    ],
    keywords: ['simulacro TAI', 'examen TAI', 'oposiciones AGE informática'],
    image: {
      file: 'supuesto-practico-tai-materiales.png',
      alt: 'Materiales del supuesto práctico TAI: plan de direccionamiento y estado del conmutador',
      caption: 'El supuesto práctico trae sus propios documentos, como en el examen.',
    },
  },
  {
    path: 'como-estudiar-tai.html',
    title: 'Cómo estudiar TAI AGE | Método, temario y práctica',
    description:
      'Guía práctica para estudiar TAI AGE: organiza el temario en ciclos, usa tests, corrige errores, revisa con repasos y reserva simulacros.',
    intro:
      'Estudiar TAI de forma eficaz es una cuestión de ciclo: entender, practicar, corregir y volver al punto que todavía no dominas.',
    sections: [
      [
        'Un ciclo de cuatro pasos',
        'Lee con objetivos, responde sin mirar, corrige leyendo las explicaciones y programa un repaso. Alterna bloques para comprobar que el conocimiento se conecta.',
      ],
      [
        'Repaso recomendado',
        'Vuelve a los errores y a los temas débiles después de uno, tres, siete, catorce y treinta días. La recuperación espaciada pesa más que hacer muchas sesiones juntas.',
      ],
      [
        'Empieza ahora',
        'Configura tu fecha objetivo, entra en el temario y lanza una sesión adaptativa de diez minutos.',
      ],
    ],
    keywords: ['cómo estudiar TAI', 'preparar oposiciones TAI', 'método oposiciones'],
    image: {
      file: 'panel-progreso-tai.png',
      alt: 'Panel de Plaza TAI con el progreso por temas y la cobertura del temario',
      caption: 'El panel muestra la cobertura y los temas que conviene repasar.',
    },
  },
]
