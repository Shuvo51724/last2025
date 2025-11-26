import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { nanoid } from 'nanoid';
import type { ChatMessage, ChatUserStatus, WSMessage, ChatSettings, BlockedUser, MutedUser } from '@shared/schema';
import { useAuth } from './AuthContext';

interface ChatContextType {
  messages: ChatMessage[];
  onlineUsers: ChatUserStatus[];
  isConnected: boolean;
  settings: ChatSettings;
  blockedUsers: BlockedUser[];
  mutedUsers: MutedUser[];
  sendMessage: (message: string, file?: File, replyTo?: { messageId: string; userName: string; message: string }, mentions?: string[], onProgress?: (progress: number) => void) => void;
  sendTypingIndicator: (isTyping: boolean) => void;
  markMessageAsRead: (messageId: string) => void;
  pinMessage: (messageId: string, isPinned: boolean) => void;
  blockUser: (userId: string, userName: string, reason?: string) => void;
  muteUser: (userId: string, userName: string, duration?: string) => void;
  unblockUser: (userId: string) => void;
  unmuteUser: (userId: string) => void;
  clearAllMessages: () => void;
  clearUserMessages: (userId: string) => void;
  updateSettings: (newSettings: Partial<ChatSettings>) => void;
  isUserBlocked: (userId: string) => boolean;
  isUserMuted: (userId: string) => boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<ChatUserStatus[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [settings, setSettings] = useState<ChatSettings>({
    enabled: true,
    fileSharingEnabled: true,
    moderatorOnlyMode: false,
  });
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [mutedUsers, setMutedUsers] = useState<MutedUser[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const storedMessages = localStorage.getItem('dob_chat_messages');
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    }

    const storedSettings = localStorage.getItem('dob_chat_settings');
    if (storedSettings) {
      setSettings(JSON.parse(storedSettings));
    }

    const storedBlocked = localStorage.getItem('dob_chat_blocked_users');
    if (storedBlocked) {
      setBlockedUsers(JSON.parse(storedBlocked));
    }

    const storedMuted = localStorage.getItem('dob_chat_muted_users');
    if (storedMuted) {
      setMutedUsers(JSON.parse(storedMuted));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('dob_chat_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('dob_chat_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('dob_chat_blocked_users', JSON.stringify(blockedUsers));
  }, [blockedUsers]);

  useEffect(() => {
    localStorage.setItem('dob_chat_muted_users', JSON.stringify(mutedUsers));
  }, [mutedUsers]);

  const connectWebSocket = useCallback(() => {
    if (!user || !settings.enabled) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        
        const statusMessage: WSMessage = {
          type: 'user_status',
          data: {
            userId: user.userId,
            userName: user.name || user.userId,
            userRole: user.role,
            status: 'online',
            lastSeen: new Date().toISOString(),
          }
        };
        ws.send(JSON.stringify(statusMessage));

        const requestUserList: WSMessage = {
          type: 'request_user_list',
          data: {}
        };
        ws.send(JSON.stringify(requestUserList));
      };

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);

          switch (message.type) {
            case 'chat_message':
              if (message.data.userId !== user?.userId) {
                setMessages(prev => [...prev, message.data]);
              }
              break;

            case 'user_status':
              setOnlineUsers(prev => {
                const filtered = prev.filter(u => u.userId !== message.data.userId);
                if (message.data.status === 'online') {
                  return [...filtered, message.data];
                }
                return filtered;
              });
              break;

            case 'user_list':
              setOnlineUsers(message.data);
              break;

            case 'message_read':
              setMessages(prev => prev.map(msg => 
                msg.id === message.data.messageId
                  ? { ...msg, readBy: [...new Set([...msg.readBy, message.data.userId])] }
                  : msg
              ));
              break;

            case 'message_pinned':
              setMessages(prev => prev.map(msg =>
                msg.id === message.data.messageId
                  ? { ...msg, isPinned: message.data.isPinned }
                  : msg
              ));
              break;

            case 'user_blocked':
              setBlockedUsers(prev => {
                if (prev.some(u => u.userId === message.data.userId)) {
                  return prev;
                }
                return [...prev, {
                  userId: message.data.userId,
                  userName: '',
                  blockedBy: 'admin',
                  blockedAt: new Date().toISOString(),
                }];
              });
              break;

            case 'user_unblocked':
              setBlockedUsers(prev => prev.filter(u => u.userId !== message.data.userId));
              break;

            case 'user_muted':
              setMutedUsers(prev => {
                if (prev.some(u => u.userId === message.data.userId)) {
                  return prev;
                }
                return [...prev, {
                  userId: message.data.userId,
                  userName: '',
                  mutedBy: 'admin',
                  mutedAt: new Date().toISOString(),
                }];
              });
              break;

            case 'user_unmuted':
              setMutedUsers(prev => prev.filter(u => u.userId !== message.data.userId));
              break;

            case 'chat_cleared':
              setMessages([]);
              break;

            default:
              break;
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setOnlineUsers([]);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }, [user, settings.enabled]);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectWebSocket]);

  const sendMessage = useCallback(async (message: string, file?: File, replyTo?: { messageId: string; userName: string; message: string }, mentions?: string[], onProgress?: (progress: number) => void) => {
    if (!wsRef.current || !user) return;

    if (file) {
      const isVideo = file.type.startsWith('video/');

      if (isVideo) {
        try {
          const formData = new FormData();
          formData.append('file', file);

          const xhr = new XMLHttpRequest();
          
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && onProgress) {
              const progress = (e.loaded / e.total) * 100;
              onProgress(progress);
            }
          });

          xhr.open('POST', '/api/chat/upload');
          
          xhr.onload = () => {
            if (xhr.status === 200) {
              if (onProgress) {
                onProgress(100);
              }
              
              const response = JSON.parse(xhr.responseText);
              
              const chatMessage: ChatMessage = {
                id: nanoid(),
                userId: user.userId,
                userName: user.name || user.userId,
                userRole: user.role,
                message,
                timestamp: new Date().toISOString(),
                fileUrl: response.fileUrl,
                fileName: response.fileName,
                fileType: response.fileType,
                isPinned: false,
                readBy: [user.userId],
                replyTo,
                mentions: mentions || [],
              };

              setMessages(prev => [...prev, chatMessage]);

              const wsMessage: WSMessage = {
                type: 'chat_message',
                data: chatMessage,
              };

              wsRef.current?.send(JSON.stringify(wsMessage));
            } else {
              console.error('Upload failed:', xhr.statusText);
              if (onProgress) {
                onProgress(0);
              }
            }
          };

          xhr.onerror = () => {
            console.error('Upload error');
            if (onProgress) {
              onProgress(0);
            }
          };

          xhr.send(formData);
        } catch (error) {
          console.error('File upload error:', error);
        }
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const chatMessage: ChatMessage = {
            id: nanoid(),
            userId: user.userId,
            userName: user.name || user.userId,
            userRole: user.role,
            message,
            timestamp: new Date().toISOString(),
            fileUrl: e.target?.result as string,
            fileName: file.name,
            fileType: file.type,
            isPinned: false,
            readBy: [user.userId],
            replyTo,
            mentions: mentions || [],
          };

          setMessages(prev => [...prev, chatMessage]);

          const wsMessage: WSMessage = {
            type: 'chat_message',
            data: chatMessage,
          };

          wsRef.current?.send(JSON.stringify(wsMessage));
        };
        reader.readAsDataURL(file);
      }
    } else {
      const chatMessage: ChatMessage = {
        id: nanoid(),
        userId: user.userId,
        userName: user.name || user.userId,
        userRole: user.role,
        message,
        timestamp: new Date().toISOString(),
        isPinned: false,
        readBy: [user.userId],
        replyTo,
        mentions: mentions || [],
      };

      setMessages(prev => [...prev, chatMessage]);

      const wsMessage: WSMessage = {
        type: 'chat_message',
        data: chatMessage,
      };

      wsRef.current.send(JSON.stringify(wsMessage));
    }
  }, [user]);

  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!wsRef.current || !user) return;

    const message: WSMessage = {
      type: 'user_typing',
      data: {
        userId: user.userId,
        userName: user.name || user.userId,
        isTyping,
      }
    };

    wsRef.current.send(JSON.stringify(message));
  }, [user]);

  const markMessageAsRead = useCallback((messageId: string) => {
    if (!wsRef.current || !user) return;

    const message: WSMessage = {
      type: 'message_read',
      data: { messageId, userId: user.userId }
    };

    wsRef.current.send(JSON.stringify(message));
  }, [user]);

  const pinMessage = useCallback((messageId: string, isPinned: boolean) => {
    if (!wsRef.current || !user || user.role !== 'admin') return;

    const message: WSMessage = {
      type: 'message_pinned',
      data: { messageId, isPinned }
    };

    wsRef.current.send(JSON.stringify(message));
  }, [user]);

  const blockUser = useCallback((userId: string, userName: string, reason?: string) => {
    if (!user || user.role !== 'admin') return;

    const blockedUser: BlockedUser = {
      userId,
      userName,
      blockedBy: user.userId,
      blockedAt: new Date().toISOString(),
      reason,
    };

    setBlockedUsers(prev => [...prev, blockedUser]);

    if (wsRef.current) {
      const message: WSMessage = {
        type: 'user_blocked',
        data: { userId }
      };
      wsRef.current.send(JSON.stringify(message));
    }
  }, [user]);

  const muteUser = useCallback((userId: string, userName: string, duration?: string) => {
    if (!user || user.role !== 'admin') return;

    const mutedUser: MutedUser = {
      userId,
      userName,
      mutedBy: user.userId,
      mutedAt: new Date().toISOString(),
      mutedUntil: duration,
    };

    setMutedUsers(prev => [...prev, mutedUser]);

    if (wsRef.current) {
      const message: WSMessage = {
        type: 'user_muted',
        data: { userId }
      };
      wsRef.current.send(JSON.stringify(message));
    }
  }, [user]);

  const unblockUser = useCallback((userId: string) => {
    setBlockedUsers(prev => prev.filter(u => u.userId !== userId));

    if (wsRef.current) {
      const message: WSMessage = {
        type: 'user_unblocked',
        data: { userId }
      };
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const unmuteUser = useCallback((userId: string) => {
    setMutedUsers(prev => prev.filter(u => u.userId !== userId));

    if (wsRef.current) {
      const message: WSMessage = {
        type: 'user_unmuted',
        data: { userId }
      };
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const clearAllMessages = useCallback(() => {
    if (!user || user.role !== 'admin') return;

    setMessages([]);

    if (wsRef.current) {
      const message: WSMessage = {
        type: 'chat_cleared',
        data: { clearedBy: user.userId }
      };
      wsRef.current.send(JSON.stringify(message));
    }
  }, [user]);

  const clearUserMessages = useCallback((userId: string) => {
    if (!user || user.role !== 'admin') return;
    setMessages(prev => prev.filter(msg => msg.userId !== userId));
  }, [user]);

  const updateSettings = useCallback((newSettings: Partial<ChatSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const isUserBlocked = useCallback((userId: string) => {
    return blockedUsers.some(u => u.userId === userId);
  }, [blockedUsers]);

  const isUserMuted = useCallback((userId: string) => {
    return mutedUsers.some(u => u.userId === userId);
  }, [mutedUsers]);

  const value: ChatContextType = {
    messages,
    onlineUsers,
    isConnected,
    settings,
    blockedUsers,
    mutedUsers,
    sendMessage,
    sendTypingIndicator,
    markMessageAsRead,
    pinMessage,
    blockUser,
    muteUser,
    unblockUser,
    unmuteUser,
    clearAllMessages,
    clearUserMessages,
    updateSettings,
    isUserBlocked,
    isUserMuted,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
