// React
import { useEffect, useRef, useState } from "react";

// MUI
import { Box } from "@mui/material";
import dayjs, { Dayjs } from 'dayjs';
import Badge from '@mui/material/Badge';
import { styled } from "@mui/material/styles";
import { DateCalendar, DateCalendarProps } from '@mui/x-date-pickers/DateCalendar';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { abbreviateString } from "@renderer/components/support";
import { DateTimePicker } from "@mui/x-date-pickers";


declare const bootstrap: any;

interface Event {
    day: string;
    importance: number
}


export interface Agenda {
    id: string
    importance: number,
    date: string,
    information: string
}

export async function handleDeleteEvent(id: string, refresh: any, setRefresh: any) {
    try {


        await window.api.Database(`DELETE FROM agenda WHERE id = ${id};`);
        setRefresh(!refresh);
    } catch (error) {
        window.api.showError(`Something has gone wrong. Please report the error.\nError code: 1.0v007`);
        console.error(error);
    }
}

export async function handleUpdateEvent(data: Agenda, refresh: any, setRefresh: any) {
    try {


        await window.api.Database(
            `
            UPDATE agenda
            SET date = ?,
                importance = ?,    
                information = ?
            WHERE id = ${data.id};
            `
            , [data.date, data.importance, data.information]);
        setRefresh(!refresh);
    } catch (error) {
        window.api.showError(`Something has gone wrong. Please report the error.\nError code: 1.0v008`);
        console.error(error);
    }
}

export async function handleSubmitEvent(data: Agenda, refresh: any, setRefresh: any) {
    try {


        await window.api.Database(
            `
            INSERT INTO agenda (date, importance, information)
            VALUES (?, ?, ?);
            `
            , [data.date, data.importance, data.information]);
        setRefresh(!refresh);
    } catch (error) {
        window.api.showError(`Something has gone wrong. Please report the error.\nError code: 1.0v009`);
        console.error(error);
    }
}


export async function fetchEventData(all: boolean, date: Dayjs) {

    const wherequery = all ?
        `strftime('%Y-%m-%d', date) = '${date.format("YYYY-MM-DD")}'` :
        `
    strftime('%Y-%m-%d %H', date) >= '${date.format("YYYY-MM-DD HH")}'
    AND
    strftime('%Y-%m-%d', date) = '${date.format("YYYY-MM-DD")}'
    `;

    const result: Agenda[] = await window.api.Database(`
    SELECT 
      id,
      date,
      importance,
      information
    FROM 
      agenda
    WHERE
      ${wherequery}
    ORDER BY 
      date ASC
    `);
    return result;
};

async function fetchEvents(date: Dayjs) {

    const result: Event[] = await window.api.Database(
        `
        SELECT 
            strftime('%d', date) AS day,
            MAX(importance) as importance
        FROM 
            agenda 
        WHERE
            strftime('%Y-%m', date) = '${date.format("YYYY-MM")}'
        GROUP BY
            day;
        `
    );
    return result
}

function EventDay(
    props: PickersDayProps<Dayjs> & {
        highlightedDays?: Event[];
    }
) {
    // 
    const { highlightedDays = [], day, outsideCurrentMonth, ...other } = props;

    let importance;
    // If highlight day, get the importance
    const isSelected =
        !props.outsideCurrentMonth &&
        // @ts-ignore
        highlightedDays.some((highlightedDay) => {
            if (Number(highlightedDay.day) === props.day.date()) {
                switch (highlightedDay.importance) {
                    case 0:
                        importance = '🟩';
                        break;
                    case 1:
                        importance = '🟨';
                        break;
                    default:
                        importance = '🟥';
                }
                return Number(highlightedDay.day) === props.day.date();
            }
        });

    return (
        <Badge
            key={props.day.toString()}
            overlap="circular"
            badgeContent={isSelected ? importance : undefined}
        >
            <PickersDay
                {...other}
                outsideCurrentMonth={outsideCurrentMonth}
                day={day}
            />
        </Badge>
    );
}


function Agenda() {
    const [isLoading, setIsLoading] = useState(true);
    const [initialDate, setInitialDate] = useState<Dayjs>(dayjs());
    const [highlightedDays, setHighlightedDays] = useState<Event[]>();
    const requestAbortController = useRef<AbortController | null>(null);
    const [id, setId] = useState("");
    const nameRef = useRef<any>();
    const [importance, setImportance] = useState('0');
    const [time, setTime] = useState<Dayjs | null>(initialDate);
    const [agenda, setAgenda] = useState<Agenda[]>([]);
    const [refresh, setRefresh] = useState(false);

    const CustomCalendar = styled(DateCalendar) <DateCalendarProps<any>>`
    margin: 0;
    width: 100%;
  `;

  // Set default value every time this component is refresh
    useEffect(() => {
        setId("")
        nameRef.current.value = "";
        setImportance('0');
        setTime(initialDate);
    }, [refresh])

    useEffect(() => {
        const getHighlight = async () => {
            // Only get highlightedDays when we are loading them
            if (isLoading) {
                setHighlightedDays(await fetchEvents(initialDate));
                setIsLoading(false);
            }
            setAgenda(await fetchEventData(true, initialDate))
        }
        getHighlight();
    }, [initialDate, refresh]);


    const handleMonthChange = (date: Dayjs) => {
        if (requestAbortController.current) {
            // make sure that you are aborting useless requests
            // because it is possible to switch between months pretty quickly
            requestAbortController.current.abort();
        }
        // Set that you are loading the days
        setIsLoading(true);
        setInitialDate(date);
    };


    return (
        <div className="right-content-secondary">
                    <form className="needs-validation" onSubmit={async (e: any) => {
                    e.preventDefault() // Prevent reloading before the action
                    if (!time) return;
                    
                    // Agenda data
                    const data = {
                        id: id,
                        date: time.toISOString(),
                        importance: Number(importance),
                        information: e.currentTarget.elements.nameInput.value
                    }
                    // if id update the agenda
                    if (id) handleUpdateEvent(data, refresh, setRefresh)
                    // If not, then submit
                    else handleSubmitEvent(data, refresh, setRefresh);
                    // Set that you are loading the days now
                    setIsLoading(true);
                    const myModalEl = document.getElementById('agendaModal');
                    const modal = bootstrap.Modal.getInstance(myModalEl)
                    modal.hide();
                }}>

                    <div className="modal fade" id="agendaModal" data-bs-backdrop="static" data-bs-keyboard="false" aria-labelledby="agendaModalLabel" aria-hidden="true">
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h1 className="modal-title fs-5" id="agendaModalLabel">Event</h1>
                                    <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div className="modal-body">
                                    <div className="input-group mb-3">
                                        <span className="input-group-text" id="basic-addon1" style={{ width: "100px" }}>Name</span>
                                        <input type="text" ref={nameRef} className="form-control" id="nameInput" placeholder="Team Meeting" aria-label="Name" aria-describedby="basic-addon1"
                                            required />
                                    </div>

                                    <div className="d-flex flex-row">

                                        <div className="form-floating">
                                            <select className="form-select custom-select" id="floatingSelect" style={{ height: "38px", width: "150px" }}
                                                value={importance} onChange={(e) => setImportance(e.target.value)}
                                            >
                                                <option className="custom-option" value={0}>Optional</option>
                                                <option className="custom-option" value={1}>Important</option>
                                                <option className="custom-option" value={2}>Very Important</option>
                                            </select>
                                            <label htmlFor="floatingSelect">Importance</label>
                                        </div>


                                        <div className="ms-auto">
                                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                <DateTimePicker
                                                    label="Agenda"
                                                    value={time}
                                                    timezone="system"
                                                    onChange={(newValue) => setTime(newValue)} />
                                            </LocalizationProvider>
                                        </div>
                                    </div>

                                </div>
                                <div className="modal-footer">
                                    {id && <button type="button" className="btn btn-danger" data-bs-dismiss="modal"
                                        onClick={() => {
                                            handleDeleteEvent(id, refresh, setRefresh);
                                            setIsLoading(true);
                                        }}>Delete</button>}
                                    <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                    <button type="submit" className="btn btn-primary">Save changes</button>
                                </div>
                            </div>
                        </div>
                    </div >
                </form>


            <div className="area-first overflow-y-auto">
                <div >
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Box
                            sx={(theme) => ({
                                width: "100%",
                                height: "100%",
                                backgroundColor: theme.palette.grey[50]
                            })}
                        >
                            <CustomCalendar
                                loading={isLoading}
                                defaultValue={initialDate}
                                onChange={(newdate) => { setInitialDate(newdate) }}
                                onMonthChange={handleMonthChange}
                                slots={{
                                    day: (props) => {
                                        return EventDay(props);
                                    },
                                }}
                                slotProps={{
                                    day: {
                                        highlightedDays,
                                    } as any,
                                }}
                            />
                        </Box>
                    </LocalizationProvider>
                </div>

                <div className="w-100 d-flex flex-column align-items-center pt-4">
                    {initialDate.format("DD/MM/YYYY")}
                    <button type="button" className="btn btn-sm text-center secondary text-white mt-1"
                        style={{ width: "90%", height: "32px" }} onClick={
                            () => {
                                setId("")
                                nameRef.current.value = "";
                                setImportance('0');
                                setTime(initialDate);
                                const myModalEl = document.getElementById('agendaModal');
                                var modal = new bootstrap.Modal(myModalEl)
                                myModalEl
                                modal.show()
                            }
                        }>
                        New Event
                    </button>
                </div>
            </div>


            <div className="area-second border-start overflow-y-auto pb-5">
                <h4 className="ps-5 pt-4">Agenda</h4>
                <div className="w-100 d-flex flex-column justify-content-center">
                    <div className="ms-5 ps-5 mt-5">
                        <span style={{ fontWeight: "bold", color: "gray", fontSize: "16px" }}>
                            {initialDate.format("DD MMMM")}
                        </span>
                    </div>

                    {agenda.map((data, index) => {
                        const date = dayjs(data.date)
                        const formatted_date = date.format("hh:mm")
                        const period = date.format("A");
                        let category_color;
                        let category_text;

                        switch (data.importance) {
                            default:
                                category_color = "green";
                                category_text = "Optional";
                                break;
                            case 1:
                                category_color = "orange";
                                category_text = "Important";
                                break;
                            case 2:
                                category_color = "#ca3838";
                                category_text = "Very Important";
                                break;
                        }

                        return (
                            <div className="d-flex flex-column ps-5" key={index}
                                style={{ width: "90%", height: "100px", cursor: "pointer" }}
                                onClick={() => {
                                    setId(data.id)
                                    nameRef.current.value = data.information;
                                    setImportance(String(data.importance));
                                    setTime(date);
                                    const myModalEl = document.getElementById('agendaModal');
                                    var modal = new bootstrap.Modal(myModalEl)
                                    myModalEl
                                    modal.show()
                                }}>

                                <div className="ms-5 mt-5 ps-5 d-flex gap-4" style={{ height: "50px" }}>
                                    <div className="d-flex flex-column mt-2">
                                        <span style={{ fontSize: "14px", fontWeight: "bold", color: "gray" }}>
                                            {period}
                                        </span>

                                        <span className="text-primary mt-1" style={{ fontSize: "18px", fontWeight: "bold" }}>
                                            {formatted_date}
                                        </span>
                                    </div>

                                    <div className="d-flex mt-auto mb-auto ps-1 rounded-4" style={{
                                        height: "38px",
                                        width: "4px",
                                        backgroundColor: category_color,
                                    }}>
                                    </div>

                                    <div className="d-flex flex-column mt-auto mb-auto">
                                        <span style={{ fontSize: "14px", fontWeight: "bold", color: "gray" }}>
                                            {category_text}
                                        </span>

                                        <span className="mt-1">
                                            {abbreviateString(data.information, 25)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
    );
}

export default Agenda;
