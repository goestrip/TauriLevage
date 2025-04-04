import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function predicateValidator(predicate: (value: any) => boolean, errorKey: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    const isValid = predicate(value); // Call the predicate function with the control value
    
    if (!isValid) {
      return { [errorKey]: true }; // Return an error object if the predicate fails
    }
    return null; // Return null if the value is valid
  };
}