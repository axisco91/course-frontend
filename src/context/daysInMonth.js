export const getDaysInMonth = (year, month) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
  
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
  
    return days;
  }
  