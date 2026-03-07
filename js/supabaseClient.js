// js/supabaseClient.js

// Supabase project URL
const supabaseUrl = 'https://csjqynahzbtozuglsnxt.supabase.co';
// Supabase public anon key
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzanF5bmFoemJ0b3p1Z2xzbnh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MTg4NzgsImV4cCI6MjA4ODM5NDg3OH0.bucVhchmly7yBKAqWYVrryGtoiID4JJUjD07b9s8RZE';

window.supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
