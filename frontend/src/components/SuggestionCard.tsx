import styles from './SuggestionCard.module.css'

interface SuggestionCardProps {
  icon: string
  title: string
  description: string
}

export default function SuggestionCard({ icon, title, description }: SuggestionCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.icon}>{icon}</div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
    </div>
  )
}
