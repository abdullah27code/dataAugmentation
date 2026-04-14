import { useEffect, useMemo, useState } from 'react'
import UploadBox from './components/UploadBox'
import PreviewGrid from './components/PreviewGrid'
import Controls from './components/Controls'
import { requestAugmentation, requestPreview } from './lib/api'

const DEFAULT_CONFIG = {
  horizontal_flip: true,
  vertical_flip: false,
  rotation: 15,
  brightness_contrast: true,
  gaussian_noise: false,
  blur: false,
  motion_blur: false,
  sharpen: false,
  color_jitter: false,
  random_gamma: false,
  rgb_shift: false,
  channel_shuffle: false,
  perspective: false,
  elastic_transform: false,
  grid_distortion: false,
  coarse_dropout: false,
  augmentations_per_image: 5,
  test_split: 0.2,
}

export default function App() {
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [previewMap, setPreviewMap] = useState({})
  const [zipBlob, setZipBlob] = useState(null)

  const [config, setConfig] = useState(DEFAULT_CONFIG)

  const canGenerate = useMemo(() => files.length > 0 && !loading, [files.length, loading])

  useEffect(() => {
    setZipBlob(null)
    setPreviewMap((previous) => {
      const allowed = new Set(files.map((file) => file.name))
      return Object.fromEntries(Object.entries(previous).filter(([name]) => allowed.has(name)))
    })
  }, [files])

  const handlePreview = async () => {
    if (files.length === 0) {
      setError('Please upload at least one image.')
      return
    }

    setError('')
    setSuccessMessage('')
    setLoading(true)
    setZipBlob(null)

    try {
      const previews = await requestPreview(files, config)
      const mappedPreviews = previews.reduce((accumulator, item) => {
        accumulator[item.file_name] = item.preview_data_uri
        return accumulator
      }, {})
      setPreviewMap(mappedPreviews)
      setSuccessMessage('Önizlemeler hazır. İndirilebilir ZIP üretmek için "Generate ZIP" düğmesine basın.')
    } catch (requestError) {
      setSuccessMessage('')
      setError(requestError?.response?.data?.detail || 'Preview oluşturulamadı. Tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateZip = async () => {
    if (files.length === 0) {
      setError('Please upload at least one image.')
      return
    }

    setError('')
    setSuccessMessage('')
    setLoading(true)

    try {
      const blob = await requestAugmentation(files, config)
      setZipBlob(blob)
      setSuccessMessage('ZIP hazır. İndirmek için "Download ZIP" düğmesine basın.')
    } catch (requestError) {
      setSuccessMessage('')
      const detail = requestError?.response?.data
      if (detail instanceof Blob) {
        const text = await detail.text()
        setError(text || 'Failed to generate augmentation output.')
      } else {
        setError('Failed to generate augmentation output. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!zipBlob) return
    const url = URL.createObjectURL(zipBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'augmented_dataset.zip'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const handleClearOptions = () => {
    setConfig((previous) => ({
      ...previous,
      horizontal_flip: false,
      vertical_flip: false,
      rotation: 0,
      brightness_contrast: false,
      gaussian_noise: false,
      blur: false,
      motion_blur: false,
      sharpen: false,
      color_jitter: false,
      random_gamma: false,
      rgb_shift: false,
      channel_shuffle: false,
      perspective: false,
      elastic_transform: false,
      grid_distortion: false,
      coarse_dropout: false,
    }))
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <header className="mb-8 border-b border-slate-100 pb-5">
          <h1 className="text-2xl font-bold md:text-3xl">AI Data Augmentation Tool</h1>
          <p className="mt-2 text-sm text-slate-600">Upload images, select augmentations, and download your generated dataset ZIP.</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <section className="space-y-5">
            <UploadBox files={files} setFiles={setFiles} error={error} setError={setError} disabled={loading} />
            <PreviewGrid files={files} setFiles={setFiles} previewMap={previewMap} disabled={loading} />
          </section>

          <section className="space-y-4">
            <Controls config={config} setConfig={setConfig} disabled={loading} onClearOptions={handleClearOptions} />

            <button
              type="button"
              onClick={handlePreview}
              disabled={!canGenerate}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {loading ? 'Generating...' : 'Generate Preview'}
            </button>

            <button
              type="button"
              onClick={handleGenerateZip}
              disabled={!canGenerate}
              className="w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {loading ? 'Generating...' : 'Generate ZIP'}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={!zipBlob || loading}
              className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              Download ZIP
            </button>

            {loading && (
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-blue-700" />
                  Processing images, please wait...
                </span>
              </div>
            )}

            {successMessage && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</p>}
            {error && !loading && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          </section>
        </div>
      </div>
    </main>
  )
}
