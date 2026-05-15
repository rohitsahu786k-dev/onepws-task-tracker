const isWeekend = (date) => [0, 6].includes(new Date(date).getDay());

const addWorkingDays = (date, days) => {
  const result = new Date(date);
  let remaining = Number(days) || 0;
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    if (!isWeekend(result)) remaining -= 1;
  }
  return result;
};

module.exports = { isWeekend, addWorkingDays };
