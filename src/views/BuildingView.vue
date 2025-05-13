<template>
  <div class="energy-consumption-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loader"></div>
      <p>数据加载中...</p>
    </div>

    <!-- 数据展示 -->
    <div v-show="!loading" class="chart-wrapper">
      <h2 class="building-title">{{ building.name }} 能耗趋势</h2>
      
      <!-- 图表容器（添加明确的尺寸和可见性控制） -->
      <div 
        ref="chartContainer"
        class="chart-container"
        style="width: 100%; min-width: 800px; height: 600px; display: block;"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import * as echarts from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
} from 'echarts/components'

// 强制注册必需组件
echarts.use([
  SVGRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
])

const route = useRoute()
const chartContainer = ref(null)
const building = ref({ weekly: [] })
const loading = ref(true)
let chartInstance = null
let resizeObserver = null

// 保障性初始化流程
const initializeChart = async () => {
  try {
    // 1. 确保容器存在
    if (!chartContainer.value) {
      throw new Error('图表容器未创建')
    }

    // 2. 显式设置容器可见性并等待渲染
    chartContainer.value.style.display = 'block'
    chartContainer.value.style.visibility = 'visible'
    await nextTick()

    // 3. 检查容器尺寸
    const { offsetWidth, offsetHeight } = chartContainer.value
    if (offsetWidth === 0 || offsetHeight === 0) {
      console.warn('容器尺寸异常，使用强制尺寸')
      chartContainer.value.style.width = '800px'
      chartContainer.value.style.height = '600px'
      await nextTick()
    }

    // 4. 初始化图表实例
    if (chartInstance) {
      chartInstance.dispose()
    }
    chartInstance = echarts.init(chartContainer.value, null, {
      renderer: 'svg',
      width: 'auto',
      height: 'auto'
    })

    // 5. 配置图表选项
    const option = getChartOptions()
    chartInstance.setOption(option)

    // 6. 添加响应式调整
    resizeObserver = new ResizeObserver(() => {
      chartInstance?.resize()
    })
    resizeObserver.observe(chartContainer.value)

    // 7. 触发首次渲染
    chartInstance.resize()

  } catch (error) {
    console.error('图表初始化失败:', error)
    showErrorOverlay(error.message)
  }
}

// 图表配置生成器
const getChartOptions = () => {
  // 数据校验
  if (!building.value.weekly || !Array.isArray(building.value.weekly)) {
    throw new Error('无效的数据结构')
  }

  return {
    title: {
      text: '七日能耗趋势分析',
      left: 'center',
      textStyle: {
        fontSize: 18,
        color: '#2c3e50'
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: params => `
        <b>${params[0].axisValue}</b><br>
        <span style="color:${params[0].color}">●</span> ${params[0].seriesName}: ${params[0].data}kWh<br>
        <span style="color:${params[1].color}">●</span> ${params[1].seriesName}: ${params[1].data}吨
      `
    },
    legend: {
      data: ['电力消耗', '水资源消耗'],
      top: 35,
      itemGap: 20
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '12%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: building.value.weekly.map(item => {
        if (!item.day) console.warn('缺少日期字段:', item)
        return item.day
      }),
      axisLabel: {
        rotate: 45,
        formatter: value => {
          try {
            const [year, month, day] = value.split('-')
            return `${month}/${day}`
          } catch {
            return value
          }
        }
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '电力消耗 (kWh)',
        axisLine: {
          lineStyle: {
            color: '#5470c6'
          }
        },
        splitLine: {
          show: false
        }
      },
      {
        type: 'value',
        name: '水资源消耗 (吨)',
        axisLine: {
          lineStyle: {
            color: '#91cc75'
          }
        },
        position: 'right',
        splitLine: {
          show: false
        }
      }
    ],
    series: [
      {
        name: '电力消耗',
        type: 'line',
        data: building.value.weekly.map(item => {
          if (typeof item.electricity !== 'number') console.warn('无效的电力数据:', item)
          return item.electricity
        }),
        smooth: true,
        itemStyle: {
          color: '#5470c6'
        },
        lineStyle: {
          width: 3
        },
        symbol: 'circle',
        symbolSize: 8
      },
      {
        name: '水资源消耗',
        type: 'line',
        yAxisIndex: 1,
        data: building.value.weekly.map(item => {
          if (typeof item.water !== 'number') console.warn('无效的水资源数据:', item)
          return item.water
        }),
        smooth: true,
        itemStyle: {
          color: '#91cc75'
        },
        lineStyle: {
          width: 3
        },
        symbol: 'circle',
        symbolSize: 8
      }
    ]
  }
}

// 错误显示处理
const showErrorOverlay = (message) => {
  if (chartContainer.value) {
    chartContainer.value.innerHTML = `
      <div class="error-overlay">
        <h3>图表加载失败</h3>
        <p>${message}</p>
        <button onclick="location.reload()">刷新页面</button>
      </div>
    `
  }
}

// 主初始化流程
onMounted(async () => {
  try {
    // 1. 获取数据
    const response = await axios.get(`http://localhost:3000/buildings/${route.params.id}`)
    building.value = response.data

    // 2. 等待双重DOM更新周期
    await nextTick()
    await nextTick()

    // 3. 初始化图表
    await initializeChart()

  } catch (error) {
    console.error('主流程初始化失败:', error)
    showErrorOverlay(error.message)
  } finally {
    loading.value = false
  }
})

// 资源清理
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})
</script>

<style scoped>
.energy-consumption-container {
  position: relative;
  width: 100%;
  min-height: 700px;
}

.chart-wrapper {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.chart-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  min-width: 800px;
  min-height: 600px;
}

.loading-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.loader {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
}

.error-overlay {
  padding: 20px;
  background: #ffe6e6;
  border: 1px solid #ff4444;
  border-radius: 8px;
  text-align: center;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.building-title {
  text-align: center;
  margin: 0 0 30px;
  color: #2c3e50;
  font-size: 1.5rem;
}
</style>