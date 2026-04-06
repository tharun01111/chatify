import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Lock, Mail, MessageCircle } from "lucide-react";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import { useAuthStore } from "../store/useAuthStore";

function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const { login, isLoggingIn } = useAuthStore();

  const handleSubmit = (event) => {
    event.preventDefault();
    login(formData);
  };

  return (
    <div className="w-full flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
      <div className="relative w-full max-w-4xl">
        <BorderAnimatedContainer>
          <div className="w-full flex flex-col md:flex-row">
            <div className="md:w-1/2 p-8 flex items-center justify-center" style={{ borderRight: "1px solid var(--border)" }}>
              <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                  <div
                    className="size-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: "rgba(129,140,248,0.12)", border: "1px solid var(--accent-border)" }}
                  >
                    <MessageCircle size={22} style={{ color: "var(--accent)" }} />
                  </div>
                  <h2 className="text-xl font-bold mb-1" style={{ color: "var(--fg)", fontFamily: "'Syne',sans-serif" }}>
                    Welcome back
                  </h2>
                  <p className="text-sm" style={{ color: "var(--fg-subtle)" }}>Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="login-email" className="auth-input-label">Email</label>
                    <div className="relative">
                      <Mail className="auth-input-icon" />
                      <input
                        id="login-email"
                        type="email"
                        value={formData.email}
                        onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                        className="input"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="login-password" className="auth-input-label">Password</label>
                    <div className="relative">
                      <Lock className="auth-input-icon" />
                      <input
                        id="login-password"
                        type="password"
                        value={formData.password}
                        onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                        className="input"
                        placeholder="Enter your password"
                      />
                    </div>
                  </div>

                  <button type="submit" className="auth-btn" disabled={isLoggingIn}>
                    {isLoggingIn ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Sign In"}
                  </button>
                </form>

                <p className="mt-5 text-center text-sm" style={{ color: "var(--fg-subtle)" }}>
                  No account? <Link to="/signup" className="auth-link">Create one</Link>
                </p>
              </div>
            </div>

            <div className="hidden md:flex md:w-1/2 items-center justify-center p-8" style={{ background: "var(--bg)" }}>
              <div className="text-center">
                <img src="/login.png" alt="Login illustration" className="w-full max-w-xs mx-auto object-contain mb-6" />
                <h3 className="text-base font-bold mb-3" style={{ color: "var(--fg)", fontFamily: "'Syne',sans-serif" }}>
                  Connect Anytime, Anywhere
                </h3>
                <div className="flex justify-center gap-2 flex-wrap">
                  <span className="auth-badge">Realtime</span>
                  <span className="auth-badge">Easy Setup</span>
                  <span className="auth-badge">Private</span>
                </div>
              </div>
            </div>
          </div>
        </BorderAnimatedContainer>
      </div>
    </div>
  );
}

export default LoginPage;
