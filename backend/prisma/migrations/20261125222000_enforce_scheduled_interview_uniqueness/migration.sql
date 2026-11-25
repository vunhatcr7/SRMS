DO $migration$
BEGIN
    PERFORM set_config('lock_timeout', '5s', true);
    PERFORM set_config('row_security', 'off', true);
    LOCK TABLE "Interview" IN SHARE ROW EXCLUSIVE MODE;

    IF EXISTS (
        SELECT 1
        FROM "Interview"
        WHERE "status" = 'SCHEDULED'
        GROUP BY "applicationId", "scheduledAt"
        HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION 'Duplicate scheduled interviews must be reviewed before applying this migration.';
    END IF;

    CREATE UNIQUE INDEX "Interview_scheduled_slot_key"
        ON "Interview" ("applicationId", "scheduledAt")
        WHERE "status" = 'SCHEDULED';
END;
$migration$;
