<template>
    <section class="loading">
        <div class="pic"><img src="@/assets/images/icon/loading.gif" alt="" /></div>
    </section>
</template>
<script setup></script>
<style lang="scss" scoped>
.loading {
    width: 100%;
    // height: 30vw;
    padding-top: 0.7rem;
    display: flex;
    justify-content: center;
    .pic {
        width: 100%;
        text-align: center;
        img {
            height: 0.2rem;
            position: relative;
            z-index: 10000;
        }
    }
}
@media screen and (min-width: 780px) {
    .ad {
        width: 100%;
        height: calc(780px * 0.3);
        padding: 0 0.2rem;
        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 0.08rem;
        }
    }
}
</style>
