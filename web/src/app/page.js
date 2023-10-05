import { Suspense } from 'react'
import styles from './page.module.css'
import fetchData from './lib/fetch-data'

async function Card() {
  const data = await fetchData()

  return (
    <div className={styles.cardBackground}>
      BTC: {data[0].current_price}
    </div>
  )
}

export default function Home() {
  return (
      <main className={styles.main}>
        <a
          className={styles.description}
          href={'/'}
        >
          Staunq
          <p>
            BETA
          </p>
        </a>

        <div className={styles.center}>
          <Suspense fallback={<div>Loading...</div>}>
            <Card />
          </Suspense>
        </div>

        <div className={styles.grid}>
          <a
            href={`/about`}
            className={styles.card}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h2>
              About <span>-&gt;</span>
            </h2>
            <p>Find in-depth information about Staunq features and tools.</p>
          </a>

          <a
            href={`/news`}
            className={styles.card}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h2>
              News <span>-&gt;</span>
            </h2>
            <p>Learn about the different aspects of trading.</p>
          </a>

          <a
            href={`/leaderboard`}
            className={styles.card}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h2>
              Leaderboard <span>-&gt;</span>
            </h2>
            <p>ELO ratings for every trader</p>
          </a>

          <a
            href={`/view/BTC`}
            className={styles.card}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h2>
              Launch <span>-&gt;</span>
            </h2>
            <p>
              Instantly launch the product as soon as you register/login
            </p>
          </a>
        </div>
      </main>
  )
}
