// group into day-month-year
export default inputArr => {
  const monthGroups = inputArr.reduce((groups, item) => {
    let formattedDate = ''

    const date = new Date(item.date)
    const day = date.toLocaleDateString('en-US', { day: 'numeric' })
    const month = date.toLocaleDateString('en-US', { month: 'long' })
    const year = date.toLocaleDateString('en-US', { year: 'numeric' })

    formattedDate = `${day} ${month} ${year}`

    if (!item.date) formattedDate = 'No date'

    // const groupName = item.location

    if (!groups[formattedDate]) {
      groups[formattedDate] = [];
    }
    groups[formattedDate].push(item)
    return groups;
  }, {});

  const groupArrays = Object.keys(monthGroups).map((date) => {
    // for description we're just gonna get the first item in the monthGroup which has a location
    let description = ''
    monthGroups[date].some(i => {
      if (i.location) description = i.location
    })

    return {
      date,
      description,
      items: monthGroups[date]
    };
  });

  return groupArrays
}
