create table if not exists photos (
  id text primary key,
  post_id text,
  storage_path text not null unique,
  position integer not null default 0,
  guest_name text not null,
  message text,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
create table if not exists messages (
  id text primary key,
  guest_name text not null,
  text text not null,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
create index if not exists photos_created_at on photos(created_at desc);
create index if not exists photos_post_id on photos(post_id);
create index if not exists messages_created_at on messages(created_at asc);

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
