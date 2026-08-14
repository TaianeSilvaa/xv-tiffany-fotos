const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Não foi possível concluir a solicitação.");
  return data as T;
}

export const isApiConfigured = Boolean(import.meta.env.VITE_API_URL);
export const apiUrl = (path: string) => `${API_BASE}${path}`;

export interface ApiPhoto {
  id: string;
  url: string;
  images?: Array<{ id: string; url: string }>;
  guestName: string;
  time: string;
  message?: string;
  reactions?: Record<string, number>;
  myReaction?: string;
  comments?: ApiComment[];
}

export interface ApiComment { id: string; guestName: string; text: string; time: string }

export interface ApiMessage {
  id: string;
  guestName: string;
  text: string;
  time: string;
}

export function getContent() {
  return Promise.all([
    request<ApiPhoto[]>("/api/photos"),
    request<ApiMessage[]>("/api/messages"),
  ]);
}

export function uploadPhotos(files: File[], guestName: string, message: string) {
  const body = new FormData();
  files.forEach((file) => body.append("photos", file));
  body.append("guestName", guestName);
  body.append("message", message);
  return request<ApiPhoto>("/api/photos", { method: "POST", body });
}

export function reactToPost(postId: string, guestKey: string, emoji: string) {
  return request<{ reactions: Record<string, number>; myReaction?: string }>(`/api/posts/${postId}/reactions`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ guestKey, emoji }),
  });
}

export function commentOnPost(postId: string, guestName: string, text: string) {
  return request<ApiComment>(`/api/posts/${postId}/comments`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ guestName, text }),
  });
}

export function postMessage(guestName: string, text: string) {
  return request<ApiMessage>("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guestName, text }),
  });
}

export function adminLogin(password: string) {
  return request<{ token: string }>("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
}

export function deletePhoto(id: string, token: string) {
  return request<{ ok: true }>(`/api/admin/photos/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}
