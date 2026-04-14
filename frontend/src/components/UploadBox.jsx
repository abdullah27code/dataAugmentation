const MAX_FILES = 10
const ACCEPTED_TYPES = ['image/jpeg', 'image/png']

export default function UploadBox({ files, setFiles, error, setError, disabled }) {
  const addFiles = (incomingFiles) => {
    if (!incomingFiles.length) {
      return
    }

    const valid = incomingFiles.filter((file) => ACCEPTED_TYPES.includes(file.type))
    if (valid.length !== incomingFiles.length) {
      setError('Only JPG and PNG files are supported.')
      return
    }

    const existingKeys = new Set(files.map((file) => `${file.name}-${file.size}-${file.lastModified}`))
    const uniqueIncoming = valid.filter((file) => !existingKeys.has(`${file.name}-${file.size}-${file.lastModified}`))
    const nextFiles = [...files, ...uniqueIncoming]

    if (nextFiles.length > MAX_FILES) {
      setError('You can upload a maximum of 10 images.')
      return
    }

    setError('')
    setFiles(nextFiles)
  }

  const handleFileInput = (event) => {
    addFiles(Array.from(event.target.files || []))
    event.target.value = ''
  }

  const handleDrop = (event) => {
    event.preventDefault()
    if (disabled) {
      return
    }

    addFiles(Array.from(event.dataTransfer.files || []))
  }

  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center"
    >
      <p className="text-base font-semibold text-slate-700">Drag & Drop images here</p>
      <p className="mt-1 text-sm text-slate-500">or select from your computer (JPG/PNG, max 10)</p>

      <label className="mt-4 inline-flex cursor-pointer rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
        Choose Files
        <input
          type="file"
          accept="image/jpeg,image/png"
          multiple
          onChange={handleFileInput}
          disabled={disabled}
          className="sr-only"
        />
      </label>

      <p className="mt-3 text-xs text-slate-500">Selected: {files.length} / {MAX_FILES}</p>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  )
}
