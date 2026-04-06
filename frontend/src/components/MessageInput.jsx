import { useRef, useState } from "react";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";
import { Image, X, Send } from "lucide-react";

function MessageInput() {
  const { playRandomKeyStrokeSound } = useKeyboardSound();
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const { sendMessage, isSoundEnabled } = useChatStore();

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    if (isSoundEnabled) playRandomKeyStrokeSound();
    const sentMessage = await sendMessage({ text: text.trim(), image: imagePreview });
    if (!sentMessage) return;
    setText("");
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file?.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const canSend = Boolean(text.trim() || imagePreview);

  return (
    <div
      className="flex-shrink-0"
      style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card)', padding: '12px 24px' }}
    >
      {imagePreview && (
        <div style={{ marginBottom: '10px' }}>
          <div className="relative inline-block">
            <img src={imagePreview} alt="Preview" style={{ height: '64px', width: '64px', objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--border-md)' }} />
            <button
              onClick={() => { setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
              style={{ position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--bg-secondary)', border: '1px solid var(--border-md)', color: 'var(--fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={10} />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          type="text"
          value={text}
          onChange={e => { setText(e.target.value); if (isSoundEnabled) playRandomKeyStrokeSound(); }}
          placeholder="Type a message..."
          style={{
            flex: 1,
            borderRadius: '12px',
            padding: '10px 16px',
            fontSize: '14px',
            background: 'var(--bg-hover)',
            border: '1px solid var(--border)',
            color: 'var(--fg)',
            outline: 'none',
            fontFamily: "'DM Sans',sans-serif",
            transition: 'all 0.15s',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }}
          onBlur={e  => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
        />

        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />

        <button type="button" onClick={() => fileInputRef.current?.click()}
          style={{
            width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: imagePreview ? 'rgba(129,140,248,0.15)' : 'var(--bg-hover)',
            color: imagePreview ? 'var(--accent)' : 'var(--fg-subtle)',
            border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-active)'; e.currentTarget.style.color = 'var(--fg)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = imagePreview ? 'rgba(129,140,248,0.15)' : 'var(--bg-hover)'; e.currentTarget.style.color = imagePreview ? 'var(--accent)' : 'var(--fg-subtle)'; }}
        >
          <Image size={16} />
        </button>

        <button type="submit" disabled={!canSend}
          style={{
            width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: canSend ? 'var(--accent)' : 'var(--bg-hover)',
            color: canSend ? '#fff' : 'var(--fg-subtle)',
            border: '1px solid transparent',
            boxShadow: canSend ? '0 2px 12px rgba(129,140,248,0.3)' : 'none',
            opacity: canSend ? 1 : 0.5,
            cursor: canSend ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s',
          }}
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}

export default MessageInput;
