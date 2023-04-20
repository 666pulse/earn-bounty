/* eslint-disable no-nested-ternary */
import { Box, Flex, Text, useMediaQuery, VStack } from '@chakra-ui/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { dehydrate, QueryClient, useQuery } from '@tanstack/react-query';
import type { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

// components
import Banner from '../../components/home/Banner';
import NavHome from '../../components/home/NavHome';
import SideBar from '../../components/home/SideBar';
import {
  BountiesCard,
  CategoryBanner,
  GrantsCard,
  JobsCard,
  ListingSection,
} from '../../components/misc/listingsCard';
import type { BountyStatus } from '../../interface/types';
import { TalentStore } from '../../store/talent';
import { userStore } from '../../store/user';
import { fetchAll, fetchBasicInfo } from '../../utils/functions';

const Index: NextPage = () => {
  const router = useRouter();
  const { connected } = useWallet();
  const { talentInfo } = TalentStore();
  const { userInfo } = userStore();
  const listings = useQuery(
    ['all', 'listings', router.query.search ?? '', router.query.filter ?? ''],
    ({ queryKey }) => fetchAll(queryKey[2] as string, queryKey[3] as string)
  );

  const listingBasic = useQuery({
    queryFn: () => fetchBasicInfo(),
    queryKey: ['all', 'basic'],
  });
  console.log(listings.data);

  const [isLessThan1200px] = useMediaQuery('(max-width: 1200px)');
  const [isLessThan850px] = useMediaQuery('(max-width: 850px)');
  const [isLessThan768px] = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    const html = document.querySelector('html');
    try {
      if (isLessThan768px) {
        html!.style.fontSize = '100%';
      } else if (isLessThan850px) {
        html!.style.fontSize = '60%';
      } else if (isLessThan1200px) {
        html!.style.fontSize = '70%';
      } else {
        html!.style.fontSize = '100%';
      }
    } catch (error) {
      console.log(error);
    }
  }, [isLessThan1200px, isLessThan850px, isLessThan768px]);
  const listingsType = [
    'Design',
    'Growth',
    'Content',
    'Frontend Development',
    'Backend Development',
    'Blockchain',
  ];
  return (
    <>
      <NavHome />
      <Flex
        justify={'center'}
        w={'100%'}
        h={'max-content'}
        minH={'100vh'}
        pt={'3.5rem'}
        bg={'white'}
      >
        {router.asPath.includes('search') ? (
          <Box>
            <Flex gap={1} w={['full', 'full', '50rem', '50rem']}>
              <Text color={'#64748B'}>
                Found{' '}
                {(listings.data?.bounty.length as number) +
                  (listings.data?.jobs.length as number) +
                  (listings.data?.grants.length as number)}{' '}
                opportunities matching{' '}
              </Text>
              <Text color={'#1E293B'}>{`'${router.query.search}'`}</Text>
            </Flex>
            <VStack gap={5} mt={'2rem'}>
              {listings.data?.bounty?.map((bounty) => {
                return (
                  <BountiesCard
                    slug={bounty?.bounty.slug as string}
                    status={bounty?.bounty?.status as BountyStatus}
                    amount={bounty?.bounty?.amount}
                    key={bounty?.bounty?.id}
                    sponsor={bounty?.sponsorInfo?.name}
                    due={bounty?.bounty?.deadline}
                    title={bounty?.bounty?.title}
                    logo={bounty?.sponsorInfo?.logo}
                    token={bounty?.bounty?.token}
                  />
                );
              })}

              {listings.data?.jobs?.map((job) => {
                return (
                  <JobsCard
                    orgName={job?.sponsorInfo?.name}
                    logo={job?.sponsorInfo?.logo}
                    description={job?.jobs?.description}
                    max={job?.jobs?.maxSalary}
                    min={job?.jobs?.minSalary}
                    maxEq={job?.jobs?.maxEq}
                    minEq={job?.jobs?.minEq}
                    link={job?.jobs?.link}
                    key={job?.jobs?.id}
                    skills={JSON.parse(job?.jobs?.skills || '[]')}
                    title={job?.jobs?.title}
                  />
                );
              })}

              {listings.data?.grants?.map((grant) => {
                return (
                  <GrantsCard
                    sponsor={grant?.sponsorInfo?.name}
                    logo={grant?.sponsorInfo?.logo}
                    key={grant?.grants?.id}
                    max={grant?.grants?.maxSalary}
                    title={grant?.grants?.title}
                    min={grant?.grants?.minSalary}
                  />
                );
              })}
            </VStack>
          </Box>
        ) : (
          <Box>
            {connected ? (
              userInfo?.talent ? (
                <>
                  <Text
                    color={'#1E293B'}
                    fontFamily={'Domine'}
                    fontSize={'26px'}
                    fontWeight={700}
                  >
                    Welcome back,{talentInfo?.username}
                  </Text>
                </>
              ) : (
                ''
              )
            ) : (
              <>
                <Banner />
              </>
            )}
            {router.query.filter && (
              <CategoryBanner
                type={
                  listingsType.find((type) =>
                    type
                      .toLocaleLowerCase()
                      .includes(router.query.filter as string)
                  ) as string
                }
              />
            )}
            <Box mt={'2rem'}>
              <ListingSection
                type="bounties"
                title="Active Bounties"
                sub="Bite sized tasks for freelancers"
                emoji="/assets/home/emojis/moneyman.png"
              >
                {listings.data?.bounty?.map((bounty) => {
                  return (
                    <BountiesCard
                      slug={bounty?.bounty.slug as string}
                      status={bounty?.bounty?.status as BountyStatus}
                      amount={bounty?.bounty?.amount}
                      key={bounty?.bounty?.id}
                      sponsor={bounty?.sponsorInfo?.name}
                      due={bounty?.bounty?.deadline}
                      title={bounty?.bounty?.title}
                      logo={bounty?.sponsorInfo?.logo}
                      token={bounty?.bounty?.token}
                    />
                  );
                })}
              </ListingSection>
              <ListingSection
                type="jobs"
                title="Jobs"
                sub="Join a high-growth team"
                emoji="/assets/home/emojis/job.png"
              >
                {listings.data?.jobs?.map((job) => {
                  console.log('hello123', job);
                  return (
                    <JobsCard
                      logo={job?.sponsorInfo?.logo}
                      description={job?.jobs?.description}
                      max={job?.jobs?.maxSalary}
                      min={job?.jobs?.minSalary}
                      maxEq={job?.jobs?.maxEq}
                      minEq={job?.jobs?.minEq}
                      orgName={job?.sponsorInfo?.name}
                      link={job?.jobs?.link}
                      key={job?.jobs?.id}
                      skills={JSON.parse(job?.jobs?.skills || '[]')}
                      title={job?.jobs?.title}
                    />
                  );
                })}
              </ListingSection>
              <ListingSection
                type="grants"
                title="Grants"
                sub="Equity-free funding opportunities for builders"
                emoji="/assets/home/emojis/grants.png"
              >
                {listings.data?.grants?.map((grant) => {
                  return (
                    <GrantsCard
                      sponsor={grant?.sponsorInfo?.name}
                      logo={grant?.sponsorInfo?.logo}
                      key={grant?.grants?.id}
                      max={grant?.grants?.maxSalary}
                      title={grant?.grants?.title}
                      min={grant?.grants?.minSalary}
                    />
                  );
                })}
              </ListingSection>
            </Box>
          </Box>
        )}
        {!isLessThan768px && (
          <SideBar
            total={listingBasic.data?.total ?? 0}
            listings={listingBasic.data?.count ?? 0}
            jobs={listings.data?.jobs}
          />
        )}
      </Flex>
    </>
  );
};
export const getServerSideProps: GetServerSideProps = async (context) => {
  const queryClient = new QueryClient();
  const { query } = context;
  try {
    await queryClient.prefetchQuery(['all', 'listings'], () =>
      fetchAll(query.search as string, query.filter as string)
    );
    await queryClient.prefetchQuery(['all', 'basic'], () => fetchBasicInfo());
  } catch (error) {
    console.log(error);
  }
  return {
    props: { dehydratedState: dehydrate(queryClient) },
  };
};

export default Index;
