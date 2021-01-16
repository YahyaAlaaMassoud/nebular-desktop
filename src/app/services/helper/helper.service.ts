import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  LoadingController, ToastController,
  AlertController
} from '@ionic/angular';
import { ConfigService } from '../config/config.service';

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
              configService: ConfigService
  ) {
    configService.getConfig().then((config) => {
      this.config = config;
    });
  }

  async showToast(message: string, position: 'bottom' | 'middle' | 'top' = 'bottom') {

    await this.removeLoading();

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

  async showAlert(message: string, header?: string,
                  buttons?: any[], backdropDismiss = true, inputs = []) {
    buttons = buttons || [this.translate('OK')];

    await this.removeLoading();

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
