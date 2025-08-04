<template>
    <StartPage v-if="init" />
</template>
<script setup>
import { useInit } from '@/utils/useInit'
const init = !window.location.pathname.startsWith('/special/')
if (init) useInit() // 初始化数据
</script>
<style lang="scss" scoped></style>
