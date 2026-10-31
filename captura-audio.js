// Procesador de audio que baja el micrófono a 16 kHz y lo manda en trozos de 100 ms.
// Lo usa en-vivo.js con audioWorklet.addModule.
class Captura16k extends AudioWorkletProcessor {
  constructor() {
    super();
    this.paso = sampleRate / 16000;
    this.pos = 0;
    this.suma = 0;
    this.n = 0;
    this.salida = [];
  }
  process(entradas) {
    const canal = entradas[0] && entradas[0][0];
    if (!canal) return true;
    for (let i = 0; i < canal.length; i++) {
      this.suma += canal[i];
      this.n++;
      this.pos++;
      if (this.pos >= this.paso) {
        this.pos -= this.paso;
        this.salida.push(this.suma / this.n);
        this.suma = 0;
        this.n = 0;
      }
    }
    if (this.salida.length >= 1600) {
      const pcm = new Int16Array(this.salida.length);
      for (let i = 0; i < pcm.length; i++) {
        const s = Math.max(-1, Math.min(1, this.salida[i]));
        pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      this.port.postMessage(pcm.buffer, [pcm.buffer]);
      this.salida = [];
    }
    return true;
  }
}
registerProcessor('captura-16k', Captura16k);
