# Kaki EQ — Página Web Oficial de Promoción y Descarga 🎵

Sitio web responsivo y moderno diseñado con la identidad visual y estilo de **Kaki EQ**, el reproductor de audio de alta fidelidad con motor DirectX BASS y diseño nativo Fluent / WinUI 3 para Windows 11 y 10.

---

## 🚀 Características de la Página Web

- **Diseño WinUI 3 Fluent / Mica:**
  - Fondos translúcidos con efecto acrílico (`backdrop-filter: blur`), bordes con brillos púrpuras neón (`#BB86FC`) y cian (`#03DAC6`).
  - Soporte completo para **Tema Oscuro (Dark Mode)** y **Tema Claro (Light Mode)** con persistencia en `localStorage`.
  - Animaciones fluidas a 60+ FPS, efectos de iluminación ambiental y micro-interacciones.

- **Simulador Interactivo del Ecualizador DSP de 10 Bandas:**
  - Controles deslizantes verticales para las 10 frecuencias exactas de la aplicación: `32Hz`, `64Hz`, `125Hz`, `250Hz`, `500Hz`, `1kHz`, `2kHz`, `4kHz`, `8kHz`, `16kHz`, además del control de Ganancia (**PREAMP**).
  - **Curva de Respuesta de Frecuencia DSP en Tiempo Real:** Renderizada en `<canvas>` con interpolación cúbica spline Hermite / Catmull-Rom y gradientes luminiscentes.
  - Perfiles preconfigurados: *Plano*, *Refuerzo de Bajos*, *Rock*, *Claridad Vocal*, *Brillo & Aire*, *Club / Electrónica*, *Pop* y *Jazz*.
  - Tarjetas de mejora rápida: *Refuerzo de Bajos* (+6 dB), *Claridad Vocal* (+4 dB) y *Brillo & Aire* (+5 dB).
  - **Audio Demo con Web Audio API:** Permite reproducir un bucle musical sintetizado en el navegador y escuchar en tiempo real cómo los 10 nodos `BiquadFilterNode` modifican el sonido.

- **Mockup Interactivo de la Aplicación:**
  - Marco de ventana WinUI 3 con pestañas interactivas para previsualizar diferentes pantallas (*Inicio*, *Ecualizador*, *Now Playing / Letras*, *Mini-Player*).
  - Widget flotante Picture-in-Picture con animación suave de elevación.

- **Galería de Capturas con Modal Lightbox a Pantalla Completa:**
  - Filtros por categoría (*Pantalla Principal*, *Ecualizador DSP*, *Mini-Player*, *Biblioteca*, *Metadatos & Sistema*).
  - Visor modal con navegación mediante botones y teclado (flechas izquierda/derecha y tecla Escape).

- **Hub de Descarga Directa del Instalador:**
  - Enlace directo al ejecutable oficial: `downloads/KakiEQ_Setup_v1.0.exe` (67.5 MB).
  - Verificación de integridad con código hash **SHA-256** y botón para copiar con un solo clic:
    ```
    18E552DD20135CB381F1E0E8C09AC9CF576005A740FE9B0D0F6D637EA47B82F9
    ```
  - Guía visual en 3 sencillos pasos para instalar en Windows.
  - Sección de Preguntas Frecuentes (FAQ) desplegable con animación acordeón.

---

## 📁 Estructura del Proyecto

```text
Descarga-KakiEQ/
│
├── index.html                     # Estructura semántica HTML5
│
├── css/
│   └── styles.css                 # Sistema de diseño WinUI 3, temas claro/oscuro y animaciones
│
├── js/
│   ├── equalizer-simulator.js     # Simulador DSP de 10 bandas con Web Audio API y Canvas Spline
│   └── main.js                    # Temas, pestañas de previsualización, lightbox y acordeones
│
├── assets/
│   ├── brand/                     # Logotipos oficiales e iconos de Kaki EQ y CFJyA
│   │   ├── Kaki_Oficial_Blanco.png
│   │   ├── Kaki_Oficial_Negro.png
│   │   ├── CY_L_Oficial_Transparente.png
│   │   └── favicon.ico
│   │
│   └── screenshots/               # Capturas oficiales de alta resolución (1920x1024)
│       ├── Home.png
│       ├── Equalizer.png
│       ├── NowPlaying.png
│       ├── Mini-player_1.png
│       ├── Mini-player_2.png
│       ├── Mini-player_3.png
│       ├── Album.png
│       ├── Artist_Detail.png
│       ├── Metadata_1.png
│       └── WindowsControls.png
│
└── downloads/
    └── KakiEQ_Setup_v1.0.exe      # Instalador oficial para Windows (x64)
```

---

## 🌐 Cómo Visualizar la Página Web

La web está construida con tecnologías nativas modernas (**HTML5, CSS3 y JavaScript ES6+**) con cero dependencias de compilación:

1. **Apertura Directa:** Haz doble clic sobre el archivo `index.html` para abrirlo en cualquier navegador web moderno (Edge, Chrome, Firefox, Brave, Safari, etc.).
2. **Servidor Local (Opcional):**
   - Con Python: `python -m http.server 8080` y abrir `http://localhost:8080`
   - Con VS Code: Clic derecho en `index.html` &rarr; *Open with Live Server*
   - Con npx: `npx serve .`

---

## 💻 Compatibilidad del Instalador de Kaki EQ

- **Sistemas Operativos:** Windows 11 / Windows 10 (Compilación 19041 o superior)
- **Arquitectura:** 64 bits (x64)
- **Formatos Soportados:** `.mp3`, `.flac`, `.wav`, `.m4a`, `.aac`, `.ogg`, `.opus`, `.wma`
- **Desarrollador:** CFJyA
