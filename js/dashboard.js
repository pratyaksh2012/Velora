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

/*
 * IMPORTANT
 * Your contact-selection code should set:
 *
 * window.receiverDocId = "THE_RECEIVER_FIREBASE_UID";
 *
 * Example:
 * window.receiverDocId = contact.uid;
 *
 * This file also accepts window.selectedContact if your dashboard
 * stores the selected contact there.
 */

auth.onAuthStateChanged((user) => {
    currentUser = user;

    console.log("Current user:", user);

    if (user) {
        console.log("Current Firebase UID:", user.uid);
    }
});


/* -------------------------------------------------------
   GET RECEIVER UID
------------------------------------------------------- */

async function getReceiverUid() {

    // 1. Direct Firebase UID supplied by your contact selector
    let receiverId = window.receiverDocId || null;

    // 2. Try selected contact object if available
    if (!receiverId && window.selectedContact) {

        const contact = window.selectedContact;

        receiverId =
            contact.uid ||
            contact.userId ||
            contact.userUid ||
            contact.contactUid ||
            contact.receiverId ||
            null;
    }

    // 3. Try a selected contact button
    if (!receiverId) {

        const selectedElement =
            document.querySelector(
                "[data-receiver-uid].selected, " +
                "[data-user-uid].selected, " +
                "[data-uid].selected"
            );

        if (selectedElement) {

            receiverId =
                selectedElement.dataset.receiverUid ||
                selectedElement.dataset.userUid ||
                selectedElement.dataset.uid ||
                null;
        }
    }

    if (!receiverId) {
        throw new Error(
            "Receiver Firebase UID is missing. Select a contact first."
        );
    }

    /*
     * If receiverId is actually a contact document ID,
     * try to retrieve the real Firebase UID from that contact.
     */
    try {

        const contactRef = doc(db, "contacts", receiverId);
        const contactSnap = await getDoc(contactRef);

        if (contactSnap.exists()) {

            const contactData = contactSnap.data();

            const realUid =
                contactData.uid ||
                contactData.userId ||
                contactData.userUid ||
                contactData.contactUid ||
                contactData.receiverId ||
                null;

            if (realUid) {
                receiverId = realUid;
            }
        }

    } catch (error) {

        console.warn(
            "Could not resolve contact document. Using supplied ID:",
            error
        );
    }

    return receiverId;
}


/* -------------------------------------------------------
   CALL BUTTON
------------------------------------------------------- */

const callBtn = document.getElementById("callBtn");

callBtn?.addEventListener("click", async () => {

    if (!currentUser) {
        alert("Please login first.");
        return;
    }

    try {

        /*
         * Get the actual Firebase UID of the person
         * we want to call.
         */
        const receiverUid = await getReceiverUid();

        console.log(
            "CALLER UID:",
            currentUser.uid
        );

        console.log(
            "RECEIVER UID:",
            receiverUid
        );

        /*
         * Never allow calling yourself.
         */
        if (receiverUid === currentUser.uid) {

            alert("You cannot call yourself.");

            return;
        }


        /* ------------------------------------------------
           GET CONTACT RINGTONE
        ------------------------------------------------ */

        let selectedRingtone = "Default.mp3";

        try {

            /*
             * If receiverUid is also a contact document ID,
             * this may find the contact.
             */
            const contactSnap = await getDoc(
                doc(db, "contacts", receiverUid)
            );

            if (contactSnap.exists()) {

                const contactData = contactSnap.data();

                selectedRingtone =
                    contactData.ringtone ||
                    "Default.mp3";
            }

        } catch (error) {

            console.warn(
                "Could not load contact ringtone:",
                error
            );
        }


        /* ------------------------------------------------
           CREATE CALL DOCUMENT
        ------------------------------------------------ */

        const callData = {

            callerId: currentUser.uid,

            /*
             * THIS IS THE IMPORTANT FIX.
             *
             * receiverId MUST be the receiver's
             * Firebase Authentication UID.
             */
            receiverId: receiverUid,

            callerName:
                currentUser.displayName ||
                currentUser.email ||
                "Unknown caller",

            receiverName: "User",

            ringtone: selectedRingtone,

            status: "calling",

            type: "voice",

            createdAt: serverTimestamp()
        };

        console.log(
            "Creating call with data:",
            callData
        );


        const callRef = await addDoc(
            collection(db, "calls"),
            callData
        );


        console.log(
            "CALL CREATED:",
            callRef.id
        );


        /* ------------------------------------------------
           START MICROPHONE
        ------------------------------------------------ */

        await initLocalStream(false);


        /* ------------------------------------------------
           START WEBRTC
        ------------------------------------------------ */

        await startCall(
            callRef.id,
            (remoteStream) => {

                let remoteAudio =
                    document.getElementById("remoteAudio");

                if (!remoteAudio) {

                    remoteAudio =
                        document.createElement("audio");

                    remoteAudio.id =
                        "remoteAudio";

                    remoteAudio.autoplay = true;

                    remoteAudio.playsInline = true;

                    document.body.appendChild(
                        remoteAudio
                    );
                }

                remoteAudio.srcObject =
                    remoteStream;

                remoteAudio.play().catch(() => {});
            }
        );


        alert(
            "Calling..."
        );


    } catch (error) {

        console.error(
            "FAILED TO PLACE CALL:",
            error
        );

        alert(
            "Failed to place call:\n\n" +
            error.message
        );
    }
});
