"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { getClientPublicAppBaseUrl, isNgrokHost } from "@/lib/config/publicAppUrl";

let socketInstance: Socket | null = null;

/** Creates or returns the singleton Socket.IO client connected to this app server. */
export function getSocket(): Socket {
  if (!socketInstance) {
    const socketServerUrl =
      typeof window !== "undefined" ? window.location.origin : getClientPublicAppBaseUrl();
    const isNgrok = isNgrokHost(
      typeof window !== "undefined" ? window.location.hostname : undefined
    );

    socketInstance = io(socketServerUrl, {
      path: "/api/socket",
      autoConnect: false,
      transports: ["websocket", "polling"],
      ...(isNgrok && {
        extraHeaders: {
          "ngrok-skip-browser-warning": "69420",
        },
      }),
    });
  }
  return socketInstance;
}

/**
 * Hook for real-time lobby and game events over Socket.IO.
 * @param authenticatedUserId — current user's id for auth:register
 */
export function useSocket(authenticatedUserId?: string) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    if (!socket.connected) {
      socket.connect();
    }

    if (authenticatedUserId) {
      socket.emit("auth:register", { userId: authenticatedUserId });
    }

    return () => {
      // Keep connection alive for reconnect
    };
  }, [authenticatedUserId]);

  const emit = useCallback(
    <T,>(eventName: string, payload: unknown): Promise<T> => {
      return new Promise((resolve) => {
        socketRef.current?.emit(eventName, payload, resolve);
      });
    },
    []
  );

  const on = useCallback(
    (eventName: string, handler: (...args: unknown[]) => void) => {
      socketRef.current?.on(eventName, handler);
      return () => {
        socketRef.current?.off(eventName, handler);
      };
    },
    []
  );

  return {
    socket: socketRef.current,
    emit,
    on,
    getSocket: () => socketRef.current,
  };
}
