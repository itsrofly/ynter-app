// React
import { useState, useEffect } from "react";

// Components
import NewReceipt from "../../components/receipt";
import {
    ReceiptList, FormState, fetchAmountByTimeline,
    fetchAmountByCategory, fetchCurrentAmount, fetchReceipt,
    handleSubmitReceipt, handleUpdateReceipt, receiptCategory, BankType,
    NumberFormater,
    abbreviateString,
    NumberFormaterData
} from "../../components/support";

// Recharts
import {
    Bar, BarChart, CartesianGrid, Line, LineChart,
    ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";

// MUI
import dayjs, { Dayjs } from "dayjs";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

// Icons
import ArrowBack from "../../assets/arrow_back.svg"
import ArrowUp from "../../assets/arrow_forward.svg"


declare const bootstrap: any;

const CustomIconRevenue = (props: { width: string, height: string, x?: number, y?: number, payload: { value: string | number } }) => {
    let { x, y, payload, height, width } = props;

    if (!x)
        x = 0;
    switch (payload.value) {
        case 'Work':
            return (
                <svg x={x - 12} y={y} xmlns="http://www.w3.org/2000/svg" height={height} viewBox="0 -960 960 960" width={width} fill="#FFFFFF"><path d="M160-120q-33 0-56.5-23.5T80-200v-440q0-33 23.5-56.5T160-720h160v-80q0-33 23.5-56.5T400-880h160q33 0 56.5 23.5T640-800v80h160q33 0 56.5 23.5T880-640v440q0 33-23.5 56.5T800-120H160Zm0-80h640v-440H160v440Zm240-520h160v-80H400v80ZM160-200v-440 440Z" /></svg>
            );
        case 'Bonus':
            return (
                <svg x={x - 12} y={y} xmlns="http://www.w3.org/2000/svg" height={height} viewBox="0 -960 960 960" width={width} fill="#FFFFFF"><path d="M160-80v-440H80v-240h208q-5-9-6.5-19t-1.5-21q0-50 35-85t85-35q23 0 43 8.5t37 23.5q17-16 37-24t43-8q50 0 85 35t35 85q0 11-2 20.5t-6 19.5h208v240h-80v440H160Zm400-760q-17 0-28.5 11.5T520-800q0 17 11.5 28.5T560-760q17 0 28.5-11.5T600-800q0-17-11.5-28.5T560-840Zm-200 40q0 17 11.5 28.5T400-760q17 0 28.5-11.5T440-800q0-17-11.5-28.5T400-840q-17 0-28.5 11.5T360-800ZM160-680v80h280v-80H160Zm280 520v-360H240v360h200Zm80 0h200v-360H520v360Zm280-440v-80H520v80h280Z" /></svg>
            );
        case 'Family':
            return (
                <svg x={x - 12} y={y} xmlns="http://www.w3.org/2000/svg" height={height} viewBox="0 -960 960 960" width={width} fill="#FFFFFF"><path d="M720-720q-33 0-56.5-23.5T640-800q0-33 23.5-56.5T720-880q33 0 56.5 23.5T800-800q0 33-23.5 56.5T720-720ZM680-80v-320q0-40-20.5-72T607-522l35-103q8-25 29.5-40t48.5-15q27 0 48.5 15t29.5 40l102 305H800v240H680ZM500-500q-25 0-42.5-17.5T440-560q0-25 17.5-42.5T500-620q25 0 42.5 17.5T560-560q0 25-17.5 42.5T500-500ZM220-720q-33 0-56.5-23.5T140-800q0-33 23.5-56.5T220-880q33 0 56.5 23.5T300-800q0 33-23.5 56.5T220-720ZM140-80v-280H80v-240q0-33 23.5-56.5T160-680h120q33 0 56.5 23.5T360-600v240h-60v280H140Zm300 0v-160h-40v-160q0-25 17.5-42.5T460-460h80q25 0 42.5 17.5T600-400v160h-40v160H440Z" /></svg>
            );
        case 'Cash Back':
            return (
                <svg x={x - 12} y={y} xmlns="http://www.w3.org/2000/svg" height={height} viewBox="0 -960 960 960" width={width} fill="#FFFFFF"><path d="M480-400q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm0 280q-139 0-241-91.5T122-440h82q14 104 92.5 172T480-200q117 0 198.5-81.5T760-480q0-117-81.5-198.5T480-760q-69 0-129 32t-101 88h110v80H120v-240h80v94q51-64 124.5-99T480-840q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-480q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-120Z" /></svg>
            )
        case 'Investments':
            return (
                <svg x={x - 12} y={y} xmlns="http://www.w3.org/2000/svg" height={height} viewBox="0 -960 960 960" width={width} fill="#FFFFFF"><path d="M320-414v-306h120v306l-60-56-60 56Zm200 60v-526h120v406L520-354ZM120-216v-344h120v224L120-216Zm0 98 258-258 142 122 224-224h-64v-80h200v200h-80v-64L524-146 382-268 232-118H120Z" /></svg>
            )
        default:
            return (
                <svg x={x - 12} y={y} xmlns="http://www.w3.org/2000/svg" height={height} viewBox="0 -960 960 960" width={width} fill="#FFFFFF"><path d="M440-280h80v-160h160v-80H520v-160h-80v160H280v80h160v160Zm40 200q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" /></svg>
            )
    }
}

export const RevenueCategory = (index: number) => {
    switch (index) {
        case 0:
            return { Icon: CustomIconRevenue({ width: "18px", height: "18px", payload: { value: "Work" } }), Label: 'Work' };
        case 1:
            return { Icon: CustomIconRevenue({ width: "18px", height: "18px", payload: { value: "Bonus" } }), Label: 'Bonus' };
        case 2:
            return { Icon: CustomIconRevenue({ width: "18px", height: "18px", payload: { value: "Family" } }), Label: 'Family' };
        case 3:
            return { Icon: CustomIconRevenue({ width: "18px", height: "18px", payload: { value: "Cash Back" } }), Label: 'Cash Back' };
        case 4:
            return { Icon: CustomIconRevenue({ width: "18px", height: "18px", payload: { value: "Investments" } }), Label: 'Investments' };
        default:
            return { Icon: CustomIconRevenue({ width: "18px", height: "18px", payload: { value: "Others" } }), Label: 'Others' };
    }
}

function Revenue() {
    // Refresh everything
    const [refresh, setRefresh] = useState(false);
    // Revenue value
    const [revenueValue, setRevenueValue] = useState<number>(0);

    // Revenue chart
    const [monthRevenue, setMonthRevenue] = useState<boolean>(true);
    const [revenueData, setRevenueData] = useState([]);

    // Revenue chart order by category
    const [monthRevenueCat, setMonthRevenueCat] = useState<boolean>(true);
    const [revenueDataCat, setRevenueDataCat] = useState([]);

    //  Revenue informations
    const [monthReceipt, setMonthReceipt] = useState<boolean>(true);
    const [Receipts, setReceipts] = useState<ReceiptList[]>([]);
    const [dateList, setDateList] = useState<Dayjs>(dayjs());
    const [selectedOption, setSelectedOption] = useState('-1');


    // Form State
    const [formValue, setFormValue] = useState<FormState>({
        name: "",
        amount: "",
        description: "",
        date: "",
        category: "0",
        type: "0",
        bank: "",
        recurring: false,
        file_name: "",
        file_path: ""
    })
    const [formSubmit, setFormSubmit] = useState(true);

      // Reset form values when this component is refresh
    useEffect(() => {
        setFormValue({
            name: "",
            amount: "",
            description: "",
            date: "",
            category: "0",
            type: "0",
            bank: "",
            recurring: false,
            file_name: "",
            file_path: ""
        })
    }, [refresh]);

      // Fetch all revenue amount separate by month or year
    useEffect(() => {
        const fetchBalance = async () => {
            setRevenueData(await fetchAmountByTimeline(monthRevenue ? "m" : "y", "revenue"));
        };
        fetchBalance();
    }, [monthRevenue, refresh]);

    // Fetch all revenue amount separate by category
    useEffect(() => {
        const fetchBalance = async () => {
            // Fetch all revenue amount separate by category of the previus and current month or year
            setRevenueDataCat(await fetchAmountByCategory(monthRevenueCat ? "%Y-%m" : "%Y", "revenue"));

            // Revenue amount of this year or month
            setRevenueValue(await fetchCurrentAmount(monthRevenueCat ? "%Y-%m" : "%Y", "revenue"));
        };
        fetchBalance();
    }, [monthRevenueCat, refresh]);


    
  // Fetch all revenue in list of this month or year
    useEffect(() => {
        const fetchBalance = async () => {
            setReceipts(await fetchReceipt(monthReceipt ? "%Y-%m" : "%Y", "revenue", dateList, selectedOption))
        };
        fetchBalance();
    }, [monthReceipt, dateList, selectedOption, refresh]);



    return (
        <div className="right-content-primary">
            <NewReceipt table="revenue" handleSubmit={formSubmit ? handleSubmitReceipt : handleUpdateReceipt} refresh={refresh} setRefresh={setRefresh} form={formValue} />
            <div className="area-top mt-3">
                <button type="button" className="btn btn-sm text-center secondary text-white"
                    style={{ width: "120px", height: "32px" }} onClick={
                        () => {
                            setFormValue({
                                name: "",
                                amount: "",
                                description: "",
                                date: "",
                                category: "0",
                                type: "0",
                                bank: "",
                                recurring: false,
                                file_name: "",
                                file_path: ""
                            })
                            setFormSubmit(true);
                            const myModalEl = document.getElementById('staticBackdrop');
                            var modal = new bootstrap.Modal(myModalEl)
                            modal.show()
                        }
                    }>
                    New
                </button>
            </div>
            <div className="area-first w-100 h-100">
                <div className="position-relative d-flex flex-column w-100 h-100 bg-white rounded shadow-sm">
                    <div className="shadow
               z-2 rounded-4 fourth position-absolute d-flex justify-content-center align-items-center
              top-0 start-50 translate-middle border-0" style={{ marginTop: "40px", width: "98%", height: "95%" }} >
                        <ResponsiveContainer width="100%" height="90%">
                            <BarChart
                                data={revenueDataCat}
                                barSize={10}
                                margin={{
                                    top: 20,
                                    left: 20,
                                    right: 40
                                }}>

                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis dataKey="Category" interval={0} tickLine={false} scale="point" tick={(props) => <CustomIconRevenue height="24px" width="24px" x={props.x} y={props.y} payload={props.payload} />} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'white' }} tickMargin={20} tickFormatter={NumberFormater} />
                                <Tooltip formatter={(value) => NumberFormaterData(value)}  contentStyle={{ backgroundColor: "#171717", borderRadius: '5px', borderColor: "transparent", color: "white"  }} />
                                <Bar type="monotone" dataKey="Previous" fill="#ffc658" />
                                <Bar type="monotone" dataKey="Current" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-auto m-3">
                        <div className="d-flex align-items-end justify-content-between h-100">
                            <div>{revenueValue}$</div>
                            <div>
                                <button type="button"
                                    className={"btn btn-sm text-center me-2 border-0 remove-focus" + (monthRevenueCat ? " secondary text-white" : "")}
                                    onClick={() => setMonthRevenueCat(true)}>Month</button>
                                <button type="button"
                                    className={"btn btn-sm text-center me-2 border-0 remove-focus" + (!monthRevenueCat ? " secondary text-white" : "")}
                                    onClick={() => setMonthRevenueCat(false)}>Year</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="area-second w-100 h-100">
                <div className="position-relative d-flex flex-column w-100 h-100 bg-white rounded shadow-sm">
                    <div className="shadow
               z-2 rounded-4 fourth position-absolute d-flex justify-content-center align-items-center
              top-0 start-50 translate-middle border-0" style={{ marginTop: "40px", width: "98%", height: "95%" }} >
                        <ResponsiveContainer width="100%" height="90%">
                            <LineChart
                                data={revenueData}
                                margin={{
                                    top: 20,
                                    left: 20,
                                    right: 40
                                }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis dataKey="Name" tick={{ fill: 'white' }} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'white' }} tickMargin={20} tickFormatter={NumberFormater} />
                                <Tooltip formatter={(value) => NumberFormaterData(value)}  contentStyle={{ backgroundColor: "#171717", borderRadius: '5px', borderColor: "transparent", color: "white" }} />
                                <Line type="monotone" dataKey="Revenue" stroke="white" activeDot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-auto m-3">
                        <div className="d-flex align-items-end justify-content-between h-100">
                            <div>Revenue</div>
                            <div>
                                <button type="button"
                                    className={"btn border-0 remove-focus btn-sm text-center me-2" + (monthRevenue ? " secondary text-white" : "")}
                                    onClick={() => setMonthRevenue(true)}>Month</button>
                                <button type="button"
                                    className={"btn border-0 remove-focus btn-sm text-center me-2" + (!monthRevenue ? " secondary text-white" : "")}
                                    onClick={() => setMonthRevenue(false)}>Year</button>
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
                                <button type="button"
                                    className={"btn border-0 remove-focus btn-sm text-center me-2" + (monthReceipt ? " secondary text-white" : "")}
                                    style={{ width: "80px" }}
                                    onClick={() => setMonthReceipt(true)}>Month</button>
                                <button type="button"
                                    className={"btn border-0 remove-focus btn-sm text-center me-2" + (!monthReceipt ? " secondary text-white" : "")}
                                    style={{ width: "80px" }}
                                    onClick={() => setMonthReceipt(false)}>Year</button>
                            </div>
                            <div>
                                <select className="form-select custom-select" value={selectedOption} onChange={(ev) => {
                                    setSelectedOption(ev.target.value)
                                }}>
                                    {receiptCategory("revenue").map((data, index) => {
                                        return <option className="custom-option" key={index} value={data.value}>{data.label}</option>
                                    })}
                                </select>
                            </div>

                        </div>
                    </div>

                    <div className="w-100 rounded-4 secondary" style={{ height: "2px" }} />

                    <div className="mt-3 m-3">
                        <div className="d-flex align-items-center justify-content-between h-100">
                            <button className="btn btn-sm secondary z-2"
                                onClick={() => {
                                    if (monthReceipt)
                                        setDateList(dateList.subtract(1, "month"));
                                    else
                                        setDateList(dateList.subtract(1, "year"));
                                }}>
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

                            <button className="btn btn-sm secondary z-2"
                                onClick={() => {
                                    if (monthReceipt)
                                        setDateList(dateList.add(1, "month"));
                                    else
                                        setDateList(dateList.add(1, "year"));
                                }}>
                                <img src={ArrowUp} alt="arrowBack" />
                            </button>
                        </div>
                    </div>

                </div>
                <div className="grid-content w-100">
                    {Receipts.map((value, index) => {
                        const revenues: FormState[] = JSON.parse(value.Rows);

                        return (
                            <div key={index}>
                                <div className="mt-5 ms-3" style={{ fontSize: "19px" }}>
                                    {value.Timeline}
                                </div>

                                <div className="ms-5 w-100">
                                    <div className="row row-cols-auto">
                                        {revenues.map((rev, jndex) => {
                                            const category = RevenueCategory(Number(rev.category))
                                            const bankType = BankType(Number(rev.type));

                                            return (
                                                <div className="col mt-5 mb-1" key={jndex} style={{ height: "150px", width: "300px" }}>
                                                    <div className="position-relative d-flex flex-column w-100 h-100 bg-white rounded shadow-sm">
                                                        <div className="shadow
                                                                    z-2 rounded-4 fourth position-absolute d-flex
                                                                    top-0 start-50 translate-middle border-0 text-white" style={{ marginTop: "40px", width: "98%", padding: "14px", height: "85%" }} >
                                                            <div className="d-flex w-100">
                                                                <div className="d-flex w-100 flex-column">
                                                                    <h5>
                                                                        {abbreviateString(rev.name, 20)}
                                                                        {Boolean(rev.recurring) && <a className="ms-1" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Recurring">{RevenueCategory(3).Icon}</a>}
                                                                    </h5>
                                                                    <div className=" d-flex align-items-start">
                                                                        {category?.Icon}
                                                                        <h6 className="ms-1" style={{ display: "inline" }}>{category?.Label}</h6>
                                                                    </div>

                                                                    <div className=" d-flex align-items-start">
                                                                        {bankType.Icon}
                                                                        <h6 className="ms-1" style={{ display: "inline" }}>
                                                                            {abbreviateString(rev.bank, 20)}
                                                                        </h6>
                                                                    </div>

                                                                    {rev.file_name &&
                                                                        <div className="d-flex align-items-start" style={{ cursor: "pointer" }} onClick={async () => {
                                                                            window.api.ShowSavefile(rev.file_path);
                                                                        }}>
                                                                            <a className="icon-link icon-link-hover text-white link-underline-light ">
                                                                                <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" className="bi bi-paperclip" viewBox="0 0 16 16">
                                                                                    <path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0z" />
                                                                                </svg>
                                                                                {abbreviateString(rev.file_name, 20)}
                                                                            </a>

                                                                        </div>}

                                                                </div>

                                                                <div className="ms-auto" style={{ cursor: "pointer" }} onClick={() => {
                                                                    setFormValue(rev)
                                                                    setFormSubmit(false);
                                                                    const myModalEl = document.getElementById('staticBackdrop');
                                                                    var modal = new bootstrap.Modal(myModalEl)
                                                                    myModalEl
                                                                    modal.show()
                                                                }}>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-three-dots" viewBox="0 0 16 16">
                                                                        <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mt-auto m-3">
                                                            <div className="d-flex align-items-end justify-content-between h-100">
                                                                <div>{rev.amount}$</div>
                                                                <div>
                                                                    {new Date(rev.date).toDateString()}
                                                                </div>
                                                            </div>
                                                        </div>

                                                    </div>
                                                </div>
                                            )
                                        })}
                                        <div className="w-100" style={{ height: "64px" }} />
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