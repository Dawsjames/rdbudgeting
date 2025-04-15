<template>
  <div></div>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue'
import { useRouter } from 'vue-router'

export default defineComponent({
  name: 'IndexPage',
  setup() {
    const router = useRouter()

    onMounted(async () => {
      await router.replace('/expenses')
    })
  }
})
</script>
