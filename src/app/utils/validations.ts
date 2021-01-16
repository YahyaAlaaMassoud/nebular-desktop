import { FormControl, FormGroup } from '@angular/forms';

export class Validation {

    static getValidatorErrorMessage(validatorName: string, validatorValue?: any) {
        const config = {
            required: 'VALIDATION.BLANK',
            invalidEmail: 'VALIDATION.INVALID_EMAIL',
            invalidPhone: 'VALIDATION.INVALID_PHONE',
            mismatchedPasswords: 'VALIDATION.PASSWORD_CONFIRMATION',
            minlength: 'VALIDATION.PASSWORD_TOO_SHORT',
            maxlength: 'VALIDATION.PASSWORD_TOO_LONG'
        };
        if (validatorValue) { return validatorValue; } else { return config[validatorName] || 'SomeError'; }

    }

    static phoneValidator(control: FormControl): any {
        const regex = new RegExp(/^(01){1}[0|1|2|5]{1}(\d){8}$/);
        // let regex = new RegExp(/^(\(?(\+|00)\d{1,3})?\)?\d{3}[-]?\d{3}[-]?\d{4}$/);
        if (!regex.test(control.value)) {
            return {
                invalidPhone: true
            };
        }
    }
    static emailValidator(control: FormControl): any {
        const regex = new RegExp(/^([(A-Za-z) | \d ][\w+\-.]+[A-Za-z0-9]+@[a-z\d\-.]+\.[a-z]+)?$/);
        if (!regex.test(control.value)) {
            return {
                invalidEmail: true
            };
        }
    }

    static matchingPasswordsValidator(passwordKey: string, confirmPasswordKey: string) {
        return (group: FormGroup): { [key: string]: any } => {
            const password = group.controls[passwordKey];
            const confirmPassword = group.controls[confirmPasswordKey];
            if (password.value !== confirmPassword.value) {
                return {
                    mismatchedPasswords: true
                };
            }
        };
    }


}
