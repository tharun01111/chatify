import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import IncomingCallModal from "./components/IncomingCallModal";
import PageLoader from "./components/PageLoader";
import { useAuthStore } from "./store/useAuthStore";
import { Toaster } from "react-hot-toast";

const ChatPage = lazy(() => import("./pages/ChatPage"));
const CallPage = lazy(() => import("./pages/CallPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));

function App() {
  const { checkAuth, isCheckingAuth, authUser } = useAuthStore();
  useEffect(() => { checkAuth(); }, [checkAuth]);
  if (isCheckingAuth) return <PageLoader />;

  return (
    <div className="w-screen h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={authUser ? <ChatPage /> : <Navigate to="/login" />} />
          <Route path="/call/:callId" element={authUser ? <CallPage /> : <Navigate to="/login" />} />
          <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        </Routes>
      </Suspense>

      {authUser && <IncomingCallModal />}

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--bg-secondary)',
            color: 'var(--fg)',
            border: '1px solid var(--border-md)',
            borderRadius: '12px',
            fontSize: '13px',
            fontFamily: "'DM Sans', sans-serif",
          },
        }}
      />
    </div>
  );
}

export default App;
