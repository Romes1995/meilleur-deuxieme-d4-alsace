from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import urllib.request
import http.cookiejar
import hashlib
import time
import threading
import json
import re
import unicodedata
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Optional
from urllib.parse import quote

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5175"],
    allow_methods=["*"],
    allow_headers=["*"],
)

CP_NO    = 0  # TODO: remplacer par le numéro de compétition D4 Alsace (epreuves.fff.fr)
GROUPS   = list("ABCDEFGHI")
SITE     = "https://epreuves.fff.fr"
API_BASE = f"{SITE}/api/data"
UA       = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"

# ── Session ───────────────────────────────────────────────────
_sess = {"cookie": None, "token": None, "token_url": None}
_req_lock = threading.Lock()


def _init_session() -> bool:
    """Charge la page principale (cookie), extrait le token_url depuis ng-state, puis récupère le token."""
    jar = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))

    # 1. Page principale → analog-session cookie + ng-state avec token_url
    try:
        req = urllib.request.Request(SITE, headers={"User-Agent": UA, "Accept": "text/html"})
        with opener.open(req, timeout=15) as r:
            html = r.read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"  ⚠ init_session page: {e}")
        return False

    # Extraire le token_url depuis ng-state
    token_url = None
    m = re.search(r'<script id="ng-state"[^>]*>(.*?)</script>', html, re.DOTALL)
    if m:
        try:
            state = json.loads(m.group(1))
            for key in state:
                km = re.match(r'analog_/api/app-security-token/(.+)', key)
                if km:
                    token_url = km.group(1)
                    break
        except Exception:
            pass

    if not token_url:
        # Fallback: chercher dans le bundle JS
        try:
            js_req = urllib.request.Request(
                f"{SITE}/assets/index-1fuluZid.js",
                headers={"User-Agent": UA}
            )
            with opener.open(js_req, timeout=15) as r:
                js = r.read().decode("utf-8", errors="replace")
            km = re.search(r'app-security-token/([A-Za-z0-9_-]{8,})', js)
            if km:
                token_url = km.group(1)
        except Exception:
            pass

    if not token_url:
        print("  ⚠ impossible de trouver le token_url")
        return False

    # 2. Récupérer le security token
    try:
        req2 = urllib.request.Request(
            f"{SITE}/api/app-security-token/{token_url}",
            headers={"User-Agent": UA, "Accept": "application/json"}
        )
        with opener.open(req2, timeout=15) as r:
            token = json.loads(r.read())["token"]
    except Exception as e:
        print(f"  ⚠ init_session token: {e}")
        return False

    # 3. Extraire la valeur du cookie analog-session
    cookie_val = next((c.value for c in jar if c.name == "analog-session"), None)
    if not cookie_val:
        print("  ⚠ pas de cookie analog-session")
        return False

    _sess["cookie"]    = cookie_val
    _sess["token"]     = token
    _sess["token_url"] = token_url
    return True


def _x_competition() -> str:
    ts = int(time.time() * 1000) // 10000
    return hashlib.sha1(f"{_sess['token']}-{ts}".encode()).hexdigest()


def _api_get(path: str) -> Optional[dict]:
    """Appel API thread-safe."""
    url = f"{API_BASE}{path}"
    req = urllib.request.Request(url, headers={
        "User-Agent":    UA,
        "Accept":        "application/json",
        "Referer":       f"{SITE}/",
        "Cookie":        f"analog-session={_sess['cookie']}",
        "X-Competition": _x_competition(),
    })
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            data = json.loads(r.read())
            if not data:
                return None
            return data
    except Exception as e:
        print(f"  ⚠ api_get {path[:80]}: {e}")
        return None


# ── Classement ────────────────────────────────────────────────

def _si(v, d=0) -> int:
    try: return int(v)
    except: return d


def fetch_classement(gpNo: int) -> list:
    d = _api_get(f"/classement_journees?cpNo={CP_NO}&phNo=1&gpNo={gpNo}")
    if not d or not d.get("hydra:member"):
        return []
    # Premier élément = journée la plus récente (ordre décroissant)
    latest = d["hydra:member"][0]
    teams = []
    for eq in latest.get("donneesFormatees", []):
        teams.append({
            "pos":  _si(eq.get("placeAffichage", "0")),
            "name": eq.get("nomEquipe", ""),
            "pts":  _si(eq.get("points",         "0")),
            "j":    _si(eq.get("nbMatch",         "0")),
            "g":    _si(eq.get("nbMatchGagne",    "0")),
            "n":    _si(eq.get("nbMatchNul",      "0")),
            "p":    _si(eq.get("nbMatchPe",       "0")) + _si(eq.get("nbMatchFo", "0")),
            "bp":   _si(eq.get("nbButPour",       "0")),
            "bc":   _si(eq.get("nbButContre",     "0")),
            "diff": _si(eq.get("diffBut",         "0")),
            "pen":  _si(eq.get("nbPointPenalite", "0")),
        })
    return sorted(teams, key=lambda t: t["pos"])


# ── Matchs ────────────────────────────────────────────────────

def _fetch_semaines() -> list:
    """Semaines de la saison, filtrées au passé."""
    d = _api_get(f"/competitions/{CP_NO}/semaines?phNo=1&gpNo=1")
    if not d:
        return []
    now = datetime.now(timezone.utc)
    result = []
    for s in d.get("hydra:member", []):
        dd = s.get("dateDebut", "")
        df = s.get("dateFin",   "")
        if not dd:
            continue
        try:
            dt = datetime.fromisoformat(dd)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
        except Exception:
            continue
        if dt <= now:
            result.append({"dateDebut": dd, "dateFin": df})
    return result


def _fetch_matches_week(gpNo: int, sem_idx: int, date_debut: str, date_fin: str):
    """Retourne (sem_idx, liste de matchs joués) pour une semaine."""
    d = _api_get(
        f"/matches?cpNo={CP_NO}&phNo=1&gpNo={gpNo}"
        f"&dateDebut={quote(date_debut)}&dateFin={quote(date_fin)}"
        f"&itemsPerPage=20&pagination=true"
    )
    if not d:
        return sem_idx, []
    matches = []
    for m in d.get("hydra:member", []):
        df = m.get("donneesFormatees", {})
        if not df.get("joue"):   # seulement les matchs joués
            continue
        rec = df.get("recevant", {})
        vis = df.get("visiteur", {})
        home = rec.get("club", {}).get("nom", "")
        away = vis.get("club", {}).get("nom", "")
        if home and away:
            matches.append({
                "home": home,
                "away": away,
                "hg":   int(rec.get("buts", 0)),
                "ag":   int(vis.get("buts", 0)),
            })
    return sem_idx, matches


def fetch_all_matches(gpNo: int, semaines: list) -> list:
    """Récupère tous les matchs d'une poule en parallèle, dans l'ordre chronologique."""
    indexed_results = [None] * len(semaines)

    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = {
            pool.submit(_fetch_matches_week, gpNo, i, s["dateDebut"], s["dateFin"]): i
            for i, s in enumerate(semaines)
        }
        for fut in as_completed(futures):
            idx, matches = fut.result()
            indexed_results[idx] = matches

    # Aplatir dans l'ordre des semaines (aller avant retour)
    all_matches = []
    for matches in indexed_results:
        if matches:
            all_matches.extend(matches)
    return all_matches


# ── Calcul meilleurs 2e ───────────────────────────────────────

def norm(s: str) -> str:
    s = s.lower().strip()
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", "", s)


def compute_second(teams: list, matches: list) -> Optional[dict]:
    if len(teams) < 2:
        return None
    st    = sorted(teams, key=lambda t: t["pos"])
    sec   = st[1]
    top5n = [norm(t["name"]) for t in st[:5]]
    top5  = [t["name"] for t in st[:5]]

    detail = []
    pts = j = win = nul = def_ = bp = bc = 0
    opp_count: dict = {}

    for m in matches:
        is_home = norm(m["home"]) == norm(sec["name"])
        is_away = norm(m["away"]) == norm(sec["name"])
        if not is_home and not is_away:
            continue
        opp  = m["away"] if is_home else m["home"]
        nopp = norm(opp)
        if nopp not in top5n:
            continue
        j += 1
        sg = m["hg"] if is_home else m["ag"]
        og = m["ag"] if is_home else m["hg"]
        bp += sg; bc += og
        if   sg > og: pts += 3; win  += 1; res = "V"
        elif sg == og: pts += 1; nul  += 1; res = "N"
        else:                    def_ += 1; res = "D"
        opp_count[nopp] = opp_count.get(nopp, 0) + 1
        leg = "aller" if opp_count[nopp] == 1 else "retour"
        detail.append({"opp": opp, "sg": sg, "og": og, "res": res, "is_home": is_home, "leg": leg})

    return {
        "name":       sec["name"],
        "pts":        pts,
        "j":          j,
        "win":        win,
        "nul":        nul,
        "def":        def_,
        "bp":         bp,
        "bc":         bc,
        "diff":       bp - bc,
        "total_diff": sec["diff"],
        "total_bp":   sec["bp"],
        "total_pts":  sec["pts"],
        "total_j":    sec["j"],
        "total_g":    sec["g"],
        "total_n":    sec["n"],
        "total_p":    sec["p"],
        "detail":     detail,
        "top5":       top5,
    }


# ── Cache ─────────────────────────────────────────────────────
_cache = {"data": None, "updated_at": None}


# ── Routes ────────────────────────────────────────────────────

@app.get("/api/status")
def status():
    return {
        "updated_at": _cache["updated_at"],
        "has_data":   _cache["data"] is not None,
    }


@app.post("/api/refresh")
def refresh():
    if CP_NO == 0:
        return {"error": "CP_NO non configuré — modifier la variable CP_NO dans backend/main.py"}

    print("\n🔄 Initialisation de la session FFF...")
    if not _init_session():
        return {"error": "Impossible d'initialiser la session FFF"}

    print("✅ Session OK — récupération des semaines...")
    semaines = _fetch_semaines()
    print(f"   {len(semaines)} semaines passées trouvées")

    all_groups = []
    seconds    = []

    for i, grp in enumerate(GROUPS):
        gpNo = i + 1
        print(f"  Poule {grp}...", end=" ", flush=True)

        teams = fetch_classement(gpNo)
        matches = fetch_all_matches(gpNo, semaines)

        s = compute_second(teams, matches)
        group_obj = {
            "group":  grp,
            "teams":  teams,
            "second": {**s, "group": f"Poule {grp}"} if s else None,
        }
        all_groups.append(group_obj)
        if s:
            seconds.append({**s, "group": f"Poule {grp}"})

        print(f"{'OK' if teams else 'ERR'} ({len(teams)} éq, {len(matches)} matchs)")

    seconds.sort(key=lambda s: (
        -s["pts"], -s["diff"], -s["bp"], -s["total_diff"], -s["total_bp"]
    ))

    now = datetime.now().strftime("%d/%m/%Y à %H:%M")
    _cache["data"]       = {"groups": all_groups, "seconds": seconds}
    _cache["updated_at"] = now

    print(f"\n✅ Done — {len(seconds)} deuxièmes calculés\n")
    return {"updated_at": now, "groups": all_groups, "seconds": seconds}


@app.get("/api/data")
def get_data():
    if not _cache["data"]:
        return {"groups": [], "seconds": [], "updated_at": None}
    return {**_cache["data"], "updated_at": _cache["updated_at"]}
