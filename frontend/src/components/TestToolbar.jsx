import React, { useState } from 'react';
import { Tv, Smartphone, Sliders, Home, ExternalLink, ChevronUp, ChevronDown, Monitor, RotateCcw } from 'lucide-react';

export function TestToolbar({ currentRole, onSelectRole }) {
  const [minimized, setMinimized] = useState(false);

  // Quick reset for all game state & test answers
  const handleResetData = async () => {
    if (window.confirm("Vuoi azzerare il quiz e cancellare tutte le risposte di prova?")) {
      try {
        await fetch('/api/reset');
      } catch (e) {
        console.error("Failed to reset:", e);
      }
    }
  };

  // Opens 4 small windows tiled for instant testing on PC
  const handleOpenMultiWindowTest = () => {
    const origin = window.location.origin;
    const w = Math.min(420, Math.floor(window.screen.availWidth * 0.3));
    const h = Math.min(680, Math.floor(window.screen.availHeight * 0.7));

    // 1. PC Display (Screen)
    window.open(`${origin}/?role=screen`, 'AKQuiz_Screen', `width=800,height=600,left=20,top=20`);
    
    // 2. Regia (Host)
    window.open(`${origin}/?role=host`, 'AKQuiz_Host', `width=500,height=700,left=840,top=20`);
    
    // 3. Antonio (Player 1)
    window.open(`${origin}/?role=player1`, 'AKQuiz_Antonio', `width=${w},height=${h},left=20,top=640`);
    
    // 4. Katia (Player 2)
    window.open(`${origin}/?role=player2`, 'AKQuiz_Katia', `width=${w},height=${h},left=${w + 40},top=640`);
  };

  return (
    <aside aria-label="Strumenti di Test" style={{
      position: 'fixed',
      bottom: '12px',
      right: '12px',
      zIndex: 99999,
      fontFamily: 'var(--font-main)',
      userSelect: 'none'
    }}>
      {minimized ? (
        <button
          onClick={() => setMinimized(false)}
          className="glass-panel"
          style={{
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--gold-glow)',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: '1px solid rgba(245, 179, 35, 0.4)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.6)'
          }}
          title="Espandi Barra di Test"
        >
          <Monitor size={14} /> TEST BAR <ChevronUp size={14} />
        </button>
      ) : (
        <div className="glass-panel" style={{
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.8)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--gold-glow)', textTransform: 'uppercase', letterSpacing: '0.5px', paddingRight: '4px' }}>
            TEST RAPIDO:
          </span>

          {/* Switch Role Buttons */}
          <button
            onClick={() => onSelectRole('screen')}
            style={{
              background: currentRole === 'screen' ? 'rgba(0, 210, 255, 0.3)' : 'rgba(255, 255, 255, 0.08)',
              border: currentRole === 'screen' ? '1px solid var(--cyan-primary)' : '1px solid rgba(255, 255, 255, 0.1)',
              color: currentRole === 'screen' ? '#fff' : 'var(--text-muted)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Tv size={13} color="var(--cyan-primary)" /> Schermo PC
          </button>

          <button
            onClick={() => onSelectRole('player1')}
            style={{
              background: currentRole === 'player1' ? 'rgba(0, 210, 255, 0.3)' : 'rgba(255, 255, 255, 0.08)',
              border: currentRole === 'player1' ? '1px solid var(--cyan-primary)' : '1px solid rgba(255, 255, 255, 0.1)',
              color: currentRole === 'player1' ? '#fff' : 'var(--text-muted)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Smartphone size={13} color="var(--cyan-glow)" /> Antonio
          </button>

          <button
            onClick={() => onSelectRole('player2')}
            style={{
              background: currentRole === 'player2' ? 'rgba(245, 179, 35, 0.3)' : 'rgba(255, 255, 255, 0.08)',
              border: currentRole === 'player2' ? '1px solid var(--gold-primary)' : '1px solid rgba(255, 255, 255, 0.1)',
              color: currentRole === 'player2' ? '#fff' : 'var(--text-muted)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Smartphone size={13} color="var(--gold-primary)" /> Katia
          </button>

          <button
            onClick={() => onSelectRole('host')}
            style={{
              background: currentRole === 'host' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(255, 255, 255, 0.08)',
              border: currentRole === 'host' ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.1)',
              color: currentRole === 'host' ? '#fff' : 'var(--text-muted)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Sliders size={13} color="#a855f7" /> Regia
          </button>

          <button
            onClick={() => onSelectRole(null)}
            style={{
              background: !currentRole ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            title="Torna alla Lobby"
          >
            <Home size={13} /> Lobby
          </button>

          {/* Multi-Window Launcher */}
          <button
            onClick={handleOpenMultiWindowTest}
            style={{
              background: 'linear-gradient(135deg, rgba(245, 179, 35, 0.25), rgba(0, 210, 255, 0.25))',
              border: '1px solid rgba(245, 179, 35, 0.5)',
              color: 'var(--gold-glow)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            title="Apre 4 finestre separate sincronizzate per simulare PC + Sposi + Regia sul tuo schermo"
          >
            <ExternalLink size={13} /> Apri 4 Finestre
          </button>

          {/* Reset / Svuota DB Button */}
          <button
            onClick={handleResetData}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            title="Azzera lo stato di gioco e rimuove tutte le risposte di prova"
          >
            <RotateCcw size={13} /> Svuota DB
          </button>

          <button
            onClick={() => setMinimized(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-dim)',
              padding: '4px',
              cursor: 'pointer'
            }}
            title="Minimizza barra di test"
          >
            <ChevronDown size={14} />
          </button>
        </div>
      )}
    </aside>
  );
}
