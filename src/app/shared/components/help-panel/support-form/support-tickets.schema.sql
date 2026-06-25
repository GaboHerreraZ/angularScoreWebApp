-- =============================================================================
-- Tabla: support_tickets
-- Tickets de soporte creados desde el Centro de Ayuda (app autenticada).
-- Cada ticket queda asociado a la empresa (company_id) y al usuario que lo crea
-- (created_by). La referencia a un registro concreto (estudio/cliente/pago) es
-- opcional y polimórfica: related_entity_type + related_entity_id.
-- =============================================================================

-- Enums (alineados con los tipos del front en src/app/types/support-ticket.ts)
create type support_ticket_area as enum ('credit_study', 'customer', 'payment', 'account', 'other');
create type support_ticket_type as enum ('bug', 'question', 'request');
create type support_ticket_priority as enum ('low', 'medium', 'high');
create type support_ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');
create type support_ticket_entity as enum ('credit_study', 'customer', 'payment');

create table public.support_tickets (
    id                  uuid primary key default gen_random_uuid(),

    -- Referencia legible para el usuario: "SUP-2026-000123". Generada por el backend.
    reference           text not null unique,

    -- Propiedad / autoría (rellenadas por el backend desde la ruta y el JWT, NO por el cliente).
    company_id          uuid not null references public.companies (id) on delete cascade,
    created_by          uuid not null references auth.users (id) on delete set null,

    -- Clasificación
    area                support_ticket_area     not null,
    type                support_ticket_type     not null default 'bug',
    priority            support_ticket_priority not null default 'medium',
    status              support_ticket_status   not null default 'open',

    -- Contenido
    subject             text not null check (char_length(subject) between 5 and 120),
    description         text not null check (char_length(description) between 20 and 2000),

    -- Referencia polimórfica opcional a un registro concreto.
    -- Regla de integridad: ambos NULL o ambos NOT NULL (ver check más abajo).
    related_entity_type support_ticket_entity,
    related_entity_id   text,

    -- Contexto técnico capturado en el cliente (ruta, user agent, viewport, versión).
    context             jsonb not null default '{}'::jsonb,

    -- Auditoría
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),

    -- Coherencia de la referencia polimórfica
    constraint support_tickets_related_pair_chk check (
        (related_entity_type is null and related_entity_id is null)
        or (related_entity_type is not null and related_entity_id is not null)
    )
);

-- Índices para los listados del backoffice y por empresa/usuario.
create index support_tickets_company_idx       on public.support_tickets (company_id, created_at desc);
create index support_tickets_created_by_idx    on public.support_tickets (created_by);
create index support_tickets_status_idx        on public.support_tickets (status);
create index support_tickets_related_idx       on public.support_tickets (related_entity_type, related_entity_id);

-- Trigger para mantener updated_at.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger support_tickets_set_updated_at
    before update on public.support_tickets
    for each row execute function public.set_updated_at();

-- =============================================================================
-- RLS (Row Level Security) — si lees/escribes directo con el cliente Supabase.
-- Si todo pasa por tu API con service_role, puedes omitir las políticas, pero
-- deja RLS habilitado para no exponer la tabla por accidente.
-- =============================================================================
alter table public.support_tickets enable row level security;

-- Un usuario solo ve los tickets de SU empresa.
-- (Asume una tabla/relación profiles(user_id, company_id); ajusta al modelo real.)
create policy support_tickets_select_own_company
    on public.support_tickets for select
    using (
        company_id in (
            select p.company_id from public.profiles p where p.id = auth.uid()
        )
    );

-- Solo puede crear tickets para su empresa y con su propia autoría.
create policy support_tickets_insert_own
    on public.support_tickets for insert
    with check (
        created_by = auth.uid()
        and company_id in (
            select p.company_id from public.profiles p where p.id = auth.uid()
        )
    );
