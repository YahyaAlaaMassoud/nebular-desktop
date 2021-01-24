import { ChartsService } from './../../services/charts/charts.service';
import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { UserService } from '../../services/user/user.service';
import { HelperService } from './../../services/helper/helper.service';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.scss'],
})
export class ChartsComponent implements OnInit {
  patientId;
  moduleId;
  selectedSession: any;
  sessionsScopes: any[] = [];
  selectedSessionsScope = 'One Session';
  sessions: any[] = [];
  sessionStatistics: any[] = [];
  allSessionsStatistics: any[] = [];
  showStats = false;
  datePickerOptions = {
    startDate: moment().subtract(29, 'days').format('YYYY-MM-DD'),
    endDate: moment().format('YYYY-MM-DD')
  };
  nbDatePickerOptions = {
    orgStart: new Date(2019, 1),
    start: new Date(2019, 1),
    orgEnd: new Date(),
    end: new Date()
  };
  datePickerSettings = {
    type: 'daily',
    timePicker: false,
    inputDateFormat: 'YYYY-MM-DD',
    outputDateFormat: 'YYYY-MM-DD',
    placeholder: 'Select Sessions Dates',
    showRanges: true
  };
  constructor(
    public chartsService: ChartsService,
    private userService: UserService,
    private helperService: HelperService,
    private route: ActivatedRoute,
    private router: Router,
    private _cdr: ChangeDetectorRef,
    private datepipe: DatePipe
  ) { }

  ngOnInit() {
    this.patientId = this.route.snapshot.paramMap.get('patient_id');
    this.moduleId = this.route.snapshot.paramMap.get('module_id');
    this.sessionsScopes = this.chartsService.sessionsScopes;
    // this.loadPatient(this.patientId);
    this.initDefaultChartData();
    console.log(this.nbDatePickerOptions)
  }

  async initDefaultChartData() {
    try {
      this.sessions = (await this.userService.getPatientModuleSessions(
        this.patientId,
        this.moduleId
      )) as any[];
      this.changeSessionScope();
    } catch (err) {
      // this.helperService.showError(err);
      this.helperService.showNbToast('Error happened when loading charts. Please Try again.', 'danger');
    }
  }

  async changeSessionScope() {
    await this.helperService.showNgLoading();
    switch (this.selectedSessionsScope) {
      case 'One Session':
        this.selectedSession = this.sessions[0];
        await this.getStatistics();
        break;
      case 'All Sessions':
        await this.getAllSessionsStatistics();
        break;
      case 'Within Dates':
        await this.getSessionsStatisticsWithinDates(this.datePickerOptions.startDate, this.datePickerOptions.endDate);
        break;
    }
    this.helperService.removeNgLoading();
    console.log(this.sessions)
    this._cdr.detectChanges()
  }

  async getStatistics() {
    if (!this.selectedSession) {
      return;
    }

    try {
      // await this.helperService.showLoading();
      // await this.helperService.showNgLoading();
      this.showStats = false;
      this.sessionStatistics = (await this.chartsService.loadSessionStatistics(
        this.selectedSession.id
      )) as any[];
      this.showStats = true;
      // this.helperService.removeLoading();
      // this.helperService.removeNgLoading();
    } catch (err) {
      // this.helperService.showError(err);
      this.helperService.showNbToast('Error happened when loading statistics. Please Try again.', 'danger');
    }
  }

  onDateFilterChange(ev) {
    if ( ev.start ) {
      this.nbDatePickerOptions.start = ev.start
    }
    if ( ev.end ) {
      this.nbDatePickerOptions.end = ev.end
    }
    var start = this.datepipe.transform(this.nbDatePickerOptions.start, 'yyyy-MM-dd')
    var end = this.datepipe.transform(this.nbDatePickerOptions.end, 'yyyy-MM-dd')
    console.log(start, end)
    this.getSessionsStatisticsWithinDates(start, end);
  }

  async getAllSessionsStatistics() {
    this.sessionStatistics = (await this.getFilteredSessionsStatistics()) as any[];
  }

  async getSessionsStatisticsWithinDates(fromDate, toDate) {
    this.sessionStatistics = (await this.getFilteredSessionsStatistics({
      from_date: fromDate,
      to_date: toDate,
    })) as any[];
  }

  async getFilteredSessionsStatistics(
    options: any = { grouped_by: '', from_date: '', to_date: '' }
  ) {
    // groupedBy: week, month, session
    // groupedBy null will get all sessions in one array
    try {
      this.showStats = false;
      // await this.helperService.showLoading();
      // await this.helperService.showNgLoading();
      const params = {
        patient_id: this.patientId,
        vr_module_id: this.moduleId,
        ...options,
      };
      const result: any[] = (await this.chartsService.loadAllSessionsStatistics(
        params
      )) as any[];
      this.showStats = true;
      // this.helperService.removeLoading();
      // this.helperService.removeNgLoading();
      return result;
    } catch (err) {
      // this.helperService.showError(err);
      this.helperService.showNbToast('Error happened when loading statistics. Please Try again.', 'danger');
    }
  }


  // TODO
  async getAllSessionsStatisticsGroupedBySession() {
    this.sessionStatistics = (await this.getFilteredSessionsStatistics({
      grouped_by: 'session',
    })) as any[];
    if (!this.sessionStatistics.length) {
      return;
    }

    // use statistics here

    // [
    // {
    //   "session_date": "2019-07-13T01:37:52.000+02:00",
    //     "session_statistics": [
    //       {
    //         "score": 0.15,
    //         "character": "Hussein",
    //         "Collectable": "Gem",
    //         "distractor": "Camel",
    //         "maze_path": "Circle",
    //         "environment": "Desert",
    //         "session_start_time": "2019-07-10T21:07:54.940Z",
    //         "attempt_start_time": "2019-07-10T21:22:54.940Z",
    //         "attempt_end_time": "2019-07-10T21:23:32.940Z",
    //         "attempt_expected_time": "2019-07-10T21:23:24.940Z",
    //         "expected_duration_in_seconds": 30,
    //         "actual_duration_in_seconds": 38,
    //         "level": "1"
    //       },
    //       {
    //         ...
    //       }
    //     ]
    // },
    // {
    //  "session_date": "2019-06-13T01:37:52.000+02:00",
    //  "session_statistics": [{...},{...}]
    // }
    // ]
  }

  async getAllSessionsStatisticsGroupedByWeek() {
    this.sessionStatistics = (await this.getFilteredSessionsStatistics({
      grouped_by: 'week',
    })) as any[];
    if (!this.sessionStatistics.length) {
      return;
    }

    // use statistics here

    // [
    //   [
    //     "July 20, 2019", // beginning of week date (saturday)
    //     0.1
    //   ],
    //   [
    //     "July 06, 2019",
    //     0.7627272727272726
    //   ]
    // ]
  }

  async getAllSessionsStatisticsGroupedByMonth() {
    this.sessionStatistics = (await this.getFilteredSessionsStatistics({
      grouped_by: 'month',
    })) as any[];
    if (!this.sessionStatistics.length) {
      return;
    }

    // use statistics here

    // [
    //   [
    //     "July 01, 2019", // beginning of month date
    //     0.1
    //   ],
    //   [
    //     "June 01, 2019",
    //     0.7627272727272726
    //   ]
    // ]
  }

  goBack() {
    this.router.navigate(['/patient', this.patientId]);
  }
}
