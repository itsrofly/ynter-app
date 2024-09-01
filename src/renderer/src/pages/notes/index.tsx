// React
import { useEffect, useRef, useState } from 'react'
import Checklist from '@editorjs/checklist'
import Header from '@editorjs/header'
import List from '@editorjs/list'
import Quote from '@editorjs/quote'
import Marker from '@editorjs/marker'
import Strikethrough from '@sotaproject/strikethrough'
import Underline from '@editorjs/underline'
import SimpleImage from '@editorjs/simple-image'
import EditorJS, { OutputData } from '@editorjs/editorjs'
import dayjs, { Dayjs } from 'dayjs'
import { abbreviateString } from '@renderer/components/support'
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

interface Note {
  id: number
  agenda: number
  title: string
  priority: number
  trash: number
  updated_date: string
  data: any
}

interface Filter {
  type: 'priority' | 'trash'
  value: number | boolean
}

interface Sort {
  up: boolean
  sortby: 'updated_date' | 'priority' | 'title'
}

declare const bootstrap

async function handleCreateNote(title: string) {
  try {
    const date = dayjs()
    const date_formatted = date.format('YYYY-MM-DD HH:mm:00')

    const result = await window.api.Database(
      `INSERT INTO notes (title, updated_date)
             VALUES (?, ?);`,
      [title, date_formatted]
    )

    return result
  } catch (error) {
    console.error(error)
    window.api.showError(`Something has gone wrong. Please report the error.\nError code: 1.0v011`)
    return
  }
}

async function handleUpsertAgenda(
  date: string,
  title: string,
  importance: number,
  id?: number
): Promise<{ id: number } | undefined> {
  try {
    const result = await window.api.Database(
      `
            INSERT INTO agenda (id, date, importance, information)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                date = excluded.date,
                importance = excluded.importance;            `,
      [id || null, date, importance, title]
    )

    // If id was provided, return it; otherwise, return the auto-generated id.
    return { id: id ?? result.id }
  } catch (error) {
    window.api.showError(`Something has gone wrong. Please report the error.\nError code: 1.0v009`)
    console.error(error)
    return
  }
}

async function handleAgendaId(id: number, agenda: number): Promise<void> {
  try {
    await window.api.Database(
      `
                UPDATE notes 
                SET agenda = ?
                WHERE id = ${id};
                `,
      [agenda]
    )
  } catch (error) {
    window.api.showError(`Something has gone wrong. Please report the error.\nError code: 1.0v009`)
    console.error(error)
  }
}

async function fetchAgenda(id: number): Promise<[] | object | undefined> {
  try {
    const result = await window.api.Database(`
            SELECT * 
            FROM agenda
            WHERE id = ${id};
            `)
    return result
  } catch (error) {
    window.api.showError(`Something has gone wrong. Please report the error.\nError code: 1.0v009`)
    console.error(error)
    return
  }
}

async function handleUpdateData(id: number, data: string): Promise<void> {
  const date = dayjs()
  const date_formatted = date.format('YYYY-MM-DD HH:mm:00')

  await window.api.Database(
    `UPDATE notes 
         SET data = ?,
             updated_date = ?
        WHERE id = ${id};
        `,
    [data, date_formatted]
  )
}

async function handleUpdatePriority(
  id: number,
  priority: number,
  agendaId?: number
): Promise<void> {
  const date = dayjs()
  const date_formatted = date.format('YYYY-MM-DD HH:mm:00')

  await window.api.Database(
    `UPDATE notes 
         SET priority = ?,
             updated_date = ?
        WHERE id = ${id};
        `,
    [priority, date_formatted]
  )

  if (agendaId)
    await window.api.Database(
      `
            UPDATE agenda 
            SET importance = ?
            WHERE id = ${agendaId};
            `,
      [priority]
    )
}

async function handleUpdateTitle(id: number, title: string): Promise<void> {
  const date = dayjs()
  const date_formatted = date.format('YYYY-MM-DD HH:mm:00')

  await window.api.Database(
    `UPDATE notes 
         SET title = ?,
             updated_date = ?
        WHERE id = ${id};
        `,
    [title, date_formatted]
  )
}

async function handleDelete(id: number, delete_row: boolean, agendaId?: number): Promise<void> {
  if (delete_row) {
    await window.api.Database(`DELETE FROM notes WHERE id = ${id};`)
    await window.api.Database(`DELETE FROM agenda WHERE id = ${agendaId};`)
  } else
    await window.api.Database(
      `UPDATE notes
            SET trash = 1
            WHERE id = ${id};`
    )
}

async function fetchNotes(search: string, sort: Sort, filter: Filter | undefined): Promise<Note[]> {
  // Initialize the base SQL query
  let query = `
        SELECT id, title, priority, agenda, trash, updated_date FROM notes
        WHERE (title LIKE '%${search}%' OR title IS NULL)
    `

  // Apply the filter if it's defined
  if (filter) {
    if (filter.type === 'priority' && typeof filter.value === 'number') {
      query += ` AND priority = ${filter.value} AND trash = 0`
    } else if (filter.type === 'trash' && typeof filter.value === 'boolean') {
      query += ` AND trash = ${filter.value ? 1 : 0}`
    }
  } else query += ` AND trash = 0`

  // Apply sorting
  const order = sort.up ? 'ASC' : 'DESC'
  query += ` ORDER BY ${sort.sortby} ${order}`

  const result: Note[] = await window.api.Database(query)
  return result
}

async function fetchNoteData(id: number): Promise<Note> {
  // Initialize the base SQL query
  const query = `
        SELECT data, agenda FROM notes
        WHERE id = ${id};
    `

  const result = await window.api.Database(query)
  return result[0] as Note
}

function Notes(): JSX.Element {
  // Selected note id
  const [id, setId] = useState<number | undefined>()

  // Selected note title
  const [title, setTitle] = useState<string | undefined>('')

  // Timout to update titled
  const [titleTimoutId, setTitleTimoutId] = useState<NodeJS.Timeout>()

  // Selected note data
  const [data, setData] = useState<undefined | OutputData>()

  // Select agenda if exist
  const [agendaId, setAgendaId] = useState<number | undefined>()

  // This is used to create agenda or change date if exist
  const [agenda, setAgenda] = useState<Dayjs | null>()

  // Selected note priority
  const [priority, setpriority] = useState<string | undefined>()

  // Search characters
  const [search, setSearch] = useState('')

  // Title for the form used to create new note
  const [modalTitle, setModalTitle] = useState('')

  // Used to search only after some time, when user stop styping
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout>()

  // List of notes
  const [notesList, setNotesList] = useState<Note[]>()

  // Used to refresh list of notes
  const [refresh, setRefresh] = useState(false)

  // Used to sort list of notes
  const [sort, setSort] = useState<Sort>({
    up: true,
    sortby: 'updated_date'
  })

  // Used to filter list of notes
  const [filter, setFilter] = useState<Filter | undefined>()

  // Active editor instance
  const editorInstance = useRef<EditorJS | null>(null)

  useEffect(() => {
    // Get a list of notes using filter and sort
    const getNotes = async (): Promise<void> => {
      setNotesList(await fetchNotes(search, sort, filter))
    }
    getNotes()
    // reset Modal Title
    setModalTitle('')
  }, [refresh, sort, filter])

  // Start editor instance (Note Editor)
  useEffect(() => {
    // Destroy editor instance
    const cleanUp = async (): Promise<void> => {
      // If destroy is avaible means that exist an ready editor instance
      if (editorInstance.current?.destroy) {
        // We need to destroy this instance to start a new one with the right note data
        // Destroy the editor instance
        editorInstance.current.destroy()
        // Set as null, now is ready to start a new editor
        editorInstance.current = null
      }
    }

    // Start Editor using the selected note
    const startEditor = async (): Promise<void> => {
      // If no id, theres no selected note
      if (!id) return

      try {
        // First we need to make sure that don't exist any editor instance
        await cleanUp()
        // Then we create I new one
        editorInstance.current = new EditorJS({
          holder: 'editorjs', // html editor id
          placeholder: 'Write text or use “/” or paste an image link', // Default text for empty data
          data: data, // Data, if is undefined editor will start from zero
          tools: {
            // Tools
            header: Header,
            list: List,
            checklist: {
              class: Checklist,
              inlineToolbar: true
            },
            quote: Quote,
            image: SimpleImage,
            underline: Underline,
            strikethrough: Strikethrough,
            Marker: {
              class: Marker
            }
          },

          // on change we need to update the data on the local database
          onChange: async (): Promise<void> => {
            if (editorInstance.current) {
              // Editor data
              const outputData = await editorInstance.current.save()
              // Now we update the database
              handleUpdateData(id, JSON.stringify(outputData))
            }
          }
        })
      } catch (error) {
        // If failed for some reason just set the editorInstance as null for the next try
        editorInstance.current = null
      }
    }
    startEditor()

    // Cleanup on unmount
    return (): void => {
      cleanUp()
    }
  }, [id])

  // Load agenda informations
  useEffect(() => {
    const handleAgenda = async (): Promise<void> => {
      if (!title || !priority || !id) return

      let importance
      switch (priority) {
        case 'green':
          importance = 0
          break
        case 'orange':
          importance = 1
          break
        default:
          importance = 2
          break
      }
      if (agenda) {
        const result = await handleUpsertAgenda(agenda.toISOString(), title, importance, agendaId)
        if (!agendaId && result) {
          await handleAgendaId(id, result.id)
          setAgendaId(result.id)
        }
      } else if (!agenda && agendaId) {
        const result = await fetchAgenda(agendaId)

        if (result && result[0]) {
          setAgenda(dayjs(result[0].date))
        }
      }
    }
    handleAgenda()
  }, [agenda, agendaId])

  return (
    <div className="right-content-secondary">
      <div className="area-first d-flex flex-column overflow-y-auto border-top">
        {/* Form */}
        <form
          className="needs-validation"
          onSubmit={async (e) => {
            // This form is used to create I new note
            e.preventDefault()

            // Create new note using inserted title
            const result = await handleCreateNote(modalTitle)

            if (result) {
              // Set default priority color
              setpriority('green')
              // Set default data
              setData(undefined)
              setAgenda(null)
              setAgendaId(undefined)

              // set note title
              setTitle(result.title)
              // Set Selected note using Id
              setId(result.id)
            }

            // Hide Modal only after note as being created
            const myModalEl = document.getElementById('noteModal')
            const modal = bootstrap.Modal.getInstance(myModalEl)
            modal.hide()

            // Refresh list of notes
            setRefresh(!refresh)
          }}
        >
          <div
            className="modal fade"
            id="noteModal"
            data-bs-backdrop="static"
            data-bs-keyboard="false"
            tabIndex={-1}
            aria-labelledby="staticBackdropLabel"
            aria-hidden="true"
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h1 className="modal-title fs-5" id="staticBackdropLabel">
                    Create
                  </h1>
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="input-group mb-3">
                    <span className="input-group-text" id="basic-addon1" style={{ width: '100px' }}>
                      Name
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="To do List"
                      aria-label="Name"
                      aria-describedby="basic-addon1"
                      value={modalTitle}
                      onChange={(e) => setModalTitle(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Header & Create button */}
        <div className="w-100 d-flex p-3 justify-content-between" style={{ height: '63px' }}>
          <h4>Notes</h4>

          {/* Start Modal (Create note form) */}
          <button
            type="button"
            className="btn remove-focus border-0"
            data-bs-toggle="modal"
            data-bs-target="#noteModal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24px"
              height="24px"
              fill="currentColor"
              className="bi bi-pencil-square"
              viewBox="0 0 16 16"
            >
              <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
              <path
                fillRule="evenodd"
                d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"
              />
            </svg>
          </button>
        </div>

        {/* Search, Sort % Filter */}
        <div className="d-flex gap-2 ps-2 pe-2">
          <input
            className="form-control"
            id="searchNote"
            type="text"
            placeholder="Type to search..."
            style={{ width: '80%', height: '32px' }}
            value={search}
            onChange={(e) => {
              // Set search characters
              setSearch(e.target.value)

              // This stop an ocorring search and prevent lagging
              clearTimeout(timeoutId)
              // Only after 50 milliseconds refresh the list and search
              setTimeoutId(
                setTimeout(() => {
                  setRefresh(!refresh)
                }, 50)
              )
            }}
          ></input>

          {/* Sort Stuff */}
          <div className="dropdown-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              className="bi bi-sort-down"
              viewBox="0 0 16 16"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <path d="M3.5 2.5a.5.5 0 0 0-1 0v8.793l-1.146-1.147a.5.5 0 0 0-.708.708l2 1.999.007.007a.497.497 0 0 0 .7-.006l2-2a.5.5 0 0 0-.707-.708L3.5 11.293zm3.5 1a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5M7.5 6a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1zm0 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1zm0 3a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1z" />
            </svg>

            <ul className="dropdown-menu">
              <li>
                <a className="dropdown-item disabled" aria-disabled href="#">
                  Sort by
                </a>
              </li>

              <li>
                <hr className="dropdown-divider" />
              </li>
              <li>
                <a
                  className={
                    'dropdown-item remove-focus' +
                    (sort.sortby == 'updated_date' ? ' bg-info-subtle' : '')
                  }
                  href="#"
                  onClick={(e) => {
                    e.preventDefault() // Prevent click move
                    setSort({
                      sortby: 'updated_date',
                      up: !sort.up
                    })
                  }}
                >
                  Date
                  {sort.sortby == 'updated_date' &&
                    (sort.up ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        className="bi bi-arrow-up-short"
                        viewBox="0 0 16 16"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8 12a.5.5 0 0 0 .5-.5V5.707l2.146 2.147a.5.5 0 0 0 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 1 0 .708.708L7.5 5.707V11.5a.5.5 0 0 0 .5.5"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        className="bi bi-arrow-down-short"
                        viewBox="0 0 16 16"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8 4a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 10.293V4.5A.5.5 0 0 1 8 4"
                        />
                      </svg>
                    ))}
                </a>
              </li>
              <li>
                <a
                  className={
                    'dropdown-item remove-focus' +
                    (sort.sortby == 'priority' ? ' bg-info-subtle' : '')
                  }
                  href="#"
                  onClick={(e) => {
                    e.preventDefault() // Prevent click move
                    setSort({
                      sortby: 'priority',
                      up: !sort.up
                    })
                  }}
                >
                  Priority
                  {sort.sortby == 'priority' &&
                    (sort.up ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        className="bi bi-arrow-up-short"
                        viewBox="0 0 16 16"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8 12a.5.5 0 0 0 .5-.5V5.707l2.146 2.147a.5.5 0 0 0 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 1 0 .708.708L7.5 5.707V11.5a.5.5 0 0 0 .5.5"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        className="bi bi-arrow-down-short"
                        viewBox="0 0 16 16"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8 4a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 10.293V4.5A.5.5 0 0 1 8 4"
                        />
                      </svg>
                    ))}
                </a>
              </li>
              <li>
                <a
                  className={
                    'dropdown-item remove-focus' + (sort.sortby == 'title' ? ' bg-info-subtle' : '')
                  }
                  href="#"
                  onClick={(e) => {
                    e.preventDefault() // Prevent click move
                    setSort({
                      sortby: 'title',
                      up: !sort.up
                    })
                  }}
                >
                  Title
                  {sort.sortby == 'title' &&
                    (sort.up ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        className="bi bi-arrow-up-short"
                        viewBox="0 0 16 16"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8 12a.5.5 0 0 0 .5-.5V5.707l2.146 2.147a.5.5 0 0 0 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 1 0 .708.708L7.5 5.707V11.5a.5.5 0 0 0 .5.5"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        className="bi bi-arrow-down-short"
                        viewBox="0 0 16 16"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8 4a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 10.293V4.5A.5.5 0 0 1 8 4"
                        />
                      </svg>
                    ))}
                </a>
              </li>
            </ul>
          </div>

          {/* filter Stuff */}
          <div className="dropdown-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              className="bi bi-filter"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              viewBox="0 0 16 16"
            >
              <path d="M6 10.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5" />
            </svg>

            <ul className="dropdown-menu">
              <li className="d-flex text-center">
                <a
                  className={'dropdown-item remove-focus' + (!filter ? ' bg-info-subtle' : '')}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault() // Prevent click move
                    setFilter(undefined)
                  }}
                >
                  No filter
                </a>
              </li>

              <li>
                <hr className="dropdown-divider" />
              </li>

              <li>
                <a className="dropdown-item disabled" aria-disabled href="#">
                  Priority
                </a>
              </li>

              <li className="d-flex justify-content-center">
                <a
                  className="dropdown-item remove-focus"
                  href="#"
                  style={{
                    height: '24px',
                    width: '24px'
                  }}
                  onClick={(e) => {
                    e.preventDefault() // Prevent click move
                    setFilter({
                      type: 'priority',
                      value: 0
                    })
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="green"
                    className={
                      'bi bi-flag-fill' +
                      (filter?.type == 'priority' && filter.value == 0 ? ' bg-info-subtle' : '')
                    }
                    viewBox="0 0 16 16"
                  >
                    <path d="M14.778.085A.5.5 0 0 1 15 .5V8a.5.5 0 0 1-.314.464L14.5 8l.186.464-.003.001-.006.003-.023.009a12 12 0 0 1-.397.15c-.264.095-.631.223-1.047.35-.816.252-1.879.523-2.71.523-.847 0-1.548-.28-2.158-.525l-.028-.01C7.68 8.71 7.14 8.5 6.5 8.5c-.7 0-1.638.23-2.437.477A20 20 0 0 0 3 9.342V15.5a.5.5 0 0 1-1 0V.5a.5.5 0 0 1 1 0v.282c.226-.079.496-.17.79-.26C4.606.272 5.67 0 6.5 0c.84 0 1.524.277 2.121.519l.043.018C9.286.788 9.828 1 10.5 1c.7 0 1.638-.23 2.437-.477a20 20 0 0 0 1.349-.476l.019-.007.004-.002h.001" />
                  </svg>
                </a>

                <a
                  className="dropdown-item remove-focus"
                  href="#"
                  style={{
                    height: '24px',
                    width: '24px'
                  }}
                  onClick={(e) => {
                    e.preventDefault() // Prevent click move
                    setFilter({
                      type: 'priority',
                      value: 1
                    })
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="orange"
                    className={
                      'bi bi-flag-fill' +
                      (filter?.type == 'priority' && filter.value == 1 ? ' bg-info-subtle' : '')
                    }
                    viewBox="0 0 16 16"
                  >
                    <path d="M14.778.085A.5.5 0 0 1 15 .5V8a.5.5 0 0 1-.314.464L14.5 8l.186.464-.003.001-.006.003-.023.009a12 12 0 0 1-.397.15c-.264.095-.631.223-1.047.35-.816.252-1.879.523-2.71.523-.847 0-1.548-.28-2.158-.525l-.028-.01C7.68 8.71 7.14 8.5 6.5 8.5c-.7 0-1.638.23-2.437.477A20 20 0 0 0 3 9.342V15.5a.5.5 0 0 1-1 0V.5a.5.5 0 0 1 1 0v.282c.226-.079.496-.17.79-.26C4.606.272 5.67 0 6.5 0c.84 0 1.524.277 2.121.519l.043.018C9.286.788 9.828 1 10.5 1c.7 0 1.638-.23 2.437-.477a20 20 0 0 0 1.349-.476l.019-.007.004-.002h.001" />
                  </svg>
                </a>

                <a
                  className="dropdown-item remove-focus"
                  href="#"
                  style={{
                    height: '24px',
                    width: '24px'
                  }}
                  onClick={(e) => {
                    e.preventDefault() // Prevent click move
                    setFilter({
                      type: 'priority',
                      value: 2
                    })
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="red"
                    className={
                      'bi bi-flag-fill' +
                      (filter?.type == 'priority' && filter.value == 2 ? ' bg-info-subtle' : '')
                    }
                    viewBox="0 0 16 16"
                  >
                    <path d="M14.778.085A.5.5 0 0 1 15 .5V8a.5.5 0 0 1-.314.464L14.5 8l.186.464-.003.001-.006.003-.023.009a12 12 0 0 1-.397.15c-.264.095-.631.223-1.047.35-.816.252-1.879.523-2.71.523-.847 0-1.548-.28-2.158-.525l-.028-.01C7.68 8.71 7.14 8.5 6.5 8.5c-.7 0-1.638.23-2.437.477A20 20 0 0 0 3 9.342V15.5a.5.5 0 0 1-1 0V.5a.5.5 0 0 1 1 0v.282c.226-.079.496-.17.79-.26C4.606.272 5.67 0 6.5 0c.84 0 1.524.277 2.121.519l.043.018C9.286.788 9.828 1 10.5 1c.7 0 1.638-.23 2.437-.477a20 20 0 0 0 1.349-.476l.019-.007.004-.002h.001" />
                  </svg>
                </a>
              </li>

              <li>
                <hr className="dropdown-divider" />
              </li>

              <li>
                <a className="dropdown-item disabled" aria-disabled href="#">
                  Others
                </a>
              </li>

              <li className="d-flex text-center">
                <a
                  className={
                    'dropdown-item remove-focus' +
                    (filter?.type == 'trash' ? ' bg-info-subtle' : '')
                  }
                  href="#"
                  onClick={(e) => {
                    e.preventDefault() // Prevent click move
                    setFilter({
                      type: 'trash',
                      value: true
                    })
                  }}
                >
                  Trash
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Load list of notes */}
        <div className="overflow-y-auto">
          <p className="text-body-secondary ps-3 pt-2">
            {filter?.type === 'trash' && 'Filter: Trash'}
            {filter?.type === 'priority' && 'Filter: Priority'}
          </p>
          {notesList?.map((values, index) => {
            return (
              <div
                key={index}
                className={
                  'd-flex align-items-center border-bottom w-100' +
                  (id == values.id ? ' bg-info-subtle' : '')
                }
                style={{ height: '60px' }}
              >
                <div
                  className="w-100 h-100 p-3"
                  onClick={async () => {
                    // Set selected priority color
                    switch (values.priority) {
                      case 0:
                        setpriority('green')
                        break
                      case 1:
                        setpriority('orange')
                        break
                      default:
                        setpriority('red')
                        break
                    }
                    const res = await fetchNoteData(values.id)
                    try {
                      // Load editor data from this note
                      // Fetch note data separately because the notelist may be outdated
                      // This is good because we don't need to update the full list just because one note changed

                      setData(JSON.parse(res.data))
                    } catch (error) {
                      // If fails means the data is wrong or null
                      // Let's put as undefined and editor will start from zero
                      setData(undefined)
                    }
                    setAgenda(null)
                    setAgendaId(res.agenda)
                    setTitle(values.title)
                    // Set Selected note using Id and title
                    setId(values.id)
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="ps-4 d-flex w-100 flex-column align-items-start">
                    <div className="fs-5">
                      {values.title ? abbreviateString(values.title, 20) : 'Untitled'}
                    </div>
                    <div>{dayjs(values.updated_date).format('DD/MM')}</div>
                  </div>
                </div>

                <div
                  className="ms-auto pe-3"
                  style={{ cursor: 'pointer' }}
                  onClick={async () => {
                    // Delete note and wait for it
                    await handleDelete(values.id, values.trash == 1, values.agenda)

                    // Set id undefined, this means that there is no selected note
                    setId(undefined)
                    setData(undefined)
                    setAgenda(null)
                    setAgendaId(undefined)
                    // Refresh list of notes
                    setRefresh(!refresh)
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    className="bi bi-trash3"
                    viewBox="0 0 16 16"
                  >
                    <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5" />
                  </svg>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="area-second border-start border-top overflow-y-auto overflow-x-hidden d-flex flex-column">
        {/* Note Editor */}
        {id && (
          <>
            <div
              className="w-100 border-bottom d-flex align-items-center"
              style={{ height: '60px' }}
            >
              {/* Title */}
              <div className="ms-3">
                <input
                  type="text"
                  value={title}
                  className="fs-5 bg-transparent w-100 position-relative form-control border-0 remove-focus"
                  placeholder="Title"
                  aria-label="Title"
                  aria-describedby="basic-addon1"
                  onChange={(e) => {
                    if (!id) return
                    setTitle(e.target.value)
                    clearTimeout(titleTimoutId)
                    setTitleTimoutId(
                      setTimeout(async () => {
                        await handleUpdateTitle(id, e.target.value)
                        setRefresh(!refresh)
                      }, 50)
                    )
                  }}
                />
              </div>

              {/* Agenda */}
              <div className="ms-auto">
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DateTimePicker
                    label="Agenda"
                    value={agenda}
                    timezone="system"
                    slotProps={{ textField: { size: 'small' } }}
                    onChange={(newValue) => setAgenda(newValue)}
                  />
                </LocalizationProvider>
              </div>

              {/* Priority Flag */}
              <div className="dropdown-center ms-5 me-5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill={priority}
                  className="bi bi-flag-fill"
                  viewBox="0 0 16 16"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <path d="M14.778.085A.5.5 0 0 1 15 .5V8a.5.5 0 0 1-.314.464L14.5 8l.186.464-.003.001-.006.003-.023.009a12 12 0 0 1-.397.15c-.264.095-.631.223-1.047.35-.816.252-1.879.523-2.71.523-.847 0-1.548-.28-2.158-.525l-.028-.01C7.68 8.71 7.14 8.5 6.5 8.5c-.7 0-1.638.23-2.437.477A20 20 0 0 0 3 9.342V15.5a.5.5 0 0 1-1 0V.5a.5.5 0 0 1 1 0v.282c.226-.079.496-.17.79-.26C4.606.272 5.67 0 6.5 0c.84 0 1.524.277 2.121.519l.043.018C9.286.788 9.828 1 10.5 1c.7 0 1.638-.23 2.437-.477a20 20 0 0 0 1.349-.476l.019-.007.004-.002h.001" />
                </svg>

                <ul className="dropdown-menu">
                  <li className="d-flex justify-content-center">
                    <a
                      className="dropdown-item remove-focus"
                      href="#"
                      style={{
                        height: '24px',
                        width: '24px'
                      }}
                      onClick={async (e) => {
                        e.preventDefault() // Prevent click move
                        // Update priority
                        await handleUpdatePriority(id, 0, agendaId)
                        setpriority('green')
                        setRefresh(!refresh)
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="green"
                        className="bi bi-flag-fill"
                        viewBox="0 0 16 16"
                      >
                        <path d="M14.778.085A.5.5 0 0 1 15 .5V8a.5.5 0 0 1-.314.464L14.5 8l.186.464-.003.001-.006.003-.023.009a12 12 0 0 1-.397.15c-.264.095-.631.223-1.047.35-.816.252-1.879.523-2.71.523-.847 0-1.548-.28-2.158-.525l-.028-.01C7.68 8.71 7.14 8.5 6.5 8.5c-.7 0-1.638.23-2.437.477A20 20 0 0 0 3 9.342V15.5a.5.5 0 0 1-1 0V.5a.5.5 0 0 1 1 0v.282c.226-.079.496-.17.79-.26C4.606.272 5.67 0 6.5 0c.84 0 1.524.277 2.121.519l.043.018C9.286.788 9.828 1 10.5 1c.7 0 1.638-.23 2.437-.477a20 20 0 0 0 1.349-.476l.019-.007.004-.002h.001" />
                      </svg>
                    </a>

                    <a
                      className="dropdown-item remove-focus"
                      href="#"
                      style={{
                        height: '24px',
                        width: '24px'
                      }}
                      onClick={async (e) => {
                        e.preventDefault() // Prevent click move
                        // Update Priority
                        await handleUpdatePriority(id, 1, agendaId)
                        // Change the priority color
                        setpriority('orange')
                        setRefresh(!refresh)
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="orange"
                        className="bi bi-flag-fill"
                        viewBox="0 0 16 16"
                      >
                        <path d="M14.778.085A.5.5 0 0 1 15 .5V8a.5.5 0 0 1-.314.464L14.5 8l.186.464-.003.001-.006.003-.023.009a12 12 0 0 1-.397.15c-.264.095-.631.223-1.047.35-.816.252-1.879.523-2.71.523-.847 0-1.548-.28-2.158-.525l-.028-.01C7.68 8.71 7.14 8.5 6.5 8.5c-.7 0-1.638.23-2.437.477A20 20 0 0 0 3 9.342V15.5a.5.5 0 0 1-1 0V.5a.5.5 0 0 1 1 0v.282c.226-.079.496-.17.79-.26C4.606.272 5.67 0 6.5 0c.84 0 1.524.277 2.121.519l.043.018C9.286.788 9.828 1 10.5 1c.7 0 1.638-.23 2.437-.477a20 20 0 0 0 1.349-.476l.019-.007.004-.002h.001" />
                      </svg>
                    </a>

                    <a
                      className="dropdown-item remove-focus"
                      href="#"
                      style={{
                        height: '24px',
                        width: '24px'
                      }}
                      onClick={async (e) => {
                        e.preventDefault() // Prevent click move
                        // Update Priority
                        await handleUpdatePriority(id, 2, agendaId)
                        // Change the priority color
                        setpriority('red')
                        setRefresh(!refresh)
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="red"
                        className="bi bi-flag-fill"
                        viewBox="0 0 16 16"
                      >
                        <path d="M14.778.085A.5.5 0 0 1 15 .5V8a.5.5 0 0 1-.314.464L14.5 8l.186.464-.003.001-.006.003-.023.009a12 12 0 0 1-.397.15c-.264.095-.631.223-1.047.35-.816.252-1.879.523-2.71.523-.847 0-1.548-.28-2.158-.525l-.028-.01C7.68 8.71 7.14 8.5 6.5 8.5c-.7 0-1.638.23-2.437.477A20 20 0 0 0 3 9.342V15.5a.5.5 0 0 1-1 0V.5a.5.5 0 0 1 1 0v.282c.226-.079.496-.17.79-.26C4.606.272 5.67 0 6.5 0c.84 0 1.524.277 2.121.519l.043.018C9.286.788 9.828 1 10.5 1c.7 0 1.638-.23 2.437-.477a20 20 0 0 0 1.349-.476l.019-.007.004-.002h.001" />
                      </svg>
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Editor */}
            <div
              className="w-100 overflow-y-auto overflow-x-hidden pt-4"
              style={{ paddingLeft: '60px', paddingRight: '60px' }}
            >
              <div id="editorjs" />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Notes
