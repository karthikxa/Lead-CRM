import json
import csv
import re
import os

# 1. Load OSM elements
with open('zed/data/osm_expanded_dentists.json', 'r', encoding='utf-8') as f:
    osm_elements = json.load(f)

# 2. Load our previous curated directory listings
with open('zed/data/chennai_dentists_leads.json', 'r', encoding='utf-8') as f:
    curated_list = json.load(f)

def get_locality(lat, lon, tags):
    # Check if suburb or street or city is explicitly mentioned in tags
    suburb = tags.get('addr:suburb') or tags.get('addr:city') or tags.get('addr:street') or ''
    suburb_lower = suburb.lower()
    
    known_areas = [
        'anna nagar', 'guindy', 't. nagar', 't nagar', 'adyar', 'velachery', 'mylapore',
        'kilpauk', 'nungambakkam', 'porur', 'tambaram', 'vadapalani', 'kodambakkam',
        'alwarpet', 'besant nagar', 'chromepet', 'pallavaram', 'ambattur', 'avadi',
        'poonamallee', 'madipakkam', 'perungudi', 'thoraipakkam', 'sholinganallur',
        'navalur', 'siruseri', 'medavakkam', 'pallikaranai', 'selaiyur', 'guduvanchery',
        'vandalur', 'mogappair', 'koyambedu', 'ashok nagar', 'k.k. nagar', 'kk nagar',
        'saidapet', 'thiruvanmiyur', 'egmore', 'triplicane', 'royapettah', 'perambur',
        'kolathur', 'madhavaram', 'tiruvottiyur', 'red hills', 'puzhal', 'kelambakkam',
        'sriperumbudur', 'tiruvallur', 'chengalpattu', 'sowcarpet', 'george town'
    ]
    for a in known_areas:
        if a in suburb_lower:
            return a.title().replace('T. Nagar', 'T. Nagar').replace('T Nagar', 'T. Nagar')
            
    # Check clinic name for area hints
    name_lower = tags.get('name', '').lower()
    for a in known_areas:
        if a in name_lower:
            return a.title().replace('T. Nagar', 'T. Nagar').replace('T Nagar', 'T. Nagar')

    # Geospatial Fallback by Lat / Lon
    if not lat or not lon:
        return "Chennai Metro"
        
    try:
        lat, lon = float(lat), float(lon)
    except:
        return "Chennai Metro"

    # Latitude / Longitude zoning
    if lat > 13.15:
        return "Madhavaram / Red Hills / North Outskirts"
    elif lat > 13.10 and lon < 80.20:
        return "Ambattur / Korattur / Mogappair"
    elif lat > 13.10 and lon >= 80.20:
        return "Perambur / Kolathur / North Chennai"
    elif lat >= 13.07 and lat <= 13.10 and lon >= 80.17 and lon <= 80.23:
        return "Anna Nagar / Kilpauk"
    elif lat >= 13.04 and lat < 13.08 and lon >= 80.22 and lon <= 80.27:
        return "T. Nagar / Nungambakkam"
    elif lat >= 13.02 and lat < 13.06 and lon >= 80.24 and lon <= 80.29:
        return "Mylapore / Alwarpet / Royapettah"
    elif lat >= 13.02 and lat < 13.07 and lon >= 80.17 and lon < 80.22:
        return "Vadapalani / Kodambakkam / Ashok Nagar"
    elif lat >= 13.00 and lat < 13.06 and lon < 80.17:
        return "Porur / Ramapuram / Valasaravakkam"
    elif lat >= 12.98 and lat < 13.02 and lon >= 80.20 and lon <= 80.26:
        return "Guindy / Saidapet / Adyar"
    elif lat >= 12.96 and lat < 13.01 and lon > 80.24:
        return "Adyar / Besant Nagar / Thiruvanmiyur"
    elif lat >= 12.94 and lat < 13.00 and lon >= 80.18 and lon <= 80.23:
        return "Velachery / Madipakkam / Nanganallur"
    elif lat >= 12.84 and lat < 12.97 and lon >= 80.20:
        return "OMR (Perungudi / Thoraipakkam / Sholinganallur / Navalur)"
    elif lat >= 12.84 and lat < 12.97 and lon >= 80.24:
        return "ECR (Palavakkam / Neelankarai / Injambakkam)"
    elif lat >= 12.90 and lat < 12.96 and lon < 80.16:
        return "Pallavaram / Chromepet"
    elif lat >= 12.88 and lat < 12.94 and lon >= 80.11 and lon <= 80.17:
        return "Tambaram (East & West) / Selaiyur"
    elif lat >= 12.80 and lat < 12.88:
        return "Vandalur / Guduvanchery / Potheri (South Outskirts)"
    elif lat < 12.80:
        return "Chengalpattu / Maraimalai Nagar / Rural South"
    elif lon < 80.05:
        return "Sriperumbudur / Tiruvallur / Rural West"
    else:
        return "Chennai Suburbs"

# Deduplicate and build master clinic list
master_clinics = []
seen_names = set()

# First add curated list
for item in curated_list:
    clean_name = re.sub(r'[^a-zA-Z0-9]', '', item['name'].lower())
    if clean_name not in seen_names:
        seen_names.add(clean_name)
        master_clinics.append({
            'name': item['name'],
            'area': item['area'],
            'has_website': item['has_website'],
            'website': item['website'],
            'phone': item.get('phone', 'Available on Directory / Inquiry'),
            'address': item.get('address', item['area'] + ', Chennai'),
            'source': 'Verified Directory Registry'
        })

# Now process OSM elements
for elem in osm_elements:
    tags = elem.get('tags', {})
    name = tags.get('name') or tags.get('operator') or tags.get('brand')
    if not name:
        continue
    
    clean_name = re.sub(r'[^a-zA-Z0-9]', '', name.lower())
    if clean_name in seen_names or len(clean_name) < 3:
        continue
    seen_names.add(clean_name)

    lat = elem.get('lat') or elem.get('center', {}).get('lat')
    lon = elem.get('lon') or elem.get('center', {}).get('lon')

    area = get_locality(lat, lon, tags)
    
    # Check website
    raw_web = tags.get('website') or tags.get('contact:website') or tags.get('url') or ''
    has_web = False
    web_url = 'No Website (Local Clinic Only)'
    if raw_web and '.' in raw_web and not 'facebook.com' in raw_web and not 'instagram.com' in raw_web:
        has_web = True
        web_url = raw_web if raw_web.startswith('http') else 'https://' + raw_web
    
    # Phone
    phone = tags.get('phone') or tags.get('contact:phone') or tags.get('mobile') or 'Available on Local Map'
    
    # Address
    street = tags.get('addr:street', '')
    housenumber = tags.get('addr:housenumber', '')
    postcode = tags.get('addr:postcode', '')
    addr_parts = [p for p in [housenumber, street, area, postcode, 'Chennai'] if p]
    address = ', '.join(addr_parts)

    master_clinics.append({
        'name': name,
        'area': area,
        'has_website': has_web,
        'website': web_url,
        'phone': phone,
        'address': address,
        'source': 'OpenStreetMap Geospatial Census'
    })

print(f"Total Unique Dental Clinics Across Greater Chennai: {len(master_clinics)}")

# Save Master JSON
with open('zed/data/chennai_all_dentists_complete.json', 'w', encoding='utf-8') as f:
    json.dump(master_clinics, f, indent=2)

# Save Master CSV
with open('zed/data/chennai_all_dentists_complete.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow([
        'ID',
        'Clinic Name',
        'Area / Locality / Suburb',
        'Has Website',
        'Website URL / Status',
        'Phone Number',
        'Address / Location',
        'Data Source',
        'Zed Agency Business Opportunity'
    ])
    for idx, c in enumerate(master_clinics, start=1):
        opp = 'High Priority Lead: Pitch Website + Automation (₹5K-₹7K)' if not c['has_website'] else 'Pitch 3D Dynamic Redesign & Automation (₹9.5K-₹13.5K)'
        writer.writerow([
            idx,
            c['name'],
            c['area'],
            'YES' if c['has_website'] else 'NO',
            c['website'],
            c['phone'],
            c['address'],
            c['source'],
            opp
        ])

# Copy to temp artifact directory
import shutil
shutil.copy('zed/data/chennai_all_dentists_complete.csv', 'C:/Users/balur/.gemini/antigravity-ide/brain/f08b10bf-1021-4e79-9ccc-e6be131f1578/chennai_all_dentists_complete.csv')
shutil.copy('zed/data/chennai_all_dentists_complete.json', 'C:/Users/balur/.gemini/antigravity-ide/brain/f08b10bf-1021-4e79-9ccc-e6be131f1578/chennai_all_dentists_complete.json')

# Stats
total = len(master_clinics)
with_web = sum(1 for c in master_clinics if c['has_website'])
without_web = total - with_web

area_counts = {}
for c in master_clinics:
    a = c['area']
    if a not in area_counts:
        area_counts[a] = {'total': 0, 'with': 0, 'without': 0}
    area_counts[a]['total'] += 1
    if c['has_website']:
        area_counts[a]['with'] += 1
    else:
        area_counts[a]['without'] += 1

print("\n=== GREATER CHENNAI COMPLETE DENTAL CENSUS SUMMARY ===")
print(f"Total Dental Clinics Documented: {total}")
print(f"Clinics WITH Website: {with_web} ({with_web/total*100:.1f}%)")
print(f"Clinics WITHOUT Website: {without_web} ({without_web/total*100:.1f}%)")
print("----------------------------------------------------------------------")
print(f"{'Locality / Suburb / Zone':<45} | {'Total':<6} | {'With':<6} | {'Without':<7}")
print("----------------------------------------------------------------------")
for a, s in sorted(area_counts.items(), key=lambda x: -x[1]['total']):
    print(f"{a:<45} | {s['total']:>5} | {s['with']:>5} | {s['without']:>7}")
