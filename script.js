const FRASES_POR_LLAMADA = 10;
const DENUNCIAS_MAXIMAS = 3;
const DEUDA_TOTAL = DIAS[DIAS.length - 1].meta;

const estado = {
  config: {
    apiKey: localStorage.getItem('gemini-key') || '',
    modelo: localStorage.getItem('gemini-modelo') || 'gemini-flash-latest',
    voz: localStorage.getItem('voz') || 'gemini',
    modeloVoz: localStorage.getItem('gemini-modelo-voz') || 'gemini-2.5-flash-preview-tts'
  },
  enJuego: false,
  dia: 0,
  plata: 0,
  denuncias: 0,
  vecinosDelDia: [],
  llamados: new Set(),
  llamada: null,
  alCerrarAlerta: null
};

const $ = (id) => document.getElementById(id);

function formatoPlata(n) {
  return '$' + n.toLocaleString('es-AR');
}

function iniciales(nombre) {
  const palabras = nombre
    .replace(/"[^"]*"/g, '')
    .split(/\s+/)
    .filter((p) => /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+$/.test(p) && !['Don', 'Doña', 'Comisario'].includes(p));
  if (palabras.length === 0) return '?';
  const primera = palabras[0][0];
  return palabras.length > 1 ? primera + palabras[palabras.length - 1][0] : primera;
}

// ---------- Vistas ----------

function mostrar(id) {
  document.querySelectorAll('.vista').forEach((v) => v.classList.remove('activa'));
  $(id).classList.add('activa');
  document.body.dataset.vista = id;
}

function alerta(titulo, texto, pensamiento, alCerrar) {
  $('alerta-titulo').textContent = titulo;
  $('alerta-texto').textContent = texto;
  $('alerta-pensamiento').textContent = pensamiento || '';
  $('alerta-pensamiento').classList.toggle('oculto', !pensamiento);
  estado.alCerrarAlerta = alCerrar;
  $('alerta').classList.remove('oculto');
}

$('alerta-boton').addEventListener('click', () => {
  $('alerta').classList.add('oculto');
  const accion = estado.alCerrarAlerta;
  estado.alCerrarAlerta = null;
  if (accion) accion();
});

// ---------- Reloj ----------

function actualizarReloj() {
  const ahora = new Date();
  const hora = ahora.toLocaleTimeString('es-AR', { hour: 'numeric', minute: '2-digit', hourCycle: 'h23' });
  $('hora').textContent = hora;
  $('bloqueo-hora').textContent = hora;
  const fecha = ahora.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  $('bloqueo-fecha').textContent = fecha.charAt(0).toUpperCase() + fecha.slice(1);
}
actualizarReloj();
setInterval(actualizarReloj, 10000);

// ---------- Post-its ----------

function actualizarNotas() {
  const meta = estado.enJuego ? DIAS[estado.dia].meta : DEUDA_TOTAL;
  $('nota-meta').textContent = formatoPlata(meta);
  $('nota-plata').textContent = `Tengo: ${formatoPlata(estado.plata)}`;
  $('nota-dia').textContent = estado.enJuego ? `Hoy, día ${estado.dia + 1} de ${DIAS.length}` : '';
  $('nota-denuncias').textContent = estado.denuncias === 0 ? '—' : '/'.repeat(estado.denuncias);
  const l = estado.llamada;
  $('barra-sospecha').style.width = l ? `${l.sospecha}%` : '0';
  $('barra-confianza').style.width = l ? `${l.confianza}%` : '0';
}

// ---------- Pantalla bloqueada ----------

function pantallaBloqueo(titulo, texto) {
  $('notif-titulo').textContent = titulo;
  $('notif-texto').textContent = texto;
  actualizarNotas();
  mostrar('v-bloqueo');
}

$('notificacion').addEventListener('click', () => {
  prepararAudio();
  if (!estado.config.apiKey) mostrar('v-ajustes');
  else empezarJuego();
});

// ---------- Ajustes ----------

function cargarAjustes() {
  $('input-key').value = estado.config.apiKey;
  $('input-modelo').value = estado.config.modelo;
  $('input-voz').value = estado.config.voz;
  $('input-modelo-voz').value = estado.config.modeloVoz;
}
cargarAjustes();

$('abrir-ajustes').addEventListener('click', () => {
  cargarAjustes();
  mostrar('v-ajustes');
});

$('ajustes-listo').addEventListener('click', () => {
  const c = estado.config;
  c.apiKey = $('input-key').value.trim();
  c.modelo = $('input-modelo').value.trim() || 'gemini-flash-latest';
  c.voz = $('input-voz').value;
  c.modeloVoz = $('input-modelo-voz').value.trim() || 'gemini-2.5-flash-preview-tts';
  if (!c.apiKey) {
    $('ajustes-error').textContent = 'Necesitás una API key para jugar.';
    return;
  }
  $('ajustes-error').textContent = '';
  localStorage.setItem('gemini-key', c.apiKey);
  localStorage.setItem('gemini-modelo', c.modelo);
  localStorage.setItem('voz', c.voz);
  localStorage.setItem('gemini-modelo-voz', c.modeloVoz);
  vozGeminiFallo = false;
  if (estado.enJuego) mostrarContactos();
  else empezarJuego();
});

// ---------- Días ----------

function mezclar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function empezarJuego() {
  estado.enJuego = true;
  estado.dia = 0;
  estado.plata = 0;
  estado.denuncias = 0;
  empezarDia();
}

function empezarDia() {
  const dificultad = estado.dia + 1;
  estado.vecinosDelDia = mezclar(PERSONAJES.filter((p) => p.dificultad === dificultad));
  estado.llamados = new Set();
  estado.llamada = null;
  mostrarContactos();
}

function mostrarContactos() {
  const meta = DIAS[estado.dia].meta;
  const falta = Math.max(0, meta - estado.plata);
  $('contactos-titulo').textContent = `Día ${estado.dia + 1}`;
  $('contactos-meta').textContent = falta > 0
    ? `El Tano quiere ver ${formatoPlata(meta)} esta noche. Te faltan ${formatoPlata(falta)}.`
    : `Ya juntaste lo de hoy. Podés seguir llamando o terminar el día.`;

  const lista = $('lista-contactos');
  lista.innerHTML = '';
  estado.vecinosDelDia.forEach((p) => {
    const llamado = estado.llamados.has(p.id);
    const fila = document.createElement('button');
    fila.className = 'fila contacto';
    fila.disabled = llamado;
    fila.innerHTML = `
      <span class="avatar"></span>
      <span class="contacto-info">
        <strong></strong>
        <span></span>
      </span>
      <span class="contacto-accion">${llamado ? 'llamado' : `
        <svg viewBox="0 0 24 24"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z"/></svg>`}
      </span>`;
    fila.querySelector('.avatar').textContent = iniciales(p.nombre);
    fila.querySelector('strong').textContent = p.nombre;
    fila.querySelector('.contacto-info span').textContent = p.pista;
    fila.addEventListener('click', () => empezarLlamada(p));
    lista.appendChild(fila);
  });

  actualizarNotas();
  mostrar('v-contactos');
}

$('terminar-dia').addEventListener('click', terminarDia);

function terminarDia() {
  if (estado.plata < DIAS[estado.dia].meta) {
    terminarJuego('El Tano',
      `Vine a cobrar y tenías ${formatoPlata(estado.plata)}. Desde mañana me lavás el auto. Por diez años.`);
    return;
  }
  estado.dia++;
  if (estado.dia >= DIAS.length) {
    terminarJuego('El Tano',
      `Recibí los ${formatoPlata(estado.plata)}. Sos un artista, pibe. Estamos a mano. 🤝`);
    return;
  }
  alerta(`Terminó el día ${estado.dia}`,
    `Llegaste a la meta. Mañana el Tano quiere ver ${formatoPlata(DIAS[estado.dia].meta)}.`,
    '', empezarDia);
}

function terminarJuego(remitente, texto) {
  estado.enJuego = false;
  estado.llamada = null;
  pantallaBloqueo(remitente, texto + ' (Tocá para jugar de nuevo)');
}

// ---------- Llamada ----------

function empezarLlamada(p) {
  estado.llamados.add(p.id);
  const saludo = { respuesta: p.saludo, sospecha: 20, confianza: 10, paga: 0, cuelga: false, pensamiento: '' };
  estado.llamada = {
    personaje: p,
    // Gemini pide que la conversación empiece con un turno del usuario.
    historial: [
      { role: 'user', parts: [{ text: '(Suena el teléfono y atendés.)' }] },
      { role: 'model', parts: [{ text: JSON.stringify(saludo) }] }
    ],
    sospecha: saludo.sospecha,
    confianza: saludo.confianza,
    restantes: FRASES_POR_LLAMADA,
    pensamiento: '',
    esperando: false,
    terminada: false,
    inicio: null,
    reloj: null
  };

  const l = estado.llamada;
  $('v-llamada').style.setProperty('--color-vecino', p.color);
  $('llamada-avatar').textContent = iniciales(p.nombre);
  $('chat-avatar').textContent = iniciales(p.nombre);
  $('llamada-nombre').textContent = p.nombre;
  $('chat-nombre').textContent = p.nombre;
  $('llamada-estado').textContent = 'llamando…';
  $('subtitulo').textContent = '';
  $('chat').innerHTML = '';
  actualizarFrases();
  actualizarNotas();
  bloquearControles(true);
  mostrar('v-llamada');

  // Unos segundos de "llamando…" antes de que atiendan.
  setTimeout(() => {
    if (estado.llamada !== l) return;
    l.inicio = Date.now();
    l.reloj = setInterval(actualizarDuracion, 1000);
    actualizarDuracion();
    dicenEllos(p.saludo);
    bloquearControles(false);
  }, 1800);
}

function actualizarDuracion() {
  const l = estado.llamada;
  if (!l || !l.inicio) return;
  const s = Math.floor((Date.now() - l.inicio) / 1000);
  $('llamada-estado').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function actualizarFrases() {
  const n = estado.llamada.restantes;
  $('frases-restantes').textContent = `te quedan ${n} ${n === 1 ? 'frase' : 'frases'}`;
}

function bloquearControles(bloqueado) {
  $('boton-hablar').disabled = bloqueado;
  $('input-chat').disabled = bloqueado;
  $('boton-enviar').disabled = bloqueado;
}

function agregarBurbuja(quien, texto) {
  const b = document.createElement('div');
  b.className = `burbuja ${quien}`;
  b.textContent = texto;
  $('chat').appendChild(b);
  $('chat').scrollTop = $('chat').scrollHeight;
  return b;
}

function dicenEllos(texto) {
  agregarBurbuja('ellos', texto);
  $('subtitulo').textContent = texto;
  $('subtitulo').className = 'subtitulo-texto';
  hablarPersonaje(estado.llamada.personaje, texto);
}

async function enviar(texto) {
  const l = estado.llamada;
  if (!l || l.esperando || l.terminada || !texto) return;

  callarPersonaje();
  agregarBurbuja('vos', texto);
  $('subtitulo').textContent = 'escuchando…';
  $('subtitulo').className = 'subtitulo-texto pensando';
  l.historial.push({ role: 'user', parts: [{ text: texto }] });
  l.esperando = true;
  bloquearControles(true);
  const escribiendo = agregarBurbuja('ellos escribiendo', '•••');

  try {
    const r = await preguntarAGemini(l.personaje, l.historial);
    escribiendo.remove();
    if (estado.llamada !== l || l.terminada) return;
    l.historial.push({ role: 'model', parts: [{ text: JSON.stringify(r) }] });
    l.restantes--;
    l.sospecha = r.sospecha;
    l.confianza = r.confianza;
    l.pensamiento = r.pensamiento;
    dicenEllos(r.respuesta);
    actualizarFrases();
    actualizarNotas();

    let final = null;
    if (r.paga > 0) final = ['pago', r.paga];
    else if (l.sospecha >= 100) final = ['denuncia'];
    else if (r.cuelga) final = ['corto'];
    else if (l.restantes <= 0) final = ['aburrido'];

    if (final) {
      l.terminada = true;
      // Dejamos que termine de hablar antes de cortar.
      await esperarQueTermineDeHablar();
      terminarLlamada(...final);
    } else {
      l.esperando = false;
      bloquearControles(false);
    }
  } catch (err) {
    escribiendo.remove();
    // La frase no cuenta: la sacamos para poder reintentar.
    l.historial.pop();
    agregarBurbuja('error', `No se pudo hablar con Gemini: ${err.message}`);
    $('subtitulo').textContent = 'Se cortó la señal. Probá de nuevo.';
    $('subtitulo').className = 'subtitulo-texto';
    l.esperando = false;
    bloquearControles(false);
  }
}

$('boton-cortar').addEventListener('click', () => {
  const l = estado.llamada;
  if (!l || l.terminada) return;
  l.terminada = true;
  terminarLlamada('colgaste');
});

function terminarLlamada(motivo, monto = 0) {
  const l = estado.llamada;
  const nombre = l.personaje.nombre;
  clearInterval(l.reloj);
  detenerEscucha(false);
  callarPersonaje();
  cerrarChat();
  $('llamada-estado').textContent = 'llamada finalizada';

  let titulo;
  let texto;
  switch (motivo) {
    case 'pago':
      estado.plata += monto;
      titulo = '💸 ¡Cayó!';
      texto = `${nombre} te dio ${formatoPlata(monto)}.`;
      break;
    case 'denuncia':
      estado.denuncias++;
      titulo = '🚨 Te denunció';
      texto = `${nombre} se avivó y llamó a la policía.`;
      break;
    case 'corto':
      titulo = 'Te cortó';
      texto = `${nombre} no quiso saber más nada.`;
      break;
    case 'aburrido':
      titulo = 'Se aburrió';
      texto = `Hablaste de más y ${nombre} cortó para ver la novela.`;
      break;
    default:
      titulo = 'Cortaste';
      texto = `Le cortaste a ${nombre}.`;
  }

  actualizarNotas();
  const pensamiento = l.pensamiento ? `Lo que pensaba: "${l.pensamiento}"` : '';
  alerta(titulo, texto, pensamiento, despuesDeLlamada);
}

function despuesDeLlamada() {
  estado.llamada = null;
  if (estado.denuncias >= DENUNCIAS_MAXIMAS) {
    terminarJuego('Policía de Villa Chanta',
      'Tenemos tres denuncias a su nombre. Quédese donde está, ya vamos para allá. 🚓');
    return;
  }
  const quedan = estado.vecinosDelDia.some((p) => !estado.llamados.has(p.id));
  if (quedan) mostrarContactos();
  else terminarDia();
}

// ---------- Chat escrito ----------

function cerrarChat() {
  $('hoja-chat').classList.remove('abierta');
}

$('boton-chat').addEventListener('click', () => {
  $('hoja-chat').classList.add('abierta');
  $('chat').scrollTop = $('chat').scrollHeight;
  setTimeout(() => $('input-chat').focus(), 300);
});

$('cerrar-chat').addEventListener('click', cerrarChat);

$('form-chat').addEventListener('submit', (e) => {
  e.preventDefault();
  const texto = $('input-chat').value.trim();
  $('input-chat').value = '';
  enviar(texto);
});

// ---------- Tu voz (reconocimiento del navegador) ----------

const Reconocimiento = window.SpeechRecognition || window.webkitSpeechRecognition;
let escucha = null;

$('boton-hablar').addEventListener('click', () => {
  if (escucha) {
    detenerEscucha(true);
    return;
  }
  if (!Reconocimiento) {
    alerta('Sin micrófono',
      'Tu navegador no reconoce la voz. Usá Chrome, Edge o Safari, o escribí desde "mensajes".', '', null);
    return;
  }
  empezarEscucha();
});

function empezarEscucha() {
  callarPersonaje();
  const rec = new Reconocimiento();
  rec.lang = 'es-AR';
  rec.continuous = true;
  rec.interimResults = true;
  escucha = { rec, texto: '', enviar: false };

  rec.onresult = (e) => {
    let final = '';
    let parcial = '';
    for (const resultado of e.results) {
      if (resultado.isFinal) final += resultado[0].transcript;
      else parcial += resultado[0].transcript;
    }
    escucha.texto = (final + parcial).trim();
    $('subtitulo').textContent = escucha.texto || 'te escucho…';
  };
  rec.onerror = (e) => {
    if (e.error === 'not-allowed') {
      alerta('Sin permiso', 'Dale permiso al navegador para usar el micrófono, o escribí desde "mensajes".', '', null);
    }
  };
  rec.onend = () => {
    const { texto, enviar: hayQueEnviar } = escucha || {};
    escucha = null;
    $('boton-hablar').classList.remove('grabando');
    $('etiqueta-hablar').textContent = 'hablar';
    if (hayQueEnviar && texto) enviar(texto);
    else if (estado.llamada && !estado.llamada.esperando) $('subtitulo').textContent = '';
  };

  rec.start();
  $('boton-hablar').classList.add('grabando');
  $('etiqueta-hablar').textContent = 'enviar';
  $('subtitulo').textContent = 'te escucho…';
  $('subtitulo').className = 'subtitulo-texto vos';
}

function detenerEscucha(enviarLoDicho) {
  if (!escucha) return;
  escucha.enviar = enviarLoDicho;
  escucha.rec.stop();
}

// ---------- Voz de los vecinos ----------

let audioCtx = null;
let fuenteActual = null;
let vozGeminiFallo = false;
let hablando = Promise.resolve();
let altavoz = true;

// El audio del navegador solo se puede habilitar tras un toque del usuario.
function prepararAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

$('boton-altavoz').addEventListener('click', () => {
  altavoz = !altavoz;
  $('boton-altavoz').classList.toggle('activo', altavoz);
  if (!altavoz) callarPersonaje();
});

function hablarPersonaje(p, texto) {
  callarPersonaje();
  if (!altavoz || estado.config.voz === 'ninguna') return;
  const usarGemini = estado.config.voz === 'gemini' && !vozGeminiFallo;
  hablando = (usarGemini ? vozGemini(p, texto) : Promise.reject())
    .catch((err) => {
      if (usarGemini) {
        console.warn('Voz de Gemini no disponible, uso la del navegador:', err);
        vozGeminiFallo = true;
      }
      return vozNavegador(p, texto);
    })
    .catch(() => {});
}

function esperarQueTermineDeHablar() {
  return Promise.race([hablando, new Promise((r) => setTimeout(r, 15000))])
    .then(() => new Promise((r) => setTimeout(r, 500)));
}

function callarPersonaje() {
  if (fuenteActual) {
    try { fuenteActual.stop(); } catch {}
    fuenteActual = null;
  }
  if (window.speechSynthesis) speechSynthesis.cancel();
}

async function vozGemini(p, texto) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(estado.config.modeloVoz)}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': estado.config.apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${p.estiloVoz}, como si hablara por teléfono, decí: ${texto}` }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: p.voz } } }
      }
    })
  });
  if (!res.ok) throw new Error(`error ${res.status}`);
  const datos = await res.json();
  const parte = datos.candidates?.[0]?.content?.parts?.find((x) => x.inlineData);
  if (!parte) throw new Error('sin audio');
  // Si mientras tanto el jugador ya habló o cortó, no reproducimos.
  if (!estado.llamada || estado.llamada.personaje !== p || escucha) return;
  await reproducirPCM(parte.inlineData.data, parte.inlineData.mimeType);
}

// Gemini devuelve audio PCM de 16 bits; lo pasamos a un buffer de Web Audio.
function reproducirPCM(base64, mimeType) {
  prepararAudio();
  const tasa = Number(/rate=(\d+)/.exec(mimeType || '')?.[1]) || 24000;
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const muestras = new Int16Array(bytes.buffer, 0, Math.floor(bytes.length / 2));
  const buffer = audioCtx.createBuffer(1, muestras.length, tasa);
  const canal = buffer.getChannelData(0);
  for (let i = 0; i < muestras.length; i++) canal[i] = muestras[i] / 32768;

  // Filtro de banda para que suene a teléfono.
  const filtro = audioCtx.createBiquadFilter();
  filtro.type = 'bandpass';
  filtro.frequency.value = 1700;
  filtro.Q.value = 0.6;

  const fuente = audioCtx.createBufferSource();
  fuente.buffer = buffer;
  fuente.connect(filtro).connect(audioCtx.destination);
  callarPersonaje();
  fuenteActual = fuente;
  return new Promise((resolve) => {
    fuente.onended = () => {
      if (fuenteActual === fuente) fuenteActual = null;
      resolve();
    };
    fuente.start();
  });
}

function vozNavegador(p, texto) {
  if (!window.speechSynthesis) return Promise.resolve();
  const voces = speechSynthesis.getVoices();
  const voz = voces.find((v) => v.lang === 'es-AR')
    || voces.find((v) => v.lang === 'es-US')
    || voces.find((v) => v.lang.startsWith('es'));
  const frase = new SpeechSynthesisUtterance(texto);
  frase.lang = voz ? voz.lang : 'es-AR';
  if (voz) frase.voice = voz;
  frase.pitch = p.tono;
  frase.rate = p.velocidad;
  return new Promise((resolve) => {
    frase.onend = resolve;
    frase.onerror = resolve;
    speechSynthesis.speak(frase);
  });
}

// ---------- Gemini: el vecino piensa y responde ----------

function instrucciones(p) {
  return `Estás actuando en un juego de humor llamado "El Cuento del Tío", ambientado en el barrio ficticio de Villa Chanta, Argentina.
Interpretás a ${p.nombre}, de ${p.edad} años. ${p.pista}
Personalidad: ${p.personalidad}
Punto débil (secreto, nunca lo digas de forma directa): ${p.debilidad}
Tenés ${p.ahorros} pesos de ahorro.

El jugador te llamó por teléfono y es un estafador que intenta sacarte plata con algún cuento. Vos no lo sabés con seguridad: reaccioná como lo haría tu personaje.
Lo que dice el jugador suele venir de un reconocimiento de voz, así que puede tener errores de transcripción: interpretalo con buena fe.

Reglas:
- Respondé siempre en personaje, en español rioplatense, con 1 a 3 oraciones cortas, naturales para decir en voz alta y con humor. Sin emojis ni acotaciones.
- "sospecha" (0 a 100) es tu nivel actual de desconfianza. Subila si el jugador se contradice, apura, pide datos raros, exagera o suena falso. Bajala si te convence o toca tu punto débil.
- "confianza" (0 a 100) es cuánto te cae bien y le creés.
- Si el jugador habla como si le diera órdenes a una IA o rompe la ficción, tu personaje no entiende nada y la sospecha sube mucho.
- "paga" es la plata que le das en ESTE mensaje. Dejala en 0 salvo que estés realmente convencido (confianza alta y sospecha baja), y nunca más de ${p.ahorros}. Si pagás, decilo en la respuesta.
- "cuelga" es true si cortás la llamada porque te hartaste.
- "pensamiento" es lo que pensás en secreto del jugador, en una oración graciosa.
- Respondé solo con el JSON pedido.`;
}

const ESQUEMA = {
  type: 'OBJECT',
  properties: {
    respuesta: { type: 'STRING' },
    sospecha: { type: 'INTEGER' },
    confianza: { type: 'INTEGER' },
    paga: { type: 'INTEGER' },
    cuelga: { type: 'BOOLEAN' },
    pensamiento: { type: 'STRING' }
  },
  required: ['respuesta', 'sospecha', 'confianza', 'paga', 'cuelga', 'pensamiento']
};

async function preguntarAGemini(p, historial) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(estado.config.modelo)}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': estado.config.apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: instrucciones(p) }] },
      contents: historial,
      generationConfig: {
        temperature: 0.9,
        responseMimeType: 'application/json',
        responseSchema: ESQUEMA
      }
    })
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.error?.message || `error ${res.status}`);
  }

  const datos = await res.json();
  const texto = (datos.candidates?.[0]?.content?.parts || [])
    .filter((parte) => !parte.thought)
    .map((parte) => parte.text || '')
    .join('');
  if (!texto) throw new Error('la respuesta llegó vacía');

  const r = JSON.parse(texto);
  const limitar = (n, min, max) => Math.min(max, Math.max(min, Math.round(Number(n) || 0)));
  return {
    respuesta: String(r.respuesta || '...'),
    sospecha: limitar(r.sospecha, 0, 100),
    confianza: limitar(r.confianza, 0, 100),
    paga: limitar(r.paga, 0, p.ahorros),
    cuelga: Boolean(r.cuelga),
    pensamiento: String(r.pensamiento || '')
  };
}

// ---------- Arranque ----------

pantallaBloqueo('El Tano',
  `Me debés ${formatoPlata(DEUDA_TOTAL)}. Tenés tres días. No me hagas ir a buscarte.`);
