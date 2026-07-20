CREATE TABLE IF NOT EXISTS apbd_yearly_data (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  year integer NOT NULL,
  total_budget numeric(20,2),
  flow_data jsonb,
  status text DEFAULT 'PUBLISHED',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS csr_yearly_data (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  year integer NOT NULL,
  total_amount numeric(20,2),
  company_count integer DEFAULT 0,
  flow_data jsonb,
  status text DEFAULT 'PUBLISHED',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

INSERT INTO apbd_yearly_data (year, total_budget, flow_data, status) VALUES
  (2024, 45.2, '{"label":"Dana APBD 2024","amount":45.2}', 'PUBLISHED'),
  (2025, 52.8, '{"label":"Dana APBD 2025","amount":52.8}', 'PUBLISHED'),
  (2026, 58.1, '{"label":"Dana APBD 2026","amount":58.1}', 'PUBLISHED')
ON CONFLICT DO NOTHING;

INSERT INTO csr_yearly_data (year, total_amount, company_count, flow_data, status) VALUES
  (2024, 12.5, 145, '{"label":"Dana CSR 2024","amount":12.5}', 'PUBLISHED'),
  (2025, 15.3, 189, '{"label":"Dana CSR 2025","amount":15.3}', 'PUBLISHED'),
  (2026, 18.7, 210, '{"label":"Dana CSR 2026","amount":18.7}', 'PUBLISHED')
ON CONFLICT DO NOTHING;

SELECT 'apbd_yearly_data' as table_name, count(*) FROM apbd_yearly_data
UNION ALL
SELECT 'csr_yearly_data', count(*) FROM csr_yearly_data;
