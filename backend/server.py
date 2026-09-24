import os
import json
import socket
import asyncio
import time
from typing import Dict, Set, Optional, Any
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

def get_local_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return '127.0.0.1'

CONFIG_FILE = os.path.join(os.path.dirname(__file__), "config.json")
QUESTIONS_FILE = os.path.join(os.path.dirname(__file__), "questions.json")

def load_config():
    defaults = {
        "question_timer_seconds": 60,
        "intro_countdown_seconds": 5,
        "enable_timer": True,
        "timer_sound": True
    }
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                defaults.update(data)
        except Exception as e:
            print(f"Error loading config: {e}")
    return defaults

def load_questions():
    if os.path.exists(QUESTIONS_FILE):
        try:
            with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading questions: {e}")
    return []

def save_questions(questions):
    try:
        with open(QUESTIONS_FILE, "w", encoding="utf-8") as f:
            json.dump(questions, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving questions: {e}")

questions_db = load_questions()
app_config = load_config()

# Game State
class QuizGame:
    def __init__(self):
        self.reset_all()

    def reset_all(self):
        global questions_db, app_config
        questions_db = load_questions()
        app_config = load_config()

        self.phase = "LOBBY"  # LOBBY, INTRO_COUNTDOWN, QUESTION, ANSWERS_REVEALED, SCOREBOARD, RECAP, FINISHED
        self.current_question_index = 0
        self.screen_mode = "LOBBY" # LOBBY, INTRO_COUNTDOWN, QUESTION, ANSWERS, SCOREBOARD, RECAP, FINAL
        self.intro_countdown = 5
        self.is_counting_down = False

        self.players = {
            "player1": {
                "id": "player1",
                "name": "Antonio",
                "connected": False,
                "score": 0,
                "current_answer": "",
                "has_answered": False,
                "answered_at": None,
                "is_revealed": False,
                "awarded_points": None,
                "history": []
            },
            "player2": {
                "id": "player2",
                "name": "Katia",
                "connected": False,
                "score": 0,
                "current_answer": "",
                "has_answered": False,
                "answered_at": None,
                "is_revealed": False,
                "awarded_points": None,
                "history": []
            }
        }
        self.couple_score = 0
        self.current_question_match = None
        
        # Consistent persistent answers store for all questions:
        # question_index -> {"p1": str, "p2": str, "p1_done": bool, "p2_done": bool, "is_revealed": bool, "match": bool|None}
        self.answers_store: Dict[int, Dict[str, Any]] = {}
        
        timer_sec = app_config.get("question_timer_seconds", 60)
        self.timer = {
            "active": False,
            "duration": timer_sec,
            "remaining": timer_sec,
            "started_at": None,
            "enabled": app_config.get("enable_timer", True)
        }
        self.sound_event = None

    def get_current_question(self):
        if 0 <= self.current_question_index < len(questions_db):
            return questions_db[self.current_question_index]
        return None

    def start_intro_countdown(self, seconds: int = 5):
        self.phase = "INTRO_COUNTDOWN"
        self.screen_mode = "INTRO_COUNTDOWN"
        self.intro_countdown = seconds
        self.is_counting_down = True
        self.sound_event = {"name": "countdown_tick", "count": seconds, "timestamp": time.time()}

    def start_game(self):
        self.phase = "QUESTION"
        self.screen_mode = "QUESTION"
        self.current_question_index = 0
        self.couple_score = 0
        self.answers_store = {}
        self.current_question_match = None
        self.is_counting_down = False
        
        self.load_question_answers(0)
        self.start_question_timer()
        self.sound_event = {"name": "start_game", "timestamp": time.time()}

    def start_question_timer(self):
        timer_sec = app_config.get("question_timer_seconds", 60)
        self.timer["duration"] = timer_sec
        self.timer["remaining"] = timer_sec
        self.timer["active"] = self.timer["enabled"]
        self.timer["started_at"] = time.time()

    def load_question_answers(self, index: int):
        stored = self.answers_store.get(index, {
            "p1": "", "p2": "", "p1_done": False, "p2_done": False, "is_revealed": False, "match": None
        })
        self.players["player1"]["current_answer"] = stored.get("p1", "")
        self.players["player1"]["has_answered"] = stored.get("p1_done", False)
        self.players["player1"]["is_revealed"] = stored.get("is_revealed", False)

        self.players["player2"]["current_answer"] = stored.get("p2", "")
        self.players["player2"]["has_answered"] = stored.get("p2_done", False)
        self.players["player2"]["is_revealed"] = stored.get("is_revealed", False)

        self.current_question_match = stored.get("match", None)

    def save_current_question_answers(self):
        idx = self.current_question_index
        if idx not in self.answers_store:
            self.answers_store[idx] = {}
        self.answers_store[idx].update({
            "p1": self.players["player1"]["current_answer"],
            "p2": self.players["player2"]["current_answer"],
            "p1_done": self.players["player1"]["has_answered"],
            "p2_done": self.players["player2"]["has_answered"],
            "is_revealed": self.players["player1"]["is_revealed"] or self.players["player2"]["is_revealed"],
            "match": self.current_question_match
        })

    def next_question(self):
        self.save_current_question_answers()
        if self.current_question_index < len(questions_db) - 1:
            self.current_question_index += 1
            self.phase = "QUESTION"
            self.screen_mode = "QUESTION"
            self.load_question_answers(self.current_question_index)
            self.start_question_timer()
            self.sound_event = {"name": "next_question", "timestamp": time.time()}
        else:
            self.finish_game()

    def prev_question(self):
        self.save_current_question_answers()
        if self.current_question_index > 0:
            self.current_question_index -= 1
            self.phase = "QUESTION"
            self.screen_mode = "QUESTION"
            self.load_question_answers(self.current_question_index)
            self.start_question_timer()
            self.sound_event = {"name": "transition", "timestamp": time.time()}

    def jump_question(self, index: int):
        self.save_current_question_answers()
        if 0 <= index < len(questions_db):
            self.current_question_index = index
            self.phase = "QUESTION"
            self.screen_mode = "QUESTION"
            self.load_question_answers(index)
            self.start_question_timer()
            self.sound_event = {"name": "transition", "timestamp": time.time()}

    def submit_answer(self, player_id: str, answer: str):
        if player_id in self.players:
            p = self.players[player_id]
            p["current_answer"] = answer.strip()
            p["has_answered"] = True
            p["answered_at"] = time.time()
            self.save_current_question_answers()
            self.sound_event = {"name": "answer_submitted", "player": player_id, "timestamp": time.time()}

    def reveal_answers(self, target: str = "all"):
        self.phase = "ANSWERS_REVEALED"
        self.screen_mode = "ANSWERS"
        if target == "all":
            self.players["player1"]["is_revealed"] = True
            self.players["player2"]["is_revealed"] = True
        elif target in self.players:
            self.players[target]["is_revealed"] = True
        self.timer["active"] = False
        self.save_current_question_answers()
        self.sound_event = {"name": "reveal", "target": target, "timestamp": time.time()}

    def judge_couple(self, is_match: bool, points: int = 1):
        idx = self.current_question_index
        old_match = self.answers_store.get(idx, {}).get("match")
        
        # Adjust couple score if state changed
        if old_match is True and not is_match:
            self.couple_score = max(0, self.couple_score - points)
        elif (old_match is not True) and is_match:
            self.couple_score += points

        self.current_question_match = is_match
        self.save_current_question_answers()
        
        self.sound_event = {
            "name": "correct" if is_match else "wrong",
            "match": is_match,
            "couple_score": self.couple_score,
            "timestamp": time.time()
        }

    def show_scoreboard(self):
        self.screen_mode = "SCOREBOARD"
        self.sound_event = {"name": "scoreboard", "timestamp": time.time()}

    def show_recap(self):
        self.save_current_question_answers()
        self.screen_mode = "RECAP"
        self.sound_event = {"name": "scoreboard", "timestamp": time.time()}

    def show_question(self):
        self.screen_mode = "QUESTION"

    def show_answers(self):
        self.screen_mode = "ANSWERS"

    def finish_game(self):
        self.save_current_question_answers()
        self.phase = "FINISHED"
        self.screen_mode = "FINAL"
        self.timer["active"] = False
        self.sound_event = {"name": "winner", "timestamp": time.time()}

    def get_full_recap(self):
        recap = []
        for idx, q in enumerate(questions_db):
            stored = self.answers_store.get(idx, {})
            recap.append({
                "index": idx,
                "id": q.get("id", idx + 1),
                "category": q.get("category", ""),
                "question": q.get("question", ""),
                "reference_answer": q.get("reference_answer", ""),
                "notes": q.get("notes", ""),
                "p1_answer": stored.get("p1", ""),
                "p2_answer": stored.get("p2", ""),
                "p1_done": stored.get("p1_done", False),
                "p2_done": stored.get("p2_done", False),
                "is_match": stored.get("match", None)
            })
        return recap

    def to_dict(self):
        return {
            "phase": self.phase,
            "screen_mode": self.screen_mode,
            "current_question_index": self.current_question_index,
            "total_questions": len(questions_db),
            "current_question": self.get_current_question(),
            "players": self.players,
            "couple_score": self.couple_score,
            "current_question_match": self.current_question_match,
            "answers_store": self.answers_store,
            "recap": self.get_full_recap(),
            "intro_countdown": self.intro_countdown,
            "is_counting_down": self.is_counting_down,
            "timer": self.timer,
            "config": app_config,
            "sound_event": self.sound_event,
            "server_ip": get_local_ip()
        }

game = QuizGame()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[WebSocket, Dict[str, Any]] = {}

    async def connect(self, websocket: WebSocket, role: str, name: Optional[str] = None):
        await websocket.accept()
        self.active_connections[websocket] = {"role": role, "name": name}
        
        if role in ["player1", "player2"]:
            game.players[role]["connected"] = True
            if name:
                game.players[role]["name"] = name
        
        print(f"Client connected: {role} (Total: {len(self.active_connections)})")
        await self.broadcast_state()

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            meta = self.active_connections[websocket]
            role = meta.get("role")
            if role in ["player1", "player2"]:
                other = any(
                    ws != websocket and m.get("role") == role
                    for ws, m in self.active_connections.items()
                )
                if not other:
                    game.players[role]["connected"] = False
            del self.active_connections[websocket]
            print(f"Client disconnected: {role} (Remaining: {len(self.active_connections)})")

    async def broadcast_state(self):
        if not self.active_connections:
            return
        state = game.to_dict()
        message = json.dumps({"type": "STATE_UPDATE", "data": state})
        
        dead_sockets = []
        for ws in list(self.active_connections.keys()):
            try:
                await ws.send_text(message)
            except Exception:
                dead_sockets.append(ws)
        
        for ws in dead_sockets:
            self.disconnect(ws)

    def sync_game_connections(self):
        game.players["player1"]["connected"] = any(m.get("role") == "player1" for m in self.active_connections.values())
        game.players["player2"]["connected"] = any(m.get("role") == "player2" for m in self.active_connections.values())

manager = ConnectionManager()

# Background timer and countdown loop
async def timer_loop():
    while True:
        await asyncio.sleep(1)
        
        # 1. Intro Countdown Loop
        if game.is_counting_down:
            if game.intro_countdown > 1:
                game.intro_countdown -= 1
                game.sound_event = {"name": "countdown_tick", "count": game.intro_countdown, "timestamp": time.time()}
                await manager.broadcast_state()
            elif game.intro_countdown == 1:
                game.intro_countdown = 0
                game.is_counting_down = False
                game.sound_event = {"name": "countdown_go", "timestamp": time.time()}
                game.start_game()
                await manager.broadcast_state()
        
        # 2. Question Timer Loop
        elif game.timer["active"] and game.timer["remaining"] > 0:
            game.timer["remaining"] -= 1
            rem = game.timer["remaining"]
            
            # Sound triggers for timer tension
            if rem > 0 and rem <= 5:
                game.sound_event = {"name": "timer_heartbeat", "remaining": rem, "timestamp": time.time()}
            elif rem > 5 and rem <= 10:
                game.sound_event = {"name": "timer_tick", "remaining": rem, "timestamp": time.time()}
            elif rem == 0:
                game.timer["active"] = False
                game.sound_event = {"name": "timeout", "timestamp": time.time()}
                
            await manager.broadcast_state()

@asynccontextmanager
async def lifespan(app: FastAPI):
    timer_task = asyncio.create_task(timer_loop())
    yield
    timer_task.cancel()

app = FastAPI(title="AKQuiz Real-Time Server", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/ip")
def api_ip():
    return {
        "ip": get_local_ip(),
        "backend_port": 8000,
        "frontend_port": 5173
    }

@app.get("/api/state")
def api_state():
    return game.to_dict()

@app.get("/api/config")
def api_get_config():
    return app_config

@app.get("/api/questions")
def api_get_questions():
    return questions_db

@app.get("/api/reset")
@app.post("/api/reset")
async def api_reset():
    game.reset_all()
    manager.sync_game_connections()
    await manager.broadcast_state()
    return {"status": "ok", "message": "Database di gioco e risposte azzerate con successo."}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, role: str = "guest", name: Optional[str] = None):
    await manager.connect(websocket, role, name)
    try:
        while True:
            text = await websocket.receive_text()
            data = json.loads(text)
            action = data.get("action") or data.get("type")
            
            if action == "START_INTRO_COUNTDOWN":
                sec = data.get("seconds", app_config.get("intro_countdown_seconds", 5))
                game.start_intro_countdown(sec)
            elif action == "START_GAME":
                game.start_game()
            elif action == "NEXT_QUESTION":
                game.next_question()
            elif action == "PREV_QUESTION":
                game.prev_question()
            elif action == "JUMP_QUESTION":
                game.jump_question(data.get("index", 0))
            elif action == "SUBMIT_ANSWER":
                player = data.get("player") or role
                game.submit_answer(player, data.get("answer", ""))
            elif action == "REVEAL_ANSWERS":
                target = data.get("target", "all")
                game.reveal_answers(target)
            elif action == "JUDGE_COUPLE":
                match = data.get("match", False)
                points = data.get("points", 1)
                game.judge_couple(match, points)
            elif action == "SHOW_SCOREBOARD":
                game.show_scoreboard()
            elif action == "SHOW_RECAP":
                game.show_recap()
            elif action == "SHOW_QUESTION":
                game.show_question()
            elif action == "SHOW_ANSWERS":
                game.show_answers()
            elif action == "SHOW_FINAL":
                game.finish_game()
            elif action == "RESET_GAME":
                game.reset_all()
                manager.sync_game_connections()
            elif action == "SET_NAME":
                player = data.get("player") or role
                if player in game.players:
                    game.players[player]["name"] = data.get("name", game.players[player]["name"])
            elif action == "TIMER_CONTROL":
                sub = data.get("subAction")
                if sub == "start" or sub == "resume":
                    game.timer["active"] = True
                elif sub == "pause":
                    game.timer["active"] = False
                elif sub == "reset":
                    game.timer["active"] = False
                    game.timer["remaining"] = game.timer["duration"]
                elif sub == "add15":
                    game.timer["remaining"] += 15
            elif action == "PLAY_SOUND":
                game.sound_event = {"name": data.get("sound"), "timestamp": time.time()}
            
            await manager.broadcast_state()

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast_state()
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)
        await manager.broadcast_state()

# Serve static frontend if built in production
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    ip = get_local_ip()
    print("=" * 60)
    print(f"  AKQuiz Backend Server Started")
    print(f"  Local Access:      http://localhost:8000")
    print(f"  LAN Access:        http://{ip}:8000")
    print("=" * 60)
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
