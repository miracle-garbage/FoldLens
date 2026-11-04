import { Route, Routes } from 'react-router-dom'

import { HomePage } from '@/features/home/HomePage'
import { NotFoundPage } from '@/features/home/NotFoundPage'
import { WorkspacePage } from '@/features/workspace/WorkspacePage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/entry/:entryId" element={<WorkspacePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
