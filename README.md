# 📞 El Cuento del Tío

Juego de humor para el navegador. Sos un chanta que le debe plata al Tano y tenés tres días para juntarla llamando a los vecinos de Villa Chanta. Cada vecino lo interpreta una IA (Gemini) con su propia personalidad y su punto débil.

## Cómo jugar

1. Conseguí una API key gratis en [Google AI Studio](https://aistudio.google.com/apikey).
2. Abrí `index.html` en el navegador.
3. Pegá la key y tocá **Empezar**.

La key se guarda solo en tu navegador (`localStorage`) y se envía únicamente a la API de Google. No la escribas en el código ni la subas al repositorio.

## Reglas

- Cada día te tocan 3 vecinos, cada vez más difíciles.
- Tenés 10 mensajes por llamada para convencerlos.
- Si la sospecha llega al 100%, te denuncian. Con 3 denuncias, perdés.
- Hay que llegar a la meta de plata al final de cada día.

## Archivos

- `index.html`: pantallas del juego.
- `styles.css`: estilos.
- `personajes.js`: los vecinos y las metas de cada día. Acá podés agregar personajes nuevos.
- `script.js`: lógica del juego y conexión con Gemini.
