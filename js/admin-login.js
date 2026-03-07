// js/admin-login.js

document.addEventListener('DOMContentLoaded', () => {
    // Redirect if already logged in
    checkSession();

    const loginForm = document.getElementById('adminLoginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    const errorMessage = document.getElementById('errorMessage');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (!email || !password) return;

            loginBtn.textContent = 'Connexion...';
            loginBtn.disabled = true;
            errorMessage.style.display = 'none';

            try {
                const { data, error } = await window.supabase.auth.signInWithPassword({
                    email: email,
                    password: password,
                });

                if (error) throw error;

                // Success - Redirect to dashboard
                window.location.href = 'admin.html';

            } catch (err) {
                console.error("Login Error:", err);
                errorMessage.textContent = err.message || "Identifiants incorrects. Veuillez réessayer.";
                errorMessage.style.display = 'block';
            } finally {
                loginBtn.textContent = 'Se Connecter';
                loginBtn.disabled = false;
            }
        });
    }

    async function checkSession() {
        const { data: { session } } = await window.supabase.auth.getSession();
        if (session) {
            window.location.href = 'admin.html'; // Already logged in
        }
    }
});
