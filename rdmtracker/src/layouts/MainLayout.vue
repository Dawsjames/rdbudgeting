<template lang="pug">
  q-layout(view="lHh Lpr lff")
    // The drawer is for navigation options
    q-drawer(
      v-model="leftDrawerOpen"
      bordered
      :width="250"
      :breakpoint="990"
      class="q-mt-lg"
    )
      q-scroll-area.fit
        q-list
          q-item-label(header) RDM Expense Tracker

          q-item(to="/" exact clickable v-ripple)
            q-item-section(avatar)
              q-icon(name="dashboard")
            q-item-section Dashboard

          q-item(to="/history" exact clickable v-ripple)
            q-item-section(avatar)
              q-icon(name="receipt_long")
            q-item-section Expenses

          q-item(to="/analytics" exact clickable v-ripple)
            q-item-section(avatar)
              q-icon(name="bar_chart")
            q-item-section Analytics

          q-separator

          q-item(clickable v-ripple)
            q-item-section(avatar)
              q-icon(name="settings")
            q-item-section Settings

          q-item(clickable v-ripple)
            q-item-section(avatar)
              q-icon(name="help")
            q-item-section Help

          // App version info
          q-item-label(header class="q-mt-lg text-grey-7")
            | App Version: {{ appVersion }}

    q-page-container
      router-view
  </template>

  <script lang="ts">
  import { defineComponent, ref, provide } from 'vue'
  import { useQuasar } from 'quasar'

  export default defineComponent({
    name: 'MainLayout',
    setup() {
      const $q = useQuasar()
      const leftDrawerOpen = ref(false)
      const appVersion = '1.0.0' // App version tracking

      // Toggle drawer function
      function toggleLeftDrawer() {
        leftDrawerOpen.value = !leftDrawerOpen.value
      }

      // Make drawer toggle available to child components
      provide('toggleDrawer', toggleLeftDrawer)

      // Register the toggle function with Quasar for global access
      $q.drawer = {
        toggle: toggleLeftDrawer,
        open: () => { leftDrawerOpen.value = true },
        close: () => { leftDrawerOpen.value = false }
      }

      return {
        leftDrawerOpen,
        toggleLeftDrawer,
        appVersion
      }
    }
  })
  </script>

  <style lang="scss">
  // Apply some global styles for mobile
  body {
    // Prevent overscroll bounce effect on mobile
    overscroll-behavior: none;

    // Apply safe-area-inset for iOS devices
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
  }

  // For a more native feel, disable text selection on mobile
  .q-page {
    user-select: none;
  }
  </style>
