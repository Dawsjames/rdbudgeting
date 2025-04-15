<template lang="pug">
  q-page.bg-grey-2
    // Header
    .bg-indigo-700.text-white.q-pa-md
      .text-h6.q-mb-sm Analytics & Insights
      .text-subtitle2 Track your spending patterns

    // Summary Cards
    .q-pa-md
      .row.q-col-gutter-md
        .col-6
          q-card.text-center.full-width
            q-card-section.q-py-sm
              .text-caption.text-grey-7 Total This Month
              .text-h5.text-primary ${{ totalThisMonth.toFixed(2) }}

        .col-6
          q-card.text-center.full-width
            q-card-section.q-py-sm
              .text-caption.text-grey-7 Monthly Average
              .text-h5.text-primary ${{ monthlyAverage.toFixed(2) }}

        .col-6
          q-card.text-center.full-width
            q-card-section.q-py-sm
              .text-caption.text-grey-7 Total Transactions
              .text-h5.text-primary {{ totalTransactions }}

        .col-6
          q-card.text-center.full-width
            q-card-section.q-py-sm
              .text-caption.text-grey-7 Biggest Expense
              .text-h5.text-primary ${{ biggestExpense.toFixed(2) }}

    // Category Distribution
    .q-pa-md
      q-card
        q-card-section
          .text-h6.q-mb-sm Category Distribution

          // Chart container
          .chart-container(style="height: 240px" v-if="!loading")
            chart-pie-component(:data="categoryData")

          div.flex-center(v-else style="height: 240px")
            q-spinner(color="primary" size="md")

    // Monthly Trends
    .q-pa-md.q-mb-xl
      q-card
        q-card-section
          .text-h6.q-mb-sm Monthly Trends

          // Chart container
          .chart-container(style="height: 240px" v-if="!loading")
            chart-line-component(:data="monthlyData")

          div.flex-center(v-else style="height: 240px")
            q-spinner(color="primary" size="md")

    // Insights
    .q-pa-md.q-mb-xl
      q-card
        q-card-section
          .text-h6.q-mb-sm Insights
          .q-my-md(v-for="insight in insights" :key="insight.id")
            .row.items-center
              .col-auto.q-mr-sm
                q-icon(:name="insight.icon" :color="insight.color" size="sm")
              .col
                .text-body2 {{ insight.text }}
            q-separator.q-my-sm(v-if="insight.id !== insights.length")

    // Bottom Navigation
    .q-pa-md.fixed-bottom.bg-white.row.justify-around.items-center.navigation-bar
      q-btn(flat no-caps color="grey-7" to="/history")
        .column.items-center
          q-icon(name="receipt_long" size="sm")
          span.text-xs.q-mt-xs Expenses

      q-btn(round color="indigo" icon="add" class="add-button" size="lg" @click="showAddExpenseDialog")

      q-btn(flat no-caps color="indigo" to="/analytics")
        .column.items-center
          q-icon(name="insights" size="sm")
          span.text-xs.q-mt-xs Analytics

    // Add Expense Dialog
    add-expense-dialog(
      v-model="showAddDialog"
      @expense-saved="loadExpenses"
    )
  </template>

  <script lang="ts">
  import { defineComponent, ref, computed, onMounted } from 'vue'
  import { date } from 'quasar'
  import type { RDExpense } from 'src/services/expenses'
  import { expenseService } from 'src/services/expenses'
  import ChartPieComponent from 'src/components/ChartPieComponent.vue'
  import ChartLineComponent from 'src/components/ChartLineComponent.vue'
  import AddExpenseDialog from 'src/components/AddExpenseDialog.vue'
  import { useRouter } from 'vue-router'

  interface Insight {
    id: number;
    icon: string;
    color: string;
    text: string;
  }

  export default defineComponent({
    name: 'AnalyticsPage',
    components: {
      ChartPieComponent,
      ChartLineComponent,
      AddExpenseDialog
    },
    setup() {
      const expenses = ref<RDExpense[]>([])
      const loading = ref(true)
      const showAddDialog = ref(false)

      // Calculate metrics
      const totalThisMonth = computed(() => {
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()

        return expenses.value
          .filter(expense => {
            const expenseDate = new Date(expense.date)
            return expenseDate.getMonth() === currentMonth &&
                   expenseDate.getFullYear() === currentYear
          })
          .reduce((sum, expense) => sum + expense.amount, 0)
      })

      const monthlyAverage = computed(() => {
        if (expenses.value.length === 0) return 0

        // Group expenses by month
        const monthlyExpenses = expenses.value.reduce((acc, expense) => {
          const expenseDate = new Date(expense.date)
          const monthYear = `${expenseDate.getFullYear()}-${expenseDate.getMonth()}`

          if (!acc[monthYear]) {
            acc[monthYear] = 0
          }

          acc[monthYear] += expense.amount
          return acc
        }, {} as Record<string, number>)

        // Calculate average
        const months = Object.keys(monthlyExpenses).length
        const total = Object.values(monthlyExpenses).reduce((sum, amount) => sum + amount, 0)

        return months > 0 ? total / months : 0
      })

      const totalTransactions = computed(() => {
        return expenses.value.length
      })

      const biggestExpense = computed(() => {
        if (expenses.value.length === 0) return 0
        return Math.max(...expenses.value.map(expense => expense.amount))
      })

      // Prepare data for category chart
      const categoryData = computed(() => {
        // Group expenses by category
        const categories = expenses.value.reduce((acc, expense) => {
          if (!acc[expense.category]) {
            acc[expense.category] = 0
          }

          acc[expense.category] += expense.amount;
          return acc
        }, {} as Record<string, number>)

        // Prepare data for chart
        const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']

        return Object.entries(categories).map(([name, value], index) => ({
          name,
          value,
          color: colors[index % colors.length]
        }))
      })

      // Prepare data for monthly chart
      const monthlyData = computed(() => {
        // Group expenses by month
        const monthlyAmounts = expenses.value.reduce((acc, expense) => {
          const expenseDate = new Date(expense.date)
          const monthYear = date.formatDate(expenseDate, 'MMM YYYY')

          if (!acc[monthYear]) {
            acc[monthYear] = 0
          }

          acc[monthYear] += expense.amount
          return acc
        }, {} as Record<string, number>)

        // Sort by date
        const sortedMonths = Object.entries(monthlyAmounts)
          .map(([month, amount]) => ({ month, amount }))
          .sort((a, b) => {
            const dateA = new Date(a.month)
            const dateB = new Date(b.month)
            return dateA.getTime() - dateB.getTime()
          })

        return sortedMonths
      })

      // Generate insights
      const insights = computed(() => {
        if (expenses.value.length === 0) return []

        const insightsList: Insight[] = []

        // Find top spending category
        if (categoryData.value.length > 0) {
          const sortedCategories = [...categoryData.value].sort((a, b) => b.value - a.value)
          const topCategory = sortedCategories[0]

          if (topCategory) {
            insightsList.push({
              id: 1,
              icon: 'trending_up',
              color: 'negative',
              text: `Your highest spending category is ${topCategory.name} with $${topCategory.value.toFixed(2)}.`
            })
          }
        }

        // Check if spending increased
        if (monthlyData.value.length >= 2) {
          const lastMonthIndex = monthlyData.value.length - 1
          const lastMonth = monthlyData.value[lastMonthIndex]
          const previousMonth = monthlyData.value[lastMonthIndex - 1]

          if (lastMonth && previousMonth && previousMonth.amount !== 0) {
            const percentChange = ((lastMonth.amount - previousMonth.amount) / previousMonth.amount) * 100

            if (percentChange > 0) {
              insightsList.push({
                id: 2,
                icon: 'arrow_upward',
                color: 'negative',
                text: `Your spending increased by ${Math.abs(percentChange).toFixed(1)}% compared to last month.`
              })
            } else {
              insightsList.push({
                id: 2,
                icon: 'arrow_downward',
                color: 'positive',
                text: `Your spending decreased by ${Math.abs(percentChange).toFixed(1)}% compared to last month.`
              })
            }
          }
        }

        // Add general insights
        insightsList.push({
          id: 3,
          icon: 'info',
          color: 'primary',
          text: `You've recorded ${totalTransactions.value} expenses in total.`
        })

        return insightsList
      })

      // Show add expense dialog
      const showAddExpenseDialog = async () => {
        showAddDialog.value = true
      }

      // Load expenses
      const loadExpenses = async () => {
        loading.value = true
        try {
          expenses.value = await expenseService.getAll()
        } catch (error) {
          console.error('Error loading expenses for analytics:', error)
        } finally {
          loading.value = false
        }
      }

      // Initialize
      onMounted(async () => {
        await loadExpenses()
      })

      return {
        loading,
        totalThisMonth,
        monthlyAverage,
        totalTransactions,
        biggestExpense,
        categoryData,
        monthlyData,
        insights,
        showAddDialog,
        showAddExpenseDialog,
        loadExpenses
      }
    }
  })
  </script>

  <style lang="scss" scoped>
  .navigation-bar {
    border-top: 1px solid #e5e7eb;
    padding-bottom: env(safe-area-inset-bottom);
  }

  .add-button {
    margin-top: -40px;
  }

  .flex-center {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  </style>
