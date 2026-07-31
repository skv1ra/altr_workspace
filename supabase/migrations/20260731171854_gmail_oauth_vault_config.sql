create or replace function public.altr_gmail_oauth_config()
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'clientId', (select decrypted_secret from vault.decrypted_secrets where name = 'altr_gmail_oauth_client_id' limit 1),
    'clientSecret', (select decrypted_secret from vault.decrypted_secrets where name = 'altr_gmail_oauth_client_secret' limit 1),
    'redirectUri', (select decrypted_secret from vault.decrypted_secrets where name = 'altr_gmail_oauth_redirect_uri' limit 1),
    'encryptionKey', (select decrypted_secret from vault.decrypted_secrets where name = 'altr_gmail_token_encryption_key' limit 1)
  );
$$;

revoke all on function public.altr_gmail_oauth_config() from public, anon, authenticated;
grant execute on function public.altr_gmail_oauth_config() to service_role;

comment on function public.altr_gmail_oauth_config() is
  'Returns Gmail OAuth configuration from Supabase Vault to the service role only.';
