import { Injectable, signal, computed, OnDestroy, inject } from '@angular/core';
import { createClient, SupabaseClient, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { environment } from '@/environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SupabaseService implements OnDestroy {
    private supabase: SupabaseClient;
    private authSubscription: { unsubscribe: () => void } | null = null;
    private authService = inject(AuthService);

    session = signal<Session | null>(null);
    isAuthenticated = computed(() => this.session() !== null);
    currentUser = computed(() => {
        const user = this.session()?.user ?? null;

        return {
            ...user,
            phoneFormatted:  Number(user?.phone?.toString().slice(2))
        }
    });

    loading = signal<boolean>(true);

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: false
            }
        });

        this.initializeSession();

        const { data } = this.supabase.auth.onAuthStateChange(
            (_event: AuthChangeEvent, session: Session | null) => {
                this.session.set(session);
            }
        );
        this.authSubscription = data.subscription;
    }

    private async initializeSession(): Promise<void> {
        try {
            const { data: { session } } = await this.supabase.auth.getSession();
            this.session.set(session);
        } finally {
            this.loading.set(false);
        }
    }

    async signInWithOtp(phone: string): Promise<{ error: Error | null }> {
        const { error } = await this.supabase.auth.signInWithOtp({ phone });
        return { error: error as Error | null };
    }

    async verifyOtp(phone: string, token: string): Promise<{ error: Error | null }> {
        const { data, error } = await this.supabase.auth.verifyOtp({
            phone,
            token,
            type: 'sms'
        });
        if (data.session) {
            this.session.set(data.session);
        }
        return { error: error as Error | null };
    }

    async getToken(): Promise<string | null> {
        const { data: { session } } = await this.supabase.auth.getSession();
        return session?.access_token ?? null;
    }

    async refreshSession(): Promise<{ error: Error | null }> {
        const { data, error } = await this.supabase.auth.refreshSession();
        if (data.session) {
            this.session.set(data.session);
        }
        return { error: error as Error | null };
    }

    async signOut(): Promise<void> {
        await this.supabase.auth.signOut();
        this.session.set(null);
        this.authService.clearProfile();
    }

    ngOnDestroy(): void {
        this.authSubscription?.unsubscribe();
    }
}
