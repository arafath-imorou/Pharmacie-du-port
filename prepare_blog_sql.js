const fs = require('fs');
const path = require('path');

const articles = [
    { id: 3, file: 'article-paludisme.html', created_at: '2026-04-12', category: 'Santé Publique', author: 'Dr Ghislaine LOKO' },
    { id: 7, file: 'article-immunite.html', created_at: '2026-04-04', category: 'Prévention', author: 'Dr GLD' },
    { id: 8, file: 'article-maternite.html', created_at: '2026-04-20', category: 'Maternité', author: 'Dr Loko' },
    { id: 9, file: 'article-conservation.html', created_at: '2026-04-15', category: 'Conseils', author: 'Équipe Pharma Port' },
    { id: 10, file: 'article-hygiene.html', created_at: '2026-04-10', category: 'Hygiène', author: 'Équipe Pharma Port' },
    { id: 11, file: 'article-complements.html', created_at: '2026-04-05', category: 'Nutrition', author: 'Équipe Pharma Port' }
];

let sql = "DELETE FROM pharmacie_port.blog_articles;\n\nINSERT INTO pharmacie_port.blog_articles (id, title, image_url, excerpt, content, created_at, category, author) VALUES\n";

const values = articles.map(art => {
    const html = fs.readFileSync(path.join('c:/Users/HP/Desktop/ITA/Finalisé/Site Pharma du Port', art.file), 'utf8');
    
    // Extract title
    const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    const title = titleMatch ? titleMatch[1].trim().replace(/'/g, "''") : "Titre inconnu";
    
    // Extract Image (from article-header background-image)
    const imgMatch = html.match(/background-image:[^;]*url\('([^']+)'\)/);
    const image_url = imgMatch ? imgMatch[1] : "img/default-blog.jpg";
    
    // Extract excerpt (from meta description)
    const excerptMatch = html.match(/<meta name="description" content="([^"]+)"/);
    const excerpt = excerptMatch ? excerptMatch[1].replace(/'/g, "''") : "Résumé non disponible";
    
    // Extract content (everything inside .article-body)
    const bodyMatch = html.match(/<div class="article-body">([\s\S]*?)<\/div>\s*<\/div>\s*<\/main>/);
    let content = bodyMatch ? bodyMatch[1].trim() : "Contenu non trouvé";
    content = content.replace(/'/g, "''"); // Postgres escape
    
    return `(${art.id}, '${title}', '${image_url}', '${excerpt}', $B$${content}$B$, '${art.created_at}', '${art.category}', '${art.author}')`;
});

sql += values.join(",\n") + ";";

fs.writeFileSync('c:/Users/HP/Desktop/ITA/Finalisé/Site Pharma du Port/restaurer_blog.sql', sql);
console.log('SQL Blog created.');
