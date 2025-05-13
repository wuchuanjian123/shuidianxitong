<template>
  <div class="home">
    <div class="charts">
      <div ref="barChart" class="chart"></div>
      <div ref="pieChart" class="chart"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import * as echarts from 'echarts/core';
import { PieChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([PieChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer]);

const barChart = ref(null)
const pieChart = ref(null)
const data = ref([])
let barChartInstance = null
let pieChartInstance = null

onMounted(async () => {
  try {
    const res = await axios.get('http://localhost:3000/buildings')
    data.value = res.data
    initBarChart()
    initPieChart()
  } catch (error) {
    console.error('数据获取失败:', error)
  }
})

async function initBarChart() {
  const echarts = await import('echarts/core');
  const { BarChart } = await import('echarts/charts');
  const { TitleComponent, TooltipComponent, LegendComponent, GridComponent } = await import('echarts/components');
  const { CanvasRenderer } = await import('echarts/renderers');

  echarts.use([BarChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer]);

  barChartInstance = echarts.init(barChart.value);
  
  const option = {
    title: {
      text: '月度能耗总览',
      left: 'center',
      textStyle: {
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['用电量', '用水量'],
      top: 30
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.value.map(item => item.name),
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '用电量 (kWh)',
        axisLabel: {
          formatter: '{value}'
        }
      },
      {
        type: 'value',
        name: '用水量 (吨)',
        axisLabel: {
          formatter: '{value}'
        }
      }
    ],
    series: [
      {
        name: '用电量',
        type: 'bar',
        data: data.value.map(item => item.monthly.electricity),
        itemStyle: {
          color: '#5470c6'
        }
      },
      {
        name: '用水量',
        type: 'bar',
        yAxisIndex: 1,
        data: data.value.map(item => item.monthly.water),
        itemStyle: {
          color: '#91cc75'
        }
      }
    ]
  }

  barChartInstance.setOption(option)
  window.addEventListener('resize', barChartInstance.resize)
}

function initPieChart() {
  if (pieChartInstance) pieChartInstance.dispose()
  
  pieChartInstance = echarts.init(pieChart.value)
  
  // 计算总用电量
  const totalElectricity = data.value.reduce((sum, item) => sum + item.monthly.electricity, 0)

  const option = {
    title: {
      text: '用电量占比',
      left: 'center',
      textStyle: {
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} kWh ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 30
    },
    series: [
      {
        name: '用电量占比',
        type: 'pie',
        radius: '50%',
        data: data.value.map(item => ({
          value: item.monthly.electricity,
          name: item.name
        })),
        label: {
          formatter: '{b}: {d}%'
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }

  pieChartInstance.setOption(option)
  window.addEventListener('resize', pieChartInstance.resize)
}

onUnmounted(() => {
  if (barChartInstance) {
    barChartInstance.dispose()
    window.removeEventListener('resize', barChartInstance.resize)
  }
  if (pieChartInstance) {
    pieChartInstance.dispose()
    window.removeEventListener('resize', pieChartInstance.resize)
  }
})
</script>

<style scoped>
.charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  padding: 20px;
}

.chart {
  width: 100%;
  height: 500px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

@media (max-width: 768px) {
  .charts {
    grid-template-columns: 1fr;
  }
}
</style>