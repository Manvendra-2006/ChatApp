import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Avatar from '../components/Avatar'
import Icon from '../components/Icon'
import useAuth from '../hooks/useAuth'
import { fetchChats, startChat } from '../services/chatService'
import { fetchMessages, sendMessage } from '../services/messageService'
import { fetchUsers } from '../services/userService'

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
    <div className={`message-row ${own ? 'message-row-own' : ''}`}>
      {!own && <Avatar name={message.senderName} size="tiny" />}
      <div className={`message-bubble ${own ? 'message-own' : 'message-incoming'}`}>
        {message.image?.url && (
          <a href={message.image.url} target="_blank" rel="noreferrer">
            <img className="message-image" src={message.image.url} alt="Shared image" />
          </a>
        )}
        {message.text && <p>{message.text}</p>}
        <div className="message-meta">
          <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
          {own && message.seen && <span className="message-seen" aria-label="Seen">✓✓</span>}
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
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)
  const messageInputRef = useRef(null)

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

    setSending(true)
    setError('')
    try {
      const data = await sendMessage({ chatId: selected.chat._id, text, file })
      if (!data?.message) throw new Error('The message was sent but no message data was returned.')
      setMessages((current) => [...current, data.message])
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

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="chat-app">
      <aside className={`conversation-panel ${visibleOnMobile ? 'conversation-panel-mobile-hidden' : ''}`}>
        <div className="sidebar-top">
          <Link className="brand" to="/chat">
            <span className="brand-mark"><Icon name="message" size={22} /></span>
            <span>Chat<span className="brand-accent">App</span></span>
          </Link>
          <span className="sidebar-label">MESSAGES</span>
        </div>

        <div className="search-box">
          <Icon name="search" size={18} />
          <input
            aria-label="Search people"
            placeholder="Search people…"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
          {searchText && (
            <button className="icon-button search-clear" aria-label="Clear search" onClick={() => setSearchText('')}>
              <Icon name="close" size={16} />
            </button>
          )}
        </div>

        <div className="conversation-list">
          {debouncedSearch ? (
            <>
              <div className="list-heading">PEOPLE</div>
              {usersLoading ? (
                <div className="list-state"><span className="spinner" /> Searching people…</div>
              ) : userSearchError ? (
                <div className="list-state list-state-error">{userSearchError}</div>
              ) : filteredUsers.length ? filteredUsers.map((candidate) => (
                <button className="person-result" key={candidate._id} onClick={() => openUser(candidate)}>
                  <Avatar name={candidate.name} />
                  <span className="person-result-info"><strong>{candidate.name}</strong><small>{candidate.email}</small></span>
                  <Icon name="arrow" size={17} className="person-arrow" />
                </button>
              )) : <div className="list-state">No people found for “{debouncedSearch}”.</div>}
            </>
          ) : (
            <>
              <div className="list-heading">YOUR CONVERSATIONS</div>
              {conversationLoading ? (
                <div className="list-state"><span className="spinner" /> Loading your chats…</div>
              ) : conversationError ? (
                <div className="list-state list-state-error">
                  <span>{conversationError}</span>
                  <button className="text-button" onClick={() => {
                    setConversationLoading(true)
                    loadConversations()
                      .catch((loadError) => setConversationError(loadError.message))
                      .finally(() => setConversationLoading(false))
                  }}>Try again</button>
                </div>
              ) : conversations.length ? conversations.map(({ peer, chat }) => {
                const active = selected?.chat._id === chat._id
                const latestMessage = chat.latestMessage
                return (
                  <button
                    className={`conversation-item ${active ? 'conversation-item-active' : ''}`}
                    key={chat._id}
                    onClick={() => openConversation({ peer, chat })}
                  >
                    <Avatar name={peer.name} />
                    <span className="conversation-copy">
                      <strong>{peer.name || peer.email || 'ChatApp member'}</strong>
                      <small>{latestMessage?.text || 'Start a conversation'}</small>
                    </span>
                    <span className="conversation-meta">
                      <time>{formatTime(chat.updatedAt)}</time>
                      {chat.unseenCount > 0 && <i className="unread-count">{chat.unseenCount}</i>}
                    </span>
                  </button>
                )
              }) : (
                <div className="empty-conversations">
                  <span className="empty-conversations-icon"><Icon name="message" size={22} /></span>
                  <strong>Your chats start here</strong>
                  <p>Search for someone above to say hello.</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="sidebar-account">
          <Link to="/profile" className="account-link">
            <Avatar name={user?.name} size="small" />
            <span><strong>{user?.name || 'Your account'}</strong><small>View profile</small></span>
            <Icon name="more" size={19} />
          </Link>
          <button className="sidebar-logout" onClick={handleLogout} aria-label="Sign out">
            <Icon name="logout" size={18} />
          </button>
        </div>
      </aside>

      <section className={`chat-panel ${visibleOnMobile ? 'chat-panel-mobile-visible' : ''}`}>
        {selected ? (
          <>
            <header className="chat-header">
              <button className="icon-button mobile-back" aria-label="Back to conversations" onClick={() => setVisibleOnMobile(false)}>
                <Icon name="arrow" size={19} />
              </button>
              <Avatar name={selected.peer.name} />
              <div className="chat-header-person">
                <strong>{selected.peer.name || selected.peer.email || 'ChatApp member'}</strong>
                <span>{selected.peer.email || 'Conversation'}</span>
              </div>
              <span className="rest-status"><i /> Messages sync when you open this chat</span>
              <Link className="icon-button header-profile-link" to="/profile" aria-label="Profile">
                <Icon name="user" size={19} />
              </Link>
            </header>

            <div className="messages-area">
              <div className="conversation-start-card">
                <Avatar name={selected.peer.name} size="large" />
                <strong>{selected.peer.name || 'New connection'}</strong>
                <span>{selected.peer.email}</span>
                <p>This is the beginning of your conversation.</p>
              </div>
              {messageLoading ? (
                <div className="message-loading"><span className="spinner" /> Loading messages…</div>
              ) : messages.length ? (
                <div className="message-list">
                  {messages.map((message) => (
                    <MessageBubble
                      key={message._id}
                      message={{ ...message, senderName: selected.peer.name }}
                      own={String(message.sender) === String(user?._id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="first-message-hint">No messages yet. Say hello and start a conversation 👋</div>
              )}
              {error && <div className="chat-inline-error" role="alert">{error}</div>}
              <div ref={bottomRef} />
            </div>

            <form className="composer" onSubmit={handleSend}>
              {file && (
                <div className="attachment-chip">
                  <span>{file.name}</span>
                  <button type="button" className="icon-button" aria-label="Remove attachment" onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}>
                    <Icon name="close" size={14} />
                  </button>
                </div>
              )}
              <div className="composer-row">
                <input
                  ref={fileInputRef}
                  className="visually-hidden"
                  type="file"
                  name="file"
                  accept="image/*"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                  aria-label="Choose an image to share"
                />
                <button className="icon-button attach-button" type="button" aria-label="Attach image" onClick={() => fileInputRef.current?.click()}>
                  <Icon name="paperclip" size={19} />
                </button>
                <textarea
                  ref={messageInputRef}
                  className="message-input"
                  aria-label="Write a message"
                  placeholder="Write a message..."
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      event.currentTarget.form?.requestSubmit()
                    }
                  }}
                  rows={1}
                />
                <button className="send-button" type="submit" disabled={sending || (!draft.trim() && !file)} aria-label="Send message">
                  {sending ? <span className="spinner spinner-light" /> : <Icon name="send" size={18} />}
                </button>
              </div>
              <span className="composer-footnote">Messages load when you open a chat. Real-time updates are not enabled.</span>
            </form>
          </>
        ) : (
          <div className="chat-welcome">
            <div className="welcome-art">
              <span className="welcome-art-backdrop" />
              <div className="welcome-bubble bubble-left">Hey, how are you? <span>10:42</span></div>
              <div className="welcome-bubble bubble-right">Doing well, thanks! <span>10:43&nbsp; ✓✓</span></div>
              <span className="welcome-art-flower">✳</span>
            </div>
            <span className="auth-kicker">A BETTER WAY TO KEEP IN TOUCH</span>
            <h1>A good chat can<br />change your day.</h1>
            <p>Choose a conversation or find someone new to get started.</p>
            <button className="primary-button welcome-search" onClick={() => document.querySelector('.search-box input')?.focus()}>
              <Icon name="plus" size={18} /> Start a conversation
            </button>
            <span className="welcome-rest-note">Chats and messages are fetched through REST. Live updates are not active.</span>
          </div>
        )}
      </section>
    </main>
  )
}
