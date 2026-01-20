import requests
import json
import sys

url = "http://localhost:8001/api/import"
file_path = "tests/panoil.jpg"

try:
    print(f"Testing API at {url} with {file_path}")
    with open(file_path, "rb") as f:
        files = {"file": f}
        response = requests.post(url, files=files)
    
    if response.status_code == 200:
        data = response.json()
        print("Success!")
        print(json.dumps(data["features_extracted"], indent=2))
        
        # Validation checks
        feats = data["features_extracted"]
        if not all(isinstance(v, (int, float, str)) for v in feats.values()):
            print("ERROR: features_extracted contains non-primitive values!")
            sys.exit(1)
        
        if "lines" not in feats or "corners" not in feats:
            print("ERROR: New features (lines, corners) missing!")
            sys.exit(1)
            
        print("Validation Passed: Response is safe for React.")
    else:
        print(f"Failed with status {response.status_code}")
        print(response.text)
        sys.exit(1)

except Exception as e:
    print(f"Test failed: {e}")
    sys.exit(1)
