# 💬 ChatApp

**A full-stack real-time messaging platform** — built with a service-oriented Node.js backend, API Gateway, secure OTP authentication, asynchronous email processing, media sharing, and real-time message status updates.

> Sign in with your email → verify your OTP → create conversations → send text or images → track unread messages and read status in real time.

---

## 📖 Table of Contents

* [Why this exists](#-why-this-exists)
* [Who it's for](#-who-its-for)
* [Features](#-features)

  * [Authentication](#-authentication)
  * [API Gateway](#-api-gateway)
  * [Messaging](#-messaging)
  * [Media Sharing](#-media-sharing)
  * [Real-Time Features](#-real-time-features)
* [Tech Stack](#️-tech-stack)
* [Architecture](#️-architecture)

  * [API Gateway Flow](#-api-gateway-flow)
  * [OTP Authentication Flow](#-otp-authentication-flow)
  * [Message Flow](#-message-flow)
  * [Message Seen Flow](#-message-seen-flow)
* [Core Data Model](#-core-data-model)
* [API Overview](#-api-overview)
* [Getting Started](#-getting-started)
* [Environment Variables](#-environment-variables)
* [Folder Structure](#-folder-structure)
* [Challenges & What I Learned](#-challenges--what-i-learned)
* [Roadmap](#️-roadmap)
* [Security Considerations](#-security-considerations)
* [Project Highlights](#-project-highlights)
* [License](#-license)

---

## 💡 Why this exists

Modern messaging applications look simple from the user's perspective, but behind a single message there are several systems working together — authentication, API routing, database persistence, media storage, background processing, unread tracking, and real-time communication.

**ChatApp** was built to understand and implement these systems together rather than treating a chat application as just a CRUD project.

The application provides a complete messaging flow:

**Authentication → API Gateway → User Discovery → Chat Creation → Message Delivery → Media Upload → Read Tracking → Real-Time Status Updates**

The backend follows a **service-oriented architecture**, where different responsibilities are separated into independent services. An **API Gateway** acts as the entry point between the frontend and backend services.

---

## 👥 Who it's for

| **User**                | **What they get**                                                                                                            |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 👤 **User**             | Secure OTP-based authentication, user profile, chat creation, and one-to-one conversations                                   |
| 💬 **Chat Participant** | Text messaging, image sharing, unread message counts, timestamps, and read status                                            |
| ⚙️ **System**           | API Gateway routing, Redis temporary storage, RabbitMQ background processing, Cloudinary media storage, and Socket.IO events |

---

# ✨ Features

## 🔐 Authentication

* **📧 OTP-based Login** — users authenticate using email verification.
* **⏱️ OTP Expiration** — OTPs are stored in Redis with a limited lifetime.
* **🚦 OTP Rate Limiting** — Redis-based rate limiting prevents repeated OTP requests within a short period.
* **🔑 JWT Authentication** — authenticated requests are protected using JWT-based authentication.
* **🍪 Secure Authentication** — authentication can be maintained through HTTP-only cookies according to the backend configuration.
* **🛡️ Protected APIs** — chat and messaging operations require an authenticated user.

---

## 🌐 API Gateway

ChatApp uses an **API Gateway as a single entry point** between the frontend and backend microservices.

* **🚪 Single Entry Point** — frontend API requests are sent through the API Gateway.
* **🔀 Request Routing** — forwards requests to the appropriate backend service.
* **🧩 Service Abstraction** — keeps internal service URLs hidden from the frontend.
* **📡 Microservice Communication** — connects the frontend with independently running services.
* **🔐 Centralized Request Handling** — provides a common layer for request processing and authentication-related handling.
* **📦 Service Isolation** — individual services can be developed and deployed independently.

---

## 💬 Messaging

* **👥 One-to-One Chats** — users can create private conversations with another user.
* **🗂️ Chat List** — displays conversations along with the latest message and updated time.
* **🔢 Unread Message Count** — unread messages are calculated per conversation.
* **📝 Text Messages** — send and persist normal text messages.
* **🕐 Message Timestamps** — messages store creation and update timestamps.
* **👁️ Read Tracking** — messages contain `seen` and `seenAt` fields.
* **✓✓ Real-Time Read Status** — message status can update without requiring a page reload.

---

## 🖼️ Media Sharing

* **📤 Image Messages** — users can send images inside conversations.
* **📦 Multipart Uploads** — images are handled through multipart form data.
* **☁️ Cloudinary Storage** — uploaded images are stored externally instead of directly inside MongoDB.
* **🔗 Media References** — messages store the Cloudinary URL and public ID.
* **🖼️ Image Preview** — frontend can display uploaded images directly inside the conversation.

---

## ⚡ Real-Time Features

* **🔌 Socket.IO Integration** — enables real-time communication between connected users.
* **📨 New Message Events** — messages can be pushed to connected clients without refreshing.
* **👁️ Message Seen Events** — when the recipient reads a message, the sender can receive an immediate status update.
* **✓ Single Tick** — message has been sent but has not yet been read.
* **✓✓ Double Tick** — message has been read by the recipient.
* **🔵 Read Indicator** — frontend can visually distinguish read messages from unread messages.

> Socket.IO handles real-time events, while REST APIs handle normal database operations and persistent data fetching.

---

# 🛠️ Tech Stack

| **Layer**      | **Technology**                          |
| -------------- | --------------------------------------- |
| Frontend       | React, Vite, React Router, Tailwind CSS |
| API Client     | Axios                                   |
| API Gateway    | Node.js, Express.js                     |
| Backend        | Node.js, Express.js                     |
| Database       | MongoDB + Mongoose                      |
| Authentication | JWT + OTP                               |
| Temporary Data | Redis                                   |
| Message Broker | RabbitMQ                                |
| Email          | Nodemailer + SMTP                       |
| Media Storage  | Cloudinary                              |
| File Handling  | Multer                                  |
| Real-Time      | Socket.IO                               |
| Deployment     | Vercel / Render / Cloud Infrastructure  |

---

# 🏗️ Architecture

ChatApp follows a **service-oriented backend architecture**.

The frontend communicates with the **API Gateway**, which routes requests to the appropriate backend service.

```text
                         ┌──────────────────────┐
                         │      React App       │
                         │   Vite + Tailwind    │
                         └──────────┬───────────┘
                                    │
                              HTTP / REST
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │     API Gateway      │
                         │                      │
                         │ Request Routing      │
                         │ Service Proxying     │
                         │ Request Handling     │
                         └──────────┬───────────┘
                                    │
             ┌──────────────────────┼──────────────────────┐
             │                      │                      │
             ▼                      ▼                      ▼
      ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
      │ User Service │       │ Chat Service │       │ Utility Svc  │
      │              │       │              │       │              │
      │ Auth         │       │ Chats        │       │ Upload       │
      │ OTP          │       │ Messages     │       │ Cloudinary   │
      │ Users        │       │ Socket.IO    │       │              │
      └──────┬───────┘       └──────┬───────┘       └──────┬───────┘
             │                      │                      │
             ▼                      ▼                      ▼
      ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
      │    Redis     │       │   MongoDB    │       │  Cloudinary  │
      │              │       │              │       │              │
      │ OTP          │       │ Users        │       │ Images       │
      │ Expiration   │       │ Chats        │       │ Media        │
      │ Rate Limit   │       │ Messages     │       │              │
      └──────────────┘       └──────────────┘       └──────────────┘

                         ┌──────────────────────┐
                         │      RabbitMQ        │
                         │   OTP / Email Queue  │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │     Mail Service     │
                         │      Nodemailer      │
                         └──────────────────────┘
```

---

## 🌐 API Gateway Flow

The API Gateway acts as the **single entry point** for frontend API requests.

```text
                    React Frontend
                          │
                          │ API Request
                          ▼
                  ┌─────────────────┐
                  │   API Gateway   │
                  └────────┬────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
   User Service      Chat Service     Utility Service
          │                │                │
          ▼                ▼                ▼
       Redis           MongoDB         Cloudinary
```

For example:

```text
POST /api/user/send-otp
        │
        ▼
   API Gateway
        │
        ▼
   User Service
        │
        ▼
      Redis
        │
        ▼
    RabbitMQ
        │
        ▼
   Mail Service
```

This keeps the frontend independent from the internal URLs and implementation details of individual services.

---

## 🔄 OTP Authentication Flow

```text
User
 │
 │ Enter Email
 ▼
React Frontend
 │
 ▼
API Gateway
 │
 ▼
User Service
 │
 │ Generate OTP
 ▼
Redis
 │
 │ Store OTP with TTL
 ▼
RabbitMQ
 │
 │ send-otp queue
 ▼
Mail Service
 │
 │ Nodemailer / SMTP
 ▼
User's Email
 │
 │ Enter OTP
 ▼
React Frontend
 │
 ▼
API Gateway
 │
 ▼
User Service
 │
 │ Verify OTP
 ▼
JWT Authentication
 │
 ▼
ChatApp
```

---

## 💬 Message Flow

```text
User A
 │
 │ Send message
 ▼
React Frontend
 │
 │ REST API
 ▼
API Gateway
 │
 ▼
Chat Service
 │
 ├──────────────► MongoDB
 │                Save Message
 │
 └──────────────► Socket.IO
                    │
                    ▼
                 User B
```

---

## 👁️ Message Seen Flow

```text
User B opens conversation
          │
          ▼
    React Frontend
          │
          ▼
     API Gateway
          │
          ▼
     Chat Service
          │
          ├── Mark message as seen
          │      seen = true
          │      seenAt = Date
          │
          ▼
      Socket.IO
          │
          ▼
       User A
          │
          ▼
        ✓✓
```

---

# 🧬 Core Data Model

## User

```text
User
├── name
├── email
├── password / authentication data
├── profile information
└── timestamps
```

---

## Chat

A `Chat` represents a conversation between two users.

```text
Chat
├── users[]
│   ├── userId
│   └── userId
├── latestMessage
│   ├── text
│   └── sender
└── timestamps
```

The application uses both user IDs to identify a one-to-one conversation regardless of their order.

---

## Message

```text
Message
├── chatId
├── sender
├── text
├── image
│   ├── url
│   └── publicId
├── messageType
├── seen
├── seenAt
└── timestamps
```

Supported message types include:

```text
text
Image
```

---

# 🔌 API Overview

> Endpoint names may vary depending on the deployed service configuration. The frontend communicates through the API Gateway rather than directly depending on internal service URLs.

| **Method** | **Endpoint**                      | **Purpose**                          |
| ---------- | --------------------------------- | ------------------------------------ |
| `POST`     | `/api/user/...`                   | User authentication / OTP operations |
| `GET`      | `/api/user/getUserDetail/:userId` | Fetch user details                   |
| `GET`      | `/api/chat/...`                   | Fetch user chats                     |
| `POST`     | `/api/chat/...`                   | Create a new chat                    |
| `GET`      | `/api/chat/messagebychat/:chatId` | Fetch messages for a conversation    |
| `POST`     | `/api/chat/send-message`          | Send text/image message              |
| `POST`     | `/api/upload`                     | Upload media through utility service |

### Request Architecture

```text
Frontend
   │
   ▼
API Gateway
   │
   ├── /api/user/* ───────► User Service
   │
   ├── /api/chat/* ───────► Chat Service
   │
   └── /api/upload ───────► Utility Service
```

The exact API request and response structures are defined by the backend services.

---

# 🚀 Getting Started

## Prerequisites

Make sure the following are installed:

* Node.js ≥ 18
* MongoDB / MongoDB Atlas
* Redis / Upstash Redis
* RabbitMQ
* Cloudinary account
* SMTP / Gmail App Password or supported mail provider
* Git

---

## Clone the Repository

```bash
git clone https://github.com/Manvendra-2006/ChatApp.git

cd ChatApp
```

---

## Install Dependencies

Each service has its own dependencies.

Example:

```bash
cd Backend/user
npm install
```

API Gateway:

```bash
cd Backend/api-gateway
npm install
```

Chat Service:

```bash
cd Backend/chat
npm install
```

Mail Service:

```bash
cd Backend/mail
npm install
```

Utility Service:

```bash
cd Backend/utility
npm install
```

Frontend:

```bash
cd Frontend/frontend
npm install
```

---

## Start RabbitMQ

Make sure RabbitMQ is running before starting services that publish or consume messages.

Standard RabbitMQ ports:

```text
AMQP:
5672

Management UI:
15672
```

RabbitMQ Management Dashboard:

```text
http://localhost:15672
```

---

## Start Backend Services

Start the services individually.

For example:

```bash
npm run dev
```

or:

```bash
npm start
```

depending on the service configuration.

The API Gateway should be running before sending frontend API requests.

---

## Start Frontend

```bash
cd Frontend/frontend
npm run dev
```

The Vite development server will provide the local frontend URL.

---

# 🔐 Environment Variables

## API Gateway

```env
PORT=

USER_SERVICE=
CHAT_SERVICE=
UTILITY_SERVICE=

CLIENT_URL=
```

---

## User Service

```env
PORT=1000

MONGO_URI=

REDIS_URL=

RABBITMQ_HOST=
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=
RABBITMQ_PASSWORD=

JWT_SECRET=
```

---

## Chat Service

```env
PORT=

MONGO_URI=

USER_SERVICE=
UTILI_SERVICE=

JWT_SECRET=

CLIENT_URL=
```

---

## Utility / Upload Service

```env
PORT=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## Mail Service

```env
RABBITMQ_HOST=
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=
RABBITMQ_PASSWORD=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
```

---

## Frontend

```env
VITE_USER_API_URL=
VITE_CHAT_API_URL=
VITE_UTILITY_API_URL=
```

> Never commit real API keys, database credentials, JWT secrets, SMTP passwords, or Cloudinary secrets to GitHub.

---

# 📁 Folder Structure

The project follows a separated frontend/backend and service-oriented architecture.

```text
ChatApp/
│
├── Frontend/
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── routes/
│       │   ├── services/
│       │   ├── context/
│       │   ├── App.jsx
│       │   └── main.jsx
│       │
│       ├── public/
│       ├── .env.local
│       └── package.json
│
└── Backend/
    │
    ├── api-gateway/
    │   ├── routes/
    │   ├── middleware/
    │   ├── config/
    │   └── server.js
    │
    ├── user/
    │   ├── controller/
    │   ├── models/
    │   ├── routes/
    │   ├── middleware/
    │   ├── config/
    │   └── server.js
    │
    ├── chat/
    │   ├── controller/
    │   ├── models/
    │   ├── routes/
    │   ├── middleware/
    │   ├── config/
    │   └── server.js
    │
    ├── mail/
    │   ├── consumer/
    │   ├── config/
    │   └── server.js
    │
    └── utility/
        ├── controller/
        ├── routes/
        ├── config/
        └── server.js
```

---

# 🧩 Challenges & What I Learned

### 🔐 OTP Lifecycle and Rate Limiting

Learned how Redis can store temporary authentication data using TTLs and how separate keys can be used to control OTP request frequency.

### 🌐 API Gateway Architecture

Learned how an API Gateway can act as a **single entry point** between the frontend and multiple backend services.

It helped separate the frontend from internal service URLs and provided a centralized layer for request routing.

### 🐇 Asynchronous Email Processing

Instead of making the main authentication flow responsible for sending email directly, RabbitMQ is used to place OTP email jobs into a queue which the mail service consumes.

### 📨 RabbitMQ Producer-Consumer Architecture

Learned the difference between connections, channels, queues, producers, and consumers and how services communicate through AMQP.

### 📦 Multipart/Form-Data Handling

Learned why `express.json()` cannot parse multipart requests and how Multer handles uploaded image files.

### ☁️ Media Storage Architecture

Instead of storing image files directly in MongoDB, images are uploaded to Cloudinary while MongoDB stores the media URL and public ID.

### 👥 One-to-One Chat Modeling

Used MongoDB queries with `$all` and `$size` to identify whether a conversation between the same two users already exists.

### 👁️ Message Read Tracking

Implemented `seen` and `seenAt` fields to distinguish unread messages from messages that have been viewed.

### ⚡ Real-Time Message Status

Learned that database state alone does not automatically update another user's UI. Socket.IO events are used to push read-status changes to connected clients without requiring a refresh.

### 🔑 Authentication Consistency

Learned the importance of consistently handling authenticated user IDs across middleware, controllers, chat queries, and message ownership checks.

### 🌐 Microservice Communication

Learned how independent backend services can communicate using REST APIs while RabbitMQ handles asynchronous background workflows.

---

# 🗺️ Roadmap

* [ ] Typing indicators
* [ ] Online / offline presence
* [ ] Last seen status
* [ ] Message delivery status
* [ ] Message deletion
* [ ] Edit messages
* [ ] Reply to messages
* [ ] Group chats
* [ ] Emoji picker
* [ ] File/document sharing
* [ ] Push notifications
* [ ] Voice messages
* [ ] Message search
* [ ] Better media gallery
* [ ] End-to-end encryption
* [ ] Production monitoring and logging

---

# 🔒 Security Considerations

ChatApp is designed with several security-focused practices:

* JWT-based authentication
* Protected chat APIs
* API Gateway as the frontend entry point
* OTP expiration
* OTP request rate limiting
* HTTP-only cookie support
* Backend authorization checks
* Chat membership validation
* Environment variables for secrets
* External media storage instead of storing raw files in MongoDB
* Service separation for better maintainability

---

# 📌 Project Highlights

```text
                    ┌─────────────────┐
                    │  React Frontend │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   API Gateway   │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
   User Service        Chat Service       Utility Service
          │                  │                  │
          ▼                  ▼                  ▼
       Redis             MongoDB          Cloudinary
          │                  │
          ▼                  ▼
      RabbitMQ         Socket.IO
          │                  │
          ▼                  ▼
    Mail Service        Real-Time Chat
                             │
                             ▼
                        ✓✓ Read Status
```

### Core Technologies

```text
🔐 OTP Authentication
        ↓
⚡ Redis Temporary Storage
        ↓
🐇 RabbitMQ Email Queue
        ↓
📧 Mail Service
        ↓
🌐 API Gateway
        ↓
💬 Chat Service
        ↓
🍃 MongoDB
        ↓
☁️ Cloudinary Media
        ↓
⚡ Socket.IO Real-Time Events
        ↓
✓✓ Live Message Read Status
```

ChatApp is more than a basic CRUD messaging project — it combines **authentication, API Gateway architecture, caching, message queues, service-oriented backend design, media storage, database modeling, REST APIs, and real-time communication** into one full-stack application.

---

# 📄 License

This project is built for learning, experimentation, and portfolio purposes.

---

Built by **Manvendra Bhardwaj** 💬
