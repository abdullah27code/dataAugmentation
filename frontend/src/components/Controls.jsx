function Toggle({ label, value, onChange, disabled }) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
      <span>{label}</span>
      <input type="checkbox" checked={value} onChange={onChange} disabled={disabled} className="h-4 w-4" />
    </label>
  )
}

export default function Controls({ config, setConfig, disabled, onClearOptions }) {
  const update = (key, value) => setConfig((prev) => ({ ...prev, [key]: value }))

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Augmentation Options</h2>

      <Toggle label="Flip" value={config.horizontal_flip} onChange={(e) => update('horizontal_flip', e.target.checked)} disabled={disabled} />
      <Toggle label="Vertical Flip" value={config.vertical_flip} onChange={(e) => update('vertical_flip', e.target.checked)} disabled={disabled} />

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
      <Toggle label="Motion Blur" value={config.motion_blur} onChange={(e) => update('motion_blur', e.target.checked)} disabled={disabled} />
      <Toggle label="Sharpen" value={config.sharpen} onChange={(e) => update('sharpen', e.target.checked)} disabled={disabled} />
      <Toggle label="Color Jitter" value={config.color_jitter} onChange={(e) => update('color_jitter', e.target.checked)} disabled={disabled} />
      <Toggle label="Random Gamma" value={config.random_gamma} onChange={(e) => update('random_gamma', e.target.checked)} disabled={disabled} />
      <Toggle label="RGB Shift" value={config.rgb_shift} onChange={(e) => update('rgb_shift', e.target.checked)} disabled={disabled} />
      <Toggle label="Channel Shuffle" value={config.channel_shuffle} onChange={(e) => update('channel_shuffle', e.target.checked)} disabled={disabled} />
      <Toggle label="Perspective" value={config.perspective} onChange={(e) => update('perspective', e.target.checked)} disabled={disabled} />
      <Toggle
        label="Elastic Transform"
        value={config.elastic_transform}
        onChange={(e) => update('elastic_transform', e.target.checked)}
        disabled={disabled}
      />
      <Toggle
        label="Grid Distortion"
        value={config.grid_distortion}
        onChange={(e) => update('grid_distortion', e.target.checked)}
        disabled={disabled}
      />
      <Toggle
        label="Coarse Dropout"
        value={config.coarse_dropout}
        onChange={(e) => update('coarse_dropout', e.target.checked)}
        disabled={disabled}
      />

      <button
        type="button"
        onClick={onClearOptions}
        disabled={disabled}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Clear All Options
      </button>
    </section>
  )
}
