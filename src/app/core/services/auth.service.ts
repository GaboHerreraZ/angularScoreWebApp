import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { Profile } from '@/app/types/profile';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private api = inject(ApiService);

    currentProfile = signal<Profile | null>(null);

    private loadProfilePromise: Promise<Profile | null> | null = null;
    /** Id del usuario del último perfil cargado, para poder refrescarlo sin re-pasarlo. */
    private currentUserId: string | null = null;

    loadProfile(userId: string): Promise<Profile | null> {
        if (this.loadProfilePromise) {
            return this.loadProfilePromise;
        }

        this.currentUserId = userId;
        this.loadProfilePromise = firstValueFrom(
            this.api.get<Profile>(`profiles/${userId}`, { headers: { 'X-Silent-Error': 'true' } })
        )
            .then(profile => {
                this.currentProfile.set(profile);
                return profile;
            })
            .catch(error => {
                console.error('Error loading profile:', error);
                this.currentProfile.set(null);
                return null;
            })
            .finally(() => {
                this.loadProfilePromise = null;
            });

        return this.loadProfilePromise;
    }

    /**
     * Vuelve a leer el perfil desde el backend (incluye permisos derivados de cuota,
     * p. ej. canAddCreditStudy). Llamar tras acciones que consumen cuota para que la UI
     * no muestre botones de acciones que el backend ya bloqueó. Falla en silencio:
     * si no se puede refrescar, se conserva el perfil actual y el backend sigue validando.
     */
    async refreshProfile(): Promise<Profile | null> {
        const userId = this.currentUserId;
        if (!userId) return this.currentProfile();

        try {
            const profile = await firstValueFrom(
                this.api.get<Profile>(`profiles/${userId}`, { headers: { 'X-Silent-Error': 'true' } })
            );
            this.currentProfile.set(profile);
            return profile;
        } catch (error) {
            console.error('Error refreshing profile:', error);
            return this.currentProfile();
        }
    }


    clearProfile(): void {
        this.currentProfile.set(null);
        this.currentUserId = null;
    }


    updateCurrentProfile(updates: Partial<Profile>): void {
        const current = this.currentProfile();
        if (current) {
            this.currentProfile.set({ ...current, ...updates });
        }
    }
}
