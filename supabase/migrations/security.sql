alter table if exists public.contracts enable row level security;
alter table if exists public.analyses enable row level security;
alter table if exists public.risks enable row level security;
alter table if exists public.users enable row level security;

do $$
begin
  if to_regclass('public.contracts') is not null then
    execute 'drop policy if exists "contracts_select_own" on public.contracts';
    execute 'drop policy if exists "contracts_insert_own" on public.contracts';
    execute 'drop policy if exists "contracts_update_own" on public.contracts';
    execute 'drop policy if exists "contracts_delete_own" on public.contracts';

    execute 'create policy "contracts_select_own" on public.contracts for select using (auth.uid() = user_id)';
    execute 'create policy "contracts_insert_own" on public.contracts for insert with check (auth.uid() = user_id)';
    execute 'create policy "contracts_update_own" on public.contracts for update using (auth.uid() = user_id) with check (auth.uid() = user_id)';
    execute 'create policy "contracts_delete_own" on public.contracts for delete using (auth.uid() = user_id)';

    execute 'alter table public.contracts alter column privacy_mode set default false';
  end if;

  if to_regclass('public.analyses') is not null then
    execute 'drop policy if exists "analyses_select_own" on public.analyses';
    execute 'drop policy if exists "analyses_insert_own" on public.analyses';
    execute 'drop policy if exists "analyses_update_own" on public.analyses';
    execute 'drop policy if exists "analyses_delete_own" on public.analyses';

    execute 'create policy "analyses_select_own" on public.analyses for select using (auth.uid() = user_id)';
    execute 'create policy "analyses_insert_own" on public.analyses for insert with check (auth.uid() = user_id)';
    execute 'create policy "analyses_update_own" on public.analyses for update using (auth.uid() = user_id) with check (auth.uid() = user_id)';
    execute 'create policy "analyses_delete_own" on public.analyses for delete using (auth.uid() = user_id)';
  end if;

  if to_regclass('public.risks') is not null then
    execute 'drop policy if exists "risks_select_own" on public.risks';
    execute 'drop policy if exists "risks_insert_own" on public.risks';
    execute 'drop policy if exists "risks_update_own" on public.risks';
    execute 'drop policy if exists "risks_delete_own" on public.risks';

    execute 'create policy "risks_select_own" on public.risks for select using (exists (select 1 from public.contracts c where c.id = contract_id and c.user_id = auth.uid()))';
    execute 'create policy "risks_insert_own" on public.risks for insert with check (exists (select 1 from public.contracts c where c.id = contract_id and c.user_id = auth.uid()))';
    execute 'create policy "risks_update_own" on public.risks for update using (exists (select 1 from public.contracts c where c.id = contract_id and c.user_id = auth.uid())) with check (exists (select 1 from public.contracts c where c.id = contract_id and c.user_id = auth.uid()))';
    execute 'create policy "risks_delete_own" on public.risks for delete using (exists (select 1 from public.contracts c where c.id = contract_id and c.user_id = auth.uid()))';
  end if;

  if to_regclass('public.users') is not null then
    execute 'drop policy if exists "users_select_own" on public.users';
    execute 'drop policy if exists "users_update_own" on public.users';

    execute 'create policy "users_select_own" on public.users for select using (auth.uid() = id)';
    execute 'create policy "users_update_own" on public.users for update using (auth.uid() = id) with check (auth.uid() = id)';
  end if;
end $$;