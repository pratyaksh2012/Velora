import { db } from "./firebase.js";
import { 
    doc, 
    collection, 
    addDoc, 
    setDoc, 
    onSnapshot, 
    getDoc, 
    updateDoc 
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const rtcConfig = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
    ]
};

let peerConnection = null;
let localStream = null;
let remoteStream = null;

/**
 * Obtain local audio stream from microphone
 */
export async function initLocalStream(videoEnabled = false) {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: videoEnabled
        });
        return localStream;
    } catch (error) {
        console.error("Error accessing audio devices:", error);
        throw error;
    }
}

/**
 * Initialize RTCPeerConnection instance and attach track listeners
 */
export function createPeerConnection(onTrackCallback) {
    peerConnection = new RTCPeerConnection(rtcConfig);
    remoteStream = new MediaStream();

    if (localStream) {
        localStream.getTracks().forEach((track) => {
            peerConnection.addTrack(track, localStream);
        });
    }

    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track);
        });
        if (onTrackCallback) onTrackCallback(remoteStream);
    };

    return peerConnection;
}

/**
 * Caller flow: Generate SDP Offer & sync candidates via Firestore
 */
export async function startCall(callId, onRemoteStream) {
    createPeerConnection(onRemoteStream);

    const callDoc = doc(db, "calls", callId);
    const offerCandidates = collection(callDoc, "offerCandidates");
    const answerCandidates = collection(callDoc, "answerCandidates");

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            addDoc(offerCandidates, event.candidate.toJSON());
        }
    };

    const offerDescription = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offerDescription);

    const offer = {
        sdp: offerDescription.sdp,
        type: offerDescription.type
    };

    await setDoc(callDoc, { offer }, { merge: true });

    // Listen for Answer
    onSnapshot(callDoc, (snapshot) => {
        const data = snapshot.data();
        if (peerConnection && !peerConnection.currentRemoteDescription && data?.answer) {
            const answerDescription = new RTCSessionDescription(data.answer);
            peerConnection.setRemoteDescription(answerDescription);
        }
    });

    // Listen for Answer ICE Candidates
    onSnapshot(answerCandidates, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                const candidate = new RTCIceCandidate(change.doc.data());
                peerConnection.addIceCandidate(candidate);
            }
        });
    });
}

/**
 * Receiver flow: Accept SDP Offer and generate SDP Answer via Firestore
 */
export async function answerCall(callId, onRemoteStream) {
    createPeerConnection(onRemoteStream);

    const callDoc = doc(db, "calls", callId);
    const offerCandidates = collection(callDoc, "offerCandidates");
    const answerCandidates = collection(callDoc, "answerCandidates");

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            addDoc(answerCandidates, event.candidate.toJSON());
        }
    };

    const callData = (await getDoc(callDoc)).data();
    if (!callData || !callData.offer) return;

    await peerConnection.setRemoteDescription(new RTCSessionDescription(callData.offer));

    const answerDescription = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answerDescription);

    const answer = {
        type: answerDescription.type,
        sdp: answerDescription.sdp
    };

    await updateDoc(callDoc, { answer, status: "accepted" });

    // Listen for Offer ICE Candidates
    onSnapshot(offerCandidates, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                const candidate = new RTCIceCandidate(change.doc.data());
                peerConnection.addIceCandidate(candidate);
            }
        });
    });
}

/**
 * Mute or unmute microphone
 */
export function toggleMute(isMuted) {
    if (localStream) {
        localStream.getAudioTracks().forEach((track) => {
            track.enabled = !isMuted;
        });
    }
}

/**
 * Terminate streams and active peer connection
 */
export function endCall() {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        localStream = null;
    }
}