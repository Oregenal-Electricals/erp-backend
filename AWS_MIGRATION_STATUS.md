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
