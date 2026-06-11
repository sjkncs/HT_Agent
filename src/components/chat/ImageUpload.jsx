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
         data-qoder-id="qel-button-d5dafa27" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-d5dafa27&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ImageUpload.jsx&quot;,&quot;componentName&quot;:&quot;ImageUpload&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:77,&quot;column&quot;:9}}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" data-qoder-id="qel-svg-f4d922e2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-f4d922e2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ImageUpload.jsx&quot;,&quot;componentName&quot;:&quot;ImageUpload&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:95,&quot;column&quot;:11}}">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" data-qoder-id="qel-rect-36096ae5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-36096ae5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ImageUpload.jsx&quot;,&quot;componentName&quot;:&quot;ImageUpload&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:96,&quot;column&quot;:13}}"/>
            <circle cx="8.5" cy="8.5" r="1.5" data-qoder-id="qel-circle-0c4f2d38" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-0c4f2d38&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ImageUpload.jsx&quot;,&quot;componentName&quot;:&quot;ImageUpload&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:97,&quot;column&quot;:13}}"/>
            <polyline points="21 15 16 10 5 21" data-qoder-id="qel-polyline-b0c549bb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-polyline-b0c549bb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ImageUpload.jsx&quot;,&quot;componentName&quot;:&quot;ImageUpload&quot;,&quot;elementRole&quot;:&quot;polyline&quot;,&quot;loc&quot;:{&quot;line&quot;:98,&quot;column&quot;:13}}"/>
          </svg>
        </button>

        {/* 预览弹窗 */}
        {previews.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '6px',
            alignItems: 'center',
            marginLeft: '4px',
          }} data-qoder-id="qel-div-aa01767a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-aa01767a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ImageUpload.jsx&quot;,&quot;componentName&quot;:&quot;ImageUpload&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:104,&quot;column&quot;:11}}">
            {previews.map((p, i) => (
              <div key={i} style={{ position: 'relative' }} data-qoder-id="qel-div-ab01780d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-ab01780d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ImageUpload.jsx&quot;,&quot;componentName&quot;:&quot;ImageUpload&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:111,&quot;column&quot;:15}}">
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
                 data-qoder-id="qel-img-ad5cde68" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-img-ad5cde68&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ImageUpload.jsx&quot;,&quot;componentName&quot;:&quot;ImageUpload&quot;,&quot;elementRole&quot;:&quot;img&quot;,&quot;loc&quot;:{&quot;line&quot;:112,&quot;column&quot;:17}}"/>
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
                 data-qoder-id="qel-button-cddaed8f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-cddaed8f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ImageUpload.jsx&quot;,&quot;componentName&quot;:&quot;ImageUpload&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:123,&quot;column&quot;:17}}">
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
         data-qoder-id="qel-input-6417eb75" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-6417eb75&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ImageUpload.jsx&quot;,&quot;componentName&quot;:&quot;ImageUpload&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:151,&quot;column&quot;:9}}"/>
      </>
    )
  }

  // 完整模式：显示拖拽区域
  return (
    <div data-qoder-id="qel-div-6b41359e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-6b41359e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ImageUpload.jsx&quot;,&quot;componentName&quot;:&quot;ImageUpload&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:165,&quot;column&quot;:5}}">
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
       data-qoder-id="qel-div-6a41340b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-6a41340b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ImageUpload.jsx&quot;,&quot;componentName&quot;:&quot;ImageUpload&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:167,&quot;column&quot;:7}}">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" style={{ marginBottom: '6px' }} data-qoder-id="qel-svg-5acfb634" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-5acfb634&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ImageUpload.jsx&quot;,&quot;componentName&quot;:&quot;ImageUpload&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:183,&quot;column&quot;:9}}">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" data-qoder-id="qel-path-21e10edb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-21e10edb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ImageUpload.jsx&quot;,&quot;componentName&quot;:&quot;ImageUpload&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:184,&quot;column&quot;:11}}"/>
          <polyline points="17 8 12 3 7 8" data-qoder-id="qel-polyline-c49d3eb6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-polyline-c49d3eb6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ImageUpload.jsx&quot;,&quot;componentName&quot;:&quot;ImageUpload&quot;,&quot;elementRole&quot;:&quot;polyline&quot;,&quot;loc&quot;:{&quot;line&quot;:185,&quot;column&quot;:11}}"/>
          <line x1="12" y1="3" x2="12" y2="15" data-qoder-id="qel-line-29edf8ef" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-29edf8ef&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ImageUpload.jsx&quot;,&quot;componentName&quot;:&quot;ImageUpload&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:186,&quot;column&quot;:11}}"/>
        </svg>
        <div style={{ fontSize: '13px', color: '#666' }} data-qoder-id="qel-div-6d4138c4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-6d4138c4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ImageUpload.jsx&quot;,&quot;componentName&quot;:&quot;ImageUpload&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:188,&quot;column&quot;:9}}">
          点击或拖拽图片到此处上传
        </div>
        <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }} data-qoder-id="qel-div-64412a99" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-64412a99&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ImageUpload.jsx&quot;,&quot;componentName&quot;:&quot;ImageUpload&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:191,&quot;column&quot;:9}}">
          支持 JPG/PNG/GIF/WebP，单张最大 10MB，最多 {MAX_FILES} 张
        </div>
      </div>

      {/* 预览区 */}
      {previews.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }} data-qoder-id="qel-div-63412906" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-63412906&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ImageUpload.jsx&quot;,&quot;componentName&quot;:&quot;ImageUpload&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:198,&quot;column&quot;:9}}">
          {previews.map((p, i) => (
            <div
              key={i}
              style={{
                position: 'relative',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid #e5e5e5',
              }}
             data-qoder-id="qel-div-72437f3a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-72437f3a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ImageUpload.jsx&quot;,&quot;componentName&quot;:&quot;ImageUpload&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:200,&quot;column&quot;:13}}">
              <img
                src={p.url}
                alt={p.name}
                style={{
                  width: '64px',
                  height: '64px',
                  objectFit: 'cover',
                  display: 'block',
                }}
               data-qoder-id="qel-img-3e22f545" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-img-3e22f545&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ImageUpload.jsx&quot;,&quot;componentName&quot;:&quot;ImageUpload&quot;,&quot;elementRole&quot;:&quot;img&quot;,&quot;loc&quot;:{&quot;line&quot;:209,&quot;column&quot;:15}}"/>
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
              }} data-qoder-id="qel-div-70437c14" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-70437c14&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ImageUpload.jsx&quot;,&quot;componentName&quot;:&quot;ImageUpload&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:219,&quot;column&quot;:15}}">
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
               data-qoder-id="qel-button-c3b9f8ab" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-c3b9f8ab&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ImageUpload.jsx&quot;,&quot;componentName&quot;:&quot;ImageUpload&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:235,&quot;column&quot;:15}}">
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
             data-qoder-id="qel-button-c8ba008a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-c8ba008a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ImageUpload.jsx&quot;,&quot;componentName&quot;:&quot;ImageUpload&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:258,&quot;column&quot;:13}}">
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
       data-qoder-id="qel-input-6f1a3b5d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-6f1a3b5d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ImageUpload.jsx&quot;,&quot;componentName&quot;:&quot;ImageUpload&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:276,&quot;column&quot;:7}}"/>
    </div>
  )
}
