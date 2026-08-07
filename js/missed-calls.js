import { db, auth } from "./firebase.js";
import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    deleteDoc,
    updateDoc,
    writeBatch
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const missedContainer = document.getElementById("missedContainer");
const unreadCountText = document.getElementById("unreadCountText");
const markAllReadBtn = document.getElementById("markAllReadBtn");
const filterChips = document.querySelectorAll(".filter-chip");

let currentUser = null;
let missedCallsList = [];

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        initRealtimeMissedCalls(user.uid);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    markAllReadBtn?.addEventListener("click", async () => {
        if (!currentUser) return;
        const batch = writeBatch(db);
        missedCallsList.forEach(m => {
            batch.update(doc(db, "calls", m.id), { read: true });
        });
        await batch.commit();
    });
});

function initRealtimeMissedCalls(userId) {
    const q = query(
        collection(db, "calls"),
        where("receiverId", "==", userId),
        where("status", "==", "rejected")
    );

    onSnapshot(q, (snapshot) => {
        missedCallsList = [];
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            missedCallsList.push({
                id: docSnap.id,
                name: data.callerName || "Unknown",
                number: data.callerNumber || "Private",
                time: data.createdAt ? new Date(data.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recent",
                read: data.read || false
            });
        });
        renderMissedCalls();
    });
}

function renderMissedCalls() {
    if (!missedContainer) return;
    missedContainer.innerHTML = "";

    const unread = missedCallsList.filter(i => !i.read).length;
    if (unreadCountText) unreadCountText.textContent = `${unread} Unread`;

    if (missedCallsList.length === 0) {
        missedContainer.innerHTML = `
            <div style="text-align:center; padding: 60px 20px; color: white;">
                <div style="font-size: 50px;">🎉</div>
                <h3>No Missed Calls</h3>
                <p>You have responded to all incoming calls.</p>
            </div>
        `;
        return;
    }

    missedCallsList.forEach(item => {
        const card = document.createElement("div");
        card.className = `missed-card ${item.read ? "read" : ""}`;

        card.innerHTML = `
            <div class="missed-left">
                <div class="avatar">${item.name.charAt(0).toUpperCase()}</div>
                <div>
                    <div class="missed-title">${item.name}</div>
                    <div class="missed-time">${item.number} • ${item.time}</div>
                </div>
            </div>
            <div class="missed-actions">
                <button class="call-back-btn">Call Back</button>
                <button class="delete-btn">✕</button>
            </div>
        `;

        card.querySelector(".call-back-btn").addEventListener("click", async () => {
            await updateDoc(doc(db, "calls", item.id), { read: true });
            localStorage.setItem("dialName", item.name);
            localStorage.setItem("dialNumber", item.number);
            window.location.href = "dialpad.html";
        });

        card.querySelector(".delete-btn").addEventListener("click", async () => {
            await deleteDoc(doc(db, "calls", item.id));
        });

        missedContainer.appendChild(card);
    });
}