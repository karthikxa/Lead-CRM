import urllib.request
import ssl
import re
import json

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = 'https://www.practo.com/chennai/dentist/anna-nagar'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})

with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

# Check JSON-LD
scripts = re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.DOTALL)
print(f"Total ld+json scripts: {len(scripts)}")
for s in scripts:
    try:
        data = json.loads(s)
        if isinstance(data, dict):
            if '@type' in data or 'itemListElement' in data:
                print("Found structured object:", data.get('@type'))
                if 'itemListElement' in data:
                    print(f"Items in list: {len(data['itemListElement'])}")
                    for item in data['itemListElement'][:3]:
                        print("  Item:", item.get('name'), item.get('url'))
    except:
        pass

# Check regex for clinic names & addresses
doctors = re.findall(r'data-qa-id="doctor_name"[^>]*>([^<]+)</h2>', html)
clinics = re.findall(r'data-qa-id="clinic_name"[^>]*>([^<]+)</span>', html)
locations = re.findall(r'data-qa-id="practice_locality"[^>]*>([^<]+)</span>', html)

print(f"Found {len(doctors)} doctors, {len(clinics)} clinics, {len(locations)} locations.")
for d, c, l in zip(doctors[:5], clinics[:5], locations[:5]):
    print(f"  Dr: {d.strip()} | Clinic: {c.strip()} | Loc: {l.strip()}")
