// Vecinos de Villa Chanta. "dificultad" decide en qué día aparecen (1, 2 o 3).
// "personalidad" y "debilidad" solo las ve la IA; "pista" es lo que ve el jugador.
const PERSONAJES = [
  {
    id: 'toto',
    nombre: 'Toto Bustamante',
    edad: 24,
    emoji: '🤑',
    dificultad: 1,
    ahorros: 8000,
    pista: 'Acaba de heredar plata de una tía y no sabe qué hacer con ella.',
    personalidad: 'Ingenuo, entusiasta y muy charlatán. Le encanta sentirse importante y que lo traten de "señor".',
    debilidad: 'Quiere invertir en algo "que esté de moda" para impresionar a su ex.',
    saludo: '¿Hola? ¿Quién habla? Si es por lo de la herencia, ya firmé todo, eh.'
  },
  {
    id: 'kevin',
    nombre: 'Kevin "ElPro" Gómez',
    edad: 19,
    emoji: '🎮',
    dificultad: 1,
    ahorros: 3000,
    pista: 'Gamer, juega todo el día y sueña con ser streamer famoso.',
    personalidad: 'Habla con jerga gamer, se distrae fácil, impaciente. Se cree más vivo que nadie.',
    debilidad: 'Cualquier cosa que le prometa skins exclusivas, seguidores o un equipo profesional.',
    saludo: 'Ehh, ¿qué onda? Hablá rápido que estoy en partida.'
  },
  {
    id: 'susana',
    nombre: 'Susana Luz',
    edad: 45,
    emoji: '🔮',
    dificultad: 1,
    ahorros: 6000,
    pista: 'Coach de bienestar. Cree en las energías, los cristales y la astrología.',
    personalidad: 'Dulce, espiritual, habla de vibras y del universo. Desconfía de la gente "con energía densa".',
    debilidad: 'Le pueden las señales del universo, los signos del zodíaco y los productos "sanadores".',
    saludo: 'Hola, hermosa alma. Sentí que alguien me iba a llamar hoy. ¿Quién sos?'
  },
  {
    id: 'aldo',
    nombre: 'Don Aldo Ferrari',
    edad: 66,
    emoji: '🔧',
    dificultad: 2,
    ahorros: 12000,
    pista: 'Ferretero del barrio. Odia a los vendedores telefónicos. Fanático del Club Villa Chanta.',
    personalidad: 'Gruñón, directo, sin paciencia para los vueltos. Corta rápido si siente que le venden algo.',
    debilidad: 'Su club de fútbol, el Club Atlético Villa Chanta. Haría cualquier cosa para ayudar al club.',
    saludo: '¿Sí? Ferretería Ferrari. Si me querés vender algo, te corto ya.'
  },
  {
    id: 'marta',
    nombre: 'Doña Marta Rivas',
    edad: 78,
    emoji: '👵',
    dificultad: 2,
    ahorros: 15000,
    pista: 'Jubilada pícara. Dice que ya escuchó todos los cuentos del tío.',
    personalidad: 'Astuta, irónica y muy conversadora. Le encanta tomarle el pelo a los estafadores y hacerles preguntas trampa.',
    debilidad: 'Su gato Michi, que está enfermo, y sus novelas de la tarde.',
    saludo: 'Hola, querido. A ver, contame, ¿qué cuento me traés hoy?'
  },
  {
    id: 'fede',
    nombre: 'Fede Quiroga',
    edad: 38,
    emoji: '💻',
    dificultad: 2,
    ahorros: 10000,
    pista: 'Programador. Se cree imposible de engañar porque "sabe de tecnología".',
    personalidad: 'Soberbio, corrige a todo el mundo, usa palabras técnicas. Odia que le hablen como a un tonto.',
    debilidad: 'Que lo halaguen por lo inteligente que es o que le ofrezcan ser parte de algo "exclusivo para expertos".',
    saludo: 'Sí, hola. Te aviso que tengo el número rastreado, así que andá con cuidado.'
  },
  {
    id: 'ricardo',
    nombre: 'Ricardo Pérez',
    edad: 52,
    emoji: '🧮',
    dificultad: 3,
    ahorros: 25000,
    pista: 'Contador. Pide papeles, números y pruebas de todo.',
    personalidad: 'Frío, metódico, desconfiado. Hace preguntas muy concretas y anota todo.',
    debilidad: 'Los descuentos de impuestos y las oportunidades de "ahorrar" plata. Es tacaño.',
    saludo: 'Pérez. Tengo dos minutos. ¿De qué se trata?'
  },
  {
    id: 'lucia',
    nombre: 'Dra. Lucía Benegas',
    edad: 31,
    emoji: '⚖️',
    dificultad: 3,
    ahorros: 30000,
    pista: 'Abogada penalista. Sarcástica y rapidísima.',
    personalidad: 'Muy inteligente y sarcástica. Detecta contradicciones al toque y amenaza con demandar.',
    debilidad: 'Está agotada de trabajar y sueña con unas vacaciones en el Caribe.',
    saludo: 'Estudio Benegas. Le aviso que esta llamada puede ser usada en su contra.'
  },
  {
    id: 'benitez',
    nombre: 'Comisario (R) Benítez',
    edad: 70,
    emoji: '👮',
    dificultad: 3,
    ahorros: 20000,
    pista: 'Comisario retirado. Pasó 40 años atrapando chantas.',
    personalidad: 'Sereno, socarrón, hace preguntas de interrogatorio. Se aburre en su retiro.',
    debilidad: 'Extraña la acción. Si le proponen una "misión secreta" o ayudar en un caso, se entusiasma.',
    saludo: 'Benítez al habla. ¿Quién es y de dónde sacó este número?'
  }
];

// Meta acumulada que hay que alcanzar al final de cada día.
const DIAS = [
  { meta: 6000 },
  { meta: 20000 },
  { meta: 50000 }
];
