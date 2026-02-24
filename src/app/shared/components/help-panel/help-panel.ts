import { Component, inject, signal } from '@angular/core';
import { DrawerModule } from 'primeng/drawer';
import { TabsModule } from 'primeng/tabs';
import { LayoutService } from '@/app/layout/service/layout.service';
import { HelpFaq } from './faq/faq';
import { HelpSupportForm } from './support-form/support-form';

@Component({
    selector: 'app-help-panel',
    standalone: true,
    imports: [DrawerModule, TabsModule, HelpFaq, HelpSupportForm],
    templateUrl: './help-panel.html'
})
export class HelpPanel {
    layoutService = inject(LayoutService);

    activeTab = signal<number>(0);

    drawerStyleClass = '!w-full sm:!w-[520px]';

    get helpPanelVisible(): boolean {
        return this.layoutService.layoutState().helpPanelVisible;
    }

    set helpPanelVisible(val: boolean) {
        this.layoutService.layoutState.update((state) => ({ ...state, helpPanelVisible: val }));
    }

    onSupportSubmitted(): void {
        this.activeTab.set(0);
    }
}
