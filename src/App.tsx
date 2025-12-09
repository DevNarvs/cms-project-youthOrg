import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<div className="p-8">
            <h1 className="text-4xl font-bold text-primary">Youth Organization CMS</h1>
            <p className="mt-4 text-muted-foreground">Setup complete. Ready for Section 2.</p>
          </div>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
