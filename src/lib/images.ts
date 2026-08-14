const MAX_SIDE = 1600;
const QUALITY = 0.82;

export async function optimizeImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) throw new Error("Selecione uma imagem válida.");
  if (file.size > 20 * 1024 * 1024) throw new Error("A foto deve ter no máximo 20 MB.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Não foi possível preparar a foto.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", QUALITY));
  if (!blob) throw new Error("Não foi possível compactar a foto.");
  return new File([blob], `${crypto.randomUUID()}.webp`, { type: "image/webp" });
}
