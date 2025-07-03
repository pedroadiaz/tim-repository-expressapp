const fs = require('fs');
const path = require('path');

// Read the HTML file
const filePath = path.join(__dirname, 'views', 'reportdetails.html');
const content = fs.readFileSync(filePath, 'utf-8');

// Find all occurrences of editableTitle
const regex = /class="[^"]*editableTitle[^"]*"/g;
let match;
const matches = [];

while ((match = regex.exec(content)) !== null) {
    matches.push({
        index: match.index,
        text: match[0]
    });
}

console.log(`Found ${matches.length} occurrences of 'editableTitle'`);
console.log('\n' + '='.repeat(80) + '\n');

// For each match, check if it's wrapped in a div with class="shiny"
matches.forEach((match, i) => {
    const beforeContext = content.substring(Math.max(0, match.index - 1000), match.index);
    const afterContext = content.substring(match.index, Math.min(content.length, match.index + 500));
    
    // Find the full input element
    const inputMatch = afterContext.match(/^[^>]*>/);
    const fullInput = inputMatch ? match.text + inputMatch[0] : match.text;
    
    // Check for shiny wrapper
    const shinyRegex = /<div[^>]*class="[^"]*shiny[^"]*"[^>]*>/g;
    let shinyMatch;
    let lastShinyIndex = -1;
    
    while ((shinyMatch = shinyRegex.exec(beforeContext)) !== null) {
        lastShinyIndex = shinyMatch.index;
    }
    
    let hasShiny = false;
    if (lastShinyIndex !== -1) {
        // Count divs between shiny and editableTitle
        const betweenContent = beforeContext.substring(lastShinyIndex);
        const divOpens = (betweenContent.match(/<div[^>]*>/g) || []).length;
        const divCloses = (betweenContent.match(/<\/div>/g) || []).length;
        
        if (divOpens > divCloses) {
            hasShiny = true;
        }
    }
    
    // Extract section information
    const placeholderMatch = afterContext.match(/placeholder="([^"]*)"/);
    const valueMatch = afterContext.match(/value="([^"]*)"/);
    const idMatch = afterContext.match(/id="([^"]*)"/);
    
    console.log(`Occurrence ${i + 1}:`);
    console.log(`Has shiny wrapper: ${hasShiny ? 'YES ✓' : 'NO ✗'}`);
    
    if (placeholderMatch) {
        console.log(`Placeholder: "${placeholderMatch[1]}"`);
    }
    if (valueMatch) {
        console.log(`Value: "${valueMatch[1]}"`);
    }
    if (idMatch) {
        console.log(`ID: "${idMatch[1]}"`);
    }
    
    // Get surrounding context to identify section
    const lineStart = content.lastIndexOf('\n', match.index) + 1;
    const lineEnd = content.indexOf('\n', match.index + 100);
    const line = content.substring(lineStart, lineEnd > -1 ? lineEnd : content.length);
    console.log(`Line preview: ${line.substring(0, 100).trim()}...`);
    
    console.log('\n' + '-'.repeat(80) + '\n');
});

// Summary
const withShiny = matches.filter((match, i) => {
    const beforeContext = content.substring(Math.max(0, match.index - 1000), match.index);
    const shinyRegex = /<div[^>]*class="[^"]*shiny[^"]*"[^>]*>/g;
    let shinyMatch;
    let lastShinyIndex = -1;
    
    while ((shinyMatch = shinyRegex.exec(beforeContext)) !== null) {
        lastShinyIndex = shinyMatch.index;
    }
    
    if (lastShinyIndex !== -1) {
        const betweenContent = beforeContext.substring(lastShinyIndex);
        const divOpens = (betweenContent.match(/<div[^>]*>/g) || []).length;
        const divCloses = (betweenContent.match(/<\/div>/g) || []).length;
        return divOpens > divCloses;
    }
    return false;
}).length;

console.log('\nSUMMARY:');
console.log(`Total editableTitle inputs: ${matches.length}`);
console.log(`With shiny wrapper: ${withShiny}`);
console.log(`Missing shiny wrapper: ${matches.length - withShiny}`);