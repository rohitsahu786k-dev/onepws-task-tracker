import ContentItemCard from './ContentItemCard';

export default function ContentCalendarGrid({ items = [], onOpen }) {
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => <ContentItemCard key={item._id} item={item} onOpen={onOpen} />)}</div>;
}
