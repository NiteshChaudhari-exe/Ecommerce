import { useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';

/**
 * Custom hook to connect to Socket.io and listen for real-time events
 * @param {string} token - JWT token for authentication
 * @param {boolean} enabled - Whether to enable the socket connection
 * @returns {object} - { socket, isConnected, events }
 */
function useSocket(token, enabled = true) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState({});

  useEffect(() => {
    if (!enabled || !token) return;

    const socketURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    // Create socket connection with authentication
    const newSocket = io(socketURL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('[Socket] Connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
    });

    newSocket.on('error', (error) => {
      console.error('[Socket] Error:', error);
    });

    // Generic event handler: capture all events for debugging
    newSocket.onAny((event, data) => {
      console.log(`[Socket] Event received: ${event}`, data);
      setEvents((prev) => ({ ...prev, [event]: data }));
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [token, enabled]);

  // Helper to listen for specific events
  const on = useCallback((event, handler) => {
    if (!socket) return;
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, [socket]);

  // Helper to emit events
  const emit = useCallback((event, data) => {
    if (!socket) return;
    socket.emit(event, data);
  }, [socket]);

  return {
    socket,
    isConnected,
    events,
    on,
    emit,
  };
}

export default useSocket;
