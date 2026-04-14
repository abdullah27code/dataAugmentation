const Toggle = ({ label, checked, onChange }) => (
  <label className="flex items-center justify-between gap-3 rounded-lg border bg-white px-3 py-2 text-sm">
    <span>{label}</span>
    <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4" />
  </label>
)

export default function SettingsPanel({ config, setConfig }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Augmentation Settings</h2>

      <Toggle
        label="Horizontal Flip"
        checked={config.horizontal_flip}
        onChange={(e) => setConfig((prev) => ({ ...prev, horizontal_flip: e.target.checked }))}
      />
      <div className="rounded-lg border bg-white px-3 py-2">
        <label className="mb-2 block text-sm">Rotation ({config.rotation}°)</label>
        <input
          type="range"
          min={0}
          max={45}
          value={config.rotation}
          onChange={(e) => setConfig((prev) => ({ ...prev, rotation: Number(e.target.value) }))}
          className="w-full"
        />
      </div>
      <Toggle
        label="Brightness & Contrast"
        checked={config.brightness_contrast}
        onChange={(e) => setConfig((prev) => ({ ...prev, brightness_contrast: e.target.checked }))}
      />
      <Toggle
        label="Gaussian Noise"
        checked={config.gaussian_noise}
        onChange={(e) => setConfig((prev) => ({ ...prev, gaussian_noise: e.target.checked }))}
      />
      <Toggle
        label="Blur"
        checked={config.blur}
        onChange={(e) => setConfig((prev) => ({ ...prev, blur: e.target.checked }))}
      />

      <div className="rounded-lg border bg-white px-3 py-2">
        <label className="mb-2 block text-sm">Augmentations per image</label>
        <input
          type="number"
          min={1}
          max={30}
          value={config.augmentations_per_image}
          onChange={(e) => setConfig((prev) => ({ ...prev, augmentations_per_image: Number(e.target.value) || 1 }))}
          className="w-full rounded border px-2 py-1"
        />
      </div>

      <div className="rounded-lg border bg-white px-3 py-2">
        <label className="mb-2 block text-sm">Test split ({Math.round(config.test_split * 100)}%)</label>
        <input
          type="range"
          min={0}
          max={0.8}
          step={0.1}
          value={config.test_split}
          onChange={(e) => setConfig((prev) => ({ ...prev, test_split: Number(e.target.value) }))}
          className="w-full"
        />
      </div>
    </div>
  )
}
