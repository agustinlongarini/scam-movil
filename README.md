# 📞 El Cuento del Tío

Juego de humor para el navegador. Sos un chanta que le debe plata al Tano y todas las noches tenés que pagarle, llamando por teléfono a los vecinos de Villa Chanta para sacarles plata. Cada vecino lo interpreta una IA (Gemini) con su propia personalidad, su voz y su punto débil.

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

- Los días no terminan nunca: cada noche el Tano pasa a cobrar. Si tenés la plata, se la lleva y seguís con lo que te sobró. El día que no llegás, perdés.
- Cada día el Tano pide un 35 % más ($4.000 el primer día, unos $13.500 el quinto, $59.500 el décimo) y los vecinos son más difíciles de convencer.
- Se guarda tu récord de días aguantados.
- Cada día te tocan 3 vecinos. Gemini los inventa nuevos cada día (con un solo pedido) y no repite nombres. Si preferís, en Ajustes podés jugar siempre con los 9 vecinos de siempre, que también se usan si Gemini falla.
- Para sacarles plata hay que trabajarlos: primero desconfían, después preguntan y negocian, y recién pagan cuando aceptan un monto. Descubrir su punto débil es parte del juego.
- Tenés 3 minutos por llamada para convencerlos. Cuando se termina el tiempo, el vecino se despide y corta.
- Si la sospecha llega al 100%, el vecino se avivó y te corta.
- Bardear a un vecino en broma vale: te contesta con humor.

## Voz

El juego tiene dos modos, que se eligen en Ajustes:

- **En vivo (recomendado):** usa Gemini Live. Hablás y el vecino te contesta al instante con su propia voz, como una llamada de verdad. En el plan gratis de Gemini no tiene límite diario de pedidos.
- **Clásico:** el navegador reconoce tu voz, Gemini Flash-Lite contesta por texto (unas 500 frases por día gratis) y la voz del vecino es la del navegador.

Los modelos se eligen solos: el juego le pregunta a tu cuenta de Google cuáles tiene disponibles. Si el modo en vivo no conecta, la llamada sigue sola en modo clásico. En las dos opciones también se puede escribir desde **mensajes**.

## Archivos

- `index.html`: el escritorio, el corcho y el iPhone con sus pantallas.
- `styles.css`: estilos.
- `personajes.js`: los 9 vecinos de siempre (también son el respaldo si Gemini no puede inventar nuevos).
- `script.js`: lógica del juego, modo clásico y elección de modelos.
- `en-vivo.js`: llamada en tiempo real con Gemini Live.
- `captura-audio.js`: pasa el micrófono al formato que pide Gemini Live.
- `manifest.webmanifest` e `img/`: datos e íconos para instalarlo como app.
