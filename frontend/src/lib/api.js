import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

function buildFormData(files, config) {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))
  formData.append('config', JSON.stringify(config))
  return formData
}

export async function requestAugmentation(files, config) {
  const response = await axios.post(`${API_BASE_URL}/augment`, buildFormData(files, config), {
    responseType: 'blob',
  })

  return response.data
}

export async function requestPreview(files, config) {
  const response = await axios.post(`${API_BASE_URL}/preview`, buildFormData(files, config))
  return response.data?.previews || []
}
