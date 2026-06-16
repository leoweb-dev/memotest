/* =============================================
   MEMOTEST DEL MUNDIAL — script.js
   Vanilla JS — sin librerías externas
   Banderas via flagcdn.com (compatible con todos los SO)
   ============================================= */

'use strict';

// ── 1. DATOS: 8 países del Mundial ─────────────────────────────────────────
const PAISES = [
  { id: 'argentina', codigo: 'ar', nombre: 'Argentina' },
  { id: 'brasil',    codigo: 'br', nombre: 'Brasil'    },
  { id: 'uruguay',   codigo: 'uy', nombre: 'Uruguay'   },
  { id: 'francia',   codigo: 'fr', nombre: 'Francia'   },
  { id: 'españa',    codigo: 'es', nombre: 'España'    },
  { id: 'alemania',  codigo: 'de', nombre: 'Alemania'  },
  { id: 'japon',     codigo: 'jp', nombre: 'Japón'     },
  { id: 'usa',       codigo: 'us', nombre: 'EE.UU.'    },
];

// ── 2. ESTADO DEL JUEGO ─────────────────────────────────────────────────────
let estado = {
  cartasVolteadas: [],   // máximo 2 cartas en juego
  parejasEncontradas: 0,
  intentos: 0,
  bloqueado: false,      // evita clics durante la comparación
};

// ── 3. REFERENCIAS AL DOM ───────────────────────────────────────────────────
const tablero           = document.getElementById('tablero');
const contadorEl        = document.getElementById('contador');
const parejasEl         = document.getElementById('parejas');
const btnReiniciar      = document.getElementById('btnReiniciar');
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

/** URL de bandera para un código ISO de país */
function urlBandera(codigo) {
  return `https://flagcdn.com/w80/${codigo}.png`;
}
function urlBandera2x(codigo) {
  return `https://flagcdn.com/w160/${codigo}.png`;
}

/** Construye el array de 16 objetos-carta a partir de PAISES */
function generarCartas() {
  const cartas = [];
  PAISES.forEach(pais => {
    // Carta de bandera
    cartas.push({
      tipo:   'bandera',
      paisId: pais.id,
      codigo: pais.codigo,
      nombre: pais.nombre,
    });
    // Carta de nombre
    cartas.push({
      tipo:   'nombre',
      paisId: pais.id,
      codigo: pais.codigo,
      nombre: pais.nombre,
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

    const contenidoFrente = carta.tipo === 'bandera'
      ? `<img
           class="carta-bandera-img"
           src="${urlBandera(carta.codigo)}"
           srcset="${urlBandera2x(carta.codigo)} 2x"
           alt="Bandera de ${carta.nombre}"
           loading="lazy"
         />
         <span class="carta-tag">Bandera</span>`
      : `<span class="carta-nombre">${carta.nombre}</span>
         <span class="carta-tag">País</span>`;

    el.innerHTML = `
      <div class="carta-inner">
        <div class="carta-dorso" aria-hidden="true">
          <span class="dorso-icon">⚽</span>
        </div>
        <div class="carta-frente">
          ${contenidoFrente}
        </div>
      </div>
    `;

    // Accesibilidad
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label',
      carta.tipo === 'bandera'
        ? `Bandera de ${carta.nombre}`
        : `Nombre del país: ${carta.nombre}`
    );

    el.addEventListener('click', () => manejarClic(el));
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') manejarClic(el);
    });

    tablero.appendChild(el);
  });
}

// ── 6. LÓGICA PRINCIPAL ─────────────────────────────────────────────────────

function manejarClic(carta) {
  if (
    estado.bloqueado ||
    carta.classList.contains('encontrada') ||
    carta.classList.contains('volteada')
  ) return;

  carta.classList.add('volteada');
  estado.cartasVolteadas.push(carta);

  if (estado.cartasVolteadas.length < 2) return;

  estado.bloqueado = true;
  estado.intentos++;
  actualizarContador();

  const [cartaA, cartaB] = estado.cartasVolteadas;
  const mismoId   = cartaA.dataset.paisId === cartaB.dataset.paisId;
  const tiposDist = cartaA.dataset.tipo   !== cartaB.dataset.tipo;

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

overlayGanador.addEventListener('click', e => {
  if (e.target === overlayGanador) reiniciarJuego();
});

// ── 9. INICIO ───────────────────────────────────────────────────────────────
renderizarTablero();
