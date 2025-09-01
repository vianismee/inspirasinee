const formatTimeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date(); // Waktu saat ini

  const diffInMilliseconds = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMilliseconds / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInMonths = Math.floor(diffInDays / 30.44); // Rata-rata hari dalam sebulan
  const diffInYears = Math.floor(diffInDays / 365.25); // Rata-rata hari dalam setahun

  if (diffInYears > 0) {
    return `${diffInYears} tahun lalu`;
  } else if (diffInMonths > 0) {
    return `${diffInMonths} bulan lalu`;
  } else if (diffInDays > 0) {
    return `${diffInDays} hari lalu`;
  } else if (diffInHours > 0) {
    return `${diffInHours} jam lalu`;
  } else if (diffInMinutes > 0) {
    return `${diffInMinutes} menit lalu`;
  } else {
    return "Baru saja"; // Kurang dari satu menit
  }
};

export default formatTimeAgo;
