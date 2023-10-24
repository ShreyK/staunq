'use client'
import { useChartContext } from '@/app/_ui/context/chartContext';
import ChartActions from '@/app/_ui/chartActions/chartActions';
import { BaseChart } from './basechart';
export async function ChartWrapper() {
  const { symbol, trades, interval } = useChartContext();

  if (!symbol || !trades || !interval) {
    return <></>
  }
  return (
    <>
      <ChartActions />
      <BaseChart />
    </>
  )
}
