# RAGE4INFO — Technical Handover & Transfer Guide

For whoever maintains the site after handover. Last updated: October 5, 2026.

---

## 1. What Is Running Where

One Amazon EC2 instance (Amazon Linux) hosts everything:

| Piece | What it is | Where |
|---|---|---|
| WordPress | The main public site (About, etc.) | Apache document root `/var/www/html/` |
| RAGE4INFO app (client) | React single-page app (this repo, `v2/client`) | `/var/www/html/apps/rage4info/` served by Apache |
| RAGE4INFO API (server) | Node/Express API (this repo, `v2/server`) | `/var/www/care-hub/v2/server`, run by PM2 as `care-hub-api`, port 3001 |
| MongoDB | Content database | local `mongod` service, db `care-hub` |

- Public app URL: `http://<ec2-host>/apps/rage4info/`
- Admin panel: `http://<ec2-host>/apps/rage4info/admin`
- Apache proxies `/apps/rage4info/api` → `localhost:3001/api` (config: `/etc/httpd/conf.d/care-hub.conf`)
- If MongoDB is ever down, the API falls back to a JSON file at `/var/www/care-hub/v2/server/data/content.json` (it also mirrors every save there as a backup).

## 2. Access You Need (transfer checklist)

- [ ] **EC2 SSH key** (`ragefund.pem`) and the instance address — SSH as `ec2-user`
- [ ] **AWS account access** (the account that owns the EC2 instance) — for reboots, snapshots, billing
- [ ] **Admin panel credentials** — set via server environment variables (see §4), not hardcoded
- [ ] **Local WordPress admin login** — the WP admin on this server (NOT a wordpress.com account): `http://<ec2-host>/wp-admin/`
- [ ] **Domain/DNS access** — wherever the final domain is managed (needed for SSL)
- [ ] **TinyMCE API key** — free account at tinymce.com (the editor in the admin panel); current key is set at build time via `VITE_TINYMCE_API_KEY`

## 3. Deploying App Updates

From a machine with the repo and `ragefund.pem` in the project root:

```bash
./deploy-to-production.sh
```

This builds client+server locally, backs up the current deployment AND MongoDB on the server, uploads, installs dependencies, restarts PM2, and reloads Apache. Rollback instructions print at the end of each run.

Useful on the server:

```bash
pm2 status                 # is the API running?
pm2 logs care-hub-api      # API logs
pm2 restart care-hub-api   # restart API (needed after .env changes)
sudo systemctl status mongod / httpd
```

## 4. Changing the Admin Password

Credentials live in `/var/www/care-hub/v2/server/.env`:

```bash
ADMIN_EMAIL=admin@rage4info.org
ADMIN_PASSWORD=the-new-strong-password
JWT_SECRET=a-long-random-string-at-least-32-chars
```

Then `pm2 restart care-hub-api`. (If these are not set, the server uses a legacy default and logs a warning — do not leave it that way after launch.) Login attempts are rate-limited to 10 per 15 minutes per IP.

## 5. Updating the WordPress Site

The WordPress site is standard WordPress, administered at `http://<ec2-host>/wp-admin/` with the **local** WP account:

- **Pages / text**: WP Admin → Pages → edit (e.g., the About page)
- **Footer social links**: depends on the theme — usually Appearance → Customize → Footer (or a footer widget/menu). Set the Instagram / LinkedIn / X / Facebook URLs there.
- **The RAGE4INFO app embed**: a page embeds `/apps/rage4info/` in an iframe; the app itself is NOT edited through WordPress — use the app's admin panel (see `ADMIN-GUIDE.md`).
- **Updates**: WP Admin → Dashboard → Updates. Take an EC2 snapshot (or at minimum a wp-content + database backup) before core/plugin updates.

## 6. Backups

- **Content (app)**: every save mirrors to `data/content.json`; deploys run `backup-mongodb.sh`; editors can also Export from the admin panel (recommended before big edits).
- **Manual MongoDB backup**: `cd /var/www/care-hub && ./backup-mongodb.sh backup`
- **Whole server**: AWS EC2 snapshots (recommended monthly and before WP updates).

## 7. Known Gaps / Before Launch

- **No HTTPS yet.** Needs the final domain pointed at the server, then `certbot` for Apache. Everything currently runs over HTTP.
- Admin login tokens last 24h; after expiry the editor must log out/in (the admin panel shows a clear message).
- The `v2/` directory is its own git repository (the outer folder's repo ignores it). Push it to a private remote (GitHub) so the code survives the laptop.
