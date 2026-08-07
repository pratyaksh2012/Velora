Markdown


# ⚡ Velora • Modern Web Calling & Messaging Platform

<div align="center">

![Velora Banner](assets/logo.png)

  <h3>Connect. Call. Communicate.</h3>

  <p>
    An ultra-responsive, feature-rich WebRTC audio/video calling and real-time messaging Progressive Web App (PWA) built with modern Web Standards and Firebase.
  </p>

  <p>
    <a href="#-key-features"><strong>Explore Features »</strong></a>
    ·
    <a href="#-getting-started"><strong>Quick Start</strong></a>
    ·
    <a href="#-tech-stack"><strong>Tech Stack</strong></a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Version-1.0.0-blue.svg?style=flat-square" alt="Version 1.0.0" />
    <img src="https://img.shields.io/badge/WebRTC-PeerToPeer-green.svg?style=flat-square" alt="WebRTC" />
    <img src="https://img.shields.io/badge/Firebase-v12.0.0-orange.svg?style=flat-square" alt="Firebase" />
    <img src="https://img.shields.io/badge/PWA-Supported-purple.svg?style=flat-square" alt="PWA Ready" />
    <img src="https://img.shields.io/badge/License-MIT-lightgrey.svg?style=flat-square" alt="License" />
  </p>

</div>

---

## 🌟 Overview

**Velora** is an end-to-end communication platform designed to deliver a native mobile-like experience (Android + iOS design principles) directly on the web. Powered by **WebRTC** for real-time peer-to-peer audio/video streaming and **Firebase Firestore** for lightning-fast signaling and data persistence, Velora provides zero-latency interactions wrapped in a modern glassmorphism UI.

---

## ✨ Key Features

### 📞 WebRTC Voice & Video Calling
* **Real-Time P2P Streaming:** Ultra-low latency voice and video streaming via standard WebRTC peer connections with STUN server candidate discovery.
* **Firestore Signaling Engine:** Automatic offer, answer, and ICE candidate negotiation synchronized in real time.
* **Custom Contact Ringtones:** Per-contact ringtone selection (`Piano.mp3`, `Classic.mp3`, `Zen.mp3`, etc.) played seamlessly on incoming calls.
* **Call Controls:** Mute audio, toggle camera, or decline call requests instantly.

### 💬 Instant Messaging & Contacts
* **Live Chat Stream:** Synchronized, real-time messaging powered by Firestore document snapshot listeners.
* **Rich Media Sharing:** Share photos, voice notes, and file attachments directly inside chat streams.
* **Contact Management:** Search, add, edit, or favorite contacts with dynamic schema validation.
* **Quick Contact Addition:** Add unsaved recipients directly into your contact book straight from active chat rooms.

### 🕒 Recents, Missed Calls & Notifications
* **Call History Logs:** Filter calls by `Incoming`, `Outgoing`, `Missed`, or `Video`.
* **Dedicated Missed Calls Screen:** Filter by time range (Today, Yesterday, Last 7 Days) with one-tap "Call Back" actions.
* **Live Notification Center:** Real-time push notification tracking for missed calls, incoming messages, and security updates.

### ⚙️ Deep Customization & PWA Support
* **Theme Customization:** Toggle between Light Mode, Dark Mode, and System Default.
* **Offline PWA Capability:** Includes standard Service Worker (`service-worker.js`) caching and `manifest.json` for desktop and mobile home screen installation.

---

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3 (Glassmorphism, CSS Variables, Responsive Grid/Flexbox), Vanilla JavaScript (ES6+ Modules)
* **Real-Time Database:** Firebase Firestore (v12.0.0)
* **Authentication:** Firebase Auth
* **Media & Peer Streaming:** WebRTC (`RTCPeerConnection`, `getUserMedia`, STUN candidate discovery)
* **Storage & Hosting:** Firebase Storage / Web Standards

---

## 📁 File Structure

├── assets/                  # Logos, icons, and ringtone audio files
├── css/
│   ├── style.css            # Global theme variables & base styles
│   ├── darkmode.css         # Dark theme overrides
│   ├── dashboard.css        # Main dashboard grid and widgets
│   ├── chat.css             # 3-Panel modern messaging UI
│   ├── calling.css          # In-call and incoming call screens
│   ├── contacts.css         # Contact cards & modal styles
│   ├── dialpad.css          # Interactive dial pad layout
│   ├── recent.css           # Call history & filters
│   ├── missed-calls.css     # Missed call screen styles
│   ├── notifications.css    # Notification center styling
│   └── settings.css         # User preferences and profile styles
├── js/
│   ├── firebase.js          # Firebase SDK initialization & configuration
│   ├── auth.js              # Authentication state management
│   ├── webrtc.js            # PeerConnection, SDP exchange, ICE handling
│   ├── calling.js           # Incoming call listener & audio player
│   ├── dashboard.js        # Quick actions & stat counters
│   ├── chat.js              # Live messaging, attachments & contact saving
│   ├── contacts.js         # Firestore contact CRUD operations
│   ├── dialpad.js           # Virtual key events & call placing
│   ├── recent.js            # Call history filter logic
│   ├── missed-calls.js      # Missed call badge & quick callbacks
│   ├── notifications.js     # Real-time alert listeners
│   ├── settings.js          # Preference persistence & profile updates
│   ├── theme.js             # Theme switcher script
│   ├── install.js           # PWA installation prompt trigger
│   └── utils.js             # Toasts, loaders, and input helpers
├── index.html               # Login page
├── signup.html              # Registration page
├── dashboard.html           # Main user overview
├── chat.html                # Messenger interface
├── dialpad.html             # Virtual key pad
├── contacts.html            # Contact directory
├── recent.html              # Call logs
├── missed-calls.html        # Missed calls screen
├── notifications.html       # Notification center
├── settings.html           # User preference controls
├── manifest.json            # Web app manifest
└── service-worker.js        # PWA caching service worker


---

## 🚀 Getting Started

### Prerequisites
* A modern web browser with camera and microphone permissions enabled (Chrome, Firefox, Edge, Safari).
* A local web server environment (e.g., VS Code **Live Server** extension, `http-server`, or `python -m http.server`).

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-username/velora.git](https://github.com/your-username/velora.git)
   cd velora
   👤 Author
Crafted with care and precision by Pratyaksh Pratap Singh.
