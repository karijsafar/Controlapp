-- CONTROLAPP: creates tables, types and per-user security in Supabase.
-- Paste everything into Supabase → SQL Editor → Run. Safe to run more than once.

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own profile read" ON public.profiles;
DROP POLICY IF EXISTS "Own profile insert" ON public.profiles;
DROP POLICY IF EXISTS "Own profile update" ON public.profiles;
CREATE POLICY "Own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.raw_user_meta_data->>'full_name'), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Users who signed up before this script ran also get a profile.
INSERT INTO public.profiles (id, nombre, email)
SELECT id, COALESCE(raw_user_meta_data->>'nombre', raw_user_meta_data->>'full_name'), email FROM auth.users
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE TYPE public.rubro AS ENUM ('comercio','industria','servicios','gastronomia','tecnologia');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.estado_diagnostico AS ENUM ('borrador','datos_pendientes_revision','procesando','completado','error');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.estado_semaforo AS ENUM ('verde','amarillo','rojo','no_disponible');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.diagnosticos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nombre_empresa text NOT NULL,
  fecha_cierre_periodo date NOT NULL,
  meses_periodo int NOT NULL CHECK (meses_periodo BETWEEN 1 AND 12),
  rubro public.rubro NOT NULL,
  respuestas jsonb NOT NULL DEFAULT '{}'::jsonb,
  estado public.estado_diagnostico NOT NULL DEFAULT 'borrador',
  semaforo_general public.estado_semaforo,
  puntaje_general numeric,
  analisis_ia jsonb,
  share_token uuid UNIQUE,
  share_activo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diagnosticos TO authenticated;
GRANT ALL ON public.diagnosticos TO service_role;
ALTER TABLE public.diagnosticos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own diagnoses" ON public.diagnosticos;
CREATE POLICY "Own diagnoses" ON public.diagnosticos FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.datos_financieros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostico_id uuid NOT NULL UNIQUE REFERENCES public.diagnosticos(id) ON DELETE CASCADE,
  valores jsonb NOT NULL DEFAULT '{}'::jsonb,
  confirmado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.datos_financieros TO authenticated;
GRANT ALL ON public.datos_financieros TO service_role;
ALTER TABLE public.datos_financieros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own financial data" ON public.datos_financieros;
CREATE POLICY "Own financial data" ON public.datos_financieros FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.diagnosticos d WHERE d.id = diagnostico_id AND d.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.diagnosticos d WHERE d.id = diagnostico_id AND d.user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.resultados_ratios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostico_id uuid NOT NULL REFERENCES public.diagnosticos(id) ON DELETE CASCADE,
  ratio text NOT NULL,
  categoria text NOT NULL,
  valor numeric,
  referencia numeric NOT NULL,
  tipo_referencia text NOT NULL,
  desvio_pct numeric,
  estado public.estado_semaforo NOT NULL,
  nota text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resultados_ratios TO authenticated;
GRANT ALL ON public.resultados_ratios TO service_role;
ALTER TABLE public.resultados_ratios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own ratios" ON public.resultados_ratios;
CREATE POLICY "Own ratios" ON public.resultados_ratios FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.diagnosticos d WHERE d.id = diagnostico_id AND d.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.diagnosticos d WHERE d.id = diagnostico_id AND d.user_id = auth.uid()));
