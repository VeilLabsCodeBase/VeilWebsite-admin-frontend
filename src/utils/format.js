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

/**
 * 格式化加密货币金额
 * 规则：最多保留8位小数，去除末尾0，但至少保留2位小数（例如整数显示为.00），包含千位分隔符
 * @param {number|string|null|undefined} amount 金额
 * @returns {string} 格式化后的金额字符串
 */
export function formatCrypto(amount) {
  if (amount === null || amount === undefined || amount === '') {
    return '0.00';
  }

  try {
    const val = new Decimal(amount);
    if (val.isNaN()) return '0.00';

    // 格式化为8位小数
    let formatted = val.toFixed(8);

    // 去除末尾的0，但保留小数点
    formatted = formatted.replace(/0+$/, '');
    
    // 如果最后一位是小数点，补两个0 (例如 "10." -> "10.00")
    if (formatted.endsWith('.')) {
      formatted += '00';
    } else {
      // 检查小数位数
      const parts = formatted.split('.');
      // 如果只有一位小数，补一个0
      if (parts[1] && parts[1].length < 2) {
        formatted += '0';
      }
    }

    // 添加千位分隔符
    const parts = formatted.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');

  } catch (e) {
    console.warn('Error formatting crypto amount:', e);
    return '0.00';
  }
}

/**
 * 格式化日期时间为 yyyy-MM-dd HH:mm:ss
 * @param {string|Date|null|undefined} dateStr 日期时间字符串或Date对象
 * @returns {string} 格式化后的日期时间字符串，如果为空则返回 '-'
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  
  try {
    const date = new Date(dateStr);
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return '-';
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (e) {
    // 如果已经是日期时间格式，尝试解析
    if (typeof dateStr === 'string') {
      // 尝试匹配 yyyy-MM-dd HH:mm:ss 或类似格式
      const match = dateStr.match(/(\d{4}-\d{2}-\d{2})[\sT](\d{2}):(\d{2}):(\d{2})/);
      if (match) {
        return `${match[1]} ${match[2]}:${match[3]}:${match[4]}`;
      }
      // 如果只有日期部分，返回日期
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
        return dateStr.substring(0, 10) + ' 00:00:00';
      }
    }
    return '-';
  }
}

