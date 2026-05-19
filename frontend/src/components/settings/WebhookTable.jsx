const WebhookTable = ({ items = [] }) => (
  <table className="min-w-full text-sm">
    <tbody>{items.map((item) => <tr key={item._id}><td className="px-3 py-2">{item.name}</td><td className="px-3 py-2">{item.url}</td><td className="px-3 py-2">{item.lastStatus}</td></tr>)}</tbody>
  </table>
);

export default WebhookTable;
