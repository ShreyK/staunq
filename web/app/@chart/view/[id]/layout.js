import { Suspense } from "react";
import { BaseChart } from "@/app/_ui/chart/basechart";
import ChartActions from "@/app/_ui/chartActions/chartActions";

export default function RootLayout({ children }) {
  return (
    <Suspense fallback={<div>Loading</div>}>
      <ChartActions />
      <BaseChart />
      {children}
    </Suspense>
  )
}
