document.addEventListener('DOMContentLoaded', () => {

    // --- Tabs Logic ---
    const tabs = document.querySelectorAll('.order-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Track active tab robustly
    let activeOrderType = 'prescription-panel'; // matches the default 'active' class in HTML

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.add('hidden'));

            tab.classList.add('active');
            const targetId = tab.getAttribute('data-target');
            document.getElementById(targetId).classList.remove('hidden');
            activeOrderType = targetId;
            console.log("Tab changée vers :", activeOrderType);
        });
    });

    // --- Prescription Upload Logic ---
    const prescriptionFile = document.getElementById('prescriptionFile');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    const prescriptionPreview = document.getElementById('prescriptionPreview');
    const previewImg = document.getElementById('previewImg');
    const removeFile = document.getElementById('removeFile');

    if (prescriptionFile) {
        prescriptionFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    previewImg.src = event.target.result;
                    uploadPlaceholder.classList.add('hidden');
                    prescriptionPreview.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (removeFile) {
        removeFile.addEventListener('click', () => {
            prescriptionFile.value = '';
            uploadPlaceholder.classList.remove('hidden');
            prescriptionPreview.classList.add('hidden');
            previewImg.src = '';
        });
    }

    // --- Product Search & Basket Logic ---
    const basket = [];
    const productSearch = document.getElementById('productSearch');
    const productSuggestions = document.getElementById('productSuggestions');
    const basketItems = document.getElementById('basketItems');
    const basketSummary = document.getElementById('basketSummary');
    const basketTotalAmount = document.getElementById('basketTotalAmount');

    // Access products from the global productsDb (populated by products.js)
    function getProducts() {
        return typeof productsDb !== 'undefined' ? productsDb : [];
    }

    // Helper to format price: 1705 -> 1 705 F CFA
    const formatPrice = (price) => {
        if (!price) return "0 F CFA";
        const val = typeof price === 'number' ? price : parseInt(price.toString().replace(/[^0-9]/g, ''));
        const formatted = val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        return `${formatted} F CFA`;
    };

    function showSuggestions(query = '') {
        const availableProducts = getProducts();
        const filtered = query === ''
            ? availableProducts.slice(0, 500)
            : availableProducts.filter(p => {
                const name = p.name.toLowerCase();
                const category = p.category.toLowerCase();
                return name.startsWith(query) ||
                    category.startsWith(query) ||
                    name.includes(query) ||
                    category.includes(query);
            }).sort((a, b) => {
                const aName = a.name.toLowerCase();
                const bName = b.name.toLowerCase();
                const aStarts = aName.startsWith(query);
                const bStarts = bName.startsWith(query);
                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;
                return aName.localeCompare(bName);
            }).slice(0, 500);

        if (filtered.length > 0) {
            productSuggestions.innerHTML = filtered.map(p => `
                <div class="suggestion-item" data-id="${p.id}">
                    <span class="prod-name">${p.name}</span>
                    <span class="prod-price">${formatPrice(p.price)}</span>
                </div>
            `).join('');
            productSuggestions.classList.remove('hidden');
        } else {
            productSuggestions.innerHTML = '<div class="suggestion-item">Aucun produit trouvé</div>';
            productSuggestions.classList.remove('hidden');
        }
    }

    if (productSearch) {
        productSearch.addEventListener('focus', () => {
            showSuggestions(productSearch.value.toLowerCase().trim());
        });

        productSearch.addEventListener('input', (e) => {
            showSuggestions(e.target.value.toLowerCase().trim());
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!productSearch.contains(e.target) && !productSuggestions.contains(e.target)) {
                productSuggestions.classList.add('hidden');
            }
        });

        // Add to basket
        productSuggestions.addEventListener('click', (e) => {
            const item = e.target.closest('.suggestion-item');
            if (item && item.dataset.id) {
                const id = item.dataset.id;
                const product = getProducts().find(p => String(p.id) === String(id));
                if (product) {
                    addToBasket(product);
                    productSearch.value = '';
                    productSuggestions.classList.add('hidden');
                }
            }
        });
    }

    function addToBasket(product) {
        const existing = basket.find(item => String(item.id) === String(product.id));
        if (existing) {
            existing.quantity++;
        } else {
            basket.push({ ...product, quantity: 1 });
        }
        renderBasket();
    }

    function removeFromBasket(id) {
        const index = basket.findIndex(item => item.id == id);
        if (index !== -1) {
            basket.splice(index, 1);
        }
        renderBasket();
    }

    function updateQuantity(id, delta) {
        const item = basket.find(i => i.id == id);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                removeFromBasket(id);
            } else {
                renderBasket();
            }
        }
    }

    function renderBasket() {
        if (basket.length === 0) {
            basketItems.innerHTML = '<p class="empty-basket-text">Votre panier est vide. Sélectionnez des produits ci-dessus.</p>';
            basketSummary.classList.add('hidden');
            return;
        }

        basketItems.innerHTML = basket.map(item => `
            <div class="basket-item">
                <div class="basket-item-info">
                    <span class="basket-item-name">${item.name}</span>
                    <span class="basket-item-price">${formatPrice(item.price)}</span>
                </div>
                <div class="basket-item-actions">
                    <div class="quantity-controls">
                        <button type="button" class="qty-btn" onclick="updateQty(${item.id}, -1)">
                            <span class="material-symbols-rounded">remove</span>
                        </button>
                        <span class="qty-val">${item.quantity}</span>
                        <button type="button" class="qty-btn" onclick="updateQty(${item.id}, 1)">
                            <span class="material-symbols-rounded">add</span>
                        </button>
                    </div>
                    <button type="button" class="btn-remove-item" onclick="removeProduct(${item.id})">
                        <span class="material-symbols-rounded">delete</span>
                    </button>
                </div>
            </div>
        `).join('');

        basketSummary.classList.remove('hidden');

        let total = 0;
        basket.forEach(item => {
            const val = typeof item.price === 'number' ? item.price : parseInt(item.price.toString().replace(/[^0-9]/g, ''));
            total += val * item.quantity;
        });
        basketTotalAmount.textContent = formatPrice(total);
    }

    window.updateQty = (id, delta) => updateQuantity(id, delta);
    window.removeProduct = (id) => removeFromBasket(id);

    // --- Delivery Logic ---
    const deliveryMethod = document.getElementById('deliveryMethod');
    const addressGroup = document.getElementById('addressGroup');
    const deliveryAddress = document.getElementById('deliveryAddress');

    if (deliveryMethod) {
        deliveryMethod.addEventListener('change', (e) => {
            if (e.target.value === 'delivery') {
                addressGroup.classList.remove('hidden');
                deliveryAddress.setAttribute('required', 'required');
            } else {
                addressGroup.classList.add('hidden');
                deliveryAddress.removeAttribute('required');
                deliveryAddress.value = '';
            }
        });
    }

    // --- Modal Configuration ---
    const modal = document.getElementById('orderConfirmationModal');
    const confirmBtn = document.getElementById('confirmSubmitBtn');
    const editBtn = document.getElementById('editOrderBtn');
    const closeModal = document.getElementById('closeConfirmationModal');
    const confirmationDetails = document.getElementById('confirmationDetails');

    // Declare in outer scope to ensure accessibility
    let currentFinalMessage = '';

    function showConfirmationModal() {
        const fullNameInput = document.getElementById('fullName');
        const phoneInput = document.getElementById('phone');
        
        const fullName = fullNameInput ? fullNameInput.value.trim() : '';
        const phone = phoneInput ? phoneInput.value.trim() : '';

        if (!fullName || !phone) {
            alert('Veuillez remplir votre nom et numéro de téléphone.');
            return;
        }

        let orderSummaryHtml = '';
        let orderSummaryText = '';

        if (activeOrderType === 'prescription-panel') {
            if (prescriptionFile.files.length === 0) {
                alert('Veuillez charger votre ordonnance.');
                return;
            }
            orderSummaryHtml = `
                <div class="recap-row">
                    <span class="label">Type de commande :</span>
                    <span>Ordonnance (Photo)</span>
                </div>
                <div class="recap-row">
                    <span class="label">Notes :</span>
                    <span>${document.getElementById('prescriptionNotes').value || 'Aucune'}</span>
                </div>
            `;
            orderSummaryText = `*Type:* Ordonnance (Photo ci-jointe)\n*Notes:* ${document.getElementById('prescriptionNotes').value || 'Aucune'}`;
        } else {
            if (basket.length === 0) {
                alert('Votre panier est vide. Veuillez choisir des produits.');
                return;
            }
            const itemsHtml = basket.map(item => `
                <div class="recap-item">
                    <span>${item.name} (x${item.quantity})</span>
                    <span>${formatPrice(item.price)}</span>
                </div>
            `).join('');

            orderSummaryHtml = `
                <div class="recap-row">
                    <span class="label">Type de commande :</span>
                    <span>Liste de produits</span>
                </div>
                <div class="recap-items">
                    ${itemsHtml}
                </div>
                <div class="recap-total">
                    <span>TOTAL ESTIMÉ</span>
                    <span>${basketTotalAmount.textContent}</span>
                </div>
            `;

            const itemsListText = basket.map(item => `- ${item.name} (x${item.quantity}) - ${formatPrice(item.price)}`).join('\n');
            orderSummaryText = `*Type:* Commande de produits\n*Produits:*\n${itemsListText}\n\n*TOTAL :* ${basketTotalAmount.textContent}`;
        }

        const deliveryOption = document.getElementById('deliveryMethod').selectedOptions[0].text;
        const address = document.getElementById('deliveryAddress').value;
        const payment = document.getElementById('paymentMethod').selectedOptions[0].text;

        const deliveryText = document.getElementById('deliveryMethod').value === 'pickup' ?
            'Retrait en pharmacie (Gratuit)' :
            `Livraison à domicile\n*Adresse:* ${address}`;

        let html = `
            <div class="recap-section">
                <h4>Informations Personnelles</h4>
                <div class="recap-row"><span class="label">Nom :</span> <span>${fullName}</span></div>
                <div class="recap-row"><span class="label">Téléphone :</span> <span>${phone}</span></div>
            </div>
            <div class="recap-section">
                <h4>Détails de la Commande</h4>
                ${orderSummaryHtml}
            </div>
            <div class="recap-section">
                <h4>Réception & Paiement</h4>
                <div class="recap-row"><span class="label">Mode :</span> <span>${deliveryOption}</span></div>
                ${address ? `<div class="recap-row"><span class="label">Adresse :</span> <span>${address}</span></div>` : ''}
                <div class="recap-row"><span class="label">Paiement :</span> <span>${payment}</span></div>
            </div>
        `;

        confirmationDetails.innerHTML = html;

        currentFinalMessage = `*COMMANDE EN LIGNE - PHARMACIE DU PORT*\n\n`;
        currentFinalMessage += `*CLIENT :* ${fullName}\n`;
        currentFinalMessage += `*TEL :* ${phone}\n\n`;
        currentFinalMessage += `${orderSummaryText}\n\n`;
        currentFinalMessage += `*MODE DE RÉCEPTION :* ${deliveryText}\n`;
        currentFinalMessage += `*MODE DE PAIEMENT :* ${payment}\n\n`;
        currentFinalMessage += `_Merci de confirmer ma commande._`;

        modal.classList.remove('hidden');
    }

    if (editBtn) editBtn.addEventListener('click', () => modal.classList.add('hidden'));
    if (closeModal) closeModal.addEventListener('click', () => modal.classList.add('hidden'));

    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            const originalBtnHtml = confirmBtn.innerHTML;
            confirmBtn.innerHTML = 'Traitement...';
            confirmBtn.disabled = true;

            // Gather Data fresh from inputs
            const fullName = document.getElementById('fullName').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const deliveryMethodStr = document.getElementById('deliveryMethod').value;
            const deliveryAddressVal = document.getElementById('deliveryAddress').value;
            const paymentOption = document.getElementById('paymentMethod').selectedOptions[0].text;
            const prescriptionNotes = document.getElementById('prescriptionNotes') ? document.getElementById('prescriptionNotes').value : '';
            const totalPrice = basketTotalAmount ? basketTotalAmount.textContent : '0';

            // Logs for debugging
            console.log("Tentative d'enregistrement Supabase :", { fullName, phone, deliveryMethodStr, activeOrderType });

            try {
                // 1. Save main order to Supabase
                const { data: orderData, error: orderError } = await supabaseClient.from('orders').insert([
                    {
                        client_name: fullName,
                        client_phone: phone,
                        delivery_method: deliveryMethodStr,
                        delivery_address: deliveryAddressVal,
                        payment_method: paymentOption,
                        prescription_notes: activeOrderType === 'prescription-panel' ? prescriptionNotes : null,
                        total_price: activeOrderType !== 'prescription-panel' ? totalPrice : 'N/A'
                    }
                ]).select();

                if (orderError) throw orderError;

                // 2. Save order items if it's a catalog order
                if (orderData && orderData.length > 0) {
                    const newOrderId = orderData[0].id;
                    if (activeOrderType === 'list-panel' && basket.length > 0) {
                        const itemsToInsert = basket.map(item => ({
                            order_id: newOrderId,
                            product_name: item.name,
                            quantity: item.quantity,
                            price: typeof item.price === 'number' ? item.price : parseInt(item.price.toString().replace(/[^0-9]/g, ''))
                        }));

                        const { error: itemsError } = await supabaseClient.from('order_items').insert(itemsToInsert);
                        if (itemsError) throw itemsError;
                    }
                }

                // 3. Open WhatsApp and close modal
                const whatsappNumber = '2290194013991';
                window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(currentFinalMessage)}`, '_blank');
                modal.classList.add('hidden');

            } catch (err) {
                console.error("Erreur d'enregistrement Supabase :", err);
                
                // Fallback to WhatsApp even if DB fails
                const whatsappNumber = '2290194013991';
                window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(currentFinalMessage)}`, '_blank');
                modal.classList.add('hidden');
            } finally {
                confirmBtn.innerHTML = originalBtnHtml;
                confirmBtn.disabled = false;
            }
        });
    }

    // --- WhatsApp Form Submission ---
    const orderForm = document.getElementById('pharmacyOrderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showConfirmationModal();
        });
    }
});

