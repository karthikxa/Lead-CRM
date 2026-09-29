import re
from scrapling import Selector

with open("test_page.html", "r", encoding="utf-8") as f:
    html = f.read()

sel = Selector(html)
cards = sel.css('div[class*="resultbox"]')
print(f"Total cards: {len(cards)}")

results = []
for i, c in enumerate(cards):
    texts = [t.strip() for t in c.css('::text').getall() if t.strip()]
    full_text = " ".join(texts)
    
    # Title
    title = c.css('.resultbox_title_anchor::text, .resultbox_title a::text, .font22::text').get('').strip()
    if not title and texts:
        # First non-rating text
        for t in texts:
            if not re.match(r'^\d+(\.\d+)?$', t) and "Rating" not in t and "More" not in t and t != "+":
                title = t
                break
                
    # Rating & Reviews
    rating = ""
    rating_match = re.search(r'\b([1-5]\.\d)\b', full_text)
    if rating_match:
        rating = rating_match.group(1)
        
    reviews = ""
    reviews_match = re.search(r'(\d+)\s+Ratings?', full_text)
    if reviews_match:
        reviews = reviews_match.group(1)
        
    # Phone number
    phone = ""
    phone_match = re.search(r'\b(0?[6-9]\d{9}|08\d{9}|044\d{7,8})\b', full_text)
    if phone_match:
        phone = phone_match.group(1)
        
    # Address / Locality
    address = ""
    for t in texts:
        if "Chennai" in t:
            address = t
            break
            
    # Detail link
    links = [a for a in c.css('a::attr(href)').getall() if "/Chennai/" in a and "BZDET" in a]
    detail_url = f"https://www.justdial.com{links[0]}" if links else ""
    
    results.append({
        "name": title,
        "phone": phone,
        "rating": rating,
        "reviews": reviews,
        "address": address,
        "detail_url": detail_url
    })

for idx, r in enumerate(results[:10]):
    print(f"\n[{idx+1}] {r['name']}")
    print(f"    Rating: {r['rating']} ({r['reviews']} reviews)")
    print(f"    Phone: {r['phone'] or 'Not visible on listing'}")
    print(f"    Address: {r['address']}")
    print(f"    Link: {r['detail_url'][:80]}...")
