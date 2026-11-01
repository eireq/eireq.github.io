import json
import re
import requests

print("Loading master_flags.json for cleaning...")
with open('master_flags.json', 'r', encoding='utf-8') as f:
    flags = json.load(f)

print(f"Original entries: {len(flags)}")

cleaned_flags = []
seen_keys = set()

def resolve_wikidata_label(q_id):
    """Fetches real English names for raw Q-IDs like Q98923168."""
    try:
        url = f"https://www.wikidata.org/wiki/Special:EntityData/{q_id}.json"
        res = requests.get(url, timeout=3)
        if res.status_code == 200:
            data = res.json()
            entities = data.get('entities', {})
            if q_id in entities:
                labels = entities[q_id].get('labels', {})
                if 'en' in labels:
                    return labels['en']['value']
    except Exception:
        pass
    return q_id

for item in flags:
    name = item.get('name', '').strip()
    svg_url = item.get('svgUrl', '').strip()
    adoption = item.get('adoptionDate', '')
    
    # 1. Skip invalid entries without SVG flag links
    if not svg_url or not svg_url.startswith('http'):
        continue

    # 2. Fix raw Q-ID placeholders (e.g., "Flag of Q98923168")
    q_match = re.search(r'Q\d+', name)
    if q_match and len(name) < 20:
        q_id = q_match.group(0)
        real_name = resolve_wikidata_label(q_id)
        if real_name != q_id:
            name = f"Flag of {real_name}"

    # 3. Clean up invalid URL dates (e.g., "http://www")
    if adoption and ("http" in str(adoption) or "www" in str(adoption)):
        item['adoptionDate'] = None

    # 4. Deduplicate based on Name + SVG URL
    unique_key = f"{name.lower()}|{svg_url.lower()}"
    if unique_key in seen_keys:
        continue
    seen_keys.add(unique_key)

    # 5. Normalize target fields
    item['name'] = name
    if not item.get('designer') or item['designer'] == 'Unknown':
        item['designer'] = None

    cleaned_flags.append(item)

print(f"Cleaned entries remaining: {len(cleaned_flags)}")

# Overwrite master_flags.json with cleaned dataset
with open('master_flags.json', 'w', encoding='utf-8') as f:
    json.dump(cleaned_flags, f, indent=2, ensure_ascii=False)

print("Saved clean data to master_flags.json!")