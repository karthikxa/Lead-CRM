import json
from scrapling.fetchers import Fetcher
from scrapling import Selector

url = "https://www.justdial.com/Chennai/Dentists/nct-10156331/page-2"
print(f"Fetching {url}...")
resp = Fetcher.get(url, impersonate="chrome")
print(f"Status: {resp.status}, HTML length: {len(resp.html_content)}")

sel = Selector(resp.html_content)
for s in sel.css('script[type="application/ld+json"]::text').getall():
    try:
        d = json.loads(s)
        if isinstance(d, dict) and d.get('@type') == 'ItemList':
            items = d.get('itemListElement', [])
            print(f"Page 2 items count: {len(items)}")
            for it in items[:10]:
                print(f"  {it.get('position')}: {it.get('name')}")
    except Exception as e:
        pass
