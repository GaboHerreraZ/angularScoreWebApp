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

    /** True si el usuario tiene credenciales de correo/contraseña (puede cambiar contraseña). False si solo entró por OAuth (ej. Google). */
    hasEmailProvider = computed(() => {
        const user = this.session()?.user ?? null;
        if (!user) return false;
        const identities = user.identities ?? [];
        return identities.some((identity) => identity.provider === 'email');
    });

    loading = signal<boolean>(true);

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
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

    async signUp(email: string, password: string): Promise<{ data: { id: string; emailConfirmed: boolean; hasSession: boolean } | null; error: Error | null }> {
        const { data, error } = await this.supabase.auth.signUp({ email, password });
        return {
            data: data.user
                ? {
                    id: data.user.id,
                    // Supabase marca email_confirmed_at solo cuando el correo ya está verificado.
                    emailConfirmed: !!data.user.email_confirmed_at,
                    hasSession: !!data.session
                }
                : null,
            error: error as Error | null
        };
    }

    async signInWithPassword(email: string, password: string): Promise<{ error: Error | null }> {
        const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
        if (data.session) {
            this.session.set(data.session);
        }
        return { error: error as Error | null };
    }

    async signInWithGoogle(invitationId?: string, token?: string, customRedirectTo?: string): Promise<{ error: Error | null }> {
        // El redirectTo debe coincidir EXACTAMENTE con una Redirect URL autorizada en Supabase.
        // Pasar invitation/token como query rompería ese match, así que viajan por sessionStorage.
        if (invitationId && token) {
            sessionStorage.setItem('pending_invitation', JSON.stringify({ invitationId, token }));
        }
        const redirectTo = customRedirectTo ?? (window.location.origin + '/auth/callback');
        const { error } = await this.supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo }
        });
        return { error: error as Error | null };
    }

    /** Envía el correo de recuperación. El link del correo abre la app con una sesión temporal. */
    async resetPasswordForEmail(email: string): Promise<{ error: Error | null }> {
        const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/nueva-contrasena`
        });
        return { error: error as Error | null };
    }

    /** Actualiza la contraseña del usuario autenticado (sirve para recuperación y para cambio desde perfil). */
    async updatePassword(password: string): Promise<{ error: Error | null }> {
        const { error } = await this.supabase.auth.updateUser({ password });
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
