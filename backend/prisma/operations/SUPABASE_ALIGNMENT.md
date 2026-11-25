# Align and baseline an existing SRMS Supabase database

Use this procedure only after explicit approval to write to the identified
Supabase database. It covers the `public` schema with the CV metadata already
present, the two differences below, and no Prisma migration history. Use
Prisma CLI 6.19.3 from `backend`.

## 1. Check the target and conflicts

Configure the direct or session-mode connection for `psql` and `pg_dump` in a
local libpq service named `srms_shared_direct`. Configure Prisma through
`DATABASE_URL` and `DIRECT_URL`. Verify that all three connection settings
point to the intended project, database and `public` schema. Supply credentials
through the approved local secret store and keep them out of command arguments,
logs and Git. The maintenance role needs visibility of all application rows
and privileges for the two table changes. The audit fails if row-level
policies would hide rows.

```sh
psql -X --set=ON_ERROR_STOP=1 --dbname="service=srms_shared_direct" --file=prisma/operations/audit-supabase-alignment.sql
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --exit-code
```

The aggregate audit runs in a read-only transaction. Proceed to planning the
repair only if the diff exits with code `2` and reports exactly these changes.

- Add the valid, non-partial unique index
  `Application_jobId_candidateId_key` on `Application("jobId", "candidateId")`.
- Make `Interview.status` non-null while preserving its `TEXT` type and
  `'SCHEDULED'` default.

The audit must report zero duplicate key groups, zero NULL statuses, and no
`_prisma_migrations` table. Investigate any different result before continuing.

- **Duplicate applications.** Review the applications and their interview
  references in a restricted session. Correct a job or candidate reference
  only when the original submission or an authoritative record establishes the
  intended reference. If two records genuinely share the same key, keeping
  both as active rows conflicts with the unique index. A separate decision is
  required to preserve their IDs and interview links, including any approved
  archival design. The repair script performs no consolidation.
- **NULL interview statuses.** Review authoritative events or records that
  establish whether each interview was scheduled, completed or cancelled.
  Scheduled dates, application stages and the column default alone cannot
  establish the status. Unresolved values block the repair.

## 2. Schedule maintenance and verify recovery

Pause app writes, background jobs and automated migration jobs. Keep them
paused until verification or rollback is complete. Confirm the backup and
restore options with the database owner before the maintenance window.

Take a fresh logical backup of the application schema and its data during the
write pause. Choose a restricted backup location outside the repository.
Use PostgreSQL client tools compatible with the server version.

```sh
pg_dump --dbname="service=srms_shared_direct" --format=custom --schema=public --file="/secure/path/srms-before-alignment.dump"
pg_restore --list "/secure/path/srms-before-alignment.dump" > "/secure/path/srms-restore.list"
```

`srms_disposable` must point to a separate empty recovery or rehearsal
database. If it already has an empty `public` schema, prefix the single
`SCHEMA - public` entry in the restore list with a semicolon. Keep its table
and data entries.

```sh
pg_restore --single-transaction --exit-on-error --no-owner --no-acl --use-list="/secure/path/srms-restore.list" --dbname="service=srms_disposable" "/secure/path/srms-before-alignment.dump"
```

Verify the restored tables, representative rows and CV metadata.
The logical archive covers `public`. Use the approved Supabase backup
procedure for managed schemas and separate storage backup for CV binaries
where applicable. Re-run the audit and schema diff after the write pause.

## 3. Apply the two approved schema changes

```sh
psql -X --set=ON_ERROR_STOP=1 --dbname="service=srms_shared_direct" --file=prisma/operations/align-supabase-schema.sql
```

The script rechecks conflicts after blocking writes to `Application` and
locking `Interview` exclusively. The two DDL statements commit together.
The lock timeout is five seconds and each statement has a two-minute limit.
A failure leaves the transaction uncommitted. Recheck the cause and table
state before retrying. Existing row values, identifiers and relationships are
preserved because the script runs no row writes.

## 4. Verify and baseline

Re-run the audit. Verify the new index definition, the status `NOT NULL`
constraint, the unchanged default and unchanged application and interview
counts. Compare the full Prisma schema again. This time require exit code
`0` and an empty diff. Confirm the CV columns and index are present, and
compare the data with the pre-change snapshot before recording history.

```sh
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --exit-code
```

Only after all checks pass, record the two existing migrations in order.
These commands write to `_prisma_migrations`.

```sh
npx prisma migrate resolve --applied 0_init
npx prisma migrate resolve --applied 20261105210000_add_candidate_resume_storage_metadata
npx prisma migrate status
npx prisma migrate deploy
npx prisma migrate deploy
```

Confirm both entries have the checked-in migration checksums and a successful
completion. Both deploy runs should report no pending migrations. Repeat the
schema and data checks before resuming writes. If only the first resolve
succeeded, verify its entry and the live schema before deciding whether to
record the still-missing CV entry.

## Rollback

If the SQL script errors before commit, close the failed session or roll back
the transaction. Re-run the read-only audit to confirm both changes are absent.

After a successful repair and before either baseline entry has been recorded,
a separately approved rollback can reverse the two DDL changes during the
same write pause. Confirm the exact index and constraint state first and
verify that `_prisma_migrations` is still absent.

```sql
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '2min';
DROP INDEX public."Application_jobId_candidateId_key";
ALTER TABLE public."Interview" ALTER COLUMN "status" DROP NOT NULL;
COMMIT;
```

Run the audit and diff after rollback. Once either migration is recorded,
stop for an approved recovery plan that keeps schema and history consistent.
Prefer keeping the verified aligned schema and completing the missing
history entry if the failure was limited to baselining. If reversal is
required, keep writes paused, restore the pre-change backup to a separate
target and verify its schema, history and records before approving cutover.
A restore or cutover after writes resume requires a plan for preserving
changes made since the backup.
