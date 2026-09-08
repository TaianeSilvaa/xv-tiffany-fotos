import { useState, useEffect, type CSSProperties } from "react";
import {
  Camera,
  ImageIcon,
  MessageCircle,
  Gift,
  Home,
  ArrowLeft,
  X,
  Check,
  Send,
  ChevronLeft,
  ChevronRight,
  Copy,
  Play,
  Pause,
  Star,
} from "lucide-react";
import { getContent, isApiConfigured, postMessage, uploadPhotos } from "../lib/api";
import { optimizeImage } from "../lib/images";
import AdminArea from "./AdminArea";
import PhotoPost from "./PhotoPost";

type Screen =
  | "welcome"
  | "identify"
  | "home"
  | "sendPhoto"
  | "photoConfirm"
  | "gallery"
  | "fullPhoto"
  | "messages"
  | "gift"
  | "slideshow"
  | "admin";

type Tab = "home" | "gallery" | "messages" | "gift";

interface Photo {
  id: string;
  url: string;
  images?: Array<{ id: string; url: string }>;
  guestName: string;
  time: string;
  message?: string;
  reactions?: Record<string, number>;
  myReaction?: string;
  comments?: Array<{ id: string; guestName: string; text: string; time: string }>;
}

interface Message {
  id: string;
  guestName: string;
  text: string;
  time: string;
}

const DEMO_PHOTOS: Photo[] = [
  {
    id: "1",
    url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=900&fit=crop&auto=format",
    guestName: "Ana Paula",
    time: "21:03",
    message: "Parabéns Tiffany! Você merece tudo de melhor! 🎉",
  },
  {
    id: "2",
    url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=900&fit=crop&auto=format",
    guestName: "Gabriel S.",
    time: "21:17",
  },
  {
    id: "3",
    url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=900&fit=crop&auto=format",
    guestName: "Larissa M.",
    time: "21:45",
    message: "Que festa incrível! 💙",
  },
  {
    id: "4",
    url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=900&fit=crop&auto=format",
    guestName: "Família Costa",
    time: "22:10",
    message: "Momentos como esse ficam para sempre no coração.",
  },
];

const DEMO_MESSAGES: Message[] = [
  {
    id: "1",
    guestName: "Família Rodrigues",
    text: "Tiffany, você é uma jovem incrível! Que esses 15 anos sejam o começo de uma vida linda e cheia de realizações. Te amamos muito!",
    time: "20:45",
  },
  {
    id: "2",
    guestName: "Duda & Bia",
    text: "Minha amiga linda! Obrigada por me incluir nesse momento tão especial. Você vai conquistar o mundo! 💙✨",
    time: "21:00",
  },
  {
    id: "3",
    guestName: "Tio Carlos",
    text: "Que Deus abençoe cada passo da sua jornada. Hoje começa o melhor capítulo da sua história. Com muito amor!",
    time: "21:32",
  },
];

const PIX_KEY = "tiffany15anos@gmail.com";
const PIX_AMOUNTS = [50, 100, 150, 200];

function getTime() {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function nameInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0] || "")
    .join("")
    .toUpperCase();
}

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const dims: Record<string, number> = { sm: 32, md: 40, lg: 48 };
  const fs: Record<string, number> = { sm: 11, md: 14, lg: 16 };
  return (
    <div
      style={{
        width: dims[size],
        height: dims[size],
        borderRadius: "50%",
        background: "linear-gradient(135deg, #3b6cf8, #1a3ad0)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: fs[size],
        fontWeight: 600,
        color: "#fff",
        fontFamily: "Jost, sans-serif",
        letterSpacing: "0.03em",
      }}
    >
      {nameInitials(name) || "?"}
    </div>
  );
}

interface NavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onAddPhoto: () => void;
}

function BottomNav({ activeTab, onTabChange, onAddPhoto }: NavProps) {
  const active = "#6b9aff";
  const inactive = "#3a507a";

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: "430px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        background: "rgba(4, 8, 26, 0.97)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(80, 120, 255, 0.18)",
        paddingTop: "10px",
        paddingBottom: "max(env(safe-area-inset-bottom, 0px), 14px)",
        zIndex: 50,
      }}
    >
      {(
        [
          { id: "home" as Tab, icon: Home, label: "Início" },
          { id: "gallery" as Tab, icon: ImageIcon, label: "Fotos" },
        ]
      ).map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            padding: "4px 20px",
            color: activeTab === id ? active : inactive,
            background: "none",
            border: "none",
            cursor: "pointer",
            transition: "color 0.2s",
          }}
        >
          <Icon size={22} />
          <span style={{ fontSize: 10, fontFamily: "Jost, sans-serif", fontWeight: 500 }}>{label}</span>
        </button>
      ))}

      <button
        onClick={onAddPhoto}
        style={{
          width: 58,
          height: 58,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #3b6cf8, #2244d0)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: -22,
          border: "2.5px solid rgba(180, 210, 255, 0.22)",
          boxShadow: "0 4px 28px rgba(59, 108, 248, 0.6)",
          flexShrink: 0,
          cursor: "pointer",
        }}
      >
        <Camera size={24} color="#fff" />
      </button>

      {(
        [
          { id: "messages" as Tab, icon: MessageCircle, label: "Mensagens" },
          { id: "gift" as Tab, icon: Gift, label: "Presente" },
        ]
      ).map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            padding: "4px 20px",
            color: activeTab === id ? active : inactive,
            background: "none",
            border: "none",
            cursor: "pointer",
            transition: "color 0.2s",
          }}
        >
          <Icon size={22} />
          <span style={{ fontSize: 10, fontFamily: "Jost, sans-serif", fontWeight: 500 }}>{label}</span>
        </button>
      ))}
    </nav>
  );
}

const BASE: CSSProperties = {
  minHeight: "100dvh",
  maxWidth: "430px",
  margin: "0 auto",
  fontFamily: "Jost, sans-serif",
  background: "#04081a",
  color: "#eef2ff",
  position: "relative",
};

const C = {
  bg: "#04081a",
  card: "#0a1035",
  primary: "#3b6cf8",
  primaryDark: "#2244d0",
  border: "rgba(80, 120, 255, 0.2)",
  borderFaint: "rgba(80, 120, 255, 0.1)",
  text: "#eef2ff",
  textSub: "#7090c0",
  textMuted: "#3a507a",
  accent: "#6b9aff",
  accentSilver: "#b0c8e8",
};

export default function App() {
  const savedGuestName = localStorage.getItem("tiffany-guest-name") || "";
  const [screen, setScreen] = useState<Screen>(savedGuestName ? "home" : "welcome");
  const [adminReturnScreen, setAdminReturnScreen] = useState<"welcome" | "home">("welcome");
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [guestName, setGuestName] = useState(savedGuestName);
  const [nameInput, setNameInput] = useState(savedGuestName);
  const [guestKey] = useState(() => {
    const saved = localStorage.getItem("tiffany-guest-key");
    if (saved) return saved;
    const created = crypto.randomUUID();
    localStorage.setItem("tiffany-guest-key", created);
    return created;
  });
  const [photos, setPhotos] = useState<Photo[]>(isApiConfigured ? [] : DEMO_PHOTOS);
  const [messages, setMessages] = useState<Message[]>(isApiConfigured ? [] : DEMO_MESSAGES);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [appError, setAppError] = useState("");
  const [photoMessage, setPhotoMessage] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [fullImageIndex, setFullImageIndex] = useState(0);
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [slideshowPlaying, setSlideshowPlaying] = useState(true);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(100);
  const [customAmount, setCustomAmount] = useState("");
  const [pixCopied, setPixCopied] = useState(false);

  const handleFileChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    if (!files.length) return;
    if (files.length > 10) {
      setAppError(`Você selecionou ${files.length} fotos. Escolha no máximo 10 por vez.`);
      input.value = "";
      return;
    }
    if (files.some((file) => !file.type.startsWith("image/"))) { setAppError("Selecione somente arquivos de imagem."); return; }
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    const urls = files.map((file) => URL.createObjectURL(file));
    setSelectedFiles(files); setPreviewUrls(urls); setPreviewUrl(urls[0]); setAppError("");
  };

  const openCamera = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp,image/heic,image/heif";
    input.setAttribute("capture", "environment");
    input.addEventListener("change", handleFileChange);
    input.click();
  };

  const openGallery = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp,image/heic,image/heif";
    input.multiple = true;
    input.addEventListener("change", handleFileChange);
    input.click();
  };

  const removeSelectedImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    const nextFiles = selectedFiles.filter((_, i) => i !== index);
    const nextUrls = previewUrls.filter((_, i) => i !== index);
    setSelectedFiles(nextFiles); setPreviewUrls(nextUrls); setPreviewUrl(nextUrls[0] || null);
  };

  const publishPhoto = async () => {
    if (!selectedFiles.length || isPublishing) return;
    if (!isApiConfigured) {
      setAppError("Configure a API do Cloudflare no arquivo .env para publicar fotos reais.");
      return;
    }
    setIsPublishing(true);
    setAppError("");
    try {
      const optimized = [];
      for (const file of selectedFiles) optimized.push(await optimizeImage(file));
      const photo = await uploadPhotos(optimized, guestName.trim() || "Convidado", photoMessage.trim());
      setPhotos((prev) => [photo, ...prev]);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      setSelectedFiles([]); setPreviewUrls([]);
      setPhotoMessage("");
      setPreviewUrl(null);
      setScreen("photoConfirm");
    } catch (error) {
      console.error(error);
      setAppError("Não foi possível publicar. Verifique sua internet e tente novamente.");
    } finally {
      setIsPublishing(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !isApiConfigured) return;
    try {
      const message = await postMessage(guestName.trim() || "Convidado", newMessage.trim());
      setMessages((prev) => [...prev, message]);
      setNewMessage("");
    } catch { setAppError("Não foi possível enviar a mensagem."); }
  };

  const copyPixKey = () => {
    navigator.clipboard.writeText(PIX_KEY).catch(() => {});
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2500);
  };

  const goToTab = (tab: Tab) => {
    setActiveTab(tab);
    const map: Record<Tab, Screen> = {
      home: "home",
      gallery: "gallery",
      messages: "messages",
      gift: "gift",
    };
    setScreen(map[tab]);
  };

  const openAddPhoto = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setSelectedFiles([]); setPreviewUrls([]);
    setPhotoMessage("");
    setAppError("");
    setScreen("sendPhoto");
  };

  useEffect(() => {
    if (!isApiConfigured) return;
    const loadContent = async () => {
      try {
        const [photoRows, messageRows] = await getContent();
        setPhotos(photoRows); setMessages(messageRows);
      } catch { setAppError("Não foi possível carregar o conteúdo da festa."); }
    };
    loadContent();
    const interval = window.setInterval(loadContent, 15000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (screen !== "slideshow" || !slideshowPlaying || photos.length === 0) return;
    const id = setTimeout(() => {
      setSlideshowIndex((i) => (i + 1) % photos.length);
    }, 5000);
    return () => clearTimeout(id);
  }, [screen, slideshowIndex, slideshowPlaying, photos.length]);

  if (screen === "admin") {
    return <AdminArea photos={photos} onBack={() => setScreen(adminReturnScreen)} onDeleted={(id) => setPhotos((current) => current.map((post) => ({ ...post, images: (post.images || [{ id: post.id, url: post.url }]).filter((image) => image.id !== id) })).filter((post) => post.images?.length))} onFeed={() => { setGuestName("Tiffany"); setNameInput("Tiffany"); localStorage.setItem("tiffany-guest-name", "Tiffany"); setScreen("home"); }} onPublish={() => { setGuestName("Tiffany"); localStorage.setItem("tiffany-guest-name", "Tiffany"); openAddPhoto(); }} />;
  }

  // ─── WELCOME ───────────────────────────────────────────────────────────────
  if (screen === "welcome") {
    return (
      <div style={BASE}>
        <style>{`
          @keyframes twinkle { 0%,100%{opacity:.15} 50%{opacity:.9} }
          @keyframes floatUp { 0%{transform:translateY(0)} 50%{transform:translateY(-6px)} 100%{transform:translateY(0)} }
          body { background:#04081a; }
        `}</style>
        <div
          style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 32px",
            background:
              "radial-gradient(ellipse 110% 65% at 50% 8%, #163080 0%, #080e32 52%, #04081a 100%)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Stars */}
          {[...Array(16)].map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${((i * 71 + 9) % 95) + 2}%`,
                top: `${((i * 53 + 5) % 88) + 4}%`,
                width: i % 5 === 0 ? 4 : i % 3 === 0 ? 3 : 2,
                height: i % 5 === 0 ? 4 : i % 3 === 0 ? 3 : 2,
                borderRadius: "50%",
                background: i % 4 === 0 ? "#b0ccff" : "#6080b8",
                animation: `twinkle ${1.8 + (i % 4) * 0.6}s ease-in-out infinite`,
                animationDelay: `${(i * 0.22) % 2.2}s`,
              }}
            />
          ))}

          {/* Ornament line */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 44 }}>
            <div
              style={{
                width: 56,
                height: 1,
                background: "linear-gradient(to right, transparent, #5878b0)",
              }}
            />
            <span
              style={{
                color: "#5878b0",
                fontSize: 10,
                letterSpacing: "0.45em",
                fontWeight: 400,
                fontFamily: "Jost, sans-serif",
              }}
            >
              XV ANOS
            </span>
            <div
              style={{
                width: 56,
                height: 1,
                background: "linear-gradient(to left, transparent, #5878b0)",
              }}
            />
          </div>

          {/* Title block */}
          <div
            style={{
              textAlign: "center",
              marginBottom: 16,
              animation: "floatUp 6s ease-in-out infinite",
            }}
          >
            <p
              style={{
                color: "#4a6490",
                fontSize: 13,
                letterSpacing: "0.14em",
                fontWeight: 300,
                marginBottom: 6,
                fontFamily: "Jost, sans-serif",
              }}
            >
              15 anos de
            </p>
            <h1
              style={{
                fontFamily: "Cormorant, serif",
                fontSize: 80,
                fontWeight: 300,
                lineHeight: 0.92,
                letterSpacing: "-0.025em",
                background:
                  "linear-gradient(175deg, #ffffff 0%, #c4d8ff 42%, #7a9cdc 80%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Tiffany
            </h1>
          </div>

          <p
            style={{
              color: "#3d5480",
              fontSize: 13,
              letterSpacing: "0.07em",
              marginBottom: 64,
              textAlign: "center",
              fontWeight: 300,
              fontFamily: "Jost, sans-serif",
            }}
          >
            Álbum coletivo dos convidados
          </p>

          <button
            onClick={() => setScreen("identify")}
            style={{
              width: "100%",
              maxWidth: 310,
              padding: "19px 0",
              borderRadius: 22,
              background: "linear-gradient(135deg, #3b6cf8 0%, #2244d0 100%)",
              color: "#fff",
              fontSize: 16,
              fontFamily: "Jost, sans-serif",
              fontWeight: 500,
              letterSpacing: "0.07em",
              border: "1px solid rgba(180, 210, 255, 0.22)",
              boxShadow: "0 8px 40px rgba(59, 108, 248, 0.5)",
              cursor: "pointer",
            }}
          >
            Entrar na festa
          </button>

          <button
            onClick={() => { setAdminReturnScreen("welcome"); setScreen("admin"); }}
            style={{ marginTop: 18, padding: 8, color: "#58709d", background: "none", border: 0, fontSize: 12, cursor: "pointer" }}
          >
            Área da Tiffany
          </button>

          <div
            style={{
              position: "absolute",
              bottom: 28,
              left: 0,
              right: 0,
              textAlign: "center",
              letterSpacing: "0.9em",
            }}
          >
            <span style={{ color: "#1e2e60", fontSize: 16 }}>✦ ✦ ✦</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── IDENTIFY ──────────────────────────────────────────────────────────────
  if (screen === "identify") {
    return (
      <div style={BASE}>
        <div
          style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            padding: "0 24px",
          }}
        >
          <div style={{ paddingTop: 48, display: "flex", alignItems: "center", gap: 14 }}>
            <button
              onClick={() => setScreen("welcome")}
              style={{ color: C.textMuted, cursor: "pointer", background: "none", border: "none" }}
            >
              <ArrowLeft size={24} />
            </button>
            <p style={{ color: "#7897cf", fontFamily: "Cormorant, serif", fontSize: 18, lineHeight: 1.25, fontStyle: "italic" }}>
              Olhando a festa pelos olhos de quem viveu esse momento com ela ✨
            </p>
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              paddingBottom: 48,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                background: "rgba(20, 36, 100, 0.6)",
                border: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 28,
              }}
            >
              <Star size={28} color={C.accent} />
            </div>

            <h1
              style={{
                fontFamily: "Cormorant, serif",
                fontSize: 36,
                fontWeight: 400,
                color: C.text,
                marginBottom: 8,
                lineHeight: 1.2,
              }}
            >
              Como posso te chamar?
            </h1>
            <p
              style={{
                color: C.textSub,
                fontSize: 14,
                marginBottom: 40,
                lineHeight: 1.6,
                fontFamily: "Jost, sans-serif",
              }}
            >
              Seu nome vai aparecer nas fotos e mensagens
            </p>

            <input
              type="text"
              placeholder="Seu nome"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && nameInput.trim()) {
                  setGuestName(nameInput.trim());
                  localStorage.setItem("tiffany-guest-name", nameInput.trim());
                  setScreen("home");
                }
              }}
              autoFocus
              style={{
                width: "100%",
                background: "rgba(20, 36, 100, 0.4)",
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                padding: "18px 20px",
                color: C.text,
                fontSize: 18,
                fontFamily: "Jost, sans-serif",
                outline: "none",
                marginBottom: 16,
                boxSizing: "border-box",
              }}
            />

            <button
              onClick={() => {
                if (nameInput.trim()) {
                  setGuestName(nameInput.trim());
                  localStorage.setItem("tiffany-guest-name", nameInput.trim());
                  setScreen("home");
                }
              }}
              disabled={!nameInput.trim()}
              style={{
                width: "100%",
                padding: "18px 0",
                borderRadius: 18,
                background: nameInput.trim()
                  ? "linear-gradient(135deg, #3b6cf8, #2244d0)"
                  : "rgba(30, 50, 120, 0.25)",
                color: nameInput.trim() ? "#fff" : C.textMuted,
                fontSize: 16,
                fontFamily: "Jost, sans-serif",
                fontWeight: 500,
                letterSpacing: "0.05em",
                border: `1px solid ${nameInput.trim() ? "rgba(160, 200, 255, 0.2)" : C.borderFaint}`,
                boxShadow: nameInput.trim() ? "0 8px 28px rgba(59, 108, 248, 0.38)" : "none",
                cursor: nameInput.trim() ? "pointer" : "default",
                transition: "all 0.2s",
              }}
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── HOME ──────────────────────────────────────────────────────────────────
  if (screen === "home") {
    return (
      <div style={{ ...BASE, paddingBottom: 90 }}>
        {/* Header */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(4, 8, 26, 0.96)",
            backdropFilter: "blur(16px)",
            borderBottom: `1px solid ${C.borderFaint}`,
          }}
        >
          <div>
            <p
              style={{
                color: C.textMuted,
                fontSize: 10,
                letterSpacing: "0.18em",
                fontWeight: 500,
                marginBottom: 1,
              }}
            >
              XV ANOS
            </p>
            <h2
              style={{
                fontFamily: "Cormorant, serif",
                fontSize: 22,
                fontWeight: 400,
                color: C.text,
                lineHeight: 1.1,
              }}
            >
              Olá, {guestName || "Convidado"}!
            </h2>
          </div>
          <button onClick={() => { setAdminReturnScreen("home"); setScreen("admin"); }} style={{ marginLeft: "auto", marginRight: 8, padding: "8px 10px", borderRadius: 11, border: `1px solid ${C.border}`, background: "rgba(20,40,110,.35)", color: "#7090b8", fontSize: 11, cursor: "pointer" }}>
            Tiffany
          </button>
          <button
            onClick={() => {
              setSlideshowIndex(0);
              setSlideshowPlaying(true);
              setScreen("slideshow");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 14px",
              borderRadius: 12,
              background: "rgba(20, 40, 110, 0.5)",
              border: `1px solid ${C.border}`,
              color: "#7090b8",
              fontSize: 12,
              fontFamily: "Jost, sans-serif",
              cursor: "pointer",
            }}
          >
            <Play size={13} />
            <span>Slideshow</span>
          </button>
        </div>

        {/* Add photo CTA */}
        <div style={{ padding: "20px 20px 8px" }}>
          <button
            onClick={openAddPhoto}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "16px 20px",
              borderRadius: 20,
              background:
                "linear-gradient(135deg, rgba(59, 108, 248, 0.13), rgba(41, 82, 240, 0.06))",
              border: "1px solid rgba(80, 120, 255, 0.28)",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "linear-gradient(135deg, #3b6cf8, #2244d0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 4px 20px rgba(59, 108, 248, 0.45)",
              }}
            >
              <Camera size={22} color="#fff" />
            </div>
            <div style={{ textAlign: "left" }}>
              <p style={{ color: C.text, fontSize: 15, fontWeight: 500 }}>📸 Compartilhar foto</p>
              <p style={{ color: C.textSub, fontSize: 13, marginTop: 2 }}>
                Mostre seu momento para Tiffany
              </p>
            </div>
          </button>
        </div>

        {/* Feed */}
        <div style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: 20 }}>
          <p
            style={{
              color: C.textMuted,
              fontSize: 10,
              letterSpacing: "0.14em",
              fontWeight: 500,
            }}
          >
            {photos.length} FOTOS COMPARTILHADAS
          </p>

          {photos.map((photo, index) => <PhotoPost key={photo.id} post={photo} guestName={guestName} guestKey={guestKey} onOpen={() => { setSelectedPhotoIndex(index); setFullImageIndex(0); setScreen("fullPhoto"); }} onChange={(updated) => setPhotos((current) => current.map((item) => item.id === updated.id ? updated : item))} />)}
        </div>

        <BottomNav activeTab={activeTab} onTabChange={goToTab} onAddPhoto={openAddPhoto} />
      </div>
    );
  }

  // ─── SEND PHOTO ────────────────────────────────────────────────────────────
  if (screen === "sendPhoto") {
    return (
      <div style={BASE}>
        <div
          style={{
            padding: "52px 20px 20px",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <button
            onClick={() => {
              setScreen("home");
              setPreviewUrl(null);
              setPhotoMessage("");
            }}
            style={{ color: C.textMuted, cursor: "pointer", background: "none", border: "none" }}
          >
            <ArrowLeft size={24} />
          </button>
          <h2
            style={{
              fontFamily: "Cormorant, serif",
              fontSize: 28,
              fontWeight: 400,
              color: C.text,
            }}
          >
            Compartilhar foto
          </h2>
        </div>

        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 16 }}>
          {!previewUrl ? (
            <>
              <p style={{ color: C.textSub, fontSize: 14, fontFamily: "Jost, sans-serif" }}>
                Como você quer adicionar sua foto?
              </p>

              <button
                onClick={openCamera}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  padding: "22px 24px",
                  borderRadius: 22,
                  background: "rgba(20, 36, 100, 0.4)",
                  border: `1px solid ${C.border}`,
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 18,
                    background: "linear-gradient(135deg, #3b6cf8, #2244d0)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "0 4px 20px rgba(59, 108, 248, 0.45)",
                  }}
                >
                  <Camera size={26} color="#fff" />
                </div>
                <div>
                  <p
                    style={{
                      color: C.text,
                      fontSize: 17,
                      fontWeight: 500,
                      fontFamily: "Jost, sans-serif",
                    }}
                  >
                    Tirar foto
                  </p>
                  <p style={{ color: C.textSub, fontSize: 13, marginTop: 3 }}>
                    Abre a câmera do celular
                  </p>
                </div>
              </button>

              <button
                onClick={openGallery}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  padding: "22px 24px",
                  borderRadius: 22,
                  background: "rgba(20, 36, 100, 0.4)",
                  border: `1px solid ${C.border}`,
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 18,
                    background: "rgba(16, 32, 100, 0.7)",
                    border: `1px solid ${C.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <ImageIcon size={26} color={C.accent} />
                </div>
                <div>
                  <p
                    style={{
                      color: C.text,
                      fontSize: 17,
                      fontWeight: 500,
                      fontFamily: "Jost, sans-serif",
                    }}
                  >
                    Escolher da galeria
                  </p>
                  <p style={{ color: C.textSub, fontSize: 13, marginTop: 3 }}>
                    Selecione até 10 fotos salvas
                  </p>
                </div>
              </button>
              <button onClick={() => setScreen("home")} style={{ width: "100%", padding: "14px", borderRadius: 16, border: `1px solid ${C.border}`, background: "transparent", color: C.textSub, cursor: "pointer" }}>
                Voltar para o início
              </button>
              {appError && <p role="alert" style={{ color: "#ff9aa8", fontSize: 13, textAlign: "center", margin: 0 }}>{appError}</p>}
            </>
          ) : (
            <>
              <div
                style={{
                  position: "relative",
                  borderRadius: 20,
                  overflow: "hidden",
                  height: 320,
                  background: "#050820",
                }}
              >
                <img
                  src={previewUrl}
                  alt="Preview da foto"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <button
                  onClick={() => {
                    const index = previewUrls.indexOf(previewUrl);
                    removeSelectedImage(index < 0 ? 0 : index);
                  }}
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "rgba(4, 8, 26, 0.82)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    border: "none",
                  }}
                >
                  <X size={18} color="#fff" />
                </button>
              </div>

              {previewUrls.length > 1 && <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                {previewUrls.map((url, index) => <button key={url} onClick={() => setPreviewUrl(url)} style={{ width: 66, height: 66, flex: "0 0 auto", padding: 0, borderRadius: 12, overflow: "hidden", border: previewUrl === url ? "2px solid #6b9aff" : "2px solid transparent", background: "none", cursor: "pointer" }}><img src={url} alt={`Foto ${index + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></button>)}
              </div>}
              <p style={{ color: C.textMuted, fontSize: 12, textAlign: "center" }}>{selectedFiles.length} {selectedFiles.length === 1 ? "foto selecionada" : "fotos selecionadas"}</p>

              <div>
                <label
                  style={{
                    color: C.textMuted,
                    fontSize: 10,
                    letterSpacing: "0.14em",
                    fontWeight: 500,
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  MENSAGEM OPCIONAL
                </label>
                <textarea
                  placeholder="Escreva algo para a Tiffany..."
                  value={photoMessage}
                  onChange={(e) => setPhotoMessage(e.target.value)}
                  rows={3}
                  style={{
                    width: "100%",
                    background: "rgba(20, 36, 100, 0.4)",
                    border: `1px solid ${C.border}`,
                    borderRadius: 16,
                    padding: "14px 16px",
                    color: C.text,
                    fontSize: 15,
                    fontFamily: "Jost, sans-serif",
                    resize: "none",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <button
                onClick={publishPhoto}
                disabled={isPublishing}
                style={{
                  width: "100%",
                  padding: "18px 0",
                  borderRadius: 20,
                  background: "linear-gradient(135deg, #3b6cf8, #2244d0)",
                  color: "#fff",
                  fontSize: 16,
                  fontFamily: "Jost, sans-serif",
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  border: "1px solid rgba(160, 200, 255, 0.2)",
                  boxShadow: "0 8px 32px rgba(59, 108, 248, 0.45)",
                  cursor: isPublishing ? "wait" : "pointer",
                  opacity: isPublishing ? 0.7 : 1,
                }}
              >
                {isPublishing ? "Publicando..." : "Publicar foto"}
              </button>
              {appError && <p role="alert" style={{ color: "#ff9aa8", fontSize: 13, textAlign: "center" }}>{appError}</p>}
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── PHOTO CONFIRM ─────────────────────────────────────────────────────────
  if (screen === "photoConfirm") {
    return (
      <div style={BASE}>
        <div
          style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 32px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #2244d0, #3b6cf8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 32,
              boxShadow: "0 0 70px rgba(59, 108, 248, 0.65)",
            }}
          >
            <Check size={46} color="#fff" />
          </div>

          <h1
            style={{
              fontFamily: "Cormorant, serif",
              fontSize: 44,
              fontWeight: 400,
              color: C.text,
              marginBottom: 12,
              lineHeight: 1.1,
            }}
          >
            Foto publicada! 🎉
          </h1>
          <p
            style={{
              color: C.textSub,
              fontSize: 16,
              lineHeight: 1.65,
              marginBottom: 52,
              fontFamily: "Jost, sans-serif",
            }}
          >
            Obrigado por compartilhar esse momento especial com a Tiffany!
          </p>

          <button
            onClick={() => {
              setScreen("home");
              setActiveTab("home");
            }}
            style={{
              width: "100%",
              maxWidth: 290,
              padding: "18px 0",
              borderRadius: 20,
              background: "linear-gradient(135deg, #3b6cf8, #2244d0)",
              color: "#fff",
              fontSize: 16,
              fontFamily: "Jost, sans-serif",
              fontWeight: 500,
              border: "1px solid rgba(160, 200, 255, 0.2)",
              boxShadow: "0 8px 32px rgba(59, 108, 248, 0.45)",
              cursor: "pointer",
              marginBottom: 16,
            }}
          >
            Ver no feed
          </button>

          <button
            onClick={openAddPhoto}
            style={{
              color: C.accent,
              fontSize: 15,
              fontFamily: "Jost, sans-serif",
              cursor: "pointer",
              background: "none",
              border: "none",
            }}
          >
            Publicar outra foto
          </button>
        </div>
      </div>
    );
  }

  // ─── GALLERY ───────────────────────────────────────────────────────────────
  if (screen === "gallery") {
    return (
      <div style={{ ...BASE, paddingBottom: 90 }}>
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(4, 8, 26, 0.96)",
            backdropFilter: "blur(16px)",
            borderBottom: `1px solid ${C.borderFaint}`,
          }}
        >
          <h2
            style={{ fontFamily: "Cormorant, serif", fontSize: 26, fontWeight: 400, color: C.text }}
          >
            Galeria
          </h2>
          <button
            onClick={() => {
              setSlideshowIndex(0);
              setSlideshowPlaying(true);
              setScreen("slideshow");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 14px",
              borderRadius: 12,
              background: "rgba(20, 40, 110, 0.5)",
              border: `1px solid ${C.border}`,
              color: "#7090b8",
              fontSize: 12,
              fontFamily: "Jost, sans-serif",
              cursor: "pointer",
            }}
          >
            <Play size={13} />
            <span>Slideshow</span>
          </button>
        </div>

        <div style={{ padding: "16px" }}>
          <p
            style={{
              color: C.textMuted,
              fontSize: 10,
              letterSpacing: "0.14em",
              marginBottom: 14,
            }}
          >
            {photos.length} FOTOS
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => {
                  setSelectedPhotoIndex(index);
                  setFullImageIndex(0);
                  setScreen("fullPhoto");
                }}
                style={{
                  position: "relative",
                  aspectRatio: "1",
                  borderRadius: 20,
                  overflow: "hidden",
                  background: C.card,
                  cursor: "pointer",
                  border: "none",
                  padding: 0,
                }}
              >
                <img
                  src={photo.url}
                  alt={`Foto de ${photo.guestName}`}
                  loading="lazy"
                  decoding="async"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "24px 10px 8px",
                    background: "linear-gradient(to top, rgba(4, 8, 26, 0.88), transparent)",
                  }}
                >
                  <p
                    style={{
                      color: "#c0d4ff",
                      fontSize: 11,
                      fontWeight: 500,
                      textAlign: "left",
                      fontFamily: "Jost, sans-serif",
                    }}
                  >
                    {photo.guestName}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <BottomNav activeTab={activeTab} onTabChange={goToTab} onAddPhoto={openAddPhoto} />
      </div>
    );
  }

  // ─── FULL PHOTO ────────────────────────────────────────────────────────────
  if (screen === "fullPhoto") {
    const photo = photos[selectedPhotoIndex];
    if (!photo) return null;
    const fullImages = photo.images?.length ? photo.images : [{ id: photo.id, url: photo.url }];
    return (
      <div style={{ ...BASE, background: "#000" }}>
        <style>{`
          @keyframes imgFadeIn { from{opacity:0} to{opacity:1} }
        `}</style>
        <div
          style={{
            position: "relative",
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <button
            onClick={() => setScreen("gallery")}
            style={{
              position: "absolute",
              top: 48,
              right: 16,
              zIndex: 20,
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              border: "none",
            }}
          >
            <X size={20} color="#fff" />
          </button>

          {fullImageIndex > 0 && (
            <button
              onClick={() => setFullImageIndex((i) => i - 1)}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 20,
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                border: "none",
              }}
            >
              <ChevronLeft size={20} color="#fff" />
            </button>
          )}
          {fullImageIndex < fullImages.length - 1 && (
            <button
              onClick={() => setFullImageIndex((i) => i + 1)}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 20,
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                border: "none",
              }}
            >
              <ChevronRight size={20} color="#fff" />
            </button>
          )}

          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img
              key={`${selectedPhotoIndex}-${fullImageIndex}`}
              src={fullImages[fullImageIndex].url}
              alt={`Foto de ${photo.guestName}`}
              style={{
                width: "100%",
                objectFit: "contain",
                maxHeight: "74dvh",
                animation: "imgFadeIn 0.25s ease",
              }}
            />
          </div>

          <div style={{ padding: "18px 24px 40px", background: "rgba(4, 8, 26, 0.94)" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: photo.message ? 10 : 0,
              }}
            >
              <Avatar name={photo.guestName} size="sm" />
              <div>
                <p style={{ color: C.text, fontSize: 15, fontWeight: 500 }}>{photo.guestName}</p>
                <p style={{ color: C.textMuted, fontSize: 12 }}>{photo.time}</p>
              </div>
            </div>
            {photo.message && (
              <p style={{ color: "#8099cc", fontSize: 14, lineHeight: 1.55 }}>{photo.message}</p>
            )}
            <p style={{ color: C.textMuted, fontSize: 12, marginTop: 10 }}>
              {fullImageIndex + 1} de {fullImages.length} nesta publicação
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── MESSAGES ──────────────────────────────────────────────────────────────
  if (screen === "messages") {
    return (
      <div style={{ ...BASE, paddingBottom: 200 }}>
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            padding: "16px 20px 12px",
            background: "rgba(4, 8, 26, 0.96)",
            backdropFilter: "blur(16px)",
            borderBottom: `1px solid ${C.borderFaint}`,
          }}
        >
          <p style={{ color: C.textMuted, fontSize: 10, letterSpacing: "0.18em", fontWeight: 500 }}>
            DESEJOS E MENSAGENS
          </p>
          <h2
            style={{ fontFamily: "Cormorant, serif", fontSize: 26, fontWeight: 400, color: C.text }}
          >
            Para a Tiffany
          </h2>
        </div>

        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                padding: "18px 20px",
                borderRadius: 20,
                background: C.card,
                border: `1px solid ${C.borderFaint}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <Avatar name={msg.guestName} size="sm" />
                <div>
                  <p style={{ color: C.text, fontSize: 14, fontWeight: 500 }}>{msg.guestName}</p>
                  <p style={{ color: C.textMuted, fontSize: 12 }}>{msg.time}</p>
                </div>
              </div>
              <p style={{ color: "#b0c4f0", fontSize: 15, lineHeight: 1.7 }}>{msg.text}</p>
            </div>
          ))}
        </div>

        {/* Compose — above bottom nav */}
        <div
          style={{
            position: "fixed",
            bottom: 76,
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            maxWidth: "430px",
            padding: "12px 16px 14px",
            background: "rgba(4, 8, 26, 0.98)",
            backdropFilter: "blur(16px)",
            borderTop: `1px solid ${C.borderFaint}`,
            zIndex: 40,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", gap: 10 }}>
            <textarea
              placeholder="Escreva uma mensagem para a Tiffany..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={2}
              style={{
                flex: 1,
                background: "rgba(20, 36, 100, 0.5)",
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                padding: "12px 14px",
                color: C.text,
                fontSize: 14,
                fontFamily: "Jost, sans-serif",
                resize: "none",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: newMessage.trim()
                  ? "linear-gradient(135deg, #3b6cf8, #2244d0)"
                  : "rgba(30, 50, 120, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                alignSelf: "flex-end",
                cursor: newMessage.trim() ? "pointer" : "default",
                border: "none",
                boxShadow: newMessage.trim() ? "0 4px 16px rgba(59, 108, 248, 0.38)" : "none",
                transition: "all 0.2s",
              }}
            >
              <Send size={18} color={newMessage.trim() ? "#fff" : C.textMuted} />
            </button>
          </div>
        </div>

        <BottomNav activeTab={activeTab} onTabChange={goToTab} onAddPhoto={openAddPhoto} />
      </div>
    );
  }

  // ─── GIFT ──────────────────────────────────────────────────────────────────
  if (screen === "gift") {
    const qrData = encodeURIComponent(PIX_KEY);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}&format=png&bgcolor=0a1035&color=6b9aff&margin=14`;

    return (
      <div style={{ ...BASE, paddingBottom: 90 }}>
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            padding: "16px 20px 12px",
            background: "rgba(4, 8, 26, 0.96)",
            backdropFilter: "blur(16px)",
            borderBottom: `1px solid ${C.borderFaint}`,
          }}
        >
          <p style={{ color: C.textMuted, fontSize: 10, letterSpacing: "0.18em", fontWeight: 500 }}>
            CONTRIBUIÇÃO
          </p>
          <h2
            style={{ fontFamily: "Cormorant, serif", fontSize: 26, fontWeight: 400, color: C.text }}
          >
            Presente via PIX
          </h2>
        </div>

        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Amount selector */}
          <div>
            <p
              style={{
                color: C.textMuted,
                fontSize: 10,
                letterSpacing: "0.14em",
                marginBottom: 12,
              }}
            >
              ESCOLHA O VALOR (R$)
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 1fr",
                gap: 8,
                marginBottom: 12,
              }}
            >
              {PIX_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => {
                    setSelectedAmount(amount);
                    setCustomAmount("");
                  }}
                  style={{
                    padding: "15px 0",
                    borderRadius: 14,
                    background:
                      selectedAmount === amount
                        ? "linear-gradient(135deg, #3b6cf8, #2244d0)"
                        : "rgba(20, 36, 100, 0.4)",
                    border: `1px solid ${selectedAmount === amount ? "rgba(160, 200, 255, 0.3)" : C.border}`,
                    color: selectedAmount === amount ? "#fff" : C.textSub,
                    fontSize: 15,
                    fontFamily: "Jost, sans-serif",
                    fontWeight: 500,
                    cursor: "pointer",
                    boxShadow:
                      selectedAmount === amount
                        ? "0 4px 18px rgba(59, 108, 248, 0.38)"
                        : "none",
                    transition: "all 0.2s",
                  }}
                >
                  {amount}
                </button>
              ))}
            </div>
            <input
              type="number"
              placeholder="Outro valor (R$)"
              value={customAmount}
              onFocus={() => setSelectedAmount(null)}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedAmount(null);
              }}
              style={{
                width: "100%",
                background: "rgba(20, 36, 100, 0.4)",
                border: `1px solid ${selectedAmount === null && customAmount ? "rgba(107, 154, 255, 0.5)" : C.border}`,
                borderRadius: 14,
                padding: "14px 16px",
                color: C.text,
                fontSize: 15,
                fontFamily: "Jost, sans-serif",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* QR Code */}
          <div
            style={{
              borderRadius: 22,
              padding: "24px",
              background: C.card,
              border: `1px solid ${C.border}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <p
              style={{
                color: C.textMuted,
                fontSize: 10,
                letterSpacing: "0.18em",
                marginBottom: 18,
              }}
            >
              QR CODE PIX
            </p>
            <div
              style={{
                borderRadius: 16,
                overflow: "hidden",
                padding: 12,
                background: "#0a1035",
                border: `1px solid ${C.border}`,
              }}
            >
              <img
                src={qrUrl}
                alt="QR Code para pagamento PIX"
                width={176}
                height={176}
                style={{ display: "block" }}
              />
            </div>
            <p style={{ color: C.textSub, fontSize: 13, marginTop: 16, textAlign: "center" }}>
              Escaneie com o app do seu banco
            </p>
            {(selectedAmount || customAmount) && (
              <div
                style={{
                  marginTop: 12,
                  padding: "8px 20px",
                  borderRadius: 20,
                  background: "rgba(59, 108, 248, 0.15)",
                  border: `1px solid ${C.border}`,
                }}
              >
                <p style={{ color: C.accent, fontSize: 14, fontWeight: 500 }}>
                  Valor: R$ {selectedAmount ?? customAmount}
                </p>
              </div>
            )}
          </div>

          {/* PIX Key */}
          <div
            style={{
              borderRadius: 18,
              padding: "18px 20px",
              background: C.card,
              border: `1px solid ${C.borderFaint}`,
            }}
          >
            <p
              style={{
                color: C.textMuted,
                fontSize: 10,
                letterSpacing: "0.14em",
                marginBottom: 10,
              }}
            >
              OU COPIE A CHAVE PIX
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <p
                style={{
                  flex: 1,
                  color: "#b0c4f0",
                  fontSize: 14,
                  fontFamily: "monospace",
                  wordBreak: "break-all",
                  lineHeight: 1.5,
                }}
              >
                {PIX_KEY}
              </p>
              <button
                onClick={copyPixKey}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: pixCopied
                    ? "rgba(40, 180, 100, 0.18)"
                    : "rgba(30, 50, 120, 0.6)",
                  border: `1px solid ${pixCopied ? "rgba(40, 200, 100, 0.4)" : C.border}`,
                  color: pixCopied ? "#60cc80" : "#8099cc",
                  fontSize: 13,
                  fontFamily: "Jost, sans-serif",
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "all 0.2s",
                }}
              >
                {pixCopied ? <Check size={14} /> : <Copy size={14} />}
                <span>{pixCopied ? "Copiado!" : "Copiar"}</span>
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div
            style={{
              borderRadius: 16,
              padding: "16px 20px",
              background: "rgba(20, 40, 100, 0.15)",
              border: `1px solid ${C.borderFaint}`,
            }}
          >
            <p
              style={{
                color: C.textSub,
                fontSize: 13,
                lineHeight: 1.7,
                fontFamily: "Jost, sans-serif",
              }}
            >
              💡 <strong style={{ color: "#8099cc" }}>Como contribuir:</strong> Abra o app do
              seu banco, acesse o PIX, escaneie o QR Code ou cole a chave acima e informe o valor
              desejado. Confirme e pronto!
            </p>
          </div>
        </div>

        <BottomNav activeTab={activeTab} onTabChange={goToTab} onAddPhoto={openAddPhoto} />
      </div>
    );
  }

  // ─── SLIDESHOW ─────────────────────────────────────────────────────────────
  if (screen === "slideshow") {
    if (photos.length === 0) {
      return (
        <div style={{ ...BASE, background: "#000" }}>
          <div
            style={{
              minHeight: "100dvh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <p style={{ color: C.textSub }}>Nenhuma foto ainda.</p>
            <button
              onClick={() => setScreen("home")}
              style={{ color: C.accent, cursor: "pointer", background: "none", border: "none", fontSize: 15 }}
            >
              Voltar
            </button>
          </div>
        </div>
      );
    }

    const ssPhoto = photos[slideshowIndex % photos.length];

    return (
      <div style={{ ...BASE, background: "#000" }}>
        <style>{`
          @keyframes kenBurns {
            0%   { transform: scale(1) translate(0,0); }
            100% { transform: scale(1.09) translate(-1%,-1%); }
          }
          @keyframes ssIn { from{opacity:0} to{opacity:1} }
        `}</style>

        <div
          style={{
            position: "relative",
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Animated background */}
          <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
            <img
              key={slideshowIndex}
              src={ssPhoto.url}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                animation: slideshowPlaying ? "kenBurns 5.2s ease-out forwards" : "none",
                willChange: "transform",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to top, rgba(4,8,26,0.94) 0%, rgba(4,8,26,0.38) 52%, rgba(4,8,26,0.62) 100%)",
              }}
            />
          </div>

          {/* Top bar */}
          <div
            style={{
              position: "relative",
              zIndex: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "48px 20px 16px",
            }}
          >
            <span
              style={{
                fontFamily: "Cormorant, serif",
                fontSize: 19,
                color: "rgba(255,255,255,0.65)",
                fontWeight: 300,
                letterSpacing: "0.04em",
              }}
            >
              15 anos da Tiffany
            </span>
            <button
              onClick={() => setScreen("home")}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.55)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                border: "none",
              }}
            >
              <X size={16} color="#fff" />
            </button>
          </div>

          <div style={{ flex: 1 }} />

          {/* Bottom content */}
          <div
            style={{
              position: "relative",
              zIndex: 10,
              padding: "0 24px 36px",
              animation: "ssIn 0.4s ease",
            }}
          >
            {ssPhoto.message && (
              <p
                style={{
                  fontFamily: "Cormorant, serif",
                  fontSize: 26,
                  fontWeight: 300,
                  fontStyle: "italic",
                  color: "#fff",
                  marginBottom: 20,
                  lineHeight: 1.45,
                  textShadow: "0 2px 16px rgba(0,0,0,0.7)",
                }}
              >
                &ldquo;{ssPhoto.message}&rdquo;
              </p>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
              <Avatar name={ssPhoto.guestName} size="sm" />
              <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 15, fontWeight: 500 }}>
                {ssPhoto.guestName}
              </p>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>{ssPhoto.time}</p>
            </div>

            {/* Progress dots */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlideshowIndex(i)}
                  style={{
                    width: i === slideshowIndex % photos.length ? 26 : 6,
                    height: 6,
                    borderRadius: 3,
                    background:
                      i === slideshowIndex % photos.length
                        ? C.accent
                        : "rgba(255,255,255,0.22)",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.35s ease",
                    padding: 0,
                  }}
                />
              ))}
            </div>

            {/* Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                onClick={() =>
                  setSlideshowIndex((i) => (i - 1 + photos.length) % photos.length)
                }
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <ChevronLeft size={22} color="#fff" />
              </button>

              <button
                onClick={() => setSlideshowPlaying((p) => !p)}
                style={{
                  flex: 1,
                  padding: "14px 0",
                  borderRadius: 18,
                  background: "rgba(59, 108, 248, 0.5)",
                  border: "1px solid rgba(80, 120, 255, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  cursor: "pointer",
                }}
              >
                {slideshowPlaying ? (
                  <Pause size={18} color="#fff" />
                ) : (
                  <Play size={18} color="#fff" />
                )}
                <span style={{ color: "#fff", fontSize: 14, fontFamily: "Jost, sans-serif" }}>
                  {slideshowPlaying ? "Pausar" : "Reproduzir"}
                </span>
              </button>

              <button
                onClick={() => setSlideshowIndex((i) => (i + 1) % photos.length)}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <ChevronRight size={22} color="#fff" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
