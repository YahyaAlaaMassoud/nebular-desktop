import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Platform, Events } from '@ionic/angular';
import { UserService } from '../../services/user/user.service';
import { HelperService } from '../../services/helper/helper.service';
import { ModalController } from '@ionic/angular';
import { AddPatientComponent } from './../add-patient/add-patient.component';
import { MainEventsService } from '../../services/main-events/main-events.service';
import { NbDialogService, NbDialogRef, NbMenuService } from '@nebular/theme';
import { filter, map } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Validation } from '../../utils/validations';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.page.html',
  styleUrls: ['./edit-profile.page.scss'],
})

export class EditProfilePage implements OnInit {

  user: any
  centers: any
  specialities: any[] = ['psychologist', 'therapist']
  public userForm: FormGroup;

  constructor(
    private helperService: HelperService,
    private formBuilder: FormBuilder,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router) {

  }

  ngOnInit() {
    this.loadUserData()
  }

  buildUserForm() {
    this.userForm = this.formBuilder.group({
      email: [this.user.email, Validators.compose([Validation.emailValidator])],
      name: [this.user.name, Validators.compose([Validators.minLength(3), Validators.maxLength(100), Validators.required])],
      address: [this.user.address, Validators.compose([Validators.minLength(3), Validators.maxLength(200), Validators.required])],
      phone: [this.user.phone, Validators.compose([Validation.phoneValidator, Validators.required])],
      specialty: [this.user.specialty, Validators.compose([Validators.required])],
    });
  }

  async loadUserData() {
    try {
      this.user = await this.userService.getCurrentUser() as any;
      // this.centers = await this.userService.getCenters() as any;
      // console.log(this.centers)
      this.buildUserForm()
      console.log(this.user)
    } catch (err) {
      console.log(err);
    }
  }

  async save() {
    try {
      this.helperService.showNgLoading();
      console.log(this.userForm.value)
      // console.log(this.user.name.replace(/\s+/g, '-'))
      const result: any = await this.userService.editDoctor(this.user.id, this.userForm.value);
      if (result) {
        this.helperService.showNbToast('Doctor info saved successfully!');
      }
    } catch (err) {
      this.helperService.showNbToast('Error happened when editing the patient. Please Try again.', 'danger');
    }
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}