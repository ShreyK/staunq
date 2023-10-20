import { intervalsOptions } from './symbolUtils'
import styles from './interval.module.css'
import { intervals } from '@/app/_utils/symbolUtils'
export async function Interval({ currInterval, setCurrInterval }) {

    let options = intervalsOptions

    return (
        <label>Interval <br />
            <select id="interval" className={styles.minWidth} defaultValue={currInterval} onChange={(event) => {
                setCurrInterval(intervals[event.target.value])
            }}>
                {options.map((value) => {
                    return <option key={value.value} value={value.value}>{value.label}</option>
                })}
            </select>
        </label>
    )
}
