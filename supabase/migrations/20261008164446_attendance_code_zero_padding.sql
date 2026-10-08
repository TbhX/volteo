-- Preserve the installed dispatcher and change only its two code generators.
-- Fail atomically on schema drift instead of overwriting unrelated changes.
do $migration$
declare
 definition text := pg_get_functiondef('volteo_private.dispatch(text,text,jsonb,volteo_private.users)'::regprocedure);
 old_expression text := $old$lpad(((('x'||substr(replace(gen_random_uuid()::text,'-',''),1,8))::bit(32)::bigint)%1000000)::text,6)$old$;
 new_expression text := $new$lpad(((('x'||substr(replace(gen_random_uuid()::text,'-',''),1,8))::bit(32)::bigint)%1000000)::text,6,'0')$new$;
begin
 if (length(definition)-length(replace(definition,old_expression,'')))/length(old_expression) <> 2 then
  raise exception 'Unexpected attendance code generators: inspect dispatcher before migration';
 end if;
 execute replace(definition,old_expression,new_expression);
end
$migration$;

-- Repair only the old space-padded numeric codes; valid six-digit codes stay intact.
update volteo_private.lead_details
set attendance_code=lpad(btrim(attendance_code),6,'0')
where attendance_code ~ '^ +[0-9]{1,5}$' and length(attendance_code)=6;
