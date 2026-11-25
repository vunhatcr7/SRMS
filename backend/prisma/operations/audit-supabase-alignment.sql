BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL statement_timeout = '20s';
SET LOCAL lock_timeout = '5s';
SET LOCAL row_security = off;

WITH duplicate_keys AS (
    SELECT "jobId", "candidateId", count(*) AS row_count
    FROM public."Application"
    GROUP BY "jobId", "candidateId"
    HAVING count(*) > 1
),
duplicate_applications AS (
    SELECT a.id, a."jobId", a."candidateId"
    FROM public."Application" AS a
    JOIN duplicate_keys AS d USING ("jobId", "candidateId")
),
linked_interviews AS (
    SELECT i."applicationId", a."jobId", a."candidateId", i.status
    FROM public."Interview" AS i
    JOIN duplicate_applications AS a ON a.id = i."applicationId"
)
SELECT jsonb_build_object(
    'application_rows', (SELECT count(*) FROM public."Application"),
    'duplicate_application_groups', (SELECT count(*) FROM duplicate_keys),
    'application_rows_in_duplicate_groups', (SELECT coalesce(sum(row_count), 0) FROM duplicate_keys),
    'excess_application_rows', (SELECT coalesce(sum(row_count - 1), 0) FROM duplicate_keys),
    'duplicate_groups_with_interviews', (SELECT count(DISTINCT ("jobId", "candidateId")) FROM linked_interviews),
    'duplicate_application_rows_with_interviews', (SELECT count(DISTINCT "applicationId") FROM linked_interviews),
    'interviews_linked_to_duplicate_applications', (SELECT count(*) FROM linked_interviews),
    'interview_rows', (SELECT count(*) FROM public."Interview"),
    'null_interview_statuses', (SELECT count(*) FROM public."Interview" WHERE status IS NULL),
    'null_interview_statuses_linked_to_duplicate_applications', (SELECT count(*) FROM linked_interviews WHERE status IS NULL),
    'application_unique_index', (
        SELECT pg_get_indexdef(indexrelid)
        FROM pg_index
        WHERE indexrelid = to_regclass('public."Application_jobId_candidateId_key"')
          AND indisunique AND indisvalid
    ),
    'interview_status_not_null', (
        SELECT attnotnull
        FROM pg_attribute
        WHERE attrelid = 'public."Interview"'::regclass AND attname = 'status' AND NOT attisdropped
    ),
    'interview_status_default', (
        SELECT pg_get_expr(d.adbin, d.adrelid)
        FROM pg_attrdef AS d
        JOIN pg_attribute AS a ON a.attrelid = d.adrelid AND a.attnum = d.adnum
        WHERE d.adrelid = 'public."Interview"'::regclass AND a.attname = 'status'
    ),
    'migration_history_exists', to_regclass('public._prisma_migrations') IS NOT NULL
);

ROLLBACK;
