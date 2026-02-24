import { ApiService } from '@/app/core/services/api.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Profile } from '@/app/types/profile';

@Injectable({ providedIn: 'root' })
export class ProfileService {

    constructor(private api: ApiService) {}

    getProfile(id: string): Observable<Profile> {
        return this.api.get<Profile>(`profiles/${id}`);
    }

    createProfile(payload: Profile): Observable<Profile> {
        return this.api.post<Profile>('profiles', payload);
    }

    updateProfile(id: string, payload: Partial<Profile>): Observable<Profile> {
        return this.api.patch<Profile>(`profiles/${id}`, payload);
    }
}
