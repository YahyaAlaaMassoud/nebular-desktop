import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'round'
})
export class RoundPipe implements PipeTransform {

  transform(value: number, ...args: any[]): any {
    if ( !isNaN(value) ) {
      return Math.round(value * 100)
    } else {
      return 0
    }
  }

}
