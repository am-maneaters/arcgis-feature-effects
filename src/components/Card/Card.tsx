import React from 'react';

type Props = { children?: React.ReactNode };

export default function Card({ children }: Props) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="rounded-md drop-shadow aspect-auto h-60 w-96 p-2 bg-white m-4">
        {children}
      </div>
    </div>
  );
}
