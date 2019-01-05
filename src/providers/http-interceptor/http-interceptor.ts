import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/timeout';
import 'rxjs/add/operator/do';

import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';

@Injectable()
export class myInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).timeout(15000).do(event => {}, err => { // timeout of 5000 ms
      console.log("ERROR myInterceptor");  
      if(err instanceof HttpErrorResponse){
            // Observable.throw(err);
        }  
    });
  }
}