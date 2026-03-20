Deploy guide — Docker + Nginx + GitHub Actions

1. Server prerequisites

- Ubuntu/Debian recommended (or other Linux)
- Install Docker and docker-compose (or docker-compose plugin)
- Ensure you can SSH into the server with a deploy user that can run Docker (either via sudo or in docker group)

2. Add repository on the server

- Choose a directory, e.g. `/srv/kartfreedom` and clone the repo there:

  git clone git@github.com:<your-org>/<your-repo>.git /srv/kartfreedom

3. Place TLS certs (optional)

- If you plan to enable TLS, place certificates under `/srv/kartfreedom/certs/` and update `nginx/nginx.conf` accordingly.

4. GitHub Actions secrets

- `SSH_PRIVATE_KEY` — private key for deploy user (no passphrase or use ssh-agent action)
- `SSH_USER` — username on server
- `SSH_HOST` — server host/IP
- `APP_DIR` — path on server where repository lives (e.g. `/srv/kartfreedom`)

5. First-time manual deploy (recommended)

- On server:

  git clone git@github.com:<your-org>/<your-repo>.git /srv/kartfreedom
  cd /srv/kartfreedom
  docker compose up -d --build

6. Automated deploy

- Push to `main` branch. The workflow will SSH into the server, pull/reclone the repo and run `docker-compose up -d --build`.

Notes & troubleshooting

- Ensure the deploy user has permissions to run Docker and access `/srv/kartfreedom`.
- The workflow expects `docker-compose` to be available on the server. If you use `docker compose` CLI plugin, edit the workflow command accordingly.
- You can customize `nginx/nginx.conf` (server_name, TLS, caching) as needed.
