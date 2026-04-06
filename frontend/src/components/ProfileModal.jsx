import { useEffect, useRef, useState } from "react";
import { Camera, LogOut, Save, X } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";

function ProfileModal({ onClose }) {
  const { authUser, updateProfile, logout, isUpdatingProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [fullName, setFullName] = useState(authUser?.fullName || "");
  const [bio, setBio] = useState(authUser?.bio || "");
  const fileInputRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    const previousFocusedElement = document.activeElement;
    const modalElement = modalRef.current;

    if (!modalElement) return undefined;

    const getFocusableElements = () =>
      Array.from(
        modalElement.querySelectorAll(
          'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute("disabled"));

    const focusableElements = getFocusableElements();
    focusableElements[0]?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const elements = getFocusableElements();
      if (elements.length === 0) return;

      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusedElement?.focus?.();
    };
  }, [onClose]);

  const handleImageChange = (event) => {
    const file = event.target.files[0];

    if (!file?.type.startsWith("image/")) {
      toast.error("Please select an image");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setSelectedImg(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      const updates = {};

      if (selectedImg) updates.profilePic = selectedImg;
      if (fullName !== authUser?.fullName) updates.fullName = fullName;
      if (bio !== authUser?.bio) updates.bio = bio;

      if (Object.keys(updates).length > 0) {
        await updateProfile(updates);
      }

      onClose();
    } catch (error) {
      console.error("Failed to save profile changes", error);
      toast.error("Failed to save profile changes");
      return;
    }
  };

  const handleBackdrop = (event) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={modalRef}
        className="w-full max-w-sm rounded-2xl overflow-hidden slide-in"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-md)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
        }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-sm font-bold" style={{ color: "var(--fg)", fontFamily: "'Syne',sans-serif" }}>
            Edit Profile
          </h2>
          <button
            onClick={onClose}
            className="size-7 rounded-lg flex items-center justify-center transition-all"
            style={{ color: "var(--fg-subtle)" }}
            aria-label="Close profile modal"
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div
                className="size-20 rounded-full overflow-hidden"
                style={{ border: "3px solid var(--accent-border)", boxShadow: "0 0 20px var(--accent-glow)" }}
              >
                <img src={selectedImg || authUser?.profilePic || "/avatar.png"} alt="Profile" className="size-full object-cover" />
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 size-7 rounded-full flex items-center justify-center"
                style={{ background: "var(--accent)", border: "2px solid var(--bg-card)", color: "#fff" }}
                aria-label="Change profile photo"
              >
                <Camera size={12} />
              </button>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
            </div>
            <p className="text-xs" style={{ color: "var(--fg-subtle)" }}>Click the camera to change your photo.</p>
          </div>

          <div>
            <label htmlFor="profile-full-name" className="auth-input-label">Full Name</label>
            <input
              id="profile-full-name"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="input-plain"
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="profile-email" className="auth-input-label">Email</label>
            <input
              id="profile-email"
              type="email"
              value={authUser?.email || ""}
              readOnly
              className="input-plain"
              style={{ opacity: 0.5, cursor: "not-allowed" }}
            />
          </div>

          <div>
            <label htmlFor="profile-bio" className="auth-input-label">Bio</label>
            <textarea
              id="profile-bio"
              value={bio}
              onChange={(event) => setBio(event.target.value.slice(0, 160))}
              rows={2}
              maxLength={160}
              placeholder="Tell people about yourself..."
              className="input-plain resize-none"
              style={{ lineHeight: 1.5 }}
            />
            <p className="mt-2 text-[11px]" style={{ color: "var(--fg-subtle)" }}>
              {bio.trim().length}/160
            </p>
          </div>

          <div
            className="flex items-center justify-between px-3 py-2.5 rounded-xl"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
          >
            <span className="text-xs" style={{ color: "var(--fg-subtle)" }}>Member since</span>
            <span className="text-xs font-medium" style={{ color: "var(--fg-muted)" }}>
              {authUser?.createdAt
                ? new Date(authUser.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short" })
                : "--"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-5 py-4" style={{ borderTop: "1px solid var(--border)" }}>
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: "rgba(248,113,113,0.1)",
              color: "var(--danger)",
              border: "1px solid rgba(248,113,113,0.2)",
              fontFamily: "'Syne',sans-serif",
            }}
          >
            <LogOut size={13} /> Logout
          </button>
          <button
            onClick={handleSave}
            disabled={isUpdatingProfile}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              background: "var(--accent)",
              color: "#fff",
              fontFamily: "'Syne',sans-serif",
              boxShadow: "0 2px 12px rgba(129,140,248,0.3)",
              opacity: isUpdatingProfile ? 0.6 : 1,
              cursor: isUpdatingProfile ? "not-allowed" : "pointer",
            }}
          >
            {isUpdatingProfile ? <span className="loading loading-spinner loading-xs" /> : <><Save size={13} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileModal;
