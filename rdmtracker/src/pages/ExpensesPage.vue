<template lang="pug">
  q-page(padding)
    .row.items-center.q-mb-md
      .col
        h5.q-mt-none.q-mb-xs Expense Management
      .col-auto
        q-btn(color="primary" icon="add" label="Add Expense" @click="showAddDialog = true")

    // Expenses Table
    q-table(
      :rows="expenses"
      :columns="columns"
      :loading="loading"
      row-key="_id"
      :pagination="{ rowsPerPage: 10 }"
    )
      template(v-slot:body-cell-amount="props")
        q-td(:props="props")
          | ₱ {{ props.value.toFixed(2) }}

      template(v-slot:body-cell-date="props")
        q-td(:props="props")
          | {{ formatDate(props.value) }}

      template(v-slot:body-cell-actions="props")
        q-td(:props="props" class="q-gutter-x-sm")
          q-btn(flat round color="primary" icon="edit" @click="editExpense(props.row)")
          q-btn(flat round color="negative" icon="delete" @click="confirmDelete(props.row)")

    // Add Dialog
    q-dialog(v-model="showAddDialog")
      q-card(style="min-width: 350px")
        q-card-section
          .text-h6 {{ isEditing ? 'Edit' : 'Add' }} Expense

        q-form(@submit="saveExpense" class="q-px-sm q-pb-sm")
          q-card-section.q-pt-none
            q-input(
              v-model="form.description"
              label="Description"
              :rules="[val => !!val || 'Description is required']"
              autofocus
            )
            q-input(
              v-model.number="form.amount"
              label="Amount"
              type="number"
              prefix="₱"
              :rules="[val => !!val || 'Amount is required']"
            )
            q-select(
              v-model="form.category"
              :options="categories"
              label="Category"
              :rules="[val => !!val || 'Category is required']"
            )
            q-input(
              v-model="form.date"
              label="Date"
              :rules="[val => !!val || 'Date is required']"
            )
              template(v-slot:append)
                q-icon(name="event" class="cursor-pointer")
                  q-popup-proxy(cover transition-show="scale" transition-hide="scale")
                    q-date(v-model="form.date")

          q-card-actions(align="right")
            q-btn(label="Cancel" color="primary" flat v-close-popup)
            q-btn(label="Save" type="submit" color="primary")

    // Delete Confirmation Dialog
    q-dialog(v-model="showDeleteDialog")
      q-card
        q-card-section.row.items-center
          q-avatar(icon="warning" color="negative" text-color="white")
          .text-h6.q-ml-sm Delete Expense

        q-card-section
          p Are you sure you want to delete this expense?

        q-card-actions(align="right")
          q-btn(flat label="Cancel" color="primary" v-close-popup)
          q-btn(flat label="Delete" color="negative" @click="deleteExpense" v-close-popup)
  </template>

  <script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useQuasar } from 'quasar'
  import { RDExpense, expenseService } from 'src/services/expenses'

  const $q = useQuasar()

  // Data
  const expenses = ref<RDExpense[]>([])
  const loading = ref(true)
  const showAddDialog = ref(false)
  const showDeleteDialog = ref(false)
  const isEditing = ref(false)
  const selectedExpenseId = ref<string | null>(null)

  // Form state
  const form = ref({
    description: '',
    amount: 0,
    category: '',
    date: new Date().toISOString().split('T')[0]
  })

  // Expense categories
  const categories = [
    'Food', 'Transportation', 'Housing', 'Entertainment', 'Utilities', 'Other'
  ]

  // Table columns
  const columns = [
    { name: 'date', align: 'left', label: 'Date', field: 'date', sortable: true },
    { name: 'description', align: 'left', label: 'Description', field: 'description', sortable: true },
    { name: 'category', align: 'left', label: 'Category', field: 'category', sortable: true },
    { name: 'amount', align: 'right', label: 'Amount', field: 'amount', sortable: true },
    { name: 'actions', align: 'center', label: 'Actions', field: '_id' }
  ]

  // Format date for display
  function formatDate(dateString: string | Date): string {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  // Load all expenses
  async function loadExpenses() {
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
    } finally {
      loading.value = false
    }
  }

  // Handle edit expense
  function editExpense(expense: RDExpense) {
    isEditing.value = true
    selectedExpenseId.value = expense._id || null
    form.value = {
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      date: new Date(expense.date).toISOString().split('T')[0]
    }
    showAddDialog.value = true
  }

  // Handle confirm delete
  function confirmDelete(expense: RDExpense) {
    selectedExpenseId.value = expense._id || null
    showDeleteDialog.value = true
  }

  // Handle delete expense
  async function deleteExpense() {
    if (!selectedExpenseId.value) return

    try {
      await expenseService.delete(selectedExpenseId.value)
      $q.notify({
        color: 'positive',
        message: 'Expense deleted successfully',
        icon: 'check'
      })
      loadExpenses()
    } catch (error) {
      console.error('Error deleting expense:', error)
      $q.notify({
        color: 'negative',
        message: 'Failed to delete expense',
        icon: 'error'
      })
    }
  }

  // Save new or updated expense
  async function saveExpense() {
    try {
      if (isEditing.value && selectedExpenseId.value) {
        await expenseService.update(selectedExpenseId.value, form.value)
        $q.notify({
          color: 'positive',
          message: 'Expense updated successfully',
          icon: 'check'
        })
      } else {
        await expenseService.create(form.value)
        $q.notify({
          color: 'positive',
          message: 'Expense added successfully',
          icon: 'check'
        })
      }

      // Reset form and close dialog
      showAddDialog.value = false
      resetForm()
      loadExpenses()
    } catch (error) {
      console.error('Error saving expense:', error)
      $q.notify({
        color: 'negative',
        message: 'Failed to save expense',
        icon: 'error'
      })
    }
  }

  // Reset form to default values
  function resetForm() {
    form.value = {
      description: '',
      amount: 0,
      category: '',
      date: new Date().toISOString().split('T')[0]
    }
    isEditing.value = false
    selectedExpenseId.value = null
  }

  // Load expenses when component mounts
  onMounted(() => {
    loadExpenses()
  })
  </script>
