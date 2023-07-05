import fetchData from '../../lib/fetch-data'
import styles from './view.module.css'

export const dynamicParams = true;

export async function generateStaticParams() {
  return [1];
}

export default async function ViewPage({ params }) {
  const { page } = params
  const data = await fetchData('')
  
  return (
    <div className={styles.cardBackground}>
      BTC: {data[0].current_price}
    </div>
  )
}