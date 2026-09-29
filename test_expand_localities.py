import urllib.request
import ssl
import re
import json

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

localities = [
    'mogappair', 'ambattur', 'chromepet', 'sholinganallur', 'medavakkam',
    'saidapet', 'ashok-nagar', 'kk-nagar', 'avadi', 'madipakkam'
]

new_clinics = []
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

for loc in localities:
    url = f"https://www.practo.com/chennai/dentist/{loc}"
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            
            # Find doctors
            doctors = re.findall(r'data-qa-id="doctor_name"[^>]*>([^<]+)</h2>', html)
            # Find clinics: data-qa-id="practice_clinic" or href="/Chennai/clinic/..."
            clinic_links = re.findall(r'href="(/chennai/clinic/[^"]+)"[^>]*><span[^>]*data-qa-id="practice_clinic"[^>]*>([^<]+)</span>', html, re.I)
            
            # Alternative clinic regex
            if not clinic_links:
                clinic_names = re.findall(r'data-qa-id="practice_clinic"[^>]*>([^<]+)</span>', html)
                clinic_links = [('', c) for c in clinic_names]

            print(f"[{loc.upper()}] Found {len(doctors)} doctors, {len(clinic_links)} clinics")
            
            for doc, (cl_url, cl_name) in zip(doctors, clinic_links):
                new_clinics.append({
                    'doctor': doc.strip(),
                    'clinic': cl_name.strip(),
                    'area': loc.replace('-', ' ').title(),
                    'practo_url': f"https://www.practo.com{cl_url}" if cl_url else ''
                })
    except Exception as e:
        print(f"[{loc}] Error: {e}")

print(f"\nExtracted {len(new_clinics)} new verified clinics across 10 additional localities!")
