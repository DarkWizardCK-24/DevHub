-- =============================================================================
-- DevHub — create (or repair) the first admin account
--
-- Run this ONCE in the Supabase SQL editor, AFTER 01_schema.sql.
-- Safe to re-run: if the user already exists it resets the password, confirms
-- the email, and makes sure the profile is an active admin.
--
-- Why this is needed
--   * Public sign-up is disabled, and the "create user" screen in the app needs
--     an existing admin, so the very first admin has to be created with SQL.
--   * Login goes through Supabase Auth, so the user must exist in auth.users
--     (with a bcrypt password and an email identity). A row in public.profiles
--     alone can never sign in.
--   * The on_auth_user_created trigger only makes the profile ACTIVE when
--     raw_app_meta_data.created_by_admin = true, so we set that here.
--
-- Edit the three values below, then run the whole script.
-- =============================================================================
do $$
declare
  v_email    text := 'admin@gmail.com';
  v_password text := '123456';          -- change this after your first login
  v_name     text := 'Admin';
  uid        uuid;
begin
  select id into uid from auth.users where lower(email) = lower(v_email);

  if uid is null then
    uid := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      -- GoTrue expects these token columns to be '' (not NULL), otherwise login errors out
      confirmation_token, recovery_token, email_change, email_change_token_new
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      v_email, crypt(v_password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"],"created_by_admin":true}'::jsonb,
      jsonb_build_object('full_name', v_name),
      now(), now(),
      '', '', '', ''
    );
  else
    -- the user exists: fix whatever was wrong with it
    update auth.users
       set encrypted_password = crypt(v_password, gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           raw_app_meta_data  = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"created_by_admin":true}'::jsonb,
           banned_until       = null,
           updated_at         = now()
     where id = uid;
  end if;

  -- Supabase email login requires an identity row for the user
  if not exists (select 1 from auth.identities where user_id = uid and provider = 'email') then
    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), uid, uid::text,
      jsonb_build_object('sub', uid::text, 'email', v_email, 'email_verified', true),
      'email', now(), now(), now()
    );
  end if;

  -- The trigger normally creates the profile; this also covers a user that had none.
  insert into public.profiles (id, email, full_name, role, is_active)
  values (uid, v_email, v_name, 'admin', true)
  on conflict (id) do update
     set role = 'admin', is_active = true;
end $$;

-- Check the result: expect confirmed = true, role = admin, is_active = true
select u.email,
       u.email_confirmed_at is not null as confirmed,
       p.role,
       p.is_active
from auth.users u
join public.profiles p on p.id = u.id
where lower(u.email) = 'admin@gmail.com';
