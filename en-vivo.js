// Llamada en tiempo real con la API Live de Gemini (WebSocket).
// El micrófono se manda como audio PCM de 16 kHz y el vecino contesta con
// audio PCM de 24 kHz, más la transcripción de lo que dice cada uno.

const URL_EN_VIVO = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

function aBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binario = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binario += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(binario);
}

function nivelDe(buffer) {
  const pcm = new Int16Array(buffer);
  let suma = 0;
  for (let i = 0; i < pcm.length; i++) suma += pcm[i] * pcm[i];
  return Math.min(1, Math.sqrt(suma / (pcm.length || 1)) / 6000);
}

class LlamadaEnVivo {
  // opciones: { apiKey, modelo, voz, instrucciones, herramientas, audioCtx, eventos }
  // eventos: onTuTexto(texto), onSuTexto(texto), onFinDeTurno(), onHerramienta(nombre, args),
  //          onError(mensaje), onMicrofono(ok, error), onNivel(nivel, estado)
  constructor(opciones) {
    this.o = opciones;
    this.ev = opciones.eventos;
    this.ctx = opciones.audioCtx;
    this.ws = null;
    this.cerrada = false;
    this.listo = false;
    this.silenciado = false;
    this.fuentes = new Set();
    this.siguiente = 0;
    this.salida = this.ctx.createGain();
    this.finDeAudioMs = 0;
    this.diag = [];
    this.cuenta = { enviados: 0, bloqueados: 0, silenciados: 0, tuTexto: 0, suTexto: 0, audio: 0, herramientas: 0, turnos: 0 };
    this.inicioMs = performance.now();
    this.log(`modelo ${this.o.modelo}, voz ${this.o.voz}, audio ${this.ctx.sampleRate} Hz (${this.ctx.state})`);
    this.log(navigator.userAgent);

    // Filtro de banda para que suene a teléfono.
    const filtro = this.ctx.createBiquadFilter();
    filtro.type = 'bandpass';
    filtro.frequency.value = 1700;
    filtro.Q.value = 0.6;
    this.salida.connect(filtro).connect(this.ctx.destination);
  }

  // Registro de lo que pasa en la llamada, para poder diagnosticar problemas.
  log(texto) {
    const seg = ((performance.now() - this.inicioMs) / 1000).toFixed(1);
    this.diag.push(`[${seg}s] ${texto}`);
    if (this.diag.length > 120) this.diag.splice(1, 1);
  }

  diagnostico() {
    const c = this.cuenta;
    return [
      ...this.diag,
      `resumen: micrófono enviado ${c.enviados} trozos (bloqueados mientras habla el vecino: ${c.bloqueados}, silenciado: ${c.silenciados}); ` +
      `transcripciones tuyas ${c.tuTexto}, del vecino ${c.suTexto}; audios ${c.audio}; funciones ${c.herramientas}; turnos ${c.turnos}`
    ].join('\n');
  }

  // Abre la conexión y espera a que Gemini confirme la configuración.
  conectar() {
    return new Promise((resolve, reject) => {
      const limite = setTimeout(() => {
        reject(new Error('Gemini Live no respondió'));
        this.cerrar();
      }, 12000);

      this.ws = new WebSocket(`${URL_EN_VIVO}?key=${encodeURIComponent(this.o.apiKey)}`);

      this.ws.onopen = () => {
        this.enviar({
          setup: {
            model: this.o.modelo.startsWith('models/') ? this.o.modelo : `models/${this.o.modelo}`,
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: this.o.voz } } }
            },
            systemInstruction: { parts: [{ text: this.o.instrucciones }] },
            tools: [{ functionDeclarations: this.o.herramientas }],
            inputAudioTranscription: {},
            outputAudioTranscription: {}
          }
        });
      };

      this.ws.onmessage = async (e) => {
        const texto = typeof e.data === 'string' ? e.data : await e.data.text();
        let msj;
        try {
          msj = JSON.parse(texto);
        } catch {
          return;
        }
        if (msj.setupComplete) {
          this.log('conectado (setupComplete)');
          clearTimeout(limite);
          this.listo = true;
          resolve();
          return;
        }
        this.recibir(msj);
      };

      this.ws.onclose = (e) => {
        this.log(`conexión cerrada: código ${e.code} ${e.reason || ''}`);
        clearTimeout(limite);
        const motivo = e.reason || `la conexión se cerró (código ${e.code})`;
        if (!this.listo) {
          reject(new Error(motivo));
        } else if (!this.cerrada) {
          this.ev.onError(motivo);
        }
        this.cerrar();
      };

      this.ws.onerror = () => {};
    });
  }

  enviar(objeto) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(objeto));
  }

  // Le habla al vecino por escrito (el chat, o indicaciones del juego).
  enviarTexto(texto) {
    this.log(`texto enviado: ${texto.slice(0, 60)}`);
    // Va por el mismo canal que el audio: los modelos Live nuevos solo aceptan
    // "clientContent" para cargar historial al empezar.
    this.enviar({ realtimeInput: { text: texto } });
  }

  async abrirMicrofono() {
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('este navegador no permite usar el micrófono (¿la página es https?)');
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 }
      });
      const pista = this.stream.getAudioTracks()[0];
      this.log(`micrófono abierto: ${pista?.label || 'sin nombre'} ${JSON.stringify(pista?.getSettings?.() || {})}`);
      if (!LlamadaEnVivo.capturaCargada) {
        await this.ctx.audioWorklet.addModule('captura-audio.js?v=11');
        LlamadaEnVivo.capturaCargada = true;
      }
      if (this.cerrada) return this.cerrarMicrofono();
      if (this.ctx.state !== 'running') await this.ctx.resume();

      this.fuenteMic = this.ctx.createMediaStreamSource(this.stream);
      this.captura = new AudioWorkletNode(this.ctx, 'captura-16k');
      const mudo = this.ctx.createGain();
      mudo.gain.value = 0;
      this.fuenteMic.connect(this.captura).connect(mudo).connect(this.ctx.destination);
      this.log(`captura lista, audio ${this.ctx.state}`);

      this.captura.port.onmessage = (e) => {
        const nivel = nivelDe(e.data);
        let estado;
        if (this.silenciado) {
          estado = 'silenciado';
          this.cuenta.silenciados++;
        } else if (this.estaHablando()) {
          // Mientras habla el vecino no mandamos el micrófono: si no, el parlante
          // del celular se mete en el micrófono y el vecino se interrumpe solo.
          estado = 'vecino';
          this.cuenta.bloqueados++;
        } else {
          estado = 'enviando';
          this.cuenta.enviados++;
          if (this.cuenta.enviados === 1) this.log('primer audio del micrófono enviado');
          this.enviar({ realtimeInput: { audio: { data: aBase64(e.data), mimeType: 'audio/pcm;rate=16000' } } });
        }
        this.ev.onNivel(nivel, estado);
      };
      this.ev.onMicrofono(true);
    } catch (err) {
      this.log(`error de micrófono: ${err.name || ''} ${err.message}`);
      this.ev.onMicrofono(false, err);
    }
  }

  cerrarMicrofono() {
    if (this.stream) this.stream.getTracks().forEach((t) => t.stop());
    if (this.fuenteMic) this.fuenteMic.disconnect();
    if (this.captura) this.captura.disconnect();
    this.stream = this.fuenteMic = this.captura = null;
  }

  silenciar(silenciado) {
    this.silenciado = silenciado;
  }

  altavoz(encendido) {
    this.salida.gain.value = encendido ? 1 : 0;
  }

  // true mientras suena la voz del vecino (y un instante después, por el eco).
  // Usamos el reloj real: si el audio del navegador quedara en pausa, no
  // queremos bloquear el micrófono para siempre.
  estaHablando() {
    return performance.now() < this.finDeAudioMs + 350;
  }

  esperarFinDeAudio(maximo = 15000) {
    return new Promise((resolve) => {
      const inicio = Date.now();
      const revisar = () => {
        if (!this.estaHablando() || Date.now() - inicio > maximo) resolve();
        else setTimeout(revisar, 150);
      };
      revisar();
    });
  }

  recibir(msj) {
    if (msj.goAway) this.log('Google avisa que va a cortar la conexión');
    if (msj.toolCallCancellation) this.log('Google canceló una función');
    if (!msj.serverContent && !msj.toolCall && !msj.toolCallCancellation && !msj.goAway) {
      this.log(`mensaje desconocido: ${JSON.stringify(msj).slice(0, 200)}`);
    }
    if (msj.toolCall) {
      this.cuenta.herramientas++;
      this.log(`función: ${JSON.stringify(msj.toolCall.functionCalls || []).slice(0, 200)}`);
      const respuestas = (msj.toolCall.functionCalls || []).map((llamada) => {
        this.ev.onHerramienta(llamada.name, llamada.args || {});
        return { id: llamada.id, name: llamada.name, response: { result: 'ok' } };
      });
      this.enviar({ toolResponse: { functionResponses: respuestas } });
      return;
    }

    const c = msj.serverContent;
    if (!c) return;

    if (c.interrupted) {
      this.log('el vecino fue interrumpido');
      this.callar();
    }
    if (c.inputTranscription?.text) {
      if (!this.cuenta.tuTexto) this.log('Gemini escuchó tu voz por primera vez');
      this.cuenta.tuTexto++;
      this.ev.onTuTexto(c.inputTranscription.text);
    }
    if (c.outputTranscription?.text) {
      this.cuenta.suTexto++;
      this.ev.onSuTexto(c.outputTranscription.text);
    }

    for (const parte of c.modelTurn?.parts || []) {
      if (parte.inlineData?.data) this.reproducir(parte.inlineData.data, parte.inlineData.mimeType);
    }

    if (c.turnComplete) {
      this.cuenta.turnos++;
      this.ev.onFinDeTurno();
    }
  }

  reproducir(base64, mimeType) {
    const tasa = Number(/rate=(\d+)/.exec(mimeType || '')?.[1]) || 24000;
    const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
    const muestras = new Int16Array(bytes.buffer, 0, Math.floor(bytes.length / 2));
    if (!muestras.length) return;
    this.cuenta.audio++;
    if (this.ctx.state !== 'running') this.ctx.resume();
    const buffer = this.ctx.createBuffer(1, muestras.length, tasa);
    const canal = buffer.getChannelData(0);
    for (let i = 0; i < muestras.length; i++) canal[i] = muestras[i] / 32768;

    const fuente = this.ctx.createBufferSource();
    fuente.buffer = buffer;
    fuente.connect(this.salida);
    // Encolamos los trozos uno detrás de otro para que no se corte la voz.
    const inicio = Math.max(this.ctx.currentTime + 0.05, this.siguiente);
    fuente.start(inicio);
    this.siguiente = inicio + buffer.duration;
    this.finDeAudioMs = performance.now() + (this.siguiente - this.ctx.currentTime) * 1000;
    this.fuentes.add(fuente);
    fuente.onended = () => this.fuentes.delete(fuente);
  }

  callar() {
    this.fuentes.forEach((f) => {
      try { f.stop(); } catch {}
    });
    this.fuentes.clear();
    this.siguiente = 0;
    this.finDeAudioMs = 0;
  }

  cerrar() {
    if (this.cerrada) return;
    this.cerrada = true;
    this.log('llamada terminada');
    LlamadaEnVivo.ultimoDiagnostico = this.diagnostico();
    try { localStorage.setItem('diagnostico', LlamadaEnVivo.ultimoDiagnostico); } catch {}
    this.callar();
    this.cerrarMicrofono();
    try { this.salida.disconnect(); } catch {}
    if (this.ws && this.ws.readyState <= WebSocket.OPEN) this.ws.close();
  }
}
