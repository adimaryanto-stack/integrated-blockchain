/**
 * Utility untuk mengonversi berkas / data gambar (PNG, JPG, JPEG, BMP, TIFF, dll)
 * menjadi format .webp dengan kompresi berbasis HTML5 Canvas untuk menghemat ruang penyimpanan.
 */

export interface WebPConversionOptions {
  quality?: number; // Quality dari 0.1 sampai 1.0 (default: 0.8 / 80%)
  maxWidth?: number; // Lebar maksimum gambar (default: 1600px)
  maxHeight?: number; // Tinggi maksimum gambar (default: 1600px)
}

/**
 * Mengonversi File, Blob, atau Data URL gambar menjadi Data URL berformat image/webp
 */
export async function convertToWebP(
  fileOrDataUrl: File | Blob | string,
  options: WebPConversionOptions = {}
): Promise<string> {
  const { quality = 0.8, maxWidth = 1600, maxHeight = 1600 } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let { width, height } = img;

      // Scale down dimensi jika melebihi batas maksimum
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context tidak tersedia'));
        return;
      }

      // Beri background putih untuk gambar transparan agar hasil WebP bersih
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      ctx.drawImage(img, 0, 0, width, height);

      // Konversi ke format image/webp
      const webpDataUrl = canvas.toDataURL('image/webp', quality);
      resolve(webpDataUrl);
    };

    img.onerror = (err) => {
      reject(new Error('Gagal memuat gambar untuk konversi WebP: ' + String(err)));
    };

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}

/**
 * Mengonversi File gambar menjadi objek File baru berformat .webp
 */
export async function convertToWebPFile(
  file: File,
  options: WebPConversionOptions = {}
): Promise<File> {
  const dataUrl = await convertToWebP(file, options);
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  const webpFileName = `${originalName}.webp`;
  return new File([blob], webpFileName, { type: 'image/webp' });
}
