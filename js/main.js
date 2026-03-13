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
                const waNumber = "0194013991"; // Pharmacie du Port WhatsApp
                const waText = `Bonjour Pharmacie du Port,%0A%0ANouveau message de contact :%0A- *Nom* : ${name}%0A- *Email* : ${email}%0A- *Objet* : ${subject}%0A- *Téléphone* : ${phone}%0A- *Message* :%0A${message}`;
                
                const waUrl = `https://wa.me/229${waNumber}?text=${waText}`;

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
        waButton.href = 'https://wa.me/0194013991';
        waButton.className = 'whatsapp-float';
        waButton.target = '_blank';
        waButton.rel = 'noopener noreferrer';
        waButton.innerHTML = `
            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp">
            <span>WhatsApp</span>
        `;
        document.body.appendChild(waButton);
    };

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
