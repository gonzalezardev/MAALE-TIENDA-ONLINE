import { db, collection, getDocs, getDoc, doc, query, where } from "./firebase-config.js";
import { agregarItem, formatearPrecio } from "./carrito.js";

/* ---------- traer productos desde Firestore ---------- */
async function traerProductos({ categoria = null, soloDestacados = false } = {}) {
  const ref = collection(db, "productos");
  let restricciones = [where("activo", "==", true)];
  if (categoria) restricciones.push(where("categoria", "==", categoria));
  if (soloDestacados) restricciones.push(where("destacado", "==", true));

  const q = query(ref, ...restricciones);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function traerProductoPorId(id) {
  const snap = await getDoc(doc(db, "productos", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/* ---------- helpers de talle/stock ---------- */
function primerTalleConStock(producto) {
  const talles = producto.talles || [];
  return talles.find((t) => (producto.stockPorTalle?.[t] || 0) > 0) || null;
}
function sinStock(producto) {
  const talles = producto.talles || [];
  return talles.every((t) => (producto.stockPorTalle?.[t] || 0) <= 0);
}

/* ---------- tarjeta de producto (HTML) ---------- */
function tarjetaHTML(p) {
  const agotado = sinStock(p);
  const img = (p.imagenes && p.imagenes[0]) || "";
  return `
  <article class="tarjeta-producto remache reveal">
    <a href="producto.html?id=${p.id}" class="tarjeta-img" style="display:block;">
      <img src="${img}" alt="${p.nombre}" loading="lazy" />
      <span class="tarjeta-ref mono">REF-${p.id.slice(-4).toUpperCase()}</span>
      ${agotado ? '<div class="tarjeta-agotado mono">Sin stock</div>' : ""}
    </a>
    <div class="tarjeta-cat">${p.categoria || ""}</div>
    <a href="producto.html?id=${p.id}"><h3 class="tarjeta-nombre">${p.nombre}</h3></a>
    <div class="tarjeta-precio-fila">
      <span class="tarjeta-precio">${formatearPrecio(p.precio)}</span>
      <button class="tarjeta-add" title="Agregar al carrito" data-id="${p.id}" ${agotado ? "disabled" : ""}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
    </div>
  </article>`;
}

function activarAddRapido(contenedor, productos) {
  contenedor.querySelectorAll(".tarjeta-add").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const p = productos.find((pr) => pr.id === btn.dataset.id);
      const talle = primerTalleConStock(p);
      if (!talle) return;
      agregarItem({
        id: p.id,
        nombre: p.nombre,
        precio: p.precio,
        imagen: (p.imagenes && p.imagenes[0]) || "",
        talle,
        cantidad: 1,
      });
      btn.animate(
        [{ transform: "scale(1)" }, { transform: "scale(1.35)" }, { transform: "scale(1)" }],
        { duration: 320, easing: "ease-out" }
      );
    });
  });
}

/* ---------- render: destacados (home) ---------- */
export async function renderizarDestacados(contenedorId) {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  try {
    const productos = await traerProductos({ soloDestacados: true });
    if (productos.length === 0) {
      cont.innerHTML = `<p class="estado-vacio">Todavía no hay productos destacados cargados en Firestore.</p>`;
      return;
    }
    cont.innerHTML = productos.map(tarjetaHTML).join("");
    activarAddRapido(cont, productos);
    cont.querySelectorAll(".reveal").forEach((el, i) => {
      el.style.transitionDelay = `${i * 60}ms`;
    });
    reobservar(cont);
  } catch (err) {
    console.error(err);
    cont.innerHTML = `<p class="estado-vacio">No se pudieron cargar los productos. Revisá la configuración de Firebase.</p>`;
  }
}

/* ---------- render: catálogo completo con filtro por categoría ---------- */
let catalogoCache = [];

export async function renderizarCatalogo(contenedorId, categoria = null) {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  cont.innerHTML = Array.from({ length: 8 })
    .map(() => `<div class="tarjeta-producto"><div class="tarjeta-img skeleton"></div></div>`)
    .join("");
  try {
    const productos = await traerProductos({ categoria });
    catalogoCache = productos;
    if (productos.length === 0) {
      cont.innerHTML = `<p class="estado-vacio">No hay productos en esta categoría todavía.</p>`;
      return;
    }
    cont.innerHTML = productos.map(tarjetaHTML).join("");
    activarAddRapido(cont, productos);
    reobservar(cont);
  } catch (err) {
    console.error(err);
    cont.innerHTML = `<p class="estado-vacio">No se pudieron cargar los productos. Revisá la configuración de Firebase.</p>`;
  }
}

function reobservar(cont) {
  const obs = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  cont.querySelectorAll(".reveal").forEach((el) => obs.observe(el));
}

/* ---------- render: página de ficha de producto ---------- */
export async function renderizarProducto(contenedorId) {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  if (!id) {
    cont.innerHTML = `<p class="estado-vacio">Producto no encontrado.</p>`;
    return;
  }

  const p = await traerProductoPorId(id);
  if (!p) {
    cont.innerHTML = `<p class="estado-vacio">Este producto no existe o fue dado de baja.</p>`;
    return;
  }

  document.title = `${p.nombre} — Taller`;
  const imagenes = p.imagenes || [];
  let talleSeleccionado = primerTalleConStock(p);
  let cantidad = 1;

  cont.innerHTML = `
    <div class="producto-layout">
      <div>
        <div class="producto-galeria-principal">
          <img id="img-principal" src="${imagenes[0] || ""}" alt="${p.nombre}" />
        </div>
        <div class="producto-miniaturas">
          ${imagenes
            .map(
              (img, i) =>
                `<img src="${img}" data-src="${img}" class="${i === 0 ? "activa" : ""}" alt="miniatura ${i + 1}" />`
            )
            .join("")}
        </div>
      </div>
      <div>
        <div class="eyebrow">REF-${p.id.slice(-4).toUpperCase()} · ${p.categoria || ""}</div>
        <h1 class="producto-titulo" style="font-size:2.4rem;margin-top:10px;">${p.nombre}</h1>
        <div class="producto-precio">${formatearPrecio(p.precio)}</div>
        <p class="producto-desc">${p.descripcion || ""}</p>

        <div class="selector-grupo">
          <label class="selector-label">Talle</label>
          <div class="opciones-talle" id="opciones-talle">
            ${(p.talles || [])
              .map((t) => {
                const stock = p.stockPorTalle?.[t] || 0;
                return `<button class="opcion-talle ${t === talleSeleccionado ? "activo" : ""}" data-talle="${t}" ${stock <= 0 ? "disabled" : ""}>${t}</button>`;
              })
              .join("")}
          </div>
        </div>

        <div class="selector-grupo">
          <label class="selector-label">Cantidad</label>
          <div class="cantidad-caja">
            <button id="restar-cant">−</button>
            <span id="valor-cant" class="mono">1</span>
            <button id="sumar-cant">+</button>
          </div>
        </div>

        <div class="producto-acciones">
          <button class="btn btn-primario" id="btn-agregar-carrito" ${!talleSeleccionado ? "disabled" : ""}>
            ${talleSeleccionado ? "Agregar al carrito" : "Sin stock"}
          </button>
          <a href="carrito.html" class="btn btn-secundario">Ver carrito</a>
        </div>
      </div>
    </div>`;

  // miniaturas
  cont.querySelectorAll(".producto-miniaturas img").forEach((img) => {
    img.addEventListener("click", () => {
      document.getElementById("img-principal").src = img.dataset.src;
      cont.querySelectorAll(".producto-miniaturas img").forEach((i) => i.classList.remove("activa"));
      img.classList.add("activa");
    });
  });

  // selector de talle
  cont.querySelectorAll(".opcion-talle").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      cont.querySelectorAll(".opcion-talle").forEach((b) => b.classList.remove("activo"));
      btn.classList.add("activo");
      talleSeleccionado = btn.dataset.talle;
      document.getElementById("btn-agregar-carrito").disabled = false;
      document.getElementById("btn-agregar-carrito").textContent = "Agregar al carrito";
    });
  });

  // cantidad
  const valorCant = document.getElementById("valor-cant");
  document.getElementById("sumar-cant").addEventListener("click", () => {
    const stockDisponible = p.stockPorTalle?.[talleSeleccionado] ?? 99;
    if (cantidad < stockDisponible) cantidad++;
    valorCant.textContent = cantidad;
  });
  document.getElementById("restar-cant").addEventListener("click", () => {
    if (cantidad > 1) cantidad--;
    valorCant.textContent = cantidad;
  });

  // agregar al carrito
  document.getElementById("btn-agregar-carrito").addEventListener("click", (e) => {
    if (!talleSeleccionado) return;
    agregarItem({
      id: p.id,
      nombre: p.nombre,
      precio: p.precio,
      imagen: imagenes[0] || "",
      talle: talleSeleccionado,
      cantidad,
    });
    const btn = e.currentTarget;
    const original = btn.textContent;
    btn.textContent = "¡Agregado!";
    setTimeout(() => (btn.textContent = original), 1200);
  });
}
