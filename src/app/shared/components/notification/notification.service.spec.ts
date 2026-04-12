import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
    let service: NotificationService;
    let messageService: MessageService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [NotificationService, MessageService],
        });
        service = TestBed.inject(NotificationService);
        messageService = TestBed.inject(MessageService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should call messageService.add with success severity', () => {
        const spy = jest.spyOn(messageService, 'add');
        service.success('Operación exitosa', 'OK');
        expect(spy).toHaveBeenCalledWith({
            severity: 'success',
            summary: 'OK',
            detail: 'Operación exitosa',
        });
    });

    it('should call messageService.add with error severity', () => {
        const spy = jest.spyOn(messageService, 'add');
        service.error('Algo falló');
        expect(spy).toHaveBeenCalledWith({
            severity: 'error',
            summary: 'Error',
            detail: 'Algo falló',
        });
    });

    it('should call messageService.add with warn severity', () => {
        const spy = jest.spyOn(messageService, 'add');
        service.warn('Cuidado');
        expect(spy).toHaveBeenCalledWith({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'Cuidado',
        });
    });

    it('should call messageService.add with info severity', () => {
        const spy = jest.spyOn(messageService, 'add');
        service.info('Información importante');
        expect(spy).toHaveBeenCalledWith({
            severity: 'info',
            summary: 'Información',
            detail: 'Información importante',
        });
    });

    it('should call messageService.clear', () => {
        const spy = jest.spyOn(messageService, 'clear');
        service.clear();
        expect(spy).toHaveBeenCalled();
    });
});
