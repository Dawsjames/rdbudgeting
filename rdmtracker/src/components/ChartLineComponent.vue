<template lang="pug">
  .chart-wrapper(style="width: 100%; height: 100%")
    div(v-if="hasData" ref="chartContainer" style="width: 100%; height: 100%")
    .no-data-message(v-else)
      q-icon(name="trending_up" size="md" color="grey-5")
      div.text-grey-7.q-mt-sm No data available
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch, toRefs, computed, PropType, onUnmounted } from 'vue'

interface MonthlyData {
  month: string
  amount: number
}

export default defineComponent({
  name: 'ChartLineComponent',
  props: {
    data: {
      type: Array as PropType<MonthlyData[]>,
      required: true
    }
  },
  setup(props) {
    const chartContainer = ref<HTMLElement | null>(null)
    let chart: any = null

    // Extract reactive props
    const { data } = toRefs(props)

    // Check if we have data to display
    const hasData = computed(() => {
      return data.value && data.value.length > 0
    })

    // Initialize the chart
    const initChart = () => {
      if (chartContainer.value && hasData.value) {
        try {
          // Import echarts dynamically
          import('echarts').then((echarts) => {
            // Dispose existing chart if it exists
            if (chart) {
              chart.dispose()
            }

            // Create new chart
            chart = echarts.init(chartContainer.value)

            // Set chart options
            const option = {
              tooltip: {
                trigger: 'axis',
                formatter: (params: any) => {
                  const param = params[0]
                  return `${param.name}: $${param.value.toFixed(2)}`
                },
                axisPointer: {
                  type: 'cross',
                  label: {
                    backgroundColor: '#6a7985'
                  }
                }
              },
              grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
              },
              xAxis: {
                type: 'category',
                boundaryGap: false,
                data: data.value.map(item => item.month),
                axisLine: {
                  show: true,
                  lineStyle: {
                    color: '#eaeaea'
                  }
                },
                axisTick: {
                  show: false
                },
                axisLabel: {
                  color: '#666',
                  fontSize: 12,
                  interval: 'auto',
                  rotate: data.value.length > 6 ? 30 : 0
                }
              },
              yAxis: {
                type: 'value',
                axisLine: {
                  show: false
                },
                axisTick: {
                  show: false
                },
                splitLine: {
                  lineStyle: {
                    color: '#eaeaea',
                    type: 'dashed'
                  }
                },
                axisLabel: {
                  color: '#666',
                  fontSize: 12,
                  formatter: (value: number) => `$${value}`
                }
              },
              series: [
                {
                  name: 'Monthly Expenses',
                  type: 'line',
                  smooth: true,
                  lineStyle: {
                    width: 3,
                    color: '#4f46e5'
                  },
                  areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                      {
                        offset: 0,
                        color: 'rgba(79, 70, 229, 0.6)'
                      },
                      {
                        offset: 1,
                        color: 'rgba(79, 70, 229, 0.1)'
                      }
                    ])
                  },
                  emphasis: {
                    focus: 'series'
                  },
                  symbol: 'circle',
                  symbolSize: 8,
                  itemStyle: {
                    color: '#4f46e5',
                    borderColor: '#fff',
                    borderWidth: 2
                  },
                  data: data.value.map(item => item.amount),
                  markPoint: {
                    data: [
                      { type: 'max', name: 'Max' },
                      { type: 'min', name: 'Min' }
                    ]
                  }
                }
              ]
            }

            // Apply options to chart
            chart.setOption(option)
          }).catch(error => {
            console.error('Failed to load echarts:', error)
          })
        } catch (error) {
          console.error('Error initializing chart:', error)
        }
      }
    }

    // Handle window resize
    const handleResize = () => {
      if (chart) {
        chart.resize()
      }
    }

    // Initialize chart on mount
    onMounted(() => {
      if (hasData.value) {
        initChart()
      }
      window.addEventListener('resize', handleResize)
    })

    // Watch for data changes and update chart
    watch(data, () => {
      if (hasData.value) {
        initChart()
      } else if (chart) {
        // If we have no data but a chart exists, dispose it
        chart.dispose()
        chart = null
      }
    }, { deep: true })

    // Cleanup on unmount
    onUnmounted(() => {
      if (chart) {
        chart.dispose()
      }
      window.removeEventListener('resize', handleResize)
    })

    return {
      chartContainer,
      hasData
    }
  }
})
</script>

<style lang="scss" scoped>
.chart-wrapper {
  position: relative;
}

.no-data-message {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 14px;
}
</style>
