import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Moon, Sun, Eye, EyeOff } from "lucide-react";
import axios from "axios";

import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useLogin } from "@/features/auth/hooks/useLogin";
import useToast from "@/hooks/useToast";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { apiClient } from "@/api/client";
import { httpClient } from "@/api/httpClient";
import { ApiError } from "@/lib/ApiError";
import { getDeviceId } from "@/utils/deviceId";

type Lang = "ar" | "en" | "ur";

const translations: Record<
  Lang,
  {
    title: string;
    sub: string;
    userPh: string;
    passPh: string;
    remember: string;
    forgot: string;
    loginBtn: string;
    certBy: string;
    zatcaName: string;
    ph1: string;
    ph2: string;
    download: string;
    logoutAll: string;
    dir: "rtl" | "ltr";
  }
> = {
  ar: {
    title: "تسجيل الدخول",
    sub: "مرحباً بك، سجل الدخول للمتابعة",
    userPh: "اسم المستخدم",
    passPh: "كلمة المرور",
    remember: "تذكرني",
    forgot: "نسيت كلمة المرور؟",
    loginBtn: "دخول",
    certBy: "معتمد من",
    zatcaName: "هيئة الزكاة والضريبة والجمارك",
    ph1: "المرحلة الأولى",
    ph2: "المرحلة الثانية",
    download: "حمّل التطبيق الآن",
    logoutAll: "هل ترغب في تسجيل الخروج من باقي الاجهزة",
    dir: "rtl",
  },
  en: {
    title: "Sign In",
    sub: "Welcome back! Please sign in to continue.",
    userPh: "Username",
    passPh: "Password",
    remember: "Remember me",
    forgot: "Forgot password?",
    loginBtn: "Login",
    certBy: "Certified By",
    zatcaName: "Zakat, Tax and Customs Authority",
    ph1: "Phase 1",
    ph2: "Phase 2",
    download: "Download Now",
    logoutAll: "Sign out from all devices",
    dir: "ltr",
  },
  ur: {
    title: "سائن ان",
    sub: "خوش آمدید، جاری رکھنے کے لیے لاگ ان کریں",
    userPh: "صارف نام",
    passPh: "پاس ورڈ",
    remember: "مجھے یاد رکھیں",
    forgot: "پاس ورڈ بھول گئے؟",
    loginBtn: "داخل ہوں",
    certBy: "سند یافتہ",
    zatcaName: "زکوٰۃ، ٹیکس اور کسٹمز اتھارٹی",
    ph1: "مرحلہ اول",
    ph2: "مرحلہ دوم",
    download: "ابھی ڈاؤن لوڈ کریں",
    logoutAll: "تمام آلات سے لاگ آؤٹ کریں",
    dir: "rtl",
  },
};

export default function Login() {
  const navigate = useNavigate();
  const { mutateAsync: login } = useLogin();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { notifyError, notifySuccess } = useToast();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDeviceConflict, setIsDeviceConflict] = useState(false);

  const isDark = theme === "dark";
  const lang: Lang = (language as Lang) in translations ? (language as Lang) : "ar";
  const t = translations[lang];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setIsDeviceConflict(false);
    try {
      await login({ identifier: username, password, deviceIdentifier: getDeviceId() });
      navigate("/");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.status === 409 && err.code === "DEVICE_CONFLICT") {
          setIsDeviceConflict(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    setLogoutAllLoading(true);
    try {
      await httpClient("/Auth/logout-all", {
        data: username,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      setIsDeviceConflict(false);
      setError("");
      // notifySuccess("تم تسجيل الخروج من جميع الأجهزة، أعد تسجيل الدخول");
    } catch {
      // notifyError("فشل تسجيل الخروج من الأجهزة");
    } finally {
      setLogoutAllLoading(false);
    }
  };

  return (
    <div
      dir={t.dir}
      className="h-screen w-screen flex flex-col relative overflow-hidden transition-colors duration-300"
      style={{
        backgroundImage: `url('https://static.portal.daftra.com/images/back-sign-in-texture.svg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: isDark ? "#0f172a" : "#dde4ee",
      }}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 transition-all duration-300"
        style={{
          background: isDark ? "rgba(10,15,35,0.78)" : "rgba(220,228,240,0.42)",
        }}
      />

      {/* ── NAV ── */}
      <nav className="relative z-20 flex items-center justify-between px-10 py-5">
        {/* Lang switcher */}
        <div className={`flex items-center gap-3 text-sm font-bold rounded-full px-5 py-2 border ${isDark ? "bg-white/5 border-white/10 text-slate-400" : "bg-white/70 border-black/10 text-slate-500"}`}>
          {(["ar", "en", "ur"] as Lang[]).map((l, i) => (
            <React.Fragment key={l}>
              {i > 0 && <span className="opacity-40">|</span>}
              <button onClick={() => setLanguage(l)} className={`transition-colors font-bold ${lang === l ? "text-emerald-500" : "hover:text-emerald-500"}`}>
                {l === "ar" ? "عربي" : l === "en" ? "English" : "اردو"}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Theme toggle */}
        <button onClick={() => setTheme(isDark ? "light" : "dark")} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all hover:bg-emerald-500/10 hover:text-emerald-500 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          {isDark ? <Sun size={24} /> : <Moon size={24} />}
        </button>
      </nav>

      {/* ── MAIN ── */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row rtl:lg:flex-row-reverse items-center justify-center gap-10 lg:gap-20 px-10 py-4 max-w-7xl mx-auto w-full overflow-hidden">
        {/* ══ LOGIN CARD ══ */}
        <div className="w-full max-w-md p-8 sm:p-10 rounded-xl border transition-colors duration-300 bg-[var(--bg-card)] border-[var(--border)] shadow-xl">
          <div className="flex flex-col items-center mb-8 text-center">
            <h1 className="text-2xl font-bold mt-6">{t.title}</h1>
            <p className="text-sm mt-2 text-[var(--text-muted)]">{t.sub}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="text"
              placeholder={t.userPh}
              className="w-full p-4 rounded-xl outline-none transition-colors text-sm border focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-[var(--input-bg)] border-[var(--border)] text-[var(--text-main)] placeholder-[var(--text-muted)]"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setIsDeviceConflict(false);
                setError("");
              }}
              required
            />

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={t.passPh}
                className="w-full p-4 rounded-xl outline-none transition-colors text-sm border focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-[var(--input-bg)] border-[var(--border)] text-[var(--text-main)] placeholder-[var(--text-muted)]"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setIsDeviceConflict(false);
                  setError("");
                }}
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className={cn("absolute top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors", t.dir === "rtl" ? "left-4" : "right-4")}>
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {error && <p className="text-sm text-red-500 py-1 text-center">{error}</p>}

            {isDeviceConflict && (
              <button type="button" onClick={handleLogoutAllDevices} disabled={logoutAllLoading} className="w-full text-xs font-medium text-[#4b5563] dark:text-white cursor-pointer hover:text-red-600 underline underline-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {logoutAllLoading ? <span className="inline-block w-4 h-4 border-2 border-red-400/30 border-t-red-500 rounded-full animate-spin" /> : t.logoutAll}
              </button>
            )}

            <div className="flex justify-between items-center text-sm py-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Input type="checkbox" className="w-4 h-4 accent-[var(--primary)] rounded border-[var(--border)]" />
                <span className="text-[var(--text-muted)]">{t.remember}</span>
              </label>

              <button type="button" onClick={() => navigate("/forgot-password")} className="font-medium text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">
                {t.forgot}
              </button>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 mt-4 text-white text-base font-bold rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t.loginBtn}
            </button>
          </form>
        </div>

        {/* ══ BRANDING SIDE ══ */}
        <div className="hidden lg:flex flex-col items-center justify-center gap-4 mb-12 flex-1 shrink-0">
          <img src={`/logo_${lang === "ar" ? "ar" : "en"}_${isDark ? "dark" : "light"}.png`} alt="Takamul logo" className="object-contain drop-shadow-2xl transition-all duration-500 ms-12 mb-8" style={{ height: 170, width: "auto", maxWidth: "100%" }} />
          <img src={isDark ? "/zakat_en_dark.png" : "/zakat_en_light.png"} alt="هيئة الزكاة والضريبة والجمارك" className="object-contain drop-shadow-xl transition-all duration-500" style={{ height: 90, width: "auto", maxWidth: "100%" }} />
          <div className="flex flex-col items-center gap-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.download}</p>
            <div className="flex flex-wrap gap-3 justify-center items-center">
              <a href="#" className="hover:scale-105 transition-transform">
                <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" className="rounded shadow-lg" style={{ height: 40, width: "auto" }} />
              </a>
              <a href="#" className="hover:scale-105 transition-transform">
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" className="rounded shadow-lg" style={{ height: 40, width: "auto" }} />
              </a>
              <a href="#" className="flex items-center gap-2.5 bg-black text-white px-4 py-1 rounded-[6px] border border-white/5 hover:bg-neutral-900 transition-all shadow-lg hover:scale-105 group" style={{ height: 40 }}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Windows" className="w-4 h-4" />
                <div className="flex flex-col text-left leading-none">
                  <span className="text-[7px] font-medium opacity-60 uppercase tracking-tighter">Download for</span>
                  <span className="text-[14px] font-semibold tracking-tight">Windows</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
