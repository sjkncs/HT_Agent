/**
 * 喜茶自助点单面板
 * 
 * 完整点单流程 UI：门店选择 → 商品浏览 → 定制 → 购物车 → 预览 → 下单 → 追踪
 * 灰白色调，简洁现代风格
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Search, MapPin, ShoppingBag, X, Plus, Minus, Trash2,
  ChevronRight, ChevronLeft, Check, Clock, Phone, Star,
  CreditCard, ArrowLeft, Tag, AlertCircle, Coffee,
  Navigation, SlidersHorizontal, LocateFixed, Heart,
  MessageSquare, Package, Timer, CheckCircle2, Circle,
  RotateCcw, ArrowUpDown,
} from 'lucide-react'
import {
  queryStoreList, searchProduct, customizeProduct,
  queryProductDetail, previewOrder, createOrder,
  queryOrderDetail, cancelOrder,
} from '../../lib/mcp-client.js'
// Mock 数据导入会自动注册 mockHandler
import '../../lib/heytea-mock-data.js'

// ─── 样式常量（灰白色调） ───
const ACCENT = '#333'          // 主色调：深炭灰
const ACCENT_LIGHT = '#555'    // 次要强调
const ACCENT_BG = '#f5f5f5'    // 浅灰背景
const SURFACE = '#fafafa'
const BORDER = '#e8e8e8'
const TEXT_PRIMARY = '#1a1a1a'
const TEXT_SECONDARY = '#666'
const TEXT_TERTIARY = '#999'

// ─── 面板步骤 ───
const STEPS = {
  STORE: 'store',
  BROWSE: 'browse',
  CUSTOMIZE: 'customize',
  CART: 'cart',
  PREVIEW: 'preview',
  ORDERING: 'ordering',
  TRACKING: 'tracking',
}

// ─── 默认坐标（深圳南山） ───
const DEFAULT_LOCATION = { longitude: 113.94441, latitude: 22.52736 }

export default function OrderingPanel({ onClose, onOrderCreated, embedded = false, ...qoderProps }) {
  const [step, setStep] = useState(STEPS.STORE)
  const [stores, setStores] = useState([])
  const [selectedStore, setSelectedStore] = useState(null)
  const [products, setProducts] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [searchQuery, setSearchQuery] = useState('')
  const [customizing, setCustomizing] = useState(null)
  const [cart, setCart] = useState([])
  const [orderPreview, setOrderPreview] = useState(null)
  const [currentOrder, setCurrentOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const searchInputRef = useRef(null)

  // ─── 加载门店 ───
  useEffect(() => { loadStores() }, [])

  async function loadStores() {
    setLoading(true)
    setError(null)
    try {
      const result = await queryStoreList({
        longitude: DEFAULT_LOCATION.longitude,
        latitude: DEFAULT_LOCATION.latitude,
      })
      setStores(result.data || [])
    } catch (e) {
      setError('加载门店失败：' + e.message)
    }
    setLoading(false)
  }

  // ─── 选择门店后加载商品 ───
  async function selectStore(store) {
    setSelectedStore(store)
    setStep(STEPS.BROWSE)
    setLoading(true)
    try {
      const result = await searchProduct({ storeId: store.storeId, query: '' })
      setProducts(result.data || [])
    } catch (e) {
      setError('加载商品失败：' + e.message)
    }
    setLoading(false)
  }

  // ─── 搜索商品 ───
  async function handleSearch(query) {
    setSearchQuery(query)
    if (!selectedStore) return
    if (!query.trim()) {
      const result = await searchProduct({ storeId: selectedStore.storeId, query: '' })
      setProducts(result.data || [])
      return
    }
    setLoading(true)
    try {
      const result = await searchProduct({ storeId: selectedStore.storeId, query })
      setProducts(result.data || [])
    } catch (e) { /* keep current */ }
    setLoading(false)
  }

  // ─── 商品分类 ───
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category))
    return ['全部', ...cats]
  }, [products])

  const categoryCounts = useMemo(() => {
    const map = { '全部': products.length }
    for (const p of products) map[p.category] = (map[p.category] || 0) + 1
    return map
  }, [products])

  const [productSort, setProductSort] = useState('default')
  const filteredProducts = useMemo(() => {
    let list = selectedCategory === '全部' ? products : products.filter(p => p.category === selectedCategory)
    if (productSort === 'price-asc') list = [...list].sort((a, b) => a.initialPrice - b.initialPrice)
    else if (productSort === 'price-desc') list = [...list].sort((a, b) => b.initialPrice - a.initialPrice)
    else if (productSort === 'name') list = [...list].sort((a, b) => a.productName.localeCompare(b.productName, 'zh-CN'))
    return list
  }, [products, selectedCategory, productSort])

  // ─── 打开商品定制 ───
  function openCustomize(product) {
    setCustomizing({
      product: { ...product },
      attrs: product.productAttrs.map(a => ({
        ...a,
        productSubAttrs: a.productSubAttrs.map(sa => ({ ...sa })),
      })),
      amount: 1,
      extraPrice: 0,
      note: '',
    })
    setStep(STEPS.CUSTOMIZE)
  }

  // ─── 切换属性 ───
  function toggleAttr(groupId, subAttrId, isMulti) {
    if (!customizing) return
    const newAttrs = customizing.attrs.map(a => {
      if (a.attributeId !== groupId) return a
      return {
        ...a,
        productSubAttrs: a.productSubAttrs.map(sa => {
          if (isMulti) {
            if (sa.attributeId === subAttrId) return { ...sa, selected: !sa.selected }
            return sa
          } else {
            return { ...sa, selected: sa.attributeId === subAttrId }
          }
        }),
      }
    })
    let extra = 0
    for (const a of newAttrs) {
      for (const sa of a.productSubAttrs) {
        if (sa.selected) extra += sa.price
      }
    }
    setCustomizing({ ...customizing, attrs: newAttrs, extraPrice: extra })
  }

  // ─── 加入购物车 ───
  function addToCart() {
    if (!customizing) return
    const { product, attrs, amount, extraPrice, note } = customizing
    const unitPrice = product.initialPrice + extraPrice
    const descParts = []
    for (const a of attrs) {
      const selected = a.productSubAttrs.filter(sa => sa.selected).map(sa => sa.attributeName)
      if (selected.length) descParts.push(selected.join('+'))
    }
    const cartItem = {
      id: `${product.productId}_${Date.now()}`,
      productId: product.productId,
      productName: product.productName,
      skuCode: product.skuCode,
      pictureUrl: product.pictureUrl,
      attrs,
      additionDesc: descParts.join('/'),
      amount,
      unitPrice,
      totalPrice: unitPrice * amount,
      note: note || '',
    }
    setCart(prev => [...prev, cartItem])
    setCustomizing(null)
    setStep(STEPS.BROWSE)
  }

  // ─── 购物车操作 ───
  function removeFromCart(itemId) { setCart(prev => prev.filter(c => c.id !== itemId)) }
  function updateCartAmount(itemId, delta) {
    setCart(prev => prev.map(c => {
      if (c.id !== itemId) return c
      const newAmount = Math.max(1, c.amount + delta)
      return { ...c, amount: newAmount, totalPrice: c.unitPrice * newAmount }
    }))
  }
  function clearCart() { setCart([]) }

  const cartTotal = useMemo(() => cart.reduce((sum, c) => sum + c.totalPrice, 0), [cart])
  const cartCount = useMemo(() => cart.reduce((sum, c) => sum + c.amount, 0), [cart])

  // ─── 预览订单 ───
  async function handlePreview() {
    if (!selectedStore || !cart.length) return
    setLoading(true)
    setStep(STEPS.PREVIEW)
    try {
      const productList = cart.map(c => ({ amount: c.amount, productId: c.productId, skuCode: c.skuCode }))
      const result = await previewOrder({ storeId: selectedStore.storeId, productList, pickupType: 'self_pickup' })
      setOrderPreview(result.data)
    } catch (e) {
      setError('预览订单失败：' + e.message)
      setStep(STEPS.CART)
    }
    setLoading(false)
  }

  // ─── 创建订单 ───
  async function handleCreateOrder() {
    if (!selectedStore || !cart.length) return
    setLoading(true)
    setStep(STEPS.ORDERING)
    try {
      const productList = cart.map(c => ({ amount: c.amount, productId: c.productId, skuCode: c.skuCode }))
      const result = await createOrder({
        storeId: selectedStore.storeId, productList,
        longitude: DEFAULT_LOCATION.longitude, latitude: DEFAULT_LOCATION.latitude,
        pickupType: 'self_pickup',
      })
      const orderId = result.data.orderIdStr
      const detail = await queryOrderDetail({ orderId })
      setCurrentOrder(detail.data)
      setCart([])
      setStep(STEPS.TRACKING)
      if (onOrderCreated) onOrderCreated(detail.data)
    } catch (e) {
      setError('创建订单失败：' + e.message)
      setStep(STEPS.PREVIEW)
    }
    setLoading(false)
  }

  // ─── 取消订单 ───
  async function handleCancelOrder() {
    if (!currentOrder) return
    setLoading(true)
    try {
      await cancelOrder({ orderId: currentOrder.orderId, cancelReason: '用户主动取消' })
      setCurrentOrder(prev => prev ? { ...prev, orderStatus: 100, orderStatusName: '已取消' } : null)
    } catch (e) { setError('取消订单失败：' + e.message) }
    setLoading(false)
  }

  // ─── 返回 ───
  function goBack() {
    switch (step) {
      case STEPS.BROWSE: setStep(STEPS.STORE); setSelectedStore(null); break
      case STEPS.CUSTOMIZE: setCustomizing(null); setStep(STEPS.BROWSE); break
      case STEPS.CART: setStep(STEPS.BROWSE); break
      case STEPS.PREVIEW: setStep(STEPS.CART); break
      case STEPS.TRACKING: setStep(STEPS.STORE); setCurrentOrder(null); setSelectedStore(null); break
      default: setStep(STEPS.STORE)
    }
  }

  // ─── 渲染 ───
  const panelStyle = {
    display: 'flex', flexDirection: 'column', height: '100%',
    background: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    position: embedded ? 'relative' : 'fixed',
    ...(embedded ? {} : { top: 0, right: 0, bottom: 0, width: 420, zIndex: 1000, boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }),
  }

  return (
    <div style={panelStyle} {...qoderProps}>
      {/* ─── 顶部导航栏 ─── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: `1px solid ${BORDER}`,
        background: ACCENT, color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {step !== STEPS.STORE && (
            <button onClick={goBack} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4, display: 'flex' }}>
              <ArrowLeft size={18} />
            </button>
          )}
          <span style={{ fontSize: 15, fontWeight: 600 }}>
            {step === STEPS.STORE && '选择门店'}
            {step === STEPS.BROWSE && (selectedStore?.storeName || '商品浏览')}
            {step === STEPS.CUSTOMIZE && '定制饮品'}
            {step === STEPS.CART && `购物车${cartCount > 0 ? ` (${cartCount})` : ''}`}
            {step === STEPS.PREVIEW && '订单预览'}
            {step === STEPS.ORDERING && '下单中...'}
            {step === STEPS.TRACKING && '订单追踪'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {step === STEPS.BROWSE && cart.length > 0 && (
            <button
              onClick={() => setStep(STEPS.CART)}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4, borderRadius: 14, fontSize: 12 }}
            >
              <ShoppingBag size={14} />
              {cartCount}
            </button>
          )}
          {onClose && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4, display: 'flex' }}>
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* ─── 错误提示 ─── */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#fff3f0', borderBottom: '1px solid #ffd8d2' }}>
          <AlertCircle size={14} color="#e74c3c" />
          <span style={{ fontSize: 12, color: '#e74c3c', flex: 1 }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}>
            <X size={12} />
          </button>
        </div>
      )}

      {/* ─── 主内容区 ─── */}
      <div style={{ flex: 1, overflow: 'auto', padding: 0 }}>
        {step === STEPS.STORE && <StoreList stores={stores} loading={loading} onSelect={selectStore} />}
        {step === STEPS.BROWSE && (
          <ProductBrowse
            products={filteredProducts}
            categories={categories}
            categoryCounts={categoryCounts}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onSearch={handleSearch}
            searchInputRef={searchInputRef}
            loading={loading}
            onSelect={openCustomize}
            productSort={productSort}
            onSortChange={setProductSort}
            cartCount={cartCount}
          />
        )}
        {step === STEPS.CUSTOMIZE && customizing && (
          <ProductCustomize
            item={customizing}
            onToggle={toggleAttr}
            onAmountChange={(delta) => setCustomizing(prev => ({ ...prev, amount: Math.max(1, prev.amount + delta) }))}
            onNoteChange={(note) => setCustomizing(prev => ({ ...prev, note }))}
            onAdd={addToCart}
          />
        )}
        {step === STEPS.CART && (
          <CartView
            cart={cart}
            cartTotal={cartTotal}
            cartCount={cartCount}
            onRemove={removeFromCart}
            onUpdateAmount={updateCartAmount}
            onClear={clearCart}
            onCheckout={handlePreview}
          />
        )}
        {step === STEPS.PREVIEW && orderPreview && (
          <OrderPreview
            preview={orderPreview}
            store={selectedStore}
            onCreateOrder={handleCreateOrder}
            loading={loading}
          />
        )}
        {step === STEPS.ORDERING && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${ACCENT}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 14, color: TEXT_SECONDARY }}>正在创建订单...</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}
        {step === STEPS.TRACKING && currentOrder && (
          <OrderTracking order={currentOrder} onCancel={handleCancelOrder} loading={loading} />
        )}
      </div>

      {/* ─── 底部购物车悬浮栏（仅浏览页显示） ─── */}
      {step === STEPS.BROWSE && cart.length > 0 && (
        <div
          onClick={() => setStep(STEPS.CART)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 16px', borderTop: `1px solid ${BORDER}`,
            background: '#fff', cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <ShoppingBag size={22} color={ACCENT} />
              <span style={{
                position: 'absolute', top: -6, right: -8,
                background: '#e74c3c', color: '#fff', borderRadius: '50%',
                width: 16, height: 16, fontSize: 10, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{cartCount}</span>
            </div>
            <span style={{ fontSize: 13, color: TEXT_PRIMARY, fontWeight: 500 }}>查看购物车</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: ACCENT }}>¥{cartTotal.toFixed(2)}</span>
            <ChevronRight size={16} color={TEXT_TERTIARY} />
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════
// ─── 门店列表（增强版：定位+筛选+排序+状态） ───
// ═══════════════════════════════════════════════════
const STORE_STATUS_MAP = {
  1: { label: '营业中', color: '#444', bg: '#f0f0f0' },
  2: { label: '休息中', color: '#999', bg: '#f5f5f5' },
  3: { label: '即将打烊', color: '#e65100', bg: '#fff3e0' },
}
const STORE_TAGS_OPTIONS = ['堂食', '外卖', '新店', '旗舰店']
const DISTANCE_OPTIONS = [
  { label: '不限', value: Infinity },
  { label: '1km内', value: 1 },
  { label: '3km内', value: 3 },
  { label: '5km内', value: 5 },
  { label: '10km内', value: 10 },
]
const SORT_OPTIONS = [
  { key: 'distance', label: '距离最近' },
  { key: 'status', label: '营业优先' },
  { key: 'name', label: '名称排序' },
]

function StoreList({ stores, loading, onSelect }) {
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState(0)
  const [maxDistance, setMaxDistance] = useState(Infinity)
  const [sortBy, setSortBy] = useState('distance')
  const [locating, setLocating] = useState(false)
  const [userLocation, setUserLocation] = useState('深圳南山 · 万象天地')

  function handleRelocate() {
    setLocating(true)
    setTimeout(() => {
      const areas = ['深圳南山 · 万象天地', '深圳福田 · 会展中心', '深圳罗湖 · 东门步行街', '深圳宝安 · 前海壹方城']
      setUserLocation(areas[Math.floor(Math.random() * areas.length)])
      setLocating(false)
    }, 800)
  }

  const filtered = useMemo(() => {
    let result = [...stores]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(s =>
        s.storeName.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.storeNo?.toLowerCase().includes(q) ||
        s.phone?.includes(search)
      )
    }
    if (tagFilter) result = result.filter(s => s.storeTags?.includes(tagFilter))
    if (statusFilter) result = result.filter(s => s.businessStatus === statusFilter)
    if (maxDistance < Infinity) result = result.filter(s => s.distance <= maxDistance)
    if (sortBy === 'distance') result.sort((a, b) => a.distance - b.distance)
    else if (sortBy === 'status') result.sort((a, b) => (b.businessStatus === 1 ? 1 : 0) - (a.businessStatus === 1 ? 1 : 0) || a.distance - b.distance)
    else if (sortBy === 'name') result.sort((a, b) => a.storeName.localeCompare(b.storeName, 'zh-CN'))
    return result
  }, [stores, search, tagFilter, statusFilter, maxDistance, sortBy])

  const activeFilterCount = [tagFilter, statusFilter, maxDistance < Infinity].filter(Boolean).length

  return (
    <div style={{ padding: '0' }}>
      {/* 定位栏 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 16px', background: ACCENT_BG,
        borderBottom: `1px solid ${BORDER}`,
      }}>
        <MapPin size={14} color={ACCENT} />
        <span style={{ fontSize: 12, color: ACCENT_LIGHT, fontWeight: 500, flex: 1 }}>
          {locating ? '定位中...' : userLocation}
        </span>
        <button
          onClick={handleRelocate}
          style={{
            display: 'flex', alignItems: 'center', gap: 3,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 11, color: ACCENT_LIGHT, padding: '2px 6px',
            borderRadius: 4, transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#eaeaea'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <LocateFixed size={12} />
          重新定位
        </button>
      </div>

      {/* 搜索框 */}
      <div style={{ padding: '12px 16px 8px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', background: SURFACE, borderRadius: 8,
          border: `1px solid ${BORDER}`,
        }}>
          <Search size={15} color={TEXT_TERTIARY} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索门店名称、地址、编号..."
            style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 13, color: TEXT_PRIMARY }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}>
              <X size={14} color={TEXT_TERTIARY} />
            </button>
          )}
        </div>
      </div>

      {/* 标签筛选 */}
      <div style={{ display: 'flex', gap: 6, padding: '0 16px 8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        <button
          onClick={() => setTagFilter('')}
          style={{
            padding: '3px 10px', borderRadius: 14, border: 'none',
            fontSize: 11, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
            background: !tagFilter ? ACCENT : '#f5f5f5',
            color: !tagFilter ? '#fff' : TEXT_SECONDARY,
          }}
        >全部服务</button>
        {STORE_TAGS_OPTIONS.map(tag => (
          <button
            key={tag}
            onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
            style={{
              padding: '3px 10px', borderRadius: 14, border: 'none',
              fontSize: 11, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
              background: tagFilter === tag ? ACCENT : '#f5f5f5',
              color: tagFilter === tag ? '#fff' : TEXT_SECONDARY,
            }}
          >{tag}</button>
        ))}
      </div>

      {/* 状态 + 距离 + 排序 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 16px 8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {[0, 1, 3].map(s => {
          const info = s === 0 ? { label: '全部状态', color: TEXT_SECONDARY, bg: '#f5f5f5' } : STORE_STATUS_MAP[s]
          const isActive = statusFilter === s
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(isActive ? 0 : s)}
              style={{
                padding: '2px 8px', borderRadius: 10, border: 'none',
                fontSize: 10, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
                background: isActive ? info.color : '#f5f5f5',
                color: isActive ? '#fff' : TEXT_TERTIARY,
              }}
            >{info.label}</button>
          )
        })}
        <span style={{ color: BORDER, fontSize: 10 }}>|</span>
        {DISTANCE_OPTIONS.map(d => {
          const isActive = maxDistance === d.value
          return (
            <button
              key={d.label}
              onClick={() => setMaxDistance(isActive ? Infinity : d.value)}
              style={{
                padding: '2px 8px', borderRadius: 10, border: 'none',
                fontSize: 10, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
                background: isActive ? ACCENT : '#f5f5f5',
                color: isActive ? '#fff' : TEXT_TERTIARY,
              }}
            >{d.label}</button>
          )
        })}
        <span style={{ color: BORDER, fontSize: 10 }}>|</span>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{ padding: '2px 6px', borderRadius: 6, border: `1px solid ${BORDER}`, fontSize: 10, color: TEXT_SECONDARY, background: '#fff', cursor: 'pointer', outline: 'none' }}
        >
          {SORT_OPTIONS.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
        </select>
      </div>

      {/* 结果计数 */}
      {(activeFilterCount > 0 || search) && (
        <div style={{ padding: '0 16px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: TEXT_TERTIARY }}>
            {filtered.length} 家门店{activeFilterCount > 0 ? ` · ${activeFilterCount} 项筛选` : ''}
          </span>
          {activeFilterCount > 0 && (
            <button
              onClick={() => { setTagFilter(''); setStatusFilter(0); setMaxDistance(Infinity) }}
              style={{ fontSize: 11, color: ACCENT_LIGHT, background: 'none', border: 'none', cursor: 'pointer' }}
            >清除筛选</button>
          )}
        </div>
      )}

      {/* 门店列表 */}
      <div style={{ padding: '0 16px' }}>
        {loading && <LoadingIndicator text="加载门店中..." />}
        {!loading && filtered.length === 0 && <EmptyState text="未找到匹配门店" subtext="请调整筛选条件或搜索其他关键词" />}
        {filtered.map(store => {
          const status = STORE_STATUS_MAP[store.businessStatus] || STORE_STATUS_MAP[2]
          return (
            <div
              key={store.storeId}
              onClick={() => store.businessStatus !== 2 && onSelect(store)}
              style={{
                padding: '14px 0', borderBottom: `1px solid ${BORDER}`,
                cursor: store.businessStatus !== 2 ? 'pointer' : 'not-allowed',
                transition: 'background 0.15s',
                opacity: store.businessStatus === 2 ? 0.55 : 1,
              }}
              onMouseEnter={e => { if (store.businessStatus !== 2) e.currentTarget.style.background = ACCENT_BG }}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>{store.storeName}</span>
                    <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: status.bg, color: status.color, fontWeight: 500 }}>{status.label}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT }}>{store.distance}km</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4, lineHeight: 1.4 }}>{store.address}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: TEXT_TERTIARY, marginBottom: 6 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><Clock size={11} />{store.workTimeStart}-{store.workTimeEnd}</span>
                {store.phone && <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><Phone size={11} />{store.phone}</span>}
                {store.storeNo && <span style={{ fontSize: 10, color: TEXT_TERTIARY, opacity: 0.7 }}>#{store.storeNo}</span>}
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                {store.storeTags?.map(tag => (
                  <span key={tag} style={{
                    fontSize: 10, padding: '1px 6px', borderRadius: 4,
                    background: (tag === '新店' || tag === '旗舰店') ? '#eaeaea' : '#f5f5f5',
                    color: (tag === '新店' || tag === '旗舰店') ? '#444' : TEXT_TERTIARY,
                    fontWeight: (tag === '新店' || tag === '旗舰店') ? 500 : 400,
                  }}>{tag}</span>
                ))}
                <div style={{ flex: 1 }} />
                <ChevronRight size={14} color={TEXT_TERTIARY} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
// ─── 商品浏览（增强版：分类计数+排序+卡片优化） ───
// ═══════════════════════════════════════════════════
function ProductBrowse({ products, categories, categoryCounts, selectedCategory, onSelectCategory, searchQuery, onSearch, searchInputRef, loading, onSelect, productSort, onSortChange, cartCount, ...qoderProps }) {
  return (
    <div {...qoderProps}>
      {/* 搜索栏 */}
      <div style={{ padding: '12px 16px 8px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', background: SURFACE, borderRadius: 8,
          border: `1px solid ${BORDER}`,
        }}>
          <Search size={15} color={TEXT_TERTIARY} />
          <input
            ref={searchInputRef}
            value={searchQuery}
            onChange={e => onSearch(e.target.value)}
            placeholder="搜索饮品、品类、关键词..."
            style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 13, color: TEXT_PRIMARY }}
          />
          {searchQuery && (
            <button onClick={() => onSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}>
              <X size={14} color={TEXT_TERTIARY} />
            </button>
          )}
        </div>
      </div>

      {/* 分类 Tab + 计数 */}
      <div style={{ display: 'flex', gap: 4, padding: '0 16px 8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            style={{
              padding: '4px 12px', borderRadius: 16, border: 'none',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'all 0.15s',
              background: selectedCategory === cat ? ACCENT : '#f5f5f5',
              color: selectedCategory === cat ? '#fff' : TEXT_SECONDARY,
            }}
          >{cat}{categoryCounts?.[cat] != null ? ` ${categoryCounts[cat]}` : ''}</button>
        ))}
      </div>

      {/* 排序 + 结果数 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 8px' }}>
        <span style={{ fontSize: 11, color: TEXT_TERTIARY }}>{products.length} 款饮品</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <ArrowUpDown size={11} color={TEXT_TERTIARY} />
          <select
            value={productSort}
            onChange={e => onSortChange(e.target.value)}
            style={{ padding: '2px 6px', borderRadius: 6, border: `1px solid ${BORDER}`, fontSize: 10, color: TEXT_SECONDARY, background: '#fff', cursor: 'pointer', outline: 'none' }}
          >
            <option value="default">默认排序</option>
            <option value="price-asc">价格低→高</option>
            <option value="price-desc">价格高→低</option>
            <option value="name">名称排序</option>
          </select>
        </div>
      </div>

      {loading && <LoadingIndicator text="搜索中..." />}
      {!loading && products.length === 0 && <EmptyState text="未找到商品" subtext="换个关键词试试" />}

      {/* 商品列表 */}
      <div style={{ padding: '0 16px' }}>
        {products.map(product => (
          <div
            key={product.productId}
            onClick={() => onSelect(product)}
            style={{
              display: 'flex', gap: 12, padding: '12px 0',
              borderBottom: `1px solid ${BORDER}`,
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = ACCENT_BG}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {/* 商品图片区 */}
            <div style={{
              width: 64, height: 64, borderRadius: 8, flexShrink: 0,
              background: ACCENT_BG, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, position: 'relative',
            }}>
              {getProductEmoji(product.category)}
              {product.tags?.includes('热销') && (
                <span style={{
                  position: 'absolute', top: -2, right: -2,
                  fontSize: 8, padding: '1px 4px', borderRadius: 4,
                  background: '#e74c3c', color: '#fff', fontWeight: 600,
                }}>HOT</span>
              )}
            </div>
            {/* 商品信息 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>{product.productName}</span>
                {product.tags?.map(tag => (
                  <span key={tag} style={{
                    fontSize: 9, padding: '0px 4px', borderRadius: 3,
                    background: tag === '新品' ? '#fff3e0' : tag === '热销' ? '#fce4ec' : tag === '季节限定' ? '#eaeaea' : '#f5f5f5',
                    color: tag === '新品' ? '#e65100' : tag === '热销' ? '#c62828' : tag === '季节限定' ? '#555' : TEXT_TERTIARY,
                    fontWeight: 500,
                  }}>{tag}</span>
                ))}
              </div>
              <div style={{ fontSize: 11, color: TEXT_TERTIARY, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {product.description || product.category}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: ACCENT }}>¥{product.initialPrice}</span>
                  {product.estimatePrice < product.initialPrice && (
                    <span style={{ fontSize: 11, color: TEXT_TERTIARY, textDecoration: 'line-through' }}>¥{product.initialPrice}</span>
                  )}
                </div>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'transform 0.15s',
                }}>
                  <Plus size={15} color="#fff" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
// ─── 商品定制（增强版：属性价格展示+备注+总价突出） ───
// ═══════════════════════════════════════════════════
function ProductCustomize({ item, onToggle, onAmountChange, onNoteChange, onAdd, ...qoderProps }) {
  const { product, attrs, amount, extraPrice, note } = item
  const totalPrice = (product.initialPrice + extraPrice) * amount

  return (
    <div style={{ padding: '16px', ...qoderProps?.style }}>
      {/* 商品头部 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 10, flexShrink: 0,
          background: ACCENT_BG, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32,
        }}>
          {getProductEmoji(product.category)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 4 }}>{product.productName}</div>
          <div style={{ fontSize: 12, color: TEXT_TERTIARY, marginBottom: 6 }}>{product.description}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: ACCENT }}>¥{product.initialPrice + extraPrice}</span>
            {extraPrice > 0 && <span style={{ fontSize: 11, color: TEXT_TERTIARY }}>(含加价 ¥{extraPrice})</span>}
          </div>
        </div>
      </div>

      {/* 属性选择 */}
      {attrs.map(attr => (
        <div key={attr.attributeId} style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{attr.attributeName}</span>
            {attr.multiSelect && <span style={{ fontSize: 10, color: TEXT_TERTIARY }}>(可多选)</span>}
            <span style={{ fontSize: 10, color: TEXT_TERTIARY, marginLeft: 'auto' }}>
              {attr.productSubAttrs.filter(sa => sa.selected).map(sa => sa.attributeName).join('、') || '请选择'}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {attr.productSubAttrs.map(sa => {
              const isSelected = sa.selected
              return (
                <button
                  key={sa.attributeId}
                  onClick={() => onToggle(attr.attributeId, sa.attributeId, attr.multiSelect)}
                  style={{
                    padding: '6px 14px', borderRadius: 18, cursor: 'pointer',
                    fontSize: 12, fontWeight: 500, transition: 'all 0.15s',
                    border: `1.5px solid ${isSelected ? ACCENT : BORDER}`,
                    background: isSelected ? ACCENT_BG : '#fff',
                    color: isSelected ? ACCENT : TEXT_SECONDARY,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  {isSelected && <Check size={12} />}
                  {sa.attributeName}
                  {sa.price > 0 && <span style={{ fontSize: 10, opacity: 0.75 }}>+¥{sa.price}</span>}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* 过敏原提示 */}
      {product.allergens?.length > 0 && (
        <div style={{
          padding: '8px 12px', borderRadius: 8, background: '#fff8e1',
          marginBottom: 16, fontSize: 11, color: '#f57f17',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <AlertCircle size={13} />
          过敏原：{product.allergens.join('、')}
        </div>
      )}

      {/* 备注栏 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: TEXT_SECONDARY, marginBottom: 6 }}>备注</div>
        <input
          value={note || ''}
          onChange={e => onNoteChange(e.target.value)}
          placeholder="如：少冰、去冰、加糖..."
          style={{
            width: '100%', padding: '8px 12px', borderRadius: 8,
            border: `1px solid ${BORDER}`, fontSize: 12, color: TEXT_PRIMARY,
            outline: 'none', background: SURFACE, boxSizing: 'border-box',
          }}
        />
      </div>

      {/* 数量 + 加入购物车 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 0', borderTop: `1px solid ${BORDER}`,
        position: 'sticky', bottom: 0, background: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => onAmountChange(-1)} style={{
            width: 30, height: 30, borderRadius: '50%', border: `1px solid ${BORDER}`,
            background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Minus size={14} color={TEXT_SECONDARY} />
          </button>
          <span style={{ fontSize: 16, fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{amount}</span>
          <button onClick={() => onAmountChange(1)} style={{
            width: 30, height: 30, borderRadius: '50%', border: `1px solid ${BORDER}`,
            background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Plus size={14} color={TEXT_SECONDARY} />
          </button>
        </div>
        <button
          onClick={onAdd}
          style={{
            padding: '10px 28px', borderRadius: 20, border: 'none',
            background: ACCENT, color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <ShoppingBag size={16} />
          加入购物车 ¥{totalPrice.toFixed(2)}
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
// ─── 购物车（增强版：清空+商品数+小计） ───
// ═══════════════════════════════════════════════════
function CartView({ cart, cartTotal, cartCount, onRemove, onUpdateAmount, onClear, onCheckout }) {
  if (cart.length === 0) {
    return <EmptyState text="购物车是空的" subtext="去选择饮品吧" />
  }

  return (
    <div style={{ padding: '12px 16px' }}>
      {/* 头部：数量 + 清空 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: TEXT_TERTIARY }}>{cartCount} 件商品</span>
        <button
          onClick={onClear}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 11, color: TEXT_TERTIARY, padding: '4px 8px', borderRadius: 6,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <Trash2 size={11} />
          清空购物车
        </button>
      </div>

      {cart.map(item => (
        <div key={item.id} style={{
          display: 'flex', gap: 10, padding: '12px 0',
          borderBottom: `1px solid ${BORDER}`,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 8, flexShrink: 0,
            background: ACCENT_BG, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }}>
            {getProductEmoji('')}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 2 }}>{item.productName}</div>
            <div style={{ fontSize: 11, color: TEXT_TERTIARY, marginBottom: 2 }}>{item.additionDesc || '标准'}</div>
            {item.note && <div style={{ fontSize: 10, color: TEXT_TERTIARY, fontStyle: 'italic', marginBottom: 4 }}>备注: {item.note}</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: ACCENT }}>¥{item.totalPrice.toFixed(2)}</span>
                {item.amount > 1 && <span style={{ fontSize: 10, color: TEXT_TERTIARY }}>(¥{item.unitPrice}x{item.amount})</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => onRemove(item.id)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex',
                }}>
                  <Trash2 size={14} color={TEXT_TERTIARY} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={() => onUpdateAmount(item.id, -1)} style={{
                    width: 22, height: 22, borderRadius: '50%', border: `1px solid ${BORDER}`,
                    background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Minus size={11} />
                  </button>
                  <span style={{ fontSize: 13, fontWeight: 600, minWidth: 16, textAlign: 'center' }}>{item.amount}</span>
                  <button onClick={() => onUpdateAmount(item.id, 1)} style={{
                    width: 22, height: 22, borderRadius: '50%', border: `1px solid ${BORDER}`,
                    background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Plus size={11} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* 结算按钮 */}
      <div style={{
        padding: '16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', bottom: 0, background: '#fff',
      }}>
        <div>
          <span style={{ fontSize: 12, color: TEXT_TERTIARY }}>合计</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: ACCENT, marginLeft: 6 }}>¥{cartTotal.toFixed(2)}</span>
        </div>
        <button
          onClick={onCheckout}
          style={{
            padding: '10px 32px', borderRadius: 20, border: 'none',
            background: ACCENT, color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          去结算
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
// ─── 订单预览（增强版：取餐信息+分隔线优化） ───
// ═══════════════════════════════════════════════════
function OrderPreview({ preview, store, onCreateOrder, loading, ...qoderProps }) {
  const waitMin = Math.round((preview.aboutTime - Date.now()) / 60000)

  return (
    <div style={{ padding: '16px', ...qoderProps?.style }}>
      {/* 门店信息 */}
      <div style={{ padding: '12px', borderRadius: 10, background: ACCENT_BG, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <MapPin size={14} color={ACCENT} />
          <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{preview.storeInfo?.storeName}</span>
        </div>
        <div style={{ fontSize: 11, color: TEXT_SECONDARY, marginLeft: 20 }}>{preview.storeInfo?.address}</div>
        <div style={{ display: 'flex', gap: 12, marginTop: 6, marginLeft: 20, fontSize: 11, color: TEXT_TERTIARY }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Package size={11} />
            自取
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Timer size={11} />
            预计{waitMin > 0 ? `${waitMin}分钟` : '15分钟'}后取餐
          </span>
        </div>
      </div>

      {/* 商品明细 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 8 }}>商品明细</div>
        {preview.productInfoList?.map((item, idx) => (
          <div key={idx} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 0', borderBottom: `1px solid ${BORDER}`,
          }}>
            <div>
              <span style={{ fontSize: 13, color: TEXT_PRIMARY }}>{item.name}</span>
              {item.additionDesc && <span style={{ fontSize: 11, color: TEXT_TERTIARY, marginLeft: 6 }}>({item.additionDesc})</span>}
              <span style={{ fontSize: 11, color: TEXT_TERTIARY, marginLeft: 6 }}>x{item.amount}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: TEXT_PRIMARY }}>¥{item.estimateTotalPrice?.toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* 价格明细 */}
      <div style={{ padding: '12px', borderRadius: 8, background: SURFACE, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: TEXT_SECONDARY }}>商品总价</span>
          <span style={{ fontSize: 12, color: TEXT_PRIMARY }}>¥{preview.totalInitialPrice?.toFixed(2)}</span>
        </div>
        {preview.privilegeMoney > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: TEXT_SECONDARY }}>优惠</span>
            <span style={{ fontSize: 12, color: '#e74c3c' }}>-¥{preview.privilegeMoney?.toFixed(2)}</span>
          </div>
        )}
        {preview.deliveryFee > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: TEXT_SECONDARY }}>配送费</span>
            <span style={{ fontSize: 12, color: TEXT_PRIMARY }}>¥{preview.deliveryFee?.toFixed(2)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: `1px dashed ${BORDER}` }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>实付金额</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: ACCENT }}>¥{preview.discountPrice?.toFixed(2)}</span>
        </div>
      </div>

      {/* 下单按钮 */}
      <button
        onClick={onCreateOrder}
        disabled={loading}
        style={{
          width: '100%', padding: '12px', borderRadius: 22, border: 'none',
          background: loading ? '#ccc' : ACCENT, color: '#fff',
          fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}
      >
        <CreditCard size={16} />
        {loading ? '处理中...' : `确认下单 ¥${preview.discountPrice?.toFixed(2)}`}
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════
// ─── 订单追踪（增强版：时间线进度+状态优化） ───
// ═══════════════════════════════════════════════════

// 订单状态时间线步骤定义
const ORDER_TIMELINE = [
  { status: 10, label: '已支付', icon: '💳' },
  { status: 20, label: '已确认', icon: '✅' },
  { status: 30, label: '制作中', icon: '🧑‍🍳' },
  { status: 40, label: '待取餐', icon: '📦' },
  { status: 50, label: '配送中', icon: '🛵' },
  { status: 80, label: '已完成', icon: '🎉' },
]

function OrderTracking({ order, onCancel, loading, ...qoderProps }) {
  const isCancelled = order.orderStatus === 100
  const isCompleted = order.orderStatus === 80

  // 计算当前进度在时间线中的位置
  const currentStepIndex = ORDER_TIMELINE.findIndex(t => t.status === order.orderStatus)

  return (
    <div style={{ padding: '20px 16px', ...qoderProps?.style }}>
      {/* 状态卡片 */}
      <div style={{ textAlign: 'center', padding: '20px 0', marginBottom: 20, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>
          {isCancelled ? '❌' : (ORDER_TIMELINE.find(t => t.status === order.orderStatus)?.icon || '📋')}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: isCancelled ? '#e74c3c' : ACCENT, marginBottom: 4 }}>
          {order.orderStatusName}
        </div>
        {order.takeMealCodeInfo?.code && order.takeMealCodeInfo.code !== '生成中' && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 20px', borderRadius: 12, background: ACCENT_BG,
            marginTop: 8,
          }}>
            <span style={{ fontSize: 12, color: TEXT_SECONDARY }}>取餐码</span>
            <span style={{ fontSize: 24, fontWeight: 800, color: ACCENT }}>{order.takeMealCodeInfo.code}</span>
          </div>
        )}
        {order.takeMealCodeInfo?.shelfNo && (
          <div style={{ fontSize: 12, color: TEXT_TERTIARY, marginTop: 4 }}>{order.takeMealCodeInfo.shelfNo}</div>
        )}
      </div>

      {/* 进度时间线 */}
      {!isCancelled && (
        <div style={{ marginBottom: 20, padding: '0 8px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 12 }}>订单进度</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {ORDER_TIMELINE.map((step, idx) => {
              const isPast = order.orderStatus >= step.status && currentStepIndex >= idx
              const isCurrent = order.orderStatus === step.status
              const isFuture = !isPast
              return (
                <div key={step.status} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  {/* 时间线指示器 */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20, flexShrink: 0 }}>
                    <div style={{
                      width: isCurrent ? 12 : 8, height: isCurrent ? 12 : 8,
                      borderRadius: '50%',
                      background: isPast ? ACCENT : isCurrent ? ACCENT : '#ddd',
                      border: isCurrent ? `2px solid ${ACCENT}` : 'none',
                      boxShadow: isCurrent ? `0 0 0 3px ${ACCENT_BG}` : 'none',
                      transition: 'all 0.3s',
                    }} />
                    {idx < ORDER_TIMELINE.length - 1 && (
                      <div style={{
                        width: 2, height: 24,
                        background: isPast && order.orderStatus >= ORDER_TIMELINE[idx + 1]?.status ? ACCENT : '#e0e0e0',
                      }} />
                    )}
                  </div>
                  {/* 标签 */}
                  <div style={{ paddingBottom: idx < ORDER_TIMELINE.length - 1 ? 8 : 0 }}>
                    <span style={{
                      fontSize: 12, fontWeight: isCurrent ? 600 : 400,
                      color: isPast ? TEXT_PRIMARY : isCurrent ? ACCENT : TEXT_TERTIARY,
                    }}>{step.label}</span>
                    {isCurrent && <span style={{ fontSize: 10, color: TEXT_TERTIARY, marginLeft: 6 }}>当前</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 门店信息 */}
      <div style={{ padding: '12px', borderRadius: 10, background: SURFACE, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <MapPin size={13} color={TEXT_SECONDARY} />
          <span style={{ fontSize: 13, fontWeight: 500, color: TEXT_PRIMARY }}>{order.storeInfo?.storeName}</span>
        </div>
        <div style={{ fontSize: 11, color: TEXT_TERTIARY, marginLeft: 19 }}>{order.storeInfo?.address}</div>
      </div>

      {/* 商品列表 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 8 }}>订单商品</div>
        {order.productInfoList?.map((item, idx) => (
          <div key={idx} style={{
            display: 'flex', justifyContent: 'space-between', padding: '6px 0',
            fontSize: 12, color: TEXT_SECONDARY,
          }}>
            <span>{item.name} {item.additionDesc && `(${item.additionDesc})`} x{item.amount}</span>
            <span>¥{item.estimateTotalPrice?.toFixed(2) || item.estimatePrice?.toFixed(2)}</span>
          </div>
        ))}
        {order.orderCommodityList?.map((item, idx) => (
          !order.productInfoList && (
            <div key={idx} style={{
              display: 'flex', justifyContent: 'space-between', padding: '6px 0',
              fontSize: 12, color: TEXT_SECONDARY,
            }}>
              <span>{item.commodityName} x1</span>
              <span>¥{item.payMoney?.toFixed(2)}</span>
            </div>
          )
        ))}
        <div style={{
          display: 'flex', justifyContent: 'space-between', paddingTop: 8, marginTop: 4,
          borderTop: `1px dashed ${BORDER}`, fontSize: 14, fontWeight: 600,
        }}>
          <span style={{ color: TEXT_PRIMARY }}>实付金额</span>
          <span style={{ color: ACCENT }}>¥{order.orderPayAmount?.toFixed(2)}</span>
        </div>
      </div>

      {order.remark && (
        <div style={{ padding: '8px 12px', borderRadius: 8, background: '#fff8e1', fontSize: 11, color: '#f57f17', marginBottom: 16 }}>
          备注：{order.remark}
        </div>
      )}

      {/* 操作按钮 */}
      {!isCancelled && !isCompleted && (
        <button
          onClick={onCancel}
          disabled={loading}
          style={{
            width: '100%', padding: '10px', borderRadius: 20,
            border: `1px solid ${BORDER}`, background: '#fff',
            fontSize: 13, fontWeight: 500, color: TEXT_SECONDARY,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '处理中...' : '取消订单'}
        </button>
      )}

      {/* 已完成/已取消提示 */}
      {(isCompleted || isCancelled) && (
        <div style={{
          textAlign: 'center', padding: '12px', borderRadius: 10,
          background: ACCENT_BG, fontSize: 12, color: TEXT_TERTIARY,
        }}>
          {isCompleted ? '感谢您的购买，期待下次光临！' : '订单已取消'}
        </div>
      )}
    </div>
  )
}

// ─── 工具函数 ───
function getProductEmoji(category) {
  const map = {
    '多肉系列': '🍇',
    '芝芝系列': '🧀',
    '果茶系列': '🍋',
    '纯茶系列': '🍵',
    '季节限定': '🌸',
    '小食': '🍰',
  }
  return map[category] || '🧋'
}

function LoadingIndicator({ text, ...qoderProps }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8, ...qoderProps?.style }}>
      <div style={{
        width: 20, height: 20, border: `2px solid ${ACCENT}`,
        borderTopColor: 'transparent', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <span style={{ fontSize: 13, color: TEXT_TERTIARY }}>{text || '加载中...'}</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function EmptyState({ text, subtext, ...qoderProps }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', ...qoderProps?.style }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>🧋</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: TEXT_PRIMARY, marginBottom: 4 }}>{text}</div>
      {subtext && <div style={{ fontSize: 12, color: TEXT_TERTIARY }}>{subtext}</div>}
    </div>
  )
}
