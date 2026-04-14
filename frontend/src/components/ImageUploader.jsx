import { useDropzone } from 'react-dropzone'

const MAX_FILES = 10

export default function ImageUploader({ files, setFiles, error, setError }) {
  const onDrop = (acceptedFiles, fileRejections) => {
    if (fileRejections.length > 0) {
      setError('Only JPG and PNG images are allowed.')
      return
    }

    const next = [...files, ...acceptedFiles]
    if (next.length > MAX_FILES) {
      setError('You can upload at most 10 images.')
      return
    }

    setError('')
    setFiles(next)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles: MAX_FILES,
  })

  return (
    <div
      {...getRootProps()}
      className={`rounded-xl border-2 border-dashed p-8 text-center transition ${
        isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-white'
      }`}
    >
      <input {...getInputProps()} />
      <p className="text-lg font-medium text-slate-700">Drag & drop images here</p>
      <p className="mt-2 text-sm text-slate-500">or click to browse (JPG, PNG · max 10 files)</p>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </div>
  )
}
