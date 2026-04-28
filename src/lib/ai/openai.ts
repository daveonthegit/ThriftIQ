import { openai } from '@ai-sdk/openai'

export function getListingModel() {
  return openai('gpt-4o-mini')
}
