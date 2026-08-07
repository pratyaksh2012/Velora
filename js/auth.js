/* ==========================================
   Velora Authentication
========================================== */

import { auth } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    showToast,
    showLoading,
    hideLoading,
    togglePassword
} from "./utils.js";

/* ==========================================
   Initialize
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    hideLoading();

    // Login Page
    if (document.getElementById("login-form")) {

        togglePassword(
            "login-password",
            "toggle-password"
        );

    }

    // Signup Page
    if (document.getElementById("signup-form")) {

        togglePassword(
            "signup-password",
            "toggle-signup-password"
        );

        togglePassword(
            "confirm-password",
            "toggle-confirm-password"
        );

    }

});

/* ==========================================
   Login
========================================== */

const loginForm = document.getElementById("login-form");

if (loginForm) {

    loginForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        showLoading();

        const email =
            document.getElementById("login-email").value.trim();

        const password =
            document.getElementById("login-password").value;

        try {

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            showToast("Welcome Back!");

            window.location.href =
                "dashboard.html";

        }

        catch (error) {

            hideLoading();

            showToast(error.message, "error");

        }

    });

}

/* ==========================================
   Signup
========================================== */

const signupForm =
    document.getElementById("signup-form");

if (signupForm) {

    signupForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        showLoading();

        const email =
            document.getElementById("signup-email").value.trim();

        const password =
            document.getElementById("signup-password").value;

        const confirm =
            document.getElementById("confirm-password").value;

        if (password !== confirm) {

            hideLoading();

            showToast(
                "Passwords do not match.",
                "error"
            );

            return;

        }

        try {

            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            showToast(
                "Account Created Successfully!"
            );

            window.location.href =
                "dashboard.html";

        }

        catch (error) {

            hideLoading();

            showToast(error.message, "error");

        }

    });

}

/* ==========================================
   Logout
========================================== */

const logoutBtn =
    document.getElementById("logout-btn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", async () => {

        await signOut(auth);

        window.location.href =
            "index.html";

    });

}

/* ==========================================
   Authentication State
========================================== */

onAuthStateChanged(auth, (user) => {

    const currentPage = window.location.pathname.split("/").pop();

    if(user){

        if(currentPage==="index.html" || currentPage==="signup.html"){

            window.location.href="dashboard.html";

        }

    }else{

        if(currentPage!=="index.html" && currentPage!=="signup.html"){

            window.location.href="index.html";

        }

    }

});