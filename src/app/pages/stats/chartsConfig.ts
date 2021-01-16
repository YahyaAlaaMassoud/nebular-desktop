import {Chart} from 'chart.js';

export class ChartsConfig {
    id: string;
    chartType: string;
    fieldNameX: string;
    fieldNameY: string;
    tooltipFields: string[];
    dataX: any[];
    dataY: any;
    tooltipData: any;
    color: string;
    backgroundColor: string;
    chartObject: Chart;
    show: boolean;
    legend: string;
    groupBy: string;
    canGroupBy: string[];
    canBeFieldY: string[];
}
