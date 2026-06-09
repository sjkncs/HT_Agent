/**
 * 喜茶自助点单面板
 * 
 * 完整点单流程 UI：门店选择 → 商品浏览 → 定制 → 购物车 → 预览 → 下单 → 追踪
 * 喜茶品牌绿色调，与 ChatInterface 视觉一致
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Search, MapPin, ShoppingBag, X, Plus, Minus, Trash2,
  ChevronRight, ChevronLeft, Check, Clock, Phone, Star,
  CreditCard, ArrowLeft, Tag, AlertCircle, Coffee,
  Navigation, SlidersHorizontal, LocateFixed,
} from 'lucide-react'
import {
  queryStoreList, searchProduct, customizeProduct,
  queryProductDetail, previewOrder, createOrder,
  queryOrderDetail, cancelOrder,
} from '../../lib/mcp-client.js'
// Mock 数据导入会自动注册 mockHandler
import '../../lib/heytea-mock-data.js'

// ─── 样式常量 ───
const BRAND_GREEN = '#5a8f29'
const BRAND_GREEN_LIGHT = '#7ab340'
const BRAND_GREEN_BG = '#f0f7e8'
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
  const [customizing, setCustomizing] = useState(null) // { product, attrs, amount }
  const [cart, setCart] = useState([]) // [{ product, attrs, amount, price }]
  const [orderPreview, setOrderPreview] = useState(null)
  const [currentOrder, setCurrentOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const searchInputRef = useRef(null)

  // ─── 加载门店 ───
  useEffect(() => {
    loadStores()
  }, [])

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
    } catch (e) {
      // keep current products
    }
    setLoading(false)
  }

  // ─── 商品分类 ───
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category))
    return ['全部', ...cats]
  }, [products])

  const filteredProducts = useMemo(() => {
    if (selectedCategory === '全部') return products
    return products.filter(p => p.category === selectedCategory)
  }, [products, selectedCategory])

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
    // 计算加价
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
    const { product, attrs, amount, extraPrice } = customizing
    const unitPrice = product.initialPrice + extraPrice
    // 构造描述文本
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
    }

    setCart(prev => [...prev, cartItem])
    setCustomizing(null)
    setStep(STEPS.BROWSE)
  }

  // ─── 购物车操作 ───
  function removeFromCart(itemId) {
    setCart(prev => prev.filter(c => c.id !== itemId))
  }

  function updateCartAmount(itemId, delta) {
    setCart(prev => prev.map(c => {
      if (c.id !== itemId) return c
      const newAmount = Math.max(1, c.amount + delta)
      return { ...c, amount: newAmount, totalPrice: c.unitPrice * newAmount }
    }))
  }

  const cartTotal = useMemo(() => cart.reduce((sum, c) => sum + c.totalPrice, 0), [cart])
  const cartCount = useMemo(() => cart.reduce((sum, c) => sum + c.amount, 0), [cart])

  // ─── 预览订单 ───
  async function handlePreview() {
    if (!selectedStore || !cart.length) return
    setLoading(true)
    setStep(STEPS.PREVIEW)
    try {
      const productList = cart.map(c => ({
        amount: c.amount,
        productId: c.productId,
        skuCode: c.skuCode,
      }))
      const result = await previewOrder({
        storeId: selectedStore.storeId,
        productList,
        pickupType: 'self_pickup',
      })
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
      const productList = cart.map(c => ({
        amount: c.amount,
        productId: c.productId,
        skuCode: c.skuCode,
      }))
      const result = await createOrder({
        storeId: selectedStore.storeId,
        productList,
        longitude: DEFAULT_LOCATION.longitude,
        latitude: DEFAULT_LOCATION.latitude,
        pickupType: 'self_pickup',
      })
      const orderId = result.data.orderIdStr
      // 查询订单详情
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
    } catch (e) {
      setError('取消订单失败：' + e.message)
    }
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
    <div style={{ ...(panelStyle), ...(qoderProps?.style) }} className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* ─── 顶部导航栏 ─── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: `1px solid ${BORDER}`,
        background: BRAND_GREEN, color: '#fff',
      }} data-qoder-id="qel-div-931da3b8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-931da3b8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:304,&quot;column&quot;:7}}">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} data-qoder-id="qel-div-941da54b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-941da54b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:309,&quot;column&quot;:9}}">
          {step !== STEPS.STORE && (
            <button onClick={goBack} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4, display: 'flex' }} data-qoder-id="qel-button-fd9cce66" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-fd9cce66&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:311,&quot;column&quot;:13}}">
              <ArrowLeft size={18}  data-qoder-id="qel-arrowleft-414c6609" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-arrowleft-414c6609&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;arrowleft&quot;,&quot;loc&quot;:{&quot;line&quot;:312,&quot;column&quot;:15}}"/>
            </button>
          )}
          <span style={{ fontSize: 15, fontWeight: 600 }} data-qoder-id="qel-span-93119570" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-93119570&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:315,&quot;column&quot;:11}}">
            {step === STEPS.STORE && '选择门店'}
            {step === STEPS.BROWSE && (selectedStore?.storeName || '商品浏览')}
            {step === STEPS.CUSTOMIZE && '定制饮品'}
            {step === STEPS.CART && '购物车'}
            {step === STEPS.PREVIEW && '订单预览'}
            {step === STEPS.ORDERING && '下单中...'}
            {step === STEPS.TRACKING && '订单追踪'}
          </span>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4, display: 'flex' }} data-qoder-id="qel-button-fc9cccd3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-fc9cccd3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:326,&quot;column&quot;:11}}">
            <X size={18}  data-qoder-id="qel-x-a380b71a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-x-a380b71a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;x&quot;,&quot;loc&quot;:{&quot;line&quot;:327,&quot;column&quot;:13}}"/>
          </button>
        )}
      </div>

      {/* ─── 错误提示 ─── */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#fff3f0', borderBottom: `1px solid #ffd8d2` }} data-qoder-id="qel-div-8e1d9bd9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-8e1d9bd9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:334,&quot;column&quot;:9}}">
          <AlertCircle size={14} color="#e74c3c"  data-qoder-id="qel-alertcircle-63d76863" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-alertcircle-63d76863&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;alertcircle&quot;,&quot;loc&quot;:{&quot;line&quot;:335,&quot;column&quot;:11}}"/>
          <span style={{ fontSize: 12, color: '#e74c3c', flex: 1 }} data-qoder-id="qel-span-cdbf4b0c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-cdbf4b0c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:336,&quot;column&quot;:11}}">{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }} data-qoder-id="qel-button-93e59d55" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-93e59d55&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:337,&quot;column&quot;:11}}">
            <X size={12}  data-qoder-id="qel-x-848effd2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-x-848effd2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;x&quot;,&quot;loc&quot;:{&quot;line&quot;:338,&quot;column&quot;:13}}"/>
          </button>
        </div>
      )}

      {/* ─── 主内容区 ─── */}
      <div style={{ flex: 1, overflow: 'auto', padding: 0 }} data-qoder-id="qel-div-95afe49f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-95afe49f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:344,&quot;column&quot;:7}}">
        {step === STEPS.STORE && <StoreList stores={stores} loading={loading} onSelect={selectStore}  data-qoder-id="qel-storelist-fe53a2b0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-storelist-fe53a2b0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;storelist&quot;,&quot;loc&quot;:{&quot;line&quot;:345,&quot;column&quot;:34}}"/>}
        {step === STEPS.BROWSE && (
          <ProductBrowse
            products={filteredProducts}
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onSearch={handleSearch}
            searchInputRef={searchInputRef}
            loading={loading}
            onSelect={openCustomize}
           data-qoder-id="qel-productbrowse-c27e75f5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-productbrowse-c27e75f5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;productbrowse&quot;,&quot;loc&quot;:{&quot;line&quot;:347,&quot;column&quot;:11}}"/>
        )}
        {step === STEPS.CUSTOMIZE && customizing && (
          <ProductCustomize
            item={customizing}
            onToggle={toggleAttr}
            onAmountChange={(delta) => setCustomizing(prev => ({ ...prev, amount: Math.max(1, prev.amount + delta) }))}
            onAdd={addToCart}
           data-qoder-id="qel-productcustomize-d781308a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-productcustomize-d781308a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;productcustomize&quot;,&quot;loc&quot;:{&quot;line&quot;:360,&quot;column&quot;:11}}"/>
        )}
        {step === STEPS.CART && (
          <CartView
            cart={cart}
            cartTotal={cartTotal}
            onRemove={removeFromCart}
            onUpdateAmount={updateCartAmount}
            onCheckout={handlePreview}
           data-qoder-id="qel-cartview-81d8883d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-cartview-81d8883d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;cartview&quot;,&quot;loc&quot;:{&quot;line&quot;:368,&quot;column&quot;:11}}"/>
        )}
        {step === STEPS.PREVIEW && orderPreview && (
          <OrderPreview
            preview={orderPreview}
            store={selectedStore}
            onCreateOrder={handleCreateOrder}
            loading={loading}
           data-qoder-id="qel-orderpreview-9f3ab404" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-orderpreview-9f3ab404&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;orderpreview&quot;,&quot;loc&quot;:{&quot;line&quot;:377,&quot;column&quot;:11}}"/>
        )}
        {step === STEPS.ORDERING && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }} data-qoder-id="qel-div-1fa86f18" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-1fa86f18&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:385,&quot;column&quot;:11}}">
            <div style={{ width: 36, height: 36, border: `3px solid ${BRAND_GREEN}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}  data-qoder-id="qel-div-20a870ab" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-20a870ab&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:386,&quot;column&quot;:13}}"/>
            <span style={{ fontSize: 14, color: TEXT_SECONDARY }} data-qoder-id="qel-span-5eb7e08a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-5eb7e08a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:387,&quot;column&quot;:13}}">正在创建订单...</span>
            <style data-qoder-id="qel-style-37a89605" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-style-37a89605&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;style&quot;,&quot;loc&quot;:{&quot;line&quot;:388,&quot;column&quot;:13}}">{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}
        {step === STEPS.TRACKING && currentOrder && (
          <OrderTracking order={currentOrder} onCancel={handleCancelOrder} loading={loading}  data-qoder-id="qel-ordertracking-4aa9cf74" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-ordertracking-4aa9cf74&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;ordertracking&quot;,&quot;loc&quot;:{&quot;line&quot;:392,&quot;column&quot;:11}}"/>
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
         data-qoder-id="qel-div-24a876f7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-24a876f7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:398,&quot;column&quot;:9}}">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} data-qoder-id="qel-div-25a8788a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-25a8788a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:406,&quot;column&quot;:11}}">
            <div style={{ position: 'relative' }} data-qoder-id="qel-div-26a87a1d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-26a87a1d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:407,&quot;column&quot;:13}}">
              <ShoppingBag size={22} color={BRAND_GREEN}  data-qoder-id="qel-shoppingbag-2f4e8378" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-shoppingbag-2f4e8378&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;shoppingbag&quot;,&quot;loc&quot;:{&quot;line&quot;:408,&quot;column&quot;:15}}"/>
              <span style={{
                position: 'absolute', top: -6, right: -8,
                background: '#e74c3c', color: '#fff', borderRadius: '50%',
                width: 16, height: 16, fontSize: 10, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }} data-qoder-id="qel-span-55b7d25f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-55b7d25f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:409,&quot;column&quot;:15}}">{cartCount}</span>
            </div>
            <span style={{ fontSize: 13, color: TEXT_PRIMARY, fontWeight: 500 }} data-qoder-id="qel-span-e2baeeed" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-e2baeeed&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:416,&quot;column&quot;:13}}">查看购物车</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} data-qoder-id="qel-div-a4ab7f0e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a4ab7f0e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:418,&quot;column&quot;:11}}">
            <span style={{ fontSize: 16, fontWeight: 700, color: BRAND_GREEN }} data-qoder-id="qel-span-e0baebc7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-e0baebc7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:419,&quot;column&quot;:13}}">¥{cartTotal.toFixed(2)}</span>
            <ChevronRight size={16} color={TEXT_TERTIARY}  data-qoder-id="qel-chevronright-b8e83a4a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-chevronright-b8e83a4a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderingPanel&quot;,&quot;elementRole&quot;:&quot;chevronright&quot;,&quot;loc&quot;:{&quot;line&quot;:420,&quot;column&quot;:13}}"/>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── 门店列表（增强版：定位+筛选+排序+状态） ───
const STORE_STATUS_MAP = {
  1: { label: '营业中', color: BRAND_GREEN, bg: BRAND_GREEN_BG },
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

  // 模拟重新定位
  function handleRelocate() {
    setLocating(true)
    setTimeout(() => {
      const areas = ['深圳南山 · 万象天地', '深圳福田 · 会展中心', '深圳罗湖 · 东门步行街', '深圳宝安 · 前海壹方城']
      setUserLocation(areas[Math.floor(Math.random() * areas.length)])
      setLocating(false)
    }, 800)
  }

  // 多维筛选 + 排序
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
    if (tagFilter) {
      result = result.filter(s => s.storeTags?.includes(tagFilter))
    }
    if (statusFilter) {
      result = result.filter(s => s.businessStatus === statusFilter)
    }
    if (maxDistance < Infinity) {
      result = result.filter(s => s.distance <= maxDistance)
    }
    // 排序
    if (sortBy === 'distance') {
      result.sort((a, b) => a.distance - b.distance)
    } else if (sortBy === 'status') {
      result.sort((a, b) => (b.businessStatus === 1 ? 1 : 0) - (a.businessStatus === 1 ? 1 : 0) || a.distance - b.distance)
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.storeName.localeCompare(b.storeName, 'zh-CN'))
    }
    return result
  }, [stores, search, tagFilter, statusFilter, maxDistance, sortBy])

  // 活跃筛选数量
  const activeFilterCount = [tagFilter, statusFilter, maxDistance < Infinity].filter(Boolean).length

  return (
    <div style={{ padding: '0' }}>
      {/* 定位栏 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 16px', background: BRAND_GREEN_BG,
        borderBottom: `1px solid ${BORDER}`,
      }}>
        <MapPin size={14} color={BRAND_GREEN} />
        <span style={{ fontSize: 12, color: BRAND_GREEN, fontWeight: 500, flex: 1 }}>
          {locating ? '定位中...' : userLocation}
        </span>
        <button
          onClick={handleRelocate}
          style={{
            display: 'flex', alignItems: 'center', gap: 3,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 11, color: BRAND_GREEN, padding: '2px 6px',
            borderRadius: 4, transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(90,143,41,0.12)'}
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
      <div style={{
        display: 'flex', gap: 6, padding: '0 16px 8px',
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        <button
          onClick={() => setTagFilter('')}
          style={{
            padding: '3px 10px', borderRadius: 14, border: 'none',
            fontSize: 11, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
            background: !tagFilter ? BRAND_GREEN : '#f5f5f5',
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
              background: tagFilter === tag ? BRAND_GREEN : '#f5f5f5',
              color: tagFilter === tag ? '#fff' : TEXT_SECONDARY,
            }}
          >{tag}</button>
        ))}
      </div>

      {/* 状态 + 距离 + 排序 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4, padding: '0 16px 8px',
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {/* 营业状态 */}
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
        {/* 距离范围 */}
        {DISTANCE_OPTIONS.map(d => {
          const isActive = maxDistance === d.value
          return (
            <button
              key={d.label}
              onClick={() => setMaxDistance(isActive ? Infinity : d.value)}
              style={{
                padding: '2px 8px', borderRadius: 10, border: 'none',
                fontSize: 10, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
                background: isActive ? BRAND_GREEN : '#f5f5f5',
                color: isActive ? '#fff' : TEXT_TERTIARY,
              }}
            >{d.label}</button>
          )
        })}
        <span style={{ color: BORDER, fontSize: 10 }}>|</span>
        {/* 排序 */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{
            padding: '2px 6px', borderRadius: 6, border: `1px solid ${BORDER}`,
            fontSize: 10, color: TEXT_SECONDARY, background: '#fff', cursor: 'pointer',
            outline: 'none',
          }}
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
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
              style={{ fontSize: 11, color: BRAND_GREEN, background: 'none', border: 'none', cursor: 'pointer' }}
            >清除筛选</button>
          )}
        </div>
      )}

      {/* 门店列表 */}
      <div style={{ padding: '0 16px' }}>
        {loading && <LoadingIndicator text="加载门店中..." />}
        {!loading && filtered.length === 0 && (
          <EmptyState text="未找到匹配门店" subtext="请调整筛选条件或搜索其他关键词" />
        )}
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
              onMouseEnter={e => { if (store.businessStatus !== 2) e.currentTarget.style.background = BRAND_GREEN_BG }}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* 第一行：店名 + 状态 + 距离 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>{store.storeName}</span>
                    <span style={{
                      fontSize: 9, padding: '1px 5px', borderRadius: 3,
                      background: status.bg, color: status.color, fontWeight: 500,
                    }}>{status.label}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: BRAND_GREEN }}>{store.distance}km</div>
                </div>
              </div>
              {/* 第二行：地址 */}
              <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4, lineHeight: 1.4 }}>{store.address}</div>
              {/* 第三行：营业时间 + 电话 + 编号 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: TEXT_TERTIARY, marginBottom: 6 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Clock size={11} />{store.workTimeStart}-{store.workTimeEnd}
                </span>
                {store.phone && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Phone size={11} />{store.phone}
                  </span>
                )}
                {store.storeNo && (
                  <span style={{ fontSize: 10, color: TEXT_TERTIARY, opacity: 0.7 }}>#{store.storeNo}</span>
                )}
              </div>
              {/* 第四行：标签 */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                {store.storeTags?.map(tag => (
                  <span key={tag} style={{
                    fontSize: 10, padding: '1px 6px', borderRadius: 4,
                    background: (tag === '新店' || tag === '旗舰店') ? '#e8f5e9' : '#f5f5f5',
                    color: (tag === '新店' || tag === '旗舰店') ? BRAND_GREEN : TEXT_TERTIARY,
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

// ─── 商品浏览 ───
function ProductBrowse({ products, categories, selectedCategory, onSelectCategory, searchQuery, onSearch, searchInputRef, loading, onSelect, ...qoderProps }) {
  return (
    <div style={qoderProps?.style} className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* 搜索栏 */}
      <div style={{ padding: '12px 16px 8px' }} data-qoder-id="qel-div-68eb2f5d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-68eb2f5d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:515,&quot;column&quot;:7}}">
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', background: SURFACE, borderRadius: 8,
          border: `1px solid ${BORDER}`,
        }} data-qoder-id="qel-div-59e8d929" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-59e8d929&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:516,&quot;column&quot;:9}}">
          <Search size={15} color={TEXT_TERTIARY}  data-qoder-id="qel-search-e18e5b56" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-search-e18e5b56&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;search&quot;,&quot;loc&quot;:{&quot;line&quot;:521,&quot;column&quot;:11}}"/>
          <input
            ref={searchInputRef}
            value={searchQuery}
            onChange={e => onSearch(e.target.value)}
            placeholder="搜索饮品、品类、关键词..."
            style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 13, color: TEXT_PRIMARY }}
           data-qoder-id="qel-input-125b3e17" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-125b3e17&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:522,&quot;column&quot;:11}}"/>
          {searchQuery && (
            <button onClick={() => onSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }} data-qoder-id="qel-button-352b0da8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-352b0da8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:530,&quot;column&quot;:13}}">
              <X size={14} color={TEXT_TERTIARY}  data-qoder-id="qel-x-8afaf599" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-x-8afaf599&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;x&quot;,&quot;loc&quot;:{&quot;line&quot;:531,&quot;column&quot;:15}}"/>
            </button>
          )}
        </div>
      </div>

      {/* 分类 Tab */}
      <div style={{
        display: 'flex', gap: 4, padding: '0 16px 12px',
        overflowX: 'auto', scrollbarWidth: 'none',
      }} data-qoder-id="qel-div-5ce8dde2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-5ce8dde2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:538,&quot;column&quot;:7}}">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            style={{
              padding: '4px 12px', borderRadius: 16, border: 'none',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'all 0.15s',
              background: selectedCategory === cat ? BRAND_GREEN : '#f5f5f5',
              color: selectedCategory === cat ? '#fff' : TEXT_SECONDARY,
            }}
           data-qoder-id="qel-button-3a2b1587" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-3a2b1587&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:543,&quot;column&quot;:11}}">{cat}</button>
        ))}
      </div>

      {loading && <LoadingIndicator text="搜索中..."  data-qoder-id="qel-loadingindicator-5ff24f36" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-loadingindicator-5ff24f36&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;loadingindicator&quot;,&quot;loc&quot;:{&quot;line&quot;:557,&quot;column&quot;:19}}"/>}

      {!loading && products.length === 0 && (
        <EmptyState text="未找到商品" subtext="换个关键词试试"  data-qoder-id="qel-emptystate-a00219ad" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-emptystate-a00219ad&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;emptystate&quot;,&quot;loc&quot;:{&quot;line&quot;:560,&quot;column&quot;:9}}"/>
      )}

      {/* 商品列表 */}
      <div style={{ padding: '0 16px' }} data-qoder-id="qel-div-60e8e42e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-60e8e42e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:564,&quot;column&quot;:7}}">
        {products.map(product => (
          <div
            key={product.productId}
            onClick={() => onSelect(product)}
            style={{
              display: 'flex', gap: 12, padding: '12px 0',
              borderBottom: `1px solid ${BORDER}`,
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = BRAND_GREEN_BG}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
           data-qoder-id="qel-div-53e69120" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-53e69120&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:566,&quot;column&quot;:11}}">
            {/* 商品图片区 */}
            <div style={{
              width: 64, height: 64, borderRadius: 8, flexShrink: 0,
              background: BRAND_GREEN_BG, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
            }} data-qoder-id="qel-div-54e692b3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-54e692b3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:578,&quot;column&quot;:13}}">
              {getProductEmoji(product.category)}
            </div>
            {/* 商品信息 */}
            <div style={{ flex: 1, minWidth: 0 }} data-qoder-id="qel-div-55e69446" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-55e69446&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:586,&quot;column&quot;:13}}">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }} data-qoder-id="qel-div-56e695d9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-56e695d9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:587,&quot;column&quot;:15}}">
                <span style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }} data-qoder-id="qel-span-7693b6a8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-7693b6a8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:588,&quot;column&quot;:17}}">{product.productName}</span>
                {product.tags?.map(tag => (
                  <span key={tag} style={{
                    fontSize: 9, padding: '0px 4px', borderRadius: 3,
                    background: tag === '新品' ? '#fff3e0' : tag === '热销' ? '#fce4ec' : tag === '季节限定' ? '#e8f5e9' : '#f5f5f5',
                    color: tag === '新品' ? '#e65100' : tag === '热销' ? '#c62828' : tag === '季节限定' ? BRAND_GREEN : TEXT_TERTIARY,
                    fontWeight: 500,
                  }} data-qoder-id="qel-span-7793b83b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-7793b83b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:590,&quot;column&quot;:19}}">{tag}</span>
                ))}
              </div>
              <div style={{ fontSize: 11, color: TEXT_TERTIARY, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} data-qoder-id="qel-div-59e69a92" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-59e69a92&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:598,&quot;column&quot;:15}}">
                {product.description || product.category}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} data-qoder-id="qel-div-5ae69c25" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-5ae69c25&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:601,&quot;column&quot;:15}}">
                <div data-qoder-id="qel-div-5be69db8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-5be69db8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:602,&quot;column&quot;:17}}">
                  <span style={{ fontSize: 16, fontWeight: 700, color: BRAND_GREEN }} data-qoder-id="qel-span-7393b1ef" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-7393b1ef&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:603,&quot;column&quot;:19}}">¥{product.initialPrice}</span>
                  {product.estimatePrice < product.initialPrice && (
                    <span style={{ fontSize: 11, color: TEXT_TERTIARY, textDecoration: 'line-through', marginLeft: 4 }} data-qoder-id="qel-span-64a4e373" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-64a4e373&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:605,&quot;column&quot;:21}}">¥{product.initialPrice}</span>
                  )}
                </div>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: BRAND_GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} data-qoder-id="qel-div-6d0b8954" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-6d0b8954&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:608,&quot;column&quot;:17}}">
                  <Plus size={15} color="#fff"  data-qoder-id="qel-plus-578d5a75" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-plus-578d5a75&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductBrowse&quot;,&quot;elementRole&quot;:&quot;plus&quot;,&quot;loc&quot;:{&quot;line&quot;:612,&quot;column&quot;:19}}"/>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── 商品定制 ───
function ProductCustomize({ item, onToggle, onAmountChange, onAdd, ...qoderProps }) {
  const { product, attrs, amount, extraPrice } = item
  const totalPrice = (product.initialPrice + extraPrice) * amount

  return (
    <div style={{ ...({ padding: '16px' }), ...(qoderProps?.style) }} className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* 商品头部 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }} data-qoder-id="qel-div-b8178016" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-b8178016&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:631,&quot;column&quot;:7}}">
        <div style={{
          width: 72, height: 72, borderRadius: 10, flexShrink: 0,
          background: BRAND_GREEN_BG, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32,
        }} data-qoder-id="qel-div-b91781a9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-b91781a9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:632,&quot;column&quot;:9}}">
          {getProductEmoji(product.category)}
        </div>
        <div data-qoder-id="qel-div-b6177cf0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-b6177cf0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:639,&quot;column&quot;:9}}">
          <div style={{ fontSize: 16, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 4 }} data-qoder-id="qel-div-b7177e83" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-b7177e83&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:640,&quot;column&quot;:11}}">{product.productName}</div>
          <div style={{ fontSize: 12, color: TEXT_TERTIARY, marginBottom: 6 }} data-qoder-id="qel-div-c41792fa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-c41792fa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:641,&quot;column&quot;:11}}">{product.description}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: BRAND_GREEN }} data-qoder-id="qel-div-c517948d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-c517948d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:642,&quot;column&quot;:11}}">¥{product.initialPrice + extraPrice}</div>
        </div>
      </div>

      {/* 属性选择 */}
      {attrs.map(attr => (
        <div key={attr.attributeId} style={{ marginBottom: 18 }} data-qoder-id="qel-div-c219ce6b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-c219ce6b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:648,&quot;column&quot;:9}}">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }} data-qoder-id="qel-div-c119ccd8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-c119ccd8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:649,&quot;column&quot;:11}}">
            <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }} data-qoder-id="qel-span-2a994a4d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-2a994a4d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:650,&quot;column&quot;:13}}">{attr.attributeName}</span>
            {attr.multiSelect && (
              <span style={{ fontSize: 10, color: TEXT_TERTIARY }} data-qoder-id="qel-span-299948ba" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-299948ba&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:652,&quot;column&quot;:15}}">(可多选)</span>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }} data-qoder-id="qel-div-c619d4b7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-c619d4b7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:655,&quot;column&quot;:11}}">
            {attr.productSubAttrs.map(sa => {
              const isSelected = sa.selected
              return (
                <button
                  key={sa.attributeId}
                  onClick={() => onToggle(attr.attributeId, sa.attributeId, attr.multiSelect)}
                  style={{
                    padding: '6px 14px', borderRadius: 18, cursor: 'pointer',
                    fontSize: 12, fontWeight: 500, transition: 'all 0.15s',
                    border: `1.5px solid ${isSelected ? BRAND_GREEN : BORDER}`,
                    background: isSelected ? BRAND_GREEN_BG : '#fff',
                    color: isSelected ? BRAND_GREEN : TEXT_SECONDARY,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                 data-qoder-id="qel-button-2d21ba58" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-2d21ba58&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:659,&quot;column&quot;:17}}">
                  {isSelected && <Check size={12}  data-qoder-id="qel-check-87e260e1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-check-87e260e1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;check&quot;,&quot;loc&quot;:{&quot;line&quot;:671,&quot;column&quot;:34}}"/>}
                  {sa.attributeName}
                  {sa.price > 0 && <span style={{ fontSize: 10, opacity: 0.75 }} data-qoder-id="qel-span-2599426e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-2599426e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:673,&quot;column&quot;:36}}">+¥{sa.price}</span>}
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
        }} data-qoder-id="qel-div-ba19c1d3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-ba19c1d3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:683,&quot;column&quot;:9}}">
          <AlertCircle size={13}  data-qoder-id="qel-alertcircle-a99eecd0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-alertcircle-a99eecd0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;alertcircle&quot;,&quot;loc&quot;:{&quot;line&quot;:688,&quot;column&quot;:11}}"/>
          过敏原：{product.allergens.join('、')}
        </div>
      )}

      {/* 数量 + 加入购物车 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 0', borderTop: `1px solid ${BORDER}`,
        position: 'sticky', bottom: 0, background: '#fff',
      }} data-qoder-id="qel-div-4173db79" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-4173db79&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:694,&quot;column&quot;:7}}">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} data-qoder-id="qel-div-4073d9e6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-4073d9e6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:699,&quot;column&quot;:9}}">
          <button onClick={() => onAmountChange(-1)} style={{
            width: 30, height: 30, borderRadius: '50%', border: `1px solid ${BORDER}`,
            background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }} data-qoder-id="qel-button-193eb7c7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-193eb7c7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:700,&quot;column&quot;:11}}">
            <Minus size={14} color={TEXT_SECONDARY}  data-qoder-id="qel-minus-4dfeadec" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-minus-4dfeadec&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;minus&quot;,&quot;loc&quot;:{&quot;line&quot;:704,&quot;column&quot;:13}}"/>
          </button>
          <span style={{ fontSize: 16, fontWeight: 600, minWidth: 20, textAlign: 'center' }} data-qoder-id="qel-span-a5646351" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-a5646351&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:706,&quot;column&quot;:11}}">{amount}</span>
          <button onClick={() => onAmountChange(1)} style={{
            width: 30, height: 30, borderRadius: '50%', border: `1px solid ${BORDER}`,
            background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }} data-qoder-id="qel-button-163eb30e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-163eb30e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:707,&quot;column&quot;:11}}">
            <Plus size={14} color={TEXT_SECONDARY}  data-qoder-id="qel-plus-fe161303" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-plus-fe161303&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;plus&quot;,&quot;loc&quot;:{&quot;line&quot;:711,&quot;column&quot;:13}}"/>
          </button>
        </div>
        <button
          onClick={onAdd}
          style={{
            padding: '10px 28px', borderRadius: 20, border: 'none',
            background: BRAND_GREEN, color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}
         data-qoder-id="qel-button-143eafe8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-143eafe8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:714,&quot;column&quot;:9}}">
          <ShoppingBag size={16}  data-qoder-id="qel-shoppingbag-17a7e799" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-shoppingbag-17a7e799&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;ProductCustomize&quot;,&quot;elementRole&quot;:&quot;shoppingbag&quot;,&quot;loc&quot;:{&quot;line&quot;:722,&quot;column&quot;:11}}"/>
          加入购物车 ¥{totalPrice.toFixed(2)}
        </button>
      </div>
    </div>
  )
}

// ─── 购物车 ───
function CartView({ cart, cartTotal, onRemove, onUpdateAmount, onCheckout }) {
  if (cart.length === 0) {
    return <EmptyState text="购物车是空的" subtext="去选择饮品吧"  data-qoder-id="qel-emptystate-8666bd53" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-emptystate-8666bd53&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;emptystate&quot;,&quot;loc&quot;:{&quot;line&quot;:733,&quot;column&quot;:12}}"/>
  }

  return (
    <div style={{ padding: '12px 16px' }} data-qoder-id="qel-div-3533f9ad" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-3533f9ad&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:737,&quot;column&quot;:5}}">
      {cart.map(item => (
        <div key={item.id} style={{
          display: 'flex', gap: 10, padding: '12px 0',
          borderBottom: `1px solid ${BORDER}`,
        }} data-qoder-id="qel-div-3433f81a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-3433f81a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:739,&quot;column&quot;:9}}">
          <div style={{
            width: 48, height: 48, borderRadius: 8, flexShrink: 0,
            background: BRAND_GREEN_BG, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }} data-qoder-id="qel-div-3333f687" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-3333f687&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:743,&quot;column&quot;:11}}">
            {getProductEmoji('')}
          </div>
          <div style={{ flex: 1 }} data-qoder-id="qel-div-3233f4f4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-3233f4f4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:750,&quot;column&quot;:11}}">
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 2 }} data-qoder-id="qel-div-3133f361" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-3133f361&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:751,&quot;column&quot;:13}}">{item.productName}</div>
            <div style={{ fontSize: 11, color: TEXT_TERTIARY, marginBottom: 6 }} data-qoder-id="qel-div-3033f1ce" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-3033f1ce&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:752,&quot;column&quot;:13}}">{item.additionDesc || '标准'}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} data-qoder-id="qel-div-2f33f03b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-2f33f03b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:753,&quot;column&quot;:13}}">
              <span style={{ fontSize: 14, fontWeight: 600, color: BRAND_GREEN }} data-qoder-id="qel-span-0331ab9c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-0331ab9c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:754,&quot;column&quot;:15}}">¥{item.totalPrice.toFixed(2)}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} data-qoder-id="qel-div-2d33ed15" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-2d33ed15&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:755,&quot;column&quot;:15}}">
                <button onClick={() => onRemove(item.id)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex',
                }} data-qoder-id="qel-button-dfdd0eaa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-dfdd0eaa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:756,&quot;column&quot;:17}}">
                  <Trash2 size={14} color={TEXT_TERTIARY}  data-qoder-id="qel-trash2-9e337bf6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-trash2-9e337bf6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;trash2&quot;,&quot;loc&quot;:{&quot;line&quot;:759,&quot;column&quot;:19}}"/>
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} data-qoder-id="qel-div-1c3610e9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-1c3610e9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:761,&quot;column&quot;:17}}">
                  <button onClick={() => onUpdateAmount(item.id, -1)} style={{
                    width: 22, height: 22, borderRadius: '50%', border: `1px solid ${BORDER}`,
                    background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }} data-qoder-id="qel-button-dcdf4888" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-dcdf4888&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:762,&quot;column&quot;:19}}">
                    <Minus size={11}  data-qoder-id="qel-minus-5108e3df" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-minus-5108e3df&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;minus&quot;,&quot;loc&quot;:{&quot;line&quot;:766,&quot;column&quot;:21}}"/>
                  </button>
                  <span style={{ fontSize: 13, fontWeight: 600, minWidth: 16, textAlign: 'center' }} data-qoder-id="qel-span-0433ebc6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-0433ebc6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:768,&quot;column&quot;:19}}">{item.amount}</span>
                  <button onClick={() => onUpdateAmount(item.id, 1)} style={{
                    width: 22, height: 22, borderRadius: '50%', border: `1px solid ${BORDER}`,
                    background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }} data-qoder-id="qel-button-e3df538d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-e3df538d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:769,&quot;column&quot;:19}}">
                    <Plus size={11}  data-qoder-id="qel-plus-d10ab1dc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-plus-d10ab1dc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;plus&quot;,&quot;loc&quot;:{&quot;line&quot;:773,&quot;column&quot;:21}}"/>
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
      }} data-qoder-id="qel-div-1e36140f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-1e36140f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:783,&quot;column&quot;:7}}">
        <div data-qoder-id="qel-div-23361bee" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-23361bee&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:787,&quot;column&quot;:9}}">
          <span style={{ fontSize: 12, color: TEXT_TERTIARY }} data-qoder-id="qel-span-1134003d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-1134003d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:788,&quot;column&quot;:11}}">合计</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: BRAND_GREEN, marginLeft: 6 }} data-qoder-id="qel-span-0e363a1b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-0e363a1b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:789,&quot;column&quot;:11}}">¥{cartTotal.toFixed(2)}</span>
        </div>
        <button
          onClick={onCheckout}
          style={{
            padding: '10px 32px', borderRadius: 20, border: 'none',
            background: BRAND_GREEN, color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: 'pointer',
          }}
         data-qoder-id="qel-button-e3e19224" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-e3e19224&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;CartView&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:791,&quot;column&quot;:9}}">
          去结算
        </button>
      </div>
    </div>
  )
}

// ─── 订单预览 ───
function OrderPreview({ preview, store, onCreateOrder, loading, ...qoderProps }) {
  const waitMin = Math.round((preview.aboutTime - Date.now()) / 60000)

  return (
    <div style={{ ...({ padding: '16px' }), ...(qoderProps?.style) }} className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* 门店信息 */}
      <div style={{
        padding: '12px', borderRadius: 10, background: BRAND_GREEN_BG,
        marginBottom: 16,
      }} data-qoder-id="qel-div-611c20bd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-611c20bd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:813,&quot;column&quot;:7}}">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }} data-qoder-id="qel-div-5a1c15b8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-5a1c15b8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:817,&quot;column&quot;:9}}">
          <MapPin size={14} color={BRAND_GREEN}  data-qoder-id="qel-mappin-d59bca81" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mappin-d59bca81&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;mappin&quot;,&quot;loc&quot;:{&quot;line&quot;:818,&quot;column&quot;:11}}"/>
          <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }} data-qoder-id="qel-span-d6455e02" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-d6455e02&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:819,&quot;column&quot;:11}}">{preview.storeInfo?.storeName}</span>
        </div>
        <div style={{ fontSize: 11, color: TEXT_SECONDARY, marginLeft: 20 }} data-qoder-id="qel-div-5d1c1a71" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-5d1c1a71&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:821,&quot;column&quot;:9}}">
          {preview.storeInfo?.address}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 6, marginLeft: 20, fontSize: 11, color: TEXT_TERTIARY }} data-qoder-id="qel-div-561c0f6c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-561c0f6c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:824,&quot;column&quot;:9}}">
          <span data-qoder-id="qel-span-d94562bb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-d94562bb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:825,&quot;column&quot;:11}}">自取 · 预计{waitMin > 0 ? `${waitMin}分钟` : '15分钟'}后取餐</span>
        </div>
      </div>

      {/* 商品明细 */}
      <div style={{ marginBottom: 16 }} data-qoder-id="qel-div-5819d3fb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-5819d3fb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:830,&quot;column&quot;:7}}">
        <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 8 }} data-qoder-id="qel-div-5719d268" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-5719d268&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:831,&quot;column&quot;:9}}">商品明细</div>
        {preview.productInfoList?.map((item, idx) => (
          <div key={idx} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 0', borderBottom: `1px solid ${BORDER}`,
          }} data-qoder-id="qel-div-5a19d721" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-5a19d721&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:833,&quot;column&quot;:11}}">
            <div data-qoder-id="qel-div-5919d58e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-5919d58e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:837,&quot;column&quot;:13}}">
              <span style={{ fontSize: 13, color: TEXT_PRIMARY }} data-qoder-id="qel-span-d656a723" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-d656a723&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:838,&quot;column&quot;:15}}">{item.name}</span>
              {item.additionDesc && (
                <span style={{ fontSize: 11, color: TEXT_TERTIARY, marginLeft: 6 }} data-qoder-id="qel-span-d556a590" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-d556a590&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:840,&quot;column&quot;:17}}">({item.additionDesc})</span>
              )}
              <span style={{ fontSize: 11, color: TEXT_TERTIARY, marginLeft: 6 }} data-qoder-id="qel-span-d856aa49" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-d856aa49&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:842,&quot;column&quot;:15}}">x{item.amount}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: TEXT_PRIMARY }} data-qoder-id="qel-span-d756a8b6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-d756a8b6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:844,&quot;column&quot;:13}}">¥{item.estimateTotalPrice?.toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* 价格明细 */}
      <div style={{
        padding: '12px', borderRadius: 8, background: SURFACE,
        marginBottom: 16,
      }} data-qoder-id="qel-div-5019c763" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-5019c763&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:850,&quot;column&quot;:7}}">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }} data-qoder-id="qel-div-4f19c5d0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-4f19c5d0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:854,&quot;column&quot;:9}}">
          <span style={{ fontSize: 12, color: TEXT_SECONDARY }} data-qoder-id="qel-span-54539be6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-54539be6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:855,&quot;column&quot;:11}}">商品总价</span>
          <span style={{ fontSize: 12, color: TEXT_PRIMARY }} data-qoder-id="qel-span-55539d79" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-55539d79&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:856,&quot;column&quot;:11}}">¥{preview.totalInitialPrice?.toFixed(2)}</span>
        </div>
        {preview.privilegeMoney > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }} data-qoder-id="qel-div-d016bf4c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-d016bf4c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:859,&quot;column&quot;:11}}">
            <span style={{ fontSize: 12, color: TEXT_SECONDARY }} data-qoder-id="qel-span-53539a53" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-53539a53&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:860,&quot;column&quot;:13}}">优惠</span>
            <span style={{ fontSize: 12, color: '#e74c3c' }} data-qoder-id="qel-span-5853a232" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-5853a232&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:861,&quot;column&quot;:13}}">-¥{preview.privilegeMoney?.toFixed(2)}</span>
          </div>
        )}
        {preview.deliveryFee > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }} data-qoder-id="qel-div-cf16bdb9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-cf16bdb9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:865,&quot;column&quot;:11}}">
            <span style={{ fontSize: 12, color: TEXT_SECONDARY }} data-qoder-id="qel-span-56539f0c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-56539f0c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:866,&quot;column&quot;:13}}">配送费</span>
            <span style={{ fontSize: 12, color: TEXT_PRIMARY }} data-qoder-id="qel-span-5753a09f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-5753a09f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:867,&quot;column&quot;:13}}">¥{preview.deliveryFee?.toFixed(2)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: `1px dashed ${BORDER}` }} data-qoder-id="qel-div-da16cf0a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-da16cf0a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:870,&quot;column&quot;:9}}">
          <span style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }} data-qoder-id="qel-span-5d53aa11" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-5d53aa11&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:871,&quot;column&quot;:11}}">实付金额</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: BRAND_GREEN }} data-qoder-id="qel-span-6e51863d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-6e51863d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:872,&quot;column&quot;:11}}">¥{preview.discountPrice?.toFixed(2)}</span>
        </div>
      </div>

      {/* 下单按钮 */}
      <button
        onClick={onCreateOrder}
        disabled={loading}
        style={{
          width: '100%', padding: '12px', borderRadius: 22, border: 'none',
          background: loading ? '#ccc' : BRAND_GREEN, color: '#fff',
          fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}
       data-qoder-id="qel-button-ed18666a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-ed18666a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:877,&quot;column&quot;:7}}">
        <CreditCard size={16}  data-qoder-id="qel-creditcard-92a449c1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-creditcard-92a449c1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderPreview&quot;,&quot;elementRole&quot;:&quot;creditcard&quot;,&quot;loc&quot;:{&quot;line&quot;:887,&quot;column&quot;:9}}"/>
        {loading ? '处理中...' : `确认下单 ¥${preview.discountPrice?.toFixed(2)}`}
      </button>
    </div>
  )
}

// ─── 订单追踪 ───
function OrderTracking({ order, onCancel, loading, ...qoderProps }) {
  const STATUS_COLORS = {
    10: '#e67e22', 20: '#2980b9', 30: '#8e44ad', 40: BRAND_GREEN, 50: '#e67e22', 80: '#95a5a6', 100: '#e74c3c',
  }

  const STATUS_ICONS = {
    10: '💳', 20: '✅', 30: '🧑‍🍳', 40: '📦', 50: '🛵', 80: '🎉', 100: '❌',
  }

  const statusColor = STATUS_COLORS[order.orderStatus] || TEXT_TERTIARY
  const isCancelled = order.orderStatus === 100
  const isCompleted = order.orderStatus === 80

  return (
    <div style={{ ...({ padding: '20px 16px' }), ...(qoderProps?.style) }} className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* 状态卡片 */}
      <div style={{
        textAlign: 'center', padding: '24px 0', marginBottom: 20,
        borderBottom: `1px solid ${BORDER}`,
      }} data-qoder-id="qel-div-3c03ae94" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-3c03ae94&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:911,&quot;column&quot;:7}}">
        <div style={{ fontSize: 40, marginBottom: 8 }} data-qoder-id="qel-div-3d03b027" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-3d03b027&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:915,&quot;column&quot;:9}}">{STATUS_ICONS[order.orderStatus] || '📋'}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: statusColor, marginBottom: 4 }} data-qoder-id="qel-div-3e03b1ba" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-3e03b1ba&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:916,&quot;column&quot;:9}}">
          {order.orderStatusName}
        </div>
        {order.takeMealCodeInfo?.code && order.takeMealCodeInfo.code !== '生成中' && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 20px', borderRadius: 12, background: BRAND_GREEN_BG,
            marginTop: 8,
          }} data-qoder-id="qel-div-3f03b34d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-3f03b34d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:920,&quot;column&quot;:11}}">
            <span style={{ fontSize: 12, color: TEXT_SECONDARY }} data-qoder-id="qel-span-6d5cd9bc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-6d5cd9bc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:925,&quot;column&quot;:13}}">取餐码</span>
            <span style={{ fontSize: 24, fontWeight: 800, color: BRAND_GREEN }} data-qoder-id="qel-span-6e5cdb4f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-6e5cdb4f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:926,&quot;column&quot;:13}}">{order.takeMealCodeInfo.code}</span>
          </div>
        )}
        {order.takeMealCodeInfo?.shelfNo && (
          <div style={{ fontSize: 12, color: TEXT_TERTIARY, marginTop: 4 }} data-qoder-id="qel-div-3e05f051" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-3e05f051&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:930,&quot;column&quot;:11}}">
            {order.takeMealCodeInfo.shelfNo}
          </div>
        )}
      </div>

      {/* 门店信息 */}
      <div style={{
        padding: '12px', borderRadius: 10, background: SURFACE, marginBottom: 16,
      }} data-qoder-id="qel-div-3d05eebe" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-3d05eebe&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:937,&quot;column&quot;:7}}">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }} data-qoder-id="qel-div-3c05ed2b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-3c05ed2b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:940,&quot;column&quot;:9}}">
          <MapPin size={13} color={TEXT_SECONDARY}  data-qoder-id="qel-mappin-38876292" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mappin-38876292&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;mappin&quot;,&quot;loc&quot;:{&quot;line&quot;:941,&quot;column&quot;:11}}"/>
          <span style={{ fontSize: 13, fontWeight: 500, color: TEXT_PRIMARY }} data-qoder-id="qel-span-775f2811" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-775f2811&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:942,&quot;column&quot;:11}}">{order.storeInfo?.storeName}</span>
        </div>
        <div style={{ fontSize: 11, color: TEXT_TERTIARY, marginLeft: 19 }} data-qoder-id="qel-div-4105f50a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-4105f50a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:944,&quot;column&quot;:9}}">
          {order.storeInfo?.address}
        </div>
      </div>

      {/* 商品列表 */}
      <div style={{ marginBottom: 16 }} data-qoder-id="qel-div-4005f377" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-4005f377&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:950,&quot;column&quot;:7}}">
        <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 8 }} data-qoder-id="qel-div-3f05f1e4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-3f05f1e4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:951,&quot;column&quot;:9}}">订单商品</div>
        {order.productInfoList?.map((item, idx) => (
          <div key={idx} style={{
            display: 'flex', justifyContent: 'space-between', padding: '6px 0',
            fontSize: 12, color: TEXT_SECONDARY,
          }} data-qoder-id="qel-div-3605e3b9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-3605e3b9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:953,&quot;column&quot;:11}}">
            <span data-qoder-id="qel-span-725f2032" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-725f2032&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:957,&quot;column&quot;:13}}">{item.name} {item.additionDesc && `(${item.additionDesc})`} x{item.amount}</span>
            <span data-qoder-id="qel-span-796bf72a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-796bf72a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:958,&quot;column&quot;:13}}">¥{item.estimateTotalPrice?.toFixed(2) || item.estimatePrice?.toFixed(2)}</span>
          </div>
        ))}
        {order.orderCommodityList?.map((item, idx) => (
          !order.productInfoList && (
            <div key={idx} style={{
              display: 'flex', justifyContent: 'space-between', padding: '6px 0',
              fontSize: 12, color: TEXT_SECONDARY,
            }} data-qoder-id="qel-div-2cff19c9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-2cff19c9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:963,&quot;column&quot;:13}}">
              <span data-qoder-id="qel-span-776bf404" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-776bf404&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:967,&quot;column&quot;:15}}">{item.commodityName} x1</span>
              <span data-qoder-id="qel-span-786bf597" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-786bf597&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:968,&quot;column&quot;:15}}">¥{item.payMoney?.toFixed(2)}</span>
            </div>
          )
        ))}
        <div style={{
          display: 'flex', justifyContent: 'space-between', paddingTop: 8, marginTop: 4,
          borderTop: `1px dashed ${BORDER}`, fontSize: 14, fontWeight: 600,
        }} data-qoder-id="qel-div-2fff1e82" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-2fff1e82&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:972,&quot;column&quot;:9}}">
          <span style={{ color: TEXT_PRIMARY }} data-qoder-id="qel-span-766bf271" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-766bf271&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:976,&quot;column&quot;:11}}">实付金额</span>
          <span style={{ color: BRAND_GREEN }} data-qoder-id="qel-span-736bedb8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-736bedb8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:977,&quot;column&quot;:11}}">¥{order.orderPayAmount?.toFixed(2)}</span>
        </div>
      </div>

      {order.remark && (
        <div style={{
          padding: '8px 12px', borderRadius: 8, background: '#fff8e1',
          fontSize: 11, color: '#f57f17', marginBottom: 16,
        }} data-qoder-id="qel-div-2eff1cef" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-2eff1cef&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:982,&quot;column&quot;:9}}">
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
         data-qoder-id="qel-button-3d767766" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-3d767766&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;OrderTracking&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:992,&quot;column&quot;:9}}">
          {loading ? '处理中...' : '取消订单'}
        </button>
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
    <div style={{ ...({ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 }), ...(qoderProps?.style) }} className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <div style={{
        width: 20, height: 20, border: `2px solid ${BRAND_GREEN}`,
        borderTopColor: 'transparent', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}  data-qoder-id="qel-div-c15915e3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-c15915e3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;LoadingIndicator&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1025,&quot;column&quot;:7}}"/>
      <span style={{ fontSize: 13, color: TEXT_TERTIARY }} data-qoder-id="qel-span-f06fc494" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-f06fc494&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;LoadingIndicator&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1030,&quot;column&quot;:7}}">{text || '加载中...'}</span>
      <style data-qoder-id="qel-style-8dbd16b5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-style-8dbd16b5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;LoadingIndicator&quot;,&quot;elementRole&quot;:&quot;style&quot;,&quot;loc&quot;:{&quot;line&quot;:1031,&quot;column&quot;:7}}">{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function EmptyState({ text, subtext, ...qoderProps }) {
  return (
    <div style={{ ...({ textAlign: 'center', padding: '40px 20px' }), ...(qoderProps?.style) }} className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <div style={{ fontSize: 36, marginBottom: 8 }} data-qoder-id="qel-div-91f8a008" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-91f8a008&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;EmptyState&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1039,&quot;column&quot;:7}}">🧋</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: TEXT_PRIMARY, marginBottom: 4 }} data-qoder-id="qel-div-92f8a19b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-92f8a19b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;EmptyState&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1040,&quot;column&quot;:7}}">{text}</div>
      {subtext && <div style={{ fontSize: 12, color: TEXT_TERTIARY }} data-qoder-id="qel-div-93f8a32e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-93f8a32e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/order/OrderingPanel.jsx&quot;,&quot;componentName&quot;:&quot;EmptyState&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1041,&quot;column&quot;:19}}">{subtext}</div>}
    </div>
  )
}
