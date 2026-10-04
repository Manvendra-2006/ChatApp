import { apiRequest } from '../api/apiClient'

export async function fetchChats() {
  const data = await apiRequest('chat', '/api/chat/getALlChats')
  return Array.isArray(data?.chats) ? data.chats.filter(Boolean) : []
}

export async function startChat(otherUserId) {
  const data = await apiRequest('chat', '/api/chat/newchat', {
    method: 'POST',
    body: JSON.stringify({ otherUserId }),
  })
  return data?.chatId || data?.existingChat?._id
}
