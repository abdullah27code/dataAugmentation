function Toggle({ label, value, onChange, disabled }) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs">
      <span>{label}</span>
      <input type="checkbox" checked={value} onChange={onChange} disabled={disabled} className="h-4 w-4" />
    </label>
  )
}

export default function Controls({ config, setConfig, disabled, onClearOptions, onSelectAllOptions }) {
  const update = (key, value) => setConfig((prev) => ({ ...prev, [key]: value }))

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Augmentation Options</h2>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onSelectAllOptions}
          disabled={disabled}
          className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Select All
        </button>
        <button
          type="button"
          onClick={onClearOptions}
          disabled={disabled}
          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Clear All
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white px-2 py-2">
        <label className="mb-1 block text-xs">Rotate ({config.rotation}°)</label>
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

      <div className="rounded-lg border border-slate-200 bg-white px-2 py-2">
        <label className="mb-1 block text-xs">Noise Intensity ({Math.round((config.noise_intensity || 0) * 100)}%)</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={config.noise_intensity ?? 0.5}
          onChange={(e) => update('noise_intensity', Number(e.target.value))}
          disabled={disabled}
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Toggle label="Flip" value={config.horizontal_flip} onChange={(e) => update('horizontal_flip', e.target.checked)} disabled={disabled} />
        <Toggle label="V Flip" value={config.vertical_flip} onChange={(e) => update('vertical_flip', e.target.checked)} disabled={disabled} />
        <Toggle label="Brightness" value={config.brightness_contrast} onChange={(e) => update('brightness_contrast', e.target.checked)} disabled={disabled} />
        <Toggle label="Noise" value={config.gaussian_noise} onChange={(e) => update('gaussian_noise', e.target.checked)} disabled={disabled} />
        <Toggle label="Blur" value={config.blur} onChange={(e) => update('blur', e.target.checked)} disabled={disabled} />
        <Toggle label="M Blur" value={config.motion_blur} onChange={(e) => update('motion_blur', e.target.checked)} disabled={disabled} />
        <Toggle label="Sharpen" value={config.sharpen} onChange={(e) => update('sharpen', e.target.checked)} disabled={disabled} />
        <Toggle label="Color" value={config.color_jitter} onChange={(e) => update('color_jitter', e.target.checked)} disabled={disabled} />
        <Toggle label="Gamma" value={config.random_gamma} onChange={(e) => update('random_gamma', e.target.checked)} disabled={disabled} />
        <Toggle label="RGB Shift" value={config.rgb_shift} onChange={(e) => update('rgb_shift', e.target.checked)} disabled={disabled} />
        <Toggle label="Shuffle" value={config.channel_shuffle} onChange={(e) => update('channel_shuffle', e.target.checked)} disabled={disabled} />
        <Toggle label="Perspective" value={config.perspective} onChange={(e) => update('perspective', e.target.checked)} disabled={disabled} />
        <Toggle label="Elastic" value={config.elastic_transform} onChange={(e) => update('elastic_transform', e.target.checked)} disabled={disabled} />
        <Toggle label="Grid Distort" value={config.grid_distortion} onChange={(e) => update('grid_distortion', e.target.checked)} disabled={disabled} />
        <Toggle label="Dropout" value={config.coarse_dropout} onChange={(e) => update('coarse_dropout', e.target.checked)} disabled={disabled} />
      </div>
    </section>
  )
}
