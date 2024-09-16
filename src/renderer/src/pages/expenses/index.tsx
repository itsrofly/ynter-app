// React
import { useState, useEffect } from 'react'
import currencies from '../../assets/javascript/iso-country-currency.json'

// Components
import NewReceipt from '../../components/receipt'

import {
  abbreviateString,
  BankType,
  fetchAmountByCategory,
  fetchAmountByTimeline,
  fetchCurrentAmount,
  fetchReceipt,
  FormState,
  handleSubmitReceipt,
  handleUpdateReceipt,
  NumberFormater,
  NumberFormaterData,
  receiptCategory,
  ReceiptList
} from '../../components/support'

// Recharts
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  BarChart,
  Bar
} from 'recharts'

// MUI
import dayjs, { Dayjs } from 'dayjs'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

// Icons
import ArrowBack from '../../assets/icons/arrow_back.svg'
import ArrowUp from '../../assets/icons/arrow_forward.svg'
import Search from '@renderer/components/search'

declare const bootstrap

export const CustomIconExpenses = (props: {
  width: string
  height: string
  x?: number
  y?: number
  payload: { value: string | number }
}): JSX.Element => {
  const { x, y, payload, height, width } = props
  let goodX = x
  if (!goodX) goodX = 0
  switch (payload.value) {
    case 'Home':
      return (
        <svg
          x={goodX - 12}
          y={y}
          xmlns="http://www.w3.org/2000/svg"
          height={height}
          viewBox="0 -960 960 960"
          width={width}
          fill="#FFFFFF"
        >
          <path d="M200-160v-366L88-440l-48-64 440-336 160 122v-82h120v174l160 122-48 64-112-86v366H520v-240h-80v240H200Zm80-80h80v-240h240v240h80v-347L480-739 280-587v347Zm120-319h160q0-32-24-52.5T480-632q-32 0-56 20.5T400-559Zm-40 319v-240h240v240-240H360v240Z" />
        </svg>
      )
    case 'Food':
      return (
        <svg
          x={goodX - 12}
          y={y}
          xmlns="http://www.w3.org/2000/svg"
          height={height}
          viewBox="0 -960 960 960"
          width={width}
          fill="#FFFFFF"
        >
          <path d="M280-80v-366q-51-14-85.5-56T160-600v-280h80v280h40v-280h80v280h40v-280h80v280q0 56-34.5 98T360-446v366h-80Zm400 0v-320H560v-280q0-83 58.5-141.5T760-880v800h-80Z" />
        </svg>
      )
    case 'Education':
      return (
        <svg
          x={goodX - 12}
          y={y}
          xmlns="http://www.w3.org/2000/svg"
          height={height}
          viewBox="0 -960 960 960"
          width={width}
          fill="#FFFFFF"
        >
          <path d="M480-120 200-272v-240L40-600l440-240 440 240v320h-80v-276l-80 44v240L480-120Zm0-332 274-148-274-148-274 148 274 148Zm0 241 200-108v-151L480-360 280-470v151l200 108Zm0-241Zm0 90Zm0 0Z" />
        </svg>
      )
    case 'Health':
      return (
        <svg
          x={goodX - 12}
          y={y}
          xmlns="http://www.w3.org/2000/svg"
          height={height}
          viewBox="0 -960 960 960"
          width={width}
          fill="#FFFFFF"
        >
          <path d="M420-340h120v-100h100v-120H540v-100H420v100H320v120h100v100Zm60 260q-139-35-229.5-159.5T160-516v-244l320-120 320 120v244q0 152-90.5 276.5T480-80Zm0-84q104-33 172-132t68-220v-189l-240-90-240 90v189q0 121 68 220t172 132Zm0-316Z" />
        </svg>
      )
    case 'Bills':
      return (
        <svg
          x={goodX - 12}
          y={y}
          xmlns="http://www.w3.org/2000/svg"
          height={height}
          viewBox="0 -960 960 960"
          width={width}
          fill="#FFFFFF"
        >
          <path d="M240-80q-50 0-85-35t-35-85v-120h120v-560l60 60 60-60 60 60 60-60 60 60 60-60 60 60 60-60 60 60 60-60v680q0 50-35 85t-85 35H240Zm480-80q17 0 28.5-11.5T760-200v-560H320v440h360v120q0 17 11.5 28.5T720-160ZM360-600v-80h240v80H360Zm0 120v-80h240v80H360Zm320-120q-17 0-28.5-11.5T640-640q0-17 11.5-28.5T680-680q17 0 28.5 11.5T720-640q0 17-11.5 28.5T680-600Zm0 120q-17 0-28.5-11.5T640-520q0-17 11.5-28.5T680-560q17 0 28.5 11.5T720-520q0 17-11.5 28.5T680-480ZM240-160h360v-80H200v40q0 17 11.5 28.5T240-160Zm-40 0v-80 80Z" />
        </svg>
      )
    case 'Transport':
      return (
        <svg
          x={goodX - 12}
          y={y}
          xmlns="http://www.w3.org/2000/svg"
          height={height}
          viewBox="0 -960 960 960"
          width={width}
          fill="#FFFFFF"
        >
          <path d="M240-120q-17 0-28.5-11.5T200-160v-82q-18-20-29-44.5T160-340v-380q0-83 77-121.5T480-880q172 0 246 37t74 123v380q0 29-11 53.5T760-242v82q0 17-11.5 28.5T720-120h-40q-17 0-28.5-11.5T640-160v-40H320v40q0 17-11.5 28.5T280-120h-40Zm242-640h224-448 224Zm158 280H240h480-80Zm-400-80h480v-120H240v120Zm100 240q25 0 42.5-17.5T400-380q0-25-17.5-42.5T340-440q-25 0-42.5 17.5T280-380q0 25 17.5 42.5T340-320Zm280 0q25 0 42.5-17.5T680-380q0-25-17.5-42.5T620-440q-25 0-42.5 17.5T560-380q0 25 17.5 42.5T620-320ZM258-760h448q-15-17-64.5-28.5T482-800q-107 0-156.5 12.5T258-760Zm62 480h320q33 0 56.5-23.5T720-360v-120H240v120q0 33 23.5 56.5T320-280Z" />
        </svg>
      )
    case 'Travel':
      return (
        <svg
          x={goodX - 12}
          y={y}
          xmlns="http://www.w3.org/2000/svg"
          height={height}
          viewBox="0 -960 960 960"
          width={width}
          fill="#FFFFFF"
        >
          <path d="M340-80v-60l80-60v-220L80-320v-80l340-200v-220q0-25 17.5-42.5T480-880q25 0 42.5 17.5T540-820v220l340 200v80L540-420v220l80 60v60l-140-40-140 40Z" />
        </svg>
      )
    case 'Entertainment':
      return (
        <svg
          x={goodX - 12}
          y={y}
          xmlns="http://www.w3.org/2000/svg"
          height={height}
          viewBox="0 -960 960 960"
          width={width}
          fill="#FFFFFF"
        >
          <path d="M182-200q-51 0-79-35.5T82-322l42-300q9-60 53.5-99T282-760h396q60 0 104.5 39t53.5 99l42 300q7 51-21 86.5T778-200q-21 0-39-7.5T706-230l-90-90H344l-90 90q-15 15-33 22.5t-39 7.5Zm16-86 114-114h336l114 114q2 2 16 6 11 0 17.5-6.5T800-304l-44-308q-4-29-26-48.5T678-680H282q-30 0-52 19.5T204-612l-44 308q-2 11 4.5 17.5T182-280q2 0 16-6Zm482-154q17 0 28.5-11.5T720-480q0-17-11.5-28.5T680-520q-17 0-28.5 11.5T640-480q0 17 11.5 28.5T680-440Zm-80-120q17 0 28.5-11.5T640-600q0-17-11.5-28.5T600-640q-17 0-28.5 11.5T560-600q0 17 11.5 28.5T600-560ZM310-440h60v-70h70v-60h-70v-70h-60v70h-70v60h70v70Zm170-40Z" />
        </svg>
      )
    case 'Shopping':
      return (
        <svg
          x={goodX - 12}
          y={y}
          xmlns="http://www.w3.org/2000/svg"
          height={height}
          viewBox="0 -960 960 960"
          width={width}
          fill="#FFFFFF"
        >
          <path d="M240-80q-33 0-56.5-23.5T160-160v-480q0-33 23.5-56.5T240-720h80q0-66 47-113t113-47q66 0 113 47t47 113h80q33 0 56.5 23.5T800-640v480q0 33-23.5 56.5T720-80H240Zm0-80h480v-480h-80v80q0 17-11.5 28.5T600-520q-17 0-28.5-11.5T560-560v-80H400v80q0 17-11.5 28.5T360-520q-17 0-28.5-11.5T320-560v-80h-80v480Zm160-560h160q0-33-23.5-56.5T480-800q-33 0-56.5 23.5T400-720ZM240-160v-480 480Z" />
        </svg>
      )
    case 'Investments':
      return (
        <svg
          x={goodX - 12}
          y={y}
          xmlns="http://www.w3.org/2000/svg"
          height={height}
          viewBox="0 -960 960 960"
          width={width}
          fill="#FFFFFF"
        >
          <path d="M320-414v-306h120v306l-60-56-60 56Zm200 60v-526h120v406L520-354ZM120-216v-344h120v224L120-216Zm0 98 258-258 142 122 224-224h-64v-80h200v200h-80v-64L524-146 382-268 232-118H120Z" />
        </svg>
      )
    case 'Savings':
      return (
        <svg
          x={goodX - 12}
          y={y}
          xmlns="http://www.w3.org/2000/svg"
          height={height}
          viewBox="0 -960 960 960"
          width={width}
          fill="#FFFFFF"
        >
          <path d="M640-520q17 0 28.5-11.5T680-560q0-17-11.5-28.5T640-600q-17 0-28.5 11.5T600-560q0 17 11.5 28.5T640-520Zm-320-80h200v-80H320v80ZM180-120q-34-114-67-227.5T80-580q0-92 64-156t156-64h200q29-38 70.5-59t89.5-21q25 0 42.5 17.5T720-820q0 6-1.5 12t-3.5 11q-4 11-7.5 22.5T702-751l91 91h87v279l-113 37-67 224H480v-80h-80v80H180Zm60-80h80v-80h240v80h80l62-206 98-33v-141h-40L620-720q0-20 2.5-38.5T630-796q-29 8-51 27.5T547-720H300q-58 0-99 41t-41 99q0 98 27 191.5T240-200Zm240-298Z" />
        </svg>
      )
    case 'Family':
      return (
        <svg
          x={goodX - 12}
          y={y}
          xmlns="http://www.w3.org/2000/svg"
          height={height}
          viewBox="0 -960 960 960"
          width={width}
          fill="#FFFFFF"
        >
          <path d="M720-720q-33 0-56.5-23.5T640-800q0-33 23.5-56.5T720-880q33 0 56.5 23.5T800-800q0 33-23.5 56.5T720-720ZM680-80v-320q0-40-20.5-72T607-522l35-103q8-25 29.5-40t48.5-15q27 0 48.5 15t29.5 40l102 305H800v240H680ZM500-500q-25 0-42.5-17.5T440-560q0-25 17.5-42.5T500-620q25 0 42.5 17.5T560-560q0 25-17.5 42.5T500-500ZM220-720q-33 0-56.5-23.5T140-800q0-33 23.5-56.5T220-880q33 0 56.5 23.5T300-800q0 33-23.5 56.5T220-720ZM140-80v-280H80v-240q0-33 23.5-56.5T160-680h120q33 0 56.5 23.5T360-600v240h-60v280H140Zm300 0v-160h-40v-160q0-25 17.5-42.5T460-460h80q25 0 42.5 17.5T600-400v160h-40v160H440Z" />
        </svg>
      )
    default:
      return (
        <svg
          x={goodX - 12}
          y={y}
          xmlns="http://www.w3.org/2000/svg"
          height={height}
          viewBox="0 -960 960 960"
          width={width}
          fill="#FFFFFF"
        >
          <path d="M440-280h80v-160h160v-80H520v-160h-80v160H280v80h160v160Zm40 200q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
        </svg>
      )
  }
}

const ExpensesCategory = (index: number): { Icon; Label: string } => {
  switch (index) {
    case 0:
      return {
        Icon: CustomIconExpenses({ width: '18px', height: '18px', payload: { value: 'Home' } }),
        Label: 'Home'
      }
    case 1:
      return {
        Icon: CustomIconExpenses({ width: '18px', height: '18px', payload: { value: 'Food' } }),
        Label: 'Food'
      }
    case 2:
      return {
        Icon: CustomIconExpenses({
          width: '18px',
          height: '18px',
          payload: { value: 'Education' }
        }),
        Label: 'Education'
      }
    case 3:
      return {
        Icon: CustomIconExpenses({ width: '18px', height: '18px', payload: { value: 'Health' } }),
        Label: 'Health'
      }
    case 4:
      return {
        Icon: CustomIconExpenses({ width: '18px', height: '18px', payload: { value: 'Bills' } }),
        Label: 'Bills'
      }
    case 5:
      return {
        Icon: CustomIconExpenses({
          width: '18px',
          height: '18px',
          payload: { value: 'Transport' }
        }),
        Label: 'Transport'
      }
    case 6:
      return {
        Icon: CustomIconExpenses({ width: '18px', height: '18px', payload: { value: 'Travel' } }),
        Label: 'Travel'
      }
    case 7:
      return {
        Icon: CustomIconExpenses({
          width: '18px',
          height: '18px',
          payload: { value: 'Entertainment' }
        }),
        Label: 'Entertainment'
      }
    case 8:
      return {
        Icon: CustomIconExpenses({ width: '18px', height: '18px', payload: { value: 'Shopping' } }),
        Label: 'Shopping'
      }
    case 9:
      return {
        Icon: CustomIconExpenses({
          width: '18px',
          height: '18px',
          payload: { value: 'Investments' }
        }),
        Label: 'Investments'
      }
    case 10:
      return {
        Icon: CustomIconExpenses({ width: '18px', height: '18px', payload: { value: 'Savings' } }),
        Label: 'Savings'
      }
    case 11:
      return {
        Icon: CustomIconExpenses({ width: '18px', height: '18px', payload: { value: 'Family' } }),
        Label: 'Family'
      }
    default:
      return {
        Icon: CustomIconExpenses({ width: '18px', height: '18px', payload: { value: 'Others' } }),
        Label: 'Others'
      }
  }
}

function Expenses(): JSX.Element {
  // Refresh everything
  const [refresh, setRefresh] = useState(false)
  // Expense value
  const [expensesValue, setExpensesValue] = useState<number>(0)

  // Expense chart
  const [monthExpenses, setMonthExpenses] = useState<boolean>(true)
  const [expensesData, setExpensesData] = useState([])

  // Expense chart order by category
  const [monthExpensesCat, setMonthExpensesCat] = useState<boolean>(true)
  const [expensesDataCat, setExpensesDataCat] = useState([])

  //  Expenses informations
  const [monthReceipt, setMonthReceipt] = useState<boolean>(true)
  const [Receipts, setReceipts] = useState<ReceiptList[]>([])
  const [dateList, setDateList] = useState<Dayjs>(dayjs())
  const [selectedOption, setSelectedOption] = useState('-1')

  // Search Informations about receipt
  const [searchId, setSearchId] = useState('')

  // Form State
  const [formValue, setFormValue] = useState<FormState>({
    name: '',
    amount: '',
    description: '',
    date: '',
    category: '0',
    type: '0',
    bank: '',
    recurring: false,
    file_name: '',
    file_path: ''
  })
  const [formSubmit, setFormSubmit] = useState(true)

  // Currency
  const [currency, setCurrency] = useState('$')

  // Reset form values when this component is refresh
  useEffect(() => {
    setFormValue({
      name: '',
      amount: '',
      description: '',
      date: '',
      category: '0',
      type: '0',
      bank: '',
      recurring: false,
      file_name: '',
      file_path: ''
    })
  }, [refresh])

  // Fetch all expense amount separate by month or year
  useEffect(() => {
    const fetchBalance = async (): Promise<void> => {
      setExpensesData(await fetchAmountByTimeline(monthExpenses ? 'm' : 'y', 'expense'))
    }
    fetchBalance()
  }, [monthExpenses, refresh])

  // Fetch all expense amount separate by category
  useEffect(() => {
    const fetchBalance = async (): Promise<void> => {
      // Fetch all ex+emse amount separate by category of the previus and current month or year
      setExpensesDataCat(await fetchAmountByCategory(monthExpensesCat ? '%Y-%m' : '%Y', 'expense'))

      // Expense amount of this year or month
      setExpensesValue(await fetchCurrentAmount(monthExpensesCat ? '%Y-%m' : '%Y', 'expense'))
    }

    fetchBalance()
  }, [monthExpensesCat, refresh])

  // Fetch all expenses in list of this month or year
  useEffect(() => {
    const fetchBalance = async (): Promise<void> => {
      setReceipts(
        await fetchReceipt(monthReceipt ? '%Y-%m' : '%Y', 'expense', dateList, selectedOption)
      )
    }
    fetchBalance()
  }, [monthReceipt, dateList, selectedOption, refresh])

  // Setup Currency
  useEffect(() => {
    const loadCurrency = async () => {
      const symbol = currencies[await window.api.countryCode()].symbol ?? '$'
      // Set initial currency
      setCurrency(symbol)
    }
    loadCurrency()
  })

  return (
    <div className="right-content-primary">
      <NewReceipt
        table="expense"
        handleSubmit={formSubmit ? handleSubmitReceipt : handleUpdateReceipt}
        refresh={refresh}
        setRefresh={setRefresh}
        form={formValue}
      />
      <Search table="expense" id={searchId} />
      <div className="area-top mt-4 ms-1 me-1">

        <button
          type="button"
          className="btn btn-sm text-center secondary text-white"
          style={{ width: '150px', height: '32px' }}
          onClick={() => {
            setFormValue({
              name: '',
              amount: '',
              description: '',
              date: '',
              category: '0',
              type: '0',
              bank: '',
              recurring: false,
              file_name: '',
              file_path: ''
            })
            setFormSubmit(true)
            const myModalEl = document.getElementById('staticBackdrop')
            const modal = new bootstrap.Modal(myModalEl)
            modal.show()
          }}
        >
          Add Expenses
        </button>
      </div>
      <div className="area-first w-100 h-100">
        <div className="position-relative d-flex flex-column w-100 h-100 bg-white rounded shadow-sm">
          <div
            className="shadow
               z-2 rounded-4 tertiary position-absolute d-flex justify-content-center align-items-center
              top-0 start-50 translate-middle border-0"
            style={{ marginTop: '40px', width: '98%', height: '95%' }}
          >
            <ResponsiveContainer width="100%" height="90%">
              <BarChart
                data={expensesDataCat}
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
                {expensesValue}
                {currency}
              </div>
              <div>
                <button
                  type="button"
                  className={
                    'btn btn-sm text-center border-0 remove-focus me-2' +
                    (monthExpensesCat ? ' secondary text-white' : '')
                  }
                  onClick={() => setMonthExpensesCat(true)}
                >
                  Month
                </button>
                <button
                  type="button"
                  className={
                    'btn btn-sm text-center border-0 remove-focus me-2' +
                    (!monthExpensesCat ? ' secondary text-white' : '')
                  }
                  onClick={() => setMonthExpensesCat(false)}
                >
                  Year
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="area-second w-100 h-100">
        <div className="position-relative d-flex flex-column w-100 h-100 bg-white rounded shadow-sm">
          <div
            className="shadow
               z-2 rounded-4 tertiary position-absolute d-flex justify-content-center align-items-center
              top-0 start-50 translate-middle border-0"
            style={{ marginTop: '40px', width: '98%', height: '95%' }}
          >
            <ResponsiveContainer width="100%" height="90%">
              <LineChart
                data={expensesData}
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
                <Line type="monotone" dataKey="Expense" stroke="white" activeDot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-auto m-3">
            <div className="d-flex align-items-end justify-content-between h-100">
              <div>Expenses</div>
              <div>
                <button
                  type="button"
                  className={
                    'btn btn-sm border-0 remove-focus text-center me-2' +
                    (monthExpenses ? ' secondary text-white' : '')
                  }
                  onClick={() => setMonthExpenses(true)}
                >
                  Month
                </button>
                <button
                  type="button"
                  className={
                    'btn btn-sm border-0 remove-focus text-center me-2' +
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

      <div className="area-third w-100 h-100 grid-list">
        <div className="grid-head">
          <div className="mt-auto m-3">
            <div className="d-flex align-items-end justify-content-between h-100">
              <div>
                <button
                  type="button"
                  className={
                    'btn border-0 remove-focus btn-sm text-center me-2' +
                    (monthReceipt ? ' secondary text-white' : '')
                  }
                  style={{ width: '80px' }}
                  onClick={() => setMonthReceipt(true)}
                >
                  Month
                </button>
                <button
                  type="button"
                  className={
                    'btn border-0 remove-focus btn-sm text-center me-2' +
                    (!monthReceipt ? ' secondary text-white' : '')
                  }
                  style={{ width: '80px' }}
                  onClick={() => setMonthReceipt(false)}
                >
                  Year
                </button>
              </div>
              <div>
                <select
                  className="form-select custom-select"
                  value={selectedOption}
                  onChange={(ev) => {
                    setSelectedOption(ev.target.value)
                  }}
                >
                  {receiptCategory('expense').map((data, index) => {
                    return (
                      <option className="custom-option" key={index} value={data.value}>
                        {data.label}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>
          </div>

          <div className="w-100 rounded-4 secondary" style={{ height: '2px' }} />

          <div className="mt-3 m-3">
            <div className="d-flex align-items-center justify-content-between h-100">
              <button
                className="btn btn-sm secondary z-2"
                onClick={() => {
                  if (monthReceipt) setDateList(dateList.subtract(1, 'month'))
                  else setDateList(dateList.subtract(1, 'year'))
                }}
              >
                <img src={ArrowBack} alt="arrowBack" />
              </button>

              <h6>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    value={dateList}
                    onChange={(newValue) => setDateList(newValue || dayjs())}
                    views={monthReceipt ? ['month', 'year'] : ['year']}
                  />
                </LocalizationProvider>
              </h6>

              <button
                className="btn btn-sm secondary z-2"
                onClick={() => {
                  if (monthReceipt) setDateList(dateList.add(1, 'month'))
                  else setDateList(dateList.add(1, 'year'))
                }}
              >
                <img src={ArrowUp} alt="arrowUp" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid-content w-100">
          {Receipts.map((value, index) => {
            const expenses: FormState[] = JSON.parse(value.Rows)

            return (
              <div key={index}>
                <div className="mt-5" style={{ fontSize: '19px' }}>
                  {value.Timeline}
                </div>

                <div className="ms-5">
                  <div className="row row-cols-auto">
                    {expenses.map((exp, jndex) => {
                      const category = ExpensesCategory(Number(exp.category))
                      const bankType = BankType(Number(exp.type))

                      return (
                        <div
                          className="col mt-5 mb-1"
                          key={jndex}
                          style={{ height: '150px', width: '300px' }}
                        >
                          <div className="position-relative d-flex flex-column w-100 h-100 bg-white rounded shadow-sm">
                            <div
                              className="shadow z-2 rounded-4 tertiary position-absolute d-flex
                          	      top-0 start-50 translate-middle border-0 text-white"
                              style={{
                                marginTop: '40px',
                                width: '98%',
                                padding: '14px',
                                height: '85%'
                              }}
                            >
                              <div className="d-flex w-100">
                                <div className="d-flex w-100 flex-column">
                                  <h5>
                                    {abbreviateString(exp.name, 20)}
                                    {Boolean(exp.recurring) && (
                                      <a
                                        className="ms-1"
                                        data-bs-toggle="tooltip"
                                        data-bs-placement="top"
                                        data-bs-title="Recurring"
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="16"
                                          height="16"
                                          fill="white"
                                          className="bi bi-arrow-repeat"
                                          viewBox="0 0 16 16"
                                        >
                                          <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41m-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9" />
                                          <path
                                            fillRule="evenodd"
                                            d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5 5 0 0 0 8 3M3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9z"
                                          />
                                        </svg>
                                      </a>
                                    )}
                                  </h5>
                                  <div className=" d-flex align-items-start">
                                    {category?.Icon}
                                    <h6 className="ms-1" style={{ display: 'inline' }}>
                                      {category?.Label}
                                    </h6>
                                  </div>

                                  <div className=" d-flex align-items-start">
                                    {bankType.Icon}
                                    <h6 className="ms-1" style={{ display: 'inline' }}>
                                      {abbreviateString(exp.bank, 20)}
                                    </h6>
                                  </div>

                                  {exp.file_name && (
                                    <div
                                      className="d-flex align-items-start"
                                      style={{ cursor: 'pointer' }}
                                      onClick={async () => {
                                        window.api.showSavefile(exp.file_path)
                                      }}
                                    >
                                      <a className="icon-link icon-link-hover text-white link-underline-light ">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="24px"
                                          height="24px"
                                          fill="currentColor"
                                          className="bi bi-paperclip"
                                          viewBox="0 0 16 16"
                                        >
                                          <path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0z" />
                                        </svg>
                                        {abbreviateString(exp.file_name, 20)}
                                      </a>
                                    </div>
                                  )}
                                </div>

                                <div className="dropdown-center">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    fill="currentColor"
                                    className="bi bi-three-dots"
                                    viewBox="0 0 16 16"
                                    type="button"
                                    data-bs-toggle="dropdown"
                                  >
                                    <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3" />
                                  </svg>

                                  <ul
                                    className="dropdown-menu"
                                    // @ts-ignore
                                    style={{ '--bs-dropdown-min-width': '10px' }}
                                  >
                                    <li>
                                      <a
                                        className="dropdown-item"
                                        href="#"
                                        style={{ fontSize: '14px' }}
                                        onClick={(e) => {
                                          e.preventDefault()
                                          setFormValue(exp)
                                          setFormSubmit(false)
                                          const myModalEl =
                                            document.getElementById('staticBackdrop')
                                          const modal = new bootstrap.Modal(myModalEl)
                                          myModalEl
                                          modal.show()
                                        }}
                                      >
                                        Edit
                                      </a>
                                    </li>
                                    <li>
                                      <a
                                        className="dropdown-item"
                                        href="#"
                                        style={{ fontSize: '14px' }}
                                        onClick={(e) => {
                                          e.preventDefault()
                                          setSearchId(exp.id ?? '')
                                          const myChatEl = document.getElementById('searchBackdrop')
                                          const chat = new bootstrap.Modal(myChatEl)
                                          chat.show()
                                        }}
                                      >
                                        Search
                                      </a>
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            </div>

                            <div className="mt-auto m-3">
                              <div className="d-flex align-items-end justify-content-between h-100">
                                <div>
                                  {exp.amount}
                                  {currency}
                                </div>
                                <div>{new Date(exp.date).toDateString()}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
          <div className="w-100" style={{ height: '64px' }} />
        </div>
      </div>
    </div>
  )
}

export default Expenses
