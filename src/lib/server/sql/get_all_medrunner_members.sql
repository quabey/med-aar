-- Run this in the Supabase SQL editor once before using the bulk profile rebuild.
-- Unnests responding_team JSON into one flat row per member per alert,
-- unioning allMembers + staff to ensure no one is missed.

CREATE OR REPLACE FUNCTION get_all_medrunner_members()
RETURNS TABLE (
  alert_id       TEXT,
  rsi_handle     TEXT,
  discord_id     TEXT,
  member_class   INT,
  is_dispatcher  BOOLEAN,
  alert_status   INT,
  creation_ts    BIGINT,
  accepted_ts    BIGINT,
  completion_ts  BIGINT,
  alert_system   TEXT,
  threat_lvl     INT,
  alert_rating   NUMERIC,
  suspected_trap BOOLEAN,
  client_handle  TEXT,
  client_did     TEXT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    ca.id::TEXT,
    (m->>'rsiHandle')::TEXT,
    (m->>'discordId')::TEXT,
    (m->>'class')::INT,
    EXISTS (
      SELECT 1
      FROM jsonb_array_elements(COALESCE(ca.responding_team->'dispatchers', '[]'::jsonb)) AS d
      WHERE d->>'discordId' = m->>'discordId'
        AND m->>'discordId' IS NOT NULL
    ),
    ca.status,
    ca.creation_timestamp,
    ca.accepted_timestamp,
    ca.completion_timestamp,
    ca.system,
    ca.threat_level,
    ca.rating,
    ca.aar_suspected_trap,
    ca.client_rsi_handle,
    ca.client_discord_id
  FROM completed_alerts ca
  -- Union allMembers + staff, deduplicate per alert by discordId (then rsiHandle)
  CROSS JOIN LATERAL (
    SELECT DISTINCT ON (COALESCE(m->>'discordId', m->>'rsiHandle'))
      m
    FROM (
      SELECT m
      FROM jsonb_array_elements(COALESCE(ca.responding_team->'allMembers', '[]'::jsonb)) AS m
      UNION ALL
      SELECT m
      FROM jsonb_array_elements(COALESCE(ca.responding_team->'staff', '[]'::jsonb)) AS m
    ) all_members
    WHERE m->>'rsiHandle' IS NOT NULL
    ORDER BY COALESCE(m->>'discordId', m->>'rsiHandle')
  ) AS deduped(m)
  WHERE ca.responding_team IS NOT NULL
$$;
