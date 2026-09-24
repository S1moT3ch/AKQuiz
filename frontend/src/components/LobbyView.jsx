import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Tv, Smartphone, Sliders, Play, Users, Wifi, Copy, Check } from 'lucide-react';

export function LobbyView({ onSelectRole, state }) {
  const [copiedUrl, setCopiedUrl] = useState(null);
  const serverIp = state?.server_ip || window.location.hostname || 'localhost';
  const port = window.location.port || '5173';
  const baseUrl = `http://${serverIp}:${port}`;

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(key);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const roles = [
    {
      id: 'screen',
      title: 'Schermo Principale (PC)',
      subtitle: 'Display Studio TV per tutta la famiglia',
      description: 'Mostra le domande, le risposte di Antonio e Katia svelate con effetti sonori e il verdetto finale.',
      icon: Tv,
      color: 'var(--cyan-primary)',
      badge: 'Display PC',
      path: '/?role=screen'
    },
    {
      id: 'player1',
      title: 'Antonio (Smartphone)',
      subtitle: state?.players?.player1?.name || 'Antonio',
      description: 'Interfaccia sposo: riceve le domande e digita la sua risposta aperta dal telefono.',
      icon: Smartphone,
      color: 'var(--cyan-glow)',
      badge: state?.players?.player1?.connected ? 'Online' : 'In attesa',
      badgeColor: state?.players?.player1?.connected ? 'var(--emerald-accent)' : 'var(--text-dim)',
      path: '/?role=player1'
    },
    {
      id: 'player2',
      title: 'Katia (Smartphone)',
      subtitle: state?.players?.player2?.name || 'Katia',
      description: 'Interfaccia sposa: riceve le domande e digita la sua risposta aperta dal telefono.',
      icon: Smartphone,
      color: 'var(--gold-primary)',
      badge: state?.players?.player2?.connected ? 'Online' : 'In attesa',
      badgeColor: state?.players?.player2?.connected ? 'var(--emerald-accent)' : 'var(--text-dim)',
      path: '/?role=player2'
    },
    {
      id: 'host',
      title: 'Regia / Host (Simone & Andrea)',
      subtitle: 'Pannello di Controllo Quiz Show',
      description: 'Gestisce il quiz: manda in onda le domande, svela le risposte sul PC, assegna i punti e proclama il vincitore!',
      icon: Sliders,
      color: '#a855f7',
      badge: 'Regia',
      path: '/?role=host'
    }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }} className="badge-gold">
          <Tv size={16} /> ANTONIO & KATIA • 25 ANNI INSIEME
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.4rem)', fontWeight: 900, letterSpacing: '-1px', marginBottom: '14px', background: 'linear-gradient(180deg, #fff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          AK Quiz Show • Nozze d'Argento
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', maxWidth: '720px', margin: '0 auto', lineHeight: 1.6 }}>
          15 domande a risposta aperta su 25 anni di matrimonio e aneddoti di famiglia! Antonio e Katia rispondono dai loro smartphone, mentre la regia gestisce il quiz in diretta.
        </p>

        {/* Network Info Pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(0, 210, 255, 0.08)',
          border: '1px solid rgba(0, 210, 255, 0.25)',
          padding: '10px 20px',
          borderRadius: '999px',
          marginTop: '20px'
        }}>
          <Wifi size={18} color="var(--cyan-primary)" />
          <span style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>
            IP Rete Locale: <strong style={{ color: 'var(--cyan-glow)', fontFamily: 'var(--font-tech)', fontSize: '1.1rem' }}>{serverIp}</strong>
          </span>
        </div>
      </div>

      {/* Grid of Roles */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '24px',
        marginBottom: '40px'
      }}>
        {roles.map((r) => {
          const Icon = r.icon;
          const fullRoleUrl = `${baseUrl}${r.path}`;
          return (
            <div
              key={r.id}
              className="glass-card"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: `rgba(${r.id === 'host' ? '168, 85, 247' : r.id === 'player2' ? '245, 179, 35' : '0, 210, 255'}, 0.15)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${r.color}`
                  }}>
                    <Icon size={24} color={r.color} />
                  </div>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: r.badgeColor || r.color,
                    border: `1px solid ${r.badgeColor || r.color}40`
                  }}>
                    {r.badge}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>{r.title}</h3>
                <div style={{ color: r.color, fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px' }}>{r.subtitle}</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '20px' }}>
                  {r.description}
                </p>

                {/* QR Code for smartphone roles */}
                {r.id !== 'screen' && (
                  <div style={{
                    background: '#fff',
                    padding: '12px',
                    borderRadius: '12px',
                    display: 'inline-block',
                    marginBottom: '16px',
                    textAlign: 'center'
                  }}>
                    <QRCodeSVG value={fullRoleUrl} size={110} level="M" />
                    <div style={{ color: '#000', fontSize: '0.68rem', fontWeight: 700, marginTop: '4px' }}>
                      Scansiona per collegare
                    </div>
                  </div>
                )}
              </div>

              <div>
                <button
                  onClick={() => onSelectRole(r.id)}
                  className="btn-outline"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    borderColor: `${r.color}60`,
                    background: `rgba(${r.id === 'host' ? '168, 85, 247' : r.id === 'player2' ? '245, 179, 35' : '0, 210, 255'}, 0.1)`,
                    marginBottom: '10px'
                  }}
                >
                  <Play size={16} /> Apri su questo dispositivo
                </button>

                <button
                  onClick={() => copyToClipboard(fullRoleUrl, r.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    margin: '0 auto'
                  }}
                >
                  {copiedUrl === r.id ? <Check size={14} color="var(--emerald-accent)" /> : <Copy size={14} />}
                  {copiedUrl === r.id ? 'Link copiato!' : 'Copia link diretto'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Launch TV Display */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={() => onSelectRole('screen')}
          className="btn-primary"
          style={{ fontSize: '1.15rem', padding: '16px 36px', borderRadius: '16px' }}
        >
          <Tv size={22} /> Avvia Schermo TV Studio (PC)
        </button>
      </div>
    </div>
  );
}
