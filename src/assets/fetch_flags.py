import json
import re
import requests

SPARQL_URL = "https://query.wikidata.org/sparql"

# Targeted query to avoid response truncation
query = """
SELECT DISTINCT ?item ?itemLabel ?category ?flag ?adoption ?dissolution ?ratio ?designerLabel WHERE {
  {
    ?item wdt:P31 wd:Q6256 . 
    BIND("Country" AS ?category)
  } UNION {
    ?item wdt:P31 wd:Q3024240 . 
    BIND("Historical State" AS ?category)
  } UNION {
    ?item wdt:P31 wd:Q46395 . 
    BIND("Territory" AS ?category)
  }
  
  ?item wdt:P41 ?flag .

  OPTIONAL { ?item wdt:P571 ?adoption . }
  OPTIONAL { ?item wdt:P576 ?dissolution . }
  OPTIONAL { ?item wdt:P2050 ?ratio . }
  OPTIONAL { ?item wdt:P287 ?designer . }

  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 2000
"""

headers = {
    "User-Agent": "FlagDB-Bot/3.0 (contact@example.com)",
    "Accept": "application/sparql-results+json"
}

print("Fetching flag dataset from Wikidata...")
response = requests.get(SPARQL_URL, params={'query': query}, headers=headers)

# Sanitize raw string response to remove control characters before parsing JSON
raw_text = response.text
clean_text = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', raw_text)

try:
    data = json.loads(clean_text)
except json.JSONDecodeError as e:
    print(f"JSON parsing error: {e}")
    print("Response status code:", response.status_code)
    exit(1)

flags_db = []

for entry in data.get('results', {}).get('bindings', []):
    country_name = entry.get('itemLabel', {}).get('value', 'Unknown')
    flag_url = entry.get('flag', {}).get('value', '')
    category = entry.get('category', {}).get('value', 'Territory')
    adoption = entry.get('adoption', {}).get('value', '')[:10] if 'adoption' in entry else None
    cancellation = entry.get('dissolution', {}).get('value', '')[:10] if 'dissolution' in entry else None
    proportions = entry.get('ratio', {}).get('value', '2:3')
    designer = entry.get('designerLabel', {}).get('value', 'Unknown')

    flags_db.append({
        "name": f"Flag of {country_name}",
        "category": category,
        "svgUrl": flag_url,
        "proportions": proportions,
        "colors": [],
        "emblemMeaning": f"Official symbol of {country_name}.",
        "adoptionDate": adoption,
        "cancellationDate": cancellation,
        "designer": designer,
        "funFact": f"Historical or modern flag of {country_name}."
    })

with open('master_flags.json', 'w', encoding='utf-8') as f:
    json.dump(flags_db, f, indent=2, ensure_ascii=False)

print(f"Success! Saved {len(flags_db)} flags into master_flags.json")