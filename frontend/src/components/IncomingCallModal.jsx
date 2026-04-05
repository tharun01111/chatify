import { useNavigate } from "react-router-dom";
import { useCallStore } from "../store/useCallStore";
import { PhoneOff, Video } from "lucide-react";

export default function IncomingCallModal() {
  const { 
    callStatus, 
    incomingCallData, 
    rejectCall,
    acceptCall 
  } = useCallStore();
  const navigate = useNavigate();

  if (callStatus !== "ringing") return null;

  const handleAccept = () => {
    const callId = incomingCallData.callId;
    acceptCall(); // reset state first → closes modal
    navigate(`/call/${callId}`); // then navigate
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center 
                    bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl 
                      flex flex-col items-center w-80">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary/20 
                          rounded-full animate-ping"></div>
          <img
            src={incomingCallData?.profilePic || "/avatar.png"}
            alt="caller"
            className="w-24 h-24 rounded-full border-4 
                       border-primary relative z-10"
          />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">
          {incomingCallData?.callerName}
        </h2>
        <p className="text-slate-400 mb-8 flex items-center gap-2">
          <Video size={16} />
          Incoming video call...
        </p>

        <div className="flex w-full justify-around">
          <button
            onClick={() => rejectCall("declined")}
            className="btn btn-error btn-circle btn-lg text-white"
          >
            <PhoneOff size={28} />
          </button>
          <button
            onClick={handleAccept}
            className="btn btn-success btn-circle btn-lg text-white"
          >
            <Video size={28} />
          </button>
        </div>
      </div>
    </div>
  );
}
