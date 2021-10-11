import { UnixTime } from '../../model/UnixTime'
import { IBlockNumberRepository } from '../../peripherals/database/BlockNumberRepository'
import { IEtherscanClient } from '../../peripherals/etherscan'

export class ReportRangeService {
  private cache = new Map<number, bigint>()
  constructor(
    private etherscanClient: IEtherscanClient,
    private blockNumberRepository: IBlockNumberRepository
  ) {}

  async initialize() {
    const records = await this.blockNumberRepository.getAll()
    for (const record of records) {
      this.cache.set(record.timestamp.toNumber(), record.blockNumber)
    }
  }

  async getRange(timestamp: UnixTime) {
    let current = timestamp.toStartOf('hour')
    const timestamps: UnixTime[] = []
    for (let i = 0; i < 24; i++) {
      timestamps.push(current)
      current = current.add(-1, 'hours')
    }
    return Promise.all(
      timestamps.map(async (timestamp) => ({
        timestamp,
        blockNumber: await this.getBlockNumber(timestamp),
      }))
    )
  }

  private async getBlockNumber(timestamp: UnixTime) {
    const cached = this.cache.get(timestamp.toNumber())
    if (cached !== undefined) {
      return cached
    }
    const fetched = await this.etherscanClient.getBlockNumberAtOrBefore(
      timestamp
    )
    await this.blockNumberRepository.add({ timestamp, blockNumber: fetched })
    this.cache.set(timestamp.toNumber(), fetched)
    return fetched
  }
}