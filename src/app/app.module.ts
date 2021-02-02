import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { NbCardBodyComponent, NbCardComponent, NbThemeModule, NbDatepickerModule, NbMenuModule } from '@nebular/theme';
import { NbSidebarModule, NbLayoutModule, NbButtonModule, NbDialogModule, NbToastrModule } from '@nebular/theme';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NbEvaIconsModule } from '@nebular/eva-icons';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { NgxElectronModule } from 'ngx-electron';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { ComponentsModule } from './components/components.module';
import { InterceptorModule } from './interceptor.module';
import { ChartsModule } from 'ng2-charts';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { RouterModule } from '@angular/router';
import { NgxSpinnerModule } from 'ngx-spinner';
import { CommonModule } from '@angular/common';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    BrowserAnimationsModule,
    NgxElectronModule,
    HttpClientModule,
    InterceptorModule,
    ComponentsModule,
    ChartsModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient]
      }
    }),
    NbThemeModule.forRoot({ name: 'default' }),
    NbLayoutModule,
    NbEvaIconsModule,
    NbDatepickerModule.forRoot(),
    NbDialogModule.forRoot(),
    NbToastrModule.forRoot(),
    NgxSpinnerModule,
    NgxDatatableModule,
    NbMenuModule.forRoot(),
  ],
  providers: [IonicRouteStrategy],
  bootstrap: [AppComponent]
})
export class AppModule { }
