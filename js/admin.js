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
            if (targetId === 'dashboard-panel') loadProducts();
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

    // Load Products
    async function loadProducts() {
        productsTableBody.innerHTML = '<tr><td colspan="6" class="loading-state">Chargement...</td></tr>';
        const { data, error } = await supabaseClient.from('products').select('*').order('id', { ascending: false });

        if (error) {
            productsTableBody.innerHTML = '<tr><td colspan="6" class="loading-state">Erreur de chargement</td></tr>';
            return;
        }

        if (data.length === 0) {
            productsTableBody.innerHTML = '<tr><td colspan="6" class="loading-state">Aucun produit dans la base</td></tr>';
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
        messagesTableBody.innerHTML = '<tr><td colspan="5" class="loading-state">Chargement...</td></tr>';
        const { data, error } = await supabaseClient.from('contact_messages').select('*').order('created_at', { ascending: false });

        if (error) {
            messagesTableBody.innerHTML = '<tr><td colspan="5" class="loading-state">Erreur de chargement</td></tr>';
            return;
        }

        if (data.length === 0) {
            messagesTableBody.innerHTML = '<tr><td colspan="5" class="loading-state">Aucun message pour le moment.</td></tr>';
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
                    <div style="font-weight:600; font-size:0.9rem">${m.subject || 'Sans sujet'}</div>
                    <div style="font-size:0.85rem; color:#4a5568; margin-top:4px">${m.message}</div>
                </td>
            </tr>
        `}).join('');
    }

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

            let detailsHtml = '';
            if (o.prescription_notes) {
                detailsHtml = `<em>Ordonnance jointe sur WA</em><br><small>Notes: ${o.prescription_notes}</small>`;
            } else if (o.order_items && o.order_items.length > 0) {
                detailsHtml = `<ul style="margin:0; padding-left:16px; font-size:0.85rem; color:#4a5568">` +
                    o.order_items.map(i => `<li>${i.product_name} (x${i.quantity})</li>`).join('')
                    + `</ul>`;
            }

            return `
            <tr>
                <td style="font-size:0.85rem; color:#718096">${dateStr}</td>
                <td>
                    <strong style="color:#2d3748">${o.client_name}</strong>
                    <div style="margin-top:8px">${detailsHtml}</div>
                </td>
                <td><a href="tel:${o.client_phone}" style="color:var(--primary-color)">${o.client_phone}</a></td>
                <td>
                    ${o.delivery_method === 'delivery' ? 'Livraison' : 'Retrait'}
                    ${o.delivery_address ? `<br><small style="color:#718096">${o.delivery_address}</small>` : ''}
                </td>
                <td style="font-weight:bold">${o.total_price}</td>
            </tr>
        `}).join('');
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
