import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Lock, Mail, MessageCircle, User } from "lucide-react";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import { useAuthStore } from "../store/useAuthStore";

function SignUpPage() {
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "" });
  const { signup, isSigningUp } = useAuthStore();

  const handleSubmit = (event) => {
    event.preventDefault();
    signup(formData);
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
                    Create account
                  </h2>
                  <p className="text-sm" style={{ color: "var(--fg-subtle)" }}>Join and start chatting today</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="signup-full-name" className="auth-input-label">Full Name</label>
                    <div className="relative">
                      <User className="auth-input-icon" />
                      <input
                        id="signup-full-name"
                        type="text"
                        value={formData.fullName}
                        onChange={(event) => setFormData({ ...formData, fullName: event.target.value })}
                        className="input"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="signup-email" className="auth-input-label">Email</label>
                    <div className="relative">
                      <Mail className="auth-input-icon" />
                      <input
                        id="signup-email"
                        type="email"
                        value={formData.email}
                        onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                        className="input"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="signup-password" className="auth-input-label">Password</label>
                    <div className="relative">
                      <Lock className="auth-input-icon" />
                      <input
                        id="signup-password"
                        type="password"
                        value={formData.password}
                        onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                        className="input"
                        placeholder="Min. 6 characters"
                      />
                    </div>
                  </div>

                  <button type="submit" className="auth-btn" disabled={isSigningUp}>
                    {isSigningUp ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Create Account"}
                  </button>
                </form>

                <p className="mt-5 text-center text-sm" style={{ color: "var(--fg-subtle)" }}>
                  Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
                </p>
              </div>
            </div>

            <div className="hidden md:flex md:w-1/2 items-center justify-center p-8" style={{ background: "var(--bg)" }}>
              <div className="text-center">
                <img src="/signup.png" alt="Sign up illustration" className="w-full max-w-xs mx-auto object-contain mb-6" />
                <h3 className="text-base font-bold mb-3" style={{ color: "var(--fg)", fontFamily: "'Syne',sans-serif" }}>
                  Start Your Journey Today
                </h3>
                <div className="flex justify-center gap-2 flex-wrap">
                  <span className="auth-badge">Secure</span>
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

export default SignUpPage;
