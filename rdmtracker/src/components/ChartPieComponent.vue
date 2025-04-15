<template lang="pug">
  .chart-wrapper(style="width: 100%; height: 100%")
    div(v-if="hasData" ref="chartContainer" style="width: 100%; height: 100%")
    .no-data-message(v-else)
      q-icon(name="pie_chart" size="md" color="grey-5")
      div.text-grey-7.q-mt-sm No data available
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch, toRefs, computed, PropType, onUnmounted } from 'vue'

interface CategoryData {
  name: string
  value: number
  color: string
  icon?: string
}

export default defineComponent({
  name: 'ChartPieComponent',
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
              tooltip: {
                trigger: 'item',
                formatter: (params: any) => {
                  return `${params.name}: $${params.value.toFixed(2)} (${params.percent}%)`
                }
              },
              legend: {
                orient: 'horizontal',
                bottom: 'bottom',
                type: 'scroll',
                formatter: (name: string) => {
                  // Keep legend names short
                  return name
                },
                textStyle: {
                  fontSize: 12
                }
              },
              series: [
                {
                  name: 'Expenses by Category',
                  type: 'pie',
                  radius: ['40%', '70%'],
                  avoidLabelOverlap: false,
                  itemStyle: {
                    borderRadius: 4,
                    borderColor: '#fff',
                    borderWidth: 2
                  },
                  label: {
                    show: false
                  },
                  emphasis: {
                    label: {
                      show: true,
                      formatter: '{b}: ${c} ({d}%)',
                      fontSize: '14',
                      fontWeight: 'bold'
                    },
                    itemStyle: {
                      shadowBlur: 10,
                      shadowOffsetX: 0,
                      shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                  },
                  labelLine: {
                    show: false
                  },
                  data: data.value.map(item => ({
                    name: item.name,
                    value: item.value,
                    itemStyle: {
                      color: item.color
                    }
                  }))
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
