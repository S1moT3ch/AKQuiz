import React, { useState, useEffect, useRef } from 'react';
import { Send, CheckCircle2, Clock, Award, User, Edit2, Check, Heart, Radio, Flame, AlertCircle, Sparkles } from 'lucide-react';

export function PlayerView({ role, state, sendMessage, onExit }) {
  const playerKey = role === 'player2' ? 'player2' : 'player1';
  const player = state?.players?.[playerKey];
  const coupleScore = state?.couple_score ?? 0;
  const isMatch = state?.current_question_match;
  const q = state?.current_question;
  const currentQIndex = state?.current_question_index ?? 0;
  const qIndex = currentQIndex + 1;
  const totalQ = state?.total_questions || 15;
  const timer = state?.timer || { remaining: 60, active: false };
  const countdownNum = state?.intro_countdown ?? 5;
  const screenMode = state?.screen_mode || 'QUESTION';
  const isLobby = screenMode === 'LOBBY' || state?.phase === 'LOBBY';
  const otherPlayerKey = playerKey === 'player1' ? 'player2' : 'player1';
  const otherPlayer = state?.players?.[otherPlayerKey];
  const otherPlayerOnline = Boolean(otherPlayer?.connected);
  const otherPlayerName = otherPlayer?.name || (otherPlayerKey === 'player1' ? 'Antonio' : 'Katia');

  const [inputAnswer, setInputAnswer] = useState('');
  const [isModifying, setIsModifying] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(player?.name || '');

  // Track the question index & whether the user is actively typing locally
  const lastQIndexRef = useRef(null);
  const userIsTypingRef = useRef(false);
  const typingTimeoutRef = useRef(null);
  const lastSentTextRef = useRef('');

  // Send real-time typing updates to Regia
  const sendTypingUpdate = (text) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      lastSentTextRef.current = text;
      sendMessage('TYPING_UPDATE', {
        player: playerKey,
        text: text
      });
    }, 100);
  };

  // Restore previously typed answer ONLY when question index actually changes or on initial load
  useEffect(() => {
    if (isLobby) {
      setInputAnswer('');
      lastSentTextRef.current = '';
      lastQIndexRef.current = null;
      userIsTypingRef.current = false;
      setIsModifying(false);
      return;
    }

    const key = playerKey === 'player1' ? 'p1' : 'p2';
    const stored = state?.answers_store?.[currentQIndex]?.[key];
    const saved = player?.current_answer || '';
    const initialText = stored || saved;

    if (lastQIndexRef.current !== currentQIndex) {
      // Question changed: reset editing and typing states, load answer for this question
      lastQIndexRef.current = currentQIndex;
      userIsTypingRef.current = false;
      setIsModifying(false);
      setInputAnswer(initialText);
      lastSentTextRef.current = initialText;
    } else if (!userIsTypingRef.current && !inputAnswer && initialText) {
      // User hasn't typed anything yet and an answer arrived from backend (e.g. on socket connect)
      setInputAnswer(initialText);
      lastSentTextRef.current = initialText;
    }
  }, [currentQIndex, playerKey, player?.current_answer, state?.answers_store, isLobby]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputAnswer.trim()) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    userIsTypingRef.current = false;
    setIsModifying(false);
    sendMessage('SUBMIT_ANSWER', {
      player: playerKey,
      answer: inputAnswer.trim()
    });
  };

  const handleSaveName = (e) => {
    e.preventDefault();
    if (!tempName.trim()) return;
    sendMessage('SET_NAME', {
      player: playerKey,
      name: tempName.trim()
    });
    setEditingName(false);
  };

  const isPlayer1 = playerKey === 'player1';
  const accentColor = isPlayer1 ? 'var(--cyan-primary)' : 'var(--gold-primary)';
  const glowColor = isPlayer1 ? 'var(--cyan-glow)' : 'var(--gold-glow)';
  const timerRemaining = timer.remaining ?? 60;
  const timerDuration = timer.duration || 60;
  const timerPct = Math.max(0, Math.min(100, (timerRemaining / timerDuration) * 100));
  const isTimerCritical = timer.active && timerRemaining <= 10;
  const isTimerMid = timer.active && timerRemaining > 10 && timerRemaining <= 25;
  const isTimeExpired = timer.active && timerRemaining === 0 && !player?.has_answered;

  return (
    <div style={{
      maxWidth: '540px',
      margin: '0 auto',
      height: '100dvh',
      maxHeight: '100dvh',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: 'clamp(8px, 1.6vh, 16px) clamp(10px, 2.5vw, 18px)',
      position: 'relative',
      zIndex: 1,
      overflow: 'hidden'
    }}>
      {/* Top Header Card */}
      <header className="glass-panel" style={{
        padding: '12px 18px',
        marginBottom: '16px',
        borderTop: `4px solid ${accentColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Player Profile & Name Editor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: `rgba(${isPlayer1 ? '0, 210, 255' : '245, 179, 35'}, 0.15)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${accentColor}`
          }}>
            <User size={20} color={accentColor} />
          </div>

          <div>
            {editingName ? (
              <form onSubmit={handleSaveName} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  autoFocus
                  style={{
                    background: 'rgba(0,0,0,0.5)',
                    border: `1px solid ${accentColor}`,
                    color: '#fff',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '0.9rem',
                    width: '130px'
                  }}
                />
                <button type="submit" style={{ background: accentColor, border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}>
                  <Check size={14} color="#000" />
                </button>
              </form>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: glowColor }}>
                  {player?.name || (isPlayer1 ? 'Antonio' : 'Katia')}
                </span>
                <button
                  onClick={() => { setTempName(player?.name || ''); setEditingName(true); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '2px' }}
                  title="Modifica nome"
                >
                  <Edit2 size={13} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Live Timer or Online Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isLobby ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '999px',
              background: 'rgba(46, 213, 115, 0.15)',
              border: '1px solid var(--emerald-accent)',
              color: 'var(--emerald-accent)',
              fontWeight: 700,
              fontSize: '0.78rem'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--emerald-accent)', boxShadow: '0 0 8px var(--emerald-accent)' }} />
              ONLINE
            </div>
          ) : timer.enabled !== false && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '999px',
              background: isTimerCritical ? 'rgba(255, 71, 87, 0.25)' : isTimerMid ? 'rgba(245, 179, 35, 0.15)' : 'rgba(255, 255, 255, 0.08)',
              border: isTimerCritical ? '1px solid var(--crimson-accent)' : isTimerMid ? '1px solid var(--gold-primary)' : '1px solid rgba(255, 255, 255, 0.15)',
              color: isTimerCritical ? 'var(--crimson-accent)' : isTimerMid ? 'var(--gold-glow)' : '#fff',
              fontWeight: 800,
              fontSize: '0.95rem',
              boxShadow: isTimerCritical ? '0 0 15px rgba(255, 71, 87, 0.5)' : 'none',
              animation: isTimerCritical ? 'pulseGlow 0.8s infinite alternate' : 'none'
            }}>
              {isTimerCritical ? <Flame size={15} /> : <Clock size={14} />}
              <span style={{ fontFamily: 'var(--font-tech)', fontSize: '1.15rem' }}>{timerRemaining}s</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Quiz Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 0, overflowY: 'auto' }}>

        {/* PHASE 0: WELCOME LOBBY */}
        {isLobby ? (
          <div className="glass-panel animate-reveal" style={{
            padding: 'clamp(18px, 3.5vh, 28px) clamp(16px, 3.5vw, 24px)',
            textAlign: 'center',
            borderRadius: '20px',
            border: `2px solid ${accentColor}`,
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.45)`,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            margin: 'auto 0'
          }}>
            {/* Top Celebratory Icon & Title */}
            <div>
              <div style={{
                display: 'inline-flex',
                padding: '12px',
                borderRadius: '50%',
                background: `rgba(${isPlayer1 ? '0, 210, 255' : '245, 179, 35'}, 0.15)`,
                border: `2px solid ${accentColor}`,
                marginBottom: '8px'
              }}>
                <Heart size={34} color={accentColor} fill={accentColor} />
              </div>
              <div style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                color: 'var(--text-muted)'
              }}>
                Nozze d'Argento • 25 Anni Insieme
              </div>
              <h1 style={{
                fontSize: 'clamp(1.4rem, 5.5vw, 1.9rem)',
                fontWeight: 900,
                color: '#fff',
                margin: '4px 0 2px'
              }}>
                Benvenuto, <span style={{ color: glowColor }}>{player?.name || (isPlayer1 ? 'Antonio' : 'Katia')}</span>!
              </h1>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', margin: 0 }}>
                Sei collegato alla postazione di gioco
              </p>
            </div>

            {/* Connection Status Box */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                Stato Connessione
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{
                  background: 'rgba(46, 213, 115, 0.12)',
                  border: '1px solid var(--emerald-accent)',
                  borderRadius: '8px',
                  padding: '7px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--emerald-accent)', boxShadow: '0 0 8px var(--emerald-accent)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>
                    Tu: Connesso ✓
                  </span>
                </div>

                <div style={{
                  background: otherPlayerOnline ? 'rgba(46, 213, 115, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${otherPlayerOnline ? 'var(--emerald-accent)' : 'rgba(255, 255, 255, 0.15)'}`,
                  borderRadius: '8px',
                  padding: '7px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: otherPlayerOnline ? 'var(--emerald-accent)' : 'var(--text-dim)',
                    boxShadow: otherPlayerOnline ? '0 0 8px var(--emerald-accent)' : 'none',
                    flexShrink: 0
                  }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: otherPlayerOnline ? '#fff' : 'var(--text-dim)' }}>
                    {otherPlayerName}: {otherPlayerOnline ? 'Connesso/a ✓' : 'In attesa...'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Game Rules Card */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '10px 14px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--gold-glow)' }}>
                Come Funziona il Gioco:
              </div>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <li>Affronterete <strong>15 domande</strong></li>
                <li>Digita la tua risposta dal telefono, senza sbirciare!</li>
                <li>Ogni risposta coincidente assegna <strong>+1 punto affinità</strong>!</li>
              </ul>
            </div>

            {/* Waiting for Start pulsing banner */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 210, 255, 0.12), rgba(245, 179, 35, 0.12))',
              border: '1px solid rgba(0, 210, 255, 0.35)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}>
              <Radio size={18} color="var(--cyan-glow)" style={{ animation: 'pulseGlow 1.2s infinite' }} />
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#fff' }}>
                  IN ATTESA DEL VIA
                </div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                  Mettiti comodo: il gioco sta per iniziare!
                </div>
              </div>
            </div>
          </div>
        ) : screenMode === 'INTRO_COUNTDOWN' ? (
          <div className="glass-panel animate-float" style={{ padding: 'clamp(20px, 4vh, 32px) 20px', textAlign: 'center' }}>
            <Radio size={42} color="var(--crimson-accent)" style={{ margin: '0 auto 12px', animation: 'pulseGlow 1s infinite' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px', color: '#fff' }}>
              SI VA IN ONDA TRA...
            </h2>
            <div style={{
              fontFamily: 'var(--font-tech)',
              fontSize: 'clamp(4.5rem, 15vw, 6.5rem)',
              fontWeight: 900,
              color: 'var(--gold-primary)',
              lineHeight: 1,
              margin: '12px 0'
            }}>
              {countdownNum}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Tieniti pronto a digitare la tua risposta!
            </p>
          </div>
        ) : screenMode === 'QUESTION_INTRO' ? (
          <div className="glass-panel animate-float" style={{ padding: 'clamp(20px, 4vh, 36px) 20px', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '999px',
              background: 'rgba(0, 210, 255, 0.15)',
              border: '1px solid var(--cyan-primary)',
              color: 'var(--cyan-glow)',
              fontWeight: 700,
              fontSize: '0.8rem',
              letterSpacing: '1px',
              marginBottom: '16px',
              animation: 'pulseGlow 1.2s infinite'
            }}>
              <Radio size={14} color="var(--cyan-glow)" /> LA DOMANDA STA PER ARRIVARE!
            </div>

            <div style={{
              fontFamily: 'var(--font-tech)',
              fontSize: 'clamp(2.6rem, 10vw, 4rem)',
              fontWeight: 900,
              color: 'var(--gold-primary)',
              lineHeight: 1.1,
              marginBottom: '16px'
            }}>
              {qIndex}ª DOMANDA
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
              Tieniti pronto al telefono!<br />
              <strong style={{ color: '#fff' }}>La domanda sta per arrivare sullo schermo!</strong>
            </p>
          </div>
        ) : state?.phase === 'FINISHED' ? (
          <div className="glass-panel animate-float" style={{ padding: '36px 24px', textAlign: 'center' }}>
            <Heart size={64} color="var(--gold-primary)" fill="var(--gold-primary)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>Viva gli Sposi!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              Avete completato tutte le 15 domande dei vostri 25 anni di matrimonio!
            </p>
            <div className="badge-gold" style={{ fontSize: '1.2rem', padding: '10px 24px' }}>
              Affinità finale: {coupleScore} su {totalQ} risposte coincidenti!
            </div>
          </div>
        ) : (
          <div className="glass-panel animate-float" style={{ padding: '24px', position: 'relative' }}>

            {/* Question Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div className="badge-gold" style={{ fontSize: '0.78rem', padding: '4px 10px' }}>
                DOMANDA {qIndex} / {totalQ}
              </div>
            </div>

            {/* Question Text */}
            <h2 style={{
              fontSize: '1.35rem',
              fontWeight: 700,
              lineHeight: 1.45,
              color: '#fff',
              marginBottom: '16px'
            }}>
              {q?.question || 'La domanda sta per arrivare...'}
            </h2>

            {/* HIGH-IMPACT CONTESTANT COUNTDOWN TIMER WIDGET */}
            {timer.enabled !== false && (
              <div style={{
                background: isTimerCritical
                  ? 'rgba(255, 71, 87, 0.16)'
                  : isTimerMid
                    ? 'rgba(245, 179, 35, 0.1)'
                    : 'rgba(0, 0, 0, 0.35)',
                border: isTimerCritical
                  ? '2px solid var(--crimson-accent)'
                  : isTimerMid
                    ? '1px solid rgba(245, 179, 35, 0.45)'
                    : '1px solid rgba(0, 210, 255, 0.3)',
                borderRadius: '14px',
                padding: '10px 14px',
                marginBottom: '16px',
                boxShadow: isTimerCritical ? '0 0 25px rgba(255, 71, 87, 0.45)' : 'none',
                animation: isTimerCritical ? 'pulseGlow 0.8s infinite alternate' : 'none'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isTimerCritical ? (
                      <Flame size={24} color="var(--crimson-accent)" style={{ animation: 'pulseGlow 0.6s infinite alternate' }} />
                    ) : (
                      <Clock size={20} color="var(--cyan-glow)" />
                    )}
                    <span style={{
                      fontFamily: 'var(--font-tech)',
                      fontSize: '1.9rem',
                      fontWeight: 900,
                      lineHeight: 1,
                      color: isTimerCritical ? 'var(--crimson-accent)' : isTimerMid ? 'var(--gold-glow)' : '#fff',
                      textShadow: isTimerCritical ? '0 0 16px rgba(255, 71, 87, 0.8)' : 'none'
                    }}>
                      {timerRemaining}s
                    </span>
                  </div>

                  <div style={{
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: isTimerCritical
                      ? 'var(--crimson-accent)'
                      : player?.has_answered
                        ? 'var(--emerald-accent)'
                        : isTimerMid
                          ? 'var(--gold-glow)'
                          : 'var(--text-muted)'
                  }}>
                    {timerRemaining === 0
                      ? '⛔ TEMPO SCADUTO!'
                      : isTimerCritical
                        ? '🔥 AFFRETTATI! ULTIMI SECONDI!'
                        : player?.has_answered
                          ? '✓ RISPOSTA INVIATA'
                          : timer.active
                            ? 'TEMPO PER RISPONDERE'
                            : 'PAUSA'}
                  </div>
                </div>

                {/* Animated Depleting Progress Bar */}
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: 'rgba(0, 0, 0, 0.5)',
                  borderRadius: '999px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${timerPct}%`,
                    background: isTimerCritical
                      ? 'linear-gradient(90deg, #ff4757, #ff6b81)'
                      : isTimerMid
                        ? 'linear-gradient(90deg, #f5a623, #ffd05b)'
                        : 'linear-gradient(90deg, #00d2ff, #2ed573)',
                    borderRadius: '999px',
                    transition: 'width 1s linear',
                    boxShadow: isTimerCritical ? '0 0 10px #ff4757' : 'none'
                  }} />
                </div>
              </div>
            )}

            {/* SUBMISSION FORM OR STATUS */}
            {!player?.has_answered || isModifying ? (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      La tua risposta aperta:
                    </label>
                    {timer.active && (
                      <span style={{ fontSize: '0.8rem', color: isTimerCritical ? 'var(--crimson-accent)' : 'var(--text-dim)', fontWeight: 600 }}>
                        {timerRemaining} secondi rimasti
                      </span>
                    )}
                  </div>

                  <textarea
                    rows={3}
                    placeholder="Digita qui la tua risposta..."
                    value={inputAnswer}
                    disabled={isTimeExpired}
                    onChange={(e) => {
                      const val = e.target.value;
                      userIsTypingRef.current = true;
                      setInputAnswer(val);
                      sendTypingUpdate(val);
                    }}
                    style={{
                      width: '100%',
                      background: isTimeExpired ? 'rgba(0,0,0,0.6)' : 'rgba(0, 0, 0, 0.4)',
                      border: isTimeExpired
                        ? '1px solid var(--crimson-accent)'
                        : isTimerCritical
                          ? '2px solid var(--crimson-accent)'
                          : '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px',
                      padding: '14px',
                      color: isTimeExpired ? 'var(--text-dim)' : '#fff',
                      fontSize: '1.1rem',
                      fontFamily: 'inherit',
                      resize: 'none',
                      outline: 'none',
                      boxShadow: isTimerCritical ? '0 0 18px rgba(255, 71, 87, 0.35)' : 'inset 0 2px 6px rgba(0,0,0,0.5)',
                      transition: 'border-color 0.3s ease, box-shadow 0.3s ease'
                    }}
                    onFocus={(e) => !isTimeExpired && !isTimerCritical && (e.target.style.borderColor = accentColor)}
                    onBlur={(e) => !isTimeExpired && !isTimerCritical && (e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)')}
                  />
                </div>

                {isTimeExpired ? (
                  <div style={{
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'rgba(255, 71, 87, 0.2)',
                    border: '1px solid var(--crimson-accent)',
                    color: 'var(--crimson-accent)',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}>
                    <AlertCircle size={16} /> TEMPO SCADUTO! Attendere...
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      type="submit"
                      disabled={!inputAnswer.trim()}
                      className={isPlayer1 ? "btn-cyan" : "btn-primary"}
                      style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}
                    >
                      <Send size={18} /> {isModifying ? "Aggiorna Risposta" : "Invia Risposta Definitiva"}
                    </button>
                    {isModifying && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsModifying(false);
                          userIsTypingRef.current = false;
                          const orig = player?.current_answer || '';
                          setInputAnswer(orig);
                          sendTypingUpdate(orig);
                        }}
                        className="btn-outline"
                        style={{ width: '100%', padding: '10px', fontSize: '0.9rem' }}
                      >
                        Annulla Modifica
                      </button>
                    )}
                  </div>
                )}
              </form>
            ) : (
              <div style={{
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(46, 213, 115, 0.3)',
                borderRadius: '16px',
                padding: '24px 20px',
                textAlign: 'center'
              }}>
                <div style={{ display: 'inline-flex', padding: '10px', borderRadius: '50%', background: 'rgba(46, 213, 115, 0.15)', marginBottom: '12px' }}>
                  <CheckCircle2 size={32} color="var(--emerald-accent)" />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--emerald-accent)', marginBottom: '8px' }}>
                  Risposta Inviata!
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '16px' }}>
                  Risposta salvata e sigillata. Verrà svelata insieme sullo schermo TV!
                </p>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  marginBottom: '12px'
                }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    La tua risposta:
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                    "{player?.current_answer}"
                  </div>
                </div>

                {!player?.is_revealed && !isTimeExpired && (
                  <div style={{ marginBottom: '16px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsModifying(true);
                        userIsTypingRef.current = true;
                        setInputAnswer(player?.current_answer || '');
                      }}
                      className="btn-outline"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        fontSize: '0.8rem',
                        borderRadius: '8px'
                      }}
                    >
                      <Edit2 size={13} /> Modifica la risposta
                    </button>
                  </div>
                )}

                {isMatch !== null && isMatch !== undefined ? (
                  <div style={{
                    padding: '10px 18px',
                    borderRadius: '999px',
                    display: 'inline-block',
                    background: isMatch ? 'rgba(46, 213, 115, 0.2)' : 'rgba(255, 71, 87, 0.2)',
                    border: isMatch ? '1px solid var(--emerald-accent)' : '1px solid var(--crimson-accent)',
                    color: isMatch ? 'var(--emerald-accent)' : 'var(--crimson-accent)',
                    fontWeight: 700,
                    fontSize: '0.92rem'
                  }}>
                    {isMatch ? '🎉 Risposte Uguali! +1 Punto alla Coppia!' : '💬 Risposte differenti (0 pt)'}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Clock size={14} /> In attesa della verifica delle risposte...
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </main>

      {/* Footer / Switch Role */}
      <footer style={{ textAlign: 'center', paddingTop: '16px' }}>
        <button
          onClick={onExit}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-dim)',
            fontSize: '0.82rem',
            cursor: 'pointer'
          }}
        >
          ← Torna al menu principale
        </button>
      </footer>
    </div>
  );
}
