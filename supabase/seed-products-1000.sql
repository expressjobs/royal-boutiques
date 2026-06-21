-- Royal Boutiques production-safe product seed
-- Inserts 1,000 deterministic products using existing category IDs by slug.
-- Safe to re-run: product slugs are unique and INSERT uses ON CONFLICT DO NOTHING.

begin;

grant select on public.products to anon, authenticated;
alter table public.products enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'products'
      and policyname in ('products public read active', 'products public select active')
  ) then
    execute '
      create policy "products public select active"
        on public.products
        for select
        to anon, authenticated
        using (is_active = true)
    ';
  end if;
end $$;

do $$
declare
  missing_slugs text;
begin
  select string_agg(required.slug, ', ' order by required.slug)
  into missing_slugs
  from (
    values
      ('women'),
      ('men'),
      ('kids'),
      ('shoes'),
      ('jewelry'),
      ('home-living'),
      ('beauty'),
      ('sale')
  ) as required(slug)
  left join public.categories c on c.slug = required.slug
  where c.id is null;

  if missing_slugs is not null then
    raise exception 'Cannot seed Royal Boutiques products. Missing category slugs: %', missing_slugs;
  end if;
end $$;

with category_plan as (
  select *
  from (
    values
      ('women', 125),
      ('men', 125),
      ('kids', 125),
      ('shoes', 125),
      ('jewelry', 125),
      ('home-living', 125),
      ('beauty', 125),
      ('sale', 125)
  ) as plan(category_slug, product_count)
),
category_rows as (
  select
    c.id as category_id,
    c.slug as category_slug,
    c.name as category_name,
    gs.n
  from category_plan cp
  join public.categories c on c.slug = cp.category_slug
  cross join lateral generate_series(1, cp.product_count) as gs(n)
),
product_source as (
  select
    cr.category_id,
    cr.category_slug,
    cr.category_name,
    cr.n,
    case cr.category_slug
      when 'women' then (array[
        'Wrap Dress', 'Maxi Dress', 'Satin Blouse', 'Tailored Trouser', 'Pleated Skirt',
        'Evening Coat', 'Structured Handbag', 'Silk Top', 'Office Blazer', 'Midi Dress',
        'Chiffon Kimono', 'Wide Leg Pant', 'Luxury Tote', 'Denim Jacket', 'Cocktail Dress'
      ])[((cr.n - 1) % 15) + 1]
      when 'men' then (array[
        'Oxford Shirt', 'Linen Shirt', 'Slim Suit', 'Polo Shirt', 'Leather Belt',
        'Chino Trouser', 'Wool Blazer', 'Casual Jean', 'Dinner Jacket', 'Knit Sweater',
        'Safari Shirt', 'Formal Trouser', 'Loafer Belt Set', 'Cotton Tee', 'Executive Suit'
      ])[((cr.n - 1) % 15) + 1]
      when 'kids' then (array[
        'Girls Party Dress', 'Boys Shirt Set', 'Baby Romper', 'School Backpack', 'Kids Hoodie',
        'Toddler Sneakers', 'Baby Blanket', 'Denim Dungaree', 'Cotton Pajama Set', 'Kids Raincoat',
        'Lunch Bag', 'Baby Bodysuit Set', 'Girls Skirt Set', 'Boys Chino Trouser', 'Kids Swimwear'
      ])[((cr.n - 1) % 15) + 1]
      when 'shoes' then (array[
        'Block Heel', 'Court Heel', 'Leather Sneaker', 'Dress Sandal', 'Penny Loafer',
        'Running Sneaker', 'Ankle Boot', 'Flat Sandal', 'Oxford Shoe', 'Platform Heel',
        'Slide Sandal', 'Chelsea Boot', 'Ballet Flat', 'Luxury Mule', 'Kids Trainer'
      ])[((cr.n - 1) % 15) + 1]
      when 'jewelry' then (array[
        'Gold Hoop Earrings', 'Pearl Necklace', 'Stone Ring', 'Chronograph Watch', 'Charm Bracelet',
        'Stud Earrings', 'Pendant Necklace', 'Stacking Ring Set', 'Dress Watch', 'Anklet',
        'Crystal Brooch', 'Cuff Bracelet', 'Wedding Band', 'Layered Chain', 'Luxury Watch'
      ])[((cr.n - 1) % 15) + 1]
      when 'home-living' then (array[
        'Cotton Bedsheet Set', 'Luxury Duvet', 'Hotel Pillow Pair', 'Bath Towel Set', 'Blackout Curtain',
        'Throw Blanket', 'Quilt Cover', 'Mattress Protector', 'Kitchen Towel Set', 'Table Runner',
        'Velvet Cushion', 'Bath Robe', 'Storage Basket', 'Decorative Vase', 'Scented Candle Set'
      ])[((cr.n - 1) % 15) + 1]
      when 'beauty' then (array[
        'Hydrating Face Cream', 'Vitamin C Serum', 'Signature Perfume', 'Matte Lipstick', 'Body Lotion',
        'Hair Treatment Oil', 'Makeup Palette', 'Sunscreen Lotion', 'Cleansing Balm', 'Shampoo Set',
        'Conditioner Mask', 'Brow Pencil', 'Face Toner', 'Hand Cream', 'Fragrance Mist'
      ])[((cr.n - 1) % 15) + 1]
      else (array[
        'Clearance Dress', 'Sale Handbag', 'Discount Sneaker', 'Marked Down Shirt', 'Outlet Bedsheet',
        'Beauty Deal Set', 'Jewelry Sale Set', 'Weekend Trouser', 'Seasonal Sandal', 'Kids Deal Pack',
        'Final Call Blazer', 'Home Offer Bundle', 'Perfume Offer', 'Watch Deal', 'Luxury Outlet Piece'
      ])[((cr.n - 1) % 15) + 1]
    end as product_type,
    (array[
      'Nairobi', 'Mombasa', 'Kilimani', 'Karen', 'Lavington', 'Westlands', 'Runda', 'Diani',
      'Naivasha', 'Eldoret', 'Kisumu', 'Malindi', 'Muthaiga', 'Gigiri', 'Thika'
    ])[((cr.n - 1) % 15) + 1] as collection_name,
    (array[
      'Classic', 'Premium', 'Essential', 'Signature', 'Royal', 'Everyday', 'Elegant', 'Modern',
      'Executive', 'Weekend', 'Soft Touch', 'Limited', 'Heritage', 'Urban', 'Luxe'
    ])[((cr.n - 1) % 15) + 1] as style_name
  from category_rows cr
),
prepared_products as (
  select
    ps.category_id,
    ps.category_slug,
    ps.n,
    concat(ps.collection_name, ' ', ps.style_name, ' ', ps.product_type, ' ', lpad(ps.n::text, 3, '0')) as name,
    concat(
      ps.category_slug,
      '-',
      lower(regexp_replace(ps.collection_name || '-' || ps.style_name || '-' || ps.product_type, '[^a-zA-Z0-9]+', '-', 'g')),
      '-',
      lpad(ps.n::text, 3, '0')
    ) as slug,
    concat(
      'A carefully selected ', lower(ps.product_type),
      ' for Royal Boutiques shoppers in Kenya. Designed for dependable quality, polished styling, and everyday confidence.'
    ) as description,
    case ps.category_slug
      when 'women' then 1800 + (ps.n * 173 % 14200)
      when 'men' then 1600 + (ps.n * 211 % 15800)
      when 'kids' then 650 + (ps.n * 97 % 5750)
      when 'shoes' then 1200 + (ps.n * 191 % 13800)
      when 'jewelry' then 500 + (ps.n * 223 % 24500)
      when 'home-living' then 750 + (ps.n * 167 % 13250)
      when 'beauty' then 450 + (ps.n * 89 % 6550)
      else 500 + (ps.n * 149 % 9500)
    end::numeric(10,2) as price,
    case
      when ps.category_slug = 'sale' then round((500 + (ps.n * 149 % 9500)) * 0.78, 2)
      when ps.n % 9 = 0 then round((
        case ps.category_slug
          when 'women' then 1800 + (ps.n * 173 % 14200)
          when 'men' then 1600 + (ps.n * 211 % 15800)
          when 'kids' then 650 + (ps.n * 97 % 5750)
          when 'shoes' then 1200 + (ps.n * 191 % 13800)
          when 'jewelry' then 500 + (ps.n * 223 % 24500)
          when 'home-living' then 750 + (ps.n * 167 % 13250)
          when 'beauty' then 450 + (ps.n * 89 % 6550)
          else 500 + (ps.n * 149 % 9500)
        end
      ) * 0.88, 2)
      else null
    end::numeric(10,2) as sale_price,
    (8 + (ps.n * 7 % 118))::int as stock,
    case ps.category_slug
      when 'women' then array['XS', 'S', 'M', 'L', 'XL']
      when 'men' then array['S', 'M', 'L', 'XL', 'XXL']
      when 'kids' then array['0-3M', '6-12M', '2Y', '4Y', '6Y', '8Y', '10Y']
      when 'shoes' then array['36', '37', '38', '39', '40', '41', '42', '43']
      when 'jewelry' then array['One Size']
      when 'home-living' then array['Single', 'Double', 'Queen', 'King']
      when 'beauty' then array['50ml', '100ml', '200ml']
      else array['S', 'M', 'L', 'XL']
    end as sizes,
    case ps.category_slug
      when 'women' then array['Black', 'Cream', 'Blush', 'Emerald', 'Navy']
      when 'men' then array['Black', 'White', 'Navy', 'Grey', 'Tan']
      when 'kids' then array['Blue', 'Pink', 'Yellow', 'Red', 'Green']
      when 'shoes' then array['Black', 'Brown', 'White', 'Nude']
      when 'jewelry' then array['Gold', 'Silver', 'Rose Gold']
      when 'home-living' then array['White', 'Ivory', 'Grey', 'Beige']
      when 'beauty' then array['Natural', 'Warm', 'Cool']
      else array['Black', 'White', 'Gold', 'Nude']
    end as colors,
    case ps.category_slug
      when 'women' then 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80'
      when 'men' then 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=1200&q=80'
      when 'kids' then 'https://images.unsplash.com/photo-1503919005314-30d93d07d823?auto=format&fit=crop&w=1200&q=80'
      when 'shoes' then 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1200&q=80'
      when 'jewelry' then 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=80'
      when 'home-living' then 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'
      when 'beauty' then 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1200&q=80'
      else 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80'
    end as image_url,
    (ps.n % 5 = 0) as is_new,
    (ps.n % 7 = 0) as is_bestseller,
    (ps.category_slug in ('women', 'men', 'jewelry') and ps.n % 6 = 0) as is_luxury,
    true as is_active,
    round((3.8 + ((ps.n * 13) % 12) / 10.0)::numeric, 2) as rating,
    (5 + (ps.n * 11 % 240))::int as review_count
  from product_source ps
)
insert into public.products (
  name,
  slug,
  description,
  price,
  sale_price,
  stock,
  category_id,
  image_url,
  sizes,
  colors,
  is_new,
  is_bestseller,
  is_luxury,
  is_active,
  rating,
  review_count
)
select
  name,
  slug,
  description,
  price,
  sale_price,
  stock,
  category_id,
  image_url,
  sizes,
  colors,
  is_new,
  is_bestseller,
  is_luxury,
  is_active,
  rating,
  review_count
from prepared_products
on conflict (slug) do nothing;

commit;

-- Verification queries:
select count(*) from products;

select c.name, count(p.id)
from categories c
left join products p on p.category_id = c.id
group by c.name
order by c.name;
