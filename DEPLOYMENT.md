# Deployment handoff

1. Confirm the approved Pages name is available. The requested name is `sherkty`.
2. Confirm the Cloudflare account is on the free plan and has an unused D1 database slot. Do not upgrade or buy services.
3. Create a D1 database named `sherkty`. Replace `LOCAL_REPLACE_BEFORE_DEPLOY` in `wrangler.toml` with its returned database ID.
4. Apply **both** SQL migrations to the remote database:
   ```sh
   npx wrangler d1 migrations apply ERP_DB --remote
   ```
5. Build and deploy the merged main branch:
   ```sh
   npm ci
   npm run check
   npm run build
   npx wrangler pages deploy dist --project-name sherkty --branch main
   ```
6. Ensure the production Pages project has the D1 binding named **ERP_DB** pointing at the database. Advanced-mode `_worker.js` is included in `dist` by the build.
7. Smoke-test live demo creation, separate browser sessions, CRUD persistence after refresh, protected API 401s, role restrictions, document-file roundtrip and Arabic/mobile views. Never use real employee, tax, bank or payroll data for testing.
8. Record the actual deployment and repository URLs. Only then set the GitHub repository homepage to the verified live URL. Do not manufacture a success URL.

The Pages hostname must be approved before this first deployment. There is no API secret or hardcoded admin password in this repository. Each new workspace creator becomes its owner. A specific email address does not silently bypass tenant permissions.

## Operational safeguards before real business use

- Configure and test identity verification, password recovery and any desired Google sign-in.
- Review legal payroll/tax rules, accounting controls and approval segregation.
- Test backups and restoration. Cloudflare Free currently lists a 7-day Time Travel window.
- Monitor request, read/write and storage quotas. Expired demos are cleaned when another demo is created, not by a scheduled job.
- Decide document retention and malware-scanning requirements. Files currently have a 512 KB cap and no malware scanner.
- There is no cron or email sender in this first release. Reminders are in-app and update when opened.
