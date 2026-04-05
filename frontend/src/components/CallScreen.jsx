import { useEffect, useRef, useState } from "react";
import { useCallStore } from "../store/useCallStore";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";

export default function CallScreen() {
  const { callStatus, callType, endCall, localStream, remoteStream, incomingCallData, videoUpgradeStatus, requestVideoUpgrade, acceptVideoUpgrade, rejectVideoUpgrade } = useCallStore();
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callType]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callType]);

  if (callStatus === "idle" || callStatus === "ringing") return null;

  const toggleMic = () => {
    if (localStream) {
      const newMutedState = !isMicMuted;
      setIsMicMuted(newMutedState);
      localStream.getAudioTracks().forEach(track => (track.enabled = !newMutedState));
    }
  };

  const toggleVideo = () => {
    if (callType === 'audio') {
      requestVideoUpgrade();
      return;
    }
    if (localStream) {
      const newVideoOffState = !isVideoOff;
      setIsVideoOff(newVideoOffState);
      localStream.getVideoTracks().forEach(track => (track.enabled = !newVideoOffState));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-xl flex flex-col justify-between">
      {/* Dynamic Popups */}
      {videoUpgradeStatus === "requesting" && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white py-3 px-6 rounded-full shadow-lg z-[60] animate-pulse">
          Waiting for user to accept video...
        </div>
      )}
      
      {videoUpgradeStatus === "receiving" && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white py-4 px-6 rounded-2xl shadow-xl z-[60] flex items-center gap-4">
          <p>User wants to switch to Video.</p>
          <div className="flex gap-2">
            <button className="btn btn-sm btn-error text-white border-none" onClick={rejectVideoUpgrade}>Decline</button>
            <button className="btn btn-sm btn-success text-white border-none" onClick={acceptVideoUpgrade}>Accept</button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 w-full flex items-center justify-center p-4">
         <div className="relative w-full h-full max-w-5xl max-h-[75vh] bg-black rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center">
            {callType === "audio" ? (
              <div className="flex flex-col items-center z-10 w-full h-full justify-center bg-slate-900">
                 <div className="w-32 h-32 rounded-full overflow-hidden mb-6 border-4 border-slate-700 shadow-xl">
                     <img src={incomingCallData?.profilePic || "/avatar.png"} className="w-full h-full object-cover" alt="caller profile" />
                 </div>
                 <h2 className="text-3xl text-white font-bold tracking-wide">{incomingCallData?.callerName || "User"}</h2>
                 
                 {/* Explicitly Map Status to isolate any bleed-over */}
                 <p className="text-slate-400 mt-3 text-lg font-medium animate-pulse">
                    {callStatus === "calling" && "Ringing..."}
                 </p>
                 <p className="text-emerald-400 mt-3 text-lg font-medium">
                    {callStatus === "active" && "Audio Call Connected"}
                 </p>
                 
                 {/* Critical Fix: Audio tag for audio calls */}
                 {remoteStream && <audio ref={remoteAudioRef} autoPlay />}
              </div>
            ) : remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center z-10 w-full h-full justify-center bg-slate-900">
                 <div className="w-32 h-32 rounded-full overflow-hidden mb-6 border-4 border-slate-700 shadow-xl">
                     <img src={incomingCallData?.profilePic || "/avatar.png"} className="w-full h-full object-cover" alt="caller profile" />
                 </div>
                 <h2 className="text-3xl text-white font-bold tracking-wide">{incomingCallData?.callerName || "User"}</h2>
                 <p className="text-white text-xl animate-pulse mt-4">
                    {callStatus === "calling" ? "Calling..." : "Connecting Peer..."}
                 </p>
              </div>
            )}

            {/* Local Video (Picture in Picture) */}
            {callType === "video" && (
            <div className="absolute top-6 right-6 w-32 h-44 md:w-48 md:h-64 bg-slate-800 rounded-xl overflow-hidden shadow-lg border-2 border-slate-700/50 z-20">
              {localStream ? (
                 <video
                   ref={localVideoRef}
                   autoPlay
                   playsInline
                   muted
                   className={`w-full h-full object-cover ${isVideoOff ? 'opacity-0' : 'opacity-100'}`}
                 />
              ) : null}
              {isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500 bg-slate-800">
                   <VideoOff size={40} />
                </div>
              )}
            </div>
            )}
         </div>
      </div>

      {/* Control Bar (Fixed bottom block ensuring it NEVER gets cut off) */}
      <div className="h-28 w-full flex items-center justify-center pb-6">
        <div className="flex gap-6 px-8 py-5 bg-slate-800/80 rounded-full backdrop-blur-md shadow-2xl border border-slate-700 z-30 relative">
          <button
            onClick={toggleMic}
            className={`btn btn-circle btn-lg ${isMicMuted ? "bg-red-500 hover:bg-red-600 text-white border-none shadow-lg shadow-red-500/20" : "bg-slate-700 hover:bg-slate-600 border-none text-white shadow-xl"}`}
          >
            {isMicMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          <button
            onClick={toggleVideo}
            className={`btn btn-circle btn-lg ${isVideoOff ? "bg-red-500 hover:bg-red-600 text-white border-none shadow-lg shadow-red-500/20" : "bg-slate-700 hover:bg-slate-600 border-none text-white shadow-xl"}`}
          >
            {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
          </button>

          <button
            onClick={endCall}
            className="btn btn-circle btn-lg bg-red-600 hover:bg-red-700 border-none text-white px-8 w-auto rounded-full shadow-lg shadow-red-600/30"
          >
            <PhoneOff size={24} className="mr-2" /> End Call
          </button>
        </div>
      </div>
    </div>
  );
}
