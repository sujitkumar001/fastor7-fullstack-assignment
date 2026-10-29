BEGIN;

CREATE TABLE IF NOT EXISTS employees (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT employees_name_not_blank
        CHECK (LENGTH(TRIM(name)) > 0),

    CONSTRAINT employees_email_not_blank
        CHECK (LENGTH(TRIM(email)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS employees_email_unique
    ON employees (LOWER(email));

CREATE TABLE IF NOT EXISTS enquiries (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    course VARCHAR(150) NOT NULL,
    message TEXT,
    claimed_by BIGINT REFERENCES employees(id) ON DELETE RESTRICT,
    claimed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT enquiries_student_name_not_blank
        CHECK (LENGTH(TRIM(student_name)) > 0),

    CONSTRAINT enquiries_email_not_blank
        CHECK (LENGTH(TRIM(email)) > 0),

    CONSTRAINT enquiries_phone_not_blank
        CHECK (LENGTH(TRIM(phone)) > 0),

    CONSTRAINT enquiries_course_not_blank
        CHECK (LENGTH(TRIM(course)) > 0),

    CONSTRAINT enquiries_claim_consistency
        CHECK (
            (claimed_by IS NULL AND claimed_at IS NULL)
            OR
            (claimed_by IS NOT NULL AND claimed_at IS NOT NULL)
        )
);

CREATE INDEX IF NOT EXISTS enquiries_unclaimed_idx
    ON enquiries (created_at DESC, id DESC)
    WHERE claimed_by IS NULL;

CREATE INDEX IF NOT EXISTS enquiries_claimed_by_idx
    ON enquiries (claimed_by, claimed_at DESC)
    WHERE claimed_by IS NOT NULL;

COMMIT;
