interface Env {
  PHOTOS: R2Bucket;
  DB: D1Database;
  ADMIN_PASSWORD: string;
  ADMIN_TOKEN_SECRET: string;
  ALLOWED_ORIGIN: string;
}

const json = (data: unknown, status = 200, headers: HeadersInit = {}) => new Response(JSON.stringify(data), {
  status, headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
});

function cors(env: Env, request: Request) {
  const origin = request.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN === "*" ? "*" : (origin === env.ALLOWED_ORIGIN ? origin : env.ALLOWED_ORIGIN),
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Vary": "Origin",
  };
}

const encode = (bytes: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

async function sign(payload: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return encode(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
}

async function issueToken(env: Env) {
  const payload = `${Date.now() + 12 * 60 * 60 * 1000}`;
  return `${payload}.${await sign(payload, env.ADMIN_TOKEN_SECRET)}`;
}

async function isAdmin(request: Request, env: Env) {
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") || "";
  const [expires, signature] = token.split(".");
  if (!expires || !signature || Number(expires) < Date.now()) return false;
  return signature === await sign(expires, env.ADMIN_TOKEN_SECRET);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(value));
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const headers = cors(env, request);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });

    try {
      if (request.method === "GET" && url.pathname.startsWith("/media/")) {
        const key = decodeURIComponent(url.pathname.slice(7));
        const object = await env.PHOTOS.get(key);
        if (!object) return new Response("Foto não encontrada", { status: 404, headers });
        const responseHeaders = new Headers(headers);
        object.writeHttpMetadata(responseHeaders);
        responseHeaders.set("ETag", object.httpEtag);
        responseHeaders.set("Cache-Control", "public, max-age=31536000, immutable");
        if (url.searchParams.has("download")) responseHeaders.set("Content-Disposition", `attachment; filename="${key.split("/").pop()}"`);
        return new Response(object.body, { headers: responseHeaders });
      }

      if (request.method === "GET" && url.pathname === "/api/photos") {
        const [photoResult, reactionResult, commentResult] = await Promise.all([
          env.DB.prepare("SELECT id, COALESCE(post_id, id) post_id, storage_path, position, guest_name, message, created_at FROM photos ORDER BY created_at DESC, position ASC LIMIT 3000").all(),
          env.DB.prepare("SELECT post_id, emoji, COUNT(*) total FROM reactions GROUP BY post_id, emoji").all(),
          env.DB.prepare("SELECT id, post_id, guest_name, text, created_at FROM comments ORDER BY created_at ASC LIMIT 3000").all(),
        ]);
        const posts = new Map<string, any>();
        for (const row of photoResult.results as any[]) {
          const postId = row.post_id;
          if (!posts.has(postId)) posts.set(postId, { id: postId, url: "", images: [], guestName: row.guest_name, message: row.message || undefined, time: formatDate(row.created_at), reactions: {}, comments: [] });
          const image = { id: row.id, url: `${url.origin}/media/${encodeURIComponent(row.storage_path)}` };
          posts.get(postId).images.push(image);
          if (!posts.get(postId).url) posts.get(postId).url = image.url;
        }
        for (const row of reactionResult.results as any[]) if (posts.has(row.post_id)) posts.get(row.post_id).reactions[row.emoji] = row.total;
        for (const row of commentResult.results as any[]) if (posts.has(row.post_id)) posts.get(row.post_id).comments.push({ id: row.id, guestName: row.guest_name, text: row.text, time: formatDate(row.created_at) });
        return json([...posts.values()], 200, headers);
      }

      if (request.method === "POST" && url.pathname === "/api/photos") {
        const form = await request.formData();
        const files = [...form.getAll("photos"), ...form.getAll("photo")].filter((item): item is File => item instanceof File);
        const guestName = String(form.get("guestName") || "Convidado").trim().slice(0, 80);
        const message = String(form.get("message") || "").trim().slice(0, 500);
        if (!files.length || files.length > 10) return json({ error: "Selecione de 1 a 10 imagens." }, 400, headers);
        if (files.some((file) => !file.type.startsWith("image/") || file.size > 6 * 1024 * 1024)) return json({ error: "Todos os arquivos devem ser imagens de até 6 MB." }, 400, headers);
        const postId = crypto.randomUUID();
        const images: Array<{ id: string; url: string }> = [];
        const uploadedPaths: string[] = [];
        try {
          for (let position = 0; position < files.length; position++) {
            const file = files[position];
            const id = crypto.randomUUID();
            const path = `festa/${Date.now()}-${id}.webp`;
            await env.PHOTOS.put(path, file.stream(), { httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000" } });
            uploadedPaths.push(path);
            await env.DB.prepare("INSERT INTO photos (id, post_id, storage_path, position, guest_name, message) VALUES (?, ?, ?, ?, ?, ?)").bind(id, postId, path, position, guestName, message || null).run();
            images.push({ id, url: `${url.origin}/media/${encodeURIComponent(path)}` });
          }
        } catch (error) {
          await Promise.all(uploadedPaths.map((path) => env.PHOTOS.delete(path)));
          await env.DB.prepare("DELETE FROM photos WHERE post_id = ?").bind(postId).run();
          throw error;
        }
        return json({ id: postId, url: images[0].url, images, guestName, message: message || undefined, time: formatDate(new Date().toISOString()), reactions: {}, comments: [] }, 201, headers);
      }

      const reactionMatch = url.pathname.match(/^\/api\/posts\/([^/]+)\/reactions$/);
      if (request.method === "POST" && reactionMatch) {
        const postId = decodeURIComponent(reactionMatch[1]);
        const body = await request.json() as { guestKey?: string; emoji?: string };
        const guestKey = String(body.guestKey || "").slice(0, 100);
        const emoji = String(body.emoji || "");
        const allowed = ["💙", "😍", "🎉", "🥹", "✨"];
        if (!guestKey || !allowed.includes(emoji)) return json({ error: "Reação inválida." }, 400, headers);
        const existing = await env.DB.prepare("SELECT emoji FROM reactions WHERE post_id = ? AND guest_key = ?").bind(postId, guestKey).first<{ emoji: string }>();
        if (existing?.emoji === emoji) await env.DB.prepare("DELETE FROM reactions WHERE post_id = ? AND guest_key = ?").bind(postId, guestKey).run();
        else await env.DB.prepare("INSERT INTO reactions (id, post_id, guest_key, emoji) VALUES (?, ?, ?, ?) ON CONFLICT(post_id, guest_key) DO UPDATE SET emoji = excluded.emoji").bind(crypto.randomUUID(), postId, guestKey, emoji).run();
        const counts = await env.DB.prepare("SELECT emoji, COUNT(*) total FROM reactions WHERE post_id = ? GROUP BY emoji").bind(postId).all();
        const reactions: Record<string, number> = {};
        for (const row of counts.results as any[]) reactions[row.emoji] = row.total;
        return json({ reactions, myReaction: existing?.emoji === emoji ? undefined : emoji }, 200, headers);
      }

      const commentMatch = url.pathname.match(/^\/api\/posts\/([^/]+)\/comments$/);
      if (request.method === "POST" && commentMatch) {
        const postId = decodeURIComponent(commentMatch[1]);
        const body = await request.json() as { guestName?: string; text?: string };
        const guestName = String(body.guestName || "Convidado").trim().slice(0, 80);
        const text = String(body.text || "").trim().slice(0, 500);
        if (!text) return json({ error: "Escreva um comentário." }, 400, headers);
        const id = crypto.randomUUID();
        await env.DB.prepare("INSERT INTO comments (id, post_id, guest_name, text) VALUES (?, ?, ?, ?)").bind(id, postId, guestName, text).run();
        return json({ id, guestName, text, time: formatDate(new Date().toISOString()) }, 201, headers);
      }

      if (request.method === "GET" && url.pathname === "/api/messages") {
        const result = await env.DB.prepare("SELECT id, guest_name, text, created_at FROM messages ORDER BY created_at ASC LIMIT 1000").all();
        return json(result.results.map((row: any) => ({ id: row.id, guestName: row.guest_name, text: row.text, time: formatDate(row.created_at) })), 200, headers);
      }

      if (request.method === "POST" && url.pathname === "/api/messages") {
        const body = await request.json() as { guestName?: string; text?: string };
        const guestName = String(body.guestName || "Convidado").trim().slice(0, 80);
        const text = String(body.text || "").trim().slice(0, 1000);
        if (!text) return json({ error: "Escreva uma mensagem." }, 400, headers);
        const id = crypto.randomUUID();
        await env.DB.prepare("INSERT INTO messages (id, guest_name, text) VALUES (?, ?, ?)").bind(id, guestName, text).run();
        return json({ id, guestName, text, time: formatDate(new Date().toISOString()) }, 201, headers);
      }

      if (request.method === "POST" && url.pathname === "/api/admin/login") {
        const body = await request.json() as { password?: string };
        if (!env.ADMIN_PASSWORD || body.password !== env.ADMIN_PASSWORD) return json({ error: "Senha incorreta." }, 401, headers);
        return json({ token: await issueToken(env) }, 200, headers);
      }

      const deleteMatch = url.pathname.match(/^\/api\/admin\/photos\/([^/]+)$/);
      if (request.method === "DELETE" && deleteMatch) {
        if (!await isAdmin(request, env)) return json({ error: "Acesso expirado. Entre novamente." }, 401, headers);
        const id = decodeURIComponent(deleteMatch[1]);
        const row = await env.DB.prepare("SELECT storage_path, COALESCE(post_id, id) post_id FROM photos WHERE id = ?").bind(id).first<{ storage_path: string; post_id: string }>();
        if (!row) return json({ error: "Foto não encontrada." }, 404, headers);
        await env.PHOTOS.delete(row.storage_path);
        await env.DB.prepare("DELETE FROM photos WHERE id = ?").bind(id).run();
        const remaining = await env.DB.prepare("SELECT COUNT(*) total FROM photos WHERE COALESCE(post_id, id) = ?").bind(row.post_id).first<{ total: number }>();
        if (!remaining?.total) {
          await env.DB.prepare("DELETE FROM reactions WHERE post_id = ?").bind(row.post_id).run();
          await env.DB.prepare("DELETE FROM comments WHERE post_id = ?").bind(row.post_id).run();
        }
        return json({ ok: true }, 200, headers);
      }

      return json({ error: "Rota não encontrada." }, 404, headers);
    } catch (error) {
      console.error(error);
      return json({ error: "Erro interno. Tente novamente." }, 500, headers);
    }
  },
};
