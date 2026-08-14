-- Execute uma única vez no banco que já possui a tabela photos.
alter table photos add column post_id text;
alter table photos add column position integer not null default 0;
update photos set post_id = id where post_id is null;
create index if not exists photos_post_id on photos(post_id);

create table if not exists reactions (
  id text primary key,
  post_id text not null,
  guest_key text not null,
  emoji text not null,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  unique(post_id, guest_key)
);

create table if not exists comments (
  id text primary key,
  post_id text not null,
  guest_name text not null,
  text text not null,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

create index if not exists reactions_post_id on reactions(post_id);
create index if not exists comments_post_id on comments(post_id, created_at);
