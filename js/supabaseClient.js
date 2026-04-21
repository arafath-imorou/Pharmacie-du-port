// js/supabaseClient.js

// Supabase project URL (ITACORE2)
const supabaseUrl = 'https://ampktfwcpopkomrsckjm.supabase.co';
// Supabase public anon key
const supabaseKey = 'sb_publishable_FMDalRvzL6h5zW_4fTXt5g_I4dvctkD';

// Initialize Supabase client
if (typeof supabase !== 'undefined') {
    window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey, {
        db: {
            schema: 'pharmacie_port'
        }
    });
} else {
    console.error("La bibliothèque Supabase n'est pas chargée.");
}

