import React, { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function App() {
  const [records, setRecords] = useState([])
  const [patientId, setPatientId] = useState('patient-1')
  const [type, setType] = useState('note')
  const [data, setData] = useState('')
  const [file, setFile] = useState(null)

  useEffect(() => { fetchRecords() }, [])

  async function fetchRecords() {
    const res = await fetch(`${API_BASE}/records`)
    const json = await res.json()
    setRecords(json)
  }

  async function addRecord(e) {
    e.preventDefault()
    const res = await fetch(`${API_BASE}/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId, type, data })
    })
    if (res.ok) {
      setData('')
      fetchRecords()
    }
  }

  async function uploadFile(e) {
    e.preventDefault()
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    form.append('patientId', patientId)
    const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: form })
    if (res.ok) {
      setFile(null)
      fetchRecords()
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: 'Arial' }}>
      <h1>Patients Health Records (Prototype)</h1>

      <section style={{ marginBottom: 20 }}>
        <h2>Add manual record</h2>
        <form onSubmit={addRecord}>
          <div>
            <label>Patient ID: <input value={patientId} onChange={e => setPatientId(e.target.value)} /></label>
          </div>
          <div>
            <label>Type: <input value={type} onChange={e => setType(e.target.value)} /></label>
          </div>
          <div>
            <label>Data:</label><br />
            <textarea value={data} onChange={e => setData(e.target.value)} rows={4} cols={60} />
          </div>
          <button type="submit">Add record</button>
        </form>
      </section>

      <section style={{ marginBottom: 20 }}>
        <h2>Upload scanned report</h2>
        <form onSubmit={uploadFile}>
          <div>
            <input type="file" onChange={e => setFile(e.target.files[0])} />
          </div>
          <div>
            <button type="submit">Upload</button>
          </div>
        </form>
      </section>

      <section>
        <h2>Records</h2>
        <pre style={{ background: '#f6f6f6', padding: 10 }}>{JSON.stringify(records, null, 2)}</pre>
      </section>
    </div>
  )
}
