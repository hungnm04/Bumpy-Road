export const FALLBACK_MOUNTAIN_IMAGE = "/storage/mountain-photos/mountain_town_1.jpg";

export function getMountainImageUrl(photoUrl) {
  if (!photoUrl) {
    return null;
  }

  if (/^(https?:|data:|blob:)/.test(photoUrl)) {
    return photoUrl;
  }

  if (photoUrl.startsWith("/storage/")) {
    return photoUrl;
  }

  const filename = photoUrl.split("/").pop();

  if (!filename) {
    return null;
  }

  return `/storage/mountain-photos/${filename}`;
}
