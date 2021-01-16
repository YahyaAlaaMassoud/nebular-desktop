import { Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root'
})
export class ChartsService {
  sessionsScopes: any[] = ['One Session', 'Within Dates', 'All Sessions'];

  constructor(private api: ApiService) {
  }

  loadSessionStatistics(moduleId) {
    return this.api.get(`/statistics/${moduleId}`);
  }

  loadAllSessionsStatistics(params) {
    return this.api.get(`/statistics`, params);
  }
}
