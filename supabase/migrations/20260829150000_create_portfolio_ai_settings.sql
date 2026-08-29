create table if not exists public.portfolio_ai_settings (
  id text primary key,
  provider text not null default 'google-gemini',
  model text not null,
  encrypted_api_key text not null,
  encryption_iv text not null,
  encryption_salt text not null,
  key_last_four text not null,
  verified_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.portfolio_ai_settings enable row level security;

revoke all on table public.portfolio_ai_settings from anon, authenticated;

comment on table public.portfolio_ai_settings is
  'Server-only encrypted AI provider settings for the portfolio project analyzer.';
