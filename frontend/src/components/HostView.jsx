import React, { useState } from 'react';
import { 
  Sliders, Play, ChevronRight, ChevronLeft, Eye, CheckCircle, 
  XCircle, Award, Trophy, Volume2, RotateCcw, ListOrdered, 
  BookOpen, Sparkles, Heart, Users, X, HelpCircle, Table,
  Clock, Pause, PlayCircle, PlusCircle, Radio, AlertTriangle
} from 'lucide-react';

export function HostView({ state, sendMessage, onExit }) {
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);

  const q = state?.current_question;
  const p1 = state?.players?.player1;
  const p2 = state?.players?.player2;
  const coupleScore = state?.couple_score ?? 0;
  const isMatch = state?.current_question_match;
  const qIndex = (state?.current_question_index ?? 0);
  const totalQ = state?.total_questions || 15;
  const screenMode = state?.screen_mode || 'QUESTION';
  const timer = state?.timer || { remaining: 60, active: false };
  const p1Online = p1?.connected;
  const p2Online = p2?.connected;
  const allConnected = p1Online && p2Online;

  // Navigation handlers
  const handleNext = () => sendMessage('NEXT_QUESTION');
  const handlePrev = () => sendMessage('PREV_QUESTION');
  const handleJump = (idx) => {
    sendMessage('JUMP_QUESTION', { index: idx });
    setShowQuestionSelector(false);
  };

  // Intro Countdown Handler
  const handleStartWithCountdown = () => {
    if (!allConnected) {
      if (!window.confirm("Uno o entrambi gli sposi non risultano ancora connessi allo smartphone. Vuoi avviare comunque il conto alla rovescia di test?")) {
        return;
      }
    }
    sendMessage('START_INTRO_COUNTDOWN', { seconds: 5 });
  };

  // Reveal handlers
  const handleRevealAll = () => sendMessage('REVEAL_ANSWERS', { target: 'all' });
  const handleRevealP1 = () => sendMessage('REVEAL_ANSWERS', { target: 'player1' });
  const handleRevealP2 = () => sendMessage('REVEAL_ANSWERS', { target: 'player2' });

  // COUPLE JUDGMENT HANDLERS (Cooperative 1 point per match)
  const handleJudgeMatch = () => {
    sendMessage('JUDGE_COUPLE', { match: true, points: 1 });
  };
  const handleJudgeMismatch = () => {
    sendMessage('JUDGE_COUPLE', { match: false, points: 0 });
  };

  // Timer controls
  const handleTimerToggle = () => {
    if (timer.active) {
      sendMessage('TIMER_CONTROL', { subAction: 'pause' });
    } else {
      sendMessage('TIMER_CONTROL', { subAction: 'resume' });
    }
  };
  const handleTimerAdd15 = () => sendMessage('TIMER_CONTROL', { subAction: 'add15' });
  const handleTimerReset = () => sendMessage('TIMER_CONTROL', { subAction: 'reset' });

  // Screen display modes
  const handleShowScoreboard = () => sendMessage('SHOW_SCOREBOARD');
  const handleShowRecap = () => sendMessage('SHOW_RECAP');
  const handleShowQuestion = () => sendMessage('SHOW_QUESTION');
  const handleShowFinal = () => sendMessage('SHOW_FINAL');
  const handleResetGame = () => {
    if (window.confirm("Vuoi davvero resettare la partita e azzerare il punteggio di coppia?")) {
      sendMessage('RESET_GAME');
    }
  };

  // Trigger sound on PC
  const handlePlaySound = (sound) => {
    sendMessage('PLAY_SOUND', { sound });
  };

  return (
    <div style={{
      maxWidth: '960px',
      margin: '0 auto',
      minHeight: '100vh',
      padding: '20px 16px',
      position: 'relative',
      zIndex: 1,
      overflowY: 'auto'
    }}>
      {/* Header Bar */}
      <header className="glass-panel" style={{
        padding: '16px 20px',
        marginBottom: '20px',
        borderLeft: '5px solid #a855f7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(168, 85, 247, 0.15)',
            border: '1px solid #a855f7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sliders size={20} color="#a855f7" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800 }}>REGIA • NOZZE D'ARGENTO</h1>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Stato Schermo PC: <strong style={{ color: 'var(--cyan-glow)' }}>{screenMode}</strong>
            </div>
          </div>
        </div>

        {/* Live Couple Score Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(245, 179, 35, 0.12)',
          border: '1px solid rgba(245, 179, 35, 0.35)',
          padding: '8px 16px',
          borderRadius: '12px'
        }}>
          <Heart size={20} color="var(--gold-primary)" fill="var(--gold-primary)" />
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--gold-glow)', textTransform: 'uppercase', fontWeight: 700 }}>
              PUNTEGGIO COPPIA
            </div>
            <div style={{ fontFamily: 'var(--font-tech)', fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
              {coupleScore} <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>/ {totalQ} PT</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowQuestionSelector(true)}
            className="btn-outline"
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
          >
            <ListOrdered size={16} /> Domande
          </button>
          <button
            onClick={handleResetGame}
            className="btn-outline"
            style={{ padding: '8px 14px', fontSize: '0.85rem', color: 'var(--crimson-accent)' }}
          >
            <RotateCcw size={16} /> Reset
          </button>
          <button
            onClick={onExit}
            className="btn-outline"
            style={{ padding: '8px 12px' }}
            title="Esci"
          >
            <X size={16} />
          </button>
        </div>
      </header>

      {/* Connection Status & Launch Bar (Visible when in LOBBY or before game) */}
      {(screenMode === 'LOBBY' || state?.phase === 'LOBBY') && (
        <div className="glass-panel animate-float" style={{
          padding: '20px 24px',
          marginBottom: '20px',
          border: '2px solid rgba(0, 210, 255, 0.4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '6px' }}>
              Stato Connessione Sposi:
            </h3>
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: p1Online ? 'var(--emerald-accent)' : 'var(--crimson-accent)', fontWeight: 600 }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: p1Online ? 'var(--emerald-accent)' : 'var(--crimson-accent)' }} />
                Antonio: {p1Online ? 'Connesso ✓' : 'In attesa'}
              </span>

              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: p2Online ? 'var(--emerald-accent)' : 'var(--crimson-accent)', fontWeight: 600 }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: p2Online ? 'var(--emerald-accent)' : 'var(--crimson-accent)' }} />
                Katia: {p2Online ? 'Connessa ✓' : 'In attesa'}
              </span>
            </div>
          </div>

          <button
            onClick={handleStartWithCountdown}
            className="btn-primary"
            style={{
              padding: '14px 28px',
              fontSize: '1.1rem',
              boxShadow: '0 4px 25px rgba(245, 179, 35, 0.5)'
            }}
          >
            <Radio size={20} color="#000" /> AVVIA QUIZ (CONTO ALLA ROVESCIA 5s)
          </button>
        </div>
      )}

      {/* Main Grid: Control Center */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        
        {/* CURRENT QUESTION CARD (WITH HOST CHEATSHEET & NOTES) */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge-gold">DOMANDA {qIndex + 1} DI {totalQ}</span>
              {q?.category && <span className="badge-cyan">{q.category}</span>}
            </div>

            {/* Quick Next/Prev controls */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handlePrev}
                disabled={qIndex === 0}
                className="btn-outline"
                style={{ padding: '8px 12px' }}
                title="Domanda Precedente"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={handleNext}
                className="btn-primary"
                style={{ padding: '8px 18px', fontSize: '0.9rem' }}
                title="Prosegui alla prossima domanda"
              >
                Prossima <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '16px', lineHeight: 1.4 }}>
            {q?.question || 'Nessuna domanda selezionata'}
          </h2>

          {/* Reference Answer Box (Host eyes only!) */}
          <div style={{
            background: 'rgba(245, 179, 35, 0.08)',
            border: '1px solid rgba(245, 179, 35, 0.3)',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <Sparkles size={20} color="var(--gold-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--gold-glow)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                Note per la Regia / Confronto Risposte:
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: '4px 0' }}>
                {q?.reference_answer}
              </div>
              {q?.notes && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Suggerimento: {q.notes}
                </div>
              )}
            </div>
          </div>

          {/* Question Timer Controller Widget */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0,0,0,0.3)',
            padding: '10px 16px',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.08)',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} color="var(--cyan-glow)" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Timer Risposta:</span>
              <strong style={{
                fontFamily: 'var(--font-tech)',
                fontSize: '1.25rem',
                color: timer.remaining <= 10 && timer.active ? 'var(--crimson-accent)' : '#fff'
              }}>
                {timer.remaining}s
              </strong>
              <span style={{ fontSize: '0.75rem', color: timer.active ? 'var(--emerald-accent)' : 'var(--text-dim)' }}>
                ({timer.active ? 'In corso' : 'In pausa'})
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleTimerToggle}
                className="btn-outline"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                {timer.active ? <><Pause size={13} /> Pausa</> : <><PlayCircle size={13} /> Avvia</>}
              </button>
              <button
                onClick={handleTimerAdd15}
                className="btn-outline"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                <PlusCircle size={13} /> +15s
              </button>
              <button
                onClick={handleTimerReset}
                className="btn-outline"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                <RotateCcw size={13} /> Reset
              </button>
            </div>
          </div>
        </div>

        {/* ANTONIO & KATIA ANSWERS COMPARISON BOX */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Risposte degli Sposi a Confronto
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleRevealAll}
                className="btn-cyan"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                <Eye size={16} /> Svela Entrambe sul PC
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            
            {/* ANTONIO'S ANSWER */}
            <div style={{
              background: 'rgba(0, 210, 255, 0.06)',
              border: '1px solid rgba(0, 210, 255, 0.25)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 800, color: 'var(--cyan-glow)', fontSize: '1.1rem' }}>
                  {p1?.name || 'Antonio'}
                </span>
                <span style={{ fontSize: '0.75rem', color: p1?.has_answered ? 'var(--emerald-accent)' : 'var(--text-dim)' }}>
                  {p1?.has_answered ? '✓ Ha inviato' : 'In attesa...'}
                </span>
              </div>
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '12px',
                borderRadius: '8px',
                minHeight: '60px',
                display: 'flex',
                alignItems: 'center'
              }}>
                {p1?.has_answered ? (
                  <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                    "{p1.current_answer}"
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                    Sta digitando sullo smartphone...
                  </span>
                )}
              </div>
              <div style={{ marginTop: '10px' }}>
                <button
                  onClick={handleRevealP1}
                  className="btn-outline"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '6px' }}
                >
                  <Eye size={14} /> Svela solo Antonio sul PC
                </button>
              </div>
            </div>

            {/* KATIA'S ANSWER */}
            <div style={{
              background: 'rgba(245, 179, 35, 0.06)',
              border: '1px solid rgba(245, 179, 35, 0.25)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 800, color: 'var(--gold-glow)', fontSize: '1.1rem' }}>
                  {p2?.name || 'Katia'}
                </span>
                <span style={{ fontSize: '0.75rem', color: p2?.has_answered ? 'var(--emerald-accent)' : 'var(--text-dim)' }}>
                  {p2?.has_answered ? '✓ Ha inviato' : 'In attesa...'}
                </span>
              </div>
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '12px',
                borderRadius: '8px',
                minHeight: '60px',
                display: 'flex',
                alignItems: 'center'
              }}>
                {p2?.has_answered ? (
                  <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                    "{p2.current_answer}"
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                    Sta digitando sullo smartphone...
                  </span>
                )}
              </div>
              <div style={{ marginTop: '10px' }}>
                <button
                  onClick={handleRevealP2}
                  className="btn-outline"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '6px' }}
                >
                  <Eye size={14} /> Svela solo Katia sul PC
                </button>
              </div>
            </div>

          </div>

          {/* VALUTAZIONE AFFINITÀ DI COPPIA (MATCH / NO-MATCH) */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.35)',
            border: isMatch === true ? '2px solid var(--emerald-accent)' : isMatch === false ? '2px solid var(--crimson-accent)' : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', fontWeight: 700 }}>
              Giudizio Regia: Le risposte di Antonio e Katia sono uguali?
            </div>

            {/* Status indicator */}
            {isMatch !== null && isMatch !== undefined && (
              <div style={{ marginBottom: '14px' }}>
                {isMatch ? (
                  <span className="badge-cyan" style={{ background: 'rgba(46, 213, 115, 0.2)', borderColor: 'var(--emerald-accent)', color: 'var(--emerald-accent)', fontSize: '0.95rem' }}>
                    <CheckCircle size={16} /> RISPOSTE COINCIDENTI (+1 PUNTO ASSEGNATO ALLA COPPIA)
                  </span>
                ) : (
                  <span style={{ color: 'var(--crimson-accent)', fontWeight: 700, fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <XCircle size={16} /> RISPOSTE DIFFERENTI (0 PUNTI ASSEGNATI)
                  </span>
                )}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              <button
                onClick={handleJudgeMatch}
                className="btn-success"
                style={{
                  padding: '16px 20px',
                  fontSize: '1.05rem',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(46, 213, 115, 0.4)'
                }}
              >
                <Heart size={20} fill="#fff" /> RISPOSTE UGUALI (+1 PUNTO COPPIA)
              </button>

              <button
                onClick={handleJudgeMismatch}
                className="btn-danger"
                style={{
                  padding: '16px 20px',
                  fontSize: '1.05rem',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                  borderColor: 'rgba(255,255,255,0.2)'
                }}
              >
                <XCircle size={20} /> Risposte Differenti (0 Pt)
              </button>
            </div>
          </div>
        </div>

        {/* PRIMARY TV DISPLAY ACTION CONTROLS */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>
            Controlli Schermo TV Studio (PC)
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <button
              onClick={handleRevealAll}
              className="btn-primary"
              style={{ padding: '14px 20px', fontSize: '0.95rem' }}
            >
              <Eye size={18} /> Svela Risposte sul PC
            </button>

            <button
              onClick={handleShowRecap}
              className="btn-cyan"
              style={{ padding: '14px 20px', fontSize: '0.95rem' }}
              title="Mostra la tabella con tutte le 15 risposte date da Antonio e Katia"
            >
              <Table size={18} /> Tabellone Tutte le Risposte
            </button>

            <button
              onClick={handleShowScoreboard}
              className="btn-outline"
              style={{ padding: '14px 20px', fontSize: '0.95rem' }}
            >
              <Award size={18} color="var(--gold-primary)" /> Termometro Affinità TV
            </button>

            <button
              onClick={handleShowQuestion}
              className="btn-outline"
              style={{ padding: '14px 20px', fontSize: '0.95rem' }}
            >
              <BookOpen size={18} color="var(--cyan-primary)" /> Torna alla Domanda TV
            </button>

            <button
              onClick={handleShowFinal}
              className="btn-outline"
              style={{ padding: '14px 20px', fontSize: '0.95rem', borderColor: 'var(--gold-primary)', color: 'var(--gold-glow)' }}
            >
              <Trophy size={18} /> Proclama Nozze d'Argento
            </button>
          </div>
        </div>

        {/* TV SOUND EFFECTS BOARD */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Volume2 size={18} color="var(--cyan-glow)" />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Soundboard Studio (Suoneranno sullo schermo PC)
            </h4>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button onClick={() => handlePlaySound('applause')} className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              👏 Applausi Studio
            </button>
            <button onClick={() => handlePlaySound('reveal')} className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              ⚡ Rivelazione Risposte
            </button>
            <button onClick={() => handlePlaySound('correct')} className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              🔔 Risposte Uguali!
            </button>
            <button onClick={() => handlePlaySound('wrong')} className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              ❌ Risposte Differenti
            </button>
            <button onClick={() => handlePlaySound('countdown_go')} className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              🚀 Riser Lancio "Via!"
            </button>
            <button onClick={() => handlePlaySound('winner')} className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              🎺 Fanfara Trionfale
            </button>
          </div>
        </div>

      </div>

      {/* QUESTION SELECTOR MODAL */}
      {showQuestionSelector && (
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
          <div className="glass-panel" style={{ maxWidth: '650px', width: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Seleziona Domanda (1 - 15)</h3>
              <button onClick={() => setShowQuestionSelector(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '8px' }}>
              {Array.from({ length: totalQ }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleJump(i)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: i === qIndex ? 'rgba(0, 210, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: i === qIndex ? '1px solid var(--cyan-primary)' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span style={{ fontWeight: 600 }}>Domanda #{i + 1}</span>
                  {i === qIndex && <span style={{ color: 'var(--cyan-glow)', fontSize: '0.8rem', fontWeight: 700 }}>In onda ora</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
