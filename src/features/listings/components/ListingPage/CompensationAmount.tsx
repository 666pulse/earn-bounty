import { ArrowRight } from 'lucide-react';
import React from 'react';

import { cn } from '@/utils/cn';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

interface CompensationAmountType {
  compensationType?: 'fixed' | 'range' | 'variable';
  rewardAmount?: number;
  minRewardAsk?: number;
  maxRewardAsk?: number;
  token?: string;
  className?: string;
  style?: React.CSSProperties;
  showUsdSymbol?: boolean;
}

export const CompensationAmount = ({
  compensationType,
  rewardAmount,
  minRewardAsk,
  maxRewardAsk,
  token,
  className,
  style,
  showUsdSymbol,
}: CompensationAmountType) => {
  const Token = () => {
    return <span className="ml-1 text-slate-400">{token}</span>;
  };

  const renderCompensation = () => {
    switch (compensationType) {
      case 'fixed':
        return (
          <>
            <span className="ml-auto">
              {showUsdSymbol ? '$' : ''}
              {formatNumberWithSuffix(rewardAmount!, 2, true)}
            </span>
            <Token />
          </>
        );
      case 'range':
        return (
          <>
            {showUsdSymbol ? '$' : ''}
            {`${formatNumberWithSuffix(minRewardAsk!)}-${formatNumberWithSuffix(maxRewardAsk!)}`}
            <Token />
          </>
        );
      case 'variable':
        if (token) {
          return (
            <>
              {showUsdSymbol ? '$' : ''}
              {token}
            </>
          );
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <>
      <div className={cn('flex', className)} style={style}>
        {renderCompensation()}
      </div>
      {compensationType === 'variable' && !token && (
        <div className="flex items-center gap-0.5 sm:gap-1">
          <span className={className}>Send Quote</span>
          <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </div>
      )}
    </>
  );
};
