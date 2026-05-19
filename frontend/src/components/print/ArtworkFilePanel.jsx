export default function ArtworkFilePanel({ artwork = {} }) {
  return <div className="rounded-md border bg-white p-4"><p className="font-medium">Artwork Files</p><p className="mt-2 text-sm text-slate-600">Status: {artwork.artworkStatus || 'not_started'}</p></div>;
}
