import { useMemo } from 'react'

export default function PreviewGrid({ files }) {
  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  )

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Preview</h2>
      {files.length === 0 ? (
        <p className="text-sm text-slate-400">No images selected yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {previews.map(({ file, url }) => (
            <div key={`${file.name}-${file.lastModified}`} className="overflow-hidden rounded-lg border bg-white">
              <img src={url} alt={file.name} className="h-32 w-full object-cover" />
              <p className="truncate px-2 py-1 text-xs text-slate-600">{file.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
