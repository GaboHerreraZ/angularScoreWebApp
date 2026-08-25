import { Profile } from '@/app/types/profile';

/** Ítem del checklist de configuración pendiente. */
export interface SetupItem {
    icon: string;
    title: string;
    subtitle: string;
    link: string;
}

const COMPANY_FIELD_LABELS: Record<string, string> = {
    nit: 'NIT',
    sectorId: 'sector',
    cityCode: 'ciudad',
    address: 'dirección'
};

/**
 * Pendientes de configuración de la cuenta (onboarding diferido): datos de la
 * empresa, representante legal y bancarios (solo administradores, que son
 * quienes pueden editarlos) y el perfil propio del usuario. Vacío cuando todo
 * está completo o el usuario aún no termina el onboarding.
 */
export function setupPendingItems(profile: Profile | null | undefined): SetupItem[] {
    if (!profile || profile.onboardingStatus !== 'ready') return [];

    const items: SetupItem[] = [];
    const isAdmin = profile.role === 'administrator';

    if (isAdmin) {
        const missing = profile.companyMissingFields ?? [];
        if (missing.length > 0) {
            const labels = missing.map((f) => COMPANY_FIELD_LABELS[f] ?? f).join(', ');
            items.push({
                icon: 'pi-building',
                title: 'Completa los datos de tu empresa',
                subtitle: `Falta: ${labels}. Sin el NIT no podrás crear estudios de crédito.`,
                link: '/app/administracion/empresa'
            });
        }
        if (profile.companyLegalRepComplete === false) {
            items.push({
                icon: 'pi-user-edit',
                title: 'Registra el representante legal',
                subtitle: 'Es quien obliga a la empresa en los documentos que emites.',
                link: '/app/administracion/empresa'
            });
        }
        if (profile.companyBankDataComplete === false) {
            items.push({
                icon: 'pi-credit-card',
                title: 'Registra los datos bancarios',
                subtitle: 'Necesarios para emitir pagarés a tus clientes.',
                link: '/app/administracion/empresa'
            });
        }
    }

    if (!profile.identificationNumber || !profile.phone) {
        items.push({
            icon: 'pi-user',
            title: 'Completa tu perfil',
            subtitle: 'Tu documento y teléfono de contacto.',
            link: '/app/administracion/perfil'
        });
    }

    return items;
}
