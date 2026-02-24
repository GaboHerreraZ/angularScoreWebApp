import { Component } from '@angular/core';
import { ToastModule } from 'primeng/toast';

@Component({
    selector: 'app-notification',
    standalone: true,
    imports: [ToastModule],
    templateUrl: './notification.html'
})
export class Notification {}
