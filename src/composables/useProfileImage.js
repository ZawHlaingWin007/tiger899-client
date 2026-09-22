/**
 * Profile images from CDN: profile_1.png … profile_10.png (mmprofiles folder).
 * authUser.profile_image is the number 1–10; we resolve to full URL for display.
 */
const PROFILE_CDN_BASE =
  "https://storage.googleapis.com/spacetech2/yu95/mmprofiles";

const PROFILE_INDEX_MIN = 1;
const PROFILE_INDEX_MAX = 10;

/** Parse profile index from API value: 1, "1", "profile_1", or URL containing profile_N */
function parseProfileIndex(value) {
  if (value == null || value === "") return null;
  const num = Number(value);
  if (!Number.isNaN(num) && num >= PROFILE_INDEX_MIN && num <= PROFILE_INDEX_MAX) {
    return num;
  }
  if (typeof value === "string") {
    const match = value.match(/profile_(\d+)/i) || value.match(/(\d+)/);
    if (match) {
      const n = Number(match[1]);
      if (n >= PROFILE_INDEX_MIN && n <= PROFILE_INDEX_MAX) return n;
    }
  }
  return null;
}

/** Get the effective user object (handles nested user.user from API). */
function getEffectiveUser(user) {
  if (!user || typeof user !== "object") return user;
  return user.user && typeof user.user === "object" ? user.user : user;
}

/** Return profile index 1–10 from user, or null. Use this to read from authUser consistently. */
export function getProfileIndex(user) {
  const u = getEffectiveUser(user);
  if (!u) return null;
  const raw = u.profile_image ?? u.profileImage ?? u.profile;
  return parseProfileIndex(raw);
}

export function getProfileImageUrl(user) {
  if (!user || typeof user !== "object") return "/logo-profile.png";
  const u = getEffectiveUser(user);
  const raw = u?.profile_image ?? u?.profileImage ?? u?.profile;
  const num = parseProfileIndex(raw);
  if (num !== null) {
    return `${PROFILE_CDN_BASE}/profile_${num}.png`;
  }
  if (typeof raw === "string" && (raw.startsWith("http") || raw.startsWith("/"))) {
    return raw;
  }
  return "/logo-profile.png";
}

/** Profile index 1–10 only: girls 1–5, boys 6–10 */
export const AVATAR_INDEX_GIRLS = [1, 2, 3, 4, 5];
export const AVATAR_INDEX_BOYS = [6, 7, 8, 9, 10];

export function getProfileUrlByIndex(index) {
  const num = Number(index);
  if (num >= PROFILE_INDEX_MIN && num <= PROFILE_INDEX_MAX) {
    return `${PROFILE_CDN_BASE}/profile_${num}.png`;
  }
  return "/logo-profile.png";
}
