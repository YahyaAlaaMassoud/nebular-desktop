import { NgModule } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { PatientPage } from './patient.page';
import { TranslateModule } from '@ngx-translate/core';
import { EditPatientComponent } from '../edit-patient/edit-patient.component';
import { ComponentsModule } from '../../components/components.module';
import { ProgressBarModule } from "angular-progress-bar"
import { RoundPercentPipe } from '../../pipes/round_percent.pipe';
import { RoundFloatPipe } from '../../pipes/round-float.pipe';
import { NbButtonModule, NbLayoutModule, NbSidebarModule, NbCardModule, NbInputModule, 
  NbIconModule, NbActionsModule, NbListModule, NbUserModule, NbDatepickerModule, 
  NbRadioModule, NbCheckboxModule, NbDialogModule, NbAccordionModule, NbSelectModule,
  NbTooltipModule, NbProgressBarModule, NbSpinnerModule, NbBadgeModule } from '@nebular/theme';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

const routes: Routes = [

  {
    path: '',
    component: PatientPage
  }
];

const pages = [
  EditPatientComponent
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
    ProgressBarModule,
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
    NbAccordionModule,
    NbSelectModule,
    NbTooltipModule,
    NbProgressBarModule,
    NbSpinnerModule,
    NbBadgeModule,
    NgxDatatableModule
  ],
  declarations: [
    PatientPage,
    RoundPercentPipe,
    RoundFloatPipe,
    ...pages
  ],
  entryComponents: [...pages],
  providers: [TitleCasePipe]
})
export class PatientPageModule {}
