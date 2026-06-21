-- Royal Boutiques product image variety cleanup
-- Updates existing product image_url values only.
-- Does not delete products or modify auth, checkout, payments, routing, or design.
--
-- The script assigns each category a deterministic pool of 50 stable public image URLs.
-- With the current 125 products per category, each URL is reused about 2-3 times.

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
image_assignments as (
  select
    id,
    category_slug,
    rn,
    ((rn - 1) % 50) + 1 as image_slot,
    case category_slug
      when 'women' then 11000
      when 'men' then 12000
      when 'kids' then 13000
      when 'shoes' then 14000
      when 'jewelry' then 15000
      when 'home-living' then 16000
      when 'beauty' then 17000
      else 18000
    end as lock_base,
    case category_slug
      when 'women' then case ((rn - 1) % 14)
        when 0 then 'women,dress,fashion'
        when 1 then 'women,blouse,fashion'
        when 2 then 'women,handbag,fashion'
        when 3 then 'women,coat,fashion'
        when 4 then 'women,skirt,fashion'
        when 5 then 'women,trousers,fashion'
        when 6 then 'women,blazer,fashion'
        when 7 then 'women,maxi-dress,fashion'
        when 8 then 'women,top,fashion'
        when 9 then 'women,tote-bag,fashion'
        when 10 then 'women,jacket,fashion'
        when 11 then 'women,pencil-skirt,fashion'
        when 12 then 'women,wide-leg-trousers,fashion'
        else 'women,office-wear,fashion'
      end
      when 'men' then case ((rn - 1) % 14)
        when 0 then 'men,shirt,fashion'
        when 1 then 'men,polo-shirt,fashion'
        when 2 then 'men,suit,fashion'
        when 3 then 'men,jacket,fashion'
        when 4 then 'men,trousers,fashion'
        when 5 then 'men,jeans,fashion'
        when 6 then 'men,belt,fashion'
        when 7 then 'men,blazer,fashion'
        when 8 then 'men,linen-shirt,fashion'
        when 9 then 'men,chinos,fashion'
        when 10 then 'men,denim-jacket,fashion'
        when 11 then 'men,formal-wear,fashion'
        when 12 then 'men,casual-wear,fashion'
        else 'men,office-wear,fashion'
      end
      when 'kids' then case ((rn - 1) % 14)
        when 0 then 'kids,clothes'
        when 1 then 'baby,clothes'
        when 2 then 'kids,school-uniform'
        when 3 then 'kids,backpack'
        when 4 then 'kids,party-dress'
        when 5 then 'kids,shoes'
        when 6 then 'baby,romper'
        when 7 then 'kids,jacket'
        when 8 then 'kids,shirt'
        when 9 then 'kids,dress'
        when 10 then 'baby,blanket'
        when 11 then 'kids,lunch-bag'
        when 12 then 'kids,sweater'
        else 'kids,accessories'
      end
      when 'shoes' then case ((rn - 1) % 14)
        when 0 then 'heels,shoes'
        when 1 then 'sneakers,shoes'
        when 2 then 'sandals,shoes'
        when 3 then 'loafers,shoes'
        when 4 then 'boots,shoes'
        when 5 then 'flats,shoes'
        when 6 then 'leather-shoes'
        when 7 then 'running-shoes'
        when 8 then 'ankle-boots'
        when 9 then 'court-heels'
        when 10 then 'dress-shoes'
        when 11 then 'platform-heels'
        when 12 then 'ballet-flats'
        else 'casual-shoes'
      end
      when 'jewelry' then case ((rn - 1) % 14)
        when 0 then 'rings,jewelry'
        when 1 then 'earrings,jewelry'
        when 2 then 'necklace,jewelry'
        when 3 then 'bracelet,jewelry'
        when 4 then 'watch,jewelry'
        when 5 then 'sunglasses,fashion'
        when 6 then 'gold-jewelry'
        when 7 then 'silver-jewelry'
        when 8 then 'pearl-necklace'
        when 9 then 'wristwatch'
        when 10 then 'diamond-ring'
        when 11 then 'charm-bracelet'
        when 12 then 'stud-earrings'
        else 'fashion-accessories'
      end
      when 'home-living' then case ((rn - 1) % 14)
        when 0 then 'bedsheets,home'
        when 1 then 'pillows,bedroom'
        when 2 then 'duvet,bedroom'
        when 3 then 'curtains,home'
        when 4 then 'towels,bathroom'
        when 5 then 'mattress,bedroom'
        when 6 then 'blanket,bedroom'
        when 7 then 'bedding,bedroom'
        when 8 then 'bath-towels'
        when 9 then 'bedroom,interior'
        when 10 then 'cushions,home'
        when 11 then 'duvet-cover'
        when 12 then 'living-room-curtains'
        else 'home-decor'
      end
      when 'beauty' then case ((rn - 1) % 14)
        when 0 then 'perfume,beauty'
        when 1 then 'lipstick,makeup'
        when 2 then 'skincare,beauty'
        when 3 then 'hair-products,beauty'
        when 4 then 'body-lotion,beauty'
        when 5 then 'makeup,beauty'
        when 6 then 'face-cream,skincare'
        when 7 then 'serum,skincare'
        when 8 then 'shampoo,haircare'
        when 9 then 'foundation,makeup'
        when 10 then 'beauty-products'
        when 11 then 'fragrance,perfume'
        when 12 then 'hair-oil,beauty'
        else 'cosmetics,beauty'
      end
      else case ((rn - 1) % 24)
        when 0 then 'women,dress,fashion'
        when 1 then 'men,shirt,fashion'
        when 2 then 'sneakers,shoes'
        when 3 then 'handbag,fashion'
        when 4 then 'kids,clothes'
        when 5 then 'perfume,beauty'
        when 6 then 'earrings,jewelry'
        when 7 then 'bedsheets,home'
        when 8 then 'heels,shoes'
        when 9 then 'men,suit,fashion'
        when 10 then 'baby,clothes'
        when 11 then 'body-lotion,beauty'
        when 12 then 'watch,jewelry'
        when 13 then 'curtains,home'
        when 14 then 'women,coat,fashion'
        when 15 then 'men,jeans,fashion'
        when 16 then 'sandals,shoes'
        when 17 then 'necklace,jewelry'
        when 18 then 'duvet,bedroom'
        when 19 then 'makeup,beauty'
        when 20 then 'kids,backpack'
        when 21 then 'loafers,shoes'
        when 22 then 'towels,bathroom'
        else 'women,blazer,fashion'
      end
    end as image_keywords
  from ranked_products
),
prepared_images as (
  select
    id,
    concat(
      'https://loremflickr.com/1200/1600/',
      image_keywords,
      '?lock=',
      (lock_base + image_slot)::text
    ) as new_image_url
  from image_assignments
)
update public.products p
set
  image_url = prepared_images.new_image_url,
  updated_at = now()
from prepared_images
where p.id = prepared_images.id;

commit;

-- Expected result after running: zero rows.
select image_url, count(*)
from products
group by image_url
having count(*) > 5
order by count(*) desc;

-- Category image variety check.
select c.slug, count(distinct p.image_url) as unique_images, count(*) as total_products
from products p
join categories c on c.id = p.category_id
group by c.slug
order by c.slug;
