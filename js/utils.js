/* ==========================================
   Velora Utility Functions
========================================== */

// Toast Notification
export function showToast(message, type = "success") {

    const container = document.getElementById("toast-container");

    if (!container) return;

    const toast = document.createElement("div");

    toast.className = `toast ${type}`;

    toast.textContent = message;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    setTimeout(() => {

        toast.classList.remove("show");

        setTimeout(() => {
            toast.remove();
        }, 300);

    }, 3000);

}

// Loading Screen
export function showLoading() {

    const loading = document.getElementById("loading-screen");

    if (loading) {

        loading.style.display = "flex";

    }

}

export function hideLoading() {

    const loading = document.getElementById("loading-screen");

    if (loading) {

        loading.style.display = "none";

    }

}

// Password Visibility
export function togglePassword(inputId, buttonId) {

    const input = document.getElementById(inputId);

    const button = document.getElementById(buttonId);

    if (!input || !button) return;

    button.addEventListener("click", () => {

        if (input.type === "password") {

            input.type = "text";

            button.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';

        } else {

            input.type = "password";

            button.innerHTML = '<i class="fa-solid fa-eye"></i>';

        }

    });

}

// Email Validation
export function isValidEmail(email) {

    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return regex.test(email);

}

// Password Strength
export function checkPasswordStrength(password) {

    let strength = 0;

    if (password.length >= 8) strength++;

    if (/[A-Z]/.test(password)) strength++;

    if (/[a-z]/.test(password)) strength++;

    if (/[0-9]/.test(password)) strength++;

    if (/[^A-Za-z0-9]/.test(password)) strength++;

    return strength;

}

// Delay Helper
export function sleep(ms) {

    return new Promise(resolve => setTimeout(resolve, ms));

}

// Format Date
export function formatDate(date) {

    return new Date(date).toLocaleString();

}

// Generate Random ID
export function generateId(length = 20) {

    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    let id = "";

    for (let i = 0; i < length; i++) {

        id += chars.charAt(
            Math.floor(Math.random() * chars.length)
        );

    }

    return id;

}

// Hide Loading Automatically
window.addEventListener("load", () => {

    setTimeout(() => {

        hideLoading();

    }, 700);

});