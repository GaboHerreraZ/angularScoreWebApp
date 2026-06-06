import { Component } from '@angular/core';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { Ripple } from 'primeng/ripple';
import { RouterModule } from '@angular/router';
import { Configurator } from '@/app/layout/components/configurator/configurator';

@Component({
    standalone: true,
    selector: 'app-lockscreen',
    imports: [IconField, InputIcon, InputText, ButtonModule, Ripple, RouterModule, Configurator],
    templateUrl: './lockscreen.html'
})
export class LockScreenComponent {}
