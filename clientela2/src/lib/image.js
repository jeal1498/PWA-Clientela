// Reduce la foto del conductor a 160×160 JPEG (~6 KB) para guardarla y meterla en la vCard.
export function resizePhoto(file, size = 160, quality = 0.72) {
  return new Promise((ok, fail) => {
    const img = new Image();
    img.onload = () => {
      const c = Object.assign(document.createElement('canvas'), { width: size, height: size });
      const s = Math.min(img.width, img.height); // recorte cuadrado al centro
      c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(img.src);
      ok(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = fail;
    img.src = URL.createObjectURL(file);
  });
}
