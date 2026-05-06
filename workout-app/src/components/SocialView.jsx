import { useState, useEffect, useCallback } from 'react'
import { Users, UserPlus, UserCheck, Search, X, Dumbbell, Clock, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { collection, query, where, getDocs, getDoc, doc, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase'
import { useWorkoutStore } from '../store/workoutStore'
import { SPLIT_LABELS } from '../data/exercises'
import { useWgerGif } from '../utils/wgerGif'

// ── Time-ago helper ────────────────────────────────────────────────────────
function timeAgo(ts) {
  if (!ts) return ''
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ── User avatar ─────────────────────────────────────────────────────────────
function Avatar({ name, size = 10, active = false }) {
  const px = size * 4
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold flex-shrink-0"
      style={{ width: px, height: px, background: active ? '#22c55e22' : '#1e1e1e', color: active ? '#22c55e' : '#888', border: active ? '1px solid #22c55e44' : '1px solid #2a2a2a', fontSize: px * 0.38 }}
    >
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

// ── Exercise row inside feed card ──────────────────────────────────────────
function SocialExerciseRow({ exercise }) {
  const gif = useWgerGif(exercise.name)
  const topSet = exercise.sets.length > 0
    ? exercise.sets.reduce((b, s) => Number(s.weight) >= Number(b.weight) ? s : b, exercise.sets[0])
    : null
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: '#2a2a2a' }}>
        {gif ? <img src={gif} alt="" className="w-full h-full object-cover" loading="lazy" /> : <Dumbbell size={14} color="#555" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white text-xs font-medium truncate">{exercise.name}</div>
        {topSet && (
          <div className="text-xs" style={{ color: '#555' }}>
            {exercise.sets.length}×{topSet.reps || '?'}
            {topSet.weight && topSet.weight !== 'BW' ? ` @ ${topSet.weight}lbs` : topSet.weight === 'BW' ? ' @ BW' : ''}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Feed post card ─────────────────────────────────────────────────────────
function FeedCard({ workout, displayName }) {
  const [expanded, setExpanded] = useState(false)
  const duration = workout.endTime ? Math.round((workout.endTime - workout.startTime) / 60000) : null
  const totalSets = workout.exercises.reduce((acc, e) => acc + e.sets.length, 0)

  return (
    <div className="rounded-2xl overflow-hidden mb-3" style={{ background: '#141414' }}>
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Avatar name={displayName} size={10} />
        <div className="flex-1">
          <div className="text-white font-bold text-sm">{displayName}</div>
          <div className="text-xs" style={{ color: '#555' }}>{timeAgo(workout.endTime || workout.startTime)}</div>
        </div>
        {duration !== null && (
          <div className="flex items-center gap-1" style={{ color: '#555' }}>
            <Clock size={12} /><span className="text-xs">{duration}m</span>
          </div>
        )}
      </div>
      <div className="px-4 pb-3" style={{ borderTop: '1px solid #1e1e1e' }}>
        <div className="pt-3 pb-1">
          <div className="text-white font-semibold text-sm">{workout.name || SPLIT_LABELS[workout.split] || workout.split}</div>
          <div className="text-xs mt-0.5" style={{ color: '#555' }}>{workout.exercises.length} exercises · {totalSets} sets</div>
        </div>
        {expanded ? (
          <div>
            {workout.exercises.map(ex => <SocialExerciseRow key={ex.name} exercise={ex} />)}
            <button onClick={() => setExpanded(false)} className="w-full text-xs pt-2 flex items-center justify-center gap-1" style={{ color: '#555' }}>
              <ChevronUp size={13} /> Show less
            </button>
          </div>
        ) : workout.exercises.length > 0 && (
          <button onClick={() => setExpanded(true)} className="w-full text-xs pt-1 flex items-center justify-center gap-1" style={{ color: '#22c55e' }}>
            <ChevronDown size={13} /> View {workout.exercises.length} exercises
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main SocialView ────────────────────────────────────────────────────────
export default function SocialView() {
  const store = useWorkoutStore()
  const [activeTab, setActiveTab] = useState('feed')
  const [search, setSearch] = useState('')

  // uid arrays from store (real-time via Firestore onSnapshot)
  const friends         = store.friends || []
  const receivedUids    = store.friendRequests?.received || []
  const sentUids        = store.friendRequests?.sent || []

  // Fetched display names for UIDs (uid → displayName)
  const [profiles, setProfiles]       = useState({}) // uid → { displayName, workoutCount }
  const [feedItems, setFeedItems]     = useState([])
  const [discoverResults, setDiscover] = useState([])
  const [loadingFeed, setLoadingFeed] = useState(false)

  // Fetch a profile by uid (cached in profiles state)
  const fetchProfile = useCallback(async (uid) => {
    if (profiles[uid]) return profiles[uid]
    try {
      const snap = await getDoc(doc(db, 'userProfiles', uid))
      if (snap.exists()) {
        const data = snap.data()
        setProfiles(p => ({ ...p, [uid]: data }))
        return data
      }
    } catch {}
    return null
  }, [profiles])

  // Load feed: fetch workouts from all friends
  useEffect(() => {
    if (friends.length === 0) { setFeedItems([]); return }
    setLoadingFeed(true)
    let cancelled = false

    Promise.all(friends.map(async uid => {
      const profile = await fetchProfile(uid)
      const displayName = profile?.displayName || uid.slice(0, 8)
      try {
        const snap = await getDocs(
          query(collection(db, 'users', uid, 'workouts'), orderBy('startTime', 'desc'), limit(8))
        )
        return snap.docs.map(d => ({ ...d.data(), _feedUid: uid, _feedName: displayName }))
      } catch { return [] }
    })).then(results => {
      if (cancelled) return
      const all = results.flat().sort((a, b) => (b.endTime || b.startTime || 0) - (a.endTime || a.startTime || 0))
      setFeedItems(all.slice(0, 30))
      setLoadingFeed(false)
    })

    return () => { cancelled = true }
  }, [friends.join(',')])  // re-run only when friends list changes

  // Fetch profiles for received/sent requests so we can show names
  useEffect(() => {
    [...receivedUids, ...sentUids].forEach(uid => fetchProfile(uid))
  }, [receivedUids.join(','), sentUids.join(',')])

  // Discover search — prefix match on displayName in userProfiles
  useEffect(() => {
    if (!search.trim()) { setDiscover([]); return }
    const q = search.trim()
    getDocs(
      query(
        collection(db, 'userProfiles'),
        where('displayName', '>=', q),
        where('displayName', '<=', q + ''),
        limit(20)
      )
    ).then(snap => {
      setDiscover(snap.docs.map(d => d.data()).filter(u => u.uid !== store.uid))
    }).catch(() => {})
  }, [search, store.uid])

  const pendingCount = receivedUids.length

  return (
    <div className="flex flex-col min-h-screen pb-24 pt-14">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Community</h1>
        {pendingCount > 0 && (
          <span className="text-xs px-2 py-1 rounded-full font-bold" style={{ background: '#22c55e', color: '#000' }}>
            {pendingCount} request{pendingCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex px-4 gap-2 mb-4">
        {[
          { id: 'feed',     label: 'Feed' },
          { id: 'friends',  label: `Friends${friends.length > 0 ? ` (${friends.length})` : ''}` },
          { id: 'discover', label: 'Discover' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold relative"
            style={{ background: activeTab === t.id ? '#22c55e' : '#141414', color: activeTab === t.id ? '#000' : '#888' }}
          >
            {t.label}
            {t.id === 'friends' && pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center font-bold" style={{ background: '#ef4444', color: '#fff', fontSize: 9 }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── FEED ── */}
      {activeTab === 'feed' && (
        <div className="px-4">
          {loadingFeed ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#22c55e', borderTopColor: 'transparent' }} />
            </div>
          ) : feedItems.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#141414' }}>
                <Users size={28} color="#555" />
              </div>
              <div className="text-center">
                <div className="text-white font-semibold mb-1">No workouts yet</div>
                <div className="text-sm" style={{ color: '#555' }}>
                  {friends.length === 0 ? 'Follow your gym friends to see their workouts here' : "Your friends haven't logged any workouts yet"}
                </div>
              </div>
              {friends.length === 0 && (
                <button onClick={() => setActiveTab('discover')}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm"
                  style={{ background: '#22c55e22', color: '#22c55e', border: '1px solid #22c55e44' }}>
                  <UserPlus size={16} /> Find Friends
                </button>
              )}
            </div>
          ) : feedItems.map((w, i) => (
            <FeedCard key={`${w.id}-${i}`} workout={w} displayName={w._feedName} />
          ))}
        </div>
      )}

      {/* ── FRIENDS ── */}
      {activeTab === 'friends' && (
        <div className="px-4">
          {receivedUids.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#22c55e' }}>
                Follow Requests ({receivedUids.length})
              </div>
              {receivedUids.map(uid => {
                const name = profiles[uid]?.displayName || uid.slice(0, 8)
                return (
                  <div key={uid} className="rounded-2xl px-4 py-3 flex items-center gap-3 mb-2" style={{ background: '#141414' }}>
                    <Avatar name={name} size={10} />
                    <div className="flex-1">
                      <div className="text-white font-semibold text-sm">{name}</div>
                      <div className="text-xs" style={{ color: '#555' }}>wants to follow your workouts</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => store.acceptFriendRequest(uid)}
                        className="w-9 h-9 rounded-full flex items-center justify-center"
                        style={{ background: '#22c55e', color: '#000' }}><Check size={16} /></button>
                      <button onClick={() => store.rejectFriendRequest(uid)}
                        className="w-9 h-9 rounded-full flex items-center justify-center"
                        style={{ background: '#2a2a2a', color: '#888' }}><X size={16} /></button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {sentUids.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#555' }}>Sent Requests</div>
              {sentUids.map(uid => {
                const name = profiles[uid]?.displayName || uid.slice(0, 8)
                return (
                  <div key={uid} className="rounded-2xl px-4 py-3 flex items-center gap-3 mb-2" style={{ background: '#141414' }}>
                    <Avatar name={name} size={10} />
                    <div className="flex-1">
                      <div className="text-white font-semibold text-sm">{name}</div>
                      <div className="text-xs" style={{ color: '#555' }}>Request pending</div>
                    </div>
                    <button onClick={() => store.cancelFriendRequest(uid)}
                      className="text-xs px-3 py-1.5 rounded-full font-semibold"
                      style={{ background: '#2a2a2a', color: '#888' }}>Cancel</button>
                  </div>
                )
              })}
            </div>
          )}

          {friends.length === 0 && receivedUids.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#141414' }}>
                <UserPlus size={28} color="#555" />
              </div>
              <div className="text-white font-semibold">No friends yet</div>
              <div className="text-sm text-center" style={{ color: '#555' }}>Search for friends in Discover</div>
              <button onClick={() => setActiveTab('discover')}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm"
                style={{ background: '#22c55e22', color: '#22c55e', border: '1px solid #22c55e44' }}>
                <UserPlus size={16} /> Find Friends
              </button>
            </div>
          ) : friends.length > 0 && (
            <div>
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#555' }}>Your Friends</div>
              {friends.map(uid => {
                const name = profiles[uid]?.displayName || uid.slice(0, 8)
                return (
                  <div key={uid} className="rounded-2xl px-4 py-3 flex items-center gap-3 mb-2" style={{ background: '#141414' }}>
                    <Avatar name={name} size={10} active />
                    <div className="flex-1">
                      <div className="text-white font-semibold text-sm">{name}</div>
                    </div>
                    <button onClick={() => store.unfriend(uid)}
                      className="text-xs px-3 py-1.5 rounded-full font-semibold"
                      style={{ background: '#2a2a2a', color: '#888' }}>Unfollow</button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── DISCOVER ── */}
      {activeTab === 'discover' && (
        <div className="px-4">
          <div className="flex items-center gap-2 rounded-xl px-4 py-3 mb-4" style={{ background: '#141414' }}>
            <Search size={16} color="#555" />
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-500"
            />
            {search && <button onClick={() => setSearch('')} style={{ color: '#555' }}><X size={14} /></button>}
          </div>

          {!search ? (
            <div className="flex flex-col items-center gap-2 py-12">
              <Search size={32} color="#333" />
              <span className="text-sm text-center" style={{ color: '#555' }}>Search for people by their display name</span>
            </div>
          ) : discoverResults.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12">
              <Users size={32} color="#333" />
              <span className="text-sm" style={{ color: '#555' }}>No users found for "{search}"</span>
            </div>
          ) : discoverResults.map(profile => {
            const isFriend       = friends.includes(profile.uid)
            const requestSent    = sentUids.includes(profile.uid)
            const requestReceived = receivedUids.includes(profile.uid)
            return (
              <div key={profile.uid} className="rounded-2xl px-4 py-3 flex items-center gap-3 mb-2" style={{ background: '#141414' }}>
                <Avatar name={profile.displayName} size={10} active={isFriend} />
                <div className="flex-1">
                  <div className="text-white font-semibold text-sm">{profile.displayName}</div>
                </div>
                {isFriend ? (
                  <span className="text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1"
                    style={{ background: '#22c55e22', color: '#22c55e' }}>
                    <UserCheck size={12} /> Friends
                  </span>
                ) : requestReceived ? (
                  <button onClick={() => store.acceptFriendRequest(profile.uid)}
                    className="text-xs px-3 py-1.5 rounded-full font-semibold"
                    style={{ background: '#22c55e', color: '#000' }}>Accept</button>
                ) : requestSent ? (
                  <button onClick={() => store.cancelFriendRequest(profile.uid)}
                    className="text-xs px-3 py-1.5 rounded-full font-semibold"
                    style={{ background: '#2a2a2a', color: '#888' }}>Requested</button>
                ) : (
                  <button onClick={() => store.sendFriendRequest(profile.uid)}
                    className="text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1"
                    style={{ background: '#22c55e22', color: '#22c55e', border: '1px solid #22c55e44' }}>
                    <UserPlus size={12} /> Follow
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
