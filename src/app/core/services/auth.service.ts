import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { Profile } from '@/app/types/profile';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private api = inject(ApiService);

    currentProfile = signal<Profile | null>(null);

    private loadProfilePromise: Promise<Profile | null> | null = null;

    loadProfile(userId: string): Promise<Profile | null> {
        if (this.loadProfilePromise) {
            return this.loadProfilePromise;
        }

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


    clearProfile(): void {
        this.currentProfile.set(null);
    }


    updateCurrentProfile(updates: Partial<Profile>): void {
        const current = this.currentProfile();
        if (current) {
            this.currentProfile.set({ ...current, ...updates });
        }
    }
}
