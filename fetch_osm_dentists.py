import urllib.request
import json
import ssl

query = """[out:json][timeout:90];
(
  node["amenity"="dentist"](12.75,79.95,13.30,80.35);
  way["amenity"="dentist"](12.75,79.95,13.30,80.35);
  node["healthcare"="dentist"](12.75,79.95,13.30,80.35);
  way["healthcare"="dentist"](12.75,79.95,13.30,80.35);
  node["healthcare:speciality"="dental"](12.75,79.95,13.30,80.35);
  node["name"~"Dental|Dentist",i](12.75,79.95,13.30,80.35);
  way["name"~"Dental|Dentist",i](12.75,79.95,13.30,80.35);
);
out center body;
"""

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

mirrors = [
    'http://overpass-api.de/api/interpreter',
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
]

data = None
for url in mirrors:
    try:
        print(f"Trying Overpass mirror: {url}...")
        req = urllib.request.Request(url, data=query.encode('utf-8'), headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, context=ctx, timeout=60) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            elements = data.get('elements', [])
            print(f"Success from {url}! Found {len(elements)} dental elements.")
            with open('zed/data/osm_raw_dentists.json', 'w', encoding='utf-8') as f:
                json.dump(elements, f, indent=2)
            break
    except Exception as e:
        print(f"Mirror {url} failed: {e}")

if not data:
    print("Could not query Overpass mirrors.")
