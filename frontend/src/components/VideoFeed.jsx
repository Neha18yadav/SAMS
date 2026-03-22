import { useEffect, useRef } from 'react';

const VideoFeed = () => {
    const imgRef = useRef(null);

    return (
        <div className="bg-black rounded-lg overflow-hidden shadow-lg aspect-video relative">
            <img
                ref={imgRef}
                src={`${import.meta.env.VITE_API_URL}/video_feed`}
                alt="Live Camera Feed"
                className="w-full h-full object-cover"
                onError={(e) => {
                    e.target.style.display = 'none';
                    // Show placeholder or error message
                }}
            />
            <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center animate-pulse">
                <span className="w-2 h-2 bg-white rounded-full mr-2"></span>
                LIVE
            </div>
        </div>
    );
};

export default VideoFeed;
