import { db, auth } from "./firebase.js";

import {
    collection,
    addDoc,
    doc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import { initLocalStream, startCall } from "./webrtc.js";

let currentUser = null;

auth.onAuthStateChanged((user) => {
    currentUser = user;
    console.log("Current user:", user);
});

const callBtn = document.getElementById("callBtn");

callBtn?.addEventListener("click", async () => {
    if (!currentUser) {
        alert("Login required");
        return;
    }

    
    let selectedRingtone = "Default.mp3";

    try {
        const contactSnap = await getDoc(doc(db, "contacts", receiverDocId));
        if (contactSnap.exists()) {
            selectedRingtone = contactSnap.data().ringtone || "Default.mp3";
        }
    } catch (e) {
        console.error("Error fetching contact ringtone:", e);
    }

    try {
        const callRef = await addDoc(collection(db, "calls"), {
            callerId: currentUser.uid,
            receiverId: receiverDocId,
            callerName: currentUser.displayName || currentUser.email,
            receiverName: "User",
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

        alert("Calling...");
    } catch (err) {
        console.error("Failed to place call:", err);
        alert("Failed to place call: " + err.message);
    }
});