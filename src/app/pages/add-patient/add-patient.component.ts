import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { UserService } from '../../services/user/user.service';
import { HelperService } from './../../services/helper/helper.service';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Validation } from '../../utils/validations';
import { NbDialogRef } from '@nebular/theme';

@Component({
  selector: 'app-add-patient',
  templateUrl: './add-patient.component.html',
  styleUrls: ['./add-patient.component.scss']
})
export class AddPatientComponent implements OnInit {
  public patientForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private modalController: ModalController,
    private helperService: HelperService,
    private userService: UserService,
    protected dialogRef: NbDialogRef<AddPatientComponent>
    ) 
  { }

  ngOnInit() {
    this.patientForm = this.formBuilder.group({
      email: ['', Validators.compose([Validation.emailValidator])],
      name: ['', Validators.compose([Validators.minLength(3), Validators.maxLength(100), Validators.required])],
      address: ['', Validators.compose([Validators.minLength(3), Validators.maxLength(200)])],
      phone: ['', Validators.compose([Validation.phoneValidator, Validators.required])],
      gender: ['male', Validators.compose([Validators.required])],
      date_of_birth: ['', Validators.compose([Validators.required])],
      diagnosis: ['', Validators.compose([Validators.minLength(6), Validators.maxLength(200)])],
      has_guardian: [true, Validators.compose([Validators.required])],
      guardian_name: ['', Validators.compose([Validators.minLength(3), Validators.maxLength(100)])],
      notes: ['', Validators.compose([Validators.minLength(6), Validators.maxLength(200)])]
    });
    console.log(this.patientForm)
  }

  async save() {
    try {
      // this.helperService.showLoading();
      this.helperService.showNgLoading();
      const result: any = await this.userService.addPatient(this.patientForm.value);
      if (result) {
        // this.helperService.showToast(this.helperService.translate('PATIENT.Add_PATEINT_MSG'));
        // this.helperService.showNbToast(this.helperService.translate('PATIENT.Add_PATEINT_MSG'));
        this.helperService.showNbToast('New patient has been added');
        this.dismiss(result);
      }

    } catch (err) {
      // this.helperService.showError(err);
      this.helperService.showNbToast('Error happened when saving the new patient. Please Try again.', 'danger');
    }
  }

  dismiss(patient = null) {
    // this.modalController.dismiss({
    //   patient
    // });
    this.dialogRef.close(patient);
  }

}
