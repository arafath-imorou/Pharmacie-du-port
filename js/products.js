// js/products.js

// Database of Pharmaceutical Products (to be fetched from Supabase)
let productsDb = [];

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', async () => {

    // Fetch all products from Supabase using pagination
    // 1. Try to load from Cache first
    const CACHE_KEY = 'pharmacy_products_cache';
    const cachedData = sessionStorage.getItem(CACHE_KEY);

    if (cachedData) {
        try {
            productsDb = JSON.parse(cachedData);
            console.log(`${productsDb.length} produits chargés depuis le cache local.`);
            // Initial render of search if query exists
            if (searchInput && searchInput.value) executeSearch();
            return; // Exit early if cache hit
        } catch (e) {
            console.warn("Échec du chargement du cache :", e);
            sessionStorage.removeItem(CACHE_KEY);
        }
    }

    // 2. Fetch from Supabase if No Cache
    try {
        let allProducts = [];
        let from = 0;
        let to = 999;
        let finished = false;

        while (!finished) {
            const { data, error } = await supabaseClient
                .from('products')
                .select('*')
                .range(from, to)
                .order('name');

            if (error) throw error;
            
            if (data && data.length > 0) {
                const mapped = data.map(p => ({
                    id: p.id,
                    name: p.name,
                    category: p.category,
                    price: p.price,
                    inStock: p.in_stock,
                    description: p.description
                }));
                allProducts.push(...mapped);
                
                if (data.length < 1000) {
                    finished = true;
                } else {
                    from += 1000;
                    to += 1000;
                }
            } else {
                finished = true;
            }
        }

        // Deduplicate by name and category to avoid UI duplicates
        const uniqueProducts = [];
        const seen = new Set();
        
        allProducts.forEach(p => {
            const key = `${p.name.toLowerCase()}|${p.category.toLowerCase()}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueProducts.push(p);
            }
        });

        productsDb = uniqueProducts;

        // Save to cache for next page load/refresh
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(productsDb));
        console.log(`${productsDb.length} produits uniques chargés et mis en cache.`);
        
        // Initial render if query was typed while loading
        if (searchInput && searchInput.value) executeSearch();

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

    // Helper to format price: 1705 -> 1 705 F CFA
    const formatPrice = (price) => {
        if (!price) return "0 F CFA";
        // Convert to string and use regex for thousands separator
        const formatted = price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        return `${formatted} F CFA`;
    };

    // Search Execution Function
    const executeSearch = () => {
        const query = searchInput.value.trim().toLowerCase();

        if (query.length === 0) {
            return;
        }

        // 1. Filter Database
        const results = productsDb.filter(product => {
            const name = product.name.toLowerCase();
            const category = product.category.toLowerCase();
            return name.startsWith(query) ||
                category.startsWith(query) ||
                name.includes(query) ||
                category.includes(query);
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

                // Handle null or undefined description
                const description = (product.description && product.description !== "null") ? product.description : "";
                const displayPrice = formatPrice(product.price);

                const cardHTML = `
                    <div class="search-result-card">
                        <div class="card-header">
                            <h4 class="product-name">${product.name}</h4>
                            <span class="product-price">${displayPrice}</span>
                        </div>
                        <p class="product-category">${product.category}</p>
                        ${description ? `<p class="product-desc">${description}</p>` : ''}
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
