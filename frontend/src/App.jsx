import React, { useState, useEffect } from 'react';
import { useQuizSocket } from './utils/useQuizSocket';
import { LobbyView } from './components/LobbyView';
import { ScreenView } from './components/ScreenView';
import { PlayerView } from './components/PlayerView';
import { HostView } from './components/HostView';
import { TestToolbar } from './components/TestToolbar';
import { WifiOff, AlertTriangle } from 'lucide-react';

export default function App() {
  // Determine role from URL or default to lobby
  const [role, setRole] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get('role');
    if (['screen', 'player1', 'player2', 'host'].includes(r)) {
      return r;
    }
    return null; // null means Lobby / Selection view
  });

  // Keep URL in sync when role changes
  const handleSelectRole = (newRole) => {
    setRole(newRole);
    const url = new URL(window.location.href);
    if (newRole) {
      url.searchParams.set('role', newRole);
    } else {
      url.searchParams.delete('role');
    }
    window.history.pushState({}, '', url.toString());
  };

  // Connect to WebSocket with active role (or guest if in lobby)
  const { state, connected, error, sendMessage } = useQuizSocket(role || 'guest');

  return (
    <div className="app-container" style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Studio Background Light Beams */}
      <div className="studio-background">
        <div className="studio-beam-left" />
        <div className="studio-beam-right" />
      </div>

      {/* Disconnection Warning Banner if socket drops */}
      {!connected && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: 'rgba(239, 68, 68, 0.95)',
          color: '#fff',
          padding: '8px 16px',
          textAlign: 'center',
          fontSize: '0.85rem',
          fontWeight: 600,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <WifiOff size={16} />
          Connessione al server Python in corso... verifica che il server sia attivo sulla rete locale.
        </div>
      )}

      {/* Route Views based on selected Role */}
      {!role && (
        <LobbyView
          state={state}
          onSelectRole={handleSelectRole}
        />
      )}

      {role === 'screen' && (
        <ScreenView
          state={state}
          sendMessage={sendMessage}
          onExit={() => handleSelectRole(null)}
        />
      )}

      {(role === 'player1' || role === 'player2') && (
        <PlayerView
          role={role}
          state={state}
          sendMessage={sendMessage}
          onExit={() => handleSelectRole(null)}
        />
      )}

      {role === 'host' && (
        <HostView
          state={state}
          sendMessage={sendMessage}
          onExit={() => handleSelectRole(null)}
        />
      )}

      {/* Floating Test Toolbar for easy role switching & multi-window testing */}
      <TestToolbar
        currentRole={role}
        onSelectRole={handleSelectRole}
      />
    </div>
  );
}
