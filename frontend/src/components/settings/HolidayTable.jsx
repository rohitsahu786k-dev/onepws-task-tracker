const HolidayTable = ({ holidays = [] }) => (
  <table className="min-w-full text-sm">
    <tbody>{holidays.map((holiday) => <tr key={holiday._id}><td className="px-3 py-2">{holiday.name}</td><td className="px-3 py-2">{new Date(holiday.date).toLocaleDateString()}</td></tr>)}</tbody>
  </table>
);

export default HolidayTable;
