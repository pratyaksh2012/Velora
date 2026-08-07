import { db, auth } from "./firebase.js";
import {
    collection,
    addDoc,
    query,
    where,
    onSnapshot,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { initLocalStream, startCall } from "./webrtc.js";

// DOM Handles
const chatsList = document.getElementById("chatsList");
const chatSearchInput = document.getElementById("chatSearchInput");
const addContactSidebarBtn = document.getElementById("addContactSidebarBtn");
const addContactModal = document.getElementById("addContactModal");
const saveNewContactBtn = document.getElementById("saveNewContactBtn");
const cancelNewContactBtn = document.getElementById("cancelNewContactBtn");

const messagesContainer = document.getElementById("messagesContainer");
const messageTextInput = document.getElementById("messageTextInput");
const sendMessageBtn = document.getElementById("sendMessageBtn");
const chatRoomArea = document.getElementById("chatRoomArea");
const chatListSidebar = document.getElementById("chatListSidebar");
const backToListBtn = document.getElementById("backToListBtn");

const roomUserName = document.getElementById("roomUserName");
const roomAvatar = document.getElementById("roomAvatar");

const callVoiceBtn = document.getElementById("callVoiceBtn");
const callVideoBtn = document.getElementById("callVideoBtn");
const attachFileBtn = document.getElementById("attachFileBtn");
const fileAttachmentInput = document.getElementById("fileAttachmentInput");
const emojiBtn = document.getElementById("emojiBtn");
const voiceRecordBtn = document.getElementById("voiceRecordBtn");

const infoPanel = document.getElementById("infoPanel");
const toggleInfoPanelBtn = document.getElementById("toggleInfoPanelBtn");
const closeInfoPanelBtn = document.getElementById("closeInfoPanelBtn");
const infoName = document.getElementById("infoName");
const infoPhone = document.getElementById("infoPhone");
const infoAvatar = document.getElementById("infoAvatar");

let currentUser = null;
let savedContacts = [];
let activeContact = null;
let activeChatId = null;
let unsubscribeMessages = null;
let isRecording = false;

// Observe Auth State
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        loadUserSavedContacts(user.uid);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    setupEventListeners();
});

function setupEventListeners() {
    // Add Contact Modal Handlers
    addContactSidebarBtn?.addEventListener("click", () => {
        if (addContactModal) addContactModal.style.display = "flex";
    });

    cancelNewContactBtn?.addEventListener("click", () => {
        if (addContactModal) addContactModal.style.display = "none";
    });

    saveNewContactBtn?.addEventListener("click", saveContactToFirestore);

    // Search filter
    chatSearchInput?.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase().trim();
        const filtered = savedContacts.filter(c => 
            c.name.toLowerCase().includes(term) || c.phone.includes(term)
        );
        renderContactsSidebar(filtered);
    });

    // Mobile Back Button
    backToListBtn?.addEventListener("click", () => {
        chatRoomArea.classList.add("hidden-mobile");
        chatListSidebar.classList.remove("hidden-mobile");
    });

    // Send Message
    sendMessageBtn?.addEventListener("click", () => sendMessage());
    messageTextInput?.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Voice & Video Call Controls
    callVoiceBtn?.addEventListener("click", () => placeCall(false));
    callVideoBtn?.addEventListener("click", () => placeCall(true));

    // Attachment & Image handling
    attachFileBtn?.addEventListener("click", () => fileAttachmentInput?.click());
    fileAttachmentInput?.addEventListener("change", handleFileUpload);

    // Emoji Picker Trigger
    emojiBtn?.addEventListener("click", () => {
        const emojis = ["😊", "👍", "❤️", "🔥", "🎉", "👋", "🙌"];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        messageTextInput.value += randomEmoji;
        messageTextInput.focus();
    });

    // Voice Recording Toggle Action
    voiceRecordBtn?.addEventListener("click", () => {
        if (!activeContact) {
            alert("Select a chat first.");
            return;
        }

        isRecording = !isRecording;
        if (isRecording) {
            voiceRecordBtn.classList.add("recording");
            alert("Recording voice message... Click again to send.");
        } else {
            voiceRecordBtn.classList.remove("recording");
            sendMessage("[🎙️ Voice Note: 0:08]");
        }
    });

    // Toggle Info Panel
    toggleInfoPanelBtn?.addEventListener("click", () => {
        if (infoPanel) {
            infoPanel.style.display = infoPanel.style.display === "none" ? "flex" : "none";
        }
    });
    closeInfoPanelBtn?.addEventListener("click", () => {
        if (infoPanel) infoPanel.style.display = "none";
    });
}

function loadUserSavedContacts(userId) {
    const q = query(
        collection(db, "contacts"),
        where("uid", "==", userId)
    );

    onSnapshot(q, (snapshot) => {
        savedContacts = [];
        snapshot.forEach((docSnap) => {
            savedContacts.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });

        renderContactsSidebar(savedContacts);
    });
}

function renderContactsSidebar(list) {
    if (!chatsList) return;
    chatsList.innerHTML = "";

    if (list.length === 0) {
        chatsList.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #64748b; font-size: 13px;">
                <p>No contacts saved yet.</p>
                <p>Click <b>"+ Add Contact"</b> above to add someone.</p>
            </div>
        `;
        return;
    }

    list.forEach(contact => {
        const card = document.createElement("div");
        card.className = `chat-item ${activeContact?.id === contact.id ? "active" : ""}`;
        card.innerHTML = `
            <div class="avatar" style="width: 40px; height: 40px; font-size: 16px;">
                ${contact.name.charAt(0).toUpperCase()}
            </div>
            <div class="chat-item-body">
                <div class="chat-item-name">${contact.name}</div>
                <div style="font-size: 12px; color: #64748b;">${contact.phone}</div>
            </div>
        `;

        card.addEventListener("click", () => openContactChat(contact));
        chatsList.appendChild(card);
    });
}

async function saveContactToFirestore() {
    if (!currentUser) return;

    const name = document.getElementById("newContactName")?.value.trim();
    const phone = document.getElementById("newContactPhone")?.value.trim();
    const email = document.getElementById("newContactEmail")?.value.trim() || "";

    if (!name || !phone) {
        alert("Please enter Name and Phone number.");
        return;
    }

    try {
        await addDoc(collection(db, "contacts"), {
            uid: currentUser.uid,
            name: name,
            phone: phone,
            email: email,
            ringtone: "Default.mp3",
            createdAt: serverTimestamp()
        });

        alert("Contact Saved!");
        if (addContactModal) addContactModal.style.display = "none";

        document.getElementById("newContactName").value = "";
        document.getElementById("newContactPhone").value = "";
        document.getElementById("newContactEmail").value = "";
    } catch (err) {
        console.error("Error adding contact:", err);
        alert("Failed to save contact: " + err.message);
    }
}

function openContactChat(contact) {
    activeContact = contact;
    activeChatId = [currentUser.uid, contact.id].sort().join("_");

    chatRoomArea.classList.remove("hidden-mobile");
    chatListSidebar.classList.add("hidden-mobile");

    roomUserName.textContent = contact.name;
    roomAvatar.textContent = contact.name.charAt(0).toUpperCase();

    if (infoName) infoName.textContent = contact.name;
    if (infoPhone) infoPhone.textContent = contact.phone;
    if (infoAvatar) infoAvatar.textContent = contact.name.charAt(0).toUpperCase();

    listenToMessages(activeChatId);
}

function listenToMessages(chatId) {
    if (unsubscribeMessages) unsubscribeMessages();

    const q = query(
        collection(db, "chats", chatId, "messages"),
        orderBy("timestamp", "asc")
    );

    unsubscribeMessages = onSnapshot(q, (snapshot) => {
        messagesContainer.innerHTML = "";

        if (snapshot.empty) {
            messagesContainer.innerHTML = `
                <div class="empty-chat-state">
                    <div class="illustration">💬</div>
                    <h3>Start Chatting</h3>
                    <p>Send a message to ${activeContact.name}.</p>
                </div>
            `;
            return;
        }

        snapshot.forEach((docSnap) => {
            const msg = docSnap.data();
            const isMe = msg.senderId === currentUser.uid;

            const bubble = document.createElement("div");
            bubble.className = `message-bubble ${isMe ? "outgoing" : "incoming"}`;

            const timeStr = msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now";

            let mediaHtml = "";
            if (msg.mediaUrl) {
                mediaHtml = `<img src="${msg.mediaUrl}" class="message-media-img" alt="shared media">`;
            }

            bubble.innerHTML = `
                ${mediaHtml}
                <span class="message-text">${msg.text || ""}</span>
                <div class="message-meta">
                    <span>${timeStr}</span>
                    ${isMe ? "<span>✓✓</span>" : ""}
                </div>
            `;

            messagesContainer.appendChild(bubble);
        });

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
}

async function sendMessage(customText = null) {
    const text = customText || messageTextInput.value.trim();
    if (!text || !activeChatId || !currentUser) return;

    if (!customText) messageTextInput.value = "";

    try {
        await addDoc(collection(db, "chats", activeChatId, "messages"), {
            senderId: currentUser.uid,
            receiverId: activeContact.id,
            text: text,
            timestamp: serverTimestamp()
        });
    } catch (err) {
        console.error("Error sending message:", err);
    }
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file || !activeChatId || !currentUser) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            await addDoc(collection(db, "chats", activeChatId, "messages"), {
                senderId: currentUser.uid,
                receiverId: activeContact.id,
                text: file.name,
                mediaUrl: event.target.result,
                timestamp: serverTimestamp()
            });
        } catch (err) {
            console.error("Error uploading file:", err);
        }
    };
    reader.readAsDataURL(file);
}

async function placeCall(isVideo = false) {
    if (!activeContact || !currentUser) {
        alert("Select a contact to call.");
        return;
    }

    try {
        const callRef = await addDoc(collection(db, "calls"), {
            callerId: currentUser.uid,
            receiverId: activeContact.id,
            callerName: currentUser.displayName || currentUser.email,
            receiverName: activeContact.name,
            ringtone: "Default.mp3",
            status: "calling",
            type: isVideo ? "video" : "voice",
            createdAt: serverTimestamp()
        });

        await initLocalStream(isVideo);
        await startCall(callRef.id, (remoteStream) => {
            let remoteAudio = document.getElementById("remoteAudio");
            if (!remoteAudio) {
                remoteAudio = document.createElement("audio");
                remoteAudio.id = "remoteAudio";
                remoteAudio.autoplay = true;
                document.body.appendChild(remoteAudio);
            }
            remoteAudio.srcObject = remoteStream;
        });

        alert(`Calling ${activeContact.name}...`);
    } catch (err) {
        console.error("Call initiation error:", err);
        alert("Failed to place call: " + err.message);
    }
}