import { NgModule } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { TranslateModule } from '@ngx-translate/core';
import { ChartsComponent } from './charts.component';
import { ChartsModule } from 'ng2-charts';
import { StatsComponent } from '../stats/stats.component';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgxDatetimeRangePickerModule } from "ngx-datetime-range-picker";
import { NbButtonModule, NbLayoutModule, NbSidebarModule, NbCardModule, NbInputModule, 
  NbIconModule, NbActionsModule, NbListModule, NbUserModule, NbDatepickerModule, 
  NbRadioModule, NbCheckboxModule, NbDialogModule, NbAccordionModule, NbSelectModule,
  NbTooltipModule, NbProgressBarModule, NbSpinnerModule, NbBadgeModule } from '@nebular/theme';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { RoundFloatPipe } from '../../pipes/round-float.pipe';

const routes: Routes = [

  {
    path: '',
    component: ChartsComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    TranslateModule.forChild(),
    ChartsModule,
    MatTableModule,
    MatSortModule,
    MatFormFieldModule,
    NgxDatetimeRangePickerModule.forRoot(),
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
    NgxDatatableModule,
  ],
  declarations: [ChartsComponent, StatsComponent],
  providers: [
    TitleCasePipe,
    RoundFloatPipe
  ]
})
export class ChartsComponentModule {}
