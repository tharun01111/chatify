export const validateFileType = (base64Image) => {
  if (!base64Image.startsWith("data:image/")) return false;

  const allowedTypes = [
    "data:image/jpeg",
    "data:image/jpg",
    "data:image/png",
    "data:image/gif",
    "data:image/webp",
  ];

  const isAllowed = allowedTypes.some((types) => base64Image.startsWith(types));

  if (!isAllowed) return false;

  if (!base64Image.includes(";base64,")) return false;

  return true;
};

export const validateImageSize = (base64Image) => {
  const sizeInBytes = base64Image.length * 0.75;
  const sizeInMb = sizeInBytes / (1024 * 1024);

  return sizeInMb <= 5;
};

export const normalizeEmail = (email = "") => email.trim().toLowerCase();

export const sanitizeName = (name = "") => name.trim().replace(/\s+/g, " ");

export const sanitizeBio = (bio = "") => bio.trim().replace(/\s+/g, " ");

export const parsePositiveInt = (value, fallback, max = Infinity) => {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;

  return Math.min(parsed, max);
};

