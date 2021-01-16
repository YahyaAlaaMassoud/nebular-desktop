import { Component, OnInit, ViewChild, ElementRef, Input, OnDestroy } from '@angular/core';
import { Chart, InteractionMode, ChartDataSets } from 'chart.js';

import { configs } from './configs';
import { ChartsConfig } from './chartsConfig';
import { MatTableDataSource } from '@angular/material/table';
import * as XLSX from 'xlsx';

// Important link
// https://codepen.io/jordanwillis/pen/xqrjGp
// https://stackoverflow.com/questions/42839551/how-to-show-multiple-values-in-point-hover-using-chart-js

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnInit, OnDestroy {

  @Input() allData: any[];
  @Input() moduleId: number;
  @Input() sessionName: string;
  @Input() sessionsScope: string;
  @ViewChild('canvas', { static: true }) canvas: ElementRef;
  public context: CanvasRenderingContext2D;

  curModuleName: string;
  fieldsConfig: any;
  validData: any[];
  sortedData: any[];
  chartsSettings: ChartsConfig[];
  selectedChart;
  selectedChartConfigs: ChartsConfig;
  displayedColumns: string[];
  acceptableYFields: string[];
  emptyChart = false;
  colorsPool = ['gray', 'black', 'green', 'red', 'blue'];
  constructor() {
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

    this.chartsSettings.forEach((chart: ChartsConfig) => {
      const tooltipData = {};
      this.validData.forEach((sessionData: any) => {
        const y = sessionData[chart.fieldNameY].toFixed(2);
        let x: any = (new Date(sessionData[chart.fieldNameX]));
        x = this.sessionsScope === 'One Session' ?  x.toLocaleTimeString() : x.toLocaleString();
        if (y < 0) { return; }
        const dataGroup = sessionData[chart.groupBy] || chart.fieldNameY;
        chart.dataY[dataGroup] = chart.dataY[dataGroup] || [];
        chart.dataY[dataGroup].push({ x, y});
        chart.dataX.push(x);
        chart.tooltipFields.forEach((tooltipField: string) => {
          tooltipData[dataGroup] = tooltipData[dataGroup] || {};
          tooltipData[dataGroup][tooltipField] = tooltipData[dataGroup][tooltipField] || [];
          tooltipData[dataGroup][tooltipField].push(sessionData[tooltipField].toString());
        });
      });

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

    const datasets: ChartDataSets[] = Object.entries(this.selectedChartConfigs.dataY).map((entry, index) => {

      indexedTooltipData.push(this.selectedChartConfigs.tooltipData[entry[0]]);
      const color = this.colorsPool.pop();
      return {
        label: `${this.selectedChartConfigs.groupBy.split('_').join(' ') || ''} ${entry[0].split('_').join(' ')}`,
        data: entry[1],
        fill: false,
        backgroundColor: color,
        borderColor: color,
        borderWidth: 1
      } as ChartDataSets;
    });
    this.selectedChartConfigs.tooltipData = indexedTooltipData;
    const options = {
        responsive: true,
        legend: {
          display: true,
          labels: {
            fontSize: 12
          }
        },
        title: {
          display: true,
          text: `${this.selectedChartConfigs.legend} (${this.selectedChartConfigs.fieldNameY.split('_').join(' ') })`,
          fontSize: 14,
          fontColor: this.selectedChartConfigs.color
        },
        hover: {
          mode: 'index' as InteractionMode,
          intersect: true
        },
        tooltips: {
          enabled: true,
          mode: 'single' as InteractionMode,
          titleFontSize: 14,
          bodyFontSize: 14,
          intersect: true,
          displayColors: false,
          callbacks: {
            label: (tooltipItems: Chart.ChartTooltipItem, data: Chart.ChartData) => {
              const tooltipDataArr = [`${this.selectedChartConfigs.fieldNameY.split('_').join(' ') }: ${tooltipItems.yLabel }`];
              this.selectedChartConfigs.tooltipFields.forEach((tooltipField: string, index: number) => {
                const tooltip = this.selectedChartConfigs.tooltipData[tooltipItems.datasetIndex][tooltipField][tooltipItems.index];
                if (tooltip.length) {
                  tooltipDataArr.push(tooltipField.split('_').join(' ')  + ': ' + tooltip);
                }
              });
              return tooltipDataArr;
            }
          }
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
            }
          }],
          yAxes: [{
            display: true,
            ticks: {
              suggestedMin: 0,
              beginAtZero: true
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

  export() {
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
}
