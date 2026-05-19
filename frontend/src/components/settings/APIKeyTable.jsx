const APIKeyTable = ({ items = [] }) => (
  <table className="min-w-full text-sm">
    <tbody>{items.map((item) => <tr key={item._id}><td className="px-3 py-2">{item.name}</td><td className="px-3 py-2">{item.keyPrefix}</td><td className="px-3 py-2">{item.status}</td></tr>)}</tbody>
  </table>
);

export default APIKeyTable;
