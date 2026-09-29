import json
from scrapling.fetchers import Fetcher
from scrapling import Selector

patterns = [
    "https://www.justdial.com/Chennai/Dentists/Anna-Nagar",
    "https://www.justdial.com/Chennai/Dentists/Anna-Nagar/nct-10156331",
    "https://www.justdial.com/Chennai/Dentists/600040",
    "https://www.justdial.com/Chennai/Dentists/nct-10156331?area=Anna+Nagar",
    "https://www.justdial.com/Chennai/Dentists/nct-10156331?where=Anna+Nagar"
]

for p in patterns:
    resp = Fetcher.get(p, impersonate="chrome")
    sel = Selector(resp.html_content)
    # Check canonical link or first clinic
    canonical = sel.css('link[rel="canonical"]::attr(href)').get()
    title = sel.css('title::text').get()
    raw = sel.css('script#__NEXT_DATA__::text').get()
    data = json.loads(raw) if raw else {}
    props = data.get('props', {}).get('pageProps', {})
    area = props.get('query', {}).get('area')
    print(f"\nURL: {p}")
    print(f"  Status: {resp.status}")
    print(f"  Title: {title}")
    print(f"  Area parsed by Justdial: {area}")
    print(f"  Canonical: {canonical}")
