import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { Profile } from '@/app/types/profile';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private api = inject(ApiService);

    currentProfile = signal<Profile | null>(null);

    async loadProfile(userId: string): Promise<Profile | null> {
        try {
            const profile = await firstValueFrom(
                this.api.get<Profile>(`profiles/${userId}`)
            );
            this.currentProfile.set(profile);
            return profile;
        } catch (error) {
            console.error('Error loading profile:', error);
            this.currentProfile.set(null);
            return null;
        }
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
