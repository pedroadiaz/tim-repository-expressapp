#!/usr/bin/env python3
import re

def find_editable_titles():
    with open('/Users/pedrodiaz/Documents/GitHub/tim-repository-expressapp/views/reportdetails.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.split('\n')
    results = []
    shiny_stack = []  # Track opening shiny divs
    
    for i, line in enumerate(lines, 1):
        # Track shiny divs
        if 'class="shiny' in line and '<div' in line:
            shiny_stack.append(i)
        elif '</div>' in line and shiny_stack:
            # Check if this closes a shiny div
            shiny_stack.pop()
        
        # Find editableTitle
        if 'class="editableTitle"' in line:
            # Check if currently inside a shiny div
            in_shiny = len(shiny_stack) > 0
            results.append({
                'line': i,
                'content': line.strip(),
                'in_shiny': in_shiny
            })
    
    return results

# Run the search
results = find_editable_titles()

print(f"Found {len(results)} input elements with class='editableTitle':\n")

for r in results:
    status = "✓ HAS shiny wrapper" if r['in_shiny'] else "✗ MISSING shiny wrapper"
    print(f"Line {r['line']}: {status}")
    print(f"  {r['content'][:100]}...")
    print()

# Summary
with_shiny = sum(1 for r in results if r['in_shiny'])
without_shiny = len(results) - with_shiny

print(f"\nSUMMARY:")
print(f"Total editableTitle inputs: {len(results)}")
print(f"With shiny wrapper: {with_shiny}")
print(f"Without shiny wrapper: {without_shiny}")

if without_shiny > 0:
    print(f"\n⚠️  {without_shiny} editableTitle elements need shiny wrappers!")
else:
    print("\n✓ All editableTitle elements have shiny wrappers!")