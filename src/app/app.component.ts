import { Component } from '@angular/core';

import { Platform, Events } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { HelperService } from './services/helper/helper.service';
import { UserService } from './services/user/user.service';
import { ConfigService } from './services/config/config.service';
import { Router } from '@angular/router';
import { MainEventsService } from './services/main-events/main-events.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {
  dir;
  currentUser;
  constructor(
    private platform: Platform,
    private translate: TranslateService,
    private helperService: HelperService,
    private userService: UserService,
    private mainEventsService: MainEventsService,
    private router: Router,
    private events: Events,
    configService: ConfigService
  ) {
    this.initializeApp();
    this.trackcurrentUser();
    this.mainEventsService.listenOnMainEvents();
    configService.getConfig().then((config: any) => {
      this.translate.use(config.lang);
      this.dir = config.dir;
    });
    this.trackMainEventsErrors();
  }


  initializeApp() {
    this.platform.ready().then(() => {
      this.translate.setDefaultLang('en');
    });
  }

  trackcurrentUser() {
    this.events.subscribe('userUpdate', (user) => {
      this.currentUser = user;
      this.navigateCurrentUser();
    });
  }

  navigateCurrentUser() {
    if (this.currentUser) {
      return this.router.navigate(['home']);
    }
    this.router.navigate(['']);
  }

  trackMainEventsErrors() {
    this.events.subscribe('main-error', (err) => {
      // this.helperService.showError(JSON.stringify(err));
      this.helperService.showNbToast('Error happened when tracking module versions', 'danger');
    });
  }
}
