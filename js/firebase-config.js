// =========================================================
// FIREBASE — configuración e inicialización
// =========================================================
// 1) Andá a https://console.firebase.google.com > tu proyecto
//    > ícono de engranaje > Configuración del proyecto > "Tus apps"
//    > app web (</>) y copiá el objeto firebaseConfig acá abajo.
// 2) Activá Firestore Database (modo producción) desde
//    Build > Firestore Database > Crear base de datos.
// =========================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export { collection, getDocs, getDoc, doc, query, where, orderBy };

/* =========================================================
   Estructura esperada de la colección "productos" en Firestore
   (cada documento = 1 producto que el dueño del taller carga)
   ---------------------------------------------------------
   nombre:        string   "Campera Taller 01"
   descripcion:   string
   precio:        number   (en la moneda base, ej. 45000)
   categoria:     string   "camperas" | "buzos" | "remeras" | ...
   talles:        array    ["S","M","L","XL"]
   stockPorTalle: map      { S: 3, M: 0, L: 5, XL: 2 }
   imagenes:      array    ["https://...", "https://..."]
   destacado:     boolean
   activo:        boolean  (false = no se muestra en la tienda)
   creado:        timestamp
   ========================================================= */
