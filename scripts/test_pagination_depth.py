import json
from scrapling.fetchers import Fetcher
from scrapling import Selector

print("Testing pagination depth for Anna Nagar:")
for page in [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]:
    url = f"https://www.justdial.com/Chennai/Dentists/nct-10156331?area=Anna+Nagar&page={page}"
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
    first_clinic = items[0].get('name') if items else "None"
    print(f"  Page {page:2d}: {len(items):2d} items | Status: {resp.status} | First: {first_clinic}")
