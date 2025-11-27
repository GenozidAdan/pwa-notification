// Importamos los módulos de Firebase desde CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getMessaging, getToken, onMessage, isSupported } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";

// Configuración obtenida desde Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBIwXyfVtegK6xiJq81aO3S7GjJyNYf3Po",
  authDomain: "fir-3e617.firebaseapp.com",
  projectId: "fir-3e617",
  storageBucket: "fir-3e617.appspot.com",
  messagingSenderId: "37080394932",
  appId: "1:37080394932:web:449376822d7ba96428bbe1"
};

// Inicializamos Firebase
const app = initializeApp(firebaseConfig);

// Utilidades para manipular el DOM
const $ = (sel) => document.querySelector(sel);
const log = (m) => ($("#log").textContent += ( ($("#log").textContent === "—" ? "" : "\n") + m ));

// Mostramos el estado inicial del permiso
$("#perm").textContent = Notification.permission;

// Registramos el Service Worker
let swReg;
if ('serviceWorker' in navigator) {
  swReg = await navigator.serviceWorker.register('./firebase-messaging-sw.js', { scope: './'});
  console.log('SW registrado:', swReg.scope);
}

// Verificamos si el navegador soporta FCM
const supported = await isSupported();
let messaging = null;

if (supported) {
  messaging = getMessaging(app);
} else {
  log("Este navegador no soporta FCM en la Web.");
}

// Clave pública VAPID (de Firebase Cloud Messaging)
const VAPID_KEY = "BCFr7D1TR67Ja2cvcZoIeX-c46t8Ichtj9nKKVmmw9rtD1lXuXKHSCReLqpb5U4u7kdleT5cZjOPLteVMueKIIY";

// Función para pedir permiso y obtener token
async function requestPermissionAndGetToken() {
  try {
    const permission = await Notification.requestPermission();
    $("#perm").textContent = permission;

    if (permission !== 'granted') {
      log("Permiso denegado por el usuario.");
      return;
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });

    if (token) {
      $("#token").textContent = token;
      log("Token obtenido correctamente.");

   
      fetch("http://localhost:8080/api/notifications/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      })
      .then(r => r.text())
      .then(txt => log("Token enviado al backend: " + txt))
      .catch(err => log("Error enviando token al backend: " + err));

    } else {
      log("No se pudo obtener el token.");
    }

  } catch (err) {
    console.error(err);
    log("Error al obtener token: " + err.message);
  }
}

// Escuchamos mensajes cuando la pestaña está abierta
if (messaging) {
  onMessage(messaging, (payload) => {
    log("Mensaje recibido en primer plano:\n" + JSON.stringify(payload, null, 2));
  });
}

// Conectamos el botón con la función
$("#btn-permission").addEventListener("click", requestPermissionAndGetToken);




