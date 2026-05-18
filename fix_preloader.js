const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\HP\\Desktop\\ITA\\Finalisé\\Site Pharma du Port';

const styleToInject = `
    <!-- Anti-FOUC Inline Styles -->
    <style>
        body.loading { overflow: hidden; }
        #site-preloader {
            position: fixed; top: 0; left: 0;
            width: 100%; height: 100%;
            background-color: #FFFFFF;
            display: flex; justify-content: center; align-items: center;
            z-index: 9999; transition: opacity 0.3s ease, visibility 0.3s;
        }
        #site-preloader.fade-out { opacity: 0; visibility: hidden; pointer-events: none; }
        .loader-spinner {
            width: 50px; height: 50px;
            border: 4px solid #E3F2FD; border-top: 4px solid #1E8E3E;
            border-radius: 50%; animation: spin 1s linear infinite;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .material-symbols-rounded { color: transparent !important; }
        body:not(.loading) .material-symbols-rounded { color: inherit !important; }
    </style>`;

const oldFont = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block';
const newFont = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,1,0&display=block';

const files = fs.readdirSync(dir);
files.forEach(file => {
    if (file.endsWith('.html')) {
        let content = fs.readFileSync(path.join(dir, file), 'utf8');
        let modified = false;

        // Replace font
        if (content.includes(oldFont)) {
            content = content.replace(oldFont, newFont);
            modified = true;
        }

        // Inject styles if not present
        if (!content.includes('Anti-FOUC Inline Styles')) {
            // Find </head>
            content = content.replace('</head>', styleToInject + '\n</head>');
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(path.join(dir, file), content, 'utf8');
            console.log(`Updated ${file}`);
        }
    }
});
