import sys
import os
import json
import csv
import time
import random
import re
import shutil

sys.stdout.reconfigure(encoding='utf-8')

from scrapling.fetchers import Fetcher
from scrapling import Selector

# Paths
WORKSPACE_DATA_DIR = r"c:\Users\balur\Downloads\CRM Agency\zed\data"
CSV_PATH = os.path.join(WORKSPACE_DATA_DIR, "chennai_all_dentists_complete.csv")
JSON_PATH = os.path.join(WORKSPACE_DATA_DIR, "chennai_all_dentists_complete.json")

ARTIFACT_DIR = r"C:\Users\balur\.gemini\antigravity-ide\brain\f08b10bf-1021-4e79-9ccc-e6be131f1578"
ARTIFACT_CSV = os.path.join(ARTIFACT_DIR, "chennai_all_dentists_complete.csv")
ARTIFACT_JSON = os.path.join(ARTIFACT_DIR, "chennai_all_dentists_complete.json")

# Complete Chennai Localities Matrix (Central, South, West, North, Suburbs & Perimeters)
CHENNAI_LOCALITIES = [
    # Core & Central
    "Anna Nagar", "T Nagar", "Nungambakkam", "Guindy", "Mylapore", "Alwarpet", "Egmore",
    "Kilpauk", "Chetpet", "Purasawalkam", "Vepery", "Royapettah", "Gopalapuram", "Triplicane",
    "Thousand Lights", "Mount Road", "Teynampet", "Saidapet", "West Mambalam", "Kodambakkam",
    "Vadapalani", "Ashok Nagar", "KK Nagar", "Ekkatuthangal", "Shenoy Nagar", "Aminjikarai",
    "Arumbakkam", "Koyambedu", "Mogappair", "Choolaimedu", "Perambur", "Vyasarpadi",
    "Kolathur", "Madhavaram", "George Town", "Parrys", "Sowcarpet", "Royapuram", "Tondiarpet",
    "Washermanpet",

    # South, Coastal ECR & IT Corridor OMR
    "Adyar", "Besant Nagar", "Thiruvanmiyur", "Kotturpuram", "RA Puram", "Mandaveli",
    "Palavakkam", "Kottivakkam", "Neelankarai", "Injambakkam", "Akkarai", "Sholinganallur",
    "Uthandi", "Kovalam", "Muttukadu", "Velachery", "Madipakkam", "Nanganallur", "Keelkattalai",
    "Kovilambakkam", "Pallikaranai", "Medavakkam", "Perumbakkam", "Sithalapakkam", "Karapakkam",
    "Thoraipakkam", "Navalur", "Siruseri", "Kelambakkam", "Semmancheri", "Padur", "Thalambur",
    "Moolakadai",

    # West, Industrial & Perimeter
    "Porur", "Ramapuram", "Valasaravakkam", "Alwarthirunagar", "Iyyappanthangal", "Kattupakkam",
    "Mangadu", "Kundrathur", "Moulivakkam", "Gerugambakkam", "Poonamallee", "Karayanchavadi",
    "Kumananchavadi", "Thiruverkadu", "Nemam", "Sriperumbudur", "Ambattur", "Padi", "Korattur",
    "Nolambur", "Ayapakkam", "Pattaravakkam", "Avadi", "Pattabiram", "Thirumullaivoyal",
    "Red Hills", "Puzhal", "Surapet", "Padianallur", "Vadaperumbakkam", "Minjur", "Ponneri",
    "Ennore", "Manali",

    # Southern Suburbs & Chengalpattu Corridor
    "Meenambakkam", "Pallavaram", "Chromepet", "Hasthinapuram", "Tambaram", "Tambaram East",
    "Tambaram West", "Tambaram Sanatorium", "Selaiyur", "Camp Road", "Rajakilpakkam",
    "Sembakkam", "Gowrivakkam", "Chitlapakkam", "Perungalathur", "Peerkankaranai", "Vandalur",
    "Urapakkam", "Guduvanchery", "Potheri", "Kattankulathur", "Maraimalai Nagar",
    "Singaperumal Koil", "Chengalpattu"
]

def load_existing():
    records = []
    seen_keys = set()
    if os.path.exists(JSON_PATH):
        try:
            with open(JSON_PATH, "r", encoding="utf-8") as f:
                records = json.load(f)
                for r in records:
                    key = r.get("name", "").strip().lower()
                    if key:
                        seen_keys.add(key)
        except Exception as e:
            print(f"Error loading existing records: {e}")
    print(f"Loaded {len(records)} existing verified records.")
    return records, seen_keys

def save_records(records):
    os.makedirs(WORKSPACE_DATA_DIR, exist_ok=True)
    # Save JSON
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)
    # Save CSV
    fieldnames = [
        "name", "doctor_name", "phone", "email", "has_website", "website",
        "building", "street", "locality", "pincode", "city", "rating",
        "reviews_count", "yoe", "source_url"
    ]
    with open(CSV_PATH, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in records:
            writer.writerow({
                "name": r.get("name", ""),
                "doctor_name": r.get("doctor_name", ""),
                "phone": r.get("phone", ""),
                "email": r.get("email", ""),
                "has_website": r.get("has_website", False),
                "website": r.get("website", ""),
                "building": r.get("building", ""),
                "street": r.get("street", ""),
                "locality": r.get("locality", ""),
                "pincode": r.get("pincode", ""),
                "city": r.get("city", "Chennai"),
                "rating": r.get("rating", ""),
                "reviews_count": r.get("reviews_count", ""),
                "yoe": r.get("yoe", ""),
                "source_url": r.get("source_url", "")
            })
            
    # Mirror to artifacts directory
    try:
        shutil.copyfile(CSV_PATH, ARTIFACT_CSV)
        shutil.copyfile(JSON_PATH, ARTIFACT_JSON)
    except Exception as e:
        print(f"Artifact mirror error: {e}")

def extract_clinic_detail(detail_url):
    try:
        resp = Fetcher.get(detail_url, impersonate="chrome", timeout=12)
        if resp.status != 200:
            return None
        sel = Selector(resp.html_content)
        raw = sel.css('script#__NEXT_DATA__::text').get()
        if not raw:
            return None
        data = json.loads(raw)
        res = data.get('props', {}).get('pageProps', {}).get('results', {}).get('results', {})
        if not isinstance(res, dict) or not res.get('name'):
            return None
            
        # Parse Phone (WhatsApp/Direct)
        phone = ""
        msg_num = res.get('msg_num', '')
        if msg_num:
            try:
                msg_dict = json.loads(msg_num)
                wup = msg_dict.get('wup', [])
                if wup and isinstance(wup, list):
                    phone = str(wup[0]).strip()
            except:
                pass
        if not phone:
            phone = str(res.get('mobile') or res.get('contact') or res.get('VNumber') or '').strip()
            
        # Website cleanup
        website = str(res.get('website') or '').strip()
        has_website = False
        if website and not any(d in website.lower() for d in ['justdial', 'facebook', 'instagram', 'twitter', 'youtube']):
            has_website = True
            if not website.startswith('http'):
                website = f"https://{website}"
        else:
            website = ""
            
        return {
            "name": str(res.get('name') or '').strip(),
            "doctor_name": str(res.get('contactperson') or '').strip(),
            "phone": phone,
            "email": str(res.get('email') or '').strip(),
            "has_website": has_website,
            "website": website,
            "building": str(res.get('building') or '').strip(),
            "street": str(res.get('street') or '').strip(),
            "locality": str(res.get('area') or '').strip(),
            "pincode": str(res.get('pincode') or '').strip(),
            "city": str(res.get('city') or 'Chennai').strip(),
            "rating": str(res.get('rating') or '').strip(),
            "reviews_count": str(res.get('totalReviews') or '').strip(),
            "yoe": str(res.get('YOE') or '').strip(),
            "source_url": detail_url
        }
    except Exception as e:
        return None

def run_matrix_crawler(max_localities=None, max_pages_per_loc=2):
    records, seen_names = load_existing()
    initial_count = len(records)
    
    localities = CHENNAI_LOCALITIES[:max_localities] if max_localities else CHENNAI_LOCALITIES
    print(f"Starting Matrix Crawl across {len(localities)} Chennai localities...")
    print(f"Max pages per locality: {max_pages_per_loc}")
    
    new_found = 0
    
    for loc_idx, loc in enumerate(localities, 1):
        print(f"\n[{loc_idx}/{len(localities)}] Scanning zone: {loc}...")
        loc_added = 0
        
        for page in range(1, max_pages_per_loc + 1):
            url = f"https://www.justdial.com/Chennai/Dentists/nct-10156331?area={loc.replace(' ', '+')}"
            if page > 1:
                url += f"&page={page}"
                
            try:
                resp = Fetcher.get(url, impersonate="chrome", timeout=12)
                if resp.status != 200:
                    continue
                    
                sel = Selector(resp.html_content)
                items = []
                for s in sel.css('script[type="application/ld+json"]::text').getall():
                    try:
                        d = json.loads(s)
                        if isinstance(d, dict) and d.get('@type') == 'ItemList':
                            items = d.get('itemListElement', [])
                            break
                    except:
                        pass
                        
                if not items:
                    break
                    
                for it in items:
                    clinic_name = it.get('name', '').strip()
                    clinic_url = it.get('url', '').strip()
                    clean_key = clinic_name.lower()
                    
                    if not clean_key or clean_key in seen_names or not clinic_url:
                        continue
                        
                    # Fetch clinic detail
                    detail = extract_clinic_detail(clinic_url)
                    if detail:
                        seen_names.add(clean_key)
                        # If locality was missing in res, fill from search area
                        if not detail["locality"]:
                            detail["locality"] = loc
                        records.append(detail)
                        loc_added += 1
                        new_found += 1
                        sys.stdout.write(f"\r   + [{loc}] Added: {detail['name'][:35]} | Ph: {detail['phone'] or 'N/A'} | Web: {'Yes' if detail['has_website'] else 'No'} (Total: {len(records)})")
                        sys.stdout.flush()
                        
                    time.sleep(random.uniform(0.4, 0.9))
                    
            except Exception as e:
                print(f"   Error fetching {loc} page {page}: {e}")
                
            time.sleep(random.uniform(0.6, 1.2))
            
        print(f"\n   -> Zone {loc} complete: {loc_added} new clinics added.")
        save_records(records)
        
    print(f"\n=======================================================")
    print(f"Crawl Complete!")
    print(f"Initial Records: {initial_count}")
    print(f"New Extracted:   {new_found}")
    print(f"Total Database:  {len(records)} Dental Clinics")
    
    with_web = sum(1 for r in records if r.get('has_website'))
    without_web = len(records) - with_web
    print(f"With Website:    {with_web} ({with_web/len(records)*100:.1f}%)")
    print(f"Without Website: {without_web} ({without_web/len(records)*100:.1f}%)")
    print(f"Saved to: {CSV_PATH}")
    print(f"Saved to: {JSON_PATH}")

if __name__ == "__main__":
    max_loc = int(sys.argv[1]) if len(sys.argv) > 1 else None
    pages = int(sys.argv[2]) if len(sys.argv) > 2 else 2
    run_matrix_crawler(max_localities=max_loc, max_pages_per_loc=pages)
