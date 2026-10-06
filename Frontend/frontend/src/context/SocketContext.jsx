// import { createContext, useContext, useEffect, useState } from 'react'
// import { io } from 'socket.io-client'
// import useAuth from '../hooks/useAuth'

// const SocketContext = createContext({
//   socket: null,
//   onlineUserIds: [],
// })

// export function SocketProvider({ children }) {
//   const { user } = useAuth()
//   const [socket, setSocket] = useState(null)
//   const [onlineUserIds, setOnlineUserIds] = useState([])

//   useEffect(() => {
//     if (!user?._id) {
//       setSocket((currentSocket) => {
//         currentSocket?.disconnect()
//         return null
//       })
//       setOnlineUserIds([])
//       return
//     }

//     const chatSocket = io(import.meta.env.VITE_CHAT_API_URL, {
//       transports: ['websocket'],
//       reconnection: true,
//       query: {
//         userId: user._id,
//       },
//     })

//     const handleOnlineUsers = (onlineIds) => {
//       setOnlineUserIds(Array.isArray(onlineIds) ? onlineIds.map(String) : [])
//     }

//     chatSocket.on('getOnlineUser', handleOnlineUsers)
//     setSocket(chatSocket)

//     return () => {
//       chatSocket.off('getOnlineUser', handleOnlineUsers)
//       chatSocket.disconnect()
//       setSocket(null)
//       setOnlineUserIds([])
//     }
//   }, [user?._id])

//   return (
//     <SocketContext.Provider value={{ socket, onlineUserIds }}>
//       {children}
//     </SocketContext.Provider>
//   )
// }

// export function useSocket() {
//   return useContext(SocketContext)
// }


// export default SocketContext
import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import useAuth from "../hooks/useAuth";

const SocketContext = createContext({
  socket: null,
  onlineUserIds: [],
});

export function SocketProvider({ children }) {
  const { user } = useAuth();

  const [socket, setSocket] = useState(null);
  const [onlineUserIds, setOnlineUserIds] = useState([]);

  useEffect(() => {
    if (!user?._id) {
      setSocket((currentSocket) => {
        if (currentSocket) {
          currentSocket.disconnect();
        }

        return null;
      });

      setOnlineUserIds([]);
      return;
    }

    // IMPORTANT:
    // VITE_CHAT_API_URL is the API Gateway URL.
    // Do NOT replace it with the Chat Service URL.
    const chatSocket = io(import.meta.env.VITE_CHAT_API_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,

      withCredentials: true,

      query: {
        userId: String(user._id),
      },
    });

    const handleOnlineUsers = (onlineIds) => {
      if (!Array.isArray(onlineIds)) {
        setOnlineUserIds([]);
        return;
      }

      setOnlineUserIds(
        onlineIds
          .filter(Boolean)
          .map((id) => String(id))
      );
    };

    const handleConnect = () => {
      console.log("Socket connected:", chatSocket.id);
    };

    const handleDisconnect = (reason) => {
      console.log("Socket disconnected:", reason);
    };

    const handleConnectError = (error) => {
      console.error("Socket connection error:", error.message);
    };

    chatSocket.on("connect", handleConnect);
    chatSocket.on("disconnect", handleDisconnect);
    chatSocket.on("connect_error", handleConnectError);
    chatSocket.on("getOnlineUser", handleOnlineUsers);

    setSocket(chatSocket);

    return () => {
      chatSocket.off("connect", handleConnect);
      chatSocket.off("disconnect", handleDisconnect);
      chatSocket.off("connect_error", handleConnectError);
      chatSocket.off("getOnlineUser", handleOnlineUsers);

      chatSocket.disconnect();
      setSocket(null);
      setOnlineUserIds([]);
    };
  }, [user?._id]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUserIds,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

export default SocketContext;
