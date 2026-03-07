document.addEventListener('DOMContentLoaded', () => {
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
                // Insert into Supabase
                const { error } = await window.supabase.from('contact_messages').insert([
                    { name, email, subject, phone, message }
                ]);

                if (error) throw error;

                alert("Votre message a été envoyé avec succès ! Nous vous recontacterons bientôt.");
                contactForm.reset();
            } catch (err) {
                console.error("Erreur lors de l'envoi du message :", err);
                alert("Une erreur est survenue lors de l'envoi de votre message. Veuillez réessayer plus tard.");
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

    // On-Call Countdown Logic
    const initOnCallCountdown = () => {
        const statusBadge = document.getElementById('on-call-status-badge');
        const statusText = document.getElementById('on-call-status-text');
        const countdownLabel = document.getElementById('countdown-label');
        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');

        if (!statusBadge || !statusText) return;

        // Hardcoded target for demonstration (End of current guard week)
        // In a real scenario, this would come from Supabase
        const targetDate = new Date('2026-03-10T08:00:00').getTime();

        const updateCountdown = () => {
            const now = new Date().getTime();
            const distance = targetDate - now;

            if (distance < 0) {
                // Not on call anymore
                statusBadge.classList.remove('status-active');
                statusText.innerText = "PAS DE GARDE ACTUELLEMENT";
                countdownLabel.innerText = "Prochaine garde dans :";
                // For demo, we just set a future date if past
                return;
            }

            // Currently on call
            statusBadge.classList.add('status-active');
            statusText.innerText = "EN GARDE CETTE SEMAINE";
            countdownLabel.innerText = "Fin de la garde dans :";

            // Calculations
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

            // Update UI
            if (daysEl) daysEl.innerText = days.toString().padStart(2, '0');
            if (hoursEl) hoursEl.innerText = hours.toString().padStart(2, '0');
            if (minutesEl) minutesEl.innerText = minutes.toString().padStart(2, '0');
        };

        updateCountdown();
        setInterval(updateCountdown, 60000); // Update every minute
    };

    injectWhatsAppButton();
    initOnCallCountdown();
});
