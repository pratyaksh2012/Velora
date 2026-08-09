import { db, auth } from "./firebase.js";

import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
    initLocalStream,
    answerCall,
    endCall
} from "./webrtc.js";


let currentCall = null;
let remoteAudio = null;
let unsubscribeCalls = null;


/* -------------------------------------------------------
   REMOTE AUDIO
------------------------------------------------------- */

function getRemoteAudioElement() {

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

    return remoteAudio;
}


/* -------------------------------------------------------
   STOP RINGTONE
------------------------------------------------------- */

function stopRingtone() {

    const ringtone =
        document.getElementById("ringtone");

    if (ringtone) {

        ringtone.pause();

        ringtone.currentTime = 0;
    }
}


/* -------------------------------------------------------
   PLAY RINGTONE
------------------------------------------------------- */

function playRingtone(ringtoneName) {

    let ringtone =
        document.getElementById("ringtone");

    if (!ringtone) {

        ringtone =
            document.createElement("audio");

        ringtone.id =
            "ringtone";

        ringtone.loop = true;

        ringtone.preload = "auto";

        document.body.appendChild(
            ringtone
        );
    }


    /*
     * Your console showed:
     *
     * assets/ringtones/Default.mp3 -> 404
     *
     * So if the file does not exist, simply don't
     * let the ringtone error break the call.
     */

    const safeName =
        ringtoneName || "Default.mp3";

    ringtone.src =
        "./assets/ringtones/" +
        encodeURIComponent(safeName);

    ringtone.load();


    ringtone.play()
        .then(() => {

            console.log(
                "Ringtone playing:",
                safeName
            );

        })
        .catch((error) => {

            console.warn(
                "Ringtone could not play:",
                error.message
            );

        });
}


/* -------------------------------------------------------
   AUTH + INCOMING CALL LISTENER
------------------------------------------------------- */

auth.onAuthStateChanged((user) => {

    /*
     * Remove previous listener if the auth state
     * changes.
     */
    if (unsubscribeCalls) {

        unsubscribeCalls();

        unsubscribeCalls = null;
    }


    if (!user) {

        console.log(
            "No user logged in."
        );

        return;
    }


    console.log(
        "Listening for incoming calls for:",
        user.uid
    );


    /*
     * IMPORTANT:
     *
     * receiverId in the call document MUST equal
     * this user's Firebase UID.
     */
    const callsQuery = query(

        collection(db, "calls"),

        where(
            "receiverId",
            "==",
            user.uid
        ),

        where(
            "status",
            "==",
            "calling"
        )
    );


    unsubscribeCalls =
        onSnapshot(

            callsQuery,

            (snapshot) => {

                console.log(
                    "Incoming call snapshot:",
                    snapshot.size
                );


                snapshot.docChanges()
                    .forEach((change) => {

                        if (
                            change.type !== "added"
                        ) {
                            return;
                        }


                        const data =
                            change.doc.data();


                        console.log(
                            "INCOMING CALL:",
                            data
                        );


                        /*
                         * Extra safety check.
                         */
                        if (
                            data.receiverId !==
                            user.uid
                        ) {

                            console.warn(
                                "Call received but receiver UID does not match."
                            );

                            return;
                        }


                        currentCall = {

                            id:
                                change.doc.id,

                            data:
                                data
                        };


                        /* --------------------------------
                           SHOW CALLER NAME
                        -------------------------------- */

                        const callerName =
                            document.getElementById(
                                "callerName"
                            );

                        if (callerName) {

                            callerName.textContent =
                                `${data.callerName || "Unknown"} is calling`;
                        }


                        /* --------------------------------
                           PLAY RINGTONE
                        -------------------------------- */

                        playRingtone(
                            data.ringtone
                        );
                    });
            },


            (error) => {

                console.error(
                    "INCOMING CALL LISTENER ERROR:",
                    error
                );

                if (
                    error.code ===
                    "permission-denied"
                ) {

                    console.error(
                        "Firestore permission denied while listening to calls."
                    );
                }
            }
        );
});


/* -------------------------------------------------------
   ACCEPT CALL
------------------------------------------------------- */

const acceptBtn =
    document.getElementById(
        "acceptBtn"
    );


if (acceptBtn) {

    acceptBtn.addEventListener(
        "click",
        async () => {

            if (!currentCall) {

                console.warn(
                    "No incoming call available."
                );

                return;
            }


            stopRingtone();


            /*
             * Disable button temporarily to prevent
             * double-clicking Accept.
             */
            acceptBtn.disabled = true;


            try {

                console.log(
                    "Accepting call:",
                    currentCall.id
                );


                /*
                 * Open microphone.
                 */
                await initLocalStream(false);


                const audioEl =
                    getRemoteAudioElement();


                /*
                 * Answer the WebRTC call.
                 */
                await answerCall(
                    currentCall.id,
                    (stream) => {

                        console.log(
                            "Remote audio stream received."
                        );


                        audioEl.srcObject =
                            stream;


                        audioEl.play()
                            .catch(() => {});
                    }
                );


                console.log(
                    "Call connected via WebRTC."
                );


            } catch (error) {

                console.error(
                    "Error connecting WebRTC call:",
                    error
                );


                alert(
                    "Failed to establish audio call:\n\n" +
                    error.message
                );


                acceptBtn.disabled = false;
            }
        }
    );
}


/* -------------------------------------------------------
   REJECT CALL
------------------------------------------------------- */

const rejectBtn =
    document.getElementById(
        "rejectBtn"
    );


if (rejectBtn) {

    rejectBtn.addEventListener(
        "click",
        async () => {

            if (!currentCall) {

                return;
            }


            stopRingtone();


            try {

                console.log(
                    "Rejecting call:",
                    currentCall.id
                );


                await updateDoc(

                    doc(
                        db,
                        "calls",
                        currentCall.id
                    ),

                    {
                        status:
                            "rejected"
                    }
                );


                endCall();


                currentCall =
                    null;


                console.log(
                    "Call rejected."
                );


            } catch (error) {

                console.error(
                    "Failed to reject call:",
                    error
                );


                alert(
                    "Failed to reject call:\n\n" +
                    error.message
                );
            }
        }
    );
}
