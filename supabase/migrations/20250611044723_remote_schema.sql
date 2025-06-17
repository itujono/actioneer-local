drop trigger if exists "update_user_auth_tokens_updated_at_trigger" on "public"."user_auth_tokens";

drop policy "Service role can manage notifications" on "public"."email_notifications";

drop policy "Users can access own notifications" on "public"."email_notifications";

drop policy "Service role can manage tokens" on "public"."user_auth_tokens";

drop policy "Users can access own tokens" on "public"."user_auth_tokens";

revoke delete on table "public"."user_auth_tokens" from "anon";

revoke insert on table "public"."user_auth_tokens" from "anon";

revoke references on table "public"."user_auth_tokens" from "anon";

revoke select on table "public"."user_auth_tokens" from "anon";

revoke trigger on table "public"."user_auth_tokens" from "anon";

revoke truncate on table "public"."user_auth_tokens" from "anon";

revoke update on table "public"."user_auth_tokens" from "anon";

revoke delete on table "public"."user_auth_tokens" from "authenticated";

revoke insert on table "public"."user_auth_tokens" from "authenticated";

revoke references on table "public"."user_auth_tokens" from "authenticated";

revoke select on table "public"."user_auth_tokens" from "authenticated";

revoke trigger on table "public"."user_auth_tokens" from "authenticated";

revoke truncate on table "public"."user_auth_tokens" from "authenticated";

revoke update on table "public"."user_auth_tokens" from "authenticated";

revoke delete on table "public"."user_auth_tokens" from "service_role";

revoke insert on table "public"."user_auth_tokens" from "service_role";

revoke references on table "public"."user_auth_tokens" from "service_role";

revoke select on table "public"."user_auth_tokens" from "service_role";

revoke trigger on table "public"."user_auth_tokens" from "service_role";

revoke truncate on table "public"."user_auth_tokens" from "service_role";

revoke update on table "public"."user_auth_tokens" from "service_role";

alter table "public"."user_auth_tokens" drop constraint "user_auth_tokens_user_id_fkey";

drop function if exists "public"."update_user_auth_tokens_updated_at"();

alter table "public"."user_auth_tokens" drop constraint "user_auth_tokens_pkey";

drop index if exists "public"."idx_user_auth_tokens_expires_at";

drop index if exists "public"."idx_user_auth_tokens_user_id";

drop index if exists "public"."user_auth_tokens_pkey";

drop table "public"."user_auth_tokens";

alter table "public"."email_notifications" add column "updated_at" timestamp with time zone default now();

alter table "public"."email_notifications" alter column "notification_data" drop default;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_user_by_api_key(user_api_key text)
 RETURNS TABLE(id uuid, email text, name text, is_active boolean, source text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.name,
    u.is_active,
    u.source,
    u.created_at,
    u.updated_at
  FROM users u
  WHERE u.api_key = user_api_key 
    AND u.is_active = true;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.insert_email_classification(p_user_id uuid, p_message_id text, p_subject text, p_from_email text, p_date timestamp with time zone, p_classification text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  email_id uuid;
BEGIN
  INSERT INTO emails (
    user_id,
    message_id,
    subject,
    from_email,
    date,
    classification
  ) VALUES (
    p_user_id,
    p_message_id,
    p_subject,
    p_from_email,
    p_date,
    p_classification
  ) RETURNING id INTO email_id;
  
  RETURN email_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.insert_travel_data(p_user_id uuid, p_email_id text, p_type text, p_destination text, p_start_date date, p_end_date date, p_details jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  travel_id uuid;
BEGIN
  INSERT INTO travel (
    user_id,
    email_id,
    type,
    destination,
    start_date,
    end_date,
    details
  ) VALUES (
    p_user_id,
    p_email_id,
    p_type,
    p_destination,
    p_start_date,
    p_end_date,
    p_details
  ) RETURNING id INTO travel_id;
  
  RETURN travel_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

create policy "Service role can manage all notifications"
on "public"."email_notifications"
as permissive
for all
to service_role
using (true)
with check (true);


create policy "Users can insert their own email notifications"
on "public"."email_notifications"
as permissive
for insert
to public
with check ((user_id = auth.uid()));


create policy "Users can update their own email notifications"
on "public"."email_notifications"
as permissive
for update
to public
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));


create policy "Users can view their own email notifications"
on "public"."email_notifications"
as permissive
for select
to public
using ((user_id = auth.uid()));


CREATE TRIGGER update_email_notifications_updated_at BEFORE UPDATE ON public.email_notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


