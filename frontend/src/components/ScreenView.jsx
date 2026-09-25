import React, { useEffect, useState, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Tv, Volume2, VolumeX, Trophy, Sparkles, Clock, CheckCircle2,
  HelpCircle, QrCode, Crown, Award, Heart, XCircle, X,
  Table, Radio, Flame, Eye, Film, Video, Play, Pause, AlertCircle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { soundManager } from '../utils/SoundManager';
export const AFFINITY_PROFILES = [
  {
    range: '15 - 15 PUNTI',
    minScore: 15,
    maxScore: 15,
    title: 'Telepati',
    subtitle: 'Sintonizzazione Totale',
    description: 'Siete una cosa sola! In 25 anni avete sviluppato una sintonizzazione totale.',
    quote: 'Ma come avete fatto????',
    emoji: '🔮',
    color: '#ffd05b',
    border: 'rgba(255, 208, 91, 0.75)',
    badgeBg: 'rgba(245, 179, 35, 0.22)',
    boxShadow: '0 8px 30px rgba(245, 179, 35, 0.25)'
  },
  {
    range: '11 - 14 PUNTI',
    minScore: 11,
    maxScore: 14,
    title: 'Complici',
    subtitle: 'Intesa Solidissima',
    description: "Un'intesa solidissima. Conoscete benissimo le abitudini e i gusti dell'altro, con giusto quel minimo di spazio per qualche divertente sorpresa.",
    quote: 'Ma come avete fatto????',
    emoji: '🤝',
    color: '#00d2ff',
    border: 'rgba(0, 210, 255, 0.75)',
    badgeBg: 'rgba(0, 210, 255, 0.22)',
    boxShadow: '0 8px 30px rgba(0, 210, 255, 0.25)'
  },
  {
    range: '6 - 10 PUNTI',
    minScore: 6,
    maxScore: 10,
    title: 'Poli Opposti',
    subtitle: 'Gli Opposti si Attraggono',
    description: 'Il classico equilibrio dei contrasti. Non sempre vedete le cose allo stesso modo, ma è proprio la diversità il segreto che vi tiene uniti da un quarto di secolo!',
    quote: 'Ma come avete fatto????',
    emoji: '⚡',
    color: '#c084fc',
    border: 'rgba(192, 132, 252, 0.75)',
    badgeBg: 'rgba(168, 85, 247, 0.22)',
    boxShadow: '0 8px 30px rgba(168, 85, 247, 0.25)'
  },
  {
    range: '1 - 5 PUNTI',
    minScore: 1,
    maxScore: 5,
    title: "Compagni d'Avventura",
    subtitle: 'Con Brio & Sorprese',
    description: 'Vi piace ancora sorprendervi (o smentirvi!). La routine non fa per voi: avete due personalità forti che continuano a scoprirsi giorno dopo giorno.',
    quote: 'Ma come fate????',
    emoji: '🧭',
    color: '#fb923c',
    border: 'rgba(251, 146, 60, 0.75)',
    badgeBg: 'rgba(249, 115, 22, 0.22)',
    boxShadow: '0 8px 30px rgba(249, 115, 22, 0.25)'
  },
  {
    range: '0 - 0 PUNTI',
    minScore: 0,
    maxScore: 0,
    title: 'Alieni...mistero Incredibile',
    subtitle: 'Un Enigma per la Scienza!',
    description: "Come avete fatto ad arrivare alle Nozze d'Argento? Un vero e proprio enigma per la scienza! Ma evidentemente l'amore va ben oltre le risposte corrette.",
    quote: 'Tanti auguri',
    emoji: '🛸',
    color: '#2ed573',
    border: 'rgba(46, 213, 115, 0.75)',
    badgeBg: 'rgba(46, 213, 115, 0.22)',
    boxShadow: '0 8px 30px rgba(46, 213, 115, 0.25)'
  }
];

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
  const showQr = state?.show_qr;
  const hasActiveQr = Boolean(showQr && showQr !== 'none');

  // Toggle sound
  const handleToggleSound = () => {
    const next = !muted;
    setMuted(next);
    soundManager.setMuted(next);
  };

  // Remote scrolling for recap table from Host tablet
  const recapContainerRef = useRef(null);
  const autoScrollAnimRef = useRef(null);
  const [highlightedQuestion, setHighlightedQuestion] = useState(null);

  useEffect(() => {
    const handleScrollEvent = (e) => {
      const container = recapContainerRef.current;
      if (!container) return;
      const data = e.detail;

      if (data.target === 'top') {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (data.target === 'bottom') {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      } else if (data.target === 'up') {
        container.scrollBy({ top: -280, behavior: 'smooth' });
      } else if (data.target === 'down') {
        container.scrollBy({ top: 280, behavior: 'smooth' });
      } else if (data.target === 'question') {
        const qIdx = Number(data.questionIndex);
        setHighlightedQuestion(qIdx);
        setTimeout(() => setHighlightedQuestion(null), 3500);
        const el = document.getElementById(`recap-card-${qIdx}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else if (data.target === 'percent') {
        const maxScroll = container.scrollHeight - container.clientHeight;
        const targetTop = maxScroll * (Math.max(0, Math.min(100, Number(data.percent) || 0)) / 100);
        container.scrollTo({ top: targetTop, behavior: 'smooth' });
      } else if (typeof data.deltaY === 'number') {
        container.scrollBy({ top: data.deltaY, behavior: 'auto' });
      }

      if (data.autoScroll !== undefined) {
        if (data.autoScroll) {
          if (autoScrollAnimRef.current) cancelAnimationFrame(autoScrollAnimRef.current);
          const scrollSpeed = Number(data.speed) || 1.2;
          const step = () => {
            if (!container) return;
            if (container.scrollTop + container.clientHeight >= container.scrollHeight - 3) {
              return;
            }
            container.scrollTop += scrollSpeed;
            autoScrollAnimRef.current = requestAnimationFrame(step);
          };
          autoScrollAnimRef.current = requestAnimationFrame(step);
        } else {
          if (autoScrollAnimRef.current) {
            cancelAnimationFrame(autoScrollAnimRef.current);
            autoScrollAnimRef.current = null;
          }
        }
      }
    };

    window.addEventListener('ak_screen_scroll', handleScrollEvent);
    return () => {
      window.removeEventListener('ak_screen_scroll', handleScrollEvent);
      if (autoScrollAnimRef.current) cancelAnimationFrame(autoScrollAnimRef.current);
    };
  }, []);

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

  // Fullscreen Celebration Video State & Controls
  const videoRef = useRef(null);
  const videoState = state?.video_state;
  const videoUrl = state?.video_url || '/media/celebration.mp4';
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [needInteraction, setNeedInteraction] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Reliable play helper with automatic muted fallback for browser autoplay policy
  const playVideo = useCallback(() => {
    if (!videoRef.current) return;
    const v = videoRef.current;

    const playPromise = v.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setNeedInteraction(false);
        })
        .catch((err) => {
          console.warn("Autoplay with sound prevented by browser policy, falling back to muted play:", err);
          v.muted = true;
          v.play()
            .then(() => {
              setIsPlaying(true);
              setNeedInteraction(true);
            })
            .catch((e2) => {
              console.warn("Muted play also prevented:", e2);
              setIsPlaying(false);
              setNeedInteraction(true);
            });
        });
    }
  }, []);

  // When switching to VIDEO mode, or when videoUrl changes, attempt playback
  useEffect(() => {
    if (screenMode === 'VIDEO' && videoRef.current) {
      playVideo();
    }
  }, [screenMode, videoUrl, playVideo]);

  // Sync video playback commands from Regia
  useEffect(() => {
    if (!videoRef.current || screenMode !== 'VIDEO') return;
    if (!videoState) return;

    const action = videoState.action;
    const v = videoRef.current;
    if (action === 'play') {
      playVideo();
    } else if (action === 'pause') {
      v.pause();
      setIsPlaying(false);
    } else if (action === 'restart') {
      v.currentTime = 0;
      playVideo();
    } else if (action === 'toggle') {
      if (v.paused) {
        playVideo();
      } else {
        v.pause();
        setIsPlaying(false);
      }
    } else if (action === 'mute') {
      v.muted = true;
    } else if (action === 'unmute') {
      v.muted = false;
      setNeedInteraction(false);
    }
  }, [videoState?.timestamp, videoState?.action, screenMode, playVideo]);

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

  const timerRemaining = timer.remaining ?? 60;
  const timerDuration = timer.duration || 60;
  const timerPct = Math.max(0, Math.min(100, (timerRemaining / timerDuration) * 100));
  const isTimerCritical = timer.active && timerRemaining <= 10;
  const isTimerMid = timer.active && timerRemaining > 10 && timerRemaining <= 25;

  return (
    <div style={{
      height: '100vh',
      maxHeight: '100vh',
      width: '100vw',
      maxWidth: '100vw',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: 'clamp(8px, 1.4vh, 16px) clamp(14px, 2.2vw, 36px)',
      position: 'relative',
      zIndex: 1,
      overflow: 'hidden'
    }}>
      {/* Top TV Bar */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'nowrap',
        gap: '12px',
        paddingBottom: 'clamp(8px, 1.2vh, 14px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        flexShrink: 0
      }}>
        {/* Left: TV Logo & Question Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'clamp(8px, 1.5vw, 16px)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, rgba(245, 179, 35, 0.2), rgba(168, 85, 247, 0.25))',
            padding: '5px 14px',
            borderRadius: '12px',
            border: '1px solid rgba(245, 179, 35, 0.35)'
          }}>
            <Heart size={18} color="var(--gold-primary)" fill="var(--gold-primary)" />
            <span style={{ fontFamily: 'var(--font-tech)', fontSize: 'clamp(0.95rem, 1.6vw, 1.2rem)', fontWeight: 700, letterSpacing: '1px' }}>
              ANTONIO & KATIA • 25 ANNI
            </span>
          </div>

          {screenMode === 'PROFILES' && (
            <div className="badge-gold" style={{ fontSize: 'clamp(0.75rem, 1.2vw, 0.9rem)', padding: '4px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} /> LIVELLI DI AFFINITÀ
            </div>
          )}
          {screenMode === 'VIDEO' && (
            <div className="badge-gold" style={{ fontSize: 'clamp(0.75rem, 1.2vw, 0.9rem)', padding: '4px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Film size={14} /> PROIEZIONE VIDEO
            </div>
          )}
          {screenMode !== 'FINAL' && screenMode !== 'INTRO_COUNTDOWN' && screenMode !== 'RECAP' && screenMode !== 'LOBBY' && screenMode !== 'PROFILES' && screenMode !== 'VIDEO' && (
            <div className="badge-gold" style={{ fontSize: 'clamp(0.75rem, 1.2vw, 0.9rem)', padding: '4px 12px' }}>
              DOMANDA {qIndex} DI {totalQ}
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
              gap: '10px',
              padding: '6px 18px',
              borderRadius: '999px',
              background: isTimerCritical ? 'rgba(255, 71, 87, 0.25)' : isTimerMid ? 'rgba(245, 179, 35, 0.15)' : 'rgba(0, 210, 255, 0.12)',
              border: isTimerCritical ? '2px solid var(--crimson-accent)' : isTimerMid ? '1px solid var(--gold-primary)' : '1px solid rgba(0, 210, 255, 0.4)',
              boxShadow: isTimerCritical ? '0 0 25px rgba(255, 71, 87, 0.7)' : '0 0 15px rgba(0, 210, 255, 0.2)',
              animation: isTimerCritical ? 'pulseGlow 0.8s infinite alternate' : 'none'
            }}>
              {isTimerCritical ? <Flame size={20} color="var(--crimson-accent)" /> : <Clock size={18} color="var(--cyan-glow)" />}
              <span style={{
                fontFamily: 'var(--font-tech)',
                fontSize: '1.5rem',
                fontWeight: 900,
                color: isTimerCritical ? 'var(--crimson-accent)' : isTimerMid ? 'var(--gold-glow)' : '#fff',
                letterSpacing: '1px'
              }}>
                {timerRemaining}s
              </span>
            </div>
          )}


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
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 0, overflow: 'hidden', padding: 'clamp(6px, 1.2vh, 16px) 0' }}>

        {/* PHASE: LOBBY ON SCREEN (PRE-SHOW TV DISPLAY) */}
        {screenMode === 'LOBBY' && (
          <div className="animate-float" style={{
            maxWidth: '920px',
            margin: '0 auto',
            width: '100%',
            textAlign: 'center',
            padding: 'clamp(10px, 2vh, 20px)'
          }}>

            <div className="glass-panel" style={{
              padding: 'clamp(20px, 4vh, 36px) clamp(20px, 4vw, 40px)',
              background: 'linear-gradient(135deg, rgba(20, 25, 55, 0.88), rgba(10, 15, 35, 0.95))',
              border: '2px solid rgba(245, 179, 35, 0.55)',
              boxShadow: '0 0 60px rgba(245, 179, 35, 0.3)',
              borderRadius: '24px',
              marginBottom: '20px'
            }}>
              <h1 style={{
                fontFamily: 'var(--font-tech)',
                fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                fontWeight: 900,
                color: '#fff',
                lineHeight: 1.1,
                marginBottom: '10px'
              }}>
                ANTONIO & KATIA
              </h1>
              <div style={{
                fontSize: 'clamp(1.1rem, 2vw, 1.5rem)',
                color: 'var(--gold-primary)',
                fontWeight: 800,
                letterSpacing: '2px',
                marginBottom: '20px'
              }}>
                NOZZE D'ARGENTO • 25 ANNI INSIEME
              </div>

              {/* Status Sposi & QR Codes (Controlled by Regia or clickable) */}
              {hasActiveQr ? (
                <div className="animate-float" style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 'clamp(16px, 3vw, 32px)',
                  margin: '10px auto 10px',
                  flexWrap: 'wrap'
                }}>
                  {(showQr === 'all' || showQr === 'player1') && (
                    <div style={{
                      background: 'rgba(0, 210, 255, 0.08)',
                      border: '2px solid rgba(0, 210, 255, 0.45)',
                      borderRadius: '20px',
                      padding: '16px 22px',
                      textAlign: 'center',
                      boxShadow: '0 8px 32px rgba(0, 210, 255, 0.25)',
                      minWidth: '210px'
                    }}>
                      <div style={{ color: 'var(--cyan-glow)', fontWeight: 800, fontSize: '1.05rem', marginBottom: '8px' }}>
                        🤵 ANTONIO
                      </div>
                      <div style={{
                        background: '#ffffff',
                        padding: '10px',
                        borderRadius: '12px',
                        display: 'inline-block',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
                        marginBottom: '10px'
                      }}>
                        <QRCodeSVG value={`${baseUrl}/?role=player1`} size={135} />
                      </div>
                      <div style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: p1?.connected ? 'var(--emerald-accent)' : 'var(--text-muted)'
                      }}>
                        {p1?.connected ? '✅ Antonio Connesso!' : '📱 Inquadra con lo smartphone'}
                      </div>
                    </div>
                  )}

                  {(showQr === 'all' || showQr === 'player2') && (
                    <div style={{
                      background: 'rgba(245, 179, 35, 0.08)',
                      border: '2px solid rgba(245, 179, 35, 0.45)',
                      borderRadius: '20px',
                      padding: '16px 22px',
                      textAlign: 'center',
                      boxShadow: '0 8px 32px rgba(245, 179, 35, 0.25)',
                      minWidth: '210px'
                    }}>
                      <div style={{ color: 'var(--gold-glow)', fontWeight: 800, fontSize: '1.05rem', marginBottom: '8px' }}>
                        👰 KATIA
                      </div>
                      <div style={{
                        background: '#ffffff',
                        padding: '10px',
                        borderRadius: '12px',
                        display: 'inline-block',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
                        marginBottom: '10px'
                      }}>
                        <QRCodeSVG value={`${baseUrl}/?role=player2`} size={135} />
                      </div>
                      <div style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: p2?.connected ? 'var(--emerald-accent)' : 'var(--text-muted)'
                      }}>
                        {p2?.connected ? '✅ Katia Connessa!' : '📱 Inquadra con lo smartphone'}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  maxWidth: '520px',
                  margin: '0 auto 10px'
                }}>
                  <div
                    onClick={() => sendMessage('SET_SHOW_QR', { target: 'player1' })}
                    title="Clicca per mostrare il QR code di Antonio sulla TV"
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: p1?.connected ? 'rgba(46, 213, 115, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      border: p1?.connected ? '1px solid var(--emerald-accent)' : '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>SPOSO</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: p1?.connected ? 'var(--emerald-accent)' : '#fff' }}>
                      {p1?.name || 'Antonio'} {p1?.connected ? '✅' : '⏳'}
                    </div>
                  </div>

                  <div
                    onClick={() => sendMessage('SET_SHOW_QR', { target: 'player2' })}
                    title="Clicca per mostrare il QR code di Katia sulla TV"
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: p2?.connected ? 'rgba(46, 213, 115, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      border: p2?.connected ? '1px solid var(--emerald-accent)' : '1px solid rgba(255, 255, 255, 0.1)'
                      ,
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>SPOSA</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: p2?.connected ? 'var(--emerald-accent)' : '#fff' }}>
                      {p2?.name || 'Katia'} {p2?.connected ? '✅' : '⏳'}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* PHASE: SUPER FOREGROUND FULL-SCREEN DRAMATIC INTRO COUNTDOWN */}
        {screenMode === 'INTRO_COUNTDOWN' && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'radial-gradient(ellipse at center, rgba(13, 18, 38, 0.98) 0%, rgba(3, 7, 18, 0.99) 100%)',
            backdropFilter: 'blur(25px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.4s ease'
          }}>
            {/* Giant Glowing Countdown Circle */}
            <div
              key={countdownNum}
              style={{
                width: 'clamp(200px, 32vw, 340px)',
                height: 'clamp(200px, 32vw, 340px)',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(245, 179, 35, 0.35) 0%, rgba(10, 15, 35, 0.95) 70%)',
                border: '6px solid var(--gold-primary)',
                boxShadow: '0 0 90px rgba(245, 179, 35, 0.8), inset 0 0 60px rgba(245, 179, 35, 0.45)',
                margin: '0 auto clamp(20px, 4vh, 36px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'flipReveal 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}
            >
              <span style={{
                fontFamily: 'var(--font-tech)',
                fontSize: 'clamp(7.5rem, 20vw, 14rem)',
                fontWeight: 900,
                color: '#fff',
                textShadow: '0 0 50px rgba(245, 179, 35, 1), 0 0 90px rgba(245, 179, 35, 0.8)',
                lineHeight: 1
              }}>
                {countdownNum > 0 ? countdownNum : 'VIA!'}
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(1.8rem, 4vw, 3.4rem)',
              fontWeight: 900,
              color: '#fff',
              letterSpacing: '1px',
              textAlign: 'center',
              marginBottom: '8px',
              textShadow: '0 0 30px rgba(255, 255, 255, 0.3)'
            }}>
              ANTONIO & KATIA • 25 ANNI INSIEME
            </h1>
            <p style={{
              color: 'var(--cyan-glow)',
              fontSize: 'clamp(1rem, 1.8vw, 1.35rem)',
              fontWeight: 700,
              letterSpacing: '1px',
              textAlign: 'center'
            }}>
              La Sfida di Coppia delle Nozze d'Argento sta per cominciare!
            </p>
          </div>
        )}

        {/* PHASE: QUESTION_INTRO (1ª DOMANDA / DOMANDA N TITLE CARD - IN ATTESA DEL CONSENSO DA REGIA) */}
        {screenMode === 'QUESTION_INTRO' && (
          <div className="animate-float" style={{
            maxWidth: '920px',
            margin: '0 auto',
            width: '100%',
            textAlign: 'center',
            padding: 'clamp(10px, 2vh, 20px)'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 22px',
              borderRadius: '999px',
              background: 'rgba(0, 210, 255, 0.15)',
              border: '1px solid var(--cyan-primary)',
              color: 'var(--cyan-glow)',
              fontWeight: 800,
              fontSize: 'clamp(0.85rem, 1.2vw, 1.05rem)',
              letterSpacing: '1.5px',
              marginBottom: 'clamp(14px, 2.5vh, 24px)',
              animation: 'pulseGlow 1.2s infinite'
            }}>
              <Radio size={16} color="var(--cyan-glow)" /> LA DOMANDA STA PER ARRIVARE!
            </div>

            {/* Giant Title Card */}
            <div className="glass-panel" style={{
              padding: 'clamp(24px, 5vh, 48px) clamp(20px, 4vw, 44px)',
              background: 'linear-gradient(135deg, rgba(20, 25, 55, 0.88), rgba(10, 15, 35, 0.95))',
              border: '2px solid rgba(245, 179, 35, 0.55)',
              boxShadow: '0 0 60px rgba(245, 179, 35, 0.35)',
              borderRadius: '24px'
            }}>
              <div style={{
                fontFamily: 'var(--font-tech)',
                fontSize: 'clamp(3.6rem, 8vw, 6.2rem)',
                fontWeight: 900,
                color: 'var(--gold-primary)',
                letterSpacing: '2px',
                lineHeight: 1.1,
                textShadow: '0 0 40px rgba(245, 179, 35, 0.75)',
                marginBottom: '16px'
              }}>
                {qIndex}ª DOMANDA
              </div>

              <p style={{
                fontSize: 'clamp(1.1rem, 1.8vw, 1.35rem)',
                color: 'var(--text-muted)',
                maxWidth: '650px',
                margin: '0 auto',
                lineHeight: 1.5
              }}>
                Antonio e Katia, preparate i vostri smartphone...<br />
                <strong style={{ color: 'var(--gold-glow)' }}>
                  La domanda sta per arrivare!
                </strong>
              </p>
            </div>
          </div>
        )}

        {/* PHASE: GRANDE TABELLONE DELLE RISPOSTE (RECAP COMPLETO DELLE 15 DOMANDE) */}
        {screenMode === 'RECAP' && (
          <div className="animate-float" style={{ maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div className="badge-gold" style={{ marginBottom: '10px' }}>
                <Table size={16} /> TABELLONE COMPLETO RISPOSTE
              </div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 800, marginBottom: '6px' }}>
                Le 15 Risposte di Antonio & Katia a Confronto
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                Affinità totale registrata: <strong style={{ color: 'var(--gold-glow)' }}>{coupleScore} su {totalQ} risposte coincidenti ({affinityPct}%)</strong>
              </p>
            </div>

            <div
              ref={recapContainerRef}
              id="recap-scroll-container"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '12px',
                maxHeight: '65vh',
                overflowY: 'auto',
                paddingRight: '8px',
                scrollBehavior: 'smooth'
              }}>
              {recap.map((item, idx) => (
                <div
                  key={idx}
                  id={`recap-card-${idx}`}
                  className="glass-panel"
                  style={{
                    padding: '16px 20px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
                    gap: '16px',
                    alignItems: 'center',
                    borderLeft: item.is_match === true ? '6px solid var(--emerald-accent)' : item.is_match === false ? '6px solid var(--crimson-accent)' : '6px solid rgba(255,255,255,0.2)',
                    boxShadow: highlightedQuestion === idx ? '0 0 35px rgba(245, 179, 35, 0.6), 0 0 10px #ffffff' : undefined,
                    borderColor: highlightedQuestion === idx ? 'var(--gold-primary)' : undefined,
                    transform: highlightedQuestion === idx ? 'scale(1.02)' : 'scale(1)',
                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                  }}>
                  {/* Question Info */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="badge-gold" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>#{item.id}</span>
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
                      <span className="badge-cyan" style={{ background: 'rgba(255, 71, 87, 0.2)', borderColor: 'var(--crimson-accent)', color: 'var(--crimson-accent)', fontSize: '0.85rem' }}>
                        <XCircle size={14} /> DIFFERENTI (0 PT)
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
        {screenMode === 'SCOREBOARD' && (() => {
          const currentProfile = AFFINITY_PROFILES.find(
            p => coupleScore >= p.minScore && coupleScore <= p.maxScore
          ) || AFFINITY_PROFILES[AFFINITY_PROFILES.length - 1];

          return (
            <div className="animate-float" style={{ maxWidth: '840px', margin: '0 auto', width: '100%', textAlign: 'center' }}>
              <div className="badge-gold" style={{ marginBottom: '16px' }}>
                <Award size={16} /> TERMOMETRO DELL'AFFINITÀ
              </div>


              <div
                className="glass-panel"
                style={{
                  padding: 'clamp(24px, 4vw, 36px)',
                  background: 'linear-gradient(145deg, #0e1635 0%, #080d22 100%)',
                  backdropFilter: 'none',
                  WebkitBackdropFilter: 'none',
                  borderTop: '5px solid var(--gold-primary)',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)'
                }}
              >
                {/* Score Number Display */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                  <Heart size={44} color="var(--gold-primary)" fill="var(--gold-primary)" />
                  <div style={{ fontFamily: 'var(--font-tech)', fontSize: 'clamp(2.8rem, 5vw, 4rem)', fontWeight: 900, color: '#fff' }}>
                    {coupleScore} <span style={{ fontSize: 'clamp(1.2rem, 2vw, 1.8rem)', color: 'var(--text-dim)' }}>/ {totalQ} Punti</span>
                  </div>
                </div>

                {/* Affinity Progress Bar */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  height: '22px',
                  borderRadius: '999px',
                  overflow: 'hidden',
                  position: 'relative',
                  marginBottom: '14px'
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

                {/* RELATIVE AFFINITY PROFILE CARD */}
                <div style={{
                  marginTop: '26px',
                  paddingTop: '22px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.12)',
                  textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '1.5px',
                      color: currentProfile.color,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <Sparkles size={14} /> PROFILO DI AFFINITÀ ATTUALE
                    </span>

                    <span style={{
                      background: currentProfile.badgeBg,
                      border: `1px solid ${currentProfile.border}`,
                      color: currentProfile.color,
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      padding: '3px 12px',
                      borderRadius: '999px',
                      fontFamily: 'var(--font-tech)'
                    }}>
                      FASCIA: {currentProfile.range}
                    </span>
                  </div>

                  <div
                    className="profile-highlight-box"
                    style={{
                      background: 'linear-gradient(145deg, #121c42 0%, #080d24 100%)',
                      borderRadius: '16px',
                      border: `2px solid ${currentProfile.border}`,
                      padding: '20px 22px',
                      boxShadow: `0 8px 30px ${currentProfile.color}25, inset 0 0 20px ${currentProfile.color}15`,
                      backdropFilter: 'none',
                      WebkitBackdropFilter: 'none'
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '2.4rem', lineHeight: 1 }}>{currentProfile.emoji}</span>
                      <div>
                        <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                          {currentProfile.title}
                        </h3>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: currentProfile.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {currentProfile.subtitle}
                        </div>
                      </div>
                    </div>

                    <p style={{
                      fontSize: '0.96rem',
                      color: 'rgba(255, 255, 255, 0.92)',
                      lineHeight: 1.55,
                      margin: '12px 0 10px 0'
                    }}>
                      {currentProfile.description}
                    </p>

                    <div style={{
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      fontStyle: 'italic',
                      color: currentProfile.color,
                      textAlign: 'right'
                    }}>
                      {currentProfile.quote}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          );
        })()}

        {/* PHASE: PROFILES VIEW (I 5 PROFILI DI LIVELLO DI AFFINITÀ) */}
        {screenMode === 'PROFILES' && (
          <div className="animate-reveal" style={{ maxWidth: '1440px', margin: '0 auto', width: '100%', textAlign: 'center', paddingBottom: '30px' }}>

            {/* Header Tag & Title */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(245, 179, 35, 0.15)', border: '1px solid rgba(245, 179, 35, 0.4)', borderRadius: '999px', padding: '6px 20px', marginBottom: '14px' }}>
              <Sparkles size={16} color="var(--gold-glow)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold-glow)' }}>
                LIVELLI DI AFFINITÀ • NOZZE D'ARGENTO
              </span>
            </div>

            <h2 style={{ fontSize: 'clamp(1.8rem, 3.2vw, 2.8rem)', fontWeight: 800, color: '#fff', marginBottom: '10px', textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}>
              I 5 Profili dell'Intesa di Coppia
            </h2>

            <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(0.95rem, 1.4vw, 1.15rem)', maxWidth: '780px', margin: '0 auto 20px auto', lineHeight: 1.5 }}>
              La scala dei punteggi e il grado di intesa dopo 25 Anni di matrimonio di Antonio & Katia!
            </p>

            {/* Current Score Indicator */}
            <div
              className="affinity-score-pill"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                background: 'linear-gradient(145deg, #0e1635 0%, #080d22 100%)',
                border: '1px solid rgba(0, 210, 255, 0.4)',
                borderRadius: '999px',
                padding: '8px 24px',
                marginBottom: '28px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
              }}>
              <Heart size={20} color="var(--gold-primary)" fill="var(--gold-primary)" />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Punteggio attuale della coppia:
              </span>
              <strong style={{ fontFamily: 'var(--font-tech)', fontSize: '1.4rem', color: '#fff' }}>
                {coupleScore} <span style={{ fontSize: '0.85rem', color: 'var(--cyan-glow)' }}>/ {totalQ} PUNTI</span>
              </strong>
            </div>

            {/* 5 Cards Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))',
              gap: '18px',
              textAlign: 'left'
            }}>
              {AFFINITY_PROFILES.map((prof, i) => {
                const isCurrent = coupleScore >= prof.minScore && coupleScore <= prof.maxScore;
                return (
                  <div
                    key={i}
                    className="affinity-profile-card"
                    style={{
                      background: isCurrent
                        ? 'linear-gradient(145deg, #121c42 0%, #080d24 100%)'
                        : 'linear-gradient(145deg, #0e1635 0%, #080d22 100%)',
                      backdropFilter: 'none',
                      WebkitBackdropFilter: 'none',
                      borderRadius: '20px',
                      border: isCurrent
                        ? `2px solid ${prof.color}`
                        : '1px solid rgba(255, 255, 255, 0.12)',
                      boxShadow: isCurrent
                        ? `0 0 35px ${prof.color}45, inset 0 0 20px ${prof.color}20`
                        : '0 10px 30px rgba(0, 0, 0, 0.4)',
                      padding: '24px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.4s ease'
                    }}
                  >
                    <div>
                      {/* Top Bar: Punteggio & Current Rank Tag */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          background: prof.badgeBg,
                          border: `1px solid ${prof.border}`,
                          color: prof.color,
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          letterSpacing: '1px',
                          padding: '4px 12px',
                          borderRadius: '999px',
                          fontFamily: 'var(--font-tech)'
                        }}>
                          {prof.range}
                        </span>

                        {isCurrent && (
                          <span style={{
                            background: 'rgba(255, 208, 91, 0.25)',
                            border: '1px solid var(--gold-glow)',
                            color: 'var(--gold-glow)',
                            fontSize: '0.72rem',
                            fontWeight: 900,
                            padding: '3px 10px',
                            borderRadius: '999px',
                            animation: 'pulseGlow 1s infinite alternate',
                            letterSpacing: '0.5px'
                          }}>
                            ★ LIVELLO ATTUALE
                          </span>
                        )}
                      </div>

                      {/* Emoji + Profilo */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '2rem', lineHeight: 1 }}>{prof.emoji}</span>
                        <h3 style={{
                          fontSize: '1.3rem',
                          fontWeight: 800,
                          color: '#fff',
                          margin: 0,
                          lineHeight: 1.2
                        }}>
                          {prof.title}
                        </h3>
                      </div>

                      {/* Livello di Affinità (Subtitle) */}
                      <div style={{
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: prof.color,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '14px'
                      }}>
                        {prof.subtitle}
                      </div>

                      {/* Descrizione */}
                      <p style={{
                        fontSize: '0.92rem',
                        color: 'rgba(255, 255, 255, 0.88)',
                        lineHeight: 1.55,
                        marginBottom: '16px'
                      }}>
                        {prof.description}
                      </p>
                    </div>

                    {/* Punchline */}
                    <div style={{
                      borderTop: `1px solid ${isCurrent ? prof.border : 'rgba(255, 255, 255, 0.08)'}`,
                      paddingTop: '12px',
                      fontSize: '0.92rem',
                      fontWeight: 800,
                      fontStyle: 'italic',
                      color: prof.color
                    }}>
                      {prof.quote}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================
            PHASE: FULL-SCREEN CINEMATIC ANNIVERSARY VIDEO
           ======================================================== */}
        {screenMode === 'VIDEO' && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: '#000000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            cursor: needInteraction ? 'pointer' : 'default'
          }}
            onClick={() => {
              if (videoRef.current) {
                if (videoRef.current.muted) {
                  videoRef.current.muted = false;
                  setNeedInteraction(false);
                }
                if (videoRef.current.paused) {
                  playVideo();
                }
              }
            }}>
            {/* Video Element */}
            <video
              ref={videoRef}
              src={videoUrl}
              playsInline
              autoPlay
              controls={false}
              onTimeUpdate={() => {
                if (videoRef.current) {
                  setVideoCurrentTime(videoRef.current.currentTime);
                  setVideoDuration(videoRef.current.duration || 0);
                }
              }}
              onLoadedMetadata={() => {
                setVideoLoaded(true);
                setVideoError(false);
                if (videoRef.current) {
                  setVideoDuration(videoRef.current.duration || 0);
                }
                playVideo();
              }}
              onCanPlay={() => {
                if (videoRef.current && videoRef.current.paused) {
                  playVideo();
                }
              }}
              onError={() => {
                setVideoError(true);
              }}
              style={{
                width: '100%',
                height: '100%',
                maxHeight: '100vh',
                objectFit: 'contain',
                backgroundColor: '#000000',
                display: videoError ? 'none' : 'block'
              }}
            />

            {/* Placeholder if video is not yet loaded or file waiting to be uploaded */}
            {videoError && (
              <div className="glass-panel animate-float" style={{
                position: 'absolute',
                padding: 'clamp(28px, 5vh, 48px)',
                maxWidth: '660px',
                width: '90%',
                textAlign: 'center',
                background: 'rgba(14, 20, 44, 0.94)',
                border: '2px solid var(--gold-primary)',
                boxShadow: '0 0 60px rgba(245, 179, 35, 0.35)',
                borderRadius: '24px',
                zIndex: 20
              }}>
                <div style={{
                  display: 'inline-flex',
                  padding: '20px',
                  borderRadius: '50%',
                  background: 'rgba(245, 179, 35, 0.15)',
                  border: '2px solid var(--gold-primary)',
                  marginBottom: '16px'
                }}>
                  <Film size={48} color="var(--gold-primary)" />
                </div>
                <h2 style={{
                  fontFamily: 'var(--font-tech)',
                  fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)',
                  fontWeight: 900,
                  color: '#fff',
                  marginBottom: '8px'
                }}>
                  PROIEZIONE VIDEO SPECIALE
                </h2>
                <div style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: 'var(--gold-glow)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '16px'
                }}>
                  Antonio & Katia • 25 Anni Insieme
                </div>
                <p style={{
                  fontSize: '1.05rem',
                  color: 'var(--text-main)',
                  lineHeight: 1.6,
                  marginBottom: '22px'
                }}>
                  Questa schermata è pronta per trasmettere il video celebrativo a tutto schermo!<br />
                  Carica il file video direttamente dal pannello di <strong>Regia</strong> con il tasto <strong>"Carica Nuovo Video"</strong>.
                </p>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 18px',
                  borderRadius: '999px',
                  background: 'rgba(0, 210, 255, 0.15)',
                  border: '1px solid var(--cyan-glow)',
                  color: 'var(--cyan-glow)',
                  fontSize: '0.9rem',
                  fontWeight: 700
                }}>
                  <Radio size={16} style={{ animation: 'pulseGlow 1s infinite alternate' }} /> In attesa del comando video dalla Regia...
                </div>
              </div>
            )}

            {/* If autoplay was muted or blocked by browser policy, show elegant unmute button */}
            {needInteraction && !videoError && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (videoRef.current) {
                    videoRef.current.muted = false;
                    playVideo();
                    setNeedInteraction(false);
                  }
                }}
                className="animate-float"
                style={{
                  position: 'absolute',
                  bottom: '36px',
                  background: 'rgba(0, 0, 0, 0.88)',
                  backdropFilter: 'blur(16px)',
                  border: '2px solid var(--gold-primary)',
                  boxShadow: '0 0 35px rgba(245, 179, 35, 0.65)',
                  borderRadius: '999px',
                  padding: '12px 28px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: '#fff',
                  cursor: 'pointer',
                  zIndex: 30,
                  animation: 'pulseGoldGlow 1.5s infinite'
                }}
              >
                <Volume2 size={24} color="var(--gold-primary)" />
                <span style={{ fontFamily: 'var(--font-tech)', fontSize: '1.25rem', fontWeight: 800, letterSpacing: '1px' }}>
                  CLICCA PER ATTIVARE L'AUDIO
                </span>
              </div>
            )}

            {/* Subtle Sleek Progress Bar at bottom */}
            {videoDuration > 0 && !videoError && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '6px',
                background: 'rgba(255, 255, 255, 0.15)',
                zIndex: 15
              }}>
                <div style={{
                  height: '100%',
                  width: `${(videoCurrentTime / videoDuration) * 100}%`,
                  background: 'var(--gold-gradient)',
                  boxShadow: '0 0 10px rgba(245, 179, 35, 0.8)',
                  transition: 'width 0.2s linear'
                }} />
              </div>
            )}
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

              {/* BROADCAST HERO COUNTDOWN BAR (SUPER EVIDENT ON BIG SCREEN) */}
              {screenMode === 'QUESTION' && timer.enabled !== false && (
                <div style={{
                  marginTop: 'clamp(14px, 2.2vh, 22px)',
                  paddingTop: 'clamp(10px, 1.6vh, 16px)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.12)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    maxWidth: '720px'
                  }}>
                    {/* Big Bold Countdown Digits */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: isTimerCritical ? 'var(--crimson-accent)' : isTimerMid ? 'var(--gold-glow)' : 'var(--cyan-glow)'
                    }}>
                      {isTimerCritical ? (
                        <Flame size={32} color="var(--crimson-accent)" style={{ animation: 'pulseGlow 0.6s infinite alternate' }} />
                      ) : (
                        <Clock size={26} color="var(--cyan-glow)" />
                      )}
                      <span style={{
                        fontFamily: 'var(--font-tech)',
                        fontSize: 'clamp(2.2rem, 4.5vw, 3.4rem)',
                        fontWeight: 900,
                        lineHeight: 1,
                        letterSpacing: '2px',
                        textShadow: isTimerCritical
                          ? '0 0 30px rgba(255, 71, 87, 0.9)'
                          : isTimerMid
                            ? '0 0 20px rgba(245, 179, 35, 0.6)'
                            : '0 0 20px rgba(0, 210, 255, 0.6)'
                      }}>
                        {timerRemaining}s
                      </span>
                    </div>

                    {/* Broadcast Countdown Status Tag */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{
                        padding: '6px 16px',
                        borderRadius: '999px',
                        background: isTimerCritical
                          ? 'rgba(255, 71, 87, 0.25)'
                          : isTimerMid
                            ? 'rgba(245, 179, 35, 0.2)'
                            : 'rgba(0, 210, 255, 0.15)',
                        border: isTimerCritical
                          ? '1px solid var(--crimson-accent)'
                          : isTimerMid
                            ? '1px solid var(--gold-primary)'
                            : '1px solid var(--cyan-primary)',
                        color: isTimerCritical ? 'var(--crimson-accent)' : isTimerMid ? 'var(--gold-glow)' : 'var(--cyan-glow)',
                        fontWeight: 800,
                        fontSize: 'clamp(0.78rem, 1.2vw, 0.95rem)',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        animation: isTimerCritical ? 'pulseGlow 0.8s infinite alternate' : 'none'
                      }}>
                        {timerRemaining === 0
                          ? '⛔ TEMPO SCADUTO!'
                          : isTimerCritical
                            ? '🔥 ULTIMI 10 SECONDI!'
                            : timer.active
                              ? '⏱️ TEMPO PER RISPONDERE'
                              : 'PAUSA'}
                      </span>
                    </div>
                  </div>

                  {/* High-Visibility Depleting Progress Bar */}
                  <div style={{
                    width: '100%',
                    maxWidth: '720px',
                    height: '12px',
                    background: 'rgba(0, 0, 0, 0.55)',
                    borderRadius: '999px',
                    overflow: 'hidden',
                    border: isTimerCritical ? '1px solid var(--crimson-accent)' : '1px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: isTimerCritical ? '0 0 20px rgba(255, 71, 87, 0.6)' : 'inset 0 2px 4px rgba(0,0,0,0.5)'
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
                      transition: 'width 1s linear, background 0.4s ease',
                      boxShadow: isTimerCritical ? '0 0 16px #ff4757' : '0 0 10px rgba(0, 210, 255, 0.6)'
                    }} />
                  </div>
                </div>
              )}
            </div>

            {/* Players Answer Cards Arena (Antonio & Katia Side-by-Side) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 'clamp(14px, 2.5vw, 30px)', marginBottom: '20px' }}>

              {/* ANTONIO BOX */}
              <div
                className={`glass-panel tv-player-card active-p1 ${p1?.has_answered && !p1?.is_revealed ? 'answered' : ''}`}
                style={{
                  padding: 'clamp(16px, 2vw, 26px)',
                  background: 'linear-gradient(145deg, #0e1635 0%, #080d22 100%)',
                  backdropFilter: 'none',
                  WebkitBackdropFilter: 'none',
                  border: p1?.is_revealed
                    ? (isMatch ? '2px solid var(--emerald-accent)' : '2px solid rgba(0, 210, 255, 0.75)')
                    : (p1?.has_answered ? '2px solid rgba(0, 210, 255, 0.85)' : '1px solid rgba(0, 210, 255, 0.35)'),
                  boxShadow: p1?.is_revealed
                    ? (isMatch ? '0 0 35px rgba(46, 213, 115, 0.3)' : '0 10px 30px rgba(0, 0, 0, 0.6)')
                    : (p1?.has_answered ? '0 0 35px rgba(0, 210, 255, 0.25)' : 'none'),
                  transition: 'all 0.5s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: p1?.connected ? 'var(--emerald-accent)' : 'var(--text-dim)', boxShadow: p1?.connected ? '0 0 10px var(--emerald-accent)' : 'none' }} />
                    <h3 style={{ fontSize: 'clamp(1.2rem, 1.8vw, 1.45rem)', fontWeight: 800, color: 'var(--cyan-glow)' }}>
                      {p1?.name || 'Antonio'}
                    </h3>
                  </div>

                  <div>
                    {p1?.has_answered ? (
                      <span className="badge-cyan" style={{ background: 'rgba(46, 213, 115, 0.22)', borderColor: 'var(--emerald-accent)', color: '#2ed573', fontWeight: 800, boxShadow: '0 0 12px rgba(46, 213, 115, 0.35)' }}>
                        <CheckCircle2 size={14} /> Risposta Inviata
                      </span>
                    ) : (p1?.is_typing || (p1?.draft_answer && p1.draft_answer.trim().length > 0)) ? (
                      <span style={{ fontSize: '0.85rem', color: 'var(--cyan-glow)', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                        <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: 'var(--cyan-glow)', animation: 'pulseGlow 1s infinite alternate' }} />
                        Sta scrivendo...
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Eye size={14} color="var(--cyan-glow)" /> Domanda visualizzata
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className={`tv-answer-box ${p1?.is_revealed ? 'revealed' : p1?.has_answered ? 'answered' : ''}`}
                  style={{
                    minHeight: '140px',
                    background: p1?.is_revealed
                      ? 'linear-gradient(145deg, #070c20 0%, #040714 100%)'
                      : p1?.has_answered
                        ? 'linear-gradient(135deg, rgba(0, 210, 255, 0.24) 0%, rgba(6, 32, 54, 0.78) 100%)'
                        : (p1?.is_typing || (p1?.draft_answer && p1.draft_answer.trim().length > 0))
                          ? 'rgba(0, 210, 255, 0.08)'
                          : '#060a1c',
                    backdropFilter: 'none',
                    WebkitBackdropFilter: 'none',
                    borderRadius: '18px',
                    border: p1?.is_revealed
                      ? (isMatch ? '2px solid var(--emerald-accent)' : '1px solid rgba(0, 210, 255, 0.45)')
                      : p1?.has_answered
                        ? '2px solid var(--cyan-glow)'
                        : (p1?.is_typing || (p1?.draft_answer && p1.draft_answer.trim().length > 0))
                          ? '1px solid rgba(0, 210, 255, 0.35)'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: p1?.is_revealed
                      ? 'inset 0 2px 10px rgba(0, 0, 0, 0.7), 0 4px 15px rgba(0, 0, 0, 0.5)'
                      : p1?.has_answered
                        ? '0 0 35px rgba(0, 210, 255, 0.4), inset 0 0 25px rgba(0, 210, 255, 0.25)'
                        : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.5s ease'
                  }}>
                  {p1?.is_revealed ? (
                    <div className="animate-reveal" style={{ width: '100%' }}>
                      <div style={{
                        fontSize: 'clamp(1.6rem, 2.4vw, 2.2rem)',
                        fontWeight: 700,
                        color: isMatch ? 'var(--emerald-accent)' : '#ffffff',
                        wordBreak: 'break-word',
                        textShadow: isMatch ? '0 0 20px rgba(46, 213, 115, 0.6)' : 'none'
                      }}>
                        {p1?.current_answer || 'Nessuna risposta'}
                      </div>
                    </div>
                  ) : p1?.has_answered ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', animation: 'scaleUp 0.35s ease' }}>
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        background: 'rgba(0, 210, 255, 0.25)',
                        border: '2px solid var(--cyan-glow)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 22px rgba(0, 210, 255, 0.65)'
                      }}>
                        <CheckCircle2 size={26} color="var(--cyan-glow)" />
                      </div>
                      <div style={{
                        fontSize: '1.25rem',
                        fontWeight: 900,
                        color: '#ffffff',
                        letterSpacing: '0.5px',
                        textShadow: '0 0 20px rgba(0, 210, 255, 0.8)'
                      }}>
                        RISPOSTA RICEVUTA
                      </div>
                      <span style={{ fontSize: '0.82rem', color: 'var(--cyan-glow)', fontWeight: 600 }}>
                        Sigillata in attesa dello svelamento 🔒
                      </span>
                    </div>
                  ) : (p1?.is_typing || (p1?.draft_answer && p1.draft_answer.trim().length > 0)) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--cyan-glow)' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'rgba(0, 210, 255, 0.12)',
                        border: '1px solid rgba(0, 210, 255, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Clock size={22} color="var(--cyan-glow)" />
                      </div>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                        Sta scrivendo la risposta...
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-dim)' }}>
                      <HelpCircle size={32} />
                      <span style={{ fontSize: '0.95rem' }}>
                        Domanda visualizzata
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* KATIA BOX */}
              <div
                className={`glass-panel tv-player-card active-p2 ${p2?.has_answered && !p2?.is_revealed ? 'answered' : ''}`}
                style={{
                  padding: 'clamp(16px, 2vw, 26px)',
                  background: 'linear-gradient(145deg, #0e1635 0%, #080d22 100%)',
                  backdropFilter: 'none',
                  WebkitBackdropFilter: 'none',
                  border: p2?.is_revealed
                    ? (isMatch ? '2px solid var(--emerald-accent)' : '2px solid rgba(245, 179, 35, 0.75)')
                    : (p2?.has_answered ? '2px solid rgba(245, 179, 35, 0.85)' : '1px solid rgba(245, 179, 35, 0.35)'),
                  boxShadow: p2?.is_revealed
                    ? (isMatch ? '0 0 35px rgba(46, 213, 115, 0.3)' : '0 10px 30px rgba(0, 0, 0, 0.6)')
                    : (p2?.has_answered ? '0 0 35px rgba(245, 179, 35, 0.25)' : 'none'),
                  transition: 'all 0.5s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: p2?.connected ? 'var(--emerald-accent)' : 'var(--text-dim)', boxShadow: p2?.connected ? '0 0 10px var(--emerald-accent)' : 'none' }} />
                    <h3 style={{ fontSize: 'clamp(1.2rem, 1.8vw, 1.45rem)', fontWeight: 800, color: 'var(--gold-glow)' }}>
                      {p2?.name || 'Katia'}
                    </h3>
                  </div>

                  <div>
                    {p2?.has_answered ? (
                      <span className="badge-gold" style={{ background: 'rgba(46, 213, 115, 0.22)', borderColor: 'var(--emerald-accent)', color: '#2ed573', fontWeight: 800, boxShadow: '0 0 12px rgba(46, 213, 115, 0.35)' }}>
                        <CheckCircle2 size={14} /> Risposta Inviata
                      </span>
                    ) : (p2?.is_typing || (p2?.draft_answer && p2.draft_answer.trim().length > 0)) ? (
                      <span style={{ fontSize: '0.85rem', color: 'var(--gold-glow)', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                        <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: 'var(--gold-glow)', animation: 'pulseGlow 1s infinite alternate' }} />
                        Sta scrivendo...
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Eye size={14} color="var(--gold-glow)" /> Domanda visualizzata
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className={`tv-answer-box ${p2?.is_revealed ? 'revealed' : p2?.has_answered ? 'answered' : ''}`}
                  style={{
                    minHeight: '140px',
                    background: p2?.is_revealed
                      ? 'linear-gradient(145deg, #070c20 0%, #040714 100%)'
                      : p2?.has_answered
                        ? 'linear-gradient(135deg, rgba(245, 179, 35, 0.24) 0%, rgba(54, 38, 6, 0.78) 100%)'
                        : (p2?.is_typing || (p2?.draft_answer && p2.draft_answer.trim().length > 0))
                          ? 'rgba(245, 179, 35, 0.08)'
                          : '#060a1c',
                    backdropFilter: 'none',
                    WebkitBackdropFilter: 'none',
                    borderRadius: '18px',
                    border: p2?.is_revealed
                      ? (isMatch ? '2px solid var(--emerald-accent)' : '1px solid rgba(245, 179, 35, 0.45)')
                      : p2?.has_answered
                        ? '2px solid var(--gold-glow)'
                        : (p2?.is_typing || (p2?.draft_answer && p2.draft_answer.trim().length > 0))
                          ? '1px solid rgba(245, 179, 35, 0.35)'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: p2?.is_revealed
                      ? 'inset 0 2px 10px rgba(0, 0, 0, 0.7), 0 4px 15px rgba(0, 0, 0, 0.5)'
                      : p2?.has_answered
                        ? '0 0 35px rgba(245, 179, 35, 0.4), inset 0 0 25px rgba(245, 179, 35, 0.25)'
                        : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.5s ease'
                  }}>
                  {p2?.is_revealed ? (
                    <div className="animate-reveal" style={{ width: '100%' }}>
                      <div style={{
                        fontSize: 'clamp(1.6rem, 2.4vw, 2.2rem)',
                        fontWeight: 700,
                        color: isMatch ? 'var(--emerald-accent)' : '#ffffff',
                        wordBreak: 'break-word',
                        textShadow: isMatch ? '0 0 20px rgba(46, 213, 115, 0.6)' : 'none'
                      }}>
                        {p2?.current_answer || 'Nessuna risposta'}
                      </div>
                    </div>
                  ) : p2?.has_answered ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', animation: 'scaleUp 0.35s ease' }}>
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        background: 'rgba(245, 179, 35, 0.25)',
                        border: '2px solid var(--gold-glow)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 22px rgba(245, 179, 35, 0.65)'
                      }}>
                        <CheckCircle2 size={26} color="var(--gold-glow)" />
                      </div>
                      <div style={{
                        fontSize: '1.25rem',
                        fontWeight: 900,
                        color: '#ffffff',
                        letterSpacing: '0.5px',
                        textShadow: '0 0 20px rgba(245, 179, 35, 0.8)'
                      }}>
                        RISPOSTA RICEVUTA
                      </div>
                      <span style={{ fontSize: '0.82rem', color: 'var(--gold-glow)', fontWeight: 600 }}>
                        Sigillata in attesa dello svelamento 🔒
                      </span>
                    </div>
                  ) : (p2?.is_typing || (p2?.draft_answer && p2.draft_answer.trim().length > 0)) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--gold-glow)' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'rgba(245, 179, 35, 0.12)',
                        border: '1px solid rgba(245, 179, 35, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Clock size={22} color="var(--gold-glow)" />
                      </div>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                        Sta scrivendo la risposta...
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-dim)' }}>
                      <HelpCircle size={32} />
                      <span style={{ fontSize: '0.95rem' }}>
                        Domanda visualizzata
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
                    background: 'linear-gradient(135deg, rgba(255, 71, 87, 0.22), rgba(255, 107, 129, 0.12))',
                    border: '2px solid var(--crimson-accent)',
                    padding: '16px 36px',
                    borderRadius: '999px',
                    boxShadow: '0 0 35px rgba(255, 71, 87, 0.4)'
                  }}>
                    <XCircle size={26} color="var(--crimson-accent)" />
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', letterSpacing: '1px' }}>
                      RISPOSTE DIFFERENTI (0 PT) • GLI OPPOSTI SI ATTRAGGONO!
                    </span>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </main>

      {/* In-Game Floating Broadcast QR Reconnect Overlay if triggered by Regia */}
      {hasActiveQr && screenMode !== 'LOBBY' && (
        <div className="animate-float" style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          background: 'rgba(10, 15, 35, 0.95)',
          border: '2px solid var(--cyan-primary)',
          borderRadius: '20px',
          padding: '16px 20px',
          boxShadow: '0 10px 40px rgba(0, 210, 255, 0.4)',
          backdropFilter: 'blur(16px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '16px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--cyan-glow)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              📱 COLLEGAMENTO SMARTPHONE
            </span>
            <button
              onClick={() => sendMessage('SET_SHOW_QR', { target: 'none' })}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '2px' }}
              title="Chiudi"
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            {(showQr === 'all' || showQr === 'player1') && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--cyan-glow)', marginBottom: '4px' }}>ANTONIO</div>
                <div style={{ background: '#fff', padding: '6px', borderRadius: '8px', display: 'inline-block' }}>
                  <QRCodeSVG value={`${baseUrl}/?role=player1`} size={95} />
                </div>
                <div style={{ fontSize: '0.72rem', color: p1?.connected ? 'var(--emerald-accent)' : 'var(--text-dim)', marginTop: '2px', fontWeight: 600 }}>
                  {p1?.connected ? 'Connesso ✓' : 'Scansiona'}
                </div>
              </div>
            )}
            {(showQr === 'all' || showQr === 'player2') && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gold-glow)', marginBottom: '4px' }}>KATIA</div>
                <div style={{ background: '#fff', padding: '6px', borderRadius: '8px', display: 'inline-block' }}>
                  <QRCodeSVG value={`${baseUrl}/?role=player2`} size={95} />
                </div>
                <div style={{ fontSize: '0.72rem', color: p2?.connected ? 'var(--emerald-accent)' : 'var(--text-dim)', marginTop: '2px', fontWeight: 600 }}>
                  {p2?.connected ? 'Connessa ✓' : 'Scansiona'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
