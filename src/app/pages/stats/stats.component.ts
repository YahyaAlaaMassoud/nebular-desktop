import { Component, OnInit, ViewChild, ElementRef, Input, OnDestroy } from '@angular/core';
import { Chart, InteractionMode, ChartDataSets } from 'chart.js';

import { configs } from './configs';
import { ChartsConfig } from './chartsConfig';
import { MatTableDataSource } from '@angular/material/table';
import * as XLSX from 'xlsx';

import { ColumnMode, TableColumn, SelectionType } from '@swimlane/ngx-datatable';
import { TitleCasePipe } from '@angular/common';
import { RoundFloatPipe } from '../../pipes/round-float.pipe';

import { StateService } from '../../services/helper/state.service';
import { $ } from 'protractor';

// Important link
// https://codepen.io/jordanwillis/pen/xqrjGp
// https://stackoverflow.com/questions/42839551/how-to-show-multiple-values-in-point-hover-using-chart-js

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss']
})
export class StatsComponent implements OnInit, OnDestroy {

  @Input() allData: any[];
  @Input() moduleId: number;
  @Input() sessionName: string;
  @Input() sessionsScope: string;
  @ViewChild('canvas', { static: true }) canvas: ElementRef;
  public context: CanvasRenderingContext2D;

  ColumnMode = ColumnMode;
  SelectionType = SelectionType;

  state: any = {};
  curModuleName: string;
  fieldsConfig: any;
  validData: any[];
  sortedData: any[];
  chartsSettings: ChartsConfig[];
  selectedChart;
  selectedChartConfigs: ChartsConfig;
  displayedColumns: string[];
  ngxColumns: any[];
  allNgxColumns: any[];
  ngxRows: any[];
  acceptableYFields: string[];
  emptyChart = false;
  colorsPool = ['gray', 'black', 'green', 'red', 'blue'];
  constructor(
    private titleCasePipe: TitleCasePipe,
    private roundFloatPipe: RoundFloatPipe,
    private stateService: StateService,
    ) {
  }

  ngOnInit() {
    this.initModule(this.moduleId);
  }

  ngOnDestroy() {
    this.chartsSettings.forEach((chart: ChartsConfig) => {
      chart.dataX = [];
      chart.dataY = {};
      chart.tooltipData = {};
    });
  }

  initModule(moduleId: number) {
    this.fieldsConfig = configs[moduleId].fieldsConfig;
    this.curModuleName = configs[moduleId].moduleName;
    this.displayedColumns = Object.keys(this.fieldsConfig);
    this.chartsSettings = configs[moduleId].chartsConfigs;
    this.selectedChart = this.chartsSettings[0].id;
    this.rebuildChart();
  }

  validateAndResetData() {
    this.validData = this.validateAndFilterData(this.allData);
    this.sortedData = this.validData.slice();
    this.emptyChart = !this.validData.length;

    var savedState = this.stateService.state$.getValue()
    if ( savedState && savedState[this.moduleId] ) {
      this.ngxColumns = savedState[this.moduleId]
    } else {
      this.ngxColumns = this.getNgxCols(this.displayedColumns);

      this.state = savedState || {}
      Object.assign(this.state, {
        [this.moduleId]: this.ngxColumns
      })
      
      this.stateService.state$.next(this.state)
    }
    this.allNgxColumns = this.getNgxCols(this.displayedColumns);

    this.ngxRows = []
    this.validData.forEach((row) => {
      var newRow = {}
      this.allNgxColumns.forEach((col) => {
        if ( typeof row[col.name] == 'number' ) {
          row[col.name] = this.roundFloatPipe.transform(row[col.name]);
        } else if ( typeof row[col.name] == 'string' ) {
          row[col.name] = this.titleCasePipe.transform(row[col.name]);
        }
        newRow[col.name] = row[col.name]
      })
      this.ngxRows.push(newRow)
    })
  }

  removeUnderScore(str) {
    str = str.split('_').join(' ');
    str = this.titleCasePipe.transform(str);
    return str;
  }

  getNgxCols(columns) {

    var newColumns = [];
    
    for ( var i = 0; i < columns.length; i++ ) {
      newColumns.push({
        name: columns[i],
        prop: columns[i],
        shownName: this.removeUnderScore(columns[i])
        // shownName: columns[i]
      })
    }

    return newColumns
  }

  validateAndFilterData(allData) {
    const filteredData: any[] = [];
    allData.forEach((dataObj: any) => {
      if (this.validateObject(dataObj)) {
        filteredData.push(dataObj);
      }
    });
    return filteredData;
  }

  validateObject = (dataObj: any) => {
    const fieldY = this.selectedChartConfigs.fieldNameY;
    const fieldX = this.selectedChartConfigs.fieldNameX;

    return (this.fieldsConfig[fieldY] === typeof (dataObj[fieldY]) && this.fieldsConfig[fieldX] === typeof (dataObj[fieldX]));
  }

  collectStatsData() {
    this.validateAndResetData();
    if (!this.validData.length) { return; }

    this.validData.sort(function(a,b){
      return new Date(a.attempt_start_time).getTime() - new Date(b.attempt_start_time).getTime();
    });

    this.chartsSettings.forEach((chart: ChartsConfig) => {
      const tooltipData = {};
      this.validData.forEach((sessionData: any) => {
        const y = sessionData[chart.fieldNameY].toFixed(2);
        let x: any = (new Date(sessionData[chart.fieldNameX]));
        x = this.sessionsScope === 'One Session' ?  x.toLocaleTimeString() : x.toLocaleDateString();
        if (y < 0) { return; }
        const dataGroup = sessionData[chart.groupBy] || chart.fieldNameY;
        chart.dataY[dataGroup] = chart.dataY[dataGroup] || [];
        chart.dataY[dataGroup].push({ x, y });
        chart.dataX.push(x);
        chart.tooltipFields.forEach((tooltipField: string) => {
          tooltipData[dataGroup] = tooltipData[dataGroup] || {};
          tooltipData[dataGroup][tooltipField] = tooltipData[dataGroup][tooltipField] || [];
          tooltipData[dataGroup][tooltipField].push(sessionData[tooltipField].toString());
        });
      });
      // console.log(tooltipData)
      // console.log('chart.dataY', chart.dataY)
      // console.log('chart.dataX', chart.dataX)

      chart.tooltipFields.forEach((tooltipField: string) => {
        chart.tooltipData = tooltipData;
      });
    });
  }

  buildCharts() {
    const indexedTooltipData = [];
    this.selectedChartConfigs = this.chartsSettings.find((chartConfig) => (chartConfig.id === this.selectedChart));
    this.collectStatsData();
    if (!this.validData.length) { return; }

    // console.log(this.selectedChartConfigs.dataY)
    // console.log(this.selectedChartConfigs.dataX)
    // console.log(this.selectedChartConfigs.tooltipData)

    const datasets: ChartDataSets[] = Object.entries(this.selectedChartConfigs.dataY).map((entry, index) => {
      // console.log('entry', entry)
      // console.log(this.selectedChartConfigs.tooltipData[entry[0]])
      indexedTooltipData.push(this.selectedChartConfigs.tooltipData[entry[0]]);
      const color = this.colorsPool.pop();
      // console.log('data', entry[1])
      return {
        label: `${this.selectedChartConfigs.groupBy.split('_').join(' ') || ''} ${entry[0].split('_').join(' ')}`,
        data: entry[1],
        fill: false,
        backgroundColor: color,
        borderColor: color,
        borderWidth: 2,
        pointRadius: 8,
        pointHoverRadius: 10,
      } as ChartDataSets;
    });
    // console.log('indexedTooltipData', indexedTooltipData)
    this.selectedChartConfigs.tooltipData = indexedTooltipData;
    const options = {
        responsive: true,
        legend: {
          display: true,
          labels: {
            fontSize: 16,
            fontFamily: "'Quicksand'",
            fontStyle: 'bold'
          }
        },
        title: {
          display: false,
          text: `${this.selectedChartConfigs.legend} - ${this.selectedChartConfigs.fieldNameY.split('_').join(' ') }`,
          fontSize: 18,
          fontColor: this.selectedChartConfigs.color,
          fontFamily: "'Quicksand'"
        },
        hover: {
          mode: 'index' as InteractionMode,
          intersect: true
        },
        tooltips: {
          enabled: true,
          mode: 'single' as InteractionMode,
          titleFontFamily: "'Quicksand'",
          bodyFontFamily: "'Quicksand'",
          titleFontSize: 14,
          bodyFontSize: 14,
          intersect: true,
          displayColors: false,
          callbacks: {
            label: (tooltipItems: Chart.ChartTooltipItem, data: Chart.ChartData) => {
              // console.log('tooltipItems', tooltipItems)
              // console.log('tooltipData', data)
              const tooltipDataArr = [`${this.titleCasePipe.transform(this.selectedChartConfigs.fieldNameY.split('_').join(' ')) }: ${tooltipItems.yLabel }`];
              this.selectedChartConfigs.tooltipFields.forEach((tooltipField: string, index: number) => {
                const tooltip = this.selectedChartConfigs.tooltipData[tooltipItems.datasetIndex][tooltipField][tooltipItems.index];
                if (tooltip && tooltip.length) {
                  tooltipDataArr.push(this.titleCasePipe.transform(tooltipField.split('_').join(' ')  + ': ' + tooltip));
                }
              });
              return tooltipDataArr;
            },
            title: (item: Chart.ChartTooltipItem[], data: Chart.ChartData) => {
              return '';
            }
          },
        },
        scales: {
          xAxes: [{
            display: true,
            barPercentage: 0.2,
            barThickness: 10,
            maxBarThickness: 20,
            offset: true,
            gridLines: {
              offsetGridLines: true
            },
            ticks: {
              fontFamily: "'Quicksand'",
              fontStyle: 'bold'
            }
          }],
          yAxes: [{
            display: true,
            ticks: {
              suggestedMin: 0,
              beginAtZero: true,
              fontFamily: "'Quicksand'",
              fontStyle: 'bold'
            }
          }],
        }
      };

    setTimeout(() => {
      const chart = new Chart(this.selectedChartConfigs.id, {
        type: this.selectedChartConfigs.chartType,
        data: {
          labels: this.selectedChartConfigs.dataX,
          datasets
        },
        options
      });
      this.selectedChartConfigs.chartObject = chart;
    }, 400);
  }

  rebuildChart() {
    this.chartsSettings.forEach((chart: ChartsConfig) => {
      chart.dataX = [];
      chart.dataY = {};
      chart.tooltipData = {};
      if (chart.chartObject) { chart.chartObject.destroy(); }
    });

    setTimeout(() => {
      this.colorsPool = ['gray', 'black', 'green', 'red', 'blue'];
      this.buildCharts();
    }, 400);

  }

  reSort(sort) {
    const data = this.validData.slice();
    if (!sort.active || sort.direction === '') {
      this.sortedData = data;
      return;
    }

    const isAsc = sort.direction === 'asc';
    this.sortedData = data.sort((a, b) => {
      return this.compare(a[sort.active], b[sort.active], isAsc);
    });
  }

  compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  export(e) {
    e.stopPropagation();
    e.preventDefault();
    const rowData = this.sortedData.map((data) => {
      const row = [];
      this.displayedColumns.forEach((field) => {
        row.push(data[field]);
      });
      return row;
    }
    );
    rowData.unshift(this.displayedColumns.map((f) => f.split('_').join(' ')));
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(rowData);
    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    /* save to file */
    XLSX.writeFile(wb, `${this.curModuleName}(${this.sessionName}).xlsx`);
  }

  exportV2(e) {
    e.stopPropagation();
    e.preventDefault();
    const rowData = this.sortedData.map((data) => {
      const row = [];
      this.ngxColumns.forEach((field) => {
        row.push(data[field.name]);
      });
      return row;
    }
    );
    rowData.unshift(this.ngxColumns.map((f) => f.name.split('_').join(' ')));
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(rowData);
    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    /* save to file */
    XLSX.writeFile(wb, `${this.curModuleName}(${this.sessionName}).xlsx`);
  }

  getRowClass (row) {
    return {
      'datatable-body-row': true
    } 
  }

  isChecked(col) {
    return (
      this.ngxColumns.find(c => {
        return c.name === col.name;
      }) !== undefined
    );
  }

  sortColsFunc(cols) {
    var newCols: any[] = []
    this.allNgxColumns.forEach((orgCol) => {
      var found = false;
      var items = cols.filter((ngxCol) => {
          if (!found && ngxCol.name == orgCol.name) {
            newCols.push(ngxCol);
              found = true;
              return false;
          } else {
            return true;
          }
      });
    });
    return newCols
  }

  toggle(col) {
    const isChecked = this.isChecked(col);

    if (isChecked) {
      this.ngxColumns = this.ngxColumns.filter(c => {
        return c.name !== col.name;
      });
    } else {
      this.ngxColumns = [...this.ngxColumns, col];
    }

    this.ngxColumns = this.sortColsFunc(this.ngxColumns)
    // var newPair = {
    //   [this.moduleId]: this.ngxColumns
    // }
    // this.state = {
    //   ...newPair
    // };
    Object.assign(this.state, {
      [this.moduleId]: this.ngxColumns
    })
    this.stateService.state$.next(this.state)
  }
}
