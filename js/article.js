// js/article.js
document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.getElementById('dynamic-article-content');
    if (!mainContent) return;

    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');

    async function loadArticle() {
        if (!articleId) {
            mainContent.innerHTML = `<div style="text-align: center; padding: 100px 20px; color: var(--danger);">Article introuvable.</div>`;
            return;
        }

        const { data, error } = await window.supabase
            .from('blog_articles')
            .select('*')
            .eq('id', articleId)
            .single();

        if (error || !data) {
            console.error('Error fetching article:', error);
            mainContent.innerHTML = `<div style="text-align: center; padding: 100px 20px; color: var(--danger);">Désolé, cet article n'existe pas ou a été supprimé.</div>`;
            return;
        }

        document.title = `${data.title} - Pharmacie du Port`;

        const date = new Date(data.created_at).toLocaleDateString('fr-FR', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        const placeholderImg = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1200';
        const imgUrl = data.image_url || placeholderImg;

        mainContent.innerHTML = `
            <section class="article-hero">
                <div class="container">
                    <span class="article-category">${data.category}</span>
                    <h1 class="article-title">${data.title}</h1>
                    <div class="article-meta">
                        <span><span class="material-symbols-rounded">calendar_month</span> Publié le ${date}</span>
                    </div>
                </div>
            </section>

            <section class="article-content">
                <div class="container">
                    <img src="${imgUrl}" alt="${data.title}" class="article-featured-image" onerror="this.src='${placeholderImg}'">
                    <div class="article-body" style="margin-top: 40px;">
                        ${data.content}
                    </div>
                    
                    <div style="margin-top: 60px; text-align: center;">
                        <a href="blog.html" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 8px;">
                            <span class="material-symbols-rounded">arrow_back</span>
                            Retour aux conseils
                        </a>
                    </div>
                </div>
            </section>
        `;
    }

    loadArticle();
});
