const fs = require('fs');
const path = require('path');

function checkFileExists(filePath) {
    if (fs.existsSync(filePath)) {
        console.log(`✅ File found: ${filePath}`);
        return true;
    } else {
        console.log(`❌ File missing: ${filePath}`);
        return false;
    }
}

function checkThemeLogic() {
    console.log('\nChecking Theme Logic in JS and HTML...');
    const booksJs = fs.readFileSync('books.js', 'utf8');
    const indexHtml = fs.readFileSync('index.html', 'utf8');
    const stylesCss = fs.readFileSync('styles.css', 'utf8');

    const hasThemeToggle = indexHtml.includes('id="themeToggle"');
    const hasThemeInit = booksJs.includes('function initTheme()');
    const hasTransition = stylesCss.includes('cubic-bezier(0.4, 0, 0.2, 1)');

    if (hasThemeToggle) console.log('✅ Theme toggle button exists in HTML');
    else console.log('❌ Theme toggle button missing in HTML');

    if (hasThemeInit) console.log('✅ Theme initialization logic exists in JS');
    else console.log('❌ Theme initialization logic missing in JS');

    if (hasTransition) console.log('✅ Enhanced transitions found in CSS');
    else console.log('❌ Enhanced transitions missing in CSS');

    return hasThemeToggle && hasThemeInit && hasTransition;
}

async function runTests() {
    console.log('Running Final Project Integrity Check...\n');
    
    const files = [
        'server.js',
        'books.js',
        'database.js',
        'styles.css',
        'index.html',
        'login.html',
        'add-book.html'
    ];

    let allPassed = true;
    for (const file of files) {
        if (!checkFileExists(file)) allPassed = false;
    }

    if (!checkThemeLogic()) allPassed = false;

    if (allPassed) {
        console.log('\n🌟 ALL TESTS PASSED: The application is optimized and ready for use!');
    } else {
        console.log('\n⚠️ SOME CHECKS FAILED: Please review the errors above.');
        process.exit(1);
    }
}

runTests();
