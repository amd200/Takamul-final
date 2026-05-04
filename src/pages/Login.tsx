import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Moon, Sun, CheckCircle, Eye, EyeOff } from "lucide-react";
import axios from "axios";

import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import Logo from "@/components/Logo";
import { useLogin } from "@/features/auth/hooks/useLogin";
import useToast from "@/hooks/useToast";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
    dir: "rtl",
  },
};

export default function Login() {
  const navigate = useNavigate();
  const { mutateAsync: login } = useLogin();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { notifyError } = useToast();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isDark = theme === "dark";
  const lang: Lang = (language as Lang) in translations ? (language as Lang) : "ar";
  const t = translations[lang];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login({ identifier: username, password });
      navigate("/");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message || err.response?.data?.title || "فشل تسجيل الدخول";
        setError(message);
        notifyError(message);
      } else if (err instanceof Error) {
        setError(err.message);
        notifyError(err.message);
      } else {
        setError("حدث خطأ غير متوقع");
        notifyError("حدث خطأ غير متوقع");
      }
    } finally {
      setLoading(false);
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
        {/* <div className="w-full shrink-0" style={{ maxWidth: 420 }}>
          <div className={`rounded-[2.5rem] px-8 py-10 transition-all duration-300 ${isDark ? "bg-slate-800/92 border border-white/7 shadow-2xl" : "bg-white/95 border border-white shadow-2xl shadow-slate-300/40"}`}>
            <h1 className={`text-3xl font-black text-center mb-1 ${isDark ? "text-slate-100" : "text-slate-800"}`}>{t.title}</h1>
            <p className="text-[10px] font-bold text-center text-slate-400 uppercase tracking-widest mb-8">{t.sub}</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">{t.userPh}</label>
                <Input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required className={`w-full px-5 rounded-2xl text-sm border-2 outline-none transition-all focus:ring-[4px] focus:ring-emerald-500/10 focus:border-emerald-500 font-bold ${isDark ? "bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-600" : "bg-slate-50 border-slate-100 text-slate-800 placeholder-slate-300"}`} style={{ height: 50 }} />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">{t.passPh}</label>
                <Input type="password" placeholder={t.passPh} value={password} onChange={(e) => setPassword(e.target.value)} required className={`w-full px-5 rounded-2xl text-sm border-2 outline-none transition-all focus:ring-[4px] focus:ring-emerald-500/10 focus:border-emerald-500 font-bold ${isDark ? "bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-600" : "bg-slate-50 border-slate-100 text-slate-800 placeholder-slate-300"}`} style={{ height: 50, letterSpacing: "0.2em" }} />
              </div>

              {error && <p className="text-red-500 text-[10px] text-center py-1 font-black animate-pulse">{error}</p>}

              <div className="flex justify-between items-center py-1">
                <label className="flex items-center gap-2 cursor-pointer text-[10px] font-black text-slate-400 uppercase tracking-wide">
                  <input type="checkbox" className="w-4 h-4 accent-emerald-500 rounded" />
                  {t.remember}
                </label>
                <button type="button" onClick={() => navigate("/forgot-password")} className="text-[10px] font-black text-slate-400 hover:text-emerald-500 transition-colors uppercase tracking-wide">
                  {t.forgot}
                </button>
              </div>

              <button type="submit" disabled={loading} className="w-full rounded-2xl text-white text-sm font-black bg-[#00a651] hover:bg-[#009147] active:scale-[0.98] transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed mt-4 group flex items-center justify-center gap-3" style={{ height: 52 }}>
                {loading ? (
                  <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {t.loginBtn}
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1">→</div>
                  </>
                )}
              </button>
            </form>
          </div>
        </div> */}

        <div className="w-full max-w-md p-8 sm:p-10 rounded-xl border transition-colors duration-300 bg-[var(--bg-card)] border-[var(--border)] shadow-xl">
          <div className="flex flex-col items-center mb-8 text-center">
            <h1 className="text-2xl font-bold mt-6">{t.title}</h1>
            <p className="text-sm mt-2 text-[var(--text-muted)]">{t.sub}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input type="text" placeholder={t.userPh} className="w-full p-4 rounded-xl outline-none transition-colors text-sm border focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-[var(--input-bg)] border-[var(--border)] text-[var(--text-main)] placeholder-[var(--text-muted)]" value={username} onChange={(e) => setUsername(e.target.value)} required />

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={t?.passPh}
                className="w-full p-4 rounded-xl outline-none transition-colors text-sm border focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-[var(--input-bg)] border-[var(--border)] text-[var(--text-main)] placeholder-[var(--text-muted)]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors",
                  t.dir === "rtl" ? "left-4" : "right-4"
                )}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {error && <p className="text-sm text-red-500 py-1 text-center">{error}</p>}

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
              {t.loginBtn}
            </button>
          </form>
        </div>

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

      {/* <footer className={`relative z-10 text-center font-black tracking-[0.4em] uppercase py-8 opacity-40 ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontSize: 9 }}>
        © {new Date().getFullYear()} Takamul Data Systems • Excellence & Integration
      </footer> */}
    </div>
  );
}
