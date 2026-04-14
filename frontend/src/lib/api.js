import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function requestAugmentation(files, config, onUploadProgress) {
  const formData = new FormData()

  files.forEach((file) => formData.append('files', file))
  formData.append('config', JSON.stringify(config))

  const response = await axios.post(`${API_BASE_URL}/augment`, formData, {
    responseType: 'blob',
    onUploadProgress,
  })

  return response.data
}
