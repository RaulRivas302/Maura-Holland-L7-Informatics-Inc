var chartOptions = {
		chart: {
			type: 'line'
		},
    title: {
        text: 'Benford\'s Law',
				style: {
					color: '#5bbfde',
					fontWeight: 'bold'
				}
    },
    subtitle: {
        text: 'A Comparison of Predicted vs Actual Numerical Distribution',
				style: {
					color: '#5bbfde'
				}
    },
    yAxis: {
        min: 0,
        title: {
            text: 'Distribution %'
        }
    },
    xAxis: {
        accessibility: {
            rangeDescription: 'Range: 2010 to 2017'
        }
    },
    tooltip: {
        headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
        pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
            '<td style="padding:0"><b>{point.y:.1f} mm</b></td></tr>',
        footerFormat: '</table>',
        shared: true,
        useHTML: true
    },

    legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'middle'
    },
    plotOptions: {
        series: {
            label: {
                connectorAllowed: false
            },
            pointStart: 1
        }
    },
    series: [{
        name: 'Benford',
        data: [30.1,17.6,12.5,9.7,7.9,6.7,5.8,5.1,4.6]
    	}, {
        name: 'Your File',
        data: [40,18,13,11,8,7,6,5,4]
    	},
    ],
    responsive: {
        rules: [{
            condition: {
                maxWidth: 500
            },
            chartOptions: {
                legend: {
                    layout: 'horizontal',
                    align: 'center',
                    verticalAlign: 'bottom'
                }
            }
        }]
    }
};
