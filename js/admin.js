// js/admin.js

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Quill Editor
    let quill = null;
    const quillContainer = document.getElementById('artQuillEditor');
    if (quillContainer) {
        quill = new Quill('#artQuillEditor', {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    ['link', 'clean']
                ]
            },
            placeholder: 'Rédigez votre article ici...'
        });
    }


    // 1. Auth Guard & Session Setup
    const userEmailSpan = document.getElementById('userEmail');
    let sessionUser = null;

    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();

        if (error || !session) {
            // Not logged in -> redirect to login
            window.location.href = 'admin-login.html';
            return;
        }

        sessionUser = session.user;
        userEmailSpan.textContent = sessionUser.email;

    } catch (err) {
        console.error("Auth check failed:", err);
        window.location.href = 'admin-login.html';
        return;
    }

    // 2. Logout Logic
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabaseClient.auth.signOut();
            window.location.href = 'admin-login.html';
        });
    }

    // 3. Navigation / Tabs Logic
    const navLinks = document.querySelectorAll('.nav-link');
    const panels = document.querySelectorAll('.admin-panel');
    const pageTitle = document.getElementById('pageTitle');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Update Active Link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Update Panel
            const targetId = link.getAttribute('data-target');
            panels.forEach(p => p.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');

            // Update Title
            pageTitle.textContent = link.textContent.trim();

            // Load specific panel data
            if (targetId === 'messages-panel') loadMessages();
            if (targetId === 'orders-panel') loadOrders();
            if (targetId === 'blog-panel') loadArticles();
            if (targetId === 'dashboard-panel') {
                // Reset category filter to "all" when switching to products tab
                document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                document.querySelector('.category-tab[data-category="all"]').classList.add('active');
                loadProducts();
            }
            if (targetId === 'pages-panel') loadPageContent();
        });
    });

    // ----------------------------------------------------
    // PRODUCTS CRUD LOGIC
    // ----------------------------------------------------
    const productsTableBody = document.getElementById('productsTableBody');
    const addBtn = document.getElementById('addBtn');
    const productModal = document.getElementById('productModal');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const productForm = document.getElementById('productForm');

    let isEditing = false;

    // Pagination State
    let currentProdPage = 1;
    let prodItemsPerPage = 50;
    let totalProdCount = 0;

    // Load Products
    async function loadProducts(category = 'all', searchTerm = '', page = 1) {
        currentProdPage = page;
        productsTableBody.innerHTML = '<tr><td colspan="6" class="loading-state">Chargement...</td></tr>';
        
        const from = (page - 1) * prodItemsPerPage;
        const to = from + prodItemsPerPage - 1;

        let query = supabaseClient
            .from('products')
            .select('*', { count: 'exact' })
            .order('id', { ascending: false })
            .range(from, to);
        
        if (category !== 'all') {
            query = query.eq('category', category);
        }

        if (searchTerm.trim()) {
            query = query.ilike('name', `%${searchTerm.trim()}%`);
        }

        const { data, error, count } = await query;

        if (error) {
            productsTableBody.innerHTML = '<tr><td colspan="6" class="loading-state">Erreur de chargement</td></tr>';
            return;
        }

        totalProdCount = count || 0;
        updateProdPaginationUI();

        if (data.length === 0) {
            productsTableBody.innerHTML = '<tr><td colspan="6" class="loading-state">Aucun produit trouvé</td></tr>';
            return;
        }

        productsTableBody.innerHTML = data.map(p => `
            <tr>
                <td style="color:#718096">#${p.id}</td>
                <td style="font-weight:500; color:#2d3748">${p.name}</td>
                <td>${p.category}</td>
                <td style="font-weight:600">${p.price}</td>
                <td>
                    <span class="badge-admin ${p.in_stock ? 'badge-success' : 'badge-danger'}">
                        ${p.in_stock ? 'En Stock' : 'Rupture'}
                    </span>
                </td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn" onclick="editProduct(${p.id})" title="Modifier">
                            <span class="material-symbols-rounded" style="font-size:18px">edit</span>
                        </button>
                        <button class="action-btn delete" onclick="deleteProduct(${p.id})" title="Supprimer">
                            <span class="material-symbols-rounded" style="font-size:18px">delete</span>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    function updateProdPaginationUI() {
        const rangeStart = totalProdCount === 0 ? 0 : (currentProdPage - 1) * prodItemsPerPage + 1;
        const rangeEnd = Math.min(currentProdPage * prodItemsPerPage, totalProdCount);
        
        document.getElementById('prodRangeStart').textContent = rangeStart;
        document.getElementById('prodRangeEnd').textContent = rangeEnd;
        document.getElementById('prodTotalCount').textContent = totalProdCount;
        document.getElementById('prodPageInfo').textContent = `Page ${currentProdPage}`;

        document.getElementById('prevProdPage').disabled = currentProdPage === 1;
        document.getElementById('nextProdPage').disabled = rangeEnd >= totalProdCount;
    }

    // Pagination Listeners
    document.getElementById('prevProdPage').addEventListener('click', () => {
        if (currentProdPage > 1) {
            const activeCategory = document.querySelector('.category-tab.active')?.getAttribute('data-category') || 'all';
            const searchTerm = productSearchInput ? productSearchInput.value : '';
            loadProducts(activeCategory, searchTerm, currentProdPage - 1);
        }
    });

    document.getElementById('nextProdPage').addEventListener('click', () => {
        const activeCategory = document.querySelector('.category-tab.active')?.getAttribute('data-category') || 'all';
        const searchTerm = productSearchInput ? productSearchInput.value : '';
        loadProducts(activeCategory, searchTerm, currentProdPage + 1);
    });

    // Product Search Logic
    const productSearchInput = document.getElementById('productSearchInput');
    if (productSearchInput) {
        let searchTimeout;
        productSearchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const activeCategory = document.querySelector('.category-tab.active')?.getAttribute('data-category') || 'all';
                loadProducts(activeCategory, e.target.value, 1); // Reset to page 1 on search
            }, 300); // Debounce search
        });
    }

    // Category Tabs Logic
    const categoryTabs = document.querySelectorAll('.category-tab');
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            categoryTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const category = tab.getAttribute('data-category');
            const searchTerm = productSearchInput ? productSearchInput.value : '';
            loadProducts(category, searchTerm, 1); // Reset to page 1 on filter
        });
    });

    // Modal Control
    addBtn.addEventListener('click', () => {
        isEditing = false;
        productForm.reset();
        document.getElementById('prodId').value = '';
        document.getElementById('modalTitle').textContent = 'Ajouter un Produit';
        productModal.classList.add('active');
    });

    cancelModalBtn.addEventListener('click', () => {
        productModal.classList.remove('active');
    });

    // Save Form
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const saveBtn = document.getElementById('saveProdBtn');
        saveBtn.disabled = true;
        saveBtn.textContent = "Sauvegarde...";

        const id = document.getElementById('prodId').value;
        const payload = {
            name: document.getElementById('prodName').value,
            category: document.getElementById('prodCat').value,
            price: document.getElementById('prodPrice').value,
            in_stock: document.getElementById('prodStock').value === 'true',
            description: document.getElementById('prodDesc').value
        };

        try {
            let error;
            if (isEditing && id) {
                const res = await supabaseClient.from('products').update(payload).eq('id', id);
                error = res.error;
            } else {
                const res = await supabaseClient.from('products').insert([payload]);
                error = res.error;
            }

            if (error) throw error;

            productModal.classList.remove('active');
            await loadProducts();

        } catch (err) {
            console.error("Supabase Error:", err);
            alert("Erreur lors de la sauvegarde.");
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = "Enregistrer";
        }
    });

    // Edit Product (Globals to match button onclick)
    window.editProduct = async (id) => {
        const { data, error } = await supabaseClient.from('products').select('*').eq('id', id).single();
        if (error || !data) return alert("Erreur lors de la récupération.");

        isEditing = true;
        document.getElementById('prodId').value = data.id;
        document.getElementById('prodName').value = data.name;
        document.getElementById('prodCat').value = data.category;
        document.getElementById('prodPrice').value = data.price;
        document.getElementById('prodStock').value = data.in_stock ? 'true' : 'false';
        document.getElementById('prodDesc').value = data.description || '';

        document.getElementById('modalTitle').textContent = 'Modifier un Produit';
        productModal.classList.add('active');
    };

    // Delete Product
    window.deleteProduct = async (id) => {
        if (!confirm("Voulez-vous vraiment supprimer ce produit ? Cette action est irréversible.")) return;

        const { error } = await supabaseClient.from('products').delete().eq('id', id);
        if (error) return alert("Erreur lors de la suppression.");

        await loadProducts();
    };

    // ----------------------------------------------------
    // MESSAGES LOGIC
    // ----------------------------------------------------
    const messagesTableBody = document.getElementById('messagesTableBody');
    async function loadMessages() {
        messagesTableBody.innerHTML = '<tr><td colspan="6" class="loading-state">Chargement...</td></tr>';
        const { data, error } = await supabaseClient.from('contact_messages').select('*').order('created_at', { ascending: false });

        if (error) {
            messagesTableBody.innerHTML = '<tr><td colspan="6" class="loading-state">Erreur de chargement</td></tr>';
            return;
        }

        if (data.length === 0) {
            messagesTableBody.innerHTML = '<tr><td colspan="6" class="loading-state">Aucun message pour le moment.</td></tr>';
            return;
        }

        messagesTableBody.innerHTML = data.map(m => {
            const dateStr = new Date(m.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            return `
            <tr>
                <td style="font-size:0.85rem; color:#718096">${dateStr}</td>
                <td style="font-weight:500">${m.name}</td>
                <td><a href="mailto:${m.email}" style="color:var(--primary-color)">${m.email}</a></td>
                <td>${m.phone || '-'}</td>
                <td>
                    <div style="font-weight:600; font-size:0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">${m.subject || 'Sans sujet'}</div>
                </td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn" onclick="viewMessage(${m.id})" title="Voir détails">
                            <span class="material-symbols-rounded" style="font-size:18px">visibility</span>
                        </button>
                        <button class="action-btn delete" onclick="deleteMessage(${m.id})" title="Supprimer">
                            <span class="material-symbols-rounded" style="font-size:18px">delete</span>
                        </button>
                    </div>
                </td>
            </tr>
        `}).join('');
    }

    // View Message Details
    window.viewMessage = async (id) => {
        const messageDetailModal = document.getElementById('messageDetailModal');
        const detailContent = document.getElementById('messageDetailContent');
        const replyBtn = document.getElementById('replyEmailBtn');
        
        messageDetailModal.classList.add('active');
        detailContent.innerHTML = '<div class="loading-state">Chargement...</div>';

        const { data: m, error } = await supabaseClient
            .from('contact_messages')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !m) {
            detailContent.innerHTML = '<div class="loading-state">Erreur lors du chargement.</div>';
            return;
        }

        const dateStr = new Date(m.created_at).toLocaleString('fr-FR');
        replyBtn.href = `mailto:${m.email}?subject=RE: ${m.subject || 'Votre message'}`;

        detailContent.innerHTML = `
            <div style="margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <h4 style="margin: 0 0 5px 0; color: #718096; font-size: 0.75rem; text-transform: uppercase;">Expéditeur</h4>
                        <p style="margin: 0; font-weight: 600;">${m.name}</p>
                        <p style="margin: 0; font-size: 0.9rem; color: var(--primary-color);">${m.email}</p>
                        ${m.phone ? `<p style="margin: 0; font-size: 0.85rem;">Tel: ${m.phone}</p>` : ''}
                    </div>
                    <div>
                        <h4 style="margin: 0 0 5px 0; color: #718096; font-size: 0.75rem; text-transform: uppercase;">Réception</h4>
                        <p style="margin: 0; font-size: 0.9rem;">Date: ${dateStr}</p>
                        <p style="margin: 0; font-size: 0.9rem;">ID: #${m.id}</p>
                    </div>
                </div>
            </div>

            <div style="margin-bottom: 15px;">
                <h4 style="margin: 0 0 8px 0; color: #718096; font-size: 0.75rem; text-transform: uppercase;">Objet</h4>
                <p style="margin: 0; font-weight: 600; color: #2d3748; font-size: 1.1rem;">${m.subject || 'Sans sujet'}</p>
            </div>

            <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; line-height: 1.6; color: #4a5568;">
                ${m.message.replace(/\n/g, '<br>')}
            </div>
        `;
    };

    // Close Message Detail Modal
    const closeMessageDetailBtn = document.getElementById('closeMessageDetailBtn');
    if (closeMessageDetailBtn) {
        closeMessageDetailBtn.addEventListener('click', () => {
            document.getElementById('messageDetailModal').classList.remove('active');
        });
    }

    // Delete Message
    window.deleteMessage = async (id) => {
        if (!confirm("Voulez-vous vraiment supprimer ce message ?")) return;

        const { error } = await supabaseClient.from('contact_messages').delete().eq('id', id);
        if (error) return alert("Erreur lors de la suppression du message.");

        await loadMessages();
    };

    // ----------------------------------------------------
    // ORDERS LOGIC
    // ----------------------------------------------------
    const ordersTableBody = document.getElementById('ordersTableBody');
    async function loadOrders() {
        ordersTableBody.innerHTML = '<tr><td colspan="5" class="loading-state">Chargement...</td></tr>';

        // Fetch orders and inner join with order_items using Supabase embedded query
        const { data, error } = await supabaseClient.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });

        if (error) {
            ordersTableBody.innerHTML = '<tr><td colspan="5" class="loading-state">Erreur de chargement</td></tr>';
            return;
        }

        if (data.length === 0) {
            ordersTableBody.innerHTML = '<tr><td colspan="5" class="loading-state">Aucune commande sauvegardée.</td></tr>';
            return;
        }

        ordersTableBody.innerHTML = data.map(o => {
            const dateStr = new Date(o.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

            return `
            <tr>
                <td style="font-size:0.85rem; color:#718096">${dateStr}</td>
                <td>
                    <strong style="color:#2d3748">${o.client_name}</strong>
                    ${o.prescription_url ? '<br><span class="badge-admin badge-success" style="font-size:0.6rem">ORDONNANCE</span>' : ''}
                </td>
                <td><a href="tel:${o.client_phone}" style="color:var(--primary-color)">${o.client_phone}</a></td>
                <td style="font-weight:bold">${o.total_price}</td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn" onclick="viewOrder(${o.id})" title="Voir détails">
                            <span class="material-symbols-rounded" style="font-size:20px">visibility</span>
                        </button>
                        <button class="action-btn delete" onclick="deleteOrder(${o.id})" title="Supprimer">
                            <span class="material-symbols-rounded" style="font-size:20px">delete</span>
                        </button>
                    </div>
                </td>
            </tr>
        `}).join('');
    }

    // Delete Order
    window.deleteOrder = async (id) => {
        if (!confirm("Voulez-vous vraiment supprimer cette commande ? Cette action supprimera également les articles liés.")) return;

        // Note: Due to foreign key constraints, usually ON DELETE CASCADE should handle items.
        // If not, we'd need to delete items first.
        const { error } = await supabaseClient.from('orders').delete().eq('id', id);
        if (error) return alert("Erreur lors de la suppression de la commande.");

        await loadOrders();
    };

    // View Order Details
    window.viewOrder = async (id) => {
        const orderDetailModal = document.getElementById('orderDetailModal');
        const detailContent = document.getElementById('orderDetailContent');
        
        orderDetailModal.classList.add('active');
        detailContent.innerHTML = '<div class="loading-state">Chargement...</div>';

        const { data: order, error } = await supabaseClient
            .from('orders')
            .select('*, order_items(*)')
            .eq('id', id)
            .single();

        if (error || !order) {
            detailContent.innerHTML = '<div class="loading-state">Erreur lors du chargement des détails.</div>';
            return;
        }

        const dateStr = new Date(order.created_at).toLocaleString('fr-FR');
        
        let itemsTable = '';
        if (order.order_items && order.order_items.length > 0) {
            itemsTable = `
                <table class="data-table" style="margin-top: 15px; border: 1px solid #e2e8f0;">
                    <thead>
                        <tr style="background: #f8fafc;">
                            <th style="padding: 10px;">Produit</th>
                            <th style="padding: 10px;">Qté</th>
                            <th style="padding: 10px;">Prix</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.order_items.map(item => `
                            <tr>
                                <td style="padding: 10px;">${item.product_name}</td>
                                <td style="padding: 10px;">x${item.quantity}</td>
                                <td style="padding: 10px;">${item.price}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }

        detailContent.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div>
                    <h4 style="margin: 0 0 5px 0; color: #718096; font-size: 0.8rem; text-transform: uppercase;">Informations Client</h4>
                    <p style="margin: 0; font-weight: 600;">${order.client_name}</p>
                    <p style="margin: 0; font-size: 0.9rem;">${order.client_phone}</p>
                </div>
                <div>
                    <h4 style="margin: 0 0 5px 0; color: #718096; font-size: 0.8rem; text-transform: uppercase;">Détails Commande</h4>
                    <p style="margin: 0; font-size: 0.9rem;">Date: ${dateStr}</p>
                    <p style="margin: 0; font-size: 0.9rem;">Méthode: ${order.delivery_method === 'delivery' ? 'Livraison' : 'Retrait'}</p>
                </div>
            </div>

            ${order.delivery_address ? `
            <div style="margin-bottom: 20px; padding: 12px; background: #f8fafc; border-radius: 8px;">
                <h4 style="margin: 0 0 5px 0; color: #718096; font-size: 0.8rem; text-transform: uppercase;">Adresse de Livraison</h4>
                <p style="margin: 0; font-size: 0.95rem;">${order.delivery_address}</p>
            </div>
            ` : ''}

            ${order.prescription_url ? `
            <div style="margin-bottom: 20px; padding: 12px; background: #e3f2fd; border: 1px solid #bbdefb; border-radius: 8px;">
                <h4 style="margin: 0 0 8px 0; color: #0288d1; font-size: 0.8rem; text-transform: uppercase; display: flex; align-items: center; gap: 5px;">
                    <span class="material-symbols-rounded" style="font-size: 18px;">description</span> Ordonnance attachée
                </h4>
                <a href="${order.prescription_url}" target="_blank" style="display: inline-flex; align-items: center; gap: 8px; color: #1565c0; text-decoration: none; font-weight: 500;">
                    <span class="material-symbols-rounded">open_in_new</span> Voir l'ordonnance
                </a>
                ${order.prescription_notes ? `<p style="margin: 8px 0 0 0; font-style: italic; font-size: 0.85rem; color: #455a64;">Note: ${order.prescription_notes}</p>` : ''}
            </div>
            ` : ''}

            <h4 style="margin: 20px 0 10px 0; color: #718096; font-size: 0.8rem; text-transform: uppercase;">Récapitulatif Articles</h4>
            ${itemsTable || '<p style="font-style: italic; color: #a0aec0;">Aucun article listé (Commande par ordonnance direct)</p>'}

            <div style="margin-top: 20px; display: flex; justify-content: flex-end; align-items: center; gap: 15px;">
                <span style="font-size: 1.1rem; color: #4a5568;">Total:</span>
                <span style="font-size: 1.4rem; font-weight: 800; color: var(--primary-color);">${order.total_price}</span>
            </div>
        `;
    };

    // Close Order Detail Modal
    const closeOrderDetailBtn = document.getElementById('closeOrderDetailBtn');
    if (closeOrderDetailBtn) {
        closeOrderDetailBtn.addEventListener('click', () => {
            document.getElementById('orderDetailModal').classList.remove('active');
        });
    }

    // Print Logic
    const printOrderBtn = document.getElementById('printOrderBtn');
    if (printOrderBtn) {
        printOrderBtn.addEventListener('click', () => {
            const printContent = document.getElementById('orderDetailContent').innerHTML;
            const originalContent = document.body.innerHTML;
            
            // Create a simple print view
            document.body.innerHTML = `
                <div style="padding: 40px; font-family: sans-serif;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #1a8e3e; margin: 0;">Pharmacie du Port</h1>
                        <p style="margin: 5px 0;">Bon de Commande Web</p>
                    </div>
                    ${printContent}
                    <div style="margin-top: 50px; border-top: 1px dashed #ccc; padding-top: 20px; text-align: center; font-size: 0.8rem; color: #666;">
                        Généré le ${new Date().toLocaleString('fr-FR')} - Pharmacie du Port
                    </div>
                </div>
            `;
            
            window.print();
            
            // Restore page
            window.location.reload(); 
        });
    }

    // ----------------------------------------------------
    // BLOG ARTICLES CRUD LOGIC
    // ----------------------------------------------------
    const articlesTableBody = document.getElementById('articlesTableBody');
    const addArticleBtn = document.getElementById('addArticleBtn');
    const articleModal = document.getElementById('articleModal');
    const cancelArticleModalBtn = document.getElementById('cancelArticleModalBtn');
    const articleForm = document.getElementById('articleForm');

    let isEditingArticle = false;

    // Load Articles
    async function loadArticles() {
        if (!articlesTableBody) return;
        articlesTableBody.innerHTML = '<tr><td colspan="4" class="loading-state">Chargement...</td></tr>';

        const { data, error } = await supabaseClient
            .from('blog_articles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Load Articles Error:", error);
            articlesTableBody.innerHTML = '<tr><td colspan="4" class="loading-state">Erreur de chargement</td></tr>';
            return;
        }

        if (data.length === 0) {
            articlesTableBody.innerHTML = '<tr><td colspan="4" class="loading-state">Aucun article publié.</td></tr>';
            return;
        }

        articlesTableBody.innerHTML = data.map(article => {
            const date = new Date(article.created_at).toLocaleDateString('fr-FR', {
                year: 'numeric', month: '2-digit', day: '2-digit'
            });
            return `
                <tr>
                    <td style="color:#718096; font-size:0.85rem">${date}</td>
                    <td>
                        <div style="font-weight:600; color:#2d3748">${article.title}</div>
                        <div style="font-size:0.75rem; color:var(--primary-color)">${article.category}</div>
                    </td>
                    <td>
                        <div style="font-size:0.85rem; color:#4a5568; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                            ${article.excerpt || 'Pas de résumé'}
                        </div>
                    </td>
                    <td>
                        <div class="action-btns">
                            <a href="article.html?id=${article.id}" class="action-btn" target="_blank" title="Voir l'article">
                                <span class="material-symbols-rounded" style="font-size:18px">visibility</span>
                            </a>
                            <button class="action-btn" onclick="editArticle(${article.id})" title="Modifier">
                                <span class="material-symbols-rounded" style="font-size:18px">edit</span>
                            </button>
                            <button class="action-btn delete" onclick="deleteArticle(${article.id})" title="Supprimer">
                                <span class="material-symbols-rounded" style="font-size:18px">delete</span>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Modal Article Control
    if (addArticleBtn) {
        addArticleBtn.addEventListener('click', () => {
            isEditingArticle = false;
            articleForm.reset();
            if (document.getElementById('artId')) document.getElementById('artId').value = '';
            if (document.getElementById('articleModalTitle')) document.getElementById('articleModalTitle').textContent = 'Rédiger un Article';

            // Reset image preview
            const imagePreview = document.getElementById('imagePreview');
            const previewImg = document.getElementById('previewImg');
            if (imagePreview) imagePreview.style.display = 'none';
            if (previewImg) previewImg.src = '';
            if (document.getElementById('artFile')) document.getElementById('artFile').value = '';
            if (document.getElementById('artImage')) document.getElementById('artImage').value = '';

            // Reset Quill
            if (quill) quill.root.innerHTML = '';

            articleModal.classList.add('active');
        });
    }

    // Image Upload Preview Logic
    const artFile = document.getElementById('artFile');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const removePreview = document.getElementById('removePreview');
    const artImageInput = document.getElementById('artImage');

    if (artFile) {
        artFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (f) => {
                    previewImg.src = f.target.result;
                    imagePreview.style.display = 'block';
                    // Clear URL input if file is selected
                    artImageInput.value = 'Hébergement en cours...';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (removePreview) {
        removePreview.addEventListener('click', () => {
            artFile.value = '';
            previewImg.src = '';
            imagePreview.style.display = 'none';
            artImageInput.value = '';
        });
    }

    if (artImageInput) {
        artImageInput.addEventListener('input', (e) => {
            if (e.target.value && e.target.value.startsWith('http')) {
                previewImg.src = e.target.value;
                imagePreview.style.display = 'block';
            } else if (!artFile.files[0]) {
                imagePreview.style.display = 'none';
            }
        });
    }

    if (cancelArticleModalBtn) {
        cancelArticleModalBtn.addEventListener('click', () => {
            articleModal.classList.remove('active');
        });
    }

    // Article Form Submit
    if (articleForm) {
        articleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const saveBtn = document.getElementById('saveArticleBtn');
            saveBtn.disabled = true;
            saveBtn.textContent = "Publication...";

            const id = document.getElementById('artId').value;
            const file = document.getElementById('artFile').files[0];
            let imageUrl = document.getElementById('artImage').value;

            try {
                // Handle File Upload if present
                if (file) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
                    const filePath = `articles/${fileName}`;

                    const { error: uploadError } = await supabaseClient.storage
                        .from('blog-images')
                        .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    const { data: publicUrlData } = supabaseClient.storage
                        .from('blog-images')
                        .getPublicUrl(filePath);

                    imageUrl = publicUrlData.publicUrl;
                }

                const payload = {
                    title: document.getElementById('artTitle').value,
                    category: document.getElementById('artCat').value,
                    image_url: imageUrl,
                    excerpt: document.getElementById('artExcerpt').value,
                    content: quill ? quill.root.innerHTML : document.getElementById('artContent').value
                };

                const { data: res, error } = isEditingArticle && id
                    ? await supabaseClient.from('blog_articles').update(payload).eq('id', id)
                    : await supabaseClient.from('blog_articles').insert([payload]);

                if (error) throw error;

                articleModal.classList.remove('active');
                await loadArticles();

            } catch (err) {
                console.error("Supabase Error:", err);
                alert("Erreur lors de la publication de l'article.");
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = isEditingArticle ? "Enregistrer" : "Publier";
            }
        });
    }

    // Edit Article
    window.editArticle = async (id) => {
        const { data, error } = await supabaseClient.from('blog_articles').select('*').eq('id', id).single();
        if (error || !data) return alert("Erreur lors de la récupération de l'article.");

        isEditingArticle = true;
        document.getElementById('artId').value = data.id;
        document.getElementById('artTitle').value = data.title;
        document.getElementById('artCat').value = data.category;
        document.getElementById('artImage').value = data.image_url || '';
        document.getElementById('artExcerpt').value = data.excerpt || '';

        // Set Quill Content
        if (quill) {
            quill.root.innerHTML = data.content || '';
        } else {
            document.getElementById('artContent').value = data.content;
        }

        // Show preview if image exists
        const previewImg = document.getElementById('previewImg');
        const imagePreview = document.getElementById('imagePreview');
        if (data.image_url) {
            previewImg.src = data.image_url;
            imagePreview.style.display = 'block';
        } else {
            imagePreview.style.display = 'none';
        }

        document.getElementById('articleModalTitle').textContent = 'Modifier l\'Article';
        articleModal.classList.add('active');
    };

    // Delete Article
    window.deleteArticle = async (id) => {
        if (!confirm("Voulez-vous vraiment supprimer cet article ?")) return;

        const { error } = await supabaseClient.from('blog_articles').delete().eq('id', id);
        if (error) return alert("Erreur lors de la suppression.");

        await loadArticles();
    };

    // ----------------------------------------------------
    // PAGE CONTENT LOGIC
    // ----------------------------------------------------
    const pagesTableBody = document.getElementById('pagesTableBody');
    const pageContentModal = document.getElementById('pageContentModal');
    const pageContentForm = document.getElementById('pageContentForm');
    const cancelPageContentModalBtn = document.getElementById('cancelPageContentModalBtn');

    async function loadPageContent() {
        if (!pagesTableBody) return;
        pagesTableBody.innerHTML = '<tr><td colspan="4" class="loading-state">Chargement...</td></tr>';

        const { data, error } = await supabaseClient.from('site_content').select('*').order('page_id', { ascending: true });

        if (error) {
            pagesTableBody.innerHTML = '<tr><td colspan="4" class="loading-state">Erreur de chargement</td></tr>';
            return;
        }

        pagesTableBody.innerHTML = data.map(c => `
            <tr>
                <td style="font-weight:600; text-transform: capitalize;">${c.page_id}</td>
                <td style="color:#718096; font-size:0.85rem">${c.section_id}</td>
                <td>
                    <div style="font-size:0.85rem; color:#4a5568; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        ${c.content_text}
                    </div>
                </td>
                <td>
                    <button class="action-btn" onclick="editPageContent(${c.id})" title="Modifier">
                        <span class="material-symbols-rounded" style="font-size:18px">edit</span>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    window.editPageContent = async (id) => {
        const { data, error } = await supabaseClient.from('site_content').select('*').eq('id', id).single();
        if (error || !data) return alert("Erreur lors de la récupération.");

        document.getElementById('contentId').value = data.id;
        document.getElementById('contentInfo').value = `${data.page_id} > ${data.section_id}`;
        document.getElementById('contentText').value = data.content_text;
        pageContentModal.classList.add('active');
    };

    if (cancelPageContentModalBtn) {
        cancelPageContentModalBtn.addEventListener('click', () => {
            pageContentModal.classList.remove('active');
        });
    }

    if (pageContentForm) {
        pageContentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('contentId').value;
            const content = document.getElementById('contentText').value;

            const saveBtn = document.getElementById('savePageContentBtn');
            saveBtn.disabled = true;
            saveBtn.textContent = "Sauvegarde...";

            const { error } = await supabaseClient.from('site_content').update({ content_text: content, last_updated: new Date() }).eq('id', id);

            if (error) {
                alert("Erreur lors de la mise à jour.");
            } else {
                pageContentModal.classList.remove('active');
                loadPageContent();
            }
            saveBtn.disabled = false;
            saveBtn.textContent = "Enregistrer";
        });
    }

    // --- INITIAL LOAD ---
    loadProducts();

});
