export function shareCardBlob({ title, lines }) {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#f5cf3d";
  ctx.lineWidth = 4;
  ctx.strokeRect(18, 18, 604, 324);
  ctx.fillStyle = "#ffffff";
  ctx.font = "28px Arial, sans-serif";
  ctx.fillText(String(title || "eire"), 40, 72);
  ctx.font = "20px Arial, sans-serif";
  ctx.fillStyle = "#cccccc";
  lines.forEach((line, index) => {
    ctx.fillText(String(line), 40, 124 + index * 34);
  });
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/png"));
}

export async function copyShareCard(card) {
  const blob = await shareCardBlob(card);
  if (!blob) return false;
  try {
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      return "copied";
    }
  } catch {
    /* download below */
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "eire-share.png";
  link.click();
  URL.revokeObjectURL(url);
  return "saved";
}
