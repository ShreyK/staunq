'use client'
import styles from './chart.module.css'
import { useChartContext } from "../context/chartContext";
import { startTransition } from 'react';

export default async function ChartActions() {
  const { precision, setPrecision, threshold, setThreshold, maxThreshold } = useChartContext();
  const onChange = (e) => startTransition(() => setPrecision(e.target.value))
  const onThresholdChange = (e) => startTransition(() => setThreshold(e.target.value))
  return (
    <div className={styles.chartActions}>
      <label>Precision: {precision} <br />
        <input title='Precision' type={"range"} min="3" max="7" value={precision} onChange={onChange} />
      </label>
      <label>Threshold: {threshold} <br />
        <input title='Threshold' type={"range"} min="0" max={maxThreshold} step={maxThreshold / 100} value={threshold} onChange={onThresholdChange} />
      </label>
    </div>
  )
}