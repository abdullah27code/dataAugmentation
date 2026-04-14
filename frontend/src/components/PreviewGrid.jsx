import { useEffect, useState } from 'react'

export default function PreviewGrid({ files, setFiles, previewMap, disabled }) {
  const [previews, setPreviews] = useState([])

  useEffect(() => {
    const mapped = files.map((file) => ({
      key: `${file.name}-${file.size}-${file.lastModified}`,
      name: file.name,
      url: URL.createObjectURL(file),
    }))

    setPreviews(mapped)

    return () => {
      mapped.forEach((item) => URL.revokeObjectURL(item.url))
    }
  }, [files])

  const handleRemove = (targetKey) => {
    setFiles((previousFiles) => previousFiles.filter((file) => `${file.name}-${file.size}-${file.lastModified}` !== targetKey))
  }

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Preview</h2>

      {previews.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">No images uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {previews.map((item) => (
            <article key={item.key} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <img src={item.url} alt={item.name} className="h-36 w-full object-cover" />
              <div className="flex items-center justify-between gap-2 p-2">
                <p className="truncate text-xs text-slate-600">{item.name}</p>
                <button
                  type="button"
                  onClick={() => handleRemove(item.key)}
                  disabled={disabled}
                  className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Remove
                </button>
              </div>
              {previewMap[item.name] ? (
                <div className="border-t border-slate-200 bg-slate-50 p-2">
                  <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">Augmented sample</p>
                  <img src={previewMap[item.name]} alt={`${item.name} augmented preview`} className="h-24 w-full rounded object-cover" />
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
