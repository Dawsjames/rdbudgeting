<template lang="pug">
  q-page.bg-grey-2.relative
    // Header
    .bg-white.q-px-md.q-py-md.row.items-center.fixed-top
      q-btn(flat round dense icon="arrow_back" @click="$router.back()")
      h1.text-h6.q-ml-sm.q-my-none Transaction History

    // Search and Filters (with appropriate spacing from fixed header)
    .bg-white.q-px-md.q-py-sm.q-mt-lg
      .q-mb-sm.relative
        q-input(
          v-model="searchQuery"
          placeholder="Search transactions..."
          outlined
          dense
          bg-color="grey-2"
          clearable
        )
          template(v-slot:prepend)
            q-icon(name="search" size="sm" color="grey-6")

      .row.no-wrap.overflow-auto.q-gutter-x-sm.q-mb-sm.scrollbar-hide
        q-btn.q-px-sm(
          :color="activeFilter === 'All' ? 'indigo-1' : 'grey-3'"
          :text-color="activeFilter === 'All' ? 'indigo' : 'grey-8'"
          :class="{'text-weight-medium': activeFilter === 'All'}"
          dense
          rounded
          unelevated
          no-caps
          label="All"
          @click="activeFilter = 'All'"
        )
        q-btn.q-px-sm(
          :color="activeFilter === 'Date' ? 'indigo-1' : 'grey-3'"
          :text-color="activeFilter === 'Date' ? 'indigo' : 'grey-8'"
          :class="{'text-weight-medium': activeFilter === 'Date'}"
          dense
          rounded
          unelevated
          no-caps
          @click="activeFilter = 'Date'"
        )
          q-icon(name="event" size="xs" class="q-mr-xs")
          | Date
        q-btn.q-px-sm(
          :color="activeFilter === 'Category' ? 'indigo-1' : 'grey-3'"
          :text-color="activeFilter === 'Category' ? 'indigo' : 'grey-8'"
          :class="{'text-weight-medium': activeFilter === 'Category'}"
          dense
          rounded
          unelevated
          no-caps
          @click="activeFilter = 'Category'"
        )
          q-icon(name="filter_list" size="xs" class="q-mr-xs")
          | Category
        q-btn.q-px-sm(
          :color="activeFilter === 'Amount' ? 'indigo-1' : 'grey-3'"
          :text-color="activeFilter === 'Amount' ? 'indigo' : 'grey-8'"
          :class="{'text-weight-medium': activeFilter === 'Amount'}"
          dense
          rounded
          unelevated
          no-caps
          @click="activeFilter = 'Amount'"
        )
          q-icon(name="filter_list" size="xs" class="q-mr-xs")
          | Amount

    // Loading State
    div(v-if="loading" class="flex-center q-pa-xl q-mt-lg")
      q-spinner(color="primary" size="3em")
      .text-subtitle1.q-ml-md Loading transactions...

    // Empty State
    div(v-else-if="Object.keys(groupedExpenses).length === 0" class="flex-center column q-pa-xl q-mt-lg")
      q-icon(name="search_off" size="4em" color="grey-5")
      .text-h6.text-grey-8.q-mt-md No transactions found
      .text-subtitle2.text-grey-6.q-mb-lg Try changing your search or filters

    // Transaction List
    .q-pa-md.q-pb-xl.q-mt-lg(v-else)
      template(v-for="(transactions, date) in groupedExpenses" :key="date")
        .q-mb-md
          .row.justify-between.items-center.q-mb-sm
            .text-body2.text-weight-medium.text-grey-7 {{ formatDateHeader(date) }}
            .text-caption.text-grey-7 {{ transactions.length }} transactions

          q-card.q-mb-sm.transaction-card(
            v-for="expense in transactions"
            :key="expense._id"
            flat
            bordered
            @click="showExpenseDetails(expense)"
          )
            q-card-section.q-py-sm
              .row.items-start
                .category-icon.q-mr-md.flex-center {{ getCategoryIcon(expense.category) }}
                .col
                  .font-medium {{ expense.description }}
                  .row.items-center.q-mt-xs
                    q-icon(name="sell" size="xs" color="grey-6" class="q-mr-xs")
                    span.text-caption.text-grey-7.q-mr-sm {{ expense.category }}
                    q-icon(name="schedule" size="xs" color="grey-6" class="q-mr-xs")
                    span.text-caption.text-grey-7 {{ formatTime(expense.date) }}
                .col-auto.text-right
                  .text-weight-bold ${{ expense.amount.toFixed(2) }}
                  .text-caption.text-grey-7.q-mt-xs Card

    // Detail Panel Dialog
    q-dialog(
      v-model="showDetailPanel"
      position="right"
      full-height
      maximized
      transition-show="slide-left"
      transition-hide="slide-right"
    )
      q-card.column
        // Header
        q-card-section.q-px-md.q-py-md.row.items-center
          q-btn(flat round dense icon="arrow_back" v-close-popup)
          h6.text-h6.q-ml-sm.q-my-none Transaction Details

        // Content
        q-card-section.q-px-md.q-py-sm.col(v-if="selectedExpense")
          // Transaction Header
          .row.items-center.justify-between.q-mb-xl
            .row.items-center
              .category-icon-lg.q-mr-md.flex-center {{ getCategoryIcon(selectedExpense.category) }}
              .column
                .text-h6.text-weight-bold {{ selectedExpense.description }}
                .text-grey-7 {{ selectedExpense.category }}
            .text-h5.text-weight-bold ${{ selectedExpense.amount.toFixed(2) }}

          // Transaction Details
          q-card.bg-grey-2.q-mb-lg
            q-card-section
              .row.q-col-gutter-md
                .col-6
                  .text-caption.text-grey-7 Date
                  .text-body1.text-weight-medium {{ formatDate(selectedExpense.date) }}
                .col-6
                  .text-caption.text-grey-7 Time
                  .text-body1.text-weight-medium {{ formatTime(selectedExpense.date) }}
                .col-6
                  .text-caption.text-grey-7 Payment Method
                  .text-body1.text-weight-medium Card
                .col-6
                  .text-caption.text-grey-7 Category
                  .text-body1.text-weight-medium {{ selectedExpense.category }}

          // Action Buttons
          .row.q-col-gutter-md.q-mt-lg
            .col-6
              q-btn.full-width(
                color="indigo"
                label="Edit"
                no-caps
                unelevated
                @click="editExpense(selectedExpense)"
              )
                q-icon(name="edit" size="xs" class="q-mr-xs")
            .col-6
              q-btn.full-width(
                color="red-1"
                text-color="red"
                label="Delete"
                no-caps
                unelevated
                @click="confirmDelete(selectedExpense)"
              )
                q-icon(name="delete" size="xs" class="q-mr-xs")

          .row.q-col-gutter-md.q-mt-md
            .col-6
              q-btn.full-width(
                color="grey-3"
                text-color="grey-8"
                label="Export"
                no-caps
                unelevated
              )
                q-icon(name="file_download" size="xs" class="q-mr-xs")
            .col-6
              q-btn.full-width(
                color="grey-3"
                text-color="grey-8"
                label="Share"
                no-caps
                unelevated
              )
                q-icon(name="share" size="xs" class="q-mr-xs")

        // Delete Confirmation Dialog
        q-dialog(v-model="showDeleteDialog")
          q-card
            q-card-section
              .text-h6 Delete Expense
            q-card-section
              p Are you sure you want to delete this expense?
            q-card-actions(align="right")
              q-btn(flat label="Cancel" color="grey-7" v-close-popup)
              q-btn(
                flat
                label="Delete"
                color="negative"
                @click="deleteExpense"
                v-close-popup
              )

    // Bottom Navigation (copy from Dashboard)
    .q-pa-md.fixed-bottom.bg-white.row.justify-around.items-center.navigation-bar
      q-btn(flat no-caps color="indigo" to="/history")
        .column.items-center
          q-icon(name="receipt_long" size="sm")
          span.text-xs.q-mt-xs Expenses

      q-btn(round color="indigo" icon="add" class="add-button" size="lg" @click="showAddDialog = true")

      q-btn(flat no-caps color="grey-7" to="/analytics")
        .column.items-center
          q-icon(name="insights" size="sm")
          span.text-xs.q-mt-xs Analytics

    // Add Expense Dialog
    add-expense-dialog(
      v-model="showAddDialog"
      :edit-id="editExpenseId"
      @expense-saved="onExpenseSaved"
    )
  </template>

  <script lang="ts">
  import { defineComponent, ref, computed, onMounted, watch } from 'vue'
  import { date, useQuasar } from 'quasar'
  import { useRouter } from 'vue-router'
  import type { RDExpense } from 'src/services/expenses'
  import { expenseService } from 'src/services/expenses'
  import AddExpenseDialog from 'src/components/AddExpenseDialog.vue'

  export default defineComponent({
    name: 'TransactionHistoryPage',
    components: {
      AddExpenseDialog
    },
    setup() {
      const $q = useQuasar()
      const router = useRouter()

      // State
      const expenses = ref<RDExpense[]>([])
      const loading = ref(true)
      const searchQuery = ref('')
      const activeFilter = ref('All')
      const showDetailPanel = ref(false)
      const selectedExpense = ref<RDExpense | null>(null)
      const showDeleteDialog = ref(false)
      const showAddDialog = ref(false)
      const editExpenseId = ref<string | null>(null)

      // Group expenses by date
      const groupedExpenses = computed(() => {
        // First apply search filter if any
        let filteredExpenses = expenses.value

        if (searchQuery.value.trim()) {
          const query = searchQuery.value.toLowerCase()
          filteredExpenses = filteredExpenses.filter(expense =>
            expense.description.toLowerCase().includes(query) ||
            expense.category.toLowerCase().includes(query) ||
            expense.amount.toString().includes(query)
          )
        }

        // Apply sorting based on filter
        let sortedExpenses = [...filteredExpenses]

        if (activeFilter.value === 'Date') {
          // Already sorted by date in the default grouping
          sortedExpenses = filteredExpenses
        } else if (activeFilter.value === 'Category') {
          // Sort by category alphabetically
          sortedExpenses = filteredExpenses.sort((a, b) =>
            a.category.localeCompare(b.category)
          )
        } else if (activeFilter.value === 'Amount') {
          // Sort by amount (highest first)
          sortedExpenses = filteredExpenses.sort((a, b) =>
            b.amount - a.amount
          )
        }

        // Group by date
        return sortedExpenses.reduce((groups, expense) => {
          const expenseDate = date.formatDate(new Date(expense.date), 'YYYY-MM-DD')
          if (!groups[expenseDate]) {
            groups[expenseDate] = []
          }
          groups[expenseDate].push(expense)
          return groups
        }, {} as Record<string, RDExpense[]>)
      })

      // Format methods
      const formatDate = (dateString: string | Date): string => {
        return date.formatDate(new Date(dateString), 'YYYY-MM-DD')
      }

      const formatDateHeader = (dateString: string): string => {
        return date.formatDate(new Date(dateString), 'ddd, MMM D, YYYY')
      }

      const formatTime = (dateString: string | Date): string => {
        return date.formatDate(new Date(dateString), 'h:mm A')
      }

      // Get category icon
      const getCategoryIcon = (category: string): string => {
        const iconMap: Record<string, string> = {
          'Food': '🍔',
          'Housing': '🏠',
          'Transportation': '🚗',
          'Entertainment': '🎬',
          'Utilities': '💡',
          'Transport': '🚗',
          'Entertain': '🎬',
          'Other': '📦'
        }
        return iconMap[category] || '📝'
      }

      // Show expense details
      const showExpenseDetails = (expense: RDExpense) => {
        selectedExpense.value = expense
        showDetailPanel.value = true
      }

      // Edit expense
      const editExpense = (expense: RDExpense) => {
        if (!expense._id) return

        editExpenseId.value = expense._id
        showAddDialog.value = true
        showDetailPanel.value = false
      }

      // Confirm delete
      const confirmDelete = (expense: RDExpense) => {
        selectedExpense.value = expense
        showDeleteDialog.value = true
      }

      // Delete expense
      const deleteExpense = async () => {
        if (!selectedExpense.value?._id) return

        try {
          await expenseService.delete(selectedExpense.value._id)
          $q.notify({
            color: 'positive',
            message: 'Expense deleted successfully',
            icon: 'check'
          })
          await loadExpenses()
          showDetailPanel.value = false
        } catch (error) {
          console.error('Error deleting expense:', error)
        }
      }

      // Load expenses
      const loadExpenses = async (): Promise<void> => {
        loading.value = true
        try {
          expenses.value = await expenseService.getAll()
        } catch (error) {
          console.error('Error loading expenses:', error)
          $q.notify({
            color: 'negative',
            message: 'Failed to load expenses',
            icon: 'error'
          })
          expenses.value = []
        } finally {
          loading.value = false
        }
      }

      // Handle expense saved event
      const onExpenseSaved = async () => {
        await loadExpenses()
        editExpenseId.value = null
      }

      // Watch for search query changes to filter results
      watch(searchQuery, () => {
        // No need to reload, the computed property will handle filtering
      })

      // Watch for filter changes
      watch(activeFilter, () => {
        // No need to reload, the computed property will handle filtering
      })

      // Load initial data
      onMounted(async () => {
        await loadExpenses()
      })

      return {
        expenses,
        loading,
        searchQuery,
        activeFilter,
        groupedExpenses,
        showDetailPanel,
        selectedExpense,
        showDeleteDialog,
        showAddDialog,
        editExpenseId,
        formatDate,
        formatDateHeader,
        formatTime,
        getCategoryIcon,
        showExpenseDetails,
        editExpense,
        confirmDelete,
        deleteExpense,
        loadExpenses,
        onExpenseSaved
      }
    }
  })
  </script>

  <style lang="scss" scoped>
  .scrollbar-hide {
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }

  .category-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: rgba(79, 70, 229, 0.1);
    font-size: 20px;
  }

  .category-icon-lg {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background-color: rgba(79, 70, 229, 0.1);
    font-size: 24px;
  }

  .flex-center {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .transaction-card {
    border-color: #f3f4f6;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }

  .border-top {
    border-top: 1px solid #f3f4f6;
  }

  // Add spacing to account for fixed header
  .q-mt-lg {
    margin-top: 56px;
  }

  .navigation-bar {
    border-top: 1px solid #e5e7eb;
    padding-bottom: env(safe-area-inset-bottom);
  }

  .add-button {
    margin-top: -40px;
  }
  </style>
