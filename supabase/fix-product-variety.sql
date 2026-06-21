-- Royal Boutiques product variety cleanup
-- Updates existing products in place. Does not delete products.
-- Safe to re-run: names, slugs, pricing, inventory, options, and images are deterministic.

begin;

with ranked_products as (
  select
    p.id,
    c.slug as category_slug,
    row_number() over (partition by c.slug order by p.created_at, p.id) as rn
  from public.products p
  join public.categories c on c.id = p.category_id
  where c.slug in (
    'women',
    'men',
    'kids',
    'shoes',
    'jewelry',
    'home-living',
    'beauty',
    'sale'
  )
),
variety as (
  select
    rp.id,
    rp.category_slug,
    rp.rn,
    replace(rp.id::text, '-', '') as id_key,
    case rp.category_slug
      when 'women' then (array[
        'Amani Satin Midi Dress', 'Nairobi Linen Wrap Dress', 'Kilimani Silk Camisole Top',
        'Karen Structured Handbag', 'Westlands Pleated Skirt', 'Lavington Wide Leg Trouser',
        'Runda Wool Blend Coat', 'Mombasa Resort Maxi Dress', 'Diani Raffia Tote Bag',
        'Naivasha Cropped Blazer', 'Muthaiga Chiffon Blouse', 'Gigiri Denim Shirt Dress',
        'Eldoret Tailored Jumpsuit', 'Malindi Beaded Evening Clutch', 'Thika Cotton Shirt Dress',
        'Riverside Office Pencil Skirt', 'Hurlingham Trench Coat', 'Nyali Sequin Cocktail Dress',
        'Kisumu Soft Knit Cardigan', 'Parklands Leather Crossbody Bag'
      ])[((rp.rn - 1) % 20) + 1]
      when 'men' then (array[
        'Nairobi Oxford Business Shirt', 'Westlands Slim Fit Suit', 'Karen Leather Dress Belt',
        'Kilimani Cotton Polo Shirt', 'Mombasa Linen Casual Shirt', 'Runda Wool Blend Blazer',
        'Lavington Stretch Chino Trouser', 'Gigiri Dark Wash Jean', 'Muthaiga Dinner Jacket',
        'Diani Weekend Shorts', 'Eldoret Safari Utility Shirt', 'Nyali Knitted Crew Sweater',
        'Kisumu Executive Trouser', 'Malindi Suede Belt', 'Thika Denim Jacket',
        'Parklands Check Shirt', 'Naivasha Lightweight Bomber Jacket', 'Hurlingham Three Piece Suit',
        'Riverside Classic Tee', 'Amani Formal Waistcoat'
      ])[((rp.rn - 1) % 20) + 1]
      when 'kids' then (array[
        'Junior School Shirt Set', 'Girls Tulle Party Dress', 'Baby Cotton Romper Pack',
        'Kids Safari Backpack', 'Toddler Velcro Sneaker', 'Boys Chino Uniform Trouser',
        'Baby Swaddle Blanket Set', 'Girls Checked School Dress', 'Kids Rain Jacket',
        'Boys Denim Dungaree', 'Nursery Lunch Bag', 'Infant Bodysuit Bundle',
        'Girls Ballet Flat Shoe', 'Kids Swimming Costume', 'Boys Occasion Shirt',
        'Baby Hooded Towel', 'Primary School Sweater', 'Girls Cotton Legging Set',
        'Kids Canvas Trainer', 'Toddler Party Bow Tie Set'
      ])[((rp.rn - 1) % 20) + 1]
      when 'shoes' then (array[
        'Nairobi Leather Block Heel', 'Diani Woven Flat Sandal', 'Westlands Court Heel',
        'Karen White Leather Sneaker', 'Mombasa Slide Sandal', 'Kilimani Penny Loafer',
        'Runda Chelsea Boot', 'Lavington Ballet Flat', 'Gigiri Oxford Dress Shoe',
        'Naivasha Trail Sneaker', 'Muthaiga Suede Mule', 'Nyali Platform Heel',
        'Eldoret Running Trainer', 'Malindi Espadrille Sandal', 'Thika Ankle Boot',
        'Parklands Driving Loafer', 'Amani Metallic Stiletto', 'Kisumu Comfort Flat',
        'Riverside Canvas Sneaker', 'Hurlingham Leather Boot'
      ])[((rp.rn - 1) % 20) + 1]
      when 'jewelry' then (array[
        'Gold Plated Hoop Earrings', 'Pearl Layer Necklace', 'Sterling Silver Promise Ring',
        'Rose Gold Charm Bracelet', 'Classic Leather Strap Watch', 'Crystal Stud Earrings',
        'Beaded Maasai Inspired Necklace', 'Stacking Ring Trio', 'Aviator Sunglasses',
        'Minimal Cuff Bracelet', 'Luxury Chronograph Watch', 'Pendant Chain Necklace',
        'Emerald Look Cocktail Ring', 'Delicate Anklet Chain', 'Cat Eye Sunglasses',
        'Bridal Pearl Drop Earrings', 'Textured Signet Ring', 'Tennis Bracelet',
        'Square Face Dress Watch', 'Layered Gold Chain Set'
      ])[((rp.rn - 1) % 20) + 1]
      when 'home-living' then (array[
        'Hotel Cotton Bedsheet Set', 'Quilted Luxury Duvet', 'Orthopedic Comfort Pillow Pair',
        'Premium Spring Mattress', 'Absorbent Bath Towel Set', 'Blackout Curtain Panel Pair',
        'Fleece Throw Blanket', 'Waterproof Mattress Protector', 'Cotton Duvet Cover',
        'Kitchen Towel Bundle', 'Velvet Cushion Cover Set', 'Waffle Bath Robe',
        'Printed Kids Bedsheet Set', 'Heavy Knit Blanket', 'Sheer Living Room Curtain',
        'Memory Foam Pillow', 'Guest Room Towel Bale', 'King Size Mattress Topper',
        'Decorative Table Runner', 'Scented Bedroom Candle Set'
      ])[((rp.rn - 1) % 20) + 1]
      when 'beauty' then (array[
        'Shea Body Lotion', 'Vitamin C Brightening Serum', 'Signature Eau de Parfum',
        'Matte Liquid Lipstick', 'Hydrating Face Cream', 'Argan Hair Treatment Oil',
        'Everyday Makeup Palette', 'SPF 50 Sunscreen Lotion', 'Gentle Cleansing Balm',
        'Repair Shampoo and Conditioner Set', 'Deep Moisture Hair Mask', 'Precision Brow Pencil',
        'Rose Water Face Toner', 'Nourishing Hand Cream', 'Vanilla Fragrance Mist',
        'Aloe Vera Body Gel', 'Long Wear Foundation', 'Coconut Hair Butter',
        'Charcoal Face Mask', 'Luxury Perfume Gift Set'
      ])[((rp.rn - 1) % 20) + 1]
      else (array[
        'Sale Satin Occasion Dress', 'Sale Leather Crossbody Bag', 'Sale White Sneaker',
        'Sale Oxford Work Shirt', 'Sale Cotton Bedsheet Bundle', 'Sale Perfume Gift Set',
        'Sale Gold Hoop Earrings', 'Sale Chino Trouser', 'Sale Flat Sandal',
        'Sale Kids Backpack', 'Sale Tailored Blazer', 'Sale Duvet Cover Set',
        'Sale Hydrating Lotion', 'Sale Classic Watch', 'Sale Luxury Evening Clutch',
        'Sale Baby Romper Pack', 'Sale Denim Jacket', 'Sale Makeup Palette',
        'Sale Pillow Pair', 'Sale Cocktail Heel'
      ])[((rp.rn - 1) % 20) + 1]
    end as base_name,
    case rp.category_slug
      when 'women' then (array['Everyday elegance', 'office polish', 'occasion dressing', 'resort weekends', 'evening style'])[((rp.rn - 1) % 5) + 1]
      when 'men' then (array['business wear', 'weekend comfort', 'formal occasions', 'smart casual styling', 'travel-ready dressing'])[((rp.rn - 1) % 5) + 1]
      when 'kids' then (array['school days', 'play dates', 'family events', 'baby essentials', 'holiday travel'])[((rp.rn - 1) % 5) + 1]
      when 'shoes' then (array['daily wear', 'occasion styling', 'office looks', 'weekend plans', 'travel comfort'])[((rp.rn - 1) % 5) + 1]
      when 'jewelry' then (array['gift giving', 'everyday shine', 'formal styling', 'layered looks', 'statement dressing'])[((rp.rn - 1) % 5) + 1]
      when 'home-living' then (array['bedroom refreshes', 'guest hosting', 'family homes', 'hotel-inspired comfort', 'easy home styling'])[((rp.rn - 1) % 5) + 1]
      when 'beauty' then (array['daily routines', 'self-care gifting', 'glam finishes', 'skin hydration', 'hair nourishment'])[((rp.rn - 1) % 5) + 1]
      else (array['limited offers', 'seasonal savings', 'clearance picks', 'weekend deals', 'bundle value'])[((rp.rn - 1) % 5) + 1]
    end as use_case
  from ranked_products rp
),
prepared as (
  select
    v.id,
    concat(v.base_name, ' ', lpad(v.rn::text, 3, '0')) as new_name,
    concat(
      v.category_slug,
      '-',
      lower(regexp_replace(v.base_name, '[^a-zA-Z0-9]+', '-', 'g')),
      '-',
      lpad(v.rn::text, 3, '0'),
      '-',
      v.id_key
    ) as new_slug,
    concat(
      v.base_name,
      ' selected for ', v.use_case,
      '. A practical Royal Boutiques pick for shoppers in Kenya, with balanced quality, styling, and value for everyday online shopping.'
    ) as new_description,
    case v.category_slug
      when 'women' then (1400 + ((v.rn * 337 + length(v.id::text) * 19) % 18500))::numeric(10,2)
      when 'men' then (1500 + ((v.rn * 389 + length(v.id::text) * 23) % 21500))::numeric(10,2)
      when 'kids' then (450 + ((v.rn * 167 + length(v.id::text) * 11) % 6950))::numeric(10,2)
      when 'shoes' then (900 + ((v.rn * 421 + length(v.id::text) * 17) % 18900))::numeric(10,2)
      when 'jewelry' then (350 + ((v.rn * 457 + length(v.id::text) * 29) % 29650))::numeric(10,2)
      when 'home-living' then (650 + ((v.rn * 313 + length(v.id::text) * 13) % 26350))::numeric(10,2)
      when 'beauty' then (300 + ((v.rn * 149 + length(v.id::text) * 7) % 8700))::numeric(10,2)
      else (400 + ((v.rn * 271 + length(v.id::text) * 31) % 11600))::numeric(10,2)
    end as new_price,
    case
      when v.category_slug = 'sale' then round((400 + ((v.rn * 271 + length(v.id::text) * 31) % 11600)) * (0.55 + ((v.rn % 4) * 0.07)), 2)::numeric(10,2)
      when v.rn % 8 = 0 then round((
        case v.category_slug
          when 'women' then 1400 + ((v.rn * 337 + length(v.id::text) * 19) % 18500)
          when 'men' then 1500 + ((v.rn * 389 + length(v.id::text) * 23) % 21500)
          when 'kids' then 450 + ((v.rn * 167 + length(v.id::text) * 11) % 6950)
          when 'shoes' then 900 + ((v.rn * 421 + length(v.id::text) * 17) % 18900)
          when 'jewelry' then 350 + ((v.rn * 457 + length(v.id::text) * 29) % 29650)
          when 'home-living' then 650 + ((v.rn * 313 + length(v.id::text) * 13) % 26350)
          when 'beauty' then 300 + ((v.rn * 149 + length(v.id::text) * 7) % 8700)
          else 400 + ((v.rn * 271 + length(v.id::text) * 31) % 11600)
        end
      ) * 0.84, 2)::numeric(10,2)
      else null
    end as new_sale_price,
    (3 + ((v.rn * 17 + length(v.id::text)) % 147))::int as new_stock,
    case v.category_slug
      when 'women' then case (v.rn - 1) % 4
        when 0 then array['XS','S','M','L']
        when 1 then array['S','M','L','XL']
        when 2 then array['One Size']
        else array['28','30','32','34','36']
      end
      when 'men' then case (v.rn - 1) % 4
        when 0 then array['S','M','L','XL']
        when 1 then array['M','L','XL','XXL']
        when 2 then array['30','32','34','36','38']
        else array['One Size']
      end
      when 'kids' then case (v.rn - 1) % 4
        when 0 then array['0-3M','6-12M','12-18M']
        when 1 then array['2Y','4Y','6Y']
        when 2 then array['8Y','10Y','12Y']
        else array['One Size']
      end
      when 'shoes' then case (v.rn - 1) % 4
        when 0 then array['36','37','38','39','40']
        when 1 then array['40','41','42','43','44']
        when 2 then array['28','30','32','34']
        else array['35','36','37','38']
      end
      when 'jewelry' then case (v.rn - 1) % 3
        when 0 then array['One Size']
        when 1 then array['6','7','8','9']
        else array['Small','Medium','Large']
      end
      when 'home-living' then case (v.rn - 1) % 4
        when 0 then array['Single','Double']
        when 1 then array['Queen','King']
        when 2 then array['2 Pack','4 Pack']
        else array['Standard','Large']
      end
      when 'beauty' then case (v.rn - 1) % 4
        when 0 then array['30ml','50ml','100ml']
        when 1 then array['100ml','200ml','400ml']
        when 2 then array['Light','Medium','Deep']
        else array['One Size']
      end
      else case (v.rn - 1) % 4
        when 0 then array['S','M','L']
        when 1 then array['One Size']
        when 2 then array['36','37','38','39']
        else array['Queen','King']
      end
    end as new_sizes,
    case v.category_slug
      when 'women' then case (v.rn - 1) % 4
        when 0 then array['Black','Ivory','Blush']
        when 1 then array['Emerald','Navy','Gold']
        when 2 then array['Chocolate','Cream','Tan']
        else array['Red','Dusty Pink','White']
      end
      when 'men' then case (v.rn - 1) % 4
        when 0 then array['White','Navy','Sky Blue']
        when 1 then array['Black','Charcoal','Grey']
        when 2 then array['Olive','Tan','Brown']
        else array['Burgundy','Cream','Denim']
      end
      when 'kids' then case (v.rn - 1) % 4
        when 0 then array['Blue','White','Red']
        when 1 then array['Pink','Lilac','Cream']
        when 2 then array['Yellow','Green','Orange']
        else array['Navy','Grey','Black']
      end
      when 'shoes' then case (v.rn - 1) % 4
        when 0 then array['Black','Brown','Tan']
        when 1 then array['White','Cream','Nude']
        when 2 then array['Gold','Silver','Rose Gold']
        else array['Navy','Grey','Olive']
      end
      when 'jewelry' then case (v.rn - 1) % 4
        when 0 then array['Gold','Silver']
        when 1 then array['Rose Gold','Pearl']
        when 2 then array['Black','Tortoise']
        else array['Emerald','Crystal']
      end
      when 'home-living' then case (v.rn - 1) % 4
        when 0 then array['White','Ivory','Cream']
        when 1 then array['Grey','Charcoal','Silver']
        when 2 then array['Beige','Taupe','Brown']
        else array['Sage','Navy','Blush']
      end
      when 'beauty' then case (v.rn - 1) % 4
        when 0 then array['Natural','Warm','Cool']
        when 1 then array['Vanilla','Cocoa','Caramel']
        when 2 then array['Rose','Berry','Nude']
        else array['Clear','Amber','White']
      end
      else case (v.rn - 1) % 4
        when 0 then array['Black','White','Gold']
        when 1 then array['Navy','Cream','Tan']
        when 2 then array['Pink','Blue','Grey']
        else array['Brown','Ivory','Silver']
      end
    end as new_colors,
    concat(
      'https://picsum.photos/seed/royal-boutiques-',
      v.category_slug,
      '-',
      v.id_key,
      '/1200/1600'
    ) as new_image_url,
    (v.rn % 6 = 1) as new_is_new,
    (v.rn % 9 = 2) as new_is_bestseller,
    (v.category_slug in ('women', 'men', 'jewelry', 'home-living') and v.rn % 11 = 3) as new_is_luxury,
    round((3.7 + ((v.rn * 7) % 14) / 10.0)::numeric, 2) as new_rating,
    (2 + ((v.rn * 19 + length(v.id::text)) % 320))::int as new_review_count
  from variety v
)
update public.products p
set
  name = prepared.new_name,
  slug = prepared.new_slug,
  description = prepared.new_description,
  price = prepared.new_price,
  sale_price = prepared.new_sale_price,
  stock = prepared.new_stock,
  image_url = prepared.new_image_url,
  sizes = prepared.new_sizes,
  colors = prepared.new_colors,
  is_new = prepared.new_is_new,
  is_bestseller = prepared.new_is_bestseller,
  is_luxury = prepared.new_is_luxury,
  is_active = true,
  rating = prepared.new_rating,
  review_count = prepared.new_review_count,
  updated_at = now()
from prepared
where p.id = prepared.id;

commit;

-- Verification: duplicate product names should return zero rows.
select name, count(*)
from products
group by name
having count(*) > 1;

-- Verification: duplicate image URLs above the allowed threshold should return zero rows.
select image_url, count(*)
from products
group by image_url
having count(*) > 5;

-- Verification: product slugs must remain unique; this should return zero rows.
select slug, count(*)
from products
group by slug
having count(*) > 1;

-- Category distribution after cleanup.
select c.name, count(p.id)
from categories c
left join products p on p.category_id = c.id
group by c.name
order by c.name;
