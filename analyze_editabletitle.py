import re

# Read the HTML file
with open('views/reportdetails.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all occurrences of editableTitle with context
pattern = r'(?:.*\n)?.*?(?:class="[^"]*editableTitle[^"]*"|editableTitle).*?(?:\n.*)?'
matches = list(re.finditer(pattern, content, re.MULTILINE))

print(f"Found {len(matches)} occurrences of 'editableTitle'")
print("\n" + "="*80 + "\n")

# For each match, check if it's wrapped in a div with class="shiny"
for i, match in enumerate(matches):
    start = match.start()
    end = match.end()
    
    # Get context before the match (up to 500 chars)
    context_start = max(0, start - 500)
    context_before = content[context_start:start]
    
    # Get the match itself
    match_text = match.group(0).strip()
    
    # Check if there's a div with class="shiny" before this match
    shiny_pattern = r'<div[^>]*class="[^"]*shiny[^"]*"[^>]*>'
    shiny_matches = list(re.finditer(shiny_pattern, context_before))
    
    # Check if the last shiny div is still open (not closed)
    has_shiny = False
    if shiny_matches:
        last_shiny = shiny_matches[-1]
        # Count divs opened and closed after the shiny div
        after_shiny = context_before[last_shiny.end():]
        div_opens = len(re.findall(r'<div[^>]*>', after_shiny))
        div_closes = len(re.findall(r'</div>', after_shiny))
        if div_opens >= div_closes:
            has_shiny = True
    
    print(f"Occurrence {i+1}:")
    print(f"Line content: {match_text}")
    print(f"Has shiny wrapper: {'YES' if has_shiny else 'NO'}")
    
    # Get more context to identify the section
    line_start = content.rfind('\n', 0, start) + 1
    line_end = content.find('\n', end)
    if line_end == -1:
        line_end = len(content)
    
    # Look for nearby text that might indicate the section
    section_context = content[max(0, line_start-200):min(len(content), line_end+200)]
    
    # Extract any placeholder or value from the input
    input_match = re.search(r'placeholder="([^"]*)"', section_context)
    if not input_match:
        input_match = re.search(r'value="([^"]*)"', section_context)
    
    if input_match:
        print(f"Section identifier: {input_match.group(1)}")
    
    print("\n" + "-"*80 + "\n")