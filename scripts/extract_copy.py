import os
import json

def main():
    templates_dir = "data/templates"
    output = []
    
    for root, dirs, files in os.walk(templates_dir):
        for file in files:
            if file.endswith(".json"):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    
                    output.append({
                        "file": os.path.relpath(filepath, templates_dir),
                        "slug": data.get("slug"),
                        "h1": data.get("h1"),
                        "intro": data.get("intro"),
                        "features": data.get("features", []),
                        "faq": data.get("faq", [])
                    })
                except Exception as e:
                    print(f"Error reading {filepath}: {e}")
                    
    # Also read data/systems/
    systems_dir = "data/systems"
    for root, dirs, files in os.walk(systems_dir):
        for file in files:
            if file.endswith(".json"):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    output.append({
                        "file": "systems/" + os.path.relpath(filepath, systems_dir),
                        "slug": data.get("slug"),
                        "h1": data.get("h1"),
                        "intro": data.get("intro"),
                        "faq": data.get("faq", [])
                    })
                except Exception as e:
                    print(f"Error reading {filepath}: {e}")

    with open("extracted_copy.json", "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print("Done! Extracted content to extracted_copy.json")

if __name__ == "__main__":
    main()
