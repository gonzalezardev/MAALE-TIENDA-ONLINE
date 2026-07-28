// =========================================================
// CARRITO — persistido en localStorage, compartido entre páginas
// =========================================================
const CLAVE = "taller_carrito_v1";

function leer() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE)) || [];
  } catch {
    return [];
  }
}

function guardar(items) {
  localStorage.setItem(CLAVE, JSON.stringify(items));
  actualizarContador();
  document.dispatchEvent(new CustomEvent("carrito:actualizado", { detail: items }));
}

// item: { id, nombre, precio, imagen, talle, cantidad }
export function agregarItem(item) {
  const items = leer();
  const existente = items.find((i) => i.id === item.id && i.talle === item.talle);
  if (existente) {
    existente.cantidad += item.cantidad;
  } else {
    items.push(item);
  }
  guardar(items);
}

export function actualizarCantidad(id, talle, cantidad) {
  let items = leer();
  if (cantidad <= 0) {
    items = items.filter((i) => !(i.id === id && i.talle === talle));
  } else {
    const it = items.find((i) => i.id === id && i.talle === talle);
    if (it) it.cantidad = cantidad;
  }
  guardar(items);
}

export function quitarItem(id, talle) {
  const items = leer().filter((i) => !(i.id === id && i.talle === talle));
  guardar(items);
}

export function vaciarCarrito() {
  guardar([]);
}

export function obtenerCarrito() {
  return leer();
}

export function totalCarrito() {
  return leer().reduce((acc, i) => acc + i.precio * i.cantidad, 0);
}

export function cantidadTotal() {
  return leer().reduce((acc, i) => acc + i.cantidad, 0);
}

export function formatearPrecio(valor) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(valor);
}

function actualizarContador() {
  const el = document.getElementById("contador-carrito");
  if (!el) return;
  const total = cantidadTotal();
  el.textContent = total;
  el.classList.toggle("activo", total > 0);
}

document.addEventListener("DOMContentLoaded", actualizarContador);
