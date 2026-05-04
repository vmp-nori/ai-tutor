REVOKE EXECUTE ON FUNCTION "public"."sync_auth_user_to_profile"() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION "public"."sync_auth_user_to_profile"() FROM anon;
REVOKE EXECUTE ON FUNCTION "public"."sync_auth_user_to_profile"() FROM authenticated;
