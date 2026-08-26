create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'business_owner' check (role in ('business_owner','admin')),
  created_at timestamptz not null default now()
);

create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete set null,
  name text not null,
  slug text unique not null,
  category text not null,
  description text,
  website text,
  phone text,
  email text,
  country text not null,
  country_code text,
  region text,
  city text not null,
  postal_code text,
  address_line1 text,
  address_line2 text,
  latitude numeric,
  longitude numeric,
  service_area text,
  hours jsonb not null default '{}'::jsonb,
  services text[] not null default '{}',
  rating numeric(2,1),
  review_count integer not null default 0,
  verification_status text not null default 'unverified' check (verification_status in ('unverified','pending','verified','rejected')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists businesses_market_idx on businesses(country, region, city, category);
create index if not exists businesses_owner_idx on businesses(owner_id);

create table if not exists bids (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  amount_cents bigint not null check (amount_cents > 0),
  currency text not null default 'usd',
  country text not null,
  region text,
  city text not null,
  category text not null,
  stripe_payment_intent_id text,
  status text not null default 'pending' check (status in ('pending','active','outbid','cancelled','refunded','failed')),
  placed_at timestamptz not null default now(),
  expires_at timestamptz
);

create index if not exists bids_market_rank_idx on bids(country, region, city, category, status, amount_cents desc);
create index if not exists bids_business_idx on bids(business_id, placed_at desc);

create table if not exists business_claims (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  claimant_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table businesses enable row level security;
alter table bids enable row level security;
alter table business_claims enable row level security;
alter table audit_logs enable row level security;

create policy "Public can view active businesses" on businesses for select using (is_active = true);
create policy "Owners can insert businesses" on businesses for insert with check (auth.uid() = owner_id);
create policy "Owners can update own businesses" on businesses for update using (auth.uid() = owner_id);
create policy "Public can view active bids" on bids for select using (status in ('active','outbid'));
create policy "Owners can view own bids" on bids for select using (business_id in (select id from businesses where owner_id = auth.uid()));
create policy "Owners can create claims" on business_claims for insert with check (auth.uid() = claimant_id);
create policy "Owners can view own claims" on business_claims for select using (auth.uid() = claimant_id);
