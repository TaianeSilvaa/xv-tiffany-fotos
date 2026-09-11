import { useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight, MessageCircle, Send } from "lucide-react";
import { commentOnPost, reactToPost, type ApiPhoto } from "../lib/api";

const EMOJIS = ["💙", "😍", "🎉", "🥹", "✨"];

interface Props {
  post: ApiPhoto;
  guestName: string;
  guestKey: string;
  onChange: (post: ApiPhoto) => void;
  onOpen: (index: number) => void;
}

export default function PhotoPost({ post, guestName, guestKey, onChange, onOpen }: Props) {
  const images = post.images?.length ? post.images : [{ id: post.id, url: post.url }];
  const [index, setIndex] = useState(() => {
    const key = `tiffany-carousel-${post.id}`;
    const previous = Number(sessionStorage.getItem(key) ?? -1);
    const next = (previous + 1) % images.length;
    sessionStorage.setItem(key, String(next));
    return next;
  });
  const [expanded, setExpanded] = useState(false);
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [busy, setBusy] = useState(false);


  const react = async (emoji: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await reactToPost(post.id, guestKey, emoji);
      onChange({ ...post, reactions: result.reactions, myReaction: result.myReaction });
    } finally { setBusy(false); }
  };

  const sendComment = async () => {
    if (!comment.trim() || busy) return;
    setBusy(true);
    try {
      const created = await commentOnPost(post.id, guestName || "Convidado", comment.trim());
      onChange({ ...post, comments: [...(post.comments || []), created] });
      setComment(""); setShowComments(true);
    } finally { setBusy(false); }
  };

  return <article style={{ borderRadius: 24, overflow: "hidden", background: "#0a1035", border: "1px solid rgba(80,120,255,.1)" }}>
    <div style={{ position: "relative" }}>
      <img onClick={() => onOpen(index)} src={images[index].url} alt={`Foto de ${post.guestName}`} loading="lazy" decoding="async" style={{ width: "100%", height: 330, objectFit: "contain", display: "block", cursor: "pointer" }} />
      {images.length > 1 && <>
        {index > 0 && <button onClick={() => setIndex(index - 1)} aria-label="Foto anterior" style={navStyle("left")}><ChevronLeft size={20} /></button>}
        {index < images.length - 1 && <button onClick={() => setIndex(index + 1)} aria-label="Próxima foto" style={navStyle("right")}><ChevronRight size={20} /></button>}
        <span style={{ position: "absolute", top: 12, right: 12, padding: "5px 9px", borderRadius: 12, background: "rgba(4,8,26,.75)", color: "white", fontSize: 11 }}>{index + 1}/{images.length}</span>
        <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 5 }}>{images.map((_, i) => <span key={i} style={{ width: i === index ? 16 : 5, height: 5, borderRadius: 5, background: i === index ? "white" : "rgba(255,255,255,.5)", transition: "width .2s" }} />)}</div>
      </>}
    </div>
    <div style={{ padding: "14px 16px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}><strong style={{ fontSize: 14 }}>{post.guestName}</strong><small style={{ color: "#3a507a" }}>{post.time}</small></div>
      {post.message && <p style={{ color: "#8099cc", fontSize: 13, lineHeight: 1.55, margin: "6px 0 10px", overflowWrap: "anywhere" }}>{expanded || post.message.length <= 160 ? post.message : `${post.message.slice(0, 160)}…`}{post.message.length > 160 && <button onClick={() => setExpanded(!expanded)} style={{ background: "none", border: 0, color: "#9bbaff", cursor: "pointer", marginLeft: 6 }}>{expanded ? "Ver menos" : "Ver mais"}</button>}</p>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
        {EMOJIS.map((emoji) => <button key={emoji} onClick={() => react(emoji)} disabled={busy} style={{ padding: "6px 9px", borderRadius: 14, border: post.myReaction === emoji ? "1px solid #6b9aff" : "1px solid rgba(80,120,255,.18)", background: post.myReaction === emoji ? "rgba(59,108,248,.25)" : "rgba(10,20,60,.55)", color: "white", cursor: "pointer" }}>{emoji}{post.reactions?.[emoji] ? ` ${post.reactions[emoji]}` : ""}</button>)}
        <button onClick={() => setShowComments(!showComments)} style={{ marginLeft: "auto", border: 0, background: "none", color: "#7090c0", cursor: "pointer" }}><MessageCircle size={16} /> {post.comments?.length || 0}</button>
      </div>
      {showComments && <div style={{ marginTop: 12, borderTop: "1px solid rgba(80,120,255,.12)", paddingTop: 10 }}>
        {(post.comments || []).map((item) => <p key={item.id} style={{ fontSize: 12, color: "#a9bde8", margin: "7px 0" }}><strong style={{ color: "#dbe5ff" }}>{item.guestName}:</strong> {item.text}</p>)}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}><input value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendComment()} maxLength={500} placeholder="Comentar..." style={{ flex: 1, minWidth: 0, borderRadius: 12, border: "1px solid rgba(80,120,255,.2)", background: "#101c50", color: "white", padding: "10px 12px" }} /><button onClick={sendComment} disabled={!comment.trim() || busy} aria-label="Enviar comentário" style={{ display: "grid", placeItems: "center", flexShrink: 0, padding: 0, width: 40, borderRadius: 12, border: 0, background: "#315de8", color: "white" }}><Send size={16} /></button></div>
      </div>}
    </div>
  </article>;
}

function navStyle(side: "left" | "right"): CSSProperties {
  return { position: "absolute", [side]: 10, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: "50%", border: 0, background: "rgba(4,8,26,.7)", color: "white", display: "grid", placeItems: "center", cursor: "pointer" };
}
