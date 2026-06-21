-- Royal Boutiques product realism cleanup
-- Updates existing products in place. Does not delete products.
-- Does not modify website design, auth, checkout, payments, routing, or M-Pesa.
--
-- The script builds deterministic, category-aware product details, then updates:
-- name, slug, description, price, sale_price, stock, image_url, sizes, colors,
-- is_new, is_bestseller, is_luxury, rating, and review_count.

begin;

create temporary table product_realism_updates (
  id uuid primary key,
  name text not null,
  slug text not null unique,
  description text,
  price numeric(10,2) not null,
  sale_price numeric(10,2),
  stock integer not null,
  image_url text,
  sizes text[] not null,
  colors text[] not null,
  is_new boolean not null,
  is_bestseller boolean not null,
  is_luxury boolean not null,
  rating numeric(3,2) not null,
  review_count integer not null
) on commit drop;

with ranked_products as (
  select
    p.id,
    c.slug as category_slug,
    row_number() over (partition by c.slug order by p.created_at, p.id) as rn,
    replace(p.id::text, '-', '') as id_key
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
product_model as (
  select
    rp.*,
    ((rp.rn - 1) % 50) + 1 as image_slot,
    case rp.category_slug
      when 'women' then case ((rp.rn - 1) % 25)
        when 0 then 'Satin Midi Dress'
        when 1 then 'Linen Wrap Dress'
        when 2 then 'Silk Blouse'
        when 3 then 'Structured Handbag'
        when 4 then 'Pleated Skirt'
        when 5 then 'Wide Leg Trouser'
        when 6 then 'Wool Blend Coat'
        when 7 then 'Maxi Dress'
        when 8 then 'Cotton Poplin Top'
        when 9 then 'Leather Tote Bag'
        when 10 then 'Cropped Blazer'
        when 11 then 'Pencil Skirt'
        when 12 then 'Denim Shirt Dress'
        when 13 then 'Tailored Jumpsuit'
        when 14 then 'Evening Clutch Bag'
        when 15 then 'Trench Coat'
        when 16 then 'Sequin Cocktail Dress'
        when 17 then 'Knit Cardigan'
        when 18 then 'Crossbody Handbag'
        when 19 then 'Office Blazer'
        when 20 then 'Chiffon Blouse'
        when 21 then 'Straight Leg Trouser'
        when 22 then 'A-Line Skirt'
        when 23 then 'Faux Leather Jacket'
        else 'Ribbed Tank Top'
      end
      when 'men' then case ((rp.rn - 1) % 25)
        when 0 then 'Oxford Business Shirt'
        when 1 then 'Slim Fit Suit'
        when 2 then 'Cotton Polo Shirt'
        when 3 then 'Leather Dress Belt'
        when 4 then 'Linen Casual Shirt'
        when 5 then 'Wool Blend Blazer'
        when 6 then 'Stretch Chino Trouser'
        when 7 then 'Dark Wash Jean'
        when 8 then 'Dinner Jacket'
        when 9 then 'Weekend Short'
        when 10 then 'Safari Utility Shirt'
        when 11 then 'Crew Neck Sweater'
        when 12 then 'Executive Trouser'
        when 13 then 'Suede Belt'
        when 14 then 'Denim Jacket'
        when 15 then 'Check Shirt'
        when 16 then 'Lightweight Bomber Jacket'
        when 17 then 'Three Piece Suit'
        when 18 then 'Classic Cotton Tee'
        when 19 then 'Formal Waistcoat'
        when 20 then 'Khaki Cargo Trouser'
        when 21 then 'Mandarin Collar Shirt'
        when 22 then 'Textured Knit Polo'
        when 23 then 'Leather Biker Jacket'
        else 'Tailored Dress Trouser'
      end
      when 'kids' then case ((rp.rn - 1) % 25)
        when 0 then 'School Shirt Set'
        when 1 then 'Tulle Party Dress'
        when 2 then 'Baby Romper Pack'
        when 3 then 'Safari School Backpack'
        when 4 then 'Velcro Trainer Shoe'
        when 5 then 'School Chino Trouser'
        when 6 then 'Baby Swaddle Set'
        when 7 then 'Checked School Dress'
        when 8 then 'Kids Rain Jacket'
        when 9 then 'Denim Dungaree'
        when 10 then 'Insulated Lunch Bag'
        when 11 then 'Baby Bodysuit Bundle'
        when 12 then 'Ballet Flat Shoe'
        when 13 then 'Kids Swim Set'
        when 14 then 'Occasion Shirt'
        when 15 then 'Baby Hooded Towel'
        when 16 then 'Primary School Sweater'
        when 17 then 'Cotton Legging Set'
        when 18 then 'Canvas Trainer'
        when 19 then 'Party Bow Tie Set'
        when 20 then 'Puffer Jacket'
        when 21 then 'Printed Pajama Set'
        when 22 then 'Baby Bootie Pair'
        when 23 then 'Girls Skirt Set'
        else 'Boys Polo Shirt'
      end
      when 'shoes' then case ((rp.rn - 1) % 25)
        when 0 then 'Leather Block Heel'
        when 1 then 'White Leather Sneaker'
        when 2 then 'Woven Flat Sandal'
        when 3 then 'Penny Loafer'
        when 4 then 'Chelsea Boot'
        when 5 then 'Ballet Flat'
        when 6 then 'Court Heel'
        when 7 then 'Trail Running Sneaker'
        when 8 then 'Suede Mule'
        when 9 then 'Platform Heel'
        when 10 then 'Espadrille Sandal'
        when 11 then 'Ankle Boot'
        when 12 then 'Driving Loafer'
        when 13 then 'Metallic Stiletto'
        when 14 then 'Comfort Flat'
        when 15 then 'Canvas Sneaker'
        when 16 then 'Leather Dress Boot'
        when 17 then 'Slide Sandal'
        when 18 then 'Oxford Dress Shoe'
        when 19 then 'Chunky Trainer'
        when 20 then 'Kitten Heel'
        when 21 then 'Fisherman Sandal'
        when 22 then 'Platform Sneaker'
        when 23 then 'Formal Derby Shoe'
        else 'Pointed Toe Flat'
      end
      when 'jewelry' then case ((rp.rn - 1) % 25)
        when 0 then 'Gold Hoop Earrings'
        when 1 then 'Pearl Layer Necklace'
        when 2 then 'Sterling Silver Ring'
        when 3 then 'Rose Gold Charm Bracelet'
        when 4 then 'Leather Strap Watch'
        when 5 then 'Crystal Stud Earrings'
        when 6 then 'Beaded Statement Necklace'
        when 7 then 'Stacking Ring Set'
        when 8 then 'Aviator Sunglasses'
        when 9 then 'Minimal Cuff Bracelet'
        when 10 then 'Chronograph Watch'
        when 11 then 'Pendant Chain Necklace'
        when 12 then 'Cocktail Ring'
        when 13 then 'Delicate Anklet'
        when 14 then 'Cat Eye Sunglasses'
        when 15 then 'Pearl Drop Earrings'
        when 16 then 'Signet Ring'
        when 17 then 'Tennis Bracelet'
        when 18 then 'Square Face Watch'
        when 19 then 'Layered Chain Set'
        when 20 then 'Huggie Earring Set'
        when 21 then 'Gemstone Bracelet'
        when 22 then 'Oval Sunglasses'
        when 23 then 'Bridal Necklace Set'
        else 'Adjustable Gold Ring'
      end
      when 'home-living' then case ((rp.rn - 1) % 25)
        when 0 then 'Cotton Bedsheet Set'
        when 1 then 'Luxury Duvet'
        when 2 then 'Comfort Pillow Pair'
        when 3 then 'Spring Mattress'
        when 4 then 'Bath Towel Bale'
        when 5 then 'Blackout Curtain Pair'
        when 6 then 'Fleece Throw Blanket'
        when 7 then 'Mattress Protector'
        when 8 then 'Duvet Cover Set'
        when 9 then 'Kitchen Towel Bundle'
        when 10 then 'Velvet Cushion Covers'
        when 11 then 'Waffle Bath Robe'
        when 12 then 'Kids Bedsheet Set'
        when 13 then 'Heavy Knit Blanket'
        when 14 then 'Sheer Curtain Panel'
        when 15 then 'Memory Foam Pillow'
        when 16 then 'Guest Towel Set'
        when 17 then 'Mattress Topper'
        when 18 then 'Decorative Table Runner'
        when 19 then 'Bedroom Candle Set'
        when 20 then 'Quilted Bedspread'
        when 21 then 'Hotel Pillowcase Set'
        when 22 then 'Bathroom Mat Set'
        when 23 then 'King Size Mattress'
        else 'Thermal Curtain Set'
      end
      when 'beauty' then case ((rp.rn - 1) % 25)
        when 0 then 'Shea Body Lotion'
        when 1 then 'Vitamin C Serum'
        when 2 then 'Signature Eau de Parfum'
        when 3 then 'Matte Liquid Lipstick'
        when 4 then 'Hydrating Face Cream'
        when 5 then 'Argan Hair Treatment Oil'
        when 6 then 'Everyday Makeup Palette'
        when 7 then 'SPF 50 Sunscreen Lotion'
        when 8 then 'Gentle Cleansing Balm'
        when 9 then 'Repair Shampoo Set'
        when 10 then 'Deep Moisture Hair Mask'
        when 11 then 'Precision Brow Pencil'
        when 12 then 'Rose Water Face Toner'
        when 13 then 'Nourishing Hand Cream'
        when 14 then 'Vanilla Fragrance Mist'
        when 15 then 'Aloe Vera Body Gel'
        when 16 then 'Long Wear Foundation'
        when 17 then 'Coconut Hair Butter'
        when 18 then 'Charcoal Face Mask'
        when 19 then 'Perfume Gift Set'
        when 20 then 'Hydrating Lip Gloss'
        when 21 then 'Keratin Conditioner'
        when 22 then 'Makeup Brush Set'
        when 23 then 'Retinol Night Cream'
        else 'Body Scrub Jar'
      end
      else case ((rp.rn - 1) % 25)
        when 0 then 'Discount Satin Dress'
        when 1 then 'Outlet Oxford Shirt'
        when 2 then 'Sale Leather Sneaker'
        when 3 then 'Clearance Crossbody Bag'
        when 4 then 'Kids Backpack Deal'
        when 5 then 'Perfume Gift Offer'
        when 6 then 'Gold Earring Sale Set'
        when 7 then 'Bedsheet Bundle Deal'
        when 8 then 'Markdown Block Heel'
        when 9 then 'Sale Slim Fit Suit'
        when 10 then 'Baby Romper Offer'
        when 11 then 'Body Lotion Value Pack'
        when 12 then 'Classic Watch Deal'
        when 13 then 'Curtain Pair Offer'
        when 14 then 'Outlet Wool Coat'
        when 15 then 'Sale Denim Jean'
        when 16 then 'Flat Sandal Deal'
        when 17 then 'Pearl Necklace Offer'
        when 18 then 'Duvet Cover Discount'
        when 19 then 'Makeup Palette Deal'
        when 20 then 'Pillow Pair Offer'
        when 21 then 'Loafer Clearance Pair'
        when 22 then 'Towel Bale Deal'
        when 23 then 'Blazer Outlet Pick'
        else 'Kids Party Dress Deal'
      end
    end as product_type,
    case ((rp.rn - 1) % 20)
      when 0 then 'Nairobi'
      when 1 then 'Karen'
      when 2 then 'Kilimani'
      when 3 then 'Westlands'
      when 4 then 'Lavington'
      when 5 then 'Runda'
      when 6 then 'Mombasa'
      when 7 then 'Diani'
      when 8 then 'Naivasha'
      when 9 then 'Muthaiga'
      when 10 then 'Gigiri'
      when 11 then 'Eldoret'
      when 12 then 'Malindi'
      when 13 then 'Thika'
      when 14 then 'Nyali'
      when 15 then 'Riverside'
      when 16 then 'Parklands'
      when 17 then 'Kisumu'
      when 18 then 'Hurlingham'
      else 'Amani'
    end as collection_name,
    case ((rp.rn - 1) % 12)
      when 0 then 'Classic'
      when 1 then 'Premium'
      when 2 then 'Everyday'
      when 3 then 'Signature'
      when 4 then 'Executive'
      when 5 then 'Weekend'
      when 6 then 'Soft Touch'
      when 7 then 'Urban'
      when 8 then 'Heritage'
      when 9 then 'Limited'
      when 10 then 'Elegant'
      else 'Royal'
    end as style_name
  from ranked_products rp
),
realistic_products as (
  select
    pm.*,
    case pm.category_slug
      when 'women' then case
        when pm.product_type ilike '%handbag%' or pm.product_type ilike '%bag%' or pm.product_type ilike '%clutch%' then 'women-handbag-fashion'
        when pm.product_type ilike '%coat%' then 'women-coat-fashion'
        when pm.product_type ilike '%skirt%' then 'women-skirt-fashion'
        when pm.product_type ilike '%trouser%' then 'women-trousers-fashion'
        when pm.product_type ilike '%blazer%' then 'women-blazer-fashion'
        when pm.product_type ilike '%blouse%' or pm.product_type ilike '%top%' then 'women-blouse-fashion'
        else 'women-dress-fashion'
      end
      when 'men' then case
        when pm.product_type ilike '%belt%' then 'men-belt-fashion'
        when pm.product_type ilike '%suit%' or pm.product_type ilike '%waistcoat%' then 'men-suit-fashion'
        when pm.product_type ilike '%polo%' then 'men-polo-shirt-fashion'
        when pm.product_type ilike '%jacket%' or pm.product_type ilike '%blazer%' then 'men-jacket-fashion'
        when pm.product_type ilike '%trouser%' or pm.product_type ilike '%chino%' then 'men-trousers-fashion'
        when pm.product_type ilike '%jean%' then 'men-jeans-fashion'
        else 'men-shirt-fashion'
      end
      when 'kids' then case
        when pm.product_type ilike '%backpack%' or pm.product_type ilike '%bag%' then 'kids-backpack'
        when pm.product_type ilike '%baby%' or pm.product_type ilike '%romper%' or pm.product_type ilike '%bodysuit%' then 'baby-clothes'
        when pm.product_type ilike '%shoe%' or pm.product_type ilike '%trainer%' or pm.product_type ilike '%flat%' then 'kids-shoes'
        when pm.product_type ilike '%school%' then 'kids-school-uniform'
        when pm.product_type ilike '%party%' or pm.product_type ilike '%dress%' then 'kids-party-dress'
        else 'kids-clothes'
      end
      when 'shoes' then case
        when pm.product_type ilike '%heel%' or pm.product_type ilike '%stiletto%' then 'heels-shoes'
        when pm.product_type ilike '%sneaker%' or pm.product_type ilike '%trainer%' then 'sneakers-shoes'
        when pm.product_type ilike '%sandal%' then 'sandals-shoes'
        when pm.product_type ilike '%loafer%' then 'loafers-shoes'
        when pm.product_type ilike '%boot%' then 'boots-shoes'
        when pm.product_type ilike '%flat%' then 'flats-shoes'
        else 'leather-shoes'
      end
      when 'jewelry' then case
        when pm.product_type ilike '%ring%' then 'rings-jewelry'
        when pm.product_type ilike '%earring%' then 'earrings-jewelry'
        when pm.product_type ilike '%necklace%' or pm.product_type ilike '%chain%' then 'necklace-jewelry'
        when pm.product_type ilike '%bracelet%' then 'bracelet-jewelry'
        when pm.product_type ilike '%watch%' then 'watch-jewelry'
        when pm.product_type ilike '%sunglasses%' then 'sunglasses-fashion'
        else 'fashion-accessories'
      end
      when 'home-living' then case
        when pm.product_type ilike '%mattress%' then 'mattress-bedroom'
        when pm.product_type ilike '%duvet%' then 'duvet-bedroom'
        when pm.product_type ilike '%pillow%' then 'pillows-bedroom'
        when pm.product_type ilike '%bedsheet%' then 'bedsheets-home'
        when pm.product_type ilike '%blanket%' then 'blanket-bedroom'
        when pm.product_type ilike '%towel%' then 'towels-bathroom'
        when pm.product_type ilike '%curtain%' then 'curtains-home'
        else 'home-decor'
      end
      when 'beauty' then case
        when pm.product_type ilike '%perfume%' or pm.product_type ilike '%fragrance%' then 'perfume-beauty'
        when pm.product_type ilike '%lip%' then 'lipstick-makeup'
        when pm.product_type ilike '%serum%' or pm.product_type ilike '%cream%' or pm.product_type ilike '%toner%' then 'skincare-beauty'
        when pm.product_type ilike '%hair%' or pm.product_type ilike '%shampoo%' or pm.product_type ilike '%conditioner%' then 'hair-products-beauty'
        when pm.product_type ilike '%lotion%' then 'body-lotion-beauty'
        when pm.product_type ilike '%makeup%' or pm.product_type ilike '%foundation%' or pm.product_type ilike '%brow%' then 'makeup-beauty'
        else 'beauty-products'
      end
      else case ((pm.rn - 1) % 12)
        when 0 then 'women-dress-fashion'
        when 1 then 'men-shirt-fashion'
        when 2 then 'sneakers-shoes'
        when 3 then 'women-handbag-fashion'
        when 4 then 'kids-backpack'
        when 5 then 'perfume-beauty'
        when 6 then 'earrings-jewelry'
        when 7 then 'bedsheets-home'
        when 8 then 'heels-shoes'
        when 9 then 'men-suit-fashion'
        when 10 then 'baby-clothes'
        else 'body-lotion-beauty'
      end
    end as image_keywords
  from product_model pm
),
final_products as (
  select
    rp.id,
    concat(rp.collection_name, ' ', rp.style_name, ' ', rp.product_type, ' ', lpad(rp.rn::text, 3, '0')) as name,
    concat(
      rp.category_slug,
      '-',
      lower(regexp_replace(rp.collection_name || '-' || rp.style_name || '-' || rp.product_type, '[^a-zA-Z0-9]+', '-', 'g')),
      '-',
      lpad(rp.rn::text, 3, '0'),
      '-',
      rp.id_key
    ) as slug,
    concat(
      rp.collection_name, ' ', rp.product_type,
      ' for ',
      case rp.category_slug
        when 'women' then 'polished boutique dressing in Kenya'
        when 'men' then 'smart everyday and occasion menswear'
        when 'kids' then 'school, play, baby, and family-day essentials'
        when 'shoes' then 'comfortable finishing for work, weekends, and events'
        when 'jewelry' then 'giftable accessories and everyday shine'
        when 'home-living' then 'bedroom, bathroom, and home refreshes'
        when 'beauty' then 'daily self-care, grooming, and beauty routines'
        else 'limited-time Royal Boutiques sale shopping'
      end,
      '. The image, sizing, color options, and price are matched to the product type for a more realistic catalogue.'
    ) as description,
    case rp.category_slug
      when 'women' then (1200 + ((rp.rn * 341 + length(rp.id_key)) % 18800))::numeric(10,2)
      when 'men' then (1300 + ((rp.rn * 397 + length(rp.id_key)) % 24700))::numeric(10,2)
      when 'kids' then (400 + ((rp.rn * 151 + length(rp.id_key)) % 7100))::numeric(10,2)
      when 'shoes' then (900 + ((rp.rn * 431 + length(rp.id_key)) % 19100))::numeric(10,2)
      when 'jewelry' then (350 + ((rp.rn * 461 + length(rp.id_key)) % 29650))::numeric(10,2)
      when 'home-living' then (650 + ((rp.rn * 317 + length(rp.id_key)) % 39350))::numeric(10,2)
      when 'beauty' then (300 + ((rp.rn * 157 + length(rp.id_key)) % 9200))::numeric(10,2)
      else (450 + ((rp.rn * 281 + length(rp.id_key)) % 14550))::numeric(10,2)
    end as price,
    case
      when rp.category_slug = 'sale' then round((450 + ((rp.rn * 281 + length(rp.id_key)) % 14550)) * (0.55 + ((rp.rn % 5) * 0.06)), 2)::numeric(10,2)
      when rp.rn % 10 = 0 then round((
        case rp.category_slug
          when 'women' then 1200 + ((rp.rn * 341 + length(rp.id_key)) % 18800)
          when 'men' then 1300 + ((rp.rn * 397 + length(rp.id_key)) % 24700)
          when 'kids' then 400 + ((rp.rn * 151 + length(rp.id_key)) % 7100)
          when 'shoes' then 900 + ((rp.rn * 431 + length(rp.id_key)) % 19100)
          when 'jewelry' then 350 + ((rp.rn * 461 + length(rp.id_key)) % 29650)
          when 'home-living' then 650 + ((rp.rn * 317 + length(rp.id_key)) % 39350)
          when 'beauty' then 300 + ((rp.rn * 157 + length(rp.id_key)) % 9200)
          else 450 + ((rp.rn * 281 + length(rp.id_key)) % 14550)
        end
      ) * 0.82, 2)::numeric(10,2)
      else null
    end as sale_price,
    (2 + ((rp.rn * 23 + length(rp.id_key)) % 166))::integer as stock,
    concat(
      'https://loremflickr.com/1200/1600/',
      rp.image_keywords,
      '?lock=',
      (
        case rp.category_slug
          when 'women' then 21000
          when 'men' then 22000
          when 'kids' then 23000
          when 'shoes' then 24000
          when 'jewelry' then 25000
          when 'home-living' then 26000
          when 'beauty' then 27000
          else 28000
        end + rp.image_slot
      )::text
    ) as image_url,
    case rp.category_slug
      when 'women' then array['XS','S','M','L','XL']
      when 'men' then array['S','M','L','XL','XXL']
      when 'kids' then array['2Y','4Y','6Y','8Y','10Y','12Y']
      when 'shoes' then array['36','37','38','39','40','41','42','43','44']
      when 'jewelry' then case when rp.rn % 3 = 0 then array[]::text[] else array['One Size'] end
      when 'home-living' then array['Single','Double','Queen','King','4x6','5x6','6x6']
      when 'beauty' then array['50ml','100ml','250ml','500ml']
      else case (rp.rn - 1) % 7
        when 0 then array['XS','S','M','L','XL']
        when 1 then array['S','M','L','XL','XXL']
        when 2 then array['36','37','38','39','40','41','42','43','44']
        when 3 then array['2Y','4Y','6Y','8Y','10Y','12Y']
        when 4 then array['One Size']
        when 5 then array['Single','Double','Queen','King','4x6','5x6','6x6']
        else array['50ml','100ml','250ml','500ml']
      end
    end as sizes,
    case rp.category_slug
      when 'women' then case (rp.rn - 1) % 4
        when 0 then array['Black','Cream','Red','Navy','Beige']
        when 1 then array['Black','Cream','Blush','Navy','Tan']
        when 2 then array['Red','Navy','Beige','White','Gold']
        else array['Black','Cream','Brown','Grey','Beige']
      end
      when 'men' then case (rp.rn - 1) % 4
        when 0 then array['White','Navy','Black','Khaki','Grey']
        when 1 then array['White','Blue','Navy','Grey','Black']
        when 2 then array['Khaki','Brown','Black','Navy','Olive']
        else array['Grey','Charcoal','White','Navy','Black']
      end
      when 'kids' then case (rp.rn - 1) % 4
        when 0 then array['Blue','White','Red','Navy']
        when 1 then array['Pink','Lilac','Cream','White']
        when 2 then array['Yellow','Green','Orange','Blue']
        else array['Grey','Black','Navy','Red']
      end
      when 'shoes' then case (rp.rn - 1) % 4
        when 0 then array['Black','Brown','Tan']
        when 1 then array['White','Cream','Nude']
        when 2 then array['Gold','Silver','Rose Gold']
        else array['Navy','Grey','Olive']
      end
      when 'jewelry' then case (rp.rn - 1) % 4
        when 0 then array['Gold','Silver','Rose Gold','Pearl']
        when 1 then array['Gold','Pearl']
        when 2 then array['Silver','Rose Gold']
        else array['Black','Gold','Silver']
      end
      when 'home-living' then case (rp.rn - 1) % 4
        when 0 then array['White','Cream','Beige']
        when 1 then array['Grey','Charcoal','Silver']
        when 2 then array['Navy','Sage','Blush']
        else array['Brown','Taupe','Ivory']
      end
      when 'beauty' then case
        when rp.product_type ilike '%lip%' or rp.product_type ilike '%foundation%' or rp.product_type ilike '%palette%' then array['Nude','Rose','Berry','Caramel']
        when rp.product_type ilike '%perfume%' or rp.product_type ilike '%fragrance%' then array['Amber','Floral','Vanilla']
        else array[]::text[]
      end
      else case (rp.rn - 1) % 8
        when 0 then array['Black','Cream','Red','Navy','Beige']
        when 1 then array['White','Navy','Black','Khaki','Grey']
        when 2 then array['Black','Brown','Tan']
        when 3 then array['Gold','Silver','Rose Gold','Pearl']
        when 4 then array['Blue','White','Red','Navy']
        when 5 then array['White','Cream','Beige']
        when 6 then array['Nude','Rose','Berry','Caramel']
        else array['Grey','Black','Navy','Red']
      end
    end as colors,
    true as is_active,
    (rp.rn % 7 = 1) as is_new,
    (rp.rn % 9 = 2) as is_bestseller,
    (rp.category_slug in ('women', 'men', 'jewelry', 'home-living') and rp.rn % 13 = 3) as is_luxury,
    round((3.8 + ((rp.rn * 11) % 12) / 10.0)::numeric, 2) as rating,
    (3 + ((rp.rn * 29 + length(rp.id_key)) % 420))::integer as review_count
  from realistic_products rp
)
insert into product_realism_updates (
  id,
  name,
  slug,
  description,
  price,
  sale_price,
  stock,
  image_url,
  sizes,
  colors,
  is_new,
  is_bestseller,
  is_luxury,
  rating,
  review_count
)
select
  id,
  name,
  slug,
  description,
  price,
  sale_price,
  stock,
  image_url,
  sizes,
  colors,
  is_new,
  is_bestseller,
  is_luxury,
  rating,
  review_count
from final_products
on conflict (id) do update
set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  price = excluded.price,
  sale_price = excluded.sale_price,
  stock = excluded.stock,
  image_url = excluded.image_url,
  sizes = excluded.sizes,
  colors = excluded.colors,
  is_new = excluded.is_new,
  is_bestseller = excluded.is_bestseller,
  is_luxury = excluded.is_luxury,
  rating = excluded.rating,
  review_count = excluded.review_count;

update public.products p
set
  name = u.name,
  slug = u.slug,
  description = u.description,
  price = u.price,
  sale_price = u.sale_price,
  stock = u.stock,
  image_url = u.image_url,
  sizes = u.sizes,
  colors = u.colors,
  is_new = u.is_new,
  is_bestseller = u.is_bestseller,
  is_luxury = u.is_luxury,
  is_active = true,
  rating = u.rating,
  review_count = u.review_count,
  updated_at = now()
from product_realism_updates u
where p.id = u.id;

commit;

-- Verification: duplicate names should return zero rows.
select name, count(*)
from products
group by name
having count(*) > 1
order by count(*) desc, name;

-- Verification: duplicate slugs should return zero rows.
select slug, count(*)
from products
group by slug
having count(*) > 1
order by count(*) desc, slug;

-- Verification: no image_url should appear more than 5 times.
select image_url, count(*)
from products
group by image_url
having count(*) > 5
order by count(*) desc;

-- Category counts.
select c.slug, count(p.id) as total_products
from categories c
left join products p on p.category_id = c.id
group by c.slug
order by c.slug;

-- Distinct image count per category. Target: at least 40 for seeded categories.
select c.slug, count(distinct p.image_url) as unique_images, count(*) as total_products
from products p
join categories c on c.id = p.category_id
group by c.slug
order by c.slug;

-- Examples of sizes/colors per category.
with category_examples as (
  select
    c.slug,
    p.name,
    p.sizes,
    p.colors,
    row_number() over (partition by c.slug order by p.name) as example_rank
  from products p
  join categories c on c.id = p.category_id
  where c.slug in ('women', 'men', 'kids', 'shoes', 'jewelry', 'home-living', 'beauty', 'sale')
)
select
  slug,
  name,
  sizes,
  colors
from category_examples
where example_rank <= 8
order by slug, name;
