-- ========================================
-- 1 HUNDRED E-commerce Database Schema
-- Run this in your Supabase SQL Editor
-- ========================================

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title TEXT NOT NULL,
    price FLOAT NOT NULL,
    category TEXT,
    images TEXT[],
    image TEXT,
    stock INTEGER DEFAULT 0,
    description TEXT,
    sizes TEXT[],
    colors TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to everyone
CREATE POLICY "Allow public read access" 
ON products FOR SELECT 
TO anon, authenticated 
USING (true);

-- Write access restricted to authenticated users with admin role
-- To grant admin: UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}' WHERE email = 'your-admin@email.com';
CREATE POLICY "Allow admin write access"
ON products FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt()->'app_metadata'->>'role') = 'admin');

CREATE POLICY "Allow admin update access"
ON products FOR UPDATE
TO authenticated
USING ((auth.jwt()->'app_metadata'->>'role') = 'admin')
WITH CHECK ((auth.jwt()->'app_metadata'->>'role') = 'admin');

CREATE POLICY "Allow admin delete access"
ON products FOR DELETE
TO authenticated
USING ((auth.jwt()->'app_metadata'->>'role') = 'admin');

-- Insert sample products (matches your current hardcoded products)
INSERT INTO products (id, title, price, category, images, image, stock, description, sizes, colors) 
VALUES 
    (
        3, 
        '1H Star Cap', 
        30, 
        'Hats', 
        ARRAY['product-3.png'], 
        'product-3.png', 
        12, 
        '1H Star Cap (Black & White)

A refined essential, the 1H Star Cap is defined by contrast, structure, and intent. Rendered in a distressed black and white finish, the design carries a worn-in character that speaks to experience, not excess.

The front is anchored by the signature 1H star emblem, a symbol of commitment at the highest level. Clean yet commanding, it reflects a mindset built on discipline and consistency.

At the back, the statement "No Half Measures" is subtly placed—reinforcing the philosophy behind the piece. Every detail is deliberate, from the curved brim to the structured crown, balancing durability with a sharp, elevated silhouette.

Understated. Focused. Uncompromising.

All or nothing.',
        ARRAY['One Size'],
        ARRAY['White/Black']
    ),
    (
        4, 
        'The No Half Measures Hoodie', 
        85, 
        'Hoodies', 
        ARRAY['product-4.jpeg'], 
        'product-4.jpeg', 
        8, 
        'The No Half Measures Hoodie is a study in precision and intent. Rendered in deep black with a subtle tonal pattern, the piece is defined by its layered composition—balancing restraint with quiet complexity.

A collage of monochrome portrait graphics introduces a raw, expressive edge, contrasted by the structured 1H insignia, a symbol of total commitment. Minimal text detailing reinforces the philosophy: nothing partial, nothing diluted.

Refined embellishments are placed with purpose, adding texture without excess. The silhouette remains clean and controlled, offering a relaxed fit that moves effortlessly between statement and staple.

Every element is considered. Nothing is accidental.

All in. Always.',
        ARRAY['S', 'M', 'L', 'XL'],
        ARRAY['Black']
    ),
    (
        5, 
        'Endless Possibilities Hoodie', 
        85, 
        'Hoodies', 
        ARRAY['product-5.jpeg'], 
        'product-5.jpeg', 
        15, 
        'Endless Possibilities Hoodie

A refined expression of intent, the Endless Possibilities Hoodie is defined by its balance of structure and ease. Crafted in a washed blue finish, the silhouette is relaxed yet precise, offering a quiet sense of presence.

The signature 1H mark anchors the piece, while subtle text detailing speaks to a mindset of limitless direction. Studded accents introduce a restrained edge, complementing the garment''s considered construction and tactile depth.

Understated yet deliberate, this piece moves beyond trend—designed for those who operate with clarity and purpose.

Without limits.',
        ARRAY['S', 'M', 'L', 'XL'],
        ARRAY['Blue']
    ),
    (
        6, 
        '1H Multi Colour Cap', 
        30, 
        'Hats', 
        ARRAY['product-6.jpeg'], 
        'product-6.jpeg', 
        20, 
        'Colorful trucker hat with 1H branding.',
        ARRAY['One Size'],
        ARRAY['White/Black']
    ),
    (
        7, 
        'Relentless Trophy Tee', 
        40, 
        'T-Shirts',
        ARRAY['product-relentless-front.png', 'product-relentless-back.png'], 
        'product-relentless-front.png', 
        25, 
        'The Relentless Trophy Tee distills discipline into design. A monochrome composition of a faceless, armored figure holding its reward—symbolizing victory earned through persistence, not chance.

Refined, understated, and intentional, this piece speaks to those who pursue excellence without compromise.

Earned. Never given.',
        ARRAY['S', 'M', 'L', 'XL'],
        ARRAY['Grey']
    )
ON CONFLICT (id) DO NOTHING;

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Setup Complete!
-- ========================================
