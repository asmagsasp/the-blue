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
  checkin_target integer DEFAULT 7 NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura" ON public.users;
CREATE POLICY "Leitura" ON public.users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Inserção" ON public.users;
CREATE POLICY "Inserção" ON public.users FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Atualização" ON public.users;
CREATE POLICY "Atualização" ON public.users FOR UPDATE USING (true); 
DROP POLICY IF EXISTS "Exclusao usuario" ON public.users;
CREATE POLICY "Exclusao usuario" ON public.users FOR DELETE USING (true);

/* 2. Tabela de Transacoes e Historico (transactions) */
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_phone text NOT NULL, 
  type text NOT NULL, 
  amount numeric NOT NULL,
  description text NOT NULL,
  receipt text, 
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS fk_user_phone;
ALTER TABLE public.transactions ADD CONSTRAINT fk_user_phone FOREIGN KEY (user_phone) REFERENCES public.users(phone) ON DELETE CASCADE;

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Registro aberto" ON public.transactions;
CREATE POLICY "Registro aberto" ON public.transactions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Criacao de transacao" ON public.transactions;
CREATE POLICY "Criacao de transacao" ON public.transactions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Atualizacao transacao" ON public.transactions;
CREATE POLICY "Atualizacao transacao" ON public.transactions FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Exclusao transacao" ON public.transactions;
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
DROP POLICY IF EXISTS "Leitura global de planos" ON public.plans;
CREATE POLICY "Leitura global de planos" ON public.plans FOR SELECT USING (true);
DROP POLICY IF EXISTS "Insercao de planos" ON public.plans;
CREATE POLICY "Insercao de planos" ON public.plans FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Exclusao de planos" ON public.plans;
CREATE POLICY "Exclusao de planos" ON public.plans FOR DELETE USING (true);
DROP POLICY IF EXISTS "Atualizacao de planos" ON public.plans;
CREATE POLICY "Atualizacao de planos" ON public.plans FOR UPDATE USING (true);

/* 4. Função e Agendamento para Crédito de Rendimentos às 00:00 (Meia-Noite) */
CREATE OR REPLACE FUNCTION public.process_daily_yields()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    r RECORD;
    v_plan RECORD;
    v_daily_return numeric;
    v_yield_amount numeric;
    v_date_str text;
    v_exists boolean;
BEGIN
    v_date_str := to_char(now() AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY');
    
    -- Percorrer todas as transações de investimentos ativas
    FOR r IN 
        SELECT t.user_phone, t.amount, t.description, t.created_at
        FROM public.transactions t
        WHERE t.type = 'inv'
    LOOP
        -- Tentar localizar o plano de investimento pelo nome na descrição
        SELECT daily_return INTO v_daily_return 
        FROM public.plans 
        WHERE name = replace(r.description, 'Investimento: ', '')
        LIMIT 1;
        
        IF v_daily_return IS NULL THEN
            v_daily_return := 2.0; -- Taxa padrão de 2% caso o plano específico não seja localizado
        END IF;

        v_yield_amount := round(abs(r.amount) * (v_daily_return / 100.0), 2);
        
        IF v_yield_amount > 0 THEN
            -- Verificar se o rendimento desta data (00:00) já foi creditado
            SELECT EXISTS (
                SELECT 1 FROM public.transactions 
                WHERE user_phone = r.user_phone 
                  AND type = 'rendimento' 
                  AND description LIKE '%' || v_date_str || '%'
            ) INTO v_exists;
            
            IF NOT v_exists THEN
                -- Creditar saldo disponível e saldo total
                UPDATE public.users 
                SET available = available + v_yield_amount,
                    balance = balance + v_yield_amount
                WHERE phone = r.user_phone;
                
                -- Registrar histórico de transação
                INSERT INTO public.transactions (user_phone, type, amount, description)
                VALUES (
                    r.user_phone, 
                    'rendimento', 
                    v_yield_amount, 
                    'Rendimento Diário - 00:00 (' || v_date_str || ')'
                );
            END IF;
        END IF;
    END LOOP;
END;
$$;

-- Exemplo de agendamento automático no pg_cron (Executa diariamente às 00:00 BRT / 03:00 UTC):
-- SELECT cron.schedule('credit-investment-yields-midnight', '0 3 * * *', 'SELECT public.process_daily_yields();');

