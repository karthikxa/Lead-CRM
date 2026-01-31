
const fs = require('fs');
const path = require('path');

const files = [
    'App.tsx',
    'components/AdminDashboard.tsx',
    'components/TaskSummaryView.tsx',
    'components/LeadAnalytics.tsx',
    'services/leadService.ts' // Check this one too just in case
];

// Helper to clean content
function cleanContent(content) {
    // Pattern: ======= (newline) ... >>>>>>> (newline)
    // We want to REMOVE this block.
    // Note: This assumes `<<<<<<< HEAD` was already removed or didn't exist, 
    // and we want to KEEP what was before `=======`.

    // Use regex with 's' flag (dotall) equivalent [^]*?
    // We search for ======= followed by anything until >>>>>>> line

    // Regex:
    // =======\r?\n[\s\S]*?>>>>>>>.*(\r?\n|$)

    const regex = /=======\r?\n[\s\S]*?>>>>>>>[^\n]*(\r?\n|$)/g;

    if (regex.test(content)) {
        console.log("  Found conflicts!");
        return content.replace(regex, '');
    }
    return content;
}

files.forEach(f => {
    const p = path.resolve(__dirname, f);
    if (fs.existsSync(p)) {
        console.log(`Processing ${f}...`);
        let content = fs.readFileSync(p, 'utf8');
        const newContent = cleanContent(content);
        if (content !== newContent) {
            console.log(`  Fixed ${f}`);
            fs.writeFileSync(p, newContent);
        } else {
            console.log(`  No changes needed for ${f}`);
        }
    } else {
        console.log(`Skipping ${f} (not found)`);
    }
});
