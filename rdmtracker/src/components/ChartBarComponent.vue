<template lang="pug">
  .chart-wrapper(style="width: 100%; height: 100%")
    div(v-if="hasData" ref="chartContainer" style="width: 100%; height: 100%")
    .no-data-message(v-else)
      q-icon(name="bar_chart" size="md" color="grey-5")
      div.text-grey-7.q-mt-sm No data available
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch, toRefs, computed, PropType, onUnmounted } from 'vue'

interface CategoryData {
  name: string
  value: number
  color: string
  icon: string
}

export default defineComponent({
  name: 'ChartBarComponent',
  props: {
    data: {
      type: Array as PropType<CategoryData[]>,
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
      return data.value && data.value.length > 0 && data.value.some(item => item.value > 0)
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
              grid: {
                left: '3%',
                right: '4%',
                bottom: '10%',
                top: '3%',
                containLabel: true
              },
              tooltip: {
                trigger: 'axis',
                axisPointer: {
                  type: 'shadow'
                },
                formatter: (params: any) => {
                  const param = params[0]
                  return `${param.name}: $${param.value.toFixed(2)}`
                }
              },
              xAxis: {
                type: 'category',
                data: data.value.map(item => item.name),
                axisLine: {
                  show: false
                },
                axisTick: {
                  show: false
                },
                axisLabel: {
                  color: '#666',
                  fontSize: 12,
                  interval: 0,
                  rotate: data.value.length > 4 ? 30 : 0
                }
              },
              yAxis: {
                type: 'value',
                show: false
              },
              series: [
                {
                  data: data.value.map(item => ({
                    value: item.value,
                    itemStyle: {
                      color: item.color
                    }
                  })),
                  type: 'bar',
                  barWidth: '60%',
                  barCategoryGap: '20%',
                  itemStyle: {
                    borderRadius: [4, 4, 0, 0]
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
