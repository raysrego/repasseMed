/*
# Sistema de Controle de Repasse Médico - Schema Completo

1. Tabelas Principais
  - `medicos` - Cadastro de médicos
  - `convenios` - Cadastro de convênios
  - `hospitais` - Cadastro de hospitais
  - `producao_mensal` - Registro de consultas mensais
  - `repasses` - Controle de repasses (convênio e particular)

2. Funcionalidades
  - Controle de produção mensal por médico/convênio
  - Repasses por convênio e particulares
  - Diferenciação entre consultas e cirurgias
  - Cálculos automáticos de totais

3. Segurança
  - RLS habilitado em todas as tabelas
  - Políticas para usuários autenticados e anônimos
  - Índices para performance

4. Dados de Exemplo
  - Médicos, convênios e hospitais pré-cadastrados
  - Exemplos de produção e repasses
*/

-- =============================================
-- CRIAÇÃO DAS TABELAS
-- =============================================

-- Tabela de Médicos
CREATE TABLE IF NOT EXISTS medicos (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nome text NOT NULL,
  especialidade text,
  created_at timestamptz DEFAULT now()
);

-- Tabela de Convênios
CREATE TABLE IF NOT EXISTS convenios (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nome text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabela de Hospitais
CREATE TABLE IF NOT EXISTS hospitais (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nome text NOT NULL,
  cidade text,
  created_at timestamptz DEFAULT now()
);

-- Tabela de Produção Mensal
CREATE TABLE IF NOT EXISTS producao_mensal (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  medico_id bigint NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
  convenio_id bigint NOT NULL REFERENCES convenios(id) ON DELETE CASCADE,
  nome_paciente text NOT NULL,
  data_consulta date NOT NULL,
  valor decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Tabela de Repasses
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

-- =============================================
-- CONFIGURAÇÃO DE SEGURANÇA (RLS)
-- =============================================

-- Habilitar Row Level Security
ALTER TABLE medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE convenios ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitais ENABLE ROW LEVEL SECURITY;
ALTER TABLE producao_mensal ENABLE ROW LEVEL SECURITY;
ALTER TABLE repasses ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários autenticados (acesso total)
CREATE POLICY "Allow all for authenticated users" ON medicos FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON convenios FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON hospitais FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON producao_mensal FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON repasses FOR ALL TO authenticated USING (true);

-- Políticas para usuários anônimos (para demonstração)
CREATE POLICY "Allow read for anonymous users" ON medicos FOR SELECT TO anon USING (true);
CREATE POLICY "Allow read for anonymous users" ON convenios FOR SELECT TO anon USING (true);
CREATE POLICY "Allow read for anonymous users" ON hospitais FOR SELECT TO anon USING (true);
CREATE POLICY "Allow read for anonymous users" ON producao_mensal FOR SELECT TO anon USING (true);
CREATE POLICY "Allow read for anonymous users" ON repasses FOR SELECT TO anon USING (true);

-- Permitir inserção/atualização para usuários anônimos (demo)
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

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

-- Índices para Produção Mensal
CREATE INDEX IF NOT EXISTS idx_producao_medico_id ON producao_mensal(medico_id);
CREATE INDEX IF NOT EXISTS idx_producao_convenio_id ON producao_mensal(convenio_id);
CREATE INDEX IF NOT EXISTS idx_producao_data_consulta ON producao_mensal(data_consulta);

-- Índices para Repasses
CREATE INDEX IF NOT EXISTS idx_repasses_medico_id ON repasses(medico_id);
CREATE INDEX IF NOT EXISTS idx_repasses_convenio_id ON repasses(convenio_id);
CREATE INDEX IF NOT EXISTS idx_repasses_hospital_id ON repasses(hospital_id);
CREATE INDEX IF NOT EXISTS idx_repasses_data_cirurgia ON repasses(data_cirurgia);
CREATE INDEX IF NOT EXISTS idx_repasses_is_particular ON repasses(is_particular);
CREATE INDEX IF NOT EXISTS idx_repasses_tipo ON repasses(tipo);

-- =============================================
-- DADOS DE EXEMPLO
-- =============================================

-- Inserir médicos de exemplo
INSERT INTO medicos (nome, especialidade) VALUES
('Dr. João Silva', 'Cardiologia'),
('Dra. Maria Santos', 'Ortopedia'),
('Dr. Carlos Oliveira', 'Neurologia'),
('Dra. Ana Costa', 'Ginecologia'),
('Dr. Pedro Lima', 'Cirurgia Geral')
ON CONFLICT DO NOTHING;

-- Inserir convênios de exemplo
INSERT INTO convenios (nome) VALUES
('Unimed'),
('Bradesco Saúde'),
('Amil'),
('SulAmérica'),
('Hapvida'),
('NotreDame Intermédica')
ON CONFLICT DO NOTHING;

-- Inserir hospitais de exemplo
INSERT INTO hospitais (nome, cidade) VALUES
('Hospital São Lucas', 'São Paulo'),
('Hospital Albert Einstein', 'São Paulo'),
('Hospital Sírio-Libanês', 'São Paulo'),
('Hospital das Clínicas', 'São Paulo'),
('Hospital Santa Catarina', 'São Paulo'),
('Hospital Oswaldo Cruz', 'São Paulo')
ON CONFLICT DO NOTHING;

-- Inserir exemplos de produção mensal
INSERT INTO producao_mensal (medico_id, convenio_id, nome_paciente, data_consulta, valor) VALUES
(1, 1, 'José da Silva', '2024-01-15', 150.00),
(1, 2, 'Maria Oliveira', '2024-01-16', 180.00),
(2, 1, 'Carlos Santos', '2024-01-17', 200.00),
(2, 3, 'Ana Lima', '2024-01-18', 175.00),
(3, 2, 'Pedro Costa', '2024-01-19', 220.00)
ON CONFLICT DO NOTHING;

-- Inserir exemplos de repasses por convênio
INSERT INTO repasses (medico_id, convenio_id, nome_paciente, hospital_id, data_cirurgia, valor, tipo, is_particular) VALUES
(1, 1, 'Roberto Silva', 1, '2024-01-20', 500.00, 'consulta', false),
(2, 2, 'Fernanda Costa', 2, '2024-01-21', 1200.00, 'cirurgia', false),
(3, 1, 'Marcos Oliveira', 1, '2024-01-22', 300.00, 'consulta', false)
ON CONFLICT DO NOTHING;

-- Inserir exemplos de repasses particulares
INSERT INTO repasses (medico_id, convenio_id, nome_paciente, hospital_id, data_cirurgia, valor, tipo, is_particular) VALUES
(1, NULL, 'Lucia Santos', 3, '2024-01-23', 800.00, 'consulta', true),
(2, NULL, 'Ricardo Lima', 2, '2024-01-24', 2500.00, 'cirurgia', true),
(4, NULL, 'Patricia Alves', 4, '2024-01-25', 600.00, 'consulta', true),
(5, NULL, 'Eduardo Ferreira', 1, '2024-01-26', 3000.00, 'cirurgia', true)
ON CONFLICT DO NOTHING;