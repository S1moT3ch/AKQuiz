import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, Clock, Award, User, Edit2, Check, Heart, Radio, Flame, AlertCircle } from 'lucide-react';

export function PlayerView({ role, state, sendMessage, onExit }) {
  const playerKey = role === 'player2' ? 'player2' : 'player1';
  const player = state?.players?.[playerKey];
  const coupleScore = state?.couple_score ?? 0;
  const isMatch = state?.current_question_match;
  const q = state?.current_question;
  const qIndex = (state?.current_question_index ?? 0) + 1;
  const totalQ = state?.total_questions || 15;
  const timer = state?.timer || { remaining: 60, active: false };
  const countdownNum = state?.intro_countdown ?? 5;
  const screenMode = state?.screen_mode || 'QUESTION';

  const [inputAnswer, setInputAnswer] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(player?.name || '');

  // Persistent restore of previously typed answer when navigating
  useEffect(() => {
    const key = playerKey === 'player1' ? 'p1' : 'p2';
    const stored = state?.answers_store?.[state?.current_question_index]?.[key];
    setInputAnswer(stored || player?.current_answer || '');
  }, [state?.current_question_index, state?.answers_store, playerKey, player?.current_answer]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputAnswer.trim()) return;
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
  const isTimerCritical = timer.active && timer.remaining <= 10;
  const isTimeExpired = timer.active && timer.remaining === 0 && !player?.has_answered;

  return (
    <div style={{
      maxWidth: '540px',
      margin: '0 auto',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '20px 16px',
      position: 'relative',
      zIndex: 1,
      overflowY: 'auto'
    }}>
      {/* Top Header Card */}
      <header className="glass-panel" style={{
        padding: '16px 20px',
        marginBottom: '20px',
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
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              {isPlayer1 ? 'Lo Sposo' : 'La Sposa'} • In Gara Insieme
            </div>
          </div>
        </div>

        {/* Live Timer & Couple Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Question Timer Pill */}
          {timer.active && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '999px',
              background: isTimerCritical ? 'rgba(255, 71, 87, 0.25)' : 'rgba(255, 255, 255, 0.08)',
              border: isTimerCritical ? '1px solid var(--crimson-accent)' : '1px solid rgba(255, 255, 255, 0.15)',
              color: isTimerCritical ? 'var(--crimson-accent)' : '#fff',
              fontWeight: 700,
              fontSize: '0.9rem'
            }}>
              {isTimerCritical ? <Flame size={14} /> : <Clock size={13} />} {timer.remaining}s
            </div>
          )}

          {/* Couple Score */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--gold-glow)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
              <Heart size={12} color="var(--gold-primary)" fill="var(--gold-primary)" /> Punti
            </div>
            <div style={{
              fontFamily: 'var(--font-tech)',
              fontSize: '1.6rem',
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1
            }}>
              {coupleScore} <span style={{ fontSize: '0.85rem', color: 'var(--gold-primary)' }}>/ {totalQ}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Quiz Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        
        {/* PHASE: INTRO COUNTDOWN */}
        {screenMode === 'INTRO_COUNTDOWN' ? (
          <div className="glass-panel animate-float" style={{ padding: '36px 20px', textAlign: 'center' }}>
            <Radio size={48} color="var(--crimson-accent)" style={{ margin: '0 auto 16px', animation: 'pulseGlow 1s infinite' }} />
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px', color: '#fff' }}>
              SI VA IN ONDA TRA...
            </h2>
            <div style={{
              fontFamily: 'var(--font-tech)',
              fontSize: '5rem',
              fontWeight: 900,
              color: 'var(--gold-primary)',
              lineHeight: 1,
              margin: '16px 0'
            }}>
              {countdownNum}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Tieniti pronto a digitare la tua risposta aperta!
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
              {q?.category && (
                <div className="badge-cyan" style={{ fontSize: '0.78rem', padding: '4px 10px' }}>
                  {q.category}
                </div>
              )}
            </div>

            {/* Question Text */}
            <h2 style={{
              fontSize: '1.35rem',
              fontWeight: 700,
              lineHeight: 1.45,
              color: '#fff',
              marginBottom: '24px'
            }}>
              {q?.question || 'In attesa che la regia avvii la domanda...'}
            </h2>

            {/* SUBMISSION FORM OR STATUS */}
            {!player?.has_answered ? (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      La tua risposta aperta:
                    </label>
                    {timer.active && (
                      <span style={{ fontSize: '0.8rem', color: isTimerCritical ? 'var(--crimson-accent)' : 'var(--text-dim)', fontWeight: 600 }}>
                        {timer.remaining} secondi rimasti
                      </span>
                    )}
                  </div>
                  
                  <textarea
                    rows={3}
                    placeholder="Digita qui la tua risposta..."
                    value={inputAnswer}
                    disabled={isTimeExpired}
                    onChange={(e) => setInputAnswer(e.target.value)}
                    style={{
                      width: '100%',
                      background: isTimeExpired ? 'rgba(0,0,0,0.6)' : 'rgba(0, 0, 0, 0.4)',
                      border: isTimeExpired ? '1px solid var(--crimson-accent)' : '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px',
                      padding: '14px',
                      color: isTimeExpired ? 'var(--text-dim)' : '#fff',
                      fontSize: '1.1rem',
                      fontFamily: 'inherit',
                      resize: 'none',
                      outline: 'none',
                      boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.5)'
                    }}
                    onFocus={(e) => !isTimeExpired && (e.target.style.borderColor = accentColor)}
                    onBlur={(e) => !isTimeExpired && (e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)')}
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
                    <AlertCircle size={16} /> TEMPO SCADUTO! In attesa della regia...
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={!inputAnswer.trim()}
                    className={isPlayer1 ? "btn-cyan" : "btn-primary"}
                    style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}
                  >
                    <Send size={18} /> Invia Risposta Definitiva
                  </button>
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
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    La tua risposta:
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                    "{player?.current_answer}"
                  </div>
                </div>

                {isMatch !== null && isMatch !== undefined ? (
                  <div style={{
                    padding: '10px 18px',
                    borderRadius: '999px',
                    display: 'inline-block',
                    background: isMatch ? 'rgba(46, 213, 115, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                    color: isMatch ? 'var(--emerald-accent)' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.92rem'
                  }}>
                    {isMatch ? '🎉 Risposte Uguali! +1 Punto alla Coppia!' : '💬 Risposte differenti (0 pt)'}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Clock size={14} /> In attesa del confronto della regia...
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
