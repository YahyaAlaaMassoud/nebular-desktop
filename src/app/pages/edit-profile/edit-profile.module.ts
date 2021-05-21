import { NgModule } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { EditProfilePage } from './edit-profile.page';
import { AddPatientComponent } from './../add-patient/add-patient.component';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from '../../components/components.module';
import { NbButtonModule, NbLayoutModule, NbSidebarModule, NbCardModule, NbInputModule, 
         NbIconModule, NbActionsModule, NbListModule, NbUserModule, NbDatepickerModule, 
         NbRadioModule, NbCheckboxModule, NbDialogModule, NbContextMenuModule, NbSelectModule } from '@nebular/theme';

const routes: Routes = [
  {
    path: '',
    component: EditProfilePage
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
    NbSelectModule,
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
  declarations: [EditProfilePage],
  entryComponents: [AddPatientComponent],
  providers: [TitleCasePipe]
})
export class EditProfilePageModule {}
