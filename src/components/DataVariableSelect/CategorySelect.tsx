import React from 'react';
import type { CategoryID } from '../../Metadata.types';

type Props = {
  onChange: (categories: CategoryID[]) => void;
};

export default function CategorySelect({}: Props) {
  return <div>CategorySelect</div>;
}
