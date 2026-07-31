do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'altr_conversations_connection_external_key'
      and conrelid = 'public.altr_conversations'::regclass
  ) then
    alter table public.altr_conversations
      add constraint altr_conversations_connection_external_key
      unique (data_connection_id, external_conversation_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'altr_messages_conversation_external_key'
      and conrelid = 'public.altr_messages'::regclass
  ) then
    alter table public.altr_messages
      add constraint altr_messages_conversation_external_key
      unique (conversation_id, external_message_id);
  end if;
end $$;
