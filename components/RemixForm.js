import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../pages/_app'

export default function RemixForm({ songId, parentVersionId, onSuccess, onCancel }) {
  const { user } = useAuth()
  const [file, setFile] = useState(null)
  const [contributionNotes, setContributionNotes] = useState('')
  const [versionType, setVersionType] = useState('cowrite')
  const [aiDisclosure, setAiDisclosure] = useState('human_made')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleFile(e) {
    const f = e.target.files[0]
    if (f && f.size > 50 * 1024 * 1024) { setError('File must be under 50MB'); return }
    setFile(f)
    setError('')
  }

  async function submit(e) {
    e.preventDefault()
    if (!file) { setError('Please select a file'); return }
    if (!contributionNotes.trim()) { setError('Briefly describe what you contributed'); return }
    setLoading(true)

    try {
      const ext = file.name.split('.').pop()
      const path = `songs/${Date.now()}-${Math.random().toString(36).slice(7)}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('audio').upload(path, file)
      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage.from('audio').getPublicUrl(path)

      const { error: versionErr } = await supabase.from('versions').insert({
        song_id: songId,
        parent_song_id: songId,
        parent_version_id: parentVersionId,
        user_id: user.id,
        audio_url: publicUrl,
        is_original: false,
        version_type: versionType,
        ai_disclosure: aiDisclosure,
        contribution_notes: contributionNotes.trim(),
        notes: ''
      })
      if (versionErr) throw versionErr

      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: 'rgba(10,10,10,0.8)', padding: '1.5rem', border: '1px solid var(--burnt-orange)', marginTop: '1rem' }}>
      <h4 className="mono" style={{ color: 'var(--burnt-orange)', marginBottom: '0.5rem' }}>
        {parentVersionId ? 'Build From This Version' : 'Build From Original'}
      </h4>
      <p style={{ fontSize: '0.8rem', opacity: 0.7, lineHeight: 1.5, marginBottom: '1rem' }}>
        Your version will be added to the chain. Splits are equal among everyone in the chain — original artist always at the root. The Contribution Record will reflect your addition.
      </p>

      <form onSubmit={submit} style={{ display: 'grid', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
            <input type="radio" value="cowrite" checked={versionType === 'cowrite'} onChange={() => setVersionType('cowrite')} />
            <span className="mono" style={{ fontSize: '0.8rem' }}>Co-write</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
            <input type="radio" value="cover" checked={versionType === 'cover'} onChange={() => setVersionType('cover')} />
            <span className="mono" style={{ fontSize: '0.8rem' }}>Cover</span>
          </label>
        </div>

        <div>
          <label className="mono" style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.4rem', opacity: 0.7 }}>What did you contribute? *</label>
          <input
            type="text"
            value={contributionNotes}
            onChange={e => setContributionNotes(e.target.value)}
            placeholder="e.g. added vocals, rewrote bridge, electronic remix"
            required
          />
        </div>

        <div>
          <label className="mono" style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.4rem', opacity: 0.7 }}>How was this made? *</label>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
              <input type="radio" value="human_made" checked={aiDisclosure === 'human_made'} onChange={() => setAiDisclosure('human_made')} />
              <span className="mono" style={{ fontSize: '0.8rem' }}>Human</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
              <input type="radio" value="ai_assisted" checked={aiDisclosure === 'ai_assisted'} onChange={() => setAiDisclosure('ai_assisted')} />
              <span className="mono" style={{ fontSize: '0.8rem' }}>AI-assisted</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
              <input type="radio" value="pure_ai" checked={aiDisclosure === 'pure_ai'} onChange={() => setAiDisclosure('pure_ai')} />
              <span className="mono" style={{ fontSize: '0.8rem' }}>Pure AI</span>
            </label>
          </div>
        </div>

        <div style={{ border: '1px dashed var(--accent-yellow)', padding: '1.25rem', textAlign: 'center', position: 'relative', cursor: 'pointer' }}>
          <input type="file" accept="audio/*" onChange={handleFile} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
          <span className="mono" style={{ color: 'var(--accent-yellow)', fontSize: '0.85rem' }}>
            {file ? `✓ ${file.name}` : '📼 Upload your version (max 50MB)'}
          </span>
        </div>

        {error && <p className="error">⚠ {error}</p>}

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <input type="checkbox" required style={{ marginTop: 4, width: 16, height: 16 }} />
          <span style={{ fontSize: '0.8rem', opacity: 0.8, lineHeight: 1.5 }}>
            I understand splits are equal among the chain, and I'm responsible for any mechanical licenses required for cover material. The Contribution Record reflects the lineage; the platform does not arbitrate.
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
            {loading ? 'Uploading...' : 'Add to Chain'}
          </button>
          <button type="button" className="btn btn-sm" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
