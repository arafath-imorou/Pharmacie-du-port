// js/contentLoader.js

document.addEventListener('DOMContentLoaded', async () => {
    const elements = document.querySelectorAll('[data-content-id]');
    if (elements.length === 0) return;

    // Identify which page we are on (simple approach) or fetch all
    const path = window.location.pathname;
    const pageId = path.includes('about.html') ? 'about' :
        path.includes('services.html') ? 'services' : 'index';

    async function loadDynamicContent() {
        try {
                const { data, error } = await supabaseClient
                    .from('site_content')
                .select('section_id, content_text')
                .eq('page_id', pageId);

            if (error) {
                console.error('Error loading dynamic content:', error);
                return;
            }

            if (!data || data.length === 0) return;

            // Map content to elements
            const contentMap = {};
            data.forEach(item => {
                contentMap[item.section_id] = item.content_text;
            });

            elements.forEach(el => {
                const contentId = el.getAttribute('data-content-id');
                if (contentMap[contentId]) {
                    el.innerHTML = contentMap[contentId];
                }
            });

        } catch (err) {
            console.error('Content loader failed:', err);
        }
    }

    // Ensure supabase is available (wait a bit if needed or use window.supabase)
    if (window.supabaseClient) {
        loadDynamicContent();
    } else {
        // Fallback if supabaseClient.js loads after this
        const checkSupabase = setInterval(() => {
            if (window.supabaseClient) {
                clearInterval(checkSupabase);
                loadDynamicContent();
            }
        }, 100);
        setTimeout(() => clearInterval(checkSupabase), 2000); // Stop after 2s
    }
});
