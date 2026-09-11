import { useMemo, useState, type CSSProperties } from "react";
import JSZip from "jszip";
import { ArrowLeft, Camera, Check, Download, Images, LockKeyhole, Trash2 } from "lucide-react";
import { adminLogin, deletePhoto, type ApiPhoto } from "../lib/api";

interface Props { onLogout: () => void; photos: ApiPhoto[]; onBack: () => void; onDeleted: (id: string) => void; onFeed: () => void; onPublish: () => void }
interface FlatImage { id: string; url: string; guestName: string }

export default function AdminArea({ photos, onLogout, onBack, onDeleted, onFeed, onPublish }: Props) {
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(() => sessionStorage.getItem("tiffany-admin-token") || "");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const images = useMemo<FlatImage[]>(() => photos.flatMap((post) => (post.images?.length ? post.images : [{ id: post.id, url: post.url }]).map((image) => ({ ...image, guestName: post.guestName }))), [photos]);
  const batches = Math.max(1, Math.ceil(images.length / 100));

  const login = async () => { setBusy("login"); setError(""); try { const result = await adminLogin(password); sessionStorage.setItem("tiffany-admin-token", result.token); setToken(result.token); setPassword(""); } catch (e) { setError(e instanceof Error ? e.message : "Senha incorreta."); } finally { setBusy(""); } };

  const buildZip = async (items: FlatImage[], name: string) => {
    if (!items.length) return;
    setBusy("zip"); setError("");
    try {
      const zip = new JSZip();
      await Promise.all(items.map(async (image, index) => {
        const response = await fetch(image.url);
        if (!response.ok) throw new Error("Falha ao baixar uma das fotos.");
        const safe = image.guestName.replace(/[^a-z0-9áàâãéêíóôõúç_-]/gi, "-");
        zip.file(`${String(index + 1).padStart(3, "0")}-${safe}.webp`, await response.blob());
      }));
      const link = document.createElement("a"); link.href = URL.createObjectURL(await zip.generateAsync({ type: "blob" })); link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 2000);
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível montar o ZIP."); } finally { setBusy(""); }
  };

  const removeSelected = async () => {
    const items = images.filter((image) => selected.has(image.id));
    if (!items.length || !confirm(`Apagar definitivamente ${items.length} foto(s)?`)) return;
    setBusy("delete"); setError("");
    try { for (const image of items) { await deletePhoto(image.id, token); onDeleted(image.id); } setSelected(new Set()); }
    catch (e) { setError(e instanceof Error ? e.message : "Não foi possível apagar todas as fotos."); }
    finally { setBusy(""); }
  };

  const shell: CSSProperties = { minHeight: "100dvh", maxWidth: 900, margin: "0 auto", padding: 24, boxSizing: "border-box", background: "#04081a", color: "#eef2ff", fontFamily: "Jost, sans-serif" };
  if (!token) return <div style={{ ...shell, display: "grid", placeItems: "center" }}><div style={{ width: "100%", maxWidth: 380, padding: 28, borderRadius: 24, background: "#0a1035", border: "1px solid rgba(80,120,255,.2)" }}>
    <button onClick={onBack} style={linkButton}><ArrowLeft /></button><LockKeyhole size={38} color="#6b9aff" style={{ margin: "28px auto 14px", display: "block" }} /><h1 style={{ textAlign: "center", fontFamily: "Cormorant,serif", fontWeight: 400 }}>Área da Tiffany</h1><p style={{ textAlign: "center", color: "#7090c0", margin: "8px 0 22px" }}>Seu espaço para viver e guardar cada olhar da festa.</p>
    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && password && login()} placeholder="Senha" style={{ width: "100%", padding: 15, boxSizing: "border-box", borderRadius: 14, color: "white", background: "#101c50", border: "1px solid #29448d" }} /><button onClick={login} disabled={!password || busy === "login"} style={primaryButton}>{busy === "login" ? "Entrando..." : "Entrar"}</button>{error && <p style={errorStyle}>{error}</p>}
  </div></div>;

  return <div style={shell}>
    <button onClick={onLogout} style={{ ...linkButton, float: "right", padding: 10 }}>Sair</button>
    <button onClick={onBack} style={linkButton}><ArrowLeft /></button>
    <h1 style={{ fontFamily: "Cormorant,serif", fontSize: 34, fontWeight: 400, marginBottom: 4 }}>Espaço da Tiffany</h1><p style={{ color: "#7090c0" }}>{images.length} fotos guardadas</p>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "20px 0" }}><button onClick={onFeed} style={primaryButton}><Images size={17} /> Ver feed como Tiffany</button><button onClick={onPublish} style={primaryButton}><Camera size={17} /> Publicar fotos</button></div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
      <button onClick={() => buildZip(images.filter((image) => selected.has(image.id)), "fotos-selecionadas-tiffany.zip")} disabled={!selected.size || busy === "zip"} style={actionButton}><Download size={15} /> Baixar selecionadas ({selected.size})</button>
      <button onClick={removeSelected} disabled={!selected.size || busy === "delete"} style={{ ...actionButton, color: "#ff9aaa" }}><Trash2 size={15} /> Excluir selecionadas</button>
      <button onClick={() => setSelected(selected.size === images.length ? new Set() : new Set(images.map((image) => image.id)))} style={actionButton}>{selected.size === images.length ? "Desmarcar todas" : "Selecionar todas"}</button>
    </div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>{Array.from({ length: batches }, (_, batch) => <button key={batch} onClick={() => buildZip(images.slice(batch * 100, batch * 100 + 100), `fotos-tiffany-parte-${batch + 1}.zip`)} disabled={!images.length || busy === "zip"} style={actionButton}><Download size={15} /> Pacote {batch + 1}</button>)}</div>
    {error && <p style={errorStyle}>{error}</p>}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 10 }}>{images.map((image) => {
      const checked = selected.has(image.id); return <button key={image.id} onClick={() => setSelected((current) => { const next = new Set(current); checked ? next.delete(image.id) : next.add(image.id); return next; })} style={{ position: "relative", borderRadius: 15, overflow: "hidden", padding: 0, border: checked ? "3px solid #6b9aff" : "3px solid transparent", background: "#0a1035", cursor: "pointer" }}><img src={image.url} alt={`Foto de ${image.guestName}`} loading="lazy" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} /><span style={{ position: "absolute", top: 8, right: 8, width: 25, height: 25, borderRadius: "50%", display: "grid", placeItems: "center", background: checked ? "#315de8" : "rgba(4,8,26,.75)", color: "white" }}>{checked && <Check size={16} />}</span><span style={{ display: "block", padding: 8, color: "#c9d7f6", fontSize: 11, textAlign: "left" }}>{image.guestName}</span></button>;
    })}</div>
  </div>;
}

const linkButton: CSSProperties = { background: "none", border: 0, color: "#7090c0", cursor: "pointer" };
const primaryButton: CSSProperties = { width: "100%", padding: 14, marginTop: 10, borderRadius: 14, border: 0, color: "white", background: "#315de8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 };
const actionButton: CSSProperties = { padding: "10px 13px", borderRadius: 12, border: "1px solid rgba(80,120,255,.2)", color: "#b7caf1", background: "#0a1035", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 };
const errorStyle: CSSProperties = { color: "#ff9aa8", textAlign: "center", fontSize: 13 };
