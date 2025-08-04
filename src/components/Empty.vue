<template>
    <section>
        <div class="empty">
            <div class="pic"><img src="@/assets/images/icon/empty.png" alt="" /></div>
            <div class="text">暂无数据</div>
        </div>
    </section>
</template>
<script setup></script>
<style lang="scss" scoped>
.empty {
    width: 100%;
    // height: 30vw;
    padding-top: 0.7rem;
    display: flex;
    justify-content: center;
    flex-direction: column;
    .pic {
        width: 100%;
        text-align: center;
        img {
            width: 30%;
        }
    }
    .text {
        text-align: center;
        font-size: 0.14rem;
        color: rgba(255, 255, 255, 0.4);
        margin-top: 0.2rem;
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
