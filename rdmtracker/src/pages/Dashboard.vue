<template lang="pug">
  q-page.bg-grey-2
    // Header section with gradient background
    .dashboard-header.q-pa-md.text-white
      .relative.z-10
        .row.justify-between.items-center
          h1.text-xl.font-bold RDM Tracker
          q-btn(round flat icon="menu" @click="$q.drawer.toggle()")
          
        .q-mt-md
          .text-h4.font-bold ${{ totalExpenses.toFixed(2) }}
          .text-indigo-200.q-mt-xs Total Expenses
        
        .row.justify-between.q-mt-md
          .column
            .text-indigo-200.text-sm Month
            .row.items-center
              span.font-medium {{ currentMonth }}
              q-icon(name="keyboard_arrow_down" size="sm" class="q-ml-xs")
    
    // Loading state
    div(v-if="loading" class="flex-center q-pa-xl")
      q-spinner(color="primary" size="3em")
      .text-subtitle1.q-ml-md Loading expenses...
    
    template(v-else)
      // No data state
      div(v-if="expenses.length === 0" class="flex-center column q-pa-xl")
        q-icon(name="receipt_long" size="4em" color="grey-5")
        .text-h6.text-grey-8.q-mt-md No expenses yet
        .text-subtitle2.text-grey-6.q-mb-lg Add your first expense to get started
        q-btn(color="primary" label="Add Expense" icon="add" @click="showAddDialog = true")
        
      template(v-else)
        // Categories Chart
        q-card.q-ma-md.no-shadow
          q-card-section
            .text-lg.font-medium.text-grey-9 Expense Breakdown
            
            // Chart container
            .chart-container(style="height: 180px")
              chart-bar-component(:data="categoryData")
            
            // Category Icons Row
            .row.justify-around.q-mt-sm
              .column.items-center(v-for="(category, index) in categoryData" :key="index")
                .text-xl {{ category.icon }}
        
        // Category Filter
        q-card.q-mx-md.q-mb-md.no-shadow
          q-card-section.q-py-sm
            .overflow-auto.row.no-wrap.q-gutter-x-sm
              q-btn.q-px-sm(
                :color="activeCategory === 'All' ? 'indigo-1' : 'grey-3'" 
                :text-color="activeCategory === 'All' ? 'indigo' : 'grey-8'"
                :class="{'text-weight-medium': activeCategory === 'All'}"
                dense
                rounded
                unelevated
                no-caps
                label="All"
                @click="activeCategory = 'All'"
              )
              q-btn.q-px-sm(
                v-for="category in categoryData" 
                :key="category.name"
                :color="activeCategory === category.name ? 'indigo-1' : 'grey-3'" 
                :text-color="activeCategory === category.name ? 'indigo' : 'grey-8'"
                :class="{'text-weight-medium': activeCategory === category.name}"
                dense
                rounded
                unelevated
                no-caps
                @click="activeCategory = category.name"
              )
                span.q-mr-xs {{ category.icon }}
                | {{ category.name }}
        
        // Recent Transactions
        .q-px-md.q-pt-md.q-pb-xl
          .row.justify-between.items-center.q-mb-md
            h2.text-lg.font-medium.text-grey-9.q-my-none Recent Transactions
            q-btn(
              flat
              color="primary"
              label="View All"
              no-caps
              size="sm"
              to="/history"
            )
          
          // No transactions for selected category
          div(v-if="recentExpenses.length === 0" class="text-center q-pa-xl text-grey-6")
            q-icon(name="filter_alt" size="sm")
            span.q-ml-xs No transactions found for this category
          
          // Transaction List
          template(v-else)
            q-card.q-mb-md.transaction-card(
              v-for="expense in recentExpenses" 
              :key="expense._id || expense.description"
              flat
              bordered
            )
              q-card-section
                .row.justify-between
                  .column
                    .font-medium {{ expense.description }}
                    .row.items-center.q-mt-xs
                      q-icon(name="sell" size="xs" color="grey-6" class="q-mr-xs")
                      span.text-sm.text-grey-7 {{ expense.category }}
                  .column.text-right
                    .text-h6.font-bold ${{ expense.amount.toFixed(2) }}
                    .row.items-center.justify-end.q-mt-xs
                      q-icon(name="event" size="xs" color="grey-6" class="q-mr-xs")
                      span.text-sm.text-grey-7 {{ formatDate(expense.date) }}
      
    // Bottom Navigation
    .q-pa-md.fixed-bottom.bg-white.row.justify-around.items-center.navigation-bar
      q-btn(flat no-caps :color="isCurrentRoute('/history') ? 'indigo' : 'grey-7'" to="/history")
        .column.items-center
          q-icon(name="receipt_long" size="sm")
          span.text-xs.q-mt-xs Expenses
      
      q-btn(round color="indigo" icon="add" class="add-button" size="lg" @click="showAddDialog = true")
        
      q-btn(flat no-caps :color="isCurrentRoute('/analytics') ? 'indigo' : 'grey-7'" to="/analytics")
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
  import { date, useQuasar } from 'quasar'
  import { useRoute } from 'vue-router'
  import type { RDExpense } from 'src/services/expenses'
  import { expenseService } from 'src/services/expenses'
  import ChartBarComponent from 'src/components/ChartBarComponent.vue'
  import AddExpenseDialog from 'src/components/AddExpenseDialog.vue'
  
  export default defineComponent({
    name: 'DashboardPage',
    components: {
      ChartBarComponent,
      AddExpenseDialog
    },
    setup() {
      // For notifications and drawer
      const $q = useQuasar()
      const route = useRoute()
      
      // State
      const expenses = ref<RDExpense[]>([])
      const loading = ref(true)
      const activeCategory = ref('All')
      const showAddDialog = ref(false)
      const apiConnected = ref(true)
      
      // Get current month and year for display
      const currentDate = new Date()
      const currentMonth = computed(() => {
        return `${date.formatDate(currentDate, 'MMMM')} ${currentDate.getFullYear()}`
      })
      
      // Check if current route matches
      const isCurrentRoute = (path: string) => {
        return route.path === path
      }
      
      // Compute total expenses amount
      const totalExpenses = computed(() => {
        return expenses.value.reduce((sum, expense) => sum + expense.amount, 0)
      })
      
      // Get recent expenses (sorted by date)
      const recentExpenses = computed(() => {
        // Filter by active category if needed
        const filteredExpenses = activeCategory.value === 'All'
          ? [...expenses.value]
          : expenses.value.filter(expense => expense.category === activeCategory.value)
        
        // Sort by date (newest first)
        return filteredExpenses.sort((a, b) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        }).slice(0, 5) // Get only the 5 most recent
      })
      
      // Get category data for the chart based on actual expenses
      const categoryData = computed(() => {
        // Group expenses by category
        const categoryAmounts = expenses.value.reduce((acc, expense) => {
          if (!acc[expense.category]) {
            acc[expense.category] = 0
          }
          acc[expense.category] += expense.amount
          return acc
        }, {} as Record<string, number>)
        
        // Define colors and icons for categories
        const categoryMeta: Record<string, { color: string, icon: string }> = {
          'Food': { color: '#FF6384', icon: '🍔' },
          'Housing': { color: '#36A2EB', icon: '🏠' },
          'Transportation': { color: '#FFCE56', icon: '🚗' },
          'Entertainment': { color: '#4BC0C0', icon: '🎬' },
          'Utilities': { color: '#9966FF', icon: '💡' },
          'Other': { color: '#FF9F40', icon: '📦' }
        }
        
        // Create data for the chart
        return Object.entries(categoryAmounts).map(([name, value]) => ({
          name,
          value,
          color: categoryMeta[name]?.color || '#CCCCCC',
          icon: categoryMeta[name]?.icon || '📝'
        })).sort((a, b) => b.value - a.value) // Sort by value descending
      })
      
      // Format date string to a readable format
      const formatDate = (dateString: string | Date): string => {
        return date.formatDate(new Date(dateString), 'MMM D, YYYY')
      }
      
      // Check API connectivity
      const checkApiConnectivity = async (): Promise<boolean> => {
        try {
          const api = (await import('src/services/api')).default
          return await api.checkConnectivity()
        } catch (error) {
          console.error('API connectivity check failed:', error)
          return false
        }
      }
      
      // Load expenses from the API
      const loadExpenses = async (): Promise<void> => {
        loading.value = true
        
        try {
          // Check API connectivity first
          apiConnected.value = await checkApiConnectivity()
          
          if (!apiConnected.value && process.env.NODE_ENV === 'development') {
            $q.notify({
              color: 'warning',
              message: 'Using mock data - unable to connect to server',
              icon: 'cloud_off',
              timeout: 3000
            })
          }
          
          expenses.value = await expenseService.getAll()
        } catch (error) {
          console.error('Error loading expenses:', error)
          $q.notify({
            color: 'negative',
            message: 'Could not load your expenses. Please try again.',
            icon: 'error'
          })
          expenses.value = []
        } finally {
          loading.value = false
        }
      }
      
      // Load data when component mounts
      onMounted(async () => {
        await loadExpenses()
      })
      
      return {
        $q,
        expenses,
        loading,
        activeCategory,
        currentMonth,
        totalExpenses,
        recentExpenses,
        categoryData,
        formatDate,
        showAddDialog,
        loadExpenses,
        isCurrentRoute
      }
    }
  })
  </script>
  
  <style lang="scss" scoped>
  .dashboard-header {
    background: linear-gradient(to right, #4f46e5, #6366f1);
    position: relative;
    overflow: hidden;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 200px;
      height: 200px;
      background: white;
      border-radius: 50%;
      opacity: 0.1;
      transform: translate(30%, -30%);
    }
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 120px;
      height: 120px;
      background: white;
      border-radius: 50%;
      opacity: 0.1;
      transform: translate(-30%, 30%);
    }
  }
  
  .navigation-bar {
    border-top: 1px solid #e5e7eb;
    padding-bottom: env(safe-area-inset-bottom);
  }
  
  .add-button {
    margin-top: -40px;
  }
  
  .transaction-card {
    border-color: #f3f4f6;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
  
  .flex-center {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  </style>