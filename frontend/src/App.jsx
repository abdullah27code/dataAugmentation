import { useMemo, useState } from 'react'
import ImageUploader from './components/ImageUploader'
import PreviewGrid from './components/PreviewGrid'
import SettingsPanel from './components/SettingsPanel'
import { requestAugmentation } from './lib/api'

function downloadBlob(blob, filename) {
  const href = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(href)
}

export default function App() {
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [progress, setProgress] = useState(0)
  const [zipBlob, setZipBlob] = useState(null)

  const [config, setConfig] = useState({
    horizontal_flip: true,
    rotation: 15,
    brightness_contrast: true,
    gaussian_noise: false,
    blur: false,
    augmentations_per_image: 5,
    test_split: 0.2,
  })

  const canGenerate = useMemo(() => files.length > 0 && !loading, [files.length, loading])

  const handleGenerate = async () => {
    if (files.length === 0) {
      setError('Please upload at least one image.')
      return
    }

    if (files.length > 10) {
      setError('Maximum 10 images allowed.')
      return
    }

    setError('')
    setSuccess(false)
    setLoading(true)
    setProgress(5)

    try {
      const blob = await requestAugmentation(files, config, (event) => {
        if (!event.total) return
        const uploadProgress = Math.round((event.loaded / event.total) * 40)
        setProgress(Math.max(uploadProgress, 10))
      })

      setProgress(100)
      setZipBlob(blob)
      setSuccess(true)
    } catch (requestError) {
      const detail = requestError?.response?.data
      if (detail instanceof Blob) {
        const text = await detail.text()
        setError(`Failed to process images: ${text}`)
      } else {
        setError('Failed to process images. Please try again.')
      }
    } finally {
      setLoading(false)
      setTimeout(() => setProgress(0), 800)
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-4 md:p-8">
      <header className="mb-6 rounded-xl bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">AI Data Augmentation Tool</h1>
        <p className="mt-1 text-slate-600">Upload images, choose transforms, and download a production-ready dataset ZIP.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-[1fr_350px]">
        <section className="space-y-5">
          <ImageUploader files={files} setFiles={setFiles} error={error} setError={setError} />
          <PreviewGrid files={files} />
        </section>

        <section className="space-y-4">
          <SettingsPanel config={config} setConfig={setConfig} />

          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {loading ? 'Generating…' : 'Generate Augmented Dataset'}
          </button>

          {loading && (
            <div className="rounded-lg border bg-white p-3">
              <p className="mb-2 text-sm text-slate-600">Processing images…</p>
              <div className="h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {success && zipBlob && (
            <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-sm font-medium text-emerald-700">Dataset generated successfully.</p>
              <button
                onClick={() => downloadBlob(zipBlob, 'augmented_dataset.zip')}
                className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
              >
                Download Result ZIP
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
