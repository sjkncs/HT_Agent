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

export default function OrderingPanel({ onClose, onOrderCreated, embedded = false }) {
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
    <div style={panelStyle}>
      {/* ─── 顶部导航栏 ─── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: `1px solid ${BORDER}`,
        background: BRAND_GREEN, color: '#fff',
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
            {step === STEPS.CART && '购物车'}
            {step === STEPS.PREVIEW && '订单预览'}
            {step === STEPS.ORDERING && '下单中...'}
            {step === STEPS.TRACKING && '订单追踪'}
          </span>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* ─── 错误提示 ─── */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#fff3f0', borderBottom: `1px solid #ffd8d2` }}>
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
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onSearch={handleSearch}
            searchInputRef={searchInputRef}
            loading={loading}
            onSelect={openCustomize}
          />
        )}
        {step === STEPS.CUSTOMIZE && customizing && (
          <ProductCustomize
            item={customizing}
            onToggle={toggleAttr}
            onAmountChange={(delta) => setCustomizing(prev => ({ ...prev, amount: Math.max(1, prev.amount + delta) }))}
            onAdd={addToCart}
          />
        )}
        {step === STEPS.CART && (
          <CartView
            cart={cart}
            cartTotal={cartTotal}
            onRemove={removeFromCart}
            onUpdateAmount={updateCartAmount}
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
            <div style={{ width: 36, height: 36, border: `3px solid ${BRAND_GREEN}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
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
              <ShoppingBag size={22} color={BRAND_GREEN} />
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
            <span style={{ fontSize: 16, fontWeight: 700, color: BRAND_GREEN }}>¥{cartTotal.toFixed(2)}</span>
            <ChevronRight size={16} color={TEXT_TERTIARY} />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── 门店列表 ───
function StoreList({ stores, loading, onSelect }) {
  const [search, setSearch] = useState('')
  const filtered = search ? stores.filter(s => s.storeName.includes(search) || s.address.includes(search)) : stores

  return (
    <div style={{ padding: '12px 16px' }}>
      {/* 搜索框 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', background: SURFACE, borderRadius: 8,
        border: `1px solid ${BORDER}`, marginBottom: 12,
      }}>
        <Search size={15} color={TEXT_TERTIARY} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜索门店名称或地址"
          style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 13, color: TEXT_PRIMARY }}
        />
      </div>

      {loading && <LoadingIndicator text="加载门店中..." />}

      {!loading && filtered.length === 0 && (
        <EmptyState text="未找到附近门店" subtext="请尝试搜索其他关键词" />
      )}

      {filtered.map(store => (
        <div
          key={store.storeId}
          onClick={() => onSelect(store)}
          style={{
            padding: '12px 0', borderBottom: `1px solid ${BORDER}`,
            cursor: 'pointer', transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = BRAND_GREEN_BG}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>{store.storeName}</span>
                {store.businessStatus === 3 && (
                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#fff3e0', color: '#e65100' }}>即将打烊</span>
                )}
                {store.businessStatus === 2 && (
                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#f5f5f5', color: '#999' }}>休息中</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4 }}>{store.address}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: TEXT_TERTIARY }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Clock size={11} />{store.workTimeStart}-{store.workTimeEnd}
                </span>
                {store.phone && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Phone size={11} />{store.phone}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                {store.storeTags?.map(tag => (
                  <span key={tag} style={{
                    fontSize: 10, padding: '1px 6px', borderRadius: 4,
                    background: tag === '新店' ? '#e8f5e9' : '#f5f5f5',
                    color: tag === '新店' ? BRAND_GREEN : TEXT_TERTIARY,
                  }}>{tag}</span>
                ))}
              </div>
            </div>
            <div style={{ textAlign: 'right', minWidth: 50 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: BRAND_GREEN }}>{store.distance}km</div>
              <ChevronRight size={14} color={TEXT_TERTIARY} style={{ marginTop: 4 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── 商品浏览 ───
function ProductBrowse({ products, categories, selectedCategory, onSelectCategory, searchQuery, onSearch, searchInputRef, loading, onSelect }) {
  return (
    <div>
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

      {/* 分类 Tab */}
      <div style={{
        display: 'flex', gap: 4, padding: '0 16px 12px',
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
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
          >{cat}</button>
        ))}
      </div>

      {loading && <LoadingIndicator text="搜索中..." />}

      {!loading && products.length === 0 && (
        <EmptyState text="未找到商品" subtext="换个关键词试试" />
      )}

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
            onMouseEnter={e => e.currentTarget.style.background = BRAND_GREEN_BG}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {/* 商品图片区 */}
            <div style={{
              width: 64, height: 64, borderRadius: 8, flexShrink: 0,
              background: BRAND_GREEN_BG, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
            }}>
              {getProductEmoji(product.category)}
            </div>
            {/* 商品信息 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>{product.productName}</span>
                {product.tags?.map(tag => (
                  <span key={tag} style={{
                    fontSize: 9, padding: '0px 4px', borderRadius: 3,
                    background: tag === '新品' ? '#fff3e0' : tag === '热销' ? '#fce4ec' : tag === '季节限定' ? '#e8f5e9' : '#f5f5f5',
                    color: tag === '新品' ? '#e65100' : tag === '热销' ? '#c62828' : tag === '季节限定' ? BRAND_GREEN : TEXT_TERTIARY,
                    fontWeight: 500,
                  }}>{tag}</span>
                ))}
              </div>
              <div style={{ fontSize: 11, color: TEXT_TERTIARY, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {product.description || product.category}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: 16, fontWeight: 700, color: BRAND_GREEN }}>¥{product.initialPrice}</span>
                  {product.estimatePrice < product.initialPrice && (
                    <span style={{ fontSize: 11, color: TEXT_TERTIARY, textDecoration: 'line-through', marginLeft: 4 }}>¥{product.initialPrice}</span>
                  )}
                </div>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: BRAND_GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center',
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

// ─── 商品定制 ───
function ProductCustomize({ item, onToggle, onAmountChange, onAdd }) {
  const { product, attrs, amount, extraPrice } = item
  const totalPrice = (product.initialPrice + extraPrice) * amount

  return (
    <div style={{ padding: '16px' }}>
      {/* 商品头部 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 10, flexShrink: 0,
          background: BRAND_GREEN_BG, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32,
        }}>
          {getProductEmoji(product.category)}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 4 }}>{product.productName}</div>
          <div style={{ fontSize: 12, color: TEXT_TERTIARY, marginBottom: 6 }}>{product.description}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: BRAND_GREEN }}>¥{product.initialPrice + extraPrice}</div>
        </div>
      </div>

      {/* 属性选择 */}
      {attrs.map(attr => (
        <div key={attr.attributeId} style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{attr.attributeName}</span>
            {attr.multiSelect && (
              <span style={{ fontSize: 10, color: TEXT_TERTIARY }}>(可多选)</span>
            )}
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
                    border: `1.5px solid ${isSelected ? BRAND_GREEN : BORDER}`,
                    background: isSelected ? BRAND_GREEN_BG : '#fff',
                    color: isSelected ? BRAND_GREEN : TEXT_SECONDARY,
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
            background: BRAND_GREEN, color: '#fff', fontSize: 14, fontWeight: 600,
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

// ─── 购物车 ───
function CartView({ cart, cartTotal, onRemove, onUpdateAmount, onCheckout }) {
  if (cart.length === 0) {
    return <EmptyState text="购物车是空的" subtext="去选择饮品吧" />
  }

  return (
    <div style={{ padding: '12px 16px' }}>
      {cart.map(item => (
        <div key={item.id} style={{
          display: 'flex', gap: 10, padding: '12px 0',
          borderBottom: `1px solid ${BORDER}`,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 8, flexShrink: 0,
            background: BRAND_GREEN_BG, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }}>
            {getProductEmoji('')}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 2 }}>{item.productName}</div>
            <div style={{ fontSize: 11, color: TEXT_TERTIARY, marginBottom: 6 }}>{item.additionDesc || '标准'}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: BRAND_GREEN }}>¥{item.totalPrice.toFixed(2)}</span>
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
          <span style={{ fontSize: 20, fontWeight: 700, color: BRAND_GREEN, marginLeft: 6 }}>¥{cartTotal.toFixed(2)}</span>
        </div>
        <button
          onClick={onCheckout}
          style={{
            padding: '10px 32px', borderRadius: 20, border: 'none',
            background: BRAND_GREEN, color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          去结算
        </button>
      </div>
    </div>
  )
}

// ─── 订单预览 ───
function OrderPreview({ preview, store, onCreateOrder, loading }) {
  const waitMin = Math.round((preview.aboutTime - Date.now()) / 60000)

  return (
    <div style={{ padding: '16px' }}>
      {/* 门店信息 */}
      <div style={{
        padding: '12px', borderRadius: 10, background: BRAND_GREEN_BG,
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <MapPin size={14} color={BRAND_GREEN} />
          <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{preview.storeInfo?.storeName}</span>
        </div>
        <div style={{ fontSize: 11, color: TEXT_SECONDARY, marginLeft: 20 }}>
          {preview.storeInfo?.address}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 6, marginLeft: 20, fontSize: 11, color: TEXT_TERTIARY }}>
          <span>自取 · 预计{waitMin > 0 ? `${waitMin}分钟` : '15分钟'}后取餐</span>
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
              {item.additionDesc && (
                <span style={{ fontSize: 11, color: TEXT_TERTIARY, marginLeft: 6 }}>({item.additionDesc})</span>
              )}
              <span style={{ fontSize: 11, color: TEXT_TERTIARY, marginLeft: 6 }}>x{item.amount}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: TEXT_PRIMARY }}>¥{item.estimateTotalPrice?.toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* 价格明细 */}
      <div style={{
        padding: '12px', borderRadius: 8, background: SURFACE,
        marginBottom: 16,
      }}>
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
          <span style={{ fontSize: 18, fontWeight: 700, color: BRAND_GREEN }}>¥{preview.discountPrice?.toFixed(2)}</span>
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
      >
        <CreditCard size={16} />
        {loading ? '处理中...' : `确认下单 ¥${preview.discountPrice?.toFixed(2)}`}
      </button>
    </div>
  )
}

// ─── 订单追踪 ───
function OrderTracking({ order, onCancel, loading }) {
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
    <div style={{ padding: '20px 16px' }}>
      {/* 状态卡片 */}
      <div style={{
        textAlign: 'center', padding: '24px 0', marginBottom: 20,
        borderBottom: `1px solid ${BORDER}`,
      }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>{STATUS_ICONS[order.orderStatus] || '📋'}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: statusColor, marginBottom: 4 }}>
          {order.orderStatusName}
        </div>
        {order.takeMealCodeInfo?.code && order.takeMealCodeInfo.code !== '生成中' && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 20px', borderRadius: 12, background: BRAND_GREEN_BG,
            marginTop: 8,
          }}>
            <span style={{ fontSize: 12, color: TEXT_SECONDARY }}>取餐码</span>
            <span style={{ fontSize: 24, fontWeight: 800, color: BRAND_GREEN }}>{order.takeMealCodeInfo.code}</span>
          </div>
        )}
        {order.takeMealCodeInfo?.shelfNo && (
          <div style={{ fontSize: 12, color: TEXT_TERTIARY, marginTop: 4 }}>
            {order.takeMealCodeInfo.shelfNo}
          </div>
        )}
      </div>

      {/* 门店信息 */}
      <div style={{
        padding: '12px', borderRadius: 10, background: SURFACE, marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <MapPin size={13} color={TEXT_SECONDARY} />
          <span style={{ fontSize: 13, fontWeight: 500, color: TEXT_PRIMARY }}>{order.storeInfo?.storeName}</span>
        </div>
        <div style={{ fontSize: 11, color: TEXT_TERTIARY, marginLeft: 19 }}>
          {order.storeInfo?.address}
        </div>
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
          <span style={{ color: BRAND_GREEN }}>¥{order.orderPayAmount?.toFixed(2)}</span>
        </div>
      </div>

      {order.remark && (
        <div style={{
          padding: '8px 12px', borderRadius: 8, background: '#fff8e1',
          fontSize: 11, color: '#f57f17', marginBottom: 16,
        }}>
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

function LoadingIndicator({ text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 }}>
      <div style={{
        width: 20, height: 20, border: `2px solid ${BRAND_GREEN}`,
        borderTopColor: 'transparent', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <span style={{ fontSize: 13, color: TEXT_TERTIARY }}>{text || '加载中...'}</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function EmptyState({ text, subtext }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>🧋</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: TEXT_PRIMARY, marginBottom: 4 }}>{text}</div>
      {subtext && <div style={{ fontSize: 12, color: TEXT_TERTIARY }}>{subtext}</div>}
    </div>
  )
}
