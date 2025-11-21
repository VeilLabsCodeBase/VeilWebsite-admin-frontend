/**
 * 格式化工具函数
 */

/**
 * 格式化USDT金额（8位精度，去除后缀0）
 * @param {number|string|null|undefined} amount USDT金额
 * @returns {string} 格式化后的USDT金额字符串
 */
export function formatUsdt(amount) {
  if (amount === null || amount === undefined || amount === '') {
    return '0';
  }
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '0';
  }
  
  // 使用8位精度，然后去除后缀0
  const fixed = numAmount.toFixed(8);
  // 去除后缀0和小数点（如果小数部分全为0）
  return fixed.replace(/\.?0+$/, '');
}

/**
 * 格式化Token金额（18位精度，去除后缀0）
 * @param {number|string|null|undefined} amount Token金额
 * @returns {string} 格式化后的Token金额字符串
 */
export function formatToken(amount) {
  if (amount === null || amount === undefined || amount === '') {
    return '0';
  }
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '0';
  }
  
  // 使用18位精度，然后去除后缀0
  const fixed = numAmount.toFixed(18);
  // 去除后缀0和小数点（如果小数部分全为0）
  return fixed.replace(/\.?0+$/, '');
}

