# 📞 El Cuento del Tío

Juego de humor para el navegador. Sos un chanta que le debe plata al Tano y tenés tres días para juntarla llamando por teléfono a los vecinos de Villa Chanta. Cada vecino lo interpreta una IA (Gemini) con su propia personalidad, su voz y su punto débil.

## Cómo jugar

1. Conseguí una API key gratis en [Google AI Studio](https://aistudio.google.com/apikey).
2. Abrí `index.html` en Chrome, Edge o Safari.
3. Tocá la notificación del Tano, pegá la key en Ajustes y tocá **Listo**.
4. Elegí a quién llamar y hablale como en una llamada normal, o escribile desde **mensajes**.

La key se guarda solo en tu navegador (`localStorage`) y se envía únicamente a la API de Google. No la escribas en el código ni la subas al repositorio.

## Jugar en el celular

El juego está pensado para jugarse en el celular, parado (en vertical).

- Para que se vea a pantalla completa, como una app, agregalo a la pantalla de inicio:
  - **iPhone (Safari):** botón Compartir → **Agregar a inicio**.
  - **Android (Chrome):** menú ⋮ → **Instalar app** o **Agregar a la pantalla principal**.
- Durante una llamada la pantalla no se apaga.
- En iPhone, la voz de los vecinos suena aunque el celular esté en silencio (Safari 16.4 o más nuevo).

## Reglas

- Cada día te tocan 3 vecinos, cada vez más difíciles.
- En la lista de contactos ves qué se dice de cada vecino: ahí está la pista de su punto débil.
- Si le tocás el punto débil, se va convenciendo. Los del primer día caen en pocas frases; los del tercero cuestan bastante más.
- Tenés 10 frases por llamada para convencerlos.
- Si la sospecha llega al 100%, te denuncian. Con 3 denuncias, perdés.
- Hay que llegar a la meta de plata al final de cada día.

## Voz

El juego tiene dos modos, que se eligen en Ajustes:

- **En vivo (recomendado):** usa Gemini Live. Hablás y el vecino te contesta al instante con su propia voz, como una llamada de verdad. En el plan gratis de Gemini no tiene límite diario de pedidos.
- **Clásico:** el navegador reconoce tu voz, Gemini Flash-Lite contesta por texto (unas 500 frases por día gratis) y la voz del vecino es la del navegador.

Los modelos se eligen solos: el juego le pregunta a tu cuenta de Google cuáles tiene disponibles. Si el modo en vivo no conecta, la llamada sigue sola en modo clásico. En las dos opciones también se puede escribir desde **mensajes**.

## Archivos

- `index.html`: el escritorio, el corcho y el iPhone con sus pantallas.
- `styles.css`: estilos.
- `personajes.js`: los vecinos, sus voces y las metas de cada día. Acá podés agregar personajes nuevos.
- `script.js`: lógica del juego, modo clásico y elección de modelos.
- `en-vivo.js`: llamada en tiempo real con Gemini Live.
- `captura-audio.js`: pasa el micrófono al formato que pide Gemini Live.
- `manifest.webmanifest` e `img/`: datos e íconos para instalarlo como app.
