const API_URL = ''

export async function uploadFile(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_URL}/api/files/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Upload failed')
  }

  return response.json()
}

export async function listFiles() {
  const response = await fetch(`${API_URL}/api/files`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch files')
  }

  return response.json()
}

export async function deleteFile(id: string) {
  const response = await fetch(`${API_URL}/api/files/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Failed to delete file')
  }

  return response.json()
}

export function getDownloadUrl(id: string) {
  return `${API_URL}/api/files/${id}/download`
}

export function getPreviewUrl(id: string) {
  return `${API_URL}/api/files/${id}/preview`
}

export async function renameFile(id: string, name: string) {
  const response = await fetch(`${API_URL}/api/files/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  })

  if (!response.ok) {
    throw new Error('Failed to rename file')
  }

  return response.json()
}
