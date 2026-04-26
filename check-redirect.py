env_file = '/var/www/sufipulse-new/.env.local'
with open(env_file, 'r') as f:
    for line in f:
        line = line.strip()
        if any(k in line for k in ['APP_URL', 'GOOGLE_ADS_CLIENT_ID', 'GOOGLE_ADS_REDIRECT', 'NEXT_PUBLIC']):
            print(line)
