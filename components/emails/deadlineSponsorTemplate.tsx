import React from 'react';

export const DeadlineSponsorEmailTemplate = ({
  name,
  bountyName,
}: {
  name: string;
  bountyName: string;
}) => {
  return (
    <div>
      <p>Hey there {name},</p>
      <p>
        The deadline for the {bountyName} bounty that you listed has expired.
      </p>
      <p>The Superteam Earn Crew 🦸‍♀️🦸‍♂️</p>
    </div>
  );
};
