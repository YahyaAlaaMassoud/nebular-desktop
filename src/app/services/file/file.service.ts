import { Injectable } from '@angular/core';
import { MainEventsService } from '../main-events/main-events.service';

@Injectable({
  providedIn: 'root'
})
export class FileService {

  message: string;

  constructor(private mainEventsService: MainEventsService) {}


  runModule(options) {
    return this.mainEventsService.sendEventAsync('run-module', options);
  }

}
