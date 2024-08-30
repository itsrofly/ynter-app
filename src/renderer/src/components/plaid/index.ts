export const PlaidRevenueCategory = (
    personal_finance_category: {
        detailed: string,
        primary: string
    }
) => {
    /* 
        Category 0 (Salary, Pension, Governmental Support, Company Income)
        Category 1 (Any type of investment)
        Category 2 (In: ATM, Bank Transfer, Family)
        Category 3 (Savings)
        Category 4 (Others)
    */
    const list = { // 
        "INCOME": {
            INCOME_DIVIDENDS: 1,
            INCOME_INTEREST_EARNED: 1,
            INCOME_TAX_REFUND: 1,
            INCOME_RETIREMENT_PENSION: 0,
            INCOME_UNEMPLOYMENT: 0,
            INCOME_WAGES: 0,
            INCOME_OTHER_INCOME: 0
        },
        "TRANSFER_IN": {
            TRANSFER_IN_CASH_ADVANCES_AND_LOANS: 2,
            TRANSFER_IN_DEPOSIT: 2,
            TRANSFER_IN_INVESTMENT_AND_RETIREMENT_FUNDS: 1,
            TRANSFER_IN_SAVINGS: 3,
            TRANSFER_IN_ACCOUNT_TRANSFER: 2,
            TRANSFER_IN_OTHER_TRANSFER_IN: 2
        }
        // ... Rest is 4
    }
    const primary = personal_finance_category.primary;
    const detailed = personal_finance_category.detailed;

    if (list[primary] && list[primary][detailed] != undefined)
        return list[primary][detailed];
    return 4;
}


export const PlaidExpenseCategory = (
    personal_finance_category: {
        detailed: string,
        primary: string
    }
) => {
    /* 
(
    0 - Home, 
    1 - Food & Drink, 
    2 - Education, 
    3 - Health & Wellness,
    4 - Bills,
    5 - Transport,
    6 - Travel,
    7 - Entertainment,
    8 - Shopping, 
    9 - Investments,
    10 - Savings,
    11 - Family & Pet, 
    12 - Others
)
    */
    const list = { // 
        "TRANSFER_OUT": {
            TRANSFER_OUT_INVESTMENT_AND_RETIREMENT_FUNDS: 9,
            TRANSFER_OUT_SAVINGS: 10,
            TRANSFER_OUT_WITHDRAWAL: 12,
            TRANSFER_OUT_ACCOUNT_TRANSFER: 12,
            TRANSFER_OUT_OTHER_TRANSFER_OUT: 12
        },
        "LOAN_PAYMENTS": 4,
        "BANK_FEES": 4,
        "ENTERTAINMENT": 7,
        "FOOD_AND_DRINK": 1,
        "GENERAL_MERCHANDISE": 8,
        "HOME_IMPROVEMENT": 0,
        "MEDICAL": 3,
        "PERSONAL_CARE": 3,
        "GENERAL_SERVICES": 4,
        "GOVERNMENT_AND_NON_PROFIT": 4,
        "TRANSPORTATION": 5,
        "TRAVEL": 6,
        "RENT_AND_UTILITIES": 0
    }
    const primary = personal_finance_category.primary;
    const detailed = personal_finance_category.detailed;

    if (list[primary] && list[primary][detailed] != undefined)
        return list[primary][detailed];
    else if (list[primary] && typeof list[primary] === 'number')
        return list[primary]
    return 12;
}
