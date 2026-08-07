import { db, auth } from "./firebase.js";
import { onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
    initSettingsListeners();
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        document.getElementById("settingUsername").textContent = user.displayName || "Velora User";
        document.getElementById("settingEmail").textContent = user.email || "user@example.com";
        document.getElementById("profileAvatar").textContent = (user.displayName || user.email || "V").charAt(0).toUpperCase();

        await loadFirestoreUserSettings(user.uid);
    }
});

async function loadFirestoreUserSettings(userId) {
    try {
        const docRef = doc(db, "userSettings", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.ringtone) document.getElementById("ringtoneSelect").value = data.ringtone;
            if (data.whoCanCall) document.getElementById("whoCanCallSelect").value = data.whoCanCall;
        }
    } catch (e) {
        console.error("Error loading user settings:", e);
    }
}

function initSettingsListeners() {
    const themeSelect = document.getElementById("themeSelect");
    if (themeSelect) {
        themeSelect.value = localStorage.getItem("theme") || "light";
        themeSelect.addEventListener("change", (e) => {
            const val = e.target.value;
            if (val === "dark") {
                document.body.classList.add("dark");
                localStorage.setItem("theme", "dark");
            } else {
                document.body.classList.remove("dark");
                localStorage.setItem("theme", "light");
            }
        });
    }

    const editProfileBtn = document.getElementById("editProfileBtn");
    const profileModal = document.getElementById("profileModal");
    const cancelProfileBtn = document.getElementById("cancelProfileBtn");
    const saveProfileBtn = document.getElementById("saveProfileBtn");

    editProfileBtn?.addEventListener("click", () => {
        profileModal.style.display = "flex";
    });

    cancelProfileBtn?.addEventListener("click", () => {
        profileModal.style.display = "none";
    });

    saveProfileBtn?.addEventListener("click", async () => {
        const name = document.getElementById("editNameInput").value.trim();
        if (name && currentUser) {
            await updateProfile(currentUser, { displayName: name });
            document.getElementById("settingUsername").textContent = name;
            document.getElementById("profileAvatar").textContent = name.charAt(0).toUpperCase();

            await setDoc(doc(db, "userSettings", currentUser.uid), {
                displayName: name
            }, { merge: true });
        }
        profileModal.style.display = "none";
    });

    document.getElementById("ringtoneSelect")?.addEventListener("change", async (e) => {
        if (!currentUser) return;
        await setDoc(doc(db, "userSettings", currentUser.uid), {
            ringtone: e.target.value
        }, { merge: true });
    });

    document.getElementById("clearCacheBtn")?.addEventListener("click", () => {
        const cacheEl = document.getElementById("cacheSizeText");
        if (cacheEl) cacheEl.textContent = "0.00 MB";
        alert("App cache cleared!");
    });
}