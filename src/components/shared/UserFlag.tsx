import { useEffect, useState } from 'react';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { countries } from '@/constants/country';
import { cn } from '@/utils/cn';

import 'flag-icons/css/flag-icons.min.css';

type FlagSize =
  | '12px'
  | '14px'
  | '16px'
  | '20px'
  | '24px'
  | '28px'
  | '32px'
  | '36px'
  | '40px'
  | '44px'
  | '52px'
  | '64px';

interface Props {
  location: string;
  size?: FlagSize;
  isCode?: boolean;
}

export function UserFlag({ location, size = '16px', isCode = false }: Props) {
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    if (isCode) {
      setCode(location.toLowerCase());
    } else {
      const country = countries.find(
        (c) => c.name.toLowerCase() === location.toLowerCase(),
      );
      if (country) {
        setCode(country.code);
      }
    }
  }, [location, isCode]);

  const flagStyles = {
    width: size,
    height: size,
  };

  return code === 'balkan' ? (
    <div
      className="flex items-center justify-center rounded-full border border-slate-50 bg-contain"
      style={{
        ...flagStyles,
        backgroundImage: `url('${ASSET_URL}/superteams/logos/balkan.png')`,
      }}
    />
  ) : (
    <div
      className={cn(
        'flex items-center justify-center rounded-full border border-slate-50',
        `fi fi-${code} fis`,
      )}
      style={flagStyles}
    />
  );
}
