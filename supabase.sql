/* 1. Tabela de Usuarios (users) */
CREATE TABLE IF NOT EXISTS public.users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  phone text UNIQUE NOT NULL,
  password text NOT NULL,
  withdraw_pass text NOT NULL,
  balance numeric DEFAULT 0 NOT NULL,
  available numeric DEFAULT 0 NOT NULL,
  invested numeric DEFAULT 0 NOT NULL,
  sponsor text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura" ON public.users FOR SELECT USING (true);
CREATE POLICY "Inserção" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização" ON public.users FOR UPDATE USING (true); 

/* 2. Tabela de Transacoes e Historico (transactions) */
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_phone text NOT NULL, 
  type text NOT NULL, 
  amount numeric NOT NULL,
  description text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.transactions ADD CONSTRAINT fk_user_phone FOREIGN KEY (user_phone) REFERENCES public.users(phone) ON DELETE CASCADE;

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Registro aberto" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Criacao de transacao" ON public.transactions FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users (phone);
CREATE INDEX IF NOT EXISTS idx_transactions_phone ON public.transactions (user_phone);
