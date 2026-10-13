DO $$
DECLARE
  bottle_type_kind "char";
  bottle_type_schema text;
  bottle_type_name text;
  constraint_name text;
  variant text;
BEGIN
  SELECT type.typtype, type_schema.nspname, type.typname
    INTO bottle_type_kind, bottle_type_schema, bottle_type_name
  FROM pg_attribute AS column_info
  JOIN pg_type AS type ON type.oid = column_info.atttypid
  JOIN pg_namespace AS type_schema ON type_schema.oid = type.typnamespace
  WHERE column_info.attrelid = 'public.bottles'::regclass
    AND column_info.attname = 'bottle_type'
    AND NOT column_info.attisdropped;

  IF bottle_type_kind IS NULL THEN
    RAISE EXCEPTION 'Column public.bottles.bottle_type was not found';
  END IF;

  IF bottle_type_kind = 'e' THEN
    FOREACH variant IN ARRAY ARRAY['anchor', 'crystal', 'jade', 'lantern'] LOOP
      EXECUTE format(
        'ALTER TYPE %I.%I ADD VALUE IF NOT EXISTS %L',
        bottle_type_schema,
        bottle_type_name,
        variant
      );
    END LOOP;
  ELSE
    FOR constraint_name IN
      SELECT constraint_info.conname
      FROM pg_constraint AS constraint_info
      WHERE constraint_info.conrelid = 'public.bottles'::regclass
        AND constraint_info.contype = 'c'
        AND pg_get_constraintdef(constraint_info.oid) ILIKE '%bottle_type%'
    LOOP
      EXECUTE format(
        'ALTER TABLE public.bottles DROP CONSTRAINT %I',
        constraint_name
      );
    END LOOP;

    ALTER TABLE public.bottles
      ADD CONSTRAINT bottles_bottle_type_allowed_check
      CHECK (bottle_type IN ('glass', 'scroll', 'anchor', 'crystal', 'jade', 'lantern'));
  END IF;
END $$;