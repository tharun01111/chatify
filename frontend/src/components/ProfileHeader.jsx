import { useRef, useState } from "react";
import { Camera, LogOut, Volume2, VolumeX } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

function ProfileHeader() {
  const { logout, authUser, updateProfile, isUpdatingImage } = useAuthStore();
  const { isSoundEnabled, toggleSound } = useChatStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      try {
        await updateProfile({ profilePic: base64Image });
        setSelectedImg(null);
      } catch {
        setSelectedImg(null);
      }
    };
  };

  const iconBtn = ({ onClick, ariaLabel, ariaPressed, children }) => (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className="size-8 rounded-lg flex items-center justify-center transition-all duration-150"
      style={{ color: "var(--fg-subtle)", background: "transparent" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--bg-hover)";
        e.currentTarget.style.color = "var(--fg)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "var(--fg-subtle)";
      }}
    >
      {children}
    </button>
  );

  return (
    <div
      className="px-4 py-3.5 flex items-center justify-between flex-shrink-0"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            className="size-9 rounded-full overflow-hidden relative group focus:outline-none"
            onClick={() => fileInputRef.current.click()}
            disabled={isUpdatingImage}
            aria-label="Upload avatar"
            style={{
              border: "2px solid var(--accent-border)",
              boxShadow: "0 0 10px var(--accent-glow)",
            }}
          >
            <img
              src={selectedImg || authUser?.profilePic || "/avatar.png"}
              alt="me"
              className="size-full object-cover"
            />
            {isUpdatingImage && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <span className="loading loading-spinner loading-xs text-white" />
              </div>
            )}
            {!isUpdatingImage && (
              <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera size={11} className="text-white" />
              </div>
            )}
          </button>
          <span
            className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full online-pulse"
            style={{ background: "var(--online)", border: "2px solid var(--bg-card)" }}
          />
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageUpload}
            className="hidden"
            disabled={isUpdatingImage}
          />
        </div>

        <div>
          <p
            className="text-sm font-semibold leading-tight truncate max-w-[120px]"
            style={{ color: "var(--fg)", fontFamily: "'Syne',sans-serif" }}
          >
            {authUser?.fullName}
          </p>
          <p className="text-[11px] font-medium" style={{ color: "var(--online)" }}>
            Active
          </p>
        </div>
      </div>

      <div className="flex items-center gap-0.5">
        {iconBtn({
          onClick: () => {
            const mouseClickSound = new Audio("/sounds/mouse-click.mp3");
            mouseClickSound.play().catch(() => {});
            toggleSound();
          },
          ariaLabel: isSoundEnabled ? "Mute sounds" : "Enable sounds",
          ariaPressed: isSoundEnabled,
          children: isSoundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />,
        })}
        <button
          onClick={logout}
          aria-label="Logout"
          className="size-8 rounded-lg flex items-center justify-center transition-all duration-150"
          style={{ color: "var(--fg-subtle)", background: "transparent" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(248,113,113,0.12)";
            e.currentTarget.style.color = "var(--danger)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--fg-subtle)";
          }}
        >
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}

export default ProfileHeader;
