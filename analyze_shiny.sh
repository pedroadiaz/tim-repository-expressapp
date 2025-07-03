#!/bin/bash

echo "Analyzing editableTitle elements in reportdetails.html..."
echo "=================================================="

# Count total occurrences
total=$(grep -o 'class="[^"]*editableTitle[^"]*"' views/reportdetails.html | wc -l)
echo "Total editableTitle elements found: $total"
echo ""

# Find line numbers
echo "Line numbers containing editableTitle:"
grep -n 'class="[^"]*editableTitle[^"]*"' views/reportdetails.html | cut -d: -f1

echo ""
echo "Checking for shiny wrappers..."
echo "=================================================="

# Extract sections with editableTitle and check for shiny wrapper
grep -B20 -A5 'class="[^"]*editableTitle[^"]*"' views/reportdetails.html | grep -E '(class="[^"]*shiny[^"]*"|editableTitle|placeholder=|value=|id=)' | head -50