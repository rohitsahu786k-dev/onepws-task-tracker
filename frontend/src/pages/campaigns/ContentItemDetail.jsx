import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import contentItemApi from '../../api/contentItem.api';
import ContentPreview from '../../components/content/ContentPreview';
import ContentApprovalPanel from '../../components/content/ContentApprovalPanel';

export default function ContentItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  useEffect(() => { contentItemApi.get(id).then((res) => setItem(res.data || res.contentItem)).catch(() => setItem(null)); }, [id]);
  if (!item) return <main className="p-6 text-sm text-slate-500">Loading content...</main>;
  return <main className="space-y-4 p-6"><h1 className="text-2xl font-semibold">{item.title}</h1><ContentPreview item={item} /><ContentApprovalPanel item={item} /></main>;
}
