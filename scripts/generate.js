const fs = require('fs');
const path = require('path');

const contentPath = path.join(__dirname, '../content.json');
const rawData = fs.readFileSync(contentPath);
const data = JSON.parse(rawData);

const BASE_URL = process.env.BASE_URL || 'https://example.com';
const DT = new Date().toISOString().split('T')[0];

const outputDir = path.join(__dirname, '../');

function generateHtml(title, bodyContent, redirectHash) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <meta name="description" content="Portfolio content: ${title}">
    <script>
        // Redirect humans to the dynamic SPA
        // Bots will index this content, users will be redirected
        window.location.replace('./#${redirectHash}');
    </script>
    <noscript>
        <style>body { visibility: visible; }</style>
    </noscript>
</head>
<body>
    <header>
        <h1>${data.pageName || 'My Portfolio'}</h1>
        <nav>
            <ul>
                <li><a href="./.home.html">Home</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    </header>
    <main>
        ${bodyContent}
    </main>
    <footer>
        <p>&copy; ${new Date().getFullYear()} ${data.pageName}</p>
    </footer>
</body>
</html>`;
}

const sitemapUrls = [];

// 1. Generate Home (.home.html)
let homeContent = '';
if (data.hero) {
    homeContent += `
        <section id="hero">
            <h2>${data.hero.title}</h2>
            <p>${data.hero.subtitle}</p>
        </section>
    `;
}
homeContent += `<section id="galleries"><h2>Galleries</h2><ul>`;
if (data.galleries) {
    Object.keys(data.galleries).forEach(key => {
        homeContent += `<li><a href="./.gallery-${key}.html">${key.replace(/-/g, ' ')}</a></li>`;
    });
}
homeContent += `</ul></section>`;

if (data.contact) {
    homeContent += `
        <section id="contact">
            <h2>Contact</h2>
            <p>${data.contact.name}</p>
            <p><a href="mailto:${data.contact.email}">${data.contact.email}</a></p>
        </section>
    `;
}

fs.writeFileSync(path.join(outputDir, '.home.html'), generateHtml(data.pageName, homeContent, 'home'));
console.log('Generated .home.html');
sitemapUrls.push(`${BASE_URL}/.home.html`);


// 2. Generate Gallery Pages (.gallery-[slug].html)
if (data.galleries) {
    Object.entries(data.galleries).forEach(([key, gallery]) => {
        let content = `
            <article>
                <h2>${key.replace(/-/g, ' ')}</h2>
                <p>${gallery.description || ''}</p>
                <ul>
        `;
        (gallery.tags || []).forEach(tag => {
            content += `<li>${tag}</li>`;
        });
        content += `</ul><div>`;
        (gallery.images || []).forEach(img => {
            content += `<img src="${img}" alt="${key} image" style="max-width:100%;"><br>`;
        });
        content += `</div></article>`;

        const filename = `.gallery-${key}.html`;
        fs.writeFileSync(path.join(outputDir, filename), generateHtml(`${key} - ${data.pageName}`, content, `gallery/${key}`));
        console.log(`Generated ${filename}`);
        sitemapUrls.push(`${BASE_URL}/${filename}`);
    });
}

// 3. Generate Sitemap
let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
   <url>
      <loc>${BASE_URL}/</loc>
      <lastmod>${DT}</lastmod>
      <priority>1.0</priority>
   </url>
`;

sitemapUrls.forEach(url => {
    sitemap += `   <url>
      <loc>${url}</loc>
      <lastmod>${DT}</lastmod>
      <priority>0.8</priority>
   </url>
`;
});

sitemap += `</urlset>`;

fs.writeFileSync(path.join(outputDir, '.sitemap.xml'), sitemap);
console.log('Generated .sitemap.xml');
