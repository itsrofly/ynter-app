import { useEffect, useState } from 'react'
import { PlaidExpenseCategory, PlaidRevenueCategory } from '@renderer/components/plaid'

const WEBSITE = import.meta.env.VITE_WEBSITE
const PLAIDLINK = import.meta.env.VITE_PLAIDLINK_API
const PLAIDEXCHANGE = import.meta.env.VITE_PLAIDEXCHANGE_API
const PLAIDTRANSACTIONS = import.meta.env.VITE_PLAIDTRANSACTIONS
const PLAIDDELETE = import.meta.env.VITE_PLAIDDELETE
declare const Plaid
declare const bootstrap

interface PLAIDRECEIPT {
  transaction_id: string
  name: string
  amount: number
  date: string
  pending: boolean
  personal_finance_category: {
    detailed: string
    primary: string
  }
  location: {
    address: string
    city: string
    country: string
  }
}

interface BANK {
  id: string
  internal_id: number
  institution_name: string
  cursor: string
  enabled: number
}

async function exchangePublicToken(public_token) {
  // User data
  const access_token = await window.api.Session()
  if (!access_token) {
    window.api.showError('Session loading failed, please make sure you are logged in.')
  }

  const response = await fetch(PLAIDEXCHANGE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      token: access_token,
      public_token
    })
  })
  if (response.ok) {
    const data = await response.json()
    return data
  }
}

async function createLinkToken(setFeedback, index: number, institution_id?: string) {
  // User data
  const access_token = await window.api.Session()

  if (!access_token) {
    window.api.showError('Session loading failed, please make sure you are logged in.')
  }

  const ipapi_response = await fetch('https://ipapi.co/json/')
  let region: string

  if (ipapi_response.ok) {
    const ipapi_data = await ipapi_response.json()

    region = ipapi_data.country_code
  } else region = 'US'

  const response = await fetch(PLAIDLINK, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      token: access_token,
      institution_id: institution_id,
      region
    })
  })

  // Send feedback message if is not ok
  switch (response.status) {
    case 401:
      setFeedback({
        class: 'text-danger',
        message: "Please make sure you're logged in.",
        index
      })
      break
    case 402:
      setFeedback({
        class: 'text-warning',
        message: 'Ynter Premium Required.',
        index
      })
      break
    case 429:
      setFeedback({
        class: 'text-danger',
        message: 'Too many operations. Please try again later.',
        index
      })
      break
    case 500:
      window.api.showError(
        'Something has gone wrong. Please report the error.\nError code: 1.0v013'
      )
      console.error(response)
      break
  }
  return response
}

async function deleteLinkToken(institution_id?: string) {
  // User data
  const access_token = await window.api.Session()

  if (!access_token) {
    window.api.showError('Session loading failed, please make sure you are logged in.')
  }

  const response = await fetch(PLAIDDELETE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      token: access_token,
      institution_id: institution_id
    })
  })

  return response
}

async function fetchBanks() {
  const result = await window.api.Utils(`SELECT * FROM banks `)
  return result
}

async function plaidAdd(added: PLAIDRECEIPT[], institution_id: string, institution_name: string) {
  try {
    for (const receipt of added) {
      // Formated region
      const region =
        (receipt.location.address ?? '') +
        (receipt.location.city ?? '') +
        (receipt.location.country ?? '')

      if (receipt.amount > 0) {
        // Insert on revenue
        await window.api.Database(
          `
                    INSERT INTO 
                    revenue (transaction_id, institution_id, name, amount, date, category, type, bank, recurring, region)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                    `,
          [
            receipt.transaction_id,
            institution_id,
            receipt.name,
            receipt.amount,
            receipt.date,
            PlaidRevenueCategory(receipt.personal_finance_category),
            0,
            institution_name,
            0,
            region
          ]
        )
      } else {
        // Insert on expense
        await window.api.Database(
          `
                    INSERT INTO 
                    expense (transaction_id, institution_id, name, amount, date, category, type, bank, recurring, region)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                    `,
          [
            receipt.transaction_id,
            institution_id,
            receipt.name,
            receipt.amount * -1,
            receipt.date,
            PlaidExpenseCategory(receipt.personal_finance_category),
            0,
            institution_name,
            0,
            region
          ]
        )
      }
    }
  } catch (error) {
    throw error
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
          ]
        )
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
            receipt.amount * -1,
            receipt.date,
            PlaidRevenueCategory(receipt.personal_finance_category),
            receipt.transaction_id
          ]
        )
      }
    }
  } catch (error) {
    throw error
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
      )
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
    throw error
  }
}

export async function transactionsRefresh(
  id: string,
  cursor: string | null,
  institution_name: string
) {
  // Used to knwo if has more data
  let hasMore = true
  // Used to know the last inserted data
  let theCursor = cursor
  console.log('Refreshing', institution_name)
  try {
    // User data
    const access_token = await window.api.Session()

    if (!access_token) return

    while (hasMore) {
      const response = await fetch(PLAIDTRANSACTIONS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: access_token,
          institution_id: id,
          cursor: theCursor
        })
      })
      if (response.ok) {
        const res = await response.json()
        const data = res.data

        // Add results
        await plaidAdd(data.added, id, institution_name)

        // Modify results
        await plaidMod(data.modified)

        // Delete results
        await plaidDel(data.removed)

        hasMore = data.has_more
        // Update cursor to the next cursor
        theCursor = data.next_cursor
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
        return
      }
    }
  } catch (error) {
    window.api.showError(`Something has gone wrong.\nError code: 1.0v015`)
    console.error(error)
    return
  }
}

export async function transactionsRefreshaAll() {
  // Get All banks
  const banks: BANK[] = await fetchBanks()

  try {
    // Refresh bank per bank
    for (const bank of banks)
      if (bank.enabled === 1)
        await transactionsRefresh(bank.id, bank.cursor ?? null, bank.institution_name)
  } catch (error) {
    console.error(error)
  }
}

const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) {
    return; // No file selected
  }
  const reader = new FileReader();

  reader.onload = async (e) => {
    try {
      const jsonString = e.target?.result as string;
      const jsonContent = JSON.parse(jsonString);
      // Step 1: Iterate over each table in the JSON content
      for (const table in jsonContent) {
        if (Object.hasOwnProperty.call(jsonContent, table)) {
          const data = jsonContent[table];

          // Step 2: Check if data array is not empty
          if (Array.isArray(data) && data.length > 0) {
            for (const row of data) {
              // Step 3: Construct an INSERT query for each row
              const columns = Object.keys(row).join(', ');
              const values = Object.values(row).map(_value => `?`).join(', '); // Simple string escaping; consider using parameterized queries in a production environment
              const insertQuery = `INSERT INTO ${table} (${columns}) VALUES (${values}) ON CONFLICT DO NOTHING;`;

              // Execute the insert query
              await window.api.Database(insertQuery, Object.values(row));
            }
          }
        }
      }
    } catch (error) {
      console.error('Error importing data from JSON:', error);
    }
  };
  reader.readAsText(file);
};

function Settings() {
  const [selected, setSelected] = useState(0)
  const [banks, setBanks] = useState([])
  const [refresh, setRefresh] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasPin, setHasPin] = useState(false)
  const [removePin, setRemovePin] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [oldPin, setOldPin] = useState('')
  const [refreshLoading, setRefreshLoading] = useState<undefined | { index: number }>()
  const [pinFeedBack, setPinFB] = useState('')
  const [feedback, setFeedback] = useState<{
    class: 'text-danger' | 'text-warning' | 'text-info-emphasis' | 'text-dark'
    message: string
    index: number
  }>()

  useEffect(() => {
    // Get a list of notes using filter and sort
    const loadData = async () => {
      // Fetch Banks
      const data = await fetchBanks()
      if (data.length >= 5) {
        setFeedback({
          class: 'text-dark',
          message: 'Reached the limit on the number of banks',
          index: -1
        })
      }
      setBanks(data)

      // Set PIN Initial Values
      setHasPin(await window.api.hasPinCode())
      setNewPin('')
      setOldPin('')
      setRemovePin(false)
      setPinFB('')
    }
    loadData()
  }, [refresh])

  return (
    <div className="right-content-secondary">
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          const done = await window.api.createPinCode(removePin ? null : newPin, oldPin)

          if (done) {
            setRefresh(!refresh)
            const myModalEl = document.getElementById('pinmodal')
            const modal = bootstrap.Modal.getInstance(myModalEl)
            modal.hide()

            if (!hasPin) {
              window.location.replace('#')
              window.location.reload()
            }
          } else setPinFB('Incorrect PIN')
        }}
      >
        <div
          className="modal fade"
          id="pinmodal"
          tabIndex={-1}
          aria-labelledby="pinmodalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h1 className="modal-title fs-5" id="pinmodalLabel">
                  PIN
                </h1>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body p-4">
                {hasPin && (
                  <div className="input-group flex-nowrap">
                    <span
                      className="input-group-text"
                      id="addon-wrapping"
                      style={{ width: '60px' }}
                    >
                      Old
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="4 digits"
                      aria-label="oldpin"
                      aria-describedby="addon-wrapping"
                      value={oldPin}
                      onChange={(e) => {
                        if (/^-?\d+(\.\d+)?$/.test(e.target.value) || e.target.value === '')
                          setOldPin(e.target.value)
                      }}
                      maxLength={4}
                      minLength={4}
                    />
                  </div>
                )}

                {!removePin && (
                  <div className="input-group flex-nowrap mt-3">
                    <span
                      className="input-group-text"
                      id="addon-wrapping"
                      style={{ width: '60px' }}
                    >
                      New
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="4 digits"
                      aria-label="newpin"
                      aria-describedby="addon-wrapping"
                      value={newPin}
                      onChange={(e) => {
                        if (/^-?\d+(\.\d+)?$/.test(e.target.value) || e.target.value === '')
                          setNewPin(e.target.value)
                      }}
                      maxLength={4}
                      minLength={4}
                    />
                  </div>
                )}

                <h6 className="mt-4">{pinFeedBack}</h6>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                  Close
                </button>
                <button type="submit" className="btn btn-primary">
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      <div className="area-first border-end border-top overflow-y-auto">
        <div className="w-100 d-flex p-3 " style={{ height: '63px' }}>
          <h4>Settings</h4>
        </div>
        <div
          className={
            'w-100 border-bottom d-flex align-items-center ps-5' +
            (selected == 0 ? ' bg-info-subtle' : '')
          }
          style={{ height: '40px', cursor: 'pointer' }}
          onClick={() => {
            setSelected(0)
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            fill="currentColor"
            className="bi bi-person-fill"
            viewBox="0 0 16 16"
          >
            <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />
          </svg>
          <span className="ms-2">Account</span>
        </div>
        <div
          className={
            'w-100 border-bottom d-flex align-items-center ps-5' +
            (selected == 1 ? ' bg-info-subtle' : '')
          }
          style={{ height: '40px', cursor: 'pointer' }}
          onClick={() => {
            setSelected(1)
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            fill="currentColor"
            className="bi bi-bank2"
            viewBox="0 0 16 16"
          >
            <path d="M8.277.084a.5.5 0 0 0-.554 0l-7.5 5A.5.5 0 0 0 .5 6h1.875v7H1.5a.5.5 0 0 0 0 1h13a.5.5 0 1 0 0-1h-.875V6H15.5a.5.5 0 0 0 .277-.916zM12.375 6v7h-1.25V6zm-2.5 0v7h-1.25V6zm-2.5 0v7h-1.25V6zm-2.5 0v7h-1.25V6zM8 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2M.5 15a.5.5 0 0 0 0 1h15a.5.5 0 1 0 0-1z" />
          </svg>
          <span className="ms-2">Banks</span>
        </div>

        <div
          className={
            'w-100 border-bottom d-flex align-items-center ps-5' +
            (selected == 4 ? ' bg-info-subtle' : '')
          }
          style={{ height: '40px', cursor: 'pointer' }}
          onClick={() => {
            setSelected(4)
          }}
        >
          <svg
            className="bi bi-toggles"
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path d="M4.5 9a3.5 3.5 0 1 0 0 7h7a3.5 3.5 0 1 0 0-7zm7 6a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5m-7-14a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5m2.45 0A3.5 3.5 0 0 1 8 3.5 3.5 3.5 0 0 1 6.95 6h4.55a2.5 2.5 0 0 0 0-5zM4.5 0h7a3.5 3.5 0 1 1 0 7h-7a3.5 3.5 0 1 1 0-7" />
          </svg>
          <span className="ms-2">More</span>
        </div>
      </div>
      <div className="area-second border-top overflow-y-auto d-flex flex-column align-items-center">
        {selected > 1 && (
          <>
            {/*
            <div
              className="border border-2 rounded d-flex flex-column gap-2 mt-auto mb-auto"
              style={{ height: '150px', width: '400px' }}
            >
        
              <h5 className="mt-4 ms-5">Appearance</h5>
              <div className="mt-2 ms-auto me-auto d-flex gap-5">
                <div className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="inlineRadioOptions"
                    id="whitemode"
                    value="white"
                    checked={!darkMode}
                    onClick={() => {
                      setDarkMode(false)
                    }}
                  />
                  <label className="form-check-label mt-1 fs-6" htmlFor="whitemode">
                    White Mode
                  </label>
                </div>
                <div className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="inlineRadioOptions"
                    id="darkmode"
                    value="dark"
                    checked={darkMode}
                    onClick={() => {
                      setDarkMode(true)
                    }}
                  />
                  <label className="form-check-label mt-1 fs-6" htmlFor="darkmode">
                    Dark Mode
                  </label>
                </div>
              </div>

              <div className="input-group w-75 ms-auto me-auto mt-4">
                <span className="input-group-text" id="addon-wrapping">
                  Currency
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder={currency}
                  aria-label="currency"
                  aria-describedby="addon-wrapping"
                  maxLength={1}
                  minLength={1}
                />
              </div>
            </div>*/}

            <div
              className="border border-2 rounded d-flex flex-column gap-2 mt-auto mb-auto"
              style={{ height: '180px', width: '400px' }}
            >
              <h5 className="mt-4 ms-5">Security</h5>

              <div className="mt-2 form-check form-switch ms-5">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="lockscreen"
                  checked={hasPin}
                  disabled={!hasPin}
                  data-bs-toggle="modal"
                  data-bs-target="#pinmodal"
                  onClick={(e) => {
                    e.preventDefault()
                    setRemovePin(true)
                  }}
                />
                <label className="form-check-label mt-1" htmlFor="lockscreen">
                  Lock Screen
                </label>
              </div>

              <button
                type="button"
                className="btn btn-outline-secondary ms-5 me-5 mt-2"
                data-bs-toggle="modal"
                data-bs-target="#pinmodal"
              >
                {hasPin ? 'Change PIN' : 'Create PIN'}
              </button>
            </div>

            <div
              className="border border-2 rounded d-flex flex-column gap-2 mt-auto mb-auto"
              style={{ height: '150px', width: '400px' }}
            >
              <h5 className="mt-4 ms-5">Data</h5>

              <div className="m-auto d-inline-flex gap-4">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={async () => {
                    try {
                      // Step 1: Get all table names directly from the sqlite_master table
                      const tablesQuery = `SELECT name FROM sqlite_master WHERE type='table';`
                      const tablesData = await window.api.Database(tablesQuery)
                      const tables = tablesData.map((row) => row.name) // Extract table names

                      let jsonContent = {}

                      // Step 2: Fetch and format data for each table
                      for (const table of tables) {
                        // If sqlite sequence ignore
                        if (table === 'sqlite_sequence') continue

                        const query = `SELECT * FROM ${table};`
                        const data = await window.api.Database(query) // Fetch all data for the current table

                        // Only proceed if data is returned
                        if (data.length > 0) {
                          // Step 3: Add table data to jsonContent
                          jsonContent[table] = data
                        }
                      }

                      // Step 4: Convert the jsonContent to a JSON string
                      const jsonString = JSON.stringify(jsonContent, null, 2) // Pretty print JSON with 2 spaces indentation

                      // Step 5: Trigger the download of the JSON content
                      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' })
                      const link = document.createElement('a')
                      const url = URL.createObjectURL(blob)
                      link.setAttribute('href', url)
                      link.setAttribute('download', 'database_export.json')
                      link.style.visibility = 'hidden'
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                    } catch (error) {
                      console.error('Error exporting tables to JSON:', error)
                    }
                  }}
                >
                  Backup & Export
                </button>

                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  style={{ display: 'none' }}
                  id="importInput"
                />
                <label htmlFor="importInput" className="btn btn-outline-primary">
                  Import
                </label>

                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={async () => {
                    // Step 1: Get all table names directly from the sqlite_master table
                    const tablesQuery = `SELECT name FROM sqlite_master WHERE type='table';`
                    const tablesData = await window.api.Database(tablesQuery)
                    const tables = tablesData.map((row) => row.name) // Extract table names

                    // Step 2: Delete all tables
                    for (const table of tables) {
                      if (table !== 'sqlite_sequence') {
                        // Ignore sqlite_sequence table
                        await window.api.Database(`DROP TABLE IF EXISTS ${table};`)
                      }
                    }
                  }}
                >
                  Delete All
                </button>
              </div>
            </div>
          </>
        )}
        {selected == 0 && (
          <div
            className="border border-2 rounded d-flex flex-column gap-2 mt-auto mb-auto"
            style={{ height: '250px', width: '360px' }}
          >
            <h5 className="mt-4 ms-4">Account</h5>
            <div className="ms-5 d-inline-flex gap-2">
              <h5 className="mt-4 text-center">Name:</h5>
              <h5 className="mt-4 text-center">{localStorage.getItem('user:name')}</h5>
            </div>
            <div className="ms-5 d-inline-flex gap-3">
              <h5 className="text-center">Email:</h5>
              <h5 className="text-center">{localStorage.getItem('user:email')}</h5>
            </div>

            <div className="m-auto d-inline-flex gap-4">
              <a
                href={WEBSITE + '/Settings'}
                className="btn btn-outline-primary"
                target="_blank"
                style={{ width: '200px' }}
                rel="noreferrer"
              >
                Manage
              </a>
              <a
                href="#"
                className="btn btn-outline-danger"
                style={{ width: '100px' }}
                onClick={async (e) => {
                  e.preventDefault()
                  await window.api.Logout()
                  localStorage.removeItem('user:email')
                  localStorage.removeItem('user:name')
                  window.location.replace('#')
                  window.location.reload()
                }}
              >
                Sign Out
              </a>
            </div>
          </div>
        )}
        {selected == 1 && (
          <div>
            <div
              className="border border-2 rounded d-flex flex-column gap-2"
              style={{ height: '160px', width: '360px', marginTop: '50px' }}
            >
              <h5 className="mt-4 ms-4">Bank connections</h5>

              {feedback && (
                <h6 className={'ms-4 ' + feedback.class}>
                  {feedback.index == -1 && feedback.message}
                </h6>
              )}

              <div className="m-auto d-inline-flex gap-4">
                <a
                  href="#"
                  className={
                    'btn btn-outline-primary ' + (loading || banks.length >= 5 ? 'disabled' : '')
                  }
                  aria-disabled={loading || banks.length >= 5 ? 'true' : 'false'}
                  style={{ width: '200px' }}
                  onClick={async (e) => {
                    e.preventDefault()
                    // Start feedback loading on connec button
                    setLoading(true)
                    setFeedback(undefined) // Reset feedback message
                    try {
                      // Create link token
                      const response = await createLinkToken(setFeedback, -1)
                      if (response.ok) {
                        // responste data
                        const data = await response.json()

                        // Use the lin_token from response to get the public token
                        const handler = Plaid.create({
                          token: data.link_token,
                          onSuccess: async (public_token, _metadata) => {
                            // Send a feedback message
                            setFeedback({
                              class: 'text-info-emphasis',
                              message: 'Almost there...',
                              index: -1
                            })

                            // Exchange public token for access_token
                            const bankData: { institution_id; institution_name } =
                              await exchangePublicToken(public_token)

                            if (bankData) {
                              // Insert Bank id and name to the banks database
                              const lastInserted: BANK = await window.api.Utils(
                                `
                                  INSERT INTO banks (id, institution_name)
                                  VALUES (?, ?)
                                  ON CONFLICT(id) DO UPDATE SET 
                                      institution_name = excluded.institution_name;
                                                                `,
                                [bankData.institution_id, bankData.institution_name]
                              )

                              // Get initial transaction data
                              await transactionsRefresh(
                                lastInserted.id,
                                lastInserted.cursor ?? null,
                                lastInserted.institution_name
                              )
                            }

                            // Refresh list of banks
                            setRefresh(!refresh)
                            // Stop connect loading
                            setLoading(false)
                            // Reset feedback message
                            setFeedback(undefined)

                            // Start feedback loading on refresh all button
                            setRefreshLoading({ index: -1 })

                            // Stop loading refresh all button
                            setRefreshLoading(undefined)
                          },
                          onExit: async (err, metadata) => {
                            setLoading(false)
                            console.error(err, metadata)
                          }
                        })
                        handler.open()
                      } else setLoading(false)
                      setRefreshLoading(undefined)
                    } catch (error) {
                      setRefreshLoading(undefined)
                      setLoading(false)
                      window.api.showError(
                        `Something has gone wrong. Please report the error.\nError code: 1.0v014`
                      )
                      console.error(error)
                    }
                  }}
                >
                  Connect
                  {loading && (
                    <div className="ms-2 spinner-grow spinner-grow-sm" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  )}
                </a>
              </div>
            </div>

            {banks?.map((values: BANK, index) => {
              return (
                <div
                  key={index}
                  className="border border-2 rounded d-flex flex-column gap-2 mb-5"
                  style={{ height: '180px', width: '380px', marginTop: '50px' }}
                >
                  <h5 className="mt-3 ms-4">{values.institution_name}</h5>
                  {feedback && (
                    <h6 className={'ms-4 ' + feedback.class}>
                      {feedback.index == index && feedback.message}
                    </h6>
                  )}

                  <div className="mt-2 form-check form-switch ms-5">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      id="activebank"
                      checked={values.enabled === 1}
                      onClick={async (e) => {
                        e.preventDefault()

                        // Disable/Enable bank sync
                        await window.api.Utils(
                          `
                          UPDATE banks 
                          SET  
                            enabled = ?
                          WHERE id = ?;`,
                          [values.enabled === 1 ? 0 : 1, values.id]
                        )
                        setRefresh(!refresh)
                      }}
                    />
                    <label className="form-check-label mt-1" htmlFor="activebank">
                      Active
                    </label>
                  </div>

                  {index == refreshLoading?.index && (
                    <div
                      className="progress ms-auto me-auto"
                      role="progressbar"
                      aria-valuenow={100}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      style={{ height: '4px', width: '90%' }}
                    >
                      <div className="progress-bar progress-bar-striped progress-bar-animated w-100"></div>
                    </div>
                  )}

                  <div className="m-auto d-inline-flex gap-4">
                    <a
                      href="#"
                      className={
                        'btn btn-outline-secondary ' +
                        (refreshLoading?.index == index || values.enabled === 0 ? 'disabled' : '')
                      }
                      aria-disabled={
                        refreshLoading?.index == index || values.enabled === 0 ? 'true' : 'false'
                      }
                      style={{ width: '100px' }}
                      onClick={async (e) => {
                        e.preventDefault()
                        // Start loading feedback and refresh
                        setRefreshLoading({ index })
                        await transactionsRefresh(
                          values.id,
                          values.cursor ?? null,
                          values.institution_name
                        )
                        // Stop loading
                        setRefreshLoading(undefined)
                        setRefresh(!refresh)
                      }}
                    >
                      Refresh
                    </a>

                    <a
                      href="#"
                      className={
                        'btn btn-outline-primary ' +
                        (refreshLoading?.index == index ? 'disabled' : '')
                      }
                      aria-disabled={refreshLoading?.index == index ? 'true' : 'false'}
                      style={{ width: '100px' }}
                      onClick={async (e) => {
                        e.preventDefault()
                        // Start loading feedback and refresh
                        setRefreshLoading({ index })
                        try {
                          // Manage token
                          const response = await createLinkToken(setFeedback, index, values.id)

                          if (response.ok) {
                            // responste data
                            const data = await response.json()

                            // Use the lin_token from response to get the public token
                            const handler = Plaid.create({
                              token: data.link_token,
                              onSuccess: async (_public_token, _metadata) => {
                                // Stop loading
                                setRefreshLoading(undefined)
                                setRefresh(!refresh)
                              },
                              onExit: async (err, metadata) => {
                                console.error(err, metadata)
                                setRefreshLoading(undefined)
                                setRefresh(!refresh)
                              }
                            })
                            handler.open()
                          }
                        } catch (error) {
                          setRefreshLoading(undefined)
                          window.api.showError(
                            `Something has gone wrong. Please report the error.\nError code: 1.0v016`
                          )
                          console.error(error)
                        }
                      }}
                    >
                      Manage
                    </a>

                    <a
                      href="#"
                      className={
                        'btn btn-outline-danger ' +
                        (refreshLoading?.index == index ? 'disabled' : '')
                      }
                      aria-disabled={refreshLoading?.index == index ? 'true' : 'false'}
                      style={{ width: '100px' }}
                      onClick={async (e) => {
                        e.preventDefault()
                        setRefreshLoading({ index })

                        const respose = await deleteLinkToken(values.id)

                        if (respose.ok) {
                          // Delete all bank transactions
                          await window.api.Database(
                            `DELETE FROM revenue WHERE institution_id = ?;`,
                            [values.id]
                          )
                          await window.api.Database(
                            `DELETE FROM expense WHERE institution_id = ?;`,
                            [values.id]
                          )

                          // Delete bank from banks
                          await window.api.Utils(`DELETE FROM banks WHERE id = ?;`, [values.id])

                          setRefresh(!refresh)
                          setFeedback(undefined)
                        } else
                          window.api.showError(`Something has gone wrong. Please try again later.`)
                        setRefreshLoading(undefined)
                      }}
                    >
                      Delete
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Settings
