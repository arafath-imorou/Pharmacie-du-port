// js/blog.js

document.addEventListener('DOMContentLoaded', () => {
    const blogGrid = document.getElementById('dynamic-blog-grid');
    if (!blogGrid) return;

    async function loadBlogArticles() {
        const { data, error } = await window.supabase
            .from('blog_articles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching blog articles:', error);
            blogGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--danger);">Erreur lors du chargement des articles.</p>`;
            return;
        }

        if (data.length === 0) {
            blogGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-light);">Aucun conseil santé n'a été publié pour le moment.</p>`;
            return;
        }

        // Default placeholder image
        const placeholderImg = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800';

        const articlesHTML = data.map((article, index) => {
            const date = new Date(article.created_at).toLocaleDateString('fr-FR', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
            const delay = index * 0.1;

            return `
                <article class="blog-card fade-in" style="transition-delay: ${delay}s;">
                    <div class="blog-image">
                        <img src="${article.image_url || placeholderImg}" alt="${article.title}" onerror="this.src='${placeholderImg}'">
                        <div class="blog-category">${article.category}</div>
                    </div>
                    <div class="blog-content">
                        <div class="blog-meta">
                            <span><span class="material-symbols-rounded">calendar_month</span> ${date}</span>
                        </div>
                        <h3>${article.title}</h3>
                        <p>${article.excerpt || ''}</p>
                        <a href="article.html?id=${article.id}" class="blog-link">Lire la suite <span class="material-symbols-rounded">arrow_forward</span></a>
                    </div>
                </article>
            `;
        }).join('');

        blogGrid.innerHTML = articlesHTML;
    }

    loadBlogArticles();
});
