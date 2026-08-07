import { db, auth } from "./firebase.js";
import {
    collection,
    query,
    where,
    onSnapshot,
    orderBy,
    doc,
    deleteDoc,
    updateDoc,
    writeBatch,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const notifContainer = document.getElementById("notifContainer");
const notifCounterText = document.getElementById("notifCounterText");
const notifSearchInput = document.getElementById("notifSearchInput");
const markAllNotifsReadBtn = document.getElementById("markAllNotifsReadBtn");
const clearNotifsBtn = document.getElementById("clearNotifsBtn");
const filterChips = document.querySelectorAll(".filter-chip");

let currentUser = null;
let notificationsList = [];
let activeCategory = "all";

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        initRealtimeNotifications(user.uid);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    notifSearchInput?.addEventListener("input", renderNotifications);

    markAllNotifsReadBtn?.addEventListener("click", markAllAsRead);

    clearNotifsBtn?.addEventListener("click", clearAllNotifications);

    filterChips.forEach(chip => {
        chip.addEventListener("click", () => {
            filterChips.forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            activeCategory = chip.dataset.cat;
            renderNotifications();
        });
    });
});

function initRealtimeNotifications(userId) {
    const q = query(
        collection(db, "notifications"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, (snapshot) => {
        notificationsList = [];
        snapshot.forEach((docSnap) => {
            notificationsList.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });
        renderNotifications();
    });
}

function renderNotifications() {
    if (!notifContainer) return;
    notifContainer.innerHTML = "";

    const queryStr = notifSearchInput ? notifSearchInput.value.toLowerCase().trim() : "";

    const filtered = notificationsList.filter(n => {
        const matchesQuery = n.title?.toLowerCase().includes(queryStr) || n.desc?.toLowerCase().includes(queryStr);
        let matchesCat = true;
        if (activeCategory !== "all") matchesCat = n.category === activeCategory;
        return matchesQuery && matchesCat;
    });

    const unread = notificationsList.filter(n => !n.read).length;
    if (notifCounterText) notifCounterText.textContent = `${unread} Unread`;

    if (filtered.length === 0) {
        notifContainer.innerHTML = `
            <div style="text-align:center; padding: 60px 20px; color: white;">
                <div style="font-size: 50px;">🔔</div>
                <h3>No Notifications</h3>
                <p>Everything is caught up!</p>
            </div>
        `;
        return;
    }

    filtered.forEach(n => {
        const card = document.createElement("div");
        card.className = `notif-card ${n.read ? "" : "unread"}`;

        const timeStr = n.createdAt ? new Date(n.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently";

        card.innerHTML = `
            <div class="notif-icon-avatar">${n.icon || "🔔"}</div>
            <div class="notif-body">
                <div class="notif-title">${n.title}</div>
                <div class="notif-desc">${n.desc}</div>
                <div class="notif-time">${timeStr}</div>
            </div>
            <button class="notif-delete">✕</button>
        `;

        card.addEventListener("click", async (e) => {
            if (e.target.classList.contains("notif-delete")) return;
            if (!n.read) {
                await updateDoc(doc(db, "notifications", n.id), { read: true });
            }
        });

        card.querySelector(".notif-delete").addEventListener("click", async (e) => {
            e.stopPropagation();
            await deleteDoc(doc(db, "notifications", n.id));
        });

        notifContainer.appendChild(card);
    });
}

async function markAllAsRead() {
    if (!currentUser) return;
    const batch = writeBatch(db);
    notificationsList.forEach(n => {
        if (!n.read) {
            batch.update(doc(db, "notifications", n.id), { read: true });
        }
    });
    await batch.commit();
}

async function clearAllNotifications() {
    if (!currentUser || !confirm("Clear all notifications?")) return;
    const batch = writeBatch(db);
    notificationsList.forEach(n => {
        batch.delete(doc(db, "notifications", n.id));
    });
    await batch.commit();
}