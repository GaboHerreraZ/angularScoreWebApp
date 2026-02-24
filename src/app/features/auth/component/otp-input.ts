import { Component, output, ElementRef, viewChildren } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';

@Component({
    selector: 'app-otp-input',
    standalone: true,
    imports: [ReactiveFormsModule, InputTextModule],
    template: `
        <div class="flex items-center justify-center gap-2 sm:gap-3">
            @for (control of controls; track $index) {
                <input
                    #otpField
                    pInputText
                    type="text"
                    inputmode="numeric"
                    maxlength="1"
                    [formControl]="control"
                    class="w-12 h-12 sm:w-14 sm:h-14 text-center text-2xl font-bold"
                    (input)="onInput($index, $event)"
                    (keydown)="onKeyDown($index, $event)"
                    (paste)="onPaste($event)"
                    (focus)="onFocus($index)"
                    autocomplete="one-time-code"
                />
            }
        </div>
    `
})
export class OtpInput {
    otpComplete = output<string>();

    otpFields = viewChildren<ElementRef>('otpField');

    controls: FormControl<string>[] = Array.from(
        { length: 6 },
        () => new FormControl('', { nonNullable: true })
    );

    onInput(index: number, event: Event): void {
        const input = event.target as HTMLInputElement;
        const value = input.value.replace(/\D/g, '');

        if (value.length === 0) {
            this.controls[index].setValue('');
            return;
        }

        this.controls[index].setValue(value[0]);

        if (index < 5) {
            this.focusField(index + 1);
        }

        this.checkComplete();
    }

    onKeyDown(index: number, event: KeyboardEvent): void {
        if (event.key === 'Backspace') {
            if (this.controls[index].value === '' && index > 0) {
                this.controls[index - 1].setValue('');
                this.focusField(index - 1);
                event.preventDefault();
            }
        }
        if (event.key === 'ArrowLeft' && index > 0) {
            this.focusField(index - 1);
            event.preventDefault();
        }
        if (event.key === 'ArrowRight' && index < 5) {
            this.focusField(index + 1);
            event.preventDefault();
        }
    }

    onPaste(event: ClipboardEvent): void {
        event.preventDefault();
        const pasted = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 0) return;

        for (let i = 0; i < 6; i++) {
            this.controls[i].setValue(i < pasted.length ? pasted[i] : '');
        }

        const focusIndex = Math.min(pasted.length, 5);
        this.focusField(focusIndex);
        this.checkComplete();
    }

    onFocus(index: number): void {
        const fields = this.otpFields();
        if (fields[index]) {
            (fields[index].nativeElement as HTMLInputElement).select();
        }
    }

    reset(): void {
        this.controls.forEach(c => c.setValue(''));
        this.focusField(0);
    }

    private focusField(index: number): void {
        const fields = this.otpFields();
        if (fields[index]) {
            (fields[index].nativeElement as HTMLInputElement).focus();
        }
    }

    private checkComplete(): void {
        const code = this.controls.map(c => c.value).join('');
        if (code.length === 6 && /^\d{6}$/.test(code)) {
            this.otpComplete.emit(code);
        }
    }
}
