import { Component, OnInit } from '@angular/core';
import { Platform, Events } from '@ionic/angular';
import { UserService } from '../../services/user/user.service';
import { HelperService } from '../../services/helper/helper.service';
import { ModalController } from '@ionic/angular';
import { AddPatientComponent } from './../add-patient/add-patient.component';
import { MainEventsService } from '../../services/main-events/main-events.service';

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
    constructor(
      private platform: Platform,
      public userService: UserService,
      private helperService: HelperService,
      private events: Events,
      public modalController: ModalController,
      private mainEventsService: MainEventsService,

    ) {
      this.events.subscribe('userUpdate', (user) => {
        this.currentUser = user;
        if (user) { this.loadPatients(); } else { this.patients = []; }
      });
  }

  ngOnInit() {
    this.currentUser = this.userService.getCurrentUser();
    this.loadPatients();
  }

  async loadPatients() {
    try {
      this.loading = true;
      await this.helperService.showLoading();
      const result: any = await this.userService.getPatients();
      this.patients = result;
      this.loading = false;
      await this.helperService.removeLoading();
      const headsets: any[] = await this.userService.getCenterHeadsets() as any[];
      this.mainEventsService.sendEventAsync('authorized-devices', headsets.map((h) => h.serial));
    } catch (err) {
      console.log('loadPatients err', err);
      this.loading = false;
      this.helperService.showError(err);
    }
  }

  async addPatient() {
    const modal = await this.modalController.create({
      component: AddPatientComponent,
      animated: true,
      backdropDismiss: true,
      keyboardClose: true,
      showBackdrop: true
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data.patient) { this.patients.push(data.patient); }
  }

}
