import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import Logo from "@/components/Logo";

import { localizeAuthError, AUTH_API_BASE } from "@/lib/utils";

import { Input } from "@/components/ui/input";

const AUTH_API = `${AUTH_API_BASE}/Auth`;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { t, direction } = useLanguage();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const value = email.trim();
      const res = await fetch(`${AUTH_API}/forget-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      });
      const text = await res.text();
      const data = text
        ? (() => {
            try {
              return JSON.parse(text);
            } catch {
              return {};
            }
          })()
        : {};
      if (!res.ok) {
        const rawMsg = typeof data?.message === "string" ? data.message : typeof data?.error === "string" ? data.error : (data?.title ?? text) || "";
        const errorsDetail = data?.errors && typeof data.errors === "object" ? Object.values(data.errors).flat().filter(Boolean).join(" ") : Array.isArray(data?.errors) ? data.errors.join(" ") : "";
        const toShow = (rawMsg + (errorsDetail ? " " + errorsDetail : "")).trim();
        setError(localizeAuthError(toShow || rawMsg, t, "forgot_password_error"));
        setLoading(false);
        return;
      }
      setIsSubmitted(true);
    } catch {
      setError(t("login_network_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4" dir={direction}>
      <Logo className="mb-8" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden relative p-8 md:p-10">
        <button onClick={() => navigate("/")} className={`absolute top-6 text-gray-400 hover:text-gray-600 transition-colors ${direction === "rtl" ? "right-6" : "left-6"}`}>
          <ArrowRight size={24} className={direction === "rtl" ? "" : "rotate-180"} />
        </button>

        <h1 className="text-2xl font-bold text-[#1e3a8a] text-center mb-4">{t("password_recovery")}</h1>

        {!isSubmitted ? (
          <>
            <p className="text-gray-500 text-center mb-8 text-sm">{t("password_recovery_desc")}</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg" role="alert">
                  {error}
                </p>
              )}
              <div className="relative">
                <div className={`absolute top-0 h-full w-12 flex items-center justify-center border-gray-300 text-gray-500 ${direction === "rtl" ? "right-0 border-l" : "left-0 border-r"}`}>
                  <Mail size={20} />
                </div>
                <Input type="text" placeholder={t("email_username")} className={`w-full h-12 border border-gray-300 rounded-lg outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all ${direction === "rtl" ? "pr-14 pl-4 text-right" : "pl-14 pr-4 text-left"}`} value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <button type="submit" disabled={loading} className="w-full h-12 bg-[#054C28] text-white font-bold rounded-lg shadow-md hover:bg-[#043b1f] transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
                {loading ? (direction === "rtl" ? "جاري الإرسال..." : "Sending...") : t("send_recovery_link")}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">{t("sent_successfully")}</h3>
            <p className="text-gray-500 text-sm mb-6">{t("recovery_email_sent_desc")}</p>
            <button type="button" onClick={() => navigate("/verify-otp", { state: { email: email.trim() } })} className="w-full h-12 bg-[#054C28] text-white font-bold rounded-lg shadow-md hover:bg-[#043b1f] transition-colors mb-3">
              {t("enter_otp")}
            </button>
            <button type="button" onClick={() => navigate("/")} className="text-[#1e3a8a] font-medium hover:underline">
              {t("back_to_login")}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
