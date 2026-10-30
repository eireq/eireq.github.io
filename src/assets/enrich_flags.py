import json
import re
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

print("Načítavam master_flags.json...")
with open('master_flags.json', 'r', encoding='utf-8') as f:
    flags = json.load(f)

headers = {
    "User-Agent": "FlagDB-Enricher/2.0 (contact@example.com)"
}

def process_single_flag(item):
    name = item.get('name', '')
    svg_url = item.get('svgUrl', '')

    # 1. Extrakcia pomeru strán a hex farieb z SVG
    if svg_url and svg_url.startswith('http'):
        try:
            res = requests.get(svg_url, headers=headers, timeout=4)
            if res.status_code == 200:
                svg_text = res.text

                # Extrakcia hex farieb
                hex_colors = list(set(re.findall(r'#(?:[0-9a-fA-F]{3}){1,2}\b', svg_text)))
                cleaned_colors = [c.upper() for c in hex_colors if c.upper() not in ['#000', '#000000', '#FFF', '#FFFFFF']][:5]
                if cleaned_colors:
                    item['colors'] = [{"hex": c, "meaning": "Oficiálna farba vlajky"} for c in cleaned_colors]

                # Extrakcia presného pomeru strán z viewBox
                viewbox = re.search(r'viewBox=["\']\s*0\s+0\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s*["\']', svg_text)
                if viewbox:
                    w, h = float(viewbox.group(1)), float(viewbox.group(2))
                    if h > 0:
                        val = w / h
                        if abs(val - 2.0) < 0.05: ratio = "1:2"
                        elif abs(val - 1.5) < 0.05: ratio = "2:3"
                        elif abs(val - 1.333) < 0.05: ratio = "3:4"
                        elif abs(val - 1.666) < 0.05: ratio = "3:5"
                        elif abs(val - 1.0) < 0.05: ratio = "1:1"
                        else: ratio = f"{round(w)}:{round(h)}"
                        item['proportions'] = ratio
        except Exception:
            pass

    # 2. Získanie zhrnutia z Wikipédie
    try:
        article_title = name.replace(" ", "_")
        wiki_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{article_title}"
        res = requests.get(wiki_url, headers=headers, timeout=3)
        if res.status_code == 200:
            data = res.json()
            extract = data.get('extract', '')
            if extract:
                item['funFact'] = extract
                item['emblemMeaning'] = f"Prehľad dizajnu: {extract[:150]}..."
    except Exception:
        pass

    return item

print(f"Spúšťam rýchle paralelné spracovanie pre {len(flags)} vlajok...")

# parallel processing of flags using ThreadPoolExecutor
enriched_flags = []
completed_count = 0

with ThreadPoolExecutor(max_workers=20) as executor:
    futures = [executor.submit(process_single_flag, flag) for flag in flags]
    for future in as_completed(futures):
        enriched_flags.append(future.result())
        completed_count += 1
        if completed_count % 50 == 0 or completed_count == len(flags):
            print(f"Spracovaných: {completed_count}/{len(flags)} vlajok...")

# save enriched flags to master_flags.json
with open('master_flags.json', 'w', encoding='utf-8') as f:
    json.dump(enriched_flags, f, indent=2, ensure_ascii=False)

print("\nall flags enriched and saved to master_flags.json.")