import { MarkdownSpan } from '@renderer/pages/dashboard'
import { useEffect, useState } from 'react'

const SEARCH_API = import.meta.env.VITE_SEARCHRECEIPT

function Search({ table, id }: { table: 'revenue' | 'expense'; id: string }): JSX.Element {
  const [chat, setChat] = useState('')
  const [title, setTitle] = useState('')
  useEffect(() => {
    const searchAbout = async () => {
      const data = await window.api.Database(`SELECT * FROM ${table} WHERE id = ${id} `)

      setTitle(data[0].name)

      const ipapi_response = await fetch('https://ipapi.co/json/')

      // Set default value
      let region = data[0].region.length > 0 ? data[0].region : undefined

      if (ipapi_response.ok) {
        const ipapi_data = await ipapi_response.json()
        // Only use user region if no default region from database
        region =
          region ??
          (ipapi_data.city ?? '') +
            ', ' +
            (ipapi_data.region ?? '') +
            ', ' +
            (ipapi_data.country_name ?? '')
      }

      const access_token = await window.api.Session()

      // Fetch informations about the receipt
      const response = await fetch(SEARCH_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: access_token,
          merchant: data[0].name,
          region
        })
      })

      if (response.ok) {
        const data = await response.json()

        // If undefined then nothing found
        if (!data.places) {
          setChat('**Nothing Found**')
          return
        }
        const place = data.places[0]
        const status = String(place.businessStatus)

        // Capitalize Status
        let capitalizedStatus
        if (status)
          capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()

        setChat(`
**Name:** ${place.displayName.text ?? 'Not Found'}\n
**Status:** ${capitalizedStatus ?? 'Not Found'}\n
**Address:**  
${place.formattedAddress ?? 'Not Found'}\n
**Phone:** ${place.internationalPhoneNumber ?? 'Not Found'}\n
**Website:** ${place.websiteUri ? `[${place.websiteUri}](${place.websiteUri})` : 'Not Found'}\n
**Type:** ${place.primaryType ?? 'Not Found'}\n
**Rating:** ${place.rating ?? 'Not Found'}`)
      }
    }

    if (id) {
      setChat('**Loading...**')
      searchAbout()
    }
  }, [id])

  return (
    <>
      <div
        className="modal fade"
        id="searchBackdrop"
        data-bs-backdrop="static"
        data-bs-keyboard="false"
        aria-labelledby="searchBackdropLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="searchBackdropLabel">
                {title}
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>

            <div className="modal-body ps-5 pe-5 pt-4" style={{ userSelect: 'text' }}>
              <MarkdownSpan markdown={chat} />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Search
