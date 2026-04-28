import { ArrowRight, BadgeDollarSign, Boxes, Search } from 'lucide-react'
import styles from './page.module.css'

const pillars = [
  {
    title: 'Search comps',
    body: 'Start with eBay sold listings and normalize resale signals into one sourcing view.',
    icon: Search,
  },
  {
    title: 'Calculate profit',
    body: 'Estimate fees, shipping, item cost, margin, and recommendation thresholds.',
    icon: BadgeDollarSign,
  },
  {
    title: 'Track inventory',
    body: 'Save buys, draft listings, and follow each item through the resale workflow.',
    icon: Boxes,
  },
]

export default function Home() {
  return (
    <main className={styles.shell}>
      <section className={styles.frame}>
        <nav className={styles.nav} aria-label="Main">
          <strong>ThriftIQ</strong>
          <a className={styles.action} href="/api/health">
            Health check
            <ArrowRight size={18} aria-hidden="true" />
          </a>
        </nav>

        <header className={styles.hero}>
          <h1>Know what to buy before you buy it.</h1>
          <p>
            A web-first prototype for resale sourcing intelligence, profit
            decisions, listing generation, and inventory workflow.
          </p>
        </header>

        <div className={styles.grid}>
          {pillars.map((pillar) => {
            const Icon = pillar.icon

            return (
              <article className={styles.card} key={pillar.title}>
                <Icon size={28} aria-hidden="true" />
                <h2>{pillar.title}</h2>
                <p>{pillar.body}</p>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}
