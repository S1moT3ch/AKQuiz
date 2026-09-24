# AK Quiz Show • Nozze d'Argento (25 Anni Insieme)

Applicazione web real-time in stile **Quiz Televisivo di Coppia** sviluppata con **Vite + React** (Frontend) e **Python FastAPI + WebSockets** (Backend).

Antonio e Katia **non sono rivali**, ma giocano insieme come **coppia di sposi**! La sfida consiste nel verificare la loro sintonia e affinità dopo 25 anni di matrimonio: la coppia guadagna **1 punto per ogni domanda la cui risposta è uguale / coincidente** tra i due sposi (per un massimo di 15 punti).

---

## 👥 I Ruoli e i Dispositivi

- **📺 Schermo Principale (Display PC)**: Mostra lo studio televisivo a tutta la famiglia con la domanda in onda, l'effetto suspense per le risposte sigillate, l'animazione di ribaltamento quando la regia svela cosa hanno risposto Antonio e Katia, il **Termometro dell'Affinità** e la proclamazione finale delle Nozze d'Argento con coriandoli e fanfara trionfale.
- **📱 Antonio (Smartphone Sposo)**: Riceve la domanda, digita la sua risposta aperta e la invia. Visualizza sempre il punteggio di coppia in tempo reale.
- **📱 Katia (Smartphone Sposa)**: Riceve la domanda, digita la sua risposta aperta e la invia. Visualizza sempre il punteggio di coppia in tempo reale.
- **🎛️ Regia (4° Device - Smartphone, Tablet o Laptop dei figli Simone & Andrea)**: Controlla il gioco in tempo reale:
  - Manda in onda la domanda successiva.
  - Svela le risposte sul display del PC.
  - Legge i suggerimenti e le note di riferimento.
  - **Convalida con un tocco**:
    - 💖 **"RISPOSTE UGUALI (+1 PUNTO COPPIA)"**: assegna 1 punto al Punteggio di Coppia e attiva suoni ed effetti celebrativi a schermo.
    - 💬 **"RISPOSTE DIFFERENTI (0 PUNTI)"**: nessun punto assegnato, con battuta simpatica di incoraggiamento a schermo (*Gli opposti si attraggono!*).
  - Proietta la schermata dell'Affinità o attiva la cerimonia finale del Podio.

---

## 🚀 Avvio Rapido

### Metodo 1: Doppio Click (Consigliato)
Fai doppio click sul file:
```
AVVIA_QUIZ.bat
```
Questo avvierà automaticamente il server Python e aprirà la WebApp nel browser del PC a `http://localhost:8000`.

### Metodo 2: Da Terminale (PowerShell)
```powershell
.\venv\Scripts\python.exe backend\server.py
```
E apri nel browser: `http://localhost:8000`

---

## 📱 Collegamento degli Smartphone sulla Rete Wi-Fi Locale

1. Assicurati che il PC e i telefoni siano collegati alla **stessa rete Wi-Fi locale**.
2. Dalla schermata iniziale (Lobby) sul PC, inquadra i rispettivi **QR Code**:
   - 📱 **QR Code Antonio**: `http://<IP-PC>:8000/?role=player1`
   - 📱 **QR Code Katia**: `http://<IP-PC>:8000/?role=player2`
   - 🎛️ **QR Code Regia (Simone & Andrea)**: `http://<IP-PC>:8000/?role=host`
3. Sul PC clicca su **"Avvia Schermo TV Studio (PC)"** e premi `F11` per la modalità a tutto schermo.

---

## 💖 Regole del Punteggio di Coppia

- **Punteggio Massimo**: 15 Punti (1 punto per ogni risposta coincidente).
- **Livelli di Affinità Finale**:
  - **13 - 15 Punti**: *Telepatia di Coppia Assoluta - Anime Gemelle Leggendarie!*
  - **10 - 12 Punti**: *Sintonia Splendida - 25 Anni d'Amore e Complicità!*
  - **7 - 9 Punti**: *Grande Affinità con Sorprese - Gli Opposti si Attraggono!*
  - **Meno di 7 Punti**: *25 Anni di Pura Avventura, Imprevisti e Risate Insieme!*

---

## ⏱️ Novità e Funzionalità Avanzate

### 1. 🎬 Conto alla Rovescia Iniziale ad Alta Suspense
Dalla Regia, quando tutti sono pronti in Lobby, premendo **"Avvia Quiz (Conto alla Rovescia)"** parte un countdown drammatico sul display principale (5... 4... 3... 2... 1... *"IN ONDA!"*) con rintocchi sonori ad effetto e transizione sincronizzata alla prima domanda.

### 2. ⏳ Timer di Risposta Configurabile con Audio Televisivo
- Ogni domanda ha un tempo limite di risposta (predefinito: **60 secondi**, personalizzabile nel file `backend/config.json`).
- Il conto alla rovescia è visualizzato in tempo reale su **tutti i dispositivi**.
- Sullo schermo TV del PC vengono riprodotti effetti audio di tensione (ticchettio a 10s, battito cardiaco negli ultimi 5s, e gong di tempo scaduto).
- Dalla Regia è possibile **mettere in pausa**, **riprendere**, o **aggiungere 15 secondi** in qualsiasi momento.

### 3. 💾 Persistenza e Coerenza delle Risposte
Le risposte di Antonio e Katia rimangono memorizzate per tutte le 15 domande. La regia può navigare avanti e indietro con i pulsanti freccia senza perdere alcuna risposta data, ricaricando all'istante lo stato precedente.

### 4. 📊 Tabellone Completo di Tutte le Risposte ("Grand Recap")
Un nuovo pulsante in Regia (**"Tabellone Tutte le Risposte"**) permette di proiettare sul grande schermo PC una schermata riepilogativa panoramica con:
- La lista completa delle 15 domande
- La risposta di Antonio e la risposta di Katia affiancate per ciascuna
- L'indicatore visivo di intesa (Match confermato o Risposte diverse)

### 5. 🧪 Barra di Test Rapido e Layout Adattivo
- Per testare comodamente il quiz su un unico PC prima dell'evento, è presente in alto una barra flottante:
  - **Cambio ruolo rapido** con un click (Schermo TV, Regia, Antonio, Katia, Lobby).
  - Tasto **"Apri 4 Finestre di Test"**: apre automaticamente le 4 schermate affiancate sul desktop per simulare l'intera trasmissione.
  - Tutte le interfacce si adattano fluidamente alle dimensioni di qualsiasi finestra del browser.

---

## ⚙️ Configurazione Personalizzata (`backend/config.json`)

È possibile modificare le impostazioni del quiz modificando il file:
```json
{
  "question_timer_seconds": 60,
  "intro_countdown_seconds": 5,
  "enable_timer": true,
  "timer_sound": true,
  "show_host_notes": true
}
```

---

## 🔊 Effetti Sonori Integrati (Sintesi Web Audio API)

Nessun file audio esterno o connessione internet richiesta:
- **Conto alla rovescia**: rintocco di tensione e stacco di "In Onda".
- **Timer**: ticchettio e battito cardiaco negli ultimi secondi.
- **Invio risposta**: segnale acustico di conferma ricezione dallo smartphone.
- **Reveal**: ribaltamento scenico con effetto swoosh 3D.
- **Affinità di Coppia (+1 pt)**: rintocco armonico di campana e coriandoli.
- **Opposti si Attraggono (0 pt)**: buzzer simpatico.
- **Nozze d'Argento**: fanfara trionfale e applausi dello studio al podio finale.
