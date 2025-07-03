#!/usr/bin/env python3
import re

def analyze_editable_titles():
    with open('views/reportdetails.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all occurrences of editableTitle
    editable_pattern = r'class="[^"]*editableTitle[^"]*"'
    editable_matches = list(re.finditer(editable_pattern, content))
    
    print(f"Total editableTitle elements found: {len(editable_matches)}")
    print("=" * 80)
    
    results = []
    
    for i, match in enumerate(editable_matches):
        # Get context around the match
        start = max(0, match.start() - 500)
        end = min(len(content), match.end() + 300)
        context = content[start:end]
        
        # Check if wrapped in shiny div
        before_match = content[start:match.start()]
        has_shiny = False
        
        # Look for shiny class before the editableTitle
        shiny_matches = list(re.finditer(r'<div[^>]*class="[^"]*shiny[^"]*"', before_match))
        if shiny_matches:
            # Check if the shiny div is still open
            last_shiny_pos = shiny_matches[-1].end()
            between_content = before_match[last_shiny_pos:]
            
            # Count divs between shiny and editableTitle
            div_opens = len(re.findall(r'<div[^>]*>', between_content))
            div_closes = len(re.findall(r'</div>', between_content))
            
            if div_opens >= div_closes:
                has_shiny = True
        
        # Extract additional info
        after_match = content[match.end():end]
        placeholder = re.search(r'placeholder="([^"]*)"', after_match)
        value = re.search(r'value="([^"]*)"', after_match)
        id_attr = re.search(r'id="([^"]*)"', after_match)
        
        # Get line number
        line_num = content[:match.start()].count('\n') + 1
        
        result = {
            'index': i + 1,
            'line': line_num,
            'has_shiny': has_shiny,
            'placeholder': placeholder.group(1) if placeholder else None,
            'value': value.group(1) if value else None,
            'id': id_attr.group(1) if id_attr else None
        }
        results.append(result)
        
        print(f"\nOccurrence {i + 1}:")
        print(f"  Line: {line_num}")
        print(f"  Has shiny wrapper: {'YES ✓' if has_shiny else 'NO ✗'}")
        if result['id']:
            print(f"  ID: {result['id']}")
        if result['placeholder']:
            print(f"  Placeholder: {result['placeholder']}")
        if result['value']:
            print(f"  Value: {result['value']}")
    
    # Summary
    with_shiny = sum(1 for r in results if r['has_shiny'])
    without_shiny = len(results) - with_shiny
    
    print("\n" + "=" * 80)
    print("SUMMARY:")
    print(f"  Total editableTitle inputs: {len(results)}")
    print(f"  With shiny wrapper: {with_shiny}")
    print(f"  Missing shiny wrapper: {without_shiny}")
    
    print("\n" + "=" * 80)
    print("ELEMENTS MISSING SHINY WRAPPER:")
    for r in results:
        if not r['has_shiny']:
            desc = r['id'] or r['placeholder'] or r['value'] or f"Line {r['line']}"
            print(f"  - {desc}")

if __name__ == "__main__":
    analyze_editable_titles()