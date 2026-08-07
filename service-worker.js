/* ==========================================
   Velora Service Worker v1.0
========================================== */

const CACHE_NAME = "velora-v1";

const FILES_TO_CACHE = [

    "./",

    "./index.html",
    "./signup.html",

    "./css/style.css",
    "./css/auth.css",

    "./js/firebase.js",
    "./js/auth.js",
    "./js/utils.js",
    "./js/install.js",

    "./manifest.json",

    "./assets/logo.png",
    "./assets/icon-192.png",
    "./assets/icon-512.png"

];

// Install
self.addEventListener("install", (event) => {

    event.waitUntil(

        caches.open(CACHE_NAME).then((cache) => {

            return cache.addAll(FILES_TO_CACHE);

        })

    );

    self.skipWaiting();

});

// Activate
self.addEventListener("activate", (event) => {

    event.waitUntil(

        caches.keys().then((keys) => {

            return Promise.all(

                keys.map((key) => {

                    if (key !== CACHE_NAME) {

                        return caches.delete(key);

                    }

                })

            );

        })

    );

    self.clients.claim();

});

// Fetch
self.addEventListener("fetch", (event) => {

    event.respondWith(

        caches.match(event.request).then((response) => {

            return response || fetch(event.request);

        })

    );

});