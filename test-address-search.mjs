// Quick test for the address-based store search in mock mode
import { configureMCP } from './src/lib/mcp-client.js'
import { queryStoreList } from './src/lib/mcp-client.js'
import './src/lib/heytea-mock-data.js'

configureMCP({ useMock: true })

console.log('=== Test 1: 文字地址搜索 "深圳前海鸿荣源中心" ===')
const r1 = await queryStoreList({ address: '深圳前海鸿荣源中心' })
console.log('结果:', JSON.stringify(r1?.data?.map(s => ({ name: s.storeName, addr: s.address, score: s._score })), null, 2))

console.log('\n=== Test 2: 文字地址搜索 "南山区万象天地" ===')
const r2 = await queryStoreList({ address: '南山区万象天地' })
console.log('结果:', JSON.stringify(r2?.data?.map(s => ({ name: s.storeName, addr: s.address })), null, 2))

console.log('\n=== Test 3: 店名搜索 "海岸城" ===')
const r3 = await queryStoreList({ storeName: '海岸城' })
console.log('结果:', JSON.stringify(r3?.data?.map(s => ({ name: s.storeName })), null, 2))

console.log('\n=== Test 4: 无参数（兜底按距离排序） ===')
const r4 = await queryStoreList({})
console.log('结果:', JSON.stringify(r4?.data?.map(s => ({ name: s.storeName, dist: s.distance })), null, 2))
