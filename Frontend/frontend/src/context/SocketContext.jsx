import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import useAuth from '../hooks/useAuth'

const SocketContext = createContext({
  socket: null,
  onlineUserIds: [],
})

export function SocketProvider({ children }) {
  const { user } = useAuth()
  const [socket, setSocket] = useState(null)
  const [onlineUserIds, setOnlineUserIds] = useState([])

  useEffect(() => {
    if (!user?._id) {
      setSocket((currentSocket) => {
        currentSocket?.disconnect()
        return null
      })
      setOnlineUserIds([])
      return
    }

    const chatSocket = io(import.meta.env.VITE_CHAT_API_URL, {
      transports: ['websocket'],
      reconnection: true,
      query: {
        userId: user._id,
      },
    })

    const handleOnlineUsers = (onlineIds) => {
      setOnlineUserIds(Array.isArray(onlineIds) ? onlineIds.map(String) : [])
    }

    chatSocket.on('getOnlineUser', handleOnlineUsers)
    setSocket(chatSocket)

    return () => {
      chatSocket.off('getOnlineUser', handleOnlineUsers)
      chatSocket.disconnect()
      setSocket(null)
      setOnlineUserIds([])
    }
  }, [user?._id])

  return (
    <SocketContext.Provider value={{ socket, onlineUserIds }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}

export default SocketContext