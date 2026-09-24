import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Tv, Volume2, VolumeX, Trophy, Sparkles, Clock, CheckCircle2, 
  HelpCircle, QrCode, Crown, Award, Heart, XCircle, X, 
  Table, Radio, Flame
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { soundManager } from '../utils/SoundManager';

export function ScreenView({ state, sendMessage, onExit }) {
  const [muted, setMuted] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const q = state?.current_question;
  const p1 = state?.players?.player1;
  const p2 = state?.players?.player2;
  const coupleScore = state?.couple_score ?? 0;
  const isMatch = state?.current_question_match;
  const qIndex = (state?.current_question_index ?? 0) + 1;
  const totalQ = state?.total_questions || 15;
  const screenMode = state?.screen_mode || 'QUESTION'; // LOBBY, INTRO_COUNTDOWN, QUESTION, ANSWERS, SCOREBOARD, RECAP, FINAL
  const timer = state?.timer || { remaining: 60, active: false };
  const countdownNum = state?.intro_countdown ?? 5;
  const recap = state?.recap || [];

  // Toggle sound
  const handleToggleSound = () => {
    const next = !muted;
    setMuted(next);
    soundManager.setMuted(next);
  };

  // Launch confetti on winner screen
  useEffect(() => {
    if (screenMode === 'FINAL') {
      const duration = 5000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 6,
          angle: 60,
          spread: 60,
          origin: { x: 0 },
          colors: ['#f5b323', '#00d2ff', '#ff4757', '#ffffff', '#ffd05b']
        });
        confetti({
          particleCount: 6,
          angle: 120,
          spread: 60,
          origin: { x: 1 },
          colors: ['#f5b323', '#00d2ff', '#ff4757', '#ffffff', '#ffd05b']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [screenMode]);

  const serverIp = state?.server_ip || window.location.hostname || 'localhost';
  const port = window.location.port || '5173';
  const baseUrl = `http://${serverIp}:${port}`;

  const affinityPct = Math.round((coupleScore / totalQ) * 100);

  const getAffinityTitle = (score) => {
    if (score >= 13) return "Telepatia di Coppia Assoluta - Anime Gemelle!";
    if (score >= 10) return "Sintonia Splendida - 25 Anni d'Amore e Complicità!";
    if (score >= 7) return "Grande Affinità con Sorprese - Gli Opposti si Attraggono!";
    return "25 Anni di Pura Avventura e Risate Insieme!";
  };

  const isTimerCritical = timer.active && timer.remaining <= 10;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: 'clamp(12px, 2.5vw, 30px) clamp(12px, 3vw, 40px)',
      position: 'relative',
      zIndex: 1,
      overflowY: 'auto'
    }}>
      {/* Top TV Bar */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        paddingBottom: 'clamp(10px, 2vh, 20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Left: TV Logo & Question Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'clamp(8px, 1.5vw, 20px)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, rgba(245, 179, 35, 0.2), rgba(168, 85, 247, 0.25))',
            padding: '6px 14px',
            borderRadius: '12px',
            border: '1px solid rgba(245, 179, 35, 0.35)'
          }}>
            <Heart size={20} color="var(--gold-primary)" fill="var(--gold-primary)" />
            <span style={{ fontFamily: 'var(--font-tech)', fontSize: 'clamp(1rem, 1.8vw, 1.25rem)', fontWeight: 700, letterSpacing: '1px' }}>
              ANTONIO & KATIA • 25 ANNI
            </span>
          </div>

          {screenMode !== 'FINAL' && screenMode !== 'INTRO_COUNTDOWN' && screenMode !== 'RECAP' && (
            <div className="badge-gold">
              DOMANDA {qIndex} DI {totalQ}
            </div>
          )}

          {q?.category && screenMode !== 'INTRO_COUNTDOWN' && screenMode !== 'RECAP' && (
            <div className="badge-cyan">
              {q.category}
            </div>
          )}
        </div>

        {/* Right: Couple Score, Live Timer & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'clamp(10px, 2vw, 20px)' }}>
          
          {/* Question Countdown Timer */}
          {(screenMode === 'QUESTION' || screenMode === 'ANSWERS') && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '999px',
              background: isTimerCritical ? 'rgba(255, 71, 87, 0.25)' : 'rgba(0, 210, 255, 0.1)',
              border: isTimerCritical ? '2px solid var(--crimson-accent)' : '1px solid rgba(0, 210, 255, 0.3)',
              boxShadow: isTimerCritical ? '0 0 20px rgba(255, 71, 87, 0.6)' : 'none',
              animation: isTimerCritical ? 'pulseGlow 0.8s infinite alternate' : 'none'
            }}>
              {isTimerCritical ? <Flame size={18} color="var(--crimson-accent)" /> : <Clock size={16} color="var(--cyan-glow)" />}
              <span style={{
                fontFamily: 'var(--font-tech)',
                fontSize: '1.3rem',
                fontWeight: 800,
                color: isTimerCritical ? 'var(--crimson-accent)' : '#fff'
              }}>
                {timer.remaining}s
              </span>
            </div>
          )}

          {/* Couple Score Hero Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'linear-gradient(135deg, rgba(245, 179, 35, 0.15), rgba(255, 71, 87, 0.15))',
            border: '1px solid rgba(245, 179, 35, 0.4)',
            padding: '6px 16px',
            borderRadius: '999px',
            boxShadow: '0 0 20px rgba(245, 179, 35, 0.2)'
          }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gold-glow)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              AFFINITÀ:
            </span>
            <span style={{
              fontFamily: 'var(--font-tech)',
              fontSize: '1.45rem',
              fontWeight: 800,
              color: '#fff'
            }}>
              {coupleScore} <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>/ {totalQ} PT</span>
            </span>
          </div>

          {/* Sound & QR & Exit */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleToggleSound}
              className="btn-outline"
              title={muted ? "Attiva audio" : "Silenzia audio"}
              style={{ padding: '8px 12px' }}
            >
              {muted ? <VolumeX size={18} color="var(--crimson-accent)" /> : <Volume2 size={18} color="var(--emerald-accent)" />}
            </button>
            <button
              onClick={() => setShowQrModal(true)}
              className="btn-outline"
              title="Mostra codici QR per smartphone"
              style={{ padding: '8px 12px' }}
            >
              <QrCode size={18} />
            </button>
            <button
              onClick={onExit}
              className="btn-outline"
              title="Torna alla Lobby"
              style={{ padding: '8px 12px' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Arena */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(14px, 2.5vh, 30px) 0' }}>
        
        {/* PHASE: DRAMATIC INTRO COUNTDOWN (SUSPENSE LIVE IN ONDA) */}
        {screenMode === 'INTRO_COUNTDOWN' && (
          <div className="animate-float" style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 24px',
              borderRadius: '999px',
              background: 'rgba(255, 71, 87, 0.2)',
              border: '1px solid var(--crimson-accent)',
              color: '#fff',
              fontWeight: 800,
              letterSpacing: '2px',
              fontSize: '1rem',
              marginBottom: '30px',
              animation: 'pulseGlow 1s infinite'
            }}>
              <Radio size={18} color="var(--crimson-accent)" /> STUDIO TV IN DIRETTA: SI VA IN ONDA TRA...
            </div>

            {/* Giant Countdown Circle */}
            <div
              key={countdownNum}
              style={{
                width: 'clamp(180px, 30vw, 260px)',
                height: 'clamp(180px, 30vw, 260px)',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(245, 179, 35, 0.25) 0%, rgba(13, 18, 38, 0.95) 70%)',
                border: '4px solid var(--gold-primary)',
                boxShadow: '0 0 60px rgba(245, 179, 35, 0.6), inset 0 0 40px rgba(245, 179, 35, 0.4)',
                margin: '0 auto 30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'flipReveal 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}
            >
              <span style={{
                fontFamily: 'var(--font-tech)',
                fontSize: 'clamp(6rem, 16vw, 10rem)',
                fontWeight: 900,
                color: '#fff',
                textShadow: '0 0 30px rgba(245, 179, 35, 0.8)'
              }}>
                {countdownNum > 0 ? countdownNum : 'VIA!'}
              </span>
            </div>

            <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.4rem)', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
              ANTONIO & KATIA • 25 ANNI INSIEME
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
              Concorrenti pronti con gli smartphone... la prima domanda sta per apparire!
            </p>
          </div>
        )}

        {/* PHASE: GRANDE TABELLONE DELLE RISPOSTE (RECAP COMPLETO DELLE 15 DOMANDE) */}
        {screenMode === 'RECAP' && (
          <div className="animate-float" style={{ maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div className="badge-gold" style={{ marginBottom: '10px' }}>
                <Table size={16} /> TABELLONE COMPLETO RISPOSTE & ANEDDOTI
              </div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 800, marginBottom: '6px' }}>
                Le 15 Risposte di Antonio & Katia a Confronto
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                Affinità totale registrata: <strong style={{ color: 'var(--gold-glow)' }}>{coupleScore} su {totalQ} risposte coincidenti ({affinityPct}%)</strong>
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '12px',
              maxHeight: '65vh',
              overflowY: 'auto',
              paddingRight: '8px'
            }}>
              {recap.map((item, idx) => (
                <div key={idx} className="glass-panel" style={{
                  padding: '16px 20px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
                  gap: '16px',
                  alignItems: 'center',
                  borderLeft: item.is_match === true ? '6px solid var(--emerald-accent)' : item.is_match === false ? '6px solid var(--crimson-accent)' : '6px solid rgba(255,255,255,0.2)'
                }}>
                  {/* Question Info */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="badge-gold" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>#{item.id}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--cyan-glow)', fontWeight: 700 }}>{item.category}</span>
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                      {item.question}
                    </div>
                  </div>

                  {/* Antonio & Katia Answers */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
                      <span style={{ color: 'var(--cyan-glow)', fontWeight: 700, width: '70px', fontSize: '0.85rem' }}>Antonio:</span>
                      <span style={{ color: '#fff', fontStyle: item.p1_answer ? 'normal' : 'italic' }}>
                        {item.p1_answer ? `"${item.p1_answer}"` : '—'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
                      <span style={{ color: 'var(--gold-glow)', fontWeight: 700, width: '70px', fontSize: '0.85rem' }}>Katia:</span>
                      <span style={{ color: '#fff', fontStyle: item.p2_answer ? 'normal' : 'italic' }}>
                        {item.p2_answer ? `"${item.p2_answer}"` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Outcome Match Badge */}
                  <div style={{ textAlign: 'right' }}>
                    {item.is_match === true && (
                      <span className="badge-cyan" style={{ background: 'rgba(46, 213, 115, 0.2)', borderColor: 'var(--emerald-accent)', color: 'var(--emerald-accent)', fontSize: '0.85rem' }}>
                        <Heart size={14} fill="var(--emerald-accent)" /> UGUALI (+1 PT)
                      </span>
                    )}
                    {item.is_match === false && (
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontWeight: 600 }}>
                        Differenti (0 pt)
                      </span>
                    )}
                    {item.is_match === null && (
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                        Non ancora convalidata
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PHASE: FINAL CELEBRATION (NOZZE D'ARGENTO PODIO) */}
        {screenMode === 'FINAL' && (
          <div className="animate-float" style={{ textAlign: 'center', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
            <div style={{ display: 'inline-flex', padding: '18px', borderRadius: '50%', background: 'rgba(245, 179, 35, 0.15)', border: '2px solid var(--gold-primary)', marginBottom: '20px' }}>
              <Heart size={70} color="var(--gold-primary)" fill="var(--gold-primary)" />
            </div>
            
            <h1 style={{
              fontSize: 'clamp(2.5rem, 6vw, 4.2rem)',
              fontWeight: 900,
              fontFamily: 'var(--font-tech)',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              background: 'linear-gradient(135deg, #ffd05b 0%, #f5a623 50%, #ffffff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '10px'
            }}>
              VIVA GLI SPOSI • 25 ANNI INSIEME!
            </h1>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '1.4rem', marginBottom: '30px' }}>
              {getAffinityTitle(coupleScore)}
            </p>

            {/* Couple Podium Display */}
            <div className="glass-panel" style={{
              padding: '40px 30px',
              border: '2px solid var(--gold-primary)',
              boxShadow: '0 0 50px rgba(245, 179, 35, 0.3)',
              maxWidth: '750px',
              margin: '0 auto 30px',
              position: 'relative'
            }}>
              <div style={{ position: 'absolute', top: '-16px', left: '50%', transform: 'translateX(-50%)' }} className="badge-gold">
                <Crown size={16} /> NOZZE D'ARGENTO
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px', marginBottom: '25px', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--cyan-glow)' }}>
                    {p1?.name || 'Antonio'}
                  </div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Lo Sposo</div>
                </div>

                <div style={{ fontSize: '2.5rem', color: 'var(--crimson-accent)' }}>❤️</div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--gold-glow)' }}>
                    {p2?.name || 'Katia'}
                  </div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', textTransform: 'uppercase' }}>La Sposa</div>
                </div>
              </div>

              <div style={{
                background: 'rgba(0,0,0,0.4)',
                padding: '20px',
                borderRadius: '16px',
                display: 'inline-block',
                minWidth: '280px'
              }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                  PUNTEGGIO AFFINITÀ FINALE
                </div>
                <div style={{ fontFamily: 'var(--font-tech)', fontSize: '4.5rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                  {coupleScore} <span style={{ fontSize: '1.8rem', color: 'var(--gold-glow)' }}>/ {totalQ}</span>
                </div>
                <div style={{ color: 'var(--emerald-accent)', fontWeight: 700, marginTop: '8px', fontSize: '1.1rem' }}>
                  {affinityPct}% di Sintonia Dimostrata!
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PHASE: SCOREBOARD VIEW */}
        {screenMode === 'SCOREBOARD' && (
          <div className="animate-float" style={{ maxWidth: '800px', margin: '0 auto', width: '100%', textAlign: 'center' }}>
            <div className="badge-gold" style={{ marginBottom: '16px' }}>
              <Award size={16} /> TERMOMETRO DELL'AFFINITÀ
            </div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '35px' }}>
              Punteggio di Coppia dopo {qIndex - 1} Domande
            </h2>

            <div className="glass-panel" style={{ padding: '40px', borderTop: '5px solid var(--gold-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                <Heart size={44} color="var(--gold-primary)" fill="var(--gold-primary)" />
                <div style={{ fontFamily: 'var(--font-tech)', fontSize: '4rem', fontWeight: 900, color: '#fff' }}>
                  {coupleScore} <span style={{ fontSize: '1.8rem', color: 'var(--text-dim)' }}>/ {totalQ} Punti</span>
                </div>
              </div>

              {/* Affinity Progress Bar */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                height: '24px',
                borderRadius: '999px',
                overflow: 'hidden',
                position: 'relative',
                marginBottom: '16px'
              }}>
                <div style={{
                  background: 'linear-gradient(90deg, #00d2ff, #f5a623, #2ed573)',
                  height: '100%',
                  width: `${Math.max(5, (coupleScore / totalQ) * 100)}%`,
                  borderRadius: '999px',
                  transition: 'width 1s ease'
                }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                <span>0 Punti</span>
                <span style={{ color: 'var(--gold-glow)' }}>{affinityPct}% di Risposte Coincidenti</span>
                <span>{totalQ} Punti Max</span>
              </div>
            </div>
          </div>
        )}

        {/* PHASE: QUESTION & ANSWERS (TV QUIZ ARENA) */}
        {(screenMode === 'QUESTION' || screenMode === 'ANSWERS') && (
          <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
            
            {/* The TV Question Box */}
            <div className="glass-panel tv-card-question animate-float" style={{
              padding: 'clamp(20px, 3.5vw, 40px) clamp(16px, 4vw, 50px)',
              textAlign: 'center',
              marginBottom: 'clamp(16px, 2.5vh, 30px)',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-16px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--bg-deep)',
                padding: '4px 18px',
                borderRadius: '999px',
                border: '1px solid rgba(0, 210, 255, 0.4)',
                color: 'var(--cyan-glow)',
                fontFamily: 'var(--font-tech)',
                fontWeight: 700,
                fontSize: '0.85rem',
                letterSpacing: '2px'
              }}>
                DOMANDA {qIndex} / {totalQ}
              </div>

              <h2 style={{
                fontSize: 'clamp(1.25rem, 2.6vw, 2.4rem)',
                fontWeight: 700,
                lineHeight: 1.35,
                color: '#ffffff',
                textShadow: '0 2px 20px rgba(0,0,0,0.8)'
              }}>
                {q?.question || 'In attesa della prima domanda...'}
              </h2>

              {/* Reference note (only visible if answers are revealed) */}
              {screenMode === 'ANSWERS' && q?.reference_answer && (
                <div className="animate-reveal" style={{
                  marginTop: '18px',
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(245, 179, 35, 0.1)',
                  border: '1px solid rgba(245, 179, 35, 0.3)',
                  padding: '6px 18px',
                  borderRadius: '999px',
                  flexWrap: 'wrap',
                  justifyContent: 'center'
                }}>
                  <Sparkles size={16} color="var(--gold-primary)" />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nota di riferimento:</span>
                  <strong style={{ color: 'var(--gold-glow)', fontSize: '0.95rem' }}>{q.reference_answer}</strong>
                </div>
              )}
            </div>

            {/* Players Answer Cards Arena (Antonio & Katia Side-by-Side) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 'clamp(14px, 2.5vw, 30px)', marginBottom: '20px' }}>
              
              {/* ANTONIO BOX */}
              <div className={`glass-panel tv-player-card active-p1 ${p1?.has_answered ? 'answered' : ''}`} style={{ padding: 'clamp(16px, 2vw, 26px)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: p1?.connected ? 'var(--emerald-accent)' : 'var(--text-dim)', boxShadow: p1?.connected ? '0 0 10px var(--emerald-accent)' : 'none' }} />
                    <h3 style={{ fontSize: 'clamp(1.2rem, 1.8vw, 1.45rem)', fontWeight: 800, color: 'var(--cyan-glow)' }}>
                      {p1?.name || 'Antonio'}
                    </h3>
                  </div>

                  <div>
                    {p1?.has_answered ? (
                      <span className="badge-cyan" style={{ background: 'rgba(46, 213, 115, 0.15)', borderColor: 'rgba(46, 213, 115, 0.4)', color: 'var(--emerald-accent)' }}>
                        <CheckCircle2 size={14} /> Risposta Inviata
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} /> In digitazione...
                      </span>
                    )}
                  </div>
                </div>

                <div style={{
                  minHeight: '130px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {p1?.is_revealed ? (
                    <div className="animate-reveal" style={{ width: '100%' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                        Risposta di Antonio:
                      </div>
                      <div style={{
                        fontSize: '1.65rem',
                        fontWeight: 700,
                        color: isMatch ? 'var(--emerald-accent)' : '#ffffff',
                        wordBreak: 'break-word',
                        textShadow: isMatch ? '0 0 20px rgba(46, 213, 115, 0.6)' : 'none'
                      }}>
                        "{p1?.current_answer || 'Nessuna risposta'}"
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-dim)' }}>
                      <HelpCircle size={32} />
                      <span style={{ fontSize: '0.95rem' }}>
                        {p1?.has_answered ? 'Risposta sigillata (in attesa di svelamento)' : 'In attesa dello sposo...'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* KATIA BOX */}
              <div className={`glass-panel tv-player-card active-p2 ${p2?.has_answered ? 'answered' : ''}`} style={{ padding: 'clamp(16px, 2vw, 26px)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: p2?.connected ? 'var(--emerald-accent)' : 'var(--text-dim)', boxShadow: p2?.connected ? '0 0 10px var(--emerald-accent)' : 'none' }} />
                    <h3 style={{ fontSize: 'clamp(1.2rem, 1.8vw, 1.45rem)', fontWeight: 800, color: 'var(--gold-glow)' }}>
                      {p2?.name || 'Katia'}
                    </h3>
                  </div>

                  <div>
                    {p2?.has_answered ? (
                      <span className="badge-gold" style={{ background: 'rgba(46, 213, 115, 0.15)', borderColor: 'rgba(46, 213, 115, 0.4)', color: 'var(--emerald-accent)' }}>
                        <CheckCircle2 size={14} /> Risposta Inviata
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} /> In digitazione...
                      </span>
                    )}
                  </div>
                </div>

                <div style={{
                  minHeight: '130px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {p2?.is_revealed ? (
                    <div className="animate-reveal" style={{ width: '100%' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                        Risposta di Katia:
                      </div>
                      <div style={{
                        fontSize: '1.65rem',
                        fontWeight: 700,
                        color: isMatch ? 'var(--emerald-accent)' : '#ffffff',
                        wordBreak: 'break-word',
                        textShadow: isMatch ? '0 0 20px rgba(46, 213, 115, 0.6)' : 'none'
                      }}>
                        "{p2?.current_answer || 'Nessuna risposta'}"
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-dim)' }}>
                      <HelpCircle size={32} />
                      <span style={{ fontSize: '0.95rem' }}>
                        {p2?.has_answered ? 'Risposta sigillata (in attesa di svelamento)' : 'In attesa della sposa...'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* CELEBRATORY AFFINITY BANNER (WHEN REGIA JUDGES) */}
            {isMatch !== null && isMatch !== undefined && screenMode === 'ANSWERS' && (
              <div className="animate-reveal" style={{ textAlign: 'center' }}>
                {isMatch ? (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: 'linear-gradient(135deg, rgba(46, 213, 115, 0.25), rgba(0, 210, 255, 0.25))',
                    border: '2px solid var(--emerald-accent)',
                    padding: '16px 36px',
                    borderRadius: '999px',
                    boxShadow: '0 0 35px rgba(46, 213, 115, 0.4)'
                  }}>
                    <Heart size={26} color="var(--emerald-accent)" fill="var(--emerald-accent)" />
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', letterSpacing: '1px' }}>
                      RISPOSTE COINCIDENTI! +1 PUNTO ALLA COPPIA!
                    </span>
                  </div>
                ) : (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    padding: '12px 28px',
                    borderRadius: '999px'
                  }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      💬 Risposte differenti (0 pt) • Gli opposti si attraggono!
                    </span>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </main>

      {/* Bottom Status / Broadcast ticker */}
      <footer style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        fontSize: '0.9rem',
        color: 'var(--text-dim)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--emerald-accent)', display: 'inline-block' }} />
          <span>QUIZ SHOW NOZZE D'ARGENTO • DIRETTA STREAMING REGIA</span>
        </div>
        <div>
          Indirizzo LAN: <strong style={{ color: 'var(--cyan-glow)' }}>{baseUrl}</strong>
        </div>
      </footer>

      {/* QR Code Modal for on-the-fly smartphone pairing */}
      {showQrModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ padding: '36px', maxWidth: '700px', width: '100%', position: 'relative' }}>
            <button
              onClick={() => setShowQrModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '8px', textAlign: 'center' }}>
              Collega gli Smartphone degli Sposi e Regia
            </h2>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '28px', fontSize: '0.95rem' }}>
              Assicurati che tutti i dispositivi siano collegati alla stessa rete Wi-Fi del PC.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', textAlign: 'center' }}>
              <div className="glass-card" style={{ padding: '16px' }}>
                <div style={{ color: 'var(--cyan-glow)', fontWeight: 700, marginBottom: '8px', fontSize: '0.9rem' }}>ANTONIO (SPOSO)</div>
                <div style={{ background: '#fff', padding: '8px', borderRadius: '8px', display: 'inline-block', marginBottom: '8px' }}>
                  <QRCodeSVG value={`${baseUrl}/?role=player1`} size={110} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scan per Antonio</div>
              </div>

              <div className="glass-card" style={{ padding: '16px' }}>
                <div style={{ color: 'var(--gold-glow)', fontWeight: 700, marginBottom: '8px', fontSize: '0.9rem' }}>KATIA (SPOSA)</div>
                <div style={{ background: '#fff', padding: '8px', borderRadius: '8px', display: 'inline-block', marginBottom: '8px' }}>
                  <QRCodeSVG value={`${baseUrl}/?role=player2`} size={110} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scan per Katia</div>
              </div>

              <div className="glass-card" style={{ padding: '16px' }}>
                <div style={{ color: '#a855f7', fontWeight: 700, marginBottom: '8px', fontSize: '0.9rem' }}>REGIA (FIGLI)</div>
                <div style={{ background: '#fff', padding: '8px', borderRadius: '8px', display: 'inline-block', marginBottom: '8px' }}>
                  <QRCodeSVG value={`${baseUrl}/?role=host`} size={110} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scan per Regia</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
