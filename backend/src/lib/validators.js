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

