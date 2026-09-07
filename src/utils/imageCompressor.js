/**
 * Client-side image compression utility.
 * 
 * Takes an input File or Blob. If it's an image, draws it to an off-screen HTML5 Canvas,
 * scales it down to maximum dimensions (default 1280px), and exports a high-quality,
 * lightweight JPEG Blob (~100KB - 200KB).
 * 
 * Non-image files (e.g. PDFs) are returned untouched.
 */
export const compressImage = async (file, options = {}) => {
  if (!file) return file;

  // Only compress images. Leave PDFs and other documents as-is.
  const isImage = file.type && file.type.startsWith('image/');
  if (!isImage) {
    return file;
  }

  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.82,
    targetType = 'image/jpeg'
  } = options;

  return new Promise((resolve) => {
    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        let { width, height } = img;

        // If the image is already small, skip re-encoding
        if (width <= maxWidth && height <= maxHeight && file.size < 250 * 1024) {
          resolve(file);
          return;
        }

        // Calculate proportional scale
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Draw with smoothing for high fidelity ID scans / photos
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // Create a File object preserving the original name
            const originalName = file.name || 'photo.jpg';
            const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
            const compressedFile = new File([blob], `${baseName}.jpg`, {
              type: targetType,
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          targetType,
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file); // fallback to original file if decoding fails
      };

      img.src = objectUrl;
    } catch (err) {
      console.warn('Image compression fallback:', err);
      resolve(file);
    }
  });
};
