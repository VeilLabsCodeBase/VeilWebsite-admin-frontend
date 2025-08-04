<template>
    <RouterView v-slot="{ Component }">
            <Component :is="Component"></Component>
    </RouterView>
 
</template>

<script setup>

</script>

<style lang="scss"></style>
