import { Component, OnInit, OnChanges, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { UserService } from '../../services/user/user.service';
import { HelperService } from '../../services/helper/helper.service';
import { MainEventsService } from '../../services/main-events/main-events.service';
import { ActivatedRoute } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { EditPatientComponent } from '../edit-patient/edit-patient.component';
import { ElectronService } from 'ngx-electron';
import { RoundPipe } from '../../pipes/round.pipe';

@Component({
  selector: 'app-patient',
  changeDetection: ChangeDetectionStrategy.Default,
  templateUrl: './patient.page.html',
  styleUrls: ['./patient.page.scss'],
})
export class PatientPage implements OnInit {
  patient: any;
  modules: any[];
  headsets;
  showConsole = false;
  id: any;
  production: boolean;
  wirelessHeadset;
  onlineHeadsets: any[] = []
  selectedOnlineHeadset: any = null;
  isOnlineHeadsetSelected = false;
  logger: any;
  showPatientInfo: boolean = false;
  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private helperService: HelperService,
    public mainEventsService: MainEventsService,
    public modalController: ModalController,
    private electronService: ElectronService,
    private _cdr: ChangeDetectorRef
  ) {
    if (this.electronService.isElectronApp) {
      this.logger = this.electronService.remote.require('electron-log');
      console.log = this.logger.log;
    }
  }

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');
    this.loadPatient();
    // wait for userdoc before setting up page
    this.onlineHeadsets = this.mainEventsService.onlineHeadsets
    this.mainEventsService.onlineHeadsetObserver.subscribe(onlineHeadsets => {
      // console.log('HAMO', onlineHeadsets)
      // console.log('-----------------------')

      // CHANGE ONLY IF CHANGED
      this.onlineHeadsets = onlineHeadsets

      if ( this.isOnlineHeadsetSelected == true) {
        const found = this.onlineHeadsets.some(el => el.headsetSerial == this.selectedOnlineHeadset);
        if ( !found ) {
          this.isOnlineHeadsetSelected = false;
          this.selectedOnlineHeadset = null;

          console.log('REMOVING THE ALREADY SELECTED ONE!')
          console.log(this.isOnlineHeadsetSelected, this.selectedOnlineHeadset);
          console.log('------------------');
        } else {
          console.log('WONT REMOVE ANYTHING');
          console.log(this.isOnlineHeadsetSelected, this.selectedOnlineHeadset);
          console.log('------------------');
        }
      }

      this._cdr.detectChanges();
    });

    // this.onlineHeadsets = [
    //   {
    //     headsetSerial: '1WMVR4N0YJ0442',
    //     headsetModuleName: 'M1',
    //     headsetIP: '192.168.2.15',
    //     headsetPort: 8910,
    //     headsetName: 'Name 1'
    //   },
    //   {
    //     headsetSerial: '1PASH9BVE99467',
    //     headsetModuleName: 'M2',
    //     headsetIP: '192.168.2.15',
    //     headsetPort: 8910,
    //     headsetName: 'Name 3'
    //   },
    //   {
    //     headsetSerial: '1PASH9A0F69301',
    //     headsetModuleName: 'M3',
    //     headsetIP: '192.168.2.15',
    //     headsetPort: 8910,
    //     headsetName: 'Name 2'
    //   },
    // ]
  }

  async loadPatient() {
    try {
      await this.helperService.showLoading();
      this.patient = await this.userService.getPatient(this.id) as any[];
      this.modules = await this.userService.getPatientModules(this.id) as any[];
      this.headsets = await this.userService.getCenterHeadsets();
      this.mainEventsService.updateTrackedModules(this.modules);
      this.mainEventsService.sendEventAsync('authorized-devices-changed', {
        authorized_devices: this.headsets
      });
      this.helperService.removeLoading();
    } catch (err) {
      this.helperService.showError(err);
    }
  }

  runModule(module) {
    if (this.mainEventsService.wirelessMode) { return this.runModuleOnWirelessHeadset(module); }

    this.runModuleOnUsbHeadset(module);
  }

  runModuleV2(module) {
    this.runModuleOnWirelessHeadsetV2(module);
  }

  async runModuleOnUsbHeadset(module) {
    const readyHeadsetSerial = this.mainEventsService.getReadyHeadset().id;
    await this.getNewSessionId(
      module,
      this.headsets.find((h) => h.serial === readyHeadsetSerial).id
    );
    this.mainEventsService.runModuleAfterHeadsetConnected(module.name, module.id);
  }

  async runModuleOnWirelessHeadset(module) {
    const wirelessHeadsetSelected = this.mainEventsService.wirelessHeadsetSelected;
    if (!wirelessHeadsetSelected) { return this.helperService.showError('No Headset Selected'); }
    this.mainEventsService.reconnectHeadsetWirelesslyToRunModule(module.name, module.id, module.package_name);
    this.getNewSessionId(
      module,
      this.headsets.find((h) => h.serial === wirelessHeadsetSelected).id
    );
  }

  async runModuleOnWirelessHeadsetV2(module) {
    if ( this.isOnlineHeadsetSelected ) {
      // this.mainEventsService.reconnectHeadsetWirelesslyToRunModule(module.name, module.id, module.package_name);
      this.mainEventsService.runModuleAfterHeadsetConnected(module.name, module.id);
      await this.getNewSessionId(
        module,
        this.headsets.find((h) => h.serial === this.selectedOnlineHeadset).id
      );
      // this.helperService.showToast('Running ' + module.name + ' Module');
    } else { 
      return this.helperService.showError('No Headset Selected');
    }
  }

  selectOnlineHeadset(e) {
    this.isOnlineHeadsetSelected = e.currentTarget.checked;

    if ( e.currentTarget.checked == true ) {
      const selectionIdx = this.onlineHeadsets.findIndex(el => el.headsetSerial == e.target.name)
      this.selectedOnlineHeadset = this.onlineHeadsets[selectionIdx].headsetSerial;

      this.helperService.showToast('Headset with Serial Number: ' + this.selectedOnlineHeadset + ' has been selected');
      // console.log(this.headsets.find((h) => h.serial === this.selectedOnlineHeadset.headsetSerial).id)
    } else { 
      this.selectedOnlineHeadset = null
    }
    
    this._cdr.detectChanges();

    console.log(this.isOnlineHeadsetSelected, this.selectedOnlineHeadset)
  }

  async getNewSessionId(module, headset) {
    try {
      // await this.helperService.showLoading(
      //   `
      //   Connecting to the headset: '${this.selectedOnlineHeadset}',
      //    make sure it's open and the VR module: '${module.name}' is running on it.
      //   `
      //   );
      return await this.userService.getPatientSessionId(this.id, module.id, headset);
    } catch (err) {
      console.log('getNewSessionId err', err);
      this.helperService.showError(err);
      return false;
    }
  }

  async editPatient() {
    const modal = await this.modalController.create({
      component: EditPatientComponent,
      componentProps: { patient: this.patient },
      animated: true,
      backdropDismiss: true,
      keyboardClose: true,
      showBackdrop: true
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data.patient) { this.patient = data.patient; }
  }

  downloadLatestVersion(vrModule) {
    this.mainEventsService.downloadNewVersion(vrModule.latest_version);
  }

  installLatestVersion(vrModule) {
    this.mainEventsService.installNewVersion(vrModule.latest_version);
  }

  pauseDownloading(vrModule) {
    this.mainEventsService.pauseDownloadNewVersion(vrModule.latest_version);
  }

  resumeDownloading(vrModule) {
    this.mainEventsService.resumeDownloadNewVersion(vrModule.latest_version);
  }

  cancelDownloading(vrModule) {
    this.helperService.showAlert(
      `You are going to cancel downloading ${vrModule.name} updates`,
      'Warning',
      ['Continue Download',
        {
          text: 'Cancel Download',
          role: 'ok',
          cssClass: 'warning',
          handler: (clear) => {
            this.mainEventsService.cancelDownloadNewVersion(vrModule.latest_version);
          }
        }]
    );
  }

  installAndroid(module) {
    this.mainEventsService.installAndroidModule(module);
  }

  resetModule(module) {
    this.helperService.showAlert(
      `You are going to remove all ${module.name} files from your storage.`,
      'Warning',
      ['Cancel',
        {
          text: 'Clear',
          role: 'ok',
          cssClass: 'warning',
          handler: (clear) => {
            this.mainEventsService.resetOneTrackingModule(module);
          }
        }]
    );
  }

  resetModules() {
    if (this.mainEventsService.isDownloadingModules() || this.mainEventsService.isInstallingModules()) {
      return this.helperService.showError('We cannot clear modules while downloading or installing modules');
    }

    this.helperService.showAlert(
      'You are going to remove all downloaded modules from your storage.',
      'Warning',
      ['Cancel',
        {
          text: 'Clear All',
          role: 'ok',
          cssClass: 'warning',
          handler: (clear) => {
            this.mainEventsService.resetTrackingModules(this.modules);
          }
        }]
    );
  }

  toggleConsole() {
    this.showConsole = !this.showConsole;
    this.mainEventsService.sendEventAsync('show-console-log', this.showConsole);
  }

  getOnlineHeadsets() {
    console.log(this.mainEventsService.onlineHeadsets);
  }

  getDownloadingProgress(ratio) {
    if ( !isNaN(ratio) ) {
      return Math.round(ratio * 100)
    } else {
      return 0
    }
  }

  toggleShowPatientInfo() {
    this.showPatientInfo = !this.showPatientInfo
  }
}
