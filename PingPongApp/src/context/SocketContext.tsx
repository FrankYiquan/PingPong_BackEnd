import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode'; // Fix import: named export
import { useAuth } from './AuthContext';
import { API_URL } from '../constants/config'; // Re-use your config

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { userToken } = useAuth(); // Listen to Auth State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let newSocket: Socket | null = null;

    if (userToken) {
      // 1. Decode token to get User ID for the "register" event
      try {
        const decoded: any = jwtDecode(userToken);
        const userId = decoded.id; // backend signs: { id: user._id }

        // 2. Initialize Socket
        // Ensure API_URL doesn't have /api at the end if your socket is at root
        newSocket = io(API_URL, {
          transports: ['websocket'], // Force websocket to avoid polling issues in RN
          autoConnect: true,
        });

        // 3. Setup Listeners
        newSocket.on('connect', () => {
          console.log('Socket Connected:', newSocket?.id);
          setIsConnected(true);

          // 4. PERFORM THE BACKEND HANDSHAKE
          newSocket?.emit('register', userId);
        });

        newSocket.on('disconnect', () => {
          console.log('Socket Disconnected');
          setIsConnected(false);
        });

        newSocket.on('connect_error', (err) => {
          console.log('Socket Connection Error:', err);
        });

        setSocket(newSocket);
      } catch (error) {
        console.error("Failed to decode token for socket registration", error);
      }
    }

    // Cleanup: Disconnect on unmount or when userToken changes (logout)
    return () => {
      if (newSocket) {
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [userToken]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};