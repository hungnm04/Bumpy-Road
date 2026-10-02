import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { LuCheckCircle, LuLoader, LuXCircle } from "react-icons/lu";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token. Check the link in your email.");
      return;
    }

    fetch(`/verify-email?token=${encodeURIComponent(token)}`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          setMessage("Email verified. You're all set.");
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed. The link may have expired.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Network error. Please try again.");
      });
  }, [searchParams]);

  return (
    <>
      <Navbar />
      <main className="verify-page">
        <motion.div
          className="verify-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {status === "loading" && (
            <>
              <motion.div
                className="verify-icon loading"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              >
                <LuLoader size={52} />
              </motion.div>
              <h2>Verifying your email…</h2>
              <p>Just a moment while we confirm your address.</p>
            </>
          )}

          {status === "success" && (
            <>
              <motion.div
                className="verify-icon success"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
              >
                <LuCheckCircle size={52} />
              </motion.div>
              <h2>Email verified</h2>
              <p>{message}</p>
              <motion.button
                className="verify-cta"
                onClick={() => navigate("/login")}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Sign in
              </motion.button>
            </>
          )}

          {status === "error" && (
            <>
              <motion.div
                className="verify-icon error"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
              >
                <LuXCircle size={52} />
              </motion.div>
              <h2>Verification failed</h2>
              <p>{message}</p>
              <motion.button
                className="verify-cta secondary"
                onClick={() => navigate("/login")}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Back to sign in
              </motion.button>
            </>
          )}
        </motion.div>
      </main>
      <Footer />

      <style>{`
        .verify-page {
          min-height: 70vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
        .verify-card {
          background: var(--color-cream, #fff8ec);
          border: 1px solid var(--color-line, rgba(49,95,69,0.2));
          border-radius: 12px;
          padding: 3rem 2.5rem;
          max-width: 400px;
          width: 100%;
          text-align: center;
          box-shadow: 0 8px 32px rgba(39,31,20,0.08);
        }
        .verify-icon {
          margin: 0 auto 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .verify-icon.loading { color: rgba(79,74,66,0.5); }
        .verify-icon.success { color: #2e7d4f; }
        .verify-icon.error { color: #9c241d; }
        .verify-card h2 { margin: 0 0 0.75rem; color: var(--color-ink); }
        .verify-card p { margin: 0 0 1.5rem; color: rgba(79,74,66,0.75); line-height: 1.6; }
        .verify-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0.7rem 1.8rem;
          border: none;
          border-radius: 6px;
          background: var(--color-forest, #315f45);
          color: #fff8ec;
          font-size: 0.95rem;
          font-weight: 900;
          cursor: pointer;
        }
        .verify-cta.secondary {
          background: transparent;
          color: var(--color-forest);
          border: 2px solid var(--color-forest);
        }
      `}</style>
    </>
  );
}
