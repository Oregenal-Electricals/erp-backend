# AWS Migration Status

Read this first in any new session about the AWS migration - it has everything
needed to pick up exactly where the last session left off.

## Goal
Move the full stack (frontend, backend, database) from Render/Vercel/Neon to
AWS, with two environments (dev, staging), connected to a GoDaddy domain, with
the guarantee that a deploy never touches/deletes data.

## Account
- AWS Account ID: 166468354805
- Region: ap-south-1 (Mumbai) - always use this region for every resource
- IAM admin user: sidartha-admin (root login not used day-to-day)
- AWS CLI is configured locally (`aws sts get-caller-identity` confirms)

## Completed

### 1. Database - AWS RDS PostgreSQL (DONE, verified)
Two separate `db.t3.micro` instances, ~$21.60/month each:
- `oregenal-dev` - endpoint: `oregenal-dev.cfk4yqe0a3yo.ap-south-1.rds.amazonaws.com:5432`, db name `erp_development`
- `oregenal-staging` - endpoint: `oregenal-staging.cfk4yqe0a3yo.ap-south-1.rds.amazonaws.com:5432`, db name `erp_staging`
- Master username on both: `postgres`
- Passwords: saved locally when created (not repeated here) - IMPORTANT: both
  passwords contain a literal `#` character, which MUST be URL-encoded as
  `%23` in any connection string (Prisma's URL parser treats a raw `#` as a
  URL fragment delimiter and silently truncates/corrupts the connection
  string otherwise - psql tolerates it, Prisma does not).
- Security groups: `oregenal-dev-sg` (sg-078f68ffeb38acdfa) and
  `oregenal-staging-sg` (its own SG) - both currently allow inbound 5432 from
  a) the developer's home IP (for psql/local testing) and b) the ECS
  service's security group (sg-082197bd1fc409e3a for dev) so the deployed
  backend can actually reach the database. **If a new ECS service or a new
  developer IP needs DB access, add an inbound rule on the RDS security
  group for it - this is the #1 thing that silently breaks deployments.**

**Data migration**: fully done and row-count verified table-by-table (boms,
bom_items, raw_materials, users, customers, vendors, purchase_orders,
sales_orders, work_orders - all exact matches between Neon and RDS). Neon
dev was already empty of real BOM data (confirmed both sides show 0), so
that "empty" migration is correct, not a bug. Neon staging had the real test
data (61 BOMs, 1125 bom_items, etc.) and every count matched exactly.

Migration method used (repeatable if ever needed again):
```bash
# Local pg_dump/pg_restore must be v16+ to match Neon's server version -
# installed via `brew install postgresql@17`, called by full path since it's
# keg-only (not symlinked over the existing older postgresql@14):
/opt/homebrew/opt/postgresql@17/bin/pg_dump "<neon-connection-string>" -F c -f backup.dump
/opt/homebrew/opt/postgresql@17/bin/pg_restore -d "<rds-connection-string>" -v backup.dump
```
The restore reports ~190 "errors" every time - all of them are Neon-specific
role references (`neondb_owner`, `neon_superuser`) that don't exist on RDS.
These are harmless; verify with
`grep "error: could not execute query" log | grep -v "neondb_owner\|neon_superuser"`
- if that returns nothing, the restore is clean.

### 2. Backend - Docker + ECR + ECS Express Mode (DONE for dev, verified working)

**AWS App Runner is deprecated** (stopped accepting new customers April 30,
2026) - AWS's replacement is **ECS Express Mode**, which requires a real
Docker image pushed to ECR (no more direct source-code/buildpack deploys
like Render or the old App Runner did). This is why the setup below exists.

**Dockerfile** (repo root of erp-backend, already committed): multi-stage
build - builder stage installs full deps + runs `prisma generate` +
`nest build`, production stage reinstalls only prod deps and copies in the
compiled `dist/`, the generated Prisma client, and the schema. Entry point is
`node dist/src/main.js` - **not** `dist/main.js` as the (unused) `start:prod`
npm script assumes; verified directly against real build output.

**Critical gotcha - CPU architecture**: Docker on an Apple Silicon Mac builds
ARM64 images by default. ECS Fargate expects X86_64 (amd64) unless the task
definition is explicitly set otherwise, and ECS's automatic "architecture
override" turned out to be unreliable in practice (it announced an override
to ARM64 after a failed deploy, but the next deploy attempt still tried to
pull `linux/amd64` and failed identically). **The fix that actually worked**:
always build explicitly for the target platform:
```bash
docker build --platform linux/amd64 -t erp-backend:amd64 .
```
Do this for every image pushed to ECR going forward.

**ECR repositories** (both in ap-south-1):
- `166468354805.dkr.ecr.ap-south-1.amazonaws.com/oregenal-backend-dev`
- `166468354805.dkr.ecr.ap-south-1.amazonaws.com/oregenal-backend-staging`

Push flow:
```bash
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 166468354805.dkr.ecr.ap-south-1.amazonaws.com
docker build --platform linux/amd64 -t erp-backend:amd64 .
docker tag erp-backend:amd64 166468354805.dkr.ecr.ap-south-1.amazonaws.com/oregenal-backend-dev:latest
docker push 166468354805.dkr.ecr.ap-south-1.amazonaws.com/oregenal-backend-dev:latest
# repeat tag+push for -staging if updating both
```

**ECS Express Mode service - dev** (LIVE and verified working):
- Service name: `oregenal-backend-dev`, cluster: `default`
- Application URL: `https://or-c3bff864ef5c4c41a76b3e3218c00236.ecs.ap-south-1.on.aws`
- Confirmed via `curl .../api/v1/health` → `{"status":"ok", "database":{"status":"ok"}...}`
- Container port 3001, health check path `/api/v1/health`
- Environment variables set: `PORT=3001`, `NODE_ENV=production`,
  `DATABASE_URL` (with `%23`-encoded password, pointing at oregenal-dev RDS),
  `JWT_SECRET` (same value the app already used on Render - note the value
  itself has an old copy-paste accident baked in, literally starting with
  "JWT_SECRET=" as PART of the secret string; left as-is since changing it
  would invalidate every existing login session - not fixed, just noted)
- Compute: 1 vCPU / 2GB, autoscaling 1-20 tasks on 60% CPU target (all
  Express Mode defaults, untouched)

To redeploy after pushing a new image:
```bash
aws ecs update-service --cluster default --service oregenal-backend-dev --force-new-deployment --region ap-south-1
```
Check rollout status:
```bash
aws ecs describe-services --cluster default --services oregenal-backend-dev --region ap-south-1 --query "services[0].{runningCount:runningCount,desiredCount:desiredCount,deployments:deployments[*].{status:status,rolloutState:rolloutState,failedTasks:failedTasks}}"
```
If a task fails, find the reason with:
```bash
aws ecs list-tasks --cluster default --service-name oregenal-backend-dev --desired-status STOPPED --region ap-south-1 --query "taskArns[0]" --output text
aws ecs describe-tasks --cluster default --tasks <arn-from-above> --region ap-south-1 --query "tasks[0].stoppedReason"
```
Application logs (CloudWatch): log group name follows the pattern
`/aws/ecs/default/oregenal-backend-dev-XXXX` (the suffix is assigned by AWS
per service, find it with `aws logs describe-log-groups --region ap-south-1`).
```bash
aws logs tail "<log-group-name>" --region ap-south-1 --since 10m
```

### 3. Backend - ECS Express Mode service - staging (DONE, verified working)

Same setup as dev, pointing at the `oregenal-backend-staging` ECR repo and
the `oregenal-staging` RDS database:
- Service name: `oregenal-backend-staging`, cluster: `default`
- Application URL: `https://or-ce4f5a84b93a4c84af1b202632b8a14b.ecs.ap-south-1.on.aws`
- Confirmed via `curl .../api/v1/health` → `{"status":"ok", "database":{"status":"ok"}...}`
- Same env vars as dev but pointing at staging's own DATABASE_URL (its `#`
  password also URL-encoded to `%23`)
- Staging's ECS service security group: `sg-041469bca05cdfb2b`
  (name: `default-oregenal-backend-staging-vpc-05b969e1a2f4c1fdb`) - this had
  to be found via the task's network interface (`aws ecs describe-tasks`
  → `attachments[0].details` → `networkInterfaceId`, then
  `aws ec2 describe-network-interfaces` - though the ENI gets torn down fast
  once a task stops, so if that lookup 404s, search security groups by name
  instead: `aws ec2 describe-security-groups --query "SecurityGroups[?contains(GroupName, '<service-name>')]"`)
  - added as an inbound rule on `oregenal-staging-sg` (sg-0181127670334fa4d)
    for port 5432, exact same "Can't reach database server" failure as dev
    hit first, same fix.
- Getting the Application URL via CLI is unreliable right after creation
  (service-level `networkConfiguration.securityGroups` can show empty, and
  there's no ACM cert step to reverse-engineer it from) - easiest to just
  read "Application URL" directly off the service's console overview page.

### 4. Frontend - AWS Amplify (DONE for both environments, verified working)

**Key thing to understand**: Next.js reads `NEXT_PUBLIC_API_URL` at BUILD
TIME, not runtime - it gets compiled into the app. That means dev and
staging genuinely need two separate deployments (unlike the backend, which
can share one image across environments via runtime env vars) - one build
per backend it needs to point at.

A `dev` branch was created on `erp-frontend` (did not exist before - the
repo previously only had `main`, which had been serving as the de facto
staging branch all along). **Do not confuse this with the unused `dev`
branch that got accidentally created on `erp-backend` too** - that one is
harmless but not used for anything; backend environments are switched via
separate ECR images/ECS services, not branches.

- **erp-frontend-dev** (Amplify app, tracks the `dev` branch): live at
  `https://dev.d1u2wcgsqf829g.amplifyapp.com/` - `NEXT_PUBLIC_API_URL` set
  to the dev ECS backend URL + `/api/v1`. Confirmed loading the login page
  correctly in browser.
- **erp-frontend-staging** (Amplify app, tracks the `main` branch): live at
  `https://main.d1jdq2r1dclqd0.amplifyapp.com/` - `NEXT_PUBLIC_API_URL` set
  to the staging ECS backend URL + `/api/v1`. Confirmed loading the login
  page correctly in browser.

Both auto-deploy on push to their respective branch, same as Vercel did -
push to `dev` updates the dev Amplify app, push to `main` updates staging.

## Not started yet

1. **GoDaddy domain connection** - keep DNS management at GoDaddy, just add
   records (CNAME/A) pointing subdomains at the AWS resources once ready.
   Not started. Will need one subdomain per environment per layer (e.g.
   app-dev / app / api-dev / api), pointing at the Amplify apps' and ECS
   Application URLs' actual hostnames respectively.
2. **Cleanup**: local test Docker images/containers (`erp-backend:test`,
   `erp-backend:amd64`) are just local artifacts, safe to remove any time;
   nothing in AWS depends on them once pushed to ECR. The unused `dev`
   branch on `erp-backend` can also be deleted whenever convenient - it was
   an accidental creation, nothing depends on it.

## Key lessons if picking this up fresh
- Always build Docker images with `--platform linux/amd64` on this Apple
  Silicon Mac before pushing to ECR - the default build silently produces an
  incompatible image that fails at deploy time, not build time.
- Any password with a `#` in it needs `%23` in a Prisma/connection-string
  context, even though `psql` alone tolerates the raw character.
- A new ECS service can build and pull its image fine but still crash on
  startup with "Can't reach database server" if its security group isn't
  explicitly allowed into the RDS security group's inbound rules - this is
  a separate step from creating the RDS instance itself.
- AWS App Runner is gone for new setups; ECS Express Mode is the direct
  replacement and requires a container image workflow, not source-code
  auto-build.

## Update - dev database refreshed from staging (2026-08-21)

Dev's RDS database was completely wiped and replaced with a fresh copy of
staging's current data (staging has all the real test data; dev was mostly
empty). Row counts verified matching exactly across all key tables after
restore (users, boms, bom_items, products, raw_materials, customers,
vendors, purchase_orders, sales_orders, work_orders - all identical).

Method: same pg_dump/pg_restore approach as the original Neon migration, but
RDS-to-RDS this time (dev's DB dropped and recreated first, since it can't
be dropped while ECS has an active connection - had to
`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '...'`
first). This restore came back with 0 errors (cleaner than the original
Neon migration, since there were no more Neon-specific role references to
trip over).

**New gotcha**: RDS is running PostgreSQL 18, which needed yet another local
client upgrade (`brew install postgresql@18`, called by full path same as
the v17 one) - pg_dump/pg_restore refuse to run against a newer major server
version than themselves. If this happens again, check the actual server
version in the error message and install a matching or newer local version.

Dev's ECS backend confirmed still healthy after the database swap (Prisma
reconnects transparently, no redeploy needed) - `curl .../api/v1/health`
still returns `{"status":"ok", "database":{"status":"ok"}...}`.

**Code sync**: `erp-frontend`'s `dev` and `main` branches are currently
identical (dev was branched from main today and nothing has been committed
to either since) - no drift to worry about yet. `erp-backend` only has one
branch (`main`) - environments are switched via separate ECR images/ECS
services, not branches, so there's no backend code-sync question at all.
If `main` gets ahead of `dev` on the frontend in a future session, that's
when an actual merge/rebase would be needed - not yet.

## Update - Custom domain live, CORS fixed, two critical deploy gotchas found and fixed (2026-08-21)

### Custom domain (dev) - DONE and verified working

`dev.oregenalelectrical.com` is live, serving the dev frontend, and login
against the dev backend fully works end-to-end. Root domain and `www` were
NOT touched - this business's real live site keeps working exactly as
before. Chosen approach: "Manual configuration" (not Route 53), which keeps
GoDaddy in control of all existing DNS. Two CNAME records were needed at
GoDaddy for this one subdomain (both required - easy to add only one and
get confused when things don't work):
1. SSL validation CNAME (proves domain ownership so Amplify can issue a
   certificate) - shown under the domain's "Domain configuration" screen.
2. Routing CNAME (`dev` → `dev.d1u2wcgsqf829g.amplifyapp.com`) - this is
   what actually makes the subdomain resolve to the app; it does NOT show
   up automatically after step 1, has to be added separately once the
   subdomain mapping is saved in Amplify's "Add new" subdomain flow.

Next subdomain requested: `essenpro.oregenalelectrical.com` for staging -
not started yet, same two-CNAME process, targeting the staging Amplify
app's default URL instead.

### Two critical ECS deploy gotchas found and fixed - apply to EVERY future backend deploy

**1. Docker build cache can silently produce the wrong architecture even
with `--platform linux/amd64` specified.** If a previous build on this
machine produced an ARM64 image, Docker may reuse those cached layers
across a differently-platformed build, producing a broken image that LOOKS
like it built for amd64 but isn't. Always verify after building:
```bash
docker inspect erp-backend:amd64 --format '{{.Architecture}}'
```
should print `amd64`. If unsure, or after any doubt, force a truly clean
build:
```bash
docker build --no-cache --platform linux/amd64 -t erp-backend:amd64 .
```

**2. ECS Express Mode, when the image was originally selected by "Image
digest" (the AWS-recommended default) rather than by tag, pins the task
definition to that EXACT digest forever - pushing a new image to the
`:latest` tag and running `--force-new-deployment` does NOT pick up the new
image, because the task definition never referenced the tag in the first
place, only that one specific digest.** This cost real time today - CORS
and other backend code fixes were pushed and "successfully redeployed"
multiple times while the running containers were silently still serving
the very first image ever pushed.

**The fix, done once for both dev and staging**: re-registered a new task
definition revision with the container image changed from the pinned
digest to the floating tag (`...oregenal-backend-dev:latest` /
`...oregenal-backend-staging:latest`), then pointed the service at that new
revision:
```bash
aws ecs describe-task-definition --task-definition default-oregenal-backend-dev:N --region ap-south-1 --query "taskDefinition" > /tmp/taskdef.json
# edit containerDefinitions[0].image to end in :latest instead of @sha256:..., strip the read-only fields (taskDefinitionArn, revision, status, requiresAttributes, compatibilities, registeredAt, registeredBy)
aws ecs register-task-definition --cli-input-json file:///tmp/taskdef-new.json --region ap-south-1
aws ecs update-service --cluster default --service oregenal-backend-dev --task-definition default-oregenal-backend-dev:<new-revision> --force-new-deployment --region ap-south-1
```
Both dev and staging now correctly track `:latest`, so a normal
`docker push ... :latest` + `aws ecs update-service --force-new-deployment`
is sufficient for every future deploy - this was a one-time fix.

**How to verify a deploy actually picked up a new image, going forward**:
don't just check `rolloutState: COMPLETED` - that was true even when
serving the stale image. Instead confirm behavior that only the NEW code
would produce (e.g. the CORS header test used here), or check task uptime
via the health endpoint immediately after a deploy to confirm it's a freshly
started container, not one that's been running since before the fix.

### CORS - fixed in code, applies everywhere going forward

`erp-backend/src/main.ts` CORS origin allowlist now includes
`/\.amplifyapp\.com$/` and `/\.oregenalelectrical\.com$/` regex patterns
(alongside the existing `frontendUrl`, `localhost:3000`, and `/\.vercel\.app$/`),
so any Amplify default URL or any subdomain of the real domain will work
automatically without needing a code change for each new subdomain added
later (e.g. `essenpro.oregenalelectrical.com` for staging will already be
covered by this same regex - no separate CORS fix needed for it).

## Update - staging custom domain live, migration essentially complete (2026-08-21)

`essenpro.oregenalelectrical.com` is now live (staging Amplify app, `main`
branch), same setup as dev - same two CNAME records at GoDaddy, root domain
and `www` untouched. Login confirmed working end-to-end. No CORS fix needed
for this one specifically, since the regex added earlier
(`/\.oregenalelectrical\.com$/`) already covers any subdomain of the real
domain.

## Current full picture

| Layer | Dev | Staging |
|---|---|---|
| Database | RDS `oregenal-dev` | RDS `oregenal-staging` |
| Backend | ECS `oregenal-backend-dev` | ECS `oregenal-backend-staging` |
| Frontend | Amplify `erp-frontend-dev` | Amplify `erp-frontend-staging` |
| Custom domain | dev.oregenalelectrical.com | essenpro.oregenalelectrical.com |

All four layers, both environments, fully verified working end-to-end
including real login. The original goal from the start of this migration -
full stack on AWS, two environments, connected to the GoDaddy domain,
without ever touching the business's live main site - is complete.

## Still worth doing at some point (not urgent)

- Delete the now-unused local test images/containers on this Mac
  (`erp-backend:test`, `erp-backend:amd64`) - harmless to leave, but easy
  cleanup whenever convenient.
- Consider whether Render/Vercel/Neon (the original hosting) should be
  decommissioned now that AWS is fully verified working, or kept running in
  parallel for a while as a safety net before fully cutting over.
