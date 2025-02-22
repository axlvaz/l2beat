import { EthereumAddress } from '@l2beat/shared'
import { utils } from 'ethers'

import { DiscoveryProvider } from '../../provider/DiscoveryProvider'
import { DiscoveryLogger } from '../../utils/DiscoveryLogger'
import { Handler, HandlerResult } from '../Handler'
import { callMethod } from '../utils/callMethod'
import { toFunctionFragment } from '../utils/toFunctionFragment'

export class SimpleMethodHandler implements Handler {
  readonly field: string
  readonly dependencies = []
  private readonly fragment: utils.FunctionFragment
  constructor(
    fragment: string | utils.FunctionFragment,
    readonly logger: DiscoveryLogger,
  ) {
    this.fragment =
      typeof fragment === 'string' ? toFunctionFragment(fragment) : fragment
    this.field = this.fragment.name
  }

  async execute(
    provider: DiscoveryProvider,
    address: EthereumAddress,
  ): Promise<HandlerResult> {
    this.logger.logExecution(this.field, [
      'Calling ',
      this.fragment.name + '()',
    ])
    const callResult = await callMethod(provider, address, this.fragment, [])
    return { field: this.field, ...callResult }
  }
}
