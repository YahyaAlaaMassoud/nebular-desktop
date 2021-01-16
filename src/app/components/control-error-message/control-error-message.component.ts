import { Component, OnInit, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Validation } from '../../utils/validations';

@Component({
  selector: 'app-control-error-message',
  templateUrl: './control-error-message.component.html',
  styleUrls: ['./control-error-message.component.scss']
})

export class ControlErrorMessageComponent implements OnInit {
  @Input() control: FormControl;
  constructor() { }

  ngOnInit() {
  }

  get errorMessage() {
    for (const propertyName in this.control.errors) {
      if (this.control.errors.hasOwnProperty(propertyName) && this.control.touched) {
        return Validation.getValidatorErrorMessage(propertyName, propertyName === 'customError' ? this.control.errors[propertyName] : null);
      }
    }

    return null;
  }

}
