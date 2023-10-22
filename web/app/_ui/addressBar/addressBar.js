'use client';

import React, { Suspense } from 'react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import styles from './addressBar.module.css'
import { symbols } from '@/app/_utils/symbolUtils';
import Link from 'next/link';
import { Interval } from '@/app/_ui/interval/interval';
import { useChartContext } from '../context/chartContext';

function Params() {
  const router = useRouter()
  const searchParams = useSearchParams();
  const pathname = usePathname();
  if (searchParams === null) {
    return <></>
  }
  const onIntervalUpdated = (interval) => {
    router.push(`${window.location.origin}/${pathname}?interval=${interval}`)
  }
  return searchParams.toString().length !== 0 ? (
    <div className={styles.paramsContainer}>
      ? {Array.from(searchParams.entries()).map(([key, value], index) => {
        return (
          <React.Fragment key={key}>
            {key === "interval" ?
              <Interval currInterval={value} setCurrInterval={onIntervalUpdated} />
              :
              (
                <span className="px-1">
                  <span
                    key={key}
                    className={styles.paramKey}
                  >
                    {key}
                  </span>
                  <span>:</span>
                  <span
                    key={value}
                    className={styles.paramValue}
                  >
                    {value}
                  </span>
                </span>)
            }
          </React.Fragment>
        );
      })}
    </div>
  ) : <></>;
}

export function AddressBar() {
  const router = useRouter()
  const { interval } = useChartContext()
  const pathname = usePathname();
  const params = useParams()
  const symbol = params?.id ?? "BTCUSDT"
  return (
    <div className={styles.addressBarContainer}>
      <div className={styles.addressBarIcon}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <div className={styles.addressBarTextContainer}>
        <div>
          <Link href={"/"}><span className={styles.addressBarSite}>staunq.com</span></Link>
        </div>
        {pathname !== "/" ? (
          <>
            <span className={styles.addressBarPathContainer}>/</span>
            {symbol ?
              <select id="addressBarSymbol" className={styles.symbolSelect} defaultValue={symbol} onChange={(event) => {
                router.push(`${window.location.origin}/view/${event.target.value}?interval=${interval}`)
              }}>
                {symbols.map((value) => {
                  return <option key={value.value} value={value.value}>{value.label}</option>
                })}
              </select> : <></>}
            {/* {pathname
              .split('/')
              .slice(2)
              .map((segment) => {
                return (
                  <React.Fragment key={segment}>
                    <span>
                      <span
                        key={segment}
                        className={styles.addressBarPath}
                      >
                        {segment}
                      </span>
                    </span>

                    <span className={styles.addressBarPathDivider}>/</span>
                  </React.Fragment>
                );
              })} */}
          </>
        ) : null}

        <Suspense>
          <Params />
        </Suspense>
      </div>
    </div>
  );
}