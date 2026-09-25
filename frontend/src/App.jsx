import React, { useState, useEffect } from 'react';
import { useQuizSocket } from './utils/useQuizSocket';
import { LobbyView } from './components/LobbyView';
import { ScreenView } from './components/ScreenView';
import { PlayerView } from './components/PlayerView';
import { HostView } from './components/HostView';
import { TestToolbar } from './components/TestToolbar';
import { WifiOff, AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: '#fff',
          maxWidth: '600px',
          margin: '60px auto',
          background: 'rgba(255, 71, 87, 0.15)',
          border: '2px solid var(--crimson-accent)',
          borderRadius: '16px',
          position: 'relative',
          zIndex: 100
        }}>
          <AlertTriangle size={48} color="var(--crimson-accent)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>Si è verificato un errore nella vista</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
            {this.state.error?.message || 'Errore imprevisto'}
          </p>
          <button 
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="btn-primary"
            style={{ padding: '10px 24px' }}
          >
            Ricarica Schermata
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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

  // Synchronize global theme attribute on root element across all connected devices
  useEffect(() => {
    const activeTheme = state?.theme || 'dark';
    document.documentElement.setAttribute('data-theme', activeTheme);
    document.body.setAttribute('data-theme', activeTheme);
  }, [state?.theme]);

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
      <ErrorBoundary>
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
      </ErrorBoundary>

      {/* Test toolbar hidden by default */}
      {new URLSearchParams(window.location.search).get('test') === 'true' && (
        <TestToolbar
          currentRole={role}
          onSelectRole={handleSelectRole}
        />
      )}
    </div>
  );
}
