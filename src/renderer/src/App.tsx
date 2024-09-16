// React
import { createHashRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import { useEffect, useRef } from 'react'

// Components & Pages
import NavBar from './components/navbar'
import Agenda from './pages/agenda'
import Dashboard from './pages/dashboard'
import Expenses from './pages/expenses'
import Notes from './pages/notes'
import Revenue from './pages/revenue'
import Settings, { transactionsRefreshaAll } from './pages/settings'
import { updateRecurring } from './components/support'

import * as Sentry from '@sentry/electron/renderer'

// External
import './assets/css/global.css'
import './assets/css/layouts.css'

// Load sentry
;(async (): Promise<void> => {
  Sentry.init({
    dsn: 'https://1c08a05bf43a9d508cdf18e2d9ff25e5@o4507732393525248.ingest.de.sentry.io/4507787898847312'
  })
})()

declare const bootstrap

async function finish_load(): Promise<void> {
  try {
    // Enable boostrap tooltip
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    ;[...tooltipTriggerList].forEach((tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl))

    // Prevent all dragging
    document.addEventListener('dragstart', function (e) {
      e.preventDefault()
    })

    const email = localStorage.getItem('user:email')
    const access_token = await window.api.Session()

    if (!access_token && email) {
      // remove if error
      localStorage.removeItem('user:email')
      localStorage.removeItem('user:name')
      window.location.reload()
    }

    // Update all recurring receipts
    await updateRecurring('revenue')
    await updateRecurring('expense')

    // Refresh all bank transactions
    transactionsRefreshaAll()

    // Update Login Session
    window.onUpdateSession(async (name: string, email: string) => {
      // store local the email and username for fast acess
      localStorage.setItem('user:email', email)
      localStorage.setItem('user:name', name)
      window.location.reload()
    })
    window.onReady()
  } catch (error) {
    window.api.showError(`Something has gone wrong. Please report the error.\nError code: 1.0v001`)
    console.error(error)
  }
}

const router = createHashRouter(
  createRoutesFromElements(
    <Route path="/" element={<NavBar />}>
      <Route index element={<Dashboard />} />
      <Route path="revenue" element={<Revenue />} />
      <Route path="expenses" element={<Expenses />} />
      <Route path="agenda" element={<Agenda />} />
      <Route path="notes" element={<Notes />} />
      <Route path="settings" element={<Settings />} />
    </Route>
  )
)

export default function App(): JSX.Element {
  const pinFi = useRef<any>()
  const pinSe = useRef<any>()
  const pinTh = useRef<any>()
  const pinFo = useRef<any>()

  useEffect(() => {
    finish_load()
  }, [])

  function moveToBack(current, backIndex) {
    if ((current.key === 'Backspace' && current.target.value === '') || current === 'reset') {
      const previousInput = document.querySelectorAll('.pin-digit')[backIndex] as HTMLInputElement
      if (previousInput) {
        previousInput.focus()
      }
    }
  }

  function moveToNext(current, nextIndex) {
    if (!/^\d$/.test(current.target.value)) {
      // If is not number remove and preventDefault
      current.preventDefault()
      current.target.value = ''
      return
    }

    if (current.target.value.length === 1) {
      if (nextIndex === 4) {
        // Pin
        const pin =
          pinFi.current.value + pinSe.current.value + pinTh.current.value + pinFo.current.value

        // Send event
        window.api.sendPinCode(pin)

        // Reset default values and go back to the first
        pinFi.current.value = ''
        pinSe.current.value = ''
        pinTh.current.value = ''
        pinFo.current.value = ''
        moveToBack('reset', 0)
        return
      }
      const nextInput = document.querySelectorAll('.pin-digit')[nextIndex] as HTMLInputElement
      if (nextInput) {
        nextInput.value = ''
        nextInput.focus()
      }
    }
  }

  return (
    <>
      <div
        className="position-absolute top-50 start-50 translate-middle z-3 rounded rounded-3 border border-primary"
        id="loginmodal"
        style={{ height: '200px', width: '400px', backgroundColor: '#fafafa', display: 'none' }}
      >
        <div
          className="pin-input h-100 w-100 d-flex gap-3 
        justify-content-center align-items-center p-2 text-center"
          id="inputpin"
        >
          <input
            type="password"
            ref={pinFi}
            maxLength={1}
            className="pin-digit fs-2 text-center rounded"
            onInput={(e) => moveToNext(e, 1)}
          />
          <input
            type="password"
            ref={pinSe}
            maxLength={1}
            className="pin-digit fs-2 text-center rounded"
            onInput={(e) => moveToNext(e, 2)}
            onKeyDown={(e) => moveToBack(e, 0)}
          />
          <input
            type="password"
            ref={pinTh}
            maxLength={1}
            className="pin-digit fs-2 text-center rounded"
            onInput={(e) => moveToNext(e, 3)}
            onKeyDown={(e) => moveToBack(e, 1)}
          />
          <input
            type="password"
            ref={pinFo}
            maxLength={1}
            className="pin-digit fs-2 text-center rounded"
            onInput={(e) => moveToNext(e, 4)}
            onKeyDown={(e) => moveToBack(e, 2)}
          />
        </div>
      </div>
      <div id="blurbg" style={{ filter: 'blur(15px)' }}>
        <div
          className="grid-container"
          id="grid-container"
          style={{ backgroundColor: '#fafafa', pointerEvents: 'none' }}
        >
          <RouterProvider router={router} />
        </div>
      </div>
    </>
  )
}
