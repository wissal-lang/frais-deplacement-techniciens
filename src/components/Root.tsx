import { Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'

export default function Root() {
  return (
    <>
      <Toaster position="bottom-right" richColors closeButton />
      <Outlet />
    </>
  )
}
