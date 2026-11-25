-- Approved maintenance operation for the verified pre-baseline public schema.
BEGIN ISOLATION LEVEL READ COMMITTED;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '2min';
SET LOCAL row_security = off;

-- Block writes before checking for conflicts. The status change needs an exclusive table lock.
LOCK TABLE public."Application" IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE public."Interview" IN ACCESS EXCLUSIVE MODE;

DO $alignment$
BEGIN
    IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
        RAISE EXCEPTION 'Prisma migration history already exists. Review the database before using this repair.';
    END IF;

    IF to_regclass('public."Application_jobId_candidateId_key"') IS NOT NULL THEN
        RAISE EXCEPTION 'The expected application index name already exists. Review its definition before proceeding.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_attribute AS a
        JOIN pg_attrdef AS d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
        WHERE a.attrelid = 'public."Interview"'::regclass
          AND a.attname = 'status'
          AND a.atttypid = 'pg_catalog.text'::regtype
          AND NOT a.attisdropped
          AND NOT a.attnotnull
          AND pg_get_expr(d.adbin, d.adrelid) = '''SCHEDULED''::text'
    ) THEN
        RAISE EXCEPTION 'Interview.status does not match the expected nullable text column and default.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public."Application"
        GROUP BY "jobId", "candidateId"
        HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION 'Duplicate application keys need a reviewed resolution before schema alignment.'
            USING ERRCODE = '23505';
    END IF;

    IF EXISTS (SELECT 1 FROM public."Interview" WHERE status IS NULL) THEN
        RAISE EXCEPTION 'NULL interview statuses need verified values before schema alignment.'
            USING ERRCODE = '23502';
    END IF;
END;
$alignment$;

CREATE UNIQUE INDEX "Application_jobId_candidateId_key"
    ON public."Application" ("jobId", "candidateId");

ALTER TABLE public."Interview" ALTER COLUMN "status" SET NOT NULL;

COMMIT;
