-- ====================================================================
-- PackSmart AI — Supabase PostgreSQL Schema & Seed Script
-- Smart India Hackathon 2026 | Problem Statement: SIH26236
-- ====================================================================

-- 1. PROFILES / USERS TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. COMMODITIES TABLE
CREATE TABLE IF NOT EXISTS commodities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  moisture NUMERIC,
  ph NUMERIC,
  fat_content NUMERIC,
  water_activity NUMERIC,
  oxygen_sensitivity TEXT DEFAULT 'Medium',
  moisture_sensitivity TEXT DEFAULT 'Medium',
  light_sensitivity TEXT DEFAULT 'Low',
  aroma_sensitivity TEXT DEFAULT 'Low',
  respiration_rate NUMERIC DEFAULT 0.0,
  storage_temperature_min NUMERIC,
  storage_temperature_max NUMERIC,
  shelf_life_days NUMERIC,
  packaging_considerations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. PACKAGING MATERIALS TABLE
CREATE TABLE IF NOT EXISTS packaging_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  otr NUMERIC NOT NULL,
  wvtr NUMERIC NOT NULL,
  thickness NUMERIC NOT NULL,
  gas_permeability TEXT,
  mechanical_strength TEXT,
  sealability TEXT,
  temperature_min NUMERIC,
  temperature_max NUMERIC,
  map_compatible BOOLEAN DEFAULT false,
  recyclability TEXT,
  biodegradability TEXT,
  estimated_cost NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ANALYSES TABLE
CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  commodity_id UUID REFERENCES commodities(id) ON DELETE SET NULL,
  storage_conditions JSONB NOT NULL,
  requirements JSONB NOT NULL,
  recommended_material_id UUID REFERENCES packaging_materials(id) ON DELETE SET NULL,
  recommendation_results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. RESEARCH SOURCES TABLE
CREATE TABLE IF NOT EXISTS sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  source_type TEXT NOT NULL,
  authors TEXT,
  publication_year INT,
  url TEXT,
  parameter TEXT,
  value TEXT,
  confidence TEXT
);

-- ====================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE commodities ENABLE ROW LEVEL SECURITY;
ALTER TABLE packaging_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view & edit their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Commodities: Public read for all users, admin write
CREATE POLICY "Public read commodities" ON commodities
  FOR SELECT USING (true);

CREATE POLICY "Admin manage commodities" ON commodities
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Packaging Materials: Public read, admin write
CREATE POLICY "Public read packaging_materials" ON packaging_materials
  FOR SELECT USING (true);

CREATE POLICY "Admin manage packaging_materials" ON packaging_materials
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Sources: Public read
CREATE POLICY "Public read sources" ON sources
  FOR SELECT USING (true);

-- Analyses: Users can view and manage their own analyses; public demo allowed
CREATE POLICY "Users manage own analyses" ON analyses
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- ====================================================================
-- SEED DATA INSERTION
-- ====================================================================

INSERT INTO commodities (name, category, moisture, ph, fat_content, water_activity, oxygen_sensitivity, moisture_sensitivity, light_sensitivity, aroma_sensitivity, respiration_rate, storage_temperature_min, storage_temperature_max, shelf_life_days, packaging_considerations)
VALUES
('Mango (Fresh Alphonso/Kesar)', 'Fresh Produce', 83.5, 4.5, 0.4, 0.98, 'Medium', 'High', 'Medium', 'High', 45.0, 10.0, 13.0, 18.0, 'Climacteric fruit susceptible to chilling injury below 10°C. Requires controlled gas transmission to avoid anaerobic fermentation.'),
('Potato Chips (Fried)', 'Snacks & Fried Foods', 1.8, 5.8, 34.5, 0.22, 'High', 'High', 'High', 'Medium', 0.0, 15.0, 25.0, 180.0, 'Extremely vulnerable to moisture absorption and lipid photo-oxidation. Requires nitrogen flushing with metallized film or aluminium laminate with OTR < 2 and WVTR < 1.'),
('Whole Milk Powder (Spray Dried)', 'Dairy Products', 3.2, 6.6, 26.5, 0.20, 'High', 'High', 'High', 'High', 0.0, 15.0, 24.0, 365.0, 'Extremely hygroscopic; moisture pickup leads to lactose crystallization and caking. High fat content prone to oxidative rancidity.'),
('Apple (Fresh Royal Gala)', 'Fresh Produce', 85.0, 3.8, 0.2, 0.98, 'Medium', 'Medium', 'Low', 'Medium', 20.0, 0.0, 4.0, 90.0, 'Low-to-moderate respiration rate. Ethylene production accelerates senescence. MAP with breathable film maintains 2-3% O2.'),
('Banana (Fresh Cavendish)', 'Fresh Produce', 75.0, 4.8, 0.3, 0.98, 'Medium', 'High', 'Low', 'Low', 60.0, 13.0, 15.0, 14.0, 'High chilling susceptibility below 13°C. Active MAP or micro-perforated liner preserves green life.'),
('Tomato (Fresh Vine-Ripe)', 'Fresh Produce', 94.5, 4.4, 0.2, 0.99, 'Medium', 'High', 'Medium', 'Low', 35.0, 10.0, 14.0, 15.0, 'Perforated films prevent condensation droplets that foster Botrytis cinerea decay.'),
('Basmati Rice (Milled White)', 'Grains & Cereals', 12.5, 6.5, 0.6, 0.60, 'Low', 'Medium', 'Low', 'High', 0.0, 15.0, 25.0, 365.0, 'Aroma retention is paramount. Woven PP/BOPP or airtight barrier bags prevent insect infestation.'),
('Crispy Biscuits / Cookies', 'Bakery & Confectionery', 2.5, 6.8, 18.0, 0.25, 'Medium', 'High', 'Medium', 'Medium', 0.0, 15.0, 25.0, 180.0, 'Requires high moisture barrier (BOPP/Metallized film flow-wrap) to preserve crispness.')
ON CONFLICT DO NOTHING;

INSERT INTO packaging_materials (name, category, otr, wvtr, thickness, gas_permeability, mechanical_strength, sealability, temperature_min, temperature_max, map_compatible, recyclability, biodegradability, estimated_cost)
VALUES
('LDPE Standard Flexible Film', 'Polymer', 3200.0, 14.5, 45.0, 'High', 'Medium', 'Excellent', -40.0, 75.0, false, 'High (Code 4 LDPE)', 'Non-biodegradable', 0.038),
('HDPE High-Density Film', 'Polymer', 1450.0, 4.8, 35.0, 'Moderate', 'High Tensile', 'Good', -50.0, 105.0, false, 'High (Code 2 HDPE)', 'Non-biodegradable', 0.045),
('BOPP Crisp Transparent Film', 'Polymer', 1350.0, 5.2, 30.0, 'Moderate', 'High Clarity & Stiffness', 'Good', -20.0, 120.0, false, 'High (Code 5 PP)', 'Non-biodegradable', 0.048),
('Metallized BOPP / LDPE Laminate', 'Laminate', 1.8, 0.85, 55.0, 'Ultra-Low', 'High Puncture Resistance', 'Excellent', -15.0, 90.0, true, 'Moderate', 'Non-biodegradable', 0.115),
('Aluminium Foil Tri-Laminate (PET/Al/PE)', 'Foil', 0.05, 0.02, 85.0, 'Impermeable', 'Maximum Burst Strength', 'Hermetic Heat-Seal', -40.0, 125.0, true, 'Low', 'Non-biodegradable', 0.265),
('Micro-Perforated Breathable Polyolefin', 'Micro-perforated', 4800.0, 32.0, 30.0, 'Tailored Gas Exchange', 'High Tear Resistance', 'Good', 2.0, 45.0, true, 'High', 'Non-biodegradable', 0.082),
('Bio-Based Compostable Film (PLA / PBAT)', 'Biodegradable', 420.0, 110.0, 35.0, 'Moderate Breathability', 'Moderate Tensile', 'Good', 0.0, 50.0, false, 'Compostable', '100% Industrially Compostable', 0.185),
('EVOH Coextruded High-Barrier Film (PE/EVOH/PE)', 'Laminate', 0.8, 2.2, 65.0, 'Very Low', 'High Toughness', 'Excellent', -30.0, 95.0, true, 'High (PE stream)', 'Non-biodegradable', 0.175),
('High-Barrier Paper/Dispersion Barrier Pouch', 'Paper', 4.5, 2.8, 75.0, 'Low Gas Permeation', 'High Stiffness', 'Good', -10.0, 80.0, true, 'Very High (>85% Paper)', 'Biodegradable Core', 0.198),
('Vacuum Barrier Skin Thermoform Film (PA/PE)', 'Flexible', 18.0, 2.6, 90.0, 'Low', 'Extreme Puncture Resistance', 'Hermetic Vacuum', -35.0, 100.0, true, 'Low', 'Non-biodegradable', 0.220)
ON CONFLICT DO NOTHING;

INSERT INTO sources (title, source_type, authors, publication_year, url, parameter, value, confidence)
VALUES
('The Commercial Storage of Fruits, Vegetables, and Florist and Nursery Stocks (Handbook 66)', 'Government Source', 'Gross, K. C., Wang, C. Y., & Saltveit, M.', 2016, 'https://www.ars.usda.gov/is/np/commercialstorage/commercialstorage.pdf', 'Optimum Storage Temperature & Respiration Rates', 'Mango: 10-13°C, 85-90% RH, Respiration 40-50 mg CO2/kg-h', 'High'),
('Food Packaging: Principles and Practice, 3rd Edition', 'Standard', 'Robertson, Gordon L.', 2013, 'https://doi.org/10.1201/b13038', 'Water Activity Critical Thresholds', 'Critical aw: Potato chips 0.35; Whole milk powder 0.25', 'High'),
('Standard Test Method for Oxygen Gas Transmission Rate (ASTM D3985)', 'Standard', 'ASTM Committee D20', 2017, 'https://www.astm.org/d3985-17.html', 'OTR Testing Methodology', 'Coulometric sensor at 23°C, 0% RH', 'High'),
('Standard Test Method for Water Vapor Transmission Rate (ASTM F1249)', 'Standard', 'ASTM Committee F02', 2020, 'https://www.astm.org/f1249-20.html', 'WVTR Testing Methodology', 'Modulated infrared sensor at 37.8°C, 90% RH', 'High')
ON CONFLICT DO NOTHING;
