import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'roundFloat'
})
export class RoundFloatPipe implements PipeTransform {

  transform(num): unknown {
    return Math.round((num + Number.EPSILON) * 10) / 10;
  }

}
