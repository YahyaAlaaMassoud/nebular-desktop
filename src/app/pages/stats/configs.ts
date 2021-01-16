
export let configs = {
  7: {
    moduleName: 'Archeeko',
    chartsConfigs: [
      {
        id: '1',
        chartType: 'line',
        fieldNameX: 'attempt_start_time',
        fieldNameY: 'impulsivity_score',
        tooltipFields: ['level', 'distance'],
        dataX: [],
        dataY: {},
        tooltipData: {},
        color: 'blue',
        backgroundColor: 'white',
        chartObject: null,
        show: true,
        legend: 'Archeeko',
        canGroupBy: ['', 'level', 'distance'],
        canBeFieldY: ['impulsivity_score', 'impulsivity_score_with_aiming',
          'response_time', 'omission_score', 'distraction_endurance_score'],
        groupBy: ''
      }
    ],
    fieldsConfig: {
      session_start_time: 'string',
      attempt_start_time: 'string',
      attempt_end_time: 'string',
      expected_duration_in_seconds: 'number',
      actual_duration_in_seconds: 'number',
      level: 'string',
      attempt_type: 'string',
      total_arches_count: 'number',
      consumed_arches: 'number',
      remaining_arches: 'number',
      success_arches_count: 'number',
      distance: 'number',
      total_prizes: 'number',
      remaining_prizes: 'number',
      impulsivity_score: 'number',
      impulsivity_score_with_aiming: 'number',
      response_time: 'number',
      omission_score: 'number',
      distraction_endurance_score: 'number',
      actual_attention_time: 'number'
    }
  },
  8: {
    moduleName: 'GardenDo',
    chartsConfigs: [
      {
        id: '1',
        chartType: 'line',
        fieldNameX: 'attempt_start_time',
        fieldNameY: 'impulsivity_score',
        tooltipFields: ['level'],
        dataX: [],
        dataY: {},
        tooltipData: {},
        color: 'blue',
        backgroundColor: 'white',
        chartObject: null,
        show: true,
        legend: 'GardenDo',
        canGroupBy: ['', 'level'],
        canBeFieldY: ['impulsivity_score', 'response_time',
          'omission_score', 'distraction_endurance_score'],
        groupBy: ''
      }
    ],
    fieldsConfig: {
      session_start_time: 'string',
      attempt_start_time: 'string',
      attempt_end_time: 'string',
      expected_duration_in_seconds: 'number',
      actual_duration_in_seconds: 'number',
      level: 'string',
      attempt_type: 'string',
      flower_sustained: 'number',
      well_sustained: 'number',
      total_sustained: 'number',
      non_sustained: 'number',
      impulsivity_score: 'number',
      response_time: 'number',
      omission_score: 'number',
      distraction_endurance_score: 'number',
      actual_attention_time: 'number'
    }
  },
  13: {
    moduleName: 'IllyTale',
    chartsConfigs: [
      {
        id: '1',
        chartType: 'line',
        fieldNameX: 'attempt_start_time',
        fieldNameY: 'impulsivity_score',
        tooltipFields: ['level'],
        dataX: [],
        dataY: {},
        tooltipData: {},
        color: 'blue',
        backgroundColor: 'white',
        chartObject: null,
        show: true,
        legend: 'IllyTale',
        canGroupBy: ['', 'level'],
        canBeFieldY: ['impulsivity_score', 'response_time', 'omission_score', 'distraction_endurance_score'],
        groupBy: ''
      }
    ],
    fieldsConfig: {
      session_start_time: 'string',
      attempt_start_time: 'string',
      attempt_end_time: 'string',
      expected_duration_in_seconds: 'number',
      actual_duration_in_seconds: 'number',
      level: 'string',
      attempt_type: 'string',
      fairy_sustained: 'number',
      total_sustained: 'number',
      non_sustained: 'number',
      impulsivity_score: 'number',
      response_time: 'number',
      omission_score: 'number',
      distraction_endurance_score: 'number',
      actual_attention_time: 'number'
    }
  },
  14: {
    moduleName: 'Viblio',
    chartsConfigs: [
      {
        id: '1',
        chartType: 'line',
        fieldNameX: 'attempt_start_time',
        fieldNameY: 'impulsivity_score',
        tooltipFields: ['level'],
        dataX: [],
        dataY: {},
        tooltipData: {},
        color: 'blue',
        backgroundColor: 'white',
        chartObject: null,
        show: true,
        legend: 'Viblio',
        canGroupBy: ['', 'level'],
        canBeFieldY: ['impulsivity_score', 'response_time', 'omission_score', 'distraction_endurance_score'],
        groupBy: ''
      }
    ],
    fieldsConfig: {
      session_start_time: 'string',
      attempt_start_time: 'string',
      attempt_end_time: 'string',
      expected_duration_in_seconds: 'number',
      actual_duration_in_seconds: 'number',
      level: 'string',
      attempt_type: 'string',
      correct_attempts: 'number',
      wrong_attempts: 'number',
      impulsivity_score: 'number',
      response_time: 'number',
      omission_score: 'number',
      distraction_endurance_score: 'number',
      actual_attention_time: 'number'
    }
  },
  15: {
    moduleName: 'Repella',
    chartsConfigs: [
      {
        id: '1',
        chartType: 'line',
        fieldNameX: 'attempt_start_time',
        fieldNameY: 'impulsivity_score',
        tooltipFields: ['level'],
        dataX: [],
        dataY: {},
        tooltipData: {},
        color: 'blue',
        backgroundColor: 'white',
        chartObject: null,
        show: true,
        legend: 'Repella',
        canGroupBy: ['', 'level'],
        canBeFieldY: ['impulsivity_score', 'response_time', 'omission_score', 'distraction_endurance_score'],
        groupBy: ''
      }
    ],
    fieldsConfig: {
      session_start_time: 'string',
      attempt_start_time: 'string',
      attempt_end_time: 'string',
      expected_duration_in_seconds: 'number',
      actual_duration_in_seconds: 'number',
      level: 'string',
      attempt_type: 'string',
      impulsivity_score: 'number',
      response_time: 'number',
      omission_score: 'number',
      distraction_endurance_score: 'number',
      actual_attention_time: 'number'
    }
  }
};
