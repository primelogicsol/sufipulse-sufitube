env_file = '/var/www/sufipulse-new/.env.local'
new_vars = [
    'GOOGLE_ADS_CLIENT_ID=371996394544-q1cc1pglsl64ah0oj3rtf7u92t1nhhje.apps.googleusercontent.com',
    'GOOGLE_ADS_CLIENT_SECRET=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',
    'GOOGLE_ADS_LOGIN_CUSTOMER_ID=2014066444',
    'GOOGLE_ADS_CREATE_MODE=draft',
    'GOOGLE_ADS_REDIRECT_URI=https://sufipulse.com/api/google-ads/oauth/callback',
]
with open(env_file, 'r') as f:
    lines = [l for l in f.readlines() if not l.startswith('GOOGLE_ADS')]
lines += [v + '\n' for v in new_vars]
with open(env_file, 'w') as f:
    f.writelines(lines)
print('Done. Relevant vars:')
for l in lines:
    if l.startswith('GOOGLE_ADS') or 'APP_URL' in l:
        print(l.strip())
