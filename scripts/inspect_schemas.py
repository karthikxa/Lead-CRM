import json
from scrapling import Selector

with open("test_page.html", "r", encoding="utf-8") as f:
    html = f.read()

sel = Selector(html)
for s in sel.css('script[type="application/ld+json"]::text').getall():
    try:
        d = json.loads(s)
        if isinstance(d, dict) and d.get('@type') == 'ItemList':
            items = d.get('itemListElement', [])
            print(f"Total items in ItemList: {len(items)}")
            for item in items[:15]:
                print(item)
    except Exception as e:
        print(e)
