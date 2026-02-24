import { Component, computed, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { TabsModule } from 'primeng/tabs';
import { CardModule } from 'primeng/card';

@Component({
    selector: 'app-administration',
    standalone: true,
    imports: [RouterOutlet, TabsModule, CardModule],
    templateUrl: './administration.html'
})
export class Administration {
    private router = inject(Router);

    private url = toSignal(
        this.router.events.pipe(
            filter((e) => e instanceof NavigationEnd),
            map((e) => (e as NavigationEnd).urlAfterRedirects)
        ),
        { initialValue: this.router.url }
    );

    activeTab = computed(() => {
        const url = this.url();
        const segments = url.split('/');
        return segments[segments.length - 1] || 'perfil';
    });

    onTabChange(value: string | number | undefined): void {
        if (value == null) return;
        this.router.navigate(['/administracion', value]);
    }
}
