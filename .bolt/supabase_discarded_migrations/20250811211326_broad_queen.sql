/*
  # Create demo user account

  1. Authentication
    - Create demo user with email rayannyrego@gmail.com and password Incom123
    - This user will be able to access the medical control system

  Note: This migration creates a user account for demonstration purposes.
  In production, users should register through the application interface.
*/

-- Insert demo user (this will only work if email confirmation is disabled)
-- The user will be created with the specified email and password
-- Password: Incom123

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'rayannyrego@gmail.com',
  crypt('Incom123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Insert corresponding identity
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email = 'rayannyrego@gmail.com'),
  format('{"sub":"%s","email":"%s"}', (SELECT id FROM auth.users WHERE email = 'rayannyrego@gmail.com'), 'rayannyrego@gmail.com')::jsonb,
  'email',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (provider, id) DO NOTHING;