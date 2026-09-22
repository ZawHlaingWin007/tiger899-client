# Referral System – API Implementation Detail (Frontend)

Use this document to integrate the **referral / invite** feature with the backend API. Base URL: **`https://api.tiger899.com/api/`** (or your env base URL).

---

## 1. General

- **Base URL:** `https://api.tiger899.com/api/`
- **Auth:** `Authorization: Bearer <token>` (token from login; e.g. store in `localStorage.token`).
- **Content-Type:** `application/json`.
- **Success:** Responses use `status: "success"` and `data` when applicable.
- **Errors:** Same shape as existing auth (e.g. `errors: { field: ["message"] }` or `message`). On **401** (missing/invalid token), redirect to login or show login modal.

---

## 2. Registration with referral (invite) attribution

**Endpoint:** `POST /auth/register`  
**Auth:** Not required.

**Request body (relevant fields):**

```json
{
  "user_name": "string",
  "phone": "string",
  "password": "string",
  "confirmPassword": "string",
  "roles": "normal",
  "type": "login",
  "referralCode": "string"
}
```

- **`referralCode`** (optional): Value from invite/streamer link query `?ref=`, `?r=`, or `?code=<code>`. Backend treats it **only as the referrer's `user_name`** (not `agent_referralCode`). If valid, the new user is linked to that referrer; if missing or invalid, registration still succeeds without a referrer.
- Frontend stores any of `ref`, `r`, or `code` from the URL (on **any route**) in `localStorage.referralCode` and sends it as `referralCode` in `POST /auth/register` when the user registers. The invite link must use the referrer's **user_name** (e.g. `?r=john_doe` or `?ref=john_doe`).

**Success response:** Same as before, e.g. `{ "status": "success", "data": { ...user }, "token": "..." }`. User object may include referrer-related data; frontend does not need to change if it already uses the same response.

---

## 3. Current user (show referrer / commissioner)

**Endpoint:** `GET /auth/user`  
**Auth:** Required (`Authorization: Bearer <token>`).

**Success response:**

- `data` – full user object.
- `data.amount` – balance.
- **`data.commissioner`** – optional string: referrer's username (ကိုယ်စားလှယ် / Upper Line). Present only when the user was referred; show on Account page. If absent, user was not referred.

Use `data.commissioner` as-is for display (e.g. "ကိုယ်စားလှယ်: {commissioner}").

---

## 4. Referral dashboard (Invite page)

All endpoints below require **auth** unless noted. Use **GET** with `Authorization: Bearer <token>`.

---

### 4.1 Referral link (no API)

Build on frontend from current user:

- `https://yoursite.com/?r={user_name}`  
Use **`user_name`** only (e.g. `authUser.user_name` from `GET /auth/user`). Do not use `agent_referralCode` for this link so it stays separate from other agent features.

---

### 4.2 Summary (4 cards)

**Endpoint:** `GET /user/referral/summary`  
**Auth:** Required.

**Response:**

```json
{
  "status": "success",
  "data": {
    "today_income": "0.00",
    "yesterday_income": "0.00",
    "referral_count": 0,
    "official_players_count": 0
  }
}
```

| Field | Type | Description | Frontend usage |
|-------|------|-------------|----------------|
| `today_income` | string | Referrer income for **today** (Asia/Yangon) | e.g. "ယနေ့ဝင်ငွေ" – show as `K {today_income}` or formatted; use `"--"` if null/missing. |
| `yesterday_income` | string | Same for **yesterday** | "မနေ့က ဝင်ငွေ". |
| `referral_count` | number | Total users who registered with this user's referral code | "ဖိတ်ခေါ် ဦးရေ". |
| `official_players_count` | number | Referred users who have at least one confirmed deposit | "တရားဝင်ဆော့သူများ". |

- All amounts are strings with two decimals (e.g. `"123.45"`). Display as `K {value}` or with thousand separators.
- If a key is missing, treat as zero or show `"--"`.

---

### 4.3 Income breakdown (3 cards)

**Endpoint:** `GET /user/referral/income`  
**Auth:** Required.

**Response:**

```json
{
  "status": "success",
  "data": {
    "referral_rewards": {
      "amount": "0.00",
      "bonuses_issued_count": 0
    },
    "achievement_rewards": {
      "amount": "0.00",
      "bonuses_issued_count": 0
    },
    "deposit_refund": {
      "amount": "0.00",
      "bonuses_issued_count": 0
    }
  }
}
```

| Key | Label (Myanmar) | Description |
|-----|------------------|-------------|
| `referral_rewards` | ဖိတ်စာဆုများ | Referral/commission rewards (e.g. from referred users' activity). |
| `achievement_rewards` | အောင်မြင်မှုဆုလာဘ်များ | Achievement / milestone bonuses. |
| `deposit_refund` | အပ်ငွေ ပြန်အမ်းငွေ | Deposit cashback / refund. |

- **`amount`:** string, two decimals; display as `K {amount}`.
- **`bonuses_issued_count`:** integer; e.g. "{n} ဘောနပ်စ်ထုတ်ထားသည်".
- If a category is missing, show default (e.g. `"0.00"` and `0`).

---

### 4.4 Leaderboard (top referrers)

**Endpoint:** `GET /user/referral/leaderboard`  
**Auth:** Required (same as other referral endpoints).

**Query (optional):** `limit=3` (default 3, max 50).

**Response:**

```json
{
  "status": "success",
  "data": [
    { "rank": 1, "user_name": "th*****d", "total_income": "56324.72" },
    { "rank": 2, "user_name": "td*****2", "total_income": "32589.62" },
    { "rank": 3, "user_name": "qw*****3", "total_income": "12596.32" }
  ]
}
```

- **rank:** 1 = first, 2 = second, 3 = third.
- **user_name:** Masked (e.g. first 2 + last 1 + `*****`). Use as-is.
- **total_income:** string, two decimals; display as "K 56,324.72" etc.
- If no data, `data` is `[]`.

---

## 5. Frontend integration summary

| Feature | Source | Notes |
|--------|--------|------|
| Referral link | Frontend | `https://yoursite.com/?r=` or `?ref=` + **`authUser.user_name`** (user_name only; do not use agent_referralCode). |
| New user attribution | `POST /auth/register` | Send `referralCode` from `localStorage` (set from `?ref=`, `?r=`, or `?code=` on any route). Backend links referrer. |
| Commissioner on account | `GET /auth/user` | Show `data.commissioner` (referrer's user_name). |
| Summary (4 cards) | `GET /user/referral/summary` | `today_income`, `yesterday_income`, `referral_count`, `official_players_count`. |
| Income (3 cards) | `GET /user/referral/income` | `referral_rewards`, `achievement_rewards`, `deposit_refund` (each `amount` + `bonuses_issued_count`). |
| Leaderboard | `GET /user/referral/leaderboard?limit=3` | Array of `{ rank, user_name, total_income }`. |

---

## 6. Error handling

- **401 Unauthorized:** Missing or invalid token on protected endpoints. Redirect to login or show login modal.
- **4xx/5xx:** Use existing app error handling; same shapes as auth (e.g. `errors`, `message`). Show message to user where appropriate.
- Summary/income return **200** with zero/default values when the user has no referrals; do **not** treat as 404.

---

## 7. Checklist for frontend

- [x] Registration: store `?ref=`, `?r=`, or `?code=` from any route in `localStorage.referralCode`; send as `referralCode` in `POST /auth/register`.
- [x] Account page: show `data.commissioner` from `GET /auth/user` when present.
- [x] Invite page: build referral link from `user_name`.
- [x] Invite page: call `GET /user/referral/summary` and show the 4 summary cards.
- [x] Invite page: call `GET /user/referral/income` and show the 3 income cards (amount + bonuses count).
- [x] Invite page: call `GET /user/referral/leaderboard?limit=3` and show top referrers.
- [x] All referral endpoints: send `Authorization: Bearer <token>`; on 401, show login modal.
