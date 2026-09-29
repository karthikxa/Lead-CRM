import json
from scrapling.fetchers import Fetcher
from scrapling import Selector

categories = [
    ("Dentists", "https://www.justdial.com/Chennai/Dentists/nct-10156331"),
    ("Dental Clinics", "https://www.justdial.com/Chennai/Dental-Clinics/nct-10156036"),
    ("Dental Surgeons", "https://www.justdial.com/Chennai/Dental-Surgeons/nct-10156429"),
    ("Orthodontist Doctors", "https://www.justdial.com/Chennai/Orthodontist-Doctors/nct-10344558"),
    ("Dental Hospitals", "https://www.justdial.com/Chennai/Dental-Hospitals/nct-10156165")
]

print("Testing categories for Anna Nagar:")
for cat_name, base_url in categories:
    url = f"{base_url}?area=Anna+Nagar&page=1"
    resp = Fetcher.get(url, impersonate="chrome")
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
    print(f"  {cat_name:22s}: {len(items):2d} items | Status: {resp.status}")
    if items:
        for it in items[:3]:
            print(f"     -> {it.get('name')}")
