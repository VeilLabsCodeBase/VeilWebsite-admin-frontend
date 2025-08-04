<template>
    <section class="pageLoading">
        <div
            class="loadingBox"
            v-if="!initData || JSON.stringify(initData) === '{}' || JSON.stringify(initData) === '[]'"
        >
            <Loading></Loading>
        </div>
        <div
            class="viewContent"
            v-if="initData && JSON.stringify(initData) !== '{}' && JSON.stringify(initData) !== '[]'"
        >
            <slot></slot>
        </div>
    </section>
</template>
<script setup>
const props = defineProps({
    initData: {},
})
</script>
<style lang="scss" scoped>
.pageLoding {
    color: #fff;
    width: 100%;
    .loadingBox {
        width: 100%;
        margin-top: 20%;
        position: relative;
        z-index: 1000;
    }
    .viewContent {
        width: 100%;
    }
}
</style>
