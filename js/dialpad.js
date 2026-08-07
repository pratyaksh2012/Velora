import { db, auth } from "./firebase.js";
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { initLocalStream, startCall } from "./webrtc.js";

const phoneNumber = document.getElementById("phoneNumber");
const callerName = document.getElementById("callerName");

const keys = document.querySelectorAll(".dial-key");

const deleteBtn = document.getElementById("deleteBtn");
const callBtn = document.getElementById("callBtn");

// Load Number from Contacts
window.addEventListener("DOMContentLoaded", () => {
    const savedNumber = localStorage.getItem("dialNumber");
    const savedName = localStorage.getItem("dialName");

    if (savedNumber) {
        phoneNumber.value = savedNumber;
    }

    if (savedName) {
        callerName.textContent = savedName;
    }
});

// Dial Pad Buttons
keys.forEach((key) => {
    key.addEventListener("click", () => {
        const value = key.dataset.value;
        phoneNumber.value += value;
    });
});

// Delete Last Digit
deleteBtn.addEventListener("click", () => {
    phoneNumber.value = phoneNumber.value.slice(0, -1);
});

// Long Press Delete
deleteBtn.addEventListener("dblclick", () => {
    phoneNumber.value = "";
    callerName.textContent = "";
});

// Call Button (WebRTC Call Signaling)
callBtn.addEventListener("click", async () => {
    const number = phoneNumber.value.trim();
    const user = auth.currentUser;

    if (!user) {
        alert("Login required to make calls.");
        return;
    }

    if (number === "") {
        alert("Please enter a phone number.");
        return;
    }

    try {
        // Query Firestore for contact matching number
        let receiverId = null;
        let selectedRingtone = "Default.mp3";
        let targetName = callerName.textContent || number;

        const q = query(
            collection(db, "contacts"),
            where("phone", "==", number)
        );
        const snap = await getDocs(q);

        snap.forEach((docSnap) => {
            const data = docSnap.data();
            receiverId = data.uid || docSnap.id;
            selectedRingtone = data.ringtone || "Default.mp3";
            targetName = data.name || targetName;
        });

        // Fallback for demo testing if no contact matches
        if (!receiverId) {
            receiverId = "PKlQzWtn22hIwmDr8Xy06x3iZru1";
        }

        const callRef = await addDoc(collection(db, "calls"), {
            callerId: user.uid,
            receiverId: receiverId,
            callerName: user.displayName || user.email,
            receiverName: targetName,
            ringtone: selectedRingtone,
            status: "calling",
            type: "voice",
            createdAt: serverTimestamp()
        });

        await initLocalStream(false);

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

        alert("Calling " + targetName + "...");
    } catch (error) {
        console.error("Error making call:", error);
        alert("Failed to initiate call: " + error.message);
    }
});

// Keyboard Support
document.addEventListener("keydown", (e) => {
    if ("0123456789*#".includes(e.key)) {
        phoneNumber.value += e.key;
    }

    if (e.key === "Backspace") {
        phoneNumber.value = phoneNumber.value.slice(0, -1);
    }

    if (e.key === "Enter") {
        callBtn.click();
    }
});

// Clear Saved Contact
phoneNumber.addEventListener("input", () => {
    if (phoneNumber.value === "") {
        callerName.textContent = "";
        localStorage.removeItem("dialName");
        localStorage.removeItem("dialNumber");
    }
});