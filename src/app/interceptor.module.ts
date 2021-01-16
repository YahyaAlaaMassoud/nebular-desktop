import { Injectable, NgModule } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { HTTP_INTERCEPTORS, HttpHeaders } from '@angular/common/http';
import { Events } from '@ionic/angular';

export let TOKEN = '';
@Injectable()
export class HttpsRequestInterceptor implements HttpInterceptor {
  constructor(private events: Events) {
    this.events.subscribe('userUpdate', (user) => {
      if (!user) {
        TOKEN = '';
        return;
      }
      TOKEN = user.token || '';
    });
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const headers = new HttpHeaders({
      Accept: 'application/json',
      Authorization: 'Bearer ' + TOKEN,
    });

    const dupReq = req.clone({
      headers
    });

    return next.handle(dupReq).pipe(
      map((event: HttpResponse<any>) => {
        if (event instanceof HttpResponse) {
          // do stuff with response if you want
        }
        return event;
      })
    );
  }
}

@NgModule({
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: HttpsRequestInterceptor, multi: true }
  ]
})
export class InterceptorModule { }
