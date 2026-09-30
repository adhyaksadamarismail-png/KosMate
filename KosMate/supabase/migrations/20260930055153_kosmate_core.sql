create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  phone text,
  role text not null default 'customer' check (role in ('customer', 'support')),
  active_location_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.locations (
  id text primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  city text not null,
  address text not null,
  is_mock boolean not null default false,
  created_at timestamptz not null default now(),
  constraint locations_latitude_range check (latitude between -90 and 90),
  constraint locations_longitude_range check (longitude between -180 and 180)
);

alter table public.profiles add constraint profiles_active_location_fk
  foreign key (active_location_id) references public.locations(id) on delete set null;

create table public.mitras (
  id text primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('kost_owner', 'food_merchant', 'errand_provider')),
  status text not null default 'pending' check (status in ('pending', 'active', 'rejected', 'paused')),
  display_name text not null,
  phone text,
  created_at timestamptz not null default now(),
  unique (profile_id, type)
);

create table public.service_categories (
  id text primary key,
  slug text not null unique,
  name text not null,
  description text not null default '',
  icon text not null default 'home',
  active boolean not null default true
);

create table public.services (
  id text primary key,
  category_id text references public.service_categories(id) on delete set null,
  slug text not null unique,
  name text not null,
  description text not null default '',
  icon text not null default 'home',
  mode text not null default 'errand',
  pricing_mode text not null default 'provider_quote',
  provider_types text[] not null default '{}',
  active boolean not null default true
);

create table public.kosts (
  id text primary key,
  slug text not null unique,
  owner_id uuid references public.profiles(id) on delete set null,
  name text not null,
  type text not null default 'Campur',
  price integer not null check (price >= 0),
  address text not null,
  city text not null,
  area text not null default '',
  latitude double precision,
  longitude double precision,
  description text not null default '',
  rules jsonb not null default '[]'::jsonb,
  facilities text[] not null default '{}',
  photos jsonb not null default '[]'::jsonb,
  main_photo text not null default '',
  rating numeric(2,1) not null default 0,
  review_count integer not null default 0,
  verified boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.kost_rooms (
  id text primary key,
  kost_id text not null references public.kosts(id) on delete cascade,
  name text not null,
  room_type text not null default 'standard',
  size text not null default '',
  price integer not null check (price >= 0),
  availability integer not null default 0 check (availability >= 0),
  facilities text[] not null default '{}'
);

create table public.merchants (
  id text primary key,
  mitra_id text references public.mitras(id) on delete set null,
  slug text not null unique,
  name text not null,
  description text not null default '',
  address text not null default '',
  city text not null,
  latitude double precision,
  longitude double precision,
  rating numeric(2,1) not null default 0,
  photo text not null default '',
  estimate text not null default '',
  service_fee integer not null default 0 check (service_fee >= 0),
  additional_fee integer not null default 0 check (additional_fee >= 0),
  is_open boolean not null default false,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.menu_items (
  id text primary key,
  merchant_id text not null references public.merchants(id) on delete cascade,
  name text not null,
  description text not null default '',
  price integer not null check (price >= 0),
  image text not null default '',
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.service_fees (
  id text primary key,
  service_id text not null references public.services(id) on delete cascade,
  name text not null,
  amount integer check (amount is null or amount >= 0),
  unit text not null default 'per pesanan',
  pricing text not null default 'quote' check (pricing in ('fixed', 'quote')),
  active boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.service_providers (
  id text primary key,
  mitra_id text references public.mitras(id) on delete set null,
  name text not null,
  phone text,
  area text not null default '',
  service_ids text[] not null default '{}',
  products jsonb not null default '[]'::jsonb,
  verified boolean not null default false,
  active boolean not null default true
);

create table public.orders (
  id text primary key,
  customer_id uuid not null references public.profiles(id) on delete restrict,
  service_id text not null references public.services(id) on delete restrict,
  provider_id text references public.service_providers(id) on delete set null,
  merchant_id text references public.merchants(id) on delete set null,
  status text not null default 'received' check (status in ('received', 'accepted', 'in_progress', 'ready_for_delivery', 'on_the_way', 'completed', 'cancelled', 'awaiting_quote', 'awaiting_approval')),
  pricing_mode text not null default 'provider_quote',
  pricing_status text not null default 'none',
  subtotal integer not null default 0 check (subtotal >= 0),
  delivery_fee integer not null default 0 check (delivery_fee >= 0),
  service_fee integer not null default 0 check (service_fee >= 0),
  additional_fee integer check (additional_fee is null or additional_fee >= 0),
  total integer check (total is null or total >= 0),
  customer_offer integer,
  provider_offer integer,
  payment_status text not null default 'not_started' check (payment_status in ('not_started', 'unpaid_mock', 'paid_mock')),
  pickup_address text,
  pickup_latitude double precision,
  pickup_longitude double precision,
  delivery_address text,
  delivery_latitude double precision,
  delivery_longitude double precision,
  route_distance_meters integer,
  weight_kg numeric(8,2),
  length_cm numeric(8,2),
  width_cm numeric(8,2),
  height_cm numeric(8,2),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id text primary key,
  order_id text not null references public.orders(id) on delete cascade,
  item_name text not null,
  quantity integer not null default 1 check (quantity > 0),
  price integer check (price is null or price >= 0),
  subtotal integer check (subtotal is null or subtotal >= 0),
  details jsonb not null default '{}'::jsonb
);

create table public.chat_rooms (
  id text primary key,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  provider_id uuid references public.profiles(id) on delete set null,
  provider_mitra_id text references public.service_providers(id) on delete set null,
  type text not null check (type in ('kost_owner', 'food_merchant', 'errand_provider', 'support')),
  service_id text references public.services(id) on delete set null,
  kost_id text references public.kosts(slug) on delete set null,
  order_id text references public.orders(id) on delete set null,
  status text not null default 'consulting',
  quoted_amount integer,
  service_fee integer,
  additional_fee integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.chat_messages (
  id text primary key,
  room_id text not null references public.chat_rooms(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

create table public.quotes (
  id text primary key,
  order_id text references public.orders(id) on delete cascade,
  room_id text references public.chat_rooms(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  subtotal integer not null default 0,
  delivery_fee integer not null default 0,
  service_fee integer not null default 0,
  additional_fee integer not null default 0,
  total integer not null default 0,
  status text not null default 'sent' check (status in ('sent', 'accepted', 'rejected', 'superseded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.negotiations (
  id text primary key,
  order_id text not null references public.orders(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null check (amount >= 0),
  note text,
  status text not null default 'proposed' check (status in ('proposed', 'accepted', 'rejected', 'superseded')),
  created_at timestamptz not null default now()
);

create index kosts_public_city_idx on public.kosts (city, active);
create index merchants_public_city_idx on public.merchants (city, is_open);
create index menu_items_merchant_idx on public.menu_items (merchant_id, is_available);
create index orders_customer_created_idx on public.orders (customer_id, created_at desc);
create index chat_messages_room_created_idx on public.chat_messages (room_id, created_at);

alter table public.profiles enable row level security;
alter table public.locations enable row level security;
alter table public.mitras enable row level security;
alter table public.service_categories enable row level security;
alter table public.services enable row level security;
alter table public.kosts enable row level security;
alter table public.kost_rooms enable row level security;
alter table public.merchants enable row level security;
alter table public.menu_items enable row level security;
alter table public.service_fees enable row level security;
alter table public.service_providers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.chat_rooms enable row level security;
alter table public.chat_messages enable row level security;
alter table public.quotes enable row level security;
alter table public.negotiations enable row level security;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.locations to authenticated;
grant select, insert, update on public.mitras to authenticated;
grant select on public.service_categories, public.services, public.kosts, public.kost_rooms, public.merchants, public.menu_items, public.service_fees, public.service_providers to anon, authenticated;
grant insert, update on public.kosts, public.kost_rooms, public.merchants, public.menu_items to authenticated;
grant insert, update on public.service_providers to authenticated;
grant select, insert, update on public.orders, public.order_items, public.chat_rooms, public.chat_messages, public.quotes, public.negotiations to authenticated;

create policy profiles_select_self on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_insert_customer_self on public.profiles for insert to authenticated with check ((select auth.uid()) = id and role = 'customer');
create policy profiles_update_self on public.profiles for update to authenticated using ((select auth.uid()) = id and role = 'customer') with check ((select auth.uid()) = id and role = 'customer');

create or replace function public.handle_new_kosmate_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, phone, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''), coalesce(new.email, ''), nullif(new.raw_user_meta_data ->> 'phone', ''), 'customer')
  on conflict (id) do update set name = excluded.name, email = excluded.email, phone = excluded.phone;
  return new;
end;
$$;

create trigger on_auth_user_created_kosmate
  after insert on auth.users
  for each row execute procedure public.handle_new_kosmate_user();

create or replace function public.is_kosmate_support()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'support');
$$;

create policy locations_manage_self on public.locations for all to authenticated using ((select auth.uid()) = profile_id) with check ((select auth.uid()) = profile_id);
create policy mitras_read_active_or_self on public.mitras for select to anon, authenticated using (status = 'active' or (select auth.uid()) = profile_id);
create policy mitras_register_self_pending on public.mitras for insert to authenticated with check ((select auth.uid()) = profile_id and status = 'pending');
create policy mitras_update_self_pending on public.mitras for update to authenticated using ((select auth.uid()) = profile_id and status = 'pending') with check ((select auth.uid()) = profile_id and status = 'pending');

create policy service_categories_public_active on public.service_categories for select to anon, authenticated using (active);
create policy services_public_active on public.services for select to anon, authenticated using (active);
create policy kosts_public_active on public.kosts for select to anon, authenticated using (active);
create policy kosts_owner_insert on public.kosts for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy kosts_owner_update on public.kosts for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy kosts_owner_delete on public.kosts for delete to authenticated using ((select auth.uid()) = owner_id);
create policy kost_rooms_public_active on public.kost_rooms for select to anon, authenticated using (exists (select 1 from public.kosts k where k.id = kost_id and k.active));
create policy kost_rooms_owner_manage on public.kost_rooms for all to authenticated using (exists (select 1 from public.kosts k where k.id = kost_id and k.owner_id = (select auth.uid())) ) with check (exists (select 1 from public.kosts k where k.id = kost_id and k.owner_id = (select auth.uid())));

create policy merchants_public_open on public.merchants for select to anon, authenticated using (is_open or exists (select 1 from public.mitras m where m.id = mitra_id and m.profile_id = (select auth.uid())));
create policy merchants_owner_insert on public.merchants for insert to authenticated with check (exists (select 1 from public.mitras m where m.id = mitra_id and m.profile_id = (select auth.uid()) and m.type = 'food_merchant'));
create policy merchants_owner_update on public.merchants for update to authenticated using (exists (select 1 from public.mitras m where m.id = mitra_id and m.profile_id = (select auth.uid()))) with check (exists (select 1 from public.mitras m where m.id = mitra_id and m.profile_id = (select auth.uid())));
create policy menu_items_public_available on public.menu_items for select to anon, authenticated using (is_available and exists (select 1 from public.merchants m where m.id = merchant_id and m.is_open));
create policy menu_items_owner_manage on public.menu_items for all to authenticated using (exists (select 1 from public.merchants s join public.mitras p on p.id = s.mitra_id where s.id = merchant_id and p.profile_id = (select auth.uid()))) with check (exists (select 1 from public.merchants s join public.mitras p on p.id = s.mitra_id where s.id = merchant_id and p.profile_id = (select auth.uid())));
create policy service_fees_active_read on public.service_fees for select to anon, authenticated using (active);
create policy service_providers_active_read on public.service_providers for select to anon, authenticated using (active or exists (select 1 from public.mitras m where m.id = mitra_id and m.profile_id = (select auth.uid())));
create policy service_providers_owner_insert on public.service_providers for insert to authenticated with check (exists (select 1 from public.mitras m where m.id = mitra_id and m.profile_id = (select auth.uid()) and m.status = 'pending'));
create policy service_providers_owner_update on public.service_providers for update to authenticated using (exists (select 1 from public.mitras m where m.id = mitra_id and m.profile_id = (select auth.uid()))) with check (exists (select 1 from public.mitras m where m.id = mitra_id and m.profile_id = (select auth.uid())));

create policy orders_customer_read on public.orders for select to authenticated using ((select auth.uid()) = customer_id);
create policy orders_support_read on public.orders for select to authenticated using ((select public.is_kosmate_support()));
create policy orders_support_update on public.orders for update to authenticated using ((select public.is_kosmate_support())) with check ((select public.is_kosmate_support()));
create policy orders_provider_read on public.orders for select to authenticated using (exists (select 1 from public.service_providers sp join public.mitras m on m.id = sp.mitra_id where sp.id = provider_id and m.profile_id = (select auth.uid())) or exists (select 1 from public.merchants s join public.mitras m on m.id = s.mitra_id where s.id = merchant_id and m.profile_id = (select auth.uid())));
create policy orders_customer_insert on public.orders for insert to authenticated with check ((select auth.uid()) = customer_id);
create policy orders_customer_update on public.orders for update to authenticated using ((select auth.uid()) = customer_id) with check ((select auth.uid()) = customer_id);
create policy orders_provider_update on public.orders for update to authenticated using (exists (select 1 from public.service_providers sp join public.mitras m on m.id = sp.mitra_id where sp.id = provider_id and m.profile_id = (select auth.uid())) or exists (select 1 from public.merchants s join public.mitras m on m.id = s.mitra_id where s.id = merchant_id and m.profile_id = (select auth.uid()))) with check (exists (select 1 from public.service_providers sp join public.mitras m on m.id = sp.mitra_id where sp.id = provider_id and m.profile_id = (select auth.uid())) or exists (select 1 from public.merchants s join public.mitras m on m.id = s.mitra_id where s.id = merchant_id and m.profile_id = (select auth.uid())));

create policy order_items_participant_read on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = (select auth.uid()) or exists (select 1 from public.service_providers sp join public.mitras m on m.id = sp.mitra_id where sp.id = o.provider_id and m.profile_id = (select auth.uid())) or exists (select 1 from public.merchants s join public.mitras m on m.id = s.mitra_id where s.id = o.merchant_id and m.profile_id = (select auth.uid())))));
create policy order_items_customer_insert on public.order_items for insert to authenticated with check (exists (select 1 from public.orders o where o.id = order_id and o.customer_id = (select auth.uid())));
create policy order_items_support_read on public.order_items for select to authenticated using ((select public.is_kosmate_support()));
create policy order_items_participant_update on public.order_items for update to authenticated using (exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = (select auth.uid()) or exists (select 1 from public.service_providers sp join public.mitras m on m.id = sp.mitra_id where sp.id = o.provider_id and m.profile_id = (select auth.uid())) or exists (select 1 from public.merchants s join public.mitras m on m.id = s.mitra_id where s.id = o.merchant_id and m.profile_id = (select auth.uid()))))) with check (exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = (select auth.uid()) or exists (select 1 from public.service_providers sp join public.mitras m on m.id = sp.mitra_id where sp.id = o.provider_id and m.profile_id = (select auth.uid())) or exists (select 1 from public.merchants s join public.mitras m on m.id = s.mitra_id where s.id = o.merchant_id and m.profile_id = (select auth.uid())))));

create policy chat_rooms_participant_read on public.chat_rooms for select to authenticated using (customer_id = (select auth.uid()) or provider_id = (select auth.uid()) or exists (select 1 from public.service_providers sp join public.mitras m on m.id = sp.mitra_id where sp.id = provider_mitra_id and m.profile_id = (select auth.uid())) or (select public.is_kosmate_support()));
create policy chat_rooms_customer_insert on public.chat_rooms for insert to authenticated with check (customer_id = (select auth.uid()));
create policy chat_rooms_participant_update on public.chat_rooms for update to authenticated using (customer_id = (select auth.uid()) or provider_id = (select auth.uid()) or exists (select 1 from public.service_providers sp join public.mitras m on m.id = sp.mitra_id where sp.id = provider_mitra_id and m.profile_id = (select auth.uid())) or (select public.is_kosmate_support())) with check (customer_id = (select auth.uid()) or provider_id = (select auth.uid()) or exists (select 1 from public.service_providers sp join public.mitras m on m.id = sp.mitra_id where sp.id = provider_mitra_id and m.profile_id = (select auth.uid())) or (select public.is_kosmate_support()));
create policy chat_messages_participant_read on public.chat_messages for select to authenticated using (exists (select 1 from public.chat_rooms r where r.id = room_id and (r.customer_id = (select auth.uid()) or r.provider_id = (select auth.uid()) or exists (select 1 from public.service_providers sp join public.mitras m on m.id = sp.mitra_id where sp.id = r.provider_mitra_id and m.profile_id = (select auth.uid())) or (select public.is_kosmate_support()))));
create policy chat_messages_participant_insert on public.chat_messages for insert to authenticated with check (sender_id = (select auth.uid()) and exists (select 1 from public.chat_rooms r where r.id = room_id and (r.customer_id = (select auth.uid()) or r.provider_id = (select auth.uid()) or exists (select 1 from public.service_providers sp join public.mitras m on m.id = sp.mitra_id where sp.id = r.provider_mitra_id and m.profile_id = (select auth.uid())) or (select public.is_kosmate_support()))));

create policy quotes_order_participant_read on public.quotes for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = (select auth.uid()) or exists (select 1 from public.service_providers sp join public.mitras m on m.id = sp.mitra_id where sp.id = o.provider_id and m.profile_id = (select auth.uid())))) or exists (select 1 from public.chat_rooms r where r.id = room_id and (r.customer_id = (select auth.uid()) or r.provider_id = (select auth.uid()) or exists (select 1 from public.service_providers sp join public.mitras m on m.id = sp.mitra_id where sp.id = r.provider_mitra_id and m.profile_id = (select auth.uid())))));
create policy quotes_participant_insert on public.quotes for insert to authenticated with check (created_by = (select auth.uid()) and (exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = (select auth.uid()) or exists (select 1 from public.service_providers sp join public.mitras m on m.id = sp.mitra_id where sp.id = o.provider_id and m.profile_id = (select auth.uid())))) or exists (select 1 from public.chat_rooms r where r.id = room_id and (r.customer_id = (select auth.uid()) or r.provider_id = (select auth.uid()) or exists (select 1 from public.service_providers sp join public.mitras m on m.id = sp.mitra_id where sp.id = r.provider_mitra_id and m.profile_id = (select auth.uid()))))));
create policy quotes_participant_update on public.quotes for update to authenticated using (exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = (select auth.uid()) or exists (select 1 from public.service_providers sp join public.mitras m on m.id = sp.mitra_id where sp.id = o.provider_id and m.profile_id = (select auth.uid())))) or exists (select 1 from public.chat_rooms r where r.id = room_id and (r.customer_id = (select auth.uid()) or r.provider_id = (select auth.uid()) or exists (select 1 from public.service_providers sp join public.mitras m on m.id = sp.mitra_id where sp.id = r.provider_mitra_id and m.profile_id = (select auth.uid()))))) with check (exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = (select auth.uid()) or exists (select 1 from public.service_providers sp join public.mitras m on m.id = sp.mitra_id where sp.id = o.provider_id and m.profile_id = (select auth.uid())))) or exists (select 1 from public.chat_rooms r where r.id = room_id and (r.customer_id = (select auth.uid()) or r.provider_id = (select auth.uid()) or exists (select 1 from public.service_providers sp join public.mitras m on m.id = sp.mitra_id where sp.id = r.provider_mitra_id and m.profile_id = (select auth.uid())))));
create policy negotiations_order_participant_read on public.negotiations for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = (select auth.uid()) or exists (select 1 from public.service_providers sp join public.mitras m on m.id = sp.mitra_id where sp.id = o.provider_id and m.profile_id = (select auth.uid())))));
create policy negotiations_order_participant_insert on public.negotiations for insert to authenticated with check (author_id = (select auth.uid()) and exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = (select auth.uid()) or exists (select 1 from public.service_providers sp join public.mitras m on m.id = sp.mitra_id where sp.id = o.provider_id and m.profile_id = (select auth.uid())))));
create policy quotes_support_read on public.quotes for select to authenticated using ((select public.is_kosmate_support()));
create policy quotes_support_insert on public.quotes for insert to authenticated with check ((select public.is_kosmate_support()) and created_by = (select auth.uid()));
create policy quotes_support_update on public.quotes for update to authenticated using ((select public.is_kosmate_support())) with check ((select public.is_kosmate_support()));
create policy negotiations_support_read on public.negotiations for select to authenticated using ((select public.is_kosmate_support()));
create policy negotiations_support_insert on public.negotiations for insert to authenticated with check ((select public.is_kosmate_support()) and author_id = (select auth.uid()));
create policy negotiations_support_update on public.negotiations for update to authenticated using ((select public.is_kosmate_support())) with check ((select public.is_kosmate_support()));
create policy negotiations_order_participant_update on public.negotiations for update to authenticated using (exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = (select auth.uid()) or exists (select 1 from public.service_providers sp join public.mitras m on m.id = sp.mitra_id where sp.id = o.provider_id and m.profile_id = (select auth.uid()))))) with check (exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = (select auth.uid()) or exists (select 1 from public.service_providers sp join public.mitras m on m.id = sp.mitra_id where sp.id = o.provider_id and m.profile_id = (select auth.uid())))));

insert into public.service_categories (id, slug, name, description, icon) values
('cat-galon','galon','Isi Ulang Galon','Pilih produk isi ulang dari penyedia.','water'),
('cat-titip-belanja','titip-belanja','Titip Belanja','Titip pembelian barang dari toko pilihanmu.','basket'),
('cat-pesan-makanan','pesan-makanan','Pesan Makanan','Pesan menu dari merchant makanan sekitar.','food'),
('cat-cleaning','cleaning','Cleaning Kamar','Atur jadwal layanan kebersihan kamar.','cleaning'),
('cat-perbaikan','perbaikan','Jasa Perbaikan','Ceritakan masalah dan minta estimasi perbaikan.','repair'),
('cat-paket','paket','Ambil / Antar Paket','Atur pengambilan dan pengantaran paket.','package'),
('cat-pindahan','pindahan','Bantuan Pindahan Kos','Minta bantuan tenaga untuk pindah kos.','moving'),
('cat-teknologi','teknologi','Bantuan Teknologi','Bantuan WiFi, komputer, laptop, dan printer.','tech'),
('cat-angkut','angkut','Angkut / Pindah Barang','Bantuan mengangkat dan memindahkan barang.','luggage'),
('cat-lainnya','lainnya','Jasa Lainnya','Konsultasikan kebutuhan khususmu bersama CS KosMate.','chat')
on conflict (id) do nothing;

insert into public.services (id, category_id, slug, name, description, icon, mode, pricing_mode, provider_types) values
('service-galon','cat-galon','isi-ulang-galon','Isi Ulang Galon','Air galon ke kamar kos dengan cepat dan praktis.','water','provider_or_errand','fixed_price',array['MITRA','JASA_SURUH']),
('service-titip-belanja','cat-titip-belanja','titip-belanja','Titip Belanja','Titip pembelian barang dari toko pilihanmu.','basket','errand','customer_offer',array['JASA_SURUH']),
('service-pesan-makanan','cat-pesan-makanan','pesan-makanan','Pesan Makanan','Pesan menu dari merchant makanan sekitar.','food','provider_or_errand','fixed_price',array['MITRA','JASA_SURUH']),
('service-cleaning','cat-cleaning','cleaning-kamar','Cleaning Kamar','Atur jadwal layanan kebersihan kamar.','cleaning','errand','customer_offer',array['JASA_SURUH']),
('service-perbaikan','cat-perbaikan','jasa-perbaikan','Jasa Perbaikan','Ceritakan masalah dan minta estimasi perbaikan.','repair','errand','provider_quote',array['JASA_SURUH']),
('service-paket','cat-paket','ambil-antar-paket','Ambil / Antar Paket','Atur pengambilan dan pengantaran paket.','package','errand','customer_offer',array['JASA_SURUH']),
('service-pindahan','cat-pindahan','bantuan-pindahan-kos','Bantuan Pindahan Kos','Minta bantuan tenaga untuk pindah kos.','moving','errand','provider_quote',array['JASA_SURUH']),
('service-teknologi','cat-teknologi','bantuan-teknologi','Bantuan Teknologi','Bantuan WiFi, komputer, laptop, dan printer.','tech','errand','provider_quote',array['JASA_SURUH']),
('service-angkut','cat-angkut','angkut-pindah-barang','Angkut / Pindah Barang','Bantuan mengangkat dan memindahkan barang.','luggage','errand','provider_quote',array['JASA_SURUH']),
('service-lainnya','cat-lainnya','jasa-lainnya','Jasa Lainnya','Konsultasikan kebutuhan khususmu bersama CS KosMate.','chat','consultation','support_quote',array['CS_KOSMATE'])
on conflict (id) do nothing;

insert into public.service_providers (id,name,area,service_ids,products,verified,active) values
('provider-aqua-sehat','Depot Aqua Sehat','Bandung (mock)',array['service-galon'],'[{"id":"product-aqua-19","name":"Aqua 19L","priceFeeId":"fee-galon-aqua-19"},{"id":"product-le-minerale-19","name":"Le Minerale 19L","priceFeeId":"fee-galon-le-minerale"},{"id":"product-cleo-19","name":"Cleo 19L","priceFeeId":"fee-galon-cleo"}]',true,true),
('provider-rina','Dapur Bu Rina','Bandung (mock)',array['service-pesan-makanan'],'[]',true,true),
('provider-belanja-yuk','Belanja Yuk','Bandung (mock)',array['service-titip-belanja'],'[]',true,true),
('provider-errand-queue','Jasa Suruh KosMate','Bandung (mock)',array['service-titip-belanja','service-cleaning','service-perbaikan','service-paket','service-pindahan','service-teknologi','service-angkut'],'[]',true,true)
on conflict (id) do nothing;

insert into public.service_fees (id,service_id,name,amount,unit,pricing,active,config) values
('fee-galon-aqua-19','service-galon','Aqua 19L',22000,'per galon','fixed',true,'{}'),
('fee-galon-le-minerale','service-galon','Le Minerale 19L',21000,'per galon','fixed',true,'{}'),
('fee-galon-cleo','service-galon','Cleo 19L',20000,'per galon','fixed',true,'{}'),
('fee-galon-delivery','service-galon','Biaya bantuan pengantaran',5000,'per pesanan','fixed',true,'{}'),
('fee-food-platform','service-pesan-makanan','Biaya layanan KosMate',2000,'per pesanan','fixed',true,'{}'),
('fee-package-extra','service-paket','Biaya berat/ukuran paket',null,'quote','quote',true,'{"normal_weight_kg":10,"weight_charge_configured":false,"oversize_charge_configured":false}')
on conflict (id) do nothing;

insert into public.kosts (id,slug,name,type,price,address,city,area,latitude,longitude,description,rules,facilities,main_photo,photos,rating,review_count,verified,active) values
('seed-kost-putri-melati','kost-putri-melati','Kost Putri Melati','Putri',850000,'Jl. Tamansari No.12, Bandung','Bandung','Dekat Unpas',-6.897,107.604,'Kost khusus putri dengan lingkungan yang aman, bersih, dan nyaman. Lokasi strategis dekat kampus dan akses transportasi mudah.','["Tidak merokok di dalam kamar","Tamu wajib melapor","Menjaga kebersihan area bersama"]',array['Kamar mandi dalam','WiFi','AC','Dapur bersama','Lemari','Meja belajar','Kasur + spreI','Parkir motor'],'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=85','[{"id":"seed-kost-putri-melati-room","url":"https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=85","name":"Kamar","category":"Kamar","isPrimary":true}]',4.8,120,true,true),
('seed-kost-senja-residence','kost-senja-residence','Kost Senja Residence','Campur',1200000,'Jl. Ciumbuleuit No. 8, Bandung','Bandung','Dekat ITB',-6.889,107.610,'Hunian nyaman dengan suasana tenang dan akses mudah ke kampus, pusat kuliner, dan transportasi umum.','["Tidak merokok di dalam kamar","Tamu wajib melapor","Menjaga kebersihan area bersama"]',array['WiFi','AC','Parkir','CCTV','Dapur bersama'],'https://images.unsplash.com/photo-1617104678098-de229db51175?auto=format&fit=crop&w=1200&q=85','[{"id":"seed-kost-senja-residence-room","url":"https://images.unsplash.com/photo-1617104678098-de229db51175?auto=format&fit=crop&w=1200&q=85","name":"Kamar","category":"Kamar","isPrimary":true}]',4.6,98,true,true),
('seed-kost-putra-nyaman','kost-putra-nyaman','Kost Putra Nyaman','Putra',900000,'Jl. Dipatiukur No. 24, Bandung','Bandung','Dekat Telkom',-6.881,107.616,'Kamar bersih dan lapang di lingkungan yang nyaman. Cocok untuk mahasiswa maupun pekerja muda.','["Tidak merokok di dalam kamar","Tamu wajib melapor","Menjaga kebersihan area bersama"]',array['Kamar mandi dalam','WiFi','Dapur','Lemari','Parkir motor'],'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=85','[{"id":"seed-kost-putra-nyaman-room","url":"https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=85","name":"Kamar","category":"Kamar","isPrimary":true}]',4.7,76,true,true),
('seed-kost-green-house','kost-green-house','Kost Green House','Campur',950000,'Jl. Setiabudi No. 51, Bandung','Bandung','Dekat UPI',-6.873,107.622,'Kost modern dengan banyak ruang hijau, fasilitas lengkap, dan suasana rumah yang hangat.','["Tidak merokok di dalam kamar","Tamu wajib melapor","Menjaga kebersihan area bersama"]',array['WiFi','AC','Dapur bersama','Laundry','CCTV'],'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85','[{"id":"seed-kost-green-house-room","url":"https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85","name":"Kamar","category":"Kamar","isPrimary":true}]',4.5,64,true,true)
on conflict (id) do nothing;

insert into public.kost_rooms (id,kost_id,name,room_type,size,price,availability,facilities) values
('seed-room-melati','seed-kost-putri-melati','Kamar Standard','putri','3 × 4 m (mock)',850000,2,array['Kamar mandi dalam','WiFi','AC','Lemari']),
('seed-room-senja','seed-kost-senja-residence','Kamar Standard','campur','3 × 4 m (mock)',1200000,2,array['WiFi','AC','Lemari']),
('seed-room-putra','seed-kost-putra-nyaman','Kamar Standard','putra','3 × 4 m (mock)',900000,2,array['Kamar mandi dalam','WiFi','Lemari']),
('seed-room-green','seed-kost-green-house','Kamar Standard','campur','3 × 4 m (mock)',950000,2,array['WiFi','AC','CCTV'])
on conflict (id) do nothing;

insert into public.merchants (id,slug,name,description,address,city,latitude,longitude,rating,photo,estimate,service_fee,additional_fee,is_open,verified) values
('merchant-rina','dapur-bu-rina','Dapur Bu Rina','Menu rumahan dan makanan hangat.','Jl. Setiabudi (mock)','Bandung',-6.9002,107.6049,4.8,'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80','20–30 menit',2000,0,true,true),
('merchant-kedai','kedai-senja','Kedai Senja','Pilihan makanan rumahan di area Dago.','Area Dago (mock)','Bandung',-6.8953,107.6112,4.7,'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80','25–35 menit',2000,0,true,true)
on conflict (id) do nothing;

insert into public.menu_items (id,merchant_id,name,description,price,image,is_available) values
('menu-ayam','merchant-rina','Nasi Ayam Sambal','Ayam goreng, nasi hangat, dan sambal rumahan.',25000,'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=700&q=80',true),
('menu-goreng','merchant-rina','Nasi Goreng Spesial','Nasi goreng dengan telur dan sayuran.',22000,'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=700&q=80',true),
('menu-mie','merchant-rina','Mie Kuah','Mie kuah hangat dengan sayuran.',18000,'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=700&q=80',true),
('menu-soto','merchant-kedai','Soto Ayam','Soto ayam dan nasi.',24000,'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=700&q=80',true),
('menu-nasi','merchant-kedai','Nasi Telur','Nasi, telur, dan sambal.',16000,'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=700&q=80',true)
on conflict (id) do nothing;
