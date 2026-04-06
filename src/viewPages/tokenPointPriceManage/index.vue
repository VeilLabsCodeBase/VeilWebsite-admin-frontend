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
          {{ priceChange >= 0 ? '▲' : '▼' }} {{ Math.abs(priceChange).toFixed(8) }}<span class="stat-unit">USDT</span>
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
          :class="idx === 0 ? 'row--live' : ''"
        >
          <div class="col-no">{{ (historyPageNo - 1) * historyPageSize + idx + 1 }}</div>
          <div class="col-price">
            <span class="price-val" :class="idx === 0 ? 'price-val--live' : ''">
              {{ formatPrice(row.price) }}
            </span>
          </div>
          <div class="col-time">{{ formatDT(row.createdAt) }}</div>
          <div class="col-remark" :title="row.remark">{{ row.remark || '—' }}</div>
          <div class="col-status">
            <span v-if="idx === 0" class="status-badge status-badge--live">
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
      width="420px"
      :close-on-click-modal="false"
      class="set-dialog"
      append-to-body
    >
      <template #header>
        <div class="pd-head">
          <div class="pd-head__intro">
            <span class="pd-head__eyebrow">价格设置</span>
            <span class="pd-head__title">设置积分价格</span>
            <span class="pd-head__desc">更新后立即生效，并保留完整历史记录。</span>
          </div>
          <button class="pd-head__close" type="button" @click="setVisible=false" aria-label="关闭">
            <el-icon><Close /></el-icon>
          </button>
        </div>
      </template>

      <div class="pd-body">
        <div class="pd-panel pd-panel--highlight">
          <div class="pd-panel__meta">
            <span class="pd-panel__label">当前生效价格</span>
            <span class="pd-panel__value" :class="{ 'pd-panel__value--empty': !currentPrice }">
              {{ currentPreviewPrice }}
            </span>
          </div>
          <div class="pd-panel__hint">当前价格仅作对照，新价格以输入内容为准。</div>
        </div>

        <div class="pd-field">
          <label class="pd-label">积分单价 <em>*</em><span class="pd-label-sub">输入 1 积分对应的 USDT 价格</span></label>
          <div class="pd-price-card" :class="{ 'pd-price-card--focus': priceFocus, 'pd-price-card--error': priceErr }">
            <div class="pd-price-top">
              <span class="pd-price-top__tag">新价格</span>
              <span class="pd-price-top__note">最多 8 位小数</span>
            </div>
            <div class="pd-price-row">
              <input
                v-model="setForm.price"
                class="pd-price-input"
                placeholder="0.00000000"
                type="text"
                inputmode="decimal"
                @input="onPriceInput"
                @focus="priceFocus=true"
                @blur="onPriceBlur"
              />
              <span class="pd-price-unit">USDT / 积分</span>
            </div>
          </div>
          <p class="pd-err" v-if="priceErr">{{ priceErr }}</p>
          <p class="pd-hint" v-else-if="validPriceNum">
            生效后前台将按 <strong>{{ validPriceNum }}</strong> USDT / 积分进行展示
          </p>
        </div>

        <div class="pd-field">
          <label class="pd-label">备注说明 <span class="pd-label-opt">选填</span></label>
          <div class="pd-remark-wrap">
            <textarea
              v-model="setForm.remark"
              class="pd-remark"
              placeholder="记录本次调价背景，例如活动策略调整..."
              maxlength="100"
              rows="2"
            ></textarea>
            <p class="pd-char">{{ setForm.remark.length }}/100</p>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="pd-foot">
          <button class="pd-btn pd-btn--cancel" @click="setVisible=false">取消</button>
          <button class="pd-btn pd-btn--ok" :disabled="!isPriceValid" @click="preConfirm">
            下一步
          </button>
        </div>
      </template>
    </el-dialog>

    <!-- 二次确认弹框（替换 ElMessageBox，完全自定义样式） -->
    <el-dialog
      v-model="confirmVisible"
      :show-close="false"
      width="380px"
      :close-on-click-modal="false"
      class="confirm-dialog"
      append-to-body
    >
      <div class="cd-shell">
        <div class="cd-body">
          <div class="cd-icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 21h20L12 2z" fill="#3b82f6" opacity=".12"/>
              <path d="M12 2L2 21h20L12 2z" stroke="#3b82f6" stroke-width="1.5" stroke-linejoin="round"/>
              <path d="M12 8.8v5.4M12 17.1v.5" stroke="#2563eb" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </div>
          <p class="cd-kicker">确认变更</p>
          <p class="cd-title">确认设置新价格？</p>
          <p class="cd-desc">设置后立即全局生效，历史记录会保留。</p>

          <div class="cd-price-show">
            <span class="cd-price-label">新价格</span>
            <div class="cd-price-main">
              <span class="cd-price-val">{{ setForm.price || '0.00000000' }}</span>
              <span class="cd-price-unit">USDT / 积分</span>
            </div>
          </div>

          <div class="cd-note">
            <span class="cd-note__dot"></span>
            <span>请确认价格无误，再执行生效。</span>
          </div>
        </div>
        <div class="cd-foot">
          <button class="pd-btn pd-btn--cancel" @click="confirmVisible=false">返回修改</button>
          <button class="pd-btn pd-btn--ok" :disabled="setLoading" @click="doSet">
            <span v-if="!setLoading">立即生效</span>
            <span v-else>设置中…</span>
          </button>
        </div>
      </div>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, computed, inject, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Close } from '@element-plus/icons-vue'
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
  gap: 5px;
}
.dot { display:inline-block; width:7px; height:7px; border-radius:50%; }
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
  align-items: baseline;
  gap: 5px;
  flex-wrap: wrap;
}
.stat-card__count {
  font-size: 28px;
  font-weight: 700;
  color: #0ea5e9;
  font-family: 'JetBrains Mono',monospace;
  display: flex;
  align-items: baseline;
  gap: 5px;
}
.stat-card__change {
  font-size: 18px;
  font-weight: 700;
  font-family: 'JetBrains Mono',monospace;
  display: flex;
  align-items: baseline;
  gap: 5px;
  flex-wrap: wrap;
}
.stat-unit { font-size: 12px; color: #9ca3af; font-weight: 400; }
.stat--empty { color: #d1d5db; font-size: 16px; font-style: italic; font-weight: 400; }
.up   { color: #16a34a; }
.down { color: #dc2626; }

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
  padding: 18px 20px 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  margin-bottom: 20px;
}
.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.chart-title { font-size: 15px; font-weight: 700; color: #111827; margin-right: 8px; }
.chart-unit  { font-size: 12px; color: #9ca3af; }
.chart-canvas { width: 100%; height: 480px; }
.chart-empty  { display:flex; justify-content:center; padding:80px 0; }

/* ── 表格卡 ── */
.table-card {
  background: #fff;
  border: 1px solid #E8ECF2;
  border-radius: 10px;
  padding: 18px 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
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
.price-table { width: 100%; }
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
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #F3F4F6;
}

/* ── 设置价格弹窗 ── */
:deep(.set-dialog .el-overlay),
:deep(.confirm-dialog .el-overlay) {
  background: rgba(15, 23, 42, 0.28);
  backdrop-filter: blur(4px);
}
:deep(.set-dialog .el-dialog),
:deep(.confirm-dialog .el-dialog) {
  border-radius: 28px !important;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  box-shadow:
    0 18px 48px rgba(15, 23, 42, 0.1),
    0 2px 10px rgba(59, 130, 246, 0.04) !important;
}
:deep(.set-dialog .el-dialog__header),
:deep(.confirm-dialog .el-dialog__header) { padding: 0 !important; }
:deep(.set-dialog .el-dialog__body),
:deep(.confirm-dialog .el-dialog__body) { padding: 0 !important; }
:deep(.set-dialog .el-dialog__footer),
:deep(.confirm-dialog .el-dialog__footer) { padding: 0 !important; }

.pd-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px 12px;
  border-bottom: 1px solid #eef2f7;
}
.pd-head__intro {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.pd-head__eyebrow {
  font-size: 10px;
  letter-spacing: 1.3px;
  text-transform: uppercase;
  color: #3b82f6;
  font-weight: 700;
}
.pd-head__title {
  font-size: 18px;
  line-height: 1.2;
  font-weight: 700;
  color: #0f172a;
}
.pd-head__desc {
  font-size: 12px;
  line-height: 1.5;
  color: #64748b;
}
.pd-head__close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid #dbe3ef;
  background: #f8fafc;
  color: #64748b;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all .18s ease;
  flex-shrink: 0;
}
.pd-head__close:hover {
  color: #2563eb;
  border-color: #bfdbfe;
  background: #eff6ff;
}

.pd-body {
  padding: 12px 18px 4px;
}
.pd-panel {
  border-radius: 22px;
  border: 1px solid #dbeafe;
  background: linear-gradient(180deg, #f8fbff 0%, #eef6ff 100%);
  padding: 10px 12px;
  margin-bottom: 12px;
}
.pd-panel__meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.pd-panel__label {
  font-size: 11px;
  letter-spacing: .6px;
  text-transform: uppercase;
  color: #2563eb;
  font-weight: 700;
}
.pd-panel__value {
  font-size: 16px;
  line-height: 1.3;
  color: #0f172a;
  font-weight: 700;
  font-family: 'JetBrains Mono','Menlo','Courier New',monospace;
}
.pd-panel__value--empty {
  color: #94a3b8;
  font-family: inherit;
}
.pd-panel__hint {
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.45;
}

.pd-field { margin-bottom: 12px; }
.pd-label {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 8px;
}
.pd-label em { color: #ef4444; font-style: normal; }
.pd-label-sub,
.pd-label-opt {
  font-size: 11px;
  color: #64748b;
  font-weight: 400;
}
.pd-label-sub { margin-left: 6px; }

.pd-price-card {
  border-radius: 22px;
  border: 1px solid #dbe3ef;
  background: #ffffff;
  padding: 10px 12px;
  transition: all .18s ease;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.65);
}
.pd-price-card--focus {
  border-color: #93c5fd;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
}
.pd-price-card--error {
  border-color: #fca5a5;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08);
}
.pd-price-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}
.pd-price-top__tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  color: #2563eb;
  font-size: 10px;
  font-weight: 600;
}
.pd-price-top__note {
  color: #94a3b8;
  font-size: 11px;
}
.pd-price-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pd-price-input {
  flex: 1;
  border: none;
  outline: none;
  padding: 0;
  font-size: 20px;
  line-height: 1.1;
  font-weight: 700;
  font-family: 'JetBrains Mono','Menlo',monospace;
  color: #0f172a;
  background: transparent;
  width: 0;
}
.pd-price-input::placeholder {
  color: #cbd5e1;
  font-weight: 500;
  font-size: 20px;
}
.pd-price-unit {
  padding: 6px 10px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .4px;
  color: #64748b;
  white-space: nowrap;
}
.pd-err {
  margin-top: 5px;
  font-size: 12px;
  color: #ef4444;
}
.pd-hint {
  margin-top: 5px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.45;
}
.pd-hint strong {
  font-family: 'JetBrains Mono','Menlo',monospace;
  color: #2563eb;
}

.pd-remark-wrap {
  border-radius: 22px;
  border: 1px solid #dbe3ef;
  background: #ffffff;
  padding: 9px 12px 7px;
  transition: border-color .18s ease, box-shadow .18s ease;
}
.pd-remark-wrap:focus-within {
  border-color: #93c5fd;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
}
.pd-remark {
  width: 100%;
  border: none;
  background: transparent;
  padding: 0;
  font-size: 13px;
  color: #334155;
  resize: none;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
  line-height: 1.5;
  min-height: 52px;
}
.pd-remark::placeholder { color: #94a3b8; }
.pd-char {
  margin-top: 4px;
  font-size: 11px;
  color: #94a3b8;
  text-align: right;
}

.pd-foot, .cd-foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 18px 16px;
  border-top: 1px solid #eef2f7;
  background: #fcfdff;
}
.pd-btn {
  min-width: 102px;
  padding: 9px 18px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: .2px;
  cursor: pointer;
  transition: all .18s ease;
  border: none;
  line-height: 1;
}
.pd-btn--cancel {
  background: #ffffff;
  color: #475569;
  border: 1px solid #dbe3ef;
}
.pd-btn--cancel:hover {
  background: #f8fafc;
  color: #0f172a;
}
.pd-btn--ok {
  background: linear-gradient(180deg, #5b8cff 0%, #3f76f6 100%);
  color: #ffffff;
  box-shadow: 0 12px 26px rgba(63, 118, 246, .32);
}
.pd-btn--ok:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 14px 30px rgba(63, 118, 246, .38);
}
.pd-btn--ok:disabled {
  background: linear-gradient(180deg, #c9d7fb 0%, #b9ccfa 100%);
  color: rgba(255, 255, 255, 0.9);
  opacity: 1;
  cursor: not-allowed;
  box-shadow: none;
}

/* 二次确认弹框 */
.cd-shell {
  position: relative;
}
.cd-body {
  padding: 20px 18px 12px;
  text-align: center;
}
.cd-icon-wrap {
  width: 42px;
  height: 42px;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 10px;
}
.cd-kicker {
  margin: 0 0 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.1px;
  text-transform: uppercase;
  color: #3b82f6;
}
.cd-title {
  font-size: 18px;
  line-height: 1.25;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px;
}
.cd-desc {
  margin: 0 auto 12px;
  max-width: 240px;
  font-size: 12px;
  line-height: 1.5;
  color: #64748b;
}
.cd-price-show {
  text-align: left;
  border-radius: 20px;
  border: 1px solid #dbeafe;
  background: linear-gradient(180deg, #f8fbff 0%, #eef6ff 100%);
  padding: 10px 12px;
  margin-bottom: 8px;
}
.cd-price-label {
  display: inline-block;
  margin-bottom: 6px;
  font-size: 10px;
  letter-spacing: .8px;
  text-transform: uppercase;
  color: #2563eb;
  font-weight: 700;
}
.cd-price-main {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}
.cd-price-val {
  font-family: 'JetBrains Mono',monospace;
  font-size: 20px;
  line-height: 1;
  font-weight: 800;
  color: #0f172a;
}
.cd-price-unit {
  font-size: 12px;
  color: #64748b;
  padding-bottom: 2px;
}
.cd-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.45;
  text-align: left;
}
.cd-note__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-top: 5px;
  background: #60a5fa;
  flex-shrink: 0;
}
</style>
