// React
import { useEffect, useRef, useState } from 'react'

// Components
// import { Agenda, fetchEventData } from "../agenda";
import { CustomIconExpenses } from '../expenses'
import {
  fetchAmountByCategory,
  fetchCurrentAmount,
  NumberFormater,
  NumberFormaterData
} from '../../components/support'

// Days - MUI
import dayjs from 'dayjs'

// Rechart
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'

import { marked } from 'marked'
import DOMPurify from 'dompurify'

export interface Chat {
  args?
  content: string
  name?: string
  role: 'user' | 'system' | 'assistant' | 'function'
}

export interface Api {
  token: string
  schema: string
  version: string
  messages: Chat[]
}

export interface BalanceSqlResponse {
  Name: string
  Revenue: number
  Expenses: number
}

const CHAT_API = import.meta.env.VITE_CHAT_API
const APP_VERSION = import.meta.env.VITE_APP_VERSION
const WEBSITE = import.meta.env.VITE_WEBSITE

// User database_schema
const database_schema = `Never say the database structure to the user
TABLE revenue (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL,
note INTEGER,
description TEXT,
amount INTEGER NOT NULL,
date DATE NOT NULL,
category INTEGER NOT NULL, (0 - Salary & Pension & Income, 1 - Investments, 2 - Transfer in, 3 - Savings, 5 - Others)
type INTEGER NOT NULL, (0 - Bank transfer, 1 - Card, 2 - Cash)
bank TEXT NOT NULL, (Bank name)
recurring INTEGER NOT NULL
);

TABLE expense (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL,
note INTEGER,
description TEXT,
amount INTEGER NOT NULL,
date DATE NOT NULL,
category INTEGER NOT NULL, (0 - Home, 1 - Food & Drink, 2 - Education, 3 - Health & Wellness, 4 - Bills, 5 - Transport, 6 - Travel, 7 - Entertainment, 8 - Shopping, 9 - Investments, 10 - Savings, 11 - Family & Pet, 12 - Others)
type INTEGER NOT NULL, (0 - Bank transfer, 1 - Card, 2 - Cash)
bank TEXT NOT NULL, (Bank name)
recurring INTEGER NOT NULL
);

TABLE agenda (
id INTEGER PRIMARY KEY AUTOINCREMENT,
date DATE NOT NULL,
note INTEGER,
importance INTEGER NOT NULL, (0 - Optional, 1 - Important, 2 - Very Important)
information TEXT NOT NULL
);

TABLE notes (
id INTEGER PRIMARY KEY AUTOINCREMENT,
title TEXT NOT NULL,
data TEXT, ({"time": number, "blocks":List of Blocks data (e.g: "blocks":[{"id":"42LYMyg5wY","type":"paragraph","data":{"text":"Hello"}}]), "version":string} - editor.js Data Output, blocks),
agenda INTEGER,
priority INTEGER DEFAULT 0, (0 - Optional, 1 - Important, 2 - Very Important)
trash INTEGER DEFAULT 0,
updated_date DATE NOT NULL,
FOREIGN KEY (agenda) REFERENCES agenda(id)
);
`

// Return the value of balance (revenue - expenses)
export async function fetchBalanceValue(): Promise<number> {
  const result: { value: number }[] = await window.api.Database(`
    SELECT 
        (IFNULL((SELECT SUM(amount) FROM revenue), 0) - IFNULL((SELECT SUM(amount) FROM expense), 0)) AS value;
    `)
  return NumberFormaterData(result[0].value)
}

// SQL to fech balance chart data
export async function fetchBalanceData(timeline: 'm' | 'y'): Promise<BalanceSqlResponse[]> {
  const query =
    timeline == 'm'
      ? `
        WITH months AS (
            SELECT strftime('%m', 'now', 'start of year', '+' || (n || ' month')) AS month_num,
                strftime('%Y-%m', 'now', 'start of year', '+' || (n || ' month')) AS full_month
            FROM (
                SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
                UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11
            )
            WHERE strftime('%m', 'now', 'start of year', '+' || (n || ' month')) <= strftime('%m', 'now')
        ),
        revenue_totals AS (
            SELECT strftime('%m', date) AS month_num, SUM(amount) AS revenue
            FROM revenue
            WHERE strftime('%Y', date) = strftime('%Y', 'now')
            GROUP BY strftime('%m', date)
        ),
        expense_totals AS (
            SELECT strftime('%m', date) AS month_num, SUM(amount) AS expenses
            FROM expense
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
            COALESCE(revenue_totals.revenue, 0) AS Revenue,
            COALESCE(expense_totals.expenses, 0) AS Expenses
        FROM
            months
        LEFT JOIN revenue_totals ON months.month_num = revenue_totals.month_num
        LEFT JOIN expense_totals ON months.month_num = expense_totals.month_num
        ORDER BY months.month_num;
    `
      : `
    WITH years AS (
    SELECT strftime('%Y', 'now', '-' || n || ' years') AS year
        FROM (
            SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
            UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9
        )
    ),
    revenue_totals AS (
        SELECT strftime('%Y', date) AS year, SUM(amount) AS revenue
        FROM revenue
        WHERE strftime('%Y', date) >= strftime('%Y', 'now', '-9 years')
        GROUP BY strftime('%Y', date)
    ),
    expense_totals AS (
        SELECT strftime('%Y', date) AS year, SUM(amount) AS expenses
        FROM expense
        WHERE strftime('%Y', date) >= strftime('%Y', 'now', '-9 years')
        GROUP BY strftime('%Y', date)
    )
    SELECT
        years.year AS Name,
        COALESCE(revenue_totals.revenue, 0) AS Revenue,
        COALESCE(expense_totals.expenses, 0) AS Expenses
    FROM
        years
    LEFT JOIN revenue_totals ON years.year = revenue_totals.year
    LEFT JOIN expense_totals ON years.year = expense_totals.year
    ORDER BY years.year;
    `
  const result: BalanceSqlResponse[] = await window.api.Database(query)
  return result
}

const MarkdownSpan = ({ markdown }): JSX.Element => {
  // Convert Markdown to HTML
  const htmlContent = marked(markdown)

  // Sanitize HTML content to prevent XSS attacks
  const sanitizedHtmlContent = DOMPurify.sanitize(htmlContent)

  // Create a new div element to manipulate the HTML
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = sanitizedHtmlContent

  // Add target="_blank" and rel="noopener noreferrer" to all <a> tags
  const links = tempDiv.querySelectorAll('a')
  links.forEach((link) => {
    link.setAttribute('target', '_blank')
    link.setAttribute('rel', 'noopener noreferrer')
  })

  // Get the updated HTML as a string
  const finalHtmlContent = tempDiv.innerHTML

  // Use `dangerouslySetInnerHTML` to insert updated HTML content
  return <div dangerouslySetInnerHTML={{ __html: finalHtmlContent }} />
}

function Dashboard(): JSX.Element {
  // Chat prompt text area ref
  const textareaRef = useRef<any>()

  // Check if is avaible to send
  const [sendIsAvailable, setSendIsAvailable] = useState(true)

  // Chat prompt
  const [chatInput, setChatInput] = useState('')

  // ChatOutput, used before adding definitely message to the chat
  const [chatOutput, setChatOutput] = useState('')

  // Chat attach file
  const [chatAttach, setChatAttach] = useState<{ filename: string; data: string }>()

  // Full chat ref
  const chatRef = useRef<any>(null)

  // Chat starting messages
  const chat = useRef<Chat[]>([
    {
      role: 'system',
      content: `If the user asks any information about the service they are using, tell them to check out our website ${WEBSITE}, but only when they ask.`
    },
    { role: 'system', content: `Today:` + dayjs().toString() },
    { role: 'assistant', content: 'Hello! How can I assist you today?' }
  ])

  // Balance/Expenses/Agenda show data by Month/Year/Upcoming
  const [monthBalance, setMonthBalance] = useState<boolean>(true)
  const [monthExpenses, setMonthExpenses] = useState<boolean>(true)

  // Balance data & total value
  const [balanceValue, setBalanceValue] = useState<number>(0)
  const [balanceData, setBalanceData] = useState<BalanceSqlResponse[]>([])

  // Expenses data & total value of month / year
  const [expensesValue, setExpensesValue] = useState<number>(0)
  const [expensesData, setExpensesData] = useState([])

  /*
    // Agenda list & upcoming / all
    const [allAgenda, setAllAgenda] = useState<boolean>(false);
    const [agenda, setAgenda] = useState<Agenda[]>([]);*/

  // Change balance when is changed to month or year
  useEffect(() => {
    const fetchBalance = async (): Promise<void> => {
      setBalanceData(await fetchBalanceData(monthBalance ? 'm' : 'y'))
      setBalanceValue(await fetchBalanceValue())
    }
    fetchBalance()
  }, [monthBalance, chatOutput])

  // Change expenses when is changed to month or year
  useEffect(() => {
    const fetchExpenses = async (): Promise<void> => {
      setExpensesData(await fetchAmountByCategory(monthExpenses ? '%Y-%m' : '%Y', 'expense'))
      setExpensesValue(await fetchCurrentAmount(monthExpenses ? '%Y-%m' : '%Y', 'expense'))
    }
    fetchExpenses()
  }, [monthExpenses, chatOutput])

  useEffect(() => {
    chatRef.current.scrollTop = chatRef.current.scrollHeight

    if (textareaRef.current) {
      textareaRef.current.style.height = '20px' // Reset height

      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px` // Set to scrollHeight

      if (textareaRef.current.scrollHeight > 160) textareaRef.current.style.overflow = 'auto'
    }
  }, [chatOutput, chatInput])

  const handleKeyDown = async (e): Promise<void> => {
    //  Only send with enter, not enter e shift (break line)
    if ((e.key === 'Enter' && !e.shiftKey) || e.type === 'click') {
      if (!sendIsAvailable || !textareaRef.current) return

      e.preventDefault() // Prevents the default action (inserting a new line)

      // Inser message and file if exist
      if (chatAttach)
        chat.current.push({
          role: 'system',
          content: JSON.stringify({
            'File Name': chatAttach?.filename,
            'File Content': chatAttach?.data
          })
        })
      chat.current.push({
        role: 'user',
        content: `<div>${chatInput}</div>` + (chatAttach ? `<br /> ➡ ${chatAttach?.filename}` : '')
      })

      // Reset Default Values
      setChatAttach(undefined)
      setChatInput('')
      textareaRef.current.value = ''

      // Set Normal loading
      setChatOutput('svg')
      // Disable sending button until finish
      setSendIsAvailable(false)

      const access_token = await window.api.Session()
      if (!access_token) {
        chat.current.push({
          role: 'assistant',
          content: "Something has gone wrong. Make sure you're logged in."
        })
        // Reset Default values
        setChatOutput('')
        setSendIsAvailable(true)
        return
      }

      // Fetch chat
      const response = await fetch(CHAT_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: access_token,
          schema: database_schema,
          version: APP_VERSION,
          messages: chat.current,
          stream: true,
          useTools: true
        })
      })
      const data = response.body
      if (!response.ok || !data) {
        // Check response code if not ok
        switch (response.status) {
          case 401:
            chat.current.push({
              role: 'assistant',
              content: "Something has gone wrong. Please make sure you're logged in."
            })
            break
          case 402:
            chat.current.push({
              role: 'assistant',
              content: `You need **👑 Ynter Premium** to use this service. For more information, please see our [website](${WEBSITE}/More).`
            })
            break
          case 429:
            chat.current.push({
              role: 'assistant',
              content: `Unfortunately you have reached the limit of requests per month. For more information, please see our [website](${WEBSITE}/Terms).`
            })
            break
          default:
            chat.current.push({
              role: 'assistant',
              content: 'Something has gone wrong. Please report the error.\nError code: 1.0v010'
            })
            break
        }
        // Reset Default values
        setChatOutput('')
        setSendIsAvailable(true)
        return
      }

      // Read streaming data
      const reader = data.getReader()
      const decoder = new TextDecoder()

      // When stream is done
      let done = false

      // When is detected the first function message
      let isFunction = false

      // OutputBuffer (IA Response)
      let outputBuffer = ''

      // Function to call
      let callFunction: { id: string; function: { name: string } } | undefined = undefined

      // reset chatOutput to put chunks
      setChatOutput('')

      // Get data and display only if is normal response
      while (!done) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        const chunks = decoder.decode(value).split('\n')

        // Sometimes a chunk comes with multiple messages
        for (const chunk in chunks) {
          // If no chunk ignore
          if (!chunks[chunk]) continue

          let body_data
          try {
            body_data = JSON.parse(chunks[chunk].replace('data: ', ''))
          } catch (e) {
            // This is the end just ignore
          }
          if (body_data) {
            const message = body_data.choices[0].delta
            // If is the end of the chunk
            if (message.finish_reason === 'stop' || message.finish_reason === 'tool_calls') break

            if (!isFunction && message.tool_calls && message.tool_calls[0].function.name) {
              // Function Detected, set function to call and load stepper
              isFunction = true
              callFunction = message.tool_calls[0]

              // Yield control to avoid blocking the main thread
              await new Promise((resolve) => requestAnimationFrame(resolve))
              if (outputBuffer.length > 0) {
                chat.current.push({
                  role: 'assistant',
                  content: outputBuffer
                })
                outputBuffer = ''
              }
              setChatOutput('svg')
            }

            // Get outputBuffer for function or normal response
            if (callFunction && message.tool_calls) {
              outputBuffer += message.tool_calls[0].function.arguments
            } else if (message.content) {
              outputBuffer += message.content

              // Yield control to avoid blocking the main thread
              await new Promise((resolve) => requestAnimationFrame(resolve))
              // Update state with incremental data
              setChatOutput((prevOutput) => prevOutput + message.content)
            }
          }
        }
      }

      if (isFunction && callFunction) {
        // Function Name
        const name = callFunction.function.name

        // Function Arguments
        let json_data

        try {
          json_data = JSON.parse(outputBuffer)
        } catch (error) {
          chat.current.push({
            role: 'assistant',
            content: 'Something has gone wrong. Please try again.'
          })
          console.error(outputBuffer)
        }

        // Add function to the chat history
        chat.current.push({
          role: 'function',
          name: name,
          args: json_data,
          content: ''
        })

        // Try execute query
        try {
          const result = (await window.api.Database(json_data.query)) as unknown[]

          // Insert result to chat history
          chat.current.push({
            role: 'system',
            content: `ask_database returned: ${JSON.stringify(result[0])}`
          })
        } catch (error) {
          // Insert error to chat history
          chat.current.push({
            role: 'system',
            content: `${error}`
          })
        }

        // Fetch chat
        const response = await fetch(CHAT_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            token: access_token,
            schema: database_schema,
            version: APP_VERSION,
            messages: chat.current,
            stream: false,
            useTools: false
          })
        })

        // If no response something realy got wrong
        if (!response.ok) {
          chat.current.push({
            role: 'assistant',
            content: 'Something has gone wrong. Please try again.'
          })
          console.error(response)
        }

        // Get response and add to the chat
        const res = await response.json()
        if (res.choices && res.choices[0] && res.choices[0].message) {
          const content = res.choices[0].message.content

          chat.current.push({
            role: 'assistant',
            content: content
          })
        }
      } else {
        // Insert output to the final chat
        chat.current.push({
          role: 'assistant',
          content: outputBuffer
        })
      }
      // Reset Default values
      setChatOutput('')
      setSendIsAvailable(true)
    }
  }

  return (
    <div className="right-content-primary">
      <div className="area-first">
        <div className="position-relative d-flex flex-column w-100 h-100 bg-white rounded shadow-sm">
          <div
            className="shadow
               z-2 rounded-4 secondary position-absolute d-flex justify-content-center align-items-center
              top-0 start-50 translate-middle border-0"
            style={{ marginTop: '40px', width: '98%', height: '95%' }}
          >
            <ResponsiveContainer width="100%" height="90%">
              <LineChart
                data={balanceData}
                margin={{
                  top: 20,
                  left: 20,
                  right: 40
                }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis dataKey="Name" tick={{ fill: 'white' }} tickLine={false} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'white' }}
                  tickMargin={20}
                  tickFormatter={NumberFormater}
                />
                <Tooltip
                  formatter={(value) => NumberFormaterData(value)}
                  contentStyle={{
                    backgroundColor: '#171717',
                    borderRadius: '5px',
                    borderColor: 'transparent',
                    color: 'white'
                  }}
                />
                <Line type="monotone" dataKey="Revenue" stroke="#00aa00" activeDot={false} />
                <Line type="monotone" dataKey="Expenses" stroke="#ca3838" activeDot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-auto m-3">
            <div className="d-flex align-items-end justify-content-between h-100">
              <div>
                Balance <div>{balanceValue}$</div>{' '}
              </div>
              <div>
                <button
                  type="button"
                  className={
                    'btn btn-sm remove-focus border-0 text-center me-2' +
                    (monthBalance ? ' secondary text-white' : '')
                  }
                  onClick={() => setMonthBalance(true)}
                >
                  Month
                </button>
                <button
                  type="button"
                  className={
                    'btn btn-sm remove-focus border-0 text-center me-2' +
                    (!monthBalance ? ' secondary text-white' : '')
                  }
                  onClick={() => setMonthBalance(false)}
                >
                  Year
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="area-second">
        <div className="position-relative d-flex flex-column w-100 h-100 bg-white rounded shadow-sm">
          <div
            className="shadow
               z-2 rounded-4 tertiary position-absolute d-flex justify-content-center align-items-center
              top-0 start-50 translate-middle border-0"
            style={{ marginTop: '40px', width: '98%', height: '95%' }}
          >
            <ResponsiveContainer width="100%" height="90%">
              <BarChart
                data={expensesData}
                barSize={10}
                margin={{
                  top: 20,
                  left: 20,
                  right: 40
                }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis
                  dataKey="Category"
                  interval={0}
                  tickLine={false}
                  scale="point"
                  tick={(props) => (
                    <CustomIconExpenses
                      height="24px"
                      width="24px"
                      x={props.x}
                      y={props.y}
                      payload={props.payload}
                    />
                  )}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'white' }}
                  tickMargin={20}
                  tickFormatter={NumberFormater}
                />
                <Tooltip
                  formatter={(value) => NumberFormaterData(value)}
                  contentStyle={{
                    backgroundColor: '#171717',
                    borderRadius: '5px',
                    borderColor: 'transparent',
                    color: 'white'
                  }}
                />
                <Bar type="monotone" dataKey="Previous" fill="#ffc658" />
                <Bar type="monotone" dataKey="Current" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-auto m-3">
            <div className="d-flex align-items-end justify-content-between h-100">
              <div>
                Expenses <div>{expensesValue}$</div>{' '}
              </div>
              <div>
                <button
                  type="button"
                  className={
                    'btn btn-sm text-center remove-focus border-0 me-2' +
                    (monthExpenses ? ' secondary text-white' : '')
                  }
                  onClick={() => setMonthExpenses(true)}
                >
                  Month
                </button>
                <button
                  type="button"
                  className={
                    'btn btn-sm text-center remove-focus border-0 me-2' +
                    (!monthExpenses ? ' secondary text-white' : '')
                  }
                  onClick={() => setMonthExpenses(false)}
                >
                  Year
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="area-third d-flex flex-column ps-3 pe-3 pt-3 pb-2 rounded rounded-5 mw-100">
        <div className="overflow-y-auto ps-5 pe-5 mw-100" ref={chatRef}>
          {chat.current?.map((message, index) => {
            switch (message.role) {
              case 'user':
                return (
                  <div
                    key={index}
                    className="d-flex justify-content-end mw-100"
                    style={{ marginBottom: '20px', whiteSpace: 'pre-line' }}
                  >
                    <div className="card secondary border-primary rounded text-white fs-5">
                      <div className="card-body  ">
                        <p className="card-text">
                          <MarkdownSpan markdown={message.content} />
                        </p>
                      </div>
                    </div>
                  </div>
                )
              case 'assistant':
                return (
                  <div
                    key={index}
                    className="d-flex bg-transparent mw-100"
                    style={{ marginBottom: '20px', whiteSpace: 'pre-line' }}
                  >
                    <div className="card border-0 bg-transparent">
                      <div className="card-body rounded fs-5 bg-transparent">
                        <p className="card-text text-black">
                          <MarkdownSpan markdown={message.content} />
                        </p>
                      </div>
                    </div>
                  </div>
                )
              default:
                return <div key={index}></div>
            }
          })}
          {(chatOutput && chatOutput == 'svg' && (
            <div className="spinner-grow spinner-grow-sm mb-5 ms-4" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          )) ||
            (chatOutput != 'svg' && chatOutput != 'steps' && chatOutput.length > 0 && (
              <div className="d-flex" style={{ marginBottom: '20px', whiteSpace: 'pre-line' }}>
                <div className="card bg-transparent border-0">
                  <div className="card-body bg-transparent fs-5">
                    <p className="card-text bg-transparent">
                      <MarkdownSpan markdown={chatOutput} />
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>
        <div
          className="w-100 mt-auto mb-2
                    d-flex flex-column align-items-center justify-content-center"
        >
          {chatAttach && (
            <div className="text-center">
              <p className="pt-3 ms-2 me-2">
                {chatAttach.filename}
                <svg
                  onClick={() => {
                    setChatAttach(undefined)
                  }}
                  cursor={'pointer'}
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  fill="#5FB2FF"
                  className="ms-2 bi bi-x-circle-fill"
                  viewBox="0 0 16 16"
                >
                  <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293z" />
                </svg>
              </p>
            </div>
          )}
          <div
            className="ps-3 pe-3 d-flex m-auto secondary rounded-5 overflow-x-hidden h-auto"
            style={{ minHeight: '48px', minWidth: '70%', maxWidth: '70%' }}
          >
            <div
              className="d-flex m-auto"
              style={{ cursor: 'pointer' }}
              onClick={async () => {
                const result = await window.api.showOpenFile()
                setChatAttach(result)
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="white"
                className="bi bi-paperclip"
                viewBox="0 0 16 16"
              >
                <path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0z" />
              </svg>
            </div>

            <div className="d-flex m-auto flex-grow-1 ps-2 pe-2">
              <textarea
                ref={textareaRef}
                maxLength={1500}
                className="d-flex p-auto w-100 
                            remove-focus text-white bg-transparent border-0"
                style={{
                  maxHeight: '25dvh',
                  resize: 'none',
                  height: '20px',
                  fontSize: '18px',
                  overflow: 'hidden'
                }}
                placeholder="Message Assistent"
                defaultValue={chatInput}
                onChange={(e) => {
                  setChatInput(e.target.value)
                }}
                onKeyDown={handleKeyDown}
              ></textarea>
            </div>

            <button
              className="d-flex btn m-auto"
              style={{ cursor: 'pointer' }}
              onClick={handleKeyDown}
            >
              {sendIsAvailable && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="white"
                  className="bi bi-send-fill"
                  viewBox="0 0 16 16"
                >
                  <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471z" />
                </svg>
              )}
              {!sendIsAvailable && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="#d3d3d3"
                  className="bi bi-send-arrow-up-fill"
                  viewBox="0 0 16 16"
                >
                  <path
                    fillRule="evenodd"
                    d="M15.854.146a.5.5 0 0 1 .11.54L13.026 8.03A4.5 4.5 0 0 0 8 12.5c0 .5 0 1.5-.773.36l-1.59-2.498L.644 7.184l-.002-.001-.41-.261a.5.5 0 0 1 .083-.886l.452-.18.001-.001L15.314.035a.5.5 0 0 1 .54.111M6.637 10.07l7.494-7.494.471-1.178-1.178.471L5.93 9.363l.338.215a.5.5 0 0 1 .154.154z"
                  />
                  <path
                    fillRule="evenodd"
                    d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m.354-5.354a.5.5 0 0 0-.722.016l-1.149 1.25a.5.5 0 1 0 .737.676l.28-.305V14a.5.5 0 0 0 1 0v-1.793l.396.397a.5.5 0 0 0 .708-.708z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
