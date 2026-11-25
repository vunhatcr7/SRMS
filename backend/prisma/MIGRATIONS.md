# SRMS database migrations

Run these commands from `backend` with the project's installed Prisma CLI.
Configure the target through `DATABASE_URL` and `DIRECT_URL` without printing
either value. Use the direct connection for Prisma Migrate.

## New, empty database

```sh
npx prisma migrate deploy
npx prisma migrate status
npx prisma generate
```

`0_init` creates the schema as it existed immediately before the resume
metadata change. The original
`20261105210000_add_candidate_resume_storage_metadata` migration then adds the
four nullable resume columns and their unique storage key index. The baseline
includes the original `resumeUrl` and `resumeText` columns.

## Existing database

Verify the target and its backup before changing migration history. The
baseline contains ordinary `CREATE` statements. An existing database needs a
one-time schema check and baseline record before automated deployment resumes.

1. Inspect migration status and compare the live schema with the project
   datamodel. These commands are read-only.

   ```sh
   npx prisma migrate status
   npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script --exit-code
   ```

   The diff exits with `0` when there is no difference, `2` when it finds
   differences, and `1` on error. A missing or pending history may also make
   `migrate status` exit with `1`. Inspect the status message before proceeding.
   If the history table exists, check its records using a read-only SQL session.

   ```sql
   SELECT to_regclass('public._prisma_migrations');
   ```

   For an existing history table in the default `public` schema, read the
   checksum and completion status of each migration.

   ```sql
   SELECT migration_name, checksum, finished_at, rolled_back_at
   FROM public."_prisma_migrations"
   ORDER BY started_at;
   ```

2. Choose the procedure that matches the verified schema and history.
   `migrate resolve --applied` records a migration as applied in Prisma's history.
   It assumes that the corresponding SQL changes already exist.

   - **Pre-CV schema.** The only SQL differences must be the four nullable
     columns and the unique index in the [original CV migration](migrations/20261105210000_add_candidate_resume_storage_metadata/migration.sql).
     The CV migration must have no successful or unresolved failed entry.
     Record `0_init` if it is missing, then deploy the pending CV migration.

     ```sh
     npx prisma migrate resolve --applied 0_init
     npx prisma migrate deploy
     ```

   - **Full schema with the CV migration already recorded.** Require an empty
     diff and a successful CV history entry matching the unchanged migration.
     Record only `0_init` if it is missing, then run `migrate deploy`. Preserve
     the existing CV entry.

   - **Full schema created outside Prisma Migrate.** Require an empty diff with
     all four CV columns and the unique index present. Record each missing
     migration in order, then deploy. The following commands apply to a
     database with neither history entry.

     ```sh
     npx prisma migrate resolve --applied 0_init
     npx prisma migrate resolve --applied 20261105210000_add_candidate_resume_storage_metadata
     npx prisma migrate deploy
     ```

   Pause on unexpected differences, a checksum mismatch, unknown migration
   entries, or unresolved failures. A database whose only failed migration is
   the original CV migration from an earlier empty deployment can be recovered
   after verifying that it is still empty of application objects and that the
   failed migration applied no changes. Mark that failed attempt rolled back
   with `migrate resolve --rolled-back 20261105210000_add_candidate_resume_storage_metadata`,
   then deploy both migrations. An unresolved failure on a populated database
   needs a separate review of its partial changes.

3. Run `migrate status` and the schema diff again. Confirm that the migration
   history is current and that the diff is empty. Then run `prisma generate`
   for the application build.

## Existing schema differences

If the diff reports a missing unique index on `Application(jobId, candidateId)`
or a nullable `Interview.status`, stop before recording either migration.
These read-only checks count duplicate application keys and interviews with
missing statuses without returning recruitment records.

```sql
SELECT count(*) AS duplicate_application_keys
FROM (
    SELECT "jobId", "candidateId"
    FROM public."Application"
    GROUP BY "jobId", "candidateId"
    HAVING count(*) > 1
) AS duplicate_keys;

SELECT count(*) AS null_interview_statuses
FROM public."Interview"
WHERE status IS NULL;
```

Have the database owner review the results and test a separate,
data-preserving correction on a disposable copy. After approved schema
corrections, repeat the schema and history checks before baselining.
