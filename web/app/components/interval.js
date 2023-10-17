import Select, { defaultTheme } from 'react-select'
import { intervalsOptions } from './symbolUtils'

import styles from './interval.module.css'
export async function Interval({ currInterval, setCurrInterval }) {

    let options = intervalsOptions

    return (
        <Select className={styles.minWidth} theme={{ ...defaultTheme, colors: { primary: 'black', primary75: 'gray', primary: 'lightgray', neutral0: 'black', neutra90: 'white' } }} options={options} defaultValue={{ value: currInterval, label: currInterval }} name={"symbols"} id={"symbolSelect"} onChange={(e) => {
            setCurrInterval(e.value)
        }} />
    )
}
