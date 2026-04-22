// js/products.js

// Database of Pharmaceutical Products (Global for cross-script access)
window.productsDb = [];

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', async () => {

    // 1. Initialize elements
    const searchInput = document.getElementById('hero-search-input');
    const searchBtn = document.getElementById('hero-search-btn');
    const searchModal = document.getElementById('search-modal');
    const searchCloseBtn = document.getElementById('search-close');
    const searchResultsContainer = document.getElementById('search-results-list');
    const searchTermDisplay = document.getElementById('search-term');
    const searchCountDisplay = document.getElementById('search-count');
    const suggestionsContainer = document.getElementById('search-suggestions');

    // Helper functions (Hoisted)
    function formatPrice(price) {
        if (!price) return "0 F CFA";
        const formatted = price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        return `${formatted} F CFA`;
    }

    function executeSearch() {
        if (!searchInput) return;
        const query = searchInput.value.trim().toLowerCase();
        if (query.length === 0) return;

        const results = window.productsDb.filter(product => {
            const name = product.name.toLowerCase();
            const category = product.category.toLowerCase();
            return name.startsWith(query) || category.startsWith(query) || name.includes(query) || category.includes(query);
        })
        .sort((a, b) => {
            const aName = a.name.toLowerCase();
            const bName = b.name.toLowerCase();
            const aStarts = aName.startsWith(query);
            const bStarts = bName.startsWith(query);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            return aName.localeCompare(bName);
        })
        .slice(0, 500);

        searchTermDisplay.textContent = `"${searchInput.value}"`;
        searchCountDisplay.textContent = `${results.length} résultat(s) trouvé(s)`;
        searchResultsContainer.innerHTML = '';

        if (results.length === 0) {
            searchResultsContainer.innerHTML = `
                <div style="text-align:center; padding: 2rem; color: #666;">
                    <span class="material-symbols-rounded" style="font-size: 3rem; color: #ccc;">search_off</span>
                    <p style="margin-top: 1rem;">Oups, nous n'avons trouvé aucun produit correspondant à votre recherche.</p>
                </div>`;
        } else {
            results.forEach(product => {
                const stockBadge = product.inStock
                    ? `<span class="badge in-stock"><span class="material-symbols-rounded" style="font-size: 14px;">check_circle</span> En stock</span>`
                    : `<span class="badge out-of-stock"><span class="material-symbols-rounded" style="font-size: 14px;">cancel</span> Rupture</span>`;

                const description = (product.description && product.description !== "null") ? product.description : "";
                const displayPrice = formatPrice(product.price);

                const cardHTML = `
                    <div class="search-result-card">
                        <div class="card-header"><h4 class="product-name">${product.name}</h4><span class="product-price">${displayPrice}</span></div>
                        <p class="product-category">${product.category}</p>
                        ${description ? `<p class="product-desc">${description}</p>` : ''}
                        <div class="card-footer">${stockBadge}<a href="order.html" class="btn btn-primary btn-sm" style="padding: 0.5rem 1rem;">Commander</a></div>
                    </div>`;
                searchResultsContainer.insertAdjacentHTML('beforeend', cardHTML);
            });
        }
        searchModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (suggestionsContainer) suggestionsContainer.classList.remove('active');
    }

    function renderSuggestions(query) {
        if (!suggestionsContainer) return;
        if (query.length < 2) {
            suggestionsContainer.classList.remove('active');
            suggestionsContainer.innerHTML = '';
            return;
        }
        const matches = window.productsDb.filter(p => {
            const name = p.name.toLowerCase();
            return name.startsWith(query) || name.includes(query);
        })
        .sort((a, b) => {
            const aStarts = a.name.toLowerCase().startsWith(query);
            const bStarts = b.name.toLowerCase().startsWith(query);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            return a.name.localeCompare(b.name);
        })
        .slice(0, 10);

        if (matches.length === 0) {
            suggestionsContainer.classList.remove('active');
            return;
        }
        suggestionsContainer.innerHTML = matches.map(p => `
            <div class="suggestion-item" data-product-name="${p.name.replace(/"/g, '&quot;')}">
                <span class="suggestion-name">${p.name}</span>
                <span class="suggestion-category">${p.category}</span>
            </div>`).join('');
        suggestionsContainer.classList.add('active');
    }

    // 2. Fetch all products from Supabase using pagination
    const CACHE_KEY = 'pharmacy_products_cache';
    const cachedData = sessionStorage.getItem(CACHE_KEY);

    if (cachedData) {
        try {
            window.productsDb = JSON.parse(cachedData);
            console.log(`${window.productsDb.length} produits chargés depuis le cache local.`);
            if (searchInput && searchInput.value) executeSearch();
            // We still need to setup listeners! So don't return here.
        } catch (e) {
            console.warn("Échec du chargement du cache :", e);
            sessionStorage.removeItem(CACHE_KEY);
        }
    }

    if (window.productsDb.length === 0) {
        try {
            let allProducts = [];
            let from = 0;
            let to = 999;
            let finished = false;

            while (!finished) {
                const { data, error } = await supabaseClient.from('products').select('*').range(from, to).order('name');
                if (error) throw error;
                if (data && data.length > 0) {
                    const mapped = data.map(p => ({
                        id: p.id, name: p.name, category: p.category, price: p.price, inStock: p.in_stock !== false, description: p.description
                    }));
                    allProducts.push(...mapped);
                    if (data.length < 1000) finished = true; else { from += 1000; to += 1000; }
                } else finished = true;
            }
            const uniqueProducts = [];
            const seen = new Set();
            allProducts.forEach(p => {
                const key = `${p.name.toLowerCase()}|${p.category.toLowerCase()}`;
                if (!seen.has(key)) { seen.add(key); uniqueProducts.push(p); }
            });
            window.productsDb = uniqueProducts;
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(window.productsDb));
            if (searchInput && searchInput.value) executeSearch();
        } catch (err) {
            console.error("Erreur de chargement des produits :", err);
        }
    }

    // 3. Listeners
    if (searchBtn && searchInput && searchModal) {
        searchBtn.addEventListener('click', executeSearch);
        searchInput.addEventListener('input', (e) => renderSuggestions(e.target.value.trim().toLowerCase()));
        if (suggestionsContainer) {
            suggestionsContainer.addEventListener('click', (e) => {
                const item = e.target.closest('.suggestion-item');
                if (item) {
                    searchInput.value = item.dataset.productName;
                    suggestionsContainer.classList.remove('active');
                    executeSearch();
                }
            });
            document.addEventListener('click', (e) => {
                if (!suggestionsContainer.contains(e.target) && e.target !== searchInput) suggestionsContainer.classList.remove('active');
            });
        }
        searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') executeSearch(); });
        const closeModal = () => { searchModal.classList.remove('active'); document.body.style.overflow = 'auto'; };
        searchCloseBtn.addEventListener('click', closeModal);
        searchModal.addEventListener('click', (e) => { if (e.target === searchModal) closeModal(); });
    }
});
