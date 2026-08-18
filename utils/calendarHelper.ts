export const getGoogleCalendarUrl = (
  title: string,
  date: string,
  location: string,
  description: string = ''
) => {
  // Parse '10 November 2026' or similar basic formats, default to next day if parsing fails
  // Since we don't have the exact format in EVENT_DETAILS, we'll try a rough parse
  // For production, consider passing precise ISO dates or using a library like date-fns
  const parsedDate = new Date(date);
  const startDate = !isNaN(parsedDate.getTime()) ? parsedDate : new Date();
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // assume 2 hours

  const formatDateTime = (d: Date) => {
    return d.toISOString().replace(/-|:|\.\d\d\d/g, '');
  };

  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.append('action', 'TEMPLATE');
  url.searchParams.append('text', title);
  url.searchParams.append('dates', `${formatDateTime(startDate)}/${formatDateTime(endDate)}`);
  url.searchParams.append('details', description);
  url.searchParams.append('location', location);
  
  return url.toString();
};

export const downloadIcsFile = (
  title: string,
  date: string,
  location: string,
  description: string = ''
) => {
  const parsedDate = new Date(date);
  const startDate = !isNaN(parsedDate.getTime()) ? parsedDate : new Date();
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

  const formatDateTime = (d: Date) => {
    return d.toISOString().replace(/-|:|\.\d\d\d/g, '');
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${formatDateTime(startDate)}`,
    `DTEND:${formatDateTime(endDate)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', 'undangan-pelantikan-ika-uii.ics');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
