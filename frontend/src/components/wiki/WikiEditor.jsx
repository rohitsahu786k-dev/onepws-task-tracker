import React from 'react';

export const ARTICLE_TYPES = ['sop', 'policy', 'guide', 'faq', 'checklist', 'template', 'brand_guideline', 'process', 'training', 'troubleshooting', 'reference', 'general'];

export default function WikiEditor({ value, onChange, categories = [], onSubmit, saving = false }) {
  const setField = (field, nextValue) => onChange({ ...value, [field]: nextValue });
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2">
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Title</span>
          <input required value={value.title || ''} onChange={(event) => setField('title', event.target.value)} className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm" />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Article Type</span>
          <select value={value.articleType || 'general'} onChange={(event) => setField('articleType', event.target.value)} className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm">
            {ARTICLE_TYPES.map((type) => <option key={type} value={type}>{type.replaceAll('_', ' ')}</option>)}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Category</span>
          <select required value={value.category || ''} onChange={(event) => setField('category', event.target.value)} className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm">
            <option value="">Select category</option>
            {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Visibility</span>
          <select value={value.visibility || 'workspace'} onChange={(event) => setField('visibility', event.target.value)} className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm">
            <option value="workspace">Workspace</option>
            <option value="department">Department</option>
            <option value="private">Private</option>
            <option value="public_internal">Public Internal</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Next Review Date</span>
          <input type="date" value={value.nextReviewDate?.slice?.(0, 10) || ''} onChange={(event) => setField('nextReviewDate', event.target.value)} className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm" />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Summary</span>
          <textarea value={value.summary || ''} onChange={(event) => setField('summary', event.target.value)} rows={2} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Tags</span>
          <input value={(value.tags || []).join(', ')} onChange={(event) => setField('tags', event.target.value.split(',').map((item) => item.trim()).filter(Boolean))} className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm" placeholder="catalogue, sop, marketing" />
        </label>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Content</span>
          <textarea required value={value.content || ''} onChange={(event) => setField('content', event.target.value)} rows={16} className="w-full rounded-md border border-slate-200 px-3 py-2 font-mono text-sm" placeholder="<h2>Purpose</h2><p>Write article content here...</p>" />
        </label>
      </section>

      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
        <button type="submit" disabled={saving} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
          {saving ? 'Saving...' : 'Save Draft'}
        </button>
      </div>
    </form>
  );
}
