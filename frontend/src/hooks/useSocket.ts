import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../store/authStore";

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace("/api/v1", "") || "http://localhost:5000";

export const useSocket = () => {
  const { user, token, isAuthenticated } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const socket = io(SOCKET_URL, {
      query: {
        userId: user.id,
        role: user.role
      },
      auth: {
        token
      },
      transports: ["websocket", "polling"],
      autoConnect: true
    });

    socket.on("connect", () => {
      console.log("Connected to WebSocket Server!");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket Server");
      setIsConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, token, isAuthenticated]);

  const emit = useCallback((eventName: string, data: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(eventName, data);
    } else {
      console.warn("Cannot emit, socket not connected.");
    }
  }, [isConnected]);

  return { socket: socketRef.current, isConnected, emit };
};
