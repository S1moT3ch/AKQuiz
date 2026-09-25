import React, { useState, useRef, useCallback } from 'react';
import {
  Sliders, Play, ChevronRight, ChevronLeft, Eye, CheckCircle,
  XCircle, Award, Trophy, Volume2, RotateCcw, ListOrdered,
  BookOpen, Heart, X, Table, Clock, Pause, PlayCircle, PlusCircle, Radio, Flame, QrCode,
  Sparkles, Search, CheckCircle2, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, Tv,
  Sun, Moon, Film, Video, UploadCloud, VolumeX
} from 'lucide-react';

export function HostView({ state, sendMessage, onExit }) {
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);
  const [questionSearch, setQuestionSearch] = useState('');

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
  const showQr = state?.show_qr;
  const hasActiveQr = Boolean(showQr && showQr !== 'none');
  const recap = state?.recap || [];
  const allQuestions = state?.all_questions || state?.recap || [];

  const currentTheme = state?.theme || 'dark';

  const handleSetShowQr = (target) => {
    sendMessage('SET_SHOW_QR', { target });
  };

  const handleToggleTheme = () => {
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    sendMessage('SET_THEME', { theme: nextTheme });
  };

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
    sendMessage('JUDGE_COUPLE', { match: false, points: 1 });
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
  const handleShowProfiles = () => sendMessage('SHOW_PROFILES');
  const handleShowRecap = () => sendMessage('SHOW_RECAP');
  const handleShowQuestion = () => sendMessage('SHOW_QUESTION');
  const handleShowVideo = () => sendMessage('SHOW_VIDEO');
  const handleShowFinal = () => sendMessage('SHOW_FINAL');

  const handleVideoControl = (subAction) => sendMessage('VIDEO_CONTROL', { subAction });

  // Video Upload & Management
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef(null);

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    setUploadProgress(10);
    setUploadMessage('Caricamento video in corso...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const serverIp = state?.server_ip || window.location.hostname || 'localhost';
      const port = '8000';
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `http://${serverIp}:${port}/api/upload-video`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const pct = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(pct);
          setUploadMessage(`Caricamento: ${pct}%`);
        }
      };

      xhr.onload = () => {
        setUploadingVideo(false);
        if (xhr.status === 200) {
          setUploadMessage('✓ Video caricato con successo!');
          sendMessage('SHOW_VIDEO');
          setTimeout(() => setUploadMessage(''), 5000);
        } else {
          setUploadMessage('Errore nel caricamento del video.');
        }
      };

      xhr.onerror = () => {
        setUploadingVideo(false);
        setUploadMessage('Errore di connessione durante il caricamento.');
      };

      xhr.send(formData);
    } catch (err) {
      setUploadingVideo(false);
      setUploadMessage('Errore: ' + err.message);
    }
  };
  const handleResetGame = () => {
    if (window.confirm("Vuoi davvero resettare la partita e azzerare il punteggio di coppia?")) {
      sendMessage('RESET_GAME');
    }
  };

  // Trigger sound on PC
  const handlePlaySound = (sound) => {
    sendMessage('PLAY_SOUND', { sound });
  };

  // Touchpad and Remote TV Scroll Controls
  const [touchActive, setTouchActive] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [sliderVal, setSliderVal] = useState(0);
  const [activeTargetQ, setActiveTargetQ] = useState(null);
  const lastTouchYRef = useRef(null);
  const lastSendTimeRef = useRef(0);
  const touchpadRef = useRef(null);

  const handleTouchpadStart = (e) => {
    if (e.cancelable) e.preventDefault();
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    lastTouchYRef.current = clientY;
    setTouchActive(true);
  };

  const handleTouchpadMove = (e) => {
    if (lastTouchYRef.current === null) return;
    if (e.cancelable) e.preventDefault();
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const delta = lastTouchYRef.current - clientY;
    lastTouchYRef.current = clientY;

    const now = performance.now();
    if (now - lastSendTimeRef.current > 30) {
      lastSendTimeRef.current = now;
      sendMessage('SCREEN_SCROLL', { deltaY: delta * 2.2 });
    }
  };

  const handleTouchpadEnd = () => {
    lastTouchYRef.current = null;
    setTouchActive(false);
  };

  const handleScrollTop = () => {
    setSliderVal(0);
    sendMessage('SCREEN_SCROLL', { target: 'top' });
  };
  const handleScrollBottom = () => {
    setSliderVal(100);
    sendMessage('SCREEN_SCROLL', { target: 'bottom' });
  };
  const handleScrollUp = () => sendMessage('SCREEN_SCROLL', { target: 'up' });
  const handleScrollDown = () => sendMessage('SCREEN_SCROLL', { target: 'down' });
  const handleScrollQuestion = (idx) => {
    setActiveTargetQ(idx);
    const estPercent = Math.round((idx / Math.max(1, totalQ - 1)) * 100);
    setSliderVal(estPercent);
    sendMessage('SCREEN_SCROLL', { target: 'question', questionIndex: idx });
  };
  const handleScrollPercent = (pct) => {
    setSliderVal(pct);
    sendMessage('SCREEN_SCROLL', { target: 'percent', percent: pct });
  };
  const handleToggleAutoScroll = () => {
    const next = !isAutoScrolling;
    setIsAutoScrolling(next);
    sendMessage('SCREEN_SCROLL', { autoScroll: next, speed: 1.4 });
  };

  const isLobby = screenMode === 'LOBBY' || state?.phase === 'LOBBY';
  const isQuestionIntro = screenMode === 'QUESTION_INTRO' || state?.phase === 'QUESTION_INTRO';

  return (
    <div className="host-layout">
      {/* Top Header Bar */}
      <header className="glass-panel host-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            background: 'rgba(168, 85, 247, 0.15)',
            border: '1px solid #a855f7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Sliders size={18} color="#a855f7" />
          </div>
          <div>
            <h1 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
              REGIA • NOZZE D'ARGENTO
            </h1>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Stato Schermo PC: <strong style={{ color: 'var(--cyan-glow)' }}>{screenMode}</strong>
            </div>
          </div>
        </div>

        {/* Live Couple Score Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(245, 179, 35, 0.12)',
          border: '1px solid rgba(245, 179, 35, 0.35)',
          padding: '4px 12px',
          borderRadius: '10px'
        }}>
          <Heart size={16} color="var(--gold-primary)" fill="var(--gold-primary)" />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--gold-glow)', textTransform: 'uppercase', fontWeight: 700 }}>
              COPPIA:
            </span>
            <span style={{ fontFamily: 'var(--font-tech)', fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
              {coupleScore} <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>/ {totalQ} PT</span>
            </span>
          </div>
        </div>

        {/* Top Control Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => handleSetShowQr(hasActiveQr ? 'none' : 'all')}
            className="btn-outline host-btn-sm"
            style={{
              background: hasActiveQr ? 'rgba(0, 210, 255, 0.2)' : 'transparent',
              borderColor: hasActiveQr ? 'var(--cyan-glow)' : 'rgba(255,255,255,0.15)',
              color: hasActiveQr ? 'var(--cyan-glow)' : 'var(--text-main)',
              fontWeight: 700
            }}
            title="Mostra / Nascondi QR Code su schermo TV"
          >
            <QrCode size={14} /> {hasActiveQr ? (showQr === 'player1' ? 'QR: Antonio' : showQr === 'player2' ? 'QR: Katia' : 'QR TV: On') : 'QR TV'}
          </button>
          <button
            onClick={handleShowRecap}
            className="btn-outline host-btn-sm"
            style={{
              background: screenMode === 'RECAP' ? 'rgba(0, 210, 255, 0.22)' : 'transparent',
              borderColor: screenMode === 'RECAP' ? 'var(--cyan-glow)' : 'rgba(255,255,255,0.15)',
              color: screenMode === 'RECAP' ? 'var(--cyan-glow)' : 'var(--text-main)',
              fontWeight: 700
            }}
            title="Mostra e controlla il Tabellone su TV"
          >
            <Table size={14} /> Tabellone
          </button>
          <button
            onClick={handleShowVideo}
            className="btn-outline host-btn-sm"
            style={{
              background: screenMode === 'VIDEO' ? 'rgba(245, 179, 35, 0.22)' : 'transparent',
              borderColor: screenMode === 'VIDEO' ? 'var(--gold-primary)' : 'rgba(255,255,255,0.15)',
              color: screenMode === 'VIDEO' ? 'var(--gold-glow)' : 'var(--text-main)',
              fontWeight: 700
            }}
            title="Mostra e controlla la sezione Video a schermo intero su TV"
          >
            <Film size={14} color={screenMode === 'VIDEO' ? 'var(--gold-primary)' : undefined} /> Video TV
          </button>
          <button
            onClick={() => setShowQuestionSelector(true)}
            className="btn-outline host-btn-sm"
          >
            <ListOrdered size={14} /> Domande
          </button>
          <button
            onClick={handleToggleTheme}
            className="btn-outline host-btn-sm"
            style={{
              background: currentTheme === 'light' ? 'rgba(245, 179, 35, 0.2)' : 'rgba(255, 255, 255, 0.06)',
              borderColor: currentTheme === 'light' ? 'var(--gold-primary)' : 'rgba(255, 255, 255, 0.2)',
              color: currentTheme === 'light' ? '#b45309' : 'var(--text-main)',
              fontWeight: 700
            }}
            title={currentTheme === 'dark' ? 'Passa al tema Chiaro su tutti i dispositivi' : 'Passa al tema Scuro su tutti i dispositivi'}
          >
            {currentTheme === 'dark' ? (
              <>
                <Sun size={14} color="#f5b323" /> Tema Chiaro
              </>
            ) : (
              <>
                <Moon size={14} color="#3b82f6" /> Tema Scuro
              </>
            )}
          </button>
          <button
            onClick={handleResetGame}
            className="btn-outline host-btn-sm"
            style={{ color: 'var(--crimson-accent)' }}
          >
            <RotateCcw size={14} /> Reset
          </button>
          <button
            onClick={onExit}
            className="btn-outline host-btn-sm"
            style={{ padding: '6px 10px' }}
            title="Esci alla Lobby"
          >
            <X size={14} />
          </button>
        </div>
      </header>

      {/* LOBBY VIEW (Fits 100% on tablet screen without scrolling) */}
      {isLobby ? (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '14px',
          minHeight: 0
        }}>
          <div className="glass-panel" style={{
            padding: '24px 32px',
            border: '2px solid rgba(0, 210, 255, 0.4)',
            textAlign: 'center',
            boxShadow: '0 10px 40px rgba(0, 210, 255, 0.15)'
          }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>
              PREPARAZIONE ALLA DIRETTA
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '20px' }}>
              Verifica che Antonio e Katia siano connessi con i propri smartphone, poi avvia la trasmissione.
            </p>

            {/* Connection Status Boxes */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '24px',
              marginBottom: '24px',
              flexWrap: 'wrap'
            }}>
              <div style={{
                background: p1Online ? 'rgba(46, 213, 115, 0.1)' : 'rgba(255, 71, 87, 0.1)',
                border: `1px solid ${p1Online ? 'var(--emerald-accent)' : 'var(--crimson-accent)'}`,
                borderRadius: '12px',
                padding: '12px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: p1Online ? 'var(--emerald-accent)' : 'var(--crimson-accent)',
                  boxShadow: p1Online ? '0 0 10px var(--emerald-accent)' : 'none'
                }} />
                <span style={{ fontWeight: 700, fontSize: '1rem', color: p1Online ? '#fff' : 'var(--text-muted)' }}>
                  Antonio: {p1Online ? 'Connesso ✓' : 'In attesa...'}
                </span>
              </div>

              <div style={{
                background: p2Online ? 'rgba(46, 213, 115, 0.1)' : 'rgba(255, 71, 87, 0.1)',
                border: `1px solid ${p2Online ? 'var(--emerald-accent)' : 'var(--crimson-accent)'}`,
                borderRadius: '12px',
                padding: '12px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: p2Online ? 'var(--emerald-accent)' : 'var(--crimson-accent)',
                  boxShadow: p2Online ? '0 0 10px var(--emerald-accent)' : 'none'
                }} />
                <span style={{ fontWeight: 700, fontSize: '1rem', color: p2Online ? '#fff' : 'var(--text-muted)' }}>
                  Katia: {p2Online ? 'Connessa ✓' : 'In attesa...'}
                </span>
              </div>
            </div>

            {/* Regia QR Code TV Broadcast Selector */}
            <div style={{
              background: 'rgba(10, 15, 35, 0.75)',
              border: '1px solid rgba(0, 210, 255, 0.3)',
              borderRadius: '14px',
              padding: '12px 18px',
              marginBottom: '20px',
              maxWidth: '680px',
              margin: '0 auto 20px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <QrCode size={17} color="var(--cyan-glow)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    Mostra QR Code su Schermo TV
                  </span>
                </div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '2px 9px',
                  borderRadius: '20px',
                  background: hasActiveQr ? 'rgba(0, 210, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                  color: hasActiveQr ? 'var(--cyan-glow)' : 'var(--text-dim)',
                  border: `1px solid ${hasActiveQr ? 'rgba(0, 210, 255, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`
                }}>
                  {showQr === 'all' ? 'VISIBILI: TUTTI E DUE' :
                    showQr === 'player1' ? 'VISIBILE: SOLO ANTONIO' :
                      showQr === 'player2' ? 'VISIBILE: SOLO KATIA' : 'NON VISIBILI'}
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px'
              }}>
                <button
                  type="button"
                  onClick={() => handleSetShowQr(showQr === 'all' ? 'none' : 'all')}
                  className="btn-outline"
                  style={{
                    padding: '8px 10px',
                    fontSize: '0.82rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    background: showQr === 'all' ? 'rgba(0, 210, 255, 0.28)' : 'rgba(255, 255, 255, 0.04)',
                    borderColor: showQr === 'all' ? 'var(--cyan-glow)' : 'rgba(255, 255, 255, 0.15)',
                    color: showQr === 'all' ? '#fff' : 'var(--text-muted)'
                  }}
                  title="Mostra i QR di entrambi gli sposi sulla TV"
                >
                  <QrCode size={14} /> Entrambi
                </button>

                <button
                  type="button"
                  onClick={() => handleSetShowQr(showQr === 'player1' ? 'none' : 'player1')}
                  className="btn-outline"
                  style={{
                    padding: '8px 10px',
                    fontSize: '0.82rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    background: showQr === 'player1' ? 'rgba(0, 210, 255, 0.28)' : 'rgba(255, 255, 255, 0.04)',
                    borderColor: showQr === 'player1' ? 'var(--cyan-glow)' : 'rgba(255, 255, 255, 0.15)',
                    color: showQr === 'player1' ? '#fff' : 'var(--text-muted)'
                  }}
                  title="Mostra solo il QR di Antonio"
                >
                  🤵 Solo Antonio
                </button>

                <button
                  type="button"
                  onClick={() => handleSetShowQr(showQr === 'player2' ? 'none' : 'player2')}
                  className="btn-outline"
                  style={{
                    padding: '8px 10px',
                    fontSize: '0.82rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    background: showQr === 'player2' ? 'rgba(245, 179, 35, 0.28)' : 'rgba(255, 255, 255, 0.04)',
                    borderColor: showQr === 'player2' ? 'var(--gold-glow)' : 'rgba(255, 255, 255, 0.15)',
                    color: showQr === 'player2' ? '#fff' : 'var(--text-muted)'
                  }}
                  title="Mostra solo il QR di Katia"
                >
                  👰 Solo Katia
                </button>

                <button
                  type="button"
                  onClick={() => handleSetShowQr('none')}
                  className="btn-outline"
                  style={{
                    padding: '8px 10px',
                    fontSize: '0.82rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    background: !hasActiveQr ? 'rgba(255, 71, 87, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    borderColor: !hasActiveQr ? 'var(--crimson-accent)' : 'rgba(255, 255, 255, 0.15)',
                    color: !hasActiveQr ? 'var(--crimson-accent)' : 'var(--text-muted)'
                  }}
                  title="Nascondi i codici QR dallo schermo TV"
                >
                  <X size={14} /> Nascondi
                </button>
              </div>
            </div>

            {/* Launch Button */}
            <button
              onClick={handleStartWithCountdown}
              className="btn-primary"
              style={{
                padding: '16px 36px',
                fontSize: '1.2rem',
                borderRadius: '14px',
                boxShadow: '0 6px 35px rgba(245, 179, 35, 0.55)',
                cursor: 'pointer'
              }}
            >
              <Radio size={22} color="#000" /> AVVIA QUIZ (CONTO ALLA ROVESCIA 5s)
            </button>
          </div>

          {/* Soundboard Bar in Lobby */}
          <div className="glass-card" style={{ padding: '12px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Volume2 size={16} color="var(--cyan-glow)" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Test Audio Studio PC
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button onClick={() => handlePlaySound('applause')} className="btn-outline host-sound-btn">👏 Applausi</button>
              <button onClick={() => handlePlaySound('reveal')} className="btn-outline host-sound-btn">⚡ Svela</button>
              <button onClick={() => handlePlaySound('correct')} className="btn-outline host-sound-btn">🔔 Uguali</button>
              <button onClick={() => handlePlaySound('wrong')} className="btn-outline host-sound-btn">❌ Differenti</button>
              <button onClick={() => handlePlaySound('countdown_go')} className="btn-outline host-sound-btn">🚀 Riser</button>
              <button onClick={() => handlePlaySound('winner')} className="btn-outline host-sound-btn">🎺 Fanfara</button>
            </div>
          </div>
        </div>
      ) : (
        /* IN-GAME 2-COLUMN TABLET CONSOLE LAYOUT (FITS 100% IN 1 SCREEN) */
        <div className="host-grid">

          {/* ================= LEFT COLUMN: QUESTION, CONSENSO, TV CONTROLS, AUDIO ================= */}
          <div className="host-col">

            {/* Card 1: Domanda & Consenso & Timer */}
            <div className="glass-panel host-card" style={{ flex: isQuestionIntro ? '1.2' : '1', minHeight: 0 }}>
              {screenMode === 'RECAP' ? (
                <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge-gold" style={{ fontSize: '0.75rem', padding: '3px 10px' }}>
                      TABELLONE: 15 RISPOSTE A CONFRONTO
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--cyan-glow)' }}>
                      Affinità: {coupleScore}/{totalQ} ({totalQ > 0 ? Math.round((coupleScore / totalQ) * 100) : 0}%)
                    </span>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '4px', minHeight: '120px' }}>
                    {(state?.recap || []).map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: activeTargetQ === idx ? 'rgba(0, 210, 255, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                          border: activeTargetQ === idx ? '1px solid var(--cyan-glow)' : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '8px',
                          padding: '6px 8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            #{idx + 1}. {item.question}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
                            <span><strong style={{ color: 'var(--cyan-glow)' }}>A:</strong> {item.p1_answer || '—'}</span>
                            <span><strong style={{ color: 'var(--gold-glow)' }}>K:</strong> {item.p2_answer || '—'}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {item.is_match === true && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--emerald-accent)', fontWeight: 800 }}>✓ Uguali</span>
                          )}
                          {item.is_match === false && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--crimson-accent)', fontWeight: 800 }}>✗ Diff.</span>
                          )}
                          <button
                            onClick={() => handleScrollQuestion(idx)}
                            className="btn-outline host-btn-sm"
                            style={{ padding: '3px 8px', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '3px' }}
                            title="Centra ed evidenzia questa domanda sulla TV"
                          >
                            <Tv size={11} /> Centra TV
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {/* Question Navigation Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span className="badge-gold" style={{ fontSize: '0.75rem', padding: '3px 10px' }}>
                      DOMANDA {qIndex + 1} DI {totalQ}
                    </span>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={handlePrev}
                        disabled={qIndex === 0}
                        className="btn-outline host-btn-sm"
                        title="Domanda Precedente"
                      >
                        <ChevronLeft size={15} /> Prev
                      </button>
                      <button
                        onClick={handleNext}
                        disabled={qIndex >= totalQ - 1}
                        className="btn-primary host-btn-sm"
                        style={{
                          opacity: qIndex >= totalQ - 1 ? 0.35 : 1,
                          cursor: qIndex >= totalQ - 1 ? 'not-allowed' : 'pointer'
                        }}
                        title={qIndex >= totalQ - 1 ? "15ª domanda raggiunta (ultima)" : "Prossima domanda"}
                      >
                        Next <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div style={{
                    flex: 1,
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    overflowY: 'auto',
                    margin: '4px 0 8px 0'
                  }}>
                    <h2 style={{
                      fontSize: 'clamp(0.95rem, 1.8vh, 1.15rem)',
                      fontWeight: 700,
                      lineHeight: 1.35,
                      margin: 0,
                      color: '#fff'
                    }}>
                      {q?.question || 'Nessuna domanda selezionata'}
                    </h2>
                  </div>

                  {/* CONSENSO REGIA: Manda in onda la domanda agli sposi */}
                  {isQuestionIntro && (
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(46, 213, 115, 0.2), rgba(0, 210, 255, 0.2))',
                      border: '2px solid var(--emerald-accent)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      marginBottom: '8px',
                      textAlign: 'center',
                      boxShadow: '0 0 20px rgba(46, 213, 115, 0.25)'
                    }}>
                      <div style={{
                        color: 'var(--emerald-accent)',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        marginBottom: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}>
                        <Play size={14} fill="var(--emerald-accent)" /> DOMANDA PRONTA • DAI IL CONSENSO
                      </div>
                      <button
                        onClick={() => sendMessage('START_QUESTION')}
                        className="btn-primary"
                        style={{
                          background: 'linear-gradient(135deg, #2ed573, #10b981)',
                          color: '#000',
                          fontWeight: 900,
                          fontSize: '0.98rem',
                          padding: '10px 20px',
                          width: '100%',
                          borderRadius: '8px',
                          boxShadow: '0 4px 18px rgba(46, 213, 115, 0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        <Play size={18} fill="#000" /> MANDA IN ONDA LA DOMANDA AGLI SPOSI
                      </button>
                    </div>
                  )}

                  {/* Timer Bar */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    background: 'rgba(0,0,0,0.35)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: timer.remaining <= 10 && timer.active ? '1px solid var(--crimson-accent)' : '1px solid rgba(255,255,255,0.08)'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {timer.remaining <= 10 && timer.active ? <Flame size={15} color="var(--crimson-accent)" /> : <Clock size={15} color="var(--cyan-glow)" />}
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Timer:</span>
                        <strong style={{
                          fontFamily: 'var(--font-tech)',
                          fontSize: '1.25rem',
                          color: timer.remaining <= 10 && timer.active ? 'var(--crimson-accent)' : '#fff'
                        }}>
                          {timer.remaining}s
                        </strong>
                        <span style={{ fontSize: '0.72rem', color: timer.active ? 'var(--emerald-accent)' : 'var(--text-dim)' }}>
                          ({timer.active ? 'In corso' : 'Pausa'})
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={handleTimerToggle} className="btn-outline host-btn-sm">
                          {timer.active ? <><Pause size={12} /> Pausa</> : <><PlayCircle size={12} /> Avvia</>}
                        </button>
                        <button onClick={handleTimerAdd15} className="btn-outline host-btn-sm">
                          <PlusCircle size={12} /> +15s
                        </button>
                        <button onClick={handleTimerReset} className="btn-outline host-btn-sm">
                          <RotateCcw size={12} /> Reset
                        </button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{
                      width: '100%',
                      height: '4px',
                      background: 'rgba(0,0,0,0.5)',
                      borderRadius: '999px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.max(0, Math.min(100, ((timer.remaining ?? 60) / (timer.duration || 60)) * 100))}%`,
                        background: timer.remaining <= 10 && timer.active
                          ? 'linear-gradient(90deg, #ff4757, #ff6b81)'
                          : timer.remaining <= 25 && timer.active
                            ? 'linear-gradient(90deg, #f5a623, #ffd05b)'
                            : 'linear-gradient(90deg, #00d2ff, #2ed573)',
                        borderRadius: '999px',
                        transition: 'width 1s linear'
                      }} />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Card 2: Controlli Schermo TV & Soundboard */}
            <div className="glass-panel host-card" style={{ flex: isQuestionIntro ? '0.9' : '1', minHeight: 0 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                CONTROLLI SCHERMO TV STUDIO (PC)
              </div>

              {/* In-Game QR TV Quick Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 8px',
                background: hasActiveQr ? 'rgba(0, 210, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${hasActiveQr ? 'rgba(0, 210, 255, 0.35)' : 'rgba(255, 255, 255, 0.08)'}`,
                borderRadius: '8px',
                marginBottom: '8px',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: hasActiveQr ? 'var(--cyan-glow)' : 'var(--text-muted)' }}>
                  <QrCode size={13} />
                  <span>QR TV:</span>
                  <strong style={{ color: hasActiveQr ? '#fff' : 'var(--text-dim)' }}>
                    {showQr === 'all' ? 'Entrambi' : showQr === 'player1' ? 'Antonio' : showQr === 'player2' ? 'Katia' : 'Off'}
                  </strong>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => handleSetShowQr(showQr === 'all' ? 'none' : 'all')}
                    className="btn-outline host-btn-sm"
                    style={{
                      padding: '2px 6px',
                      fontSize: '0.68rem',
                      background: showQr === 'all' ? 'rgba(0, 210, 255, 0.3)' : 'transparent',
                      color: showQr === 'all' ? '#fff' : 'var(--text-muted)'
                    }}
                    title="Mostra QR di entrambi su TV"
                  >
                    Tutti
                  </button>
                  <button
                    onClick={() => handleSetShowQr(showQr === 'player1' ? 'none' : 'player1')}
                    className="btn-outline host-btn-sm"
                    style={{
                      padding: '2px 6px',
                      fontSize: '0.68rem',
                      background: showQr === 'player1' ? 'rgba(0, 210, 255, 0.3)' : 'transparent',
                      color: showQr === 'player1' ? '#fff' : 'var(--text-muted)'
                    }}
                    title="Mostra solo QR Antonio"
                  >
                    Antonio
                  </button>
                  <button
                    onClick={() => handleSetShowQr(showQr === 'player2' ? 'none' : 'player2')}
                    className="btn-outline host-btn-sm"
                    style={{
                      padding: '2px 6px',
                      fontSize: '0.68rem',
                      background: showQr === 'player2' ? 'rgba(245, 179, 35, 0.3)' : 'transparent',
                      color: showQr === 'player2' ? '#fff' : 'var(--text-muted)'
                    }}
                    title="Mostra solo QR Katia"
                  >
                    Katia
                  </button>
                  {hasActiveQr && (
                    <button
                      onClick={() => handleSetShowQr('none')}
                      className="btn-outline host-btn-sm"
                      style={{ padding: '2px 5px', fontSize: '0.68rem', color: 'var(--crimson-accent)' }}
                      title="Nascondi QR dalla TV"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
              </div>

              {/* TV Screen Action Buttons */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '6px',
                marginBottom: '10px'
              }}>
                <button
                  onClick={handleRevealAll}
                  className="btn-cyan host-btn-sm"
                  style={{ justifyContent: 'center' }}
                >
                  <Eye size={14} /> Svela Risposte
                </button>

                <button
                  onClick={handleShowProfiles}
                  className="btn-outline host-btn-sm"
                  style={{
                    justifyContent: 'center',
                    borderColor: screenMode === 'PROFILES' ? 'var(--gold-glow)' : 'rgba(255,255,255,0.15)',
                    background: screenMode === 'PROFILES' ? 'rgba(245, 179, 35, 0.2)' : 'transparent',
                    color: screenMode === 'PROFILES' ? 'var(--gold-glow)' : 'var(--text-main)',
                    fontWeight: screenMode === 'PROFILES' ? 800 : 600
                  }}
                  title="Mostra la card dei 5 Profili di Livello di Affinità su TV"
                >
                  <Sparkles size={14} color="var(--gold-primary)" /> Profili Affinità
                </button>

                <button
                  onClick={handleShowScoreboard}
                  className="btn-outline host-btn-sm"
                  style={{
                    justifyContent: 'center',
                    borderColor: screenMode === 'SCOREBOARD' ? 'var(--gold-glow)' : 'rgba(255,255,255,0.15)',
                    background: screenMode === 'SCOREBOARD' ? 'rgba(245, 179, 35, 0.2)' : 'transparent',
                    color: screenMode === 'SCOREBOARD' ? 'var(--gold-glow)' : 'var(--text-main)'
                  }}
                >
                  <Award size={14} color="var(--gold-primary)" /> Termometro
                </button>

                <button
                  onClick={handleShowQuestion}
                  className="btn-outline host-btn-sm"
                  style={{
                    justifyContent: 'center',
                    borderColor: (screenMode === 'QUESTION' || screenMode === 'ANSWERS') ? 'var(--cyan-primary)' : 'rgba(255,255,255,0.15)',
                    background: (screenMode === 'QUESTION' || screenMode === 'ANSWERS') ? 'rgba(0, 210, 255, 0.2)' : 'transparent',
                    color: (screenMode === 'QUESTION' || screenMode === 'ANSWERS') ? 'var(--cyan-glow)' : 'var(--text-main)'
                  }}
                >
                  <BookOpen size={14} color="var(--cyan-primary)" /> Domanda TV
                </button>

                <button
                  onClick={handleShowRecap}
                  className="btn-outline host-btn-sm"
                  style={{
                    justifyContent: 'center',
                    borderColor: screenMode === 'RECAP' ? 'var(--cyan-primary)' : 'rgba(255,255,255,0.15)',
                    background: screenMode === 'RECAP' ? 'rgba(0, 210, 255, 0.2)' : 'transparent',
                    color: screenMode === 'RECAP' ? 'var(--cyan-glow)' : 'var(--text-main)'
                  }}
                  title="Tabellone con tutte le 15 risposte"
                >
                  <Table size={14} /> Tabellone
                </button>

                <button
                  onClick={handleShowVideo}
                  className="btn-outline host-btn-sm"
                  style={{
                    justifyContent: 'center',
                    borderColor: screenMode === 'VIDEO' ? 'var(--gold-primary)' : 'rgba(255,255,255,0.15)',
                    background: screenMode === 'VIDEO' ? 'rgba(245, 179, 35, 0.2)' : 'transparent',
                    color: screenMode === 'VIDEO' ? 'var(--gold-glow)' : 'var(--text-main)',
                    fontWeight: screenMode === 'VIDEO' ? 800 : 600
                  }}
                  title="Proietta il video a tutto schermo sulla TV"
                >
                  <Film size={14} color="var(--gold-primary)" /> Video TV
                </button>

                <button
                  onClick={handleShowFinal}
                  className="btn-outline host-btn-sm"
                  style={{
                    gridColumn: 'span 3',
                    justifyContent: 'center',
                    borderColor: 'var(--gold-primary)',
                    color: 'var(--gold-glow)'
                  }}
                >
                  <Trophy size={14} /> Proclama Nozze d'Argento
                </button>
              </div>

              {/* Quick Soundboard */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '6px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Volume2 size={13} color="var(--cyan-glow)" /> Soundboard Effetti PC
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  <button onClick={() => handlePlaySound('applause')} className="btn-outline host-sound-btn">👏 Applausi</button>
                  <button onClick={() => handlePlaySound('reveal')} className="btn-outline host-sound-btn">⚡ Svela</button>
                  <button onClick={() => handlePlaySound('correct')} className="btn-outline host-sound-btn">🔔 Uguali</button>
                  <button onClick={() => handlePlaySound('wrong')} className="btn-outline host-sound-btn">❌ Differenti</button>
                  <button onClick={() => handlePlaySound('countdown_go')} className="btn-outline host-sound-btn">🚀 Riser</button>
                  <button onClick={() => handlePlaySound('winner')} className="btn-outline host-sound-btn">🎺 Fanfara</button>
                </div>
              </div>
            </div>

          </div>

          {/* ================= RIGHT COLUMN: LIVE ANSWERS & JUDGMENT OR RECAP CONTROLLER ================= */}
          <div className="host-col">
            {screenMode === 'RECAP' ? (
              <div className="glass-panel host-card" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Header with TV in Onda badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(0, 210, 255, 0.18)',
                    border: '1px solid var(--cyan-glow)',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: 'var(--cyan-glow)'
                  }}>
                    <Radio size={13} style={{ animation: 'pulseGlow 1s infinite alternate' }} />
                    TELECOMANDO SCORRIMENTO TV
                  </div>
                  <button
                    onClick={handleShowQuestion}
                    className="btn-outline host-btn-sm"
                    style={{ fontSize: '0.72rem', padding: '3px 10px' }}
                  >
                    <BookOpen size={13} /> Torna a Domanda
                  </button>
                </div>

                {/* 1. VIRTUAL TOUCHPAD (Optimized for Touchscreen Tablet Swiping) */}
                <div
                  ref={touchpadRef}
                  className="host-touchpad"
                  onTouchStart={handleTouchpadStart}
                  onTouchMove={handleTouchpadMove}
                  onTouchEnd={handleTouchpadEnd}
                  onTouchCancel={handleTouchpadEnd}
                  onMouseDown={handleTouchpadStart}
                  onMouseMove={handleTouchpadMove}
                  onMouseUp={handleTouchpadEnd}
                  onMouseLeave={handleTouchpadEnd}
                  style={{
                    flex: '1.4',
                    minHeight: '135px',
                    borderRadius: '14px',
                    background: touchActive
                      ? 'radial-gradient(circle at center, rgba(0, 210, 255, 0.25) 0%, rgba(8, 14, 38, 0.98) 100%)'
                      : 'linear-gradient(145deg, rgba(12, 18, 44, 0.95), rgba(6, 10, 28, 0.98))',
                    border: touchActive ? '2px solid var(--cyan-glow)' : '2px dashed rgba(0, 210, 255, 0.45)',
                    boxShadow: touchActive ? '0 0 35px rgba(0, 210, 255, 0.4)' : 'inset 0 2px 10px rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    cursor: 'ns-resize',
                    touchAction: 'none',
                    userSelect: 'none',
                    position: 'relative',
                    transition: 'border 0.2s ease, box-shadow 0.2s ease'
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: touchActive ? 'rgba(0, 210, 255, 0.35)' : 'rgba(255, 255, 255, 0.06)',
                    border: `1px solid ${touchActive ? 'var(--cyan-glow)' : 'rgba(255, 255, 255, 0.15)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    transform: touchActive ? 'scale(1.2)' : 'scale(1)'
                  }}>
                    <Tv size={24} color={touchActive ? 'var(--cyan-glow)' : '#8899aa'} />
                  </div>
                  <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: touchActive ? 'var(--cyan-glow)' : '#fff', letterSpacing: '0.5px' }}>
                      {touchActive ? 'SCORRIMENTO IN CORSO SULLA TV...' : '👆 TRASCINA IL DITO QUI'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Touchpad virtuale per tablet • Trascina verso l'alto o verso il basso
                    </div>
                  </div>
                </div>

                {/* 2. QUICK TOUCH BUTTONS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                  <button
                    onClick={handleScrollTop}
                    className="btn-outline host-btn-sm"
                    style={{ justifyContent: 'center', padding: '8px 2px', fontSize: '0.75rem', fontWeight: 700 }}
                    title="Vai in cima al tabellone"
                  >
                    <ChevronsUp size={15} /> Inizio
                  </button>
                  <button
                    onClick={handleScrollUp}
                    className="btn-outline host-btn-sm"
                    style={{ justifyContent: 'center', padding: '8px 2px', fontSize: '0.75rem', fontWeight: 700 }}
                    title="Scorri su"
                  >
                    <ChevronUp size={16} /> Su
                  </button>
                  <button
                    onClick={handleScrollDown}
                    className="btn-outline host-btn-sm"
                    style={{ justifyContent: 'center', padding: '8px 2px', fontSize: '0.75rem', fontWeight: 700 }}
                    title="Scorri giù"
                  >
                    <ChevronDown size={16} /> Giù
                  </button>
                  <button
                    onClick={handleScrollBottom}
                    className="btn-outline host-btn-sm"
                    style={{ justifyContent: 'center', padding: '8px 2px', fontSize: '0.75rem', fontWeight: 700 }}
                    title="Vai in fondo al tabellone"
                  >
                    <ChevronsDown size={15} /> Fondo
                  </button>
                  <button
                    onClick={handleToggleAutoScroll}
                    className={isAutoScrolling ? "btn-primary host-btn-sm" : "btn-outline host-btn-sm"}
                    style={{
                      justifyContent: 'center',
                      padding: '8px 2px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      borderColor: isAutoScrolling ? 'var(--gold-glow)' : 'rgba(255,255,255,0.15)',
                      color: isAutoScrolling ? '#000' : 'var(--gold-glow)',
                      boxShadow: isAutoScrolling ? '0 0 15px rgba(245, 179, 35, 0.6)' : 'none'
                    }}
                    title={isAutoScrolling ? "Ferma scorrimento automatico" : "Avvia scorrimento lento automatico"}
                  >
                    {isAutoScrolling ? <Pause size={14} /> : <Play size={14} />} {isAutoScrolling ? 'Stop' : 'Auto'}
                  </button>
                </div>

                {/* 3. RANGE SCRUBBER SLIDER */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Barra Scorrimento Continuo
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--cyan-glow)' }}>
                      {sliderVal}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderVal}
                    onChange={(e) => handleScrollPercent(Number(e.target.value))}
                    style={{
                      width: '100%',
                      accentColor: 'var(--cyan-glow)',
                      cursor: 'pointer',
                      height: '8px'
                    }}
                  />
                </div>

                {/* 4. RAPID JUMP GRID (DOMANDE 1 .. 15) */}
                <div style={{ flex: '1', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                    Salto Rapido a Domanda Specifica (Centra su TV):
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '5px',
                    overflowY: 'auto'
                  }}>
                    {Array.from({ length: totalQ }).map((_, idx) => {
                      const itemRecap = (state?.recap || [])[idx];
                      const isMatchQ = itemRecap?.is_match;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleScrollQuestion(idx)}
                          className="btn-outline"
                          style={{
                            padding: '6px 2px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '3px',
                            background: activeTargetQ === idx
                              ? 'rgba(0, 210, 255, 0.3)'
                              : isMatchQ === true
                                ? 'rgba(46, 213, 115, 0.12)'
                                : isMatchQ === false
                                  ? 'rgba(255, 71, 87, 0.12)'
                                  : 'rgba(255, 255, 255, 0.04)',
                            borderColor: activeTargetQ === idx
                              ? 'var(--cyan-glow)'
                              : isMatchQ === true
                                ? 'var(--emerald-accent)'
                                : isMatchQ === false
                                  ? 'var(--crimson-accent)'
                                  : 'rgba(255, 255, 255, 0.15)',
                            color: isMatchQ === true
                              ? 'var(--emerald-accent)'
                              : isMatchQ === false
                                ? 'var(--crimson-accent)'
                                : '#fff'
                          }}
                          title={`Centra Domanda #${idx + 1} sulla TV`}
                        >
                          #{idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            ) : screenMode === 'VIDEO' ? (
              <div className="glass-panel host-card" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
                {/* Header with TV in Onda badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(245, 179, 35, 0.18)',
                    border: '1px solid var(--gold-primary)',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    color: 'var(--gold-glow)'
                  }}>
                    <Film size={14} />
                    PROIEZIONE VIDEO IN ONDA SU TV
                  </div>
                  <button
                    onClick={handleShowQuestion}
                    className="btn-outline host-btn-sm"
                    style={{ fontSize: '0.75rem', padding: '4px 12px' }}
                  >
                    <BookOpen size={13} /> Torna a Domanda
                  </button>
                </div>

                {/* Status Card & Video Playback Controls */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Stato Riproduzione TV
                    </div>
                    <div style={{ fontSize: '0.98rem', fontWeight: 800, color: state?.video_state?.is_playing !== false ? 'var(--emerald-accent)' : 'var(--gold-glow)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: state?.video_state?.is_playing !== false ? 'var(--emerald-accent)' : 'var(--gold-glow)' }} />
                      {state?.video_state?.is_playing !== false ? 'In Riproduzione su TV' : 'In Pausa'}
                      {state?.video_state?.muted && <span style={{ fontSize: '0.75rem', color: 'var(--crimson-accent)' }}>(Muto)</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleVideoControl(state?.video_state?.is_playing !== false ? 'pause' : 'play')}
                      className="btn-primary host-btn-sm"
                      style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                    >
                      {state?.video_state?.is_playing !== false ? (
                        <><Pause size={14} /> Pausa</>
                      ) : (
                        <><Play size={14} /> Riproduci</>
                      )}
                    </button>
                    <button
                      onClick={() => handleVideoControl('restart')}
                      className="btn-outline host-btn-sm"
                      title="Riavvia il video dall'inizio"
                    >
                      <RotateCcw size={14} /> Riavvia
                    </button>
                    <button
                      onClick={() => handleVideoControl(state?.video_state?.muted ? 'unmute' : 'mute')}
                      className="btn-outline host-btn-sm"
                      title={state?.video_state?.muted ? 'Attiva Audio TV' : 'Muta Audio TV'}
                    >
                      {state?.video_state?.muted ? <Volume2 size={14} color="var(--emerald-accent)" /> : <VolumeX size={14} />}
                    </button>
                  </div>
                </div>

                {/* Upload & Replace Video Card */}
                <div style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '2px dashed rgba(0, 210, 255, 0.35)',
                  borderRadius: '14px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  gap: '10px'
                }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: 'rgba(0, 210, 255, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <UploadCloud size={24} color="var(--cyan-glow)" />
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
                      Carica o Sostituisci il Video
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, maxWidth: '380px' }}>
                      Seleziona il video (formato MP4, WEBM o MOV). Verrà inviato al server e mandato in onda a schermo intero sulla TV.
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*,.mp4,.webm,.mov"
                    onChange={handleVideoUpload}
                    style={{ display: 'none' }}
                  />

                  <button
                    disabled={uploadingVideo}
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-cyan host-btn-sm"
                    style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                  >
                    <Video size={15} /> {uploadingVideo ? 'Caricamento in corso...' : 'Seleziona File Video'}
                  </button>

                  {uploadingVideo && (
                    <div style={{ width: '80%', maxWidth: '280px', marginTop: '6px' }}>
                      <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--cyan-gradient)', transition: 'width 0.2s' }} />
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--cyan-glow)', marginTop: '4px', fontWeight: 700 }}>
                        {uploadMessage}
                      </div>
                    </div>
                  )}

                  {uploadMessage && !uploadingVideo && (
                    <div style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: uploadMessage.startsWith('✓') ? 'var(--emerald-accent)' : 'var(--crimson-accent)',
                      background: 'rgba(0,0,0,0.4)',
                      padding: '4px 12px',
                      borderRadius: '8px'
                    }}>
                      {uploadMessage}
                    </div>
                  )}
                </div>

                {/* Quick Navigation Footer */}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '4px' }}>
                  <button onClick={handleShowRecap} className="btn-outline host-btn-sm" style={{ fontSize: '0.75rem' }}>
                    <Table size={13} /> Tabellone TV
                  </button>
                  <button onClick={handleShowProfiles} className="btn-outline host-btn-sm" style={{ fontSize: '0.75rem' }}>
                    <Sparkles size={13} /> Profili Affinità
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Card 1: Risposte degli Sposi a Confronto */}
                <div className="glass-panel host-card" style={{ flex: '1.2', minHeight: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Risposte Sposi in Tempo Reale
                    </div>
                    <button
                      onClick={handleRevealAll}
                      className="btn-cyan host-btn-sm"
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    >
                      <Eye size={13} /> Svela Entrambe sul PC
                    </button>
                  </div>

                  {/* 2 Side-by-Side Player Answer Boxes */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    flex: 1,
                    minHeight: 0
                  }}>
                    {/* Antonio Box */}
                    <div style={{
                      background: 'rgba(0, 210, 255, 0.05)',
                      border: '1px solid rgba(0, 210, 255, 0.25)',
                      borderRadius: '10px',
                      padding: '10px',
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 800, color: 'var(--cyan-glow)', fontSize: '0.95rem' }}>
                          {p1?.name || 'Antonio'}
                        </span>
                        <span style={{
                          fontSize: '0.7rem',
                          color: p1?.has_answered ? 'var(--emerald-accent)' : p1?.draft_answer ? 'var(--cyan-glow)' : 'var(--text-dim)',
                          fontWeight: 700
                        }}>
                          {p1?.has_answered ? '✓ Inviato' : p1?.draft_answer ? '✏️ Sta scrivendo...' : '👁️ Visualizzata'}
                        </span>
                      </div>

                      <div style={{
                        background: 'rgba(0,0,0,0.35)',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        flex: 1,
                        minHeight: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        overflowY: 'auto'
                      }}>
                        {p1?.has_answered ? (
                          <div style={{ width: '100%' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--emerald-accent)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                              Risposta definitiva:
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', wordBreak: 'break-word' }}>
                              "{p1.current_answer}"
                            </div>
                            {p1.draft_answer && p1.draft_answer !== p1.current_answer && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--cyan-glow)', fontStyle: 'italic', marginTop: '3px' }}>
                                (in modifica: "{p1.draft_answer}")
                              </div>
                            )}
                          </div>
                        ) : p1?.draft_answer && p1.draft_answer.trim().length > 0 ? (
                          <div style={{ width: '100%' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--cyan-glow)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--cyan-glow)' }} />
                              In digitazione live:
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#00d2ff', fontStyle: 'italic', wordBreak: 'break-word' }}>
                              "{p1.draft_answer}"
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '0.78rem' }}>
                            Domanda visualizzata (in attesa di digitazione)...
                          </span>
                        )}
                      </div>

                      <button
                        onClick={handleRevealP1}
                        className="btn-outline host-btn-sm"
                        style={{ width: '100%', justifyContent: 'center', marginTop: '6px', fontSize: '0.75rem', padding: '4px' }}
                      >
                        <Eye size={12} /> Svela solo Antonio
                      </button>
                    </div>

                    {/* Katia Box */}
                    <div style={{
                      background: 'rgba(245, 179, 35, 0.05)',
                      border: '1px solid rgba(245, 179, 35, 0.25)',
                      borderRadius: '10px',
                      padding: '10px',
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 800, color: 'var(--gold-glow)', fontSize: '0.95rem' }}>
                          {p2?.name || 'Katia'}
                        </span>
                        <span style={{
                          fontSize: '0.7rem',
                          color: p2?.has_answered ? 'var(--emerald-accent)' : p2?.draft_answer ? 'var(--gold-glow)' : 'var(--text-dim)',
                          fontWeight: 700
                        }}>
                          {p2?.has_answered ? '✓ Inviata' : p2?.draft_answer ? '✏️ Sta scrivendo...' : '👁️ Visualizzata'}
                        </span>
                      </div>

                      <div style={{
                        background: 'rgba(0,0,0,0.35)',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        flex: 1,
                        minHeight: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        overflowY: 'auto'
                      }}>
                        {p2?.has_answered ? (
                          <div style={{ width: '100%' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--emerald-accent)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                              Risposta definitiva:
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', wordBreak: 'break-word' }}>
                              "{p2.current_answer}"
                            </div>
                            {p2.draft_answer && p2.draft_answer !== p2.current_answer && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--gold-glow)', fontStyle: 'italic', marginTop: '3px' }}>
                                (in modifica: "{p2.draft_answer}")
                              </div>
                            )}
                          </div>
                        ) : p2?.draft_answer && p2.draft_answer.trim().length > 0 ? (
                          <div style={{ width: '100%' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--gold-glow)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--gold-glow)' }} />
                              In digitazione live:
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#ffd05b', fontStyle: 'italic', wordBreak: 'break-word' }}>
                              "{p2.draft_answer}"
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '0.78rem' }}>
                            Domanda visualizzata (in attesa di digitazione)...
                          </span>
                        )}
                      </div>

                      <button
                        onClick={handleRevealP2}
                        className="btn-outline host-btn-sm"
                        style={{ width: '100%', justifyContent: 'center', marginTop: '6px', fontSize: '0.75rem', padding: '4px' }}
                      >
                        <Eye size={12} /> Svela solo Katia
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card 2: Valutazione Affinità di Coppia (Match / No-Match) */}
                <div className="glass-panel host-card" style={{
                  flex: '0.8',
                  minHeight: 0,
                  justifyContent: 'center',
                  border: isMatch === true ? '2px solid var(--emerald-accent)' : isMatch === false ? '2px solid var(--crimson-accent)' : '1px solid rgba(255, 255, 255, 0.12)'
                }}>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '6px',
                    fontWeight: 700,
                    textAlign: 'center'
                  }}>
                    Giudizio Regia: Le risposte coincidono?
                  </div>

                  {/* Status pill if judged */}
                  <div style={{ textAlign: 'center', marginBottom: '8px', minHeight: '22px' }}>
                    {isMatch === true && (
                      <span className="badge-cyan" style={{ background: 'rgba(46, 213, 115, 0.2)', borderColor: 'var(--emerald-accent)', color: 'var(--emerald-accent)', fontSize: '0.8rem', padding: '3px 10px' }}>
                        <CheckCircle size={13} /> RISPOSTE COINCIDENTI (+1 PUNTO COPPIA ASSEGNATO)
                      </span>
                    )}
                    {isMatch === false && (
                      <span style={{ color: 'var(--crimson-accent)', fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <XCircle size={13} /> RISPOSTE DIFFERENTI (0 PUNTI)
                      </span>
                    )}
                    {(isMatch === null || isMatch === undefined) && (
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                        Valuta le risposte degli sposi e assegna il punto
                      </span>
                    )}
                  </div>

                  {/* Action Judgment Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                    <button
                      onClick={handleJudgeMatch}
                      className="btn-success"
                      style={{
                        padding: '12px 14px',
                        fontSize: '0.92rem',
                        justifyContent: 'center',
                        boxShadow: '0 4px 18px rgba(46, 213, 115, 0.35)',
                        fontWeight: 800
                      }}
                    >
                      <Heart size={18} fill="#fff" /> RISPOSTE UGUALI (+1 PT)
                    </button>

                    <button
                      onClick={handleJudgeMismatch}
                      className="btn-danger"
                      style={{
                        padding: '12px 14px',
                        fontSize: '0.92rem',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                        borderColor: 'rgba(255,255,255,0.2)',
                        fontWeight: 700
                      }}
                    >
                      <XCircle size={18} /> Differenti (0 Pt)
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>

        </div>
      )}

      {/* QUESTION SELECTOR & PREVIEW MODAL */}
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
          padding: '16px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '920px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            padding: '20px 24px',
            background: 'linear-gradient(145deg, #0d1533 0%, #070c20 100%)',
            border: '2px solid rgba(0, 210, 255, 0.4)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.9)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 4px 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ListOrdered size={20} color="var(--cyan-glow)" /> ANTEPRIMA & SELEZIONE DOMANDE (1 - {totalQ})
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Sfoglia il testo completo delle domande prima di individuare e mandare in onda quella desiderata.
                </p>
              </div>
              <button
                onClick={() => setShowQuestionSelector(false)}
                style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px', borderRadius: '8px' }}
                title="Chiudi anteprima"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Input */}
            <div style={{ marginBottom: '14px', position: 'relative' }}>
              <input
                type="text"
                value={questionSearch}
                onChange={(e) => setQuestionSearch(e.target.value)}
                placeholder="🔍 Cerca domanda per parola chiave o categoria..."
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: '1px solid rgba(0, 210, 255, 0.35)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Questions List */}
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '6px' }}>
              {allQuestions
                .map((item, idx) => ({ ...item, index: idx }))
                .filter(item => {
                  if (!questionSearch.trim()) return true;
                  const query = questionSearch.toLowerCase();
                  const qText = (item.question || '').toLowerCase();
                  const cat = (item.category || '').toLowerCase();
                  const num = `domanda ${item.index + 1}`.toLowerCase();
                  return qText.includes(query) || cat.includes(query) || num.includes(query);
                })
                .map((item) => {
                  const actualIndex = item.index;
                  const isCurrent = actualIndex === qIndex;
                  const recapItem = recap[actualIndex] || {};
                  const isMatchItem = recapItem.is_match;

                  return (
                    <div
                      key={actualIndex}
                      style={{
                        background: isCurrent ? 'rgba(0, 210, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                        border: isCurrent ? '2px solid var(--cyan-primary)' : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {/* Top Row: Badges & Action */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{
                            background: isCurrent ? 'var(--cyan-primary)' : 'rgba(255, 255, 255, 0.1)',
                            color: isCurrent ? '#000' : '#fff',
                            fontWeight: 800,
                            fontSize: '0.78rem',
                            padding: '3px 10px',
                            borderRadius: '999px',
                            letterSpacing: '0.5px'
                          }}>
                            DOMANDA #{actualIndex + 1}
                          </span>

                          {item.category && (
                            <span style={{
                              background: 'rgba(168, 85, 247, 0.18)',
                              color: '#c084fc',
                              border: '1px solid rgba(168, 85, 247, 0.4)',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              padding: '3px 10px',
                              borderRadius: '999px'
                            }}>
                              {item.category}
                            </span>
                          )}

                          {isCurrent && (
                            <span style={{
                              background: 'rgba(0, 210, 255, 0.25)',
                              color: 'var(--cyan-glow)',
                              fontWeight: 800,
                              fontSize: '0.75rem',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Radio size={12} style={{ animation: 'pulseGlow 1s infinite alternate' }} /> IN ONDA ORA
                            </span>
                          )}

                          {isMatchItem === true && (
                            <span style={{ background: 'rgba(46, 213, 115, 0.2)', color: 'var(--emerald-accent)', fontWeight: 700, fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px' }}>
                              ✓ Affini (+1 PT)
                            </span>
                          )}
                          {isMatchItem === false && (
                            <span style={{ background: 'rgba(255, 71, 87, 0.2)', color: 'var(--crimson-accent)', fontWeight: 700, fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px' }}>
                              ✗ Differenti (0 PT)
                            </span>
                          )}
                        </div>

                        {/* Action Button */}
                        <div>
                          {isCurrent ? (
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--cyan-glow)', padding: '6px 12px' }}>
                              Attiva ora sullo schermo
                            </span>
                          ) : (
                            <button
                              onClick={() => handleJump(actualIndex)}
                              className="btn-cyan host-btn-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                              <Play size={12} fill="currentColor" /> Manda in Onda
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Question Text Preview */}
                      <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>
                        {item.question}
                      </div>

                      {/* Regia Helpers (Notes & Reference Answer) */}
                      {(item.reference_answer || item.notes) && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.78rem', color: 'var(--text-muted)', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          {item.reference_answer && (
                            <span>🎯 <strong style={{ color: 'var(--cyan-glow)' }}>Rif:</strong> {item.reference_answer}</span>
                          )}
                          {item.notes && (
                            <span>💡 <strong style={{ color: 'var(--gold-glow)' }}>Nota:</strong> {item.notes}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
