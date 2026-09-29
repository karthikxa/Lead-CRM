import json
from scrapling.fetchers import StealthyFetcher
from scrapling import Selector

localities = ["Guindy", "Velachery", "Tambaram", "Adyar", "Porur"]

for loc in localities:
    url = f"https://www.justdial.com/Chennai/Dentists-in-{loc}"
    print(f"\n==================== {loc} ====================")
    try:
        page = StealthyFetcher.fetch(url, headless=True, timeout=20000, network_idle=False)
        sel = Selector(page.html_content)
        items = []
        for s in sel.css('script[type="application/ld+json"]::text').getall():
            try:
                d = json.loads(s)
                if isinstance(d, dict) and d.get('@type') == 'ItemList':
                    items = d.get('itemListElement', [])
                    break
            except: pass
        print(f"Found {len(items)} clinics in {loc}:")
        for it in items[:6]:
            print(f"  * {it.get('name')} -> {it.get('url')}")
    except Exception as e:
        print(f"Error for {loc}: {e}")
