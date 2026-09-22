# Referral System – API Implementation Detail

This document specifies the API contract for the **referral / invite** feature so the backend can be implemented to match the existing frontend (Vue 3 + axios, base URL `https://api.tiger899.com/api/`).

---

## 1. Project context

- **Base URL:** `https://api.tiger899.com/api/`
- **Auth:** `Authorization: Bearer <token>` (token from login, stored in `localStorage.token`)
- **Conventions:** JSON request/response; success responses use `status: "success"` and `data`; errors use `errors` object or message fields as in existing auth endpoints.

---

## 2. Existing endpoints to extend

### 2.1 Registration (referral attribution)

**Endpoint:** `POST /auth/register`  
**Current frontend payload (relevant fields):**

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

**Backend requirements:**

- Accept **`referralCode`** (optional). Value is the **referrer’s identifier** (e.g. username or user id) from the invite link `?r=<code>`.
- If `referralCode` is present and valid:
  - Resolve it to the referrer user (e.g. by `user_name` or dedicated `referral_code`).
  - Store on the **new user** a reference to the referrer, e.g.:
    - `referred_by_id` (user id of referrer), or
    - `commissioner` (referrer’s username) — this is what the frontend displays.
  - If your API returns user in login/register response, include `commissioner` (or equivalent) for the new user.
- If `referralCode` is missing or invalid, create the user without a referrer; do not fail registration.
- Return the same success/error shape you already use (e.g. `{ status: "success", data: { ... } }`).

### 2.2 Current user (show referrer / commissioner)

**Endpoint:** `GET /auth/user`  
**Headers:** `Authorization: Bearer <token>`

**Backend requirements:**

- Response must include the logged-in user object. The frontend expects:
  - `data.data` – full user object.
  - `data.data.amount` – balance.
  - `data.data.commissioner` – **optional string**: “upper line” / referrer username. Shown on Account page as “ကိုယ်စားလှယ်” (Upper Line). If the user was referred, set this to the referrer’s username (or same identifier you use for `referralCode`).

So the **user** object (at least) should support:

- `id`, `user_name` (or `name`), `amount`, `commissioner`, and any other fields you already return.

---

## 3. New endpoints for referral dashboard (Invite page)

The Invite page (`/invite`) shows:

1. **Referral link** – built on frontend from current user’s `user_name` (or `name` or `id`):  
   `https://yoursite.com/?r=<user_name>`. No API needed for the link itself.
2. **Summary cards** – 4 stats (today’s income, yesterday’s income, referral count, official players).
3. **Income cards** – 3 items (referral rewards, achievement rewards, deposit refund/cashback) with amount and “X bonuses issued” subtitle.
4. **Leaderboard** – top 3 referrers (optional; can stay static or come from API).

All new endpoints below require **authentication** (`Authorization: Bearer <token>`). Return `401` when token is missing or invalid.

---

### 3.1 Referral summary (for the 4 summary cards)

**Endpoint:** `GET /user/referral/summary`  
**Auth:** Required

**Response shape (suggested):**

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

**Field semantics:**

| Field | Description | Frontend usage |
|-------|-------------|----------------|
| `today_income` | Referrer’s commission/income from referred users for **today** (e.g. sum of referral rewards credited today). | “ယနေ့ဝင်ငွေ” – show as-is or formatted (e.g. "K 1,234.00"); use "--" if null/absent. |
| `yesterday_income` | Same for **yesterday**. | “မနေ့က ဝင်ငွေ”. |
| `referral_count` | Total number of users who registered using this user’s referral code (lifetime or as per your biz rule). | “ဖိတ်ခေါ် ဦးရေ”. |
| `official_players_count` | Number of referred users who are “official” (e.g. completed first deposit, or met your criteria). | “တရားဝင်ဆော့သူများ”. |

- All numeric values can be returned as string (e.g. `"0"`, `"123.45"`) for consistency with currency display. Frontend will show "--" when value is null or when the key is missing.

---

### 3.2 Referral income breakdown (for the 3 income cards)

**Endpoint:** `GET /user/referral/income`  
**Auth:** Required

**Response shape (suggested):**

```json
{
  "status": "success",
  "data": {
    "referral_rewards": {
      "amount": "2701000.00",
      "bonuses_issued_count": 315
    },
    "achievement_rewards": {
      "amount": "234761.00",
      "bonuses_issued_count": 109
    },
    "deposit_refund": {
      "amount": "1939314.42",
      "bonuses_issued_count": 1200
    }
  }
}
```

**Field semantics:**

| Key | Description | Frontend label (Myanmar) |
|-----|-------------|--------------------------|
| `referral_rewards` | Total referral rewards (e.g. bonuses given for successful referrals). | ဖိတ်စာဆုများ |
| `achievement_rewards` | Achievement / milestone bonuses. | အောင်မြင်မှုဆုလာဘ်များ |
| `deposit_refund` | Deposit cashback / refund total. | အပ်ငွေ ပြန်အမ်းငွေ |

- `amount`: string, two decimal places (e.g. `"1234.56"`). Frontend displays as `K <amount>`.
- `bonuses_issued_count`: integer; frontend shows e.g. “315 ဘောနပ်စ်ထုတ်ထားသည်”.

If a category is not implemented yet, omit it or return `null`; frontend can show default/placeholder.

---

### 3.3 Top referrers leaderboard (optional)

**Endpoint:** `GET /user/referral/leaderboard`  
**Auth:** Optional (can be public or require login)  
**Query params (optional):** `limit=3` (default 3 for top 3)

**Response shape (suggested):**

```json
{
  "status": "success",
  "data": [
    { "rank": 2, "user_name": "td*****2", "total_income": "32589616.00" },
    { "rank": 1, "user_name": "th*****d", "total_income": "56324721.00" },
    { "rank": 3, "user_name": "qw*****3", "total_income": "12596322.00" }
  ]
}
```

- **rank:** 1 = first, 2 = second, 3 = third.
- **user_name:** Masked (e.g. show first 2 + last 1 + `*****`). Backend can return pre-masked or full; if full, frontend will mask.
- **total_income:** string, two decimals; frontend shows “K 56,324,721.00”.

If this endpoint is not implemented, the frontend can keep using static placeholder data for the leaderboard.

---

## 4. Data model / business logic (suggested)

- **Users table:** Add (if not present) `referred_by_id` (FK to users.id) and/or `commissioner` (denormalized referrer username). Alternatively store only `referred_by_id` and derive `commissioner` in API from referrer’s `user_name`.
- **Referral code:** Use existing unique field such as `user_name` (invite link is `?r=user_name`). Or add a dedicated `referral_code` (unique) and use that in links and in `POST /auth/register` as `referralCode`.
- **Income metrics:** Depending on your business:
  - **today_income / yesterday_income:** Sum of “referral commission” or “referrer reward” transactions where `created_at` is today / yesterday and `user_id` = referrer.
  - **referral_count:** Count of users where `referred_by_id = current_user.id` (or equivalent).
  - **official_players_count:** Same as above but filtered e.g. by “has at least one deposit” or “has verified” etc.
  - **referral_rewards / achievement_rewards / deposit_refund:** Sum of bonus/reward amounts by type; bonuses_issued_count = count of such bonus records.

---

## 5. Frontend integration summary

| Feature | Source | Notes |
|--------|--------|------|
| Referral link | Frontend | `https://yoursite.com/?r=` + `authUser.user_name` (or `name` or `id`). |
| New user attribution | `POST /auth/register` | Send `referralCode`; backend saves referrer link. |
| Commissioner on account | `GET /auth/user` | `data.data.commissioner` (referrer username). |
| Summary (4 cards) | `GET /user/referral/summary` | `today_income`, `yesterday_income`, `referral_count`, `official_players_count`. |
| Income (3 cards) | `GET /user/referral/income` | `referral_rewards`, `achievement_rewards`, `deposit_refund` (each `amount` + `bonuses_issued_count`). |
| Leaderboard | `GET /user/referral/leaderboard` (optional) | Array of `{ rank, user_name, total_income }`. |

---

## 6. Error handling

- **401 Unauthorized:** Missing or invalid token on protected referral endpoints. Frontend will redirect to login or show login modal as per existing app behaviour.
- **404:** Referral summary/income can return empty/default values instead of 404 if no data yet (e.g. new user with no referrals).
- Use the same error response shape as existing auth (e.g. `{ errors: { field: ["message"] } }` or `{ message: "..." }`) so the frontend can show messages consistently.

---

## 7. Checklist for backend

- [ ] `POST /auth/register` accepts `referralCode` and stores referrer link (e.g. `referred_by_id` / `commissioner`).
- [ ] `GET /auth/user` returns `commissioner` (referrer username) for referred users.
- [ ] `GET /user/referral/summary` returns the four summary metrics (or defaults).
- [ ] `GET /user/referral/income` returns the three income categories with amount and count.
- [ ] (Optional) `GET /user/referral/leaderboard` returns top 3 referrers.
- [ ] All referral endpoints use Bearer auth and return JSON with `status` and `data` where applicable.

Once these are implemented, the frontend can call the new endpoints and replace the current placeholder data on the Invite page (and keep using existing register + auth/user behaviour).
