/**
 * 格式化工具函数
 */
import Decimal from 'decimal.js';

/**
 * 格式化USDT金额（8位精度，去除后缀0）
 * @param {number|string|null|undefined} amount USDT金额
 * @returns {string} 格式化后的USDT金额字符串
 */
export function formatUsdt(amount) {
  if (amount === null || amount === undefined || amount === '') {
    return '0';
  }
  
  try {
    // 使用Decimal.js进行精确计算，避免浮点数精度问题
    const decimal = new Decimal(amount);
    // 使用8位精度，然后去除后缀0
    const fixed = decimal.toFixed(8);
    // 去除后缀0和小数点（如果小数部分全为0）
    return fixed.replace(/\.?0+$/, '');
  } catch (e) {
    return '0';
  }
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
  
  try {
    // 使用Decimal.js进行精确计算，避免浮点数精度问题
    const decimal = new Decimal(amount);
    // 使用18位精度，然后去除后缀0
    const fixed = decimal.toFixed(18);
    // 去除后缀0和小数点（如果小数部分全为0）
    return fixed.replace(/\.?0+$/, '');
  } catch (e) {
    return '0';
  }
}

