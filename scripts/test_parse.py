import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')
from scrapling.fetchers import StealthyFetcher
from scrapling import Selector

url = "https://www.justdial.com/Chennai/Dentists-in-Anna-Nagar"
print(f"Fetching {url}...")
page = StealthyFetcher.fetch(url, headless=True, timeout=25000, network_idle=False)
print(f"Fetched: status={page.status}, len={len(page.html_content)}")

sel = Selector(page.html_content)

# Save html to scratch for inspection
with open("test_page.html", "w", encoding="utf-8") as f:
    f.write(page.html_content)
print("Saved test_page.html")

# Find all cards
# Look for elements containing doctor or clinic names
cards = sel.css('div[class*="resultbox"], section[class*="resultbox"], div.card')
print(f"Cards found with CSS selector: {len(cards)}")

# Check for JSON-LD schema
schemas = sel.css('script[type="application/ld+json"]::text').getall()
print(f"Found {len(schemas)} JSON-LD schemas")
for i, s in enumerate(schemas):
    try:
        data = json.loads(s)
        if isinstance(data, dict):
            print(f"Schema {i+1} @type:", data.get('@type'))
            if 'itemListElement' in data:
                print(f"  Items in list: {len(data['itemListElement'])}")
                sample = data['itemListElement'][0]
                print(f"  Sample item: {sample}")
    except Exception as e:
        pass
