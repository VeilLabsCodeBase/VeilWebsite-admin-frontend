export const shortenAddress = (address, prefixLength = 6, suffixLength = 4) => {
    if (!address || typeof address !== 'string') {
        return '-'
    }
    const trimmed = address.trim()
    if (trimmed.length <= prefixLength + suffixLength) {
        return trimmed
    }
    return `${trimmed.slice(0, prefixLength)}...${trimmed.slice(-suffixLength)}`
}

export const copyText = async (text) => {
    if (!text) {
        throw new Error('复制内容为空')
    }
    if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        return
    }

    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', 'readonly')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const success = document.execCommand('copy')
    document.body.removeChild(textarea)

    if (!success) {
        throw new Error('复制失败，请手动复制')
    }
}
