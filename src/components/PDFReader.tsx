'use client'

import { useEffect, useRef, useState } from 'react'

interface PDFReaderProps {
  url: string
}

export default function PDFReader({ url }: PDFReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(0)
  const [zoom, setZoom] = useState<number>(1.2)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // 1. Dynamic Script Injection to prevent Next.js bundler crashes
  useEffect(() => {
    let isMounted = true

    const initPdfJS = async () => {
      try {
        if (!(window as any).pdfjsLib) {
          const script = document.createElement('script')
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
          script.async = true
          document.body.appendChild(script)

          await new Promise((resolve) => {
            script.onload = resolve
          })
        }

        const pdfjsLib = (window as any).pdfjsLib
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

        if (!url) {
          setError('No valid document file path provided.')
          setLoading(false)
          return
        }

        const loadingTask = pdfjsLib.getDocument(url)
        loadingTask.promise.then(
          (pdf: any) => {
            if (!isMounted) return
            setPdfDoc(pdf)
            setTotalPages(pdf.numPages)
            setLoading(false)
          },
          (err: any) => {
            console.error('PDF engine load error:', err)
            if (isMounted) {
              setError('Failed to open document stream. Please verify file path permissions.')
              setLoading(false)
            }
          }
        )
      } catch (e: any) {
        console.error(e)
        if (isMounted) {
          setError('Initialization failed.')
          setLoading(false)
        }
      }
    }

    initPdfJS()

    return () => {
      isMounted = false
    }
  }, [url])

  // 2. High-Fidelity Canvas Painting Loop
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return

    let renderTask: any = null

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage)
        const canvas = canvasRef.current!
        const context = canvas.getContext('2d')

        if (!context) return

        context.clearRect(0, 0, canvas.width, canvas.height)

        const viewport = page.getViewport({ scale: zoom })
        canvas.height = viewport.height
        canvas.width = viewport.width

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        }

        renderTask = page.render(renderContext)
        await renderTask.promise
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
          console.error('Canvas render break:', err)
        }
      }
    }

    renderPage()

    return () => {
      if (renderTask) {
        renderTask.cancel()
      }
    }
  }, [pdfDoc, currentPage, zoom])

  if (!url) {
    return (
      <div className="p-10 text-center text-neutral-400 bg-neutral-900 rounded-xl border border-neutral-800">
        No PDF path provided.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-neutral-950 text-neutral-400 gap-4">
        <div className="w-10 h-10 border-4 border-fuchsia-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium animate-pulse">Streaming file buffers cleanly...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] bg-neutral-950 text-rose-500 font-medium">
        {error}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full flex flex-col bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Control Navigation Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-neutral-900 border-b border-neutral-800 gap-4 select-none">
        <div className="flex items-center gap-2">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-200 hover:bg-neutral-700 disabled:opacity-40 transition text-sm"
          >
            Prev
          </button>
          <span className="text-sm text-neutral-400 font-mono">
            {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-200 hover:bg-neutral-700 disabled:opacity-40 transition text-sm"
          >
            Next
          </button>
        </div>

        {/* Zoom Engine Control Block */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.2, 0.6))}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-800 text-neutral-200 hover:bg-neutral-700 font-bold transition text-sm"
          >
            -
          </button>
          <span className="text-xs text-neutral-400 font-mono w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.2, 2.0))}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-800 text-neutral-200 hover:bg-neutral-700 font-bold transition text-sm"
          >
            +
          </button>
        </div>

        <a
          href={url.startsWith('data:') ? url : `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=false`}
          target="_blank"
          rel="noopener noreferrer"
          className="mandala-btn inline-flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Open Externally
        </a>
      </div>

      {/* Target Canvas Board Viewport wrapper */}
      <div className="w-full overflow-auto p-6 bg-neutral-900 flex justify-center items-center min-h-[60vh]">
        <div className="shadow-2xl bg-white rounded-md p-1">
          <canvas ref={canvasRef} className="max-w-full block" />
        </div>
      </div>
    </div>
  )
}
