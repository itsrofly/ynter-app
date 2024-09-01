import { useEffect, useState } from 'react'

import { abbreviateString, FormState, handleDeleteReceipt, receiptCategory } from '../support'

declare const bootstrap

function NewReceipt({
  table,
  refresh,
  setRefresh,
  form,
  handleSubmit
}: {
  table: 'revenue' | 'expense'
  refresh: boolean
  setRefresh
  form: FormState
  handleSubmit
}): JSX.Element {
  /* List of Inputs
    Any value should be changed individualy
    */
  const [idValue, setIdValue] = useState(form.id)
  const [nameValue, setNameValue] = useState(form.name)
  const [descValue, setDescValue] = useState(form.description)
  const [amountValue, setAmountValue] = useState(form.amount)
  const [dateValue, setDateValue] = useState(form.date.replace(' 00:00:00', ''))
  const [catValue, setCatValue] = useState(form.category)
  const [typeValue, setTypeValue] = useState(form.type)
  const [bankValue, setBankValue] = useState(form.bank)
  const [recuValue, setRecuValue] = useState(form.recurring)
  const [fileName, setFileName] = useState(form.file_name)
  const [fileValue, setFileValue] = useState(form.file_path)

  /* List of Inputs
    Update values if form change outside this component
    */
  useEffect(() => {
    setIdValue(form.id)
    setNameValue(form.name)
    setDescValue(form.description)
    setAmountValue(form.amount)
    setDateValue(form.date.replace(' 00:00:00', ''))
    setFileName(form.file_name)
    setFileValue(form.file_path)
    setBankValue(form.bank)
    setCatValue(form.category)
    setTypeValue(form.type)
    setRecuValue(form.recurring)
  }, [form])

  return (
    <>
      <div>
        <form
          className="needs-validation"
          onSubmit={async (e) => {
            e.preventDefault() // Prevent reload

            await handleSubmit(
              {
                id: idValue,
                name: nameValue,
                description: descValue,
                amount: amountValue,
                date: dateValue,
                category: catValue,
                type: typeValue,
                bank: bankValue,
                recurring: recuValue,
                file_name: fileName,
                file_path: await window.api.showCopyFile(fileValue)
              },
              table
            )
            // Refresh only the necessary
            setRefresh(!refresh)

            // Use boostrap to hide modal
            const myModalEl = document.getElementById('staticBackdrop')
            const modal = bootstrap.Modal.getInstance(myModalEl)
            modal.hide()
          }}
        >
          <div
            className="modal fade"
            id="staticBackdrop"
            data-bs-backdrop="static"
            data-bs-keyboard="false"
            aria-labelledby="staticBackdropLabel"
            aria-hidden="true"
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h1 className="modal-title fs-5" id="staticBackdropLabel">
                    Receipt
                  </h1>
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  ></button>
                </div>
                {/* Form control inside modal */}
                <div className="modal-body">
                  <div className="input-group mb-3">
                    <span className="input-group-text" id="basic-addon1" style={{ width: '100px' }}>
                      Name
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ynter Premium"
                      aria-label="Name"
                      aria-describedby="basic-addon1"
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-group mb-3">
                    <span className="input-group-text" style={{ width: '100px' }}>
                      Description
                    </span>
                    <textarea
                      className="form-control"
                      placeholder="Optional"
                      aria-label="With textarea"
                      value={descValue}
                      onChange={(e) => setDescValue(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="d-flex flex-row  mb-5">
                    <div className="input-group">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="1000"
                        aria-label="Amount"
                        value={amountValue}
                        onChange={(e) => setAmountValue(e.target.value)}
                        required
                      />
                      <span className="input-group-text">$</span>
                    </div>

                    <div className="input-group ps-4">
                      <input
                        type="date"
                        className="form-control"
                        aria-label="Date"
                        value={dateValue}
                        onChange={(e) => setDateValue(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Category</label>

                    <div className="input-group mb-3">
                      <select
                        className="form-select custom-select"
                        value={catValue}
                        onChange={(e) => setCatValue(e.target.value)}
                      >
                        {receiptCategory(table).map((data, index) => {
                          // If value == -1 (Is All) or Is the last element (recurring), then ignore
                          if (data.value == -1 || data.value == receiptCategory(table).length - 2)
                            return
                          return (
                            <option className="custom-option" key={index} value={data.value}>
                              {data.label}
                            </option>
                          )
                        })}
                      </select>
                    </div>
                  </div>

                  <div className="input-group mb-4">
                    <select
                      className="form-select custom-select"
                      style={{ height: '38px' }}
                      value={typeValue}
                      onChange={(e) => setTypeValue(e.target.value)}
                    >
                      <option className="custom-option" value={0}>
                        Bank transfer
                      </option>
                      <option className="custom-option" value={1}>
                        Card
                      </option>
                      <option className="custom-option" value={2}>
                        Cash
                      </option>
                    </select>
                    <input
                      type="text"
                      className="form-control w-50"
                      placeholder="Bank name"
                      aria-label="Bank Name"
                      value={bankValue}
                      onChange={(e) => setBankValue(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-group mb-3">
                    <span className="input-group-text" id="basic-addon1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18px"
                        height="18px"
                        fill="currentColor"
                        className="bi bi-paperclip"
                        viewBox="0 0 16 16"
                      >
                        <path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0z" />
                      </svg>
                    </span>
                    <button
                      type="button"
                      className="border btn form-control border text-start"
                      onClick={async () => {
                        const result = await window.api.showGetFile()

                        if (result.filesize > 100)
                          window.api.showError(
                            "Couldn't add the file, it's too large.\nMax size is 100mb."
                          )

                        setFileName(result.filename)
                        setFileValue(result.file)
                      }}
                    >
                      {fileName ? abbreviateString(fileName, 20) : 'Attach File'}
                    </button>
                  </div>
                </div>
                <div className="modal-footer">
                  <div className="form-check d-flex align-items-center me-auto">
                    <input
                      className="form-check-input mb-2"
                      type="checkbox"
                      id="flexCheckDefault"
                      checked={recuValue}
                      onChange={(e) => setRecuValue(e.target.checked)}
                    />
                    <label className="form-check-label ms-2">Recurring</label>
                  </div>
                  {idValue && (
                    <button
                      type="button"
                      className="btn btn-danger"
                      data-bs-dismiss="modal"
                      onClick={() => {
                        handleDeleteReceipt(idValue, table)
                        window.api.DeleteFile(fileValue)
                        setRefresh(!refresh)
                      }}
                    >
                      Delete
                    </button>
                  )}
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
      </div>
    </>
  )
}

export default NewReceipt
