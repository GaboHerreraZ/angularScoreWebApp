import { Component, input } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-help-tooltip',
    standalone: true,
    imports: [TooltipModule],
    template: `
        <span
            class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 cursor-help hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
            [pTooltip]="text()"
            [tooltipPosition]="position()"
            [tooltipOptions]="{ showDelay: 150, hideDelay: 100 }">
            <i class="pi pi-question-circle text-[11px]"></i>
        </span>
    `
})
export class HelpTooltip {
    text = input.required<string>();
    position = input<'top' | 'bottom' | 'left' | 'right'>('top');
}
