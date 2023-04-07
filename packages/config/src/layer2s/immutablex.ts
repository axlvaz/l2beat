import { EthereumAddress, ProjectId, UnixTime } from '@l2beat/shared'

import { ProjectDiscovery } from '../discovery/ProjectDiscovery'
import { getCommittee } from '../discovery/starkware/getCommittee'
import { getProxyGovernance } from '../discovery/starkware/getProxyGovernance'
import {
  delayDescriptionFromSeconds,
  delayDescriptionFromString,
} from '../utils/delayDescription'
import { formatSeconds } from '../utils/formatSeconds'
import {
  CONTRACTS,
  DATA_AVAILABILITY,
  EXITS,
  FORCE_TRANSACTIONS,
  makeBridgeCompatible,
  NEW_CRYPTOGRAPHY,
  NUGGETS,
  OPERATOR,
  RISK_VIEW,
  SHARP_VERIFIER_CONTRACT,
  STATE_CORRECTNESS,
} from './common'
import { Layer2 } from './types'

const discovery = new ProjectDiscovery('immutablex')

const delaySeconds = discovery.getContractUpgradeabilityParam(
  'StarkExchange',
  'upgradeDelay',
)
const delay = formatSeconds(delaySeconds)

export const immutablex: Layer2 = {
  type: 'layer2',
  id: ProjectId('immutablex'),
  display: {
    name: 'Immutable X',
    slug: 'immutablex',
    description:
      'Immutable X claims to be the first Layer 2 for NFTs on Ethereum. It promises zero gas fees, instant trades and scalability for games, applications, marketplaces, without compromise.',
    purpose: 'NFT, Exchange',
    links: {
      websites: ['https://www.immutable.com/'],
      apps: ['https://market.x.immutable.com/'],
      documentation: ['https://docs.starkware.co/starkex-docs-v2/'],
      explorers: ['https://immutascan.io/'],
      repositories: ['https://github.com/starkware-libs/starkex-contracts'],
      socialMedia: [
        'https://medium.com/@immutablex',
        'https://twitter.com/Immutable',
      ],
    },
    activityDataSource: 'Closed API',
  },
  config: {
    associatedTokens: ['IMX'],
    escrows: [
      discovery.getEscrowDetails({
        identifier: 'StarkExchange',
        sinceTimestamp: new UnixTime(1615389188),
        tokens: ['ETH', 'IMX', 'USDC', 'OMI'],
        description: 'Main StarkEx contract, used also as an escrow.',
      }),
    ],
    transactionApi: {
      type: 'starkex',
      product: 'immutable',
      sinceTimestamp: new UnixTime(1615389188),
      resyncLastDays: 7,
    },
  },
  riskView: makeBridgeCompatible({
    stateValidation: RISK_VIEW.STATE_ZKP_ST,
    dataAvailability: RISK_VIEW.DATA_EXTERNAL_DAC,
    upgradeability: RISK_VIEW.UPGRADE_DELAY(delay),
    sequencerFailure: RISK_VIEW.SEQUENCER_STARKEX_SPOT,
    validatorFailure: RISK_VIEW.VALIDATOR_ESCAPE_STARKEX_NFT,
    destinationToken: RISK_VIEW.CANONICAL,
    validatedBy: RISK_VIEW.VALIDATED_BY_ETHEREUM,
  }),
  technology: {
    provider: 'StarkEx',
    category: 'Validium',
    stateCorrectness: STATE_CORRECTNESS.STARKEX_VALIDITY_PROOFS,
    newCryptography: NEW_CRYPTOGRAPHY.ZK_STARKS,
    dataAvailability: DATA_AVAILABILITY.STARKEX_OFF_CHAIN,
    operator: OPERATOR.STARKEX_OPERATOR,
    forceTransactions: FORCE_TRANSACTIONS.STARKEX_SPOT_WITHDRAW,
    exitMechanisms: EXITS.STARKEX_NFT,
  },
  contracts: {
    addresses: [
      discovery.getMainContractDetails('StarkExchange'),
      discovery.getMainContractDetails(
        'Committee',
        'Data Availability Committee (DAC) contract verifying data availability claim from DAC Members (via multisig check).',
      ),
      SHARP_VERIFIER_CONTRACT,
    ],
    risks: [CONTRACTS.UPGRADE_WITH_DELAY_RISK(delay)],
  },
  permissions: [
    {
      name: 'Governor',
      accounts: getProxyGovernance(discovery, 'StarkExchange'),
      description:
        'Can upgrade implementation of the system, potentially gaining access to all funds stored in the bridge. ' +
        delayDescriptionFromString(delay),
    },
    getCommittee(discovery),
    {
      name: 'SHARP Verifier Governor',
      accounts: [
        {
          address: EthereumAddress(
            '0x3DE55343499f59CEB3f1dE47F2Cd7Eab28F2F5C6',
          ),
          type: 'EOA',
        },
      ],
      description:
        'Can upgrade implementation of SHARP Verifier, potentially with code approving fraudulent state. ' +
        // @todo
        // This should be coming from discovery, but it's not available yet.
        // because sorare discovery is not detecting the starkware diamond
        delayDescriptionFromSeconds(2419200),
    },
    {
      name: 'Operators',
      accounts: discovery.getPermissionedAccountsList(
        'StarkExchange',
        'OPERATORS',
      ),
      description:
        'Allowed to update the state. When the Operator is down the state cannot be updated.',
    },
  ],
  milestones: [
    {
      name: 'Trading is live on Immutable X Marketplace',
      link: 'https://twitter.com/immutable/status/1380269810525872131?s=21&t=kyMdE6ORI9f76e8aqizlpg',
      date: '2021-04-08T00:00:00Z',
      description:
        'Immutable has launched the first phase of its Layer 2 scaling protocol.',
    },
    {
      name: 'IMX Token introduced',
      link: 'https://www.immutable.com/blog/introducing-imx-to-power-ethereums-first-layer-2-for-nfts',
      date: '2022-06-29T00:00:00Z',
      description:
        'Immutable announce IMX, the native ERC-20 utility token of Immutable X.',
    },
  ],
  knowledgeNuggets: [...NUGGETS.STARKWARE],
}
