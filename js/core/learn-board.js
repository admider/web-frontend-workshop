export function initLearnBoard() {
	// 模拟从 localStorage 获取数据
	const mockData = {
	    modules: ['盒子模型', '浮动 Float', 'CSS3', 'Display', 'Flexbox', '列表', '链接', '表格', '表单'],
	    timeSpent: [45, 60, 30, 20, 50, 15, 25, 40, 35], // 停留时间(分钟)
	    challengeAcc: [85, 70, 90, 100, 60, 80, 95, 88, 75] // 正确率(%)
	};
	
	// 如果你有时间，就在每个模块的 JS 里加一个 setInterval 把时间存入 localStorage，这里直接读取。
	// 这里先用模拟数据。
	
	const chart = echarts.init(document.getElementById('studyChart'));
	const option = {
	    tooltip: { trigger: 'axis' },
	    legend: { data: ['平均停留时长(分钟)', '挑战题正确率(%)'], textStyle: { color: '#94a3b8' } },
	    xAxis: { 
	        type: 'category', 
	        data: mockData.modules,
	        axisLabel: { color: '#94a3b8' }
	    },
	    yAxis: { type: 'value', axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#334155' } } },
	    series: [
	        { name: '平均停留时长(分钟)', type: 'bar', data: mockData.timeSpent, itemStyle: { color: '#06b6d4' } },
	        { name: '挑战题正确率(%)', type: 'line', data: mockData.challengeAcc, itemStyle: { color: '#f59e0b' }, smooth: true }
	    ]
	};
	chart.setOption(option);
}
