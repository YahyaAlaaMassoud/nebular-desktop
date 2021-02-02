import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Validation } from '../../utils/validations';
import { Router } from '@angular/router';
import { UserService } from '../../services/user/user.service';
import { HelperService } from '../../services/helper/helper.service';
import { MainEventsService } from '../../services/main-events/main-events.service';
import { getJSDocThisTag } from 'typescript/lib/tsserverlibrary';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  public loginForm: FormGroup;
  allUsersEmails: any[] = []
  showPassword: boolean = false;

  constructor(private formBuilder: FormBuilder,
              private userService: UserService,
              private helperService: HelperService,
              private mainEventsService: MainEventsService,
              private _cdr: ChangeDetectorRef
              ) 
  {
  }

  ngOnInit() {
    this.allUsersEmails = this.mainEventsService.allUsersEmails
    this.mainEventsService.allUsersEmailsObserver.subscribe(usersEmailsList => {
      this.allUsersEmails = [] // usersEmailsList
      usersEmailsList.forEach((item) => {
        this.allUsersEmails.push(item.email)
      })
      console.log('IT IS UPDATED', this.allUsersEmails)
      this.mainEventsService.sendEventAsync('all-users-list-received', {})
      this._cdr.detectChanges()
    });

    this.loginForm = this.formBuilder.group({
      email: ['', Validators.compose([Validation.emailValidator, Validators.required])],
      password: ['', Validators.compose([Validators.minLength(6), Validators.maxLength(100), Validators.required])],
    });
  }

  async save() {
    try {
      // await this.helperService.showLoading();
      await this.helperService.showNgLoading();
      const result: any = await this.userService.login(this.loginForm.value);
      this.userService.updateAndSaveCarrentUser(result);
      this.mainEventsService.sendEventAsync('add-user-email', this.loginForm.value['email'])
      // this.helperService.removeLoading();
      this.helperService.removeNgLoading();
    } catch (err) {
      // this.helperService.showError(err);
      this.helperService.showNbToast('Error happened when logging in. Please Try again.', 'danger');
    }
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }

  getInputType() {
    if (this.showPassword) {
      return 'text';
    }
    return 'password';
  }

  whichKey(e) {
    if ( e.key == 'Enter' ) {
      e.preventDefault();
    }
  }
}
