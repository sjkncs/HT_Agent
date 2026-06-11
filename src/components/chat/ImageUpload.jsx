/**
 * 图片上传组件
 * 支持拍照、选择图片、拖拽上传
 * 上传后通过回调传递给聊天界面
 */
import React, { useState, useRef, useCallback } from 'react'

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_FILES = 3

export default function ImageUpload({ onImagesSelected, disabled, compact }) {
  const [previews, setPreviews] = useState([])
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const processFiles = useCallback((files) => {
    const validFiles = Array.from(files)
      .filter(f => ACCEPTED_TYPES.includes(f.type))
      .filter(f => f.size <= MAX_SIZE)
      .slice(0, MAX_FILES)

    if (validFiles.length === 0) return

    const newPreviews = validFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      type: file.type,
    }))

    setPreviews(prev => [...prev, ...newPreviews].slice(0, MAX_FILES))
    onImagesSelected?.(validFiles)
  }, [onImagesSelected])

  const handleFileChange = (e) => {
    if (e.target.files?.length) {
      processFiles(e.target.files)
    }
    e.target.value = '' // reset for re-select
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files?.length) {
      processFiles(e.dataTransfer.files)
    }
  }, [processFiles])

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  const removePreview = (index) => {
    setPreviews(prev => {
      const next = [...prev]
      URL.revokeObjectURL(next[index].url)
      next.splice(index, 1)
      return next
    })
  }

  const clearAll = () => {
    previews.forEach(p => URL.revokeObjectURL(p.url))
    setPreviews([])
  }

  if (compact) {
    // 紧凑模式：只显示图标按钮
    return (
      <>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          title="上传图片"
          style={{
            background: 'none',
            border: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            color: disabled ? '#ccc' : '#666',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = '#f0f0f0' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </button>

        {/* 预览弹窗 */}
        {previews.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '6px',
            alignItems: 'center',
            marginLeft: '4px',
          }}>
            {previews.map((p, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img
                  src={p.url}
                  alt={p.name}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '6px',
                    objectFit: 'cover',
                    border: '1px solid #e5e5e5',
                  }}
                />
                <button
                  onClick={() => removePreview(i)}
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#ff4d4f',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '10px',
                    lineHeight: '16px',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  x
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </>
    )
  }

  // 完整模式：显示拖拽区域
  return (
    <div>
      {/* 拖拽区域 */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? '#1677ff' : '#d9d9d9'}`,
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: dragOver ? '#e6f4ff' : '#fafafa',
          transition: 'all 0.2s',
          marginBottom: previews.length > 0 ? '8px' : 0,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" style={{ marginBottom: '6px' }}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <div style={{ fontSize: '13px', color: '#666' }}>
          点击或拖拽图片到此处上传
        </div>
        <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
          支持 JPG/PNG/GIF/WebP，单张最大 10MB，最多 {MAX_FILES} 张
        </div>
      </div>

      {/* 预览区 */}
      {previews.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {previews.map((p, i) => (
            <div
              key={i}
              style={{
                position: 'relative',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid #e5e5e5',
              }}
            >
              <img
                src={p.url}
                alt={p.name}
                style={{
                  width: '64px',
                  height: '64px',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'rgba(0,0,0,0.5)',
                color: '#fff',
                fontSize: '10px',
                padding: '2px 4px',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {p.name}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removePreview(i) }}
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: 'rgba(255,77,79,0.9)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '11px',
                  lineHeight: '18px',
                  padding: 0,
                }}
              >
                x
              </button>
            </div>
          ))}
          {previews.length > 1 && (
            <button
              onClick={clearAll}
              style={{
                background: 'none',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '12px',
                color: '#999',
                cursor: 'pointer',
              }}
            >
              清除全部
            </button>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  )
}
