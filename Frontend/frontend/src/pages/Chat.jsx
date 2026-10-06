import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Avatar from '../components/Avatar'
import Icon from '../components/Icon'
import { useSocket } from '../context/SocketContext'
import useAuth from '../hooks/useAuth'
import { fetchChats, startChat } from '../services/chatService'
import { fetchMessages, sendMessage } from '../services/messageService'
import { fetchUsers } from '../services/userService'

/* ---------- styling helpers (design only) ---------- */
const glass =
  'border border-white/20 bg-white/10 backdrop-blur-2xl shadow-2xl shadow-black/25'
const iconBtn =
  'grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white/80 transition hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50'
const scrollArea =
  '[scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.3)_transparent]'

function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
  )
}

function normalizeConversation(item) {
  const peer = item?.user?.user || item?.user
  const chat = item?.chat || item
  if (!peer?._id || !chat?._id) return null
  return { peer, chat }
}

function formatTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  return date.toDateString() === now.toDateString()
    ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function MessageBubble({ message, own }) {
  return (
    <div className={`flex items-end gap-2 ${own ? 'justify-end' : 'justify-start'}`}>
      {!own && <Avatar name={message.senderName} size="tiny" />}
      <div
        className={`max-w-[80%] px-4 py-2.5 text-white shadow-lg sm:max-w-[70%] ${
          own
            ? 'rounded-2xl rounded-br-md border border-white/25 bg-gradient-to-br from-fuchsia-500/80 to-indigo-500/80 shadow-fuchsia-900/20'
            : 'rounded-2xl rounded-bl-md border border-white/20 bg-white/15 backdrop-blur-md'
        }`}
      >
        {message.image?.url && (
          <a href={message.image.url} target="_blank" rel="noreferrer">
            <img
              className="mb-2 max-h-64 w-full rounded-xl object-cover"
              src={message.image.url}
              alt="Shared image"
            />
          </a>
        )}
        {message.text && (
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.text}</p>
        )}
        <div className="mt-1 flex items-center justify-end gap-1.5 text-[10px] text-white/60">
          <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
          {own && message.seen && (
            <span className="text-cyan-300" aria-label="Seen">✓✓</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Chat() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [users, setUsers] = useState([])
  const [conversationLoading, setConversationLoading] = useState(true)
  const [conversationError, setConversationError] = useState('')
  const [messageLoading, setMessageLoading] = useState(false)
  const [usersLoading, setUsersLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [draft, setDraft] = useState('')
  const [file, setFile] = useState(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [userSearchError, setUserSearchError] = useState('')
  const [visibleOnMobile, setVisibleOnMobile] = useState(false)
  const [typingState, setTypingState] = useState(null)
  const { socket, onlineUserIds } = useSocket()
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)
  const messageInputRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const typingChatIdRef = useRef(null)
  const selectedChatId = selected?.chat?._id
  const peerOnline = Boolean(
    selected?.peer?._id && onlineUserIds.some((userId) => String(userId) === String(selected.peer._id)),
  )

  const loadConversations = useCallback(async () => {
    const result = await fetchChats()
    const normalized = result.map(normalizeConversation).filter(Boolean)
    setConversations(normalized)
    setConversationError('')
    return normalized
  }, [])

  useEffect(() => {
    loadConversations()
      .catch((loadError) => setConversationError(loadError.message))
      .finally(() => setConversationLoading(false))
    fetchUsers()
      .then(setUsers)
      .catch((loadError) => setUserSearchError(loadError.message))
      .finally(() => setUsersLoading(false))
  }, [loadConversations])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchText.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [searchText])

  useEffect(() => {
    if (!selected) {
      setMessages([])
      return
    }

    let cancelled = false
    setMessageLoading(true)
    setError('')
    fetchMessages(selected.chat._id)
      .then((result) => {
        if (!cancelled) setMessages(result.messages)
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message)
      })
      .finally(() => {
        if (!cancelled) setMessageLoading(false)
      })

    return () => { cancelled = true }
  }, [selected])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  useEffect(() => {
    if (!socket) return

    const handleIncomingMessage = (message) => {
      if (!message?.chatId) return
      const messageId = String(message._id)
      const isCurrentConversation = String(message.chatId) === String(selectedChatId)
      const isFromCurrentUser = String(message.sender) === String(user?._id)

      setMessages((currentMessages) => {
        if (currentMessages.some((item) => String(item._id) === messageId)) {
          return currentMessages.map((item) =>
            String(item._id) === messageId
              ? { ...item, ...message, seen: Boolean(message.seen) || item.seen }
              : item,
          )
        }

        return isCurrentConversation ? [...currentMessages, message] : currentMessages
      })

      setConversations((currentConversations) => currentConversations.map((conversation) => {
        if (String(conversation.chat._id) !== String(message.chatId)) {
          return conversation
        }

        const nextLatestMessage = {
          text: message.image?.url ? 'Image' : message.text || 'Image',
          sender: message.sender,
        }

        return {
          ...conversation,
          chat: {
            ...conversation.chat,
            latestMessage: nextLatestMessage,
            updatedAt: message.createdAt || new Date().toISOString(),
            unseenCount: isCurrentConversation || isFromCurrentUser
              ? conversation.chat.unseenCount || 0
              : (conversation.chat.unseenCount || 0) + 1,
          },
        }
      }))
    }

    const handleMessageSeen = ({ chatId, messageIds = [] }) => {
      if (!chatId || !Array.isArray(messageIds)) return
      const normalizedIds = messageIds.map((id) => String(id))
      const isCurrentConversation = String(chatId) === String(selectedChatId)

      setMessages((currentMessages) => currentMessages.map((message) =>
        normalizedIds.includes(String(message._id))
          ? { ...message, seen: true, seenAt: new Date().toISOString() }
          : message,
      ))

      if (!isCurrentConversation) {
        setConversations((currentConversations) => currentConversations.map((conversation) => {
          if (String(conversation.chat._id) !== String(chatId)) {
            return conversation
          }

          return {
            ...conversation,
            chat: {
              ...conversation.chat,
              unseenCount: 0,
            },
          }
        }))
      }
    }

    socket.on('newMessage', handleIncomingMessage)
    socket.on('messageSeen', handleMessageSeen)

    return () => {
      socket.off('newMessage', handleIncomingMessage)
      socket.off('messageSeen', handleMessageSeen)
    }
  }, [selectedChatId, socket, user?._id])

  const stopTyping = useCallback((chatId) => {
    const targetChatId = chatId || typingChatIdRef.current
    if (!targetChatId) return

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }

    if (String(typingChatIdRef.current) === String(targetChatId)) {
      socket?.emit('stopTyping', { chatId: String(targetChatId) })
      typingChatIdRef.current = null
    }
  }, [socket])

  const startTyping = useCallback((chatId) => {
    if (!socket || !chatId) return

    const normalizedChatId = String(chatId)
    if (typingChatIdRef.current && String(typingChatIdRef.current) !== normalizedChatId) {
      stopTyping(typingChatIdRef.current)
    }

    if (!typingChatIdRef.current) {
      socket.emit('typing', { chatId: normalizedChatId })
      typingChatIdRef.current = normalizedChatId
    }

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current)
    }
    typingTimeoutRef.current = window.setTimeout(() => {
      stopTyping(normalizedChatId)
    }, 750)
  }, [socket, stopTyping])

  useEffect(() => {
    setTypingState(null)

    return () => {
      const activeChatId = typingChatIdRef.current
      if (activeChatId && (!selectedChatId || String(activeChatId) === String(selectedChatId))) {
        stopTyping(activeChatId)
      }
    }
  }, [selectedChatId, stopTyping])

  useEffect(() => {
    if (!socket) return

    const handleUserTyping = (data) => {
      const { chatId, userId } = data || {}
      if (!chatId || !userId) return
      if (String(chatId) !== String(selectedChatId)) return
      if (String(userId) === String(user?._id)) return
      if (selected?.peer?._id && String(userId) !== String(selected.peer._id)) return
      setTypingState({ chatId: String(chatId), userId: String(userId) })
    }

    const handleUserStoppedTyping = (data) => {
      const { chatId, userId } = data || {}
      if (!chatId || String(chatId) !== String(selectedChatId)) return
      if (userId && String(userId) === String(user?._id)) return
      setTypingState((currentState) =>
        currentState &&
        String(currentState.chatId) === String(chatId) &&
        (!userId || String(currentState.userId) === String(userId))
          ? null
          : currentState,
      )
    }

    socket.on('userTyping', handleUserTyping)
    socket.on('userStoppedTyping', handleUserStoppedTyping)

    return () => {
      socket.off('userTyping', handleUserTyping)
      socket.off('userStoppedTyping', handleUserStoppedTyping)
    }
  }, [selected?.peer?._id, selectedChatId, socket, user?._id])

  useEffect(() => {
    if (!socket || !selectedChatId) return

    const previousChatId = sessionStorage.getItem('chatapp:activeChatId')
    if (previousChatId && previousChatId !== selectedChatId) {
      socket.emit('leaveChat', previousChatId)
    }

    socket.emit('joinChat', selectedChatId)
    sessionStorage.setItem('chatapp:activeChatId', selectedChatId)

    return () => {
      if (!socket) return
      if (sessionStorage.getItem('chatapp:activeChatId') === selectedChatId) {
        socket.emit('leaveChat', selectedChatId)
        sessionStorage.removeItem('chatapp:activeChatId')
      }
    }
  }, [selectedChatId, socket])

  useEffect(() => {
    const input = messageInputRef.current
    if (!input) return
    input.style.height = 'auto'
    input.style.height = `${Math.min(input.scrollHeight, 112)}px`
  }, [draft])

  const filteredUsers = useMemo(() => {
    if (!debouncedSearch) return []
    const query = debouncedSearch.toLocaleLowerCase()
    return users
      .filter((candidate) => candidate._id !== user?._id)
      .filter((candidate) =>
        `${candidate.name || ''} ${candidate.email || ''}`.toLocaleLowerCase().includes(query),
      )
      .slice(0, 8)
  }, [debouncedSearch, users, user?._id])

  const openConversation = (conversation) => {
    setSelected(conversation)
    setError('')
    setSearchText('')
    setVisibleOnMobile(true)
  }

  const openUser = async (candidate) => {
    setError('')
    try {
      const existing = conversations.find((conversation) => conversation.peer._id === candidate._id)
      if (existing) {
        openConversation(existing)
        return
      }

      const chatId = await startChat(candidate._id)
      if (!chatId) throw new Error('The server did not return a chat ID.')
      const refreshed = await loadConversations()
      const created = refreshed.find((conversation) => conversation.chat._id === chatId)
      openConversation(created || {
        peer: candidate,
        chat: { _id: chatId, latestMessage: null, unseenCount: 0 },
      })
    } catch (openError) {
      setError(openError.message)
    }
  }

  const handleSend = async (event) => {
    event.preventDefault()
    const text = draft.trim()
    if (!selected || (!text && !file) || sending) return
    if (text && file) {
      setError('Send an image or a text message separately.')
      return
    }

    stopTyping(selectedChatId)

    setSending(true)
    setError('')
    try {
      const data = await sendMessage({ chatId: selected.chat._id, text, file })
      if (!data?.message) throw new Error('The message was sent but no message data was returned.')
      setMessages((current) => {
        const messageExists = current.some((message) => String(message._id) === String(data.message._id))
        return messageExists ? current : [...current, data.message]
      })
      setConversations((current) => current.map((conversation) =>
        conversation.chat._id === selected.chat._id
          ? {
              ...conversation,
              chat: {
                ...conversation.chat,
                latestMessage: {
                  text: file ? 'Image' : text,
                  sender: user?._id,
                },
                updatedAt: data.message.createdAt || new Date().toISOString(),
              },
            }
          : conversation,
      ))
      setDraft('')
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (sendError) {
      setError(sendError.message)
    } finally {
      setSending(false)
    }
  }

  const handleLogout = async () => {
    setError('')
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch (logoutError) {
      setError(logoutError.message)
    }
  }

  return (
    <main className="relative flex h-screen w-full gap-4 overflow-hidden bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600 p-0 md:p-5">
      {/* decorative blurred blobs, give the glass something to blur */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-cyan-400/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-1/4 h-[28rem] w-[28rem] rounded-full bg-pink-500/40 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-10 h-72 w-72 rounded-full bg-indigo-400/40 blur-3xl" />

      {/* ---------------- sidebar ---------------- */}
      <aside
        className={`relative z-10 w-full shrink-0 flex-col overflow-hidden md:flex md:w-[360px] md:rounded-3xl ${glass} ${
          visibleOnMobile ? 'hidden' : 'flex'
        }`}
      >
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <Link className="flex items-center gap-3 text-xl font-bold text-white" to="/chat">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-400 to-indigo-500 text-white shadow-lg shadow-fuchsia-900/30">
              <Icon name="message" size={22} />
            </span>
            <span>
              Chat<span className="bg-gradient-to-r from-cyan-200 to-pink-200 bg-clip-text text-transparent">App</span>
            </span>
          </Link>
          <span className="text-[11px] font-semibold tracking-widest text-white/50">MESSAGES</span>
        </div>

        <div className="search-box mx-4 mb-3 flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3 py-2.5 text-white/70 transition focus-within:border-white/40 focus-within:bg-white/15">
          <Icon name="search" size={18} />
          <input
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/50"
            aria-label="Search people"
            placeholder="Search people…"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
          {searchText && (
            <button
              className="grid h-6 w-6 place-items-center rounded-full text-white/70 transition hover:bg-white/20 hover:text-white"
              aria-label="Clear search"
              onClick={() => setSearchText('')}
            >
              <Icon name="close" size={16} />
            </button>
          )}
        </div>

        <div className={`flex-1 space-y-1 overflow-y-auto px-3 pb-2 ${scrollArea}`}>
          {debouncedSearch ? (
            <>
              <div className="px-2 pb-1 pt-2 text-[11px] font-semibold tracking-widest text-white/50">PEOPLE</div>
              {usersLoading ? (
                <div className="flex items-center gap-2 px-2 py-4 text-sm text-white/70"><Spinner /> Searching people…</div>
              ) : userSearchError ? (
                <div className="rounded-xl border border-rose-300/40 bg-rose-500/20 px-3 py-3 text-sm text-rose-100">{userSearchError}</div>
              ) : filteredUsers.length ? filteredUsers.map((candidate) => (
                <button
                  className="group flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-left transition hover:border-white/20 hover:bg-white/15"
                  key={candidate._id}
                  onClick={() => openUser(candidate)}
                >
                  <Avatar name={candidate.name} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <strong className="truncate text-sm font-semibold text-white">{candidate.name}</strong>
                    <small className="truncate text-xs text-white/60">{candidate.email}</small>
                  </span>
                  <Icon name="arrow" size={17} className="text-white/40 transition group-hover:translate-x-1 group-hover:text-white" />
                </button>
              )) : <div className="px-2 py-4 text-sm text-white/70">No people found for “{debouncedSearch}”.</div>}
            </>
          ) : (
            <>
              <div className="px-2 pb-1 pt-2 text-[11px] font-semibold tracking-widest text-white/50">YOUR CONVERSATIONS</div>
              {conversationLoading ? (
                <div className="flex items-center gap-2 px-2 py-4 text-sm text-white/70"><Spinner /> Loading your chats…</div>
              ) : conversationError ? (
                <div className="flex flex-col items-start gap-2 rounded-xl border border-rose-300/40 bg-rose-500/20 px-3 py-3 text-sm text-rose-100">
                  <span>{conversationError}</span>
                  <button
                    className="rounded-lg bg-white/20 px-3 py-1 text-xs font-medium text-white transition hover:bg-white/30"
                    onClick={() => {
                      setConversationLoading(true)
                      loadConversations()
                        .catch((loadError) => setConversationError(loadError.message))
                        .finally(() => setConversationLoading(false))
                    }}
                  >Try again</button>
                </div>
              ) : conversations.length ? conversations.map(({ peer, chat }) => {
                const active = selected?.chat._id === chat._id
                const latestMessage = chat.latestMessage
                return (
                  <button
                    className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                      active
                        ? 'border-white/30 bg-white/20 shadow-lg shadow-black/10'
                        : 'border-transparent hover:border-white/15 hover:bg-white/10'
                    }`}
                    key={chat._id}
                    onClick={() => openConversation({ peer, chat })}
                  >
                    <Avatar name={peer.name} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <strong className="truncate text-sm font-semibold text-white">{peer.name || peer.email || 'ChatApp member'}</strong>
                      <small className="truncate text-xs text-white/60">{latestMessage?.text || 'Start a conversation'}</small>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1.5">
                      <time className="text-[11px] text-white/50">{formatTime(chat.updatedAt)}</time>
                      {chat.unseenCount > 0 && (
                        <i className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-fuchsia-500 px-1.5 text-[11px] font-semibold not-italic text-white shadow-md shadow-pink-900/30">
                          {chat.unseenCount}
                        </i>
                      )}
                    </span>
                  </button>
                )
              }) : (
                <div className="flex flex-col items-center gap-2 px-6 py-12 text-center text-white">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/20 bg-white/15">
                    <Icon name="message" size={22} />
                  </span>
                  <strong className="font-semibold">Your chats start here</strong>
                  <p className="text-sm text-white/60">Search for someone above to say hello.</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="m-3 mt-1 flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 p-2">
          <Link to="/profile" className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-1.5 text-white transition hover:bg-white/10">
            <Avatar name={user?.name} size="small" />
            <span className="flex min-w-0 flex-1 flex-col text-left">
              <strong className="truncate text-sm font-semibold">{user?.name || 'Your account'}</strong>
              <small className="text-xs text-white/60">View profile</small>
            </span>
            <Icon name="more" size={19} />
          </Link>
          <button
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white/70 transition hover:bg-rose-500/30 hover:text-white"
            onClick={handleLogout}
            aria-label="Sign out"
          >
            <Icon name="logout" size={18} />
          </button>
        </div>
      </aside>

      {/* ---------------- chat window ---------------- */}
      <section
        className={`relative z-10 min-w-0 flex-1 flex-col overflow-hidden md:flex md:rounded-3xl ${glass} ${
          visibleOnMobile ? 'flex' : 'hidden'
        }`}
      >
        {selected ? (
          <>
            <header className="flex items-center gap-3 border-b border-white/15 bg-white/5 px-4 py-3">
              <button className={`${iconBtn} rotate-180 md:hidden`} aria-label="Back to conversations" onClick={() => setVisibleOnMobile(false)}>
                <Icon name="arrow" size={19} />
              </button>
              <Avatar name={selected.peer.name} />
              <div className="flex min-w-0 flex-1 flex-col">
                <strong className="truncate font-semibold text-white">{selected.peer.name || selected.peer.email || 'ChatApp member'}</strong>
                <span className="truncate text-xs text-white/60">{selected.peer.email || 'Conversation'}</span>
              </div>
              <span className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/80">
                <i
                  className={`h-2 w-2 rounded-full ${
                    peerOnline ? 'bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.7)]' : 'bg-white/40'
                  }`}
                />
                {peerOnline ? 'Online' : 'Offline'}
              </span>
              <Link className={iconBtn} to="/profile" aria-label="Profile">
                <Icon name="user" size={19} />
              </Link>
            </header>

            <div className={`flex-1 overflow-y-auto px-4 py-6 md:px-8 ${scrollArea}`}>
              <div className="mx-auto mb-6 flex max-w-xs flex-col items-center gap-1 rounded-3xl border border-white/20 bg-white/10 p-5 text-center text-white">
                <Avatar name={selected.peer.name} size="large" />
                <strong className="mt-2 font-semibold">{selected.peer.name || 'New connection'}</strong>
                <span className="text-sm text-white/60">{selected.peer.email}</span>
                <p className="mt-2 text-xs text-white/50">This is the beginning of your conversation.</p>
              </div>
              {messageLoading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-white/70"><Spinner /> Loading messages…</div>
              ) : messages.length ? (
                <div className="flex flex-col gap-3">
                  {messages.map((message) => (
                    <MessageBubble
                      key={message._id}
                      message={{ ...message, senderName: selected.peer.name }}
                      own={String(message.sender) === String(user?._id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-sm text-white/60">No messages yet. Say hello and start a conversation 👋</div>
              )}
              {error && (
                <div className="mt-3 rounded-xl border border-rose-300/40 bg-rose-500/20 px-4 py-2 text-sm text-rose-100" role="alert">{error}</div>
              )}
              <div ref={bottomRef} />
            </div>

            <form className="border-t border-white/15 bg-white/5 px-4 py-3" onSubmit={handleSend}>
              {file && (
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 py-1 pl-3 pr-1 text-xs text-white">
                  <span className="max-w-[200px] truncate">{file.name}</span>
                  <button
                    type="button"
                    className="grid h-6 w-6 place-items-center rounded-full text-white/80 transition hover:bg-white/20"
                    aria-label="Remove attachment"
                    onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                  >
                    <Icon name="close" size={14} />
                  </button>
                </div>
              )}
              {typingState &&
                String(typingState.chatId) === String(selectedChatId) &&
                String(typingState.userId) === String(selected.peer._id) && (
                <span className="mb-2 block animate-pulse text-xs italic text-cyan-200" aria-live="polite">
                  {selected.peer.name || 'User'} is typing...
                </span>
              )}
              <div className="flex items-end gap-2 rounded-2xl border border-white/20 bg-white/10 p-2 transition focus-within:border-white/40 focus-within:bg-white/15">
                <input
                  ref={fileInputRef}
                  className="sr-only"
                  type="file"
                  name="file"
                  accept="image/*"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                  aria-label="Choose an image to share"
                />
                <button className={iconBtn} type="button" aria-label="Attach image" onClick={() => fileInputRef.current?.click()}>
                  <Icon name="paperclip" size={19} />
                </button>
                <textarea
                  ref={messageInputRef}
                  className="max-h-28 min-w-0 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm text-white outline-none placeholder:text-white/50"
                  aria-label="Write a message"
                  placeholder="Write a message..."
                  value={draft}
                  onChange={(event) => {
                    const nextValue = event.target.value
                    setDraft(nextValue)

                    if (!selectedChatId) return
                    if (nextValue.trim()) {
                      startTyping(selectedChatId)
                    } else {
                      stopTyping(selectedChatId)
                    }
                  }}
                  onBlur={() => {
                    stopTyping(selectedChatId)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      event.currentTarget.form?.requestSubmit()
                    }
                  }}
                  rows={1}
                />
                <button
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-indigo-500 text-white shadow-lg shadow-fuchsia-900/30 transition hover:scale-105 hover:shadow-fuchsia-500/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                  type="submit"
                  disabled={sending || (!draft.trim() && !file)}
                  aria-label="Send message"
                >
                  {sending ? <Spinner /> : <Icon name="send" size={18} />}
                </button>
              </div>
              <span className="mt-2 block text-center text-[11px] text-white/40">Messages load when you open a chat. Real-time updates are enabled.</span>
            </form>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-white">
            <div className="relative mb-4 h-48 w-80 max-w-full">
              <span className="absolute inset-0 rounded-full bg-gradient-to-br from-fuchsia-400/40 to-cyan-400/40 blur-2xl" />
              <div className="absolute left-0 top-6 rounded-2xl rounded-bl-md border border-white/25 bg-white/15 px-4 py-2.5 text-sm shadow-lg backdrop-blur-md">
                Hey, how are you? <span className="ml-2 text-[10px] text-white/60">10:42</span>
              </div>
              <div className="absolute right-0 top-24 rounded-2xl rounded-br-md border border-white/25 bg-gradient-to-br from-fuchsia-500/80 to-indigo-500/80 px-4 py-2.5 text-sm shadow-lg">
                Doing well, thanks! <span className="ml-2 text-[10px] text-white/70">10:43&nbsp; ✓✓</span>
              </div>
              <span className="absolute right-8 top-0 text-2xl text-yellow-200">✳</span>
            </div>
            <span className="text-xs font-semibold tracking-[0.25em] text-cyan-200">A BETTER WAY TO KEEP IN TOUCH</span>
            <h1 className="text-3xl font-bold leading-tight md:text-4xl">A good chat can<br />change your day.</h1>
            <p className="max-w-sm text-white/70">Choose a conversation or find someone new to get started.</p>
            <button
              className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-6 py-3 font-semibold text-white shadow-xl shadow-fuchsia-900/30 transition hover:scale-105 hover:shadow-fuchsia-500/40"
              onClick={() => document.querySelector('.search-box input')?.focus()}
            >
              <Icon name="plus" size={18} /> Start a conversation
            </button>
            <span className="max-w-sm text-xs text-white/40">Chats and messages are fetched through REST, while live updates stay in sync in real time.</span>
          </div>
        )}
      </section>
    </main>
  )
}