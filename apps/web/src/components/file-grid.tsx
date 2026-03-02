'use client'

import { useState, useEffect } from 'react'
import { getDownloadUrl, getPreviewUrl } from '@/lib/api'

interface File {
  id: string
  name: string
  size: number
  mimeType: string
  createdAt: string
}

interface FileGridProps {
  files: File[]
  viewMode: 'grid' | 'list'
  onDelete?: (id: string) => void
  onRename?: (id: string, newName: string) => void
}

function PreviewModal({ file, onClose }: { file: File; onClose: () => void }) {
  const url = getPreviewUrl(file.id)
  const downloadUrl = getDownloadUrl(file.id)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const renderPreview = () => {
    if (file.mimeType.startsWith('image/')) {
      return <img src={url} alt={file.name} className="max-h-full max-w-full object-contain rounded" />
    }
    if (file.mimeType.startsWith('video/')) {
      return <video src={url} controls autoPlay className="max-h-full max-w-full rounded" />
    }
    if (file.mimeType.startsWith('audio/')) {
      return (
        <div className="flex flex-col items-center gap-6">
          <svg className="w-24 h-24 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <audio src={url} controls autoPlay className="w-80" />
        </div>
      )
    }
    if (file.mimeType.includes('pdf')) {
      return <iframe src={url} className="w-full h-full rounded" title={file.name} />
    }
    if (file.mimeType.startsWith('text/')) {
      return <iframe src={url} className="w-full h-full rounded bg-white" title={file.name} />
    }
    return (
      <div className="flex flex-col items-center gap-6 text-white">
        <svg className="w-24 h-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-lg font-medium">{file.name}</p>
        <p className="text-gray-400 text-sm">No preview available</p>
        <a href={downloadUrl} download className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 text-sm font-medium">
          Download
        </a>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full h-full max-w-5xl max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {renderPreview()}
      </div>

      <div className="absolute top-4 right-4 flex items-center gap-3">
        <a
          href={downloadUrl}
          download
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"
          onClick={(e) => e.stopPropagation()}
          title="Download"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </a>
        <button
          onClick={onClose}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"
          title="Close (Esc)"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm truncate max-w-md text-center">
        {file.name}
      </div>
    </div>
  )
}

export function FileGrid({ files, viewMode, onDelete, onRename }: FileGridProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fileId: string } | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [previewFile, setPreviewFile] = useState<File | null>(null)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string, fileId: string) => {
    if (mimeType.startsWith('image/')) {
      return (
        <div className="w-full aspect-square bg-gray-100 flex items-center justify-center rounded-t-lg overflow-hidden">
          <img
            src={getDownloadUrl(fileId)}
            alt="thumbnail"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
      )
    }
    if (mimeType.includes('pdf')) {
      return (
        <div className="w-full aspect-square bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center rounded-t-lg">
          <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
      )
    }
    if (mimeType.startsWith('video/')) {
      return (
        <div className="w-full aspect-square bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center rounded-t-lg">
          <svg className="w-10 h-10 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
      )
    }
    if (mimeType.startsWith('audio/')) {
      return (
        <div className="w-full aspect-square bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center rounded-t-lg">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
      )
    }
    return (
      <div className="w-full aspect-square bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center rounded-t-lg">
        <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
    )
  }

  const contextFile = files.find(f => f.id === contextMenu?.fileId)

  if (viewMode === 'grid') {
    return (
      <>
        {previewFile && <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="group relative bg-white border border-gray-200 rounded-lg hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer"
              onClick={() => setPreviewFile(file)}
              onContextMenu={(e) => {
                e.preventDefault()
                setContextMenu({ x: e.clientX, y: e.clientY, fileId: file.id })
              }}
            >
              {getFileIcon(file.mimeType, file.id)}

              <div className="p-2">
                {renamingId === file.id ? (
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onBlur={() => {
                      if (newName && newName !== file.name && onRename) onRename(file.id, newName)
                      setRenamingId(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (newName && newName !== file.name && onRename) onRename(file.id, newName)
                        setRenamingId(null)
                      } else if (e.key === 'Escape') {
                        setRenamingId(null)
                      }
                    }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs font-medium text-gray-900 w-full border border-blue-500 rounded px-1"
                  />
                ) : (
                  <h3 className="text-xs font-medium text-gray-900 truncate mb-0.5" title={file.name}>
                    {file.name}
                  </h3>
                )}
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
              </div>

              <div className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 flex gap-1 transition-opacity">
                <a
                  href={getDownloadUrl(file.id)}
                  download
                  className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
                {onDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(file.id) }}
                    className="p-1.5 bg-white rounded-full shadow-md hover:bg-red-50"
                  >
                    <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {contextMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
            <div
              className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              <button
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                onClick={() => { setPreviewFile(contextFile || null); setContextMenu(null) }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview
              </button>
              {onRename && (
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  onClick={() => {
                    const file = files.find(f => f.id === contextMenu.fileId)
                    if (file) { setNewName(file.name); setRenamingId(file.id) }
                    setContextMenu(null)
                  }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Rename
                </button>
              )}
              <a
                href={getDownloadUrl(contextMenu.fileId)}
                download
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 no-underline text-gray-900"
                onClick={() => setContextMenu(null)}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </a>
              {onDelete && (
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                  onClick={() => { onDelete(contextMenu.fileId); setContextMenu(null) }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              )}
            </div>
          </>
        )}
      </>
    )
  }

  return (
    <>
      {previewFile && <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modified</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {files.map((file) => (
              <tr
                key={file.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => setPreviewFile(file)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 truncate max-w-md">{file.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(file.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatFileSize(file.size)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <a
                    href={getDownloadUrl(file.id)}
                    download
                    className="text-blue-600 hover:text-blue-900 mr-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Download
                  </a>
                  {onDelete && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(file.id) }}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
