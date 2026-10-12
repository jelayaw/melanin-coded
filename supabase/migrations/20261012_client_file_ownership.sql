
-- Melanin Coded
-- Migration: Client File Ownership Security
-- Purpose: Prevent clients from registering project files
-- that they did not personally upload to Supabase Storage.

BEGIN;

-- 1. Check whether the signed-in client owns
-- the Storage object referenced by a project file.

CREATE OR REPLACE FUNCTION
public.client_owns_project_storage_file(
    expected_project_id uuid,
    expected_storage_path text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
    SELECT
        auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1
            FROM storage.objects AS obj
            WHERE obj.bucket_id = 'project-files'
              AND obj.name = expected_storage_path
              AND obj.name LIKE expected_project_id::text || '/%'
              AND obj.owner_id = auth.uid()::text
        );
$function$;

-- 2. Restrict who can call the helper.

REVOKE ALL ON FUNCTION
public.client_owns_project_storage_file(uuid, text)
FROM PUBLIC;

REVOKE ALL ON FUNCTION
public.client_owns_project_storage_file(uuid, text)
FROM anon;

GRANT EXECUTE ON FUNCTION
public.client_owns_project_storage_file(uuid, text)
TO authenticated;

-- 3. Require ownership when clients insert file records.

ALTER POLICY "Clients can add files to assigned projects"
ON public.project_files
WITH CHECK (
    uploaded_by = auth.uid()
    AND NOT public.is_admin()
    AND EXISTS (
        SELECT 1
        FROM public.project_members
        WHERE project_members.project_id = project_files.project_id
          AND project_members.user_id = auth.uid()
    )
    AND storage_path LIKE project_id::text || '/%'
    AND category IN (
        'Brand Assets',
        'Client Content',
        'Documents'
    )
    AND public.client_owns_project_storage_file(
        project_id,
        storage_path
    )
);

COMMIT;
