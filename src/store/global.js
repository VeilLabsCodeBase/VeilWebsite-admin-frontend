export const useGlobalStore = defineStore('global', () => {
    /**
     * 缓存的组件
     */
    const aliveList = ref(['square',])
    const _DeleteAlive = name => {
        aliveList.value = aliveList.value.filter(e => {
            return e !== name
        })
    }
    const _ClearAlive = () => {
        aliveList.value = []
    }
    const _AddAlive = name => {
        aliveList.value.push(name)
    }

    const scrollTop = ref({})
    const addScrollTop = (key, value) => {
        scrollTop.value[key] = value
    }

    const token = ref('')
    const addToken = (value) => {
        token.value = value
    }
  

    return {
        aliveList,
        _DeleteAlive,
        _ClearAlive,
        _AddAlive,
        scrollTop,
        addScrollTop,
        token,
        addToken
        
    }
})
