import { Outlet, NavLink } from 'react-router-dom'
import { useState } from 'react'

// Icons
import Logo from '../../assets/icons/logo.svg'
import Home from '../../assets/icons/home.svg'
import Wallet from '../../assets/icons/wallet.svg'
import Cart from '../../assets/icons/cart.svg'
import Calendar from '../../assets/icons/calendar.svg'
import Clipboard from '../../assets/icons/clipboard.svg'
import Person from '../../assets/icons/person.svg'
import Google from '../../assets/icons/google.png'

const WEBSITE = import.meta.env.VITE_WEBSITE

export default function Navbar(): JSX.Element {
  // Form Feedback message
  const [message, setMessaga] = useState({ type: '', content: '' })

  // Form email
  const [email, setEmail] = useState('')

  // Form feedback loading
  const [isLoading, setLoading] = useState(false)
  return (
    <>
      <div className="top-bar ms-3 mt-2">
        {/* Navbar open button */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#offcanvasNavbar"
          aria-controls="offcanvasNavbar"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32px"
              height="32px"
              fill="currentColor"
              className="bi bi-list"
              viewBox="0 0 16 16"
            >
              <path
                fillRule="evenodd"
                d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"
              />
            </svg>
          </span>
        </button>

        {/* Offcanva navbar */}
        <div
          className="offcanvas offcanvas-start border-end border-2 border-primary"
          tabIndex={-1}
          id="offcanvasNavbar"
          aria-labelledby="offcanvasNavbarLabel"
          style={{ width: '60px', height: '100vh' }}
        >
          <nav className="navbar d-flex flex-column h-100">
            <div className="mt-5 d-flex flex-column gap-4">
              <NavLink
                className="nav-link rounded d-flex"
                to="/"
                style={({ isActive }) => {
                  return {
                    backgroundColor: isActive ? 'rgba(217, 217, 217, 0.80)' : 'transparent',
                    borderColor: isActive ? 'black' : 'transparent',
                    borderStyle: isActive ? 'solid' : 'none',
                    borderWidth: '2px',
                    height: '40px',
                    width: '40px'
                  }
                }}
              >
                <img className="m-auto" src={Home} alt="logo" width={24} height={24} />
              </NavLink>

              <NavLink
                className="nav-link rounded d-flex"
                to="revenue"
                style={({ isActive }) => {
                  return {
                    backgroundColor: isActive ? 'rgba(217, 217, 217, 0.80)' : 'transparent',
                    borderColor: isActive ? 'black' : 'transparent',
                    borderStyle: isActive ? 'solid' : 'none',
                    borderWidth: '2px',
                    height: '40px',
                    width: '40px'
                  }
                }}
              >
                <img className="m-auto" src={Wallet} alt="logo" width={24} height={24} />
              </NavLink>

              <NavLink
                className="nav-link rounded d-flex"
                to="expenses"
                style={({ isActive }) => {
                  return {
                    backgroundColor: isActive ? 'rgba(217, 217, 217, 0.80)' : 'transparent',
                    borderColor: isActive ? 'black' : 'transparent',
                    borderStyle: isActive ? 'solid' : 'none',
                    borderWidth: '2px',
                    height: '40px',
                    width: '40px'
                  }
                }}
              >
                <img className="m-auto" src={Cart} alt="logo" width={24} height={24} />
              </NavLink>

              <NavLink
                className="nav-link rounded d-flex"
                to="agenda"
                style={({ isActive }) => {
                  return {
                    backgroundColor: isActive ? 'rgba(217, 217, 217, 0.80)' : 'transparent',
                    borderColor: isActive ? 'black' : 'transparent',
                    borderStyle: isActive ? 'solid' : 'none',
                    borderWidth: '2px',
                    height: '40px',
                    width: '40px'
                  }
                }}
              >
                <img className="m-auto" src={Calendar} alt="logo" width={24} height={24} />
              </NavLink>

              <NavLink
                className="nav-link rounded d-flex"
                to="notes"
                style={({ isActive }) => {
                  return {
                    backgroundColor: isActive ? 'rgba(217, 217, 217, 0.80)' : 'transparent',
                    borderColor: isActive ? 'black' : 'transparent',
                    borderStyle: isActive ? 'solid' : 'none',
                    borderWidth: '2px',
                    height: '40px',
                    width: '40px'
                  }
                }}
              >
                <img className="m-auto" src={Clipboard} alt="logo" width={24} height={24} />
              </NavLink>
            </div>

            <div className="mt-auto mb-5">
              {!localStorage.getItem('user:email') ? (
                <div
                  data-bs-toggle="modal"
                  data-bs-target="#loginStaticBackDrop"
                  style={{ cursor: 'pointer' }}
                >
                  <img className="m-auto" src={Person} alt="logo" width={24} height={24} />
                </div>
              ) : (
                <NavLink className="nav-link rounded d-flex" to="settings">
                  <img className="m-auto" src={Person} alt="logo" width={24} height={24} />
                </NavLink>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* Navbar */}
      <nav
        className="navbar left-bar border-end border-2 border-primary
                d-flex flex-column"
        style={{ width: '60px' }}
      >
        <div className="mt-5 d-flex flex-column gap-4">
          {/* Tabs */}
          <NavLink
            className="nav-link rounded d-flex"
            to="/"
            style={({ isActive }) => {
              return {
                backgroundColor: isActive ? 'rgba(217, 217, 217, 0.80)' : 'transparent',
                borderColor: isActive ? 'black' : 'transparent',
                borderStyle: isActive ? 'solid' : 'none',
                borderWidth: '2px',
                height: '40px',
                width: '40px'
              }
            }}
          >
            <img className="m-auto" src={Home} alt="logo" width={24} height={24} />
          </NavLink>

          <NavLink
            className="nav-link rounded d-flex"
            to="revenue"
            style={({ isActive }) => {
              return {
                backgroundColor: isActive ? 'rgba(217, 217, 217, 0.80)' : 'transparent',
                borderColor: isActive ? 'black' : 'transparent',
                borderStyle: isActive ? 'solid' : 'none',
                borderWidth: '2px',
                height: '40px',
                width: '40px'
              }
            }}
          >
            <img className="m-auto" src={Wallet} alt="logo" width={24} height={24} />
          </NavLink>

          <NavLink
            className="nav-link rounded d-flex"
            to="expenses"
            style={({ isActive }) => {
              return {
                backgroundColor: isActive ? 'rgba(217, 217, 217, 0.80)' : 'transparent',
                borderColor: isActive ? 'black' : 'transparent',
                borderStyle: isActive ? 'solid' : 'none',
                borderWidth: '2px',
                height: '40px',
                width: '40px'
              }
            }}
          >
            <img className="m-auto" src={Cart} alt="logo" width={24} height={24} />
          </NavLink>

          <NavLink
            className="nav-link rounded d-flex"
            to="agenda"
            style={({ isActive }) => {
              return {
                backgroundColor: isActive ? 'rgba(217, 217, 217, 0.80)' : 'transparent',
                borderColor: isActive ? 'black' : 'transparent',
                borderStyle: isActive ? 'solid' : 'none',
                borderWidth: '2px',
                height: '40px',
                width: '40px'
              }
            }}
          >
            <img className="m-auto" src={Calendar} alt="logo" width={24} height={24} />
          </NavLink>

          <NavLink
            className="nav-link rounded d-flex"
            to="notes"
            style={({ isActive }) => {
              return {
                backgroundColor: isActive ? 'rgba(217, 217, 217, 0.80)' : 'transparent',
                borderColor: isActive ? 'black' : 'transparent',
                borderStyle: isActive ? 'solid' : 'none',
                borderWidth: '2px',
                height: '40px',
                width: '40px'
              }
            }}
          >
            <img className="m-auto" src={Clipboard} alt="logo" width={24} height={24} />
          </NavLink>
        </div>

        <div className="mb-5 mt-auto">
          {!localStorage.getItem('user:email') ? (
            <div
              data-bs-toggle="modal"
              data-bs-target="#loginStaticBackDrop"
              style={{ cursor: 'pointer' }}
            >
              <img className="m-auto" src={Person} alt="logo" width={24} height={24} />
            </div>
          ) : (
            <NavLink className="nav-link rounded d-flex" to="settings">
              <img className="m-auto" src={Person} alt="logo" width={24} height={24} />
            </NavLink>
          )}
        </div>
      </nav>

      <form
        onSubmit={async (e) => {
          e.preventDefault() // Prevent reload
          setLoading(true) // Start loading feedback

          const error = await window.api.otpSign(email)

          // Change the bottom message and stop loading
          if (error) {
            setMessaga({
              type: 'text-danger',
              content: 'Unable to send the verification link. Please try again later.'
            })
            console.error(error)
            return
          }

          // Stop loading feedback
          setLoading(false)

          // Send feedback message
          setMessaga({
            type: 'text-success',
            content: 'A verification link has been sent to your email.'
          })
        }}
      >
        <div
          className="modal fade position-absolute"
          id="loginStaticBackDrop"
          data-bs-backdrop="static"
          data-bs-keyboard="false"
          aria-labelledby="loginStaticBackDropLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h1 className="modal-title fs-5" id="loginStaticBackDropLabel">
                  <img className="m-auto" src={Logo} alt="logo" width={24} height={24} />
                </h1>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <div className="d-flex flex-column h-50 align-items-center w-100 gap-3 p-5">
                  <a
                    href="#"
                    className="btn border border-2"
                    onKeyDown={(e) => e.preventDefault()}
                    onClick={async (e) => {
                      e.preventDefault()
                      await window.api.googleOauth()
                    }}
                    style={{ width: '300px' }}
                  >
                    <img
                      src={Google}
                      width={18}
                      height={18}
                      alt="google"
                      style={{ display: 'inline' }}
                    />

                    <h6 className="ms-2" style={{ display: 'inline' }}>
                      Continue with Google
                    </h6>
                  </a>

                  <h6>Or</h6>

                  <input
                    type="email"
                    name="email"
                    className="form-control border border-2"
                    id="FormControlInput1"
                    placeholder="Email"
                    style={{ width: '300px' }}
                    required
                    value={email}
                    onChange={(ev) => setEmail(ev.target.value)}
                  />

                  <button
                    className="btn border border-2"
                    type="submit"
                    disabled={isLoading}
                    style={{ width: '300px' }}
                  >
                    {isLoading && (
                      <span className="spinner-grow spinner-grow-sm" aria-hidden="true" />
                    )}

                    <h6 className="ms-2" style={{ display: 'inline' }}>
                      Continue with Email
                    </h6>
                  </button>

                  <div className={message.type}>{message.content}</div>
                </div>
              </div>
              <div className="modal-footer d-flex flex-column justify-content-center">
                <div className="d-flex justify-content-between" style={{ width: '225px' }}>
                  <a
                    className="nav-link"
                    href={WEBSITE + '/Privacy'}
                    target="_blank"
                    style={{ display: 'inline' }}
                    rel="noreferrer"
                  >
                    <h6 style={{ display: 'inline' }}>Privacy Policy</h6>
                  </a>
                  <a
                    className="nav-link"
                    href={WEBSITE + '/Terms'}
                    target="_blank"
                    style={{ display: 'inline' }}
                    rel="noreferrer"
                  >
                    <h6 style={{ display: 'inline' }}>Terms of Service</h6>
                  </a>
                </div>
                <div className="mt-2">@Ynter - All rights reserved.</div>
              </div>
            </div>
          </div>
        </div>
      </form>
      <Outlet />
    </>
  )
}
