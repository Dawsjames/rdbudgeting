<template lang="pug">
  q-dialog(
    v-model="showDialog"
    persistent
    transition-show="scale"
    transition-hide="scale"
  )
    q-card(style="width: 90vw; max-width: 400px")
      q-card-section.row.items-center.q-pb-none
        .text-h6 {{ isEditing ? 'Edit Expense' : 'Add New Expense' }}
        q-space
        q-btn(icon="close" flat round dense v-close-popup @click="resetForm")

      q-form(
        ref="expenseForm"
        @submit.prevent="saveExpense"
        class="q-gutter-y-md q-px-md q-pt-md"
      )
        q-input(
          v-model="form.description"
          label="Description"
          :rules="[(val) => !!val && val.trim() !== '' || 'Description is required']"
          outlined
          dense
          ref="descriptionRef"
          lazy-rules
        )
          template(v-slot:prepend)
            q-icon(name="description")

        q-input(
          v-model.number="form.amount"
          label="Amount"
          type="number"
          prefix="$"
          step="0.01"
          :rules="requiredPositiveNumberRules"
          outlined
          dense
          lazy-rules
        )
          template(v-slot:prepend)
            q-icon(name="attach_money")

        q-select(
          v-model="form.category"
          :options="categories"
          label="Category"
          :rules="[(val) => !!val || 'Category is required']"
          outlined
          dense
          lazy-rules
        )
          template(v-slot:prepend)
            q-icon(name="category")
          template(v-slot:option="scope")
            q-item(v-bind="scope.itemProps")
              q-item-section(avatar)
                .category-icon-sm.flex-center {{ getCategoryIcon(scope.opt) }}
              q-item-section
                q-item-label {{ scope.opt }}

        q-input(
          v-model="form.date"
          label="Date"
          :rules="[(val) => !!val || 'Date is required']"
          outlined
          dense
          lazy-rules
          readonly
        )
          template(v-slot:prepend)
            q-icon(name="event")
          template(v-slot:append)
            q-icon(name="event" class="cursor-pointer")
              q-popup-proxy(cover transition-show="scale" transition-hide="scale")
                q-date(
                  v-model="form.date"
                  mask="YYYY-MM-DD"
                  today-btn
                )

      q-card-actions(align="right" class="q-pb-md q-px-md")
        q-btn(
          label="Cancel"
          color="grey-7"
          flat
          v-close-popup
          @click="resetForm"
        )
        q-btn(
          label="Save"
          color="primary"
          :loading="saving"
          @click="validateAndSave"
        )
</template>

<script lang="ts">
import { defineComponent, ref, computed, nextTick, watch } from 'vue'
import { useQuasar } from 'quasar'
import type { ExpenseForm } from 'src/services/expenses'
import { expenseService } from 'src/services/expenses'

export default defineComponent({
  name: 'AddExpenseDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    editId: {
      type: String,
      default: null
    }
  },
  emits: ['update:modelValue', 'expense-saved'],
  setup(props, { emit }) {
    // Use Quasar's notification system directly for more reliability
    const $q = useQuasar()
    const descriptionRef = ref<HTMLElement | null>(null)
    const expenseForm = ref<any>(null)
    const saving = ref(false)

    // Form validation rules
    const requiredPositiveNumberRules = [
      (val: any) => (val !== null && val !== undefined && val !== '') || 'Amount is required',
      (val: any) => Number(val) > 0 || 'Amount must be greater than zero'
    ]

    // Form data - initialize with default values
    const form = ref<ExpenseForm>({
      description: '',
      amount: 0,
      category: '',
      date: new Date().toISOString().substring(0, 10)
    })

    // Dialog state
    const showDialog = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    })

    // Check if editing
    const isEditing = computed(() => !!props.editId)

    // Category list with consistent options
    const categories = [
      'Food', 'Transportation', 'Housing', 'Entertainment', 'Utilities', 'Other'
    ]

    // Category icon mapping
    const getCategoryIcon = (category: string): string => {
      const iconMap: Record<string, string> = {
        'Food': '🍔',
        'Housing': '🏠',
        'Transportation': '🚗',
        'Entertainment': '🎬',
        'Utilities': '💡',
        'Other': '📦'
      }
      return iconMap[category] || '📝'
    }

    // Reset form
    const resetForm = () => {
      form.value = {
        description: '',
        amount: 0,
        category: '',
        date: new Date().toISOString().substring(0, 10)
      }
    }

    // Load expense for editing
    const loadExpense = async () => {
      if (!props.editId) return

      try {
        const expense = await expenseService.getById(props.editId)
        form.value = {
          description: expense.description,
          amount: expense.amount,
          category: expense.category,
          date: expenseService.formatDate(expense.date)
        }
      } catch (error) {
        console.error('Error loading expense for editing:', error)
        // Use Quasar's notification directly
        $q.notify({
          color: 'negative',
          message: 'Could not load expense details',
          icon: 'error'
        })
      }
    }

    // Validate form and save expense
    const validateAndSave = async () => {
      if (!expenseForm.value) {
        console.error('Form reference not available');
        return;
      }

      try {
        const isValid = await expenseForm.value.validate();
        if (isValid) {
          saveExpense();
        }
      } catch (err) {
        console.error('Form validation error:', err);
      }
    }

    // Safe notification function that doesn't rely on the service
    const showNotification = (type: 'positive' | 'negative', message: string, icon = '') => {
      try {
        $q.notify({
          color: type,
          message: message,
          icon: icon || (type === 'positive' ? 'check' : 'error')
        })
      } catch (error) {
        console.log(`[${type.toUpperCase()}] ${message}`)
        console.error('Failed to show notification:', error)
      }
    }

    // Save expense
    const saveExpense = async () => {
      saving.value = true

      try {
        // Validate amount is a number
        if (typeof form.value.amount !== 'number' || isNaN(form.value.amount)) {
          form.value.amount = parseFloat(form.value.amount);

          if (isNaN(form.value.amount)) {
            showNotification('negative', 'Amount must be a valid number');
            saving.value = false;
            return;
          }
        }

        // Ensure amount is positive
        if (form.value.amount <= 0) {
          showNotification('negative', 'Amount must be greater than zero');
          saving.value = false;
          return;
        }

        if (isEditing.value && props.editId) {
          await expenseService.update(props.editId, form.value);
          showNotification('positive', 'Expense updated successfully', 'check');
        } else {
          await expenseService.create(form.value);
          showNotification('positive', 'Expense added successfully', 'check');
        }

        resetForm();
        showDialog.value = false;
        emit('expense-saved');
      } catch (error) {
        console.error('Error saving expense:', error);
        showNotification('negative', 'Failed to save expense. Please try again.');
      } finally {
        saving.value = false;
      }
    }

    // Watch for editId changes
    watch(() => props.editId, (newVal) => {
      if (newVal) {
        loadExpense();
      } else {
        resetForm();
      }
    });

    // Watch for dialog opening
    watch(showDialog, async (newVal: boolean) => {
      if (newVal) {
        // If editing, load the expense
        if (props.editId) {
          await loadExpense();
        } else {
          resetForm();
        }

        // Focus on description field after dialog is fully rendered
        await nextTick();
        if (descriptionRef.value) {
          descriptionRef.value.focus();
        }
      }
    });

    return {
      form,
      showDialog,
      isEditing,
      categories,
      descriptionRef,
      expenseForm,
      saving,
      getCategoryIcon,
      saveExpense,
      validateAndSave,
      resetForm,
      requiredPositiveNumberRules
    }
  }
})
</script>

<style lang="scss" scoped>
.category-icon-sm {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: rgba(79, 70, 229, 0.1);
  font-size: 14px;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
