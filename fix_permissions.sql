-- Script de correction des permissions pour le rôle public (anon)
-- À exécuter dans le SQL Editor de Supabase pour activer l'affichage des produits sur le site

-- 1. Donner l'accès au schéma
GRANT USAGE ON SCHEMA pharmacie_port TO anon;
GRANT USAGE ON SCHEMA pharmacie_port TO authenticated;

-- 2. Donner le droit de lecture sur toutes les tables du schéma
GRANT SELECT ON ALL TABLES IN SCHEMA pharmacie_port TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA pharmacie_port TO authenticated;

-- 3. S'assurer que les futurs ajouts soient aussi lisibles
ALTER DEFAULT PRIVILEGES IN SCHEMA pharmacie_port GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA pharmacie_port GRANT SELECT ON TABLES TO authenticated;

-- 4. Désactiver RLS pour simplifier si nécessaire (Optionnel mais recommandé pour un site vitrine public)
ALTER TABLE pharmacie_port.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacie_port.blog_articles DISABLE ROW LEVEL SECURITY;
