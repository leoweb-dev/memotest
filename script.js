/* =============================================
   MEMOTEST DEL MUNDIAL — script.js
   Vanilla JS — sin librerías externas
   ============================================= */

'use strict';

// ── 1. DATOS: 8 países del Mundial ─────────────────────────────────────────
const PAISES = [
  { id: 'argentina', bandera: '🇦🇷', nombre: 'Argentina' },
  { id: 'brasil',    bandera: '🇧🇷', nombre: 'Brasil'    },
  { id: 'uruguay',   bandera: '🇺🇾', nombre: 'Uruguay'   },
  { id: 'francia',   bandera: '🇫🇷', nombre: 'Francia'   },
  { id: 'españa',    bandera: '🇪🇸', nombre: 'España'    },
  { id: 'alemania',  bandera: '🇩🇪', nombre: 'Alemania'  },
  { id: 'japon',     bandera: '🇯🇵', nombre: 'Japón'     },
  { id: 'usa',       bandera: '🇺🇸', nombre: 'EE.UU.'    },
];

// ── 2. ESTADO DEL JUEGO ─────────────────────────────────────────────────────
let estado = {
  cartasVolteadas: [],   // máximo 2 cartas en juego
  parejasEncontradas: 0,
  intentos: 0,
  bloqueado: false,      // evita clics durante la comparación
};

// ── 3. REFERENCIAS AL DOM ───────────────────────────────────────────────────
const tablero      = document.getElementById('tablero');
const contadorEl   = document.getElementById('contador');
const parejasEl    = document.getElementById('parejas');
const btnReiniciar = document.getElementById('btnReiniciar');
const overlayGanador    = document.getElementById('overlayGanador');
const intentosFinalesEl = document.getElementById('intentosFinales');
const btnJugarNuevo     = document.getElementById('btnJugarNuevo');

// ── 4. UTILIDADES ───────────────────────────────────────────────────────────

/** Mezcla un array in-place (Fisher–Yates) */
function mezclar(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Construye el array de 16 objetos-carta a partir de PAISES */
function generarCartas() {
  const cartas = [];
  PAISES.forEach(pais => {
    // Carta de bandera
    cartas.push({
      tipo: 'bandera',
      paisId: pais.id,
      contenido: pais.bandera,
    });
    // Carta de nombre
    cartas.push({
      tipo: 'nombre',
      paisId: pais.id,
      contenido: pais.nombre,
    });
  });
  return mezclar(cartas);
}

// ── 5. RENDERIZADO ──────────────────────────────────────────────────────────

function renderizarTablero() {
  tablero.innerHTML = '';
  const cartas = generarCartas();

  cartas.forEach((carta, index) => {
    const el = document.createElement('div');
    el.classList.add('carta', `tipo-${carta.tipo}`);
    el.dataset.paisId = carta.paisId;
    el.dataset.tipo   = carta.tipo;
    el.dataset.index  = index;

    el.innerHTML = `
      <div class="carta-inner">

        <!-- DORSO (vista inicial) -->
        <div class="carta-dorso" aria-hidden="true">
          <span class="dorso-icon">⚽</span>
        </div>

        <!-- FRENTE (vista al voltear) -->
        <div class="carta-frente">
          ${carta.tipo === 'bandera'
            ? `<span class="carta-emoji">${carta.contenido}</span>
               <span class="carta-tag">Bandera</span>`
            : `<span class="carta-nombre">${carta.contenido}</span>
               <span class="carta-tag">País</span>`
          }
        </div>

      </div>
    `;

    // Accesibilidad básica
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label',
      carta.tipo === 'bandera'
        ? `Bandera de ${PAISES.find(p => p.id === carta.paisId).nombre}`
        : `Nombre: ${carta.contenido}`
    );

    // Eventos
    el.addEventListener('click', () => manejarClic(el));
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') manejarClic(el);
    });

    tablero.appendChild(el);
  });
}

// ── 6. LÓGICA PRINCIPAL ─────────────────────────────────────────────────────

function manejarClic(carta) {
  // Ignorar si el tablero está bloqueado, la carta ya está encontrada
  // o si es la misma carta que ya fue volteada
  if (
    estado.bloqueado ||
    carta.classList.contains('encontrada') ||
    carta.classList.contains('volteada')
  ) return;

  // Voltear la carta
  carta.classList.add('volteada');
  estado.cartasVolteadas.push(carta);

  // Si es la primera carta, esperar la segunda
  if (estado.cartasVolteadas.length < 2) return;

  // ── Dos cartas seleccionadas: evaluar ──
  estado.bloqueado = true;
  estado.intentos++;
  actualizarContador();

  const [cartaA, cartaB] = estado.cartasVolteadas;
  const mismoId    = cartaA.dataset.paisId === cartaB.dataset.paisId;
  const tiposDist  = cartaA.dataset.tipo   !== cartaB.dataset.tipo;

  if (mismoId && tiposDist) {
    // ✅ Pareja correcta
    setTimeout(() => {
      cartaA.classList.add('encontrada');
      cartaB.classList.add('encontrada');
      cartaA.removeAttribute('tabindex');
      cartaB.removeAttribute('tabindex');
      limpiarSeleccion();
      estado.parejasEncontradas++;
      actualizarParejas();
      if (estado.parejasEncontradas === PAISES.length) mostrarGanador();
    }, 300);

  } else {
    // ❌ No coinciden: sacudir y tapar
    setTimeout(() => {
      cartaA.classList.add('sacudir');
      cartaB.classList.add('sacudir');
    }, 100);

    setTimeout(() => {
      cartaA.classList.remove('volteada', 'sacudir');
      cartaB.classList.remove('volteada', 'sacudir');
      limpiarSeleccion();
    }, 900);
  }
}

function limpiarSeleccion() {
  estado.cartasVolteadas = [];
  estado.bloqueado = false;
}

// ── 7. UI SECUNDARIA ────────────────────────────────────────────────────────

function actualizarContador() {
  contadorEl.textContent = estado.intentos;
}

function actualizarParejas() {
  parejasEl.textContent = estado.parejasEncontradas;
}

function mostrarGanador() {
  intentosFinalesEl.textContent =
    `${estado.intentos} ${estado.intentos === 1 ? 'intento' : 'intentos'}`;
  overlayGanador.setAttribute('aria-hidden', 'false');
  overlayGanador.classList.add('visible');
}

function ocultarGanador() {
  overlayGanador.classList.remove('visible');
  overlayGanador.setAttribute('aria-hidden', 'true');
}

function reiniciarJuego() {
  estado = {
    cartasVolteadas: [],
    parejasEncontradas: 0,
    intentos: 0,
    bloqueado: false,
  };
  actualizarContador();
  actualizarParejas();
  ocultarGanador();
  renderizarTablero();
}

// ── 8. EVENT LISTENERS GLOBALES ─────────────────────────────────────────────

btnReiniciar.addEventListener('click', reiniciarJuego);
btnJugarNuevo.addEventListener('click', reiniciarJuego);

// Cerrar overlay al hacer clic fuera del cartel
overlayGanador.addEventListener('click', e => {
  if (e.target === overlayGanador) reiniciarJuego();
});

// ── 9. INICIO ───────────────────────────────────────────────────────────────
renderizarTablero();
