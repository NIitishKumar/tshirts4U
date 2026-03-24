# tshirts4U

Streetwear storefront built with Next.js App Router.

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Copy env file and add keys:

```bash
cp .env.example .env
```

3. Start development server:

```bash
npm run dev
```

## Order Flow (Razorpay + JSON store)

This project now includes:

- Add to cart flow from product pages into local storage cart
- Checkout with payment method selection: `card`, `upi`, `cod`
- Server-side order creation and price validation
- Razorpay order create + signature verification APIs
- COD confirmation API
- Order cancellation API (before shipped/delivered)
- Order tracking page with status timeline at `/orders/[orderId]`

## Login + OTP Session Flow

This project now uses custom JWT cookie auth with OTP-only login:

- Login page at `/login` supports OTP login using `email` or `phone`
- Checkout requires `email` + `phone` and OTP verification before placing order
- OTP verification auto-creates or reuses a user and creates a session
- Orders are linked to `userId` and are only readable/cancellable by owner

Auth APIs:

- `POST /api/auth/otp/send`
- `POST /api/auth/otp/verify`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Storage

Orders are stored in a temporary JSON file at `data/orders.json` for local development/demo usage.
Users are stored in `data/users.json`.
OTP challenges are stored in `data/otp-challenges.json`.

### Required env vars

- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `AUTH_JWT_SECRET`

### Important note for local demo

For `card`/`upi`, checkout currently uses a development signature bypass (`dev_signature`) in development mode only. Replace this with Razorpay Checkout + real callback verification for production use.

For OTP in development, send endpoint logs OTP to server output and returns `devCode`. Replace with real SMS/email provider integration for production.
