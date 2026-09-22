/**
 * SEO config for Myanmar Slot users – titles and descriptions per route.
 * Used for document.title and meta description (EN + Myanmar keywords).
 */
const SITE_NAME = 'Tiger899';
const DEFAULT_TITLE = 'Tiger899 - Myanmar Slot Games | Online Casino & Slots မြန်မာစလော့';
const DEFAULT_DESCRIPTION = 'Play the best slot games in Myanmar. Tiger899 offers PG Slot, Pragmatic Play, JILI, live casino, fishing & card games. Safe deposit & withdraw. မြန်မာ့အကောင်းဆုံး စလော့ဂိမ်းများ။';

export const seoMeta = {
  home: {
    title: `${SITE_NAME} - Myanmar Slot Games | Online Casino မြန်မာစလော့`,
    description: 'Tiger899 Game Paradise - Best online slot games for Myanmar players. PG Soft, Pragmatic Play, JILI, Live22. Slots, fishing, live casino, card games. မြန်မာ့ဂိမ်းသမားများအတွက် အကောင်းဆုံး စလော့ဂိမ်း။',
  },
  slots: {
    title: `Slot Games Myanmar | စလော့ဂိမ်းများ - ${SITE_NAME}`,
    description: 'Play slot games in Myanmar. PG Slot, Pragmatic Play, JILI, CQ9, Joker - hundreds of slots. Free demo & real play. စလော့ဂိမ်းများ ဆော့ကစားပါ။',
  },
  'fish-shooting': {
    title: `Fishing Games Myanmar | ငါးပစ်ဂိမ်း - ${SITE_NAME}`,
    description: 'Online fishing games for Myanmar. Shoot fish, win big. Best fishing slots & arcade. ငါးပစ်ဂိမ်း အွန်လိုင်းဆော့ပါ။',
  },
  buffalo: {
    title: `Buffalo Games Myanmar | ကျွဲဂိမ်း - ${SITE_NAME}`,
    description: 'Buffalo slot games & arcade for Myanmar players. Play Buffalo slots online. ကျွဲဂိမ်း အွန်လိုင်းဆော့ပါ။',
  },
  'card-games': {
    title: `Card Games Myanmar | ဖဲဂိမ်း Shan Ko Mee, Bugyee - ${SITE_NAME}`,
    description: 'Card games for Myanmar: Shan Ko Mee, Bugyee, Forest, Galone. Play online. ဖဲဂိမ်း ရှမ်းကိုမီး၊ ဘုရင့်ဂိမ်း။',
  },
  live: {
    title: `Live Casino Myanmar | ကာစီနိုတိုက်ရိုက် - ${SITE_NAME}`,
    description: 'Live casino for Myanmar players. Baccarat, roulette, live dealers. ကာစီနိုတိုက်ရိုက် ဆော့ကစားပါ။',
  },
  lottery: {
    title: `Lottery Myanmar | ထီဂိမ်း - ${SITE_NAME}`,
    description: 'Online lottery games for Myanmar. Play lottery & win. ထီဂိမ်း အွန်လိုင်းဝယ်ယူဆော့ပါ။',
  },
  sports: {
    title: `Sports Betting Myanmar | အားကစား - ${SITE_NAME}`,
    description: 'Sports betting for Myanmar. Football, basketball & more. အားကစားလောင်းကစား။',
  },
  promotion: {
    title: `Promotions & Bonuses | ပရိုမိုးရှင်းများ - ${SITE_NAME}`,
    description: 'Tiger899 promotions and bonuses for Myanmar players. Welcome bonus, deposit bonus. ကြိုဆိုဘောနပ်စ်၊ ငွေသွင်းဘောနပ်စ်။',
  },
  download: {
    title: `Download Tiger899 App Myanmar | ဒေါင်းလုဒ်လုပ်ပါ - ${SITE_NAME}`,
    description: 'Download Tiger899 app for Android & iOS. Best Myanmar slot app. Tiger899 အက်ပ်ဒေါင်းလုဒ်လုပ်ပါ။',
  },
  favorites: {
    title: `My Favorites | ကျွန်ုပ်၏အကြိုက်ဆုံးများ - ${SITE_NAME}`,
    description: 'Your favorite slot and casino games. သင့်အကြိုက်ဆုံး ဂိမ်းများ။',
  },
  account: {
    title: `My Account | ကျွန်ုပ်၏အကောင့် - ${SITE_NAME}`,
    description: 'Manage your Tiger899 account, balance, deposit & withdraw. အကောင့်စီမံခန့်ခွဲမှု။',
  },
  'promotion-detail': {
    title: `Promotion - ${SITE_NAME}`,
    description: 'Tiger899 promotion details. Bonuses and offers for Myanmar players. ပရိုမိုးရှင်းအသေးစိတ်။',
  },
  'last-game': {
    title: `Continue Playing | ဆက်လက်ဆော့ကစားပါ - ${SITE_NAME}`,
    description: 'Your last played games. Continue where you left off. နောက်ဆုံးဆော့ခဲ့သော ဂိမ်းများ။',
  },
  'betting-history': {
    title: `Betting History | လောင်းကစားမှတ်တမ်း - ${SITE_NAME}`,
    description: 'View your betting history and game records. လောင်းကစားမှတ်တမ်း ကြည့်ပါ။',
  },
  invite: {
    title: `Invite Friends | မိတ်ဆက်ပေးပါ - ${SITE_NAME}`,
    description: 'Invite friends and earn rewards. မိတ်ဆက်ပေးပြီး ဆုလာဘ်ရယူပါ။',
  },
  rewards: {
    title: `Rewards | ဆုလာဘ်များ - ${SITE_NAME}`,
    description: 'Tiger899 rewards and loyalty program. ဆုလာဘ်နှင့် သစ္စာရေးအစီအစဉ်။',
  },
  cockfighting: {
    title: `Cockfighting Myanmar | ကြက်တိုက်ဂိမ်း - ${SITE_NAME}`,
    description: 'Online cockfighting games for Myanmar. ကြက်တိုက်ဂိမ်း အွန်လိုင်းဆော့ပါ။',
  },
  'e-sports': {
    title: `E-Sports Myanmar | အီလက်ထရောနစ်အားကစား - ${SITE_NAME}`,
    description: 'E-Sports betting for Myanmar players. အီလက်ထရောနစ်အားကစား။',
  },
};

export function getSeoForRoute(routeName) {
  return seoMeta[routeName] || {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  };
}

export { SITE_NAME, DEFAULT_TITLE, DEFAULT_DESCRIPTION };
