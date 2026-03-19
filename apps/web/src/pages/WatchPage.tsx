import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useVideoStore } from '../shared/store/videoStore'
import { useAuthStore } from '../shared/store/authStore'
import { useChildProfileStore } from '../shared/store/childProfileStore'
import { useWatchSessionStore } from '../shared/store/watchSessionStore'
import { useWatchSession } from '../features/videoPlayer/hooks/useWatchSession'
import { PlayerScreen } from '../features/videoPlayer/components/PlayerScreen'
import { NotificationOptInSheet } from '../features/notifications/components/NotificationOptInSheet'
import { useNotifications } from '../features/notifications/hooks/useNotifications'

const PLAYER_EXPANDED_STORAGE_KEY = 'ckd_player_expanded'

export function WatchPage() {
  const { videoId } = useParams<{ videoId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { activeProfile } = useChildProfileStore()
  const videos = useVideoStore((s) => s.videos)
  const video = videos.find((v) => v.videoId === videoId)

  const { flushSession } = useWatchSession({
    videoId: video?.youtubeVideoId ?? '',
    childProfileId: activeProfile?.id ?? '',
    videoDuration: video?.durationSeconds ?? 0,
    userId: user?.uid ?? '',
  })

  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true })
      return
    }
    if (!video) {
      navigate('/library', { replace: true })
    }
  }, [user, video, navigate])

  // Wire YouTube time/duration directly into the store — no ref chain needed
  const handleTimeUpdate = useCallback((t: number) => {
    useWatchSessionStore.getState().updateCurrentYTTime(t)
  }, [])

  const handleDurationUpdate = useCallback((d: number) => {
    useWatchSessionStore.getState().updateYTDuration(d)
  }, [])

  const { notificationsEnabled, optIn } = useNotifications(user?.uid ?? '')
  const [showNotifPrompt, setShowNotifPrompt] = useState(false)
  const [playerExpanded, setPlayerExpanded] = useState(() => sessionStorage.getItem(PLAYER_EXPANDED_STORAGE_KEY) === '1')
  const nextVideoIdRef = useRef<string | null>(null)

  const persistExpandedState = useCallback((expanded: boolean) => {
    setPlayerExpanded(expanded)
    if (expanded) {
      sessionStorage.setItem(PLAYER_EXPANDED_STORAGE_KEY, '1')
      return
    }
    sessionStorage.removeItem(PLAYER_EXPANDED_STORAGE_KEY)
  }, [])

  // currentIdx is -1 when video is null — handlers guard against that
  const currentIdx = video
    ? videos.findIndex((v) => v.youtubeVideoId === video.youtubeVideoId)
    : -1

  // All handlers memoized — prevents PlayerScreen's useEffect deps from firing every render
  const handleVideoEnd = useCallback(async () => {
    if (currentIdx === -1 || videos.length === 0) return
    const nextIdx = (currentIdx + 1) % videos.length
    const nextId = videos[nextIdx].videoId
    if (!notificationsEnabled && !localStorage.getItem('ckd_notif_prompted')) {
      nextVideoIdRef.current = nextId
      await flushSession()
      setShowNotifPrompt(true)
      return
    }
    await flushSession()
    navigate(`/watch/${nextId}`)
  }, [currentIdx, videos, flushSession, navigate, notificationsEnabled])

  const handleNotifAccept = useCallback(async () => {
    localStorage.setItem('ckd_notif_prompted', '1')
    await optIn()
    setShowNotifPrompt(false)
    if (nextVideoIdRef.current) navigate(`/watch/${nextVideoIdRef.current}`)
  }, [optIn, navigate])

  const handleNotifDismiss = useCallback(() => {
    localStorage.setItem('ckd_notif_prompted', '1')
    setShowNotifPrompt(false)
    if (nextVideoIdRef.current) navigate(`/watch/${nextVideoIdRef.current}`)
  }, [navigate])

  const handleNextVideo = useCallback(async () => {
    if (currentIdx === -1 || videos.length === 0) return
    const nextIdx = (currentIdx + 1) % videos.length
    await flushSession()
    navigate(`/watch/${videos[nextIdx].videoId}`)
  }, [currentIdx, videos, flushSession, navigate])

  const handlePrevVideo = useCallback(async () => {
    if (currentIdx === -1 || videos.length === 0) return
    const prevIdx = (currentIdx - 1 + videos.length) % videos.length
    await flushSession()
    navigate(`/watch/${videos[prevIdx].videoId}`)
  }, [currentIdx, videos, flushSession, navigate])

  const handleSelectVideo = useCallback(async (selectedVideoId: string) => {
    if (!selectedVideoId || selectedVideoId === video?.videoId) return
    await flushSession()
    navigate(`/watch/${selectedVideoId}`)
  }, [flushSession, navigate, video?.videoId])

  const handleBack = useCallback(() => {
    persistExpandedState(false)
    navigate('/library')
  }, [navigate, persistExpandedState])

  // Keep a ref to latest flushSession so the unmount effect never re-fires on dep changes
  const flushSessionRef = useRef(flushSession)
  useEffect(() => { flushSessionRef.current = flushSession }, [flushSession])

  // Flush on tab close / true unmount only (empty deps = runs once)
  useEffect(() => {
    const handleUnload = () => { flushSessionRef.current() }
    window.addEventListener('beforeunload', handleUnload)
    return () => {
      window.removeEventListener('beforeunload', handleUnload)
      flushSessionRef.current()
    }
  }, [])

  if (!user || !video) return null

  return (
    <>
      <PlayerScreen
        youtubeVideoId={video.youtubeVideoId}
        videoTitle={video.title}
        videoDuration={video.durationSeconds}
        videos={videos}
        currentVideoId={video.videoId}
        initialExpanded={playerExpanded}
        flushSession={flushSession}
        onBack={handleBack}
        onVideoEnd={handleVideoEnd}
        onNextVideo={handleNextVideo}
        onPrevVideo={handlePrevVideo}
        onSelectVideo={handleSelectVideo}
        onExpandedChange={persistExpandedState}
        onTimeUpdate={handleTimeUpdate}
        onDurationUpdate={handleDurationUpdate}
      />
      <NotificationOptInSheet
        visible={showNotifPrompt}
        onAccept={handleNotifAccept}
        onDismiss={handleNotifDismiss}
      />
    </>
  )
}
