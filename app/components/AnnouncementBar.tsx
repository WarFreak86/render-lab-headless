export function AnnouncementBar({
  message = 'Collector editions, new releases and studio notes.',
}: {
  message?: React.ReactNode;
}) {
  return (
    <div className="announcement-bar" role="region" aria-label="Announcement">
      <p>{message}</p>
    </div>
  );
}
