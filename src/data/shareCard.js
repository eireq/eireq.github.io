function drawCard({ title, lines }) {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#f5cf3d";
  ctx.lineWidth = 4;
  ctx.strokeRect(18, 18, 604, 324);
  ctx.fillStyle = "#fff";
  ctx.font = "28px Arial, sans-serif";
  ctx.fillText(title, 40, 72);
  ctx.font = "20px Arial, sans-serif";
  ctx.fillStyle = "#ccc";
  lines.forEach((line, index) => ctx.fillText(String(line), 40, 124 + index * 34));
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

export async function copyShareCard(card) {
  const blob = await drawCard(card);
  try {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return "copied";
  } catch {
    // some browsers can't put images on the clipboard, so it downloads instead
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "eire-share.png";
    link.click();
    URL.revokeObjectURL(url);
    return "saved";
  }
}
