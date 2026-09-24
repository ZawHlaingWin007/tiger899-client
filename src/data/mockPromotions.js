import promo1 from "../assets/webp/promo1.webp";
import promo2 from "../assets/webp/promo2.webp";
import promo3 from "../assets/webp/promo3.webp";
import promo4 from "../assets/webp/promo4.webp";
import promo5 from "../assets/webp/promo5.webp";

export const MOCK_CATEGORIES = [
  { id: "welcome", name: "Welcome" },
  { id: "daily", name: "Daily" },
  { id: "deposit", name: "Deposit" },
];

export const MOCK_PROMOTIONS = [
  {
    id: "mock-welcome-200",
    category_id: "welcome",
    category_name: "Welcome",
    title: "မန်ဘာသစ် 200%",
    name: "New Member 200%",
    image: promo1,
    description:
      "<p>အကောင့်အသစ်ဖွင့်ပြီး <strong>ပထမဆုံး ငွေသွင်းမှု</strong>တွင် <strong>200%</strong> ကြိုဆိုဘောနပ်စ် ရယူလိုက်ပါ။</p>",
    promotion_percent: 200,
    requires_deposit: true,
    claim_once_per_user: true,
    claimable_amount: 5000,
    minimum_turn_over_amount: 15000,
    start_date: "2026-01-01",
    end_date: "2026-12-31",
    active: true,
    terms:
      "ပထမဆုံး ငွေသွင်းမှုအတွက်သာ သက်ရောက်သည်။ အနည်းဆုံး ငွေသွင်း 5,000 ကျပ်။ ငွေထုတ်ယူရန် turnover x10 လိုအပ်သည်။",
  },
  {
    id: "mock-shan-slot-30",
    category_id: "daily",
    category_name: "Daily",
    title: "ရှမ်းကိုးမီး စလော့ဂိမ်း 30%",
    name: "Shan Koe Mee & Slots 30%",
    image: promo2,
    description:
      "<p>ရှမ်းကိုးမီးနှင့် စလော့ဂိမ်းများအတွက် <strong>30%</strong> ဘောနပ်စ်ကို <strong>တစ်နေ့တစ်ကြိမ်</strong> ရယူနိုင်ပါသည်။</p>",
    promotion_percent: 30,
    requires_deposit: true,
    daily_usage_limit: 1,
    claimable_amount: 3000,
    minimum_turn_over_amount: 8000,
    allowed_game_types: ["Shan Koe Mee", "Slot"],
    start_date: "2026-01-01",
    end_date: "2026-12-31",
    active: true,
    terms:
      "တစ်နေ့တစ်ကြိမ်သာ ရယူနိုင်သည်။ ရှမ်းကိုးမီးနှင့် စလော့ဂိမ်းများတွင်သာ သက်ရောက်သည်။ ငွေထုတ်ယူရန် turnover x8 လိုအပ်သည်။",
  },
  {
    id: "mock-slot-20",
    category_id: "daily",
    category_name: "Daily",
    title: "စလော့ သီးသန့် 20%",
    name: "Slot Exclusive 20%",
    image: promo3,
    description:
      "<p>စလော့ဂိမ်းများအတွက် သီးသန့် <strong>20%</strong> ဘောနပ်စ်ကို <strong>တစ်နေ့တစ်ကြိမ်</strong> ရယူလိုက်ပါ။</p>",
    promotion_percent: 20,
    requires_deposit: true,
    daily_usage_limit: 1,
    claimable_amount: 3000,
    minimum_turn_over_amount: 6000,
    allowed_game_types: ["Slot"],
    start_date: "2026-01-01",
    end_date: "2026-12-31",
    active: true,
    terms:
      "စလော့ဂိမ်းများအတွက်သာ သက်ရောက်သည်။ တစ်နေ့တစ်ကြိမ် ရယူနိုင်သည်။ ငွေထုတ်ယူရန် turnover x8 လိုအပ်သည်။",
  },
  {
    id: "mock-daily-extra-5",
    category_id: "daily",
    category_name: "Daily",
    title: "နေ့စဉ်အပိုဆု 5%",
    name: "Daily Extra 5%",
    image: promo4,
    description:
      "<p>သွင်းငွေ <strong>10,000 ကျပ်နှင့်အထက်</strong> အတွက် နေ့စဉ် <strong>5%</strong> အပိုဆု ရယူနိုင်ပါသည်။</p>",
    promotion_percent: 5,
    requires_deposit: true,
    daily_usage_limit: 1,
    claimable_amount: 10000,
    minimum_turn_over_amount: 10000,
    start_date: "2026-01-01",
    end_date: "2026-12-31",
    active: true,
    terms:
      "အနည်းဆုံး ငွေသွင်း 10,000 ကျပ်။ တစ်နေ့တစ်ကြိမ် ရယူနိုင်သည်။ ငွေထုတ်ယူရန် turnover x5 လိုအပ်သည်။",
  },
  {
    id: "mock-refund-10",
    category_id: "deposit",
    category_name: "Deposit",
    title: "သွင်းငွေပြန်အမ်း 10%",
    name: "Deposit Refund 10%",
    image: promo5,
    description:
      "<p>သွင်းငွေအပေါ် <strong>10%</strong> ပြန်အမ်းဘောနပ်စ် ရယူနိုင်ပါသည်။ အများဆုံး သွင်းငွေ <strong>5,000 ကျပ်</strong>။</p>",
    promotion_percent: 10,
    requires_deposit: true,
    daily_usage_limit: 1,
    claimable_amount: 1000,
    minimum_turn_over_amount: 5000,
    start_date: "2026-01-01",
    end_date: "2026-12-31",
    active: true,
    terms:
      "အများဆုံး ငွေသွင်း 5,000 ကျပ်အထိ သက်ရောက်သည်။ ငွေထုတ်ယူရန် turnover x5 လိုအပ်သည်။",
  },
];

export const getMockPromotionById = (id) =>
  MOCK_PROMOTIONS.find((p) => String(p.id) === String(id)) ?? null;

export const getMockPromotions = (categoryId = "all") => {
  if (!categoryId || categoryId === "all") return MOCK_PROMOTIONS;
  return MOCK_PROMOTIONS.filter(
    (p) => String(p.category_id) === String(categoryId)
  );
};
