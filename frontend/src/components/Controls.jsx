function Toggle({ label, value, onChange, disabled }) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
      <span>{label}</span>
      <input type="checkbox" checked={value} onChange={onChange} disabled={disabled} className="h-4 w-4" />
    </label>
  )
}

export default function Controls({ config, setConfig, disabled }) {
  const update = (key, value) => setConfig((prev) => ({ ...prev, [key]: value }))

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Augmentation Options</h2>

      <Toggle label="Flip" value={config.horizontal_flip} onChange={(e) => update('horizontal_flip', e.target.checked)} disabled={disabled} />

      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
        <label className="mb-2 block text-sm">Rotate ({config.rotation}°)</label>
        <input
          type="range"
          min="0"
          max="45"
          value={config.rotation}
          onChange={(e) => update('rotation', Number(e.target.value))}
          disabled={disabled}
          className="w-full"
        />
      </div>

      <Toggle
        label="Brightness"
        value={config.brightness_contrast}
        onChange={(e) => update('brightness_contrast', e.target.checked)}
        disabled={disabled}
      />
      <Toggle label="Noise" value={config.gaussian_noise} onChange={(e) => update('gaussian_noise', e.target.checked)} disabled={disabled} />
      <Toggle label="Blur" value={config.blur} onChange={(e) => update('blur', e.target.checked)} disabled={disabled} />
    </section>
  )
}
