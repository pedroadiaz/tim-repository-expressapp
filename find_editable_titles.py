import re

file_path = '/Users/pedrodiaz/Documents/GitHub/tim-repository-expressapp/views/reportdetails.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find all lines with editableTitle
lines = content.split('\n')
editable_titles = []
shiny_divs = []

for i, line in enumerate(lines, 1):
    if 'class="editableTitle"' in line:
        editable_titles.append((i, line.strip()))
    if 'class="shiny"' in line or 'shiny"' in line and 'class=' in line:
        shiny_divs.append(i)

print(f"Found {len(editable_titles)} input elements with class='editableTitle':\n")

# Check if each editableTitle is wrapped in shiny
for line_num, line_content in editable_titles:
    # Check if there's a shiny div within 10 lines before this editableTitle
    has_shiny = False
    for shiny_line in shiny_divs:
        if shiny_line < line_num and line_num - shiny_line < 10:
            has_shiny = True
            break
    
    status = "✓ HAS shiny wrapper" if has_shiny else "✗ MISSING shiny wrapper"
    print(f"Line {line_num}: {status}")
    print(f"  {line_content[:100]}...")
    print()

# Summary
with_shiny = sum(1 for line_num, _ in editable_titles if any(s < line_num and line_num - s < 10 for s in shiny_divs))
without_shiny = len(editable_titles) - with_shiny

print(f"\nSUMMARY:")
print(f"Total editableTitle inputs: {len(editable_titles)}")
print(f"With shiny wrapper: {with_shiny}")
print(f"Without shiny wrapper: {without_shiny}")
print(f"\nShiny divs found at lines: {shiny_divs[:10]}{'...' if len(shiny_divs) > 10 else ''}")