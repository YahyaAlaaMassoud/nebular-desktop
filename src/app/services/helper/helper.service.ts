import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  LoadingController, ToastController,
  AlertController
} from '@ionic/angular';
import { ConfigService } from '../config/config.service';
import { NbGlobalLogicalPosition, NbToastRef, NbToastrService, NbDialogService } from '@nebular/theme';
import { NgxSpinnerService } from 'ngx-spinner';

@Injectable({
  providedIn: 'root'
})
export class HelperService {
  loading: any;
  config: any = {};
  connectionState: string;
  constructor(private translateService: TranslateService,
              private loadingController: LoadingController,
              private alertController: AlertController,
              private toastController: ToastController,
              configService: ConfigService,
              private nbToastService: NbToastrService,
              private ngSpinner: NgxSpinnerService
  ) {
    configService.getConfig().then((config) => {
      this.config = config;
    });
  }

  async showToast(message: string, position: 'bottom' | 'middle' | 'top' = 'bottom') {

    // await this.removeLoading();
    await this.removeNgLoading();

    const toast = await this.toastController.create({
      message,
      position,
      duration: 5000,
      showCloseButton: true,
      closeButtonText: this.translate('CANCEL'),
      translucent: true,
      keyboardClose: true
    });
    return await toast.present();
  }

  async showNbToast(message: string, status: 'warning' | 'danger' | 'success' = 'success') {

    // await this.removeLoading();
    await this.removeNgLoading();

    const toastRef: NbToastRef = this.nbToastService.show(
      '',
      message,
      { 
        destroyByClick: true,
        hasIcon: true,
        icon: 'info-outline',
        duration: 8000,
        position: NbGlobalLogicalPosition.TOP_END,
        status: status
      });

  }

  async showAlert(message: string, header?: string,
                  buttons?: any[], backdropDismiss = true, inputs = []) {
    buttons = buttons || [this.translate('OK')];

    // await this.removeLoading();
    await this.removeNgLoading();

    const alert = await this.alertController.create({
      message,
      header,
      buttons,
      backdropDismiss,
      translucent: true,
      keyboardClose: true,
      inputs
    });

    await alert.present();
    return alert;
  }

  async showNgLoading(message?) {
    if (this.loading) { 
      return; 
    }

    this.loading = true;
    this.ngSpinner.show(
      undefined,
      {
        type: 'ball-grid-pulse',//'ball-atom',
        size: 'large',
        bdColor: 'rgb(245, 245, 245, 0.90)',
        color: 'rgb(0, 149, 255, 1)',
        fullScreen: true
      }
    );
  }

  async removeNgLoading() {
    // if (!this.loading) { 
    //   return; 
    // }

    this.loading = false;
    // this.ngSpinner.hide();
    setTimeout(() => {
      this.ngSpinner.hide();
    }, 500);
  }

  async showLoading(message?) {
    if (this.loading) { return this.loading; }

    this.loading = await this.loadingController.create({
      translucent: true,
      keyboardClose: true,
      message
    });
    await this.loading.present();
    return this.loading;
  }

  async removeLoading() {
    if (!this.loading) { return false; }

    await this.loading.dismiss();
    this.loading = null;
    return true;
  }

  translate(keys: string | string[], options = {}) {
    return this.translateService.instant(keys, options);
  }

  chanageConnectionstate(newState) {
    if (newState === 'none') { newState = null; }

    this.connectionState = newState;
  }

  isNativePlatform() {
    if (this.config.nativePaltform === 'electron') { return false; }

  }

  showError(err) {
    if (!err) { return; }

    this.showAlert(err || this.translate('SYS_ERROR'), this.translate('ERROR'), [this.translate('CANCEL')]);
  }
}
