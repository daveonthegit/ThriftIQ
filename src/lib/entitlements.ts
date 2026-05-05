type EntitlementUser = {
  plan: string
  searchLimit: number
  unlimitedSearches: number
}

export type SearchEntitlement = {
  plan: 'Free' | 'Developer'
  searchLimit: number | null
  unlimitedSearches: boolean
}

export function searchEntitlementFor(user: EntitlementUser): SearchEntitlement {
  if (user.unlimitedSearches === 1) {
    return {
      plan: 'Developer',
      searchLimit: null,
      unlimitedSearches: true,
    }
  }

  return {
    plan: user.plan === 'Developer' ? 'Developer' : 'Free',
    searchLimit: user.searchLimit,
    unlimitedSearches: false,
  }
}
