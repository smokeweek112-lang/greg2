"use client"

import { useState, useEffect, useRef } from 'react'

interface VideoBackgroundProps {
  scrollY: number
  windowHeight: number
}

export default function VideoBackground({ scrollY, windowHeight }: VideoBackgroundProps) {
  const [isClient, setIsClient] = useState(false)
  const [canPlayVideo, setCanPlayVideo] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    setIsClient(true)
    
    // iOS detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    if (isIOS) {
      //console.log('iOS device detected')
    }
  }, [])

  useEffect(() => {
    if (videoRef.current && isClient) {
      const video = videoRef.current
      
      const handleCanPlay = () => {
        //console.log('Video can play')
        setCanPlayVideo(true)
      }
      
      const handleError = (e: Event) => {
        console.error('Video error:', e)
        setVideoError(true)
      }
      
      const handleLoadedMetadata = () => {
        //console.log('Video metadata loaded')
        // Forcing playback on iOS
        video.play().catch(err => {
          console.log('Autoplay failed:', err)
        })
      }

      video.addEventListener('canplay', handleCanPlay)
      video.addEventListener('error', handleError)
      video.addEventListener('loadedmetadata', handleLoadedMetadata)
      
      // Loading video
      video.load()

      return () => {
        video.removeEventListener('canplay', handleCanPlay)
        video.removeEventListener('error', handleError)
        video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      }
    }
  }, [isClient])

  if (!isClient) {
    return (
      <div 
        className="w-full h-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/background.jpg')"
        }}
      />
    )
  }

  if (videoError) {
    return (
      <div 
        className="w-full h-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/background.jpg')"
        }}
      />
    )
  }

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="w-full h-full object-cover"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
        onError={(e) => {
          console.error('Video loading error:', e)
          setVideoError(true)
        }}
        onLoadedData={() => {
          //console.log('Video loaded successfully')
        }}
        onCanPlay={() => {
          //console.log('Video can start playing')
          setCanPlayVideo(true)
        }}
        // CRITICAL for iOS: all these attributes
        webkit-playsinline="true"
        x-webkit-airplay="deny"
      >
        {/* IMPORTANT: iOS requires exactly this order of source tags */}
        <source
          src="/videos/background-mobile.mp4"
          type="video/mp4; codecs=avc1.42E01E,mp4a.40.2"
        />
        
        {/* Fallback */}
        <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
          <p className="text-white">Video not supported</p>
        </div>
      </video>
      
      {/* Show fallback until video is ready */}
      {!canPlayVideo && (
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/background.jpg')"
          }}
        />
      )}
    </>
  )
}