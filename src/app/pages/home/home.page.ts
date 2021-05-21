import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Platform, Events } from '@ionic/angular';
import { UserService } from '../../services/user/user.service';
import { HelperService } from '../../services/helper/helper.service';
import { ModalController } from '@ionic/angular';
import { AddPatientComponent } from './../add-patient/add-patient.component';
import { MainEventsService } from '../../services/main-events/main-events.service';
import { NbDialogService, NbDialogRef, NbMenuService } from '@nebular/theme';
import { filter, map } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})

export class HomePage implements OnInit {
  currentUser: any;
  pusherSocket;
  channel;
  patients: any[];
  connected: boolean;
  loading: boolean;
  userMenu = [ 
    { 
      title: 'Profile',
      icon: 'person-outline'
    }, 
    { 
      title: 'Log out',
      icon: 'log-out-outline'
    } 
  ];

  constructor(
      private platform: Platform,
      public userService: UserService,
      private helperService: HelperService,
      private events: Events,
      public modalController: ModalController,
      private mainEventsService: MainEventsService,
      private _cdr: ChangeDetectorRef,
      private nbDialogService: NbDialogService,
      private nbMenuService: NbMenuService,
      private router: Router
    ) {
      this.events.subscribe('userUpdate', (user) => {
        this.currentUser = user;
        if (user) { this.loadPatients(); } else { this.patients = []; }
      });
  }

  ngOnInit() {
    this.currentUser = this.userService.getCurrentUser();
    console.log(this.currentUser)
    this.loadPatients();
    this.nbMenuService.onItemClick()
                      .pipe(
                        map(({ item: { title } }) => title)
                      )
                      .subscribe(title => {
                        console.log(title)
                        if ( title == 'Log out' ) {
                          this.userService.logout()
                        } else if ( title == 'Profile' ) {
                          // console.log('hamo')
                          this.router.navigate(['/edit-profile']);
                        }
                      })
  }

  async loadPatients() {
    try {
      this.loading = true;
      // await this.helperService.showLoading();
      await this.helperService.showNgLoading();
      const result: any = await this.userService.getPatients();
      this.patients = result;
      const headsets: any[] = await this.userService.getCenterHeadsets() as any[];
      this.mainEventsService.sendEventAsync('authorized-devices', headsets.map((h) => h.serial));
      this._cdr.detectChanges();
      this.loading = false;
      // await this.helperService.removeLoading();
      await this.helperService.removeNgLoading();
    } catch (err) {
      console.log('loadPatients err', err);
      this.loading = false;
      // this.helperService.showError(err);
      this.helperService.showNbToast('Error happened when loading patient info. Please Try again.', 'danger');
    }
  }

  async addPatient() {
    this.nbDialogService.open(
      AddPatientComponent,
      {
        context: 'hola',
        hasBackdrop: true,
        closeOnBackdropClick: false,
        autoFocus: false,
      }).onClose.subscribe((patient) => {
        if ( patient ) {
          this.patients.push(patient);
        }
      });
    // const modal = await this.modalController.create({
    //   component: AddPatientComponent,
    //   animated: true,
    //   backdropDismiss: false,
    //   keyboardClose: true,
    //   showBackdrop: true,
    // });
    // await modal.present();
    // const { data } = await modal.onDidDismiss();
    // if (data.patient) { this.patients.push(data.patient); }
  }

}
