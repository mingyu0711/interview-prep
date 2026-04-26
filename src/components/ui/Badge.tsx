interface BadgeProps {
  label: string
  className?: string
}

export default function Badge({ label, className = '' }: BadgeProps) {
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${className}`}>
      {label}
    </span>
  )
}
