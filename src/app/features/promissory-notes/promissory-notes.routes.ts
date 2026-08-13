import { Routes } from '@angular/router';
import { PromissoryNotes } from './promissory-notes';

export default [
    { path: '', component: PromissoryNotes },
    { path: 'detalle-pagare/:id', title: 'Detalle del pagaré', loadComponent: () => import('./promissory-note-detail/promissory-note-detail').then((c) => c.PromissoryNoteDetail) }
] as Routes;
