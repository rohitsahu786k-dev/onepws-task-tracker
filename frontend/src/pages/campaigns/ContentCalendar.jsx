import { useEffect, useState } from 'react';
import contentItemApi from '../../api/contentItem.api';
import ContentCalendarMonthView from '../../components/content/ContentCalendarMonthView';

export default function ContentCalendar() {
  const [items, setItems] = useState([]);
  useEffect(() => { contentItemApi.list().then((res) => setItems(res.data || res.contentItems || [])).catch(() => setItems([])); }, []);
  return <main className="space-y-4 p-6"><h1 className="text-2xl font-semibold">Content Calendar</h1><ContentCalendarMonthView items={items} /></main>;
}
