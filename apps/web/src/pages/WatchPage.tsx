import { useEffect, useRef } from 'react'
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
  const playerRef = useRef<YouTubePlayerRef | null>(null)

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

  if (!user || !video) return null

  const handleVideoEnd = () => {
    const currentIdx = videos.findIndex((v) => v.youtubeVideoId === video.youtubeVideoId)
    const nextIdx = (currentIdx + 1) % videos.length
    flushSession()
    navigate(`/watch/${videos[nextIdx].videoId}`)
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
    />
  )
}
