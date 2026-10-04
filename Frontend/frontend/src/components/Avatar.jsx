export default function Avatar({ name, size = 'normal', online = false }) {
  const initials = (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <span className={`avatar avatar-${size}`} aria-hidden="true">
      {initials}
      {online && <i className="avatar-presence" />}
    </span>
  )
}
