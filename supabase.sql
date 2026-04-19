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
  points integer DEFAULT 0 NOT NULL,
  last_checkin timestamp with time zone,
  spins_used integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura" ON public.users FOR SELECT USING (true);
CREATE POLICY "Inserção" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização" ON public.users FOR UPDATE USING (true); 
CREATE POLICY "Exclusao usuario" ON public.users FOR DELETE USING (true);

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
CREATE POLICY "Atualizacao transacao" ON public.transactions FOR UPDATE USING (true);
CREATE POLICY "Exclusao transacao" ON public.transactions FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users (phone);
CREATE INDEX IF NOT EXISTS idx_transactions_phone ON public.transactions (user_phone);

/* 3. Tabela Dinâmica de Planos de Investimento (plans) */
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  duration integer NOT NULL,
  daily_return numeric NOT NULL,
  min_amount numeric NOT NULL,
  max_amount numeric NOT NULL,
  is_surprise boolean DEFAULT false,
  starts_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura global de planos" ON public.plans FOR SELECT USING (true);
CREATE POLICY "Insercao de planos" ON public.plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Exclusao de planos" ON public.plans FOR DELETE USING (true);
CREATE POLICY "Atualizacao de planos" ON public.plans FOR UPDATE USING (true);
