import { useState, useEffect, useRef, useCallback } from 'react';
import { soundManager } from './SoundManager';

export function useQuizSocket(role = 'screen', playerName = '') {
  const [state, setState] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const lastSoundTimestampRef = useRef(0);

  const getWsUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const hostname = window.location.hostname || 'localhost';
    
    // If running on Vite dev server (port 5173 or others), connect directly to backend on 8000
    // or use Vite's proxy if on same origin
    const port = window.location.port === '5173' ? '8000' : (window.location.port || '8000');
    
    const params = new URLSearchParams({
      role: role,
      name: playerName || ''
    });
    return `${protocol}//${hostname}:${port}/ws?${params.toString()}`;
  }, [role, playerName]);

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const url = getWsUrl();
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log(`[WebSocket] Connected as ${role}`);
        setConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'STATE_UPDATE') {
            const newState = message.data;
            setState(newState);

            // Trigger sounds if this is screen or host, and sound event is fresh
            if (newState.sound_event && newState.sound_event.timestamp > lastSoundTimestampRef.current) {
              lastSoundTimestampRef.current = newState.sound_event.timestamp;
              const sound = newState.sound_event.name;
              
              if (role === 'screen') {
                if (sound === 'reveal') soundManager.playReveal();
                else if (sound === 'answer_submitted') soundManager.playSubmit();
                else if (sound === 'correct') soundManager.playCorrect();
                else if (sound === 'wrong') soundManager.playWrong();
                else if (sound === 'countdown_tick') soundManager.playCountdownTick(newState.sound_event.count || 3);
                else if (sound === 'countdown_go') soundManager.playGo();
                else if (sound === 'timer_tick') soundManager.playTick();
                else if (sound === 'timer_heartbeat') soundManager.playHeartbeat();
                else if (sound === 'timeout') soundManager.playTimeUp();
                else if (sound === 'winner') {
                  soundManager.playFanfare();
                  setTimeout(() => soundManager.playApplause(), 1200);
                }
                else if (sound === 'applause') soundManager.playApplause();
              }
            }
          }
        } catch (err) {
          console.error('[WebSocket] Error parsing message:', err);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        console.log('[WebSocket] Disconnected. Reconnecting in 2s...');
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 2000);
      };

      ws.onerror = (err) => {
        console.error('[WebSocket] Error:', err);
        setError('Errore di connessione al server.');
        ws.close();
      };
    } catch (err) {
      console.error('[WebSocket] Connection failed:', err);
      setError('Impossibile stabilire la connessione.');
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    }
  }, [getWsUrl, role]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((action, data = {}) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action, ...data }));
    } else {
      console.warn('[WebSocket] Not connected, cannot send:', action);
    }
  }, []);

  return { state, connected, error, sendMessage };
}
