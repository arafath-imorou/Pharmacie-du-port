// js/products.js

// Database of Pharmaceutical Products (to be fetched from Supabase)
let productsDb = [];

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', async () => {

    // Fetch products from Supabase
    try {
        // Increased range to 2000 to ensure all 1394 products are loaded
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .range(0, 2000)
            .order('name');
        if (error) throw error;
        productsDb = data ? data.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            price: p.price,
            inStock: p.in_stock,
            description: p.description
        })) : [];
    } catch (err) {
        console.error("Erreur de chargement des produits :", err);
    }

    // Existing elements
    const searchInput = document.getElementById('hero-search-input');
    const searchBtn = document.getElementById('hero-search-btn');

    // New Modal Elements
    const searchModal = document.getElementById('search-modal');
    const searchCloseBtn = document.getElementById('search-close');
    const searchResultsContainer = document.getElementById('search-results-list');
    const searchTermDisplay = document.getElementById('search-term');
    const searchCountDisplay = document.getElementById('search-count');

    // Only run if elements exist on page
    if (!searchInput || !searchBtn || !searchModal) return;

    // Search Execution Function
    const executeSearch = () => {
        const query = searchInput.value.trim().toLowerCase();

        if (query.length === 0) {
            // Might want an error or small hint, but normally do nothing
            return;
        }

        // 1. Filter Database
        // We prioritize startsWith for better relevance but also allow includes
        const results = productsDb.filter(product => {
            const name = product.name.toLowerCase();
            const category = product.category.toLowerCase();
            return name.startsWith(query) ||
                category.startsWith(query) ||
                name.includes(query) ||
                category.includes(query);
        })
        .sort((a, b) => {
            // Put startsWith matches first
            const aName = a.name.toLowerCase();
            const bName = b.name.toLowerCase();
            const aStarts = aName.startsWith(query);
            const bStarts = bName.startsWith(query);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            return aName.localeCompare(bName);
        })
        .slice(0, 500);

        // 2. Update Header Infos
        searchTermDisplay.textContent = `"${searchInput.value}"`;
        searchCountDisplay.textContent = `${results.length} résultat(s) trouvé(s)`;

        // 3. Render Results HTML
        searchResultsContainer.innerHTML = ''; // Clear old

        if (results.length === 0) {
            searchResultsContainer.innerHTML = `
                <div style="text-align:center; padding: 2rem; color: #666;">
                    <span class="material-symbols-rounded" style="font-size: 3rem; color: #ccc;">search_off</span>
                    <p style="margin-top: 1rem;">Oups, nous n'avons trouvé aucun produit correspondant à votre recherche.</p>
                </div>
            `;
        } else {
            results.forEach(product => {
                const stockBadge = product.inStock
                    ? `<span class="badge in-stock"><span class="material-symbols-rounded" style="font-size: 14px;">check_circle</span> En stock</span>`
                    : `<span class="badge out-of-stock"><span class="material-symbols-rounded" style="font-size: 14px;">cancel</span> Rupture</span>`;

                const cardHTML = `
                    <div class="search-result-card">
                        <div class="card-header">
                            <h4 class="product-name">${product.name}</h4>
                            <span class="product-price">${product.price}</span>
                        </div>
                        <p class="product-category">${product.category}</p>
                        <p class="product-desc">${product.description}</p>
                        <div class="card-footer">
                            ${stockBadge}
                            <a href="order.html" class="btn btn-primary btn-sm" style="padding: 0.5rem 1rem;">Commander</a>
                        </div>
                    </div>
                `;
                searchResultsContainer.insertAdjacentHTML('beforeend', cardHTML);
            });
        }

        // 4. Show Modal
        searchModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    };

    // Listeners
    searchBtn.addEventListener('click', executeSearch);

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            executeSearch();
        }
    });

    // Close Modal Logic
    const closeModal = () => {
        searchModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    };

    searchCloseBtn.addEventListener('click', closeModal);

    // Close modal when clicking outside content
    searchModal.addEventListener('click', (e) => {
        if (e.target === searchModal) {
            closeModal();
        }
    });

});
