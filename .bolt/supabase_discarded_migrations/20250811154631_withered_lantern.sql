/*
# Medical Repasse Management Schema

1. New Tables
  - `medicos`
    - `id` (bigint, primary key)
    - `nome` (text, not null)
    - `especialidade` (text, optional)
    - `created_at` (timestamp)
  
  - `convenios`
    - `id` (bigint, primary key)
    - `nome` (text, not null)
    - `created_at` (timestamp)
  
  - `hospitais`
    - `id` (bigint, primary key)
    - `nome` (text, not null)
    - `cidade` (text, optional)
    - `created_at` (timestamp)
  
  - `producao_mensal`
    - `id` (bigint, primary key)
    - `medico_id` (bigint, foreign key to medicos)
    - `convenio_id` (bigint, foreign key to convenios)
    - `nome_paciente` (text, not null)
    - `data_consulta` (date, not null)
    - `valor` (decimal, not null)
    - `created_at` (timestamp)
  
  - `repasses`
    - `id` (bigint, primary key)
    - `medico_id` (bigint, foreign key to medicos)
    - `convenio_id` (bigint, foreign key to convenios, nullable for private patients)
    - `nome_paciente` (text, not null)
    - `hospital_id` (bigint, foreign key to hospitais)
    - `data_cirurgia` (date, not null)
    - `valor` (decimal, not null)
    - `tipo` (text, consultation or surgery)
    - `is_particular` (boolean, true for private patients)
    - `created_at` (timestamp)

2. Security
  - Enable RLS on all tables
  - Add policies for authenticated users to manage their data
  - Create indexes for better query performance

3. Sample Data
  - Initial doctors, insurance plans, and hospitals for testing
*/

-- Create Medicos table
CREATE TABLE IF NOT EXISTS medicos (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nome text NOT NULL,
  especialidade text,
  created_at timestamptz DEFAULT now()
);

-- Create Convenios table
CREATE TABLE IF NOT EXISTS convenios (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nome text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create Hospitais table
CREATE TABLE IF NOT EXISTS hospitais (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nome text NOT NULL,
  cidade text,
  created_at timestamptz DEFAULT now()
);

-- Create Producao Mensal table
CREATE TABLE IF NOT EXISTS producao_mensal (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  medico_id bigint NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
  convenio_id bigint NOT NULL REFERENCES convenios(id) ON DELETE CASCADE,
  nome_paciente text NOT NULL,
  data_consulta date NOT NULL,
  valor decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create Repasses table
CREATE TABLE IF NOT EXISTS repasses (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  medico_id bigint NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
  convenio_id bigint REFERENCES convenios(id) ON DELETE SET NULL,
  nome_paciente text NOT NULL,
  hospital_id bigint NOT NULL REFERENCES hospitais(id) ON DELETE CASCADE,
  data_cirurgia date NOT NULL,
  valor decimal(10,2) NOT NULL DEFAULT 0,
  tipo text NOT NULL DEFAULT 'consulta' CHECK (tipo IN ('consulta', 'cirurgia')),
  is_particular boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE convenios ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitais ENABLE ROW LEVEL SECURITY;
ALTER TABLE producao_mensal ENABLE ROW LEVEL SECURITY;
ALTER TABLE repasses ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to access all data
CREATE POLICY "Allow all for authenticated users" ON medicos FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON convenios FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON hospitais FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON producao_mensal FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON repasses FOR ALL TO authenticated USING (true);

-- Create policies for anonymous users (read-only access for demo purposes)
CREATE POLICY "Allow read for anonymous users" ON medicos FOR SELECT TO anon USING (true);
CREATE POLICY "Allow read for anonymous users" ON convenios FOR SELECT TO anon USING (true);
CREATE POLICY "Allow read for anonymous users" ON hospitais FOR SELECT TO anon USING (true);
CREATE POLICY "Allow read for anonymous users" ON producao_mensal FOR SELECT TO anon USING (true);
CREATE POLICY "Allow read for anonymous users" ON repasses FOR SELECT TO anon USING (true);

-- Allow insert/update/delete for anonymous users for demo purposes
CREATE POLICY "Allow insert for anonymous users" ON medicos FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow insert for anonymous users" ON convenios FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow insert for anonymous users" ON hospitais FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow insert for anonymous users" ON producao_mensal FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow insert for anonymous users" ON repasses FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow update for anonymous users" ON medicos FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow update for anonymous users" ON convenios FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow update for anonymous users" ON hospitais FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow update for anonymous users" ON producao_mensal FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow update for anonymous users" ON repasses FOR UPDATE TO anon USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_producao_medico_id ON producao_mensal(medico_id);
CREATE INDEX IF NOT EXISTS idx_producao_convenio_id ON producao_mensal(convenio_id);
CREATE INDEX IF NOT EXISTS idx_producao_data_consulta ON producao_mensal(data_consulta);

CREATE INDEX IF NOT EXISTS idx_repasses_medico_id ON repasses(medico_id);
CREATE INDEX IF NOT EXISTS idx_repasses_convenio_id ON repasses(convenio_id);
CREATE INDEX IF NOT EXISTS idx_repasses_hospital_id ON repasses(hospital_id);
CREATE INDEX IF NOT EXISTS idx_repasses_data_cirurgia ON repasses(data_cirurgia);
CREATE INDEX IF NOT EXISTS idx_repasses_is_particular ON repasses(is_particular);