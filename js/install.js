/* ==========================================
   Velora PWA Install
========================================== */

let deferredPrompt = null;

const installButton = document.getElementById("install-btn");

// Capture install prompt
window.addEventListener("beforeinstallprompt", (event) => {

    event.preventDefault();

    deferredPrompt = event;

    if (installButton) {

        installButton.style.display = "inline-flex";

    }

});

// Install App
if (installButton) {

    installButton.addEventListener("click", async () => {

        if (!deferredPrompt) {

            return;

        }

        deferredPrompt.prompt();

        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {

            console.log("Velora installed.");

        } else {

            console.log("Installation cancelled.");

        }

        deferredPrompt = null;

        installButton.style.display = "none";

    });

}

// App Installed
window.addEventListener("appinstalled", () => {

    console.log("Velora installed successfully.");

    if (installButton) {

        installButton.style.display = "none";

    }

});