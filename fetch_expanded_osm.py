import urllib.request
import json
import ssl

# Broader query capturing:
# 1. amenity=dentist
# 2. healthcare=dentist
# 3. healthcare:speciality=dental / orthodontics / oral_surgery
# 4. Any amenity=clinic / hospital / doctors with dental in name
# 5. Any shop / office with dental in name

query = """[out:json][timeout:90];
(
  node["amenity"="dentist"](12.70,79.90,13.40,80.40);
  way["amenity"="dentist"](12.70,79.90,13.40,80.40);
  node["healthcare"="dentist"](12.70,79.90,13.40,80.40);
  way["healthcare"="dentist"](12.70,79.90,13.40,80.40);
  node["healthcare:speciality"="dental"](12.70,79.90,13.40,80.40);
  way["healthcare:speciality"="dental"](12.70,79.90,13.40,80.40);
  node["name"~"dental|dentist|tooth|teeth|ortho|smile",i](12.70,79.90,13.40,80.40);
  way["name"~"dental|dentist|tooth|teeth|ortho|smile",i](12.70,79.90,13.40,80.40);
);
out center body;
"""

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = 'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
try:
    print("Fetching expanded dental dataset across entire Chennai Metro & Rural perimeter...")
    req = urllib.request.Request(url, data=query.encode('utf-8'), headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, context=ctx, timeout=90) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        elements = data.get('elements', [])
        print(f"Success! Found {len(elements)} dental places across greater Chennai.")
        with open('zed/data/osm_expanded_dentists.json', 'w', encoding='utf-8') as f:
            json.dump(elements, f, indent=2)
except Exception as e:
    print(f"Error: {e}")
