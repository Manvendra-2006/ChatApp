# ChatApp frontend

## Run locally

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_USER_API_URL` and `VITE_CHAT_API_URL` to the user and chat service origins (use the `PORT` configured for each backend service).
3. Run `npm install`, then `npm run dev`.

The backend CORS configuration currently permits `http://localhost:5173`; keep Vite on its default port unless the backend CORS setting is updated separately.

## Backend routes used

- User: `POST /api/user/login`, `POST /api/user/verify`, `GET /api/user/account`, `PATCH /api/user/update`, `GET /api/user/AllUser`.
- Chat: `POST /api/chat/newchat`, `GET /api/chat/getALlChats`, `GET /api/chat/getMessagesByChat/:chatId`, `POST /api/chat/sendMessage`.

The OTP verification API returns `{ message, user }` and sets the signed JWT in a browser-readable `token` cookie; the token is not included in the JSON response. After verification, the frontend copies this cookie value into `localStorage` under `token`. The centralized API client sends it as `Authorization: Bearer <token>`, a format accepted by the backend authentication middleware, and continues to include credentials for the cookie.

Use the same host name for the frontend and both backend service URLs (for example, `localhost`, not a mix of `localhost` and `127.0.0.1`) so the frontend can read the cookie issued by the API. On page refresh, the frontend restores the account from `GET /api/user/account` using the saved token; an expired token is cleared, while temporary API/network errors show a retry state instead of signing the user out. The current API has no signup, logout, dedicated user-search, or avatar endpoints. New accounts are created during successful OTP verification; people search filters the authenticated all-users response. Sign-out clears only the auth token and browser cookie because the backend does not expose a logout route. Images are sent only through the chat message endpoint.

Chat lists, people, and message history load over REST. No polling or socket events are used.
