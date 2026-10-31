# 📞 El Cuento del Tío

Juego de humor para el navegador. Sos un chanta que le debe plata al Tano y tenés tres días para juntarla llamando por teléfono a los vecinos de Villa Chanta. Cada vecino lo interpreta una IA (Gemini) con su propia personalidad, su voz y su punto débil.

## Cómo jugar

1. Conseguí una API key gratis en [Google AI Studio](https://aistudio.google.com/apikey).
2. Abrí `index.html` en Chrome, Edge o Safari.
3. Tocá la notificación del Tano, pegá la key en Ajustes y tocá **Listo**.
4. Elegí a quién llamar y hablale con el botón **hablar**, o escribile desde **mensajes**.

La key se guarda solo en tu navegador (`localStorage`) y se envía únicamente a la API de Google. No la escribas en el código ni la subas al repositorio.

## Reglas

- Cada día te tocan 3 vecinos, cada vez más difíciles.
- Tenés 10 frases por llamada para convencerlos.
- Si la sospecha llega al 100%, te denuncian. Con 3 denuncias, perdés.
- Hay que llegar a la meta de plata al final de cada día.

## Voz

- **Tu voz:** la reconoce el navegador (Chrome, Edge o Safari). En Firefox se juega escribiendo.
- **La voz de los vecinos:** la genera Gemini, con una voz distinta para cada uno. Si falla o se termina la cuota gratis, se usa la voz del navegador. Se puede cambiar en Ajustes.

## Archivos

- `index.html`: el escritorio, el corcho y el iPhone con sus pantallas.
- `styles.css`: estilos.
- `personajes.js`: los vecinos, sus voces y las metas de cada día. Acá podés agregar personajes nuevos.
- `script.js`: lógica del juego, voz y conexión con Gemini.
