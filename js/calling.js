import { db, auth } from "./firebase.js";

import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import { initLocalStream, answerCall, endCall } from "./webrtc.js";

let currentCall = null;
let remoteAudio = null;

// Remote Audio element initialization
function getRemoteAudioElement() {
    if (!remoteAudio) {
        remoteAudio = document.createElement("audio");
        remoteAudio.id = "remoteAudio";
        remoteAudio.autoplay = true;
        document.body.appendChild(remoteAudio);
    }
    return remoteAudio;
}

// Listen for authentication & incoming call documents
auth.onAuthStateChanged((user) => {
    if (!user) {
        console.log("No user logged in.");
        return;
    }

    console.log("Listening for incoming calls for:", user.uid);

    const q = query(
        collection(db, "calls"),
        where("receiverId", "==", user.uid),
        where("status", "==", "calling")
    );

    onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                const data = change.doc.data();

                currentCall = {
                    id: change.doc.id,
                    data: data
                };

                const callerName = document.getElementById("callerName");
                if (callerName) {
                    callerName.textContent = `${data.callerName || "Unknown"} is calling`;
                }

                // Ringtone audio configuration
                const ringtoneName = data.ringtone || "Default.mp3";
                let ringtone = document.getElementById("ringtone");
                if (!ringtone) {
                    ringtone = document.createElement("audio");
                    ringtone.id = "ringtone";
                    ringtone.loop = true;
                    document.body.appendChild(ringtone);
                }
                ringtone.src = "assets/ringtones/" + ringtoneName;
                ringtone.load();
                ringtone.play().catch(err => console.log("Audio playback error:", err));
            }
        });
    });
});

// --------------------
// ACCEPT CALL
// --------------------
const acceptBtn = document.getElementById("acceptBtn");

if (acceptBtn) {
    acceptBtn.addEventListener("click", async () => {
        if (!currentCall) return;

        const ringtone = document.getElementById("ringtone");
        if (ringtone) {
            ringtone.pause();
            ringtone.currentTime = 0;
        }

        try {
            await initLocalStream(false);
            const audioEl = getRemoteAudioElement();

            await answerCall(currentCall.id, (stream) => {
                audioEl.srcObject = stream;
            });

            console.log("Call connected via WebRTC");
        } catch (err) {
            console.error("Error connecting WebRTC call:", err);
            alert("Failed to establish audio call: " + err.message);
        }
    });
}

// --------------------
// REJECT CALL
// --------------------
const rejectBtn = document.getElementById("rejectBtn");

if (rejectBtn) {
    rejectBtn.addEventListener("click", async () => {
        if (!currentCall) return;

        const ringtone = document.getElementById("ringtone");
        if (ringtone) {
            ringtone.pause();
            ringtone.currentTime = 0;
        }

        await updateDoc(
            doc(db, "calls", currentCall.id),
            {
                status: "rejected"
            }
        );

        endCall();
        currentCall = null;
    });
}