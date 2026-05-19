const platforms = ['linkedin', 'instagram', 'facebook', 'youtube', 'website', 'email', 'whatsapp', 'print'];

export default function PlatformSelector({ value = [], onChange }) {
  const toggle = (platform) => onChange?.(value.includes(platform) ? value.filter((item) => item !== platform) : [...value, platform]);
  return <div className="flex flex-wrap gap-2">{platforms.map((platform) => <button type="button" key={platform} onClick={() => toggle(platform)} className={`rounded-md border px-3 py-1.5 text-sm ${value.includes(platform) ? 'border-primary bg-primary text-white' : 'border-slate-300 bg-white'}`}>{platform}</button>)}</div>;
}
