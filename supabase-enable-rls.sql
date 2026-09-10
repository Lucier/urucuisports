-- ============================================================
-- Habilita RLS em todas as tabelas do Urucuí Sports
--
-- Por quê: o app acessa o banco exclusivamente via Drizzle ORM
-- com a role `postgres` (superusuário), que ignora RLS.
-- Sem políticas definidas, PostgREST (anon/authenticated) fica
-- completamente bloqueado — o alerta crítico do Supabase some.
-- ============================================================

ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens    ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues            ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds             ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams              ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches            ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE top_scorers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE streams            ENABLE ROW LEVEL SECURITY;
ALTER TABLE players            ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_goals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertisers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_albums       ENABLE ROW LEVEL SECURITY;
