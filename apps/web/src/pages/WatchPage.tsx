import { useCallback, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useVideoStore } from '../shared/store/videoStore'
import { useAuthStore } from '../shared/store/authStore'
import { useChildProfileStore } from '../shared/store/childProfileStore'
import { useWatchSession, type YouTubePlayerRef } from '../features/videoPlayer/hooks/useWatchSession'
import { PlayerScreen } from '../features/videoPlayer/components/PlayerScreen'

export function WatchPage() {
  const { videoId } = useParams<{ videoId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { activeProfile } = useChildProfileStore()
  const videos = useVideoStore((s) => s.videos)
  const video = videos.find((v) => v.videoId === videoId)
  const currentTimeRef = useRef(0)
  const playerRef = useRef<YouTubePlayerRef>({ getCurrentTime: () => currentTimeRef.current })

  const { flushSession } = useWatchSession({
    videoId: video?.youtubeVideoId ?? '',
    childProfileId: activeProfile?.id ?? '',
    videoDuration: video?.durationSeconds ?? 0,
    playerRef,
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

  const handleTimeUpdate = useCallback((t: number) => { currentTimeRef.current = t }, [])

  // Flush on tab close / browser close (best-effort — no await in beforeunload)
  useEffect(() => {
    const handleUnload = () => {
      flushSession()
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => {
      window.removeEventListener('beforeunload', handleUnload)
      // Also flush when component unmounts (e.g. navigating away by any means)
      flushSession()
    }
  }, [flushSession])

  if (!user || !video) return null

  const currentIdx = videos.findIndex((v) => v.youtubeVideoId === video.youtubeVideoId)

  const handleVideoEnd = async () => {
    const nextIdx = (currentIdx + 1) % videos.length
    await flushSession()
    navigate(`/watch/${videos[nextIdx].videoId}`)
  }

  const handleNextVideo = async () => {
    const nextIdx = (currentIdx + 1) % videos.length
    await flushSession()
    navigate(`/watch/${videos[nextIdx].videoId}`)
  }

  const handlePrevVideo = async () => {
    const prevIdx = (currentIdx - 1 + videos.length) % videos.length
    await flushSession()
    navigate(`/watch/${videos[prevIdx].videoId}`)
  }

  return (
    <PlayerScreen
      key={video.videoId}
      youtubeVideoId={video.youtubeVideoId}
      videoTitle={video.title}
      videoDuration={video.durationSeconds}
      videos={videos}
      currentVideoId={video.videoId}
      playerRef={playerRef}
      flushSession={flushSession}
      onBack={() => navigate('/library')}
      onVideoEnd={handleVideoEnd}
      onNextVideo={handleNextVideo}
      onPrevVideo={handlePrevVideo}
      onTimeUpdate={handleTimeUpdate}
    />
  )
}
