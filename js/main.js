import {
  obtenerCarrito,
  actualizarCantidad,
  quitarItem,
  totalCarrito,
  formatearPrecio,
} from "./carrito.js";

/* ---------- menú móvil ---------- */
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
menuToggle?.addEventListener("click", () => {
  navLinks.classList.toggle("abierto");
});

/* ---------- panel lateral del carrito ---------- */
const overlay = document.getElementById("overlay");
const panelCarrito = document.getElementById("panel-carrito");
const btnAbrirCarrito = document.getElementById("abrir-carrito");
const btnCerrarCarrito = document.getElementById("cerrar-carrito");

function abrirCarrito() {
  renderizarPanelCarrito();
  overlay?.classList.add("activo");
  panelCarrito?.classList.add("activo");
}
function cerrarCarrito() {
  overlay?.classList.remove("activo");
  panelCarrito?.classList.remove("activo");
}

btnAbrirCarrito?.addEventListener("click", (e) => {
  e.preventDefault();
  abrirCarrito();
});
btnCerrarCarrito?.addEventListener("click", cerrarCarrito);
overlay?.addEventListener("click", cerrarCarrito);

function renderizarPanelCarrito() {
  const cont = document.getElementById("panel-carrito-items");
  const footer = document.getElementById("panel-carrito-footer");
  if (!cont) return;

  const items = obtenerCarrito();

  if (items.length === 0) {
    cont.innerHTML = `<p class="carrito-vacio-msg">Tu carrito está vacío.<br>Sumá algo del taller.</p>`;
    if (footer) footer.style.display = "none";
    return;
  }

  if (footer) footer.style.display = "block";

  cont.innerHTML = items
    .map(
      (i) => `
    <div class="item-carrito" data-id="${i.id}" data-talle="${i.talle}">
      <img src="${i.imagen}" alt="${i.nombre}" />
      <div class="item-carrito-info">
        <h4>${i.nombre}</h4>
        <div class="item-carrito-meta">TALLE ${i.talle}</div>
        <div class="item-carrito-controles">
          <button class="cant-btn" data-accion="restar">−</button>
          <span class="mono">${i.cantidad}</span>
          <button class="cant-btn" data-accion="sumar">+</button>
          <span class="item-carrito-precio">${formatearPrecio(i.precio * i.cantidad)}</span>
        </div>
        <button class="quitar-item" data-accion="quitar">Quitar</button>
      </div>
    </div>`
    )
    .join("");

  const subtotalEl = document.getElementById("carrito-subtotal");
  if (subtotalEl) subtotalEl.textContent = formatearPrecio(totalCarrito());

  cont.querySelectorAll(".item-carrito").forEach((el) => {
    const id = el.dataset.id;
    const talle = el.dataset.talle;
    const item = items.find((i) => i.id === id && i.talle === talle);

    el.querySelector('[data-accion="sumar"]').addEventListener("click", () => {
      actualizarCantidad(id, talle, item.cantidad + 1);
      renderizarPanelCarrito();
    });
    el.querySelector('[data-accion="restar"]').addEventListener("click", () => {
      actualizarCantidad(id, talle, item.cantidad - 1);
      renderizarPanelCarrito();
    });
    el.querySelector('[data-accion="quitar"]').addEventListener("click", () => {
      quitarItem(id, talle);
      renderizarPanelCarrito();
    });
  });
}

document.addEventListener("carrito:actualizado", () => {
  if (panelCarrito?.classList.contains("activo")) renderizarPanelCarrito();
});

/* ---------- animación de aparición al hacer scroll ---------- */
const observador = new IntersectionObserver(
  (entradas) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting) {
        entrada.target.classList.add("visible");
        observador.unobserve(entrada.target);
      }
    });
  },
  { threshold: 0.15 }
);

document.querySelectorAll(".reveal").forEach((el) => observador.observe(el));

export { renderizarPanelCarrito };
