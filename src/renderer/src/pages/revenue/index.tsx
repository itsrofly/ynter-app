// React
import { useState, useEffect } from 'react'
import currencies from '../../assets/iso-country-currency.json'

// Components
import NewReceipt from '../../components/receipt'
import {
  ReceiptList,
  FormState,
  fetchAmountByTimeline,
  fetchAmountByCategory,
  fetchCurrentAmount,
  fetchReceipt,
  handleSubmitReceipt,
  handleUpdateReceipt,
  receiptCategory,
  BankType,
  NumberFormater,
  abbreviateString,
  NumberFormaterData
} from '../../components/support'

// Recharts
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

// MUI
import dayjs, { Dayjs } from 'dayjs'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

// Icons
import ArrowBack from '../../assets/arrow_back.svg'
import ArrowUp from '../../assets/arrow_forward.svg'
import Search from '@renderer/components/search'

declare const bootstrap

const CustomIconRevenue = (props: {
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
    case 'Income':
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
          <path d="M160-120q-33 0-56.5-23.5T80-200v-440q0-33 23.5-56.5T160-720h160v-80q0-33 23.5-56.5T400-880h160q33 0 56.5 23.5T640-800v80h160q33 0 56.5 23.5T880-640v440q0 33-23.5 56.5T800-120H160Zm0-80h640v-440H160v440Zm240-520h160v-80H400v80ZM160-200v-440 440Z" />
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
    case 'Transfer in':
      return (
        <svg
          x={goodX - 12}
          y={y}
          xmlns="http://www.w3.org/2000/svg"
          height={height}
          width={width}
          fill="#FFFFFF"
          className="bi bi-box-arrow-in-left"
          viewBox="0 0 16 16"
        >
          <path
            fillRule="evenodd"
            d="M10 3.5a.5.5 0 0 0-.5-.5h-8a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 1 1 0v2A1.5 1.5 0 0 1 9.5 14h-8A1.5 1.5 0 0 1 0 12.5v-9A1.5 1.5 0 0 1 1.5 2h8A1.5 1.5 0 0 1 11 3.5v2a.5.5 0 0 1-1 0z"
          />
          <path
            fillRule="evenodd"
            d="M4.146 8.354a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H14.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708z"
          />
        </svg>
      )
    case 'Savings':
      return (
        <svg
          x={goodX - 12}
          y={y}
          xmlns="http://www.w3.org/2000/svg"
          height={height}
          width={width}
          fill="#FFFFFF"
          className="bi bi-piggy-bank"
          viewBox="0 0 16 16"
        >
          <path d="M5 6.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0m1.138-1.496A6.6 6.6 0 0 1 7.964 4.5c.666 0 1.303.097 1.893.273a.5.5 0 0 0 .286-.958A7.6 7.6 0 0 0 7.964 3.5c-.734 0-1.441.103-2.102.292a.5.5 0 1 0 .276.962" />
          <path
            fillRule="evenodd"
            d="M7.964 1.527c-2.977 0-5.571 1.704-6.32 4.125h-.55A1 1 0 0 0 .11 6.824l.254 1.46a1.5 1.5 0 0 0 1.478 1.243h.263c.3.513.688.978 1.145 1.382l-.729 2.477a.5.5 0 0 0 .48.641h2a.5.5 0 0 0 .471-.332l.482-1.351c.635.173 1.31.267 2.011.267.707 0 1.388-.095 2.028-.272l.543 1.372a.5.5 0 0 0 .465.316h2a.5.5 0 0 0 .478-.645l-.761-2.506C13.81 9.895 14.5 8.559 14.5 7.069q0-.218-.02-.431c.261-.11.508-.266.705-.444.315.306.815.306.815-.417 0 .223-.5.223-.461-.026a1 1 0 0 0 .09-.255.7.7 0 0 0-.202-.645.58.58 0 0 0-.707-.098.74.74 0 0 0-.375.562c-.024.243.082.48.32.654a2 2 0 0 1-.259.153c-.534-2.664-3.284-4.595-6.442-4.595M2.516 6.26c.455-2.066 2.667-3.733 5.448-3.733 3.146 0 5.536 2.114 5.536 4.542 0 1.254-.624 2.41-1.67 3.248a.5.5 0 0 0-.165.535l.66 2.175h-.985l-.59-1.487a.5.5 0 0 0-.629-.288c-.661.23-1.39.359-2.157.359a6.6 6.6 0 0 1-2.157-.359.5.5 0 0 0-.635.304l-.525 1.471h-.979l.633-2.15a.5.5 0 0 0-.17-.534 4.65 4.65 0 0 1-1.284-1.541.5.5 0 0 0-.446-.275h-.56a.5.5 0 0 1-.492-.414l-.254-1.46h.933a.5.5 0 0 0 .488-.393m12.621-.857a.6.6 0 0 1-.098.21l-.044-.025c-.146-.09-.157-.175-.152-.223a.24.24 0 0 1 .117-.173c.049-.027.08-.021.113.012a.2.2 0 0 1 .064.199"
          />
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

export const RevenueCategory = (index: number): { Icon; Label } => {
  switch (index) {
    case 0:
      return {
        Icon: CustomIconRevenue({ width: '18px', height: '18px', payload: { value: 'Income' } }),
        Label: 'Income'
      }
    case 1:
      return {
        Icon: CustomIconRevenue({
          width: '18px',
          height: '18px',
          payload: { value: 'Investments' }
        }),
        Label: 'Investments'
      }
    case 2:
      return {
        Icon: CustomIconRevenue({
          width: '18px',
          height: '18px',
          payload: { value: 'Transfer in' }
        }),
        Label: 'Transfer in'
      }
    case 3:
      return {
        Icon: CustomIconRevenue({ width: '18px', height: '18px', payload: { value: 'Savings' } }),
        Label: 'Savings'
      }
    default:
      return {
        Icon: CustomIconRevenue({ width: '18px', height: '18px', payload: { value: 'Others' } }),
        Label: 'Others'
      }
  }
}

function Revenue(): JSX.Element {
  // Refresh everything
  const [refresh, setRefresh] = useState(false)
  // Revenue value
  const [revenueValue, setRevenueValue] = useState<number>(0)

  // Revenue chart
  const [monthRevenue, setMonthRevenue] = useState<boolean>(true)
  const [revenueData, setRevenueData] = useState([])

  // Revenue chart order by category
  const [monthRevenueCat, setMonthRevenueCat] = useState<boolean>(true)
  const [revenueDataCat, setRevenueDataCat] = useState([])

  //  Revenue informations
  const [monthReceipt, setMonthReceipt] = useState<boolean>(true)
  const [Receipts, setReceipts] = useState<ReceiptList[]>([])
  const [dateList, setDateList] = useState<Dayjs>(dayjs())
  const [selectedOption, setSelectedOption] = useState('-1')

  // Search Informations about receipt
  const [searchId, setSearchId] = useState("")

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

  // Fetch all revenue amount separate by month or year
  useEffect(() => {
    const fetchBalance = async (): Promise<void> => {
      setRevenueData(await fetchAmountByTimeline(monthRevenue ? 'm' : 'y', 'revenue'))
    }
    fetchBalance()
  }, [monthRevenue, refresh])

  // Fetch all revenue amount separate by category
  useEffect(() => {
    const fetchBalance = async (): Promise<void> => {
      // Fetch all revenue amount separate by category of the previus and current month or year
      setRevenueDataCat(await fetchAmountByCategory(monthRevenueCat ? '%Y-%m' : '%Y', 'revenue'))

      // Revenue amount of this year or month
      setRevenueValue(await fetchCurrentAmount(monthRevenueCat ? '%Y-%m' : '%Y', 'revenue'))
    }
    fetchBalance()
  }, [monthRevenueCat, refresh])

  // Fetch all revenue in list of this month or year
  useEffect(() => {
    const fetchBalance = async (): Promise<void> => {
      setReceipts(
        await fetchReceipt(monthReceipt ? '%Y-%m' : '%Y', 'revenue', dateList, selectedOption)
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
        table="revenue"
        handleSubmit={formSubmit ? handleSubmitReceipt : handleUpdateReceipt}
        refresh={refresh}
        setRefresh={setRefresh}
        form={formValue}
      />
      <Search table="revenue" id={searchId} />

      <div className="area-top mt-3">
        <button
          type="button"
          className="btn btn-sm text-center secondary text-white"
          style={{ width: '120px', height: '32px' }}
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
          New
        </button>
      </div>
      <div className="area-first w-100 h-100">
        <div className="position-relative d-flex flex-column w-100 h-100 bg-white rounded shadow-sm">
          <div
            className="shadow
               z-2 rounded-4 fourth position-absolute d-flex justify-content-center align-items-center
              top-0 start-50 translate-middle border-0"
            style={{ marginTop: '40px', width: '98%', height: '95%' }}
          >
            <ResponsiveContainer width="100%" height="90%">
              <BarChart
                data={revenueDataCat}
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
                    <CustomIconRevenue
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
                {revenueValue}
                {currency}
              </div>
              <div>
                <button
                  type="button"
                  className={
                    'btn btn-sm text-center me-2 border-0 remove-focus' +
                    (monthRevenueCat ? ' secondary text-white' : '')
                  }
                  onClick={() => setMonthRevenueCat(true)}
                >
                  Month
                </button>
                <button
                  type="button"
                  className={
                    'btn btn-sm text-center me-2 border-0 remove-focus' +
                    (!monthRevenueCat ? ' secondary text-white' : '')
                  }
                  onClick={() => setMonthRevenueCat(false)}
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
               z-2 rounded-4 fourth position-absolute d-flex justify-content-center align-items-center
              top-0 start-50 translate-middle border-0"
            style={{ marginTop: '40px', width: '98%', height: '95%' }}
          >
            <ResponsiveContainer width="100%" height="90%">
              <LineChart
                data={revenueData}
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
                <Line type="monotone" dataKey="Revenue" stroke="white" activeDot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-auto m-3">
            <div className="d-flex align-items-end justify-content-between h-100">
              <div>Revenue</div>
              <div>
                <button
                  type="button"
                  className={
                    'btn border-0 remove-focus btn-sm text-center me-2' +
                    (monthRevenue ? ' secondary text-white' : '')
                  }
                  onClick={() => setMonthRevenue(true)}
                >
                  Month
                </button>
                <button
                  type="button"
                  className={
                    'btn border-0 remove-focus btn-sm text-center me-2' +
                    (!monthRevenue ? ' secondary text-white' : '')
                  }
                  onClick={() => setMonthRevenue(false)}
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
            <div className="d-flex align-items-end justify-content-between  h-100">
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
                  {receiptCategory('revenue').map((data, index) => {
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
                <img src={ArrowUp} alt="arrowBack" />
              </button>
            </div>
          </div>
        </div>
        <div className="grid-content w-100">
          {Receipts.map((value, index) => {
            const revenues: FormState[] = JSON.parse(value.Rows)

            return (
              <div key={index}>
                <div className="mt-5 ms-3" style={{ fontSize: '19px' }}>
                  {value.Timeline}
                </div>

                <div className="ms-5 w-100">
                  <div className="row row-cols-auto">
                    {revenues.map((rev, jndex) => {
                      const category = RevenueCategory(Number(rev.category))
                      const bankType = BankType(Number(rev.type))

                      return (
                        <div
                          className="col mt-5 mb-1"
                          key={jndex}
                          style={{ height: '150px', width: '300px' }}
                        >
                          <div className="position-relative d-flex flex-column w-100 h-100 bg-white rounded shadow-sm">
                            <div
                              className="shadow
                                                                    z-2 rounded-4 fourth position-absolute d-flex
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
                                    {abbreviateString(rev.name, 20)}
                                    {Boolean(rev.recurring) && (
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
                                      {abbreviateString(rev.bank, 20)}
                                    </h6>
                                  </div>

                                  {rev.file_name && (
                                    <div
                                      className="d-flex align-items-start"
                                      style={{ cursor: 'pointer' }}
                                      onClick={async () => {
                                        window.api.showSavefile(rev.file_path)
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
                                        {abbreviateString(rev.file_name, 20)}
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
                                          setFormValue(rev)
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
                                          setSearchId(rev.id ?? "")
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
                                  {rev.amount}
                                  {currency}
                                </div>
                                <div>{new Date(rev.date).toDateString()}</div>
                              </div>
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
          })}
        </div>
      </div>
    </div>
  )
}

export default Revenue
