import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { ConfigService } from '../config/config.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  config: any = {};

  constructor(public http: HttpClient, configService: ConfigService) {
    configService.getConfig().then((config) => {
      this.config = config;
    });
  }

  get(endpoint: string, params = {}, reqOpts = { params }) {
    reqOpts.params = params;
    return this.http.get(this.config.apiUrl + endpoint, reqOpts).pipe(
      retry(this.config.maxTry),
      catchError(this.handleError)
    ).toPromise();
  }

  // post(endpoint: string, body: any, reqOpts: any = { observe: 'response' }) {
  post(endpoint: string, body: any, reqOpts?: any) {
    return this.http.post(this.config.apiUrl + endpoint, body, reqOpts).pipe(
      retry(this.config.maxTry),
      catchError(this.handleError)
    ).toPromise();
  }


  put(endpoint: string, body: any, reqOpts?: any) {
    return this.http.put(this.config.apiUrl + endpoint, body, reqOpts).pipe(
      retry(this.config.maxTry),
      catchError(this.handleError)
    ).toPromise();
  }

  delete(endpoint: string, params = {}, reqOpts = { params }) {
    reqOpts.params = params;
    return this.http.delete(this.config.apiUrl + endpoint, reqOpts).pipe(
      retry(this.config.maxTry),
      catchError(this.handleError)
    ).toPromise();
  }

  patch(endpoint: string, body: any, reqOpts?: any) {
    return this.http.patch(this.config.apiUrl + endpoint, body, reqOpts).pipe(
      retry(this.config.maxTry),
      catchError(this.handleError)
    ).toPromise();
  }

  private handleError(error: HttpErrorResponse) {
    let msg;
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error);
      msg = error.error.message;
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: `, error.error);
      if (error.status === 0) {
        msg = 'Connection Error';
      } else {
        msg = error.error.message;
      }

    }
    // return an observable with a user-facing error message
    return throwError(msg);
  }
}
