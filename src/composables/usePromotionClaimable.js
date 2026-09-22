export function getPromotionClaimableAmount(promotion) {
  const n = Number(promotion?.claimable_amount);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function formatClaimableAmount(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return String(amount ?? "");
  return n.toLocaleString();
}

export function claimableAmountMessage(t, amount) {
  const display = formatClaimableAmount(amount);
  return t(
    `The minimum deposit amount for this promotion is ${display}.`,
    `ဤပရိုမိုးရှင်းအတွက် အနည်းဆုံး ငွေသွင်းပမာဏမှာ ${display} ဖြစ်ပါသည်။`,
    `此优惠的最低存款金额为 ${display}。`,
    `ยอดฝากขั้นต่ำสำหรับโปรโมชั่นนี้คือ ${display}`
  );
}

export function translateClaimableAmountApiError(t, rawMessage) {
  const raw = String(rawMessage || "").trim();
  const match = raw.match(
    /^The minimum deposit amount for this promotion is (.+)\.$/
  );
  if (match) {
    return claimableAmountMessage(t, match[1]);
  }
  return raw;
}
