import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { TranslateModule } from '@ngx-translate/core';
import { ChartsComponent } from './charts.component';
import { ChartsModule } from 'ng2-charts';
import { StatsComponent } from '../stats/stats.component';
import { MatTableModule, MatSortModule, MatFormFieldModule } from '@angular/material';
import { NgxDatetimeRangePickerModule } from "ngx-datetime-range-picker";

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
    NgxDatetimeRangePickerModule.forRoot()
  ],
  declarations: [ChartsComponent, StatsComponent],
})
export class ChartsComponentModule {}
