<template>
  <div class="page" v-loading="pageLoading">

    <!-- 顶部栏 -->
    <div class="page-header">
      <div>
        <h2 class="page-title">积分价格管理</h2>
        <p class="page-sub">管控代币积分兑换汇率 · 每次设置均保留完整历史</p>
      </div>
      <el-button type="primary" @click="showSetDialog" class="primary-btn">
        <el-icon><Plus /></el-icon>设置新价格
      </el-button>
    </div>

    <!-- 三统计卡：CSS Grid 等宽等高 -->
    <div class="stat-grid">

      <div class="stat-card">
        <div class="stat-card__label"><span class="dot dot--green"></span>当前生效价格</div>
        <div class="stat-card__price" v-if="currentPrice">
          {{ formatPrice(currentPrice.price) }}<span class="stat-unit">USDT/积分</span>
        </div>
        <div class="stat-card__price stat--empty" v-else>暂未设置</div>
        <div class="stat-card__meta" v-if="currentPrice">
          <span>{{ formatDT(currentPrice.createdAt) }}</span>
        </div>
        <div class="stat-card__remark" v-if="currentPrice && currentPrice.remark">
          <span class="remark-tag">{{ currentPrice.remark }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-card__label"><span class="dot dot--blue"></span>历史调价次数</div>
        <div class="stat-card__count">{{ historyTotal }}<span class="stat-unit">次</span></div>
        <div class="stat-card__meta">累计价格设置记录</div>
      </div>

      <div class="stat-card">
        <div class="stat-card__label"><span class="dot dot--purple"></span>较上次变化</div>
        <div v-if="priceChange !== null" class="stat-card__change" :class="priceChange >= 0 ? 'up':'down'">
          <el-icon><CaretTop v-if="priceChange >= 0" /><CaretBottom v-else /></el-icon>
          {{ Math.abs(priceChange).toFixed(8) }}<span class="stat-unit">USDT</span>
        </div>
        <div class="stat-card__price stat--empty" v-else>首次设置</div>
        <div class="stat-card__meta" :class="priceChange === null ? '' : (priceChange >= 0 ? 'up':'down')">
          {{ priceChange === null ? '暂无对比' : (priceChange >= 0 ? '价格上调' : '价格下调') }}
        </div>
      </div>

    </div>

    <!-- 价格走势图 -->
    <div class="chart-card">
      <div class="chart-header">
        <div>
          <span class="chart-title">价格走势</span>
          <span class="chart-unit">USDT / 积分</span>
        </div>
        <el-radio-group v-model="chartRange" @change="renderChart" size="small">
          <el-radio-button value="all">全部</el-radio-button>
          <el-radio-button value="30">近 30 条</el-radio-button>
          <el-radio-button value="10">近 10 条</el-radio-button>
        </el-radio-group>
      </div>
      <div v-if="!allHistoryData.length && !pageLoading" class="chart-empty">
        <el-empty description="暂无价格数据" :image-size="80" />
      </div>
      <div ref="chartRef" class="chart-canvas" v-show="allHistoryData.length"></div>
    </div>

    <!-- 历史表格 —— 无边框简洁风格 -->
    <div class="table-card">
      <div class="table-header">
        <span class="table-title">历史价格记录</span>
        <span class="table-count">共 {{ historyTotal }} 条</span>
      </div>

      <!-- 自定义表格：无需 el-table，直接 div 更好控制样式 -->
      <div class="price-table" v-loading="historyLoading">
        <!-- 表头 -->
        <div class="price-table__head">
          <div class="col-no">序号</div>
          <div class="col-price">积分单价（USDT/积分）</div>
          <div class="col-time">设置时间</div>
          <div class="col-remark">备注</div>
          <div class="col-status">状态</div>
        </div>
        <!-- 数据行 -->
        <div
          v-for="(row, idx) in historyList"
          :key="row.id"
          class="price-table__row"
          :class="(historyPageNo === 1 && idx === 0) ? 'row--live' : ''"
        >
          <div class="col-no">{{ (historyPageNo - 1) * historyPageSize + idx + 1 }}</div>
          <div class="col-price">
            <span class="price-val" :class="(historyPageNo === 1 && idx === 0) ? 'price-val--live' : ''">
              {{ formatPrice(row.price) }}
            </span>
          </div>
          <div class="col-time">{{ formatDT(row.createdAt) }}</div>
          <div class="col-remark" :title="row.remark">{{ row.remark || '—' }}</div>
          <div class="col-status">
            <span v-if="historyPageNo === 1 && idx === 0" class="status-badge status-badge--live">
              <span class="status-dot"></span>生效中
            </span>
            <span v-else class="status-badge status-badge--old">历史</span>
          </div>
        </div>
        <!-- 空状态 -->
        <div v-if="!historyList.length && !historyLoading" class="price-table__empty">
          <el-empty description="暂无记录" :image-size="60" />
        </div>
      </div>

      <div class="table-foot">
        <el-pagination
          size="small"
          v-model:current-page="historyPageNo"
          v-model:page-size="historyPageSize"
          :total="historyTotal"
          :page-sizes="[10,20,50]"
          layout="total, sizes, prev, pager, next"
          @current-change="loadHistory"
          @size-change="() => { historyPageNo=1; loadHistory() }"
        />
      </div>
    </div>

    <!-- 设置新价格弹窗 -->
    <el-dialog
      v-model="setVisible"
      :show-close="false"
      width="400px"
      :close-on-click-modal="false"
      class="modern-dialog set-dialog"
      append-to-body
    >
      <div class="dialog-shell">
        <div class="dialog-header">
          <div class="header-icon">
            <svg viewBox="0 0 24 24" fill="none" class="w-5 h-5">
              <path d="M12 8V12L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          <div class="header-content">
            <h3 class="header-title">价格设置</h3>
            <p class="header-desc">更新后立即生效，保留历史记录</p>
          </div>
          <button class="header-close" @click="setVisible=false">
            <el-icon><Close /></el-icon>
          </button>
        </div>

        <div class="dialog-body">
          <!-- 当前价格卡片 -->
          <div class="current-price-card">
            <div class="card-label">当前生效价格</div>
            <div class="card-value" :class="{ 'is-empty': !currentPrice }">
              {{ currentPreviewPrice }}
            </div>
            <div class="card-bg-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
          </div>

          <!-- 输入区域 -->
          <div class="input-section">
            <div class="field-group">
              <div class="field-header">
                <label class="field-label">积分单价 <span class="required">*</span></label>
                <span class="field-tip">最多 8 位小数</span>
              </div>
              <div class="price-input-wrapper" :class="{ 'is-focus': priceFocus, 'is-error': priceErr }">
                <div class="input-prefix">
                  <span class="currency-tag">USDT</span>
                </div>
                <input
                  v-model="setForm.price"
                  class="price-main-input"
                  placeholder="0.00000000"
                  type="text"
                  inputmode="decimal"
                  @input="onPriceInput"
                  @focus="priceFocus=true"
                  @blur="onPriceBlur"
                />
                <div class="input-suffix">/ 积分</div>
              </div>
              <Transition name="fade-slide">
                <div class="msg-container">
                  <p class="error-msg" v-if="priceErr">{{ priceErr }}</p>
                  <p class="helper-msg" v-else-if="validPriceNum && currentPrice">
                    <span class="change-preview" :class="priceDiff >= 0 ? 'is-up' : 'is-down'">
                      <el-icon><CaretTop v-if="priceDiff >= 0" /><CaretBottom v-else /></el-icon>
                      较当前价格 {{ priceDiff >= 0 ? '上浮' : '下降' }} 
                      <strong>{{ Math.abs(priceDiff).toFixed(8) }}</strong> USDT
                    </span>
                  </p>
                </div>
              </Transition>
            </div>

            <div class="field-group no-margin">
              <div class="field-header">
                <label class="field-label">备注说明</label>
                <span class="field-tip">{{ setForm.remark.length }}/100</span>
              </div>
              <div class="remark-input-wrapper">
                <textarea
                  v-model="setForm.remark"
                  class="remark-textarea"
                  placeholder="记录本次调价背景..."
                  maxlength="100"
                  rows="2"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <div class="dialog-footer">
          <button class="btn-modern btn-secondary" @click="setVisible=false">取消</button>
          <button class="btn-modern btn-primary" :disabled="!isPriceValid" @click="preConfirm">
            <span>下一步</span>
            <el-icon class="btn-icon"><ArrowRight /></el-icon>
          </button>
        </div>
      </div>
    </el-dialog>

    <!-- 二次确认弹框 -->
    <el-dialog
      v-model="confirmVisible"
      :show-close="false"
      width="400px"
      :close-on-click-modal="false"
      class="modern-dialog confirm-dialog"
      append-to-body
    >
      <div class="dialog-shell">
        <div class="confirm-content">
          <div class="confirm-status-icon">
            <div class="pulse-ring"></div>
            <svg viewBox="0 0 24 24" fill="none" class="w-8 h-8 text-blue-500">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2"/>
              <path d="M12 8V12L14 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          
          <h3 class="confirm-title">确认变更价格？</h3>
          <p class="confirm-desc">变更将立即同步至全站，请确保输入的价格准确无误。</p>

          <div class="confirm-preview-box">
            <div class="preview-item">
              <span class="preview-label">变更后价格</span>
              <div class="preview-value">
                <span class="val">{{ setForm.price || '0.00000000' }}</span>
                <span class="unit">USDT / 积分</span>
              </div>
            </div>
          </div>

          <div class="confirm-warning">
            <el-icon class="warn-icon"><Warning /></el-icon>
            <span>此操作不可撤销，但会保留历史记录。</span>
          </div>
        </div>

        <div class="dialog-footer is-confirm">
          <button class="btn-modern btn-secondary" @click="confirmVisible=false">返回修改</button>
          <button class="btn-modern btn-primary is-danger" :disabled="setLoading" @click="doSet">
            <el-icon v-if="setLoading" class="is-loading"><Loading /></el-icon>
            <span>{{ setLoading ? '提交中...' : '确认生效' }}</span>
          </button>
        </div>
      </div>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, computed, inject, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Close, ArrowRight, Warning, Loading, CaretTop, CaretBottom } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { handleApiError } from '@/utils/request'

const _Api = inject('$api')

const pageLoading  = ref(false)
const currentPrice = ref(null)
const chartRef     = ref(null)
const chartRange   = ref('all')
let   eChart       = null
let   ro           = null

const historyList     = ref([])
const historyLoading  = ref(false)
const historyPageNo   = ref(1)
const historyPageSize = ref(10)
const historyTotal    = ref(0)
const allHistoryData  = ref([])

const setVisible     = ref(false)
const confirmVisible = ref(false)
const setLoading     = ref(false)
const setForm        = reactive({ price:'', remark:'' })
const priceFocus     = ref(false)
const priceErr       = ref('')

// 计算与当前价格的差值
const priceDiff = computed(() => {
  if (!setForm.price || !currentPrice.value?.price) return 0
  return parseFloat(setForm.price) - parseFloat(currentPrice.value.price)
})

// 实时校验并计算换算值
const validPriceNum = computed(() => {
  const n = parseFloat(setForm.price)
  if (!setForm.price || isNaN(n) || n <= 0) return null
  return n.toFixed(8)
})

const currentPreviewPrice = computed(() => {
  if (!currentPrice.value?.price) return '暂未设置'
  return `1 积分 = ${formatPrice(currentPrice.value.price)} USDT`
})

const isPriceValid = computed(() => {
  const value = String(setForm.price || '').trim()
  if (!value) return false
  const n = Number(value)
  return Number.isFinite(n) && n > 0 && /^\d+(\.\d{1,8})?$/.test(value)
})

const onPriceInput = () => {
  if (!setForm.price) {
    priceErr.value = ''
    return
  }
  const n = parseFloat(setForm.price)
  if (isNaN(n) || n <= 0) {
    priceErr.value = '请输入大于 0 的数字'
    return
  }
  if (!/^\d+(\.\d{0,8})?$/.test(setForm.price)) {
    priceErr.value = '最多支持 8 位小数'
    return
  }
  priceErr.value = ''
}

const onPriceBlur = () => {
  priceFocus.value = false
  const n = parseFloat(setForm.price)
  if (!setForm.price) { priceErr.value = ''; return }
  if (isNaN(n) || n <= 0) { priceErr.value = '请输入大于 0 的数字'; return }
  if (!/^\d+(\.\d{1,8})?$/.test(setForm.price)) { priceErr.value = '最多支持 8 位小数'; return }
  priceErr.value = ''
}

const priceChange = computed(() => {
  const s = [...allHistoryData.value].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt))
  if (s.length < 2) return null
  return parseFloat(s[0].price) - parseFloat(s[1].price)
})

const z = n => String(n).padStart(2,'0')
const formatPrice = p => p==null ? '—' : parseFloat(p).toFixed(8)

// 时间格式：到分钟（不显示秒）
const formatDT = s => {
  if (!s) return '—'
  const d = new Date(s)
  return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`
}
// 折线图 X 轴标签：MM-DD HH:mm
const fmtLabel = s => {
  const d = new Date(s)
  return `${z(d.getMonth()+1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`
}

const loadCurrentPrice = async () => {
  try { currentPrice.value = await _Api._TokenPointPriceCurrent() || null }
  catch(e) { handleApiError(e,'获取当前价格失败') }
}
const loadHistory = async () => {
  historyLoading.value = true
  try {
    const r = await _Api._TokenPointPriceHistory({ pageNo:historyPageNo.value, pageSize:historyPageSize.value })
    if (r) { historyList.value = r.records||[]; historyTotal.value = r.total||0 }
  } catch(e) { handleApiError(e,'获取历史失败') }
  finally { historyLoading.value = false }
}
const loadAllForChart = async () => {
  try {
    const r = await _Api._TokenPointPriceAllHistory()
    allHistoryData.value = r||[]
    renderChart()
  } catch(e) { handleApiError(e,'获取图表数据失败') }
}

const renderChart = async () => {
  await nextTick()
  if (!chartRef.value) return

  // 升序排列、按 range 截取
  let real = [...allHistoryData.value].sort((a,b) => new Date(a.createdAt)-new Date(b.createdAt))
  if (chartRange.value === '30') real = real.slice(-30)
  else if (chartRange.value === '10') real = real.slice(-10)
  if (!real.length) return

  const prices = real.map(d => parseFloat(d.price))
  const maxP   = Math.max(...prices)
  const yMax   = parseFloat((maxP * 1.28).toFixed(6))

  /**
   * 核心：使用类目轴（category）+ boundaryGap:false
   * 第一个类目为 ''（空字符串），对应 price=0 的合成起点
   * boundaryGap:false 让第一个类目贴着 Y 轴，折线从 Y 轴交点 0 出发
   * 不显示任何时间标签（空字符串自然没有内容），后续类目只显示真实调价时间
   */
  const categories = ['', ...real.map(d => fmtLabel(d.createdAt))]
  const values     = [0,  ...prices]

  // 数据量 > 15 时才显示底部 slider（仅平移，不允许缩放）
  const showZoom = real.length > 15
  const zoomStart = showZoom ? Math.max(0, 100 - Math.round(15 / real.length * 100)) : 0

  if (!eChart) eChart = echarts.init(chartRef.value)

  eChart.setOption({
    backgroundColor: '#fff',
    animation: true,
    animationDuration: 900,
    animationEasing: 'cubicOut',
    grid: {
      top: 24,
      bottom: showZoom ? 56 : 32,
      left: 60,    // 固定左边距，确保 Y 轴标签不溢出
      right: 46,   // 最后标签半宽约 37px + 9px 余量，不截断也不过宽
      containLabel: false   // 改为 false，完全由 left/right 控制，不再依赖自动计算
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15,23,42,0.92)',
      borderColor: 'rgba(22,119,255,0.3)',
      borderWidth: 1,
      padding: [12,16],
      textStyle: { color:'#e2e8f0', fontSize:12 },
      formatter: params => {
        const p = params[0]
        // 第一个类目（合成零点）不显示 tooltip
        if (p.dataIndex === 0) return ''
        const label = p.name  // MM-DD HH:mm
        return `
          <div style="color:#94a3b8;font-size:11px;margin-bottom:8px;">${label}</div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="width:8px;height:8px;border-radius:50%;background:#1677ff;
              display:inline-block;box-shadow:0 0 5px rgba(22,119,255,0.7)"></span>
            <span style="color:#fff;font-size:16px;font-weight:700;font-family:monospace;letter-spacing:.5px">
              ${parseFloat(p.value).toFixed(8)}
            </span>
            <span style="color:#64748b;font-size:11px">USDT/积分</span>
          </div>`
      },
      axisPointer: {
        type: 'cross',
        lineStyle: { color:'rgba(22,119,255,0.45)', type:'dashed', width:1 },
        crossStyle: { color:'rgba(22,119,255,0.45)', width:1 },
        label: {
          backgroundColor: '#1677ff',
          color: '#fff',
          fontSize: 11,
          // Y 轴 pointer 标签
          formatter: p => p.axisDimension === 'y' ? parseFloat(p.value).toFixed(4) : p.value
        }
      }
    },
    xAxis: {
      type: 'category',
      data: categories,
      boundaryGap: false,        // 第一个类目（合成零点）贴 Y 轴，折线从交点出发
      axisLine: { lineStyle:{ color:'#E8ECF0' } },
      axisTick: { show:false },
      splitLine: { show:false },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 11,
        hideOverlap: true,       // 标签重叠时自动隐藏，彻底防截断
        interval: 0,
        // 第一个类目（''）自然显示为空，不需要特殊处理
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: yMax,
      splitNumber: 5,
      axisLine: { show:false },
      axisTick: { show:false },
      splitLine: { lineStyle:{ color:'#F0F4F8', type:'dashed' } },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 11,
        formatter: v => v === 0 ? '0' : parseFloat(v).toFixed(4)
      }
    },
    // 大数据量时才显示底部拖动条，使用 zoomLock 仅允许平移
    dataZoom: showZoom ? [{
      type: 'slider',
      xAxisIndex: 0,
      start: zoomStart,
      end: 100,
      zoomLock: true,          // 锁定缩放比例，只能平移不能缩放，防止误操作
      height: 20,
      bottom: 8,
      borderColor: 'transparent',
      backgroundColor: '#F5F7FA',
      fillerColor: 'rgba(22,119,255,0.12)',
      handleStyle: { color:'#1677ff', borderColor:'#1677ff' },
      textStyle: { color:'#94a3b8', fontSize:10 },
      filterMode: 'filter'
    }] : [],
    series: [{
      type: 'line',
      data: values,
      smooth: 0.35,
      showSymbol: true,
      // 合成零点不显示圆点（index=0），真实数据点显示
      symbol: (_, params) => params.dataIndex === 0 ? 'none' : 'circle',
      symbolSize: 7,
      lineStyle: {
        color: '#1677ff',
        width: 2.5,
        shadowColor: 'rgba(22,119,255,0.18)',
        shadowBlur: 6
      },
      itemStyle: {
        color: '#1677ff',
        borderColor: '#fff',
        borderWidth: 2.5,
        shadowColor: 'rgba(22,119,255,0.5)',
        shadowBlur: 6
      },
      emphasis: {
        itemStyle: {
          color: '#1677ff',
          borderColor: '#fff',
          borderWidth: 3,
          shadowBlur: 12,
          shadowColor: 'rgba(22,119,255,0.7)'
        }
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset:0,    color:'rgba(22,119,255,0.18)' },
          { offset:0.6,  color:'rgba(22,119,255,0.05)' },
          { offset:1,    color:'rgba(22,119,255,0.00)' }
        ])
      }
    }]
  }, true)
}

const showSetDialog = () => {
  setForm.price = ''
  setForm.remark = ''
  priceErr.value = ''
  priceFocus.value = false
  confirmVisible.value = false
  setVisible.value = true
}

// 点"下一步"先校验，通过则弹二次确认
const preConfirm = () => {
  const n = parseFloat(setForm.price)
  if (!setForm.price || isNaN(n) || n <= 0) { priceErr.value = '请输入大于 0 的数字'; return }
  if (!/^\d+(\.\d{1,8})?$/.test(setForm.price)) { priceErr.value = '最多支持 8 位小数'; return }
  priceErr.value = ''
  confirmVisible.value = true
}

// 二次确认后真正提交
const doSet = async () => {
  setLoading.value = true
  try {
    await _Api._TokenPointPriceCreate({ price: setForm.price, remark: setForm.remark })
    ElMessage.success('积分价格设置成功')
    confirmVisible.value = false
    setVisible.value = false
    await Promise.all([loadCurrentPrice(), loadHistory(), loadAllForChart()])
  } catch(e) { handleApiError(e, '设置失败') }
  finally { setLoading.value = false }
}

onMounted(async () => {
  pageLoading.value = true
  try { await Promise.all([loadCurrentPrice(), loadHistory(), loadAllForChart()]) }
  finally { pageLoading.value = false }
  ro = new ResizeObserver(() => eChart?.resize())
  if (chartRef.value) ro.observe(chartRef.value)
})
onUnmounted(() => { ro?.disconnect(); eChart?.dispose() })
</script>

<style scoped>
.page {
  padding: 24px 28px;
  background: #fff;
  min-height: 100%;
  box-sizing: border-box;
  padding-bottom: 32px;
}

/* ── 顶部栏 ── */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 22px;
}
.page-title { margin: 0 0 4px; font-size: 20px; font-weight: 700; color: #111827; }
.page-sub   { margin: 0; font-size: 13px; color: #9ca3af; }
.primary-btn {
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  padding: 9px 18px;
  box-shadow: 0 2px 8px rgba(22,119,255,0.28);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 5px;
}

/* ── 统计卡 CSS Grid 等宽等高 ── */
.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;   /* 等宽三列 */
  gap: 16px;
  margin-bottom: 20px;
}
.stat-card {
  background: #fff;
  border: 1px solid #E8ECF2;
  border-top: 3px solid var(--accent, #1677ff);
  border-radius: 10px;
  padding: 16px 18px 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.stat-grid .stat-card:nth-child(1) { --accent: #1677ff; }
.stat-grid .stat-card:nth-child(2) { --accent: #0ea5e9; }
.stat-grid .stat-card:nth-child(3) { --accent: #7c3aed; }

.stat-card__label {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 4px;
  line-height: 1;
}
.dot { 
  display: inline-block; 
  width: 7px; 
  height: 7px; 
  border-radius: 50%; 
  flex-shrink: 0;
}
.dot--green  { background:#22c55e; box-shadow:0 0 5px #22c55e; animation:blink 2s infinite; }
.dot--blue   { background:#0ea5e9; }
.dot--purple { background:#7c3aed; }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

.stat-card__price {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  font-family: 'JetBrains Mono','Menlo','Courier New',monospace;
  letter-spacing: .5px;
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
  margin-top: 4px;
}
.stat-card__count {
  font-size: 28px;
  font-weight: 700;
  color: #0ea5e9;
  font-family: 'JetBrains Mono',monospace;
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 4px;
}
.stat-card__change {
  font-size: 18px;
  font-weight: 700;
  font-family: 'JetBrains Mono',monospace;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 4px;
}
.stat-card__change .el-icon {
  font-size: 16px;
}
.stat-unit { font-size: 12px; color: #9ca3af; font-weight: 400; }
.stat--empty { color: #d1d5db; font-size: 16px; font-style: italic; font-weight: 400; }
.up   { color: #22c55e; }
.down { color: #ef4444; }

.stat-card__meta {
  font-size: 12px;
  color: #9ca3af;
}
/* 备注单独一行，tag 样式与时间拉开距离 */
.stat-card__remark { margin-top: 2px; }
.remark-tag {
  display: inline-block;
  background: #EFF6FF;
  color: #1677ff;
  border-radius: 4px;
  padding: 1px 8px;
  font-size: 11px;
  font-weight: 500;
}

/* ── 图表卡 ── */
.chart-card {
  background: #fff;
  border: 1px solid #E8ECF2;
  border-radius: 10px;
  padding: 16px 18px 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  margin-bottom: 24px;
}
.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.chart-title { font-size: 15px; font-weight: 700; color: #111827; margin-right: 8px; }
.chart-unit  { font-size: 12px; color: #9ca3af; }
.chart-canvas { width: 100%; height: 360px; }
.chart-empty  { display:flex; justify-content:center; padding:80px 0; }

/* ── 表格卡 ── */
.table-card {
  background: #fff;
  border: 1px solid #E8ECF2;
  border-radius: 10px;
  padding: 18px 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  margin-bottom: 28px;
  display: flex;
  flex-direction: column;
}
.table-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.table-title { font-size: 15px; font-weight: 700; color: #111827; }
.table-count {
  font-size: 12px;
  color: #6b7280;
  background: #F3F4F6;
  border-radius: 20px;
  padding: 2px 10px;
}

/* 自定义表格 */
.price-table {
  width: 100%;
  max-height: 420px;
  overflow-y: auto;
}
.price-table__head,
.price-table__row {
  display: grid;
  grid-template-columns: 56px 1fr 160px 140px 90px;
  align-items: center;
  padding: 0 12px;
}
.price-table__head {
  background: #F9FAFB;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.price-table__row {
  padding: 14px 12px;
  border-bottom: 1px solid #F3F4F6;
  transition: background 0.15s;
  font-size: 13px;
  color: #374151;
}
.price-table__row:hover { background: #FAFAFA; }
.price-table__row:last-child { border-bottom: none; }
.price-table__row.row--live { background: #EFF6FF; }
.price-table__row.row--live:hover { background: #DBEAFE; }
.price-table__empty { padding: 40px 0; display: flex; justify-content: center; }

.col-no { color: #9ca3af; font-size: 12px; }
.col-remark {
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 8px;
}
.col-status { display: flex; justify-content: center; }

.price-val {
  font-family: 'JetBrains Mono','Courier New',monospace;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}
.price-val--live { color: #1677ff; }

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}
.status-badge--live {
  background: #DCFCE7;
  color: #16a34a;
}
.status-dot {
  display: inline-block;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 4px #22c55e;
  animation: blink 2s infinite;
}
.status-badge--old {
  background: #F3F4F6;
  color: #9ca3af;
}

.table-foot {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #F3F4F6;
}

.table-foot :deep(.el-pagination) {
  --el-pagination-button-height: 24px;
  --el-pagination-button-width: 24px;
  --el-pagination-font-size: 12px;
}

.table-foot :deep(.el-pager li) {
  min-width: 24px;
  height: 24px;
  line-height: 24px;
}

.table-foot :deep(.btn-prev),
.table-foot :deep(.btn-next) {
  width: 24px;
  height: 24px;
}

.table-foot :deep(.el-select .el-input__wrapper) {
  min-height: 24px;
  padding: 0 8px;
}

/* ── 现代弹窗重构 (Modern Dialog Styles) ── */
:deep(.modern-dialog) {
  --dialog-bg: #ffffff;
  --primary-color: #2563eb;
  --primary-hover: #1d4ed8;
  --secondary-color: #f8fafc;
  --border-color: #e2e8f0;
  --text-main: #0f172a;
  --text-muted: #64748b;
  --error-color: #ef4444;
}

:deep(.modern-dialog .el-overlay) {
  background: rgba(15, 23, 42, 0.45) !important;
  backdrop-filter: blur(8px);
}

:deep(.modern-dialog .el-dialog) {
  border-radius: 24px !important;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: var(--dialog-bg) !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15) !important;
  padding: 0 !important;
}

:deep(.modern-dialog .el-dialog__header),
:deep(.modern-dialog .el-dialog__body),
:deep(.modern-dialog .el-dialog__footer) {
  padding: 0 !important;
}

.dialog-shell {
  display: flex;
  flex-direction: column;
}

/* Header */
.dialog-header {
  padding: 24px 24px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid var(--border-color);
  position: relative;
}

.header-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: #eff6ff;
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-content {
  flex: 1;
}

.header-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
  margin: 0 0 4px;
}

.header-desc {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
}

.header-close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.header-close:hover {
  background: #f1f5f9;
  color: var(--text-main);
}

/* Body */
.dialog-body {
  padding: 20px 24px;
}

.current-price-card {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border-radius: 16px;
  padding: 16px 20px;
  color: white;
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 20px -4px rgba(37, 99, 235, 0.25);
}

.card-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.8;
  margin-bottom: 6px;
}

.card-value {
  font-size: 18px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
}

.card-value.is-empty {
  opacity: 0.6;
  font-style: italic;
}

.card-bg-icon {
  position: absolute;
  right: -8px;
  bottom: -8px;
  width: 64px;
  height: 64px;
  opacity: 0.1;
  transform: rotate(-15deg);
}

/* Form Fields */
.field-group {
  margin-bottom: 16px;
}
.field-group.no-margin {
  margin-bottom: 0;
}

.field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
}

.required {
  color: var(--error-color);
  margin-left: 2px;
}

.field-tip {
  font-size: 11px;
  color: var(--text-muted);
}

.price-input-wrapper {
  display: flex;
  align-items: center;
  background: #f8fafc;
  border: 1.5px solid #f1f5f9;
  border-radius: 12px;
  padding: 2px 12px;
  transition: all 0.2s;
}

.price-input-wrapper.is-focus {
  background: #ffffff;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.08);
}

.price-input-wrapper.is-error {
  border-color: var(--error-color);
  background: #fffafa;
}

.currency-tag {
  font-size: 11px;
  font-weight: 700;
  color: var(--primary-color);
  background: #eff6ff;
  padding: 3px 6px;
  border-radius: 6px;
}

.price-main-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 10px 10px;
  font-size: 18px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  color: #2563eb !important;
  outline: none;
  width: 100%;
}

.price-main-input::placeholder {
  color: #cbd5e1;
}

.input-suffix {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
}

.msg-container {
  min-height: 20px;
}

.error-msg {
  color: var(--error-color);
  font-size: 11px;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.helper-msg {
  color: var(--text-muted);
  font-size: 11px;
  margin-top: 6px;
}

.helper-msg .highlight {
  color: #2563eb;
  font-weight: 700;
}

.change-preview {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
}
.change-preview.is-up { color: #22c55e; }
.change-preview.is-down { color: #ef4444; }
.change-preview strong { font-family: 'JetBrains Mono', monospace; }

.remark-input-wrapper {
  background: #f8fafc;
  border: 1.5px solid #f1f5f9;
  border-radius: 12px;
  padding: 10px;
  transition: all 0.2s;
}

.remark-input-wrapper:focus-within {
  background: #ffffff;
  border-color: var(--primary-color);
}

.remark-textarea {
  width: 100%;
  border: none;
  background: transparent;
  resize: none;
  font-size: 13px;
  color: var(--text-main);
  outline: none;
  line-height: 1.5;
}

/* Footer */
.dialog-footer {
  padding: 16px 24px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid var(--border-color);
  background: #fafafa;
}

.btn-modern {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background-color: #2563eb !important;
  color: #ffffff !important;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}

.btn-primary:hover:not(:disabled) {
  background-color: #1d4ed8 !important;
  color: #ffffff !important;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
}

.btn-primary:disabled {
  background-color: #f1f5f9 !important;
  color: #cbd5e1 !important;
  box-shadow: none;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: var(--text-muted);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: #f8fafc;
  color: var(--text-main);
}

/* Confirm Dialog Specific */
.confirm-content {
  padding: 40px 32px 32px;
  text-align: center;
}

.confirm-status-icon {
  position: relative;
  width: 64px;
  height: 64px;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pulse-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #eff6ff;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 0.3; }
  100% { transform: scale(0.95); opacity: 0.5; }
}

.confirm-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-main);
  margin: 0 0 8px;
}

.confirm-desc {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: 24px;
}

.confirm-preview-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 20px;
}

.preview-item {
  text-align: left;
}

.preview-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 8px;
  display: block;
}

.preview-value {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.preview-value .val {
  font-size: 24px;
  font-weight: 800;
  font-family: 'JetBrains Mono', monospace;
  color: #2563eb !important;
}

.preview-value .unit {
  font-size: 14px;
  color: var(--text-muted);
}

.confirm-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fff7ed;
  border-radius: 12px;
  color: #9a3412;
  font-size: 12px;
  text-align: left;
}

.warn-icon {
  font-size: 16px;
  color: #ea580c;
}

.dialog-footer.is-confirm {
  background: white;
  border-top: none;
  padding-top: 0;
}

.btn-primary.is-danger {
  background-color: #ef4444 !important;
  color: #ffffff !important;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
}

.btn-primary.is-danger:hover {
  background-color: #dc2626 !important;
  color: #ffffff !important;
}

/* Animations */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.is-loading {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
