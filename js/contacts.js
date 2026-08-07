import { db, auth } from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    deleteDoc,
    doc,
    updateDoc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// DOM Elements
const addBtn = document.getElementById("addContactBtn");
const modal = document.getElementById("contactModal");
const cancelBtn = document.getElementById("cancelContactBtn");
const saveBtn = document.getElementById("saveContactBtn");

const nameInput = document.getElementById("contactName");
const phoneInput = document.getElementById("contactPhone");
const emailInput = document.getElementById("contactEmail");
const contactIdInput = document.getElementById("contactId");

const contactsContainer = document.getElementById("contactsContainer");
const contactCount = document.getElementById("contactCount");
const searchInput = document.getElementById("searchInput");

async function updateEntireContactsCollection() {
    try {
        const querySnapshot = await getDocs(collection(db, "contacts"));

        const promises = querySnapshot.docs.map(async (docSnapshot) => {
            const data = docSnapshot.data();
            const contactRef = doc(db, "contacts", docSnapshot.id);

            return setDoc(contactRef, {
                createdAt: data.createdAt || serverTimestamp(),
                email: data.email || "",
                name: data.name || "Unknown",
                phone: data.phone || "",
                ringtone: data.ringtone || "Default.mp3",
                uid: data.uid || ""
            }, { merge: true });
        });

        await Promise.all(promises);
        console.log("Entire contacts collection schema refreshed successfully!");
    } catch (error) {
        console.error("Error updating contacts collection schema:", error);
    }
}

if (addBtn) {
    addBtn.onclick = () => {
        contactIdInput.value = "";
        nameInput.value = "";
        phoneInput.value = "";
        emailInput.value = "";
        modal.style.display = "flex";
    };
}

if (cancelBtn) {
    cancelBtn.onclick = () => {
        modal.style.display = "none";
    };
}

window.onclick = (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
    }
};

if (saveBtn) {
    saveBtn.onclick = async () => {
        const user = auth.currentUser;

        if (!user) {
            alert("Please login first.");
            return;
        }

        if (nameInput.value.trim() === "" || phoneInput.value.trim() === "") {
            alert("Please fill all required fields.");
            return;
        }

        try {
            const id = contactIdInput.value;

            if (id) {
                await updateDoc(doc(db, "contacts", id), {
                    name: nameInput.value.trim(),
                    phone: phoneInput.value.trim(),
                    email: emailInput.value.trim()
                });
                alert("Contact Updated!");
            } else {
                await addDoc(collection(db, "contacts"), {
                    uid: user.uid,
                    name: nameInput.value.trim(),
                    phone: phoneInput.value.trim(),
                    email: emailInput.value.trim(),
                    ringtone: "Default.mp3",
                    createdAt: serverTimestamp()
                });
                alert("Contact Saved!");
            }

            contactIdInput.value = "";
            modal.style.display = "none";
            nameInput.value = "";
            phoneInput.value = "";
            emailInput.value = "";

            loadContacts(searchInput ? searchInput.value : "");

        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };
}

async function loadContacts(search = "") {
    const user = auth.currentUser;
    if (!user || !contactsContainer) return;

    contactsContainer.innerHTML = "";

    const q = query(
        collection(db, "contacts"),
        where("uid", "==", user.uid)
    );

    const snapshot = await getDocs(q);
    let total = 0;
    const contacts = [];

    snapshot.forEach((document) => {
        contacts.push({
            id: document.id,
            ...document.data()
        });
    });

    contacts.sort((a, b) => (b.favorite === true) - (a.favorite === true));

    contacts.forEach((contact) => {
        const contactId = contact.id;
        const isFavorite = contact.favorite === true;
        const currentRingtone = contact.ringtone || "Default.mp3";
        const keyword = search.toLowerCase();

        if (
            keyword !== "" &&
            !contact.name.toLowerCase().includes(keyword) &&
            !contact.phone.includes(keyword)
        ) {
            return;
        }

        total++;
        const firstLetter = contact.name.charAt(0).toUpperCase();

        const options = ["Default.mp3", "Classic.mp3", "Crystal.mp3", "Digital.mp3", "Galaxy.mp3", "Piano.mp3", "Retro.mp3", "Zen.mp3"];
        const selectOptions = options.map(opt => {
            const label = opt.replace(".mp3", "");
            return `<option value="${opt}" ${currentRingtone === opt ? "selected" : ""}>${label}</option>`;
        }).join("");

        contactsContainer.innerHTML += `
        <div class="contact-card" data-uid="${contactId}">
            <div class="contact-left">
                <div class="contact-avatar">
                    ${firstLetter}
                </div>
                <div>
                    <div class="contact-name">
                        <a href="contact-details.html?id=${contactId}" class="contact-link">
                            ${contact.name}
                        </a>
                    </div>
                    <div class="contact-number">
                        ${contact.phone}
                    </div>
                </div>
            </div>

            <div class="ringtone-section">
                <label class="ringtone-label">🎵 Ringtone</label>
                <select class="ringtone-select">
                    ${selectOptions}
                </select>
                <button class="save-ringtone">Save</button>
            </div>

            <div class="contact-actions">
                <button class="call-btn" onclick="callContact('${contact.name}','${contact.phone}')">
                    📞 Call
                </button>
                <button class="favorite-btn" onclick="toggleFavorite('${contactId}')">
                    ${isFavorite ? "⭐" : "☆"}
                </button>
                <button class="edit-btn" onclick="editContact('${contactId}')">
                    Edit
                </button>
                <button class="delete-btn" onclick="deleteContact('${contactId}')">
                    Delete
                </button>
            </div>
        </div>
        `;
    });

    document.querySelectorAll(".save-ringtone").forEach(button => {
        button.onclick = async () => {
            const card = button.closest(".contact-card");
            const uid = card.dataset.uid;
            const ringtone = card.querySelector(".ringtone-select").value;

            await updateDoc(doc(db, "contacts", uid), {
                ringtone: ringtone
            });

            alert("Ringtone Saved");
        };
    });

    if (total === 0) {
        contactsContainer.innerHTML = `
        <div class="empty-state">
            <h2>📭</h2>
            <p>No contacts found.</p>
        </div>
        `;
    }

    if (contactCount) contactCount.textContent = total + " Contacts";
}

window.toggleFavorite = async function(id) {
    const ref = doc(db, "contacts", id);
    const snap = await getDoc(ref);

    if (!snap.exists()) return;

    const contact = snap.data();

    await updateDoc(ref, {
        favorite: !contact.favorite
    });

    loadContacts(searchInput ? searchInput.value : "");
};

window.callContact = function(name, phone) {
    localStorage.setItem("dialName", name);
    localStorage.setItem("dialNumber", phone);
    window.location.href = "dialpad.html";
};

window.editContact = async function(id) {
    const user = auth.currentUser;

    const q = query(
        collection(db, "contacts"),
        where("uid", "==", user.uid)
    );

    const snapshot = await getDocs(q);

    snapshot.forEach((document) => {
        if (document.id === id) {
            const contact = document.data();
            contactIdInput.value = id;
            nameInput.value = contact.name;
            phoneInput.value = contact.phone;
            emailInput.value = contact.email || "";
            modal.style.display = "flex";
        }
    });
};

window.deleteContact = async function(id) {
    if (!confirm("Delete this contact?")) {
        return;
    }

    try {
        await deleteDoc(doc(db, "contacts", id));
        loadContacts(searchInput ? searchInput.value : "");
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
};

onAuthStateChanged(auth, async (user) => {
    if (user) {
        await updateEntireContactsCollection();
        loadContacts();
    }
});

if (searchInput) {
    searchInput.addEventListener("input", () => {
        loadContacts(searchInput.value);
    });
}