"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard,
  Users,
  Wallet,
  UserRoundSearch,
  Landmark,
  FolderKanban,
  Package,
  ShoppingBag,
  Contact,
  Files,
  Megaphone,
  ChartNoAxesCombined,
  Settings,
  Search,
  Bell,
  ChevronDown,
  ChevronRight,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Check,
  ArrowRight,
  SlidersHorizontal,
  Download,
  X,
  Menu,
  LogOut,
  Globe,
  Building2,
  Clock,
  CheckCheck,
  TrendingUp,
  ArrowLeft,
  ShieldCheck,
  Eye,
  Trash2,
  Pencil,
  RefreshCw,
  Grip,
  CalendarDays,
  FileText,
  Copy,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { entities, modules, label, roleModules, Field } from "./schema";
type Row = Record<string, any>;
const icons = [
  LayoutDashboard,
  Users,
  Wallet,
  UserRoundSearch,
  Landmark,
  FolderKanban,
  Package,
  ShoppingBag,
  Contact,
  Files,
  Megaphone,
  ChartNoAxesCombined,
  Settings,
];
const statusAr: Record<string, string> = {
  Active: "شغال",
  Inactive: "غير نشط",
  "On leave": "في إجازة",
  Draft: "مسودة",
  Published: "منشور",
  Archived: "مؤرشف",
  Expired: "انتهى",
  Present: "حاضر",
  Absent: "غايب",
  Late: "متأخر",
  Remote: "من البيت",
  Pending: "مستني الموافقة",
  Approved: "اتوافق عليه",
  Rejected: "مرفوض",
  Processed: "اتحسب",
  Paid: "مدفوع",
  Open: "مفتوح",
  Closed: "مقفول",
  Applied: "متقدم",
  Screening: "فرز مبدئي",
  Interview: "إنترفيو",
  Offer: "عرض شغل",
  Hired: "اتعين",
  Scheduled: "متحدد",
  Completed: "خلص",
  Cancelled: "ملغي",
  Issued: "اتصدر",
  Overdue: "متأخر",
  Planning: "تخطيط",
  "On hold": "متوقف مؤقتا",
  Planned: "مخطط",
  "In progress": "شغالين عليه",
  "To do": "لسه مبدأش",
  "In review": "بيتراجع",
  Done: "خلص",
  "In service": "قيد الاستخدام",
  Maintenance: "صيانة",
  Retired: "خارج الخدمة",
  Ordered: "اتطلب",
  Received: "اتستلم",
  New: "جديد",
  Qualified: "مؤهل",
  Proposal: "عرض سعر",
  Negotiation: "تفاوض",
  Won: "كسبناها",
  Lost: "خسرناها",
  High: "عالية",
  Medium: "متوسطة",
  Low: "قليلة",
  Urgent: "عاجلة",
  Normal: "عادي",
  Important: "مهم",
  Income: "دخل",
  Expense: "مصروف",
  Receivable: "لينا",
  Payable: "علينا",
  "Full-time": "دوام كامل",
  "Part-time": "جزئي",
  Contract: "بعقد",
  Annual: "سنوية",
  Sick: "مرضي",
  Unpaid: "من غير مرتب",
  Other: "تاني",
  "All members": "كل الأعضاء",
  "HR only": "الموارد البشرية بس",
  "Finance only": "الحسابات بس",
  Administrators: "الإدارة",
  Company: "الشركة",
  Policy: "سياسة",
  Employee: "موظف",
  In: "وارد",
  Out: "صادر",
  Call: "مكالمة",
  Email: "إيميل",
  Meeting: "اجتماع",
  Message: "رسالة",
};
async function api(path: string, options: RequestInit = {}) {
  const r = await fetch("/api" + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const d: any = await r.json();
  if (!r.ok)
    throw Object.assign(new Error(d.error || "Request failed"), {
      status: r.status,
    });
  return d;
}
const request = (method: string, data?: any): RequestInit => ({
  method,
  body: data ? JSON.stringify(data) : undefined,
});
const initials = (s: string) =>
  s
    ?.split(" ")
    .slice(0, 2)
    .map((v) => v[0])
    .join("")
    .toUpperCase() || "WS";
const btn =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const primary = btn + " bg-[#244c42] text-white hover:bg-[#16392f]";
const secondary =
  btn + " border border-slate-200 bg-white text-slate-600 hover:bg-slate-50";
const input =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";
export default function App() {
  const [lang, setLanguage] = useState(
      typeof window !== "undefined"
        ? localStorage.getItem("erp-language") ||
            (navigator.language.toLowerCase().startsWith("ar") ? "ar" : "en")
        : "en",
    ),
    [me, setMe] = useState<Row | null>(null),
    [loading, setLoading] = useState(true),
    [module, setModule] = useState("dashboard"),
    [entity, setEntity] = useState("employees"),
    [mobile, setMobile] = useState(false),
    [toast, setToast] = useState(""),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0),
    [search, setSearch] = useState(""),
    [notification, setNotification] = useState(false),
    [profile, setProfile] = useState(false);
  const setLang = (value: string) => {
    localStorage.setItem("erp-language", value);
    setLanguage(value);
  };
  useEffect(() => {
    if (!localStorage.getItem("erp-language"))
      api("/public-config")
        .then((d) => {
          if (!localStorage.getItem("erp-language"))
            setLanguage(d.suggestedLanguage);
        })
        .catch(() => {});
  }, []);
  const t = (en: string, ar: string) => (lang === "ar" ? ar : en);
  const state = (s: string) => (lang === "ar" ? statusAr[s] || s : s);
  const money = (v: number) =>
    new Intl.NumberFormat(lang === "ar" ? "en-EG" : "en-US", {
      style: "currency",
      currency: me?.currency || "EGP",
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(v || 0);
  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };
  const loadMe = () =>
    api("/me")
      .then(setMe)
      .catch(() => setMe(null))
      .finally(() => setLoading(false));
  useEffect(() => {
    loadMe();
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);
  useEffect(() => {
    if (me && !me.modules.includes(module)) setModule("dashboard");
  }, [me]);
  const navigate = (m: string, e?: string) => {
    setModule(m);
    setEntity(
      e ||
        (
          {
            hr: "employees",
            inventory: "products",
            procurement: "requests",
          } as Record<string, string>
        )[m] ||
        Object.keys(entities).find((k) => entities[k].module === m) ||
        "employees",
    );
    setSearch("");
    setError("");
    setMobile(false);
  };
  const refresh = () => {
    setRevision((v) => v + 1);
  };
  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-[#f5f7f6] text-ink">
        <RefreshCw className="animate-spin" />
      </div>
    );
  if (!me) return <Auth lang={lang} setLang={setLang} done={loadMe} />;
  const Ctx = {
    lang,
    t,
    state,
    money,
    me,
    notify,
    refresh,
    revision,
    navigate,
  };
  return (
    <div className="min-h-screen bg-[#f5f7f8] text-[#21322f] rtl:font-arabic rtl:[&_h1]:leading-relaxed rtl:[&_h2]:leading-relaxed rtl:[&_td]:leading-6 rtl:[&_label]:leading-6 rtl:[&_nav_button]:leading-6">
      {mobile && (
        <div
          onClick={() => setMobile(false)}
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
        />
      )}
      <aside
        className={`${mobile ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"} fixed inset-y-0 start-0 z-40 flex w-[240px] flex-col border-e border-[#e5eae7] bg-white transition-transform lg:translate-x-0 lg:rtl:translate-x-0 print:hidden`}
      >
        <div className="flex h-[86px] items-center gap-3 px-7">
          <div className="grid h-10 w-10 grid-cols-2 gap-1 rounded-xl bg-[#244c42] p-2.5">
            <i className="rounded-sm bg-[#e4efc5]" />
            <i className="rounded-sm bg-[#a9c8b7]" />
            <i className="rounded-sm bg-[#a9c8b7]" />
            <i className="rounded-sm bg-[#e4efc5]" />
          </div>
          <div className="font-display text-xl font-extrabold tracking-tight">
            Sherkty
            <span className="ms-1.5 text-[10px] font-semibold tracking-[.16em] text-[#8b9c92]">
              ERP
            </span>
          </div>
        </div>
        <div className="mx-4 mb-5 rounded-xl border border-[#e6ebe7] bg-[#fafbf9] p-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e5eadc] text-xs font-bold text-[#526242]">
              {initials(me.company)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold">{me.company}</p>
              <p className="mt-0.5 text-[10px] text-slate-500">
                {t("Company workspace", "مساحة الشركة")}
              </p>
            </div>
            <Building2 size={14} className="text-slate-500" />
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {["WORKSPACE", "OPERATIONS", "ORGANIZATION"].map((group) => (
            <div key={group} className="mb-5">
              <p className="mb-2 px-4 text-[10px] font-bold tracking-[.18em] text-[#9aaba3]">
                {t(
                  group,
                  group === "WORKSPACE"
                    ? "مساحة الشغل"
                    : group === "OPERATIONS"
                      ? "العمليات"
                      : "الشركة",
                )}
              </p>
              {modules.map((m, i) => {
                const Icon = icons[i];
                return m.group === group && me.modules.includes(m.id) ? (
                  <button
                    key={m.id}
                    onClick={() => navigate(m.id)}
                    className={`mb-0.5 flex w-full items-center gap-3 rounded-lg px-4 py-[9px] text-start text-[12px] font-medium transition-colors ${module === m.id ? "bg-[#eaf1eb] text-[#2e5141]" : "text-[#748278] hover:bg-slate-50"}`}
                  >
                    <Icon size={16} strokeWidth={1.7} />
                    <span className="flex-1">{label(m, lang)}</span>
                    {module === m.id && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#517b55]" />
                    )}
                  </button>
                ) : null;
              })}
            </div>
          ))}
        </nav>
        <div className="border-t border-[#edf0ed] p-4">
          <button
            onClick={() => {
              navigate("admin");
              setProfile(false);
            }}
            className="flex w-full items-center gap-3 rounded-xl text-start"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e6ebe6] text-xs font-bold">
              {initials(me.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-bold">
                {me.name}
              </span>
              <span className="mt-0.5 block text-[10px] capitalize text-slate-500">
                {me.role}
              </span>
            </span>
            <Settings size={15} className="text-slate-500" />
          </button>
        </div>
      </aside>
      <div className="lg:ms-[240px] print:ms-0">
        <header className="sticky top-0 z-20 flex h-[78px] items-center justify-between gap-3 border-b border-[#e5eae7] bg-white/95 px-5 backdrop-blur-sm md:px-9 print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobile(!mobile)}
              aria-label="Menu"
              className="lg:hidden"
            >
              <Menu size={20} />
            </button>
            <span className="hidden text-xs text-slate-500 sm:inline">
              {t("Workspace", "مساحة الشغل")}
            </span>
            <ChevronRight
              size={13}
              className="hidden text-slate-300 sm:block"
            />
            <span className="text-xs font-semibold">
              {label(
                modules.find((m) => m.id === module)!,
                lang,
              )}
            </span>
          </div>
          <div className="flex items-center gap-3 md:gap-5">
            <div className="relative hidden md:block">
              <Search
                size={15}
                className="absolute start-3 top-3 text-slate-500"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t(
                  "Search your workspace...",
                  "دور في مساحة الشغل...",
                )}
                className="w-56 rounded-lg bg-[#f5f7f6] py-2.5 pe-3 ps-9 text-xs outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <button
              aria-label="Switch language"
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="flex items-center gap-1.5 text-xs text-slate-500"
            >
              <Globe size={16} />
              {lang === "en" ? "عربي" : "EN"}
            </button>
            <button
              aria-label="Notifications"
              onClick={() => {
                setNotification(!notification);
                setProfile(false);
              }}
              className="relative text-slate-500"
            >
              <Bell size={18} />
              <span className="absolute end-0 top-0 h-1.5 w-1.5 rounded-full bg-amber-500 ring-2 ring-white" />
            </button>
            <span className="hidden h-6 w-px bg-slate-200 sm:block" />
            <button
              aria-label="Profile"
              onClick={() => {
                setProfile(!profile);
                setNotification(false);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e1e9de] text-xs font-bold"
            >
              {initials(me.name)}
            </button>
          </div>
          {profile && (
            <div className="absolute end-6 top-[68px] w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
              <p className="mb-2 truncate px-2 text-xs text-slate-500">
                {me.email}
              </p>
              {me.workspaces.map((w: Row) => (
                <button
                  key={w.id}
                  onClick={async () => {
                    try {
                      await api(
                        "/workspaces/switch",
                        request("POST", { id: w.id }),
                      );
                      await loadMe();
                      refresh();
                      setProfile(false);
                    } catch (e: any) {
                      setError(e.message);
                    }
                  }}
                  className="flex w-full items-center justify-between rounded-lg p-2 text-start text-xs hover:bg-slate-50"
                >
                  {w.name}
                  {w.id === me.tenant_id && <Check size={13} />}
                </button>
              ))}
              <button
                onClick={() => {
                  navigate("admin");
                  setProfile(false);
                }}
                className="mt-2 flex w-full items-center gap-2 border-t border-slate-100 p-2 text-xs"
              >
                <Settings size={14} />
                {t("Workspace settings", "إعدادات مساحة الشغل")}
              </button>
              <button
                onClick={async () => {
                  await api("/auth/logout", request("POST"));
                  setMe(null);
                }}
                className="flex w-full items-center gap-2 p-2 text-xs text-rose-600"
              >
                <LogOut size={14} />
                {t("Sign out", "اخرج")}
              </button>
            </div>
          )}
        </header>
        {me.expires_at && (
          <div className="flex items-center justify-between gap-3 border-b border-[#e0e7ce] bg-[#f1f5e8] px-5 py-2 text-xs text-[#66724d] md:px-9">
            <span>
              {t(
                "Demo workspace · Fictional data · Resets after 24 hours",
                "مساحة تجريبية · بيانات خيالية · بتنتهي بعد 24 ساعة",
              )}
            </span>
            <button
              onClick={async () => {
                await api("/auth/logout", request("POST"));
                setMe(null);
              }}
              className="shrink-0 font-bold underline"
            >
              {t("Create your workspace", "اعمل مساحة لشركتك")}
            </button>
          </div>
        )}
        <main className="mx-auto max-w-[1680px] p-5 md:p-9">
          {error && (
            <div
              role="alert"
              data-app-error="true"
              className="mb-4 flex items-center justify-between rounded-xl bg-rose-50 p-4 text-sm text-rose-700"
            >
              {error}
              <button onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {search && module === "dashboard" ? (
            <GlobalSearch query={search} ctx={Ctx} />
          ) : module === "dashboard" ? (
            <Dashboard ctx={Ctx} />
          ) : module === "reports" ? (
            <Reports ctx={Ctx} />
          ) : module === "admin" ? (
            <Administration ctx={Ctx} />
          ) : (
            <ModuleView
              ctx={Ctx}
              module={module}
              entity={entity}
              setEntity={setEntity}
              globalQuery={search}
            />
          )}
        </main>
        <footer className="flex justify-between border-t border-[#e6eae7] px-6 py-5 text-[10px] text-[#9aa69e] md:px-9 print:hidden">
          <span>© {new Date().getFullYear()} Sherkty ERP</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={12} />
            {t("Your workspace. Connected.", "شركتك كلها في مكان واحد.")}
          </span>
        </footer>
      </div>
      {notification && (
        <div className="fixed end-5 top-20 z-50 max-h-[70vh] w-[min(360px,90vw)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
          <div className="mb-4 flex justify-between">
            <h3 className="font-bold">
              {t("Your attention, please", "محتاجين تشوف ده")}
            </h3>
            <button onClick={() => setNotification(false)}>
              <X size={16} />
            </button>
          </div>
          <Notifications ctx={Ctx} />
        </div>
      )}
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-xl bg-[#173f32] px-5 py-3 text-sm text-white shadow-xl"
        >
          <Check size={17} />
          {toast}
        </div>
      )}
    </div>
  );
}
function Auth({ lang, setLang, done }: any) {
  const [mode, setMode] = useState("login"),
    [form, setForm] = useState<Row>({}),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const t = (e: string, a: string) => (lang === "ar" ? a : e);
  async function submit(e?: React.FormEvent, demo = false) {
    e?.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(
        "/auth/" + (demo ? "demo" : mode),
        request("POST", demo ? {} : form),
      );
      done();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="flex min-h-screen bg-[#fafbf8] text-ink rtl:font-arabic rtl:[&_h1]:leading-relaxed rtl:[&_h2]:leading-relaxed rtl:[&_label]:leading-6"
    >
      <section className="relative hidden w-[48%] flex-col justify-between overflow-hidden bg-[#183d35] p-12 text-white lg:flex">
        <img
          src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1400&auto=format&fit=crop&q=85"
          className="absolute inset-0 h-full w-full object-cover opacity-25"
          alt="Sunlit modern office"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#102d25] via-[#153a2e]/50 to-[#102d25]/30" />
        <div className="relative text-2xl font-bold">
          Sherkty{" "}
          <span className="ms-2 text-xs tracking-[.3em] text-[#c1d2ad]">
            ERP
          </span>
        </div>
        <div className="relative max-w-lg">
          <span className="mb-7 inline-flex rounded-full border border-white/20 px-4 py-2 text-xs text-[#d6e5c5]">
            {t(
              "Clarity for every part of your business",
              "شركتك كلها قدامك بوضوح",
            )}
          </span>
          <h1 className="font-display text-[3.5rem] font-semibold leading-[1.15] tracking-tight">
            {t("Less busywork.", "شغل أقل على الورق.")}
            <br />
            <span className="text-[#c7dbab]">
              {t("More possibility.", "فرص أكتر لشركتك.")}
            </span>
          </h1>
          <p className="mt-7 max-w-sm text-sm leading-7 text-[#c5d4cc]">
            {t(
              "People, projects, finances and everything in between. Bring your business together in one thoughtful workspace.",
              "الموظفين والمشاريع والحسابات وكل تفاصيل الشغل. جمع شركتك في مساحة واحدة مترتبة وسهلة.",
            )}
          </p>
          <div className="mt-10 flex gap-8 border-t border-white/15 pt-7">
            <div>
              <p className="text-xl font-semibold">13</p>
              <p className="mt-1 text-xs text-[#b8ccbd]">
                {t("Connected modules", "قسم مترابط")}
              </p>
            </div>
            <div>
              <p className="text-xl font-semibold">1</p>
              <p className="mt-1 text-xs text-[#b8ccbd]">
                {t("Clear view", "صورة كاملة")}
              </p>
            </div>
          </div>
        </div>
        <p className="relative text-[10px] tracking-wide text-[#b4c4b9]">
          {t("BUILT FOR THE WAY TEAMS WORK", "معمول عشان فريقك يشتغل أحسن")}
        </p>
      </section>
      <section className="flex flex-1 flex-col p-7 sm:p-12">
        <div className="flex justify-between">
          <p className="text-xl font-bold lg:invisible">Sherkty ERP</p>
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="flex items-center gap-2 text-xs"
          >
            <Globe size={15} />
            {lang === "en" ? "عربي" : "English"}
          </button>
        </div>
        <div className="m-auto w-full max-w-[380px] py-12">
          <p className="mb-3 text-[10px] font-bold tracking-[.2em] text-[#7d9272]">
            {t("YOUR NEXT CHAPTER", "الخطوة الجاية لشركتك")}
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight">
            {mode === "login"
              ? t("Welcome back.", "نورت تاني.")
              : t("A place to do great work.", "مساحة لشغل أحسن.")}
          </h2>
          <p className="mb-7 mt-3 text-sm text-[#88918b]">
            {mode === "login"
              ? t(
                  "Sign in to your company workspace.",
                  "ادخل على مساحة شغل شركتك.",
                )
              : t(
                  "Start with a clean, private workspace.",
                  "ابدأ مساحة خاصة وفاضية لشركتك.",
                )}
          </p>
          {error && (
            <p
              role="alert"
              data-app-error="true"
              className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700"
            >
              {error}
            </p>
          )}
          <form onSubmit={(e) => submit(e)} className="space-y-4">
            {mode === "register" && (
              <>
                <AuthField
                  label={t("Your name", "اسمك")}
                  name="name"
                  form={form}
                  setForm={setForm}
                />
                <AuthField
                  label={t("Company name", "اسم الشركة")}
                  name="company"
                  form={form}
                  setForm={setForm}
                />
              </>
            )}
            <AuthField
              label={t("Email address", "الإيميل")}
              name="email"
              type="email"
              form={form}
              setForm={setForm}
            />
            <AuthField
              label={t("Password", "كلمة السر")}
              name="password"
              type="password"
              form={form}
              setForm={setForm}
            />
            {mode === "register" && (
              <p className="text-xs leading-5 text-slate-500">
                {t(
                  "Use at least 12 characters. Never reuse your work email password. Email verification and password recovery are not yet configured.",
                  "استخدم 12 حرف على الأقل. متستخدمش نفس باسورد إيميلك. تأكيد الإيميل واسترجاع كلمة السر لسه مش متفعلين.",
                )}
              </p>
            )}
            <button disabled={busy} className={primary + " mt-2 w-full"}>
              {busy ? (
                <RefreshCw size={17} className="animate-spin" />
              ) : mode === "login" ? (
                t("Sign in", "ادخل")
              ) : (
                t("Create workspace", "اعمل مساحة شغل")
              )}
              <ArrowRight size={16} />
            </button>
          </form>
          <p className="mt-5 text-center text-xs text-slate-500">
            {mode === "login"
              ? t("New here?", "أول مرة هنا؟")
              : t("Already have an account?", "عندك حساب؟")}{" "}
            <button
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
              className="font-bold text-[#416545]"
            >
              {mode === "login"
                ? t("Create a workspace", "اعمل مساحة شغل")
                : t("Sign in", "ادخل")}
            </button>
          </p>
          <div className="my-7 flex items-center gap-4 text-[10px] text-slate-500">
            <span className="h-px flex-1 bg-slate-200" />
            {t("TAKE A LOOK AROUND", "جرب بنفسك")}
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <button
            disabled={busy}
            onClick={() => submit(undefined, true)}
            className={secondary + " w-full"}
          >
            <Eye size={16} />
            {t("Explore a demo workspace", "جرب مساحة تجريبية")}
          </button>
          <p className="mt-3 text-center text-[10px] text-slate-500">
            {t(
              "Fictional data. Private session. No sign-up needed.",
              "بيانات خيالية. جلسة خاصة. مش محتاج حساب.",
            )}
          </p>
        </div>
        <p className="text-center text-[10px] text-slate-500">
          {t(
            "People, operations and ambition. Connected.",
            "الفريق والشغل والطموح. في مكان واحد.",
          )}
        </p>
      </section>
    </div>
  );
}
function AuthField({ label, name, type = "text", form, setForm }: any) {
  return (
    <label className="block text-xs font-semibold text-slate-600">
      {label}
      <input
        className={input + " mt-2"}
        autoComplete={
          name === "password"
            ? "current-password"
            : name === "email"
              ? "email"
              : "off"
        }
        type={type}
        required
        minLength={name === "password" ? 12 : undefined}
        maxLength={name === "password" ? 128 : 200}
        value={form[name] || ""}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
      />
    </label>
  );
}
function Dashboard({ ctx }: any) {
  const { t, lang, money, navigate, revision, me } = ctx;
  const [data, setData] = useState<Row | null>(null),
    [error, setError] = useState(""),
    [custom, setCustom] = useState(false),
    [widgets, setWidgets] = useState<string[]>(() => {
      try {
        return JSON.parse(
          localStorage.getItem("erp-widgets") ||
            '["finance","projects","tasks","activity"]',
        );
      } catch {
        return ["finance", "projects", "tasks", "activity"];
      }
    });
  useEffect(() => {
    api("/overview")
      .then(setData)
      .catch((e) => setError(e.message));
  }, [revision, me.tenant_id]);
  if (error) return <Notice text={error} />;
  if (!data) return <Skeleton />;
  const count = (e: string, s?: string) =>
    data.counts
      .filter((r: Row) => r.entity === e && (!s || r.status === s))
      .reduce((n: number, r: Row) => n + r.n, 0);
  const cards = [
    {
      label: t("Total employees", "إجمالي الموظفين"),
      value: count("employees"),
      sub: t("Across your departments", "في أقسام شركتك"),
      icon: Users,
      m: "hr",
      color: "bg-[#e8eee0] text-[#789058]",
    },
    {
      label: t("Revenue recorded", "الإيرادات المسجلة"),
      value: data.financeVisible ? money(data.income) : "—",
      sub: t("Approved income · all time", "الدخل المعتمد · كل الفترات"),
      icon: TrendingUp,
      m: "finance",
      color: "bg-[#e2eee6] text-[#5c8a70]",
    },
    {
      label: t("Active projects", "المشاريع الشغالة"),
      value: count("projects", "Active"),
      sub: t("Moving your business forward", "بتقدم شركتك لقدام"),
      icon: FolderKanban,
      m: "projects",
      color: "bg-[#e9eaf2] text-[#8885ac]",
    },
    {
      label: t("Pending tasks", "المهام المفتوحة"),
      value: count("tasks") - count("tasks", "Done"),
      sub: t("A little focus goes a long way", "كل مهمة بتفرق"),
      icon: CheckCheck,
      m: "projects",
      color: "bg-[#f5ead9] text-[#bd9b64]",
    },
  ];
  return (
    <>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1.5 text-xs text-[#8e9b92]">
            {new Intl.DateTimeFormat(
              lang === "ar" ? "ar-EG-u-nu-latn" : "en-US",
              {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              },
            ).format(new Date())}
          </p>
          <h1 className="font-display text-[28px] font-bold tracking-[-.8px] md:text-[31px]">
            {t("A good day to move forward.", "يوم جديد لشغل أحسن.")}{" "}
            <span className="text-[#96ad7a]">↗</span>
          </h1>
          <p className="mt-2 text-xs text-[#647568]">
            {t(
              "Here's what's happening across your business today.",
              "دي آخر أخبار الشغل في شركتك.",
            )}
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setCustom(!custom)}
            className={secondary + " text-xs"}
          >
            <SlidersHorizontal size={13} />
            {t("Customize", "ظبط اللوحة")}
          </button>
          {custom && (
            <div className="absolute end-0 top-12 z-10 w-52 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
              {["finance", "projects", "tasks", "activity"].map((w) => (
                <label key={w} className="mb-3 flex gap-2 text-xs capitalize">
                  <input
                    type="checkbox"
                    checked={widgets.includes(w)}
                    onChange={() => {
                      const v = widgets.includes(w)
                        ? widgets.filter((x) => x !== w)
                        : [...widgets, w];
                      setWidgets(v);
                      localStorage.setItem("erp-widgets", JSON.stringify(v));
                    }}
                  />
                  {t(
                    w,
                    {
                      finance: "الحسابات",
                      projects: "المشاريع",
                      tasks: "المهام",
                      activity: "آخر الحركات",
                    }[w]!,
                  )}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, i) => (
          <button
            key={i}
            disabled={!me.modules.includes(card.m)}
            onClick={() => navigate(card.m, i === 3 ? "tasks" : undefined)}
            className="rounded-2xl border border-[#e3e9e4] bg-white p-5 text-start transition-shadow hover:shadow-md"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-medium text-[#869389]">
                {card.label}
              </span>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.color}`}
              >
                <card.icon size={15} />
              </span>
            </div>
            <p className="font-display text-[27px] font-bold tracking-[-1px] leading-9">
              {card.value}
            </p>
            <div className="mt-2.5 flex items-center justify-between">
              <span className="text-[10px] text-[#95a096]">{card.sub}</span>
              <ArrowUpRight size={13} className="text-[#a7b3a6]" />
            </div>
          </button>
        ))}
      </div>
      <div className="mb-6 grid gap-5 xl:grid-cols-[1.8fr_1fr]">
        {widgets.includes("finance") && (
          <section className="min-w-0 rounded-2xl border border-[#e3e9e4] bg-white p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold">
                  {t("Financial overview", "نظرة على الحسابات")}
                </h2>
                <p className="mt-1.5 text-[10px] text-[#96a198]">
                  {t(
                    "Income and expenses · last 6 months",
                    "الدخل والمصروفات · آخر 6 شهور",
                  )}
                </p>
              </div>
              <div className="flex gap-4 text-[10px] text-[#8e9a90]">
                <span className="flex items-center gap-1.5">
                  <i className="h-2 w-2 rounded-full bg-[#5c8263]" />
                  {t("Revenue", "الإيرادات")}
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="h-2 w-2 rounded-full bg-[#d9c39b]" />
                  {t("Expenses", "المصروفات")}
                </span>
              </div>
            </div>
            {data.financeVisible ? (
              <>
                <div className="mb-5 flex flex-wrap gap-7">
                  <div>
                    <p className="text-[10px] text-[#99a498]">
                      {t("TOTAL RECORDED", "إجمالي المسجل")}
                    </p>
                    <p className="mt-1 text-lg font-bold">
                      {money(data.income)}
                    </p>
                  </div>
                  <div className="border-s border-slate-100 ps-7">
                    <p className="text-[10px] text-[#99a498]">
                      {t("NET CASH FLOW", "صافي التدفق النقدي")}
                    </p>
                    <p className="mt-1 text-lg font-bold text-[#729066]">
                      {money(data.income - data.expense)}
                    </p>
                  </div>
                </div>
                <div className="h-[214px] w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={data.trend}
                      margin={{ left: -24, right: 8, top: 10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="0%"
                            stopColor="#a9c3a1"
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="100%"
                            stopColor="#a9c3a1"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="4 6"
                        vertical={false}
                        stroke="#edf0eb"
                      />
                      <XAxis
                        dataKey="month"
                        tickFormatter={(v: string) =>
                          new Intl.DateTimeFormat(
                            lang === "ar" ? "ar-EG-u-nu-latn" : "en-US",
                            { month: "short" },
                          ).format(new Date(v + "-10"))
                        }
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9ca89d", fontSize: 10 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => (v >= 1000 ? v / 1000 + "k" : v)}
                        tick={{ fill: "#adb5ac", fontSize: 9 }}
                      />
                      <Tooltip
                        formatter={(v: any) => money(v)}
                        labelFormatter={(v) => String(v)}
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid #e3e9e4",
                          fontSize: 11,
                        }}
                      />
                      <Area
                        name={t("Revenue", "الإيرادات")}
                        type="monotone"
                        dataKey="income"
                        stroke="#78956d"
                        strokeWidth={2.5}
                        fill="url(#rev)"
                        isAnimationActive={false}
                      />
                      <Area
                        name={t("Expenses", "المصروفات")}
                        type="monotone"
                        dataKey="expense"
                        stroke="#cfb98f"
                        strokeWidth={2}
                        fill="transparent"
                        strokeDasharray="5 4"
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <Empty
                text={t(
                  "Finance access is restricted to your role.",
                  "صلاحيتك مش بتشمل الحسابات.",
                )}
              />
            )}
          </section>
        )}
        <section className="flex flex-col overflow-hidden rounded-2xl border border-[#e3e9e4] bg-[#eaf0e3]">
          <div className="p-6 pb-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-semibold text-[#7d8f69]">
                {t("THE BIG PICTURE", "الصورة الكبيرة")}
              </span>
              <span className="h-2 w-2 rounded-full bg-[#7e9e65]" />
            </div>
            <h2 className="max-w-[240px] font-display text-[23px] font-semibold leading-[1.35] tracking-tight">
              {t(
                "Good things happen when teams connect.",
                "الشغل بيحلو لما الفريق يتجمع.",
              )}
            </h2>
            <p className="mt-3 max-w-[230px] text-xs leading-5 text-[#829174]">
              {t(
                "One workspace. Every department. A clearer path to what comes next.",
                "مساحة واحدة لكل الأقسام. وصورة أوضح لكل خطوة جاية.",
              )}
            </p>
            <button
              disabled={!me.modules.includes("hr")}
              onClick={() => navigate("hr")}
              className="mt-4 flex items-center gap-2 text-[10px] font-bold text-[#4b6941]"
            >
              {t("Meet your team", "شوف فريقك")}
              <ArrowUpRight size={13} />
            </button>
          </div>
          <div className="relative mt-auto h-[135px] overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=900&auto=format&fit=crop&q=85"
              alt={t("A bright collaborative office", "مساحة مكتب مضيئة")}
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#eaf0e3] via-transparent to-transparent" />
          </div>
        </section>
      </div>
      <div className="mb-6 grid gap-5 xl:grid-cols-[1.8fr_1fr]">
        {widgets.includes("projects") && (
          <section className="min-w-0 overflow-hidden rounded-2xl border border-[#e3e9e4] bg-white">
            <SectionTitle
              title={t("Projects in motion", "المشاريع الشغالة")}
              action={t("All projects", "كل المشاريع")}
              onClick={() => navigate("projects")}
            />
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs">
                <thead>
                  <tr className="border-y border-[#eff2ef] bg-[#fafbf9] text-[#98a394]">
                    {[
                      t("PROJECT NAME", "اسم المشروع"),
                      t("BUDGET", "الميزانية"),
                      t("DEADLINE", "آخر ميعاد"),
                      t("STATUS", "الحالة"),
                    ].map((h) => (
                      <th
                        className="whitespace-nowrap px-6 py-3 text-start text-[10px] font-medium tracking-wide"
                        key={h}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.projects.map((p: Row, i: number) => (
                    <tr
                      key={p.id}
                      onClick={() => navigate("projects")}
                      className="cursor-pointer border-b border-[#f1f3ef] last:border-0 hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="flex items-center gap-3">
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-lg ${["bg-[#edf0e5] text-[#8a9b69]", "bg-[#e9eaf3] text-[#9294ac]", "bg-[#f5ede1] text-[#b9a383]"][i % 3]}`}
                          >
                            <FolderKanban size={14} />
                          </span>
                          <span className="min-w-0">
                            <span className="block font-semibold">
                              {p.name}
                            </span>
                            <span className="mt-1.5 block text-[10px] text-slate-500">
                              {p.taskDone}/{p.taskTotal}{" "}
                              {t("tasks complete", "مهمة خلصت")} · {p.progress}%
                            </span>
                            <svg
                              role="img"
                              aria-label={
                                p.name + " progress " + p.progress + "%"
                              }
                              viewBox="0 0 100 3"
                              preserveAspectRatio="none"
                              className="mt-1 h-1 w-full min-w-24"
                            >
                              <rect
                                width="100"
                                height="3"
                                rx="1.5"
                                fill="#e8ede3"
                              />
                              <rect
                                width={p.progress}
                                height="3"
                                rx="1.5"
                                fill="#8ca46f"
                              />
                            </svg>
                          </span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 text-[#69776b]">
                        {money(p.budget)}
                      </td>
                      <td className="whitespace-nowrap px-6 text-[#69776b]">
                        {p.dueDate || "—"}
                      </td>
                      <td className="px-6">
                        <Badge s={p.status} ctx={ctx} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data.projects.length && (
                <Empty
                  text={t(
                    "Your next project starts here.",
                    "المشروع الجاي بيبدأ من هنا.",
                  )}
                />
              )}
            </div>
          </section>
        )}
        {widgets.includes("tasks") && (
          <section className="rounded-2xl border border-[#e3e9e4] bg-white">
            <SectionTitle
              title={t("On your radar", "ركز على دول")}
              action={t("View all", "شوف الكل")}
              onClick={() => navigate("projects", "tasks")}
            />
            <div className="px-6 pb-3">
              {data.tasks.slice(0, 4).map((r: Row, i: number) => (
                <button
                  key={r.id}
                  onClick={() => navigate("projects", "tasks")}
                  className="flex w-full items-start gap-3 border-b border-slate-50 py-3.5 text-start last:border-0"
                >
                  <span className="mt-1 h-3.5 w-3.5 shrink-0 rounded border border-[#dce3d7]" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium">
                      {r.name}
                    </span>
                    <span className="mt-2 flex items-center gap-1 text-[10px] text-slate-500">
                      <CalendarDays size={10} />
                      {r.dueDate || "—"}
                    </span>
                  </span>
                  <span
                    className={`mt-0.5 h-1.5 w-1.5 rounded-full ${r.priority === "High" ? "bg-[#d7ae77]" : "bg-[#a2b694]"}`}
                  />
                </button>
              ))}
              {!data.tasks.length && (
                <Empty text={t("You're all caught up.", "كله خلص، برافو!")} />
              )}
            </div>
          </section>
        )}
      </div>
      {data.departments?.length > 0 && (
        <section className="mb-6 rounded-2xl border border-[#e3e9e4] bg-white">
          <SectionTitle title={t("Department performance", "أداء الأقسام")} />
          <div className="grid gap-5 px-6 pb-6 md:grid-cols-3">
            {data.departments.map((d: Row) => (
              <div key={d.id} className="rounded-xl bg-[#f7f9f4] p-4">
                <h3 className="text-xs font-semibold">{d.name}</h3>
                <p className="my-3 text-[10px] text-slate-500">
                  {d.employees} {t("people", "موظف")} · {d.projects}{" "}
                  {t("projects", "مشروع")}
                </p>
                <div className="flex justify-between text-[10px] text-[#6c8157]">
                  <span>{t("Tasks completed", "المهام اللي خلصت")}</span>
                  <strong>
                    {d.doneTasks}/{d.totalTasks}
                  </strong>
                </div>
                <svg
                  role="img"
                  aria-label={d.name + " tasks completed"}
                  viewBox="0 0 100 3"
                  preserveAspectRatio="none"
                  className="mt-2 h-1.5 w-full"
                >
                  <rect width="100" height="3" rx="1.5" fill="#e8ede3" />
                  <rect
                    width={
                      d.totalTasks
                        ? Math.round((d.doneTasks / d.totalTasks) * 100)
                        : 0
                    }
                    height="3"
                    rx="1.5"
                    fill="#8ca46f"
                  />
                </svg>
              </div>
            ))}
          </div>
        </section>
      )}
      {widgets.includes("activity") && (
        <section className="rounded-2xl border border-[#e3e9e4] bg-white">
          <SectionTitle
            title={t("Around your workspace", "آخر الحركات في الشركة")}
            action={
              me.modules.includes("admin")
                ? t("Activity log", "سجل الحركات")
                : undefined
            }
            onClick={() => navigate("admin")}
          />
          <div className="grid gap-x-8 px-6 pb-5 md:grid-cols-2">
            {data.activities.slice(0, 4).map((r: Row, i: number) => (
              <div
                key={i}
                className="flex items-start gap-3 border-t border-[#f0f3ed] py-3.5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f0f3ed] text-[10px] font-semibold text-[#839274]">
                  {initials(r.actor)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[10px]">
                    <strong className="font-semibold">{r.actor}</strong>{" "}
                    <span className="text-[#97a092]">
                      {t(r.action, r.action === "created" ? "ضاف" : "حدّث")}
                    </span>{" "}
                    {r.name}
                  </p>
                  <p className="mt-1 text-[10px] text-[#adb6a9]">
                    {r.created_at} UTC
                  </p>
                </div>
              </div>
            ))}
            {!data.activities.length && (
              <p className="pb-2 text-xs text-slate-500">
                {t(
                  "A clean slate. Your activity will appear here.",
                  "بداية جديدة. الحركات هتظهر هنا.",
                )}
              </p>
            )}
          </div>
        </section>
      )}
    </>
  );
}
function SectionTitle({ title, action, onClick }: any) {
  return (
    <div className="flex items-center justify-between gap-3 p-6 pb-4">
      <h2 className="text-sm font-bold">{title}</h2>
      {action && (
        <button
          onClick={onClick}
          className="flex items-center gap-1 text-[10px] font-medium text-[#81976a]"
        >
          {action}
          <ChevronRight size={12} />
        </button>
      )}
    </div>
  );
}
function Badge({ s, ctx }: any) {
  const color = [
    "Active",
    "Approved",
    "Completed",
    "Done",
    "Paid",
    "Published",
    "Won",
    "Received",
    "Hired",
    "Present",
    "In service",
  ].includes(s)
    ? "bg-[#edf3e8] text-[#526b38]"
    : [
          "Pending",
          "In progress",
          "Issued",
          "Interview",
          "Negotiation",
          "In review",
          "Late",
        ].includes(s)
      ? "bg-[#fbf2e3] text-[#8a6728]"
      : ["Rejected", "Cancelled", "Overdue", "Lost", "Absent"].includes(s)
        ? "bg-rose-50 text-rose-500"
        : "bg-[#f0f2f4] text-[#65717e]";
  return s ? (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-medium ${color}`}
    >
      <i className="h-1 w-1 rounded-full bg-current" />
      {ctx.state(s)}
    </span>
  ) : (
    <span>—</span>
  );
}
function Empty({ text }: any) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3 px-5 py-8 text-center">
      <div className="rounded-2xl bg-[#f1f5ec] p-3 text-[#97aa83]">
        <FolderKanban size={23} strokeWidth={1.2} />
      </div>
      <p className="text-xs text-slate-500">{text}</p>
    </div>
  );
}
function Notice({ text }: any) {
  return (
    <div
      role="alert"
      data-app-error="true"
      className="my-4 rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700"
    >
      {text}
    </div>
  );
}
function Skeleton() {
  return (
    <div className="space-y-5">
      <div className="h-16 w-2/3 animate-pulse rounded-xl bg-slate-200/60" />
      <div className="grid grid-cols-2 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
    </div>
  );
}

function ModuleView({ ctx, module, entity, setEntity, globalQuery = "" }: any) {
  const { t, lang, money, revision, me, notify, refresh } = ctx;
  const keys = Object.keys(entities).filter(
      (k) => entities[k].module === module,
    ),
    safeEntity = keys.includes(entity) ? entity : keys[0],
    spec = entities[safeEntity];
  const [rows, setRows] = useState<Row[]>([]),
    [total, setTotal] = useState(0),
    [page, setPage] = useState(1),
    [q, setQ] = useState(""),
    [status, setStatus] = useState(""),
    [filters, setFilters] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [edit, setEdit] = useState<Row | null>(null),
    [detail, setDetail] = useState<Row | null>(null),
    [lookups, setLookups] = useState<Record<string, Row[]>>({}),
    [sort, setSort] = useState({ key: "", asc: true }),
    [board, setBoard] = useState(false),
    [busy, setBusy] = useState(false),
    [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)),
    [payroll, setPayroll] = useState(false);
  useEffect(() => {
    setPage(1);
    setStatus("");
    setQ("");
    setDetail(null);
    setBoard(false);
  }, [safeEntity]);
  useEffect(() => {
    setLoading(true);
    setError("");
    let live = true;
    const timer = setTimeout(() => {
      api(
        `/records/${safeEntity}?page=${page}&limit=20&q=${encodeURIComponent(globalQuery || q)}&status=${encodeURIComponent(status)}`,
      )
        .then((d) => {
          if (live) {
            setRows(d.records);
            setTotal(d.total);
          }
        })
        .catch((e) => live && setError(e.message))
        .finally(() => live && setLoading(false));
    }, 180);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [safeEntity, page, q, status, revision, globalQuery, me.tenant_id]);
  useEffect(() => {
    api("/lookups")
      .then((d) => setLookups(d.lookups))
      .catch(() => {});
  }, [revision, me.tenant_id]);
  const display = (field: Field, value: any) => {
    if (value == null || value === "") return "—";
    if (field.type === "money") return money(value);
    if (field.type === "ref")
      return (
        lookups[field.ref!]?.find((r: Row) => r.id === value)?.name ||
        t("Linked record", "سجل مرتبط")
      );
    if (field.options) return ctx.state(value);
    return String(value);
  };
  const sorted = useMemo(
    () =>
      !sort.key
        ? rows
        : [...rows].sort((a, b) => {
            const x = a[sort.key] ?? "",
              y = b[sort.key] ?? "";
            return (
              (typeof x === "number"
                ? x - y
                : String(x).localeCompare(String(y))) * (sort.asc ? 1 : -1)
            );
          }),
    [rows, sort],
  );
  const columns = spec.fields.filter((f) => f.type !== "textarea").slice(0, 5);
  const immutable = ["movements", "payslips"].includes(safeEntity),
    readonly = me.role === "viewer";
  const canEdit = (r: Row) =>
    !readonly &&
    !immutable &&
    (!spec.transitions || r.status === spec.states?.[0]);
  async function transition(r: Row, next: string) {
    setBusy(true);
    setError("");
    try {
      await api(
        `/records/${safeEntity}/${r.id}/transition`,
        request("POST", { status: next, version: r.version }),
      );
      notify(t("Workflow updated", "الحالة اتحدثت"));
      setDetail(null);
      refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function archive(r: Row) {
    if (
      !confirm(
        t(
          `Archive ${r.name}? This will hide it from active records.`,
          `تأرشف ${r.name}؟ مش هيظهر في السجلات الحالية.`,
        ),
      )
    )
      return;
    setBusy(true);
    try {
      await api(`/records/${safeEntity}/${r.id}`, request("DELETE"));
      notify(t("Record archived", "السجل اتأرشف"));
      setDetail(null);
      refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function exportData(format: string) {
    setBusy(true);
    try {
      const all = await collect(safeEntity, { q: globalQuery || q, status });
      await exportRows(format, all, spec.fields, spec.en, ctx, lookups);
      notify(t("Export ready", "التصدير جاهز"));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.18em] text-[#92a083]">
            {t("YOUR CONNECTED WORKSPACE", "كل شغلك في مكان واحد")}
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {label(
              modules.find((m: any) => m.id === module)!,
              lang,
            )}
          </h1>
          <p className="mt-2 text-xs text-slate-500">
            {t(
              "The details that keep your business moving.",
              "التفاصيل اللي بتخلي الشغل يمشي.",
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {module === "payroll" && !readonly && (
            <button onClick={() => setPayroll(!payroll)} className={secondary}>
              <Wallet size={15} />
              {t("Process payroll", "احسب المرتبات")}
            </button>
          )}
          {!readonly && !["payslips"].includes(safeEntity) && (
            <button onClick={() => setEdit({})} className={primary}>
              <Plus size={16} />
              {t("Add " + spec.singular, "ضيف سجل جديد")}
            </button>
          )}
        </div>
      </div>
      {payroll && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="mb-2 text-sm font-bold">
            {t("Monthly payroll processing", "حساب المرتبات الشهرية")}
          </h3>
          <p className="mb-3 text-xs leading-6 text-amber-800">
            {t(
              "Creates immutable payslips using your configured rates, not statutory tax advice. One run per employee and period. Does not transfer money or create accounting entries.",
              "بيطلع قسائم ثابتة بالنسب اللي إنت محددها. مش حساب ضريبي قانوني. مرة واحدة لكل موظف في الشهر. مش بيحول فلوس ومش بيعمل قيد محاسبي.",
            )}
          </p>
          <div className="flex flex-wrap gap-3">
            <input
              aria-label="Payroll period"
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className={input + " max-w-48"}
            />
            <button
              disabled={busy}
              className={primary}
              onClick={async () => {
                if (
                  !confirm(
                    t(
                      "Process payroll for " + period + "?",
                      "تحسب المرتبات لشهر " + period + "؟",
                    ),
                  )
                )
                  return;
                setBusy(true);
                try {
                  const d = await api(
                    "/payroll/process",
                    request("POST", { period }),
                  );
                  notify(
                    t(d.count + " payslips created", d.count + " قسيمة اتعملت"),
                  );
                  setEntity("payslips");
                  setPayroll(false);
                  refresh();
                } catch (e: any) {
                  setError(e.message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {t("Generate payslips", "طلع القسائم")}
            </button>
          </div>
        </div>
      )}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200">
        {keys.map((k) => (
          <button
            key={k}
            onClick={() => setEntity(k)}
            className={`shrink-0 border-b-2 px-4 py-3 text-xs font-medium ${safeEntity === k ? "border-[#55734c] text-[#55734c]" : "border-transparent text-[#9aa598] hover:text-slate-600"}`}
          >
            {label(entities[k], lang)}
          </button>
        ))}
      </div>
      {error && <Notice text={error} />}
      <section className="overflow-hidden rounded-2xl border border-[#e2e8e2] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold">{label(spec, lang)}</h2>
            <span className="rounded-full bg-[#edf2e8] px-2 py-0.5 text-[10px] text-[#8c9b79]">
              {total}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                size={14}
                className="absolute start-3 top-2.5 text-slate-500"
              />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder={t("Search by name...", "دور بالاسم...")}
                className="w-40 rounded-lg border border-slate-200 py-2 pe-3 ps-9 text-xs outline-none focus:border-emerald-500 sm:w-52"
              />
            </div>
            <button
              title={t("Filters", "الفلاتر")}
              aria-label="Filters"
              onClick={() => setFilters(!filters)}
              className={secondary + " !p-2.5"}
            >
              <SlidersHorizontal size={14} />
            </button>
            {["tasks", "applicants", "leads"].includes(safeEntity) && (
              <button
                title="Board view"
                onClick={() => setBoard(!board)}
                className={secondary + " !p-2.5"}
              >
                <Grip size={14} />
              </button>
            )}
            <details className="relative">
              <summary
                className={secondary + " cursor-pointer !p-2.5"}
                aria-label="Export"
              >
                <Download size={14} />
              </summary>
              <div className="absolute end-0 top-11 z-10 w-40 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                {["CSV", "Excel", "PDF"].map((f) => (
                  <button
                    key={f}
                    disabled={busy}
                    onClick={() => exportData(f)}
                    className="block w-full rounded-lg px-3 py-2 text-start text-xs hover:bg-slate-50"
                  >
                    {t("Export ", "صدر ") + f}
                  </button>
                ))}
              </div>
            </details>
          </div>
        </div>
        {filters && (
          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 bg-[#fafbf9] px-5 py-3">
            <label className="text-xs text-slate-500">
              {t("Status", "الحالة")}{" "}
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="ms-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                <option value="">{t("All statuses", "كل الحالات")}</option>
                {spec.states?.map((s) => (
                  <option key={s} value={s}>
                    {ctx.state(s)}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={() => {
                setStatus("");
                setQ("");
              }}
              className="text-xs text-[#7e9565]"
            >
              {t("Clear filters", "امسح الفلاتر")}
            </button>
          </div>
        )}
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">
            {t("Loading records...", "بنحمّل السجلات...")}
          </div>
        ) : board ? (
          <div className="flex gap-4 overflow-x-auto border-t border-slate-100 p-5">
            {spec.states?.map((s) => (
              <div
                key={s}
                className="min-w-56 flex-1 rounded-xl bg-[#f6f8f4] p-3"
              >
                <p className="mb-3 text-xs font-semibold text-slate-500">
                  {ctx.state(s)}{" "}
                  <span className="ms-1 text-slate-300">
                    {rows.filter((r) => r.status === s).length}
                  </span>
                </p>
                {rows
                  .filter((r) => r.status === s)
                  .map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setDetail(r)}
                      className="mb-2 w-full rounded-lg border border-slate-100 bg-white p-3 text-start shadow-sm"
                    >
                      <p className="mb-2 text-xs font-semibold">{r.name}</p>
                      <span className="text-[10px] text-slate-500">
                        {r.dueDate || r.followUp || r.email || "—"}
                      </span>
                    </button>
                  ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead>
                <tr className="border-y border-[#edf0e9] bg-[#fafbf9] text-[#99a292]">
                  {columns.map((f) => (
                    <th
                      key={f.key}
                      className="whitespace-nowrap px-5 py-3 text-start text-[10px] font-semibold uppercase tracking-wide"
                    >
                      <button
                        onClick={() =>
                          setSort({
                            key: f.key,
                            asc: sort.key === f.key ? !sort.asc : true,
                          })
                        }
                        className="inline-flex items-center gap-1"
                      >
                        {label(f, lang)}
                        {sort.key === f.key ? (
                          <span>{sort.asc ? "↑" : "↓"}</span>
                        ) : null}
                      </button>
                    </th>
                  ))}
                  {safeEntity === "products" && (
                    <th className="px-5 py-3 text-start">
                      {t("STOCK", "المخزون")}
                    </th>
                  )}
                  {safeEntity === "assets" && (
                    <th className="px-5 py-3 text-start">
                      {t("BOOK VALUE", "القيمة الدفترية")}
                    </th>
                  )}
                  {spec.states && (
                    <th className="px-5 py-3 text-start text-[10px] font-semibold uppercase">
                      {t("Status", "الحالة")}
                    </th>
                  )}
                  <th className="px-4" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((r, i) => (
                  <tr
                    key={r.id}
                    className="cursor-pointer border-b border-[#f0f3ed] last:border-0 hover:bg-[#fafcf8]"
                    onClick={() => setDetail(r)}
                  >
                    {columns.map((f, j) => (
                      <td
                        key={f.key}
                        className="max-w-60 truncate whitespace-nowrap px-5 py-4"
                      >
                        {j === 0 ? (
                          <div className="flex items-center gap-3">
                            {[
                              "employees",
                              "applicants",
                              "customers",
                              "vendors",
                            ].includes(safeEntity) && (
                              <span
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${["bg-[#e8eee0] text-[#8c9b71]", "bg-[#f5ebdd] text-[#b6a084]", "bg-[#e9ecf3] text-[#8a98b2]"][i % 3]}`}
                              >
                                {initials(r.name)}
                              </span>
                            )}
                            <span className="truncate font-semibold text-[#53614f]">
                              {display(f, r[f.key])}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#66745f]">
                            {display(f, r[f.key])}
                          </span>
                        )}
                      </td>
                    ))}
                    {safeEntity === "products" && (
                      <td
                        className={`px-5 ${r.stock <= (r.reorderLevel || 0) ? "text-amber-600" : "text-emerald-600"}`}
                      >
                        {r.stock} {r.unit || ""}
                      </td>
                    )}
                    {safeEntity === "assets" && (
                      <td className="whitespace-nowrap px-5 text-[#66745f]">
                        {money(r.bookValue)}
                      </td>
                    )}
                    {spec.states && (
                      <td className="px-5">
                        <Badge s={r.status} ctx={ctx} />
                      </td>
                    )}
                    <td className="px-4 text-slate-300">
                      <MoreHorizontal size={17} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && (
              <Empty
                text={t(
                  "No records yet. Add your first " + spec.singular + ".",
                  "لسه مفيش سجلات. ضيف أول سجل.",
                )}
              />
            )}
          </div>
        )}
        <div className="flex items-center justify-between border-t border-[#edf0e9] px-5 py-4 text-[10px] text-[#a1aa9a]">
          <span>
            {total
              ? `${(page - 1) * 20 + 1}–${Math.min(page * 20, total)} / ${total}`
              : "0 " + t("records", "سجلات")}{" "}
            · {t("Sorting applies to this page", "الترتيب للصفحة دي")}
          </span>
          <div className="flex items-center gap-2">
            <button
              aria-label="Previous page"
              onClick={() => setPage((v) => v - 1)}
              disabled={page === 1}
              className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-30"
            >
              <ArrowLeft size={13} />
            </button>
            <span className="px-2">{page}</span>
            <button
              aria-label="Next page"
              onClick={() => setPage((v) => v + 1)}
              disabled={page * 20 >= total}
              className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-30"
            >
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </section>
      {module === "inventory" && (
        <p className="mt-4 text-[10px] leading-5 text-slate-500">
          {t(
            "Stock is calculated from immutable movements. Assets use monthly straight-line depreciation with configured useful life and residual value.",
            "المخزون بيتحسب من الحركات الثابتة. إهلاك الأصول بالقسط الثابت الشهري حسب العمر والقيمة المتبقية اللي حددتهم.",
          )}
        </p>
      )}
      {edit && (
        <RecordForm
          ctx={ctx}
          entity={safeEntity}
          record={edit}
          lookups={lookups}
          onClose={() => setEdit(null)}
          onSave={() => {
            setEdit(null);
            setDetail(null);
            refresh();
            notify(t("Record saved", "السجل اتحفظ"));
          }}
        />
      )}
      {detail && (
        <Modal title={detail.name} onClose={() => setDetail(null)} wide>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <Badge s={detail.status} ctx={ctx} />
            <div className="flex gap-2">
              {canEdit(detail) && (
                <>
                  <button
                    className={secondary}
                    onClick={() => {
                      setEdit(detail);
                      setDetail(null);
                    }}
                  >
                    <Pencil size={13} />
                    {t("Edit", "عدّل")}
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => archive(detail)}
                    className={secondary + " text-rose-500"}
                  >
                    <Trash2 size={13} />
                    {t("Archive", "أرشف")}
                  </button>
                </>
              )}
              {safeEntity === "payslips" && (
                <button
                  onClick={() =>
                    exportRows(
                      "PDF",
                      [detail],
                      spec.fields,
                      "Payslip",
                      ctx,
                      lookups,
                    )
                  }
                  className={secondary}
                >
                  <Download size={13} />
                  {t("Payslip PDF", "قسيمة PDF")}
                </button>
              )}
            </div>
          </div>
          <dl className="grid gap-x-7 gap-y-5 sm:grid-cols-2">
            {spec.fields.map((f) => (
              <div
                key={f.key}
                className={f.type === "textarea" ? "sm:col-span-2" : ""}
              >
                <dt className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {label(f, lang)}
                </dt>
                <dd className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                  {display(f, detail[f.key])}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-7 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
            {!readonly &&
              spec.transitions?.[detail.status]?.map((s) => (
                <button
                  disabled={busy}
                  key={s}
                  onClick={() => transition(detail, s)}
                  className={
                    s === "Rejected" || s === "Cancelled" ? secondary : primary
                  }
                >
                  {ctx.state(s)}
                  <ArrowRight size={14} />
                </button>
              ))}
          </div>
          {safeEntity === "documents" && (
            <>
              <DocumentFiles ctx={ctx} id={detail.id} />
              <Versions ctx={ctx} id={detail.id} />
            </>
          )}
          <p className="mt-6 text-[10px] text-slate-500">
            {t("Version", "النسخة")} {detail.version} · {detail.updated_at} UTC
          </p>
        </Modal>
      )}
    </>
  );
}
function Modal({ title, onClose, children, wide = false }: any) {
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", listener);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", listener);
      document.body.style.overflow = previous;
    };
  }, []);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#142b23]/40 p-3 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`max-h-[92vh] w-full overflow-y-auto rounded-2xl bg-white shadow-2xl ${wide ? "max-w-3xl" : "max-w-xl"}`}
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-white p-6">
          <h2 className="font-display text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </header>
        <div className="p-6">{children}</div>
      </section>
    </div>
  );
}
function RecordForm({ ctx, entity, record, lookups, onClose, onSave }: any) {
  const { t, lang } = ctx,
    spec = entities[entity];
  const [data, setData] = useState<Row>({ ...record }),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(
        "/records/" + entity + (record.id ? "/" + record.id : ""),
        request(record.id ? "PUT" : "POST", data),
      );
      onSave();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={t(
        (record.id ? "Edit " : "Add ") + spec.singular,
        record.id ? "عدّل السجل" : "ضيف سجل جديد",
      )}
      onClose={onClose}
      wide
    >
      <form onSubmit={submit}>
        {error && <Notice text={error} />}
        <div className="grid gap-5 sm:grid-cols-2">
          {spec.fields.map((f) => (
            <label
              key={f.key}
              className={`block text-xs font-semibold text-slate-500 ${f.type === "textarea" ? "sm:col-span-2" : ""}`}
            >
              {label(f, lang)}
              {f.required && <span className="ms-1 text-amber-600">*</span>}
              {f.type === "textarea" ? (
                <textarea
                  required={f.required}
                  maxLength={20000}
                  rows={5}
                  value={data[f.key] ?? ""}
                  onChange={(e) =>
                    setData({ ...data, [f.key]: e.target.value })
                  }
                  className={input + " mt-2 resize-y"}
                />
              ) : f.type === "select" || f.type === "ref" ? (
                <select
                  required={f.required}
                  value={data[f.key] ?? ""}
                  onChange={(e) =>
                    setData({ ...data, [f.key]: e.target.value })
                  }
                  className={input + " mt-2"}
                >
                  <option value="">{t("Choose...", "اختار...")}</option>
                  {f.options?.map((v) => (
                    <option key={v} value={v}>
                      {ctx.state(v)}
                    </option>
                  ))}
                  {f.type === "ref" &&
                    lookups[f.ref!]?.map((r: Row) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                </select>
              ) : (
                <input
                  required={f.required}
                  type={
                    ["number", "money"].includes(f.type || "")
                      ? "number"
                      : f.type === "date"
                        ? "date"
                        : f.type === "email"
                          ? "email"
                          : "text"
                  }
                  min={f.min}
                  max={f.max}
                  step={
                    f.type === "money"
                      ? "0.01"
                      : f.type === "number"
                        ? (f.step ?? 1)
                        : undefined
                  }
                  maxLength={500}
                  value={data[f.key] ?? ""}
                  onChange={(e) =>
                    setData({
                      ...data,
                      [f.key]: ["number", "money"].includes(f.type || "")
                        ? e.target.value === ""
                          ? ""
                          : Number(e.target.value)
                        : e.target.value,
                    })
                  }
                  className={input + " mt-2"}
                />
              )}
            </label>
          ))}
          {spec.states && !spec.transitions && (
            <label className="block text-xs font-semibold text-slate-500">
              {t("Status", "الحالة")}
              <select
                value={data.status || spec.states[0]}
                onChange={(e) => setData({ ...data, status: e.target.value })}
                className={input + " mt-2"}
              >
                {spec.states.map((v) => (
                  <option key={v} value={v}>
                    {ctx.state(v)}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <div className="mt-7 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
          <button type="button" onClick={onClose} className={secondary}>
            {t("Cancel", "إلغاء")}
          </button>
          <button disabled={busy} className={primary}>
            {busy ? (
              <RefreshCw size={15} className="animate-spin" />
            ) : (
              <Check size={15} />
            )}{" "}
            {t("Save record", "احفظ السجل")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function Versions({ ctx, id }: any) {
  const [versions, setVersions] = useState<Row[]>([]),
    [error, setError] = useState(""),
    [open, setOpen] = useState(false);
  return (
    <div className="mt-5 border-t border-slate-100 pt-4">
      <button
        className="text-xs font-semibold text-[#6f8c5f]"
        onClick={async () => {
          setOpen(!open);
          if (!open)
            try {
              const d = await api("/documents/" + id + "/versions");
              setVersions(d.versions);
            } catch (e: any) {
              setError(e.message);
            }
        }}
      >
        {ctx.t("Version history", "النسخ القديمة")}{" "}
        <ChevronDown size={12} className="inline" />
      </button>
      {error && <Notice text={error} />}{" "}
      {open &&
        versions.map((v) => (
          <details key={v.version} className="mt-3 rounded-lg bg-slate-50 p-3">
            <summary className="cursor-pointer text-xs">
              {ctx.t("Version", "النسخة")} {v.version} · {v.created_at}
            </summary>
            <p className="mt-3 whitespace-pre-wrap text-xs leading-6 text-slate-500">
              {v.data.content}
            </p>
          </details>
        ))}
    </div>
  );
}
async function collect(entity: string, filter: any = {}) {
  let all: Row[] = [];
  for (let page = 1; page <= 100; page++) {
    const d = await api(
      `/records/${entity}?page=${page}&limit=100&q=${encodeURIComponent(filter.q || "")}&status=${encodeURIComponent(filter.status || "")}`,
    );
    all = all.concat(d.records);
    if (all.length >= d.total) return all;
  }
  throw new Error("Export exceeds 10,000 records. Narrow your filter.");
}
async function exportRows(
  format: string,
  rows: Row[],
  fields: Field[],
  title: string,
  ctx: any,
  lookups: Record<string, Row[]> = {},
) {
  const headers = fields.map(
    (f) =>
      label(f, ctx.lang) +
      (f.type === "money" ? " (" + ctx.me.currency + ")" : ""),
  );
  const values = rows.map((r) =>
    fields.map((f) => {
      const v = r[f.key];
      if (v == null) return "";
      if (f.type === "ref")
        return lookups[f.ref!]?.find((x) => x.id === v)?.name || v;
      if (f.options) return ctx.state(v);
      return v;
    }),
  );
  if (format === "PDF") {
    const w = window.open("", "_blank");
    if (!w)
      throw new Error(
        ctx.t(
          "Allow pop-ups to print or save PDF.",
          "اسمح بالنوافذ المنبثقة عشان تحفظ PDF.",
        ),
      );
    const d = w.document;
    d.title = title;
    d.documentElement.dir = ctx.lang === "ar" ? "rtl" : "ltr";
    const h = d.createElement("h1");
    h.textContent = ctx.me.company + " · " + title;
    d.body.appendChild(h);
    const meta = d.createElement("p");
    meta.textContent =
      new Date().toISOString().slice(0, 10) +
      " · " +
      rows.length +
      " " +
      ctx.t("records", "سجلات");
    d.body.appendChild(meta);
    const table = d.createElement("table");
    table.setAttribute("border", "1");
    table.setAttribute("cellpadding", "8");
    table.setAttribute("cellspacing", "0");
    const tr = d.createElement("tr");
    for (const header of headers) {
      const th = d.createElement("th");
      th.textContent = header;
      tr.appendChild(th);
    }
    table.appendChild(tr);
    for (const row of values) {
      const tr = d.createElement("tr");
      for (const v of row) {
        const td = d.createElement("td");
        td.textContent = String(v);
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }
    d.body.appendChild(table);
    const tip = d.createElement("p");
    tip.textContent = ctx.t(
      "Choose Save as PDF in the print dialog.",
      "اختار حفظ PDF من نافذة الطباعة.",
    );
    d.body.appendChild(tip);
    w.focus();
    w.print();
    return;
  }
  let blob: Blob;
  if (format === "Excel") {
    const ExcelJS = await import("exceljs");
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet(title.slice(0, 31));
    sheet.addRow(headers);
    for (const row of values) sheet.addRow(row.map(safeCell));
    sheet.getRow(1).font = { bold: true };
    sheet.columns.forEach((c) => {
      c.width = 24;
    });
    const buffer = await wb.xlsx.writeBuffer();
    blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  } else {
    const quote = (v: any) =>
      '"' + String(safeCell(v)).replaceAll('"', '""') + '"';
    blob = new Blob(
      [
        "\uFEFF" +
          [headers, ...values].map((r) => r.map(quote).join(",")).join("\r\n"),
      ],
      { type: "text/csv;charset=utf-8" },
    );
  }
  const url = URL.createObjectURL(blob),
    link = document.createElement("a");
  link.href = url;
  link.download =
    title.replace(/[^a-z0-9-]/gi, "_") +
    "." +
    (format === "Excel" ? "xlsx" : "csv");
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
function safeCell(v: any) {
  return typeof v === "string" && /^[=+@\-\t\r]/.test(v) ? "'" + v : v;
}
function Reports({ ctx }: any) {
  const { t, lang, me } = ctx,
    available = Object.keys(entities).filter((k) =>
      me.modules.includes(entities[k].module),
    );
  const [entity, setEntity] = useState(available[0]),
    [fields, setFields] = useState<string[]>([]),
    [rows, setRows] = useState<Row[] | null>(null),
    [status, setStatus] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [lookups, setLookups] = useState<Record<string, Row[]>>({});
  const spec = entities[entity];
  useEffect(() => {
    setFields(spec.fields.slice(0, 5).map((f) => f.key));
    setRows(null);
    setStatus("");
    api("/lookups")
      .then((d) => setLookups(d.lookups))
      .catch(() => {});
  }, [entity]);
  const selected = spec.fields.filter((f) => fields.includes(f.key));
  return (
    <>
      <p className="mb-2 text-[10px] uppercase tracking-[.2em] text-[#91a081]">
        {t("SEE THE BIGGER PICTURE", "الصورة الكاملة")}
      </p>
      <h1 className="font-display text-3xl font-bold">
        {t("Reports & analytics", "التقارير والتحليلات")}
      </h1>
      <p className="mt-2 text-xs text-slate-500">
        {t(
          "Build a report from your live workspace data. Choose the details that matter.",
          "اعمل تقرير من بيانات شركتك الحالية. اختار التفاصيل اللي محتاجها.",
        )}
      </p>
      <div className="my-6 grid gap-5 lg:grid-cols-[300px_1fr]">
        <section className="h-fit rounded-2xl border border-[#e2e8e2] bg-white p-5">
          <h2 className="mb-5 text-sm font-bold">
            {t("Report builder", "اعمل تقريرك")}
          </h2>
          <label className="text-xs text-slate-500">
            {t("Data source", "مصدر البيانات")}
            <select
              className={input + " mb-4 mt-2"}
              value={entity}
              onChange={(e) => setEntity(e.target.value)}
            >
              {available.map((k) => (
                <option key={k} value={k}>
                  {label(entities[k], lang)}
                </option>
              ))}
            </select>
          </label>
          {spec.states && (
            <label className="text-xs text-slate-500">
              {t("Status", "الحالة")}
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={input + " mb-4 mt-2"}
              >
                <option value="">{t("All statuses", "كل الحالات")}</option>
                {spec.states.map((s) => (
                  <option key={s} value={s}>
                    {ctx.state(s)}
                  </option>
                ))}
              </select>
            </label>
          )}
          <p className="mb-3 text-xs text-slate-500">
            {t("Include columns", "الأعمدة اللي محتاجها")}
          </p>
          <div className="max-h-64 space-y-3 overflow-y-auto">
            {spec.fields.map((f) => (
              <label
                key={f.key}
                className="flex items-center gap-2 text-xs text-slate-500"
              >
                <input
                  type="checkbox"
                  checked={fields.includes(f.key)}
                  onChange={() =>
                    setFields(
                      fields.includes(f.key)
                        ? fields.filter((k) => k !== f.key)
                        : [...fields, f.key],
                    )
                  }
                />
                {label(f, lang)}
              </label>
            ))}
          </div>
          <button
            disabled={busy || !fields.length}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                setRows(await collect(entity, { status }));
              } catch (e: any) {
                setError(e.message);
              } finally {
                setBusy(false);
              }
            }}
            className={primary + " mt-6 w-full"}
          >
            <ChartNoAxesCombined size={14} />
            {t("Generate report", "طلع التقرير")}
          </button>
        </section>
        <section className="min-w-0 rounded-2xl border border-[#e2e8e2] bg-white p-5">
          {error && <Notice text={error} />}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-bold">{label(spec, lang)}</h2>
            {rows && (
              <div className="flex gap-2">
                {["CSV", "Excel", "PDF"].map((f) => (
                  <button
                    key={f}
                    onClick={() =>
                      exportRows(
                        f,
                        rows,
                        selected,
                        spec.en,
                        ctx,
                        lookups,
                      ).catch((e) => setError(e.message))
                    }
                    className={secondary + " !px-3 !py-2 text-[10px]"}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>
          {rows ? (
            <>
              <div className="mb-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-[#f2f5ed] p-4">
                  <p className="text-[10px] text-[#8b9a7b]">
                    {t("RECORDS", "السجلات")}
                  </p>
                  <p className="mt-2 text-2xl font-bold">{rows.length}</p>
                </div>
                {selected
                  .filter((f) => ["money", "number"].includes(f.type || ""))
                  .slice(0, 2)
                  .map((f) => (
                    <div key={f.key} className="rounded-xl bg-slate-50 p-4">
                      <p className="text-[10px] text-slate-500">
                        {t("SUM · ", "إجمالي · ")}
                        {label(f, lang)}
                      </p>
                      <p className="mt-2 text-lg font-bold">
                        {f.type === "money"
                          ? ctx.money(
                              rows.reduce((n, r) => n + (r[f.key] || 0), 0),
                            )
                          : rows.reduce((n, r) => n + (r[f.key] || 0), 0)}
                      </p>
                    </div>
                  ))}
              </div>
              <p className="mb-3 text-[10px] text-slate-500">
                {t(
                  "Preview: first 100 records. Exports include the complete filtered report.",
                  "معاينة أول 100 سجل. التصدير بيشمل كل نتايج الفلتر.",
                )}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs">
                  <thead>
                    <tr>
                      {selected.map((f) => (
                        <th
                          key={f.key}
                          className="whitespace-nowrap border-b border-slate-200 px-3 py-3 text-start font-semibold text-slate-500"
                        >
                          {label(f, lang)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 100).map((r) => (
                      <tr key={r.id}>
                        {selected.map((f) => (
                          <td
                            key={f.key}
                            className="max-w-48 truncate border-b border-slate-100 px-3 py-3 text-slate-500"
                          >
                            {f.type === "ref"
                              ? lookups[f.ref!]?.find((x) => x.id === r[f.key])
                                  ?.name || "—"
                              : f.type === "money"
                                ? ctx.money(r[f.key])
                                : String(r[f.key] ?? "—")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <Empty
              text={t(
                "Choose your data and generate a report.",
                "اختار البيانات وطلع تقريرك.",
              )}
            />
          )}
        </section>
      </div>
      <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-xs leading-6 text-amber-800">
        {t(
          "Reports summarize operational records. They are not statutory financial statements, tax filings, or a double-entry general ledger. Have your accountant review business and payroll policies before using this system with real company data.",
          "التقارير دي ملخص للسجلات التشغيلية، مش قوائم مالية قانونية أو إقرارات ضريبية أو دفتر قيد مزدوج. راجع سياسات الحسابات والمرتبات مع المحاسب قبل استخدام بيانات الشركة الحقيقية.",
        )}
      </div>
    </>
  );
}
function Administration({ ctx }: any) {
  const { t, lang, me, revision, refresh, notify } = ctx;
  const [tab, setTab] = useState("members"),
    [members, setMembers] = useState<Row[]>([]),
    [invites, setInvites] = useState<Row[]>([]),
    [audit, setAudit] = useState<Row[]>([]),
    [error, setError] = useState(""),
    [form, setForm] = useState<Row>({ role: "viewer" }),
    [workspace, setWorkspace] = useState(""),
    [busy, setBusy] = useState(false),
    [invite, setInvite] = useState(""),
    [code, setCode] = useState("");
  useEffect(() => {
    if (me.modules.includes("admin")) {
      api("/members")
        .then((d) => {
          setMembers(d.members);
          setInvites(d.invitations);
        })
        .catch((e) => setError(e.message));
      api("/audit")
        .then((d) => setAudit(d.records))
        .catch((e) => setError(e.message));
    }
  }, [revision, me.tenant_id]);
  if (!me.modules.includes("admin"))
    return (
      <Notice
        text={t(
          "Workspace administration is restricted to owners and administrators.",
          "إدارة مساحة الشغل للمالك والمديرين بس.",
        )}
      />
    );
  return (
    <>
      <h1 className="font-display text-3xl font-bold">
        {t("Administration", "الإدارة")}
      </h1>
      <p className="mt-2 text-xs text-slate-500">
        {t(
          "A well-run workspace starts with the right foundations.",
          "إدارة الشغل بتبدأ بأساس مظبوط.",
        )}
      </p>
      <div className="mb-6 mt-6 flex gap-2 overflow-x-auto border-b border-slate-200">
        {[
          ["members", "People & access", "الأعضاء والصلاحيات"],
          ["workflows", "Approval policies", "سياسات الموافقة"],
          ["settings", "Company settings", "إعدادات الشركة"],
          ["audit", "Audit trail", "سجل الحركات"],
          ["workspace", "Workspaces", "مساحات الشغل"],
        ].map(([k, en, ar]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`shrink-0 border-b-2 px-4 py-3 text-xs ${tab === k ? "border-[#6b845a] font-bold text-[#6b845a]" : "border-transparent text-slate-500"}`}
          >
            {t(en, ar)}
          </button>
        ))}
      </div>
      {error && <Notice text={error} />}
      {["settings", "workflows"].includes(tab) ? (
        <>
          {tab === "settings" && <WorkspaceSettings ctx={ctx} />}
          <ModuleView
            ctx={ctx}
            module="admin"
            entity={tab}
            setEntity={setTab}
          />
        </>
      ) : tab === "members" ? (
        <>
          <section className="rounded-2xl border border-[#e2e8e2] bg-white p-5">
            <h2 className="mb-5 text-sm font-bold">
              {t("Workspace members", "أعضاء مساحة الشغل")}
            </h2>
            {members.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 py-4"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#edf1e7] text-[10px] text-[#7a8c63]">
                    {initials(m.name)}
                  </span>
                  <span>
                    <strong className="block text-xs">{m.name}</strong>
                    <small className="text-[10px] text-slate-500">
                      {m.email}
                    </small>
                  </span>
                </div>
                {me.role === "owner" && m.role !== "owner" ? (
                  <select
                    value={m.role}
                    onChange={async (e) => {
                      try {
                        await api(
                          "/members/" + m.id,
                          request("PATCH", { role: e.target.value }),
                        );
                        refresh();
                        notify(t("Role updated", "الصلاحية اتحدثت"));
                      } catch (e: any) {
                        setError(e.message);
                      }
                    }}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
                  >
                    {[
                      "admin",
                      "hr",
                      "finance",
                      "operations",
                      "sales",
                      "viewer",
                    ].map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                ) : (
                  <span className="rounded-full bg-slate-50 px-3 py-1.5 text-xs capitalize text-slate-500">
                    {m.role}
                  </span>
                )}
              </div>
            ))}
            <form
              className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-5"
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                  const d = await api("/members/invite", request("POST", form));
                  setInvite(d.inviteId || "");
                  refresh();
                  notify(t("Invitation created", "الدعوة اتعملت"));
                } catch (e: any) {
                  setError(e.message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <input
                type="email"
                required
                aria-label="Member email"
                placeholder={t("Colleague email address", "إيميل زميلك")}
                value={form.email || ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={input + " max-w-72"}
              />
              <select
                aria-label="Member role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className={input + " max-w-40"}
              >
                {["admin", "hr", "finance", "operations", "sales", "viewer"]
                  .filter((r) => me.role === "owner" || r !== "admin")
                  .map((r) => (
                    <option key={r}>{r}</option>
                  ))}
              </select>
              <button disabled={busy} className={primary}>
                <Plus size={14} />
                {t("Create invitation", "اعمل دعوة")}
              </button>
            </form>
            {invite && (
              <div className="mt-4 rounded-xl bg-[#f2f6ec] p-4">
                <p className="mb-2 text-xs text-[#6d855b]">
                  {t(
                    "Send this code privately to your colleague. They must create an account with the invited email, then accept it in Administration → Workspaces. The code grants access, keep it private. No email has been sent.",
                    "ابعت الكود ده لزميلك بشكل خاص. يعمل حساب بنفس الإيميل وبعدين يقبل الدعوة من الإدارة ← مساحات الشغل. الكود بيدي صلاحية، خليه خاص. متبعتش إيميل تلقائي.",
                  )}
                </p>
                <div className="flex items-center gap-3">
                  <code className="break-all text-xs">{invite}</code>
                  <button
                    type="button"
                    aria-label="Copy invitation"
                    onClick={() =>
                      navigator.clipboard
                        .writeText(invite)
                        .then(() => notify(t("Copied", "اتنسخ")))
                    }
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            )}
            <p className="mt-4 text-[10px] text-slate-500">
              {invites.length}{" "}
              {t(
                "pending invitations · valid for 7 days",
                "دعوة مستنية · صالحة 7 أيام",
              )}
            </p>
          </section>
          <div className="mt-5 rounded-xl bg-white p-5 text-xs leading-7 text-slate-500">
            <strong>{t("Role access", "الصلاحيات")}: </strong>
            {t(
              "HR: employee records, recruitment, payroll. Finance: finance and payroll. Operations: projects, stock and purchasing. Sales: CRM. Viewer: read-only projects and CRM. Owners and administrators: all modules.",
              "الموارد البشرية: الموظفين والتوظيف والمرتبات. الحسابات: المالية والمرتبات. التشغيل: المشاريع والمخزون والمشتريات. المبيعات: العملاء. المشاهد: قراءة المشاريع والعملاء بس. المالك والمدير: كل الأقسام.",
            )}
          </div>
        </>
      ) : tab === "audit" ? (
        <section className="overflow-hidden rounded-2xl border border-[#e2e8e2] bg-white">
          <SectionTitle
            title={t(
              "Latest 100 workspace events",
              "آخر 100 حركة في مساحة الشغل",
            )}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500">
                  {[
                    t("Actor", "المسؤول"),
                    t("Action", "الحركة"),
                    t("Collection", "القسم"),
                    t("Record", "السجل"),
                    t("Timestamp (UTC)", "الوقت (UTC)"),
                  ].map((h) => (
                    <th key={h} className="px-5 py-3 text-start">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {audit.map((a, i) => (
                  <tr
                    key={i}
                    className="border-t border-slate-100 text-slate-500"
                  >
                    {["actor", "action", "entity", "name", "created_at"].map(
                      (k) => (
                        <td key={k} className="whitespace-nowrap px-5 py-3">
                          {a[k]}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {!audit.length && (
              <Empty
                text={t(
                  "Your audit trail starts with your first action.",
                  "سجل الحركات بيبدأ من أول حركة تعملها.",
                )}
              />
            )}
          </div>
        </section>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          <section className="rounded-2xl border border-[#e2e8e2] bg-white p-6">
            <h2 className="mb-3 text-sm font-bold">
              {t("Create another workspace", "اعمل مساحة شغل جديدة")}
            </h2>
            <p className="mb-5 text-xs leading-6 text-slate-500">
              {t(
                "Each workspace has separate data and access. Switch between them from your profile menu.",
                "كل مساحة بياناتها وصلاحياتها منفصلة. بدّل بينهم من قائمة حسابك.",
              )}
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await api(
                    "/workspaces",
                    request("POST", { name: workspace }),
                  );
                  location.reload();
                } catch (e: any) {
                  setError(e.message);
                }
              }}
            >
              <input
                required
                aria-label="Workspace name"
                value={workspace}
                onChange={(e) => setWorkspace(e.target.value)}
                className={input}
                placeholder={t(
                  "Company or workspace name",
                  "اسم الشركة أو المساحة",
                )}
              />
              <button className={primary + " mt-4"}>
                {t("Create workspace", "اعمل المساحة")}
              </button>
            </form>
          </section>
          <section className="rounded-2xl border border-[#e2e8e2] bg-white p-6">
            <h2 className="mb-3 text-sm font-bold">
              {t("Accept an invitation", "اقبل دعوة")}
            </h2>
            <p className="mb-5 text-xs leading-6 text-slate-500">
              {t(
                "Paste the private code shared by your workspace administrator. Your account email must match the invitation.",
                "حط كود الدعوة اللي مدير المساحة بعتهولك. لازم إيميل حسابك يكون نفس إيميل الدعوة.",
              )}
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await api(
                    "/invitations/accept",
                    request("POST", { id: code.trim() }),
                  );
                  location.reload();
                } catch (e: any) {
                  setError(e.message);
                }
              }}
            >
              <input
                required
                aria-label="Invitation code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={input}
                placeholder={t("Invitation code", "كود الدعوة")}
              />
              <button className={primary + " mt-4"}>
                {t("Join workspace", "ادخل مساحة الشغل")}
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
function Notifications({ ctx }: any) {
  const [items, setItems] = useState<Row[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    api("/notifications")
      .then((d) => setItems(d.items))
      .catch((e) => setError(e.message));
  }, [ctx.revision]);
  return (
    <>
      {error && <Notice text={error} />}{" "}
      {items.length ? (
        items.map((r, i) => (
          <button
            key={i}
            onClick={() => ctx.navigate(r.module, r.entity)}
            className="mb-2 flex w-full items-start gap-3 rounded-xl bg-[#f6f8f2] p-3 text-start"
          >
            <Clock size={16} className="mt-1 shrink-0 text-[#9aad85]" />
            <span>
              <span className="block text-xs font-semibold">{r.name}</span>
              <span className="mt-1 block text-[10px] text-slate-500">
                {ctx.state(r.status)} ·{" "}
                {r.date || ctx.t("Needs a review", "محتاج مراجعة")}
              </span>
            </span>
          </button>
        ))
      ) : (
        <Empty
          text={ctx.t("No alerts. Room to focus.", "مفيش تنبيهات. ركز براحتك.")}
        />
      )}
      <p className="mt-3 text-[10px] leading-5 text-slate-500">
        {ctx.t(
          "In-app alerts refresh when opened. Email and scheduled push delivery are not configured.",
          "التنبيهات بتتحدث لما تفتحها. الإيميل والإشعارات المجدولة لسه مش متفعلين.",
        )}
      </p>
    </>
  );
}
function GlobalSearch({ query, ctx }: any) {
  const [results, setResults] = useState<Row[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const timer = setTimeout(
      () =>
        api("/search?q=" + encodeURIComponent(query))
          .then((d) => active && setResults(d.results))
          .catch((e) => active && setError(e.message)),
      200,
    );
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);
  return (
    <>
      <h1 className="font-display text-2xl font-bold">
        {ctx.t("Search results", "نتايج البحث")}
      </h1>
      <p className="mb-6 mt-2 text-sm text-slate-500">{query}</p>
      {error && <Notice text={error} />}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        {results.map((r) => (
          <button
            key={r.id}
            onClick={() => ctx.navigate(entities[r.entity].module, r.entity)}
            className="flex w-full items-center justify-between border-b border-slate-100 p-4 text-start text-xs last:border-0"
          >
            <span>
              <strong className="block">{r.name}</strong>
              <span className="mt-1 block text-[10px] text-slate-500">
                {label(entities[r.entity], ctx.lang)}
              </span>
            </span>
            <ChevronRight size={14} />
          </button>
        ))}
        {!results.length && (
          <Empty text={ctx.t("No matching records.", "مفيش نتايج.")} />
        )}
      </div>
    </>
  );
}
function WorkspaceSettings({ ctx }: any) {
  const [name, setName] = useState(ctx.me.company),
    [currency, setCurrency] = useState(ctx.me.currency),
    [error, setError] = useState("");
  return (
    <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-bold">
        {ctx.t("Company identity", "بيانات الشركة")}
      </h2>
      {error && <Notice text={error} />}
      <form
        className="flex flex-wrap items-end gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api("/workspace", request("PATCH", { name, currency }));
            location.reload();
          } catch (e: any) {
            setError(e.message);
          }
        }}
      >
        <label className="text-xs text-slate-500">
          {ctx.t("Company name", "اسم الشركة")}
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={input + " mt-2"}
          />
        </label>
        <label className="text-xs text-slate-500">
          {ctx.t("Base currency", "العملة الأساسية")}
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className={input + " mt-2"}
          >
            {["EGP", "USD", "EUR", "GBP", "SAR", "AED"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <button className={primary}>
          {ctx.t("Save settings", "احفظ الإعدادات")}
        </button>
      </form>
      <p className="mt-3 text-[10px] text-slate-500">
        {ctx.t(
          "Currency is fixed once records exist. Changing it does not convert money.",
          "العملة بتثبت بعد أول سجل. تغييرها مش بيحول المبالغ.",
        )}
      </p>
    </section>
  );
}
function DocumentFiles({ ctx, id }: any) {
  const [files, setFiles] = useState<Row[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const load = () =>
    api("/documents/" + id + "/files")
      .then((d) => setFiles(d.files))
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, [id]);
  return (
    <div className="mt-5 border-t border-slate-100 pt-5">
      <h3 className="mb-3 text-xs font-bold">
        {ctx.t("Attachments & file versions", "المرفقات ونسخ الملفات")}
      </h3>
      {error && <Notice text={error} />}
      <div className="space-y-2">
        {files.map((f) => (
          <a
            key={f.version}
            href={"/api/documents/" + id + "/files/" + f.version}
            className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-3 text-xs text-slate-500"
          >
            <span className="truncate">
              {f.name} · v{f.version} · {Math.ceil(f.size / 1024)} KB
            </span>
            <Download size={14} className="shrink-0" />
          </a>
        ))}
      </div>
      {ctx.me.role !== "viewer" && (
        <label className="mt-4 block text-xs text-slate-500">
          {ctx.t("Upload a file or a new version", "ارفع ملف أو نسخة جديدة")}
          <input
            aria-label="Upload document file"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.txt,.docx,.xlsx"
            disabled={busy}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 524288) {
                setError(
                  ctx.t(
                    "Maximum file size is 512 KB on the free database edition.",
                    "أقصى حجم للملف 512 KB في النسخة المجانية.",
                  ),
                );
                return;
              }
              setBusy(true);
              setError("");
              try {
                const r = await fetch("/api/documents/" + id + "/files", {
                  method: "POST",
                  headers: {
                    "Content-Type": file.type || "application/octet-stream",
                    "X-Filename": encodeURIComponent(file.name),
                  },
                  body: file,
                });
                const d: any = await r.json();
                if (!r.ok) throw Error(d.error);
                await load();
                ctx.notify(ctx.t("File uploaded", "الملف اترفع"));
              } catch (e: any) {
                setError(e.message);
              } finally {
                setBusy(false);
              }
            }}
            className="mt-2 block w-full rounded-lg border border-slate-200 p-3 text-xs file:me-3 file:rounded-lg file:border-0 file:bg-[#edf2e7] file:px-3 file:py-2 file:text-[#6f885b]"
          />
        </label>
      )}
      <p className="mt-2 text-[10px] leading-5 text-slate-500">
        {ctx.t(
          "PDF, PNG, JPG, TXT, DOCX or XLSX · 512 KB maximum per file · Downloads are logged. Files are not scanned for malware.",
          "PDF وPNG وJPG وTXT وDOCX وXLSX · أقصى حجم 512 KB · التحميل بيتسجل. الملفات مش بيتم فحصها من الفيروسات.",
        )}
      </p>
    </div>
  );
}
