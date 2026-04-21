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

        const { data, error } = await supabaseClient
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
            <section class="article-content" style="padding-top: 240px !important;">
                <div class="container">
                    <!-- Bouton Retour -->
                    <a href="blog.html" class="back-link" style="display: inline-flex; align-items: center; gap: 8px; color: var(--primary-color); text-decoration: none; font-weight: 500; margin-bottom: 30px; transition: transform 0.3s ease;">
                        <span class="material-symbols-rounded">arrow_back</span>
                        Retour aux conseils
                    </a>

                    <div style="margin-bottom: 30px;">
                        <span class="article-category">${data.category}</span>
                        <h1 class="article-title" style="margin-top: 15px; text-align: left; margin-left: 0;">${data.title}</h1>
                        <div class="article-meta" style="justify-content: flex-start; margin-top: 10px;">
                            <span><span class="material-symbols-rounded">calendar_month</span> Publié le ${date}</span>
                        </div>
                    </div>

                    <img src="${imgUrl}" alt="${data.title}" class="article-featured-image" style="margin-top: 0;" onerror="this.src='${placeholderImg}'">
                    
                    <div class="article-body" style="margin-top: 40px;">
                        ${data.content}
                    </div>
                    
                    <div style="margin-top: 60px; text-align: center; border-top: 1px solid #eee; padding-top: 40px;">
                        <a href="blog.html" class="btn btn-outline" style="display: inline-flex; align-items: center; gap: 8px;">
                            <span class="material-symbols-rounded">grid_view</span>
                            Voir tous les conseils
                        </a>
                    </div>
                </div>
            </section>
        `;

    }

    loadArticle();
});
