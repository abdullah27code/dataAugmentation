import { useMemo, useState } from 'react'
import UploadBox from './components/UploadBox'
import PreviewGrid from './components/PreviewGrid'
import Controls from './components/Controls'
import { requestAugmentation } from './lib/api'

function downloadZip(blob, filename = 'augmented_dataset.zip') {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default function App() {
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

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

    setError('')
    setSuccessMessage('')
    setLoading(true)

    try {
      const zipBlob = await requestAugmentation(files, config)
      downloadZip(zipBlob)
      setSuccessMessage('Done! Your augmented ZIP has been downloaded.')
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
            <PreviewGrid files={files} setFiles={setFiles} disabled={loading} />
          </section>

          <section className="space-y-4">
            <Controls config={config} setConfig={setConfig} disabled={loading} />

            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {loading ? 'Generating...' : 'Generate Augmented Dataset'}
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
