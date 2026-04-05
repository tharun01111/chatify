// WebRTC Core Utilities

// STUN Configuration & TURN Fallback placeholder
export const rtcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    // { urls: "turn:my-coturn-server.com:3478", username: "user", credential: "pwd" } // Example Fallback
  ],
};

// Requests browser hardware permissions robustly
export const getMediaStream = async (type) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video", // Audio-only calls drop the video permission
    });
    return stream;
  } catch (error) {
    console.error("Error accessing media devices.", error);
    throw new Error(
      error.name === "NotAllowedError"
        ? "Please allow camera and microphone permissions."
        : "Media device failure. Please verify hardware."
    );
  }
};

// Halts all active media tracks immediately
export const destroyMediaStream = (stream) => {
  if (stream) {
    stream.getTracks().forEach((track) => {
      track.stop();
      track.enabled = false;
    });
  }
};

// Create Peer Connection
export const createPeerConnection = () => {
  return new RTCPeerConnection(rtcConfig);
};
