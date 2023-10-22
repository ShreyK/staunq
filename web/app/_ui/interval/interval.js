'use client'
import { intervalsOptions } from '@/app/_utils/symbolUtils'
import styles from './interval.module.css'
import { intervals } from '@/app/_utils/symbolUtils'
import { useParams, useRouter } from 'next/navigation';
import { useChartContext } from '../context/chartContext';
export async function Interval({ currInterval, setCurrInterval }) {
    const { symbol } = useChartContext();
    const router = useRouter();
    let options = intervalsOptions
    const onChange = (event) => {
        router.push(`${window.location.origin}/view/${symbol}?interval=${intervals[event.target.value]}`)
    }
    return (
        <label>Interval:
            <select id="interval" className={styles.minWidth} defaultValue={currInterval} onChange={onChange}>
                {options.map((value) => {
                    return <option key={value.value} value={value.value}>{value.label}</option>
                })}
            </select>
        </label>
    )
}
