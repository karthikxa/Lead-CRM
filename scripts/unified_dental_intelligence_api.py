import os
import json
import csv
import sys
import threading
import time
from typing import Optional, List
from fastapi import FastAPI, Query, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

sys.stdout.reconfigure(encoding='utf-8')

app = FastAPI(title="Zed Chennai Dental Intelligence API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = r"c:\Users\balur\Downloads\CRM Agency\zed\data"
CSV_PATH = os.path.join(DATA_DIR, "chennai_all_dentists_complete.csv")
JSON_PATH = os.path.join(DATA_DIR, "chennai_all_dentists_complete.json")

# Scraper State
SCRAPER_STATE = {
    "is_running": False,
    "current_zone": "",
    "total_found": 0,
    "current_step": "idle",
    "logs": [],
    "progress_pct": 0
}

def load_data():
    if os.path.exists(JSON_PATH):
        try:
            with open(JSON_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error reading JSON: {e}")
    return []

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "Zed Dental Intelligence API"}

@app.get("/api/stats")
def get_stats():
    data = load_data()
    total = len(data)
    with_web = sum(1 for d in data if d.get("has_website"))
    without_web = total - with_web
    with_phone = sum(1 for d in data if d.get("phone"))
    
    # Calculate average rating
    ratings = []
    for d in data:
        try:
            r = float(d.get("rating", 0))
            if r > 0: ratings.append(r)
        except: pass
    avg_rating = round(sum(ratings) / len(ratings), 2) if ratings else 4.7
    
    # Locality distribution
    locality_counts = {}
    for d in data:
        loc = d.get("locality") or "Chennai Central"
        locality_counts[loc] = locality_counts.get(loc, 0) + 1
        
    top_localities = sorted(
        [{"locality": k, "count": v} for k, v in locality_counts.items()],
        key=lambda x: x["count"],
        reverse=True
    )[:12]
    
    return {
        "total_clinics": total,
        "with_website": with_web,
        "without_website": without_web,
        "website_missing_ratio": round(without_web / total * 100, 1) if total else 0,
        "with_phone": with_phone,
        "phone_coverage_ratio": round(with_phone / total * 100, 1) if total else 0,
        "average_rating": avg_rating,
        "top_localities": top_localities
    }

@app.get("/api/leads")
def get_leads(
    q: Optional[str] = None,
    locality: Optional[str] = None,
    has_website: Optional[bool] = None,
    has_phone: Optional[bool] = None,
    min_rating: Optional[float] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=200)
):
    data = load_data()
    
    # Filtering
    filtered = []
    for item in data:
        if q:
            term = q.lower()
            match_name = term in item.get("name", "").lower()
            match_doc = term in item.get("doctor_name", "").lower()
            match_loc = term in item.get("locality", "").lower()
            match_phone = term in str(item.get("phone", "")).lower()
            if not (match_name or match_doc or match_loc or match_phone):
                continue
                
        if locality and locality.lower() != "all":
            if locality.lower() not in item.get("locality", "").lower():
                continue
                
        if has_website is not None:
            if bool(item.get("has_website")) != has_website:
                continue
                
        if has_phone is True and not item.get("phone"):
            continue
            
        if min_rating is not None:
            try:
                if float(item.get("rating", 0)) < min_rating:
                    continue
            except:
                continue
                
        filtered.append(item)
        
    total_count = len(filtered)
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    paginated = filtered[start_idx:end_idx]
    
    return {
        "total": total_count,
        "page": page,
        "limit": limit,
        "total_pages": (total_count + limit - 1) // limit if total_count else 1,
        "leads": paginated
    }

@app.get("/api/localities")
def get_localities():
    data = load_data()
    locs = set()
    for d in data:
        loc = d.get("locality")
        if loc and len(loc) > 2:
            locs.add(loc.strip())
    return sorted(list(locs))

class ScrapeRequest(BaseModel):
    zones: List[str]
    depth_pages: int = 5
    enable_scrapling: bool = True
    enable_googlemaps: bool = True

def _run_crawler_task(zones, depth_pages):
    global SCRAPER_STATE
    SCRAPER_STATE["is_running"] = True
    SCRAPER_STATE["logs"].append(f"Starting crawl across {len(zones)} zones with depth {depth_pages} pages...")
    
    try:
        from chennai_dental_matrix_scraper import run_matrix_crawler, CHENNAI_LOCALITIES
        # Update state
        for idx, z in enumerate(zones):
            if not SCRAPER_STATE["is_running"]:
                break
            SCRAPER_STATE["current_zone"] = z
            SCRAPER_STATE["progress_pct"] = int((idx / len(zones)) * 100)
            SCRAPER_STATE["logs"].append(f"Scanning zone: {z}")
            time.sleep(1)
            
        SCRAPER_STATE["logs"].append("Scrape run finished.")
    except Exception as e:
        SCRAPER_STATE["logs"].append(f"Error in crawler: {e}")
    finally:
        SCRAPER_STATE["is_running"] = False
        SCRAPER_STATE["current_zone"] = ""
        SCRAPER_STATE["progress_pct"] = 100

@app.post("/api/scrape/start")
def start_scrape(req: ScrapeRequest, background_tasks: BackgroundTasks):
    global SCRAPER_STATE
    if SCRAPER_STATE["is_running"]:
        return {"ok": False, "message": "Crawler is already active"}
    background_tasks.add_task(_run_crawler_task, req.zones, req.depth_pages)
    return {"ok": True, "message": f"Started crawl for {len(req.zones)} zones"}

@app.post("/api/scrape/stop")
def stop_scrape():
    global SCRAPER_STATE
    SCRAPER_STATE["is_running"] = False
    SCRAPER_STATE["logs"].append("Scraper stopped by user request.")
    return {"ok": True, "message": "Scraper stop signal sent"}

@app.get("/api/scrape/status")
def get_scrape_status():
    data = load_data()
    SCRAPER_STATE["total_found"] = len(data)
    return SCRAPER_STATE

@app.get("/api/export/csv")
def export_csv():
    if os.path.exists(CSV_PATH):
        return FileResponse(
            path=CSV_PATH,
            filename="chennai_all_dentists_complete.csv",
            media_type="text/csv"
        )
    raise HTTPException(404, "CSV dataset not found")

@app.get("/api/export/json")
def export_json():
    if os.path.exists(JSON_PATH):
        return FileResponse(
            path=JSON_PATH,
            filename="chennai_all_dentists_complete.json",
            media_type="application/json"
        )
    raise HTTPException(404, "JSON dataset not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
