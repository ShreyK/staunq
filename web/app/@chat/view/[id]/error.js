'use client'
import { useEffect } from "react";

export default function Error({ error }) {
  useEffect(() => {
    // TODO Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <span>{`Chat error: could not update chat data`}</span>
  );
}



