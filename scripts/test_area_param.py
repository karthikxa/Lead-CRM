import json
from scrapling.fetchers import StealthyFetcher
from scrapling import Selector

areas = ["Anna Nagar", "Guindy", "Velachery", "Tambaram", "Adyar", "Porur"]

for a in areas:
    url = f"https://www.justdial.com/Chennai/Dentists/nct-10156331?area={a.replace(' ', '+')}"
    print(f"\n==================== AREA: {a} ====================")
    page = StealthyFetcher.fetch(url, headless=True, timeout=20000, network_idle=False)
    sel = Selector(page.html_content)
    
    # Check ItemList
    items = []
    for s in sel.css('script[type="application/ld+json"]::text').getall():
        try:
            d = json.loads(s)
            if isinstance(d, dict) and d.get('@type') == 'ItemList':
                items = d.get('itemListElement', [])
                break
        except: pass
        
    print(f"Found {len(items)} clinics for {a}:")
    for it in items[:5]:
        print(f"  * {it.get('name')} -> {it.get('url')}")
