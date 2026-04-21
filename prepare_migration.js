const fs = require('fs');

const SQL_SOURCE = 'c:/Users/HP/Desktop/ITA/Finalisé/Site Pharma du Port/all_sql_utf8.sql';
const JSON_SOURCE = 'c:/Users/HP/Desktop/ITA/Finalisé/Site Pharma du Port/products_extracted_utf8.json';

const OUTPUT_A = 'c:/Users/HP/Desktop/ITA/Finalisé/Site Pharma du Port/restaurer_partie_A.sql';
const OUTPUT_B = 'c:/Users/HP/Desktop/ITA/Finalisé/Site Pharma du Port/restaurer_partie_B.sql';

function fixSQL() {
    console.log('Processing Lot A...');
    let content = fs.readFileSync(SQL_SOURCE, 'utf8').trim().replace(/^\ufeff/, '');
    
    // Rename tables
    content = content.replace(/INSERT INTO products/g, 'INSERT INTO pharmacie_port.products');
    
    // Add cleanup
    const header = "DELETE FROM pharmacie_port.order_items;\nDELETE FROM pharmacie_port.orders;\nDELETE FROM pharmacie_port.products;\n\n";
    
    fs.writeFileSync(OUTPUT_A, header + content);
    console.log('Lot A created (Consolidated).');
}

function convertJSON() {
    console.log('Processing Lot B...');
    const data = JSON.parse(fs.readFileSync(JSON_SOURCE, 'utf8').trim().replace(/^\ufeff/, ''));
    
    let sql = "";
    let batchSize = 200;
    
    for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        sql += "INSERT INTO pharmacie_port.products (name, price, category) VALUES\n";
        const values = batch.map(p => {
            const price = parseInt(p.price.toString().match(/\d+/) || [0]);
            const name = p.name.replace(/'/g, "''");
            const cat = p.category.replace(/'/g, "''");
            return `('${name}', ${price}, '${cat}')`;
        });
        sql += values.join(",\n") + ";\n\n";
    }
    
    fs.writeFileSync(OUTPUT_B, sql);
    console.log('Lot B created (JSON -> SQL).');
}

fixSQL();
convertJSON();
