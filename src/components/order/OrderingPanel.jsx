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
    <div style={{ ...(panelStyle), ...(qoderProps?.style) }} {...qoderProps} className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* ─── 顶部导航栏 ─── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: `1px solid ${BORDER}`,
        background: ACCENT, color: '#fff',
      }} data-qoder-id="qel-div-931da3b8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-931da3b8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:292,&quot;column&quot;:7}}">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} data-qoder-id="qel-div-941da54b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-941da54b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:297,&quot;column&quot;:9}}">
          {step !== STEPS.STORE && (
            <button onClick={goBack} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4, display: 'flex' }} data-qoder-id="qel-button-fd9cce66" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-fd9cce66&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:299,&quot;column&quot;:13}}">
              <ArrowLeft size={18}  data-qoder-id="qel-arrowleft-414c6609" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-arrowleft-414c6609&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;arrowleft&quot;,&quot;loc&quot;:{&quot;line&quot;:300,&quot;column&quot;:15}}"/>
            </button>
          )}
          <span style={{ fontSize: 15, fontWeight: 600 }} data-qoder-id="qel-span-93119570" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-93119570&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:303,&quot;column&quot;:11}}">
            {step === STEPS.STORE && '选择门店'}
            {step === STEPS.BROWSE && (selectedStore?.storeName || '商品浏览')}
            {step === STEPS.CUSTOMIZE && '定制饮品'}
            {step === STEPS.CART && `购物车${cartCount > 0 ? ` (${cartCount})` : ''}`}
            {step === STEPS.PREVIEW && '订单预览'}
            {step === STEPS.ORDERING && '下单中...'}
            {step === STEPS.TRACKING && '订单追踪'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} data-qoder-id="qel-div-981dab97" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-981dab97&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:313,&quot;column&quot;:9}}">
          {step === STEPS.BROWSE && cart.length > 0 && (
            <button
              onClick={() => setStep(STEPS.CART)}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4, borderRadius: 14, fontSize: 12 }}
             data-qoder-id="qel-button-099ce14a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-099ce14a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:315,&quot;column&quot;:13}}">
              <ShoppingBag size={14}  data-qoder-id="qel-shoppingbag-7f958ae1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-shoppingbag-7f958ae1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;shoppingbag&quot;,&quot;loc&quot;:{&quot;line&quot;:319,&quot;column&quot;:15}}"/>
              {cartCount}
            </button>
          )}
          {onClose && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4, display: 'flex' }} data-qoder-id="qel-button-91e59a2f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-91e59a2f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:324,&quot;column&quot;:13}}">
              <X size={18}  data-qoder-id="qel-x-828efcac" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-x-828efcac&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;x&quot;,&quot;loc&quot;:{&quot;line&quot;:325,&quot;column&quot;:15}}"/>
            </button>
          )}
        </div>
      </div>

      {/* ─── 错误提示 ─── */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#fff3f0', borderBottom: '1px solid #ffd8d2' }} data-qoder-id="qel-div-93afe179" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-93afe179&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:333,&quot;column&quot;:9}}">
          <AlertCircle size={14} color="#e74c3c"  data-qoder-id="qel-alertcircle-64d769f6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-alertcircle-64d769f6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;alertcircle&quot;,&quot;loc&quot;:{&quot;line&quot;:334,&quot;column&quot;:11}}"/>
          <span style={{ fontSize: 12, color: '#e74c3c', flex: 1 }} data-qoder-id="qel-span-cabf4653" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-cabf4653&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:335,&quot;column&quot;:11}}">{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }} data-qoder-id="qel-button-8ce59250" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-8ce59250&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:336,&quot;column&quot;:11}}">
            <X size={12}  data-qoder-id="qel-x-818efb19" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-x-818efb19&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;x&quot;,&quot;loc&quot;:{&quot;line&quot;:337,&quot;column&quot;:13}}"/>
          </button>
        </div>
      )}

      {/* ─── 主内容区 ─── */}
      <div style={{ flex: 1, overflow: 'auto', padding: 0 }} data-qoder-id="qel-div-96afe632" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-96afe632&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:343,&quot;column&quot;:7}}">
        {step === STEPS.STORE && <StoreList stores={stores} loading={loading} onSelect={selectStore}  data-qoder-id="qel-storelist-0b53b727" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-storelist-0b53b727&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;storelist&quot;,&quot;loc&quot;:{&quot;line&quot;:344,&quot;column&quot;:34}}"/>}
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
           data-qoder-id="qel-productbrowse-c37e7788" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-productbrowse-c37e7788&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;productbrowse&quot;,&quot;loc&quot;:{&quot;line&quot;:346,&quot;column&quot;:11}}"/>
        )}
        {step === STEPS.CUSTOMIZE && customizing && (
          <ProductCustomize
            item={customizing}
            onToggle={toggleAttr}
            onAmountChange={(delta) => setCustomizing(prev => ({ ...prev, amount: Math.max(1, prev.amount + delta) }))}
            onNoteChange={(note) => setCustomizing(prev => ({ ...prev, note }))}
            onAdd={addToCart}
           data-qoder-id="qel-productcustomize-c07a5090" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-productcustomize-c07a5090&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;productcustomize&quot;,&quot;loc&quot;:{&quot;line&quot;:363,&quot;column&quot;:11}}"/>
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
           data-qoder-id="qel-cartview-80dac541" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-cartview-80dac541&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;cartview&quot;,&quot;loc&quot;:{&quot;line&quot;:372,&quot;column&quot;:11}}"/>
        )}
        {step === STEPS.PREVIEW && orderPreview && (
          <OrderPreview
            preview={orderPreview}
            store={selectedStore}
            onCreateOrder={handleCreateOrder}
            loading={loading}
           data-qoder-id="qel-orderpreview-28333cea" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-orderpreview-28333cea&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;orderpreview&quot;,&quot;loc&quot;:{&quot;line&quot;:383,&quot;column&quot;:11}}"/>
        )}
        {step === STEPS.ORDERING && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }} data-qoder-id="qel-div-22a873d1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-22a873d1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:391,&quot;column&quot;:11}}">
            <div style={{ width: 36, height: 36, border: `3px solid ${ACCENT}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}  data-qoder-id="qel-div-23a87564" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-23a87564&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:392,&quot;column&quot;:13}}"/>
            <span style={{ fontSize: 14, color: TEXT_SECONDARY }} data-qoder-id="qel-span-59b7d8ab" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-59b7d8ab&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:393,&quot;column&quot;:13}}">正在创建订单...</span>
            <style data-qoder-id="qel-style-32a88e26" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-style-32a88e26&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;style&quot;,&quot;loc&quot;:{&quot;line&quot;:394,&quot;column&quot;:13}}">{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}
        {step === STEPS.TRACKING && currentOrder && (
          <OrderTracking order={currentOrder} onCancel={handleCancelOrder} loading={loading}  data-qoder-id="qel-ordertracking-4da9d42d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-ordertracking-4da9d42d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;ordertracking&quot;,&quot;loc&quot;:{&quot;line&quot;:398,&quot;column&quot;:11}}"/>
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
         data-qoder-id="qel-div-17a86280" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-17a86280&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:404,&quot;column&quot;:9}}">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} data-qoder-id="qel-div-18a86413" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-18a86413&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:412,&quot;column&quot;:11}}">
            <div style={{ position: 'relative' }} data-qoder-id="qel-div-a5ab80a1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a5ab80a1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:413,&quot;column&quot;:13}}">
              <ShoppingBag size={22} color={ACCENT}  data-qoder-id="qel-shoppingbag-2c50bd56" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-shoppingbag-2c50bd56&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;shoppingbag&quot;,&quot;loc&quot;:{&quot;line&quot;:414,&quot;column&quot;:15}}"/>
              <span style={{
                position: 'absolute', top: -6, right: -8,
                background: '#e74c3c', color: '#fff', borderRadius: '50%',
                width: 16, height: 16, fontSize: 10, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }} data-qoder-id="qel-span-e0baebc7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-e0baebc7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:415,&quot;column&quot;:15}}">{cartCount}</span>
            </div>
            <span style={{ fontSize: 13, color: TEXT_PRIMARY, fontWeight: 500 }} data-qoder-id="qel-span-dfbaea34" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-dfbaea34&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:422,&quot;column&quot;:13}}">查看购物车</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} data-qoder-id="qel-div-a9ab86ed" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a9ab86ed&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:424,&quot;column&quot;:11}}">
            <span style={{ fontSize: 16, fontWeight: 700, color: ACCENT }} data-qoder-id="qel-span-ddbae70e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-ddbae70e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:425,&quot;column&quot;:13}}">¥{cartTotal.toFixed(2)}</span>
            <ChevronRight size={16} color={TEXT_TERTIARY}  data-qoder-id="qel-chevronright-b5e83591" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-chevronright-b5e83591&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;chevronright&quot;,&quot;loc&quot;:{&quot;line&quot;:426,&quot;column&quot;:13}}"/>
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

function StoreList({ stores, loading, onSelect, ...qoderProps }) {
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
    <div style={{ ...({ padding: '0' }), ...(qoderProps?.style) }} className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* 定位栏 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 16px', background: ACCENT_BG,
        borderBottom: `1px solid ${BORDER}`,
      }} data-qoder-id="qel-div-d40f2864" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-d40f2864&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:499,&quot;column&quot;:7}}">
        <MapPin size={14} color={ACCENT}  data-qoder-id="qel-mappin-bf8a17a1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mappin-bf8a17a1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;mappin&quot;,&quot;loc&quot;:{&quot;line&quot;:504,&quot;column&quot;:9}}"/>
        <span style={{ fontSize: 12, color: ACCENT_LIGHT, fontWeight: 500, flex: 1 }} data-qoder-id="qel-span-2ba2d537" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-2ba2d537&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:505,&quot;column&quot;:9}}">
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
         data-qoder-id="qel-button-2a8841a8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-2a8841a8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:508,&quot;column&quot;:9}}">
          <LocateFixed size={12}  data-qoder-id="qel-locatefixed-52d1257d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-locatefixed-52d1257d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;locatefixed&quot;,&quot;loc&quot;:{&quot;line&quot;:519,&quot;column&quot;:11}}"/>
          重新定位
        </button>
      </div>

      {/* 搜索框 */}
      <div style={{ padding: '12px 16px 8px' }} data-qoder-id="qel-div-c70cd556" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-c70cd556&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:525,&quot;column&quot;:7}}">
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', background: SURFACE, borderRadius: 8,
          border: `1px solid ${BORDER}`,
        }} data-qoder-id="qel-div-ca0cda0f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-ca0cda0f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:526,&quot;column&quot;:9}}">
          <Search size={15} color={TEXT_TERTIARY}  data-qoder-id="qel-search-c7d4aedc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-search-c7d4aedc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;search&quot;,&quot;loc&quot;:{&quot;line&quot;:531,&quot;column&quot;:11}}"/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索门店名称、地址、编号..."
            style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 13, color: TEXT_PRIMARY }}
           data-qoder-id="qel-input-5567df31" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-5567df31&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:532,&quot;column&quot;:11}}"/>
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }} data-qoder-id="qel-button-30884b1a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-30884b1a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:539,&quot;column&quot;:13}}">
              <X size={14} color={TEXT_TERTIARY}  data-qoder-id="qel-x-693378d7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-x-693378d7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;x&quot;,&quot;loc&quot;:{&quot;line&quot;:540,&quot;column&quot;:15}}"/>
            </button>
          )}
        </div>
      </div>

      {/* 标签筛选 */}
      <div style={{ display: 'flex', gap: 6, padding: '0 16px 8px', overflowX: 'auto', scrollbarWidth: 'none' }} data-qoder-id="qel-div-cd0cdec8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-cd0cdec8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:547,&quot;column&quot;:7}}">
        <button
          onClick={() => setTagFilter('')}
          style={{
            padding: '3px 10px', borderRadius: 14, border: 'none',
            fontSize: 11, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
            background: !tagFilter ? ACCENT : '#f5f5f5',
            color: !tagFilter ? '#fff' : TEXT_SECONDARY,
          }}
         data-qoder-id="qel-button-a58531b2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-a58531b2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:548,&quot;column&quot;:9}}">全部服务</button>
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
           data-qoder-id="qel-button-a6853345" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-a6853345&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:558,&quot;column&quot;:11}}">{tag}</button>
        ))}
      </div>

      {/* 状态 + 距离 + 排序 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 16px 8px', overflowX: 'auto', scrollbarWidth: 'none' }} data-qoder-id="qel-div-de0abaf4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-de0abaf4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:572,&quot;column&quot;:7}}">
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
             data-qoder-id="qel-button-a485301f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-a485301f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:577,&quot;column&quot;:13}}">{info.label}</button>
          )
        })}
        <span style={{ color: BORDER, fontSize: 10 }} data-qoder-id="qel-span-29a0937a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-29a0937a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:589,&quot;column&quot;:9}}">|</span>
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
             data-qoder-id="qel-button-a2852cf9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-a2852cf9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:593,&quot;column&quot;:13}}">{d.label}</button>
          )
        })}
        <span style={{ color: BORDER, fontSize: 10 }} data-qoder-id="qel-span-27a09054" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-27a09054&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:605,&quot;column&quot;:9}}">|</span>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{ padding: '2px 6px', borderRadius: 6, border: `1px solid ${BORDER}`, fontSize: 10, color: TEXT_SECONDARY, background: '#fff', cursor: 'pointer', outline: 'none' }}
         data-qoder-id="qel-select-15c822d7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-select-15c822d7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;select&quot;,&quot;loc&quot;:{&quot;line&quot;:606,&quot;column&quot;:9}}">
          {SORT_OPTIONS.map(opt => <option key={opt.key} value={opt.key} data-qoder-id="qel-option-7f511688" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-7f511688&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:611,&quot;column&quot;:36}}">{opt.label}</option>)}
        </select>
      </div>

      {/* 结果计数 */}
      {(activeFilterCount > 0 || search) && (
        <div style={{ padding: '0 16px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} data-qoder-id="qel-div-d90ab315" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-d90ab315&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:617,&quot;column&quot;:9}}">
          <span style={{ fontSize: 11, color: TEXT_TERTIARY }} data-qoder-id="qel-span-1f9e4525" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-1f9e4525&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:618,&quot;column&quot;:11}}">
            {filtered.length} 家门店{activeFilterCount > 0 ? ` · ${activeFilterCount} 项筛选` : ''}
          </span>
          {activeFilterCount > 0 && (
            <button
              onClick={() => { setTagFilter(''); setStatusFilter(0); setMaxDistance(Infinity) }}
              style={{ fontSize: 11, color: ACCENT_LIGHT, background: 'none', border: 'none', cursor: 'pointer' }}
             data-qoder-id="qel-button-9e82e816" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-9e82e816&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:622,&quot;column&quot;:13}}">清除筛选</button>
          )}
        </div>
      )}

      {/* 门店列表 */}
      <div style={{ padding: '0 16px' }} data-qoder-id="qel-div-5807a96b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-5807a96b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:631,&quot;column&quot;:7}}">
        {loading && <LoadingIndicator text="加载门店中..."  data-qoder-id="qel-loadingindicator-e3b7e52a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-loadingindicator-e3b7e52a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;loadingindicator&quot;,&quot;loc&quot;:{&quot;line&quot;:632,&quot;column&quot;:21}}"/>}
        {!loading && filtered.length === 0 && <EmptyState text="未找到匹配门店" subtext="请调整筛选条件或搜索其他关键词"  data-qoder-id="qel-emptystate-9cc4e6b1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-emptystate-9cc4e6b1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;emptystate&quot;,&quot;loc&quot;:{&quot;line&quot;:633,&quot;column&quot;:47}}"/>}
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
             data-qoder-id="qel-div-5d07b14a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-5d07b14a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:637,&quot;column&quot;:13}}">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }} data-qoder-id="qel-div-5c07afb7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-5c07afb7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:649,&quot;column&quot;:15}}">
                <div style={{ flex: 1, minWidth: 0 }} data-qoder-id="qel-div-5b07ae24" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-5b07ae24&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:650,&quot;column&quot;:17}}">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }} data-qoder-id="qel-div-52079ff9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-52079ff9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:651,&quot;column&quot;:19}}">
                    <span style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }} data-qoder-id="qel-span-269e502a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-269e502a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:652,&quot;column&quot;:21}}">{store.storeName}</span>
                    <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: status.bg, color: status.color, fontWeight: 500 }} data-qoder-id="qel-span-199bfd1c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-199bfd1c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:653,&quot;column&quot;:21}}">{status.label}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }} data-qoder-id="qel-div-5505661b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-5505661b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:656,&quot;column&quot;:17}}">
                  <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT }} data-qoder-id="qel-div-560567ae" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-560567ae&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:657,&quot;column&quot;:19}}">{store.distance}km</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4, lineHeight: 1.4 }} data-qoder-id="qel-div-57056941" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-57056941&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:660,&quot;column&quot;:15}}">{store.address}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: TEXT_TERTIARY, marginBottom: 6 }} data-qoder-id="qel-div-58056ad4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-58056ad4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:661,&quot;column&quot;:15}}">
                <span style={{ display: 'flex', alignItems: 'center', gap: 2 }} data-qoder-id="qel-span-169bf863" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-169bf863&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:662,&quot;column&quot;:17}}"><Clock size={11}  data-qoder-id="qel-clock-499a37e2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-clock-499a37e2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;clock&quot;,&quot;loc&quot;:{&quot;line&quot;:662,&quot;column&quot;:81}}"/>{store.workTimeStart}-{store.workTimeEnd}</span>
                {store.phone && <span style={{ display: 'flex', alignItems: 'center', gap: 2 }} data-qoder-id="qel-span-189bfb89" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-189bfb89&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:663,&quot;column&quot;:33}}"><Phone size={11}  data-qoder-id="qel-phone-9207d624" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-phone-9207d624&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;phone&quot;,&quot;loc&quot;:{&quot;line&quot;:663,&quot;column&quot;:97}}"/>{store.phone}</span>}
                {store.storeNo && <span style={{ fontSize: 10, color: TEXT_TERTIARY, opacity: 0.7 }} data-qoder-id="qel-span-229c0b47" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-229c0b47&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:664,&quot;column&quot;:35}}">#{store.storeNo}</span>}
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }} data-qoder-id="qel-div-4e031c7f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-4e031c7f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:666,&quot;column&quot;:15}}">
                {store.storeTags?.map(tag => (
                  <span key={tag} style={{
                    fontSize: 10, padding: '1px 6px', borderRadius: 4,
                    background: (tag === '新店' || tag === '旗舰店') ? '#eaeaea' : '#f5f5f5',
                    color: (tag === '新店' || tag === '旗舰店') ? '#444' : TEXT_TERTIARY,
                    fontWeight: (tag === '新店' || tag === '旗舰店') ? 500 : 400,
                  }} data-qoder-id="qel-span-a2857b78" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-a2857b78&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:668,&quot;column&quot;:19}}">{tag}</span>
                ))}
                <div style={{ flex: 1 }}  data-qoder-id="qel-div-50031fa5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-50031fa5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:675,&quot;column&quot;:17}}"/>
                <ChevronRight size={14} color={TEXT_TERTIARY}  data-qoder-id="qel-chevronright-f55d1f20" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-chevronright-f55d1f20&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;StoreList&quot;,&quot;elementRole&quot;:&quot;chevronright&quot;,&quot;loc&quot;:{&quot;line&quot;:676,&quot;column&quot;:17}}"/>
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
    <div {...qoderProps} style={qoderProps?.style} className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* 搜索栏 */}
      <div style={{ padding: '12px 16px 8px' }} data-qoder-id="qel-div-690b8308" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-690b8308&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:693,&quot;column&quot;:7}}">
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', background: SURFACE, borderRadius: 8,
          border: `1px solid ${BORDER}`,
        }} data-qoder-id="qel-div-6c0b87c1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-6c0b87c1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:694,&quot;column&quot;:9}}">
          <Search size={15} color={TEXT_TERTIARY}  data-qoder-id="qel-search-f3b109ee" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-search-f3b109ee&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;search&quot;,&quot;loc&quot;:{&quot;line&quot;:699,&quot;column&quot;:11}}"/>
          <input
            ref={searchInputRef}
            value={searchQuery}
            onChange={e => onSearch(e.target.value)}
            placeholder="搜索饮品、品类、关键词..."
            style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 13, color: TEXT_PRIMARY }}
           data-qoder-id="qel-input-006a2c4b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-006a2c4b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:700,&quot;column&quot;:11}}"/>
          {searchQuery && (
            <button onClick={() => onSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }} data-qoder-id="qel-button-b325c3d4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-b325c3d4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:708,&quot;column&quot;:13}}">
              <X size={14} color={TEXT_TERTIARY}  data-qoder-id="qel-x-0cdfebc2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-x-0cdfebc2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;x&quot;,&quot;loc&quot;:{&quot;line&quot;:709,&quot;column&quot;:15}}"/>
            </button>
          )}
        </div>
      </div>

      {/* 分类 Tab + 计数 */}
      <div style={{ display: 'flex', gap: 4, padding: '0 16px 8px', overflowX: 'auto', scrollbarWidth: 'none' }} data-qoder-id="qel-div-69094471" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-69094471&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:716,&quot;column&quot;:7}}">
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
           data-qoder-id="qel-button-a4236da0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-a4236da0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:718,&quot;column&quot;:11}}">{cat}{categoryCounts?.[cat] != null ? ` ${categoryCounts[cat]}` : ''}</button>
        ))}
      </div>

      {/* 排序 + 结果数 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 8px' }} data-qoder-id="qel-div-6709414b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-6709414b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:733,&quot;column&quot;:7}}">
        <span style={{ fontSize: 11, color: TEXT_TERTIARY }} data-qoder-id="qel-span-faa1fdfe" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-faa1fdfe&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:734,&quot;column&quot;:9}}">{products.length} 款饮品</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} data-qoder-id="qel-div-6d094abd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-6d094abd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:735,&quot;column&quot;:9}}">
          <ArrowUpDown size={11} color={TEXT_TERTIARY}  data-qoder-id="qel-arrowupdown-e6481940" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-arrowupdown-e6481940&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;arrowupdown&quot;,&quot;loc&quot;:{&quot;line&quot;:736,&quot;column&quot;:11}}"/>
          <select
            value={productSort}
            onChange={e => onSortChange(e.target.value)}
            style={{ padding: '2px 6px', borderRadius: 6, border: `1px solid ${BORDER}`, fontSize: 10, color: TEXT_SECONDARY, background: '#fff', cursor: 'pointer', outline: 'none' }}
           data-qoder-id="qel-select-3b261c5b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-select-3b261c5b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;select&quot;,&quot;loc&quot;:{&quot;line&quot;:737,&quot;column&quot;:11}}">
            <option value="default" data-qoder-id="qel-option-4e13348c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-4e13348c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:742,&quot;column&quot;:13}}">默认排序</option>
            <option value="price-asc" data-qoder-id="qel-option-4f13361f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-4f13361f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:743,&quot;column&quot;:13}}">价格低→高</option>
            <option value="price-desc" data-qoder-id="qel-option-0c23a714" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-0c23a714&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:744,&quot;column&quot;:13}}">价格高→低</option>
            <option value="name" data-qoder-id="qel-option-0d23a8a7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-0d23a8a7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:745,&quot;column&quot;:13}}">名称排序</option>
          </select>
        </div>
      </div>

      {loading && <LoadingIndicator text="搜索中..."  data-qoder-id="qel-loadingindicator-0c2b5686" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-loadingindicator-0c2b5686&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;loadingindicator&quot;,&quot;loc&quot;:{&quot;line&quot;:750,&quot;column&quot;:19}}"/>}
      {!loading && products.length === 0 && <EmptyState text="未找到商品" subtext="换个关键词试试"  data-qoder-id="qel-emptystate-b28695cb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-emptystate-b28695cb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;emptystate&quot;,&quot;loc&quot;:{&quot;line&quot;:751,&quot;column&quot;:45}}"/>}

      {/* 商品列表 */}
      <div style={{ padding: '0 16px' }} data-qoder-id="qel-div-39ada466" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-39ada466&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:754,&quot;column&quot;:7}}">
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
           data-qoder-id="qel-div-3aada5f9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-3aada5f9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:756,&quot;column&quot;:11}}">
            {/* 商品图片区 */}
            <div style={{
              width: 64, height: 64, borderRadius: 8, flexShrink: 0,
              background: ACCENT_BG, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, position: 'relative',
            }} data-qoder-id="qel-div-37ada140" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-37ada140&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:768,&quot;column&quot;:13}}">
              {getProductEmoji(product.category)}
              {product.tags?.includes('热销') && (
                <span style={{
                  position: 'absolute', top: -2, right: -2,
                  fontSize: 8, padding: '1px 4px', borderRadius: 4,
                  background: '#e74c3c', color: '#fff', fontWeight: 600,
                }} data-qoder-id="qel-span-df265ecf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-df265ecf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:775,&quot;column&quot;:17}}">HOT</span>
              )}
            </div>
            {/* 商品信息 */}
            <div style={{ flex: 1, minWidth: 0 }} data-qoder-id="qel-div-45adb74a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-45adb74a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:783,&quot;column&quot;:13}}">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }} data-qoder-id="qel-div-46adb8dd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-46adb8dd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:784,&quot;column&quot;:15}}">
                <span style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }} data-qoder-id="qel-span-e228a21f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-e228a21f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:785,&quot;column&quot;:17}}">{product.productName}</span>
                {product.tags?.map(tag => (
                  <span key={tag} style={{
                    fontSize: 9, padding: '0px 4px', borderRadius: 3,
                    background: tag === '新品' ? '#fff3e0' : tag === '热销' ? '#fce4ec' : tag === '季节限定' ? '#eaeaea' : '#f5f5f5',
                    color: tag === '新品' ? '#e65100' : tag === '热销' ? '#c62828' : tag === '季节限定' ? '#555' : TEXT_TERTIARY,
                    fontWeight: 500,
                  }} data-qoder-id="qel-span-e128a08c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-e128a08c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:787,&quot;column&quot;:19}}">{tag}</span>
                ))}
              </div>
              <div style={{ fontSize: 11, color: TEXT_TERTIARY, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} data-qoder-id="qel-div-c5b0bf61" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-c5b0bf61&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:795,&quot;column&quot;:15}}">
                {product.description || product.category}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} data-qoder-id="qel-div-c4b0bdce" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-c4b0bdce&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:798,&quot;column&quot;:15}}">
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }} data-qoder-id="qel-div-c7b0c287" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-c7b0c287&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:799,&quot;column&quot;:17}}">
                  <span style={{ fontSize: 16, fontWeight: 700, color: ACCENT }} data-qoder-id="qel-span-dd289a40" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-dd289a40&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:800,&quot;column&quot;:19}}">¥{product.initialPrice}</span>
                  {product.estimatePrice < product.initialPrice && (
                    <span style={{ fontSize: 11, color: TEXT_TERTIARY, textDecoration: 'line-through' }} data-qoder-id="qel-span-e0289ef9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-e0289ef9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:802,&quot;column&quot;:21}}">¥{product.initialPrice}</span>
                  )}
                </div>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'transform 0.15s',
                }} data-qoder-id="qel-div-c8b0c41a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-c8b0c41a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:805,&quot;column&quot;:17}}">
                  <Plus size={15} color="#fff"  data-qoder-id="qel-plus-12d22afb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-plus-12d22afb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;plus&quot;,&quot;loc&quot;:{&quot;line&quot;:810,&quot;column&quot;:19}}"/>
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
    <div style={{ padding: '16px', ...qoderProps?.style }} className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* 商品头部 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }} data-qoder-id="qel-div-cd79350b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-cd79350b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:831,&quot;column&quot;:7}}">
        <div style={{
          width: 72, height: 72, borderRadius: 10, flexShrink: 0,
          background: ACCENT_BG, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32,
        }} data-qoder-id="qel-div-cc793378" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-cc793378&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:832,&quot;column&quot;:9}}">
          {getProductEmoji(product.category)}
        </div>
        <div style={{ flex: 1 }} data-qoder-id="qel-div-cf793831" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-cf793831&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:839,&quot;column&quot;:9}}">
          <div style={{ fontSize: 16, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 4 }} data-qoder-id="qel-div-ce79369e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-ce79369e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:840,&quot;column&quot;:11}}">{product.productName}</div>
          <div style={{ fontSize: 12, color: TEXT_TERTIARY, marginBottom: 6 }} data-qoder-id="qel-div-d1793b57" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-d1793b57&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:841,&quot;column&quot;:11}}">{product.description}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }} data-qoder-id="qel-div-d07939c4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-d07939c4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:842,&quot;column&quot;:11}}">
            <span style={{ fontSize: 18, fontWeight: 700, color: ACCENT }} data-qoder-id="qel-span-13698da9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-13698da9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:843,&quot;column&quot;:13}}">¥{product.initialPrice + extraPrice}</span>
            {extraPrice > 0 && <span style={{ fontSize: 11, color: TEXT_TERTIARY }} data-qoder-id="qel-span-12698c16" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-12698c16&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:844,&quot;column&quot;:32}}">(含加价 ¥{extraPrice})</span>}
          </div>
        </div>
      </div>

      {/* 属性选择 */}
      {attrs.map(attr => (
        <div key={attr.attributeId} style={{ marginBottom: 18 }} data-qoder-id="qel-div-c5792873" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-c5792873&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:851,&quot;column&quot;:9}}">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }} data-qoder-id="qel-div-c47926e0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-c47926e0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:852,&quot;column&quot;:11}}">
            <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }} data-qoder-id="qel-span-0f6748c6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-0f6748c6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:853,&quot;column&quot;:13}}">{attr.attributeName}</span>
            {attr.multiSelect && <span style={{ fontSize: 10, color: TEXT_TERTIARY }} data-qoder-id="qel-span-10674a59" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-10674a59&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:854,&quot;column&quot;:34}}">(可多选)</span>}
            <span style={{ fontSize: 10, color: TEXT_TERTIARY, marginLeft: 'auto' }} data-qoder-id="qel-span-0d6745a0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-0d6745a0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:855,&quot;column&quot;:13}}">
              {attr.productSubAttrs.filter(sa => sa.selected).map(sa => sa.attributeName).join('、') || '请选择'}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }} data-qoder-id="qel-div-c676eb6f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-c676eb6f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:859,&quot;column&quot;:11}}">
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
                 data-qoder-id="qel-button-0540d6e2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-0540d6e2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:863,&quot;column&quot;:17}}">
                  {isSelected && <Check size={12}  data-qoder-id="qel-check-d9422c05" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-check-d9422c05&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;check&quot;,&quot;loc&quot;:{&quot;line&quot;:875,&quot;column&quot;:34}}"/>}
                  {sa.attributeName}
                  {sa.price > 0 && <span style={{ fontSize: 10, opacity: 0.75 }} data-qoder-id="qel-span-11674bec" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-11674bec&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:877,&quot;column&quot;:36}}">+¥{sa.price}</span>}
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
        }} data-qoder-id="qel-div-c276e523" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-c276e523&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:887,&quot;column&quot;:9}}">
          <AlertCircle size={13}  data-qoder-id="qel-alertcircle-dfdeb96a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-alertcircle-dfdeb96a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;alertcircle&quot;,&quot;loc&quot;:{&quot;line&quot;:892,&quot;column&quot;:11}}"/>
          过敏原：{product.allergens.join('、')}
        </div>
      )}

      {/* 备注栏 */}
      <div style={{ marginBottom: 16 }} data-qoder-id="qel-div-d076fb2d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-d076fb2d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:898,&quot;column&quot;:7}}">
        <div style={{ fontSize: 12, fontWeight: 500, color: TEXT_SECONDARY, marginBottom: 6 }} data-qoder-id="qel-div-d97dc51d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-d97dc51d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:899,&quot;column&quot;:9}}">备注</div>
        <input
          value={note || ''}
          onChange={e => onNoteChange(e.target.value)}
          placeholder="如：少冰、去冰、加糖..."
          style={{
            width: '100%', padding: '8px 12px', borderRadius: 8,
            border: `1px solid ${BORDER}`, fontSize: 12, color: TEXT_PRIMARY,
            outline: 'none', background: SURFACE, boxSizing: 'border-box',
          }}
         data-qoder-id="qel-input-117b412e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-117b412e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:900,&quot;column&quot;:9}}"/>
      </div>

      {/* 数量 + 加入购物车 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 0', borderTop: `1px solid ${BORDER}`,
        position: 'sticky', bottom: 0, background: '#fff',
      }} data-qoder-id="qel-div-d77dc1f7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-d77dc1f7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:913,&quot;column&quot;:7}}">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} data-qoder-id="qel-div-d67dc064" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-d67dc064&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:918,&quot;column&quot;:9}}">
          <button onClick={() => onAmountChange(-1)} style={{
            width: 30, height: 30, borderRadius: '50%', border: `1px solid ${BORDER}`,
            background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }} data-qoder-id="qel-button-8734d795" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-8734d795&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:919,&quot;column&quot;:11}}">
            <Minus size={14} color={TEXT_SECONDARY}  data-qoder-id="qel-minus-dbf5001a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-minus-dbf5001a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;minus&quot;,&quot;loc&quot;:{&quot;line&quot;:923,&quot;column&quot;:13}}"/>
          </button>
          <span style={{ fontSize: 16, fontWeight: 600, minWidth: 20, textAlign: 'center' }} data-qoder-id="qel-span-135a831f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-135a831f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:925,&quot;column&quot;:11}}">{amount}</span>
          <button onClick={() => onAmountChange(1)} style={{
            width: 30, height: 30, borderRadius: '50%', border: `1px solid ${BORDER}`,
            background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }} data-qoder-id="qel-button-8434d2dc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-8434d2dc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:926,&quot;column&quot;:11}}">
            <Plus size={14} color={TEXT_SECONDARY}  data-qoder-id="qel-plus-840c5899" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-plus-840c5899&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;plus&quot;,&quot;loc&quot;:{&quot;line&quot;:930,&quot;column&quot;:13}}"/>
          </button>
        </div>
        <button
          onClick={onAdd}
          style={{
            padding: '10px 28px', borderRadius: 20, border: 'none',
            background: ACCENT, color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}
         data-qoder-id="qel-button-8a34dc4e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-8a34dc4e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:933,&quot;column&quot;:9}}">
          <ShoppingBag size={16}  data-qoder-id="qel-shoppingbag-91af636c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-shoppingbag-91af636c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;shoppingbag&quot;,&quot;loc&quot;:{&quot;line&quot;:941,&quot;column&quot;:11}}"/>
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
    return <EmptyState text="购物车是空的" subtext="去选择饮品吧"  data-qoder-id="qel-emptystate-8a738f92" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-emptystate-8a738f92&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;emptystate&quot;,&quot;loc&quot;:{&quot;line&quot;:954,&quot;column&quot;:12}}"/>
  }

  return (
    <div style={{ padding: '12px 16px' }} data-qoder-id="qel-div-9b2a0ce3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9b2a0ce3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:958,&quot;column&quot;:5}}">
      {/* 头部：数量 + 清空 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }} data-qoder-id="qel-div-9a2a0b50" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9a2a0b50&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:960,&quot;column&quot;:7}}">
        <span style={{ fontSize: 12, color: TEXT_TERTIARY }} data-qoder-id="qel-span-963b8d61" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-963b8d61&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:961,&quot;column&quot;:9}}">{cartCount} 件商品</span>
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
         data-qoder-id="qel-button-63d3511a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-63d3511a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:962,&quot;column&quot;:9}}">
          <Trash2 size={11}  data-qoder-id="qel-trash2-a226b64f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-trash2-a226b64f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;trash2&quot;,&quot;loc&quot;:{&quot;line&quot;:973,&quot;column&quot;:11}}"/>
          清空购物车
        </button>
      </div>

      {cart.map(item => (
        <div key={item.id} style={{
          display: 'flex', gap: 10, padding: '12px 0',
          borderBottom: `1px solid ${BORDER}`,
        }} data-qoder-id="qel-div-9e2a119c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9e2a119c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:979,&quot;column&quot;:9}}">
          <div style={{
            width: 48, height: 48, borderRadius: 8, flexShrink: 0,
            background: ACCENT_BG, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }} data-qoder-id="qel-div-a52a1ca1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a52a1ca1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:983,&quot;column&quot;:11}}">
            {getProductEmoji('')}
          </div>
          <div style={{ flex: 1 }} data-qoder-id="qel-div-a42a1b0e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a42a1b0e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:990,&quot;column&quot;:11}}">
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 2 }} data-qoder-id="qel-div-a32c5812" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a32c5812&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:991,&quot;column&quot;:13}}">{item.productName}</div>
            <div style={{ fontSize: 11, color: TEXT_TERTIARY, marginBottom: 2 }} data-qoder-id="qel-div-a42c59a5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a42c59a5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:992,&quot;column&quot;:13}}">{item.additionDesc || '标准'}</div>
            {item.note && <div style={{ fontSize: 10, color: TEXT_TERTIARY, fontStyle: 'italic', marginBottom: 4 }} data-qoder-id="qel-div-a12c54ec" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a12c54ec&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:993,&quot;column&quot;:27}}">备注: {item.note}</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} data-qoder-id="qel-div-a22c567f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a22c567f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:994,&quot;column&quot;:13}}">
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }} data-qoder-id="qel-div-9f2c51c6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9f2c51c6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:995,&quot;column&quot;:15}}">
                <span style={{ fontSize: 14, fontWeight: 600, color: ACCENT }} data-qoder-id="qel-span-853db135" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-853db135&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:996,&quot;column&quot;:17}}">¥{item.totalPrice.toFixed(2)}</span>
                {item.amount > 1 && <span style={{ fontSize: 10, color: TEXT_TERTIARY }} data-qoder-id="qel-span-823dac7c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-823dac7c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:997,&quot;column&quot;:37}}">(¥{item.unitPrice}x{item.amount})</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} data-qoder-id="qel-div-9e2c5033" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9e2c5033&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:999,&quot;column&quot;:15}}">
                <button onClick={() => onRemove(item.id)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex',
                }} data-qoder-id="qel-button-5ed587d2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-5ed587d2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:1000,&quot;column&quot;:17}}">
                  <Trash2 size={14} color={TEXT_TERTIARY}  data-qoder-id="qel-trash2-af29095d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-trash2-af29095d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;trash2&quot;,&quot;loc&quot;:{&quot;line&quot;:1003,&quot;column&quot;:19}}"/>
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} data-qoder-id="qel-div-a92ea01b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a92ea01b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1005,&quot;column&quot;:17}}">
                  <button onClick={() => onUpdateAmount(item.id, -1)} style={{
                    width: 22, height: 22, borderRadius: '50%', border: `1px solid ${BORDER}`,
                    background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }} data-qoder-id="qel-button-4bd7a880" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-4bd7a880&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:1006,&quot;column&quot;:19}}">
                    <Minus size={11}  data-qoder-id="qel-minus-5215b165" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-minus-5215b165&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;minus&quot;,&quot;loc&quot;:{&quot;line&quot;:1010,&quot;column&quot;:21}}"/>
                  </button>
                  <span style={{ fontSize: 13, fontWeight: 600, minWidth: 16, textAlign: 'center' }} data-qoder-id="qel-span-873ff2f2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-873ff2f2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1012,&quot;column&quot;:19}}">{item.amount}</span>
                  <button onClick={() => onUpdateAmount(item.id, 1)} style={{
                    width: 22, height: 22, borderRadius: '50%', border: `1px solid ${BORDER}`,
                    background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }} data-qoder-id="qel-button-50d7b05f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-50d7b05f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:1013,&quot;column&quot;:19}}">
                    <Plus size={11}  data-qoder-id="qel-plus-60034434" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-plus-60034434&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;plus&quot;,&quot;loc&quot;:{&quot;line&quot;:1017,&quot;column&quot;:21}}"/>
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
      }} data-qoder-id="qel-div-af2ea98d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-af2ea98d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1027,&quot;column&quot;:7}}">
        <div data-qoder-id="qel-div-ae2ea7fa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-ae2ea7fa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1031,&quot;column&quot;:9}}">
          <span style={{ fontSize: 12, color: TEXT_TERTIARY }} data-qoder-id="qel-span-8e3ffdf7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-8e3ffdf7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1032,&quot;column&quot;:11}}">合计</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: ACCENT, marginLeft: 6 }} data-qoder-id="qel-span-8d3ffc64" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-8d3ffc64&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1033,&quot;column&quot;:11}}">¥{cartTotal.toFixed(2)}</span>
        </div>
        <button
          onClick={onCheckout}
          style={{
            padding: '10px 32px', borderRadius: 20, border: 'none',
            background: ACCENT, color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: 'pointer',
          }}
         data-qoder-id="qel-button-62c68394" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-62c68394&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:1035,&quot;column&quot;:9}}">
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
    <div style={{ padding: '16px', ...qoderProps?.style }} className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* 门店信息 */}
      <div style={{ padding: '12px', borderRadius: 10, background: ACCENT_BG, marginBottom: 16 }} data-qoder-id="qel-div-e2372f4d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-e2372f4d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1059,&quot;column&quot;:7}}">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }} data-qoder-id="qel-div-e1372dba" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-e1372dba&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1060,&quot;column&quot;:9}}">
          <MapPin size={14} color={ACCENT}  data-qoder-id="qel-mappin-c685ec95" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mappin-c685ec95&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;mappin&quot;,&quot;loc&quot;:{&quot;line&quot;:1061,&quot;column&quot;:11}}"/>
          <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }} data-qoder-id="qel-span-5560696c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-5560696c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1062,&quot;column&quot;:11}}">{preview.storeInfo?.storeName}</span>
        </div>
        <div style={{ fontSize: 11, color: TEXT_SECONDARY, marginLeft: 20 }} data-qoder-id="qel-div-de372901" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-de372901&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1064,&quot;column&quot;:9}}">{preview.storeInfo?.address}</div>
        <div style={{ display: 'flex', gap: 12, marginTop: 6, marginLeft: 20, fontSize: 11, color: TEXT_TERTIARY }} data-qoder-id="qel-div-dd37276e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-dd37276e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1065,&quot;column&quot;:9}}">
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }} data-qoder-id="qel-span-5a60714b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-5a60714b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1066,&quot;column&quot;:11}}">
            <Package size={11}  data-qoder-id="qel-package-776e8a28" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-package-776e8a28&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;package&quot;,&quot;loc&quot;:{&quot;line&quot;:1067,&quot;column&quot;:13}}"/>
            自取
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }} data-qoder-id="qel-span-ec5d858a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-ec5d858a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1070,&quot;column&quot;:11}}">
            <Timer size={11}  data-qoder-id="qel-timer-da2a5ead" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-timer-da2a5ead&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;timer&quot;,&quot;loc&quot;:{&quot;line&quot;:1071,&quot;column&quot;:13}}"/>
            预计{waitMin > 0 ? `${waitMin}分钟` : '15分钟'}后取餐
          </span>
        </div>
      </div>

      {/* 商品明细 */}
      <div style={{ marginBottom: 16 }} data-qoder-id="qel-div-d834e0f8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-d834e0f8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1078,&quot;column&quot;:7}}">
        <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 8 }} data-qoder-id="qel-div-d934e28b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-d934e28b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1079,&quot;column&quot;:9}}">商品明细</div>
        {preview.productInfoList?.map((item, idx) => (
          <div key={idx} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 0', borderBottom: `1px solid ${BORDER}`,
          }} data-qoder-id="qel-div-de34ea6a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-de34ea6a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1081,&quot;column&quot;:11}}">
            <div data-qoder-id="qel-div-df34ebfd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-df34ebfd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1085,&quot;column&quot;:13}}">
              <span style={{ fontSize: 13, color: TEXT_PRIMARY }} data-qoder-id="qel-span-e65d7c18" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-e65d7c18&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1086,&quot;column&quot;:15}}">{item.name}</span>
              {item.additionDesc && <span style={{ fontSize: 11, color: TEXT_TERTIARY, marginLeft: 6 }} data-qoder-id="qel-span-e75d7dab" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-e75d7dab&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1087,&quot;column&quot;:37}}">({item.additionDesc})</span>}
              <span style={{ fontSize: 11, color: TEXT_TERTIARY, marginLeft: 6 }} data-qoder-id="qel-span-e45d78f2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-e45d78f2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1088,&quot;column&quot;:15}}">x{item.amount}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: TEXT_PRIMARY }} data-qoder-id="qel-span-e55d7a85" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-e55d7a85&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1090,&quot;column&quot;:13}}">¥{item.estimateTotalPrice?.toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* 价格明细 */}
      <div style={{ padding: '12px', borderRadius: 8, background: SURFACE, marginBottom: 16 }} data-qoder-id="qel-div-4ebaf16a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-4ebaf16a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1096,&quot;column&quot;:7}}">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }} data-qoder-id="qel-div-4fbaf2fd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-4fbaf2fd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1097,&quot;column&quot;:9}}">
          <span style={{ fontSize: 12, color: TEXT_SECONDARY }} data-qoder-id="qel-span-c0215b50" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-c0215b50&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1098,&quot;column&quot;:11}}">商品总价</span>
          <span style={{ fontSize: 12, color: TEXT_PRIMARY }} data-qoder-id="qel-span-c1215ce3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-c1215ce3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1099,&quot;column&quot;:11}}">¥{preview.totalInitialPrice?.toFixed(2)}</span>
        </div>
        {preview.privilegeMoney > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }} data-qoder-id="qel-div-4abaeb1e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-4abaeb1e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1102,&quot;column&quot;:11}}">
            <span style={{ fontSize: 12, color: TEXT_SECONDARY }} data-qoder-id="qel-span-c7216655" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-c7216655&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1103,&quot;column&quot;:13}}">优惠</span>
            <span style={{ fontSize: 12, color: '#e74c3c' }} data-qoder-id="qel-span-c421619c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-c421619c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1104,&quot;column&quot;:13}}">-¥{preview.privilegeMoney?.toFixed(2)}</span>
          </div>
        )}
        {preview.deliveryFee > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }} data-qoder-id="qel-div-49bae98b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-49bae98b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1108,&quot;column&quot;:11}}">
            <span style={{ fontSize: 12, color: TEXT_SECONDARY }} data-qoder-id="qel-span-ca216b0e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-ca216b0e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1109,&quot;column&quot;:13}}">配送费</span>
            <span style={{ fontSize: 12, color: TEXT_PRIMARY }} data-qoder-id="qel-span-cb216ca1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-cb216ca1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1110,&quot;column&quot;:13}}">¥{preview.deliveryFee?.toFixed(2)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: `1px dashed ${BORDER}` }} data-qoder-id="qel-div-34bd0713" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-34bd0713&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1113,&quot;column&quot;:9}}">
          <span style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }} data-qoder-id="qel-span-c723a4ec" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-c723a4ec&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1114,&quot;column&quot;:11}}">实付金额</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: ACCENT }} data-qoder-id="qel-span-ca23a9a5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-ca23a9a5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1115,&quot;column&quot;:11}}">¥{preview.discountPrice?.toFixed(2)}</span>
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
       data-qoder-id="qel-button-48ea89d2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-48ea89d2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:1120,&quot;column&quot;:7}}">
        <CreditCard size={16}  data-qoder-id="qel-creditcard-41f795a9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-creditcard-41f795a9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;creditcard&quot;,&quot;loc&quot;:{&quot;line&quot;:1130,&quot;column&quot;:9}}"/>
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
    <div style={{ padding: '20px 16px', ...qoderProps?.style }} className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* 状态卡片 */}
      <div style={{ textAlign: 'center', padding: '20px 0', marginBottom: 20, borderBottom: `1px solid ${BORDER}` }} data-qoder-id="qel-div-503b35d8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-503b35d8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1161,&quot;column&quot;:7}}">
        <div style={{ fontSize: 36, marginBottom: 8 }} data-qoder-id="qel-div-513b376b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-513b376b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1162,&quot;column&quot;:9}}">
          {isCancelled ? '❌' : (ORDER_TIMELINE.find(t => t.status === order.orderStatus)?.icon || '📋')}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: isCancelled ? '#e74c3c' : ACCENT, marginBottom: 4 }} data-qoder-id="qel-div-4e3b32b2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-4e3b32b2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1165,&quot;column&quot;:9}}">
          {order.orderStatusName}
        </div>
        {order.takeMealCodeInfo?.code && order.takeMealCodeInfo.code !== '生成中' && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 20px', borderRadius: 12, background: ACCENT_BG,
            marginTop: 8,
          }} data-qoder-id="qel-div-4f3b3445" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-4f3b3445&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1169,&quot;column&quot;:11}}">
            <span style={{ fontSize: 12, color: TEXT_SECONDARY }} data-qoder-id="qel-span-fdcd7cc5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-fdcd7cc5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1174,&quot;column&quot;:13}}">取餐码</span>
            <span style={{ fontSize: 24, fontWeight: 800, color: ACCENT }} data-qoder-id="qel-span-fccd7b32" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-fccd7b32&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1175,&quot;column&quot;:13}}">{order.takeMealCodeInfo.code}</span>
          </div>
        )}
        {order.takeMealCodeInfo?.shelfNo && (
          <div style={{ fontSize: 12, color: TEXT_TERTIARY, marginTop: 4 }} data-qoder-id="qel-div-4e38f41b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-4e38f41b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1179,&quot;column&quot;:11}}">{order.takeMealCodeInfo.shelfNo}</div>
        )}
      </div>

      {/* 进度时间线 */}
      {!isCancelled && (
        <div style={{ marginBottom: 20, padding: '0 8px' }} data-qoder-id="qel-div-4d38f288" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-4d38f288&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1185,&quot;column&quot;:9}}">
          <div style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 12 }} data-qoder-id="qel-div-5438fd8d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-5438fd8d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1186,&quot;column&quot;:11}}">订单进度</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }} data-qoder-id="qel-div-5338fbfa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-5338fbfa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1187,&quot;column&quot;:11}}">
            {ORDER_TIMELINE.map((step, idx) => {
              const isPast = order.orderStatus >= step.status && currentStepIndex >= idx
              const isCurrent = order.orderStatus === step.status
              const isFuture = !isPast
              return (
                <div key={step.status} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }} data-qoder-id="qel-div-5238fa67" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-5238fa67&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1193,&quot;column&quot;:17}}">
                  {/* 时间线指示器 */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20, flexShrink: 0 }} data-qoder-id="qel-div-5138f8d4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-5138f8d4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1195,&quot;column&quot;:19}}">
                    <div style={{
                      width: isCurrent ? 12 : 8, height: isCurrent ? 12 : 8,
                      borderRadius: '50%',
                      background: isPast ? ACCENT : isCurrent ? ACCENT : '#ddd',
                      border: isCurrent ? `2px solid ${ACCENT}` : 'none',
                      boxShadow: isCurrent ? `0 0 0 3px ${ACCENT_BG}` : 'none',
                      transition: 'all 0.3s',
                    }}  data-qoder-id="qel-div-4838eaa9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-4838eaa9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1196,&quot;column&quot;:21}}"/>
                    {idx < ORDER_TIMELINE.length - 1 && (
                      <div style={{
                        width: 2, height: 24,
                        background: isPast && order.orderStatus >= ORDER_TIMELINE[idx + 1]?.status ? ACCENT : '#e0e0e0',
                      }}  data-qoder-id="qel-div-4738e916" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-4738e916&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1205,&quot;column&quot;:23}}"/>
                    )}
                  </div>
                  {/* 标签 */}
                  <div style={{ paddingBottom: idx < ORDER_TIMELINE.length - 1 ? 8 : 0 }} data-qoder-id="qel-div-4a36af38" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-4a36af38&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1212,&quot;column&quot;:19}}">
                    <span style={{
                      fontSize: 12, fontWeight: isCurrent ? 600 : 400,
                      color: isPast ? TEXT_PRIMARY : isCurrent ? ACCENT : TEXT_TERTIARY,
                    }} data-qoder-id="qel-span-f8cb364f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-f8cb364f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1213,&quot;column&quot;:21}}">{step.label}</span>
                    {isCurrent && <span style={{ fontSize: 10, color: TEXT_TERTIARY, marginLeft: 6 }} data-qoder-id="qel-span-f9cb37e2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-f9cb37e2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1217,&quot;column&quot;:35}}">当前</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 门店信息 */}
      <div style={{ padding: '12px', borderRadius: 10, background: SURFACE, marginBottom: 16 }} data-qoder-id="qel-div-4d36b3f1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-4d36b3f1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1227,&quot;column&quot;:7}}">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }} data-qoder-id="qel-div-4e36b584" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-4e36b584&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1228,&quot;column&quot;:9}}">
          <MapPin size={13} color={TEXT_SECONDARY}  data-qoder-id="qel-mappin-8c3e4b91" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mappin-8c3e4b91&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;mappin&quot;,&quot;loc&quot;:{&quot;line&quot;:1229,&quot;column&quot;:11}}"/>
          <span style={{ fontSize: 13, fontWeight: 500, color: TEXT_PRIMARY }} data-qoder-id="qel-span-f5cb3196" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-f5cb3196&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1230,&quot;column&quot;:11}}">{order.storeInfo?.storeName}</span>
        </div>
        <div style={{ fontSize: 11, color: TEXT_TERTIARY, marginLeft: 19 }} data-qoder-id="qel-div-5136ba3d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-5136ba3d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1232,&quot;column&quot;:9}}">{order.storeInfo?.address}</div>
      </div>

      {/* 商品列表 */}
      <div style={{ marginBottom: 16 }} data-qoder-id="qel-div-4236a2a0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-4236a2a0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1236,&quot;column&quot;:7}}">
        <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 8 }} data-qoder-id="qel-div-4336a433" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-4336a433&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1237,&quot;column&quot;:9}}">订单商品</div>
        {order.productInfoList?.map((item, idx) => (
          <div key={idx} style={{
            display: 'flex', justifyContent: 'space-between', padding: '6px 0',
            fontSize: 12, color: TEXT_SECONDARY,
          }} data-qoder-id="qel-div-54480817" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-54480817&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1239,&quot;column&quot;:11}}">
            <span data-qoder-id="qel-span-f0c8eb20" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-f0c8eb20&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1243,&quot;column&quot;:13}}">{item.name} {item.additionDesc && `(${item.additionDesc})`} x{item.amount}</span>
            <span data-qoder-id="qel-span-f3c8efd9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-f3c8efd9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1244,&quot;column&quot;:13}}">¥{item.estimateTotalPrice?.toFixed(2) || item.estimatePrice?.toFixed(2)}</span>
          </div>
        ))}
        {order.orderCommodityList?.map((item, idx) => (
          !order.productInfoList && (
            <div key={idx} style={{
              display: 'flex', justifyContent: 'space-between', padding: '6px 0',
              fontSize: 12, color: TEXT_SECONDARY,
            }} data-qoder-id="qel-div-554809aa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-554809aa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1249,&quot;column&quot;:13}}">
              <span data-qoder-id="qel-span-f5c8f2ff" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-f5c8f2ff&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1253,&quot;column&quot;:15}}">{item.commodityName} x1</span>
              <span data-qoder-id="qel-span-f4c8f16c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-f4c8f16c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1254,&quot;column&quot;:15}}">¥{item.payMoney?.toFixed(2)}</span>
            </div>
          )
        ))}
        <div style={{
          display: 'flex', justifyContent: 'space-between', paddingTop: 8, marginTop: 4,
          borderTop: `1px dashed ${BORDER}`, fontSize: 14, fontWeight: 600,
        }} data-qoder-id="qel-div-524804f1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-524804f1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1258,&quot;column&quot;:9}}">
          <span style={{ color: TEXT_PRIMARY }} data-qoder-id="qel-span-f6c8f492" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-f6c8f492&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1262,&quot;column&quot;:11}}">实付金额</span>
          <span style={{ color: ACCENT }} data-qoder-id="qel-span-f9c8f94b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-f9c8f94b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1263,&quot;column&quot;:11}}">¥{order.orderPayAmount?.toFixed(2)}</span>
        </div>
      </div>

      {order.remark && (
        <div style={{ padding: '8px 12px', borderRadius: 8, background: '#fff8e1', fontSize: 11, color: '#f57f17', marginBottom: 16 }} data-qoder-id="qel-div-4b47f9ec" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-4b47f9ec&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1268,&quot;column&quot;:9}}">
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
         data-qoder-id="qel-button-48d31e86" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-48d31e86&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:1275,&quot;column&quot;:9}}">
          {loading ? '处理中...' : '取消订单'}
        </button>
      )}

      {/* 已完成/已取消提示 */}
      {(isCompleted || isCancelled) && (
        <div style={{
          textAlign: 'center', padding: '12px', borderRadius: 10,
          background: ACCENT_BG, fontSize: 12, color: TEXT_TERTIARY,
        }} data-qoder-id="qel-div-4f45c1a1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-4f45c1a1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1291,&quot;column&quot;:9}}">
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8, ...qoderProps?.style }} className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <div style={{
        width: 20, height: 20, border: `2px solid ${ACCENT}`,
        borderTopColor: 'transparent', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}  data-qoder-id="qel-div-edee4987" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-edee4987&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;LoadingIndicator&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1318,&quot;column&quot;:7}}"/>
      <span style={{ fontSize: 13, color: TEXT_TERTIARY }} data-qoder-id="qel-span-718c20f2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-718c20f2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;LoadingIndicator&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1323,&quot;column&quot;:7}}">{text || '加载中...'}</span>
      <style data-qoder-id="qel-style-ae3eafbd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-style-ae3eafbd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;LoadingIndicator&quot;,&quot;elementRole&quot;:&quot;style&quot;,&quot;loc&quot;:{&quot;line&quot;:1324,&quot;column&quot;:7}}">{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function EmptyState({ text, subtext, ...qoderProps }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', ...qoderProps?.style }} className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <div style={{ fontSize: 36, marginBottom: 8 }} data-qoder-id="qel-div-3e04841c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-3e04841c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;EmptyState&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1332,&quot;column&quot;:7}}">🧋</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: TEXT_PRIMARY, marginBottom: 4 }} data-qoder-id="qel-div-45048f21" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-45048f21&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;EmptyState&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1333,&quot;column&quot;:7}}">{text}</div>
      {subtext && <div style={{ fontSize: 12, color: TEXT_TERTIARY }} data-qoder-id="qel-div-44048d8e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-44048d8e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;EmptyState&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1334,&quot;column&quot;:19}}">{subtext}</div>}
    </div>
  )
}
