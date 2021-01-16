import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  config: object;
  configUrl = environment.configUrl;
  constructor(private http: HttpClient) { }

  async getConfig() {
    if (this.config) { return this.config; }

    this.config = await this.loadConfig();
    return this.config;
  }

  loadConfig() {
    return this.http.get(this.configUrl).pipe(
      retry(100)
    ).toPromise();
  }
}
