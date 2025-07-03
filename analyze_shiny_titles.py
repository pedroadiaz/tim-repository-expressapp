#!/usr/bin/env python3
import re

def analyze_shiny_titles():
    with open('views/reportdetails.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all occurrences of editableTitle
    editable_pattern = r'class="editableTitle"'
    editable_matches = list(re.finditer(editable_pattern, content))
    
    print(f"Total editableTitle elements found: {len(editable_matches)}")
    print("=" * 80)
    
    results = []
    
    for i, match in enumerate(editable_matches):
        # Get line number
        line_num = content[:match.start()].count('\n') + 1
        
        # Get context around the match (500 chars before, 300 after)
        start = max(0, match.start() - 500)
        end = min(len(content), match.end() + 300)
        context = content[start:end]
        
        # Check if wrapped in shiny div by looking backwards
        before_match = content[start:match.start()]
        has_shiny = False
        
        # Look for shiny class before the editableTitle
        shiny_pattern = r'<div[^>]*class="[^"]*shiny[^"]*"'
        shiny_matches = list(re.finditer(shiny_pattern, before_match))
        
        if shiny_matches:
            # Get the last shiny div before this editableTitle
            last_shiny = shiny_matches[-1]
            after_shiny = before_match[last_shiny.end():]
            
            # Count opening and closing divs to see if we're still inside the shiny div
            div_opens = len(re.findall(r'<div[^>]*>', after_shiny))
            div_closes = len(re.findall(r'</div>', after_shiny))
            
            # If there are more or equal opens than closes, we're still inside the shiny div
            if div_opens >= div_closes:
                has_shiny = True
        
        # Extract additional info from the input element
        after_match = content[match.end():end]
        
        # Look for id, value, placeholder attributes
        id_match = re.search(r'id="([^"]*)"', after_match)
        value_match = re.search(r'value="([^"]*)"', after_match)
        placeholder_match = re.search(r'placeholder="([^"]*)"', after_match)
        
        result = {
            'line': line_num,
            'has_shiny': has_shiny,
            'id': id_match.group(1) if id_match else None,
            'value': value_match.group(1) if value_match else None,
            'placeholder': placeholder_match.group(1) if placeholder_match else None
        }
        results.append(result)
        
        # Print detailed info
        print(f"\nOccurrence {i + 1}:")
        print(f"  Line: {line_num}")
        print(f"  Has shiny wrapper: {'YES ✓' if has_shiny else 'NO ✗'}")
        
        identifier = result['id'] or result['value'] or result['placeholder'] or 'Unknown'
        print(f"  Section: {identifier}")
    
    # Summary
    with_shiny = sum(1 for r in results if r['has_shiny'])
    without_shiny = len(results) - with_shiny
    
    print("\n" + "=" * 80)
    print("SUMMARY:")
    print(f"  Total editableTitle inputs: {len(results)}")
    print(f"  With shiny wrapper: {with_shiny}")
    print(f"  Missing shiny wrapper: {without_shiny}")
    
    print("\n" + "=" * 80)
    print("SECTION HEADERS WITH SHINY EFFECT:")
    for r in results:
        if r['has_shiny']:
            desc = r['id'] or r['value'] or r['placeholder'] or f"Line {r['line']}"
            print(f"  ✓ {desc}")
    
    print("\n" + "=" * 80)
    print("SECTION HEADERS MISSING SHINY EFFECT:")
    for r in results:
        if not r['has_shiny']:
            desc = r['id'] or r['value'] or r['placeholder'] or f"Line {r['line']}"
            print(f"  ✗ {desc}")

if __name__ == "__main__":
    analyze_shiny_titles()