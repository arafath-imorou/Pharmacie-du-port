document.addEventListener('DOMContentLoaded', () => {
    // Dismiss Preloader
    const preloader = document.getElementById('site-preloader');
    const dismissPreloader = () => {
        if (preloader) {
            preloader.classList.add('fade-out');
            document.body.classList.remove('loading');
        }
    };

    // Ensure preloader is gone even if something hangs
    window.addEventListener('load', dismissPreloader);
    setTimeout(dismissPreloader, 3000); // Max wait 3 seconds

    // Navigation logic handled by inline onclick in HTML for maximum compatibility
    // (See .mobile-menu-btn in HTML files)

    // Header Scroll Effect
    const headerWrapper = document.querySelector('.header-wrapper');
    if (headerWrapper) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                headerWrapper.classList.add('header-scrolled');
            } else {
                headerWrapper.classList.remove('header-scrolled');
            }
        });
    }

    // Counter Animation
    const counters = document.querySelectorAll('.counter');
    const speed = 200; // The lower the slower

    const startCounter = (counter) => {
        const animate = () => {
            const target = +counter.getAttribute('data-target');
            const count = +counter.innerText;
            const increment = target / speed;

            if (count < target) {
                counter.innerText = Math.ceil(count + increment);
                setTimeout(animate, 10);
            } else {
                counter.innerText = target;
            }
        };
        animate();
    };

    const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                startCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => {
        counterObserver.observe(counter);
    });

    // Contact Form Submission (Supabase)
    const contactForm = document.getElementById('pharmacyContactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = "Envoi en cours...";
            submitBtn.disabled = true;

            const name = document.getElementById('contactName').value;
            const email = document.getElementById('contactEmail').value;
            const subject = document.getElementById('contactSubject').value;
            const phone = document.getElementById('contactPhone').value;
            const message = document.getElementById('contactMessage').value;

            try {
                // Non-blocking attempt to insert into Supabase
                supabaseClient.from('contact_messages').insert([{
                    name, email, subject, phone, message
                }]).then(({ error }) => {
                    if (error) console.warn("Supabase backup recording failed:", error);
                });

                // Construct WhatsApp Message
                // Construct WhatsApp Message
                const waNumber = "2290194013991"; // Pharmacie du Port WhatsApp (International format)
                const rawText = `Bonjour Pharmacie du Port,\n\nNouveau message de contact :\n- *Nom* : ${name}\n- *Email* : ${email}\n- *Objet* : ${subject}\n- *Téléphone* : ${phone}\n- *Message* :\n${message}`;
                const waText = encodeURIComponent(rawText);
                
                const waUrl = `https://wa.me/${waNumber}?text=${waText}`;

                alert("Votre message a été enregistré ! Vous allez être redirigé vers WhatsApp pour envoyer le récapitulatif.");
                
                // Open WhatsApp
                window.open(waUrl, '_blank');
                
                contactForm.reset();
            } catch (err) {
                console.error("Erreur inattendue :", err);
                alert("Une erreur est survenue. Vous pouvez quand même nous contacter directement par WhatsApp.");
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // WhatsApp Floating Button Injection
    const injectWhatsAppButton = () => {
        const waButton = document.createElement('a');
        waButton.href = 'https://wa.me/2290194013991';
        waButton.className = 'whatsapp-float';
        waButton.target = '_blank';
        waButton.rel = 'noopener noreferrer';
        waButton.innerHTML = `
            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp">
            <span>WhatsApp</span>
        `;
        document.body.appendChild(waButton);
    };

    // Pharmacies de Garde Logic
    const initPharmaciesGarde = () => {
        const section = document.getElementById('pharmacies-garde-section');
        const listContainer = document.getElementById('pharmacies-list');
        const zoneFilter = document.getElementById('zone-filter');

        if (!section || !listContainer || !zoneFilter) return;

        const pharmaciesByZone = {
            'st-michel': [
                { name: 'Pharmacie Atinkanmey', phones: ['94 01 23 92', '60 01 97 72'] },
                { name: 'Pharmacie Ganhi', phones: ['95 94 36 82', '60 80 50 39'] },
                { name: 'Pharmacie Principale', phones: ['21 31 32 15'] },
                { name: 'Pharmacie Vie et Santé', phones: ['21 31 19 85', '95 64 75 31'] }
            ],
            'akpakpa': [
                { name: 'Pharmacie Agbodjèdo', phones: [] },
                { name: 'Pharmacie Bien-Être', phones: [] },
                { name: 'Pharmacie Bolarin', phones: [] },
                { name: 'Pharmacie Ciné Concorde', phones: [] },
                { name: 'Pharmacie de l’Aigle Royal', phones: [] },
                { name: 'Pharmacie Gratias Minontchou', phones: [] },
                { name: 'Nouvelle Pharmacie de l’Habitat', phones: [] },
                { name: 'Pharmacie Jak Aledjo', phones: [] },
                { name: 'Pharmacie Le Remède Sodjeatinme', phones: [] },
                { name: 'Pharmacie Midombo', phones: [] },
                { name: 'Pharmacie Reine des Grâces', phones: [] },
                { name: 'Pharmacie Sacré-Cœur', phones: [] },
                { name: 'Pharmacie Saint Urbain', phones: [] },
                { name: 'Pharmacie Saint Martin', phones: [] },
                { name: 'Pharmacie Suru-Léré', phones: [] },
                { name: 'Pharmacie Tianto', phones: [] },
                { name: 'Pharmacie Yenawa', phones: [] }
            ],
            'zogbo': [
                { name: 'Pharmacie de l’Amitié', phones: [] },
                { name: 'Pharmacie Kindonou', phones: [] },
                { name: 'Pharmacie Palace Plus', phones: [] },
                { name: 'Pharmacie Saint Gabriel', phones: [] },
                { name: 'Pharmacie Sainte Famille', phones: [] },
                { name: 'Pharmacie Sainte Madeleine de Zogbohouè', phones: [] },
                { name: 'Pharmacie Vêdoko', phones: [] },
                { name: 'Pharmacie Vie Nouvelle', phones: [] },
                { name: 'Pharmacie Zogbo', phones: [] }
            ],
            'gbegamey': [
                { name: 'Pharmacie Camp Guézo', phones: [] },
                { name: 'Pharmacie de la Paix', phones: [] },
                { name: 'Pharmacie de la Mosquée Centrale', phones: [] },
                { name: 'Pharmacie Gbégamey ex CCB', phones: [] },
                { name: 'Pharmacie Saint Jean', phones: [] }
            ],
            'sikecodji': [
                { name: 'Pharmacie du Marché Saint Michel', phones: [] },
                { name: 'Pharmacie Marina', phones: [] },
                { name: 'Pharmacie des 4 Thérapies', phones: [] },
                { name: 'Pharmacie Forum Santé CSP', phones: [] },
                { name: 'Pharmacie Okpè Oluwa', phones: [] },
                { name: 'Pharmacie Sainte Rita', phones: [] }
            ],
            'gbedjromede': [
                { name: 'Pharmacie de l’Espérance', phones: [] },
                { name: 'Pharmacie Femi', phones: [] },
                { name: 'Pharmacie Gbèdjromèdé', phones: [] },
                { name: 'Pharmacie Le Nokoué', phones: [] }
            ],
            'cadjehoun': [
                { name: 'Pharmacie de la Haie Vive', phones: [] },
                { name: 'Pharmacie de l’Étoile', phones: [] },
                { name: 'Nouvelle Pharmacie Houeyiho', phones: [] },
                { name: 'Pharmacie Sainte Philomène', phones: [] }
            ],
            'agla': [
                { name: 'Pharmacie Don de Dieu', phones: [] },
                { name: 'Pharmacie La Madone', phones: [] },
                { name: 'Pharmacie Salem-Hlazounto', phones: [] },
                { name: 'Pharmacie Les Archanges', phones: [] },
                { name: 'Pharmacie Les Pylônes', phones: [] }
            ]
        };

        const renderPharmacies = (zone) => {
            const list = pharmaciesByZone[zone] || [];
            listContainer.innerHTML = list.map(p => `
                <div class="pharmacy-card">
                    <h4>${p.name}</h4>
                    <p>
                        <span class="material-symbols-rounded">call</span>
                        ${p.phones.length > 0 ? p.phones.join(' / ') : 'Numéro non disponible'}
                    </p>
                </div>
            `).join('');
        };

        zoneFilter.addEventListener('change', (e) => {
            renderPharmacies(e.target.value);
        });

        // Initialize with default zone
        renderPharmacies('st-michel');
        
        return section; // Return for visibility control
    };

    const pharmacieGardeSection = initPharmaciesGarde();

    // On-Call Countdown Logic (Automated 1 week on / 1 week off cycle)
    const initOnCallCountdown = () => {
        const statusBadge = document.getElementById('on-call-status-badge');
        const statusText = document.getElementById('on-call-status-text');
        const countdownLabel = document.getElementById('countdown-label');
        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const secondsEl = document.getElementById('seconds');

        if (!statusBadge || !statusText) return;

        // Reference: Monday March 2nd, 2026 00:00 (Start of an ON-CALL week)
        const referenceDate = new Date('2026-03-02T00:00:00').getTime();
        const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

        const updateCountdown = () => {
            const now = new Date().getTime();
            const timeDiff = now - referenceDate;

            // Calculate how many weeks passed since reference
            const weeksPassed = Math.floor(timeDiff / oneWeekMs);
            const isOnCallWeek = weeksPassed % 2 === 0;

            // Visibility control for pharmacies de garde section
            if (pharmacieGardeSection) {
                pharmacieGardeSection.style.display = isOnCallWeek ? 'none' : 'block';
            }

            // Calculate start and end of the current 1-week block
            const currentPeriodStart = referenceDate + (weeksPassed * oneWeekMs);
            const nextPeriodStart = currentPeriodStart + oneWeekMs;

            const distance = nextPeriodStart - now;

            if (isOnCallWeek) {
                // Currently on call
                statusBadge.classList.add('status-active');
                statusText.innerText = "EN GARDE CETTE SEMAINE";
                countdownLabel.innerText = "Fin de la garde dans :";
                statusBadge.style.background = "#dcfce7";
                statusBadge.style.color = "#16a34a";
            } else {
                // Not on call
                statusBadge.classList.remove('status-active');
                statusText.innerText = "PAS DE GARDE ACTUELLEMENT";
                countdownLabel.innerText = "Prochaine garde dans :";
                statusBadge.style.background = "#fee2e2";
                statusBadge.style.color = "#ef4444";
            }

            // Calculations for display
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            // Update UI
            if (daysEl) daysEl.innerText = days.toString().padStart(2, '0');
            if (hoursEl) hoursEl.innerText = hours.toString().padStart(2, '0');
            if (minutesEl) minutesEl.innerText = minutes.toString().padStart(2, '0');
            if (secondsEl) secondsEl.innerText = seconds.toString().padStart(2, '0');
        };

        updateCountdown();
        setInterval(updateCountdown, 1000); // UI update every second
    };

    injectWhatsAppButton();
    initOnCallCountdown();
});
