import { Dayjs } from "dayjs";

export interface ReceiptList {
    Timeline: number,
    Rows: string
}

// Receipt informations
export interface FormState {
    id?: string;
    name: string;
    description: string;
    amount: string;
    date: string;
    category: string;
    type: string;
    bank: string;
    recurring: boolean;
    file_name: string;
    file_path: string
}

export interface Chat {
    role: "assistant" | "function" | "user" | "system",
    content: string | undefined,
    name?: string,
    args?: { queries: string[], answers: string[] }
}


export const BankType = (index: number) => {
    // Paymeny method
    switch (index) {
        case 0:
            return {
                Icon: <><svg data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Bank transfer" xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="#FFFFFF"><path d="M200-280v-280h80v280h-80Zm240 0v-280h80v280h-80ZM80-120v-80h800v80H80Zm600-160v-280h80v280h-80ZM80-640v-80l400-200 400 200v80H80Zm178-80h444-444Zm0 0h444L480-830 258-720Z" /></svg></>,
                Label: 'Bank transfer'
            };

        case 1:
            return {
                Icon: <><svg data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Card" xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="#FFFFFF"><path d="M880-720v480q0 33-23.5 56.5T800-160H160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720Zm-720 80h640v-80H160v80Zm0 160v240h640v-240H160Zm0 240v-480 480Z" /></svg></>,
                Label: 'Card'
            };

        default:
            return {
                Icon: <><svg data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Cash" xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" fill="#FFFFFF" className="bi bi-cash-coin" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M11 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8m5-4a5 5 0 1 1-10 0 5 5 0 0 1 10 0" />
                    <path d="M9.438 11.944c.047.596.518 1.06 1.363 1.116v.44h.375v-.443c.875-.061 1.386-.529 1.386-1.207 0-.618-.39-.936-1.09-1.1l-.296-.07v-1.2c.376.043.614.248.671.532h.658c-.047-.575-.54-1.024-1.329-1.073V8.5h-.375v.45c-.747.073-1.255.522-1.255 1.158 0 .562.378.92 1.007 1.066l.248.061v1.272c-.384-.058-.639-.27-.696-.563h-.668zm1.36-1.354c-.369-.085-.569-.26-.569-.522 0-.294.216-.514.572-.578v1.1zm.432.746c.449.104.655.272.655.569 0 .339-.257.571-.709.614v-1.195z" />
                    <path d="M1 0a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h4.083q.088-.517.258-1H3a2 2 0 0 0-2-2V3a2 2 0 0 0 2-2h10a2 2 0 0 0 2 2v3.528c.38.34.717.728 1 1.154V1a1 1 0 0 0-1-1z" />
                    <path d="M9.998 5.083 10 5a2 2 0 1 0-3.132 1.65 6 6 0 0 1 3.13-1.567" />
                </svg></>,
                Label: 'Cash'
            };
    }
}

export const receiptCategory = (table: "revenue" | "expense") => {
    if (table == "revenue") {
        return [
            { value: -1, label: "All" },
            { value: 0, label: "Work" },
            { value: 1, label: "Bonus" },
            { value: 2, label: "Family" },
            { value: 3, label: "Cash Back" },
            { value: 4, label: "Investments" },
            { value: 5, label: "Others" },
            { value: 6, label: "Recurring" }
        ];
    } else {
        return [
            { value: -1, label: "All" },
            { value: 0, label: "Home" },
            { value: 1, label: "Food" },
            { value: 2, label: "Education" },
            { value: 3, label: "Health" },
            { value: 4, label: "Bills" },
            { value: 5, label: "Transport" },
            { value: 6, label: "Travel" },
            { value: 7, label: "Entertainment" },
            { value: 8, label: "Shopping" },
            { value: 9, label: "Investments" },
            { value: 10, label: "Savings" },
            { value: 11, label: "Family" },
            { value: 12, label: "Others" },
            { value: 13, label: "Recurring" }
        ];
    }
}


export async function fetchCurrentAmount(
    time: "%Y-%m" | "%Y", table: "revenue" | "expense"
) {
    // Fetch total amount from revenue or expense of this month or year
    const result: { value: number }[] = await window.api.Database(`
      SELECT 
        IFNULL(SUM(amount), 0) AS value 
      FROM 
        ${table}
      WHERE
        strftime('${time}', date) == strftime('${time}', date('now'))
    `)

    // Round to 2 decimal places
    const roundedValue = parseFloat(result[0].value.toFixed(2));
    return roundedValue;
}

export async function fetchAmountByTimeline(
    timeline: "m" | "y", table: "revenue" | "expense"
) {
    // Fetch total amount from revenue or expense grouped by month or year
    const query = timeline == "m" ? `
    WITH months AS (
        SELECT strftime('%m', 'now', 'start of year', '+' || (n || ' month')) AS month_num,
            strftime('%Y-%m', 'now', 'start of year', '+' || (n || ' month')) AS full_month
        FROM (
            SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
            UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11
        )
        WHERE strftime('%m', 'now', 'start of year', '+' || (n || ' month')) <= strftime('%m', 'now')
    ),
    ${table}_totals AS (
        SELECT strftime('%m', date) AS month_num, SUM(amount) AS ${table}
        FROM ${table}
        WHERE strftime('%Y', date) = strftime('%Y', 'now')
        GROUP BY strftime('%m', date)
    )
    SELECT
        months.month_num,
        CASE months.month_num
            WHEN '01' THEN 'Jan'
            WHEN '02' THEN 'Feb'
            WHEN '03' THEN 'Mar'
            WHEN '04' THEN 'Apr'
            WHEN '05' THEN 'May'
            WHEN '06' THEN 'Jun'
            WHEN '07' THEN 'Jul'
            WHEN '08' THEN 'Aug'
            WHEN '09' THEN 'Sep'
            WHEN '10' THEN 'Oct'
            WHEN '11' THEN 'Nov'
            WHEN '12' THEN 'Dec'
        END AS Name,
        COALESCE(${table}_totals.${table}, 0) AS ${(table.charAt(0).toUpperCase() + table.slice(1))}
    FROM
        months
    LEFT JOIN ${table}_totals ON months.month_num = ${table}_totals.month_num
    ORDER BY months.month_num;
  ` : `
    WITH years AS (
        SELECT strftime('%Y', 'now', '-' || n || ' years') AS year
        FROM (
            SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
            UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9
        )
    ),
    ${table}_totals AS (
        SELECT strftime('%Y', date) AS year, SUM(amount) AS ${table}
        FROM ${table}
        WHERE strftime('%Y', date) >= strftime('%Y', 'now', '-9 years')
        GROUP BY strftime('%Y', date)
    )
    SELECT
        years.year AS Name,
        COALESCE(${table}_totals.${table}, 0) AS ${(table.charAt(0).toUpperCase() + table.slice(1))}
    FROM
        years
    LEFT JOIN ${table}_totals ON years.year = ${table}_totals.year
    ORDER BY years.year;
  `;
    const result = await window.api.Database(query) as any;
    return result;
};

export async function fetchAmountByCategory(
    timeline: "%Y-%m" | "%Y", table: "revenue" | "expense"
) {
    // Determine the offset for previous period based on the timeline format
    const previousOffset = timeline === "%Y" ? "-1 year" : "-1 month";

    // Tables categories
    const categories = table == "revenue" ?
        `          
    WITH categories AS (
    SELECT 0 AS category, 'Work' AS category_name UNION ALL
    SELECT 1, 'Investments' UNION ALL
    SELECT 2, 'Bonus' UNION ALL
    SELECT 3, 'Cash Back' UNION ALL
    SELECT 4, 'Family' UNION ALL
    SELECT 5, 'Others'
    )`
        :
        `
    WITH categories AS (
    SELECT 0 AS category, 'Home' AS category_name UNION ALL
    SELECT 1, 'Food' UNION ALL
    SELECT 2, 'Education' UNION ALL
    SELECT 3, 'Health' UNION ALL
    SELECT 4, 'Bills' UNION ALL
    SELECT 5, 'Transport' UNION ALL
    SELECT 6, 'Travel' UNION ALL
    SELECT 7, 'Entertainment' UNION ALL
    SELECT 8, 'Shopping' UNION ALL
    SELECT 9, 'Investments' UNION ALL
    SELECT 10, 'Savings' UNION ALL
    SELECT 11, 'Family'
    )
    `

    // Fetch total amount grouped by category
    const result: any = await window.api.Database(`
          ${categories},
          current_data AS (
            SELECT 
              category,
              SUM(amount) AS current
            FROM 
              ${table}
            WHERE
              strftime('${timeline}', date) = strftime('${timeline}', 'now')
            GROUP BY
              category
          ),
          previous_data AS (
            SELECT 
              category,
              SUM(amount) AS previous
            FROM 
              ${table}
            WHERE
              strftime('${timeline}', date) = strftime('${timeline}', 'now', '${previousOffset}')
            GROUP BY
              category
          )
          SELECT
            c.category_name AS Category,
            IFNULL(cd.current, 0) AS Current,
            IFNULL(pd.previous, 0) AS Previous
          FROM
            categories c
          LEFT JOIN current_data cd ON c.category = cd.category
          LEFT JOIN previous_data pd ON c.category = pd.category
          ORDER BY
            c.category;
      `);
    return result;
};


export async function
    fetchReceipt(
        timeline: "%Y-%m" | "%Y", table: "revenue" | "expense",
        dateParam: Dayjs, option: string
    ) {
    // Format the Date object to a string in the format 'YYYY-MM' or 'YYYY'
    const year = dateParam.get("year");
    const month = dateParam.format("MM");
    const dateParamStr = `${year}-${month}`;
    const yearStr = `${year}`;

    // Apply option filter from selection
    const filter = () => {
        switch (option) {
            case '-1':
                return '';
            case (table == "revenue" ? "6" : "13"):
                return `AND recurring = 1`
            default:
                return `AND category = ${option}`
        }
    }

    // Fetch receipts using filter
    const query = `
    WITH current_timeline_${table} AS (
        SELECT 
            id, 
            name,
            description,
            amount, 
            date, 
            category, 
            type, 
            bank, 
            recurring,
            file_name,
            file_path, 
            CASE 
                WHEN '${timeline}' = '%Y-%m' THEN 
                    'Week ' || (strftime('%W', date) - strftime('%W', '${year}-${month}-01') + 1)
                WHEN '${timeline}' = '%Y' THEN 
                    CASE strftime('%m', date)
                        WHEN '01' THEN 'January'
                        WHEN '02' THEN 'February'
                        WHEN '03' THEN 'March'
                        WHEN '04' THEN 'April'
                        WHEN '05' THEN 'May'
                        WHEN '06' THEN 'June'
                        WHEN '07' THEN 'July'
                        WHEN '08' THEN 'August'
                        WHEN '09' THEN 'September'
                        WHEN '10' THEN 'October'
                        WHEN '11' THEN 'November'
                        WHEN '12' THEN 'December'
                    END
            END AS Timeline
        FROM 
            ${table}
        WHERE 
            ${timeline === '%Y-%m' ? `strftime('%Y-%m', date) = '${dateParamStr}'` : `strftime('%Y', date) = '${yearStr}'`}
            ${filter()}
    )
    SELECT
        Timeline,
        '[' || GROUP_CONCAT(
            json_object(
                'id', id,
                'name', name,
                'description', description,
                'amount', amount,
                'date', date,
                'category', category,
                'type', type,
                'bank', bank,
                'recurring', recurring,
                'file_name', file_name,
                'file_path', file_path
            )
        ) || ']' AS Rows
    FROM
        current_timeline_${table}
    GROUP BY
        Timeline
    ORDER BY 
        MAX(date) DESC;
    `;

    const result = await window.api.Database(query);
    return result as ReceiptList[];
};





export async function handleSubmitReceipt(values: FormState, table: string) {
    try {
        console.log(values.file_path);
        const query = `
            INSERT INTO ${table} (name, description, amount, date, category, type, bank, recurring, file_name, file_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
        const params = [values.name, values.description, values.amount, values.date + " 00:00:00", values.category, values.type, values.bank, values.recurring ? 1 : 0, values.file_name, values.file_path];
        await window.api.Database(query, params);
    } catch (error) {
        window.api.showError(`Something has gone wrong. Please report the error.\nError code: 1.0v003`);
        console.error(error);
    }
};

export async function handleUpdateReceipt(values: FormState, table: string) {
    try {
        const query = `
          UPDATE ${table}
          SET name = ?, 
              description = ?, 
              amount = ?, 
              date = ?, 
              category = ?, 
              type = ?, 
              bank = ?, 
              recurring = ?, 
              file_name = ?, 
              file_path = ?
          WHERE id = ${values.id};
        `;
        const params = [values.name, values.description, values.amount, values.date + " 00:00:00", values.category, values.type, values.bank, values.recurring ? 1 : 0, values.file_name, values.file_path];
        await window.api.Database(query, params);
    } catch (error) {
        window.api.showError(`Something has gone wrong. Please report the error.\nError code: 1.0v004`);
        console.error(error);
    }
};

export async function handleDeleteReceipt(id: string, table: string) {
    try {
        const query = `
          DELETE FROM ${table}
          WHERE id = ${id};
        `;
        await window.api.Database(query);
    } catch (error) {
        window.api.showError(`Something has gone wrong. Please report the error.\nError code: 1.0v005`);
        console.error(error);
    }
}

export async function updateRecurring(table: "revenue" | "expense") {
    try {
        // Get all recurring receipts
        const result: {
            name: string,
            description: string,
            amount: number,
            day: string,
            category: number,
            type: number,
            bank: string,
            recurring: string
        }[] = await window.api.Database(
            ` 
            SELECT
                name,
                description,
                amount,
                strftime('%d', date) AS day,
                category,
                type,
                bank,
                recurring
            FROM
                ${table}
            WHERE
                recurring = 1;
      `)
        const seen = new Map();

        for (const item of result) {
            // Create key
            const key = `${item.name}-${item.description}-${item.amount}-${item.day}-${item.category}-${item.type}-${item.bank}-${item.recurring}`;

            // If key don't alread exist try add a new recurring in this month
            // Will not add if already have
            if (!seen.has(key)) {
                seen.set(key, true);

                await window.api.Database(
                    `
          INSERT INTO ${table} (name, description, amount, date, category, type, bank, recurring)
          SELECT 
              '${item.name}',
              '${item.description}',
              ${item.amount}, 
              strftime('%Y', 'now') || '-' || strftime('%m', 'now') || '-' || printf('%02d', ${item.day}) || ' 00:00:00',
              '${item.category}',
              '${item.type}',
              '${item.bank}',
              ${item.recurring}
          WHERE
              NOT EXISTS (
                  SELECT 1
                  FROM ${table}
                  WHERE recurring = 1
                  AND name = '${item.name}'
                  AND description = '${item.description}'
                  AND amount = ${item.amount}
                  AND date = strftime('%Y', 'now') || '-' || strftime('%m', 'now') || '-' || printf('%02d', ${item.day}) || ' 00:00:00'
                  AND category = '${item.category}'
                  AND type = '${item.type}'
                  AND bank = '${item.bank}'
              );
          `
                )
            }
        }
    } catch (error) {
        window.api.showError(`Something has gone wrong. Please report the error.\nError code: 1.0v006`);
        console.error(error);
    }
};

export const NumberFormater = (number) => {
    if (number > 1000000000) {
        return (number / 1000000000).toString() + 'B';
    } else if (number > 1000000) {
        return (number / 1000000).toString() + 'M';
    } else if (number > 1000) {
        return (number / 1000).toString() + 'K';
    } else {
        return number.toString();
    }
}

export const NumberFormaterData = (value) => {
    return value.toFixed(2);
};

export function abbreviateString(str, maxLength) {
    if (str.length <= maxLength) {
        return str;
    }
    return str.slice(0, maxLength - 3) + '...';
}