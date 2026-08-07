import { db, auth } from "./firebase.js";
import {
    collection,
    query,
    where,
    onSnapshot,
    orderBy,
    doc,
    deleteDoc,
    writeBatch
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const recentContainer = document.getElementById("recentContainer");
const searchInput = document.getElementById("searchInput");
const callCountText = document.getElementById("callCountText");
const missedBadge = document.getElementById("missedBadge");
const clearAllBtn = document.getElementById("clearAllBtn");
const filterChips = document.querySelectorAll(".filter-chip");

let currentUser = null;
let allCallLogs = [];
let activeFilter = "all";

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        initRealtimeRecentCalls(user.uid);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    searchInput?.addEventListener("input", filterAndRender);

    filterChips.forEach(chip => {
        chip.addEventListener("click", () => {
            filterChips.forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            activeFilter = chip.dataset.filter;
            filterAndRender();
        });
    });

    clearAllBtn?.addEventListener("click", clearAllHistory);
});

function initRealtimeRecentCalls(userId) {
    const q = query(
        collection(db, "calls"),
        where("callerId", "==", userId),
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, (snapshot) => {
        allCallLogs = [];
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            allCallLogs.push({
                id: docSnap.id,
                name: data.receiverName || "Unknown",
                number: data.receiverNumber || "Private Number",
                type: data.status === "rejected" ? "missed" : "outgoing",
                callType: data.type || "voice",
                duration: data.duration || "00:00",
                time: data.createdAt ? new Date(data.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "",
                dateGroup: "Recent"
            });
        });
        filterAndRender();
        updateBadge();
    });
}

function filterAndRender() {
    const queryStr = searchInput ? searchInput.value.toLowerCase().trim() : "";

    const filtered = allCallLogs.filter(item => {
        const matchesQuery = item.name.toLowerCase().includes(queryStr) || item.number.includes(queryStr);
        let matchesFilter = true;

        if (activeFilter === "incoming") matchesFilter = item.type === "incoming";
        if (activeFilter === "outgoing") matchesFilter = item.type === "outgoing";
        if (activeFilter === "missed") matchesFilter = item.type === "missed";
        if (activeFilter === "video") matchesFilter = item.callType === "video";

        return matchesQuery && matchesFilter;
    });

    renderCallLogs(filtered);
}

function renderCallLogs(logs) {
    if (!recentContainer) return;
    recentContainer.innerHTML = "";
    if (callCountText) callCountText.textContent = `${logs.length} Logs`;

    if (logs.length === 0) {
        recentContainer.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 50px;">📞</div>
                <h3>No Recent Calls</h3>
                <p>Calls you make, receive, or miss will show up here.</p>
            </div>
        `;
        return;
    }

    logs.forEach(log => {
        const card = document.createElement("div");
        card.className = "call-card";

        let typeSymbol = "↗";
        let typeClass = "outgoing";
        if (log.type === "missed") { typeSymbol = "↙"; typeClass = "missed"; }

        const initial = log.name.charAt(0).toUpperCase();

        card.innerHTML = `
            <div class="call-card-left">
                <div class="avatar">${initial}</div>
                <div class="call-info">
                    <span class="call-name">${log.name}</span>
                    <div class="call-meta">
                        <span class="type-icon ${typeClass}">${typeSymbol}</span>
                        <span>${log.number}</span>
                        <span>• ${log.time}</span>
                    </div>
                </div>
            </div>
            <div class="call-actions">
                <button class="icon-btn call-again-btn" title="Call Back">📞</button>
                <button class="icon-btn delete delete-single-btn" title="Delete Log">🗑️</button>
            </div>
        `;

        card.querySelector(".call-again-btn").addEventListener("click", () => {
            localStorage.setItem("dialName", log.name);
            localStorage.setItem("dialNumber", log.number);
            window.location.href = "dialpad.html";
        });

        card.querySelector(".delete-single-btn").addEventListener("click", async () => {
            await deleteDoc(doc(db, "calls", log.id));
        });

        recentContainer.appendChild(card);
    });
}

function updateBadge() {
    if (!missedBadge) return;
    const missedCount = allCallLogs.filter(i => i.type === "missed").length;
    missedBadge.textContent = missedCount;
}

async function clearAllHistory() {
    if (!currentUser || !confirm("Are you sure you want to clear all call history?")) return;
    const batch = writeBatch(db);
    allCallLogs.forEach(log => {
        batch.delete(doc(db, "calls", log.id));
    });
    await batch.commit();
}