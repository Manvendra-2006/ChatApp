# ChatApp frontend

## Run locally

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_USER_API_URL` and `VITE_CHAT_API_URL` to the user and chat service origins (use the `PORT` configured for each backend service).
3. Run `npm install`, then `npm run dev`.

The backend CORS configuration currently permits `http://localhost:5173`; keep Vite on its default port unless the backend CORS setting is updated separately.

## Backend routes used

- User: `POST /api/user/login`, `POST /api/user/verify`, `POST /api/user/logout`, `GET /api/user/account`, `PATCH /api/user/update`, `GET /api/user/AllUser`.
- Chat: `POST /api/chat/newchat`, `GET /api/chat/getALlChats`, `GET /api/chat/getMessagesByChat/:chatId`, `POST /api/chat/sendMessage`.

The OTP verification API returns `{ message, user }` and sets the signed JWT in an `HttpOnly` cookie named `token`. The frontend never reads or stores the JWT; authenticated requests use `credentials: "include"` so the browser sends the cookie automatically. Sign-out posts to `/api/user/logout`, which clears the server-set cookie.

The backend cookie is `HttpOnly`, `Secure`, and `SameSite=None` for cross-origin requests. On page refresh, the frontend restores the account from `GET /api/user/account` using the browser-managed cookie; an expired session returns the user to sign-in, while temporary API/network errors show a retry state. New accounts are created during successful OTP verification; people search filters the authenticated all-users response. Images are sent only through the chat message endpoint.

Chat lists, people, and message history load over REST. No polling or socket events are used.
