import { NgModule } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { HomePage } from './home.page';
import { AddPatientComponent } from './../add-patient/add-patient.component';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from '../../components/components.module';
import { NbButtonModule, NbLayoutModule, NbSidebarModule, NbCardModule, NbInputModule, 
         NbIconModule, NbActionsModule, NbListModule, NbUserModule, NbDatepickerModule, 
         NbRadioModule, NbCheckboxModule, NbDialogModule, NbContextMenuModule } from '@nebular/theme';

const routes: Routes = [
  {
    path: '',
    component: HomePage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    TranslateModule.forChild(),
    ReactiveFormsModule,
    ComponentsModule,
    NbLayoutModule,
    NbSidebarModule.forRoot(),
    NbInputModule,
    NbButtonModule,
    NbCardModule,
    NbIconModule,
    NbActionsModule,
    NbListModule,
    NbUserModule,
    NbDatepickerModule,
    NbRadioModule,
    NbCheckboxModule,
    NbDialogModule.forChild(),
    NbContextMenuModule
  ],
  declarations: [HomePage, AddPatientComponent],
  entryComponents: [AddPatientComponent],
  providers: [TitleCasePipe]
})
export class HomePageModule {}
