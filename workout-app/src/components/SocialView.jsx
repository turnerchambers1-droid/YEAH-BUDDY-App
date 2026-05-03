import { useState, useMemo } from 'react'
import { Users, UserPlus, UserCheck, UserX, Search, X, Dumbbell, Clock, ChevronDown, ChevronUp, Check, Zap } from 'lucide-react'
import { useWorkoutStore, loadData, getStoredUsers } from '../store/workoutStore'
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
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

// ── User avatar ─────────────────────────────────────────────────────────────
function Avatar({ username, size = 10, active = false }) {
  const bg = active ? '#22c55e22' : '#1e1e1e'
  const color = active ? '#22c55e' : '#888'
  const px = size * 4
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center font-bold text-base flex-shrink-0`}
      style={{ width: px, height: px, background: bg, color, border: active ? '1px solid #22c55e44' : '1px solid #2a2a2a', fontSize: px * 0.38 }}
    >
      {username?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

// ── Exercise row inside a social feed workout card ─────────────────────────
function SocialExerciseRow({ exercise }) {
  const gif = useWgerGif(exercise.name)
  const topSet = exercise.sets.length > 0
    ? exercise.sets.reduce((b, s) => Number(s.weight) >= Number(b.weight) ? s : b, exercise.sets[0])
    : null

  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: '#2a2a2a' }}>
        {gif
          ? <img src={gif} alt="" className="w-full h-full object-cover" loading="lazy" />
          : <Dumbbell size={14} color="#555" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white text-xs font-medium truncate">{exercise.name}</div>
        {topSet && (
          <div className="text-xs" style={{ color: '#555' }}>
            {exercise.sets.length}×{topSet.reps || '?'}
            {topSet.weight ? ` @ ${topSet.weight}lbs` : ''}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Feed post card ─────────────────────────────────────────────────────────
function FeedCard({ workout, username }) {
  const [expanded, setExpanded] = useState(false)
  const duration = workout.endTime ? Math.round((workout.endTime - workout.startTime) / 60000) : null
  const totalSets = workout.exercises.reduce((acc, e) => acc + e.sets.length, 0)

  return (
    <div className="rounded-2xl overflow-hidden mb-3" style={{ background: '#141414' }}>
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Avatar username={username} size={10} />
        <div className="flex-1">
          <div className="text-white font-bold text-sm">{username}</div>
          <div className="text-xs" style={{ color: '#555' }}>
            {timeAgo(workout.endTime || workout.startTime)}
          </div>
        </div>
        {duration !== null && (
          <div className="flex items-center gap-1" style={{ color: '#555' }}>
            <Clock size={12} />
            <span className="text-xs">{duration}m</span>
          </div>
        )}
      </div>

      {/* Workout summary */}
      <div className="px-4 pb-3" style={{ borderTop: '1px solid #1e1e1e' }}>
        <div className="pt-3 pb-1">
          <div className="text-white font-semibold text-sm">
            {workout.name || SPLIT_LABELS[workout.split] || workout.split}
          </div>
          <div className="text-xs mt-0.5" style={{ color: '#555' }}>
            {workout.exercises.length} exercises · {totalSets} sets
          </div>
        </div>

        {/* Exercise list, collapsed by default */}
        {expanded ? (
          <div>
            {workout.exercises.map(ex => (
              <SocialExerciseRow key={ex.name} exercise={ex} />
            ))}
            <button
              onClick={() => setExpanded(false)}
              className="w-full text-xs pt-2 flex items-center justify-center gap-1"
              style={{ color: '#555' }}
            >
              <ChevronUp size={13} /> Show less
            </button>
          </div>
        ) : (
          workout.exercises.length > 0 && (
            <button
              onClick={() => setExpanded(true)}
              className="w-full text-xs pt-1 flex items-center justify-center gap-1"
              style={{ color: '#22c55e' }}
            >
              <ChevronDown size={13} /> View {workout.exercises.length} exercises
            </button>
          )
        )}
      </div>
    </div>
  )
}

// ── Friend request card ────────────────────────────────────────────────────
function FriendRequestCard({ username, onAccept, onReject }) {
  return (
    <div className="rounded-2xl px-4 py-3 flex items-center gap-3 mb-2" style={{ background: '#141414' }}>
      <Avatar username={username} size={10} />
      <div className="flex-1">
        <div className="text-white font-semibold text-sm">{username}</div>
        <div className="text-xs" style={{ color: '#555' }}>wants to follow your workouts</div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onAccept}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: '#22c55e', color: '#000' }}
        >
          <Check size={16} />
        </button>
        <button
          onClick={onReject}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: '#2a2a2a', color: '#888' }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

// ── User search result card ────────────────────────────────────────────────
function UserSearchCard({ username, isFriend, requestSent, requestReceived, onSendRequest, onCancelRequest, onAccept }) {
  const userData = useMemo(() => loadData(username), [username])

  return (
    <div className="rounded-2xl px-4 py-3 flex items-center gap-3 mb-2" style={{ background: '#141414' }}>
      <Avatar username={username} size={10} active={isFriend} />
      <div className="flex-1">
        <div className="text-white font-semibold text-sm">{username}</div>
        <div className="text-xs" style={{ color: '#555' }}>
          {(userData.workouts || []).length} workouts
        </div>
      </div>
      {isFriend ? (
        <span className="text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1"
          style={{ background: '#22c55e22', color: '#22c55e' }}>
          <UserCheck size={12} /> Friends
        </span>
      ) : requestReceived ? (
        <button
          onClick={onAccept}
          className="text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1"
          style={{ background: '#22c55e', color: '#000' }}
        >
          <Check size={12} /> Accept
        </button>
      ) : requestSent ? (
        <button
          onClick={onCancelRequest}
          className="text-xs px-3 py-1.5 rounded-full font-semibold"
          style={{ background: '#2a2a2a', color: '#888' }}
        >
          Requested
        </button>
      ) : (
        <button
          onClick={onSendRequest}
          className="text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1"
          style={{ background: '#22c55e22', color: '#22c55e', border: '1px solid #22c55e44' }}
        >
          <UserPlus size={12} /> Follow
        </button>
      )}
    </div>
  )
}

// ── Main SocialView ────────────────────────────────────────────────────────
export default function SocialView() {
  const store = useWorkoutStore()
  const [activeTab, setActiveTab] = useState('feed')
  const [search, setSearch] = useState('')

  const friends = store.friends || []
  const receivedRequests = store.friendRequests?.received || []
  const sentRequests = store.friendRequests?.sent || []

  // All other local users (for discover)
  const otherUsers = useMemo(() => getStoredUsers().filter(u => u !== store.currentUser), [store.users])

  // Friends' feed — combine their recent workouts
  const feedItems = useMemo(() => {
    return friends
      .flatMap(username => {
        const data = loadData(username)
        return (data.workouts || []).slice(0, 8).map(w => ({ ...w, username }))
      })
      .sort((a, b) => (b.endTime || b.startTime || 0) - (a.endTime || a.startTime || 0))
      .slice(0, 30)
  }, [friends, store.workouts])

  // Filtered discover list
  const discoverList = useMemo(() => {
    const q = search.toLowerCase()
    return otherUsers.filter(u => !q || u.toLowerCase().includes(q))
  }, [otherUsers, search])

  const pendingCount = receivedRequests.length

  return (
    <div className="flex flex-col min-h-screen pb-24 pt-14">
      {/* Header */}
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
          { id: 'feed', label: 'Feed' },
          { id: 'friends', label: `Friends${friends.length > 0 ? ` (${friends.length})` : ''}` },
          { id: 'discover', label: 'Discover' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold relative"
            style={{
              background: activeTab === t.id ? '#22c55e' : '#141414',
              color: activeTab === t.id ? '#000' : '#888',
            }}
          >
            {t.label}
            {t.id === 'friends' && pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs font-bold flex items-center justify-center" style={{ background: '#ef4444', color: '#fff', fontSize: 9 }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── FEED ── */}
      {activeTab === 'feed' && (
        <div className="px-4">
          {feedItems.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#141414' }}>
                <Users size={28} color="#555" />
              </div>
              <div className="text-center">
                <div className="text-white font-semibold mb-1">No workouts yet</div>
                <div className="text-sm" style={{ color: '#555' }}>
                  {friends.length === 0
                    ? 'Follow your gym friends to see their workouts here'
                    : 'Your friends haven\'t logged any workouts yet'}
                </div>
              </div>
              {friends.length === 0 && (
                <button
                  onClick={() => setActiveTab('discover')}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm"
                  style={{ background: '#22c55e22', color: '#22c55e', border: '1px solid #22c55e44' }}
                >
                  <UserPlus size={16} /> Find Friends
                </button>
              )}
            </div>
          ) : (
            feedItems.map((w, i) => (
              <FeedCard key={`${w.id}-${i}`} workout={w} username={w.username} />
            ))
          )}
        </div>
      )}

      {/* ── FRIENDS ── */}
      {activeTab === 'friends' && (
        <div className="px-4">
          {/* Pending requests */}
          {receivedRequests.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#22c55e' }}>
                Follow Requests ({receivedRequests.length})
              </div>
              {receivedRequests.map(username => (
                <FriendRequestCard
                  key={username}
                  username={username}
                  onAccept={() => store.acceptFriendRequest(username)}
                  onReject={() => store.rejectFriendRequest(username)}
                />
              ))}
            </div>
          )}

          {/* Sent requests */}
          {sentRequests.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#555' }}>Sent Requests</div>
              {sentRequests.map(username => (
                <div key={username} className="rounded-2xl px-4 py-3 flex items-center gap-3 mb-2" style={{ background: '#141414' }}>
                  <Avatar username={username} size={10} />
                  <div className="flex-1">
                    <div className="text-white font-semibold text-sm">{username}</div>
                    <div className="text-xs" style={{ color: '#555' }}>Request pending</div>
                  </div>
                  <button
                    onClick={() => store.cancelFriendRequest(username)}
                    className="text-xs px-3 py-1.5 rounded-full font-semibold"
                    style={{ background: '#2a2a2a', color: '#888' }}
                  >Cancel</button>
                </div>
              ))}
            </div>
          )}

          {/* Friends list */}
          {friends.length === 0 && receivedRequests.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#141414' }}>
                <UserPlus size={28} color="#555" />
              </div>
              <div className="text-white font-semibold">No friends yet</div>
              <div className="text-sm text-center" style={{ color: '#555' }}>
                Go to Discover to find and follow other users on this device
              </div>
              <button
                onClick={() => setActiveTab('discover')}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm"
                style={{ background: '#22c55e22', color: '#22c55e', border: '1px solid #22c55e44' }}
              >
                <UserPlus size={16} /> Find Friends
              </button>
            </div>
          ) : (
            friends.length > 0 && (
              <div>
                <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#555' }}>Your Friends</div>
                {friends.map(username => {
                  const data = loadData(username)
                  return (
                    <div key={username} className="rounded-2xl px-4 py-3 flex items-center gap-3 mb-2" style={{ background: '#141414' }}>
                      <Avatar username={username} size={10} active />
                      <div className="flex-1">
                        <div className="text-white font-semibold text-sm">{username}</div>
                        <div className="text-xs" style={{ color: '#555' }}>
                          {(data.workouts || []).length} workouts
                        </div>
                      </div>
                      <button
                        onClick={() => store.unfriend(username)}
                        className="text-xs px-3 py-1.5 rounded-full font-semibold"
                        style={{ background: '#2a2a2a', color: '#888' }}
                      >Unfollow</button>
                    </div>
                  )
                })}
              </div>
            )
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
              placeholder="Search profiles..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-500"
            />
            {search && <button onClick={() => setSearch('')} style={{ color: '#555' }}><X size={14} /></button>}
          </div>

          {discoverList.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12">
              <Users size={36} color="#555" />
              <div className="text-sm text-center" style={{ color: '#555' }}>
                {otherUsers.length === 0
                  ? 'No other profiles on this device yet.\nCreate another profile to test the social features!'
                  : 'No users found'}
              </div>
            </div>
          ) : (
            discoverList.map(username => (
              <UserSearchCard
                key={username}
                username={username}
                isFriend={friends.includes(username)}
                requestSent={sentRequests.includes(username)}
                requestReceived={receivedRequests.includes(username)}
                onSendRequest={() => store.sendFriendRequest(username)}
                onCancelRequest={() => store.cancelFriendRequest(username)}
                onAccept={() => store.acceptFriendRequest(username)}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
