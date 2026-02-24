import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Parameter } from '@/app/types/parameter';


@Injectable({ providedIn: 'root' })
export class ParameterService {

    constructor(private api: ApiService) {}

    getByType(type: string): Observable<Parameter[]> {
        return this.api.get<Parameter[]>('parameters', {
            params: { type, isActive: true }
        }).pipe(map((result:any)=> result.data));
    }
}
