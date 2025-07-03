#!/usr/bin/env python3
import re

def find_editable_titles(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all lines with editableTitle
    editable_title_pattern = r'<input[^>]*class="editableTitle"[^>]*>'
    matches = []
    
    lines = content.split('\n')
    for i, line in enumerate(lines, 1):
        if 'class="editableTitle"' in line:
            # Check if wrapped in shiny div
            # Look for shiny div in previous lines (up to 5 lines back)
            has_shiny = False
            for j in range(max(0, i-6), i):
                if j < len(lines) and 'class="shiny"' in lines[j]:
                    has_shiny = True
                    break
            
            matches.append({
                'line_number': i,
                'line': line.strip(),
                'has_shiny': has_shiny
            })
    
    return matches

# Search for editableTitle elements
results = find_editable_titles('/Users/pedrodiaz/Documents/GitHub/tim-repository-expressapp/views/reportdetails.html')

print(f"Found {len(results)} input elements with class='editableTitle':\n")

for result in results:
    status = "✓ HAS shiny wrapper" if result['has_shiny'] else "✗ MISSING shiny wrapper"
    print(f"Line {result['line_number']}: {status}")
    print(f"  {result['line']}\n")

# Summary
with_shiny = sum(1 for r in results if r['has_shiny'])
without_shiny = sum(1 for r in results if not r['has_shiny'])

print(f"\nSUMMARY:")
print(f"Total editableTitle inputs: {len(results)}")
print(f"With shiny wrapper: {with_shiny}")
print(f"Without shiny wrapper: {without_shiny}")