import json
from scrapling.fetchers import Fetcher
from scrapling import Selector

url = "https://www.justdial.com/Chennai/Absolute-Dental-Clinic-Next-Harrisons-Hotel-Nungambakkam/044PXX44-XX44-101103200150-R1B9_BZDET"
print(f"Fetching {url}...")
resp = Fetcher.get(url, impersonate="chrome")
print(f"Status: {resp.status}, HTML length: {len(resp.html_content)}")

sel = Selector(resp.html_content)
for i, s in enumerate(sel.css('script[type="application/ld+json"]::text').getall()):
    try:
        d = json.loads(s)
        if isinstance(d, dict):
            print(f"\n--- Schema {i+1}: {d.get('@type')} ---")
            for k in ['name', 'telephone', 'address', 'url', 'aggregateRating', 'priceRange']:
                if k in d:
                    print(f"  {k}: {d[k]}")
    except Exception as e:
        print(f"Error: {e}")
