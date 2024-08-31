import { useEffect, useState } from "react";
import Soon from '../../assets/Comingsoon.svg';
import { supabase } from "@renderer/App";
import { PlaidExpenseCategory, PlaidRevenueCategory } from "@renderer/components/plaid";

const WEBSITE = import.meta.env.VITE_WEBSITE;
const PLAIDLINK = import.meta.env.VITE_PLAIDLINK_API;
const PLAIDEXCHANGE = import.meta.env.VITE_PLAIDEXCHANGE_API;
const PLAIDTRANSACTIONS = import.meta.env.VITE_PLAIDTRANSACTIONS;
declare const Plaid: any;

interface PLAIDRECEIPT {
    transaction_id: string,
    name: string,
    amount: number,
    date: string,
    pending: boolean,
    personal_finance_category: {
        detailed: string,
        primary: string
    },
}

interface BANK {
    id: string,
    institution_name: string,
    cursor
}

async function exchangePublicToken(token, public_token) {
    const response = await fetch(PLAIDEXCHANGE, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            token,
            public_token
        })
    });
    if (response.ok) {
        const data = await response.json();
        return data;
    }
}

async function fetchBanks() {
    const result = await window.api.Utils(`SELECT * FROM banks `,);
    return result;
}

async function plaidAdd(added: PLAIDRECEIPT[], institution_name) {
    try {
        for (const receipt of added) {
            if (receipt.amount > 0) {
                // Insert on revenue
                await window.api.Database(
                    `
                    INSERT INTO 
                    revenue (transaction_id, name, amount, date, category, type, bank, recurring)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                    `,
                    [
                        receipt.transaction_id,
                        receipt.name,
                        receipt.amount,
                        receipt.date,
                        PlaidRevenueCategory(receipt.personal_finance_category),
                        0, institution_name, 0
                    ]);
            } else {
                // Insert on expense
                await window.api.Database(
                    `
                    INSERT INTO 
                    expense (transaction_id, name, amount, date, category, type, bank, recurring)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                    `,
                    [
                        receipt.transaction_id,
                        receipt.name,
                        (receipt.amount * -1),
                        receipt.date,
                        PlaidExpenseCategory(receipt.personal_finance_category),
                        0, institution_name, 0
                    ]);
            }
        }
    } catch (error) {
        throw error;
    }
}

async function plaidMod(added: PLAIDRECEIPT[]) {
    try {
        for (const receipt of added) {
            if (receipt.amount > 0) {

                // Update on revenue
                await window.api.Database(
                    `
                    UPDATE revenue 
                    SET  
                        name = ?, 
                        amount = ?, 
                        date = ?,
                        category = ?
                    WHERE transaction_id = ?;
                    `,
                    [
                        receipt.name,
                        receipt.amount,
                        receipt.date,
                        PlaidRevenueCategory(receipt.personal_finance_category),
                        receipt.transaction_id
                    ]);
            } else {
                // Update on expense
                await window.api.Database(
                    `
                    UPDATE expense 
                    SET  
                        name = ?, 
                        amount = ?, 
                        date = ?,
                        category = ?
                    WHERE transaction_id = ?;
                    `,
                    [
                        receipt.name,
                        receipt.amount * (-1),
                        receipt.date,
                        PlaidRevenueCategory(receipt.personal_finance_category),
                        receipt.transaction_id
                    ]);
            }
        }
    } catch (error) {
        throw error;
    }
}

async function plaidDel(added: PLAIDRECEIPT[]) {
    try {
        for (const receipt of added) {
            // DELETE FROM revenue if exist
            await window.api.Database(
                `
                DELETE FROM revenue
                WHERE transaction_id = ?;
                `,
                [receipt.transaction_id]
            );
            // DELETE FROM expense if exist
            await window.api.Database(
                `
                DELETE FROM expense
                WHERE transaction_id = ?;
                `,
                [receipt.transaction_id]
            )
        }
    } catch (error) {
        throw error;
    }
}


export async function transactionsRefresh(id: string, cursor: string | null, institution_name: string) {
    // Used to knwo if has more data
    let hasMore = true;
    // Used to know the last inserted data
    let theCursor = cursor;

    try {
        // User data
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!session)
            return;

        while (hasMore) {
            const response = await fetch(PLAIDTRANSACTIONS, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    institution_id: id,
                    cursor: theCursor
                })
            });
            if (response.ok) {
                const res = await response.json();
                const data = res.data;

                // Add results
                await plaidAdd(data.added, institution_name);

                // Modify results
                await plaidMod(data.modified)

                // Delete results
                await plaidDel(data.removed)

                hasMore = data.has_more;
                // Update cursor to the next cursor
                theCursor = data.next_cursor;
                // Update cursor on database
                await window.api.Utils(
                    `
                    UPDATE banks
                    SET cursor = ?
                    WHERE id = ?;
                    `,
                    [theCursor, id]
                )
            } else {
                console.error(response)
                return;
            };
        }
    } catch (error) {
        window.api.showError(`Something has gone wrong.\nError code: 1.0v015`);
        console.error(error)
        return;
    }
}

export async function transactionsRefreshaAll() {
    // Get All banks
    const banks: BANK[] = await fetchBanks();

    try {
        // Refresh bank per bank
        for (const bank of banks)
            await transactionsRefresh(bank.id, bank.cursor ?? null, bank.institution_name);
    } catch (error) {
        console.log(error)
    }
}


function Settings() {
    const [selected, setSelected] = useState(0);
    const [banks, setBanks] = useState([]);
    const [refresh, setRefresh] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refreshLoading, setRefreshLoading] = useState<undefined | { index: number }>();
    const [feedback, setFeedback] = useState<{
        class: "text-danger" | "text-warning" | "text-info-emphasis"
        message: string
    }>()

    useEffect(() => {
        // Get a list of notes using filter and sort
        const getBanks = async () => {
            setBanks(await fetchBanks());
        }
        getBanks();
    }, [refresh])

    return (
        <div className="right-content-secondary">
            <div className="area-first border-end border-top overflow-y-auto">
                <div className="w-100 d-flex p-3 " style={{ height: "63px" }}>
                    <h4>Settings</h4>
                </div>
                <div className={"w-100 border-bottom d-flex align-items-center ps-5" + ((selected == 0) ? " bg-info-subtle" : "")} style={{ height: "40px", cursor: "pointer" }}
                    onClick={() => { setSelected(0) }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="bi bi-person-fill" viewBox="0 0 16 16">
                        <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />
                    </svg>
                    <span className="ms-2">Account</span>
                </div>
                <div className={"w-100 border-bottom d-flex align-items-center ps-5" + ((selected == 1) ? " bg-info-subtle" : "")} style={{ height: "40px", cursor: "pointer" }}
                    onClick={() => { setSelected(1) }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="bi bi-bank2" viewBox="0 0 16 16">
                        <path d="M8.277.084a.5.5 0 0 0-.554 0l-7.5 5A.5.5 0 0 0 .5 6h1.875v7H1.5a.5.5 0 0 0 0 1h13a.5.5 0 1 0 0-1h-.875V6H15.5a.5.5 0 0 0 .277-.916zM12.375 6v7h-1.25V6zm-2.5 0v7h-1.25V6zm-2.5 0v7h-1.25V6zm-2.5 0v7h-1.25V6zM8 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2M.5 15a.5.5 0 0 0 0 1h15a.5.5 0 1 0 0-1z" />
                    </svg>
                    <span className="ms-2">Banks</span>
                </div>

                <div className={"w-100 border-bottom d-flex align-items-center ps-5" + ((selected == 2) ? " bg-info-subtle" : "")} style={{ height: "40px", cursor: "pointer" }}
                    onClick={() => { setSelected(2) }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="bi bi-shield-lock" viewBox="0 0 16 16">
                        <path d="M5.338 1.59a61 61 0 0 0-2.837.856.48.48 0 0 0-.328.39c-.554 4.157.726 7.19 2.253 9.188a10.7 10.7 0 0 0 2.287 2.233c.346.244.652.42.893.533q.18.085.293.118a1 1 0 0 0 .101.025 1 1 0 0 0 .1-.025q.114-.034.294-.118c.24-.113.547-.29.893-.533a10.7 10.7 0 0 0 2.287-2.233c1.527-1.997 2.807-5.031 2.253-9.188a.48.48 0 0 0-.328-.39c-.651-.213-1.75-.56-2.837-.855C9.552 1.29 8.531 1.067 8 1.067c-.53 0-1.552.223-2.662.524zM5.072.56C6.157.265 7.31 0 8 0s1.843.265 2.928.56c1.11.3 2.229.655 2.887.87a1.54 1.54 0 0 1 1.044 1.262c.596 4.477-.787 7.795-2.465 9.99a11.8 11.8 0 0 1-2.517 2.453 7 7 0 0 1-1.048.625c-.28.132-.581.24-.829.24s-.548-.108-.829-.24a7 7 0 0 1-1.048-.625 11.8 11.8 0 0 1-2.517-2.453C1.928 10.487.545 7.169 1.141 2.692A1.54 1.54 0 0 1 2.185 1.43 63 63 0 0 1 5.072.56" />
                        <path d="M9.5 6.5a1.5 1.5 0 0 1-1 1.415l.385 1.99a.5.5 0 0 1-.491.595h-.788a.5.5 0 0 1-.49-.595l.384-1.99a1.5 1.5 0 1 1 2-1.415" />
                    </svg>
                    <span className="ms-2">Security</span>
                </div>
                <div className={"w-100 border-bottom d-flex align-items-center ps-5" + ((selected == 3) ? " bg-info-subtle" : "")} style={{ height: "40px", cursor: "pointer" }}
                    onClick={() => { setSelected(3) }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="bi bi-brush-fill" viewBox="0 0 16 16">
                        <path d="M15.825.12a.5.5 0 0 1 .132.584c-1.53 3.43-4.743 8.17-7.095 10.64a6.1 6.1 0 0 1-2.373 1.534c-.018.227-.06.538-.16.868-.201.659-.667 1.479-1.708 1.74a8.1 8.1 0 0 1-3.078.132 4 4 0 0 1-.562-.135 1.4 1.4 0 0 1-.466-.247.7.7 0 0 1-.204-.288.62.62 0 0 1 .004-.443c.095-.245.316-.38.461-.452.394-.197.625-.453.867-.826.095-.144.184-.297.287-.472l.117-.198c.151-.255.326-.54.546-.848.528-.739 1.201-.925 1.746-.896q.19.012.348.048c.062-.172.142-.38.238-.608.261-.619.658-1.419 1.187-2.069 2.176-2.67 6.18-6.206 9.117-8.104a.5.5 0 0 1 .596.04" />
                    </svg>
                    <span className="ms-2">Appearance</span>
                </div>

                <div className={"w-100 border-bottom d-flex align-items-center ps-5" + ((selected == 4) ? " bg-info-subtle" : "")} style={{ height: "40px", cursor: "pointer" }}
                    onClick={() => { setSelected(4) }}>
                    <svg className="bi bi-toggles" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M4.5 9a3.5 3.5 0 1 0 0 7h7a3.5 3.5 0 1 0 0-7zm7 6a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5m-7-14a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5m2.45 0A3.5 3.5 0 0 1 8 3.5 3.5 3.5 0 0 1 6.95 6h4.55a2.5 2.5 0 0 0 0-5zM4.5 0h7a3.5 3.5 0 1 1 0 7h-7a3.5 3.5 0 1 1 0-7" />
                    </svg>
                    <span className="ms-2">More</span>
                </div>
            </div>
            <div className="area-second border-top overflow-y-auto d-flex flex-column align-items-center">
                {selected > 1 &&
                    <div className="d-flex flex-column align-items-center justify-content-center mt-auto mb-auto">
                        <h4>Coming Soon</h4>
                        <img src={Soon} alt="soon" width={360} height={360} />
                    </div>}
                {selected == 0 &&
                    <div className="border border-2 rounded d-flex flex-column gap-2 mt-auto mb-auto" style={{ height: "250px", width: "360px" }}>
                        <h5 className="mt-4 ms-4">Account</h5>
                        <div className="ms-5 d-inline-flex gap-2">
                            <h5 className="mt-4 text-center">Name:</h5>
                            <h5 className="mt-4 text-center">{localStorage.getItem("user:name")}</h5>
                        </div>
                        <div className="ms-5 d-inline-flex gap-3">
                            <h5 className="text-center">Email:</h5>
                            <h5 className="text-center">{localStorage.getItem("user:email")}</h5>
                        </div>

                        <div className="m-auto d-inline-flex gap-4">
                            <a href={WEBSITE + "/Settings"} className="btn btn-outline-primary" target="_blank" style={{ width: "200px" }}>
                                Manage
                            </a>
                            <a href="#" className="btn btn-outline-danger" style={{ width: "100px" }}
                                onClick={async (e) => {
                                    e.preventDefault();
                                    await supabase.auth.signOut();
                                    localStorage.removeItem("user:email");
                                    localStorage.removeItem("user:name");
                                    window.location.replace("#");
                                    window.location.reload();
                                }}>
                                Sign Out
                            </a>


                        </div>
                    </div>
                }
                {selected == 1 &&
                    <div>
                        <div className="border border-2 rounded d-flex flex-column gap-2" style={{ height: "160px", width: "360px", marginTop: "50px" }}>
                            <h5 className="mt-4 ms-4">Bank connections</h5>

                            {feedback && <h6 className={"ms-4 " + feedback.class}>{feedback.message}</h6>}

                            <div className="m-auto d-inline-flex gap-4">
                                <a href="#" className={"btn btn-outline-primary " + (loading ? "disabled" : "")} aria-disabled={(loading ? "true" : "false")} style={{ width: "150px" }}
                                    onClick={async (e) => {
                                        e.preventDefault();
                                        // Start feedback loading on connec button
                                        setLoading(true);
                                        setFeedback(undefined); // Reset feedback message
                                        try {
                                            // User data
                                            const { data: { session }, error } = await supabase.auth.getSession();
                                            const token = session?.access_token;

                                            if (error) {
                                                window.api.showError("Session loading failed, please make sure you are logged in.")
                                            }

                                            const response = await fetch(PLAIDLINK, {
                                                method: "POST",
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                },
                                                body: JSON.stringify({
                                                    token
                                                })
                                            });

                                            // Send feedback message if is not ok
                                            switch (response.status) {
                                                case 401:
                                                    setFeedback({
                                                        class: "text-danger",
                                                        message: "Please make sure you're logged in."
                                                    });
                                                    break;
                                                case 402:
                                                    setFeedback({
                                                        class: "text-warning",
                                                        message: 'Ynter Premium Required.'
                                                    });
                                                    break;
                                                case 500:
                                                    window.api.showError("Something has gone wrong. Please report the error.\nError code: 1.0v013");
                                                    console.error(response);
                                                    break;
                                            }
                                            if (response.ok) {
                                                // responste data
                                                const data = await response.json();

                                                // Use the lin_token from response to get the public token
                                                const handler = Plaid.create({
                                                    token: data.link_token,
                                                    onSuccess: async (public_token, _metadata) => {

                                                        // Send a feedback message
                                                        setFeedback({
                                                            class: "text-info-emphasis",
                                                            message: 'Almost there...'
                                                        });

                                                        // Exchange public token for access_token
                                                        const bankData: { institution_id, institution_name } =
                                                            await exchangePublicToken(token, public_token);

                                                        // Insert Bank id and name to the banks database
                                                        await window.api.Utils(
                                                            `
                                                        INSERT INTO banks (id, institution_name)
                                                        VALUES (?, ?)
                                                        ON CONFLICT(id) DO UPDATE SET 
                                                            institution_name = excluded.institution_name;
                                                        `,
                                                            [bankData.institution_id, bankData.institution_name]);

                                                        // Refresh list of banks
                                                        setRefresh(!refresh);
                                                        // Stop connect loading
                                                        setLoading(false);
                                                        // Reset feedback message
                                                        setFeedback(undefined);

                                                        // Start feedback loading on refresh all button
                                                        setRefreshLoading({ index: -1 })
                                                        // RefreshAll
                                                        await transactionsRefreshaAll();
                                                        // Stop loading refresh all button
                                                        setRefreshLoading(undefined);
                                                    },
                                                    onExit: async (err, metadata) => {
                                                        setLoading(false);
                                                        console.error(err, metadata)
                                                    }
                                                });
                                                handler.open();
                                            } else
                                                setLoading(false);
                                        } catch (error) {
                                            window.api.showError(`Something has gone wrong. Please report the error.\nError code: 1.0v014`);
                                            console.error(error)
                                        }
                                    }}>
                                    Connect
                                    {loading && <div className="ms-2 spinner-grow spinner-grow-sm" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>}
                                </a>

                                <a href="#" className={"btn btn-outline-secondary " + (refreshLoading?.index == -1 ? "disabled" : "")}
                                    aria-disabled={(refreshLoading?.index == -1 ? "true" : "false")} style={{ width: "150px" }}
                                    onClick={async (e) => {
                                        e.preventDefault();
                                        // Starting feedback loading
                                        setRefreshLoading({ index: -1 })

                                        // RefreshAll
                                        await transactionsRefreshaAll();

                                        // Stop loading
                                        setRefreshLoading(undefined);
                                        setRefresh(!refresh);
                                    }}>
                                    Refresh All

                                    {(refreshLoading?.index == -1) && <div className="ms-2 spinner-grow spinner-grow-sm" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>}
                                </a>


                            </div>
                        </div>


                        {banks?.map((values: BANK, index) => {
                            return (<div key={index} className="border border-2 rounded d-flex flex-column gap-2" style={{ height: "120px", width: "360px", marginTop: "50px" }}>
                                <h5 className="mt-3 ms-4">{values.institution_name}</h5>

                                <div className="m-auto d-inline-flex gap-4">
                                    <a href="#" className={"btn btn-outline-secondary " + (refreshLoading?.index == index ? "disabled" : "")}
                                        aria-disabled={(refreshLoading?.index == index ? "true" : "false")} style={{ width: "200px" }}
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            // Start loading feedback and refresh
                                            setRefreshLoading({ index })
                                            await transactionsRefresh(values.id, values.cursor ?? null, values.institution_name);
                                            // Stop loading
                                            setRefreshLoading(undefined);
                                            setRefresh(!refresh);
                                        }}>
                                        Refresh
                                        {(index == refreshLoading?.index) && <div className="ms-2 spinner-grow spinner-grow-sm" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>}
                                    </a>
                                    <a href="#" className="btn btn-outline-danger" style={{ width: "100px" }}
                                        onClick={async (e) => {
                                            e.preventDefault();

                                            // Delete bank from banks
                                            await window.api.Utils(
                                                `DELETE FROM banks WHERE id = ?;`,
                                                [values.id]
                                            );
                                            setRefresh(!refresh);
                                        }}>
                                        Delete
                                    </a>
                                </div>
                            </div>)
                        })
                        }
                    </div>

                }
            </div>
        </div>
    );
}

export default Settings;
