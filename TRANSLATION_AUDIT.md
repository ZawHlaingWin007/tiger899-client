# Website Translation Audit (EN / MM / CN / TH)

Use the pattern: `t("English", "Myanmar", "Chinese", "Thai")` from `useTranslation()`.

---

## 1. Fix existing t() missing 4th language (Thai)

| File           | Line / Context                     | Fix                                                                             |
| -------------- | ---------------------------------- | ------------------------------------------------------------------------------- |
| **Navbar.vue** | Withdraw, Deposit, Login, Register | Add 4th argument Thai: `"ถอนเงิน"`, `"ฝากเงิน"`, `"เข้าสู่ระบบ"`, `"ลงทะเบียน"` |

---

## 2. Pages without useTranslation – add and translate

### DownloadPage.vue

- **Title:** "အက်ပ်ကို ဒေါင်းလုဒ်လုပ်ပါ။" → use t("Download the app", "အက်ပ်ကို ဒေါင်းလုဒ်လုပ်ပါ။", "下载应用", "ดาวน์โหลดแอป")
- **Step 1:** "အသင့်တင်ထားသော လင့်အားတင်ဆောင်ရယူရန် QR ကုဒ်ကို စကင်ဖတ်ပါ။"
- **Step 2:** "အသင့်ကို အော်ဒာထုတ်ရန် \"Allow\" ကို နှိပ်ပါ။"
- **Step 3:** "အကောင့်ဝင်ပြီး (သို့) အကောင့်အသစ်ပြုလုပ်ပါ။"
- **Labels:** "ဒေါင်းလုဒ်ရန်", "QR ကို စကင်ဖတ်ပါ", "IOS LITE-APP", "Android APP"
- **Alt text:** "Tiger899 Download", "Tiger899 Logo", "iOS Lite App QR", "Android App QR"

### PromotionPage.vue

- **Page title:** "ပရိုမိုးရှင်း" → t("Promotion", "ပရိုမိုးရှင်း", "优惠", "โปรโมชั่น")
- **Category "All":** "အာလုံး" → t("All", "အားလုံး", "全部", "ทั้งหมด")
- **Empty/loading:** "No promotions", "Loading..." (if any)

### PromotionDetailPage.vue

- **Back button:** "Back" → t("Back", "ပြန်သွားမည်", "返回", "กลับ")
- **Loading:** "Loading..." → t("Loading...", "ဆောင်ရွက်နေသည်...", "加载中...", "กำลังโหลด...")
- **Label:** "Promotion" → t("Promotion", "ပရိုမိုးရှင်း", "优惠", "โปรโมชั่น")
- **Not found:** "Promotion not found." (if any)

### InvitePage.vue

- **Title:** "ဖိတ်ခေါ်ခြင်း" → t("Invite", "ဖိတ်ခေါ်ခြင်း", "邀请", "เชิญชวน")
- **Placeholder:** "Invite page content coming soon..." → t("Invite page content coming soon...", "ဖိတ်ခေါ်ခြင်း စာမျက်နှာ မကြာမီ ပါဝင်မည်။", "邀请页面内容即将推出...", "เนื้อหาหน้าเชิญเร็วๆ นี้...")

### RewardsPage.vue

- **Title:** "ဆုလာဘ်" → t("Rewards", "ဆုလာဘ်", "奖励", "รางวัล")
- **Placeholder:** "Rewards page content coming soon..." → t("Rewards page content coming soon...", "ဆုလာဘ် စာမျက်နှာ မကြာမီ ပါဝင်မည်။", "奖励页面内容即将推出...", "เนื้อหาหน้ารางวัลเร็วๆ นี้...")

---

## 3. aria-label (use t() or shared labels)

| File                                 | Current                                  | Suggested t() key / text                                                   |
| ------------------------------------ | ---------------------------------------- | -------------------------------------------------------------------------- |
| GameLaunchModal.vue                  | "Close"                                  | t('Close', 'ပိတ်မည်', '关闭', 'ปิด')                                       |
| DepositStep1.vue                     | "Back"                                   | t('Back', 'ပြန်သွားမည်', '返回', 'กลับ')                                   |
| HistoryPage.vue                      | "Back"                                   | same                                                                       |
| BettingHistoryPage.vue               | "Back"                                   | same                                                                       |
| WithdrawModal.vue                    | "Close"                                  | t('Close', ...)                                                            |
| WithdrawHistoryModal.vue             | "Close"                                  | same                                                                       |
| DepositHistoryModal.vue              | "Close"                                  | same                                                                       |
| BettingHistoryModal.vue              | "Close"                                  | same                                                                       |
| LoginModal.vue                       | "Close"                                  | same                                                                       |
| RegisterModal.vue                    | "Close"                                  | same                                                                       |
| WelcomeModal.vue                     | "Close"                                  | same                                                                       |
| DownloadModal.vue                    | "Close"                                  | same                                                                       |
| ConnectAccountModal.vue              | "Close"                                  | same                                                                       |
| AddBankAccountPage.vue               | "Close"                                  | same                                                                       |
| Sidebar.vue                          | "Refresh balance"                        | t('Refresh balance', 'ငွေလက်ကျန် ပြန်စစ်မည်', '刷新余额', 'รีเฟรชยอดเงิน') |
| MainLayout.vue                       | "Contact"                                | t('Contact', 'ဆက်သွယ်ရန်', '联系', 'ติดต่อ')                               |
| MobileNavbar.vue                     | "Refresh Balance", "Account", "Language" | t() for each                                                               |
| SlotsPage.vue / FishShootingPage.vue | "Shuffle games"                          | t('Shuffle games', 'ဂိမ်းများ ရောစပ်မည်', '打乱游戏', 'สลับเกม')           |
| BettingHistoryContent.vue            | "Close" (sheet)                          | t('Close', ...)                                                            |
| ProfileDropdown.vue                  | alt="Profile"                            | :alt="t('Profile', ...)"                                                   |
| Navbar.vue                           | alt="Profile"                            | same                                                                       |

---

## 4. Placeholders (single-language or missing translation)

| File                   | Current / Context                                | Action                                                                   |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------ |
| DepositStep1.vue       | 'သွင်းငွေပမာဏ' or '40,000 - 100,000,000'         | Use t() for Myanmar placeholder; keep range or t() for "Amount range"    |
| DepositStep2.vue       | "လုပ်ငန်းစဉ်နံပါတ်"                              | t('Transaction number', 'လုပ်ငန်းစဉ်နံပါတ်', '交易号', 'หมายเลขธุรกรรม') |
| DepositModal.vue       | "လုပ်ငန်းစဉ်နံပါတ်", "သွင်းငွေပမာဏ"              | same as above                                                            |
| WithdrawPage.vue       | placeholders (amount, etc.)                      | Ensure all use t() with 4 args                                           |
| AccountPage.vue        | placeholders (e.g. nickname, phone)              | Use t()                                                                  |
| AddEWalletPage.vue     | placeholders + "Hide password" / "Show password" | t() for all                                                              |
| AddBankAccountPage.vue | "Close" aria-label                               | t('Close', ...)                                                          |

---

## 5. Other UI text (buttons, toasts, dialogs)

| File                                                               | Text                                                     | Suggested t()                                                      |
| ------------------------------------------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------ |
| Sidebar.vue                                                        | "Cancel" (logout dialog – already multi-language inline) | Consider t() for consistency                                       |
| ProfileDropdown.vue                                                | "Cancel" (same)                                          | Same                                                               |
| HomePage.vue                                                       | title="အားကစား" (Sports)                                 | t('Sports', 'အားကစား', '体育', 'กีฬา')                             |
| WithdrawPage.vue                                                   | "Withdraw History" aria-label                            | t('Withdraw History', 'ငွေထုတ်မှတ်တမ်း', '提款记录', 'ประวัติถอน') |
| HistoryPage.vue / DepositHistoryPage.vue / WithdrawHistoryPage.vue | tab titles (tabTitles)                                   | Already from t() – verify all 4 langs                              |
| GameCard.vue                                                       | cancelButtonText                                         | Already t()                                                        |
| FishShootingPage.vue                                               | Notice title                                             | Already t()                                                        |

---

## 6. Components that already use t() well

- Sidebar.vue (most items)
- FooterSection.vue
- MobileBottomNav.vue
- MainLayout.vue (guideItems)
- GuideModal.vue
- DepositModal, WithdrawModal, LoginModal, RegisterModal (most labels)
- ConnectAccountModal.vue (placeholders)
- HistoryPage, DepositHistoryPage, WithdrawHistoryPage (tabs, copy, confirm/cancel)
- AccountPage, SlotsPage, FishShootingPage, BuffaloPage, etc. (Deposit/Withdraw buttons)

---

## 7. Summary checklist

- [ ] Navbar: add Thai to all t() calls (4 args).
- [ ] DownloadPage: add useTranslation, translate title + steps + labels + alt.
- [ ] PromotionPage: add useTranslation, translate title + "All" category.
- [ ] PromotionDetailPage: add useTranslation, translate Back, Loading, Promotion label.
- [ ] InvitePage: add useTranslation, translate title + coming soon text.
- [ ] RewardsPage: add useTranslation, translate title + coming soon text.
- [ ] All modals: replace raw aria-label="Close" with :aria-label="t('Close', ...)".
- [ ] Sidebar: "Refresh balance" aria-label → t().
- [ ] MainLayout: "Contact" aria-label → t().
- [ ] MobileNavbar: "Refresh Balance", "Account", "Language" → t().
- [ ] SlotsPage / FishShootingPage: "Shuffle games" aria-label → t().
- [ ] Deposit/Withdraw placeholders: ensure t() with 4 languages where still single-language.
- [ ] HomePage: Sports section title "အားကစား" → t().

Use this file as the single reference for “what still needs translation” across the whole website.
